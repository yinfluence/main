import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const candidates = [
  path.join(rootDir, 'docs', 'data', 'site.json'),
  path.join(rootDir, 'dist', 'data', 'site.json')
];
const contentDirs = [
  path.join(rootDir, 'content', 'keywords'),
  path.join(rootDir, 'content', 'people')
];
const generatedInputDirs = [
  path.join(rootDir, 'scripts', 'keyword-definitions.d')
];
const generatedInputFiles = [
  path.join(rootDir, 'scripts', 'keyword-definitions.json')
];
const peopleDir = path.join(rootDir, 'content', 'people');

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
  /当前知识库语境/,
  /在当前知识库/,
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
const MIN_PERSON_TOTAL_LENGTH = 420;
const VALID_KINDS = new Set(['person', 'geography', 'organization', 'product', 'event', 'mechanism', 'asset', 'general', 'concept', 'theme']);
const PERSON_IDENTITY_PATTERN = /(总统|首相|总理|主席|CEO|首席执行官|创始人|创办人|董事长|教授|教师|导师|导演|作家|作者|署名作者|企业家|创业者|政治人物|历史人物|经济学家|科学家|艺术家|建筑师|策展人|文博|内容创作者|创作者|公众人物|主播|教育家|学者|音乐人|歌手|演员|运动员|赛车手|赛车从业者|校长|外交官|部长|书记|领袖|最高领袖|联合创始人|投资人|企业管理者)/;
const WEAK_SOURCE_HOST_PATTERNS = [
  /baike\.sogou\.com/i,
  /baike\.baidu\.com/i,
  /m\.baike\.com/i
];
const REQUIRED_PERSON_FIELDS = [
  'basicIntro',
  'programRole',
  'programAssociations',
  'styleNotes',
  'methodNotes',
  'extensionNotes'
];
const BANNED_CONTENT_PATTERNS = [
  /(^|\n)\s*(为什么重要|使用边界|相关节点|进一步追问|关联信息|节目中的线索|理解信号|识别信号|这个词指什么|为什么保留这个入口|主要讨论切口)\s*($|\n|[:：])/,
  /站内保留|节目保留|保留这个词|保留这个入口|为什么保留|这个词条|本词条|当前节目库|候选入口|厚词条|未在本轮逐项复核|并不想做语言梗收藏|之所以被单独拎出来|值得单独拎出来|进一步追问/
];
const PLACEHOLDER_CONTENT_PATTERNS = [
  /待补充/,
  /暂无/,
  /后续补充[。.!！]?(\s|$)/
];
const TIMESTAMPED_BODY_PATTERNS = [
  /截至\s*\d{4}[-年]\s*\d{1,2}(?:[-月]\s*\d{1,2})?\s*(?:日)?\s*核对/,
  /截至\s*\d{4}[-年]/,
  /截至核验时/,
  /截至本次核对/,
  /截至本轮整理/,
  /页面整理时/
];

function textLength(value) {
  return String(value || '').replace(/\s+/g, '').length;
}

async function loadSite() {
  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      return {
        site: JSON.parse(raw),
        sitePath: candidate,
        siteStat: await fs.stat(candidate)
      };
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

function isPersonKeyword(keyword) {
  return keyword.kind === 'person' || keyword.entryType === 'person' || Boolean(keyword.sourcePersonId);
}

function keywordTotalText(keyword) {
  return [
    keyword.summary,
    keyword.description,
    keyword.basicIntro,
    keyword.programRole,
    ...(keyword.programAssociations || []).map((item) => `${item.title || ''} ${item.note || item.body || ''}`),
    ...(keyword.styleNotes || []),
    ...(keyword.methodNotes || []),
    ...(keyword.extensionNotes || []).map((item) => `${item.title || ''} ${item.note || item.body || ''}`)
  ].join('\n');
}

function missingPersonFields(keyword) {
  return REQUIRED_PERSON_FIELDS.filter((field) => {
    const value = keyword[field];
    if (Array.isArray(value)) return value.length === 0;
    return !String(value || '').trim();
  });
}

function hasPersonIdentityAnchor(keyword) {
  const text = keywordTotalText(keyword);
  if (/第\d+任/.test(text)) return true;
  return PERSON_IDENTITY_PATTERN.test(text);
}

function isUnderbuiltPersonKeyword(keyword) {
  if (!isPersonKeyword(keyword)) return false;
  return missingPersonFields(keyword).length > 0
    || !hasPersonIdentityAnchor(keyword)
    || textLength(keywordTotalText(keyword)) < MIN_PERSON_TOTAL_LENGTH;
}

function hasPersonSignalNotes(keyword) {
  return isPersonKeyword(keyword) && Array.isArray(keyword.signalNotes) && keyword.signalNotes.length > 0;
}

function hasWeakPersonSources(keyword) {
  if (!isPersonKeyword(keyword)) return false;
  if (keyword.sourceLimitations?.acceptedSingleSource === true) return false;
  const sources = Array.isArray(keyword.sources) ? keyword.sources : [];
  if (!sources.length) return true;
  if (sources.length < 2) return true;
  const sourceText = `${sources[0]?.title || ''} ${sources[0]?.url || ''}`;
  return sources.some((source) => {
    const sourceText = `${source?.title || ''} ${source?.url || ''}`;
    return WEAK_SOURCE_HOST_PATTERNS.some((pattern) => pattern.test(sourceText));
  });
}

function hasOverSplitSingleEpisodePerson(keyword) {
  if (!isPersonKeyword(keyword)) return false;
  const associations = Array.isArray(keyword.programAssociations) ? keyword.programAssociations : [];
  if (associations.length <= 1) return false;
  const associatedEpisodeIds = new Set();
  for (const association of associations) {
    for (const id of association?.episodes || []) {
      if (/^EP\d{3}$/.test(String(id || '').trim())) associatedEpisodeIds.add(String(id).trim());
    }
  }
  const topLevelEpisodeIds = new Set((keyword.episodes || []).map((episode) => episode?.id).filter(Boolean));
  const uniqueEpisodeCount = associatedEpisodeIds.size || topLevelEpisodeIds.size;
  return uniqueEpisodeCount <= 1;
}

function hasInvalidKind(keyword) {
  return Boolean(keyword.kind) && !VALID_KINDS.has(keyword.kind);
}

function hasMalformedProgramAssociations(keyword) {
  if (!Array.isArray(keyword.programAssociations) || !keyword.programAssociations.length) return false;
  return keyword.programAssociations.some((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return true;
    const title = String(item.title || '').trim();
    const note = String(item.note || item.body || '').trim();
    if (!title || !note) return true;
    if (item.episodes === undefined) return false;
    return !Array.isArray(item.episodes) || item.episodes.some((id) => !/^EP\d{3}$/.test(String(id || '').trim()));
  });
}

function hasMissingProgramAssociationEpisodes(keyword) {
  if (!Array.isArray(keyword.programAssociations) || !keyword.programAssociations.length) return false;
  const topLevelEpisodeIds = new Set((keyword.episodes || []).map((episode) => episode?.id).filter(Boolean));
  for (const association of keyword.programAssociations) {
    for (const rawId of association?.episodes || []) {
      const id = String(rawId || '').trim();
      if (/^EP\d{3}$/.test(id) && !topLevelEpisodeIds.has(id)) return true;
    }
  }
  return false;
}

function hasMalformedSignalNotes(keyword) {
  if (isPersonKeyword(keyword)) return false;
  if (!Array.isArray(keyword.signalNotes) || !keyword.signalNotes.length) return false;
  return keyword.signalNotes.some((item) => typeof item !== 'string' || textLength(item) < 20);
}

function hasMalformedExtensionNotes(keyword) {
  if (!Array.isArray(keyword.extensionNotes) || !keyword.extensionNotes.length) return false;
  return keyword.extensionNotes.some((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return true;
    return !String(item.title || '').trim() || !String(item.note || item.body || '').trim();
  });
}

function controlledKeywordContent(keyword) {
  return [
    keyword.summary,
    keyword.description,
    keyword.basicIntro,
    keyword.programRole,
    ...(keyword.mechanismNotes || []),
    ...(keyword.signalNotes || []),
    ...(keyword.styleNotes || []),
    ...(keyword.methodNotes || []),
    ...(keyword.episodes || []).map((item) => `${item?.id || ''} ${item?.note || ''}`),
    ...(keyword.programAssociations || []).map((item) => `${item?.title || ''} ${item?.note || item?.body || ''}`),
    ...(keyword.extensionNotes || []).map((item) => `${item?.title || ''} ${item?.note || item?.body || ''}`),
    ...(keyword.sources || []).map((item) => `${item?.title || ''} ${item?.note || ''}`)
  ].join('\n');
}

function hasBannedContent(keyword) {
  const text = controlledKeywordContent(keyword);
  return BANNED_CONTENT_PATTERNS.some((pattern) => pattern.test(text));
}

function hasPlaceholderContent(keyword) {
  const text = controlledKeywordContent(keyword);
  return PLACEHOLDER_CONTENT_PATTERNS.some((pattern) => pattern.test(text));
}

function hasTimestampedBodyContent(keyword) {
  const text = controlledKeywordContent(keyword);
  return TIMESTAMPED_BODY_PATTERNS.some((pattern) => pattern.test(text));
}

function episodeRefId(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value.id === 'string') return value.id;
  return '';
}

function compactForAnchor(value) {
  return String(value || '').replace(/\s+/g, '');
}

async function loadEpisodeTextMap() {
  const episodeDir = path.join(rootDir, 'content', 'episodes');
  const map = new Map();
  let entries = [];
  try {
    entries = await fs.readdir(episodeDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return map;
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const filePath = path.join(episodeDir, entry.name);
    const item = JSON.parse(await fs.readFile(filePath, 'utf8'));
    map.set(item.id || entry.name.replace(/\.json$/, ''), compactForAnchor(JSON.stringify(item)));
  }
  return map;
}

function referenceAnchors(item) {
  return uniqueStrings([
    item.id,
    item.sourcePersonId,
    item.name,
    item.englishName,
    ...(item.aliases || [])
  ]).map(compactForAnchor).filter(Boolean);
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

async function newestMtimeInDir(dir) {
  let newest = 0;
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return newest;
    throw error;
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, await newestMtimeInDir(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const stat = await fs.stat(entryPath);
      newest = Math.max(newest, stat.mtimeMs);
    }
  }
  return newest;
}

async function fileMtime(filePath) {
  try {
    return (await fs.stat(filePath)).mtimeMs;
  } catch (error) {
    if (error?.code === 'ENOENT') return 0;
    throw error;
  }
}

async function findSourceIssues(episodeTextMap) {
  const issues = [];
  let entries = [];
  try {
    entries = await fs.readdir(peopleDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return issues;
    throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const filePath = path.join(peopleDir, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const item = JSON.parse(raw);
    if (item.kind && item.kind !== 'person') {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: `non-person-in-people-dir:${item.kind}`
      });
      continue;
    }
    const personItem = { ...item, kind: 'person' };
    if (!item.kind) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: 'person-source-missing-kind'
      });
    }
    const missing = missingPersonFields(personItem);
    if (missing.length) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: `person-source-missing:${missing.join('|')}`
      });
    }
    if (hasPersonSignalNotes(personItem)) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: 'person-source-has-signal-notes'
      });
    }
    if (hasWeakPersonSources(personItem)) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: 'person-source-weak-sources'
      });
    }
    if (hasOverSplitSingleEpisodePerson(personItem)) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: 'person-source-single-episode-over-split'
      });
    }
    if (hasBannedContent(personItem)) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: 'person-source-banned-content'
      });
    }
    if (hasPlaceholderContent(personItem)) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: 'person-source-placeholder-content'
      });
    }
    if (hasTimestampedBodyContent(personItem)) {
      issues.push({
        file: path.relative(rootDir, filePath),
        name: item.name || entry.name,
        reason: 'person-source-timestamped-body'
      });
    }
    const anchors = referenceAnchors(personItem);
    for (const episodeId of (personItem.episodes || []).map(episodeRefId).filter(Boolean)) {
      const episodeText = episodeTextMap.get(episodeId);
      if (episodeText && !anchors.some((anchor) => episodeText.includes(anchor))) {
        issues.push({
          file: path.relative(rootDir, filePath),
          name: item.name || entry.name,
          reason: `person-source-missing-episode-anchor:${episodeId}`
        });
      }
    }
  }
  return issues;
}

const { site, sitePath, siteStat } = await loadSite();
const newestContentMtime = Math.max(
  ...await Promise.all(contentDirs.map(newestMtimeInDir)),
  ...await Promise.all(generatedInputDirs.map(newestMtimeInDir)),
  ...await Promise.all(generatedInputFiles.map(fileMtime))
);
if (newestContentMtime > siteStat.mtimeMs + 1000) {
  console.log(`stale_site_data\t${path.relative(rootDir, sitePath)}\tkeyword-input-newer-than-site-json`);
}

const autoKeywords = (site.keywords || [])
  .filter((keyword) => isAutoKeyword(keyword)
    || isMetaKeyword(keyword)
    || isThinKeyword(keyword)
    || isUnderbuiltPersonKeyword(keyword)
    || hasPersonSignalNotes(keyword)
    || hasWeakPersonSources(keyword)
    || hasOverSplitSingleEpisodePerson(keyword)
    || hasInvalidKind(keyword)
    || hasMalformedProgramAssociations(keyword)
    || hasMissingProgramAssociationEpisodes(keyword)
    || hasMalformedSignalNotes(keyword)
    || hasMalformedExtensionNotes(keyword)
    || hasBannedContent(keyword)
    || hasPlaceholderContent(keyword)
    || hasTimestampedBodyContent(keyword))
  .sort((a, b) => (a.episodes?.[0]?.id || '').localeCompare(b.episodes?.[0]?.id || '') || a.name.localeCompare(b.name, 'zh-Hans-CN'));

console.log(`remaining_auto_keywords\t${autoKeywords.length}`);
for (const keyword of autoKeywords) {
  const anchor = keyword.episodes?.[0]?.id || '-';
  const reasons = [];
  if (isAutoKeyword(keyword)) reasons.push('auto');
  if (isMetaKeyword(keyword)) reasons.push('meta');
  if (isThinKeyword(keyword)) reasons.push('thin');
  if (isUnderbuiltPersonKeyword(keyword)) {
    const missing = missingPersonFields(keyword);
    reasons.push(missing.length ? `person-missing:${missing.join('|')}` : 'person-underbuilt');
  }
  if (hasPersonSignalNotes(keyword)) reasons.push('person-has-signal-notes');
  if (hasWeakPersonSources(keyword)) reasons.push('weak-person-sources');
  if (hasOverSplitSingleEpisodePerson(keyword)) reasons.push('single-episode-person-over-split');
  if (hasInvalidKind(keyword)) reasons.push(`invalid-kind:${keyword.kind}`);
  if (hasMalformedProgramAssociations(keyword)) reasons.push('bad-program-associations');
  if (hasMissingProgramAssociationEpisodes(keyword)) reasons.push('missing-program-association-episodes');
  if (hasMalformedSignalNotes(keyword)) reasons.push('bad-signal-notes');
  if (hasMalformedExtensionNotes(keyword)) reasons.push('bad-extension-notes');
  if (hasBannedContent(keyword)) reasons.push('banned-content');
  if (hasPlaceholderContent(keyword)) reasons.push('placeholder-content');
  if (hasTimestampedBodyContent(keyword)) reasons.push('timestamped-body');
  console.log(`${anchor}\t${keyword.name}\t${reasons.join(',')}`);
}

const episodeTextMap = await loadEpisodeTextMap();
const sourceIssues = await findSourceIssues(episodeTextMap);
if (sourceIssues.length) {
  console.log(`source_issues\t${sourceIssues.length}`);
  for (const issue of sourceIssues) {
    console.log(`SOURCE\t${issue.file}\t${issue.name}\t${issue.reason}`);
  }
}
