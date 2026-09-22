# 化名残留检查。对照表出处：sop/09-转录校正与术语表.md 第三节。
# 2026-09-19 用户改定：正文和标签写真实对象，只有讲小说情节或拿小说人物打比方的句子保留化名。
# 用法：python3 scripts/check-alias.py
import json, io, glob, sys, re

ALIAS = {
    '东大': '中国', '东方大国': '中国', '东土大唐': '中国', '大毛': '俄罗斯',
    '二毛': '乌克兰', '小乌': '乌克兰', '朗朗': '伊朗', '美丽国': '美国',
    '大美丽国': '美国', '小哈': '哈梅内伊', '地堡老头': '普京', '小泽': '泽连斯基',
    '小乙': '以色列', '小日子': '日本', '太阳国': '日本', '金太阳': '朝鲜',
    '弯弯': '台湾', '宝岛': '台湾', '川老爷子': '川普', '川老头': '川普', '懂王': '川普',
    '某书': '小红书', '小某书': '小红书', '某手': '快手',
    '丐帮': '小米', '杂粮': '小米', '华山派': '华为', '老大嘴': '余承东',
    '某界': '问界', '剑宗小厮': '赛力斯', '福威镖局': '比亚迪', '林震南': '王传福',
    '迪王': '比亚迪', '嵩山派': '蔚来', '某来': '蔚来', '日月神教': '理想',
    '恒山派': '小鹏', '宁王': '宁德时代', '泰山派': '吉利',
}
# 这些词同时是小说人物名，节目常拿来打比方，正文里出现不一定是违规，只报不算错
METAPHOR_ONLY = {'岳不群', '左冷禅', '东方不败', '任我行', '令狐冲', '田伯光', '余沧海', '青城派'}

# 化名字面撞上日常词组的，命中这些上下文一律不算。都是实测踩出来的误报。
FALSE_POSITIVE = [
    '大毛病', '大毛巾', '股东大会', '弯弯绕', '小日子好', '小日子过得',
    '拐弯弯', '一小撮', '东大街', '东大门',
]

# 讲小说情节本身的信号词。整段出现这些，说明在复述金庸原著，不是指现实企业。
NOVEL_CONTEXT = [
    '笑傲江湖', '金庸', '小说', '原著', '书里', '那本书', '令狐冲', '林平之',
    '辟邪剑谱', '金盆洗手', '五岳剑派', '思过崖', '封禅台', '魔教',
]

def body_text(d):
    tp = d.get('topic', {}) if isinstance(d.get('topic'), dict) else {}
    parts = [d.get('summary', ''), tp.get('background', ''), tp.get('mechanism', ''), d.get('mechanism', '')]
    parts += list(tp.get('conflicts') or []) + list(tp.get('extensions') or [])
    parts += [v.get('title', '') + v.get('body', '') for v in (d.get('viewpoints') or [])]
    parts += list(d.get('thinking') or [])
    for seg in (d.get('segments') or []):
        parts += [seg.get('title', ''), seg.get('summary', '')] + list(seg.get('points') or [])
    return ' '.join(p for p in parts if isinstance(p, str))

def main():
    tag_bad, body_bad = {}, {}
    files = sorted(glob.glob('content/episodes/EP*.json')) + sorted(glob.glob('content/lives/LIVE*.json'))
    for p in files:
        d = json.load(io.open(p, encoding='utf-8'))
        _id = d['id']
        hits = [t for t in d.get('tags', []) if any(a in t for a in ALIAS)]
        if hits:
            tag_bad[_id] = [(t, next(ALIAS[a] for a in ALIAS if a in t)) for t in hits]
        txt = body_text(d)
        for fp in FALSE_POSITIVE:
            txt = txt.replace(fp, '')
        declared = ' '.join(d.get('topic', {}).get('boundaries', []) if isinstance(d.get('topic'), dict)
                            else (d.get('boundaries') or []))
        novel = sum(1 for w in NOVEL_CONTEXT if w in txt or w in declared)
        # 正文里出现化名，且同一页没有写出真名，才算可疑
        sus = []
        for a, real in ALIAS.items():
            if a in txt and real.split('/')[0] not in txt:
                sus.append(f'{a}→{real}')
        if sus and novel < 2:
            body_bad[_id] = sus
        elif sus:
            body_bad.setdefault('（讲小说情节，已跳过）', []).append(f'{_id}: {"/".join(sus)}')
    print(f'== 标签里的化名 == {len(tag_bad)} 处')
    for k, v in tag_bad.items():
        print('   ', k, ' / '.join(f'{t}→{r}' for t, r in v))
    if not tag_bad:
        print('    无')
    print(f'== 正文出现化名且同页没写出真名 == {len(body_bad)} 处')
    for k, v in body_bad.items():
        print('   ', k, v)
    if not body_bad:
        print('    无')
    print('\n提示：讲小说情节本身、拿小说人物打比方的句子按 sop/05a 保留化名，不算违规。')
    print('对照表见 sop/09-转录校正与术语表.md 第三节。')
    return 1 if tag_bad else 0

if __name__ == '__main__':
    sys.exit(main())
