import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  path.join(__dirname, '..', 'dist', 'data', 'site.json'),
  path.join(__dirname, '..', 'docs', 'data', 'site.json')
];

const AUTO_PATTERNS = [
  /主要作为具体对象关键词出现/,
  /主要指围绕该事件、历史节点或现实冲突展开的讨论/,
  /主要指围绕这一国家、地区或地缘节点展开的讨论/,
  /主要指围绕这一判断、现象或说法展开的讨论/,
  /当前还没有形成成熟的专题词条/,
  /因为它已经在节目里形成了明确判断线/,
  /当前保留这个词，不是为了堆标签/,
  /它之所以值得保留，不是因为字面新鲜/,
  /先把它保留下来，是因为这期节目已经让它承接了一条可继续扩展的讨论线/
];

const META_PATTERNS = [
  /先把它保留下来/,
  /后续(?:只要)?有新节目/,
  /继续往这个入口里累积/,
  /当前锚定/,
  /最直接锚定/,
  /这个词更多指向/,
  /值得保留/,
  /当前还没有形成更成熟的专题定义/,
  /后续维护/
];

const MIN_SUMMARY_LENGTH = 24;
const MIN_DESCRIPTION_LENGTH = 90;

function textLength(value) {
  return String(value || '').replace(/\s+/g, '').length;
}

async function loadSite() {
  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  throw new Error('site.json not found under dist/data or docs/data');
}

function isAutoKeyword(keyword) {
  const text = `${keyword.summary || ''}\n${keyword.description || ''}`;
  return AUTO_PATTERNS.some((pattern) => pattern.test(text));
}

function isMetaKeyword(keyword) {
  const text = `${keyword.summary || ''}\n${keyword.description || ''}`;
  return META_PATTERNS.some((pattern) => pattern.test(text));
}

function isThinKeyword(keyword) {
  return textLength(keyword.summary) < MIN_SUMMARY_LENGTH || textLength(keyword.description) < MIN_DESCRIPTION_LENGTH;
}

const site = await loadSite();
const autoKeywords = (site.keywords || [])
  .filter((keyword) => isAutoKeyword(keyword) || isMetaKeyword(keyword) || isThinKeyword(keyword))
  .sort((a, b) => (a.episodes?.[0]?.id || '').localeCompare(b.episodes?.[0]?.id || '') || a.name.localeCompare(b.name, 'zh-Hans-CN'));

console.log(`remaining_auto_keywords\t${autoKeywords.length}`);
for (const keyword of autoKeywords) {
  const anchor = keyword.episodes?.[0]?.id || '-';
  const reasons = [];
  if (isAutoKeyword(keyword)) reasons.push('auto');
  if (isMetaKeyword(keyword)) reasons.push('meta');
  if (isThinKeyword(keyword)) reasons.push('thin');
  console.log(`${anchor}\t${keyword.name}\t${reasons.join(',')}`);
}
