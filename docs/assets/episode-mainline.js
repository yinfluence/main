// 单期思维主线网渲染组件
// 公开两个函数：
//   renderEpisodeMainline(episode) → HTML 字符串（嵌入到 renderEpisodeDetail 模板）
//   attachEpisodeMainlineHandlers(rootEl) → 在该 DOM 子树中绑定交互事件

const MAINLINE_WIDTH = 1180;
const MAINLINE_HEIGHT = 460;
const PADDING_X = 80;
const MAIN_Y = MAINLINE_HEIGHT / 2;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function segmentCenter(index, total) {
  if (total <= 1) return MAINLINE_WIDTH / 2;
  const usable = MAINLINE_WIDTH - PADDING_X * 2;
  return PADDING_X + (usable / (total - 1)) * index;
}

// 分支选择优先级（每段默认显示前 2 个）
const BRANCH_PRIORITY = ['people', 'relatedEpisodes', 'concepts', 'models', 'boundaries', 'annotations'];

const SCAN_LIMIT = 2;  // 默认扫读模式：每段最多 2 个分支

let lastKeydownAbort = null;

const BRANCH_META = {
  concepts: { color: '#0284c7', label: '概念' },
  models: { color: '#16a34a', label: '模型' },
  people: { color: '#ea580c', label: '人物' },
  relatedEpisodes: { color: '#7c3aed', label: '跨期' },
  boundaries: { color: '#9ca3af', label: '边界', dashed: true },
  annotations: { color: '#c79235', label: '批注' }
};

function collectBranches(segment, site) {
  const result = [];
  for (const type of BRANCH_PRIORITY) {
    const ids = segment.branches?.[type] || [];
    for (const id of ids) {
      let label = id;
      if (type === 'concepts') label = site?.concepts?.find?.((c) => c.id === id)?.name || id;
      else if (type === 'models') label = site?.models?.find?.((m) => m.id === id)?.name || id;
      else if (type === 'relatedEpisodes') label = id;  // EP002 etc.
      else if (type === 'boundaries' || type === 'annotations') label = id.length > 18 ? id.slice(0, 18) + '…' : id;
      result.push({ type, id, label });
    }
  }
  return result;
}

function branchPosition(segCx, segCy, branchIdx, totalBranches, isAbove) {
  const verticalDist = 110 + (branchIdx % 2 === 0 ? 0 : 30);
  const horizontalSpread = totalBranches > 1 ? (branchIdx - (totalBranches - 1) / 2) * 50 : 0;
  return {
    x: segCx + horizontalSpread,
    y: isAbove ? segCy - verticalDist : segCy + verticalDist
  };
}

export function renderEpisodeMainline(episode, site) {
  const segments = Array.isArray(episode?.segments) ? episode.segments : [];
  if (segments.length === 0) return '';

  const total = segments.length;

  const segElements = segments.map((seg, idx) => {
    const cx = segmentCenter(idx, total);
    const cy = MAIN_Y;
    const isCore = !!seg.isCore;
    const radius = isCore ? 22 : 14;

    const allBranches = collectBranches(seg, site);
    const scanBranches = allBranches.slice(0, SCAN_LIMIT);

    const branchUp = scanBranches.filter((b) => ['concepts', 'models'].includes(b.type));
    const branchDown = scanBranches.filter((b) => !['concepts', 'models'].includes(b.type));

    const renderBranch = (b, i, count, isAbove) => {
      const pos = branchPosition(cx, cy, i, count, isAbove);
      const meta = BRANCH_META[b.type] || {};
      const dashed = meta.dashed ? 'stroke-dasharray="3 2"' : '';
      const lineY1 = isAbove ? cy - radius : cy + radius;
      return `
        <g class="mainline-branch mainline-branch-${b.type}" data-branch-type="${b.type}" data-branch-id="${escapeHtml(b.id)}">
          <line class="mainline-branch-line" x1="${cx}" y1="${lineY1}" x2="${pos.x}" y2="${pos.y}" ${dashed} style="stroke:${meta.color};"></line>
          <circle class="mainline-branch-dot" cx="${pos.x}" cy="${pos.y}" r="5" style="fill:${meta.color};"></circle>
          <text class="mainline-branch-label" x="${pos.x}" y="${pos.y + (isAbove ? -10 : 16)}" text-anchor="middle" style="fill:${meta.color};">${escapeHtml(b.label)}</text>
        </g>
      `;
    };

    const upElems = branchUp.map((b, i) => renderBranch(b, i, branchUp.length, true)).join('');
    const downElems = branchDown.map((b, i) => renderBranch(b, i, branchDown.length, false)).join('');

    return `
      <g class="mainline-seg-node${isCore ? ' is-core' : ''}" data-segment-id="${escapeHtml(seg.id)}">
        ${upElems}
        ${downElems}
        <g transform="translate(${cx},${cy})">
          <circle r="${radius}" class="mainline-seg-circle"></circle>
          <text class="mainline-seg-index" text-anchor="middle" dy="0.32em">${isCore ? '★' : String(idx + 1)}</text>
          <text class="mainline-seg-title" text-anchor="middle" y="${radius + 18}">${escapeHtml(seg.title)}</text>
          <text class="mainline-seg-blurb" text-anchor="middle" y="${radius + 32}">${escapeHtml(seg.blurb || '')}</text>
        </g>
      </g>
    `;
  }).join('');

  return `
    <section class="detail-section mainline-section">
      <h2>思维主线</h2>
      <p class="mainline-subtitle">讲者讲述的 ${total} 段逻辑路线 · 点段节点查看字幕和延展</p>
      <div class="mainline-toolbar" data-mainline-toolbar>
        ${BRANCH_PRIORITY.map((type) => {
          const meta = BRANCH_META[type];
          return `
            <label class="mainline-toolbar-toggle" data-toggle-type="${type}">
              <input type="checkbox" checked />
              <span class="mainline-toolbar-dot" style="background:${meta.color};"></span>
              <span class="mainline-toolbar-label">${escapeHtml(meta.label)}</span>
            </label>
          `;
        }).join('')}
      </div>
      <div class="mainline-canvas" data-mainline-canvas>
        <svg class="mainline-svg" viewBox="0 0 ${MAINLINE_WIDTH} ${MAINLINE_HEIGHT}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(episode.id)} 思维主线">
          <line class="mainline-axis" x1="${PADDING_X}" y1="${MAIN_Y}" x2="${MAINLINE_WIDTH - PADDING_X}" y2="${MAIN_Y}"></line>
          ${segElements}
        </svg>
        <aside class="mainline-panel" data-mainline-panel hidden>
          <button class="mainline-panel-close" type="button" aria-label="关闭">×</button>
          <div class="mainline-panel-body"></div>
        </aside>
      </div>
    </section>
  `;
}

function renderPanelHtml(segment, site) {
  const allBranches = collectBranches(segment, site);
  const byType = {};
  for (const b of allBranches) {
    if (!byType[b.type]) byType[b.type] = [];
    byType[b.type].push(b);
  }

  const groupHtml = (type, items) => {
    if (!items || items.length === 0) return '';
    const meta = BRANCH_META[type];
    return `
      <div class="mainline-panel-group">
        <h5 style="color:${meta.color};">${escapeHtml(meta.label)}（${items.length}）</h5>
        <ul>
          ${items.map((it) => `<li><span class="mainline-panel-dot" style="background:${meta.color};"></span>${escapeHtml(it.label)}</li>`).join('')}
        </ul>
      </div>
    `;
  };

  const segIndex = String(segment.id || '').replace(/^s/, '');
  const tsRange = (segment.startTs || segment.endTs)
    ? `${escapeHtml(segment.startTs || '')} – ${escapeHtml(segment.endTs || '')}`
    : '';

  return `
    <div class="mainline-panel-header">
      <span class="mainline-panel-index">${segment.isCore ? '★ ' : ''}段 ${escapeHtml(segIndex)}</span>
      <h4>${escapeHtml(segment.title)}</h4>
      <p class="mainline-panel-blurb">${escapeHtml(segment.blurb || '')}</p>
      ${tsRange ? `<p class="mainline-panel-ts">${tsRange}</p>` : ''}
    </div>
    ${segment.keyQuote ? `<blockquote class="mainline-panel-quote">${escapeHtml(segment.keyQuote)}</blockquote>` : ''}
    <div class="mainline-panel-branches">
      ${BRANCH_PRIORITY.map((type) => groupHtml(type, byType[type])).join('')}
    </div>
  `;
}

export function attachEpisodeMainlineHandlers(rootEl, episode, site) {
  if (!rootEl) return;
  const canvas = rootEl.querySelector('[data-mainline-canvas]');
  if (!canvas) return;
  const panel = canvas.querySelector('[data-mainline-panel]');
  const panelBody = panel?.querySelector('.mainline-panel-body');
  const closeBtn = panel?.querySelector('.mainline-panel-close');
  // 顶部类型 filter toggles
  const toolbar = rootEl.querySelector('[data-mainline-toolbar]');
  if (toolbar) {
    const toggles = toolbar.querySelectorAll('input[type="checkbox"]');
    toggles.forEach((input) => {
      input.addEventListener('change', () => {
        const type = input.closest('[data-toggle-type]')?.getAttribute('data-toggle-type');
        if (!type) return;
        canvas.classList.toggle(`mainline-hide-${type}`, !input.checked);
      });
    });
  }

  const segNodes = canvas.querySelectorAll('.mainline-seg-node');
  const svg = canvas.querySelector('.mainline-svg');

  function openFocus(segmentId) {
    const seg = (episode?.segments || []).find((s) => s.id === segmentId);
    if (!seg || !panelBody || !panel) return;
    canvas.classList.add('mainline-focus-on');
    segNodes.forEach((n) => {
      if (n.getAttribute('data-segment-id') === segmentId) {
        n.classList.add('is-focused');
        n.classList.remove('is-dimmed');
      } else {
        n.classList.remove('is-focused');
        n.classList.add('is-dimmed');
      }
    });
    panelBody.innerHTML = renderPanelHtml(seg, site);
    panel.hidden = false;
  }

  function closeFocus() {
    canvas.classList.remove('mainline-focus-on');
    segNodes.forEach((n) => {
      n.classList.remove('is-focused');
      n.classList.remove('is-dimmed');
    });
    if (panel) panel.hidden = true;
  }

  segNodes.forEach((node) => {
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = node.getAttribute('data-segment-id');
      openFocus(id);
    });
  });

  closeBtn?.addEventListener('click', closeFocus);

  // 点 svg 空白区（非节点）关闭焦点
  svg?.addEventListener('click', (event) => {
    if (!event.target.closest('.mainline-seg-node')) {
      closeFocus();
    }
  });

  // 用 AbortController 防止 listener 在 renderEpisodeDetail 重新调用时累积
  if (lastKeydownAbort) {
    lastKeydownAbort.abort();
  }
  lastKeydownAbort = new AbortController();
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeFocus();
  }, { signal: lastKeydownAbort.signal });
}
