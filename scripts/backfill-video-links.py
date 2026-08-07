#!/usr/bin/env python3
"""给已收录的期回补另一个平台的视频链接（机械活，无人值守可跑）。

为什么需要这个脚本
------------------
节目两个平台不同时发。EP195 的 B 站版 2026-08-06 11:03 被收录，YouTube 版 11:31
才上线，差 28 分钟。`scan-new-episodes.py` 判的是「EP 号在不在本地」，EP195 已经在，
此后每次扫描都报「无新一期」，那条 YouTube 链接再没人补。日志、status.json、线上
数据三处都显示正常，因为它们回答的是「有没有新的一期」，而不是「已有的一期全不全」。

同类事故第三次：EP189（06711e5）、EP194（405c336）、EP195（bd79be0），前两次都是
人工发现后手动补的，根因一直没修。这个脚本就是那层缺失的判断。

为什么不直接用 sync-video-links.mjs
-----------------------------------
它确实能补上（2026-08-07 实测能正确匹配到 EP195 的 alDjwAhrM8g），但它的职责是
「按本地 bilibili/raw/subtitle_inventory.json 重写全部 195 期的链接」，而那份
inventory 会过期。同一次实测里，16 期的有效 B 站链接被它抹成「已下架」，连 8-03
刚发的 EP193 都中招。这种行为不能进无人值守的流程。

安全边界（这个脚本与 sync-video-links.mjs 的根本区别）
--------------------------------------------------
**只增不改。** 本地该平台已经有 url 就跳过，永远不覆盖、不删除、不写 unavailable。
本地的占位条目（有 platform 没 url，例如 `status: unavailable`）才会被真链接替换。
最坏情况是漏补一期，不会破坏任何已有数据。

草稿期跳过：那是整理流程的地盘，链接由整理者按 sop/05b 写。

B 站那条线失败（cookie 过期、风控）不阻断 YouTube 那条线。RSS 不要 cookie 也不受
风控影响，是设计上的兜底通道，不该被 B 站的故障拖下水。

用法
----
  python3 scripts/backfill-video-links.py             # 补，改文件
  python3 scripts/backfill-video-links.py --dry-run   # 只报告要补什么，不写

退出码: 0=补了链接（调用方需要 build + 上线）/ 10=没有要补的 / 1=出错
"""
import argparse
import importlib.util
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
EPISODES = os.path.join(WEB, 'content', 'episodes')

# 平台在 videoLinks 里的约定顺序（sop/05b）
PLATFORM_ORDER = ('bilibili', 'youtube')


def load_scanner():
    """按路径加载 scan-new-episodes.py。

    文件名带连字符，正常 import 不了。复用它而不是重写一遍：cookie 轮换重试、
    wbi 签名、风控识别、RSS 解析这些都是踩出来的（见 sop/07 的事故记录），
    在这里复制一份等于把同样的坑再埋一次。
    """
    path = os.path.join(HERE, 'scan-new-episodes.py')
    spec = importlib.util.spec_from_file_location('scan_new_episodes', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)   # 顶层只有定义，main() 被 __main__ 守卫挡着
    return mod


def bilibili_eps(S, explicit_cookies=None):
    """抓 B 站 UP 投稿列表，返回 {EPxxx: bvid}。拿不到就返回空 dict。

    返回空不是错误。B 站要 cookie，cookie 会过期（sop/07 关键约束 2），
    而 YouTube 那条线完全不依赖它。让 B 站的故障中断整个补全是因小失大。
    """
    try:
        cookies, mixin = S.login_cookies(explicit_cookies)
    except S.BiliError as e:
        print(f'WARN: B 站登录态拿不到（{e}），本次只补 YouTube', file=sys.stderr)
        return {}, None
    if not cookies:
        print('WARN: B 站登录态无效，本次只补 YouTube', file=sys.stderr)
        return {}, None

    try:
        d = S.curl_json(
            'https://api.bilibili.com/x/space/wbi/arc/search?' +
            S.wbi_sign({'mid': S.UP_MID, 'ps': 25, 'pn': 1, 'order': 'pubdate',
                        'platform': 'web', 'web_location': 1550101}, mixin),
            cookies, referer=f'https://space.bilibili.com/{S.UP_MID}')
    except S.BiliError as e:
        print(f'WARN: 抓 B 站投稿列表失败（{e}），本次只补 YouTube', file=sys.stderr)
        return {}, None
    if d.get('code') != 0:
        print(f'WARN: 投稿列表 code={d.get("code")} {d.get("message")}（风控？），'
              f'本次只补 YouTube', file=sys.stderr)
        return {}, None

    out = {}
    for v in (((d.get('data') or {}).get('list') or {}).get('vlist') or []):
        ep = S.ep_from_title(v.get('title', ''))
        if ep and v.get('bvid'):
            out.setdefault(ep, v['bvid'])
    return out, cookies


def is_member(S, bvid, cookies):
    """会员（充电专属）视频必须标出来。

    漏标的后果是会员链接以普通视频的样子发布出去，点进去是付费墙
    （e9775e6 修过一次）。判不出来时返回 None，调用方据此跳过这一期——
    宁可不补，也不能补一条没标会员的会员链接。
    """
    try:
        view = S.curl_json(f'https://api.bilibili.com/x/web-interface/view?bvid={bvid}', cookies)
    except S.BiliError as e:
        print(f'WARN: {bvid} 取详情失败（{e}），跳过这期的 B 站链接', file=sys.stderr)
        return None
    if view.get('code') != 0:
        print(f'WARN: {bvid} 详情 code={view.get("code")}，跳过这期的 B 站链接', file=sys.stderr)
        return None
    return bool((view.get('data') or {}).get('is_upower_exclusive'))


def usable_platforms(data):
    """本地已经有真链接的平台。占位条目（没 url）不算数。"""
    return {link['platform'] for link in (data.get('videoLinks') or [])
            if isinstance(link, dict) and link.get('platform') and link.get('url')}


def merge_links(existing, added):
    """把新链接并进去：占位条目原地替换，本地没有的按约定顺序插入。

    有 url 的条目一律原样保留，这是这个脚本的安全底线。
    """
    pending = {link['platform']: link for link in added}
    out = []
    for link in existing or []:
        p = link.get('platform') if isinstance(link, dict) else None
        if p in pending and not link.get('url'):
            out.append(pending.pop(p))    # 占位（已下架/未找到）→ 换成真链接
        else:
            out.append(link)
    for p in PLATFORM_ORDER:
        if p in pending:
            if p == 'bilibili':
                out.insert(0, pending.pop(p))   # B 站按约定排在前面
            else:
                out.append(pending.pop(p))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true',
                    help='只报告要补什么，不写文件')
    ap.add_argument('--cookies', help='指定 B 站 cookie 文件（默认从 Chrome 现导）')
    args = ap.parse_args()

    S = load_scanner()

    # YouTube 先拿：不要 cookie，最不容易失败
    yt = S.youtube_eps()
    bili, cookies = bilibili_eps(S, args.cookies)
    if not yt and not bili:
        print('ERROR: 两个平台都没抓到数据，无法判断缺什么', file=sys.stderr)
        return 1

    have = S.local_eps()      # 已整理完成的期号，草稿不在内
    if not have:
        print('ERROR: 本地一期都没读到', file=sys.stderr)
        return 1

    changed = []
    for ep in sorted(have & (set(yt) | set(bili))):
        path = os.path.join(EPISODES, f'{ep}.json')
        try:
            with open(path, encoding='utf-8') as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            print(f'WARN: {ep} 读不出来（{e}），跳过', file=sys.stderr)
            continue

        present = usable_platforms(data)
        added = []

        if 'youtube' not in present and ep in yt:
            added.append({'platform': 'youtube',
                          'url': f'https://www.youtube.com/watch?v={yt[ep]["youtube_id"]}'})

        if 'bilibili' not in present and ep in bili:
            member = is_member(S, bili[ep], cookies)
            if member is None:
                pass          # 判不出会员就不补，理由见 is_member
            else:
                link = {'platform': 'bilibili',
                        'url': f'https://www.bilibili.com/video/{bili[ep]}/'}
                if member:
                    link['access'] = 'member'
                added.append(link)
            time.sleep(2)     # 详情接口连着打会触发风控

        if not added:
            continue

        data['videoLinks'] = merge_links(data.get('videoLinks'), added)
        for link in added:
            mark = '（会员）' if link.get('access') == 'member' else ''
            print(f'  {ep} 补 {link["platform"]}{mark}: {link["url"]}')
        changed.append(ep)

        if not args.dry_run:
            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.write('\n')

    if not changed:
        print(f'链接都齐了。已收录 {len(have)} 期，'
              f'两个平台各扫到 {len(yt)} / {len(bili)} 期。')
        return 10

    verb = '需要补' if args.dry_run else '已补'
    print(f'{verb} {len(changed)} 期的链接: {", ".join(changed)}')
    if not args.dry_run:
        print('下一步：npm run build + commit + npm run ship')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(1)
