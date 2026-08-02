import json, io, glob, os, sys, subprocess, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module
check = import_module("check-episode-style".replace("-","_")) if False else None
import importlib.util as _u
_spec = _u.spec_from_file_location("chk", os.path.join(os.path.dirname(os.path.abspath(__file__)), "check-episode-style.py"))
_m = _u.module_from_spec(_spec); _spec.loader.exec_module(_m); check = _m.check

eps = sorted(glob.glob('content/episodes/EP*.json'))
done, undone = [], []
for p in eps:
    d = json.load(io.open(p, encoding='utf-8'))
    (done if d.get('inlineKnowledge') else undone).append(d['id'])
print(f'== 精修覆盖 == {len(done)}/{len(eps)}')
if undone: print('   未完成:', undone)

print('== 逐期检查 ==')
fails = [e for e in done if not check(e)]
print(f'   通过 {len(done)-len(fails)}/{len(done)}' + (f'  失败: {fails}' if fails else ''))

print('== 悬空引用 ==')
miss = {}
for p in eps + sorted(glob.glob('content/lives/LIVE*.json')):
    d = json.load(io.open(p, encoding='utf-8'))
    for k in ('concepts', 'models'):
        for i in d.get(k, []):
            if not os.path.exists(f'content/{k}/{i}.json'):
                miss.setdefault(f'{k}/{i}', []).append(d['id'])
print('   ', miss if miss else '无')

print('== 站点数据一致性 ==')
site = json.load(io.open('docs/data/site.json', encoding='utf-8'))
print(f'   site.json episodes={len(site["episodes"])}  content 目录={len(eps)}')
sd = {e['id'] for e in site['episodes'] if e.get('inlineKnowledge')}
print(f'   site.json 里带 inlineKnowledge 的 ={len(sd)}（应等于 {len(done)}）')
stale = set(done) - sd
if stale: print('   ⚠️ 未同步进 build 的期:', sorted(stale))

print('== 内联链接生成 ==')
import re
LAB = []
for key in ('concepts','models','themes','keywords'):
    for it in site.get(key, []) or []:
        for lab in [it.get('name')] + (it.get('aliases') or []):
            if lab: LAB.append(lab)
LAB.sort(key=lambda x: -len(x))
bad = []
for e in site['episodes']:
    if not e.get('inlineKnowledge'): continue
    text = json.dumps(e.get('topic'), ensure_ascii=False) + json.dumps(e.get('viewpoints'), ensure_ascii=False)
    want = set()
    for cid in e.get('concepts', []):
        n = next((c['name'] for c in site['concepts'] if c['id']==cid), None)
        if n: want.add(n)
    for mid in e.get('models', []):
        n = next((m['name'] for m in site['models'] if m['id']==mid), None)
        if n: want.add(n)
    taken, hit = [], set()
    for lab in LAB:
        for m in re.finditer(re.escape(lab), text):
            if any(not (m.end()<=s0 or m.start()>=e0) for s0,e0 in taken): continue
            taken.append((m.start(), m.end())); hit.add(lab)
    miss = [n for n in want if n not in hit]
    if miss: bad.append((e['id'], miss))
print('   ', f'{len(bad)} 期的概念被长词吃掉' if bad else '全部正常')
for b in bad[:10]: print('    ', b)

print('== 观点结构 ==')
import collections
cnt = collections.Counter()
dup = collections.defaultdict(list)
longs, shorts = [], []
for e in site['episodes']:
    if not e.get('inlineKnowledge'): continue
    vs = e.get('viewpoints', [])
    cnt[len(vs)] += 1
    for v in vs:
        dup[v['title']].append(e['id'])
        n = len(re.sub(r'\s','',v['body']))
        if n > 145: longs.append((e['id'], n))
        if n < 100: shorts.append((e['id'], n))
print('   条数分布', dict(cnt))
print('   重复标题', {k:v for k,v in dup.items() if len(v)>1} or '无')
print('   body 超 145 字', longs or '无')
print('   body 不足 100 字', shorts or '无')

# 2026-08-02 加。以前这两项没人量：summary 只被检查非空，tags 压根不检查，
# 于是简介写超一倍、标签在页面上一个都不显示，两种情况都能全项通过。
print('== 简介字数（sop/05a 200-250）==')
out = []
for p in eps:
    d = json.load(io.open(p, encoding='utf-8'))
    n = len(re.sub(r'\s', '', d.get('summary') or ''))
    if n < 200 or n > 250: out.append((d['id'], n))
print('   ', f'{len(out)} 期超区间: {out[:12]}' if out else '全部在区间内')

print('== 标签能不能显示（tags 要有 content/keywords 词条）==')
names = set()
for p in glob.glob('content/keywords/*.json'):
    k = json.load(io.open(p, encoding='utf-8'))
    if k.get('name'): names.add(k['name'])
    for a in k.get('aliases', []): names.add(a)
empty, partial = [], 0
for p in eps + sorted(glob.glob('content/lives/LIVE*.json')):
    d = json.load(io.open(p, encoding='utf-8'))
    tags = d.get('tags') or []
    miss = [t for t in tags if t not in names]
    if tags and len(miss) == len(tags): empty.append(d['id'])
    elif miss: partial += 1
print('   ', f'一个标签都显示不出来: {empty}' if empty else '每期至少有一个标签能显示')
print('   ', f'{partial} 期有部分标签没词条（不阻断，见 audit-lives 的提示清单）')
