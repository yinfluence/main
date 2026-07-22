#!/usr/bin/env python3
"""B 站 AI 字幕自助获取（颖响力网页自动化基建）。

用法:
  python3 scripts/fetch-ai-subtitle.py BV1hZKh6xEnV            # 打印字幕信息并输出 SRT 到当前目录
  python3 scripts/fetch-ai-subtitle.py BV1hZKh6xEnV -o out.srt # 指定输出文件
  python3 scripts/fetch-ai-subtitle.py BV1hZKh6xEnV --cookies /path/bili_cookies.txt

链路: view API 拿 cid/标题 -> nav API 拿 wbi key -> wbi 签名调 player/wbi/v2 拿 subtitle_url
      -> 下载 ai-zh JSON -> 转标准 SRT。
cookie: Netscape 格式文件；默认尝试用 yt-dlp 从 Chrome 现导（依赖 B 站登录态）。
已知限制: 充电专属(会员)视频 API 不返回字幕轨（2026-07-22 验证），脚本会明确报告。
"""
import argparse, hashlib, json, os, subprocess, sys, tempfile, time, urllib.parse

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
YTDLP = os.path.expanduser('~/bilibili-downloader/.venv/bin/yt-dlp')
MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,
             29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,
             22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]


def http_get_json(url, cookies, referer='https://www.bilibili.com/'):
    cmd = ['curl', '-s', '-H', f'User-Agent: {UA}', '-H', f'Referer: {referer}', url]
    if cookies:
        cmd[1:1] = ['-b', cookies]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    return json.loads(r.stdout)


def export_cookies(dest):
    subprocess.run([YTDLP, '--cookies-from-browser', 'chrome', '--cookies', dest,
                    '--simulate', '--quiet', '--no-update',
                    'https://www.bilibili.com/video/BV1hZKh6xEnV/'],
                   capture_output=True, text=True, timeout=120)
    return dest if os.path.exists(dest) else None


def wbi_query(params, cookies):
    nav = http_get_json('https://api.bilibili.com/x/web-interface/nav', cookies)
    wbi = nav['data']['wbi_img']
    raw = (wbi['img_url'].split('/')[-1].split('.')[0]
           + wbi['sub_url'].split('/')[-1].split('.')[0])
    mixin = ''.join(raw[i] for i in MIXIN_TAB)[:32]
    params = dict(params, wts=int(time.time()))
    params = {k: ''.join(c for c in str(v) if c not in "!'()*")
              for k, v in sorted(params.items())}
    query = urllib.parse.urlencode(params)
    return query + '&w_rid=' + hashlib.md5((query + mixin).encode()).hexdigest()


def to_srt(body):
    def ts(sec):
        h = int(sec // 3600); m = int(sec % 3600 // 60)
        s = int(sec % 60); ms = int((sec - int(sec)) * 1000)
        return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
    return '\n'.join(f"{i}\n{ts(b['from'])} --> {ts(b['to'])}\n{b['content']}\n"
                     for i, b in enumerate(body, 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('bvid')
    ap.add_argument('-o', '--output', help='输出 SRT 路径（默认 <bvid>.ai-zh.srt）')
    ap.add_argument('--cookies', help='Netscape cookie 文件（默认从 Chrome 现导）')
    args = ap.parse_args()

    cookies = args.cookies
    tmp = None
    if not cookies:
        tmp = os.path.join(tempfile.gettempdir(), 'bili_cookies_auto.txt')
        cookies = export_cookies(tmp)
        if not cookies:
            print('WARN: cookie 导出失败，尝试无登录态请求', file=sys.stderr)

    view = http_get_json(
        f'https://api.bilibili.com/x/web-interface/view?bvid={args.bvid}', cookies)
    if view.get('code') != 0:
        sys.exit(f"view API 失败: {view.get('code')} {view.get('message')}")
    data = view['data']
    cid, title = data['cid'], data['title']
    member = bool(data.get('is_upower_exclusive'))
    print(f'标题: {title}\ncid: {cid} | 充电专属: {member}')

    q = wbi_query({'bvid': args.bvid, 'cid': cid, 'web_location': 1315873}, cookies)
    player = http_get_json('https://api.bilibili.com/x/player/wbi/v2?' + q, cookies,
                           referer=f'https://www.bilibili.com/video/{args.bvid}/')
    subs = ((player.get('data') or {}).get('subtitle') or {}).get('subtitles', [])
    if not subs:
        hint = '（充电专属视频 API 不返回字幕轨，属已知限制）' if member else ''
        sys.exit(f'无可用字幕轨 {hint}')

    s = next((x for x in subs if x.get('lan', '').startswith('ai')), subs[0])
    url = s['subtitle_url']
    full = 'https:' + url if url.startswith('//') else url
    body = http_get_json(full, cookies).get('body', [])
    out = args.output or f'{args.bvid}.ai-zh.srt'
    with open(out, 'w') as f:
        f.write(to_srt(body))
    text_len = sum(len(b['content']) for b in body)
    print(f'OK: {s.get("lan")} {len(body)} 条 / {text_len} 字 -> {out}')


if __name__ == '__main__':
    main()
