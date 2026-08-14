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
# 节目有时先发 YouTube，B 站晚几个小时甚至一整天。2026-08-02 的 EP192 就是这样，
# 当天 YouTube 已经上线，B 站一直没有投稿，只盯 B 站的扫描每十分钟报一次「无新一期」，
# 日志干净得看不出任何问题。RSS 不要 cookie、不受 B 站风控影响，同时也是一条兜底通道。
YT_CHANNEL = 'UCLELZILGdldscrt7VggJaRQ'
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
RAW = os.path.normpath(os.path.join(WEB, '..', 'bilibili', 'raw'))
YTDLP = os.path.expanduser('~/bilibili-downloader/.venv/bin/yt-dlp')
# Chrome 导出不可用时的兜底：一份长效 cookie 存在这里（Netscape 格式，同 yt-dlp --cookies 输出）
COOKIE_FALLBACK = os.path.join(HERE, '.bili-cookies.txt')
# yt-dlp 在这台机器上只解得开 Chrome 里一小部分 cookie（296/3765），SESSDATA 恰好在解不开
# 那批里，2026-08-13 因此连挂 6 次。这个脚本自己走钥匙串解密，用来现刷上面那份兜底 cookie。
COOKIE_DUMPER = os.path.join(HERE, 'dump-chrome-cookies.py')
MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,
             29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,
             22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]


class BiliError(Exception):
    """请求 B 站失败。带一句人看得懂的原因，不要抛裸 traceback 到日志里。"""


def curl_json(url, cookies, referer='https://www.bilibili.com/'):
    cmd = ['curl', '-s', '-H', f'User-Agent: {UA}', '-H', f'Referer: {referer}', url]
    if cookies:
        cmd[1:1] = ['-b', cookies]
    api = url.split('?')[0]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=60).stdout
    except subprocess.TimeoutExpired:
        raise BiliError(f'请求超时 60s: {api}')
    try:
        return json.loads(out)
    except json.JSONDecodeError:
        # 风控时 B 站回的是 HTML 而不是 JSON。裸 JSONDecodeError 在日志里看不出是什么事
        raise BiliError(f'返回不是 JSON（风控？）: {api} -> {out.strip()[:80]!r}')


def cookie_has_session(path):
    """cookie 文件里得有 bilibili 域的 SESSDATA，没有就等于没登录，别拿去问 B 站。"""
    try:
        with open(path, encoding='utf-8', errors='ignore') as f:
            for line in f:
                p = line.split('\t')
                if len(p) >= 7 and 'bilibili.com' in p[0] and p[5] == 'SESSDATA' and p[6].strip():
                    return True
    except OSError:
        pass
    return False


def export_cookies():
    """从 Chrome 现导一份 cookie。

    注意 Chrome 运行时把 cookie 变更先留在内存，过一会儿才落到磁盘的 Cookies 库，
    而 yt-dlp 读的正是磁盘那份，所以导出来的 SESSDATA 可能已经被轮换掉了。
    先删旧文件：否则 yt-dlp 失败时会静默复用上一次留在 /tmp 的过期 cookie。
    """
    dest = os.path.join(tempfile.gettempdir(), 'bili_cookies_scan.txt')
    try:
        os.remove(dest)
    except OSError:
        pass
    r = subprocess.run([YTDLP, '--cookies-from-browser', 'chrome', '--cookies', dest,
                        '--simulate', '--quiet', '--no-update',
                        'https://www.bilibili.com/video/BV1hZKh6xEnV/'],
                       capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        print(f'WARN: yt-dlp 导 cookie 失败 code={r.returncode} '
              f'{(r.stderr or "").strip()[:160]}', file=sys.stderr)
        return None
    if not (os.path.exists(dest) and cookie_has_session(dest)):
        print('WARN: 导出的 cookie 里没有 bilibili SESSDATA', file=sys.stderr)
        return None
    return dest


def refresh_fallback():
    """从 Chrome 的 cookie 库现解一份，覆盖 COOKIE_FALLBACK。成功返回 True。

    走 macOS 钥匙串拿 Chrome Safe Storage 密钥。钥匙串没解锁或没授权时会失败，
    那只是少了一条自愈通道，不该让整次扫描炸掉，所以这里吞掉所有异常。
    """
    if not os.path.exists(COOKIE_DUMPER):
        return False
    try:
        r = subprocess.run([sys.executable, COOKIE_DUMPER, COOKIE_FALLBACK],
                           capture_output=True, text=True, timeout=120)
    except (OSError, subprocess.SubprocessError) as e:
        print(f'WARN: 现解 cookie 没跑起来 {e}', file=sys.stderr)
        return False
    if r.returncode != 0:
        print(f'WARN: 现解 cookie 失败 {(r.stderr or r.stdout or "").strip()[:160]}',
              file=sys.stderr)
        return False
    return os.path.exists(COOKIE_FALLBACK) and cookie_has_session(COOKIE_FALLBACK)


def wbi_mixin(cookies):
    nav = curl_json('https://api.bilibili.com/x/web-interface/nav', cookies)
    d = nav.get('data') or {}
    w = d.get('wbi_img') or {}
    if not w.get('img_url'):
        raise BiliError(f'nav 没给 wbi_img: code={nav.get("code")} {nav.get("message")}')
    raw = w['img_url'].split('/')[-1].split('.')[0] + w['sub_url'].split('/')[-1].split('.')[0]
    return ''.join(raw[i] for i in MIXIN_TAB)[:32], d.get('isLogin')


def login_cookies(explicit=None, tries=3, gap=25):
    """拿一份 B 站认的 cookie，返回 (cookies, mixin)；拿不到返回 (None, None)。

    2026-07-29/30 连续三次扫描全栽在这里：人在 Chrome 里明明登录着，导出的却是
    已轮换的旧 SESSDATA，脚本当场判死退出，EP190 就这样漏掉了。所以一次失败不算数，
    隔 gap 秒重导给 Chrome 落盘的时间，都不行再退到手工存的长效 cookie。
    """
    for i in range(1, tries + 1):
        c = explicit or export_cookies()
        if c:
            mixin, is_login = wbi_mixin(c)
            if is_login:
                if i > 1:
                    print(f'（第 {i} 次导 cookie 才拿到有效登录态）')
                return c, mixin
            print(f'WARN: 第 {i}/{tries} 次拿到的 cookie 未登录', file=sys.stderr)
        if explicit or i == tries:
            break
        time.sleep(gap)

    if not explicit and os.path.exists(COOKIE_FALLBACK):
        mixin, is_login = wbi_mixin(COOKIE_FALLBACK)
        if is_login:
            print('（Chrome 导出不可用，改用长效 cookie）')
            return COOKIE_FALLBACK, mixin
        print(f'WARN: 长效 cookie {COOKIE_FALLBACK} 也失效了', file=sys.stderr)

    # 兜底的兜底：B 站会轮换 SESSDATA，存下来的那份迟早过期。趁人还在 Chrome 里登录着，
    # 直接从 Chrome 的 cookie 库现解一份，免得每次轮换都要人来手工补。
    if not explicit and refresh_fallback():
        mixin, is_login = wbi_mixin(COOKIE_FALLBACK)
        if is_login:
            print('（从 Chrome cookie 库现解了一份新的长效 cookie）')
            return COOKIE_FALLBACK, mixin
        print('WARN: 现解出来的 cookie 也没登录态，Chrome 里大概真的掉登录了', file=sys.stderr)
    return None, None


def wbi_sign(params, mixin):
    params = dict(params, wts=int(time.time()))
    params = {k: ''.join(c for c in str(v) if c not in "!'()*") for k, v in sorted(params.items())}
    q = urllib.parse.urlencode(params)
    return q + '&w_rid=' + hashlib.md5((q + mixin).encode()).hexdigest()


def is_draft(d):
    """这一期是不是还没整理。

    判 summary 而不是判 status：早期 53 期是手工建的，压根没有 status 字段，
    拿 status 当判据会把它们全当成新期重新整理一遍。
    """
    return d.get('status') == 'draft' or (d.get('summary') or '').strip() in ('', '待整理')


def local_eps():
    """已经整理好的期号。草稿不算。

    备料那步会先落一个 summary='待整理' 的骨架再交给整理者。以前这里只看文件名，
    于是整理一卡死，下次扫描就把草稿当"已收录"，这一期永久冻在待整理状态，
    网站上挂着空壳还没人知道 —— 比直接漏掉更难发现。所以草稿要能被重新拾起。
    """
    eps, drafts = set(), []
    base = os.path.join(WEB, 'content', 'episodes')
    for f in os.listdir(base):
        m = re.match(r'(EP\d+)\.json$', f)
        if not m:
            continue
        try:
            with open(os.path.join(base, f), encoding='utf-8') as fh:
                d = json.load(fh) or {}
        except (OSError, json.JSONDecodeError):
            d = {}          # 读不出来的按草稿处理，宁可多扫一遍也别静默漏掉
        if is_draft(d):
            drafts.append(m.group(1))
        else:
            eps.add(m.group(1))
    if drafts:
        print(f'注意：{len(drafts)} 期还停在草稿，本次会重新整理: {", ".join(sorted(drafts))}')
    return eps


def youtube_eps():
    """抓 YouTube 频道 RSS，返回 {EPxxx: {...}}。拿不到就返回空，不让它拖垮整次扫描。"""
    url = f'https://www.youtube.com/feeds/videos.xml?channel_id={YT_CHANNEL}'
    try:
        r = subprocess.run(['curl', '-s', '--max-time', '30', '-H', f'User-Agent: {UA}', url],
                           capture_output=True, text=True, timeout=45)
    except subprocess.TimeoutExpired:
        print('WARN: YouTube RSS 超时，本次只按 B 站判断', file=sys.stderr)
        return {}
    out = {}
    for block in re.findall(r'<entry>(.*?)</entry>', r.stdout, re.S):
        title = re.search(r'<title>(.*?)</title>', block, re.S)
        vid = re.search(r'<yt:videoId>(.*?)</yt:videoId>', block)
        pub = re.search(r'<published>(.*?)</published>', block)
        if not (title and vid):
            continue
        ep = ep_from_title(title.group(1))
        if ep:
            out[ep] = {'bvid': None, 'title': title.group(1).strip(),
                       'youtube_id': vid.group(1),
                       'published': pub.group(1) if pub else None}
    if not out:
        print('WARN: YouTube RSS 没解析出任何 EP 号', file=sys.stderr)
    return out


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

    cookies, mixin = login_cookies(args.cookies)
    if not cookies:
        print('ERROR: 拿不到有效的 B 站登录态（重试过 3 次，长效 cookie 也没救回来）。'
              '去 Chrome 打开一次 bilibili.com 刷新登录态，'
              f'或把长效 cookie 存到 {COOKIE_FALLBACK}', file=sys.stderr)
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

    # YouTube 那条线单独扫一次再并进来。B 站有的以 B 站为准，只在 YouTube 上的补进来，
    # 否则先发 YouTube 的那几期会一直报「无新一期」（2026-08-02 EP192 的教训）
    yt = youtube_eps()
    for ep, info in yt.items():
        videos.setdefault(ep, info)

    new_eps = sorted(e for e in videos if e not in have)
    if not new_eps:
        newest = max(videos) if videos else '?'
        print(f'无新一期。本地 {len(have)} 期，两个平台最新都是 {newest}，已收录。')
        return 10

    print(f'发现 {len(new_eps)} 个新一期: {", ".join(new_eps)}')
    if args.dry_run:
        for ep in new_eps:
            v = videos[ep]
            src = v['bvid'] if v.get('bvid') else f'YouTube {v.get("youtube_id")}（B 站还没发）'
            print(f'  {ep} | {src} | {v["title"][:44]}')
        return 0

    pending = []
    for ep in new_eps:
        v = videos[ep]
        bvid = v.get('bvid')
        if not bvid:
            # 只在 YouTube 上。B 站字幕接口用不上，转写和整理交给对话里的整理者，
            # 这里只负责把它报出来，别让它继续隐身
            yid = v.get('youtube_id')
            pending.append({
                'ep': ep, 'bvid': None, 'title': v['title'], 'main_title': v['title'],
                'member': False, 'pubdate_iso': v.get('published'),
                'subtitle_ok': False, 'draft_ok': False,
                'source': 'youtube',
                'youtube_url': f'https://www.youtube.com/watch?v={yid}',
                'subtitle_err': ['B 站尚无投稿，需从 YouTube 取字幕'],
            })
            print(f'  {ep} | 只在 YouTube 上，B 站还没发 | https://www.youtube.com/watch?v={yid}')
            continue
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
    try:
        sys.exit(main())
    except BiliError as e:
        print(f'ERROR: {e}', file=sys.stderr)
        sys.exit(1)
