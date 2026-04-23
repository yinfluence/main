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

async function captureScreenshot(client, filename) {
  const { data } = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(path.join(artifactDir, filename), Buffer.from(data, 'base64'));
}

async function getText(client, selector) {
  return evaluate(client, `(() => document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() || '')()`);
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

  await navigate(client, `${baseUrl}/#/episodes/EP124`, '.detail-header');
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
}

async function runMobileEpisodeIndexChecks(client) {
  await navigate(client, `${baseUrl}/#/`, '#home-episodes .home-episodes-more-link');
  await clickSelector(client, '#home-episodes .home-episodes-more-link');
  await waitForCondition(
    client,
    `(() => {
      const active = document.querySelector('.episode-range-wheel-option.active');
      const searchToggle = document.querySelector('#episode-index-search-toggle');
      return location.hash === '#/episodes'
        && active?.textContent?.trim() === '121-124集'
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
    await evaluate(client, `Boolean(document.querySelector('#episode-index-search-toggle')) && !document.querySelector('#episode-index-search')`),
    'Episode index search should auto-hide after 5 seconds when it is not in the floating position'
  );
  await clickSelector(client, '#episode-index-search-toggle');
  await waitForCondition(
    client,
    `Boolean(document.querySelector('#episode-index-search'))`,
    { timeoutMs: 4000, label: 'episode index search re-expands after auto hide' }
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
      const items = [...document.querySelectorAll('#episode-index-suggestions [data-episode-index-suggestion]')];
      return items.some((item) => (item.dataset.episodeIndexSuggestion || '') === '比亚迪');
    })()`,
    { timeoutMs: 4000, label: 'episode index search suggestions visible for keyword prefix' }
  );
  assert(
    await evaluate(client, `document.querySelector('.episode-index-section')?.classList.contains('hidden') === true`),
    'Episode index should hide the episode list while the user is still typing and choosing a suggestion'
  );
  await clickSelector(client, '#episode-index-suggestions [data-episode-index-suggestion="比亚迪"]');
  await waitForCondition(
    client,
    `(() => {
      const cards = [...document.querySelectorAll('#episode-index-results .episode-index-kicker')].map((node) => node.textContent?.trim());
      return cards.length === 2 && cards.includes('EP080') && cards.includes('EP045');
    })()`,
    { timeoutMs: 4000, label: 'episode index suggestion click filters to matching episodes' }
  );
  assert(
    await evaluate(client, `document.querySelector('.episode-index-section')?.classList.contains('hidden') === false`),
    'Episode index should show matching episodes after the user picks a suggestion'
  );
  assert(
    await evaluate(client, `(() => {
      const wheel = document.querySelector('.episode-range-wheel');
      if (!wheel || wheel.scrollWidth <= wheel.clientWidth) return false;
      wheel.scrollLeft = 0;
      wheel.scrollLeft = 180;
      return wheel.scrollLeft >= 120;
    })()`),
    'Mobile episode range wheel should remain horizontally scrollable after switching groups'
  );
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
