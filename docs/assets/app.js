import { destroyGraphView, renderGraphView } from './graph-view.js';

const app = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const sidebarBody = document.getElementById('sidebar-body');
const menuButton = document.getElementById('menu-button');
const sidebarClose = document.getElementById('sidebar-close');

let site = null;
let graphData = null;
let homeKnowledgeQuery = '';
let sidebarKeywordQuery = '';
let keywordIndexQuery = '';
let episodeIndexQuery = '';
let episodeIndexRangeStart = 0;
let conceptIndexQuery = '';
let modelIndexQuery = '';
let peopleIndexQuery = '';
let themeIndexQuery = '';

function openSidebar() {
  sidebar.classList.add('open');
  document.body.classList.add('sidebar-open');
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = false;
  }
}

function closeSidebar() {
  sidebar.classList.remove('open');
  document.body.classList.remove('sidebar-open');
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = true;
  }
}

menuButton.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarBackdrop?.addEventListener('click', closeSidebar);
window.addEventListener('hashchange', renderRoute);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSidebar();
  }
});
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-nav-back]');
  if (!trigger) return;
  event.preventDefault();
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.hash = '#/';
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function routeTo(path) {
  const encodedPath = String(path || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `#/${encodedPath}`;
}

function dataUrl(file) {
  const version = window.__BUILD_VERSION__;
  return version ? `./data/${file}?v=${encodeURIComponent(version)}` : `./data/${file}`;
}

function episodeById(id) {
  return site?.episodes?.find((episode) => episode.id === id) || null;
}

function renderLinkedEpisodeText(value) {
  const raw = String(value || '');
  if (!raw) return '';

  let cursor = 0;
  let html = '';

  raw.replace(/\bEP\d{3}\b/g, (match, offset) => {
    html += escapeHtml(raw.slice(cursor, offset));
    const episode = episodeById(match);
    html += episode
      ? `<span class="inline-episode-ref"><a class="inline-episode-link" href="${routeTo(`episodes/${match}`)}">${escapeHtml(match)}</a><span class="inline-episode-popup"><strong>${escapeHtml(match)}｜${escapeHtml(episode.title)}</strong><span>${escapeHtml(episode.summary || '')}</span></span></span>`
      : escapeHtml(match);
    cursor = offset + match.length;
    return match;
  });

  html += escapeHtml(raw.slice(cursor));
  return html;
}

function graphStatValue() {
  return graphData?.meta?.nodeCount || 0;
}

function chipList(items = []) {
  if (!items.length) return '';
  return `<div class="chip-row">${items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('')}</div>`;
}

function keywordCount(keyword) {
  return keyword.episodes?.length || 0;
}

function referenceCount(item) {
  return item.episodes?.length || 0;
}

function episodeNumberFromId(id) {
  const match = String(id || '').match(/EP(\d+)/i);
  return match ? Number(match[1]) : null;
}

function parseChineseEpisodeNumber(raw) {
  const text = String(raw || '')
    .replace(/[第集期回]/g, '')
    .trim();
  if (!text) return NaN;

  const digitMap = {
    '零': 0,
    '〇': 0,
    '一': 1,
    '二': 2,
    '两': 2,
    '三': 3,
    '四': 4,
    '五': 5,
    '六': 6,
    '七': 7,
    '八': 8,
    '九': 9
  };
  const unitMap = {
    '十': 10,
    '百': 100
  };

  let total = 0;
  let current = 0;

  for (const char of text) {
    if (char in digitMap) {
      current = digitMap[char];
      continue;
    }
    if (char in unitMap) {
      const unit = unitMap[char];
      total += (current || 1) * unit;
      current = 0;
      continue;
    }
    return NaN;
  }

  return total + current;
}

function normalizeEpisodeIdQuery(query) {
  const compact = String(query || '').trim().toUpperCase().replace(/\s+/g, '');
  const digitMatch = compact.match(/^(?:第)?EP?0*(\d{1,3})(?:[集期回])?$/);
  if (digitMatch) {
    return `EP${digitMatch[1].padStart(3, '0')}`;
  }

  const chineseMatch = compact.match(/^第?([零〇一二两三四五六七八九十百]+)(?:[集期回])?$/);
  if (!chineseMatch) return '';

  const number = parseChineseEpisodeNumber(chineseMatch[1]);
  if (!Number.isFinite(number) || number <= 0 || number > 999) return '';
  return `EP${String(number).padStart(3, '0')}`;
}

function buildEpisodeRanges(episodes = [], step = 10) {
  const numbers = episodes
    .map((episode) => episodeNumberFromId(episode.id))
    .filter((value) => Number.isFinite(value));
  const max = numbers.length ? Math.max(...numbers) : 0;
  const ranges = [];

  for (let start = 1; start <= max; start += step) {
    const end = Math.min(start + step - 1, max);
    ranges.push({
      start,
      end,
      label: `${start}-${end}`
    });
  }

  return ranges.reverse();
}

function episodeMatchesQuery(episode, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const exactEpisodeId = normalizeEpisodeIdQuery(normalizedQuery);
  if (exactEpisodeId && episode.id === exactEpisodeId) {
    return true;
  }

  const haystack = [
    episode.id,
    episode.title,
    episode.summary || '',
    ...(episode.tags || []),
    ...(episode.people || []),
    ...(episode.themes || []),
    ...(episode.concepts || []),
    ...(episode.models || [])
  ].join(' ').toLowerCase();

  return haystack.includes(normalizedQuery);
}

function keywordMatchesQuery(keyword, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const haystack = [
    keyword.id,
    keyword.name,
    keyword.summary || '',
    keyword.description || '',
    ...(keyword.aliases || [])
  ].join(' ').toLowerCase();

  return haystack.includes(normalizedQuery);
}

function linkedChipList(type, items = [], collection = []) {
  if (!items.length) return '';
  return `
    <div class="chip-row">
      ${items.map((item) => {
        const found = collection.find((entry) => {
          const aliases = entry.aliases || [];
          return (
            normalizeValue(entry.id) === normalizeValue(item) ||
            normalizeValue(entry.name) === normalizeValue(item) ||
            aliases.some((alias) => normalizeValue(alias) === normalizeValue(item))
          );
        });
        if (!found) return `<span class="chip">${escapeHtml(item)}</span>`;
        return `<a class="chip" href="${routeTo(`${type}/${found.id}`)}">${escapeHtml(found.name || found.title || found.id)}</a>`;
      }).join('')}
    </div>
  `;
}

function accordionItem(title, content, open = false) {
  return `
    <details class="accordion-item"${open ? ' open' : ''}>
      <summary class="accordion-summary">${escapeHtml(title)}</summary>
      <div class="accordion-content">${content}</div>
    </details>
  `;
}

function renderKeywordList(keywords = []) {
  if (!keywords.length) {
    return '<div class="empty-state">当前没有可显示的关键词。</div>';
  }

  return `
    <div class="list">
      ${keywords.map((keyword) => `
        <a class="list-item keyword-list-item" href="${routeTo(`keywords/${keyword.id}`)}">
          <div class="keyword-item-head">
            <h3>${escapeHtml(keyword.name)}</h3>
            <span class="keyword-count-badge">${keywordCount(keyword)} 期</span>
          </div>
          <p>${escapeHtml(keyword.summary)}</p>
          <div class="meta-row">
            ${(keyword.aliases || []).slice(0, 2).map((alias) => `<span class="chip">${escapeHtml(alias)}</span>`).join('')}
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function renderNodeList(items = [], type, descriptionKey = 'summary') {
  if (!items.length) {
    return '<div class="empty-state">当前没有可显示的条目。</div>';
  }

  return `
    <div class="list">
      ${items.map((item) => `
        <a class="list-item" href="${routeTo(`${type}/${item.id}`)}">
          <div class="keyword-item-head">
            <h3>${escapeHtml(item.name || item.title || item.id)}</h3>
            <span class="keyword-count-badge">${referenceCount(item)} 次引用</span>
          </div>
          <p>${escapeHtml(item[descriptionKey] || item.summary || item.definition || item.description || '')}</p>
        </a>
      `).join('')}
    </div>
  `;
}

function chunkItems(items = [], size = 6) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function renderChunkedSection(title, items, type, descriptionKey = 'summary', open = false) {
  if (!items.length) return '';

  const chunks = chunkItems(items, 6);
  return `
    <details class="accordion-item keyword-group"${open ? ' open' : ''}>
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${items.length}</span>
      </summary>
      <div class="accordion-content">
        ${chunks.map((chunk, chunkIndex) => `
          <details class="accordion-item nested-accordion"${chunkIndex === 0 ? ' open' : ''}>
            <summary class="accordion-summary">
              <span>${escapeHtml(`${title} ${chunkIndex * 6 + 1}-${chunkIndex * 6 + chunk.length}`)}</span>
              <span class="keyword-group-count">${chunk.length}</span>
            </summary>
            <div class="accordion-content">
              ${renderNodeList(chunk, type, descriptionKey)}
            </div>
          </details>
        `).join('')}
      </div>
    </details>
  `;
}

function renderReferenceIndex(config) {
  const {
    type,
    title,
    eyebrow,
    summary,
    collection,
    queryValue,
    setQuery,
    placeholder,
    descriptionKey = 'summary'
  } = config;

  const sortedItems = [...collection].sort((a, b) => referenceCount(b) - referenceCount(a) || (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));
  const query = queryValue.trim().toLowerCase();
  const matches = query
    ? sortedItems.filter((item) => {
        const haystack = [
          item.name || '',
          item.summary || '',
          item.description || '',
          item.definition || '',
          item.application || ''
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      })
    : [];

  const highItems = sortedItems.filter((item) => referenceCount(item) >= 4);
  const midItems = sortedItems.filter((item) => referenceCount(item) >= 2 && referenceCount(item) <= 3);
  const lowItems = sortedItems.filter((item) => referenceCount(item) === 1);

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 class="detail-title">${escapeHtml(title)}</h1>
        <p class="detail-summary">${escapeHtml(summary)}</p>
      </div>
      <section class="detail-section">
        <div class="keyword-toolbar">
          <div class="search-box keyword-search-box">
            <input id="${type}-index-search" type="text" placeholder="${escapeHtml(placeholder)}">
          </div>
          <div class="keyword-stats">
            <span class="chip">总数 ${sortedItems.length}</span>
            <span class="chip">按引用率排序</span>
            <span class="chip">每层最多 6 个</span>
          </div>
        </div>
        ${query ? `
          <div class="keyword-search-results">
            <p class="detail-copy">当前显示与 “${escapeHtml(queryValue)}” 匹配的条目。</p>
            ${matches.length ? renderNodeList(matches, type, descriptionKey) : '<div class="empty-state">没有匹配到相关条目。</div>'}
          </div>
        ` : `
          ${renderChunkedSection('高频节点（4 次及以上）', highItems, type, descriptionKey, true)}
          ${renderChunkedSection('中频节点（2-3 次）', midItems, type, descriptionKey)}
          ${renderChunkedSection('长尾节点（1 次）', lowItems, type, descriptionKey)}
        `}
      </section>
    </section>
  `;

  const searchInput = document.getElementById(`${type}-index-search`);
  if (searchInput) {
    searchInput.value = queryValue;
    searchInput.addEventListener('input', (event) => {
      setQuery(event.target.value);
      renderRoute();
    });
  }
}

function classifyReferenceItem(type, item) {
  const text = [
    item.name || '',
    item.summary || '',
    item.description || '',
    item.definition || '',
    item.application || ''
  ].join(' ');

  const generalRules = [
    { name: '地产金融', pattern: /房|地产|楼市|房价|地价|债|财政|资产|资本|金融|税|票据|信托|断供|清算|银行/ },
    { name: '科技产业', pattern: /AI|人工智能|新能源|电车|电池|汽车|芯片|科技|研发|制造|平台|算法|模型|创新/ },
    { name: '国际地缘', pattern: /美国|日本|新加坡|伊朗|俄罗斯|欧洲|东亚|东南亚|中东|台海|南海|制裁|战争|外交|地缘|小国|海峡|航线/ },
    { name: '教育文化', pattern: /教育|学校|考试|大学|学术|历史|文化|文明|语言|电影|文艺|选美|模因|春晚/ },
    { name: '社会组织', pattern: /品牌|顾问|组织|创始人|治理|平台劳动|中产|家庭|代际|权威|秩序|信任|婚姻|社交|人物/ }
  ];

  const peopleRules = [
    { name: '国家领导人', pattern: /总理|总统|领导人|首相|国家|外交|执政|政权/ },
    { name: '地缘政治人物', pattern: /地缘|战争|东亚|欧洲|中东|新加坡|日本|美国|俄罗斯|伊朗|台海|海峡/ },
    { name: '企业家与资本人物', pattern: /创始人|企业|商业|资本|地产|房企|品牌|投资|平台|白酒|董事长/ },
    { name: '科技产业人物', pattern: /AI|汽车|电池|新能源|技术|科研|工程师|科技|制造/ },
    { name: '教育学术人物', pattern: /教育|大学|教授|院士|学术|老师/ },
    { name: '媒体文化人物', pattern: /演员|主播|博主|作家|选美|电影|文化|历史|网红/ }
  ];

  const peopleCategoryOverrides = {
    'donald-trump': '国家领导人',
    'vladimir-putin': '国家领导人',
    'huang-xuncai': '国家领导人',
    'li-hsien-loong': '国家领导人',
    'ali-khamenei': '国家领导人',
    'mujtaba-khamenei': '国家领导人',
    'su-lin': '国家领导人',
    'ho-chi-minh': '国家领导人',
    'le-duan': '国家领导人',
    'gao-shi-zaomiao': '国家领导人',
    'vivian-balakrishnan': '地缘政治人物',
    'mahsa-amini': '地缘政治人物',
    'zhang-xuefeng': '媒体文化人物',
    'hu-chenfeng': '媒体文化人物',
    'elon-musk': '科技产业人物'
  };

  const modelRules = [
    { name: '风险与杠杆', pattern: /风险|杠杆|清算|退出|资产负债表|分配|转移|危机|筛选|崩塌/ },
    { name: '组织与治理', pattern: /治理|反馈|权威|委托|代理|守门|组织|继承|制度形式主义|平台可读性/ },
    { name: '市场与资本', pattern: /市场|价格|资本|价值捕获|飞轮|资产化|叙事杠杆|时间套利|财富/ },
    { name: '技术与创新', pattern: /技术|创新|路径|样机|量产|分布式|新能源|AI|模型|科技/ },
    { name: '国际与地缘', pattern: /区域拒止|小国|海峡|秩序|围堵|国际|地缘|规则|战争|国家信用/ },
    { name: '人成长与社会', pattern: /创伤|个体化|梦想|人机|学习|教育|边界|共振|善意/ }
  ];

  if (type === 'people' && peopleCategoryOverrides[item.id]) {
    return peopleCategoryOverrides[item.id];
  }

  const rules = type === 'people'
    ? peopleRules
    : type === 'models'
      ? modelRules
      : generalRules;
  const matched = rules.find((rule) => rule.pattern.test(text));
  return matched ? matched.name : '其他';
}

function renderCategorizedReferenceSection(title, items, type, descriptionKey = 'summary', open = false) {
  if (!items.length) return '';

  const topItems = items.slice(0, 3);
  const remainingItems = items.slice(3);

  return `
    <details class="accordion-item keyword-group"${open ? ' open' : ''}>
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${items.length}</span>
      </summary>
      <div class="accordion-content">
        ${renderNodeList(topItems, type, descriptionKey)}
        ${remainingItems.length ? `
          <details class="accordion-item nested-accordion">
            <summary class="accordion-summary">
              <span>更多</span>
              <span class="keyword-group-count">${remainingItems.length}</span>
            </summary>
            <div class="accordion-content">
              ${renderNodeList(remainingItems, type, descriptionKey)}
            </div>
          </details>
        ` : ''}
      </div>
    </details>
  `;
}

function renderCategorizedReferenceIndex(config) {
  const {
    type,
    title,
    eyebrow,
    summary,
    collection,
    descriptionKey = 'summary',
    minimumReferences = 2
  } = config;

  const sortedItems = [...collection]
    .filter((item) => referenceCount(item) >= minimumReferences)
    .sort((a, b) => referenceCount(b) - referenceCount(a) || (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));

  const categoryOrder = [
    '地产金融',
    '科技产业',
    '国际地缘',
    '教育文化',
    '社会组织',
    '政治地缘人物',
    '商业资本人物',
    '科技产业人物',
    '教育学术人物',
    '文化内容人物',
    '其他'
  ];
  const grouped = new Map(categoryOrder.map((name) => [name, []]));

  for (const item of sortedItems) {
    const category = classifyReferenceItem(type, item);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(item);
  }

  const sections = [...grouped.entries()]
    .filter(([, items]) => items.length)
    .sort((a, b) => {
      const aMax = Math.max(...a[1].map((item) => referenceCount(item)));
      const bMax = Math.max(...b[1].map((item) => referenceCount(item)));
      if (bMax !== aMax) return bMax - aMax;
      if (b[1].length !== a[1].length) return b[1].length - a[1].length;
      return a[0].localeCompare(b[0], 'zh-Hans-CN');
    })
    .map(([category, items], index) => renderCategorizedReferenceSection(category, items, type, descriptionKey, index === 0))
    .join('');

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 class="detail-title">${escapeHtml(title)}</h1>
        <p class="detail-summary">${escapeHtml(summary)}</p>
      </div>
      <section class="detail-section">
        <div class="keyword-stats">
          <span class="chip">当前显示 ${sortedItems.length}</span>
          <span class="chip">按引用率排序</span>
          <span class="chip">每类先显示 3 个</span>
        </div>
        ${sections || '<div class="empty-state">当前没有满足条件的条目。</div>'}
      </section>
    </section>
  `;
}

function renderKeywordGroup(title, keywords, options = {}) {
  const { note = '', open = false } = options;
  if (!keywords.length) return '';

  return `
    <details class="accordion-item keyword-group"${open ? ' open' : ''}>
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${keywords.length}</span>
      </summary>
      <div class="accordion-content">
        ${note ? `<p class="detail-copy">${escapeHtml(note)}</p>` : ''}
        ${renderKeywordList(keywords)}
      </div>
    </details>
  `;
}

function getSidebarKeywordMatches() {
  const query = sidebarKeywordQuery.trim().toLowerCase();
  const keywords = site?.keywords || [];
  if (!query) return keywords.slice(0, 3);
  return keywords
    .filter((keyword) => {
      const haystack = `${keyword.name} ${keyword.summary || ''} ${(keyword.aliases || []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 8);
}

function getKnowledgeSearchMatches(query) {
  const trimmedQuery = String(query || '').trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const keywords = (site?.keywords || []);
  const keywordMatches = (!trimmedQuery ? keywords.slice(0, 3) : keywords
    .filter((keyword) => {
      const haystack = `${keyword.name} ${keyword.summary || ''} ${(keyword.aliases || []).join(' ')}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 8))
    .map((keyword) => ({
      type: 'keyword',
      id: keyword.id,
      name: keyword.name,
      badge: '关键词'
    }));

  if (!trimmedQuery) return keywordMatches;

  const episodes = (site?.episodes || [])
    .filter((episode) => episodeMatchesQuery(episode, trimmedQuery))
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id))
    .slice(0, 8)
    .map((episode) => ({
      type: 'episode',
      id: episode.id,
      name: `${episode.id}｜${episode.title}`,
      badge: '节目'
    }));

  const concepts = getSidebarReferenceMatches('concept', site?.concepts || [], trimmedQuery, '概念');
  const models = getSidebarReferenceMatches('model', site?.models || [], trimmedQuery, '模型');
  const people = getSidebarReferenceMatches('person', site?.people || [], trimmedQuery, '人物');
  const themes = getSidebarReferenceMatches('theme', site?.themes || [], trimmedQuery, '主题');

  const exactEpisodeId = normalizeEpisodeIdQuery(trimmedQuery);
  if (exactEpisodeId) {
    const exact = episodes.find((item) => item.id === exactEpisodeId);
    if (exact) {
      return [exact, ...keywordMatches, ...concepts, ...models, ...people, ...themes, ...episodes.filter((item) => item.id !== exactEpisodeId)].slice(0, 10);
    }
  }

  return [...keywordMatches, ...concepts, ...models, ...people, ...themes, ...episodes].slice(0, 10);
}

function getSidebarReferenceMatches(type, collection = [], query, badge) {
  if (!query) return [];
  const normalizedQuery = query.trim().toLowerCase();

  return collection
    .filter((item) => {
      const haystack = [
        item.id,
        item.name || '',
        item.title || '',
        item.summary || '',
        item.definition || '',
        item.description || '',
        ...(item.aliases || [])
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 6)
    .map((item) => ({
      type,
      id: item.id,
      name: item.name || item.title || item.id,
      badge
    }));
}

function getSidebarSearchMatches() {
  return getKnowledgeSearchMatches(sidebarKeywordQuery);
}

function routeForSearchMatch(match) {
  return match.type === 'episode' ? routeTo(`episodes/${match.id}`)
    : match.type === 'keyword' ? routeTo(`keywords/${match.id}`)
    : match.type === 'concept' ? routeTo(`concepts/${match.id}`)
    : match.type === 'model' ? routeTo(`models/${match.id}`)
    : match.type === 'person' ? routeTo(`people/${match.id}`)
    : routeTo(`themes/${match.id}`);
}

function openFirstSearchMatch(query) {
  const [firstMatch] = getKnowledgeSearchMatches(query);
  if (!firstMatch) return;
  window.location.hash = routeForSearchMatch(firstMatch);
}

function renderKnowledgeSuggestions({ containerId, titleId, query, emptyMessage, idleTitle = '推荐关键词' }) {
  const container = document.getElementById(containerId);
  const heading = document.getElementById(titleId);
  if (!container || !site) return;

  const matches = getKnowledgeSearchMatches(query);
  if (heading) {
    heading.textContent = String(query || '').trim() ? '匹配结果' : idleTitle;
  }

  if (!matches.length) {
    container.innerHTML = `<div class="sidebar-empty">${escapeHtml(emptyMessage)}</div>`;
    return;
  }

  container.innerHTML = matches.map((match) => `
    <a class="sidebar-suggestion search-suggestion" href="${routeForSearchMatch(match)}">
      <span>${escapeHtml(match.name)}</span>
      <span class="count-badge">${escapeHtml(match.badge)}</span>
    </a>
  `).join('');
}

function renderSidebarKeywordSuggestions() {
  renderKnowledgeSuggestions({
    containerId: 'keyword-suggestions',
    titleId: 'keyword-suggestions-title',
    query: sidebarKeywordQuery,
    emptyMessage: '没有匹配的关键词、节目或知识条目',
    idleTitle: '推荐关键词'
  });
}

function renderSidebar() {
  const topKeywords = site.keywords.slice(0, 3);
  const topConcepts = site.concepts.slice(0, 5);
  const topModels = site.models.slice(0, 5);

  sidebarBody.innerHTML = `
    <div class="sidebar-section">
      <p class="sidebar-title">导航</p>
      <a class="sidebar-link" href="#/">首页 <span class="count-badge">Home</span></a>
      <a class="sidebar-link" href="#/episodes">节目 <span class="count-badge">${site.stats.episodes}</span></a>
      <a class="sidebar-link" href="#/concepts">概念 <span class="count-badge">${site.stats.concepts}</span></a>
      <a class="sidebar-link" href="#/models">模型 <span class="count-badge">${site.stats.models}</span></a>
      <a class="sidebar-link" href="#/people">人物 <span class="count-badge">${site.stats.people}</span></a>
      <a class="sidebar-link" href="#/themes">主题 <span class="count-badge">${site.stats.themes}</span></a>
      <a class="sidebar-link" href="#/keywords">关键词 <span class="count-badge">${site.stats.keywords}</span></a>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">搜索知识库</p>
      <div class="sidebar-search-wrap">
        <input id="keyword-search-input" class="sidebar-search-input" type="text" placeholder="搜索关键词、节目、概念、模型，如 咽喉杠杆 / 西贝 / EP031">
        <p id="keyword-suggestions-title" class="sidebar-subtitle">推荐关键词</p>
        <div id="keyword-suggestions" class="sidebar-suggestions"></div>
      </div>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">关键词</p>
      ${topKeywords.map((keyword) => `<a class="sidebar-item" href="${routeTo(`keywords/${keyword.id}`)}">${escapeHtml(keyword.name)}</a>`).join('')}
      <a class="sidebar-more" href="#/keywords">更多关键词 →</a>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">核心概念</p>
      ${topConcepts.map((concept) => `<a class="sidebar-item" href="${routeTo(`concepts/${concept.id}`)}">${escapeHtml(concept.name)}</a>`).join('')}
      <a class="sidebar-more" href="#/concepts">更多概念 →</a>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">思想模型</p>
      ${topModels.map((model) => `<a class="sidebar-item" href="${routeTo(`models/${model.id}`)}">${escapeHtml(model.name)}</a>`).join('')}
      <a class="sidebar-more" href="#/models">更多模型 →</a>
      <a class="sidebar-item" href="#/graph">知识图谱 <span class="count-badge">${graphStatValue()}</span></a>
    </div>
  `;

  const keywordInput = document.getElementById('keyword-search-input');
  keywordInput.value = sidebarKeywordQuery;
  keywordInput.addEventListener('input', (event) => {
    sidebarKeywordQuery = event.target.value;
    renderSidebarKeywordSuggestions();
  });
  keywordInput.addEventListener('focus', () => {
    renderSidebarKeywordSuggestions();
  });
    keywordInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const [firstMatch] = getSidebarSearchMatches();
      if (firstMatch) {
        window.location.hash = firstMatch.type === 'episode'
          ? routeTo(`episodes/${firstMatch.id}`)
          : firstMatch.type === 'keyword'
            ? routeTo(`keywords/${firstMatch.id}`)
            : firstMatch.type === 'concept'
              ? routeTo(`concepts/${firstMatch.id}`)
              : firstMatch.type === 'model'
                ? routeTo(`models/${firstMatch.id}`)
                : firstMatch.type === 'person'
                  ? routeTo(`people/${firstMatch.id}`)
                  : routeTo(`themes/${firstMatch.id}`);
      }
    });
  renderSidebarKeywordSuggestions();
}

function scrollToSection(id) {
  if (!id) return;
  requestAnimationFrame(() => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function renderHome(focusSectionId = '') {
  const curatedEpisodes = site.episodes.filter((episode) => episode.curated);
  const featuredEpisodes = site.episodes;

  app.innerHTML = `
    <section class="hero">
      <p class="eyebrow">Web Knowledge Base</p>
      <h1>颖响力 <span>知识库</span></h1>
      <p>${escapeHtml(site.meta.subtitle)}。当前这版已经把节目、概念、模型、人物、主题连成一个可交互图谱，本地可以先验证结构质量，再决定是否发布到线上。</p>
      <div class="stats">
        <a class="stat-card" href="#/graph">
          <div class="stat-value">${graphStatValue()}</div>
          <div class="stat-label">图谱节点</div>
        </a>
        <a class="stat-card" href="#/episodes">
          <div class="stat-value">${site.stats.episodes}</div>
          <div class="stat-label">节目索引</div>
        </a>
        <a class="stat-card" href="#/home/curated">
          <div class="stat-value">${site.stats.curatedEpisodes}</div>
          <div class="stat-label">已整理节目</div>
        </a>
        <a class="stat-card" href="#/concepts">
          <div class="stat-value">${site.stats.concepts}</div>
          <div class="stat-label">概念卡片</div>
        </a>
        <a class="stat-card" href="#/models">
          <div class="stat-value">${site.stats.models}</div>
          <div class="stat-label">思想模型</div>
        </a>
      </div>
      <div class="search-box home-search-box">
        <div class="search-row">
          <input id="search-input" type="text" placeholder="搜索知识库：节目、概念、模型、人物、主题，如 EP019 / 特朗普 / 安全阀治理">
          <button id="search-submit" class="search-submit" type="button">搜索</button>
        </div>
        <p id="home-search-title" class="search-subtitle">推荐关键词</p>
        <div id="home-search-results" class="search-results"></div>
      </div>
      <div class="hero-actions">
        <a class="hero-action" href="#/graph">打开知识图谱</a>
        <a class="hero-action" href="#/episodes">先看节目索引</a>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">知识图谱</h2>
        <a class="section-note" href="#/graph">进入图谱视图</a>
      </div>
      <div class="grid cards-2">
        <a class="card graph-preview-card" href="#/graph">
          <p class="card-kicker">Graph View · ${graphData?.meta?.linkCount || 0} 条连接</p>
          <h3>从节目跳到概念，再跳到人物与主题</h3>
          <p>这张图把五类核心节点放进同一个可视化网络里，适合先看结构密度，再回到单条目做细读。</p>
          <div class="meta-row">
            <span class="chip">节目 ${site.stats.episodes}</span>
            <span class="chip">概念 ${site.stats.concepts}</span>
            <span class="chip">模型 ${site.stats.models}</span>
            <span class="chip">人物 ${site.stats.people}</span>
            <span class="chip">主题 ${site.stats.themes}</span>
          </div>
        </a>
        <div class="card">
          <p class="card-kicker">How To Read</p>
          <h3>先找高连接节点，再顺着局部关系钻进去</h3>
          <p>图谱适合回答两个问题：哪些主题经常和哪些节目一起出现，以及某个人物或模型究竟被放在什么语境里讲。</p>
          <div class="meta-row">
            <span class="chip">点击节点看近邻</span>
            <span class="chip">双击节点开详情</span>
            <span class="chip">滚轮缩放</span>
          </div>
        </div>
      </div>
    </section>

    <section id="home-curated-episodes" class="section">
      <div class="section-header">
        <h2 class="section-title">已整理节目</h2>
        <a class="section-note" href="#/episodes">查看全部节目</a>
      </div>
      <div class="grid cards-2">
        ${curatedEpisodes.slice(0, 3).map((episode) => `
          <a class="card" href="${routeTo(`episodes/${episode.id}`)}">
            <p class="card-kicker">${escapeHtml(episode.id)} · 节目条目</p>
            <h3>${escapeHtml(episode.title)}</h3>
            <p>${escapeHtml(episode.summary || '待补充摘要')}</p>
            ${chipList((episode.tags || []).slice(0, 4))}
          </a>
        `).join('')}
      </div>
    </section>

    <section class="section split">
      <div>
        <div class="section-header">
          <h2 class="section-title">概念入口</h2>
          <a class="section-note" href="#/concepts">查看全部概念</a>
        </div>
        <div class="list">
          ${site.concepts.slice(0, 3).map((concept) => `
            <a class="list-item" href="${routeTo(`concepts/${concept.id}`)}">
              <h3>${escapeHtml(concept.name)}</h3>
              <p>${escapeHtml(concept.summary)}</p>
            </a>
          `).join('')}
        </div>
      </div>
      <div>
        <div class="section-header">
          <h2 class="section-title">思想模型</h2>
          <a class="section-note" href="#/models">查看全部模型</a>
        </div>
        <div class="list">
          ${site.models.slice(0, 3).map((model) => `
            <a class="list-item" href="${routeTo(`models/${model.id}`)}">
              <h3>${escapeHtml(model.name)}</h3>
              <p>${escapeHtml(model.summary)}</p>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">节目索引</h2>
        <p class="section-note">从 raw 自动扫出的节目目录，已整理节目会优先显示结构化内容。</p>
      </div>
      <div class="grid cards-3">
        ${featuredEpisodes.slice(0, 3).map((episode) => `
          <a class="card" href="${routeTo(`episodes/${episode.id}`)}">
            <p class="card-kicker">${escapeHtml(episode.id)} ${episode.curated ? '· 已整理' : '· 待整理'}</p>
            <h3>${escapeHtml(episode.title)}</h3>
            <p>${escapeHtml(episode.summary || '待整理')}</p>
            ${chipList((episode.tags || []).slice(0, 5))}
          </a>
        `).join('')}
      </div>
      <p class="footer-note">首页只展示前 3 条结果，完整目录请进入查看全部页面。</p>
    </section>
  `;

  const searchInput = document.getElementById('search-input');
  const searchSubmit = document.getElementById('search-submit');
  searchInput.value = homeKnowledgeQuery;
  searchInput.addEventListener('input', (event) => {
    homeKnowledgeQuery = event.target.value;
    renderKnowledgeSuggestions({
      containerId: 'home-search-results',
      titleId: 'home-search-title',
      query: homeKnowledgeQuery,
      emptyMessage: '没有匹配的节目、概念、模型、人物或主题',
      idleTitle: '推荐关键词'
    });
  });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    openFirstSearchMatch(homeKnowledgeQuery);
  });
  searchSubmit.addEventListener('click', () => {
    openFirstSearchMatch(homeKnowledgeQuery);
  });
  renderKnowledgeSuggestions({
    containerId: 'home-search-results',
    titleId: 'home-search-title',
    query: homeKnowledgeQuery,
    emptyMessage: '没有匹配的节目、概念、模型、人物或主题',
    idleTitle: '推荐关键词'
  });

  scrollToSection(focusSectionId);
}

function renderGraphPage() {
  if (!graphData) {
    renderNotFound('知识图谱数据尚未生成，请先执行构建。');
    return;
  }

  renderGraphView({
    container: app,
    graph: graphData,
    toHash: routeTo
  });
}

function renderEpisodeIndex() {
  const episodesByNumber = [...site.episodes].sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
  const keywordClusters = [...site.keywords]
    .filter((keyword) => Array.isArray(keyword.episodes) && keyword.episodes.length)
    .sort((a, b) => b.episodes.length - a.episodes.length || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  const topKeywordClusters = keywordClusters.slice(0, 6);
  const episodeRanges = buildEpisodeRanges(episodesByNumber);
  const query = episodeIndexQuery.trim();
  const matchedKeywords = query
    ? keywordClusters.filter((keyword) => keywordMatchesQuery(keyword, query)).slice(0, 12)
    : [];
  const matchedEpisodes = query
    ? episodesByNumber.filter((episode) => episodeMatchesQuery(episode, query))
    : [];
  const selectedRange = episodeRanges.find((range) => range.start === episodeIndexRangeStart) || episodeRanges[0];
  const visibleEpisodes = query
    ? matchedEpisodes
    : episodesByNumber.filter((episode) => {
        const number = episodeNumberFromId(episode.id);
        return number >= selectedRange.start && number <= selectedRange.end;
      });

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">节目总览</p>
        <h1 class="detail-title">节目索引</h1>
      </div>
      <section class="detail-section">
        <div class="section-header">
          <h2 class="section-title">按关键词看节目群</h2>
          <a class="section-note" href="#/keywords">更多关键词专题 →</a>
        </div>
        <p class="detail-copy">这里只显示最多相关的 6 个关键词专题。点进去可查看该关键词下的相关节目群。</p>
        <div class="grid cards-3">
          ${topKeywordClusters.map((keyword) => `
            <a class="card" href="${routeTo(`keywords/${keyword.id}`)}">
              <p class="card-kicker">关键词专题</p>
              <h3>${escapeHtml(keyword.name)}</h3>
              <p>${escapeHtml(keyword.summary)}</p>
              <div class="meta-row">
                <span class="chip">${keyword.episodes.length} 期相关节目</span>
                ${(keyword.aliases || []).length ? `<span class="chip">${escapeHtml(keyword.aliases[0])}</span>` : ''}
              </div>
            </a>
          `).join('')}
        </div>
      </section>
      <section class="detail-section">
        <div class="section-header episode-index-header">
          <div>
            <h2 class="section-title">按集数找节目</h2>
            <p class="section-note">${query ? '当前显示搜索结果。' : `当前显示 ${selectedRange.label} 区间的节目。`}</p>
          </div>
          <div class="episode-range-tabs">
            ${episodeRanges.map((range) => `
              <button
                class="range-tab${!query && selectedRange.start === range.start ? ' active' : ''}"
                type="button"
                data-episode-range="${range.start}"
              >${range.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="search-box episode-search-box">
          <input id="episode-index-search" type="text" placeholder="搜索节目编号、关键词或标题，如 EP001 / 西贝 / 房价">
        </div>
        ${query ? `
          <div class="episode-search-results">
            <p class="detail-copy">输入数字可直接找集数，输入关键词可同时匹配关键词专题和节目。</p>
            ${matchedKeywords.length ? `
              <section class="embedded-section">
                <p class="inline-label">匹配关键词</p>
                ${renderKeywordList(matchedKeywords)}
              </section>
            ` : ''}
            <section class="embedded-section">
              <p class="inline-label">匹配节目</p>
              ${visibleEpisodes.length ? `
                <div class="list">
                  ${visibleEpisodes.map((episode) => `
                    <a class="list-item" href="${routeTo(`episodes/${episode.id}`)}">
                      <h3>${escapeHtml(episode.id)}｜${escapeHtml(episode.title)}</h3>
                      <p>${escapeHtml(episode.summary || '待整理')}</p>
                      ${(episode.tags || []).length ? `<p class="inline-label">关键词</p>${chipList((episode.tags || []).slice(0, 6))}` : ''}
                    </a>
                  `).join('')}
                </div>
              ` : '<div class="empty-state">没有匹配到节目。</div>'}
            </section>
          </div>
        ` : `
          <div class="list">
            ${visibleEpisodes.map((episode) => `
              <a class="list-item" href="${routeTo(`episodes/${episode.id}`)}">
                <h3>${escapeHtml(episode.id)}｜${escapeHtml(episode.title)}</h3>
                <p>${escapeHtml(episode.summary || '待整理')}</p>
                ${(episode.tags || []).length ? `<p class="inline-label">关键词</p>${chipList((episode.tags || []).slice(0, 6))}` : ''}
              </a>
            `).join('')}
          </div>
        `}
      </section>
    </section>
  `;

  const searchInput = document.getElementById('episode-index-search');
  if (searchInput) {
    searchInput.value = episodeIndexQuery;
    searchInput.addEventListener('input', (event) => {
      episodeIndexQuery = event.target.value;
      renderEpisodeIndex();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;

      const exactEpisodeId = normalizeEpisodeIdQuery(episodeIndexQuery);
      if (exactEpisodeId) {
        const foundEpisode = site.episodes.find((episode) => episode.id === exactEpisodeId);
        if (foundEpisode) {
          window.location.hash = routeTo(`episodes/${foundEpisode.id}`);
          return;
        }
      }

      const exactKeyword = site.keywords.find((keyword) => {
        const aliases = keyword.aliases || [];
        return (
          normalizeValue(keyword.name) === normalizeValue(episodeIndexQuery) ||
          normalizeValue(keyword.id) === normalizeValue(episodeIndexQuery) ||
          aliases.some((alias) => normalizeValue(alias) === normalizeValue(episodeIndexQuery))
        );
      });

      if (exactKeyword) {
        window.location.hash = routeTo(`keywords/${exactKeyword.id}`);
      }
    });
  }

  document.querySelectorAll('[data-episode-range]').forEach((button) => {
    button.addEventListener('click', () => {
      episodeIndexRangeStart = Number(button.dataset.episodeRange);
      renderEpisodeIndex();
    });
  });
}

function renderConceptIndex() {
  renderCategorizedReferenceIndex({
    type: 'concepts',
    title: '概念',
    eyebrow: 'Concept Cards',
    summary: '概念是比思想模型更小的结构单元，用来概括一个现象，并承接多个节目里的具体表现。这里只显示被引用超过 1 次的概念。',
    collection: site.concepts
  });
}

function renderKeywordIndex() {
  const query = keywordIndexQuery.trim().toLowerCase();
  const sortedKeywords = [...site.keywords].sort((a, b) => keywordCount(b) - keywordCount(a) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  const episodesByNewest = [...site.episodes].sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
  const matches = query
    ? sortedKeywords.filter((keyword) => {
        const haystack = `${keyword.name} ${keyword.summary || ''} ${(keyword.aliases || []).join(' ')}`.toLowerCase();
        return haystack.includes(query);
      })
    : [];
  const matchedEpisodes = query
    ? episodesByNewest.filter((episode) => episodeMatchesQuery(episode, keywordIndexQuery)).slice(0, 12)
    : [];
  const coreKeywords = sortedKeywords.filter((keyword) => keywordCount(keyword) >= 3);
  const midKeywords = sortedKeywords.filter((keyword) => keywordCount(keyword) === 2);
  const tailKeywords = sortedKeywords.filter((keyword) => keywordCount(keyword) === 1);
  const visibleKeywords = sortedKeywords.filter((keyword) => keywordCount(keyword) >= 2);
  const visibleMatches = query ? matches.filter((keyword) => keywordCount(keyword) >= 2) : [];

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">Keywords</p>
        <h1 class="detail-title">关键词</h1>
        <p class="detail-summary">关键词层用于承接人物、品牌、公司、产品和议题入口。这里按关联节目数量分层显示，只展示至少出现 2 次的关键词。</p>
      </div>
      <section class="detail-section">
        <div class="keyword-toolbar">
          <div class="search-box keyword-search-box">
            <input id="keyword-index-search" type="text" placeholder="搜索关键词，如 房价 / 西贝 / 小米汽车">
          </div>
          <div class="keyword-stats">
            <span class="chip">核心专题 ${coreKeywords.length}</span>
            <span class="chip">中频关键词 ${midKeywords.length}</span>
            <span class="chip">当前显示 ${visibleKeywords.length}</span>
            <span class="chip">单次关键词暂不显示 ${tailKeywords.length}</span>
          </div>
        </div>
        ${query ? `
          <div class="keyword-search-results">
            <p class="detail-copy">这里同时显示匹配到的关键词和节目。输入 31、31集、EP31、三十一集 都可以找到 EP031。</p>
            ${visibleMatches.length ? `
              <section class="embedded-section">
                <p class="inline-label">匹配关键词</p>
                ${renderKeywordList(visibleMatches)}
              </section>
            ` : ''}
            <section class="embedded-section">
              <p class="inline-label">匹配节目</p>
              ${matchedEpisodes.length ? `
                <div class="list">
                  ${matchedEpisodes.map((episode) => `
                    <a class="list-item" href="${routeTo(`episodes/${episode.id}`)}">
                      <h3>${escapeHtml(episode.id)}｜${escapeHtml(episode.title)}</h3>
                      <p>${escapeHtml(episode.summary || '待整理')}</p>
                    </a>
                  `).join('')}
                </div>
              ` : (!visibleMatches.length ? '<div class="empty-state">没有匹配到关键词或节目。</div>' : '<div class="empty-state">没有匹配到节目。</div>')}
            </section>
          </div>
        ` : `
          ${renderKeywordGroup('核心专题（3 期及以上）', coreKeywords, {
            open: true,
            note: '这些关键词已经形成较明显的节目群，适合作为优先浏览的入口。'
          })}
          ${renderKeywordGroup('中频关键词（2 期）', midKeywords, {
            note: '这些关键词已经跨过单集，开始出现专题串联。'
          })}
        `}
      </section>
    </section>
  `;

  const searchInput = document.getElementById('keyword-index-search');
  if (searchInput) {
    searchInput.value = keywordIndexQuery;
    searchInput.addEventListener('input', (event) => {
      keywordIndexQuery = event.target.value;
      renderKeywordIndex();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;

      const exactEpisodeId = normalizeEpisodeIdQuery(keywordIndexQuery);
      if (exactEpisodeId) {
        const foundEpisode = site.episodes.find((episode) => episode.id === exactEpisodeId);
        if (foundEpisode) {
          window.location.hash = routeTo(`episodes/${foundEpisode.id}`);
          return;
        }
      }

      const exactKeyword = site.keywords.find((keyword) => {
        const aliases = keyword.aliases || [];
        return (
          normalizeValue(keyword.name) === normalizeValue(keywordIndexQuery) ||
          normalizeValue(keyword.id) === normalizeValue(keywordIndexQuery) ||
          aliases.some((alias) => normalizeValue(alias) === normalizeValue(keywordIndexQuery))
        );
      });

      if (exactKeyword) {
        window.location.hash = routeTo(`keywords/${exactKeyword.id}`);
      }
    });
  }
}

function renderModelIndex() {
  renderCategorizedReferenceIndex({
    type: 'models',
    title: '思想模型',
    eyebrow: 'Mental Models',
    summary: '思想模型优先引用 GV 现有模型名，再结合具体节目解释其在本期中的作用。这里只显示被引用超过 1 次的模型。',
    collection: site.models
  });
}

function renderEpisodeDetail(id) {
  const episode = site.episodes.find((item) => item.id === id);
  if (!episode) {
    renderNotFound('节目不存在');
    return;
  }

  if (!episode.curated) {
    app.innerHTML = `
      <section class="detail">
        <div class="detail-header">
          <div class="back-row">
            <a class="back-link" href="#/episodes">← 返回节目索引</a>
            <a class="back-link secondary" href="#/">返回首页</a>
          </div>
          <p class="detail-eyebrow">Episode Placeholder</p>
          <h1 class="detail-title">${escapeHtml(episode.id)}｜${escapeHtml(episode.title)}</h1>
          <p class="detail-summary">这条节目已经进入网页索引，但还没有整理成结构化知识条目。</p>
        </div>
        <section class="detail-section">
          <p>当前状态：待整理。</p>
          <p class="subtle">你后续可以按同样的 episodes / concepts / models 结构继续扩充。</p>
        </section>
      </section>
    `;
    return;
  }

  const relatedConcepts = (episode.concepts || [])
    .map((conceptId) => site.concepts.find((item) => item.id === conceptId))
    .filter(Boolean);
  const relatedModels = (episode.models || [])
    .map((modelId) => site.models.find((item) => item.id === modelId))
    .filter(Boolean);
  const relatedEpisodes = (episode.relatedEpisodes || [])
    .map((episodeId) => site.episodes.find((item) => item.id === episodeId))
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
  const relatedPeopleChips = linkedChipList('people', episode.people, site.people);
  const relatedThemeChips = linkedChipList('themes', episode.themes, site.themes);
  const hasKnowledgeLinks = relatedConcepts.length || relatedModels.length;
  const hasTailLinks = (episode.people || []).length || (episode.themes || []).length || relatedEpisodes.length;

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <div class="back-row">
          <a class="back-link" href="#/episodes">← 返回节目索引</a>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <p class="detail-eyebrow">Episode Entry</p>
        <h1 class="detail-title">${escapeHtml(episode.id)}｜${escapeHtml(episode.title)}</h1>
        <p class="detail-summary">${escapeHtml(episode.summary)}</p>
        ${linkedChipList('keywords', episode.tags, site.keywords)}
      </div>

      <section class="detail-section">
        <h2>话题</h2>
        ${accordionItem('事件背景', `<p>${escapeHtml(episode.topic.background)}</p>`, true)}
        ${accordionItem('核心矛盾', `<ul>${episode.topic.conflicts.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)}
        ${accordionItem('讨论边界', `<ul>${episode.topic.boundaries.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)}
        ${accordionItem('机制推演', `<p>${escapeHtml(episode.topic.mechanism)}</p>`)}
        ${accordionItem('延展话题', `<ul>${episode.topic.extensions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`)}
      </section>

      <section class="detail-section">
        <h2>核心观点</h2>
        ${episode.viewpoints.map((viewpoint, index) => accordionItem(
          viewpoint.title,
          `<p>${escapeHtml(viewpoint.body)}</p>`,
          index === 0
        )).join('')}
      </section>

      ${hasKnowledgeLinks ? `
        <section class="detail-section split">
          ${relatedConcepts.length ? `
            <div>
              <h2>关联概念</h2>
              <div class="list">
                ${relatedConcepts.map((concept) => `
                  <a class="list-item" href="${routeTo(`concepts/${concept.id}`)}">
                    <h3>${escapeHtml(concept.name)}</h3>
                    <p>${escapeHtml(concept.summary)}</p>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${relatedModels.length ? `
            <div>
              <h2>关联模型</h2>
              <div class="list">
                ${relatedModels.map((model) => `
                  <a class="list-item" href="${routeTo(`models/${model.id}`)}">
                    <h3>${escapeHtml(model.name)}</h3>
                    <p>${escapeHtml(model.summary)}</p>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </section>
      ` : ''}

      <section class="detail-section">
        <h2>延展</h2>
        <ul>${episode.extensions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        ${hasTailLinks ? `
          ${(episode.people || []).length ? `<h3>关联人物</h3>${relatedPeopleChips}` : ''}
          ${(episode.themes || []).length ? `<h3>关联主题</h3>${relatedThemeChips}` : ''}
          ${relatedEpisodes.length ? `
            <h3>关联节目</h3>
            <div class="list">
              ${relatedEpisodes.map((item) => `
                <a class="list-item" href="${routeTo(`episodes/${item.id}`)}">
                  <h3>${escapeHtml(item.id)}｜${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.summary || '待整理')}</p>
                </a>
              `).join('')}
            </div>
          ` : ''}
        ` : ''}
      </section>
    </section>
  `;
}

function renderPeopleIndex() {
  renderCategorizedReferenceIndex({
    type: 'people',
    title: '关联人物',
    eyebrow: 'People',
    summary: '人物页用于承接节目里出现的核心人物，并串联这些人物在不同节目中的出现方式。这里只显示被引用超过 1 次的人物。',
    collection: site.people
  });
}

function renderThemesIndex() {
  renderCategorizedReferenceIndex({
    type: 'themes',
    title: '关联主题',
    eyebrow: 'Themes',
    summary: '主题页用于聚合同一类问题意识，方便后续把多期节目按议题组织起来。这里只显示被引用超过 1 次的主题。',
    collection: site.themes
  });
}

function renderDetailList(items = []) {
  if (!items.length) return '<p class="subtle">待补充。</p>';
  return `<ul>${items.map((item) => `<li>${renderLinkedEpisodeText(item)}</li>`).join('')}</ul>`;
}

function renderHighlightCards(items = []) {
  if (!items.length) return '<p class="subtle">待补充。</p>';
  return `
    <div class="list">
      ${items.map((item) => `
        <a class="list-item" href="${routeTo(`episodes/${item.id}`)}">
          <h3>${escapeHtml(item.id)}｜${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.note || item.summary || '待补充')}</p>
          ${item.summary && item.summary !== item.note ? `<p class="subtle">${escapeHtml(item.summary)}</p>` : ''}
          ${item.mechanism ? `<p class="subtle">机制线：${escapeHtml(item.mechanism)}</p>` : ''}
        </a>
      `).join('')}
    </div>
  `;
}

function renderReferenceChipSection(title, type, items, collection) {
  if (!items?.length) return '';
  return `
    <div>
      <h3>${escapeHtml(title)}</h3>
      ${linkedChipList(type, items, collection)}
    </div>
  `;
}

function renderConceptDetail(id) {
  const concept = site.concepts.find((item) => item.id === id);
  if (!concept) {
    renderNotFound('概念不存在');
    return;
  }

  const episodes = (concept.episodes || [])
    .map((entry) => {
      const episode = site.episodes.find((item) => item.id === entry.id);
      return episode ? { ...entry, title: episode.title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <div class="back-row">
          <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
          <a class="back-link secondary" href="#/concepts">返回概念页</a>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <p class="detail-eyebrow">Concept Card</p>
        <h1 class="detail-title">${escapeHtml(concept.name)}</h1>
        <p class="detail-summary">${escapeHtml(concept.summary)}</p>
      </div>
      <section class="detail-section">
        <h2>定义与展开</h2>
        <p>${renderLinkedEpisodeText(concept.definition)}</p>
        ${concept.context ? `<p>${renderLinkedEpisodeText(concept.context)}</p>` : ''}
        <h3>为什么重要</h3>
        <p>${renderLinkedEpisodeText(concept.importance)}</p>
      </section>
      <section class="detail-section split">
        <div>
          <h2>识别信号</h2>
          ${renderDetailList(concept.signals)}
        </div>
        <div>
          <h2>使用边界</h2>
          ${renderDetailList(concept.boundaries)}
        </div>
      </section>
      <section class="detail-section split">
        ${renderReferenceChipSection('共现模型', 'models', concept.relatedModels, site.models)}
        ${renderReferenceChipSection('共现主题', 'themes', concept.relatedThemes, site.themes)}
        ${renderReferenceChipSection('共现人物', 'people', concept.relatedPeople, site.people)}
        ${renderReferenceChipSection('相关概念', 'concepts', concept.relatedConcepts, site.concepts)}
      </section>
      <section class="detail-section">
        <h2>进一步追问</h2>
        ${renderDetailList(concept.questions)}
      </section>
      <section class="detail-section">
        <h2>节目里的典型锚点</h2>
        ${renderHighlightCards(concept.episodeHighlights?.length ? concept.episodeHighlights : episodes)}
      </section>
    </section>
  `;
}

function renderModelDetail(id) {
  const model = site.models.find((item) => item.id === id);
  if (!model) {
    renderNotFound('模型不存在');
    return;
  }

  const relatedEpisodes = (model.episodes || [])
    .map((entry) => {
      const episode = site.episodes.find((item) => item.id === entry.id);
      return episode ? { ...entry, title: episode.title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <div class="back-row">
          <a class="back-link" href="#/models">← 返回思想模型页</a>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <p class="detail-eyebrow">Mental Model</p>
        <h1 class="detail-title">${escapeHtml(model.name)}</h1>
        <p class="detail-summary">${escapeHtml(model.summary)}</p>
        ${model.sourcePath ? `<p class="footer-note">GV 参考：<a href="${escapeHtml(model.sourcePath)}">${escapeHtml(model.sourceLabel || model.name)}</a></p>` : ''}
      </div>
      <section class="detail-section">
        <h2>机制定义</h2>
        <p>${renderLinkedEpisodeText(model.definition)}</p>
        ${model.context ? `<p>${renderLinkedEpisodeText(model.context)}</p>` : ''}
        <h3>放在颖响力里的用法</h3>
        <p>${renderLinkedEpisodeText(model.application)}</p>
      </section>
      <section class="detail-section split">
        <div>
          <h2>观察信号</h2>
          ${renderDetailList(model.signals)}
        </div>
        <div>
          <h2>适用边界</h2>
          ${renderDetailList(model.boundaries)}
        </div>
      </section>
      <section class="detail-section split">
        ${renderReferenceChipSection('共现概念', 'concepts', model.relatedConcepts, site.concepts)}
        ${renderReferenceChipSection('共现主题', 'themes', model.relatedThemes, site.themes)}
        ${renderReferenceChipSection('共现人物', 'people', model.relatedPeople, site.people)}
        ${renderReferenceChipSection('邻近模型', 'models', model.relatedModels, site.models)}
      </section>
      <section class="detail-section">
        <h2>自检问题</h2>
        ${renderDetailList(model.questions)}
      </section>
      <section class="detail-section">
        <h2>节目里的典型锚点</h2>
        ${renderHighlightCards(model.episodeHighlights?.length ? model.episodeHighlights : relatedEpisodes)}
      </section>
    </section>
  `;
}

function renderPersonDetail(id) {
  const person = site.people.find((item) => item.id === id);
  if (!person) {
    renderNotFound('人物不存在');
    return;
  }

  const personDescription = (person.description || '').trim();
  const hasMeaningfulDescription = personDescription && !personDescription.startsWith('在这些节目里，');

  const relatedEpisodes = (person.episodes || [])
    .map((entry) => {
      const episode = site.episodes.find((item) => item.id === entry.id);
      return episode ? { ...entry, title: episode.title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <div class="back-row">
          <a class="back-link" href="#/people">← 返回人物页</a>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <p class="detail-eyebrow">${escapeHtml(person.englishName || 'Person Node')}</p>
        <h1 class="detail-title">${escapeHtml(person.name)}</h1>
        ${person.englishName ? `<p class="detail-summary">${escapeHtml(person.englishName)}</p>` : ''}
      </div>
      <section class="detail-section">
        <h2>人物背景</h2>
        <p class="detail-lead">${renderLinkedEpisodeText(person.summary)}</p>
        ${hasMeaningfulDescription ? `<p>${renderLinkedEpisodeText(personDescription)}</p>` : ''}
      </section>
      <section class="detail-section">
        <h2>相关节目</h2>
        <div class="list">
          ${relatedEpisodes.map((entry) => `
            <a class="list-item" href="${routeTo(`episodes/${entry.id}`)}">
              <h3>${escapeHtml(entry.id)}｜${escapeHtml(entry.title)}</h3>
              <p>${renderLinkedEpisodeText(entry.note)}</p>
            </a>
          `).join('')}
        </div>
      </section>
    </section>
  `;
}

function renderThemeDetail(id) {
  const theme = site.themes.find((item) => item.id === id);
  if (!theme) {
    renderNotFound('主题不存在');
    return;
  }

  const relatedEpisodes = (theme.episodes || [])
    .map((entry) => {
      const episode = site.episodes.find((item) => item.id === entry.id);
      return episode ? { ...entry, title: episode.title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <div class="back-row">
          <a class="back-link" href="#/themes">← 返回主题页</a>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <p class="detail-eyebrow">Theme Node</p>
        <h1 class="detail-title">${escapeHtml(theme.name)}</h1>
        <p class="detail-summary">${escapeHtml(theme.summary)}</p>
      </div>
      <section class="detail-section">
        <h2>主题说明</h2>
        <p>${renderLinkedEpisodeText(theme.description)}</p>
      </section>
      <section class="detail-section">
        <h2>相关节目</h2>
        <div class="list">
          ${relatedEpisodes.map((entry) => `
            <a class="list-item" href="${routeTo(`episodes/${entry.id}`)}">
              <h3>${escapeHtml(entry.id)}｜${escapeHtml(entry.title)}</h3>
              <p>${renderLinkedEpisodeText(entry.note)}</p>
            </a>
          `).join('')}
        </div>
      </section>
    </section>
  `;
}

function renderKeywordDetail(id) {
  const keyword = site.keywords.find((item) => {
    const aliases = item.aliases || [];
    return (
      normalizeValue(item.id) === normalizeValue(id) ||
      normalizeValue(item.name) === normalizeValue(id) ||
      aliases.some((alias) => normalizeValue(alias) === normalizeValue(id))
    );
  });
  if (!keyword) {
    renderNotFound('关键词不存在');
    return;
  }

  const relatedEpisodes = (keyword.episodes || [])
    .map((entry) => {
      const episode = site.episodes.find((item) => item.id === entry.id);
      return episode ? { ...entry, title: episode.title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <div class="back-row">
          <a class="back-link" href="#/keywords">← 返回关键词页</a>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <p class="detail-eyebrow">Keyword Node</p>
        <h1 class="detail-title">${escapeHtml(keyword.name)}</h1>
        <p class="detail-summary">${escapeHtml(keyword.summary)}</p>
        <div class="detail-intro">${renderLinkedEpisodeText(keyword.description)}</div>
      </div>
      <section class="detail-section">
        <h2>简单介绍</h2>
        <p>${renderLinkedEpisodeText(keyword.description)}</p>
        ${keyword.aliases?.length ? `<h3>相关别名</h3>${chipList(keyword.aliases)}` : ''}
      </section>
      <section class="detail-section">
        <h2>相关节目</h2>
        <div class="list">
          ${relatedEpisodes.map((entry) => `
            <a class="list-item" href="${routeTo(`episodes/${entry.id}`)}">
              <h3>${escapeHtml(entry.id)}｜${escapeHtml(entry.title)}</h3>
              <p>${renderLinkedEpisodeText(entry.note)}</p>
            </a>
          `).join('')}
        </div>
      </section>
    </section>
  `;
}

function renderNotFound(message) {
  app.innerHTML = `
    <section class="detail">
      <div class="empty-state">${escapeHtml(message)}</div>
    </section>
  `;
}

function renderRoute() {
  if (!site) return;
  destroyGraphView();
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash ? hash.split('/').map(decodeRoutePart) : [];
  const [section, id] = parts;

  document.title = `${site.meta.title}`;

  if (!section) {
    renderHome();
  } else if (section === 'graph') {
    renderGraphPage();
  } else if (section === 'home' && id === 'curated') {
    renderHome('home-curated-episodes');
  } else if (section === 'episodes' && !id) {
    renderEpisodeIndex();
  } else if (section === 'concepts' && !id) {
    renderConceptIndex();
  } else if (section === 'models' && !id) {
    renderModelIndex();
  } else if (section === 'people' && !id) {
    renderPeopleIndex();
  } else if (section === 'themes' && !id) {
    renderThemesIndex();
  } else if (section === 'keywords' && !id) {
    renderKeywordIndex();
  } else if (section === 'episodes' && id) {
    renderEpisodeDetail(id);
  } else if (section === 'concepts' && id) {
    renderConceptDetail(id);
  } else if (section === 'models' && id) {
    renderModelDetail(id);
  } else if (section === 'people' && id) {
    renderPersonDetail(id);
  } else if (section === 'themes' && id) {
    renderThemeDetail(id);
  } else if (section === 'keywords' && id) {
    renderKeywordDetail(id);
  } else {
    renderNotFound('页面不存在');
  }

  closeSidebar();
}

async function init() {
  const [siteResponse, graphResponse] = await Promise.all([
    fetch(dataUrl('site.json')),
    fetch(dataUrl('graph.json'))
  ]);
  site = await siteResponse.json();
  graphData = await graphResponse.json();
  renderSidebar();
  renderRoute();
}

init().catch((error) => {
  app.innerHTML = `<div class="empty-state">加载失败：${escapeHtml(error.message)}</div>`;
});
