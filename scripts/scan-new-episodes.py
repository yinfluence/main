#!/usr/bin/env python3
"""颖响力每日自动化——发现新一期并备料（机械部分，cron 可无人跑）。

做什么（全自动，不需要 LLM）：
  1. 抓 B 站 UP 主（颖响力 mid=91741174）最新投稿列表
  2. 从标题提取 EP 号，对比本地 content/episodes/ 已有期号
  3. 对每个新增期：判断会员/非会员、取发布时间、下载 AI 字幕存 raw、npm run srt 生成草稿
  4. 把待整理清单写入 workbench/pending-episodes.json，并打印摘要

不做什么（需要 LLM，留给对话中的整理者）：
  写 summary/topic/viewpoints、抽概念模型、判断影射写边界、建关键词词条、双向回填、build+push。

用法:
  python3 scripts/scan-new-episodes.py                 # 扫描+备料
  python3 scripts/scan-new-episodes.py --dry-run        # 只报告有没有新期，不下字幕不生成草稿
  python3 scripts/scan-new-episodes.py --cookies FILE   # 指定 cookie 文件（默认从 Chrome 现导）

退出码: 0=有新期已备料 / 10=无新期 / 1=出错（cookie 过期、风控等）
"""
import argparse, hashlib, json, os, re, subprocess, sys, tempfile, time, urllib.parse

UP_MID = 91741174
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
RAW = os.path.normpath(os.path.join(WEB, '..', 'bilibili', 'raw'))
YTDLP = os.path.expanduser('~/bilibili-downloader/.venv/bin/yt-dlp')
MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,
             29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,
             22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]


def curl_json(url, cookies, referer='https://www.bilibili.com/'):
    cmd = ['curl', '-s', '-H', f'User-Agent: {UA}', '-H', f'Referer: {referer}', url]
    if cookies:
        cmd[1:1] = ['-b', cookies]
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=60).stdout
    return json.loads(out)


def export_cookies():
    dest = os.path.join(tempfile.gettempdir(), 'bili_cookies_scan.txt')
    subprocess.run([YTDLP, '--cookies-from-browser', 'chrome', '--cookies', dest,
                    '--simulate', '--quiet', '--no-update',
                    'https://www.bilibili.com/video/BV1hZKh6xEnV/'],
                   capture_output=True, text=True, timeout=120)
    return dest if os.path.exists(dest) else None


def wbi_mixin(cookies):
    nav = curl_json('https://api.bilibili.com/x/web-interface/nav', cookies)
    w = nav['data']['wbi_img']
    raw = w['img_url'].split('/')[-1].split('.')[0] + w['sub_url'].split('/')[-1].split('.')[0]
    return ''.join(raw[i] for i in MIXIN_TAB)[:32], nav['data'].get('isLogin')


def wbi_sign(params, mixin):
    params = dict(params, wts=int(time.time()))
    params = {k: ''.join(c for c in str(v) if c not in "!'()*") for k, v in sorted(params.items())}
    q = urllib.parse.urlencode(params)
    return q + '&w_rid=' + hashlib.md5((q + mixin).encode()).hexdigest()


def local_eps():
    eps = set()
    for f in os.listdir(os.path.join(WEB, 'content', 'episodes')):
        m = re.match(r'(EP\d+)\.json$', f)
        if m:
            eps.add(m.group(1))
    return eps


def ep_from_title(title):
    m = re.search(r'[【\[]\s*(?:EP|PE)\s*(\d+)\s*[】\]]', title, re.I)
    if not m:
        m = re.search(r'(?:EP|PE)\s*(\d+)', title, re.I)
    return f'EP{int(m.group(1)):03d}' if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--cookies')
    ap.add_argument('--pages', type=int, default=1, help='抓 UP 投稿前 N 页（默认 1，每页 25）')
    args = ap.parse_args()

    cookies = args.cookies or export_cookies()
    if not cookies:
        print('ERROR: cookie 导出失败（Chrome 未登录 B 站？）', file=sys.stderr)
        return 1
    mixin, is_login = wbi_mixin(cookies)
    if not is_login:
        print('ERROR: B 站未登录，cookie 可能过期', file=sys.stderr)
        return 1

    have = local_eps()
    # 抓 UP 投稿列表
    videos = {}
    for pn in range(1, args.pages + 1):
        d = curl_json('https://api.bilibili.com/x/space/wbi/arc/search?' +
                      wbi_sign({'mid': UP_MID, 'ps': 25, 'pn': pn, 'order': 'pubdate',
                                'platform': 'web', 'web_location': 1550101}, mixin),
                      cookies, referer=f'https://space.bilibili.com/{UP_MID}')
        if d.get('code') != 0:
            print(f'ERROR: 投稿列表 code={d.get("code")} {d.get("message")}（可能风控）', file=sys.stderr)
            return 1
        for v in (((d.get('data') or {}).get('list') or {}).get('vlist') or []):
            ep = ep_from_title(v.get('title', ''))
            if ep:
                videos.setdefault(ep, v)
        time.sleep(2)

    new_eps = sorted(e for e in videos if e not in have)
    if not new_eps:
        print(f'无新一期。本地 {len(have)} 期，UP 投稿最新 {max(videos) if videos else "?"} 已收录。')
        return 10

    print(f'发现 {len(new_eps)} 个新一期: {", ".join(new_eps)}')
    if args.dry_run:
        for ep in new_eps:
            v = videos[ep]
            print(f'  {ep} | {v["bvid"]} | {v["title"][:44]}')
        return 0

    pending = []
    for ep in new_eps:
        v = videos[ep]
        bvid = v['bvid']
        # 会员判断 + 发布时间
        view = curl_json(f'https://api.bilibili.com/x/web-interface/view?bvid={bvid}', cookies)
        vd = view.get('data') or {}
        member = bool(vd.get('is_upower_exclusive'))
        pubdate = vd.get('pubdate')
        title = vd.get('title', v['title'])
        # 清洗标题：取 ｜ 前主标题、去 【EPxxx】
        main_title = re.split(r'[｜|]', title)[0]
        main_title = re.sub(r'[【\[]\s*(?:EP|PE)\s*\d+\s*[】\]]', '', main_title).strip()
        srt_path = os.path.join(RAW, f'[{ep}】 {main_title.replace("/", "／")}.srt')
        # 下字幕
        r = subprocess.run(['python3', os.path.join(HERE, 'fetch-ai-subtitle.py'),
                            bvid, '-o', srt_path, '--cookies', cookies],
                           capture_output=True, text=True, timeout=120)
        got = os.path.exists(srt_path) and os.path.getsize(srt_path) > 1000
        # 生成草稿
        draft_ok = False
        if got:
            ing = subprocess.run(['npm', 'run', 'srt', '--', srt_path],
                                 capture_output=True, text=True, cwd=WEB, timeout=180)
            draft_ok = os.path.exists(os.path.join(WEB, 'content', 'episodes', f'{ep}.json'))
        pending.append({
            'ep': ep, 'bvid': bvid, 'title': title, 'main_title': main_title,
            'member': member, 'pubdate_iso': (time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime(pubdate)) if pubdate else None),
            'subtitle_ok': got, 'draft_ok': draft_ok,
            'bilibili_url': f'https://www.bilibili.com/video/{bvid}/',
            'subtitle_err': None if got else (r.stdout + r.stderr).strip().splitlines()[-1:],
        })
        print(f'  {ep} | 会员={member} | 字幕={"OK" if got else "失败"} | 草稿={"OK" if draft_ok else "无"}')
        time.sleep(5)

    # 写待整理清单
    os.makedirs(os.path.join(WEB, 'workbench'), exist_ok=True)
    with open(os.path.join(WEB, 'workbench', 'pending-episodes.json'), 'w') as f:
        json.dump(pending, f, ensure_ascii=False, indent=2)
    print(f'\n待整理清单已写入 workbench/pending-episodes.json（{len(pending)} 期）')
    print('下一步：在对话里让整理者按 SOP 精修这些草稿并发布。')
    fails = [p['ep'] for p in pending if not p['subtitle_ok']]
    if fails:
        print(f'⚠️ 字幕获取失败: {", ".join(fails)}（检查颖响力充电是否过期）', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
