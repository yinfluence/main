#!/usr/bin/env python3
"""校验「如何定义和提问」区块（episode.inquiry）。

规范见 sop/10-如何定义和提问.md。这个脚本只查机器能查的部分，
写得好不好还得人自己看。

标了 authored_by: user 的条目是用户亲手写的正文，一个字都不许改。

最要紧的一条是 asks 的真伪：那一栏只能放节目里真的问出口的话。
2026-08-17 试点时编造问句是被打回的主因，所以这里逐句回 fixed/ 字幕比对，
对不上就是 ERROR。

用法
----
  python3 scripts/check-inquiry.py            # 全库
  python3 scripts/check-inquiry.py EP174      # 只查指定几期

退出码: 0=没有 ERROR / 1=有 ERROR
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
EPISODES = BASE / "content" / "episodes"
FIXED = BASE / "workbench"

# 各字段上限，取自 sop/03
LIMITS = {"core": 120, "title": 20, "think": 260, "material": 150, "ask": 60}
Q_MIN, Q_MAX = 4, 6

# sop/10 第五条点名过的贴标签词，命中报 WARNING 逐条人工看
LABEL_WORDS = [
    "三段推理", "外延扩张", "根定义", "诘问", "留白",
    "承担了整篇", "长出来的", "按这把尺子", "本质属性",
    "范式", "叙事框架", "认知框架", "话语体系",
]

# title 禁用的对立句式，见 sop/10 第三条
NEGATIVE_PATTERNS = [
    re.compile(r"不是.{1,12}[，,]\s*是"),
    re.compile(r"不[是叫].{1,12}[，,]\s*而是"),
]


def strip_marks(s):
    """去掉标点与空白，只留可比对的字符。"""
    out = []
    for ch in s:
        if ch.isspace():
            continue
        if unicodedata.category(ch).startswith("P"):
            continue
        out.append(ch)
    return "".join(out)


# SOP 允许「删口头语，不许改意思」：比对时两边同时去掉纯语气词，
# 使「他们呢也不认识你」引作「他们也不认识你」仍能命中。
# 注意不含「吗」——疑问助词删了会改意思。
FILLERS = "呢啊嘛呀哦哟"


def strip_fillers(s):
    return "".join(ch for ch in s if ch not in FILLERS)


def load_subtitle(ep):
    """颖响力的转写稿是 workbench/EPxxx/EPxxx.transcript.txt，一行一句的纯文本。"""
    f = FIXED / ep / f"{ep}.transcript.txt"
    if not f.exists():
        return None
    return strip_marks(f.read_text(encoding="utf-8"))


def check_episode(path, errors, warnings):
    d = json.loads(path.read_text(encoding="utf-8"))
    ep = d["id"]
    q = d.get("inquiry")
    if not q:
        return False

    def err(msg):
        errors.append(f"{ep}: {msg}")

    def warn(msg):
        warnings.append(f"{ep}: {msg}")

    core = q.get("core", "")
    if not core:
        err("缺 core")
    elif len(core) > LIMITS["core"]:
        err(f"core {len(core)} 字，超过 {LIMITS['core']}")

    rows = q.get("questions") or []
    if not Q_MIN <= len(rows) <= Q_MAX:
        err(f"定义 {len(rows)} 条，规范要求 {Q_MIN}-{Q_MAX} 条")

    subtitle = load_subtitle(ep)
    if subtitle is None:
        err("找不到该期 fixed 字幕，asks 无法核对")

    for i, row in enumerate(rows, start=1):
        where = f"第 {i} 条（{row.get('tag', '无 tag')}）"
        for key in ("tag", "title", "think"):
            if not row.get(key):
                err(f"{where} 缺 {key}")
        title = row.get("title", "")
        if len(title) > LIMITS["title"]:
            err(f"{where} title {len(title)} 字，超过 {LIMITS['title']}")
        for pat in NEGATIVE_PATTERNS:
            if pat.search(title):
                err(f"{where} title 用了「不是…是…」句式：{title}")
        think = row.get("think", "")
        if len(think) > LIMITS["think"]:
            err(f"{where} think {len(think)} 字，超过 {LIMITS['think']}")

        if row.get("authored_by") == "user":
            # 用户亲手写的正文，任何改动都算违规，只查它还在不在
            pass

        asks = row.get("asks") or []
        if not asks:
            err(f"{where} 没有 asks")
        for a in asks:
            if len(a) > LIMITS["ask"] + 2:      # +2 给「」留位
                err(f"{where} 问句 {len(a)} 字，超过 {LIMITS['ask']}：{a[:24]}…")
            if not (a.startswith("「") and a.endswith("」")):
                err(f"{where} 问句没用「」引起来：{a[:24]}…")
            if subtitle is not None and strip_fillers(strip_marks(a)) not in strip_fillers(subtitle):
                err(f"{where} 问句在字幕里找不到：{a[:36]}…")

        for w in LABEL_WORDS:
            for key in ("title", "think"):
                if w in row.get(key, ""):
                    warn(f"{where} {key} 出现贴标签词「{w}」")
    for w in LABEL_WORDS:
        if w in core:
            warn(f"core 出现贴标签词「{w}」")
    return True


def main():
    want = [a for a in sys.argv[1:] if a.startswith("EP")]
    files = sorted(EPISODES.glob("EP*.json"))
    if want:
        files = [f for f in files if f.stem in want]
        missing = set(want) - {f.stem for f in files}
        if missing:
            print(f"ERROR: 找不到 {' '.join(sorted(missing))}", file=sys.stderr)
            return 1

    errors, warnings, done = [], [], []
    for f in files:
        if check_episode(f, errors, warnings):
            done.append(f.stem)

    todo = [f.stem for f in files if f.stem not in done]
    print(f"已补 {len(done)} 期 / 待补 {len(todo)} 期")
    if todo and len(todo) <= 40:
        print(f"待补：{' '.join(todo)}")

    for w in warnings:
        print(f"  ! {w}")
    for e in errors:
        print(f"  ✗ {e}")
    print(f"\nERROR {len(errors)} · WARNING {len(warnings)}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
