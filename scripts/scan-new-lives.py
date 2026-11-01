#!/usr/bin/env python3
"""颖响力直播回放——发现新场次并备料（机械部分，cron 可无人跑）。

跟 scan-new-episodes.py 是两条独立的线。节目走 UP 主投稿列表按 EP 号比对，
直播走「颖漫谈（直播回放）」合集接口按 bvid 比对，因为直播标题里没有编号。

做什么（全自动，不需要 LLM）：
  1. 拉合集 6621799 的全部投稿
  2. 跟 content/lives/*.json 里已收录的 bvid 比对，找出新增
  3. 同一场被切成两段上传的（标题相同、发布时间相差两小时内）合并成一条待办
  4. 查是否充电专属、下 AI 字幕、去时间轴生成转写稿
  5. 待办写入 workbench/pending-lives.json

不做什么（需要 LLM，留给整理者）：
  逐句通读转写稿、写 mainThread/segments/audienceThreads/boundaries、挑句内链接、
  build 和 push。SOP 明确要求主线程逐句读，不派 subagent 代读。

用法:
  python3 scripts/scan-new-lives.py              # 扫描 + 下字幕 + 生成转写稿
  python3 scripts/scan-new-lives.py --dry-run    # 只报告有没有新场次

退出码: 0=有新场次已备料 / 10=无新场次 / 1=出错
"""
import argparse, json, os, re, subprocess, sys

UP_MID = 91741174
SEASON_ID = 6621799          # 合集·颖漫谈（直播回放）
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
LIVES = os.path.join(WEB, 'content', 'lives')
WORKBENCH = os.path.join(WEB, 'workbench')
SRT_DIR = os.path.normpath(os.path.join(WEB, 'bilibili', 'live'))
YTDLP = os.path.expanduser('~/bilibili-downloader/.venv/bin/yt-dlp')
# 同一场被切成两段：标题相同且发布时间相差不超过这个秒数
MERGE_WINDOW = 2 * 3600


COOKIE_FILE = os.path.join(HERE, '.bili-cookies.txt')


def http_json(url, referer=None):
    # 走 curl 而不是 urllib：跟 scan-new-episodes.py 保持一致，
    # 也绕开 launchd 环境下 python 找不到根证书的问题
    cmd = ['curl', '-s', '-H', f'User-Agent: {UA}',
           '-H', f"Referer: {referer or f'https://space.bilibili.com/{UP_MID}'}"]
    # view 接口不带登录态会被 412 挡下，返回 HTML 让 json.loads 崩掉。
    # 长效 cookie 由 scan-new-episodes.py 维护，存在就带上。
    if os.path.exists(COOKIE_FILE):
        cmd += ['-b', COOKIE_FILE]
    cmd.append(url)
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=25).stdout
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        raise RuntimeError(f'接口返回的不是 JSON（多半被风控挡了）: {url}\n{out[:200]}')


def fetch_season():
    """拉合集全部投稿，按发布时间倒序。"""
    url = (f'https://api.bilibili.com/x/polymer/web-space/seasons_archives_list'
           f'?mid={UP_MID}&season_id={SEASON_ID}&sort_reverse=false'
           f'&page_num=1&page_size=100')
    data = http_json(url)
    if data.get('code') != 0:
        raise RuntimeError(f"合集接口返回 code={data.get('code')} {data.get('message')}")
    return data['data']['archives']


def fetch_recent_uploads_not_in_season(archives):
    """投稿列表里标题带「直播回放」、还没进合集的新回放。

    2026-11-01 查出来的漏洞：10-31 21点场回放 17:20 UTC 就上传了，UP 主没及时
    放进合集，只看合集的扫描两次都报「无新场次」。所以合集之外再看投稿列表第一页，
    只收比合集里最新一条更晚的，免得把从没进合集的老回放翻出来。
    投稿列表要 wbi 签名和登录态，借 scan-new-episodes.py 现成的函数。
    """
    import importlib.util
    spec = importlib.util.spec_from_file_location(
        'scan_eps', os.path.join(HERE, 'scan-new-episodes.py'))
    S = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(S)
    cookies, mixin = S.login_cookies()
    if not cookies:
        raise RuntimeError('拿不到 B 站登录态')
    d = S.curl_json('https://api.bilibili.com/x/space/wbi/arc/search?' +
                    S.wbi_sign({'mid': UP_MID, 'ps': 25, 'pn': 1, 'order': 'pubdate',
                                'platform': 'web', 'web_location': 1550101}, mixin),
                    cookies, referer=f'https://space.bilibili.com/{UP_MID}')
    if d.get('code') != 0:
        raise RuntimeError(f"投稿列表 code={d.get('code')} {d.get('message')}")
    return pick_unseasoned((((d.get('data') or {}).get('list') or {}).get('vlist') or []), archives)


def pick_unseasoned(vlist, archives):
    """从投稿列表里挑出不在合集、又比合集最新一条更晚的直播回放。单独拆出来方便测试。"""
    in_season = {a['bvid'] for a in archives}
    newest = max((a['pubdate'] for a in archives), default=0)
    out = []
    for v in vlist:
        if '直播回放' not in v.get('title', '') or v['bvid'] in in_season:
            continue
        if v.get('created', 0) <= newest:
            continue
        secs = sum(int(x) * 60 ** i for i, x in enumerate(reversed(str(v.get('length') or '0').split(':'))))
        out.append({'bvid': v['bvid'], 'title': v['title'],
                    'pubdate': v['created'], 'duration': secs})
    return out


def known_bvids():
    """已收录的 bvid。一期可能挂两条链接（合并场），全部收进来。"""
    out = set()
    for name in os.listdir(LIVES):
        if not name.startswith('LIVE') or not name.endswith('.json'):
            continue
        d = json.load(open(os.path.join(LIVES, name), encoding='utf-8'))
        for link in d.get('videoLinks') or []:
            m = re.search(r'(BV[0-9A-Za-z]+)', str(link.get('url') or ''))
            if m:
                out.add(m.group(1))
    return out


def next_live_number():
    nums = [int(m.group(1)) for name in os.listdir(LIVES)
            for m in [re.match(r'LIVE(\d+)\.json$', name)] if m]
    return (max(nums) + 1) if nums else 1


def group_segments(archives):
    """同一场切成两段的合并成一组，按播出顺序（发布时间正序）排。"""
    groups = []
    for a in sorted(archives, key=lambda x: x['pubdate']):
        title = re.sub(r'\s*\d{4}年\d{2}月\d{2}日\s*\d+点场\s*$', '', a['title']).strip()
        placed = False
        for g in groups:
            if g['title'] == title and abs(a['pubdate'] - g['items'][-1]['pubdate']) <= MERGE_WINDOW:
                g['items'].append(a)
                placed = True
                break
        if not placed:
            groups.append({'title': title, 'items': [a]})
    return groups


def is_member_only(bvid):
    d = http_json(f'https://api.bilibili.com/x/web-interface/view?bvid={bvid}')
    return bool(d.get('data', {}).get('is_upower_exclusive')) if d.get('code') == 0 else None


def srt_to_transcript(paths, out_path):
    """去时间轴、去重复行，多段按顺序接起来并插入分隔标记。"""
    lines = []
    for i, p in enumerate(paths):
        if i:
            lines += ['', f'【以下为第 {i + 1} 段，同场续播】', '']
        prev = None
        for raw in open(p, encoding='utf-8'):
            t = raw.strip()
            if not t or t.isdigit() or '-->' in t:
                continue
            if t != prev:
                lines.append(t)
                prev = t
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    return len(lines), sum(len(x) for x in lines)


def download_subs(bvid, workdir):
    os.makedirs(workdir, exist_ok=True)
    # yt-dlp 现导在这台机器上解不出 SESSDATA（2026-08-13），
    # scan-new-episodes.py 维护的那份长效 cookie 有就直接喂给它。
    fallback = os.path.join(HERE, '.bili-cookies.txt')
    auth = (['--cookies', fallback] if os.path.exists(fallback)
            else ['--cookies-from-browser', 'chrome'])
    cmd = [YTDLP] + auth + ['--write-subs',
           '--sub-langs', 'ai-zh', '--skip-download', '--no-update',
           '-o', '%(id)s.%(ext)s', f'https://www.bilibili.com/video/{bvid}/']
    subprocess.run(cmd, cwd=workdir, capture_output=True, text=True, timeout=300)
    got = os.path.join(workdir, f'{bvid}.ai-zh.srt')
    return got if os.path.exists(got) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    try:
        archives = fetch_season()
    except Exception as e:
        print(f'ERROR: 拉合集失败 {e}', file=sys.stderr)
        return 1

    # 合集之外再兜一次投稿列表。这一步失败不拖垮整次扫描，合集那条照常走。
    extra = []
    try:
        extra = fetch_recent_uploads_not_in_season(archives)
    except Exception as e:
        print(f'WARN: 投稿列表兜底没跑成（{e}），只按合集判断', file=sys.stderr)
    for a in extra:
        print(f"  投稿列表里有还没进合集的回放：{a['bvid']} {a['title'][:40]}")

    known = known_bvids()
    fresh = [a for a in archives + extra if a['bvid'] not in known]
    if not fresh:
        print(f'无新场次（合集 {len(archives)} 个，合集外新回放 {len(extra)} 个，已收录 {len(known)} 个 bvid）')
        return 10

    groups = group_segments(fresh)
    print(f'发现 {len(fresh)} 个新投稿，合并后 {len(groups)} 场：')
    for g in groups:
        seg = ' + '.join(f"{a['bvid']}({a['duration'] // 60}分)" for a in g['items'])
        print(f"  {g['title'][:40]} | {seg}")

    if args.dry_run:
        return 0

    pending, live_no = [], next_live_number()
    for g in groups:
        lid = f'LIVE{live_no:03d}'
        workdir = os.path.join(WORKBENCH, lid)
        srts = []
        for a in g['items']:
            p = download_subs(a['bvid'], workdir)
            if p:
                srts.append(p)
                os.makedirs(SRT_DIR, exist_ok=True)
                label = re.search(r'(\d+点场)', a['title'])
                tag = label.group(1) if label else a['bvid']
                dst = os.path.join(SRT_DIR, f"【{lid}】{g['title'][:24]} {tag}.srt")
                subprocess.run(['cp', p, dst], check=False)
        entry = {
            'id': lid,
            'title': g['title'],
            'bvids': [a['bvid'] for a in g['items']],
            'publishedAt': min(a['pubdate'] for a in g['items']),
            'durationMinutes': sum(a['duration'] for a in g['items']) // 60,
            'memberOnly': [is_member_only(a['bvid']) for a in g['items']],
            'sessionLabels': [a['title'] for a in g['items']],
            'transcript': None,
            'merged': len(g['items']) > 1,
        }
        if srts:
            out = os.path.join(workdir, f'{lid}.transcript.txt')
            n, chars = srt_to_transcript(srts, out)
            entry['transcript'] = os.path.relpath(out, WEB)
            entry['transcriptLines'] = n
            entry['transcriptChars'] = chars
            print(f'  {lid} 转写稿 {n} 行 {chars} 字 -> {entry["transcript"]}')
        else:
            print(f'  {lid} 没取到 AI 字幕轨，需要本地转写')
        pending.append(entry)
        live_no += 1

    os.makedirs(WORKBENCH, exist_ok=True)
    with open(os.path.join(WORKBENCH, 'pending-lives.json'), 'w', encoding='utf-8') as f:
        json.dump(pending, f, ensure_ascii=False, indent=2)
    print(f'待办已写入 workbench/pending-lives.json（{len(pending)} 场）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
