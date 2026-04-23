const SVG_NS = 'http://www.w3.org/2000/svg';

const TYPE_META = {
  episode: { label: '节目', color: '#284b63' },
  concept: { label: '概念', color: '#7c5c1a' },
  model: { label: '模型', color: '#33673b' },
  person: { label: '人物', color: '#9f3f2d' },
  theme: { label: '主题', color: '#6b4fa1' }
};

let currentState = null;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeGraphText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s·•・／/\\()（）\-—_]+/g, '');
}

function typeLabel(type) {
  return TYPE_META[type]?.label || type;
}

function nodeRadius(node) {
  return Math.max(6, Math.min(24, 6 + Math.sqrt(node.degree || 0) * 2.4));
}

function typeCenter(type, width, height) {
  const positions = {
    episode: [0.5, 0.45],
    concept: [0.29, 0.35],
    model: [0.71, 0.35],
    person: [0.35, 0.7],
    theme: [0.65, 0.7]
  };
  const [xRatio, yRatio] = positions[type] || [0.5, 0.5];
  return { x: width * xRatio, y: height * yRatio };
}

function clusterSpread(type, width, height) {
  const spreads = {
    episode: [0.24, 0.18],
    concept: [0.17, 0.13],
    model: [0.17, 0.13],
    person: [0.15, 0.11],
    theme: [0.15, 0.11]
  };
  const [xRatio, yRatio] = spreads[type] || [0.14, 0.12];
  return {
    x: width * xRatio,
    y: height * yRatio
  };
}

function clampNodeToCanvas(node, width, height, margin = 26) {
  node.x = Math.max(margin, Math.min(width - margin, node.x));
  node.y = Math.max(margin, Math.min(height - margin, node.y));
}

function computeStaticLayout(nodes, width, height, nonce = 0) {
  const grouped = new Map();

  for (const node of nodes) {
    if (!grouped.has(node.type)) grouped.set(node.type, []);
    grouped.get(node.type).push(node);
  }

  for (const [type, group] of grouped.entries()) {
    group.sort((a, b) => (b.degree || 0) - (a.degree || 0) || a.label.localeCompare(b.label, 'zh-Hans-CN'));
    const center = typeCenter(type, width, height);
    const spread = clusterSpread(type, width, height);
    const total = Math.max(group.length, 1);
    const seed = nonce * 0.71;

    for (let index = 0; index < group.length; index += 1) {
      const node = group[index];
      const ratio = Math.sqrt((index + 0.35) / total);
      const angle = index * 2.399963229728653 + seed;
      const xOffset = Math.cos(angle) * spread.x * ratio;
      const yOffset = Math.sin(angle) * spread.y * ratio;

      node.x = center.x + xOffset;
      node.y = center.y + yOffset;
      clampNodeToCanvas(node, width, height);
    }
  }

  for (let pass = 0; pass < 12; pass += 1) {
    let moved = false;

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];

      for (let j = i + 1; j < nodes.length; j += 1) {
        const other = nodes[j];
        let dx = other.x - node.x;
        let dy = other.y - node.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        const minGap = node.radius + other.radius + 6;

        if (distance < 0.01) {
          dx = 0.5;
          dy = 0.5;
          distance = Math.sqrt(dx * dx + dy * dy);
        }

        if (distance >= minGap) continue;

        const push = (minGap - distance) * 0.52;
        const pushX = (dx / distance) * push;
        const pushY = (dy / distance) * push;

        node.x -= pushX;
        node.y -= pushY;
        other.x += pushX;
        other.y += pushY;
        clampNodeToCanvas(node, width, height);
        clampNodeToCanvas(other, width, height);
        moved = true;
      }
    }

    if (!moved) break;
  }
}

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

function graphMatchesQuery(node, query) {
  const needle = normalizeGraphText(query);
  if (!needle) return false;
  return [node.label, node.fullLabel, node.summary, typeLabel(node.type)]
    .some((item) => normalizeGraphText(item).includes(needle));
}

function findGraphMatches(state, query) {
  return state.nodes
    .filter((node) => state.activeTypes.has(node.type) && graphMatchesQuery(node, query))
    .sort((a, b) => {
      const aStarts = normalizeGraphText(a.label).startsWith(normalizeGraphText(query));
      const bStarts = normalizeGraphText(b.label).startsWith(normalizeGraphText(query));
      if (aStarts !== bStarts) return aStarts ? -1 : 1;
      return (b.degree || 0) - (a.degree || 0);
    });
}

function buildAdjacency(links) {
  const adjacency = new Map();

  for (const link of links) {
    if (!adjacency.has(link.source.id)) adjacency.set(link.source.id, new Set());
    if (!adjacency.has(link.target.id)) adjacency.set(link.target.id, new Set());
    adjacency.get(link.source.id).add(link.target.id);
    adjacency.get(link.target.id).add(link.source.id);
  }

  return adjacency;
}

function destroyGraphView() {
  if (!currentState) return;
  currentState.disposed = true;
  if (currentState.resizeHandler) window.removeEventListener('resize', currentState.resizeHandler);
  currentState = null;
}

function setViewportTransform(state) {
  state.viewport.setAttribute(
    'transform',
    `translate(${state.transform.x} ${state.transform.y}) scale(${state.transform.k})`
  );
}

function getGraphPoint(state, clientX, clientY) {
  const rect = state.svg.getBoundingClientRect();
  const x = (clientX - rect.left - state.transform.x) / state.transform.k;
  const y = (clientY - rect.top - state.transform.y) / state.transform.k;
  return { x, y };
}

function showTooltip(state, node, event) {
  const rect = state.canvasWrap.getBoundingClientRect();
  state.tooltip.innerHTML = `
    <strong>${escapeHtml(node.fullLabel || node.label)}</strong>
    <span>${typeLabel(node.type)} · ${node.degree} 条连接</span>
  `;
  state.tooltip.hidden = false;
  state.tooltip.style.left = `${event.clientX - rect.left + 14}px`;
  state.tooltip.style.top = `${event.clientY - rect.top - 8}px`;
}

function hideTooltip(state) {
  state.tooltip.hidden = true;
}

function getActiveNode(state) {
  return state.hoveredNode || state.selectedNode || null;
}

function updateInspector(state) {
  if (!state.inspector) return;

  const node = getActiveNode(state);
  if (!node) {
    state.inspector.innerHTML = `
      <div class="graph-panel-card">
        <p class="graph-panel-kicker">知识图谱</p>
        <h3>图谱概览</h3>
        <p>${escapeHtml(state.graph.meta.subtitle)}</p>
        <div class="graph-stat-grid">
          <div class="graph-stat-box"><strong>${state.graph.meta.nodeCount}</strong><span>节点</span></div>
          <div class="graph-stat-box"><strong>${state.graph.meta.linkCount}</strong><span>连接</span></div>
        </div>
        <p class="graph-panel-note">悬停节点即可查看局部关系，点击可锁定，双击进入对应条目。</p>
      </div>
    `;
    return;
  }

  const neighborIds = [...(state.adjacency.get(node.id) || [])];
  const neighbors = neighborIds
    .map((id) => state.nodeById.get(id))
    .filter(Boolean)
    .sort((a, b) => (b.degree || 0) - (a.degree || 0) || a.label.localeCompare(b.label, 'zh-Hans-CN'))
    .slice(0, 12);

  state.inspector.innerHTML = `
    <div class="graph-panel-card">
      <p class="graph-panel-kicker">${typeLabel(node.type)}</p>
      <h3>${escapeHtml(node.fullLabel || node.label)}</h3>
      <p>${escapeHtml(node.summary || '这个节点当前还没有补充摘要，但它已经出现在知识图谱中，可以继续沿着关联条目追踪。')}</p>
      <div class="graph-stat-grid">
        <div class="graph-stat-box"><strong>${node.degree}</strong><span>连接数</span></div>
        <div class="graph-stat-box"><strong>${neighbors.length}</strong><span>近邻预览</span></div>
      </div>
      <a class="back-link secondary" href="${state.toHash(node.route)}">打开条目 →</a>
    </div>
    <div class="graph-panel-card">
      <p class="graph-panel-kicker">近邻关系</p>
      <div class="graph-neighbor-list">
        ${neighbors.length
          ? neighbors.map((neighbor) => `
              <a class="graph-neighbor-item" href="${state.toHash(neighbor.route)}">
                <strong>${escapeHtml(neighbor.label)}</strong>
                <span>${typeLabel(neighbor.type)} · ${neighbor.degree}</span>
              </a>
            `).join('')
          : '<p class="graph-panel-note">当前筛选条件下没有更多邻居。</p>'}
      </div>
    </div>
  `;
}

function updateVisualState(state) {
  const query = state.searchInput?.value || '';
  const matchedIds = new Set(findGraphMatches(state, query).map((node) => node.id));
  const neighborhood = new Set();
  const activeNode = getActiveNode(state);

  if (activeNode) {
    neighborhood.add(activeNode.id);
    for (const id of state.adjacency.get(activeNode.id) || []) {
      neighborhood.add(id);
    }
  }

  for (const node of state.nodes) {
    const visible = state.activeTypes.has(node.type);
    const isSelected = state.selectedNode?.id === node.id;
    const isHovered = state.hoveredNode?.id === node.id;
    const isNeighbor = neighborhood.has(node.id);
    const isMatch = matchedIds.has(node.id);
    let opacity = 1;

    if (activeNode && !isNeighbor) opacity = 0.16;
    if (query && !isMatch) opacity *= 0.45;

    node.circleEl.style.display = visible ? '' : 'none';
    node.circleEl.style.opacity = visible ? String(opacity) : '0';
    node.circleEl.setAttribute('fill', TYPE_META[node.type]?.color || '#888');
    node.circleEl.setAttribute(
      'stroke',
      isHovered ? '#ffbe73' : isSelected ? '#f5d39a' : isMatch ? '#ffd977' : 'rgba(255,239,213,0.34)'
    );
    node.circleEl.setAttribute('stroke-width', isHovered ? '3.2' : isSelected ? '3' : isMatch ? '2.1' : '1');
    node.circleEl.setAttribute('r', String(node.radius + (isHovered ? 2.5 : isSelected ? 2 : 0)));

    const showLabel = visible && (state.coreLabelIds.has(node.id) || isSelected || isMatch);
    node.labelEl.style.display = showLabel ? '' : 'none';
    node.labelEl.style.opacity = visible ? String(Math.max(opacity, 0.4)) : '0';
  }

  for (const link of state.links) {
    const visible = state.activeTypes.has(link.source.type) && state.activeTypes.has(link.target.type);
    const incidentToSelection = activeNode
      && (link.source.id === activeNode.id || link.target.id === activeNode.id);
    const touchesMatch = matchedIds.has(link.source.id) || matchedIds.has(link.target.id);
    let opacity = 0.2;

    if (activeNode && !incidentToSelection) opacity = 0.035;
    if (incidentToSelection) opacity = 0.55;
    if (query && !touchesMatch) opacity *= 0.4;

    link.lineEl.style.display = visible ? '' : 'none';
    link.lineEl.style.opacity = visible ? String(opacity) : '0';
  }

  for (const button of state.filterButtons) {
    button.classList.toggle('active', state.activeTypes.has(button.dataset.type));
  }
}

function renderPositions(state) {
  for (const link of state.links) {
    link.lineEl.setAttribute('x1', String(link.source.x));
    link.lineEl.setAttribute('y1', String(link.source.y));
    link.lineEl.setAttribute('x2', String(link.target.x));
    link.lineEl.setAttribute('y2', String(link.target.y));
  }

  for (const node of state.nodes) {
    node.circleEl.setAttribute('cx', String(node.x));
    node.circleEl.setAttribute('cy', String(node.y));
    node.labelEl.setAttribute('x', String(node.x));
    node.labelEl.setAttribute('y', String(node.y + node.radius + 13));
  }
}

function rerunLayout(state, options = {}) {
  const { reshuffle = false } = options;
  if (reshuffle) state.layoutNonce += 1;
  computeStaticLayout(state.nodes, state.width, state.height, state.layoutNonce);
  renderPositions(state);
  updateVisualState(state);
}

function focusNode(state, node) {
  const nextScale = state.transform.k;
  state.transform.x = state.width / 2 - node.x * nextScale;
  state.transform.y = state.height / 2 - node.y * nextScale;
  setViewportTransform(state);
}

function selectNode(state, node, options = {}) {
  state.selectedNode = node;
  updateInspector(state);
  updateVisualState(state);
  if (options.center) {
    focusNode(state, node);
  }
}

function resetView(state) {
  state.transform = { x: 0, y: 0, k: 1 };
  setViewportTransform(state);
}

function mountGraph(state) {
  const typeOrder = ['episode', 'concept', 'model', 'person', 'theme'];
  const filterMarkup = typeOrder
    .map((type) => `
      <button class="graph-filter active" data-type="${type}">
        <span class="graph-filter-dot" style="background:${TYPE_META[type].color}"></span>
        ${TYPE_META[type].label}
        <span class="graph-filter-count">${state.graph.meta.typeCounts[type] || 0}</span>
      </button>
    `)
    .join('');

  state.container.innerHTML = `
    <section class="detail graph-page">
      <div class="detail-header graph-header">
        <div class="back-row">
          <a class="back-link" href="#/">← 返回首页</a>
          <button class="back-link back-button" id="graph-reset-view" type="button">重置视图</button>
          <button class="back-link back-button" id="graph-reheat" type="button">重新排布</button>
        </div>
        <p class="detail-eyebrow">Knowledge Graph</p>
        <h1 class="detail-title">颖响力知识图谱</h1>
        <p class="detail-summary">${escapeHtml(state.graph.meta.subtitle)}。当前图谱先聚焦节目、概念、模型、人物、主题五类节点，避免被关键词噪音淹没。</p>
        <div class="graph-toolbar">
          <label class="graph-search">
            <span>定位节点</span>
            <input id="graph-search-input" type="text" placeholder="搜索节目、概念、人物或主题">
          </label>
          <button class="back-link secondary back-button" id="graph-focus-first" type="button">定位结果</button>
        </div>
        <div class="graph-filter-row">${filterMarkup}</div>
      </div>
      <div class="graph-layout">
        <div class="graph-canvas-card">
          <div class="graph-canvas-wrap" id="graph-canvas-wrap">
            <svg class="graph-svg" id="graph-svg" aria-label="颖响力知识图谱"></svg>
            <div class="graph-tooltip" id="graph-tooltip" hidden></div>
          </div>
          <p class="footer-note">悬停节点自动显示它和关联点，滚轮缩放，拖动画布平移，双击节点进入对应条目。</p>
        </div>
        <aside class="graph-panel graph-panel-side" id="graph-panel"></aside>
      </div>
    </section>
  `;

  state.canvasWrap = state.container.querySelector('#graph-canvas-wrap');
  state.svg = state.container.querySelector('#graph-svg');
  state.tooltip = state.container.querySelector('#graph-tooltip');
  state.inspector = state.container.querySelector('#graph-panel');
  state.searchInput = state.container.querySelector('#graph-search-input');
  state.filterButtons = [...state.container.querySelectorAll('.graph-filter')];
  state.width = Math.max(860, Math.round(state.canvasWrap.clientWidth));
  state.height = Math.max(620, Math.round(state.canvasWrap.clientHeight || 620));
  state.svg.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`);

  state.viewport = createSvgElement('g');
  state.linkLayer = createSvgElement('g');
  state.nodeLayer = createSvgElement('g');
  state.labelLayer = createSvgElement('g');
  state.viewport.append(state.linkLayer, state.nodeLayer, state.labelLayer);
  state.svg.appendChild(state.viewport);
  setViewportTransform(state);

  for (const rawNode of state.graph.nodes) {
    const node = {
      ...rawNode,
      x: state.width / 2,
      y: state.height / 2,
      radius: nodeRadius(rawNode)
    };

    node.circleEl = createSvgElement('circle', {
      r: String(node.radius),
      fill: TYPE_META[node.type]?.color || '#888',
      stroke: 'rgba(255,255,255,0.42)',
      'stroke-width': '1'
    });
    node.labelEl = createSvgElement('text', {
      'text-anchor': 'middle',
      'font-size': '11',
      fill: 'rgba(246, 238, 223, 0.84)'
    });
    node.labelEl.textContent = node.label;

    state.nodeLayer.appendChild(node.circleEl);
    state.labelLayer.appendChild(node.labelEl);
    state.nodes.push(node);
    state.nodeById.set(node.id, node);
  }

  for (const rawLink of state.graph.links) {
    const source = state.nodeById.get(rawLink.source);
    const target = state.nodeById.get(rawLink.target);
    if (!source || !target) continue;

    const link = {
      ...rawLink,
      source,
      target,
      lineEl: createSvgElement('line', {
        stroke: 'rgba(255,236,208,0.12)',
        'stroke-width': '1'
      })
    };

    state.linkLayer.appendChild(link.lineEl);
    state.links.push(link);
  }

  state.adjacency = buildAdjacency(state.links);
  state.coreLabelIds = new Set(
    [...state.nodes]
      .sort((a, b) => (b.degree || 0) - (a.degree || 0) || a.label.localeCompare(b.label, 'zh-Hans-CN'))
      .slice(0, 22)
      .map((node) => node.id)
  );
  rerunLayout(state);
  renderPositions(state);

  for (const node of state.nodes) {
    node.circleEl.addEventListener('mouseenter', (event) => {
      state.hoveredNode = node;
      showTooltip(state, node, event);
      updateInspector(state);
      updateVisualState(state);
    });
    node.circleEl.addEventListener('mousemove', (event) => showTooltip(state, node, event));
    node.circleEl.addEventListener('mouseleave', () => {
      if (state.hoveredNode?.id === node.id) {
        state.hoveredNode = null;
        updateInspector(state);
        updateVisualState(state);
      }
      hideTooltip(state);
    });
    node.circleEl.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.dragDistance > 4) return;
      selectNode(state, node);
    });
    node.circleEl.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      window.location.hash = state.toHash(node.route);
    });
    node.circleEl.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      state.dragNode = node;
      state.dragDistance = 0;
      state.pointerStart = { x: event.clientX, y: event.clientY };
      state.svg.setPointerCapture(event.pointerId);
    });
  }

  state.svg.addEventListener('pointerdown', (event) => {
    if (event.target !== state.svg) return;
    state.dragDistance = 0;
    state.panState = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: state.transform.x,
      originY: state.transform.y
    };
    state.svg.setPointerCapture(event.pointerId);
  });

  state.svg.addEventListener('pointermove', (event) => {
    if (state.dragNode) {
      const point = getGraphPoint(state, event.clientX, event.clientY);
      state.dragDistance = Math.max(
        state.dragDistance,
        Math.abs(event.clientX - state.pointerStart.x) + Math.abs(event.clientY - state.pointerStart.y)
      );
      state.dragNode.x = point.x;
      state.dragNode.y = point.y;
      clampNodeToCanvas(state.dragNode, state.width, state.height);
      renderPositions(state);
      return;
    }

    if (state.panState) {
      const dx = event.clientX - state.panState.x;
      const dy = event.clientY - state.panState.y;
      state.transform.x = state.panState.originX + dx;
      state.transform.y = state.panState.originY + dy;
      setViewportTransform(state);
    }
  });

  state.svg.addEventListener('pointerup', (event) => {
    if (state.dragNode) {
      state.dragNode = null;
      state.pointerStart = null;
    }
    if (state.panState && state.panState.pointerId === event.pointerId) {
      state.panState = null;
    }
    state.svg.releasePointerCapture(event.pointerId);
  });

  state.svg.addEventListener('wheel', (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? 0.9 : 1.1;
    const nextScale = Math.min(2.6, Math.max(0.55, state.transform.k * direction));
    const graphPoint = getGraphPoint(state, event.clientX, event.clientY);
    state.transform.k = nextScale;
    state.transform.x = event.clientX - state.svg.getBoundingClientRect().left - graphPoint.x * nextScale;
    state.transform.y = event.clientY - state.svg.getBoundingClientRect().top - graphPoint.y * nextScale;
    setViewportTransform(state);
  }, { passive: false });

  state.svg.addEventListener('click', () => {
    if (state.dragDistance > 4) return;
    state.hoveredNode = null;
    state.selectedNode = null;
    updateInspector(state);
    updateVisualState(state);
  });

  state.container.querySelector('#graph-reset-view').addEventListener('click', () => {
    resetView(state);
  });
  state.container.querySelector('#graph-reheat').addEventListener('click', () => {
    rerunLayout(state, { reshuffle: true });
  });
  state.container.querySelector('#graph-focus-first').addEventListener('click', () => {
    const [match] = findGraphMatches(state, state.searchInput.value);
    if (!match) return;
    selectNode(state, match, { center: true });
  });

  state.searchInput.addEventListener('input', () => {
    updateVisualState(state);
  });
  state.searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const [match] = findGraphMatches(state, state.searchInput.value);
    if (!match) return;
    selectNode(state, match, { center: true });
  });

  for (const button of state.filterButtons) {
    button.addEventListener('click', () => {
      const { type } = button.dataset;
      if (!type) return;
      if (state.activeTypes.has(type)) state.activeTypes.delete(type);
      else state.activeTypes.add(type);

      if (!state.activeTypes.size) {
        state.activeTypes.add(type);
      }

      updateVisualState(state);
      updateInspector(state);
    });
  }

  state.resizeHandler = () => {
    if (!currentState) return;
    state.width = Math.max(860, Math.round(state.canvasWrap.clientWidth));
    state.height = Math.max(620, Math.round(state.canvasWrap.clientHeight || 620));
    state.svg.setAttribute('viewBox', `0 0 ${state.width} ${state.height}`);
    rerunLayout(state);
  };
  window.addEventListener('resize', state.resizeHandler);

  state.selectedNode = state.nodes[0] || null;
  updateInspector(state);
  updateVisualState(state);
}

function createState({ container, graph, toHash }) {
  return {
    container,
    graph,
    toHash,
    nodes: [],
    links: [],
    nodeById: new Map(),
    adjacency: new Map(),
    coreLabelIds: new Set(),
    activeTypes: new Set(Object.keys(TYPE_META)),
    transform: { x: 0, y: 0, k: 1 },
    layoutNonce: 0,
    hoveredNode: null,
    selectedNode: null,
    dragNode: null,
    dragDistance: 0,
    panState: null,
    pointerStart: null,
    disposed: false,
    resizeHandler: null
  };
}

function renderGraphView({ container, graph, toHash }) {
  destroyGraphView();
  currentState = createState({ container, graph, toHash });
  mountGraph(currentState);
}

export {
  destroyGraphView,
  renderGraphView
};
