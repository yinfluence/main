import json, io, sys, re
BAD_VOICE = ['本期','这期','这一期','本集','上集','节目里','节目说','节目讲','落点是','核心判断是','判断是','要问的是']
BAD_GUIDE = ['最实的','最狠的','最硬的','最实用','最好用','更要紧的是','值得注意的是','更关键的是','最显眼的是']
def check(ep):
    d = json.load(io.open(f'content/episodes/{ep}.json', encoding='utf-8'))
    vps = d.get('viewpoints', [])
    errs = []
    if not (4 <= len(vps) <= 5): errs.append(f'观点 {len(vps)} 条，应为 4-5')
    two = sum(1 for v in vps if '，' in v['title'])
    if two > len(vps)/2: errs.append(f'两段式标题 {two}/{len(vps)}，超过一半')
    pair = sum(1 for v in vps if re.search(r'不是[^，。]{2,14}，(?:而)?是', v['title']))
    if pair > 1: errs.append(f'标题「不是A是B」{pair} 条，最多 1')
    if not all(v.get('angle') for v in vps): errs.append('有观点缺 angle')
    for v in vps:
        a = v.get('angle') or ''
        if re.search(r'怎么|为什么|如何|多少|能不能|是不是|哪', a):
            errs.append(f'angle「{a}」是疑问句')
        if len(a) <= 4 and a and a[-1] in '人者员商主家方户':
            errs.append(f'angle「{a}」是人物身份，要写成领域词')
        if re.match(r'^(一|两|三|四|五|几|每)[次条道场笔个年天]', a):
            errs.append(f'angle「{a}」是具体动作或数量，要写成领域词')
        if not (2 <= len(a) <= 6):
            errs.append(f'angle「{a}」长度异常')
    scoped = {k: v for k, v in d.items() if k != 'topic'}
    scoped['topic'] = {k: v for k, v in d.get('topic', {}).items() if k != 'extensions'}
    allt = json.dumps(scoped, ensure_ascii=False)
    for w in BAD_VOICE:
        if w in allt: errs.append(f'编辑口吻「{w}」')
    for w in BAD_GUIDE:
        if w in allt: errs.append(f'导读套话「{w}」')
    body_only = json.dumps(scoped['topic'].get('background'), ensure_ascii=False) + \
                json.dumps(scoped['topic'].get('conflicts'), ensure_ascii=False) + \
                json.dumps(vps, ensure_ascii=False)
    if '：' in body_only or '；' in body_only: errs.append('正文里有冒号或分号')
    if not d.get('inlineKnowledge'): errs.append('缺 inlineKnowledge')
    # 概念模型是否落进正文
    site = json.load(io.open('docs/data/site.json', encoding='utf-8'))
    text = json.dumps(d.get('topic'), ensure_ascii=False) + json.dumps(vps, ensure_ascii=False)
    for cid in d.get('concepts', []):
        n = next((c['name'] for c in site['concepts'] if c['id']==cid), None)
        if n and n not in text: errs.append(f'概念「{n}」没进正文')
    for mid in d.get('models', []):
        n = next((m['name'] for m in site['models'] if m['id']==mid), None)
        if n and n not in text: errs.append(f'模型「{n}」没进正文')
    print(f'{ep}: ' + ('✅ 通过' if not errs else '❌ ' + ' / '.join(errs)) + '  angle= ' + ' | '.join(v.get('angle','') for v in vps))
    return not errs
if __name__ == '__main__':
    ok = all([check(e) for e in sys.argv[1:]])
    sys.exit(0 if ok else 1)
