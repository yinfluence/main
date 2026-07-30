const D3_URL = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';

const TYPE_META = {
  episode: { label: '节目', color: '#284b63' },
  live: { label: '直播', color: '#a06a1f' },
  concept: { label: '概念', color: '#7c5c1a' },
  model: { label: '模型', color: '#33673b' },
  person: { label: '人物', color: '#9f3f2d' },
  theme: { label: '主题', color: '#6b4fa1' }
};

const TYPE_ORDER = ['episode', 'live', 'concept', 'model', 'person', 'theme'];
const CORE_TYPES = new Set(['concept', 'model', 'person']);
const LABEL_DEGREE_THRESHOLD = 10;
const COMPACT_LINK_DISTANCE = 34;
const COMPACT_EPISODE_LINK_DISTANCE = 39;
const COMPACT_RADIAL_RADIUS = 0.155;
const COMPACT_CORE_PULL = 0.12;
const COMPACT_OUTER_PULL = 0.062;
const LOCKED_FOCUS_DURATION = 1050;
const DRAG_FOCUS_GRACE_MS = 260;
const GRAPH_HISTORY_STATE_KEY = 'yinfluenceGraphState';

let currentState = null;
let d3LoadPromise = null;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function typeLabel(type) {
  return TYPE_META[type]?.label || type;
}

function nodeRadius(node) {
  return Math.max(4.2, Math.min(15.5, 3.4 + Math.sqrt(Math.max(node.degree || 1, 1)) * 1.65));
}

function loadD3() {
  if (window.d3) return Promise.resolve(window.d3);
  if (d3LoadPromise) return d3LoadPromise;

  d3LoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${D3_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.d3), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = D3_URL;
    script.async = true;
    script.onload = () => resolve(window.d3);
    script.onerror = () => reject(new Error('D3 加载失败'));
    document.head.appendChild(script);
  });

  return d3LoadPromise;
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
  if (currentState.simulation) currentState.simulation.stop();
  if (currentState.resizeHandler) window.removeEventListener('resize', currentState.resizeHandler);
  currentState = null;
}

function showTooltip(state, node, event) {
  const rect = state.canvasWrap.getBoundingClientRect();
  state.tooltip.innerHTML = `
    <strong>${escapeHtml(node.fullLabel || node.label)}</strong>
    <span>${typeLabel(node.type)} · ${node.degree || 0} 条连接</span>
  `;
  state.tooltip.hidden = false;
  state.tooltip.style.left = `${event.clientX - rect.left + 14}px`;
  state.tooltip.style.top = `${event.clientY - rect.top - 8}px`;
}

function hideTooltip(state) {
  state.tooltip.hidden = true;
}

function graphRouteHash() {
  return '#/graph';
}

function replaceGraphHistoryState(lockedNodeId = null) {
  if (!window.history?.replaceState) return;
  const currentState = window.history.state && typeof window.history.state === 'object'
    ? { ...window.history.state }
    : {};
  const graphState = {
    ...(currentState[GRAPH_HISTORY_STATE_KEY] || {}),
    hash: graphRouteHash()
  };

  if (lockedNodeId) graphState.lockedNodeId = lockedNodeId;
  else delete graphState.lockedNodeId;

  window.history.replaceState(
    {
      ...currentState,
      [GRAPH_HISTORY_STATE_KEY]: graphState
    },
    '',
    window.location.href
  );
}

function restoredLockedNodeId() {
  const graphState = window.history.state?.[GRAPH_HISTORY_STATE_KEY];
  if (!graphState || graphState.hash !== graphRouteHash()) return '';
  return typeof graphState.lockedNodeId === 'string' ? graphState.lockedNodeId : '';
}

function updateStats(state) {
  const visibleNodes = state.nodes.filter((node) => state.activeTypes.has(node.type)).length;
  const visibleLinks = state.links.filter(
    (link) => state.activeTypes.has(link.source.type) && state.activeTypes.has(link.target.type)
  ).length;
  state.statsEl.textContent = `${visibleNodes} 个节点 · ${visibleLinks} 条链接`;
}

function setGraphSize(state) {
  state.width = Math.max(360, Math.round(state.canvasWrap.clientWidth));
  state.height = Math.max(520, Math.round(state.canvasWrap.clientHeight || window.innerHeight * 0.86));
  state.svg.attr('viewBox', `0 0 ${state.width} ${state.height}`);
}

function isNodeVisible(state, node) {
  return state.activeTypes.has(node.type);
}

function isLinkVisible(state, link) {
  return isNodeVisible(state, link.source) && isNodeVisible(state, link.target);
}

function clearLockedFocus(state, animate = false) {
  if (!state.focusLayer) return;
  if (state.focusAnimationFrame) cancelAnimationFrame(state.focusAnimationFrame);
  state.focusAnimationFrame = null;
  if (state.focusSimulation) state.focusSimulation.stop();
  state.focusSimulation = null;
  state.focusLayer.selectAll('*').interrupt();
  if (!animate || !state.d3) {
    state.focusLayer.selectAll('*').remove();
    state.lockedFocusId = null;
    return;
  }

  state.focusLayer
    .selectAll('*')
    .transition()
    .duration(140)
    .style('opacity', 0)
    .remove();
  state.lockedFocusId = null;
}

function resetGraphFocus(state) {
  clearLockedFocus(state);
  state.hoverLabels.selectAll('text').remove();
  state.linkSelection
    .attr('stroke', 'rgba(111, 92, 69, 0.22)')
    .attr('stroke-opacity', (link) => isLinkVisible(state, link) ? 0.2 : 0)
    .attr('stroke-width', 0.55);
  state.nodeSelection
    .attr('opacity', (node) => isNodeVisible(state, node) ? 0.9 : 0)
    .attr('r', (node) => node.radius)
    .attr('stroke', 'rgba(255,255,255,0.74)')
    .attr('stroke-width', 0.7);
  state.labelSelection
    .attr('opacity', (node) => isNodeVisible(state, node) ? 0.72 : 0);
}

function applyBaseFocusStyles(state, node) {
  const neighbors = state.adjacency.get(node.id) || new Set();
  const activeIds = new Set([node.id, ...neighbors]);

  state.linkSelection
    .attr('stroke', (link) => {
      const incident = link.source.id === node.id || link.target.id === node.id;
      return incident ? TYPE_META[node.type]?.color || '#7c5c1a' : 'rgba(111, 92, 69, 0.16)';
    })
    .attr('stroke-opacity', (link) => {
      if (!isLinkVisible(state, link)) return 0;
      return link.source.id === node.id || link.target.id === node.id ? 0.72 : 0.035;
    })
    .attr('stroke-width', (link) => (link.source.id === node.id || link.target.id === node.id ? 1.45 : 0.45));

  state.nodeSelection
    .attr('opacity', (item) => {
      if (!isNodeVisible(state, item)) return 0;
      if (item.id === node.id) return 1;
      return activeIds.has(item.id) ? 0.92 : 0.08;
    })
    .attr('r', (item) => item.radius + (item.id === node.id ? 2.6 : activeIds.has(item.id) ? 1.1 : 0))
    .attr('stroke', (item) => activeIds.has(item.id) ? '#fff6e5' : 'rgba(255,255,255,0.5)')
    .attr('stroke-width', (item) => item.id === node.id ? 1.9 : activeIds.has(item.id) ? 1.1 : 0.5);

  state.labelSelection
    .attr('opacity', (item) => {
      if (!isNodeVisible(state, item)) return 0;
      if (item.id === node.id) return 1;
      return activeIds.has(item.id) ? 0.88 : 0.06;
    });

  return { neighbors, activeIds };
}

function applyLockedBackdropStyles(state, node) {
  const neighbors = state.adjacency.get(node.id) || new Set();
  const activeIds = new Set([node.id, ...neighbors]);

  state.linkSelection
    .attr('stroke', (link) => {
      const incident = link.source.id === node.id || link.target.id === node.id;
      return incident ? TYPE_META[node.type]?.color || '#7c5c1a' : 'rgba(111, 92, 69, 0.12)';
    })
    .attr('stroke-opacity', (link) => {
      if (!isLinkVisible(state, link)) return 0;
      return link.source.id === node.id || link.target.id === node.id ? 0.045 : 0.018;
    })
    .attr('stroke-width', (link) => (link.source.id === node.id || link.target.id === node.id ? 0.45 : 0.32));

  state.nodeSelection
    .attr('opacity', (item) => {
      if (!isNodeVisible(state, item)) return 0;
      if (item.id === node.id) return 0.04;
      return activeIds.has(item.id) ? 0.06 : 0.075;
    })
    .attr('r', (item) => item.radius)
    .attr('stroke', 'rgba(255,255,255,0.46)')
    .attr('stroke-width', 0.45);

  state.labelSelection
    .attr('opacity', (item) => {
      if (!isNodeVisible(state, item)) return 0;
      return activeIds.has(item.id) ? 0.055 : 0.035;
    });

  return { neighbors, activeIds };
}

function applyNodeFocus(state, node, event = null) {
  clearLockedFocus(state);
  const { neighbors } = applyBaseFocusStyles(state, node);
  if (event) showTooltip(state, node, event);
  else hideTooltip(state);

  const hoverItems = [node, ...[...neighbors]
    .map((id) => state.nodeById.get(id))
    .filter((item) => item && isNodeVisible(state, item) && !item.isCoreLabel)];

  state.hoverLabels
    .selectAll('text')
    .data(hoverItems, (item) => item.id)
    .join('text')
    .attr('class', 'graph-hover-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', (item) => item.id === node.id ? 10.4 : 8.2)
    .attr('x', (item) => item.x)
    .attr('y', (item) => item.y + item.radius + 11)
    .text((item) => item.label);
}

function visibleNeighborNodes(state, node) {
  return [...(state.adjacency.get(node.id) || [])]
    .map((id) => state.nodeById.get(id))
    .filter((item) => item && isNodeVisible(state, item))
    .sort((left, right) => (right.degree || 0) - (left.degree || 0) || left.label.localeCompare(right.label, 'zh-Hans-CN'));
}

function lockedFocusScale(state) {
  const currentScale = state.currentTransform?.k || 1;
  if (currentScale > 2.05) return 1.55;
  return Math.min(1.85, Math.max(1.22, currentScale));
}

function graphUnitsForPixels(pixelValue, scale) {
  return pixelValue / Math.max(scale || 1, 0.22);
}

function stableNoise(value, salt = 0) {
  const text = `${value}:${salt}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function labelAnchorFromVector(dx, dy) {
  if (Math.abs(dx) < 0.22 && dy < 0) return 'middle';
  if (Math.abs(dx) < 0.22 && dy >= 0) return 'middle';
  return dx > 0 ? 'start' : 'end';
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function shortestAngleDelta(from, to) {
  const twoPi = Math.PI * 2;
  return ((to - from + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
}

function relaxedFocusAngles(neighbors, node) {
  const twoPi = Math.PI * 2;
  const count = neighbors.length;
  if (!count) return [];

  const items = neighbors.map((neighbor, index) => {
    const dx = neighbor.x - node.x;
    const dy = neighbor.y - node.y;
    const fallbackAngle = -Math.PI / 2 + index * 2.399963229728653;
    const baseAngle = Math.hypot(dx, dy) > 4 ? Math.atan2(dy, dx) : fallbackAngle;
    const jitter = (stableNoise(neighbor.id, 11) - 0.5) * Math.min(0.48, twoPi / Math.max(count, 1) * 0.72);
    return {
      neighbor,
      angle: normalizeAngle(baseAngle + jitter)
    };
  }).sort((left, right) => left.angle - right.angle);

  const minimumGap = Math.min(0.82, (twoPi / count) * 0.78);
  for (let pass = 0; pass < 10; pass += 1) {
    for (let index = 0; index < items.length; index += 1) {
      const current = items[index];
      const next = items[(index + 1) % items.length];
      const nextAngle = next.angle + (index === items.length - 1 ? twoPi : 0);
      const gap = nextAngle - current.angle;
      if (gap >= minimumGap) continue;
      const push = (minimumGap - gap) / 2;
      current.angle = normalizeAngle(current.angle - push);
      next.angle = normalizeAngle(next.angle + push);
    }
    items.sort((left, right) => left.angle - right.angle);
  }

  return items;
}

function ringMetricsForNeighborCount(state, count) {
  const viewMin = Math.min(state.width || 960, state.height || 720);
  const availableRadius = Math.max(210, viewMin * 0.43);
  const desiredOuter = count <= 8 ? 215 : count <= 18 ? 300 : count <= 36 ? 395 : 475;
  const outerPixel = Math.min(availableRadius, desiredOuter);
  const ringCount = count <= 10 ? 1 : count <= 26 ? 2 : count <= 48 ? 3 : 4;
  const gapPixel = ringCount === 1 ? 0 : Math.min(104, Math.max(74, outerPixel * 0.23));
  const basePixel = Math.max(126, outerPixel - gapPixel * (ringCount - 1));
  return { basePixel, gapPixel, ringCount };
}

function focusLabelProps(item, center, focusScale) {
  if (item.isSource) {
    return {
      x: item.x,
      y: item.y + item.node.radius + graphUnitsForPixels(24, focusScale),
      anchor: 'middle'
    };
  }
  const dx = item.x - center.x;
  const dy = item.y - center.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const gap = graphUnitsForPixels(18, focusScale);
  return {
    x: item.x + (dx / length) * (item.node.radius + gap),
    y: item.y + (dy / length) * (item.node.radius + gap),
    anchor: labelAnchorFromVector(dx / length, dy / length)
  };
}

function focusLinkPath(link) {
  const source = link.source;
  const target = link.target;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const curve = link.curve || 0;
  const cx = (source.x + target.x) / 2 + (-dy / length) * curve;
  const cy = (source.y + target.y) / 2 + (dx / length) * curve;
  return `M${source.x},${source.y} Q${cx},${cy} ${target.x},${target.y}`;
}

function relaxFocusTargets(layout, focusScale) {
  const items = layout.items.filter((item) => !item.isSource);
  if (items.length < 2) return;

  for (let pass = 0; pass < 34; pass += 1) {
    for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
      const left = items[leftIndex];
      for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
        const right = items[rightIndex];
        let dx = right.targetX - left.targetX;
        let dy = right.targetY - left.targetY;
        let distance = Math.hypot(dx, dy);
        if (distance < 0.001) {
          dx = stableNoise(`${left.id}:${right.id}`, 53) - 0.5;
          dy = stableNoise(`${left.id}:${right.id}`, 59) - 0.5;
          distance = Math.hypot(dx, dy) || 1;
        }

        const minDistance = Math.min(
          graphUnitsForPixels(150, focusScale),
          (left.collisionRadius + right.collisionRadius) * 0.72
        );
        if (distance >= minDistance) continue;

        const push = (minDistance - distance) * 0.42;
        const pushX = (dx / distance) * push;
        const pushY = (dy / distance) * push;
        left.targetX -= pushX;
        left.targetY -= pushY;
        right.targetX += pushX;
        right.targetY += pushY;
      }
    }

    for (const item of items) {
      const dx = item.targetX - layout.center.x;
      const dy = item.targetY - layout.center.y;
      const currentRadius = Math.max(1, Math.hypot(dx, dy));
      const targetRadius = item.preferredRadius || currentRadius;
      const correction = (targetRadius - currentRadius) * 0.028;
      item.targetX += (dx / currentRadius) * correction;
      item.targetY += (dy / currentRadius) * correction;
    }
  }
}

function prepareFocusMotion(layout) {
  for (const item of layout.items) {
    if (item.isSource) {
      item.startAngle = 0;
      item.targetAngle = 0;
      item.angleDelta = 0;
      item.startRadius = 0;
      item.targetRadius = 0;
      item.orbitDrift = 0;
      continue;
    }

    const fromDx = item.fromX - layout.center.x;
    const fromDy = item.fromY - layout.center.y;
    const targetDx = item.targetX - layout.center.x;
    const targetDy = item.targetY - layout.center.y;
    const startDistance = Math.hypot(fromDx, fromDy);
    item.startRadius = startDistance;
    item.targetRadius = Math.hypot(targetDx, targetDy);
    item.startAngle = startDistance > 2 ? Math.atan2(fromDy, fromDx) : Math.atan2(targetDy, targetDx);
    item.targetAngle = Math.atan2(targetDy, targetDx);
    item.angleDelta = shortestAngleDelta(item.startAngle, item.targetAngle);
    item.orbitDrift = (stableNoise(item.id, 67) - 0.5) * 0.22;
  }
}

function computeLockedFocusItems(state, node, focusScale) {
  const neighbors = visibleNeighborNodes(state, node);
  const count = neighbors.length;
  const { basePixel, gapPixel, ringCount } = ringMetricsForNeighborCount(state, count);
  const baseRadius = graphUnitsForPixels(basePixel, focusScale);
  const ringGap = graphUnitsForPixels(gapPixel, focusScale);
  const center = { x: node.x, y: node.y };
  const seenLabels = new Set();
  const sourceItem = {
    id: node.id,
    node,
    isSource: true,
    x: node.x,
    y: node.y,
    targetX: center.x,
    targetY: center.y,
    fromX: node.x,
    fromY: node.y,
    displayLabel: node.label,
    fontSize: graphUnitsForPixels(14.8, focusScale),
    collisionRadius: node.radius + graphUnitsForPixels(32, focusScale)
  };
  const items = [sourceItem];
  seenLabels.add(node.label);

  relaxedFocusAngles(neighbors, node).forEach(({ neighbor, angle }, index) => {
    const band = ringCount === 1 ? 0 : index % ringCount;
    const radiusJitter = (stableNoise(neighbor.id, 23) - 0.5) * graphUnitsForPixels(44, focusScale);
    const radius = baseRadius + band * ringGap + radiusJitter;
    const targetX = center.x + Math.cos(angle) * radius;
    const targetY = center.y + Math.sin(angle) * radius;
    const label = neighbor.label;
    const displayLabel = seenLabels.has(label) ? '' : label;
    if (label) seenLabels.add(label);
    items.push({
      id: neighbor.id,
      node: neighbor,
      isSource: false,
      x: neighbor.x,
      y: neighbor.y,
      targetX,
      targetY,
      fromX: neighbor.x,
      fromY: neighbor.y,
      displayLabel,
      fontSize: graphUnitsForPixels(11.8, focusScale),
      preferredRadius: radius,
      collisionRadius: neighbor.radius + graphUnitsForPixels(displayLabel ? 42 : 26, focusScale)
    });
  });

  const byId = new Map(items.map((item) => [item.id, item]));
  const layout = {
    center,
    items,
    links: neighbors
      .map((neighbor) => ({
        id: `${node.id}--${neighbor.id}`,
        source: sourceItem,
        target: byId.get(neighbor.id),
        color: neighbor.color || TYPE_META[neighbor.type]?.color || '#7c5c1a',
        distance: baseRadius * (0.86 + stableNoise(neighbor.id, 41) * 0.3),
        curve: graphUnitsForPixels((stableNoise(neighbor.id, 47) - 0.5) * 32, focusScale)
      }))
      .filter((link) => link.target)
  };
  relaxFocusTargets(layout, focusScale);
  prepareFocusMotion(layout);
  return layout;
}

function centerLockedFocusView(state, d3, center, focusScale, duration = LOCKED_FOCUS_DURATION) {
  const x = state.width / 2 - center.x * focusScale;
  const y = state.height / 2 - center.y * focusScale;
  const transform = d3.zoomIdentity.translate(x, y).scale(focusScale);

  state.svg.interrupt();
  if (!duration) {
    state.svg.call(state.zoom.transform, transform);
    return;
  }

  state.svg
    .transition()
    .duration(duration)
    .ease(d3.easeCubicOut)
    .call(state.zoom.transform, transform);
}

function activateFocusNode(state, event, item) {
  event.stopPropagation();
  if (event.defaultPrevented) return;
  const node = item.node || item;
  if (state.lockedNode?.id !== node.id) {
    lockNode(state, node);
    return;
  }
  window.location.hash = state.toHash(node.route);
}

function handleFocusNodeKey(state, event, item) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  activateFocusNode(state, event, item);
}

function renderFocusFrame(state, layout, focusScale, progress) {
  const d3 = state.d3;
  const eased = progress >= 1 ? 1 : d3.easeCubicInOut(progress);
  const reveal = Math.max(0, Math.min(1, (progress - 0.34) / 0.42));
  const labelReveal = d3.easeCubicOut(reveal);

  for (const item of layout.items) {
    if (item.isSource) {
      item.x = layout.center.x;
      item.y = layout.center.y;
      continue;
    }

    const angle = item.startAngle + item.angleDelta * eased + item.orbitDrift * Math.sin(Math.PI * progress);
    const radius = item.startRadius + (item.targetRadius - item.startRadius) * eased;
    item.x = layout.center.x + Math.cos(angle) * radius;
    item.y = layout.center.y + Math.sin(angle) * radius;

    if (progress >= 1) {
      item.x = item.targetX;
      item.y = item.targetY;
    }
  }

  state.focusLayer
    .selectAll('path.graph-focus-link')
    .attr('d', (link) => focusLinkPath(link))
    .attr('stroke-width', graphUnitsForPixels(1.05, focusScale))
    .attr('stroke-opacity', 0.04 + eased * 0.13);

  state.focusLayer
    .selectAll('circle.graph-focus-node')
    .attr('cx', (item) => item.x)
    .attr('cy', (item) => item.y)
    .attr('r', (item) => item.node.radius + graphUnitsForPixels(item.isSource ? 5.2 : 2.2, focusScale))
    .attr('opacity', (item) => item.isSource ? 0.98 : 0.52 + eased * 0.36)
    .attr('stroke-width', (item) => graphUnitsForPixels(item.isSource ? 2.2 : 1.4, focusScale));

  state.focusLayer
    .selectAll('text.graph-focus-label')
    .attr('text-anchor', (item) => focusLabelProps(item, layout.center, focusScale).anchor)
    .attr('x', (item) => focusLabelProps(item, layout.center, focusScale).x)
    .attr('y', (item) => focusLabelProps(item, layout.center, focusScale).y)
    .attr('opacity', (item) => item.isSource ? Math.max(0.72, labelReveal) : labelReveal * 0.96);
}

function renderLockedFocus(state, node, event = null, options = {}) {
  if (!state.focusLayer || !state.d3) {
    applyNodeFocus(state, node, event);
    return;
  }
  const { animate = state.lockedFocusId !== node.id } = options;
  const duration = animate ? LOCKED_FOCUS_DURATION : 0;
  const d3 = state.d3;
  applyLockedBackdropStyles(state, node);
  state.hoverLabels.selectAll('text').remove();
  if (event) showTooltip(state, node, event);
  else hideTooltip(state);

  const focusScale = lockedFocusScale(state);
  const layout = computeLockedFocusItems(state, node, focusScale);
  state.lockedFocusId = node.id;
  if (options.recenter !== false && (animate || options.recenter === true)) {
    centerLockedFocusView(state, d3, layout.center, focusScale, animate ? duration : 0);
  }

  state.focusLayer
    .selectAll('path.graph-focus-link')
    .data(layout.links, (link) => link.id)
    .join(
      (enter) => enter
        .append('path')
        .attr('class', 'graph-focus-link')
        .attr('stroke', (link) => link.color)
        .attr('stroke-opacity', 0)
        .attr('stroke-width', 0.9),
      (update) => update,
      (exit) => exit
        .transition()
        .duration(120)
        .style('opacity', 0)
        .remove()
    );

  state.focusLayer
    .selectAll('circle.graph-focus-node')
    .data(layout.items, (item) => item.id)
    .join(
      (enter) => enter
        .append('circle')
        .attr('class', (item) => `graph-focus-node ${item.isSource ? 'is-source' : ''}`)
        .attr('cx', (item) => item.fromX)
        .attr('cy', (item) => item.fromY)
        .attr('r', (item) => item.node.radius)
        .attr('fill', (item) => item.node.color)
        .attr('stroke', '#fff7e8')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0),
      (update) => update,
      (exit) => exit
        .transition()
        .duration(120)
        .attr('opacity', 0)
        .remove()
    )
    .attr('class', (item) => `graph-focus-node ${item.isSource ? 'is-source' : ''}`)
    .attr('role', 'link')
    .attr('tabindex', 0)
    .attr('aria-label', (item) => `${item.node.fullLabel || item.node.label}，${typeLabel(item.node.type)}`)
    .on('click', (event, item) => activateFocusNode(state, event, item))
    .on('keydown', (event, item) => handleFocusNodeKey(state, event, item));

  state.focusLayer
    .selectAll('text.graph-focus-label')
    .data(layout.items.filter((item) => item.displayLabel), (item) => item.id)
    .join(
      (enter) => enter
        .append('text')
        .attr('class', (item) => `graph-focus-label ${item.isSource ? 'is-source' : ''}`)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', (item) => item.fontSize)
        .attr('x', (item) => item.fromX)
        .attr('y', (item) => item.fromY + item.node.radius + 12)
        .attr('opacity', 0)
        .text((item) => item.displayLabel),
      (update) => update
        .attr('font-size', (item) => item.fontSize)
        .text((item) => item.displayLabel),
      (exit) => exit
        .transition()
        .duration(120)
        .attr('opacity', 0)
        .remove()
    )
    .attr('class', (item) => `graph-focus-label ${item.isSource ? 'is-source' : ''}`)
    .attr('role', 'link')
    .attr('tabindex', 0)
    .attr('aria-label', (item) => `${item.node.fullLabel || item.node.label}，${typeLabel(item.node.type)}`)
    .on('click', (event, item) => activateFocusNode(state, event, item))
    .on('keydown', (event, item) => handleFocusNodeKey(state, event, item));

  if (state.focusAnimationFrame) cancelAnimationFrame(state.focusAnimationFrame);
  state.focusAnimationFrame = null;
  if (!animate) {
    renderFocusFrame(state, layout, focusScale, 1);
    return;
  }

  const startTime = performance.now();
  const step = (timestamp) => {
    if (state.disposed || state.lockedNode?.id !== node.id) return;
    const progress = Math.min(1, (timestamp - startTime) / duration);
    renderFocusFrame(state, layout, focusScale, progress);
    if (progress < 1) {
      state.focusAnimationFrame = requestAnimationFrame(step);
      return;
    }
    state.focusAnimationFrame = null;
  };
  renderFocusFrame(state, layout, focusScale, 0);
  state.focusAnimationFrame = requestAnimationFrame(step);
}

function activeDragFocusNode(state) {
  if (state.draggingNode) return state.draggingNode;
  if (state.lastDraggedNode && state.dragFocusUntil && Date.now() < state.dragFocusUntil) return state.lastDraggedNode;
  return null;
}

function clearHover(state) {
  state.hoveredNode = null;
  state.lastHoverEvent = null;
  hideTooltip(state);
  const dragFocus = activeDragFocusNode(state);
  if (dragFocus) {
    applyNodeFocus(state, dragFocus);
    return;
  }
  if (state.lockedNode) {
    hideTooltip(state);
    return;
  }
  resetGraphFocus(state);
}

function updateHover(state, node, event) {
  const dragFocus = activeDragFocusNode(state);
  if (dragFocus) {
    state.hoveredNode = dragFocus;
    state.lastHoverEvent = event;
    applyNodeFocus(state, dragFocus, event);
    return;
  }
  if (state.lockedNode) {
    hideTooltip(state);
    return;
  }
  state.hoveredNode = node;
  state.lastHoverEvent = event;
  applyNodeFocus(state, node, event);
}

function lockNode(state, node, event = null, options = {}) {
  state.lockedNode = node;
  state.hoveredNode = null;
  state.lastHoverEvent = null;
  if (options.persistHistory !== false) replaceGraphHistoryState(node.id);
  renderLockedFocus(state, node, null, options.focusOptions || {});
}

function unlockNode(state) {
  state.lockedNode = null;
  state.hoveredNode = null;
  state.lastHoverEvent = null;
  state.draggingNode = null;
  replaceGraphHistoryState(null);
  hideTooltip(state);
  resetGraphFocus(state);
}

function restoreLockedGraphState(state) {
  const nodeId = restoredLockedNodeId();
  if (!nodeId) return false;
  const node = state.nodeById.get(nodeId);
  if (!node || !isNodeVisible(state, node)) return false;
  lockNode(state, node, null, {
    persistHistory: false,
    focusOptions: {
      animate: false,
      recenter: true
    }
  });
  return true;
}

function updateFilteredVisibility(state) {
  unlockNode(state);
  state.nodeSelection.style('display', (node) => isNodeVisible(state, node) ? null : 'none');
  state.labelSelection.style('display', (node) => isNodeVisible(state, node) ? null : 'none');
  state.linkSelection.style('display', (link) => isLinkVisible(state, link) ? null : 'none');
  for (const button of state.filterButtons) {
    button.classList.toggle('active', state.activeTypes.has(button.dataset.type));
  }
  updateStats(state);
}

function fitGraph(state, d3) {
  const visibleNodes = state.nodes.filter((node) => isNodeVisible(state, node));
  if (!visibleNodes.length) return;

  const bounds = visibleNodes.reduce((acc, node) => ({
    minX: Math.min(acc.minX, node.x - node.radius),
    minY: Math.min(acc.minY, node.y - node.radius),
    maxX: Math.max(acc.maxX, node.x + node.radius),
    maxY: Math.max(acc.maxY, node.y + node.radius)
  }), {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  });

  const graphWidth = Math.max(1, bounds.maxX - bounds.minX);
  const graphHeight = Math.max(1, bounds.maxY - bounds.minY);
  const padding = 174;
  const fitScale = Math.min((state.width - padding * 2) / graphWidth, (state.height - padding * 2) / graphHeight);
  const scale = Math.min(1.14, Math.max(0.88, fitScale));
  const x = state.width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale;
  const y = state.height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale;

  state.svg.call(state.zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale));
}

function runSimulationInBatches(state, d3, ticked, options = {}) {
  const {
    totalTicks = 120,
    ticksPerFrame = 12,
    onDone = () => {}
  } = options;
  let completedTicks = 0;

  const step = () => {
    if (state.disposed) return;
    const nextTicks = Math.min(ticksPerFrame, totalTicks - completedTicks);
    state.simulation.tick(nextTicks);
    completedTicks += nextTicks;
    ticked();

    if (completedTicks < totalTicks) {
      requestAnimationFrame(step);
      return;
    }

    onDone();
  };

  requestAnimationFrame(step);
}

function mountGraphWithD3(state, d3) {
  state.d3 = d3;
  state.svg = d3.select(state.container.querySelector('#graph-svg'));
  setGraphSize(state);

  state.viewport = state.svg.append('g').attr('class', 'graph-viewport');
  state.linkLayer = state.viewport.append('g').attr('class', 'graph-link-layer');
  state.nodeLayer = state.viewport.append('g').attr('class', 'graph-node-layer');
  state.labelLayer = state.viewport.append('g').attr('class', 'graph-label-layer');
  state.hoverLabels = state.viewport.append('g').attr('class', 'graph-hover-label-layer');
  state.focusLayer = state.viewport.append('g').attr('class', 'graph-focus-layer');

  state.nodes = state.graph.nodes.map((node, index) => ({
    ...node,
    index,
    radius: nodeRadius(node),
    isCoreLabel: (node.degree || 0) >= LABEL_DEGREE_THRESHOLD,
    color: TYPE_META[node.type]?.color || '#999'
  }));
  state.nodeById = new Map(state.nodes.map((node) => [node.id, node]));
  state.links = state.graph.links
    .map((link) => ({
      ...link,
      source: state.nodeById.get(link.source),
      target: state.nodeById.get(link.target)
    }))
    .filter((link) => link.source && link.target);
  state.adjacency = buildAdjacency(state.links);

  state.linkSelection = state.linkLayer
    .selectAll('line')
    .data(state.links)
    .join('line')
    .attr('stroke', 'rgba(111, 92, 69, 0.22)')
    .attr('stroke-width', 0.55)
    .attr('stroke-opacity', 0.2);

  state.nodeSelection = state.nodeLayer
    .selectAll('circle')
    .data(state.nodes)
    .join('circle')
    .attr('r', (node) => node.radius)
    .attr('fill', (node) => node.color)
    .attr('stroke', 'rgba(255,255,255,0.74)')
    .attr('stroke-width', 0.7)
    .attr('opacity', 0.9)
    .attr('role', 'link')
    .attr('tabindex', 0)
    .attr('aria-label', (node) => `${node.fullLabel || node.label}，${typeLabel(node.type)}`)
    .on('mouseenter', (event, node) => updateHover(state, node, event))
    .on('mousemove', (event, node) => updateHover(state, node, event))
    .on('mouseleave', () => clearHover(state))
    .on('click', (event, node) => {
      event.stopPropagation();
      if (event.defaultPrevented || node.wasDragged) {
        node.wasDragged = false;
        return;
      }
      if (state.lockedNode?.id !== node.id) {
        lockNode(state, node, event);
        return;
      }
      window.location.hash = state.toHash(node.route);
    })
    .on('keydown', (event, node) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (state.lockedNode?.id !== node.id) {
        lockNode(state, node, event);
        return;
      }
      window.location.hash = state.toHash(node.route);
    });

  state.labelSelection = state.labelLayer
    .selectAll('text')
    .data(state.nodes.filter((node) => node.isCoreLabel))
    .join('text')
    .attr('class', 'graph-node-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', 8.4)
    .attr('opacity', 0.72)
    .text((node) => node.label);

  state.zoom = d3.zoom()
    .scaleExtent([0.22, 5])
    .on('zoom', (event) => {
      state.currentTransform = event.transform;
      state.viewport.attr('transform', event.transform);
    });
  state.svg.call(state.zoom);
  state.svg.on('click.unlock', (event) => {
    if (event.defaultPrevented) return;
    if (event.target?.closest?.('circle')) return;
    if (state.lockedNode) unlockNode(state);
  });

  const ticked = () => {
    state.linkSelection
      .attr('x1', (link) => link.source.x)
      .attr('y1', (link) => link.source.y)
      .attr('x2', (link) => link.target.x)
      .attr('y2', (link) => link.target.y);
    state.nodeSelection
      .attr('cx', (node) => node.x)
      .attr('cy', (node) => node.y);
    state.labelSelection
      .attr('x', (node) => node.x)
      .attr('y', (node) => node.y + node.radius + 10);
    const dragFocus = activeDragFocusNode(state);
    if (dragFocus) applyNodeFocus(state, dragFocus);
    else if (state.lockedNode && state.lockedFocusId !== state.lockedNode.id) {
      renderLockedFocus(state, state.lockedNode, null, { animate: false, recenter: false });
    }
    else if (state.hoveredNode && state.lastHoverEvent) updateHover(state, state.hoveredNode, state.lastHoverEvent);
  };

  state.simulation = d3.forceSimulation(state.nodes)
    .force('link', d3.forceLink(state.links)
      .id((node) => node.id)
      .distance((link) => ['episode', 'live'].includes(link.source.type) || ['episode', 'live'].includes(link.target.type) ? COMPACT_EPISODE_LINK_DISTANCE : COMPACT_LINK_DISTANCE)
      .strength(0.18))
    .force('charge', d3.forceManyBody().strength(-38).distanceMax(210))
    .force('center', d3.forceCenter(state.width * 0.52, state.height * 0.52))
    .force('collide', d3.forceCollide().radius((node) => node.radius + 1.25).strength(0.64))
    .force('x', d3.forceX(state.width * 0.52).strength((node) => CORE_TYPES.has(node.type) ? COMPACT_CORE_PULL : COMPACT_OUTER_PULL))
    .force('y', d3.forceY(state.height * 0.52).strength((node) => CORE_TYPES.has(node.type) ? COMPACT_CORE_PULL : COMPACT_OUTER_PULL))
    .force('radial', d3.forceRadial(
      (node) => CORE_TYPES.has(node.type) ? 0 : Math.min(state.width, state.height) * COMPACT_RADIAL_RADIUS,
      state.width * 0.52,
      state.height * 0.52
    ).strength((node) => CORE_TYPES.has(node.type) ? 0 : 0.12))
    .stop();

  ticked();
  runSimulationInBatches(state, d3, ticked, {
    totalTicks: 120,
    ticksPerFrame: 10,
    onDone: () => {
      state.didInitialFit = true;
      fitGraph(state, d3);
      restoreLockedGraphState(state);
    }
  });

  state.nodeSelection.call(
    d3.drag()
      .on('start', (event, node) => {
        state.lockedNode = null;
        replaceGraphHistoryState(null);
        clearLockedFocus(state);
        state.draggingNode = node;
        state.lastDraggedNode = node;
        state.dragFocusUntil = Date.now() + DRAG_FOCUS_GRACE_MS;
        state.hoveredNode = node;
        node.wasDragged = false;
        node.fx = node.x;
        node.fy = node.y;
        applyNodeFocus(state, node, event.sourceEvent || event);
      })
      .on('drag', (event, node) => {
        state.draggingNode = node;
        state.lastDraggedNode = node;
        state.dragFocusUntil = Date.now() + DRAG_FOCUS_GRACE_MS;
        state.hoveredNode = node;
        node.wasDragged = true;
        node.fx = event.x;
        node.fy = event.y;
        state.simulation.alpha(0.08);
        for (let index = 0; index < 2; index += 1) state.simulation.tick();
        ticked();
      })
      .on('end', (event, node) => {
        state.draggingNode = null;
        state.lastDraggedNode = node;
        state.dragFocusUntil = Date.now() + DRAG_FOCUS_GRACE_MS;
        state.hoveredNode = node;
        node.fx = null;
        node.fy = null;
        applyNodeFocus(state, node);
        window.setTimeout(() => {
          node.wasDragged = false;
          if (state.lastDraggedNode?.id !== node.id || state.lockedNode || state.hoveredNode?.id === node.id) return;
          if (Date.now() < state.dragFocusUntil) return;
          resetGraphFocus(state);
        }, DRAG_FOCUS_GRACE_MS + 20);
      })
  );

  state.container.querySelector('#graph-zoom-in').addEventListener('click', () => {
    state.svg.transition().duration(160).call(state.zoom.scaleBy, 1.22);
  });
  state.container.querySelector('#graph-zoom-out').addEventListener('click', () => {
    state.svg.transition().duration(160).call(state.zoom.scaleBy, 0.82);
  });
  state.container.querySelector('#graph-reset-view').addEventListener('click', () => {
    fitGraph(state, d3);
  });

  for (const button of state.filterButtons) {
    button.addEventListener('click', () => {
      const { type } = button.dataset;
      if (!type) return;
      if (state.activeTypes.has(type)) state.activeTypes.delete(type);
      else state.activeTypes.add(type);
      if (!state.activeTypes.size) state.activeTypes.add(type);
      updateFilteredVisibility(state);
    });
  }

  state.resizeHandler = () => {
    if (!currentState) return;
    setGraphSize(state);
    state.simulation
      .force('center', d3.forceCenter(state.width * 0.52, state.height * 0.52))
      .force('x', d3.forceX(state.width * 0.52).strength((node) => CORE_TYPES.has(node.type) ? COMPACT_CORE_PULL : COMPACT_OUTER_PULL))
      .force('y', d3.forceY(state.height * 0.52).strength((node) => CORE_TYPES.has(node.type) ? COMPACT_CORE_PULL : COMPACT_OUTER_PULL))
      .force('radial', d3.forceRadial(
        (node) => CORE_TYPES.has(node.type) ? 0 : Math.min(state.width, state.height) * COMPACT_RADIAL_RADIUS,
        state.width * 0.52,
        state.height * 0.52
      ).strength((node) => CORE_TYPES.has(node.type) ? 0 : 0.12))
      .alpha(0.2);
    state.simulation.tick(45);
    ticked();
    fitGraph(state, d3);
  };
  window.addEventListener('resize', state.resizeHandler);
  updateStats(state);
}

function mountGraphShell(state) {
  const legendMarkup = TYPE_ORDER
    .map((type) => `
      <button class="graph-legend-item active" data-type="${type}" type="button">
        <span class="graph-legend-dot" style="background:${TYPE_META[type].color}"></span>
        <span>${TYPE_META[type].label}</span>
      </button>
    `)
    .join('');

  state.container.innerHTML = `
    <section class="graph-page">
      <div class="graph-wrap" id="graph-canvas-wrap">
        <svg class="graph-svg" id="graph-svg" aria-label="颖响力知识图谱"></svg>
        <div class="graph-title">
          <a class="graph-home-link" href="#/">← 返回首页</a>
          <h1>颖响力知识图谱</h1>
          <p id="graph-stats">${state.graph.meta.nodeCount} 个节点 · ${state.graph.meta.linkCount} 条链接</p>
        </div>
        <div class="graph-toolbar" aria-label="图谱缩放控制">
          <button class="graph-tool-button" id="graph-zoom-in" type="button" aria-label="放大">+</button>
          <button class="graph-tool-button" id="graph-zoom-out" type="button" aria-label="缩小">−</button>
          <button class="graph-tool-button" id="graph-reset-view" type="button">重置</button>
        </div>
        <div class="graph-legend" aria-label="节点类型筛选">
          ${legendMarkup}
        </div>
        <div class="graph-tooltip" id="graph-tooltip" hidden></div>
      </div>
    </section>
  `;

  state.canvasWrap = state.container.querySelector('#graph-canvas-wrap');
  state.tooltip = state.container.querySelector('#graph-tooltip');
  state.statsEl = state.container.querySelector('#graph-stats');
  state.filterButtons = [...state.container.querySelectorAll('.graph-legend-item')];
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
    activeTypes: new Set(Object.keys(TYPE_META)),
    disposed: false,
    didInitialFit: false,
    hoveredNode: null,
    lockedNode: null,
    lastHoverEvent: null,
    draggingNode: null,
    lastDraggedNode: null,
    dragFocusUntil: 0,
    currentTransform: null,
    d3: null,
    focusLayer: null,
    lockedFocusId: null,
    resizeHandler: null,
    simulation: null
  };
}

function renderGraphView({ container, graph, toHash }) {
  destroyGraphView();
  const state = createState({ container, graph, toHash });
  currentState = state;
  mountGraphShell(state);

  loadD3()
    .then((d3) => {
      if (state.disposed) return;
      mountGraphWithD3(state, d3);
    })
    .catch((error) => {
      if (state.disposed) return;
      state.container.querySelector('#graph-svg').insertAdjacentHTML(
        'afterend',
        `<p class="graph-load-error">${escapeHtml(error.message || '图谱加载失败')}</p>`
      );
    });
}

export {
  destroyGraphView,
  renderGraphView
};
