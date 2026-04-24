import { destroyGraphView, renderGraphView } from './graph-view.js';

const app = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const sidebarBody = document.getElementById('sidebar-body');
const menuButton = document.getElementById('menu-button');
const desktopMenuButton = document.getElementById('desktop-menu-button');
const sidebarClose = document.getElementById('sidebar-close');
const backToTopButton = document.getElementById('back-to-top');
const floatingEpisodeSearchButton = document.getElementById('floating-episode-search');
const floatingActions = document.getElementById('floating-actions');
const floatingActionsToggle = document.getElementById('floating-actions-toggle');
const sectionProgress = document.getElementById('section-progress');
const sectionProgressPanel = document.getElementById('section-progress-panel');
const viewportMeta = document.querySelector('meta[name="viewport"]');
const HOME_PLATFORM_LINKS = [
  {
    platform: 'bilibili',
    url: 'https://space.bilibili.com/91741174?spm_id_from=333.337.search-card.all.click'
  },
  {
    platform: 'youtube',
    url: 'https://www.youtube.com/@颖响力'
  }
];
const WEBSITE_LOG_ENTRIES = [
  {
    date: '2026-04-24',
    title: '节目索引关键词可跳转、轮盘定位修正与可点击态强化',
    items: [
      '节目索引卡片改成和首页一致：整卡进入节目详情，关键词标签单独进入对应关键词页。',
      '节目索引卡片里删掉无意义的“关键词”提示字样，头部说明也收成更干净的标题区。',
      '节目索引右侧“节目轮盘”打开时会自动滚到当前节目，不再总是从顶部开始显示。',
      '首页右侧悬浮按钮补入节目搜索放大镜，顺序整理成“导航 / 搜索 / 首页 / 返回顶部”。',
      '从任意页面调起节目搜索后，如果没有真正进入结果，会回到原页面和原滚动位置，不再先跳到顶部再退回。',
      '节目索引顶部补上“返回前一页”，避免只剩“返回首页”这一条出口。',
      '节目索引里的最近三天节目现在也会显示和首页一致的红色“新”标识，三天后自动消失。',
      '首页与节目索引里的关键词链接重新拉开默认态颜色，让用户更容易看出这些标签可以点击。',
      '关键词在深色卡片上的 hover 状态统一改回浅底高亮，避免悬停后和背景糊在一起看不清。',
      '节目搜索取消自动收起，改成由用户主动退出；同时补齐并更新这批首页 / 节目索引交互的桌面与移动 UI 冒烟检查。'
    ]
  },
  {
    date: '2026-04-23',
    title: '首页状态规则回收，折叠箭头修复，桌面轮播恢复多卡',
    items: [
      '修复移动端折叠态“向上”按钮图标异常：Safari 缩放下不再把箭头渲染成一个点。',
      '首页节目卡片状态文案恢复为“新 / 已整理 / 待整理”三态，不再把会员状态塞进首页卡片眉标。',
      'EP124 的 B 站链接继续保留会员数据，但会员标识只留在节目详情页视频入口，不再干扰首页状态判断。',
      '桌面首页节目区恢复按宽度显示 1-3 张，不再和移动端强行共用单卡布局。',
      '桌面节目切换改回更稳定的直接切换，先消掉卡顿和闪烁，再保留多卡可读性。',
      '补入项目内自动化 UI 回归命令，桌面与移动端统一纳入固定冒烟检查。'
    ]
  },
  {
    date: '2026-04-23',
    title: '移动端首页继续收紧，视频链接与交互问题修复',
    items: [
      '移动端首页 Hero 区继续反复校准：标题、头像、平台按钮的相对位置重新梳理，避免头像把标题和按钮布局拖坏。',
      '移动端首页节目卡片改成更紧凑的内容优先布局，删掉冗余按钮与提示，把更多可视空间留给节目简介本身。',
      '首页节目卡片的触摸点击判定放宽，减少手指轻微位移时“点了却没打开节目”的情况。',
      '移动端左侧导航打开时增加真实滚动锁，避免侧栏打开后背景页面继续跟着滑动。',
      '重新同步节目视频链接数据，修复大量节目页里 YouTube 显示“未找到”的问题。',
      '首页最新节目“新”标签增加兜底判断，避免部署数据异常时最新一期不亮新标。'
    ]
  },
  {
    date: '2026-04-22',
    title: '首页恢复可用并收敛轮播与搜索联动',
    items: [
      '修复首页脚本重复声明，解除“正在加载知识库...”卡死状态。',
      '节目索引轮播改为局部更新，按钮、手势与自动轮播统一按一次移动一个节目处理。',
      '首页节目卡片高度收敛到稳定区间，切换不同节目时下方模块不再被顶着跳动。',
      '手机版节目索引改成带前后页预览的滑动条，拖动时能看到上一张和下一张的边缘。',
      '移动端节目索引在拖动和按钮操作期间会暂停自动轮播，避免和用户操作打架。',
      '首页文字层级从“一套字体打到底”改成标题、卡片标题、正文、辅助说明四层语气，并拉开版块底色。',
      '自动轮播切换时不再把页面滚回上方，也不会异常带出首页搜索栏。',
      '首页搜索在输入时会把搜索栏和结果区一起带回可见区，离开原始区域后再自动收起。',
      '首页卡片与下半区不再延迟到滚动过深才显现，避免用户翻到中段还看到空白。'
    ]
  },
  {
    date: '2026-04-22',
    title: '首页、关键词页与轮盘交互重做',
    items: [
      '关键词页改成按内容类别浏览，不再按引用量堆成大块。',
      '右侧轮盘与章节面板多轮调整，标签来源、章节高亮和视觉层级重新梳理。',
      '首页节目卡片点击逻辑拆开：整卡跳节目，标签独立跳关键词。'
    ]
  },
  {
    date: '2026-04-22',
    title: '移动端节奏与排版继续打磨',
    items: [
      '首页与节目索引的搜索栏显隐边界重新校准。',
      '移动端首页、节目索引的留白、标题区、卡片节奏做了收紧。',
      '首页推荐关键词增加“换一换”，推荐区标题与按钮重新设计。',
      '首页统计卡片 hover 与小标签高亮做了更细的层次化处理。'
    ]
  },
  {
    date: '2026-04-22',
    title: '引用、导航与分组逻辑继续补齐',
    items: [
      '子页里的 EP 文案统一改成可跳转引用，减少“看到但点不了”的情况。',
      '轮盘标签优先取中文标题与分组标题，不再误读到英文壳文案或第一张卡片词。',
      '首页与知识图谱区域的小入口分别梳理主跳转与次级跳转逻辑。'
    ]
  },
  {
    date: '2026-04-22',
    title: '整体字体系与可读性升级',
    items: [
      '页面主标题、模块标题、卡片标题、正文、辅助说明重新拉开层级。',
      '深色 hover 卡片的标题与正文对比重新校准，避免深底棕字看不清。',
      '推荐关键词、统计卡片与侧栏目录的文字层次重新梳理。'
    ]
  },
  {
    date: '2026-04-21',
    title: '首页入口、视频链路与发布流打通',
    items: [
      '首页平台入口与节目视频入口统一上线。',
      '构建流程改成同步刷新 docs 发布目录，减少本地与发布版不一致。',
      'GitHub Pages 分支发布链路与 Workers 构建路径一起整理。'
    ]
  },
  {
    date: '2026-04-21',
    title: '侧栏与首页导航结构开始成型',
    items: [
      '侧栏头像、品牌区和首页节目标签固定到底部排布。',
      '首页搜索、人物入口、知识卡片和视频可用性做了首轮修复。',
      '知识图谱入口与侧栏身份区开始稳定到当前结构。'
    ]
  },
  {
    date: '2026-04-20',
    title: '知识库网页首轮可发布版本',
    items: [
      '知识卡片、引用关系和页面发布流程完成首轮稳定化。',
      '网站从 branch-backed GitHub Pages 源成功发布。',
      '内容引用修复和基础卡片结构开始在线可用。'
    ]
  }
];

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

let site = null;
let graphData = null;
let homeKnowledgeQuery = '';
let homeRecommendationSeed = 0;
let homeEpisodeCarouselIndex = 0;
let sidebarKeywordQuery = '';
let keywordIndexQuery = '';
let episodeIndexQuery = '';
let episodeIndexAppliedQuery = '';
let episodeIndexRangeStart = 0;
let episodeIndexSearchMode = false;
let episodeIndexFocusSearchOnRender = false;
let episodeIndexSearchOriginHash = '';
let episodeIndexSearchOriginScrollX = 0;
let episodeIndexSearchOriginScrollY = 0;
let pendingRouteRestore = null;
let conceptIndexQuery = '';
let modelIndexQuery = '';
let peopleIndexQuery = '';
let themeIndexQuery = '';
let episodeToolbarController = null;
let homeSearchToolbarController = null;
let episodeIndexSearchController = null;
let episodeIndexSearchAutoHideTimer = 0;
let sectionSnapTimer = 0;
let scrollDirection = 1;
let lastScrollY = 0;
let lastSnapAt = 0;
let pointerIsDown = false;
let floatingActionsExpanded = false;
let floatingActionsIdleTimer = 0;
let homeEpisodeCarouselTimer = 0;
let homeEpisodeAutoAdvancePausedUntil = 0;
let homeEpisodeSwipeStartX = 0;
let homeEpisodeSwipeStartY = 0;
let homeEpisodeSwipePointerId = null;
let homeEpisodeSwipeTracking = false;
let homeEpisodeCarouselBindingsController = null;
let homeEpisodeCarouselAnimating = false;
let contentRevealObserver = null;
let suspendSnapUntil = 0;
let snapAnimationFrame = 0;
let snapPreviousScrollBehavior = '';
let lastSnapTargetTop = -1;
let lastUserReleaseAt = 0;
let sectionProgressHideTimer = 0;
let sectionProgressBlurTimer = 0;
let lastScrollSampleAt = performance.now();
let lastScrollSpeed = 0;
let sectionProgressPanelOpen = false;
let sectionProgressActiveIndex = -1;
let sectionProgressPulseTimer = 0;
let sectionProgressAutoCloseTimer = 0;
let lastHomeEpisodeVisibleCount = 3;
let lastHomeMobileLayout = false;
let mobileViewportResetTimer = 0;
let hasRenderedRoute = false;
let lastRenderedHash = window.location.hash || '#/';
let sidebarLockedScrollY = 0;
const PERSON_NAV_MIN_REFERENCES = 2;
const HOME_EPISODE_AUTO_ADVANCE_MS = 7000;
const HOME_EPISODE_DESKTOP_AUTO_ADVANCE_MS = 11000;
const HOME_EPISODE_ANIMATION_MS = 644;
const HOME_EPISODE_DESKTOP_ANIMATION_MS = 520;
const DESKTOP_SIDEBAR_STORAGE_KEY = 'yinfluence-sidebar-collapsed';
const SNAP_SECTION_SELECTOR = '.hero, .home-search-toolbar, .home-search-section, .section, .detail-header, .detail-section';
const PROGRESS_SECTION_SELECTOR = '.hero, .home-search-section, .section, .detail-header, .detail-section';
const REVEAL_SELECTOR = '.hero, .home-search-toolbar, .home-search-section, .section, .detail-header, .detail-section, .card, .list-item, .graph-panel-card, .graph-canvas-card';
const DEFAULT_VIEWPORT_CONTENT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';

function isDesktopViewport() {
  return window.matchMedia('(min-width: 981px)').matches;
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 720px)').matches;
}

function useMobileHomeLayout() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function isTextEntryElement(element) {
  return (
    element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || element instanceof HTMLSelectElement
  );
}

function blurSearchInputs() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return false;
  if (!activeElement.closest('.sidebar-search-wrap, .home-search-toolbar, .episode-index-toolbar, .keyword-toolbar')) {
    return false;
  }
  if (!isTextEntryElement(activeElement)) return false;
  activeElement.blur();
  return true;
}

function normalizeMobileViewport({ force = false } = {}) {
  if (!isMobileViewport()) return;

  const didBlurSearchInput = blurSearchInputs();
  const currentScale = window.visualViewport?.scale || 1;
  if (!force && !didBlurSearchInput && currentScale <= 1.01) return;
  if (!(viewportMeta instanceof HTMLMetaElement)) return;

  window.clearTimeout(mobileViewportResetTimer);
  viewportMeta.setAttribute('content', `${DEFAULT_VIEWPORT_CONTENT}, maximum-scale=1`);

  window.requestAnimationFrame(() => {
    scrollWindowInstantly(window.scrollY, window.scrollX);
    mobileViewportResetTimer = window.setTimeout(() => {
      viewportMeta.setAttribute('content', DEFAULT_VIEWPORT_CONTENT);
    }, 220);
  });
}

function parseHashRoute(hashValue) {
  const hash = String(hashValue || '').replace(/^#\/?/, '');
  const parts = hash ? hash.split('/').map(decodeRoutePart) : [];
  const [section = '', id = ''] = parts;

  return {
    section,
    id,
    episodeNumber: section === 'episodes' && id ? episodeNumberFromId(id) : NaN
  };
}

function getRouteTransitionKind(previousHash, nextHash) {
  const previousRoute = parseHashRoute(previousHash);
  const nextRoute = parseHashRoute(nextHash);

  if (previousRoute.section === 'episodes' && previousRoute.id && nextRoute.section === 'episodes' && nextRoute.id) {
    return 'content-static';
  }

  return nextRoute.section ? 'content-forward' : 'content-home';
}

function getDesktopSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function applyDesktopSidebarState() {
  const collapsed = isDesktopViewport() && getDesktopSidebarCollapsedPreference();
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  desktopMenuButton?.setAttribute('aria-expanded', String(!collapsed));
  syncFloatingActionLabels();
}

function setDesktopSidebarCollapsed(collapsed) {
  try {
    window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, collapsed ? 'true' : 'false');
  } catch {
    // Ignore storage failures and still apply the UI state.
  }
  applyDesktopSidebarState();
}

function toggleDesktopSidebar() {
  setDesktopSidebarCollapsed(!getDesktopSidebarCollapsedPreference());
}

function isHomeRoute() {
  return window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/' || window.location.hash === '#';
}

function syncFloatingActionLabels() {
  if (menuButton) {
    const menuLabel = isDesktopViewport()
      ? (getDesktopSidebarCollapsedPreference() ? '展开导航' : '收起导航')
      : (document.body.classList.contains('sidebar-open') ? '关闭导航' : '打开导航');
    menuButton.setAttribute('aria-label', menuLabel);
    menuButton.setAttribute('title', menuLabel);
  }

  const floatingHomeButton = document.getElementById('floating-home');
  if (floatingHomeButton) {
    const homeLabel = isHomeRoute() ? '返回顶部' : '返回首页';
    floatingHomeButton.setAttribute('aria-label', homeLabel);
    floatingHomeButton.setAttribute('title', homeLabel);
  }

  if (backToTopButton) {
    backToTopButton.setAttribute('title', '柔和返回顶部');
  }
}

function setFloatingActionsExpanded(expanded) {
  floatingActionsExpanded = expanded;
  floatingActions?.classList.toggle('is-collapsed', !expanded);
  floatingActionsToggle?.setAttribute('aria-expanded', String(expanded));
  floatingActionsToggle?.setAttribute('aria-label', expanded ? '收起快捷操作' : '展开快捷操作');
}

function scheduleFloatingActionsAutoCollapse() {
  window.clearTimeout(floatingActionsIdleTimer);
  if (!floatingActionsExpanded) return;
  const collapseDelay = isMobileViewport() && isHomeRoute() && window.scrollY < 72
    ? 10000
    : 1400;
  floatingActionsIdleTimer = window.setTimeout(() => {
    if (!floatingActionsExpanded) return;
    if (document.body.classList.contains('section-progress-panel-open')) return;
    setFloatingActionsExpanded(false);
  }, collapseDelay);
}

function syncBackToTopVisibility() {
  const shouldShow = true;
  backToTopButton?.classList.toggle('visible', shouldShow);
}

function syncFloatingActionsByScroll(currentScrollY) {
  if (document.body.classList.contains('section-progress-panel-open')) {
    setFloatingActionsExpanded(false);
    return;
  }

  const delta = currentScrollY - lastScrollY;
  if (currentScrollY < 72 || delta < -18) {
    setFloatingActionsExpanded(true);
    scheduleFloatingActionsAutoCollapse();
    return;
  }

  const collapseThreshold = isMobileViewport() ? 180 : 140;
  if (currentScrollY > collapseThreshold && delta > 18) {
    setFloatingActionsExpanded(false);
  }
}

function clearEpisodeIndexSearchOrigin() {
  episodeIndexSearchOriginHash = '';
  episodeIndexSearchOriginScrollX = 0;
  episodeIndexSearchOriginScrollY = 0;
}

function restoreEpisodeIndexSearchOrigin() {
  const originHash = episodeIndexSearchOriginHash || '#/';
  const originScrollX = episodeIndexSearchOriginScrollX || 0;
  const originScrollY = episodeIndexSearchOriginScrollY || 0;
  clearEpisodeIndexSearchOrigin();

  if (originHash === '#/episodes') {
    episodeIndexQuery = '';
    episodeIndexAppliedQuery = '';
    episodeIndexSearchMode = false;
    renderEpisodeIndex();
    window.requestAnimationFrame(() => {
      scrollWindowInstantly(originScrollY, originScrollX);
    });
    return;
  }

  pendingRouteRestore = {
    hash: originHash,
    scrollX: originScrollX,
    scrollY: originScrollY
  };
  window.location.hash = originHash;
}

function openEpisodeIndexSearch() {
  normalizeMobileViewport({ force: true });
  closeSidebar();
  episodeIndexSearchOriginHash = window.location.hash || '#/';
  episodeIndexSearchOriginScrollX = window.scrollX;
  episodeIndexSearchOriginScrollY = window.scrollY;
  episodeIndexQuery = '';
  episodeIndexAppliedQuery = '';
  episodeIndexSearchMode = true;
  episodeIndexFocusSearchOnRender = true;
  if (window.location.hash === '#/episodes') {
    renderRoute();
    return;
  }
  window.location.hash = '#/episodes';
}

function getProgressSections() {
  const explicitSections = [...app.querySelectorAll('[data-progress-section="true"]')].filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    const rect = section.getBoundingClientRect();
    return rect.height > 0;
  });

  if (explicitSections.length) {
    if (document.body.classList.contains('page-episode-index')) {
      return explicitSections;
    }
    const headerSections = [...app.querySelectorAll('.hero, .detail-header')].filter((section) => {
      if (!(section instanceof HTMLElement)) return false;
      const rect = section.getBoundingClientRect();
      return rect.height > 0;
    });
    return [...headerSections, ...explicitSections];
  }

  return [...app.querySelectorAll(PROGRESS_SECTION_SELECTOR)].filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    const rect = section.getBoundingClientRect();
    return rect.height > 0;
  });
}

function getSectionProgressLabel(section) {
  if (!(section instanceof HTMLElement)) return '';
  if (section.classList.contains('hero')) return '首页';
  const explicitLabel = section.dataset.progressLabel?.trim();
  if (explicitLabel) {
    if (document.body.classList.contains('page-episode-index')) {
      return explicitLabel;
    }
    return explicitLabel.length > 8 ? `${explicitLabel.slice(0, 8)}…` : explicitLabel;
  }
  const selectorPriority = ['.detail-title', '.section-title', 'h1', 'h2', 'h3', '.search-subtitle', '.detail-eyebrow'];
  const genericEnglishLabels = new Set(['keywords', 'keyword node', 'mental model', 'concept card', 'theme node']);
  const candidates = selectorPriority.flatMap((selector) => (
    [...section.querySelectorAll(selector)]
      .map((node) => node.textContent?.trim() || '')
      .filter(Boolean)
  ));

  const preferredLabel = candidates.find((label) => /[\u3400-\u9fff]/.test(label))
    || candidates.find((label) => !genericEnglishLabels.has(label.toLowerCase()))
    || '';

  const label = preferredLabel
    .replace(/\bEP\d+\b/gi, '')
    .replace(/[A-Za-z]+/g, '')
    .replace(/[|｜:：•·]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return label.length > 8 ? `${label.slice(0, 8)}…` : label;
}

function pulseSectionProgressWheel() {
  if (!sectionProgress) return;
  sectionProgress.classList.remove('is-pulsing');
  void sectionProgress.offsetWidth;
  sectionProgress.classList.add('is-pulsing');
  window.clearTimeout(sectionProgressPulseTimer);
  sectionProgressPulseTimer = window.setTimeout(() => {
    sectionProgress.classList.remove('is-pulsing');
  }, 420);
}

function renderSectionProgress() {
  const sections = getProgressSections();
  if (!sectionProgress) return;

  if (sections.length < 2 || window.location.hash.replace(/^#\/?/, '').startsWith('graph')) {
    sectionProgress.hidden = true;
    sectionProgress.innerHTML = '';
    return;
  }

  sectionProgress.hidden = false;
  sectionProgress.innerHTML = `
    <span class="section-progress-wheel">
      <span class="section-progress-item prev">
        <span class="section-progress-label" data-role="prev"></span>
      </span>
      <span class="section-progress-item current">
        <span class="section-progress-label" data-role="current"></span>
      </span>
      <span class="section-progress-item next">
        <span class="section-progress-label" data-role="next"></span>
      </span>
    </span>
  `;
  renderSectionProgressPanel();
}

function renderSectionProgressPanel() {
  if (!sectionProgressPanel) return;
  const sections = getProgressSections();
  if (sections.length < 2) {
    sectionProgressPanel.hidden = true;
    sectionProgressPanel.innerHTML = '';
    return;
  }

  sectionProgressPanel.innerHTML = `
    <div class="section-progress-panel-card">
      <p class="section-progress-panel-title">${document.body.classList.contains('page-episode-index') ? '节目轮盘' : '页面章节'}</p>
      <div class="section-progress-panel-list">
        ${sections.map((section, index) => `
          <button class="section-progress-panel-item" type="button" data-section-progress-target="${index}">
            <span class="section-progress-panel-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="section-progress-panel-text">${getSectionProgressLabel(section)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function scrollActiveSectionProgressItemIntoView({ behavior = 'auto' } = {}) {
  if (!sectionProgressPanelOpen || !(sectionProgressPanel instanceof HTMLElement)) return;
  const list = sectionProgressPanel.querySelector('.section-progress-panel-list');
  const activeItem = sectionProgressPanel.querySelector('.section-progress-panel-item.is-active');
  if (!(list instanceof HTMLElement) || !(activeItem instanceof HTMLElement)) return;

  const listRect = list.getBoundingClientRect();
  const activeRect = activeItem.getBoundingClientRect();
  const currentScrollTop = list.scrollTop;
  const targetScrollTop = currentScrollTop + (activeRect.top - listRect.top) - (listRect.height - activeRect.height) / 2;
  const maxScrollTop = Math.max(list.scrollHeight - list.clientHeight, 0);

  list.scrollTo({
    top: Math.min(Math.max(targetScrollTop, 0), maxScrollTop),
    behavior
  });
}

function syncSectionProgress({ reveal = false, blur = false } = {}) {
  if (!sectionProgress || sectionProgress.hidden) return;

  const sections = getProgressSections();
  if (sections.length < 2) return;

  const probeY = window.innerHeight * 0.28;
  let activeIndex = sections.findIndex((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= probeY && rect.bottom > probeY;
  });

  if (activeIndex < 0) {
    activeIndex = sections.findIndex((section) => section.getBoundingClientRect().top > 0);
    if (activeIndex < 0) activeIndex = sections.length - 1;
  }

  const previousLabel = getSectionProgressLabel(sections[activeIndex - 1]);
  const currentLabel = getSectionProgressLabel(sections[activeIndex]);
  const nextLabel = getSectionProgressLabel(sections[activeIndex + 1]);
  const prevNode = sectionProgress.querySelector('[data-role="prev"]');
  const currentNode = sectionProgress.querySelector('[data-role="current"]');
  const nextNode = sectionProgress.querySelector('[data-role="next"]');

  if (prevNode) prevNode.textContent = previousLabel;
  if (currentNode) currentNode.textContent = currentLabel;
  if (nextNode) nextNode.textContent = nextLabel;

  sectionProgress.querySelector('.section-progress-item.prev')?.classList.toggle('is-empty', !previousLabel);
  sectionProgress.querySelector('.section-progress-item.current')?.classList.toggle('is-empty', !currentLabel);
  sectionProgress.querySelector('.section-progress-item.next')?.classList.toggle('is-empty', !nextLabel);
  sectionProgressPanel?.querySelectorAll('.section-progress-panel-item').forEach((item, index) => {
    item.classList.toggle('is-active', index === activeIndex);
  });

  if (activeIndex !== sectionProgressActiveIndex) {
    sectionProgressActiveIndex = activeIndex;
    pulseSectionProgressWheel();
    if (reveal && !sectionProgressPanelOpen) {
      showSectionProgressTemporarily({ blur });
    }
    if (sectionProgressPanelOpen) {
      window.requestAnimationFrame(() => {
        scrollActiveSectionProgressItemIntoView({ behavior: 'smooth' });
      });
    }
  }
}

function showSectionProgressTemporarily({ blur = false } = {}) {
  if (!sectionProgress || sectionProgress.hidden) return;
  if (isHomeRoute()) {
    const homeEpisodesSection = document.getElementById('home-episodes');
    if (homeEpisodesSection instanceof HTMLElement) {
      const revealThreshold = Math.max(window.scrollY + homeEpisodesSection.getBoundingClientRect().top - window.innerHeight * 0.42, 96);
      if (window.scrollY < revealThreshold) {
        sectionProgress.classList.remove('is-visible');
        return;
      }
    }
  }
  sectionProgress.classList.add('is-visible');
  if (blur && !sectionProgressPanelOpen) {
    document.body.classList.add('section-progress-fast');
    window.clearTimeout(sectionProgressBlurTimer);
    sectionProgressBlurTimer = window.setTimeout(() => {
      if (sectionProgressPanelOpen) return;
      document.body.classList.remove('section-progress-fast');
    }, 140);
  }
  window.clearTimeout(sectionProgressHideTimer);
  sectionProgressHideTimer = window.setTimeout(() => {
    if (sectionProgressPanelOpen) return;
    sectionProgress.classList.remove('is-visible');
  }, blur ? 1280 : 980);
}

function clearSectionProgressEffects() {
  window.clearTimeout(sectionProgressHideTimer);
  window.clearTimeout(sectionProgressBlurTimer);
  window.clearTimeout(sectionProgressPulseTimer);
  window.clearTimeout(sectionProgressAutoCloseTimer);
  sectionProgress?.classList.remove('is-visible');
  sectionProgress?.classList.remove('is-pulsing');
  document.body.classList.remove('section-progress-fast');
}

function closeSectionProgressPanel({ keepWheelVisible = false } = {}) {
  sectionProgressPanelOpen = false;
  document.body.classList.remove('section-progress-panel-open');
  if (sectionProgressPanel) {
    sectionProgressPanel.hidden = true;
  }
  if (keepWheelVisible) {
    showSectionProgressTemporarily({ blur: false });
    return;
  }
  clearSectionProgressEffects();
}

function setSectionProgressPanelOpen(open) {
  sectionProgressPanelOpen = open;
  document.body.classList.toggle('section-progress-panel-open', open);
  if (!sectionProgressPanel) return;
  sectionProgressPanel.hidden = !open;
  if (open) {
    window.clearTimeout(sectionProgressHideTimer);
    window.clearTimeout(sectionProgressBlurTimer);
    window.clearTimeout(sectionProgressAutoCloseTimer);
    sectionProgress.classList.add('is-visible');
    document.body.classList.remove('section-progress-fast');
    window.requestAnimationFrame(() => {
      syncSectionProgress();
      scrollActiveSectionProgressItemIntoView({ behavior: 'auto' });
    });
    if (!document.body.classList.contains('page-episode-index')) {
      sectionProgressAutoCloseTimer = window.setTimeout(() => {
        closeSectionProgressPanel({ keepWheelVisible: true });
      }, 1800);
    }
  } else {
    window.clearTimeout(sectionProgressAutoCloseTimer);
    closeSectionProgressPanel({ keepWheelVisible: true });
  }
}

function shouldAssistSectionSnap() {
  if (!document.body.classList.contains('has-assisted-snap')) return false;
  if (document.body.classList.contains('sidebar-open')) return false;
  if (document.body.classList.contains('page-episode-index')) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.location.hash.replace(/^#\/?/, '').startsWith('graph')) return false;
  if (Date.now() < suspendSnapUntil) return false;
  if (Date.now() - lastUserReleaseAt < 220) return false;
  const recentScrollSpeed = performance.now() - lastScrollSampleAt > 180 ? 0 : lastScrollSpeed;
  if (recentScrollSpeed > 1.1) return false;
  const activeElement = document.activeElement;
  return !(
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement
  );
}

function cancelSnapAnimation() {
  if (!snapAnimationFrame) return;
  window.cancelAnimationFrame(snapAnimationFrame);
  snapAnimationFrame = 0;
  document.documentElement.style.scrollBehavior = snapPreviousScrollBehavior;
}

function scrollWindowInstantly(top = 0, left = 0) {
  cancelSnapAnimation();
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(left, top);
  window.requestAnimationFrame(() => {
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

function animateWindowScrollTo(targetTop, options = {}) {
  cancelSnapAnimation();

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  if (Math.abs(distance) < 3) return;

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  snapPreviousScrollBehavior = previousScrollBehavior;
  root.style.scrollBehavior = 'auto';

  const { durationScale = 1 } = options;
  const duration = Math.max(400, Math.min(680, Math.abs(distance) * 1.02)) * durationScale;
  const startTime = performance.now();
  suspendSnapUntil = Date.now() + duration + 140;

  const easeInOutCubic = (progress) => (
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2
  );

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startTop + distance * eased);

    if (progress < 1) {
      snapAnimationFrame = window.requestAnimationFrame(step);
      return;
    }

    window.scrollTo(0, targetTop);
    root.style.scrollBehavior = previousScrollBehavior;
    snapAnimationFrame = 0;
    snapPreviousScrollBehavior = '';
  };

  snapAnimationFrame = window.requestAnimationFrame(step);
}

function getSnapSections() {
  const sectionNodes = [...app.querySelectorAll(SNAP_SECTION_SELECTOR)];
  const episodeCardNodes = document.body.classList.contains('page-episode-index') && isMobileViewport()
    ? [...app.querySelectorAll('#episode-index-results .list-item')]
    : [];

  return [...new Set([...sectionNodes, ...episodeCardNodes])].filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    const rect = section.getBoundingClientRect();
    return rect.height > 0;
  });
}

function snapTowardsAdjacentSection() {
  if (!shouldAssistSectionSnap()) return;
  if (pointerIsDown) return;

  const now = Date.now();
  if (now - lastSnapAt < 280) return;
  const maxScrollTop = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  const nearDocumentBottom = maxScrollTop - window.scrollY < Math.max(54, window.innerHeight * 0.06);
  if (nearDocumentBottom && scrollDirection >= 0) return;

  const maxSnapDistance = isMobileViewport() ? 168 : 132;
  const directionPenalty = isMobileViewport() ? 16 : 12;
  const sections = getSnapSections().map((section) => {
    const rect = section.getBoundingClientRect();
    const visiblePixels = Math.max(Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 20), 0);
    const visibleRatio = visiblePixels / Math.max(Math.min(rect.height, window.innerHeight), 1);
    return {
      section,
      rect,
      targetTop: window.scrollY + rect.top - 20,
      visibleRatio
    };
  });

  if (sections.length < 2) return;

  const target = sections
    .map((entry) => {
      const distance = Math.abs(entry.targetTop - window.scrollY);
      const anchorDistance = Math.abs(entry.rect.top - 20);
      const directionalBias = scrollDirection >= 0
        ? (entry.targetTop < window.scrollY ? directionPenalty : 0)
        : (entry.targetTop > window.scrollY ? directionPenalty : 0);
      const interstitialBonus = entry.rect.top < window.innerHeight * 0.42 && entry.rect.bottom > window.innerHeight * 0.58 ? 16 : 0;
      const coverageBonus = Math.min(entry.visibleRatio * 28, 18) + interstitialBonus;

      return {
        ...entry,
        distance,
        score: anchorDistance + directionalBias - coverageBonus
      };
    })
    .filter((entry) => entry.distance >= 10 && entry.distance <= maxSnapDistance && entry.targetTop < maxScrollTop - 4)
    .sort((a, b) => a.score - b.score || a.distance - b.distance)[0];

  if (!target) return;
  if (Math.abs(target.targetTop - lastSnapTargetTop) < 10) return;

  lastSnapAt = now;
  lastSnapTargetTop = target.targetTop;
  animateWindowScrollTo(Math.max(target.targetTop, 0), { durationScale: 0.9 });
}

function scheduleSectionSnap() {
  window.clearTimeout(sectionSnapTimer);
  if (!shouldAssistSectionSnap()) return;
  sectionSnapTimer = window.setTimeout(() => {
    snapTowardsAdjacentSection();
  }, 140);
}

function teardownRevealAnimations() {
  contentRevealObserver?.disconnect();
  contentRevealObserver = null;
}

function setupRevealAnimations() {
  teardownRevealAnimations();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const revealTargets = [...document.querySelectorAll(REVEAL_SELECTOR)]
    .filter((node) => node instanceof HTMLElement)
    .filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (!document.body.classList.contains('page-episode-index')) return true;
      if (!isMobileViewport()) return true;
      return !node.matches('#episode-index-results .list-item, .episode-index-toolbar-shell, .episode-index-toolbar');
    });
  if (!revealTargets.length) return;

  if (isHomeRoute()) {
    revealTargets.forEach((node, index) => {
      node.classList.add('reveal-ready', 'is-visible');
      node.style.setProperty('--reveal-delay', `${Math.min(index * 24, 120)}ms`);
    });
    return;
  }

  const initialViewportBottom = window.innerHeight * 1.2;

  revealTargets.forEach((node, index) => {
    node.classList.add('reveal-ready');
    node.style.setProperty('--reveal-delay', `${Math.min(index * 36, 220)}ms`);

    const rect = node.getBoundingClientRect();
    const isInitiallyVisible = rect.top < initialViewportBottom && rect.bottom > 0;
    if (isInitiallyVisible) {
      node.classList.add('is-visible');
    }
  });

  const deferredTargets = revealTargets.filter((node) => !node.classList.contains('is-visible'));
  if (!deferredTargets.length) return;

  contentRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      contentRevealObserver?.unobserve(entry.target);
    });
  }, {
    threshold: 0.03,
    rootMargin: '0px 0px 18% 0px'
  });

  window.requestAnimationFrame(() => {
    deferredTargets.forEach((node) => {
      contentRevealObserver?.observe(node);
    });
  });
}

function refreshViewportBehaviors({ resetDock = false } = {}) {
  applyDesktopSidebarState();
  syncBackToTopVisibility();
  if (!isMobileViewport()) {
    setFloatingActionsExpanded(true);
  } else if (isHomeRoute() && window.scrollY < 72) {
    setFloatingActionsExpanded(false);
  } else if (resetDock) {
    setFloatingActionsExpanded(true);
  }
  if (!isMobileViewport()) {
    floatingActions?.classList.remove('is-collapsed');
  }
  syncFloatingActionLabels();
}

function openSidebar() {
  sidebarLockedScrollY = window.scrollY;
  sidebar.classList.add('open');
  document.body.classList.add('sidebar-open');
  document.body.style.top = `-${sidebarLockedScrollY}px`;
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = false;
  }
  syncFloatingActionLabels();
}

function closeSidebar() {
  sidebar.classList.remove('open');
  document.body.classList.remove('sidebar-open');
  document.body.style.removeProperty('top');
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = true;
  }
  scrollWindowInstantly(sidebarLockedScrollY, window.scrollX);
  normalizeMobileViewport();
  syncFloatingActionLabels();
}

menuButton.addEventListener('click', () => {
  if (isDesktopViewport()) {
    toggleDesktopSidebar();
    return;
  }
  if (document.body.classList.contains('sidebar-open')) {
    closeSidebar();
    return;
  }
  openSidebar();
});
desktopMenuButton?.addEventListener('click', () => {
  if (!isDesktopViewport()) return;
  setDesktopSidebarCollapsed(false);
});
sidebarClose.addEventListener('click', closeSidebar);
sidebarBackdrop?.addEventListener('click', closeSidebar);
backToTopButton?.addEventListener('click', () => {
  if (window.scrollY <= 8) {
    setFloatingActionsExpanded(true);
    scheduleFloatingActionsAutoCollapse();
    return;
  }
  animateWindowScrollTo(0, { durationScale: 1.25 });
});
floatingEpisodeSearchButton?.addEventListener('click', (event) => {
  event.preventDefault();
  openEpisodeIndexSearch();
});
function bindHomeSurfaceToTop(selector) {
  document.querySelectorAll(selector).forEach((node) => {
    node.addEventListener('click', (event) => {
      if (!isHomeRoute()) return;
      event.preventDefault();
      animateWindowScrollTo(0, { durationScale: 1.25 });
    });
  });
}

bindHomeSurfaceToTop('#floating-home');
bindHomeSurfaceToTop('.brand-home, .brand-avatar-link');
function renderRouteWithTransition() {
  const nextHash = window.location.hash || '#/';
  const transitionKind = getRouteTransitionKind(lastRenderedHash, nextHash);

  if (
    hasRenderedRoute &&
    transitionKind !== 'content-static' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.documentElement.dataset.routeTransition = transitionKind;
    const transition = document.startViewTransition(() => {
      renderRoute();
    });
    transition.finished.finally(() => {
      delete document.documentElement.dataset.routeTransition;
    });
    return;
  }

  renderRoute();
}

window.addEventListener('hashchange', renderRouteWithTransition);
window.addEventListener('resize', () => {
  refreshViewportBehaviors();
  scheduleSectionSnap();
  if (isHomeRoute()) {
    const nextVisibleCount = homeEpisodeVisibleCount();
    const nextMobileLayout = useMobileHomeLayout();
    if (nextVisibleCount !== lastHomeEpisodeVisibleCount || nextMobileLayout !== lastHomeMobileLayout) {
      renderHome('home-episodes');
    }
  }
});
window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  const now = performance.now();
  const elapsed = Math.max(now - lastScrollSampleAt, 16);
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);
  scrollDirection = currentScrollY >= lastScrollY ? 1 : -1;
  const speed = scrollDelta / elapsed;
  lastScrollSpeed = speed;
  if (lastSnapTargetTop >= 0 && Math.abs(currentScrollY - lastSnapTargetTop) > window.innerHeight * 0.7) {
    lastSnapTargetTop = -1;
  }
  syncFloatingActionsByScroll(currentScrollY);
  syncBackToTopVisibility();
  syncSectionProgress({
    reveal: true,
    blur: speed > 2.1 && scrollDelta > (isMobileViewport() ? 56 : 72)
  });
  scheduleSectionSnap();
  lastScrollY = currentScrollY;
  lastScrollSampleAt = now;
}, { passive: true });
window.addEventListener('pointerdown', () => {
  pointerIsDown = true;
  cancelSnapAnimation();
}, { passive: true });
window.addEventListener('pointerup', () => {
  pointerIsDown = false;
  lastUserReleaseAt = Date.now();
  scheduleSectionSnap();
}, { passive: true });
window.addEventListener('touchstart', () => {
  pointerIsDown = true;
  cancelSnapAnimation();
}, { passive: true });
window.addEventListener('touchend', () => {
  pointerIsDown = false;
  lastUserReleaseAt = Date.now();
  scheduleSectionSnap();
}, { passive: true });
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSidebar();
  }
});
window.addEventListener('resize', () => {
  renderSectionProgress();
  syncSectionProgress();
}, { passive: true });
floatingActionsToggle?.addEventListener('click', () => {
  setFloatingActionsExpanded(!floatingActionsExpanded);
  if (floatingActionsExpanded) {
    scheduleFloatingActionsAutoCollapse();
  } else {
    window.clearTimeout(floatingActionsIdleTimer);
  }
});
sectionProgress?.addEventListener('click', () => {
  if (sectionProgress.hidden) return;
  setSectionProgressPanelOpen(!sectionProgressPanelOpen);
});
sectionProgressPanel?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-section-progress-target]');
  if (!(target instanceof HTMLElement)) return;
  const index = Number(target.dataset.sectionProgressTarget);
  const sections = getProgressSections();
  const section = sections[index];
  if (!(section instanceof HTMLElement)) return;
  closeSectionProgressPanel();
  if (document.body.classList.contains('page-episode-index')) {
    const href = section.dataset.progressHref || section.getAttribute('href');
    if (href) {
      window.location.hash = href;
      return;
    }
  }
  const top = Math.max(window.scrollY + section.getBoundingClientRect().top - 20, 0);
  animateWindowScrollTo(top, { durationScale: 1.05 });
});
document.addEventListener('click', (event) => {
  if (
    sectionProgressPanelOpen &&
    !sectionProgress?.contains(event.target) &&
    !sectionProgressPanel?.contains(event.target)
  ) {
    closeSectionProgressPanel();
  }
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

function orderedEpisodes() {
  return [...(site?.episodes || [])].sort((a, b) => episodeNumberFromId(a.id) - episodeNumberFromId(b.id));
}

function displayEpisodeTitle(title) {
  return String(title || '')
    .split(/｜|\|/)[0]
    .replace(/\s*[【\[]\s*EP\d{1,4}\s*[】\]]\s*$/i, '')
    .trim();
}

function trimHomeEpisodeSummary(text, maxChars) {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const boundary = Math.max(slice.lastIndexOf('，'), slice.lastIndexOf('、'), slice.lastIndexOf(' '));
  const trimmed = boundary > maxChars * 0.55 ? slice.slice(0, boundary) : slice;
  return `${trimmed.trim()}…`;
}

function summarizeHomeEpisodeSummary(value, { mobile = false } = {}) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '待整理';
  if (!mobile) return text;

  const sentences = text.match(/[^。！？!?]+[。！？!?]?/g)?.map((item) => item.trim()).filter(Boolean) || [text];
  let summary = sentences[0] || text;
  const maxChars = Math.max(250, Math.min(540, Math.round(text.length * 1.56)));
  const minChars = Math.min(maxChars - 32, Math.max(210, Math.round(text.length * 1.2)));

  let index = 1;
  while (summary.length < minChars && index < sentences.length) {
    summary = `${summary}${sentences[index]}`;
    index += 1;
  }

  return trimHomeEpisodeSummary(summary, maxChars);
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
      ? `<span class="inline-episode-ref"><a class="inline-episode-link" href="${routeTo(`episodes/${match}`)}">${escapeHtml(match)}</a><span class="inline-episode-popup"><strong>${escapeHtml(match)}｜${escapeHtml(displayEpisodeTitle(episode.title))}</strong><span>${escapeHtml(episode.summary || '')}</span></span></span>`
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

function graphLinkedChipList(items = []) {
  if (!items.length) return '';
  const chipMap = {
    [`节目 ${site.stats.episodes}`]: '#/episodes',
    [`概念 ${site.stats.concepts}`]: '#/concepts',
    [`模型 ${site.stats.models}`]: '#/models',
    [`人物 ${site.stats.people}`]: '#/people',
    [`主题 ${site.stats.themes}`]: '#/themes',
    '点击节点看近邻': '#/graph',
    '双击节点开详情': '#/graph',
    '滚轮缩放': '#/graph'
  };
  return `
    <div class="chip-row">
      ${items.map((item) => {
        const href = chipMap[item];
        return href
          ? `<a class="chip" href="${href}">${escapeHtml(item)}</a>`
          : `<span class="chip">${escapeHtml(item)}</span>`;
      }).join('')}
    </div>
  `;
}

function keywordCount(keyword) {
  return keyword.episodes?.length || 0;
}

function keywordLatestEpisodeNumber(keyword) {
  const episodeRefs = Array.isArray(keyword?.episodes) ? keyword.episodes : [];
  const latest = episodeRefs
    .map((entry) => episodeNumberFromId(typeof entry === 'string' ? entry : entry?.id))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];
  return latest || 0;
}

function pickWeightedKeywords(keywords = [], limit = 3) {
  const pool = [...keywords];
  const picked = [];
  const maxEpisodeNumber = Math.max(...pool.map((keyword) => keywordLatestEpisodeNumber(keyword)), 1);

  while (pool.length && picked.length < limit) {
    const weights = pool.map((keyword) => {
      const referenceWeight = Math.pow(keywordCount(keyword) + 1, 1.18);
      const recencyWeight = 1 + (keywordLatestEpisodeNumber(keyword) / maxEpisodeNumber) * 2.8;
      return referenceWeight * recencyWeight;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let threshold = Math.random() * totalWeight;
    let chosenIndex = 0;

    for (let index = 0; index < pool.length; index += 1) {
      threshold -= weights[index];
      if (threshold <= 0) {
        chosenIndex = index;
        break;
      }
    }

    picked.push(pool.splice(chosenIndex, 1)[0]);
  }

  return picked;
}

function getRecommendedKeywords(limit = 3) {
  if (!site?.keywords?.length) return [];
  const offset = Math.abs(homeRecommendationSeed) % Math.max(site.keywords.length, 1);
  const rotated = [...site.keywords.slice(offset), ...site.keywords.slice(0, offset)];
  return pickWeightedKeywords(rotated, limit);
}

function referenceCount(item) {
  return item.episodes?.length || 0;
}

function isPersonKeyword(keyword) {
  return keyword?.entryType === 'person';
}

function getPeopleKeywords(minReferences = 0) {
  return [...(site?.keywords || [])]
    .filter((keyword) => isPersonKeyword(keyword) && keywordCount(keyword) >= minReferences)
    .sort((a, b) => keywordCount(b) - keywordCount(a) || (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));
}

function keywordTypeBadge(keyword) {
  return isPersonKeyword(keyword) ? '<span class="chip">人物</span>' : '';
}

function episodeNumberFromId(id) {
  const match = String(id || '').match(/EP(\d+)/i);
  return match ? Number(match[1]) : null;
}

function newestEpisodeNumber() {
  return Math.max(
    0,
    ...(site?.episodes || [])
      .map((episode) => episodeNumberFromId(episode?.id))
      .filter((value) => Number.isFinite(value))
  );
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

function getEpisodeNeighbors(id) {
  const episodes = orderedEpisodes();
  const index = episodes.findIndex((episode) => episode.id === id);
  if (index < 0) {
    return {
      previousEpisode: null,
      nextEpisode: null
    };
  }

  return {
    previousEpisode: index > 0 ? episodes[index - 1] : null,
    nextEpisode: index < episodes.length - 1 ? episodes[index + 1] : null
  };
}

function rerenderWithPreservedViewport(renderFn, options = {}) {
  const { focusId = '' } = options;
  const activeElement = document.activeElement;
  const shouldRestoreFocus = focusId && activeElement?.id === focusId;
  const selectionStart = shouldRestoreFocus && typeof activeElement.selectionStart === 'number'
    ? activeElement.selectionStart
    : null;
  const selectionEnd = shouldRestoreFocus && typeof activeElement.selectionEnd === 'number'
    ? activeElement.selectionEnd
    : null;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  renderFn();

  window.requestAnimationFrame(() => {
    window.scrollTo(scrollX, scrollY);

    if (!shouldRestoreFocus) return;

    const nextInput = document.getElementById(focusId);
    if (!(nextInput instanceof HTMLInputElement)) return;

    nextInput.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) {
      nextInput.setSelectionRange(selectionStart, selectionEnd);
    }
  });
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

function referenceItemMatchesQuery(item, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const haystack = [
    item?.id,
    item?.name || '',
    item?.title || '',
    item?.summary || '',
    item?.definition || '',
    item?.description || '',
    ...(item?.aliases || [])
  ].join(' ').toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getEpisodeIndexSuggestionMatches(query) {
  const trimmedQuery = String(query || '').trim();
  if (!trimmedQuery || !site) return [];

  const buildReferenceSuggestions = (collection = [], options = {}) => {
    const {
      type,
      badge,
      limit = 4,
      nameFrom = (item) => item.name || item.title || item.id,
      valueFrom = (item) => item.name || item.title || item.id
    } = options;

    return collection
      .filter((item) => referenceItemMatchesQuery(item, trimmedQuery))
      .sort((a, b) => {
        const countDelta = referenceCount(b) - referenceCount(a);
        if (countDelta !== 0) return countDelta;
        return String(nameFrom(a)).localeCompare(String(nameFrom(b)), 'zh-Hans-CN');
      })
      .slice(0, limit)
      .map((item) => ({
        type,
        id: item.id,
        name: nameFrom(item),
        value: valueFrom(item),
        badge: referenceCount(item) > 0 ? `${badge} ${referenceCount(item)}` : badge
      }));
  };

  const exactEpisodeId = normalizeEpisodeIdQuery(trimmedQuery);
  const episodeSuggestions = [...(site.episodes || [])]
    .filter((episode) => episodeMatchesQuery(episode, trimmedQuery))
    .sort((a, b) => {
      const aExact = a.id === exactEpisodeId;
      const bExact = b.id === exactEpisodeId;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return episodeNumberFromId(b.id) - episodeNumberFromId(a.id);
    })
    .slice(0, 4)
    .map((episode) => ({
      type: 'episode',
      id: episode.id,
      name: `${episode.id}｜${displayEpisodeTitle(episode.title)}`,
      value: episode.id,
      badge: '节目'
    }));

  const matches = [
    ...buildReferenceSuggestions(site.keywords, { type: 'keyword', badge: '关键词', limit: 6, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.people, { type: 'person', badge: '人物', limit: 4, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.themes, { type: 'theme', badge: '主题', limit: 3, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.concepts, { type: 'concept', badge: '概念', limit: 3, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.models, { type: 'model', badge: '模型', limit: 3, valueFrom: (item) => item.name || item.id }),
    ...episodeSuggestions
  ];

  const seen = new Set();
  return matches.filter((match) => {
    const key = `${match.type}:${match.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);
}

function renderEpisodeIndexSuggestions(query) {
  const container = document.getElementById('episode-index-suggestions');
  if (!(container instanceof HTMLElement)) return;

  const matches = getEpisodeIndexSuggestionMatches(query);
  if (!String(query || '').trim() || !matches.length) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.innerHTML = matches.map((match) => `
    <button
      class="sidebar-suggestion search-suggestion episode-index-suggestion"
      type="button"
      data-episode-index-suggestion="${escapeHtml(match.value)}"
    >
      <span class="episode-index-suggestion-label">${escapeHtml(match.name)}</span>
      <span class="count-badge">${escapeHtml(match.badge)}</span>
    </button>
  `).join('');
  container.classList.remove('hidden');
}

function getEpisodeIndexSearchState(episodesByNumber, selectedRange, query) {
  const trimmedQuery = String(query || '').trim();
  const exactEpisodeId = normalizeEpisodeIdQuery(trimmedQuery);
  const visibleEpisodes = episodesByNumber.filter((episode) => {
    const number = episodeNumberFromId(episode.id);
    return number >= selectedRange.start && number <= selectedRange.end;
  });

  const filteredEpisodes = trimmedQuery
    ? episodesByNumber
      .filter((episode) => episodeMatchesQuery(episode, trimmedQuery))
      .sort((a, b) => {
        const aExact = a.id === exactEpisodeId;
        const bExact = b.id === exactEpisodeId;
        if (aExact !== bExact) return aExact ? -1 : 1;
        return episodeNumberFromId(b.id) - episodeNumberFromId(a.id);
      })
    : visibleEpisodes;

  return {
    query: trimmedQuery,
    filteredEpisodes
  };
}

function renderEpisodeIndexEpisodeList(episodes = []) {
  if (!episodes.length) {
    return '<div class="empty-state">没有匹配到节目。试试 EP031、标题片段，或回到区间浏览。</div>';
  }

  return `
    <div class="list">
      ${episodes.map((episode) => {
        const episodeHref = routeTo(`episodes/${episode.id}`);
        return `
        <article
          class="list-item episode-index-card"
          data-episode-href="${episodeHref}"
          data-progress-href="${episodeHref}"
          data-progress-section="true"
          data-progress-label="${escapeHtml(`${episode.id.replace(/^EP/i, '')}集 ${displayEpisodeTitle(episode.title).replace(/\s+/g, '').slice(0, 12)}`)}"
        >
          <div class="episode-index-card-head">
            <p class="card-kicker episode-index-kicker">${escapeHtml(episode.id)}${renderEpisodeFreshBadge(episode, { compact: true })}</p>
            <span class="episode-index-open">查看</span>
          </div>
          <a class="card-primary-link" href="${episodeHref}">
            <h3>${escapeHtml(displayEpisodeTitle(episode.title))}</h3>
          </a>
          <p class="episode-index-summary">${escapeHtml(episode.summary || '待整理')}</p>
          ${linkedChipList('keywords', (episode.tags || []).slice(0, 6), site.keywords)}
        </article>
      `;
      }).join('')}
    </div>
  `;
}

function scrollEpisodeResultsIntoView() {
  window.requestAnimationFrame(() => {
    const toolbar = document.querySelector('.episode-index-toolbar');
    const firstEpisodeCard = document.querySelector('#episode-index-results .list-item');
    if (!firstEpisodeCard) return;
    const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 0;
    const top = window.scrollY + firstEpisodeCard.getBoundingClientRect().top - toolbarHeight - 16;
    window.scrollTo({
      top: Math.max(top, 0),
      behavior: 'smooth'
    });
  });
}

function centerActiveEpisodeRangeButton(button, behavior = 'auto') {
  if (!(button instanceof HTMLElement)) return;
  const rail = button.closest('.episode-range-wheel');
  if (!(rail instanceof HTMLElement)) return;

  const railWidth = rail.clientWidth;
  if (railWidth <= 0) return;

  const targetLeft = button.offsetLeft - Math.max((railWidth - button.offsetWidth) / 2, 0);
  const maxScrollLeft = Math.max(rail.scrollWidth - railWidth, 0);
  rail.scrollTo({
    left: Math.min(Math.max(targetLeft, 0), maxScrollLeft),
    behavior
  });
}

function clearEpisodeIndexSearchAutoHideTimer() {
  window.clearTimeout(episodeIndexSearchAutoHideTimer);
  episodeIndexSearchAutoHideTimer = 0;
}

function setupEpisodeRangeWheelDrag(wheel) {
  if (!(wheel instanceof HTMLElement)) return;

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let lastMoveX = 0;
  let lastMoveAt = 0;
  let velocityX = 0;
  let isDragging = false;
  let suppressClick = false;
  let momentumFrame = 0;

  const cancelMomentum = () => {
    if (!momentumFrame) return;
    window.cancelAnimationFrame(momentumFrame);
    momentumFrame = 0;
  };

  const releasePointer = () => {
    if (pointerId !== null && wheel.hasPointerCapture?.(pointerId)) {
      wheel.releasePointerCapture(pointerId);
    }
    pointerId = null;
  };

  const clearDragging = () => {
    releasePointer();
    wheel.classList.remove('is-dragging');
    isDragging = false;
  };

  const startMomentum = () => {
    cancelMomentum();
    if (Math.abs(velocityX) < 0.12) return;

    let currentVelocity = velocityX * 18;
    let previousAt = performance.now();

    const step = (now) => {
      const elapsed = Math.min(now - previousAt, 24);
      previousAt = now;
      wheel.scrollLeft += currentVelocity * elapsed;
      currentVelocity *= 0.92;
      if (Math.abs(currentVelocity) < 0.08) {
        momentumFrame = 0;
        return;
      }
      momentumFrame = window.requestAnimationFrame(step);
    };

    momentumFrame = window.requestAnimationFrame(step);
  };

  wheel.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    cancelMomentum();
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = wheel.scrollLeft;
    lastMoveX = event.clientX;
    lastMoveAt = event.timeStamp || performance.now();
    velocityX = 0;
    isDragging = false;
    suppressClick = false;
    wheel.setPointerCapture?.(pointerId);
  });

  wheel.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!isDragging) {
      if (Math.abs(deltaX) < 6) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        clearDragging();
        return;
      }
      isDragging = true;
      suppressClick = true;
      wheel.classList.add('is-dragging');
    }

    event.preventDefault();
    wheel.scrollLeft = startScrollLeft - deltaX * 1.16;
    const now = event.timeStamp || performance.now();
    const deltaTime = Math.max(now - lastMoveAt, 1);
    velocityX = (lastMoveX - event.clientX) / deltaTime;
    lastMoveX = event.clientX;
    lastMoveAt = now;
  });

  const finishDrag = (event) => {
    if (pointerId !== null && event.pointerId !== pointerId) return;
    const shouldStartMomentum = isDragging;
    clearDragging();
    if (shouldStartMomentum) {
      startMomentum();
    }
    if (!suppressClick) return;
    wheel.dataset.dragSuppressClick = 'true';
    window.setTimeout(() => {
      delete wheel.dataset.dragSuppressClick;
    }, 220);
  };

  wheel.addEventListener('pointerup', finishDrag);
  wheel.addEventListener('pointercancel', finishDrag);
  wheel.addEventListener('lostpointercapture', finishDrag);
  wheel.addEventListener('click', (event) => {
    if (wheel.dataset.dragSuppressClick !== 'true') return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

function setupStickyToolbarBehavior(toolbar, config) {
  config.abortController?.abort();
  const controller = new AbortController();
  config.assignController(controller);
  const { signal } = controller;
  const {
    opacityVariable,
    minimumHideY = isMobileViewport() ? 48 : 72,
    idleHideDelay = isMobileViewport() ? 1050 : 1200,
    anchorBoundarySelector = '',
    revealAfterSelector = '',
    revealOffset = 0,
    fixedOverlay = false
  } = config;
  let lastObservedScrollY = window.scrollY;
  let idleHideTimer = 0;
  let anchorScrollY = 0;
  let anchorVisibleBottom = 0;
  let revealAfterScrollY = 0;

  const isEngaged = () => toolbar.dataset.engaged === 'true' || toolbar.matches(':focus-within');

  const measureAnchorScrollY = () => {
    const rect = toolbar.getBoundingClientRect();
    anchorScrollY = fixedOverlay ? 0 : window.scrollY + rect.top;
    const boundary = anchorBoundarySelector ? document.querySelector(anchorBoundarySelector) : null;
    if (boundary instanceof HTMLElement) {
      const boundaryRect = boundary.getBoundingClientRect();
      const boundaryPadding = isMobileViewport() ? 28 : 42;
      anchorVisibleBottom = window.scrollY + boundaryRect.bottom - boundaryPadding;
    } else {
      anchorVisibleBottom = fixedOverlay ? 0 : anchorScrollY + rect.height + (isMobileViewport() ? 44 : 56);
    }
    const revealTarget = revealAfterSelector ? document.querySelector(revealAfterSelector) : null;
    if (revealTarget instanceof HTMLElement) {
      const revealRect = revealTarget.getBoundingClientRect();
      revealAfterScrollY = Math.max(window.scrollY + revealRect.top - revealOffset, 0);
      return;
    }
    revealAfterScrollY = 0;
  };

  const clearIdleHideTimer = () => {
    window.clearTimeout(idleHideTimer);
    idleHideTimer = 0;
  };

  const scheduleIdleHide = () => {
    clearIdleHideTimer();
    if (isEngaged()) return;
    if (toolbar.classList.contains('is-hidden-by-scroll')) return;
    if (window.scrollY <= minimumHideY) return;
    if (window.scrollY < revealAfterScrollY) return;
    if (window.scrollY <= anchorVisibleBottom) return;
    idleHideTimer = window.setTimeout(() => {
      if (isEngaged()) return;
      if (window.scrollY <= minimumHideY) return;
      if (window.scrollY < revealAfterScrollY) return;
      if (window.scrollY <= anchorVisibleBottom) return;
      toolbar.classList.add('is-hidden-by-scroll');
      toolbar.classList.remove('is-ghost');
      toolbar.style.setProperty(opacityVariable, '0');
    }, idleHideDelay);
  };

  const syncToolbarState = () => {
    measureAnchorScrollY();
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastObservedScrollY;
    const hideThreshold = isMobileViewport() ? 18 : 22;
    const revealThreshold = isMobileViewport() ? 10 : 14;
    const returnToAnchorThreshold = isMobileViewport() ? 28 : 36;
    const canHide = currentScrollY > minimumHideY && !isEngaged();
    let shouldHide = toolbar.classList.contains('is-hidden-by-scroll');
    const beforeRevealGate = !isEngaged() && currentScrollY < revealAfterScrollY;

    if (beforeRevealGate) {
      shouldHide = true;
    } else if (currentScrollY <= Math.max(anchorVisibleBottom, anchorScrollY - returnToAnchorThreshold)) {
      shouldHide = false;
    } else if (!canHide) {
      shouldHide = false;
    } else if (delta > hideThreshold) {
      shouldHide = true;
    } else if (delta < -revealThreshold) {
      shouldHide = false;
    }

    if (shouldHide || isEngaged() || currentScrollY <= minimumHideY) {
      clearIdleHideTimer();
    }

    toolbar.classList.toggle('is-hidden-by-scroll', shouldHide);
    toolbar.classList.toggle('is-engaged', isEngaged());
    toolbar.classList.toggle('is-ghost', !beforeRevealGate && !shouldHide && !isEngaged() && currentScrollY > minimumHideY);
    toolbar.style.setProperty(opacityVariable, shouldHide ? '0' : (isEngaged() || currentScrollY <= minimumHideY ? '1' : '0.86'));

    if (!shouldHide && !isEngaged() && currentScrollY > minimumHideY) {
      scheduleIdleHide();
    }

    lastObservedScrollY = currentScrollY;
  };

  const engageToolbar = () => {
    clearIdleHideTimer();
    toolbar.dataset.engaged = 'true';
    toolbar.classList.add('is-engaged');
    toolbar.classList.remove('is-hidden-by-scroll', 'is-ghost');
    toolbar.style.setProperty(opacityVariable, '1');
  };

  const releaseToolbar = () => {
    delete toolbar.dataset.engaged;
    toolbar.classList.remove('is-engaged');
    syncToolbarState();
  };

  toolbar.addEventListener('pointerdown', engageToolbar, { signal });
  toolbar.addEventListener('focusin', engageToolbar, { signal });

  document.addEventListener('click', (event) => {
    if (toolbar.contains(event.target)) return;
    if (toolbar.matches(':focus-within')) return;
    releaseToolbar();
  }, { signal });

  window.addEventListener('scroll', syncToolbarState, { passive: true, signal });
  window.addEventListener('resize', () => {
    clearIdleHideTimer();
    measureAnchorScrollY();
    toolbar.classList.remove('is-hidden-by-scroll');
    lastObservedScrollY = window.scrollY;
    syncToolbarState();
  }, { passive: true, signal });

  measureAnchorScrollY();
  syncToolbarState();
}

function setupEpisodeToolbarBehavior(toolbar) {
  if (isMobileViewport()) {
    episodeToolbarController?.abort();
    const controller = new AbortController();
    episodeToolbarController = controller;
    const { signal } = controller;
    const shell = toolbar.parentElement;
    if (!(shell instanceof HTMLElement)) return;
    const topInset = 8;

    const syncFrame = () => {
      const frameTarget = toolbar.closest('.detail') || shell;
      const frameRect = frameTarget.getBoundingClientRect();
      toolbar.style.setProperty('--episode-toolbar-left', `${Math.max(frameRect.left, 8)}px`);
      toolbar.style.setProperty('--episode-toolbar-width', `${Math.max(frameRect.width, 0)}px`);
    };

    const syncFloatingState = () => {
      syncFrame();
      const shouldFloat = shell.getBoundingClientRect().top <= topInset && window.scrollY > 0;

      if (shouldFloat) {
        toolbar.classList.add('is-floating');
        toolbar.style.removeProperty('position');
        toolbar.style.removeProperty('top');
        toolbar.style.removeProperty('left');
        toolbar.style.removeProperty('width');
        shell.style.height = `${toolbar.offsetHeight}px`;
        return;
      }

      toolbar.classList.remove('is-floating', 'is-hidden-by-scroll', 'is-ghost', 'is-engaged');
      toolbar.style.removeProperty('--episode-toolbar-opacity');
      toolbar.style.position = 'relative';
      toolbar.style.top = '0';
      toolbar.style.left = 'auto';
      toolbar.style.width = 'auto';
      shell.style.removeProperty('height');
    };

    window.addEventListener('resize', syncFloatingState, { passive: true, signal });
    window.addEventListener('scroll', syncFloatingState, { passive: true, signal });
    window.requestAnimationFrame(syncFloatingState);
    return;
  }

  episodeToolbarController?.abort();
  const controller = new AbortController();
  episodeToolbarController = controller;
  const { signal } = controller;
  const shell = toolbar.parentElement;
  if (!(shell instanceof HTMLElement)) return;
  let lastScrollY = window.scrollY;

  const syncFrame = () => {
    const frameTarget = toolbar.closest('.detail') || shell;
    const frameRect = frameTarget.getBoundingClientRect();
    const horizontalInset = isMobileViewport() ? 10 : 0;
    toolbar.style.setProperty('--episode-toolbar-left', `${Math.max(frameRect.left + horizontalInset, 8)}px`);
    toolbar.style.setProperty('--episode-toolbar-width', `${Math.max(frameRect.width - horizontalInset * 2, 0)}px`);
    shell.style.height = `${toolbar.offsetHeight}px`;
  };

  const syncVisibility = () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    const hideThreshold = isMobileViewport() ? 12 : 18;
    const revealThreshold = isMobileViewport() ? 8 : 10;
    const shouldHide = currentScrollY > (isMobileViewport() ? 120 : 180) && delta > hideThreshold && !toolbar.matches(':focus-within');
    const shouldReveal = delta < -revealThreshold || currentScrollY <= (isMobileViewport() ? 72 : 120);

    if (shouldHide) {
      toolbar.classList.add('is-hidden-by-scroll');
    } else if (shouldReveal) {
      toolbar.classList.remove('is-hidden-by-scroll');
    }

    lastScrollY = currentScrollY;
  };

  const engageToolbar = () => {
    toolbar.classList.add('is-engaged');
    toolbar.style.setProperty('--episode-toolbar-opacity', '1');
  };

  const releaseToolbar = () => {
    toolbar.classList.remove('is-engaged');
    toolbar.style.setProperty('--episode-toolbar-opacity', '1');
  };

  toolbar.classList.add('is-floating');
  toolbar.classList.remove('is-hidden-by-scroll', 'is-ghost');
  toolbar.style.setProperty('--episode-toolbar-opacity', '1');

  toolbar.addEventListener('pointerdown', engageToolbar, { signal });
  toolbar.addEventListener('focusin', engageToolbar, { signal });
  document.addEventListener('click', (event) => {
    if (toolbar.contains(event.target)) return;
    if (toolbar.matches(':focus-within')) return;
    releaseToolbar();
  }, { signal });

  window.addEventListener('resize', syncFrame, { passive: true, signal });
  window.addEventListener('scroll', () => {
    syncFrame();
    syncVisibility();
  }, { passive: true, signal });
  window.requestAnimationFrame(syncFrame);
}

function setupHomeSearchToolbarBehavior(toolbar) {
  const useFloatOnlyMobileSearch = toolbar.classList.contains('home-search-toolbar-float-only');
  setupStickyToolbarBehavior(toolbar, {
    abortController: homeSearchToolbarController,
    opacityVariable: '--home-search-toolbar-opacity',
    minimumHideY: useFloatOnlyMobileSearch ? 0 : (isMobileViewport() ? 34 : 68),
    anchorBoundarySelector: useFloatOnlyMobileSearch ? '' : '.home-search-section',
    revealAfterSelector: useFloatOnlyMobileSearch ? '.home-search-section' : '',
    revealOffset: useFloatOnlyMobileSearch ? 72 : 0,
    fixedOverlay: useFloatOnlyMobileSearch,
    assignController(controller) {
      homeSearchToolbarController = controller;
    }
  });
}

function linkedChipList(type, items = [], collection = []) {
  if (!items.length) return '';
  return `
    <div class="chip-row">
      ${renderLinkedChipItems(type, items, collection)}
    </div>
  `;
}

function findKeywordByReference(value) {
  const normalized = normalizeValue(value);
  return (site?.keywords || []).find((item) => {
    const aliases = item.aliases || [];
    return (
      normalizeValue(item.id) === normalized ||
      normalizeValue(item.name) === normalized ||
      aliases.some((alias) => normalizeValue(alias) === normalized)
    );
  }) || null;
}

function findPersonByReference(value) {
  const normalized = normalizeValue(value);
  return (site?.people || []).find((item) => {
    const aliases = item.aliases || [];
    return (
      normalizeValue(item.id) === normalized ||
      normalizeValue(item.name) === normalized ||
      aliases.some((alias) => normalizeValue(alias) === normalized)
    );
  }) || null;
}

function renderLinkedChipItems(type, items = [], collection = []) {
  return items.map((item) => {
    const found = collection.find((entry) => {
      const aliases = entry.aliases || [];
      return (
        normalizeValue(entry.id) === normalizeValue(item) ||
        normalizeValue(entry.name) === normalizeValue(item) ||
        aliases.some((alias) => normalizeValue(alias) === normalizeValue(item))
      );
    });
    if (!found) return `<span class="chip">${escapeHtml(item)}</span>`;
    const targetType = type === 'people' ? 'keywords' : type;
    const target = type === 'people'
      ? findKeywordByReference(found.id) || findKeywordByReference(found.name)
      : found;
    if (!target) {
      return `<span class="chip">${escapeHtml(found.name || found.title || found.id)}</span>`;
    }
    return `<a class="chip" href="${routeTo(`${targetType}/${target.id}`)}">${escapeHtml(found.name || found.title || found.id)}</a>`;
  }).join('');
}

function renderVideoLinkIcon(link) {
  const platform = normalizeValue(link?.platform);
  const url = String(link?.url || '').trim();
  const isMemberOnly = normalizeValue(link?.access) === 'member' || link?.memberOnly === true;
  const isUnavailable = normalizeValue(link?.status) === 'unavailable' || !url;
  const unavailableText = String(link?.note || '已下架').trim();

  const platforms = {
    bilibili: {
      label: isMemberOnly ? 'Bilibili 会员' : 'Bilibili',
      className: 'bilibili',
      content: `<span class="media-chip-text media-chip-text-bilibili">bilibili</span>`
    },
    youtube: {
      label: 'YouTube',
      className: 'youtube',
      content: `
        <span class="media-chip-youtube-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="media-chip-youtube-icon">
            <path d="M9 7.8L16.2 12L9 16.2Z"></path>
          </svg>
        </span>
        <span class="media-chip-text media-chip-text-youtube">YouTube</span>
      `
    }
  };

  const config = platforms[platform];
  if (!config) return '';

  if (isUnavailable) {
    return `
      <span class="media-chip ${config.className} unavailable" title="${escapeHtml(unavailableText)}" aria-label="${escapeHtml(unavailableText)}">
        ${config.content}
        <span class="media-chip-unavailable-text">${escapeHtml(unavailableText)}</span>
      </span>
    `;
  }

  return `
    <a class="media-chip ${config.className}${isMemberOnly ? ' member-only' : ''}" href="${escapeHtml(url)}" target="_blank" rel="noreferrer" aria-label="${config.label}" title="${config.label}">
      ${config.content}
      ${isMemberOnly ? `
        <span class="media-chip-badge" aria-hidden="true">会员</span>
      ` : ''}
    </a>
  `;
}

function renderEpisodeHeaderMeta(episode) {
  const videoLinks = Array.isArray(episode.videoLinks) ? episode.videoLinks : [];
  const tags = episode.tags || [];
  if (!videoLinks.length && !tags.length) return '';

  return `
    ${tags.length ? `
      <div class="chip-row episode-header-meta">
        ${renderLinkedChipItems('keywords', tags, site.keywords)}
      </div>
    ` : ''}
    ${videoLinks.length ? `
      <div class="chip-row episode-video-links">
        ${videoLinks.map((link) => renderVideoLinkIcon(link)).join('')}
      </div>
    ` : ''}
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
          <p>${renderLinkedEpisodeText(keyword.summary)}</p>
          <div class="meta-row">
            ${keywordTypeBadge(keyword)}
            ${(keyword.aliases || []).slice(0, 2).map((alias) => `<span class="chip">${escapeHtml(alias)}</span>`).join('')}
          </div>
        </a>
      `).join('')}
    </div>
  `;
}

function renderNodeList(items = [], type, descriptionKey = 'summary', routeType = type) {
  if (!items.length) {
    return '<div class="empty-state">当前没有可显示的条目。</div>';
  }

  return `
    <div class="list">
      ${items.map((item) => `
        <a class="list-item" href="${routeTo(`${routeType}/${item.id}`)}">
          <div class="keyword-item-head">
            <h3>${escapeHtml(item.name || item.title || item.id)}</h3>
            <span class="keyword-count-badge">${referenceCount(item)} 次引用</span>
          </div>
          <p>${renderLinkedEpisodeText(item[descriptionKey] || item.summary || item.definition || item.description || '')}</p>
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
        <p class="detail-summary">${renderLinkedEpisodeText(summary)}</p>
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
    'lawrence-wong': '国家领导人',
    'lee-hsien-loong': '国家领导人',
    'lee-kuan-yew': '国家领导人',
    'ali-khamenei': '国家领导人',
    'mujtaba-khamenei': '国家领导人',
    'to-lam': '国家领导人',
    'ho-chi-minh': '国家领导人',
    'le-duan': '国家领导人',
    'sanae-takaichi': '国家领导人',
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

  const keywordRules = [
    { name: '国家与地缘', pattern: /美国|日本|新加坡|伊朗|俄罗斯|欧洲|东亚|东南亚|中东|台海|南海|制裁|战争|外交|地缘|小国|海峡|航线|门罗/ },
    { name: '房地产与金融', pattern: /房|地产|楼市|房价|地价|债|财政|资产|资本|金融|税|票据|信托|断供|清算|银行|养老金|保险|美元|黄金/ },
    { name: '科技与产业', pattern: /AI|人工智能|新能源|电车|电池|汽车|芯片|科技|研发|制造|算法|模型|创新|机器人|算力|云|电商/ },
    { name: '品牌与公司', pattern: /品牌|公司|企业|顾问|创始人|平台|连锁|商业|产品|供应链|营销|带货|主播|零售/ },
    { name: '教育与学术', pattern: /教育|学校|考试|大学|学术|教授|院士|课堂|学生|举报|课程/ },
    { name: '文化与媒体', pattern: /文化|文明|语言|电影|文艺|选美|模因|春晚|体育|超级碗|流量|影视|历史叙事/ },
    { name: '家庭与社会', pattern: /家庭|婚恋|代际|亲密关系|中产|断亲|审美|养老|孩子|故乡|社交|体面|尊严/ },
    { name: '制度与治理', pattern: /治理|秩序|规则|权威|共同体|组织|信任|协商|制度|合法性|平台治理|官僚/ }
  ];

  const personOverrideKey = item.sourcePersonId || item.id;
  if (type === 'people' && peopleCategoryOverrides[personOverrideKey]) {
    return peopleCategoryOverrides[personOverrideKey];
  }

  if (type === 'keywords' && isPersonKeyword(item)) {
    return '人物';
  }

  const rules = type === 'people'
    ? peopleRules
    : type === 'models'
      ? modelRules
      : type === 'keywords'
        ? keywordRules
        : generalRules;
  const matched = rules.find((rule) => rule.pattern.test(text));
  return matched ? matched.name : '其他';
}

function renderCategorizedReferenceSection(title, items, type, descriptionKey = 'summary', open = false, routeType = type) {
  if (!items.length) return '';

  const topItems = items.slice(0, 3);
  const remainingItems = items.slice(3);

  return `
    <details class="accordion-item keyword-group" data-progress-section="true" data-progress-label="${escapeHtml(title)}"${open ? ' open' : ''}>
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
              ${renderNodeList(remainingItems, type, descriptionKey, routeType)}
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
    minimumReferences = 2,
    routeType = type
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
    '国家领导人',
    '地缘政治人物',
    '企业家与资本人物',
    '科技产业人物',
    '教育学术人物',
    '媒体文化人物',
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
    .map(([category, items], index) => renderCategorizedReferenceSection(category, items, type, descriptionKey, index === 0, routeType))
    .join('');

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 class="detail-title">${escapeHtml(title)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(summary)}</p>
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
    <details class="accordion-item keyword-group" data-progress-section="true" data-progress-label="${escapeHtml(title)}"${open ? ' open' : ''}>
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
  const keywordResults = (!query ? keywords.slice(0, 3) : keywords
    .filter((keyword) => {
      const haystack = `${keyword.name} ${keyword.summary || ''} ${(keyword.aliases || []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 8));
  return keywordResults.slice(0, query ? 8 : 3);
}

function getKnowledgeSearchMatches(query) {
  const trimmedQuery = String(query || '').trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const keywords = (site?.keywords || []);
  const keywordMatches = (!trimmedQuery ? getRecommendedKeywords(3) : keywords
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
      name: `${episode.id}｜${displayEpisodeTitle(episode.title)}`,
      badge: '节目'
    }));

  const concepts = getSidebarReferenceMatches('concept', site?.concepts || [], trimmedQuery, '概念');
  const models = getSidebarReferenceMatches('model', site?.models || [], trimmedQuery, '模型');
  const themes = getSidebarReferenceMatches('theme', site?.themes || [], trimmedQuery, '主题');

  const exactEpisodeId = normalizeEpisodeIdQuery(trimmedQuery);
  if (exactEpisodeId) {
    const exact = episodes.find((item) => item.id === exactEpisodeId);
    if (exact) {
      return [exact, ...keywordMatches, ...concepts, ...models, ...themes, ...episodes.filter((item) => item.id !== exactEpisodeId)].slice(0, 10);
    }
  }

  return [...keywordMatches, ...concepts, ...models, ...themes, ...episodes].slice(0, 10);
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
    : routeTo(`themes/${match.id}`);
}

function openFirstSearchMatch(query) {
  const [firstMatch] = getKnowledgeSearchMatches(query);
  if (!firstMatch) return;
  normalizeMobileViewport({ force: true });
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

function rerollHomeRecommendations() {
  homeRecommendationSeed = Math.floor(Math.random() * 1000000);
  renderKnowledgeSuggestions({
    containerId: 'home-search-results',
    titleId: 'home-search-title',
    query: homeKnowledgeQuery,
    emptyMessage: '没有匹配的节目、概念、模型、人物或主题',
    idleTitle: '推荐关键词'
  });
}

function homeEpisodeVisibleCount() {
  if (useMobileHomeLayout()) return 1;
  const shell = document.querySelector('.home-episode-carousel-shell');
  const viewport = shell?.querySelector?.('.home-episode-carousel-viewport');
  const homeSection = document.getElementById('home-episodes');
  const availableWidth = viewport instanceof HTMLElement
    ? viewport.getBoundingClientRect().width
    : shell instanceof HTMLElement
      ? shell.getBoundingClientRect().width
      : homeSection instanceof HTMLElement
        ? homeSection.getBoundingClientRect().width
        : Math.max(app?.getBoundingClientRect?.().width || 0, 0);

  if (availableWidth >= 1040) return 3;
  if (availableWidth >= 690) return 2;
  return 1;
}

function homeEpisodeCarouselState(episodes = [], visibleCount = homeEpisodeVisibleCount()) {
  const maxIndex = Math.max(episodes.length - visibleCount, 0);
  const currentIndex = Math.min(homeEpisodeCarouselIndex, maxIndex);
  const start = currentIndex;
  return {
    visibleCount,
    maxIndex,
    currentIndex,
    visibleEpisodes: episodes.slice(start, start + visibleCount)
  };
}

function visibleEpisodeWindow(episodes = [], start = 0, visibleCount = homeEpisodeVisibleCount()) {
  return episodes.slice(start, start + visibleCount);
}

function scheduleHomeEpisodeAutoAdvance(maxIndex) {
  window.clearTimeout(homeEpisodeCarouselTimer);
  if (maxIndex <= 0) return;
  const waitMs = Math.max(homeEpisodeAutoAdvancePausedUntil - Date.now(), 0);
  const intervalMs = useMobileHomeLayout()
    ? HOME_EPISODE_AUTO_ADVANCE_MS
    : HOME_EPISODE_DESKTOP_AUTO_ADVANCE_MS;
  homeEpisodeCarouselTimer = window.setTimeout(() => {
    advanceHomeEpisodeCarousel(1, maxIndex);
  }, Math.max(intervalMs, waitMs));
}

function pauseHomeEpisodeAutoAdvance(durationMs = 6500) {
  homeEpisodeAutoAdvancePausedUntil = Date.now() + durationMs;
  window.clearTimeout(homeEpisodeCarouselTimer);
}

function advanceHomeEpisodeCarousel(direction, maxIndex) {
  if (homeEpisodeCarouselAnimating) return;
  if (maxIndex <= 0) return;
  homeEpisodeCarouselAnimating = true;
  if (direction < 0) {
    homeEpisodeCarouselIndex = homeEpisodeCarouselIndex <= 0 ? maxIndex : homeEpisodeCarouselIndex - 1;
  } else {
    homeEpisodeCarouselIndex = homeEpisodeCarouselIndex >= maxIndex ? 0 : homeEpisodeCarouselIndex + 1;
  }
  renderHomeEpisodeCarousel({ direction });
}

function renderSidebarKeywordSuggestions() {
  const title = document.getElementById('keyword-suggestions-title');
  const container = document.getElementById('keyword-suggestions');
  const query = sidebarKeywordQuery.trim();
  if (!title || !container) return;
  if (!query) {
    title.textContent = '输入后显示匹配结果';
    container.innerHTML = '';
    return;
  }
  renderKnowledgeSuggestions({
    containerId: 'keyword-suggestions',
    titleId: 'keyword-suggestions-title',
    query: sidebarKeywordQuery,
    emptyMessage: '没有匹配的关键词、节目或知识条目',
    idleTitle: '匹配结果'
  });
}

function navigateToEpisodeFromElement(element) {
  const episodeCard = element?.closest?.('[data-episode-href]');
  const href = episodeCard?.dataset?.episodeHref;
  if (!href) return false;
  window.location.hash = href;
  return true;
}

function renderSidebar() {
  const peopleCount = getPeopleKeywords(PERSON_NAV_MIN_REFERENCES).length;
  sidebarBody.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-title-row">
        <p class="sidebar-title">导航</p>
        <button class="sidebar-toggle-inline" id="sidebar-toggle-inline" type="button" aria-label="收起导航">☰</button>
      </div>
      <a class="sidebar-link" href="#/">首页 <span class="count-badge">Home</span></a>
      <a class="sidebar-link" href="#/episodes">节目 <span class="count-badge">${site.stats.episodes}</span></a>
      <a class="sidebar-link" href="#/concepts">概念 <span class="count-badge">${site.stats.concepts}</span></a>
      <a class="sidebar-link" href="#/models">模型 <span class="count-badge">${site.stats.models}</span></a>
      <a class="sidebar-link" href="#/people">人物 <span class="count-badge">${peopleCount}</span></a>
      <a class="sidebar-link" href="#/themes">主题 <span class="count-badge">${site.stats.themes}</span></a>
      <a class="sidebar-link" href="#/keywords">关键词 <span class="count-badge">${site.stats.keywords}</span></a>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">搜索知识库</p>
      <div class="sidebar-search-wrap">
        <input id="keyword-search-input" class="sidebar-search-input" type="text" placeholder="搜索关键词、节目、概念、模型，如 咽喉杠杆 / 西贝 / EP031">
        <p id="keyword-suggestions-title" class="sidebar-subtitle">输入后显示匹配结果</p>
        <div id="keyword-suggestions" class="sidebar-suggestions"></div>
      </div>
    </div>
    <div class="sidebar-section">
      <a class="sidebar-link" href="#/graph">知识图谱 <span class="count-badge">${graphStatValue()}</span></a>
      <a class="sidebar-link sidebar-link-log" href="#/updates">网页日志 <span class="count-badge">${WEBSITE_LOG_ENTRIES.length}</span></a>
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
        normalizeMobileViewport({ force: true });
        window.location.hash = firstMatch.type === 'episode'
          ? routeTo(`episodes/${firstMatch.id}`)
          : firstMatch.type === 'keyword'
            ? routeTo(`keywords/${firstMatch.id}`)
            : firstMatch.type === 'concept'
              ? routeTo(`concepts/${firstMatch.id}`)
              : firstMatch.type === 'model'
                ? routeTo(`models/${firstMatch.id}`)
            : routeTo(`themes/${firstMatch.id}`);
      }
    });
  document.getElementById('sidebar-toggle-inline')?.addEventListener('click', () => {
    if (!isDesktopViewport()) return;
    toggleDesktopSidebar();
  });
  sidebarBody.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link) return;
    normalizeMobileViewport({ force: true });
  });
}

function renderWebsiteLog() {
  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">Website Log</p>
        <h1 class="detail-title">网页日志</h1>
      </div>
      <section class="detail-section">
        <div class="list">
          ${WEBSITE_LOG_ENTRIES.map((entry) => `
            <article class="list-item website-log-entry">
              <p class="inline-label">${escapeHtml(entry.date)}</p>
              <h3>${escapeHtml(entry.title)}</h3>
              <ul>
                ${entry.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
              </ul>
            </article>
          `).join('')}
        </div>
      </section>
    </section>
  `;
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

function revealHomeSearchForQuery() {
  const toolbar = document.querySelector('.home-search-toolbar');
  const resultsSection = document.querySelector('.home-search-section');
  if (!(toolbar instanceof HTMLElement)) return;
  toolbar.classList.remove('is-hidden-by-scroll', 'is-ghost');
  toolbar.style.setProperty('--home-search-toolbar-opacity', '1');
  const toolbarHeight = toolbar.getBoundingClientRect().height;
  const sectionTop = resultsSection instanceof HTMLElement
    ? window.scrollY + resultsSection.getBoundingClientRect().top - toolbarHeight - (isMobileViewport() ? 10 : 16)
    : window.scrollY + toolbar.getBoundingClientRect().top - 18;
  const top = Math.max(sectionTop, 0);
  window.clearTimeout(sectionSnapTimer);
  suspendSnapUntil = Date.now() + 960;
  scrollWindowInstantly(top, window.scrollX);
  window.requestAnimationFrame(() => {
    scrollWindowInstantly(top, window.scrollX);
    window.dispatchEvent(new Event('scroll'));
  });
}

function getHomeFeaturedEpisodes() {
  return [...site.episodes].sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
}

function getWrappedHomeEpisodeIndex(index, maxIndex) {
  if (maxIndex <= 0) return 0;
  if (index < 0) return maxIndex;
  if (index > maxIndex) return 0;
  return index;
}

function getHomeEpisodeOutgoingIndex(currentIndex, direction, maxIndex) {
  return direction > 0
    ? getWrappedHomeEpisodeIndex(currentIndex - 1, maxIndex)
    : getWrappedHomeEpisodeIndex(currentIndex + 1, maxIndex);
}

function getHomeEpisodePositionLabel(episode, totalEpisodes) {
  if (!episode) return `第 1 / ${totalEpisodes} 集`;
  const episodeNumber = episodeNumberFromId(episode.id);
  return `第 ${Number.isFinite(episodeNumber) ? episodeNumber : 1} / ${totalEpisodes} 集`;
}

function getHomeEpisodeRangeLabel(episodes = [], totalEpisodes) {
  const numbers = episodes
    .map((episode) => episodeNumberFromId(episode?.id))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!numbers.length) return `第 1 / ${totalEpisodes} 集`;
  if (numbers.length === 1) return `第 ${numbers[0]} / ${totalEpisodes} 集`;
  return `第 ${numbers[0]}-${numbers[numbers.length - 1]} / ${totalEpisodes} 集`;
}

function isEpisodeFresh(episode) {
  if (episode?.recent) return true;
  const sourceTime = episode?.sourceMtime ? new Date(episode.sourceMtime).getTime() : NaN;
  if (Number.isFinite(sourceTime)) {
    return (Date.now() - sourceTime) <= (3 * 24 * 60 * 60 * 1000);
  }
  const currentEpisodeNumber = episodeNumberFromId(episode?.id);
  const latestEpisodeNumber = newestEpisodeNumber();
  return Number.isFinite(currentEpisodeNumber)
    && Number.isFinite(latestEpisodeNumber)
    && currentEpisodeNumber === latestEpisodeNumber;
}

function renderEpisodeFreshBadge(episode, { compact = false } = {}) {
  if (!isEpisodeFresh(episode)) return '';
  return `<span class="episode-fresh-badge${compact ? ' compact' : ''}">新</span>`;
}

function renderHomeEpisodeKickerMeta(episode) {
  if (isEpisodeFresh(episode)) {
    return renderEpisodeFreshBadge(episode, { compact: true });
  }
  return episode.curated ? '· 已整理' : '· 待整理';
}

function renderHomeEpisodeCardMarkup(episode, { preview = false, mobileAction = false } = {}) {
  const summary = summarizeHomeEpisodeSummary(episode.summary, { mobile: mobileAction });
  const visibleTags = mobileAction ? (episode.tags || []).slice(0, 3) : (episode.tags || []);
  return `
    <article class="card home-episode-card${preview ? ' is-preview' : ''}" data-episode-href="${routeTo(`episodes/${episode.id}`)}">
      <p class="card-kicker">${escapeHtml(episode.id)} ${renderHomeEpisodeKickerMeta(episode)}</p>
      <a class="card-primary-link" href="${routeTo(`episodes/${episode.id}`)}">
        <h3>${escapeHtml(displayEpisodeTitle(episode.title))}</h3>
      </a>
      <p>${escapeHtml(summary)}</p>
      ${linkedChipList('keywords', visibleTags, site.keywords)}
    </article>
  `;
}

function renderHomeEpisodePreviewPaneMarkup(episode, direction) {
  return `
    <article class="home-episode-preview-card" aria-hidden="true" data-preview-direction="${direction}">
      <span class="home-episode-preview-kicker">${escapeHtml(episode.id)}</span>
      <span class="home-episode-preview-title">${escapeHtml(displayEpisodeTitle(episode.title))}</span>
      <span class="home-episode-preview-line short"></span>
      <span class="home-episode-preview-line"></span>
      <span class="home-episode-preview-line"></span>
    </article>
  `;
}

function renderHomeEpisodeMobileFooterMarkup(episode, totalEpisodes) {
  return `
    <div class="home-episodes-footer-mobile">
      <span class="home-episode-mobile-index">${getHomeEpisodePositionLabel(episode, totalEpisodes)}</span>
      <a class="home-episodes-more-link" href="#/episodes">查看更多</a>
    </div>
  `;
}

function renderHomeEpisodeDesktopFooterMarkup(visibleEpisodes, totalEpisodes) {
  return `
    <div class="home-episodes-footer-desktop">
      <span class="home-episode-desktop-index">${getHomeEpisodeRangeLabel(visibleEpisodes, totalEpisodes)}</span>
      <a class="home-episodes-more-link" href="#/episodes">查看更多</a>
    </div>
  `;
}

function renderHomeEpisodeCarouselMarkup(homeEpisodeCarousel, featuredEpisodes, { mobilePreview = false } = {}) {
  const showMobilePreview = mobilePreview && homeEpisodeCarousel.visibleCount === 1;
  const currentEpisode = showMobilePreview
    ? featuredEpisodes[homeEpisodeCarousel.currentIndex]
    : null;

  return `
    ${showMobilePreview ? `
      <div class="home-episode-carousel-viewport">
        <div class="home-episode-carousel-track is-mobile-single">
          <div class="home-episode-mobile-single">
            ${renderHomeEpisodeCardMarkup(currentEpisode, { mobileAction: true })}
          </div>
        </div>
      </div>
      ${renderHomeEpisodeMobileFooterMarkup(currentEpisode, featuredEpisodes.length)}
    ` : `
      <button
        id="home-episodes-prev"
        class="home-episode-side-button${homeEpisodeCarousel.maxIndex > 0 ? '' : ' is-disabled'}"
        type="button"
        aria-label="显示更新一个节目"
        ${homeEpisodeCarousel.maxIndex > 0 ? '' : 'disabled'}
      >‹</button>
      <div class="home-episode-carousel-viewport">
        <div class="home-episode-carousel-track">
          <div class="home-episode-grid home-episode-grid-${homeEpisodeCarousel.visibleCount}">
            ${homeEpisodeCarousel.visibleEpisodes.map((episode) => renderHomeEpisodeCardMarkup(episode)).join('')}
          </div>
        </div>
      </div>
      <button
        id="home-episodes-next"
        class="home-episode-side-button${homeEpisodeCarousel.maxIndex > 0 ? '' : ' is-disabled'}"
        type="button"
        aria-label="显示更早一个节目"
        ${homeEpisodeCarousel.maxIndex > 0 ? '' : 'disabled'}
      >›</button>
      ${renderHomeEpisodeDesktopFooterMarkup(homeEpisodeCarousel.visibleEpisodes, featuredEpisodes.length)}
    `}
  `;
}

function renderHomeEpisodeMobileTransitionMarkup(outgoingEpisode, incomingEpisode, direction) {
  const orderedEpisodes = direction > 0
    ? [outgoingEpisode, incomingEpisode]
    : [incomingEpisode, outgoingEpisode];
  const initialShift = direction > 0 ? '0%' : '-50%';

  return `
    <div class="home-episode-carousel-viewport is-mobile-transition">
      <div class="home-episode-mobile-transition-strip" style="transform: translate3d(${initialShift}, 0, 0);">
        ${orderedEpisodes.map((episode) => `
          <div class="home-episode-mobile-transition-pane">
            ${renderHomeEpisodeCardMarkup(episode, { mobileAction: true })}
          </div>
        `).join('')}
      </div>
    </div>
    ${renderHomeEpisodeMobileFooterMarkup(incomingEpisode, getHomeFeaturedEpisodes().length)}
  `;
}

function renderHomeEpisodeDesktopTransitionMarkup(outgoingEpisodes, incomingEpisodes, visibleCount, direction, totalEpisodes) {
  const orderedWindows = direction > 0
    ? [outgoingEpisodes, incomingEpisodes]
    : [incomingEpisodes, outgoingEpisodes];
  const initialShift = direction > 0 ? '0%' : '-50%';

  return `
    <div class="home-episode-carousel-viewport is-desktop-transition">
      <div class="home-episode-desktop-transition-strip" style="transform: translate3d(${initialShift}, 0, 0);">
        ${orderedWindows.map((episodes) => `
          <div class="home-episode-desktop-transition-pane">
            <div class="home-episode-grid home-episode-grid-${visibleCount}">
              ${episodes.map((episode) => renderHomeEpisodeCardMarkup(episode)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ${renderHomeEpisodeDesktopFooterMarkup(direction > 0 ? orderedWindows[1] : orderedWindows[0], totalEpisodes)}
  `;
}

function bindHomeEpisodeCarousel(homeEpisodeCarouselShell, homeEpisodeCarousel, isMobile) {
  homeEpisodeCarouselBindingsController?.abort();
  homeEpisodeCarouselBindingsController = new AbortController();
  const { signal } = homeEpisodeCarouselBindingsController;

  document.getElementById('home-episodes-prev')?.addEventListener('click', () => {
    pauseHomeEpisodeAutoAdvance(6000);
    advanceHomeEpisodeCarousel(-1, homeEpisodeCarousel.maxIndex);
  }, { signal });
  document.getElementById('home-episodes-next')?.addEventListener('click', () => {
    pauseHomeEpisodeAutoAdvance(6000);
    advanceHomeEpisodeCarousel(1, homeEpisodeCarousel.maxIndex);
  }, { signal });

  const homeEpisodeCarouselTrack = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-track');
  const hasMobilePreview = isMobile
    && homeEpisodeCarousel.visibleCount === 1
    && homeEpisodeCarousel.maxIndex > 0;

  homeEpisodeCarouselShell.addEventListener('click', (event) => {
    const directEpisodeLink = event.target.closest('.card-primary-link, .home-episode-open-link');
    if (directEpisodeLink && homeEpisodeCarouselShell.contains(directEpisodeLink)) {
      event.preventDefault();
      navigateToEpisodeFromElement(directEpisodeLink);
      return;
    }

    const episodeCard = event.target.closest('.card[data-episode-href]');
    if (!episodeCard || !homeEpisodeCarouselShell.contains(episodeCard)) return;
    if (event.target.closest('.chip, button, input, textarea, select, summary, a')) return;
    navigateToEpisodeFromElement(episodeCard);
  }, { signal });

  if (homeEpisodeCarousel.maxIndex > 0) {
    let swipeAxis = '';
    const resetSwipeState = () => {
      homeEpisodeSwipeTracking = false;
      homeEpisodeSwipePointerId = null;
      swipeAxis = '';
      homeEpisodeCarouselTrack?.classList.remove('is-dragging');
      homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', '0px');
      scheduleHomeEpisodeAutoAdvance(homeEpisodeCarousel.maxIndex);
    };

    homeEpisodeCarouselShell.addEventListener('pointerdown', (event) => {
      if (hasMobilePreview && event.pointerType === 'touch') return;
      if (event.target.closest('a, button, input, textarea, select, summary, .chip')) return;
      if (!hasMobilePreview && event.target.closest('a')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pauseHomeEpisodeAutoAdvance(7000);
      homeEpisodeSwipeTracking = true;
      homeEpisodeSwipePointerId = event.pointerId;
      homeEpisodeSwipeStartX = event.clientX;
      homeEpisodeSwipeStartY = event.clientY;
      swipeAxis = '';
      if (hasMobilePreview) {
        homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', '0px');
        homeEpisodeCarouselTrack?.classList.add('is-dragging');
        homeEpisodeCarouselShell.setPointerCapture?.(event.pointerId);
      }
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointermove', (event) => {
      if (hasMobilePreview && event.pointerType === 'touch') return;
      if (!homeEpisodeSwipeTracking || (homeEpisodeSwipePointerId !== null && event.pointerId !== homeEpisodeSwipePointerId)) return;
      const deltaX = event.clientX - homeEpisodeSwipeStartX;
      const deltaY = event.clientY - homeEpisodeSwipeStartY;
      if (!swipeAxis && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
        swipeAxis = Math.abs(deltaX) > Math.abs(deltaY) * 1.12 ? 'x' : 'y';
      }
      if (!hasMobilePreview || swipeAxis !== 'x') return;
      event.preventDefault();
      const dragOffset = Math.max(Math.min(deltaX, 88), -88);
      homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', `${dragOffset}px`);
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointerup', (event) => {
      if (hasMobilePreview && event.pointerType === 'touch') return;
      if (!homeEpisodeSwipeTracking || (homeEpisodeSwipePointerId !== null && event.pointerId !== homeEpisodeSwipePointerId)) return;
      const deltaX = event.clientX - homeEpisodeSwipeStartX;
      const deltaY = event.clientY - homeEpisodeSwipeStartY;
      const activeAxis = swipeAxis || (Math.abs(deltaX) > Math.abs(deltaY) * 1.15 ? 'x' : 'y');
      if (hasMobilePreview && activeAxis === 'x') {
        const selection = window.getSelection?.()?.toString()?.trim() || '';
        if (!selection && Math.abs(deltaX) >= 42) {
          homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', `${deltaX > 0 ? 112 : -112}px`);
          window.setTimeout(() => {
            pauseHomeEpisodeAutoAdvance(6500);
            advanceHomeEpisodeCarousel(deltaX > 0 ? -1 : 1, homeEpisodeCarousel.maxIndex);
          }, 92);
          resetSwipeState();
          return;
        }
      }
      resetSwipeState();
      if (Math.abs(deltaX) < (isMobile ? 24 : 42)) return;
      if (activeAxis !== 'x' || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
      const selection = window.getSelection?.()?.toString()?.trim() || '';
      if (selection && !hasMobilePreview) return;
      advanceHomeEpisodeCarousel(deltaX > 0 ? -1 : 1, homeEpisodeCarousel.maxIndex);
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointerleave', () => {
      if (!hasMobilePreview) {
        homeEpisodeSwipeTracking = false;
        homeEpisodeSwipePointerId = null;
      }
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointercancel', () => {
      resetSwipeState();
    }, { signal });

    if (hasMobilePreview) {
      homeEpisodeCarouselShell.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;
        if (event.target.closest('a, button, input, textarea, select, summary, .chip')) return;
        const touch = event.touches[0];
        pauseHomeEpisodeAutoAdvance(7000);
        homeEpisodeSwipeTracking = true;
        homeEpisodeSwipeStartX = touch.clientX;
        homeEpisodeSwipeStartY = touch.clientY;
        swipeAxis = '';
        homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', '0px');
        homeEpisodeCarouselTrack?.classList.add('is-dragging');
      }, { passive: true, signal });

      homeEpisodeCarouselShell.addEventListener('touchmove', (event) => {
        if (!homeEpisodeSwipeTracking || event.touches.length !== 1) return;
        const touch = event.touches[0];
        const deltaX = touch.clientX - homeEpisodeSwipeStartX;
        const deltaY = touch.clientY - homeEpisodeSwipeStartY;
        if (!swipeAxis && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
          swipeAxis = Math.abs(deltaX) > Math.abs(deltaY) * 1.12 ? 'x' : 'y';
        }
        if (swipeAxis !== 'x') return;
        event.preventDefault();
        const dragOffset = Math.max(Math.min(deltaX, 88), -88);
        homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', `${dragOffset}px`);
      }, { passive: false, signal });

      homeEpisodeCarouselShell.addEventListener('touchend', (event) => {
        if (!homeEpisodeSwipeTracking) return;
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - homeEpisodeSwipeStartX;
        const deltaY = touch.clientY - homeEpisodeSwipeStartY;
        const tapSlop = 18;
        const activeAxis = swipeAxis || (Math.abs(deltaX) > Math.abs(deltaY) * 1.15 ? 'x' : 'y');
        if (activeAxis === 'x' && Math.abs(deltaX) >= 42) {
          homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', `${deltaX > 0 ? 112 : -112}px`);
          window.setTimeout(() => {
            pauseHomeEpisodeAutoAdvance(6500);
            advanceHomeEpisodeCarousel(deltaX > 0 ? -1 : 1, homeEpisodeCarousel.maxIndex);
          }, 92);
          resetSwipeState();
          return;
        }
        resetSwipeState();
        if (Math.abs(deltaX) < tapSlop && Math.abs(deltaY) < tapSlop && !event.target.closest('a, button, input, textarea, select, summary, .chip')) {
          navigateToEpisodeFromElement(event.target);
        }
      }, { passive: true, signal });

      homeEpisodeCarouselShell.addEventListener('touchcancel', () => {
        resetSwipeState();
      }, { passive: true, signal });
    }
  }

  scheduleHomeEpisodeAutoAdvance(homeEpisodeCarousel.maxIndex);
}

function renderHomeEpisodeCarousel({ direction = 0 } = {}) {
  const homeEpisodeCarouselShell = document.querySelector('.home-episode-carousel-shell');
  if (!(homeEpisodeCarouselShell instanceof HTMLElement)) return;
  const featuredEpisodes = getHomeFeaturedEpisodes();
  const homeEpisodeCarousel = homeEpisodeCarouselState(featuredEpisodes);
  const isMobile = useMobileHomeLayout();
  lastHomeEpisodeVisibleCount = homeEpisodeCarousel.visibleCount;

  const mount = () => {
    homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeCarouselMarkup(homeEpisodeCarousel, featuredEpisodes, {
      mobilePreview: isMobile
    });
    bindHomeEpisodeCarousel(homeEpisodeCarouselShell, homeEpisodeCarousel, isMobile);
  };

  if (!direction) {
    mount();
    return;
  }

  if (isMobile) {
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    const outgoingIndex = getHomeEpisodeOutgoingIndex(homeEpisodeCarousel.currentIndex, direction, homeEpisodeCarousel.maxIndex);
    const outgoingEpisode = featuredEpisodes[outgoingIndex];
    const incomingEpisode = featuredEpisodes[homeEpisodeCarousel.currentIndex];
    const animationDuration = HOME_EPISODE_ANIMATION_MS;

    homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeMobileTransitionMarkup(outgoingEpisode, incomingEpisode, direction);
    const mobileViewport = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-viewport');
    const mobileStrip = homeEpisodeCarouselShell.querySelector('.home-episode-mobile-transition-strip');
    if (!(mobileViewport instanceof HTMLElement) || !(mobileStrip instanceof HTMLElement)) {
      mount();
      homeEpisodeCarouselAnimating = false;
      return;
    }

    const lockedHeight = mobileViewport.getBoundingClientRect().height;
    if (lockedHeight > 0) {
      mobileViewport.style.height = `${lockedHeight}px`;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        mobileStrip.classList.add('is-animating');
        mobileStrip.style.transform = direction > 0
          ? 'translate3d(-50%, 0, 0)'
          : 'translate3d(0, 0, 0)';
      });
    });

    window.setTimeout(() => {
      mount();
      scrollWindowInstantly(currentScrollY, currentScrollX);
      homeEpisodeCarouselAnimating = false;
    }, animationDuration);
    return;
  }

  const currentScrollY = window.scrollY;
  const currentScrollX = window.scrollX;
  const animationDuration = HOME_EPISODE_DESKTOP_ANIMATION_MS;
  const outgoingIndex = getHomeEpisodeOutgoingIndex(homeEpisodeCarousel.currentIndex, direction, homeEpisodeCarousel.maxIndex);
  const outgoingEpisodes = visibleEpisodeWindow(featuredEpisodes, outgoingIndex, homeEpisodeCarousel.visibleCount);
  const incomingEpisodes = homeEpisodeCarousel.visibleEpisodes;

  homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeCarouselMarkup(homeEpisodeCarousel, featuredEpisodes, {
    mobilePreview: false
  });

  const liveViewport = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-viewport');
  const lockedHeight = liveViewport instanceof HTMLElement ? liveViewport.getBoundingClientRect().height : 0;

  homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeDesktopTransitionMarkup(
    outgoingEpisodes,
    incomingEpisodes,
    homeEpisodeCarousel.visibleCount,
    direction,
    featuredEpisodes.length
  );

  const desktopViewport = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-viewport');
  const desktopStrip = homeEpisodeCarouselShell.querySelector('.home-episode-desktop-transition-strip');
  if (!(desktopViewport instanceof HTMLElement) || !(desktopStrip instanceof HTMLElement)) {
    mount();
    scrollWindowInstantly(currentScrollY, currentScrollX);
    homeEpisodeCarouselAnimating = false;
    return;
  }

  if (lockedHeight > 0) {
    desktopViewport.style.height = `${lockedHeight}px`;
  }

  window.requestAnimationFrame(() => {
    desktopStrip.classList.add('is-animating');
    desktopStrip.style.transform = direction > 0
      ? 'translate3d(-50%, 0, 0)'
      : 'translate3d(0, 0, 0)';
  });

  window.setTimeout(() => {
    mount();
    scrollWindowInstantly(currentScrollY, currentScrollX);
    homeEpisodeCarouselAnimating = false;
  }, animationDuration);
}

function renderHome(focusSectionId = '') {
  const isMobile = useMobileHomeLayout();
  const featuredEpisodes = getHomeFeaturedEpisodes();
  lastHomeMobileLayout = isMobile;
  const peopleCount = getPeopleKeywords(PERSON_NAV_MIN_REFERENCES).length;
  const statCards = [
    {
      href: '#/episodes',
      value: site.stats.episodes,
      label: '节目索引',
      tone: 'episodes'
    },
    {
      href: '#/concepts',
      value: site.stats.concepts,
      label: '概念卡片',
      tone: 'concepts'
    },
    {
      href: '#/models',
      value: site.stats.models,
      label: '思想模型',
      tone: 'models'
    },
    {
      href: '#/people',
      value: peopleCount,
      label: '人物',
      tone: 'people'
    }
  ];
  const visibleStatCards = isMobile
    ? []
    : statCards;
  const heroFireworksMarkup = !isMobile ? `
    <div class="hero-fireworks" id="hero-fireworks" aria-hidden="true">
      <div class="hero-firework-burst burst-center">
        ${Array.from({ length: 14 }, (_, index) => `<span class="hero-firework-particle center-${index + 1}"></span>`).join('')}
      </div>
    </div>
  ` : '';
  const heroMobileAvatarMarkup = isMobile ? `
    <a class="hero-mobile-avatar-link" href="#/" aria-label="返回首页">
      <img
        class="hero-mobile-avatar"
        src="./assets/yinfluence-avatar.png"
        alt="颖响力头像"
        width="54"
        height="54"
        loading="eager"
        decoding="async"
      >
    </a>
  ` : '';
  const homeSearchToolbarMarkup = `
    <div class="home-search-toolbar${isMobile ? ' mobile home-search-toolbar-float-only' : ''}">
      <div class="search-row">
        <input id="search-input" type="text" placeholder="搜索知识库：节目、概念、模型、人物、主题，如 EP019 / 特朗普 / 安全阀治理">
        <button id="search-submit" class="search-submit" type="button">搜索</button>
      </div>
    </div>
  `;
  const homeSearchSectionMarkup = `
    <section class="home-search-section${isMobile ? ' home-search-section-after-episodes' : ''}">
      <div class="home-search-results-panel">
        <div class="search-subtitle-row">
          <p id="home-search-title" class="search-subtitle">推荐关键词</p>
          <button id="home-search-reroll" class="search-reroll" type="button" aria-label="换一换推荐关键词">
            <span class="search-reroll-icon" aria-hidden="true">↻</span>
            <span>换一换</span>
          </button>
        </div>
        <div id="home-search-results" class="search-results"></div>
      </div>
    </section>
  `;
  const episodeSectionMarkup = `
    <section id="home-episodes" class="section${isMobile ? ' home-episodes-priority' : ''}">
      <div class="home-episode-carousel-shell${isMobile ? ' mobile' : ''}"></div>
    </section>
  `;
  const homeTopSectionsMarkup = isMobile
    ? `${episodeSectionMarkup}${homeSearchSectionMarkup}`
    : `${homeSearchSectionMarkup}${episodeSectionMarkup}`;
  const desktopReferenceSectionsMarkup = `
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
        <h2 class="section-title">知识图谱</h2>
        <a class="section-note" href="#/graph">进入图谱视图</a>
      </div>
      <div class="grid cards-2">
        <article class="card graph-preview-card" data-card-href="#/graph">
          <p class="card-kicker">Graph View · ${graphData?.meta?.linkCount || 0} 条连接</p>
          <a class="card-primary-link" href="#/graph">
            <h3>从节目跳到概念，再跳到人物与主题</h3>
          </a>
          <p>这张图把五类核心节点放进同一个可视化网络里，适合先看结构密度，再回到单条目做细读。</p>
          ${graphLinkedChipList([
            `节目 ${site.stats.episodes}`,
            `概念 ${site.stats.concepts}`,
            `模型 ${site.stats.models}`,
            `人物 ${site.stats.people}`,
            `主题 ${site.stats.themes}`
          ])}
        </article>
        <article class="card graph-guide-card" data-card-href="#/graph">
          <p class="card-kicker">How To Read</p>
          <a class="card-primary-link" href="#/graph">
            <h3>先找高连接节点，再顺着局部关系钻进去</h3>
          </a>
          <p>图谱适合回答两个问题：哪些主题经常和哪些节目一起出现，以及某个人物或模型究竟被放在什么语境里讲。</p>
          ${graphLinkedChipList(['点击节点看近邻', '双击节点开详情', '滚轮缩放'])}
        </article>
      </div>
    </section>
  `;

  app.innerHTML = `
    <section class="hero">
      <div class="hero-title-row${isMobile ? ' has-mobile-avatar' : ''}">
        <h1>
          <button id="hero-title-trigger" class="hero-title-trigger" type="button">
            <span class="hero-title-primary">颖响力</span>
            <span class="hero-title-secondary">知识库</span>
          </button>
        </h1>
        ${heroMobileAvatarMarkup}
        ${heroFireworksMarkup}
      </div>
      <div class="hero-platform-links">
        ${HOME_PLATFORM_LINKS.map((link) => renderVideoLinkIcon(link)).join('')}
      </div>
      ${visibleStatCards.length ? `
        <div class="stats">
          ${visibleStatCards.map((item) => `
            <a class="stat-card" href="${item.href}" data-stat-tone="${item.tone}">
              <div class="stat-value">${item.value}</div>
              <div class="stat-label">${item.label}</div>
            </a>
          `).join('')}
        </div>
      ` : ''}
    </section>

    ${homeSearchToolbarMarkup}
    ${homeTopSectionsMarkup}
    ${isMobile ? '' : desktopReferenceSectionsMarkup}
  `;

  const searchInput = document.getElementById('search-input');
  const searchSubmit = document.getElementById('search-submit');
  const homeSearchToolbar = document.querySelector('.home-search-toolbar');
  searchInput.value = homeKnowledgeQuery;
  searchInput.addEventListener('input', (event) => {
    homeKnowledgeQuery = event.target.value;
    if (homeKnowledgeQuery.trim()) {
      revealHomeSearchForQuery();
    }
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
  document.getElementById('home-search-reroll')?.addEventListener('click', () => {
    rerollHomeRecommendations();
  });

  const heroTitleTrigger = document.getElementById('hero-title-trigger');
  const heroFireworks = document.getElementById('hero-fireworks');
  if (heroTitleTrigger && heroFireworks && !isMobile) {
    heroTitleTrigger.addEventListener('click', () => {
      heroFireworks.classList.remove('is-bursting');
      void heroFireworks.offsetWidth;
      heroFireworks.classList.add('is-bursting');
      window.setTimeout(() => {
        heroFireworks.classList.remove('is-bursting');
      }, 1100);
    });
  }

  if (homeSearchToolbar) {
    setupHomeSearchToolbarBehavior(homeSearchToolbar);
  }

  renderHomeEpisodeCarousel();

  if (floatingActionsExpanded) {
    scheduleFloatingActionsAutoCollapse();
  }
  app.querySelectorAll('.card[data-card-href]').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, textarea, select, summary')) return;
      const href = card.dataset.cardHref;
      if (!href) return;
      window.location.hash = href;
    });
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
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const searchPlaceholder = isMobile ? '搜 EP031 / 伊朗 / 西贝' : '搜索节目：EP031 / 伊朗 / 西贝为什么这么贵';
  const episodesByNumber = [...site.episodes].sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
  const episodeRanges = buildEpisodeRanges(episodesByNumber);
  const selectedRange = episodeRanges.find((range) => range.start === episodeIndexRangeStart) || episodeRanges[0];
  const selectedIndex = Math.max(0, episodeRanges.findIndex((range) => range.start === selectedRange.start));
  const previousRange = selectedIndex > 0 ? episodeRanges[selectedIndex - 1] : episodeRanges[episodeRanges.length - 1] || null;
  const nextRange = selectedIndex < episodeRanges.length - 1 ? episodeRanges[selectedIndex + 1] : episodeRanges[0] || null;
  const isSearchOpen = episodeIndexSearchMode;
  const initialSearchState = getEpisodeIndexSearchState(episodesByNumber, selectedRange, episodeIndexAppliedQuery);
  const shouldHideEpisodeResults = isSearchOpen && !String(episodeIndexAppliedQuery || '').trim();
  const shouldShowFooterNav = !String(episodeIndexAppliedQuery || '').trim();
  const rangeControlsMarkup = `
    <div class="episode-range-wheel${isMobile ? ' mobile' : ''}" aria-label="节目分组轮盘">
      ${episodeRanges.map((range, index) => `
        <button
          class="episode-range-wheel-option${index === selectedIndex ? ' active' : ''}"
          type="button"
          data-episode-range="${range.start}"
          data-range-wheel-item="true"
          aria-label="切换到区间 ${range.label}"
          aria-pressed="${index === selectedIndex ? 'true' : 'false'}"
        >${escapeHtml(`${range.label}集`)}</button>
      `).join('')}
    </div>
  `;
  const searchToggleMarkup = `
    <button
      id="episode-index-search-toggle"
      class="episode-search-toggle"
      type="button"
      aria-label="打开节目搜索"
    >
      <span class="episode-search-toggle-icon" aria-hidden="true">
        <svg class="episode-search-toggle-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="5.75"></circle>
          <path d="M14.8 14.8L19.6 19.6"></path>
        </svg>
      </span>
    </button>
  `;
  const footerNavMarkup = `
    <div class="episode-range-footer-nav">
      <button class="range-nav-button range-footer-button" type="button" data-episode-range="${previousRange?.start ?? ''}">${escapeHtml(previousRange ? `${previousRange.label}集` : '—')}</button>
      <button class="range-nav-button range-footer-button" type="button" data-episode-range="${nextRange?.start ?? ''}">${escapeHtml(nextRange ? `${nextRange.label}集` : '—')}</button>
    </div>
  `;
  const toolbarMarkup = `
    <div class="episode-index-toolbar-shell">
      <div class="episode-index-toolbar${isMobile ? ' mobile' : ''}${isSearchOpen ? ' is-search-open' : ''}">
        <div class="episode-toolbar-main${isSearchOpen ? ' is-search-open' : ' is-search-collapsed'}">
          ${isSearchOpen
            ? `
              <div class="episode-search-panel${isMobile ? ' mobile' : ''}">
                <div class="search-row episode-search-row${isMobile ? ' mobile' : ''}">
                  <input id="episode-index-search" type="text" placeholder="${escapeHtml(searchPlaceholder)}">
                  <button id="episode-index-search-clear" class="search-clear${isMobile ? ' mobile' : ''}${episodeIndexQuery ? '' : ' hidden'}" type="button">清空</button>
                </div>
                <div id="episode-index-suggestions" class="episode-index-suggestions hidden"></div>
              </div>
            `
            : `
              <div class="episode-range-wheel-wrap">
                ${rangeControlsMarkup}
              </div>
              ${searchToggleMarkup}
            `}
        </div>
      </div>
    </div>
  `;
  const episodeSectionMarkup = `
    <section class="detail-section episode-index-section${shouldHideEpisodeResults ? ' hidden' : ''}">
      <div id="episode-index-results">${renderEpisodeIndexEpisodeList(initialSearchState.filteredEpisodes)}</div>
      ${shouldShowFooterNav ? footerNavMarkup : ''}
    </section>
  `;

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header${isSearchOpen ? ' hidden' : ''}">
        <div class="detail-back-row">
          <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <h1 class="detail-title">节目索引</h1>
      </div>
      ${toolbarMarkup}
      ${episodeSectionMarkup}
    </section>
  `;

  const searchInput = document.getElementById('episode-index-search');
  const episodeSection = document.querySelector('.episode-index-section');
  const resultsContainer = document.getElementById('episode-index-results');
  const clearButton = document.getElementById('episode-index-search-clear');
  const suggestionsContainer = document.getElementById('episode-index-suggestions');
  const toolbar = document.querySelector('.episode-index-toolbar');
  const rangeWheel = document.querySelector('.episode-range-wheel');
  const searchToggle = document.getElementById('episode-index-search-toggle');
  const activeRangeButton = document.querySelector('.episode-range-wheel [data-range-wheel-item].active');
  let isComposing = false;

  const scheduleSearchAutoHide = () => {
    clearEpisodeIndexSearchAutoHideTimer();
  };

  const updateEpisodeSearchResults = () => {
    const scrollY = window.scrollY;
    const hasAppliedQuery = Boolean(String(episodeIndexAppliedQuery || '').trim());
    const nextState = getEpisodeIndexSearchState(episodesByNumber, selectedRange, episodeIndexAppliedQuery);
    if (clearButton) {
      clearButton.classList.toggle('hidden', !String(episodeIndexQuery || '').trim());
    }
    if (episodeSection) {
      episodeSection.classList.toggle('hidden', episodeIndexSearchMode && !hasAppliedQuery);
    }
    if (resultsContainer) {
      resultsContainer.innerHTML = renderEpisodeIndexEpisodeList(nextState.filteredEpisodes);
    }
    renderEpisodeIndexSuggestions(episodeIndexQuery);
    renderSectionProgress();

    window.requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, scrollY);
      syncSectionProgress();
    });

    scheduleSearchAutoHide();
  };

  resultsContainer?.addEventListener('click', (event) => {
    const directEpisodeLink = event.target.closest('.card-primary-link');
    if (directEpisodeLink && resultsContainer.contains(directEpisodeLink)) {
      event.preventDefault();
      navigateToEpisodeFromElement(directEpisodeLink);
      return;
    }

    const episodeCard = event.target.closest('.episode-index-card[data-episode-href]');
    if (!episodeCard || !resultsContainer.contains(episodeCard)) return;
    if (event.target.closest('.chip, button, input, textarea, select, summary, a')) return;
    navigateToEpisodeFromElement(episodeCard);
  });

  if (searchInput) {
    searchInput.value = episodeIndexQuery;
    searchInput.addEventListener('focus', () => {
      renderEpisodeIndexSuggestions(episodeIndexQuery);
      scheduleSearchAutoHide();
    });
    searchInput.addEventListener('compositionstart', () => {
      isComposing = true;
    });
    searchInput.addEventListener('compositionend', (event) => {
      isComposing = false;
      episodeIndexQuery = event.target.value;
      if (episodeIndexQuery.trim() !== String(episodeIndexAppliedQuery || '').trim()) {
        episodeIndexAppliedQuery = '';
      }
      updateEpisodeSearchResults();
    });
    searchInput.addEventListener('input', (event) => {
      episodeIndexQuery = event.target.value;
      if (!episodeIndexQuery.trim()) {
        episodeIndexAppliedQuery = '';
      } else if (episodeIndexQuery.trim() !== String(episodeIndexAppliedQuery || '').trim()) {
        episodeIndexAppliedQuery = '';
      }
      if (isComposing || event.isComposing) return;
      updateEpisodeSearchResults();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;

      const directEpisodeId = normalizeEpisodeIdQuery(episodeIndexQuery);
      if (directEpisodeId) {
        const foundEpisode = site.episodes.find((episode) => episode.id === directEpisodeId);
        if (!foundEpisode) return;
        clearEpisodeIndexSearchOrigin();
        window.location.hash = routeTo(`episodes/${foundEpisode.id}`);
        return;
      }

      const [firstSuggestion] = getEpisodeIndexSuggestionMatches(episodeIndexQuery);
      if (!firstSuggestion) return;
      event.preventDefault();
      episodeIndexQuery = firstSuggestion.value;
      episodeIndexAppliedQuery = firstSuggestion.value;
      episodeIndexSearchMode = false;
      clearEpisodeIndexSearchOrigin();
      renderEpisodeIndex();
      window.requestAnimationFrame(() => {
        scrollEpisodeResultsIntoView();
      });
    });
  }

  clearButton?.addEventListener('click', () => {
    episodeIndexQuery = '';
    episodeIndexAppliedQuery = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus({ preventScroll: true });
    }
    updateEpisodeSearchResults();
  });

  suggestionsContainer?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-episode-index-suggestion]');
    if (!(button instanceof HTMLElement)) return;
    const nextQuery = button.dataset.episodeIndexSuggestion || '';
    if (!nextQuery) return;
    episodeIndexQuery = nextQuery;
    episodeIndexAppliedQuery = nextQuery;
    episodeIndexSearchMode = false;
    clearEpisodeIndexSearchOrigin();
    renderEpisodeIndex();
    window.requestAnimationFrame(() => {
      scrollEpisodeResultsIntoView();
    });
  });

  document.querySelectorAll('[data-episode-range]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!button.dataset.episodeRange) return;
      episodeIndexRangeStart = Number(button.dataset.episodeRange);
      renderEpisodeIndex();
      renderSectionProgress();
      window.requestAnimationFrame(() => {
        syncSectionProgress();
      });
      scrollEpisodeResultsIntoView();
    });
  });

  if (activeRangeButton instanceof HTMLElement) {
    window.requestAnimationFrame(() => {
      centerActiveEpisodeRangeButton(activeRangeButton);
    });
  }

  if (isSearchOpen) {
    renderEpisodeIndexSuggestions(episodeIndexQuery);
  }

  searchToggle?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    episodeIndexSearchOriginHash = '#/episodes';
    episodeIndexSearchOriginScrollY = window.scrollY;
    episodeIndexSearchMode = true;
    episodeIndexFocusSearchOnRender = true;
    renderEpisodeIndex();
  });

  if (rangeWheel instanceof HTMLElement) {
    setupEpisodeRangeWheelDrag(rangeWheel);
  }

  if (toolbar) {
    setupEpisodeToolbarBehavior(toolbar);
  }

  if (isSearchOpen) {
    clearEpisodeIndexSearchAutoHideTimer();
  } else {
    clearEpisodeIndexSearchAutoHideTimer();
  }

  episodeIndexSearchController?.abort();
  if (isSearchOpen) {
    const controller = new AbortController();
    episodeIndexSearchController = controller;
    const { signal } = controller;

    document.addEventListener('click', (event) => {
      if (toolbar?.contains(event.target)) return;
      if (!episodeIndexSearchMode) return;
      const shouldRestoreOrigin = Boolean(episodeIndexSearchOriginHash && !String(episodeIndexAppliedQuery || '').trim());
      if (!String(episodeIndexAppliedQuery || '').trim()) {
        episodeIndexQuery = '';
      } else {
        episodeIndexQuery = episodeIndexAppliedQuery;
        clearEpisodeIndexSearchOrigin();
      }
      episodeIndexSearchMode = false;
      if (shouldRestoreOrigin) {
        restoreEpisodeIndexSearchOrigin();
        return;
      }
      renderEpisodeIndex();
    }, { signal });
  } else {
    episodeIndexSearchController = null;
  }

  if (searchInput && episodeIndexFocusSearchOnRender) {
    episodeIndexFocusSearchOnRender = false;
    window.requestAnimationFrame(() => {
      searchInput.focus({ preventScroll: true });
    });
  }
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
  const keywordCategoryOrder = [
    '人物',
    '国家与地缘',
    '房地产与金融',
    '科技与产业',
    '品牌与公司',
    '教育与学术',
    '文化与媒体',
    '家庭与社会',
    '制度与治理',
    '其他'
  ];
  const groupedKeywords = new Map(keywordCategoryOrder.map((name) => [name, []]));
  visibleKeywords.forEach((keyword) => {
    const category = classifyReferenceItem('keywords', keyword);
    if (!groupedKeywords.has(category)) groupedKeywords.set(category, []);
    groupedKeywords.get(category).push(keyword);
  });
  const keywordSections = [...groupedKeywords.entries()]
    .filter(([, items]) => items.length)
    .map(([category, items], index) => renderCategorizedReferenceSection(category, items, 'keywords', 'summary', index === 0, 'keywords'))
    .join('');

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
            <span class="chip">分类浏览 ${keywordSections ? [...groupedKeywords.entries()].filter(([, items]) => items.length).length : 0}</span>
            <span class="chip">人物 ${groupedKeywords.get('人物')?.length || 0}</span>
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
                      <h3>${escapeHtml(episode.id)}｜${escapeHtml(displayEpisodeTitle(episode.title))}</h3>
                      <p>${escapeHtml(episode.summary || '待整理')}</p>
                    </a>
                  `).join('')}
                </div>
              ` : (!visibleMatches.length ? '<div class="empty-state">没有匹配到关键词或节目。</div>' : '<div class="empty-state">没有匹配到节目。</div>')}
            </section>
          </div>
        ` : keywordSections}
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
    summary: '思想模型是帮助我们观察现实、拆解问题和形成判断的思考框架。它们能帮助我们看清节目所讨论问题背后的结构、动力和判断线索。',
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
          ${renderEpisodeTopNavigation(episode.id)}
          <div class="back-row">
            <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
            <a class="back-link secondary" href="#/">返回首页</a>
          </div>
          <h1 class="detail-title">${escapeHtml(episode.id)}｜${escapeHtml(displayEpisodeTitle(episode.title))}${renderEpisodeFreshBadge(episode)}</h1>
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
  const relatedPeopleChips = linkedChipList('keywords', episode.people, site.keywords);
  const relatedThemeChips = linkedChipList('themes', episode.themes, site.themes);
  const hasKnowledgeLinks = relatedConcepts.length || relatedModels.length;
  const hasTailLinks = (episode.people || []).length || (episode.themes || []).length || relatedEpisodes.length;

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        ${renderEpisodeTopNavigation(episode.id)}
        <div class="back-row">
          <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <h1 class="detail-title">${escapeHtml(episode.id)}｜${escapeHtml(displayEpisodeTitle(episode.title))}${renderEpisodeFreshBadge(episode)}</h1>
        <p class="detail-summary">${escapeHtml(episode.summary)}</p>
        ${renderEpisodeHeaderMeta(episode)}
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
                  <h3>${escapeHtml(item.id)}｜${escapeHtml(displayEpisodeTitle(item.title))}</h3>
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
    routeType: 'keywords',
    title: '人物',
    eyebrow: 'People In Keywords',
    summary: '这里展示已经在关键词层形成稳定节目群的人物入口。当前规则是自动从关键词里识别人物，并显示被引用至少 2 次的条目。',
    collection: getPeopleKeywords(PERSON_NAV_MIN_REFERENCES),
    minimumReferences: PERSON_NAV_MIN_REFERENCES
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

function renderParagraphText(value) {
  const raw = String(value || '').trim();
  if (!raw) return '<p class="subtle">待补充。</p>';
  return raw
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${renderLinkedEpisodeText(paragraph.trim())}</p>`)
    .join('');
}

function renderHighlightCards(items = []) {
  if (!items.length) return '<p class="subtle">待补充。</p>';
  return `
    <div class="list">
      ${items.map((item) => `
        <a class="list-item" href="${routeTo(`episodes/${item.id}`)}">
          <h3>${escapeHtml(item.id)}｜${escapeHtml(displayEpisodeTitle(item.title))}</h3>
          <p>${renderLinkedEpisodeText(item.note || item.summary || '待补充')}</p>
          ${item.summary && item.summary !== item.note ? `<p class="subtle">${renderLinkedEpisodeText(item.summary)}</p>` : ''}
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

function renderDetailBackRow(sectionHref, sectionLabel) {
  return `
    <div class="back-row">
      <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
      <a class="back-link secondary" href="${sectionHref}">返回${escapeHtml(sectionLabel)}页</a>
      <a class="back-link secondary" href="#/">返回首页</a>
    </div>
  `;
}

function renderKeywordAliasLinks(aliases = []) {
  if (!aliases.length) return '';
  return `
    <div class="chip-row">
      ${aliases.map((alias) => `<a class="chip" href="${routeTo(`keywords/${alias}`)}">${escapeHtml(alias)}</a>`).join('')}
    </div>
  `;
}

function renderRelatedKeywordLinks(references = []) {
  const resolved = references
    .map((reference) => findKeywordByReference(reference))
    .filter(Boolean)
    .filter((keyword, index, list) => list.findIndex((item) => item.id === keyword.id) === index);

  if (!resolved.length) return '';

  return `
    <div class="chip-row">
      ${resolved.map((keyword) => `<a class="chip" href="${routeTo(`keywords/${keyword.id}`)}">${escapeHtml(keyword.name)}</a>`).join('')}
    </div>
  `;
}

function renderEpisodeTopNavigation(episodeId) {
  const { previousEpisode, nextEpisode } = getEpisodeNeighbors(episodeId);

  return `
    <div class="episode-neighbor-row">
      ${previousEpisode
        ? `<a class="back-link secondary episode-neighbor-link" href="${routeTo(`episodes/${previousEpisode.id}`)}">← 上一集 ${escapeHtml(previousEpisode.id)}</a>`
        : '<span class="episode-neighbor-spacer" aria-hidden="true"></span>'}
      ${nextEpisode
        ? `<a class="back-link secondary episode-neighbor-link next" href="${routeTo(`episodes/${nextEpisode.id}`)}">下一集 ${escapeHtml(nextEpisode.id)} →</a>`
        : '<span class="episode-neighbor-spacer" aria-hidden="true"></span>'}
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
        ${renderDetailBackRow('#/concepts', '概念')}
        <p class="detail-eyebrow">Concept Card</p>
        <h1 class="detail-title">${escapeHtml(concept.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(concept.summary)}</p>
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
        ${renderReferenceChipSection('共现人物', 'keywords', concept.relatedPeople, site.keywords)}
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
        ${renderDetailBackRow('#/models', '模型')}
        <p class="detail-eyebrow">Mental Model</p>
        <h1 class="detail-title">${escapeHtml(model.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(model.summary)}</p>
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
        ${renderReferenceChipSection('共现人物', 'keywords', model.relatedPeople, site.keywords)}
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
  const person = findPersonByReference(id);
  const keyword = findKeywordByReference(id) || findKeywordByReference(person?.id) || findKeywordByReference(person?.name);
  if (keyword) {
    window.location.hash = routeTo(`keywords/${keyword.id}`);
    return;
  }
  if (!person) {
    renderNotFound('人物不存在');
    return;
  }
  renderNotFound('人物已并入关键词，请从关键词入口访问。');
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
        ${renderDetailBackRow('#/themes', '主题')}
        <p class="detail-eyebrow">Theme Node</p>
        <h1 class="detail-title">${escapeHtml(theme.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(theme.summary)}</p>
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
        ${renderDetailBackRow('#/keywords', '关键词')}
        <p class="detail-eyebrow">${escapeHtml(keyword.englishName || 'Keyword Node')}</p>
        <h1 class="detail-title">${escapeHtml(keyword.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(keyword.summary)}</p>
        ${isPersonKeyword(keyword) ? '<div class="meta-row"><span class="chip">人物关键词</span></div>' : ''}
      </div>
      <section class="detail-section">
        <h2>简单介绍</h2>
        ${renderParagraphText(keyword.description)}
        ${keyword.aliases?.length ? `<h3>相关写法</h3>${renderKeywordAliasLinks(keyword.aliases)}` : ''}
        ${keyword.relatedKeywords?.length ? `<h3>相关关键词</h3>${renderRelatedKeywordLinks(keyword.relatedKeywords)}` : ''}
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
  const previousRoute = parseHashRoute(lastRenderedHash);
  episodeToolbarController?.abort();
  episodeToolbarController = null;
  episodeIndexSearchController?.abort();
  episodeIndexSearchController = null;
  clearEpisodeIndexSearchAutoHideTimer();
  homeSearchToolbarController?.abort();
  homeSearchToolbarController = null;
  teardownRevealAnimations();
  cancelSnapAnimation();
  closeSectionProgressPanel();
  clearSectionProgressEffects();
  destroyGraphView();
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash ? hash.split('/').map(decodeRoutePart) : [];
  const [section, id] = parts;
  document.body.classList.toggle('has-assisted-snap', section !== 'graph');
  document.body.classList.toggle('page-home', !section);
  document.body.classList.toggle('page-episode-index', section === 'episodes' && !id);

  document.title = `${site.meta.title}`;

  if (!section) {
    renderHome();
  } else if (section === 'graph') {
    renderGraphPage();
  } else if (section === 'updates') {
    renderWebsiteLog();
  } else if (section === 'home' && id === 'episodes') {
    renderHome('home-episodes');
  } else if (section === 'episodes' && !id) {
    if (!(previousRoute.section === 'episodes' && !previousRoute.id) && !episodeIndexFocusSearchOnRender) {
      episodeIndexQuery = '';
      episodeIndexAppliedQuery = '';
      episodeIndexSearchMode = false;
      episodeIndexRangeStart = 0;
    }
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

  setupRevealAnimations();
  renderSectionProgress();
  closeSidebar();
  window.clearTimeout(sectionSnapTimer);
  suspendSnapUntil = Date.now() + 420;
  lastSnapTargetTop = -1;
  scrollWindowInstantly(0, 0);
  lastScrollY = 0;
  lastScrollSampleAt = performance.now();
  refreshViewportBehaviors({ resetDock: true });
  lastRenderedHash = window.location.hash || '#/';
  hasRenderedRoute = true;
  const routeRestore = pendingRouteRestore && pendingRouteRestore.hash === (window.location.hash || '#/')
    ? pendingRouteRestore
    : null;
  if (routeRestore) {
    pendingRouteRestore = null;
  }
  window.requestAnimationFrame(() => {
    normalizeMobileViewport();
  });
  if (section === 'episodes' && !id && !routeRestore) {
    window.requestAnimationFrame(() => {
      scrollWindowInstantly(0, 0);
    });
    window.setTimeout(() => {
      scrollWindowInstantly(0, 0);
    }, 140);
  }
  window.requestAnimationFrame(() => {
    syncSectionProgress();
  });
  if (routeRestore) {
    window.requestAnimationFrame(() => {
      scrollWindowInstantly(routeRestore.scrollY, routeRestore.scrollX);
    });
    window.setTimeout(() => {
      scrollWindowInstantly(routeRestore.scrollY, routeRestore.scrollX);
    }, 120);
  }
}

async function init() {
  const [siteResponse, graphResponse] = await Promise.all([
    fetch(dataUrl('site.json')),
    fetch(dataUrl('graph.json'))
  ]);
  site = await siteResponse.json();
  graphData = await graphResponse.json();
  refreshViewportBehaviors({ resetDock: true });
  renderSidebar();
  renderRouteWithTransition();
}

init().catch((error) => {
  app.innerHTML = `<div class="empty-state">加载失败：${escapeHtml(error.message)}</div>`;
});
