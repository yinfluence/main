import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(projectRoot, 'content');

const INLINE_LINK = /\[([^\]]+)\]\((episodes|concepts|models|themes|lives|keywords)\/([A-Za-z0-9_-]+)\)/g;
const NARRATOR_WORDS = /整场|本场|全场|本段|这一段|开场|收尾|第[一二三四五]点是|顺着上一段|穿插在/;
// 只列真正的繁体字形，别把词组里的简体字一起收进来
const TRADITIONAL = /[夢堅邏輯辯證們發應該學實產國軍經濟體驗業務變議論難與讀寫標準質資訊關於樣風雲愛親優憂麗龍鳳萬億舉舊聲鬧麼點觀華灣臺為適當設計來個時間開關門問題進運動車過現場]/;

// 大话题的分类词要跨期通用，别一期一个说法
const DOMAINS = [
  '国际局势', '经济结构', '资本与公司', '金融市场', '产业观察', '政企关系',
  '科技与 AI', '社会心理', '社会分层', '舆论与评价', '文化与规则',
  '长期主义', '国家路径', '体育产业', '个人选择', '时代与个人',
  '慈善与信任', '教育与代际', '城市与生活'
];

const RULES = {
  chaptersMin: 3,
  chaptersMax: 6,
  segmentsMin: 6,
  segmentsMax: 12,
  pointsMin: 4,
  // 硬上限 4（用户 2026-07-31 定）。这里曾经是 8，跟 sop/08 的规定对不上，
  // 于是 SOP 改了脚本没改，一屏七八个点照样过检
  pointsMax: 4,
  emphasisMax: 3,
  linkedPointsMin: 2,
  threadReplyMin: 180,
  labelTailMax: 3,
  // summary 的区间在 sop/05a，直播沿用节目的规矩。以前这里只检查字段非空，
  // 于是 LIVE029 写了 543 字（超上限一倍多）还是六道全过
  summaryMin: 200,
  summaryMax: 250
};

// 贴标签式收尾：每段末尾挂一个概念标签升华一下，是最典型的 AI 文风。
// 一期最多容忍 3 处，其余要改写成有主语有实义动词的句子。
const LABEL_TAIL = /(这就是|这属于|这也是|这便是|落到概念上(是|就是)?|说的就是这|讲的就是这|指的就是这|也就是)\s*\[/;

async function readJsonDir(dir) {
  const entries = await fs.readdir(dir);
  const out = [];
  for (const entry of entries.filter((name) => name.endsWith('.json'))) {
    out.push(JSON.parse(await fs.readFile(path.join(dir, entry), 'utf8')));
  }
  return out;
}

const problems = [];
function fail(live, message) {
  problems.push(`${live}: ${message}`);
}

// 提示跟失败分开：历史上积了几百个没建词条的 tag，全判失败会把真问题淹掉。
// 提示不影响退出码，但每次都打出来，别让它悄悄躺着
const warnings = [];
function warn(live, message) {
  warnings.push(`${live}: ${message}`);
}

const [lives, episodes, concepts, models, themes, keywords] = await Promise.all([
  readJsonDir(path.join(contentDir, 'lives')),
  readJsonDir(path.join(contentDir, 'episodes')),
  readJsonDir(path.join(contentDir, 'concepts')),
  readJsonDir(path.join(contentDir, 'models')),
  readJsonDir(path.join(contentDir, 'themes')),
  readJsonDir(path.join(contentDir, 'keywords'))
]);

// 前端按 name 匹配标签，库里没有词条的 tag 在卡片上根本不渲染。
// 别名也算命中，否则同一个词换个说法就被判成没词条
const keywordNames = new Set();
for (const item of keywords) {
  if (item.name) keywordNames.add(item.name);
  for (const alias of item.aliases || []) keywordNames.add(alias);
}

const known = {
  episodes: new Set(episodes.map((item) => item.id)),
  concepts: new Set(concepts.map((item) => item.id)),
  models: new Set(models.map((item) => item.id)),
  themes: new Set(themes.map((item) => item.id)),
  lives: new Set(lives.map((item) => item.id)),
  keywords: new Set(keywords.map((item) => item.id))
};

for (const live of lives.sort((a, b) => a.id.localeCompare(b.id))) {
  const id = live.id;
  const whole = JSON.stringify(live);

  if (whole.includes('——')) fail(id, `正文里还有 ${whole.split('——').length - 1} 处破折号`);
  const narrator = whole.match(new RegExp(NARRATOR_WORDS, 'g'));
  if (narrator) fail(id, `报幕词残留: ${[...new Set(narrator)].join(' / ')}`);
  const traditional = whole.match(new RegExp(TRADITIONAL, 'g'));
  if (traditional) fail(id, `繁体字: ${[...new Set(traditional)].join('')}`);

  for (const field of ['mainThread', 'oneLiner', 'summary', 'liveDate', 'sessionLabel']) {
    if (!live[field]) fail(id, `缺字段 ${field}`);
  }
  if (!(live.boundaries || []).length) fail(id, '缺整理边界');

  // 简介字数。字段非空不等于合规，sop/05a 的区间对直播同样有效
  const summaryLen = (live.summary || '').replace(/\s/g, '').length;
  if (summaryLen && (summaryLen < RULES.summaryMin || summaryLen > RULES.summaryMax)) {
    fail(id, `简介 ${summaryLen} 字，超出 ${RULES.summaryMin} 到 ${RULES.summaryMax}`);
  }

  // 标签能不能显示。tags 里没有对应关键词词条的词，前端一个都不渲染，
  // 全不命中就等于这一期在首页和详情页上没有标签
  const tags = live.tags || [];
  const missTags = tags.filter((tag) => !keywordNames.has(tag));
  if (!tags.length) {
    fail(id, '没有 tags');
  } else if (missTags.length === tags.length) {
    fail(id, `${tags.length} 个 tag 在关键词库里一个都没有，页面上不会显示标签`);
  } else if (missTags.length) {
    warn(id, `${missTags.length}/${tags.length} 个 tag 没有词条，不显示: ${missTags.join(' / ')}`);
  }

  const segments = live.segments || [];
  if (segments.length < RULES.segmentsMin || segments.length > RULES.segmentsMax) {
    fail(id, `话题分段 ${segments.length} 段，超出 ${RULES.segmentsMin} 到 ${RULES.segmentsMax}`);
  }

  const chapters = [];
  for (const segment of segments) {
    const name = segment.chapter;
    if (!name) {
      fail(id, `第 ${segments.indexOf(segment) + 1} 段「${segment.title}」没有归到大话题下`);
      continue;
    }
    let chapter = chapters.find((item) => item.name === name);
    if (!chapter) chapters.push({ name, count: 1 });
    else chapter.count += 1;
  }
  if (chapters.length < RULES.chaptersMin || chapters.length > RULES.chaptersMax) {
    fail(id, `大话题 ${chapters.length} 个，超出 ${RULES.chaptersMin} 到 ${RULES.chaptersMax}`);
  }
  // 大话题必须是内容主题，不能拿位置或动作当名字
  const POSITIONAL = /散场|开场|收尾|最后聊|随便聊|聊了会儿|其他|杂谈|番外/;
  for (const chapter of chapters) {
    if (chapter.name.length > 24) fail(id, `大话题标题过长: ${chapter.name}`);
    if (POSITIONAL.test(chapter.name)) fail(id, `大话题名是位置不是主题: ${chapter.name}`);
    if (!chapter.name.includes('：')) fail(id, `大话题名缺少主题词前缀: ${chapter.name}`);
    const domain = chapter.name.split('：')[0];
    if (!DOMAINS.includes(domain)) fail(id, `大话题的分类词不在通用表里: ${domain}`);
  }

  segments.forEach((segment, index) => {
    const tag = `第 ${String(index + 1).padStart(2, '0')} 段「${segment.title}」`;
    const points = segment.points || [];
    if (points.length < RULES.pointsMin || points.length > RULES.pointsMax) {
      fail(id, `${tag} 要点 ${points.length} 条，超出 ${RULES.pointsMin} 到 ${RULES.pointsMax}`);
    }
    const emphasis = (JSON.stringify(points).match(/\*\*[^*]+\*\*/g) || []).length;
    if (emphasis > RULES.emphasisMax) fail(id, `${tag} 高亮 ${emphasis} 处，超过 ${RULES.emphasisMax}`);
    if (emphasis === 0) fail(id, `${tag} 没有高亮`);
    const linked = points.filter((point) => point.includes('](')).length;
    if (linked < RULES.linkedPointsMin) fail(id, `${tag} 只有 ${linked} 条要点带链接`);
  });

  const labelTails = segments.flatMap((segment) =>
    (segment.points || []).filter((point) => LABEL_TAIL.test(point))
  );
  if (labelTails.length > RULES.labelTailMax) {
    fail(id, `贴标签式收尾 ${labelTails.length} 处，超过 ${RULES.labelTailMax}，例：${labelTails[0].slice(-28)}`);
  }

  for (const thread of live.audienceThreads || []) {
    if ((thread.reply || '').length < RULES.threadReplyMin) {
      fail(id, `问答「${thread.prompt}」回答只有 ${thread.reply.length} 字`);
    }
    if (thread.prompt.startsWith('有观众')) fail(id, `问答标题还是转述句: ${thread.prompt}`);
  }

  for (const [, , type, target] of whole.matchAll(INLINE_LINK)) {
    if (known[type] && !known[type].has(target)) fail(id, `句内链接失效 ${type}/${target}`);
  }
  for (const [field, type] of [['relatedEpisodes', 'episodes'], ['concepts', 'concepts'], ['models', 'models'], ['themes', 'themes']]) {
    for (const target of live[field] || []) {
      if (!known[type].has(target)) fail(id, `${field} 里的 ${target} 不存在`);
    }
  }
}

const linkCount = lives.reduce((sum, live) => sum + [...JSON.stringify(live).matchAll(INLINE_LINK)].length, 0);
console.log(`审计 ${lives.length} 期直播，句内链接 ${linkCount} 个`);
if (warnings.length) {
  console.log(`\n提示 ${warnings.length} 条（不阻断，但该补词条）：`);
  for (const item of warnings) console.log(`  · ${item}`);
}
if (problems.length) {
  console.log(`\n发现 ${problems.length} 个问题：`);
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exitCode = 1;
} else {
  console.log('\n八道机器检查全部通过');
}
