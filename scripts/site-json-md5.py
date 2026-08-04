#!/usr/bin/env python3
"""从 stdin 读 site.json，剔除构建噪音后打印内容 md5。

为什么需要它：发布的终点验证要比对线上和本地的 site.json，但两份从来不可能
逐字节相同。meta.updatedAt 每次 build 都会刷新，而线上那份是 Cloudflare 拿到
commit 之后自己构建的，时间戳必然比本地晚几十秒。

只忽略这一个字段，其余全部参与比对，所以真正的内容差异照样拦得住。

解析失败或字段缺失时打印空串并以非零码退出，调用方按失败处理，不要把空值
当成一致。
"""
import hashlib
import json
import sys

IGNORED_META_KEYS = ('updatedAt',)


def main() -> int:
    raw = sys.stdin.buffer.read()
    if not raw.strip():
        return 1
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return 1
    if not isinstance(data, dict) or 'episodes' not in data:
        return 1

    meta = data.get('meta')
    if isinstance(meta, dict):
        for key in IGNORED_META_KEYS:
            meta.pop(key, None)

    canonical = json.dumps(data, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    print(hashlib.md5(canonical.encode('utf-8')).hexdigest())
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except BrokenPipeError:
        sys.exit(1)
