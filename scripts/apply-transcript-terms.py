#!/usr/bin/env python3
"""把 scripts/transcript-terms.json 的两层校正套到转写稿上。

读 workbench/LIVExxx/LIVExxx.transcript.txt，写 LIVExxx.transcript.fixed.txt。
原始文件永远不改，整理时读 fixed 那份。秒级完成，可以随便重跑。

    python3 scripts/apply-transcript-terms.py            # 全部
    python3 scripts/apply-transcript-terms.py LIVE030    # 指定几期
    python3 scripts/apply-transcript-terms.py --dry      # 只报告不落盘

术语表和精修层的分工见 sop/09-转录校正与术语表.md。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(HERE)
WORKBENCH = os.path.join(WEB, 'workbench')
TERMS_FILE = os.path.join(HERE, 'transcript-terms.json')


def load_terms():
    with open(TERMS_FILE, encoding='utf-8') as fh:
        data = json.load(fh)
    return data.get('terms', {}), data.get('manual', {})


def apply_terms(text, terms):
    """按长度倒序替换，长词先命中。值是数组时第一项为正确词，其余为禁止后缀。"""
    hits = {}
    for wrong in sorted(terms, key=len, reverse=True):
        rule = terms[wrong]
        if isinstance(rule, list):
            right, blocked = rule[0], rule[1:]
        else:
            right, blocked = rule, []
        count = 0
        out = []
        i = 0
        while i < len(text):
            if text.startswith(wrong, i):
                tail = text[i + len(wrong):i + len(wrong) + 1]
                if tail in blocked:
                    out.append(text[i])
                    i += 1
                    continue
                out.append(right)
                i += len(wrong)
                count += 1
            else:
                out.append(text[i])
                i += 1
        text = ''.join(out)
        if count:
            hits[f'{wrong} -> {right}'] = count
    return text, hits


def apply_manual(text, pairs):
    hits, misses = {}, []
    for wrong, right in pairs:
        count = text.count(wrong)
        if count:
            text = text.replace(wrong, right)
            hits[f'{wrong[:24]} -> {right[:24]}'] = count
        else:
            misses.append(wrong)
    return text, hits, misses


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry' in sys.argv
    terms, manual = load_terms()

    ids = args or sorted(
        d for d in os.listdir(WORKBENCH)
        if re.fullmatch(r'LIVE\d{3}', d)
        and os.path.exists(os.path.join(WORKBENCH, d, f'{d}.transcript.txt'))
    )
    if not ids:
        print('没有找到转写稿')
        return 1

    total_misses = 0
    for live_id in ids:
        src = os.path.join(WORKBENCH, live_id, f'{live_id}.transcript.txt')
        if not os.path.exists(src):
            print(f'{live_id}: 没有 transcript.txt，跳过')
            continue
        with open(src, encoding='utf-8') as fh:
            raw = fh.read()

        fixed, term_hits = apply_terms(raw, terms)
        fixed, manual_hits, misses = apply_manual(fixed, manual.get(live_id, []))

        changed = sum(term_hits.values()) + sum(manual_hits.values())
        print(f'{live_id}: {len(raw)} 字，改了 {changed} 处')
        for key, n in sorted(term_hits.items(), key=lambda kv: -kv[1]):
            print(f'    术语 {key} × {n}')
        for key, n in manual_hits.items():
            print(f'    精修 {key} × {n}')
        if misses:
            total_misses += len(misses)
            print(f'    ⚠️ 以下精修没匹配上（左边要写术语表处理之后的文本）：')
            for m in misses:
                print(f'      {m[:40]}')

        if not dry:
            dst = os.path.join(WORKBENCH, live_id, f'{live_id}.transcript.fixed.txt')
            with open(dst, 'w', encoding='utf-8') as fh:
                fh.write(fixed)

    if dry:
        print('\n（--dry，没有落盘）')
    return 1 if total_misses else 0


if __name__ == '__main__':
    sys.exit(main())
