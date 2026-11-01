#!/usr/bin/env python3
"""curl_json 重试的离线测试。2026-11-01 加：18:01 接口回空一次，整轮扫描报错。

用法: python3 scripts/test-curl-retry.py
"""
import importlib.util, io, os, sys, contextlib, subprocess, types

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('S', os.path.join(HERE, 'scan-new-episodes.py'))
S = importlib.util.module_from_spec(spec)
spec.loader.exec_module(S)
S.CURL_RETRY_WAITS = (0, 0)
fails = 0


def check(name, cond, detail=''):
    global fails
    print(('PASS ' if cond else 'FAIL ') + name + (f'  {detail}' if not cond else ''))
    fails += not cond


def fake(outputs):
    calls = []
    def run(cmd, **kw):
        calls.append(cmd)
        o = outputs[min(len(calls) - 1, len(outputs) - 1)]
        if o == 'TIMEOUT':
            raise subprocess.TimeoutExpired(cmd, 60)
        return types.SimpleNamespace(stdout=o)
    S.subprocess.run = run
    return calls


def call():
    err = io.StringIO()
    with contextlib.redirect_stderr(err):
        try:
            return S.curl_json('https://api.bilibili.com/x/space/wbi/arc/search?x=1', None), err.getvalue()
        except S.BiliError as e:
            return e, err.getvalue()

real_run = subprocess.run
calls = fake(['{"code":0}'])
r, _ = call()
check('一次就成功不重试', r == {'code': 0} and len(calls) == 1, (r, len(calls)))

calls = fake(['', '{"code":0}'])
r, log = call()
check('18:01 场景：先回空、再正常，能拿到结果', r == {'code': 0} and len(calls) == 2 and '重试' in log, (r, log))

calls = fake(['TIMEOUT', '<html>', '{"code":0}'])
r, _ = call()
check('超时、HTML 之后第三次成功', r == {'code': 0} and len(calls) == 3, r)

calls = fake([''])
r, _ = call()
check('三次都空才报错，且只试三次', isinstance(r, S.BiliError) and '不是 JSON' in str(r) and len(calls) == 3, (r, len(calls)))

S.subprocess.run = real_run
print(f'\n{"全部通过" if not fails else f"{fails} 项失败"}')
sys.exit(1 if fails else 0)
