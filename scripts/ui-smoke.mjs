import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const artifactDir = path.join(projectRoot, '.local', 'ui-smoke');
const chromeUserDataDir = path.join(projectRoot, '.local', 'ui-smoke-chrome');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const serverPort = 4312;
const debugPort = 9223;
const baseUrl = `http://127.0.0.1:${serverPort}`;

let serverProcess = null;
let chromeProcess = null;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForHttp(url, { timeoutMs = 15000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {}
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function spawnProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
  let stderr = '';
  child.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });
  child.stdout?.on('data', () => {});
  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.stderr.write(`${command} exited with code ${code}\n${stderr}\n`);
    }
  });
  return child;
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out connecting to ${this.wsUrl}`)), 10000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.ws.addEventListener('error', (event) => {
        clearTimeout(timer);
        reject(event.error || new Error(`Failed to connect to ${this.wsUrl}`));
      }, { once: true });
    });

    this.ws.addEventListener('message', (event) => {
      const payload = JSON.parse(String(event.data));
      if (typeof payload.id === 'number') {
        const pending = this.pending.get(payload.id);
        if (!pending) return;
        this.pending.delete(payload.id);
        if (payload.error) {
          pending.reject(new Error(payload.error.message || `CDP error in ${pending.method}`));
          return;
        }
        pending.resolve(payload.result || {});
        return;
      }

      const waiters = this.eventWaiters.get(payload.method);
      if (!waiters?.length) return;
      const waiter = waiters.shift();
      waiter.resolve(payload.params || {});
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const message = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(message);
    });
  }

  waitForEvent(method, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for CDP event ${method}`)), timeoutMs);
      const wrappedResolve = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
      const queue = this.eventWaiters.get(method) || [];
      queue.push({ resolve: wrappedResolve, reject });
      this.eventWaiters.set(method, queue);
    });
  }

  async close() {
    if (!this.ws) return;
    this.ws.close();
    await sleep(100);
  }
}

async function openPageTarget(url) {
  const targetUrl = `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`;
  let response;
  try {
    response = await fetch(targetUrl, { method: 'PUT' });
  } catch {
    response = await fetch(targetUrl);
  }
  assert(response.ok, `Failed to create Chrome target for ${url}`);
  return response.json();
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  return result.result?.value;
}

async function waitForCondition(client, conditionExpression, { timeoutMs = 10000, label = conditionExpression } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const passed = await evaluate(client, `(() => Boolean(${conditionExpression}))()`);
    if (passed) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for condition: ${label}`);
}

async function setViewport(client, { width, height, mobile }) {
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile,
    scale: 1,
    screenWidth: width,
    screenHeight: height
  });
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: mobile,
    ...(mobile ? { maxTouchPoints: 1 } : {})
  });
}

async function navigate(client, url, readySelector) {
  await client.send('Page.navigate', { url });
  await waitForCondition(
    client,
    `document.readyState === 'complete' && !document.querySelector('.loading') && Boolean(document.querySelector(${JSON.stringify(readySelector)}))`,
    { timeoutMs: 15000, label: `page ready for ${url}` }
  );
}

async function clickSelector(client, selector) {
  const clicked = await evaluate(client, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    element.click();
    return true;
  })()`);
  assert(clicked, `Missing clickable selector: ${selector}`);
}

async function clickSelectorWithMouse(client, selector) {
  const rect = await evaluate(client, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
      hitText: hit?.textContent?.trim() || '',
      hitClass: String(hit?.className || '')
    };
  })()`);
  assert(rect && rect.width > 0 && rect.height > 0, `Missing clickable selector: ${selector}`);
  assert(rect.y >= 0, `Selector is above the viewport and cannot receive a real mouse click: ${selector}`);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y, button: 'none' });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
}

async function captureScreenshot(client, filename) {
  const { data } = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(path.join(artifactDir, filename), Buffer.from(data, 'base64'));
}

async function getText(client, selector) {
  return evaluate(client, `(() => document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() || '')()`);
}

async function runKnowledgeDetailChecks(client) {
  await navigate(client, `${baseUrl}/#/concepts/credential-rent`, '.detail-header');
  await waitForCondition(
    client,
    `location.hash === '#/concepts/credential-rent' && document.querySelector('.detail-header .detail-title')?.textContent?.trim() === '身份租值'`,
    { timeoutMs: 4000, label: 'concept detail route settled' }
  );
  assert(
    await evaluate(client, `(() => {
      const titles = [...document.querySelectorAll('.accordion-summary')].map((node) => node.textContent?.trim() || '');
      return ['定义', '常见场景', '识别信号', '使用边界', '进一步追问'].every((title) => titles.includes(title));
    })()`),
    'Concept detail should render the SOP accordion analysis stack'
  );
  assert(
    await evaluate(client, `(() => {
      const chips = [...document.querySelectorAll('.detail-header-meta .chip')].map((node) => node.textContent?.trim() || '');
      return chips.includes('平台守门结构') && !chips.includes('beauty-pageant-rent-seeking');
    })()`),
    'Concept overview meta should keep valid reference chips and hide invalid ones'
  );
  assert(
    await evaluate(client, `(() => {
      const label = document.querySelector('.detail-episode-list .episode-relation-note-label');
      const button = document.querySelector('#knowledge-related-toggle, .detail-episode-list .detail-section-action.is-disabled');
      const meta = document.querySelector('.detail-episode-list .detail-section-meta')?.textContent || '';
      return Boolean(label && label.textContent?.includes('关联切口') && button && (meta.includes('共 3 期') || meta.includes('当前显示')));
    })()`),
    'Concept evidence layer should keep the relation note outside cards and always render an episodes action'
  );
  assert(
    await evaluate(client, `(() => {
      return !document.querySelector('.inline-episode-ref');
    })()`),
    'Concept detail sample should not rely on inline episode popup content'
  );

  await navigate(client, `${baseUrl}/#/models/platform-gatekeeping`, '.detail-header');
  await waitForCondition(
    client,
    `location.hash === '#/models/platform-gatekeeping' && document.querySelector('.detail-header .detail-title')?.textContent?.trim() === '平台守门结构'`,
    { timeoutMs: 4000, label: 'model detail route settled' }
  );
  assert(
    await evaluate(client, `(() => {
      const titles = [...document.querySelectorAll('.accordion-summary')].map((node) => node.textContent?.trim() || '');
      return ['机制定义', '在颖响力里的用法', '观察信号', '适用边界', '进一步追问'].every((title) => titles.includes(title));
    })()`),
    'Model detail should use the same accordion-based analysis structure as concept pages'
  );
  assert(
    await evaluate(client, `Boolean(document.querySelector('.detail-episode-list .detail-section-action'))`),
    'Model detail should expose the same always-visible related-episodes action'
  );

  await navigate(client, `${baseUrl}/#/models/chokepoint-order-model`, '.detail-header');
  await waitForCondition(
    client,
    `location.hash === '#/models/chokepoint-order-model' && Boolean(document.querySelector('.detail-episode-list .detail-section-meta'))`,
    { timeoutMs: 4000, label: 'chokepoint model route settled' }
  );

  await navigate(client, `${baseUrl}/#/themes/platform-labor-and-lived-reality`, '.detail-header');
  await waitForCondition(
    client,
    `location.hash === '#/themes/platform-labor-and-lived-reality' && document.querySelector('.detail-header .detail-title')?.textContent?.trim() === '平台劳动与真实生存'`,
    { timeoutMs: 4000, label: 'theme detail route settled' }
  );
  assert(
    await evaluate(client, `(() => {
      const titles = [...document.querySelectorAll('.accordion-summary')].map((node) => node.textContent?.trim() || '');
      const heading = document.querySelector('.knowledge-analysis h2')?.textContent?.trim() || '';
      const bodyText = document.querySelector('.knowledge-analysis')?.textContent || '';
      return titles.length === 0 && heading === '主题说明' && !bodyText.includes('这类主题页的作用');
    })()`),
    'Theme detail should render a plain theme-intro section when only the theme description exists'
  );
  assert(
    await evaluate(client, `Boolean(document.querySelector('.detail-episode-list .detail-section-action.is-disabled'))`),
    'Theme detail should render the disabled "无需展开" action when there are only a few episodes'
  );
}

async function runDesktopChecks(client) {
  await setViewport(client, { width: 1212, height: 1400, mobile: false });
  await navigate(client, `${baseUrl}/#/`, '#home-episodes .home-episode-card');

  assert(
    await evaluate(client, `document.querySelector('#home-episodes .section-header') === null`),
    'Desktop home should not render the old episode index header'
  );
  assert(
    await evaluate(client, `Boolean(document.querySelector('#home-episodes .home-episodes-footer-desktop .home-episodes-more-link'))`),
    'Desktop home should render the footer "查看更多" link'
  );
  assert(
    await evaluate(client, `(() => {
      const cards = document.querySelectorAll('#home-episodes .home-episode-card');
      return cards.length >= 2 && cards.length <= 3;
    })()`),
    'Desktop home should render a multi-card layout instead of the mobile single-card layout'
  );
  assert(
    await evaluate(client, `document.querySelectorAll('#home-episodes .home-episode-card .chip').length >= 8`),
    'Desktop home should show the full EP124 keyword set'
  );
  assert(
    await evaluate(client, `!document.querySelector('#home-episodes .home-episode-card .card-kicker')?.textContent.includes('会员')`),
    'Desktop home kicker should keep curated/new status instead of member text'
  );

  const before = await getText(client, '#home-episodes .home-episode-card .card-kicker');
  await clickSelector(client, '#home-episodes-next');
  await waitForCondition(
    client,
    `Boolean(document.querySelector('#home-episodes .home-episode-desktop-transition-pane'))`,
    { timeoutMs: 2000, label: 'desktop carousel transition mounted' }
  );
  assert(
    await evaluate(client, `(() => {
      const pane = document.querySelector('#home-episodes .home-episode-desktop-transition-pane');
      if (!pane) return false;
      const cards = [...pane.querySelectorAll('.home-episode-card')];
      if (cards.length < 2) return false;
      const lefts = [...new Set(cards.map((card) => Math.round(card.getBoundingClientRect().left)))];
      return lefts.length >= 2;
    })()`),
    'Desktop carousel transition should preserve the multi-card desktop grid instead of stacking cards into a single column'
  );
  await waitForCondition(
    client,
    `document.querySelector('#home-episodes .home-episode-card .card-kicker')?.textContent.trim() !== ${JSON.stringify(before)}`,
    { timeoutMs: 4000, label: 'desktop carousel next movement' }
  );

  await navigate(client, `${baseUrl}/#/`, '#home-episodes .home-episode-card');
  await captureScreenshot(client, 'desktop-home.png');
  await runKnowledgeDetailChecks(client);

  await navigate(client, `${baseUrl}/#/episodes/EP124`, '.detail-header');
  await waitForCondition(
    client,
    `location.hash === '#/episodes/EP124' && Boolean(document.querySelector('.media-chip.member-only .media-chip-badge'))`,
    { timeoutMs: 4000, label: 'ep124 detail route settled' }
  );
  assert(
    await evaluate(client, `Boolean(document.querySelector('.media-chip.member-only .media-chip-badge'))`),
    'EP124 detail page should show the bilibili member badge'
  );

  await captureScreenshot(client, 'desktop-ep124-detail.png');
}

async function runMobileChecks(client) {
  await setViewport(client, { width: 418, height: 625, mobile: true });
  await navigate(client, `${baseUrl}/#/`, '#home-episodes .home-episode-card');
  await evaluate(client, `window.scrollTo(0, 0); window.dispatchEvent(new Event('resize')); true;`);

  assert(
    await evaluate(client, `Boolean(document.querySelector('#home-episodes .home-episodes-footer-mobile .home-episodes-more-link'))`),
    'Mobile home should render the footer "查看更多" link'
  );
  await waitForCondition(
    client,
    `(() => {
      const dock = document.querySelector('.floating-actions');
      const backToTop = document.querySelector('#back-to-top');
      return Boolean(dock && backToTop && backToTop.getBoundingClientRect().height >= 36);
    })()`,
    { timeoutMs: 4000, label: 'mobile floating actions rendered' }
  );
  await waitForCondition(
    client,
    `(() => {
      const dock = document.querySelector('.floating-actions');
      if (!dock) return false;
      const rect = dock.getBoundingClientRect();
      return rect.top >= window.innerHeight * 0.52 && rect.bottom <= window.innerHeight * 0.82;
    })()`,
    { timeoutMs: 2000, label: 'mobile floating actions dock settles lower on small screens' }
  );
  assert(
    await evaluate(client, `(() => {
      const icon = document.querySelector('#back-to-top .floating-action-icon');
      if (!icon) return false;
      const iconStyle = window.getComputedStyle(icon);
      return iconStyle.display !== 'none'
        && icon.getBoundingClientRect().width >= 16
        && icon.getBoundingClientRect().height >= 16
        && Number.parseFloat(iconStyle.strokeWidth) >= 2.8;
    })()`),
    'Mobile collapsed back-to-top should keep a visible SVG arrow instead of collapsing into a dot'
  );

  await clickSelector(client, '#back-to-top');
  await waitForCondition(
    client,
    `(() => {
      const dock = document.querySelector('.floating-actions');
      const menuButton = document.querySelector('.floating-actions-menu .menu-button');
      const homeButton = document.querySelector('.floating-actions-menu .floating-home');
      return dock && !dock.classList.contains('is-collapsed')
        && menuButton && homeButton
        && menuButton.getBoundingClientRect().height >= 36
        && homeButton.getBoundingClientRect().height >= 36;
    })()`,
    { timeoutMs: 4000, label: 'back-to-top expands floating actions at top' }
  );
  await waitForCondition(
    client,
    `(() => {
      const wheel = document.querySelector('.section-progress');
      const menuButton = document.querySelector('.floating-actions-menu .menu-button');
      if (!wheel || !menuButton) return false;
      const wheelRect = wheel.getBoundingClientRect();
      const menuRect = menuButton.getBoundingClientRect();
      return menuRect.top - wheelRect.bottom >= 18;
    })()`,
    { timeoutMs: 2000, label: 'mobile floating buttons clear the section wheel' }
  );

  await captureScreenshot(client, 'mobile-home.png');
  await runMobileEpisodeIndexChecks(client);
  await navigate(client, `${baseUrl}/#/concepts/credential-rent`, '.detail-header');
  await waitForCondition(
    client,
    `location.hash === '#/concepts/credential-rent' && document.querySelector('.detail-header .detail-title')?.textContent?.trim() === '身份租值'`,
    { timeoutMs: 4000, label: 'mobile concept detail route settled' }
  );
  assert(
    await evaluate(client, `(() => {
      const title = document.querySelector('.detail-header .detail-title');
      const accordions = document.querySelectorAll('.detail-section .accordion-item');
      const toggle = document.querySelector('#concept-related-toggle, .detail-episode-list .detail-section-action.is-disabled');
      return Boolean(title && title.textContent?.trim() === '身份租值' && accordions.length >= 5 && toggle);
    })()`),
    'Mobile concept detail should load the SOP template without dropping the accordion or evidence controls'
  );
}

async function runMobileEpisodeIndexChecks(client) {
  await navigate(client, `${baseUrl}/#/`, '#home-episodes .home-episodes-more-link');
  await clickSelector(client, '#home-episodes .home-episodes-more-link');
  await waitForCondition(
    client,
    `(() => {
      const options = [...document.querySelectorAll('.episode-range-wheel-option')];
      const active = options.find((option) => option.classList.contains('active'));
      const expected = options[0]?.textContent?.trim();
      const searchToggle = document.querySelector('#episode-index-search-toggle');
      return location.hash === '#/episodes'
        && Boolean(expected)
        && active?.textContent?.trim() === expected
        && Boolean(searchToggle)
        && !document.querySelector('#episode-index-search');
    })()`,
    { timeoutMs: 4000, label: 'home more link opens a fresh episode index state' }
  );
  assert(
    await evaluate(client, `(() => {
      const buttons = [...document.querySelectorAll('.episode-range-footer-nav .range-footer-button')];
      return buttons.length === 2 && buttons.every((button) => button.getBoundingClientRect().height >= 48);
    })()`),
    'Episode index footer range buttons should render larger tap targets'
  );
  await waitForCondition(
    client,
    `Boolean(document.querySelector('#episode-index-results .episode-index-card'))`,
    { timeoutMs: 4000, label: 'episode index cards visible after home more link' }
  );
  assert(
    await evaluate(client, `!document.querySelector('#episode-index-results .episode-index-open') && ![...document.querySelectorAll('#episode-index-results .episode-index-card-head')].some((node) => (node.textContent || '').includes('查看'))`),
    'Episode index cards should rely on whole-card navigation and should not show a separate 查看 label'
  );
  await sleep(800);
  await captureScreenshot(client, 'mobile-episodes-initial.png');
  assert(
    await evaluate(client, `(() => {
      const wheel = document.querySelector('.episode-range-wheel');
      return Boolean(wheel && wheel.scrollWidth > wheel.clientWidth);
    })()`),
    'Mobile episode index should expose a horizontally scrollable range wheel'
  );
  assert(
    await evaluate(client, `!document.querySelector('.episode-toolbar-meta') && !document.querySelector('#episode-search-note')`),
    'Mobile episode index toolbar should not render the old meta pills or range status line'
  );
  await clickSelector(client, '.episode-range-wheel [data-episode-range="91"]');
  await waitForCondition(
    client,
    `(() => {
      const active = document.querySelector('.episode-range-wheel-option.active');
      const firstCard = document.querySelector('#episode-index-results .episode-index-kicker');
      return active?.textContent?.trim() === '91-100集' && firstCard?.textContent?.trim() === 'EP100';
    })()`,
    { timeoutMs: 4000, label: 'mobile episode range wheel updates selected group' }
  );
  await evaluate(client, `(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
    return true;
  })()`);
  await sleep(180);
  await evaluate(client, `window.scrollTo(0, 1250); true;`);
  await waitForCondition(
    client,
    `(() => {
      const shell = document.querySelector('.episode-index-toolbar-shell');
      if (!shell) return false;
      const style = getComputedStyle(shell);
      return shell.classList.contains('is-hidden-by-scroll')
        && Number(style.opacity) < 0.5
        && style.pointerEvents === 'none';
    })()`,
    { timeoutMs: 3000, label: 'mobile episode range toolbar hides after large downward scroll' }
  );
  await evaluate(client, `(() => {
    for (const y of [1228, 1206, 1184, 1162, 1140, 1118, 1096, 1074, 1052, 1040]) {
      window.scrollTo(0, y);
      window.dispatchEvent(new Event('scroll'));
    }
    return true;
  })()`);
  await waitForCondition(
    client,
    `(() => {
      const shell = document.querySelector('.episode-index-toolbar-shell');
      const toolbar = document.querySelector('.episode-index-toolbar');
      if (!shell || !toolbar) return false;
      const rect = toolbar.getBoundingClientRect();
      const style = getComputedStyle(toolbar);
      const shellStyle = getComputedStyle(shell);
      return rect.top >= 0
        && rect.top <= 42
        && rect.bottom > 0
        && Number(style.opacity) > 0.5
        && Number(shellStyle.opacity) > 0.5
        && style.pointerEvents !== 'none'
        && shellStyle.pointerEvents !== 'none';
    })()`,
    { timeoutMs: 3000, label: 'mobile episode range toolbar reappears after large upward scroll' }
  );
  await sleep(10300);
  assert(
    await evaluate(client, `(() => {
      const shell = document.querySelector('.episode-index-toolbar-shell');
      if (!shell) return false;
      const style = getComputedStyle(shell);
      return shell.classList.contains('is-hidden-by-scroll')
        && Number(style.opacity) < 0.5
        && style.pointerEvents === 'none';
    })()`),
    'Mobile episode range toolbar should auto-hide after ten seconds of floating idle time'
  );
  await evaluate(client, `window.scrollTo(0, 900); true;`);
  await sleep(220);
  assert(
    await evaluate(client, `(() => {
      const shell = document.querySelector('.episode-index-toolbar-shell');
      const toolbar = document.querySelector('.episode-index-toolbar');
      if (!shell || !toolbar) return false;
      const rect = toolbar.getBoundingClientRect();
      const shellStyle = getComputedStyle(shell);
      return !shell.classList.contains('is-hidden-by-scroll')
        && rect.top >= 0
        && rect.top <= 42
        && Number(shellStyle.opacity) > 0.5
        && shellStyle.pointerEvents !== 'none';
    })()`),
    'Mobile episode range toolbar should reappear after a large upward scroll from idle-hidden state'
  );
  await clickSelectorWithMouse(client, '.episode-range-wheel [data-episode-range="81"]');
  await waitForCondition(
    client,
    `(() => {
      const active = document.querySelector('.episode-range-wheel-option.active');
      const firstCard = document.querySelector('#episode-index-results .episode-index-kicker');
      const firstCardRect = firstCard?.closest('.episode-index-card')?.getBoundingClientRect();
      const toolbarRect = document.querySelector('.episode-index-toolbar')?.getBoundingClientRect();
      return active?.textContent?.trim() === '81-90集'
        && firstCard?.textContent?.trim() === 'EP090'
        && firstCardRect
        && toolbarRect
        && firstCardRect.top >= toolbarRect.bottom
        && firstCardRect.top <= toolbarRect.bottom + 36;
    })()`,
    { timeoutMs: 4000, label: 'mobile sticky range click switches group and moves to the selected range top' }
  );
  await clickSelector(client, '.episode-range-wheel [data-episode-range="91"]');
  await waitForCondition(
    client,
    `(() => {
      const active = document.querySelector('.episode-range-wheel-option.active');
      const firstCard = document.querySelector('#episode-index-results .episode-index-kicker');
      return active?.textContent?.trim() === '91-100集' && firstCard?.textContent?.trim() === 'EP100';
    })()`,
    { timeoutMs: 4000, label: 'mobile episode range returns to 91-100 before progress panel checks' }
  );
  await evaluate(client, `window.scrollTo(0, 900); true;`);
  await waitForCondition(
    client,
    `Boolean(document.querySelector('.section-progress.is-visible'))`,
    { timeoutMs: 4000, label: 'mobile episode progress wheel visible' }
  );
  await clickSelector(client, '.section-progress');
  await waitForCondition(
    client,
    `document.body.classList.contains('section-progress-panel-open') && !document.querySelector('#section-progress-panel')?.hidden`,
    { timeoutMs: 4000, label: 'mobile episode progress panel open' }
  );
  assert(
    await evaluate(client, `(() => {
      const texts = [...document.querySelectorAll('#section-progress-panel .section-progress-panel-text')]
        .map((node) => node.textContent?.trim() || '');
      return texts.some((text) => text.includes('100集')) && !texts.some((text) => text.includes('120集'));
    })()`),
    'Mobile episode progress panel should refresh to the newly selected episode group'
  );
  assert(
    await evaluate(client, `(() => {
      const list = document.querySelector('#section-progress-panel .section-progress-panel-list');
      if (!list) return false;
      list.scrollTop = 260;
      return list.scrollTop >= 200;
    })()`),
    'Mobile episode progress panel should allow vertical scrolling through episode entries'
  );
  await clickSelector(client, '.section-progress-panel-item');
  await waitForCondition(
    client,
    `location.hash.startsWith('#/episodes/EP') && Boolean(document.querySelector('.detail-header'))`,
    { timeoutMs: 4000, label: 'episode progress panel item opens episode detail directly' }
  );
  await navigate(client, `${baseUrl}/#/episodes`, '#episode-index-search-toggle');
  await clickSelector(client, '#episode-index-search-toggle');
  await waitForCondition(
    client,
    `Boolean(document.querySelector('#episode-index-search'))`,
    { timeoutMs: 4000, label: 'episode index search expands from the magnifier toggle' }
  );
  await sleep(5300);
  assert(
    await evaluate(client, `Boolean(document.querySelector('#episode-index-search'))`),
    'Episode index search should stay open until the user dismisses it'
  );
  await evaluate(client, `(() => {
    const input = document.querySelector('#episode-index-search');
    if (!input) return false;
    input.focus();
    input.value = '比';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '比', inputType: 'insertText' }));
    return true;
  })()`);
  await waitForCondition(
    client,
    `(() => {
      const items = [...document.querySelectorAll('#episode-index-suggestions [data-episode-index-route]')];
      return items.some((item) => (item.textContent || '').includes('比亚迪'));
    })()`,
    { timeoutMs: 4000, label: 'episode index search suggestions visible for keyword prefix' }
  );
  assert(
    await evaluate(client, `(() => {
      const cards = [...document.querySelectorAll('#episode-index-results .episode-index-kicker')].map((node) => node.textContent?.trim());
      return cards.length >= 2 && cards.includes('EP080') && cards.includes('EP045');
    })()`),
    'Episode index should already show matching episodes while the user is typing a query'
  );
  await evaluate(client, `(() => {
    const match = [...document.querySelectorAll('#episode-index-suggestions [data-episode-index-route]')]
      .find((item) => (item.textContent || '').includes('比亚迪'));
    if (!match) return false;
    match.click();
    return true;
  })()`);
  await waitForCondition(
    client,
    `location.hash.startsWith('#/keywords/') && Boolean(document.querySelector('.detail-header .detail-title'))`,
    { timeoutMs: 4000, label: 'episode index knowledge suggestion click opens the corresponding detail page' }
  );
  await navigate(client, `${baseUrl}/#/episodes`, '#episode-index-results .episode-index-card');
  await captureScreenshot(client, 'mobile-episodes.png');
}

async function cleanup() {
  await sleep(150);
  chromeProcess?.kill('SIGTERM');
  serverProcess?.kill('SIGTERM');
}

async function main() {
  assert(existsSync(chromePath), `Google Chrome not found at ${chromePath}`);
  await mkdir(artifactDir, { recursive: true });
  await rm(chromeUserDataDir, { recursive: true, force: true });

  serverProcess = spawnProcess('python3', ['-m', 'http.server', String(serverPort), '-d', 'dist']);
  await waitForHttp(`${baseUrl}/index.html`);

  chromeProcess = spawnProcess(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${chromeUserDataDir}`,
    'about:blank'
  ]);
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);

  const pageTarget = await openPageTarget('about:blank');
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  const target = process.env.UI_SMOKE_TARGET || 'full';

  if (target === 'mobile-episodes') {
    await runMobileEpisodeIndexChecks(client);
  } else {
    await runDesktopChecks(client);
    await runMobileChecks(client);
  }

  await client.close();
  console.log('UI smoke tests passed.');
  console.log(`Artifacts: ${artifactDir}`);
}

try {
  await main();
} finally {
  await cleanup();
}
