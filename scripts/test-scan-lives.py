#!/usr/bin/env python3
"""scan-new-lives.py 的离线测试，不碰网络。

2026-11-01 加。起因：10-31 21点场回放上传了但没进合集，旧逻辑只看合集，
两次扫描都报「无新场次」。这里用假数据把那次原样复现，再测几种边界情况。

用法: python3 scripts/test-scan-lives.py
"""
import importlib.util, io, os, sys, contextlib

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('L', os.path.join(HERE, 'scan-new-lives.py'))
L = importlib.util.module_from_spec(spec)
spec.loader.exec_module(L)

T0 = 1_761_700_000  # 随便一个基准时间


def arch(bvid, t, title='LIVE054｜旧场次【直播回放】2026年10月28日21点场', dur=6000):
    return {'bvid': bvid, 'title': title, 'pubdate': t, 'duration': dur}


def up(bvid, t, title, length='108:28'):
    return {'bvid': bvid, 'title': title, 'created': t, 'length': length}


SEASON = [arch('BVold1', T0 - 86400), arch('BVold2', T0)]
NEW_LIVE = up('BVnew', T0 + 3600 * 40,
              '【直播回放】周三国内笑傲江湖，周六国际三国演义…… 2026年10月31日21点场')
EPISODE = up('BVep', T0 + 3600 * 20, '武契奇败选！【EP233】', '22:59')

fails = 0


def check(name, cond, detail=''):
    global fails
    print(('PASS ' if cond else 'FAIL ') + name + (f'  {detail}' if detail and not cond else ''))
    if not cond:
        fails += 1


def run_main(season, extra, known, extra_raises=False):
    """替换掉网络部分跑 main --dry-run，返回 (退出码, 输出)。"""
    L.fetch_season = lambda: season
    if extra_raises:
        def boom(_):
            raise RuntimeError('模拟风控')
        L.fetch_recent_uploads_not_in_season = boom
    else:
        L.fetch_recent_uploads_not_in_season = lambda a: L.pick_unseasoned(extra, a)
    L.known_bvids = lambda: set(known)
    sys.argv = ['scan-new-lives.py', '--dry-run']
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        code = L.main()
    return code, out.getvalue() + err.getvalue()


# 1. 原样复现 10-31：合集全收录，投稿列表多一场没进合集的回放
code, out = run_main(SEASON, [NEW_LIVE, EPISODE] + [up('BVold2', T0, '…【直播回放】')], {'BVold1', 'BVold2'})
check('10-31 场景：没进合集的新回放能被发现', code == 0 and 'BVnew' in out, out)

# 1b. 对照组：只看合集（旧逻辑）就是报无新场次，证明测试确实打在漏洞上
code, out = run_main(SEASON, [], {'BVold1', 'BVold2'})
check('对照：只看合集时报无新场次（旧逻辑的表现）', code == 10, out)

# 2. 已在合集里的不算两次
picked = L.pick_unseasoned([up('BVold2', T0 + 99999, '【直播回放】x')], SEASON)
check('已在合集的回放不重复挑出', picked == [], picked)

# 3. 比合集最新一条更早、又不在合集的老回放不翻出来
picked = L.pick_unseasoned([up('BVancient', T0 - 3600, '【直播回放】很早以前')], SEASON)
check('比合集最新还早的老回放忽略', picked == [], picked)

# 4. 普通节目不当直播
picked = L.pick_unseasoned([EPISODE], SEASON)
check('普通节目（EP233）不当直播', picked == [], picked)

# 5. 时长解析：分:秒 和 时:分:秒
p = L.pick_unseasoned([up('B1', T0 + 1, '【直播回放】a', '108:28'),
                       up('B2', T0 + 2, '【直播回放】b', '1:48:28')], SEASON)
check('时长 108:28 解析成 6508 秒', p[0]['duration'] == 6508, p)
check('时长 1:48:28 解析成 6508 秒', p[1]['duration'] == 6508, p)

# 6. 投稿列表接口挂了，不拖垮扫描，合集那条照常判
code, out = run_main(SEASON, None, {'BVold1', 'BVold2'}, extra_raises=True)
check('投稿列表失败时退回合集判断、不崩', code == 10 and 'WARN' in out, out)
code, out = run_main(SEASON + [arch('BVs', T0 + 50)], None, {'BVold1', 'BVold2'}, extra_raises=True)
check('投稿列表失败时合集里的新场次照样发现', code == 0 and 'BVs' in out, out)

# 7. 整理上线后（bvid 已收录），下一轮不再报
code, out = run_main(SEASON, [NEW_LIVE], {'BVold1', 'BVold2', 'BVnew'})
check('已收录后不再重复报', code == 10, out)

# 8. UP 主事后把它补进合集，也不重复
code, out = run_main(SEASON + [arch('BVnew', NEW_LIVE['created'], NEW_LIVE['title'])],
                     [NEW_LIVE], {'BVold1', 'BVold2', 'BVnew'})
check('事后补进合集也不重复', code == 10, out)

# 9. 同一场切两段（一段进了合集一段没进），合并成一场
t = NEW_LIVE['created']
seg_title = '【直播回放】同一场 2026年10月31日21点场'
code, out = run_main(SEASON + [arch('BVseg1', t, seg_title)],
                     [up('BVseg2', t + 1800, seg_title)], {'BVold1', 'BVold2'})
check('切两段的同一场合并成 1 场', code == 0 and '合并后 1 场' in out and 'BVseg1' in out and 'BVseg2' in out, out)

print(f'\n{"全部通过" if not fails else f"{fails} 项失败"}')
sys.exit(1 if fails else 0)
