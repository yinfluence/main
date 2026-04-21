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

function makeAutoKeywordSummary(name) {
  return `围绕${name}的节目群入口，用来串联相关案例、争议和延伸讨论。`;
}

function makeAutoKeywordDescription(name) {
  return `${name}是从节目标签自动沉淀出来的关键词入口。这个页面用于把分散在不同节目里的相关讨论收拢到一起，方便顺着同一主题继续追踪。`;
}

const KEYWORD_PARENT_RULES = {
  'real-estate': ['房价', '地产', '房产知识', '万科', '王石', '郁亮', '碧桂园', '许家印', '深圳地铁', '法拍房', '房票', '地价'],
  'japan': ['高市早苗', '安倍'],
  'singapore': ['黄循财', '李显龙', '维文', '组屋'],
  'new-energy-vehicles': ['新能源', '电车', '小米汽车', '雷军', '比亚迪', '王传福', '理想汽车', '李想', '锂电池', '换电'],
  'wahaha': ['宗馥莉', '宗庆后', '哇哈哈'],
  'xiaomi-auto': ['杂粮汽车', '杂粮', '雷军'],
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
          summary: makeAutoKeywordSummary(tag),
          description: makeAutoKeywordDescription(tag),
          aliases: [],
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
    keyword.summary = makeAutoKeywordSummary(keyword.name);
  }

  return [...keywords.values()];
}

function mergeKeywordCatalog(autoKeywords, curatedKeywords) {
  const autoByKey = new Map(autoKeywords.map((keyword) => [canonicalText(keyword.name), keyword]));
  const merged = [];

  for (const keyword of curatedKeywords) {
    const matchKeys = uniqueList([keyword.name, ...(keyword.aliases || [])]).map(canonicalText);
    const matchedAutos = matchKeys
      .map((key) => autoByKey.get(key))
      .filter(Boolean);
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

async function buildIndexHtml(versionTag) {
  const template = await fs.readFile(path.join(srcDir, 'index.html'), 'utf8');
  return template
    .replace('__BUILD_VERSION_VALUE__', String(versionTag))
    .replace('./assets/style.css', `./assets/style.css?v=${versionTag}`)
    .replace('./assets/app.js', `./assets/app.js?v=${versionTag}`);
}

async function build() {
  const [episodes, concepts, models, people, themes, keywords, rawCatalog] = await Promise.all([
    readJsonDir(path.join(contentDir, 'episodes')),
    readJsonDir(path.join(contentDir, 'concepts')),
    readJsonDir(path.join(contentDir, 'models')),
    readJsonDir(path.join(contentDir, 'people')),
    readJsonDir(path.join(contentDir, 'themes')),
    readJsonDir(path.join(contentDir, 'keywords')),
    buildEpisodeCatalog()
  ]);
  const mergedEpisodes = mergeEpisodeCatalog(rawCatalog, episodes);
  const mergedKeywords = applyKeywordParents(mergeKeywordCatalog(buildKeywordCatalog(mergedEpisodes), keywords));
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
    fs.writeFile(path.join(dataDir, 'site.json'), siteJson, 'utf8'),
    fs.writeFile(path.join(dataDir, 'graph.json'), graphJson, 'utf8'),
    fs.writeFile(path.join(docsDir, 'index.html'), indexHtml, 'utf8'),
    copyFile(path.join(srcDir, 'app.js'), path.join(docsAssetsDir, 'app.js')),
    copyFile(path.join(srcDir, 'graph-view.js'), path.join(docsAssetsDir, 'graph-view.js')),
    copyFile(path.join(srcDir, 'style.css'), path.join(docsAssetsDir, 'style.css')),
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
