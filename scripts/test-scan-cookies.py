#!/usr/bin/env python3
"""scan-new-episodes.py 的失败路径测试。

测的是"出问题时会不会静默放弃"，不是 happy path。
2026-07-29/30 那次事故就在这里：Chrome 里人明明登录着，导出的 cookie 却是已轮换的
旧 SESSDATA，脚本一次判死退出，连续三次扫描全废，EP190 晚了一天才上线。

跑法: python3 scripts/test-scan-cookies.py
需要 Chrome 登录着 B 站；拿不到有效 cookie 的几项会自动跳过而不是算失败。
"""
import importlib.util, json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SCAN = os.path.join(HERE, 'scan-new-episodes.py')
TMP = tempfile.mkdtemp(prefix='scan-cookie-test-')

spec = importlib.util.spec_from_file_location('scan', SCAN)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

fails = []


def check(name, cond, detail=''):
    print(f'{"PASS" if cond else "FAIL"}  {name}' + (f'  <- {detail}' if detail else ''))
    if not cond:
        fails.append(name)


def make_stale(src):
    """拿一份真 cookie，把 SESSDATA 换成假值 —— B 站会认成未登录。"""
    dst = os.path.join(TMP, 'stale-cookies.txt')
    out = []
    for line in open(src, encoding='utf-8', errors='ignore'):
        p = line.rstrip('\n').split('\t')
        if len(p) >= 7 and p[5] == 'SESSDATA':
            p[6] = 'deadbeef%2C1800000000%2CstaleTESTonly'
            line = '\t'.join(p) + '\n'
        out.append(line)
    open(dst, 'w', encoding='utf-8').write(''.join(out))
    return dst


print('--- cookie 文件体检 ---')
good, bad = os.path.join(TMP, 'g.txt'), os.path.join(TMP, 'b.txt')
open(good, 'w').write('.bilibili.com\tTRUE\t/\tTRUE\t13445342636\tSESSDATA\tabc%2Cdef\n')
open(bad, 'w').write('.bilibili.com\tTRUE\t/\tTRUE\t13445342636\tbuvid3\txyz\n')
check('认出有效 SESSDATA', m.cookie_has_session(good) is True)
check('认出缺 SESSDATA', m.cookie_has_session(bad) is False)
check('文件不存在不报错', m.cookie_has_session('/nope/nope.txt') is False)

print('\n--- 风控返回 HTML 时要给人话，不是裸 traceback ---')
try:
    m.curl_json('https://www.bilibili.com/', None)
    check('HTML 返回抛 BiliError', False, '没抛异常')
except m.BiliError as e:
    check('HTML 返回抛 BiliError', '不是 JSON' in str(e), str(e)[:60])
except Exception as e:
    check('HTML 返回抛 BiliError', False, f'抛的是 {type(e).__name__}')

print('\n--- 导 cookie 失败要重试满次数，不是一次判死 ---')
calls = []
real_export, real_fallback = m.export_cookies, m.COOKIE_FALLBACK
m.export_cookies = lambda: (calls.append(1), None)[1]
m.COOKIE_FALLBACK = '/nope/no-fallback.txt'
c, mix = m.login_cookies(tries=3, gap=0)
check('导出失败重试 3 次', len(calls) == 3, f'实际 {len(calls)} 次')
check('全失败返回 (None, None)', c is None and mix is None)

fresh = real_export()
if not fresh:
    print('SKIP  余下几项需要 Chrome 里登录着 B 站（现在导不到有效 cookie）')
else:
    stale = make_stale(fresh)
    print('\n--- 拿到未登录 cookie 时同样要重试 ---')
    calls2 = []
    m.export_cookies = lambda: (calls2.append(1), stale)[1]
    c, mix = m.login_cookies(tries=3, gap=0)
    check('未登录 cookie 重试 3 次', len(calls2) == 3, f'实际 {len(calls2)} 次')
    check('未登录且无兜底 -> (None, None)', c is None and mix is None)

    print('\n--- Chrome 导出没救时，长效 cookie 要接上 ---')
    m.export_cookies = lambda: None
    m.COOKIE_FALLBACK = fresh
    c, mix = m.login_cookies(tries=1, gap=0)
    check('改用长效 cookie', c == fresh and bool(mix), f'c={c}')

    print('\n--- 显式传失效 cookie：给可操作提示 + 退出码 1 ---')
    r = subprocess.run([sys.executable, SCAN, '--dry-run', '--cookies', stale],
                       capture_output=True, text=True, timeout=180)
    out = r.stdout + r.stderr
    check('退出码为 1', r.returncode == 1, f'实际 {r.returncode}')
    check('不吐 traceback', 'Traceback' not in out)
    check('提示怎么修', 'bilibili.com 刷新登录态' in out, out.strip()[-70:])
    check('显式 cookie 不做无谓重试', out.count('/3 次拿到的 cookie 未登录') == 1)

m.export_cookies, m.COOKIE_FALLBACK = real_export, real_fallback

print('\n--- local_eps 只认整理完成的，且不误伤没有 status 字段的老数据 ---')
check('骨架判为草稿', m.is_draft({'status': 'draft', 'summary': '待整理'}) is True)
check('无 status 的老数据不算草稿', m.is_draft({'summary': '真内容'}) is False)
check('summary 空算草稿', m.is_draft({'status': 'curated', 'summary': ''}) is True)
eps = m.local_eps()
check('真实库里没有卡住的草稿', len(eps) > 0 and all(e.startswith('EP') for e in eps),
      f'已收录 {len(eps)} 期')

print()
print('全部通过' if not fails else f'{len(fails)} 项失败: {fails}')
sys.exit(1 if fails else 0)
