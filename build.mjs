import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, 'content');
const distDir = path.join(__dirname, 'dist');
const docsDir = path.join(__dirname, 'docs');
const assetsDir = path.join(distDir, 'assets');
const dataDir = path.join(distDir, 'data');
const docsAssetsDir = path.join(docsDir, 'assets');
const docsDataDir = path.join(docsDir, 'data');
const srcDir = path.join(__dirname, 'src');
const rawDir = path.resolve(__dirname, '../bilibili/raw');
const keywordDefinitionsPath = path.join(__dirname, 'scripts/keyword-definitions.json');
const keywordDefinitionsDir = path.join(__dirname, 'scripts/keyword-definitions.d');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJsonDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
  const values = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file.name), 'utf8');
    values.push(JSON.parse(raw));
  }
  return values;
}

async function readKeywordDefinitions() {
  const merged = JSON.parse(await fs.readFile(keywordDefinitionsPath, 'utf8').catch(() => '{}'));

  let shardEntries = [];
  try {
    shardEntries = await fs.readdir(keywordDefinitionsDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const shardFiles = shardEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  for (const file of shardFiles) {
    const shard = JSON.parse(await fs.readFile(path.join(keywordDefinitionsDir, file), 'utf8'));
    Object.assign(merged, shard);
  }

  return merged;
}

async function buildEpisodeCatalog() {
  let entries = [];
  try {
    entries = await fs.readdir(rawDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return [];
  }

  const episodes = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!(entry.name.endsWith('.srt') || entry.name.endsWith('.md'))) continue;

    const match = entry.name.match(/^\[(EP\d{3})】\s*(.+)\.(srt|md)$/);
    if (!match) continue;

    const [, id, title] = match;
    if (!episodes.has(id)) {
      episodes.set(id, {
        id,
        title,
        summary: '待整理',
        curated: false,
        sourceFile: entry.name
      });
    }
  }

  return [...episodes.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function canonicalText(value) {
  return String(value || '').trim().toLowerCase();
}

function compactText(value) {
  return canonicalText(value).replace(/[\s·•・／/\\()（）\-—_]+/g, '');
}

function uniqueList(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function buildReferenceMap(items) {
  const index = new Map();

  for (const item of items) {
    for (const alias of uniqueList([item.id, item.name, ...(item.aliases || [])])) {
      const key = compactText(alias);
      if (key && !index.has(key)) {
        index.set(key, item);
      }
    }
  }

  return index;
}

function resolveKeywordDefinitionFromCollection(keyword, refMap, type) {
  const found = refMap.get(compactText(keyword.name));
  if (!found) return null;
  if (type === 'people') {
    return {
      summary: found.summary || `${keyword.name}是节目里反复出现的人物。`,
      description: found.description || found.summary || ''
    };
  }
  if (type === 'concepts') {
    return {
      summary: found.summary || `${keyword.name}是节目里反复出现的概念。`,
      description: found.definition || found.description || found.summary || ''
    };
  }
  if (type === 'models') {
    return {
      summary: found.summary || `${keyword.name}是节目里反复出现的模型。`,
      description: found.definition || found.application || found.summary || ''
    };
  }
  if (type === 'themes') {
    return {
      summary: found.summary || `${keyword.name}是节目里反复出现的主题。`,
      description: found.description || found.summary || ''
    };
  }
  return {
    summary: found.summary || `${keyword.name}是节目里反复出现的讨论对象。`,
    description: found.description || found.definition || found.summary || ''
  };
}

function trimSentence(value, max = 120) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function firstSentence(value, max = 72) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const [sentence] = text.split(/[。！？]/).map((item) => item.trim()).filter(Boolean);
  return trimSentence(sentence || text, max);
}

function keywordAnchor(keyword) {
  const [anchor] = keyword.episodes || [];
  if (!anchor) return null;

  const focus = firstSentence(
    String(anchor.note || '')
      .replace(/^本期(?:从|把|围绕)?/, '')
      .replace(/^节目(?:认为|指出|强调|提到|把)?/, '')
      .trim(),
    64
  );

  return {
    id: anchor.id,
    focus
  };
}

function inferKeywordKind(name) {
  const text = String(name || '').trim();
  if (/战争|危机|事件|大选|起火|事故|改革|竞赛|之争|风波|热梗|午餐|封关|兵役|竞逐|变局/.test(text)) {
    return 'event';
  }
  if (/海峡|航线|国家|地区|东南亚|欧洲|美国|日本|伊朗|俄罗斯|新加坡|马来西亚|越南|匈牙利|台湾|海南|中国/.test(text)) {
    return 'geography';
  }
  if (/汽车|集团|公司|医院|大学|学校|平台|品牌|基金|电池|保险公司|白酒|黄金|白银/.test(text)) {
    return 'entity';
  }
  if (/主义|逻辑|答案|平衡|归宗|故乡|基线|分层|风险|自由|时机|权威|秩序|模型|思维|修宪|政治|公平|关系|教育|家风|契约|成长|焦虑|服从|谎言/.test(text)) {
    return 'concept';
  }
  return 'general';
}

function makeAutoKeywordSummary(keyword, definitions = {}, inheritMaps = {}) {
  const defined = definitions[keyword.name];
  if (defined?.summary) return defined.summary;
  for (const [type, refMap] of Object.entries(inheritMaps)) {
    const inherited = resolveKeywordDefinitionFromCollection(keyword, refMap, type);
    if (inherited?.summary) return inherited.summary;
  }
  const anchor = keywordAnchor(keyword);
  switch (inferKeywordKind(keyword.name)) {
    case 'event':
      return `${keyword.name}主要指围绕该事件、历史节点或现实冲突展开的讨论。`;
    case 'geography':
      return `${keyword.name}主要指围绕这一国家、地区或地缘节点展开的讨论。`;
    case 'entity':
      return `${keyword.name}主要作为具体对象关键词出现，用来承接与其直接相关的讨论。`;
    case 'concept':
      return `${keyword.name}主要指围绕这一判断、现象或说法展开的讨论。`;
    default:
      return `${keyword.name}是本期节目里单独展开的一项对象或说法。`;
  }
}

function makeAutoKeywordDescription(keyword, definitions = {}, inheritMaps = {}) {
  const defined = definitions[keyword.name];
  if (defined?.description) return defined.description;
  for (const [type, refMap] of Object.entries(inheritMaps)) {
    const inherited = resolveKeywordDefinitionFromCollection(keyword, refMap, type);
    if (inherited?.description) return inherited.description;
  }
  const refs = keyword.episodes || [];
  const recurring = refs.length > 1 ? '当它在多期节目里反复出现时，通常也会牵连出一组相近的问题意识。' : '';
  const anchor = keywordAnchor(keyword);
  const anchored = anchor?.id
    ? `在 ${anchor.id} 这期里${anchor.focus ? `，这个词更多指向${anchor.focus}` : ''}。`
    : '';

  switch (inferKeywordKind(keyword.name)) {
    case 'event':
      return `${keyword.name}通常不是一条孤立新闻，而是被拿来承接与该事件相关的成因、后果和延伸判断。\n\n${anchored}${recurring}`.trim();
    case 'geography':
      return `${keyword.name}在这里不只是地理名称，还承接与其相关的政治、经济、社会或地缘判断。\n\n${anchored}${recurring}`.trim();
    case 'entity':
      return `${keyword.name}在这里通常指向一个具体机构、品牌、产品或组织，也用来承接围绕它展开的现实问题和结构判断。\n\n${anchored}${recurring}`.trim();
    case 'concept':
      return `${keyword.name}在这里通常不是随手一提的标签，而是用来承接围绕这一概念、判断或说法展开的讨论。\n\n${anchored}${recurring}`.trim();
    default:
      return `${keyword.name}当前还没有形成更成熟的专题定义，但在这期节目里也不是随手一提的零散标签。\n\n${anchored}${recurring}`.trim();
  }
}

const KEYWORD_PARENT_RULES = {
  'real-estate': ['房价', '地产', '房产知识', '万科', '王石', '郁亮', '碧桂园', '许家印', '深圳地铁', '法拍房', '房票', '地价'],
  'japan': ['高市早苗', '安倍'],
  'singapore': ['黄循财', '李显龙', '维文', '组屋'],
  'new-energy-vehicles': ['新能源', '电车', '小米汽车', '雷军', '比亚迪', '王传福', '理想汽车', '李想', '锂电池', '换电'],
  'wahaha': ['宗馥莉', '宗庆后', '哇哈哈'],
  'xiaomi-qiche': ['杂粮汽车', '杂粮', '雷军'],
  'xibei': ['贾国龙', '华与华', '罗永浩', '预制菜'],
  'usa': ['特朗普'],
  'iran': ['哈梅内伊', '玛莎·阿米尼'],
  'russia': ['普京']
};

function buildKeywordCatalog(episodes) {
  const keywords = new Map();

  for (const episode of episodes) {
    for (const tag of episode.tags || []) {
      const key = canonicalText(tag);
      if (!key) continue;

      if (!keywords.has(key)) {
        keywords.set(key, {
          id: tag,
          name: tag,
          summary: '',
          description: '',
          aliases: [],
          relatedKeywords: [],
          episodes: []
        });
      }

      const keyword = keywords.get(key);
      keyword.episodes.push({
        id: episode.id,
        note: episode.summary || `${episode.id} 提到了 ${tag}`
      });
    }
  }

  for (const keyword of keywords.values()) {
    keyword.episodes.sort((a, b) => a.id.localeCompare(b.id));
  }

  return [...keywords.values()];
}

function buildPeopleKeywordCatalog(people) {
  return people.map((person) => ({
    id: person.name,
    name: person.name,
    entryType: 'person',
    sourcePersonId: person.id,
    summary: person.summary || `${person.name}是节目里反复出现的人物。`,
    description: person.description || person.summary || '',
    englishName: person.englishName || '',
    aliases: uniqueList([
      person.id,
      person.englishName,
      ...(person.aliases || [])
    ]),
    relatedKeywords: [],
    episodes: [...(person.episodes || [])].sort((a, b) => a.id.localeCompare(b.id))
  }));
}

function mergeKeywordCatalog(autoKeywords, curatedKeywords) {
  const autoByKey = new Map(autoKeywords.map((keyword) => [canonicalText(keyword.name), keyword]));
  const merged = [];

  for (const keyword of curatedKeywords) {
    const directMatch = autoByKey.get(canonicalText(keyword.name));
    const aliasMatches = uniqueList(keyword.aliases || [])
      .map(canonicalText)
      .map((key) => autoByKey.get(key))
      .filter((candidate) => candidate && candidate.entryType !== 'person');
    const matchedAutos = uniqueList([directMatch, ...aliasMatches]).filter(Boolean);
    const base = matchedAutos[0];

    for (const matched of matchedAutos) {
      autoByKey.delete(canonicalText(matched.name));
    }

    const curatedEpisodes = keyword.episodes || [];
    const episodeMap = new Map(
      matchedAutos
        .flatMap((entry) => entry.episodes || [])
        .map((entry) => [entry.id, entry])
    );

    for (const entry of curatedEpisodes) {
      episodeMap.set(entry.id, {
        ...episodeMap.get(entry.id),
        ...entry
      });
    }

    merged.push({
      ...base,
      ...keyword,
      aliases: uniqueList([
        ...matchedAutos.flatMap((entry) => entry.aliases || []),
        ...(keyword.aliases || [])
      ]),
      relatedKeywords: uniqueList([
        ...matchedAutos.flatMap((entry) => entry.relatedKeywords || []),
        ...(keyword.relatedKeywords || [])
      ]),
      episodes: [...episodeMap.values()].sort((a, b) => a.id.localeCompare(b.id))
    });
  }

  for (const keyword of autoByKey.values()) {
    merged.push(keyword);
  }

  return merged.sort((a, b) => {
    const countDiff = (b.episodes?.length || 0) - (a.episodes?.length || 0);
    if (countDiff) return countDiff;
    return a.name.localeCompare(b.name, 'zh-Hans-CN');
  });
}

function applyKeywordParents(keywords) {
  const byId = new Map(keywords.map((keyword) => [keyword.id, keyword]));
  const byName = new Map(keywords.map((keyword) => [canonicalText(keyword.name), keyword]));

  for (const keyword of keywords) {
    const existingParents = keyword.parents || [];
    const parentIds = new Set(existingParents);

    for (const [parentId, children] of Object.entries(KEYWORD_PARENT_RULES)) {
      if (keyword.id === parentId) continue;
      const parent = byId.get(parentId);
      if (!parent) continue;

      const matchPool = uniqueList([keyword.name, ...(keyword.aliases || [])]).map(canonicalText);
      const childMatches = children.map(canonicalText);
      const matched = matchPool.some((item) => childMatches.includes(item));
      if (matched) {
        parentIds.add(parentId);
      }
    }

    keyword.parents = [...parentIds]
      .map((parentId) => byId.get(parentId) || byName.get(canonicalText(parentId)))
      .filter(Boolean)
      .map((parent) => parent.id);
  }

  return keywords;
}

function resolveKeywordReference(refMap, value) {
  return refMap.get(canonicalText(value)) || null;
}

function applyKeywordRelations(keywords) {
  const refMap = new Map();
  const childMap = new Map();
  const manualRelationMap = new Map();
  const episodeIdMap = new Map();

  for (const keyword of keywords) {
    for (const ref of uniqueList([keyword.id, keyword.name, ...(keyword.aliases || [])])) {
      const key = canonicalText(ref);
      if (key && !refMap.has(key)) {
        refMap.set(key, keyword);
      }
    }
    episodeIdMap.set(
      keyword.id,
      new Set((keyword.episodes || []).map((entry) => entry.id).filter(Boolean))
    );
  }

  for (const keyword of keywords) {
    for (const relatedValue of keyword.relatedKeywords || []) {
      const target = resolveKeywordReference(refMap, relatedValue);
      if (!target || target.id === keyword.id) continue;
      if (!manualRelationMap.has(keyword.id)) manualRelationMap.set(keyword.id, new Set());
      if (!manualRelationMap.has(target.id)) manualRelationMap.set(target.id, new Set());
      manualRelationMap.get(keyword.id).add(target.id);
      manualRelationMap.get(target.id).add(keyword.id);
    }
  }

  for (const keyword of keywords) {
    for (const parentId of keyword.parents || []) {
      if (!childMap.has(parentId)) childMap.set(parentId, []);
      childMap.get(parentId).push(keyword.id);
    }
  }

  for (const keyword of keywords) {
    const relatedScores = new Map();
    const keywordPool = uniqueList([keyword.name, ...(keyword.aliases || [])])
      .map(compactText)
      .filter((value) => value.length >= 2);
    const keywordEpisodes = episodeIdMap.get(keyword.id) || new Set();

    const addRelatedScore = (targetId, score) => {
      if (!targetId || targetId === keyword.id) return;
      relatedScores.set(targetId, Math.max(relatedScores.get(targetId) || 0, score));
    };

    for (const parentId of keyword.parents || []) {
      addRelatedScore(parentId, 90);
    }

    for (const childId of childMap.get(keyword.id) || []) {
      addRelatedScore(childId, 90);
    }

    for (const relatedId of manualRelationMap.get(keyword.id) || []) {
      addRelatedScore(relatedId, 100);
    }

    for (const other of keywords) {
      if (other.id === keyword.id) continue;

      const otherPool = uniqueList([other.name, ...(other.aliases || [])])
        .map(compactText)
        .filter((value) => value.length >= 2);
      const otherEpisodes = episodeIdMap.get(other.id) || new Set();

      const lexicalMatch = keywordPool.some((left) => otherPool.some((right) => (
        left === right ||
        (left.length >= 2 && right.length >= 2 && (left.includes(right) || right.includes(left)))
      )));
      let overlapCount = 0;
      for (const episodeId of keywordEpisodes) {
        if (otherEpisodes.has(episodeId)) overlapCount += 1;
      }
      const unionCount = new Set([...keywordEpisodes, ...otherEpisodes]).size || 1;
      const jaccard = overlapCount / unionCount;

      if (lexicalMatch) {
        addRelatedScore(other.id, 70);
      }

      if (overlapCount >= 2) {
        addRelatedScore(other.id, 50 + overlapCount * 8 + jaccard * 20);
      } else if (overlapCount >= 1 && jaccard >= 0.34) {
        addRelatedScore(other.id, 42 + jaccard * 20);
      }

      if (keyword.entryType === 'person' && overlapCount >= 1 && jaccard >= 0.2) {
        addRelatedScore(other.id, 38 + jaccard * 18);
      }

      if (other.entryType === 'person' && overlapCount >= 1 && jaccard >= 0.2) {
        addRelatedScore(other.id, 38 + jaccard * 18);
      }
    }

    keyword.relatedKeywords = [...relatedScores.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'))
      .slice(0, 12)
      .map(([id]) => resolveKeywordReference(refMap, id))
      .filter(Boolean)
      .map((entry) => entry.id)
      .filter((id, index, list) => list.indexOf(id) === index);
  }

  return keywords;
}

function mergeEpisodeCatalog(catalog, curatedEpisodes) {
  const byId = new Map(catalog.map((episode) => [episode.id, episode]));
  for (const episode of curatedEpisodes) {
    const base = byId.get(episode.id) || { id: episode.id, title: episode.title };
    const status = episode.status || 'curated';
    byId.set(episode.id, {
      ...base,
      ...episode,
      status,
      curated: status === 'curated'
    });
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function buildGraphData({ episodes, concepts, models, people, themes }) {
  const routePrefix = {
    episode: 'episodes',
    concept: 'concepts',
    model: 'models',
    person: 'people',
    theme: 'themes'
  };
  const graphNodes = new Map();
  const graphLinks = new Map();
  const degreeMap = new Map();
  const peopleByRef = buildReferenceMap(people);
  const themesByRef = buildReferenceMap(themes);

  function makeNodeId(type, key) {
    return `${type}:${key}`;
  }

  function registerNode(type, item, options = {}) {
    const graphId = makeNodeId(type, item.id);
    graphNodes.set(graphId, {
      id: graphId,
      key: item.id,
      label: options.label || item.name || item.title || item.id,
      fullLabel: options.fullLabel || item.title || item.name || item.id,
      type,
      route: `${routePrefix[type]}/${item.id}`,
      summary: options.summary || item.summary || item.definition || '',
      status: options.status || null,
      degree: 0
    });
  }

  function registerLink(sourceId, targetId, kind) {
    if (!graphNodes.has(sourceId) || !graphNodes.has(targetId) || sourceId === targetId) return;
    const [left, right] = [sourceId, targetId].sort();
    const linkId = `${left}|${right}|${kind}`;
    if (graphLinks.has(linkId)) return;
    graphLinks.set(linkId, {
      source: sourceId,
      target: targetId,
      kind
    });
  }

  function bumpDegree(nodeId) {
    degreeMap.set(nodeId, (degreeMap.get(nodeId) || 0) + 1);
  }

  function resolveEpisodeNode(episodeId) {
    return graphNodes.get(makeNodeId('episode', episodeId));
  }

  function resolveNodeByType(type, key) {
    return graphNodes.get(makeNodeId(type, key));
  }

  for (const episode of episodes) {
    registerNode('episode', episode, {
      label: episode.id,
      fullLabel: `${episode.id} · ${episode.title}`,
      summary: episode.summary,
      status: episode.status || (episode.curated ? 'curated' : 'draft')
    });
  }

  for (const concept of concepts) {
    registerNode('concept', concept, { summary: concept.summary });
  }

  for (const model of models) {
    registerNode('model', model, { summary: model.summary });
  }

  for (const person of people) {
    registerNode('person', person, { summary: person.summary });
  }

  for (const theme of themes) {
    registerNode('theme', theme, { summary: theme.summary });
  }

  for (const episode of episodes) {
    const episodeNodeId = makeNodeId('episode', episode.id);

    for (const conceptId of episode.concepts || []) {
      registerLink(episodeNodeId, makeNodeId('concept', conceptId), 'episode-concept');
    }

    for (const modelId of episode.models || []) {
      registerLink(episodeNodeId, makeNodeId('model', modelId), 'episode-model');
    }

    for (const personName of episode.people || []) {
      const person = peopleByRef.get(compactText(personName));
      if (person) {
        registerLink(episodeNodeId, makeNodeId('person', person.id), 'episode-person');
      }
    }

    for (const themeName of episode.themes || []) {
      const theme = themesByRef.get(compactText(themeName));
      if (theme) {
        registerLink(episodeNodeId, makeNodeId('theme', theme.id), 'episode-theme');
      }
    }
  }

  for (const concept of concepts) {
    for (const episodeRef of concept.episodes || []) {
      const episodeNode = resolveEpisodeNode(episodeRef.id);
      const conceptNode = resolveNodeByType('concept', concept.id);
      if (episodeNode && conceptNode) {
        registerLink(episodeNode.id, conceptNode.id, 'episode-concept');
      }
    }
  }

  for (const model of models) {
    for (const episodeRef of model.episodes || []) {
      const episodeNode = resolveEpisodeNode(episodeRef.id);
      const modelNode = resolveNodeByType('model', model.id);
      if (episodeNode && modelNode) {
        registerLink(episodeNode.id, modelNode.id, 'episode-model');
      }
    }
  }

  for (const person of people) {
    for (const episodeRef of person.episodes || []) {
      const episodeNode = resolveEpisodeNode(episodeRef.id);
      const personNode = resolveNodeByType('person', person.id);
      if (episodeNode && personNode) {
        registerLink(episodeNode.id, personNode.id, 'episode-person');
      }
    }
  }

  for (const theme of themes) {
    for (const episodeRef of theme.episodes || []) {
      const episodeNode = resolveEpisodeNode(episodeRef.id);
      const themeNode = resolveNodeByType('theme', theme.id);
      if (episodeNode && themeNode) {
        registerLink(episodeNode.id, themeNode.id, 'episode-theme');
      }
    }
  }

  for (const link of graphLinks.values()) {
    bumpDegree(link.source);
    bumpDegree(link.target);
  }

  const nodes = [...graphNodes.values()]
    .map((node) => ({
      ...node,
      degree: degreeMap.get(node.id) || 0
    }))
    .sort((a, b) => {
      const degreeDiff = b.degree - a.degree;
      if (degreeDiff) return degreeDiff;
      return a.label.localeCompare(b.label, 'zh-Hans-CN');
    });

  const links = [...graphLinks.values()];
  const typeCounts = nodes.reduce((counts, node) => {
    counts[node.type] = (counts[node.type] || 0) + 1;
    return counts;
  }, {});

  return {
    meta: {
      title: '颖响力知识图谱',
      subtitle: '节目、概念、模型、人物、主题之间的可视化连接网络',
      nodeCount: nodes.length,
      linkCount: links.length,
      typeCounts
    },
    nodes,
    links
  };
}

async function copyFile(from, to) {
  await fs.copyFile(from, to);
}

async function copyFileIfPresent(from, to) {
  try {
    await fs.copyFile(from, to);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      console.warn(`Skipped missing asset: ${from}`);
      return;
    }
    throw error;
  }
}

async function buildIndexHtml(versionTag) {
  const template = await fs.readFile(path.join(srcDir, 'index.html'), 'utf8');
  return template
    .replace('__BUILD_VERSION_VALUE__', String(versionTag))
    .replace('./assets/style.css', `./assets/style.css?v=${versionTag}`)
    .replace('./assets/app.js', `./assets/app.js?v=${versionTag}`)
    .replace('./assets/yinfluence-avatar.png', `./assets/yinfluence-avatar.png?v=${versionTag}`);
}

async function build() {
  const [episodes, concepts, models, people, themes, keywords, rawCatalog, keywordDefinitions] = await Promise.all([
    readJsonDir(path.join(contentDir, 'episodes')),
    readJsonDir(path.join(contentDir, 'concepts')),
    readJsonDir(path.join(contentDir, 'models')),
    readJsonDir(path.join(contentDir, 'people')),
    readJsonDir(path.join(contentDir, 'themes')),
    readJsonDir(path.join(contentDir, 'keywords')),
    buildEpisodeCatalog(),
    readKeywordDefinitions()
  ]);
  const inheritMaps = {
    people: buildReferenceMap(people),
    concepts: buildReferenceMap(concepts),
    models: buildReferenceMap(models),
    themes: buildReferenceMap(themes)
  };
  const mergedEpisodes = mergeEpisodeCatalog(rawCatalog, episodes);
  const peopleKeywords = buildPeopleKeywordCatalog(people);
  const mergedKeywords = applyKeywordRelations(
    applyKeywordParents(
      mergeKeywordCatalog(
        mergeKeywordCatalog(buildKeywordCatalog(mergedEpisodes), peopleKeywords),
        keywords
      ).map((keyword) => ({
        ...keyword,
        summary: keywordDefinitions[keyword.name]?.summary || keyword.summary || makeAutoKeywordSummary(keyword, keywordDefinitions, inheritMaps),
        description: keywordDefinitions[keyword.name]?.description || keyword.description || makeAutoKeywordDescription(keyword, keywordDefinitions, inheritMaps)
      }))
    )
  );
  const graph = buildGraphData({
    episodes: mergedEpisodes,
    concepts,
    models,
    people,
    themes
  });
  const site = {
    meta: {
      title: '颖响力知识库',
      subtitle: '节目、概念、思想模型的结构化索引',
      updatedAt: new Date().toISOString()
    },
    stats: {
      episodes: mergedEpisodes.length,
      curatedEpisodes: mergedEpisodes.filter((episode) => episode.curated).length,
      draftEpisodes: mergedEpisodes.filter((episode) => episode.status === 'draft').length,
      concepts: concepts.length,
      models: models.length,
      people: people.length,
      themes: themes.length,
      keywords: mergedKeywords.length
    },
    episodes: mergedEpisodes,
    concepts: concepts.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
    models: models.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
    people: people.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
    themes: themes.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')),
    keywords: mergedKeywords
  };

  await Promise.all([
    ensureDir(assetsDir),
    ensureDir(dataDir),
    ensureDir(docsAssetsDir),
    ensureDir(docsDataDir)
  ]);
  const assetVersion = Date.now();
  const indexHtml = await buildIndexHtml(assetVersion);
  const siteJson = JSON.stringify(site, null, 2);
  const graphJson = JSON.stringify(graph, null, 2);

  await Promise.all([
    fs.writeFile(path.join(distDir, 'index.html'), indexHtml, 'utf8'),
    copyFile(path.join(srcDir, 'app.js'), path.join(assetsDir, 'app.js')),
    copyFile(path.join(srcDir, 'graph-view.js'), path.join(assetsDir, 'graph-view.js')),
    copyFile(path.join(srcDir, 'style.css'), path.join(assetsDir, 'style.css')),
    copyFileIfPresent(path.join(srcDir, 'assets', 'yinfluence-avatar.png'), path.join(assetsDir, 'yinfluence-avatar.png')),
    fs.writeFile(path.join(dataDir, 'site.json'), siteJson, 'utf8'),
    fs.writeFile(path.join(dataDir, 'graph.json'), graphJson, 'utf8'),
    fs.writeFile(path.join(docsDir, 'index.html'), indexHtml, 'utf8'),
    copyFile(path.join(srcDir, 'app.js'), path.join(docsAssetsDir, 'app.js')),
    copyFile(path.join(srcDir, 'graph-view.js'), path.join(docsAssetsDir, 'graph-view.js')),
    copyFile(path.join(srcDir, 'style.css'), path.join(docsAssetsDir, 'style.css')),
    copyFileIfPresent(path.join(srcDir, 'assets', 'yinfluence-avatar.png'), path.join(docsAssetsDir, 'yinfluence-avatar.png')),
    fs.writeFile(path.join(docsDataDir, 'site.json'), siteJson, 'utf8'),
    fs.writeFile(path.join(docsDataDir, 'graph.json'), graphJson, 'utf8')
  ]);

  console.log(`Built ${site.meta.title}`);
  console.log(`Episodes: ${site.stats.episodes}`);
  console.log(`Curated episodes: ${site.stats.curatedEpisodes}`);
  console.log(`Draft episodes: ${site.stats.draftEpisodes}`);
  console.log(`Concepts: ${site.stats.concepts}`);
  console.log(`Models: ${site.stats.models}`);
  console.log(`People: ${site.stats.people}`);
  console.log(`Themes: ${site.stats.themes}`);
  console.log(`Keywords: ${site.stats.keywords}`);
  console.log(`Graph nodes: ${graph.meta.nodeCount}`);
  console.log(`Graph links: ${graph.meta.linkCount}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
