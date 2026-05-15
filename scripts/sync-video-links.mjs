import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const episodesDir = path.join(rootDir, 'content/episodes');
const bilibiliInventoryPath = path.resolve(rootDir, '../bilibili/raw/subtitle_inventory.json');
const bilibiliSeasonPath = path.resolve(rootDir, '../bilibili/raw/season_episodes.json');
const overridesPath = path.join(__dirname, 'video-link-overrides.json');

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@%E9%A2%96%E5%93%8D%E5%8A%9B/videos';
const BILIBILI_MEMBER_TEXT_PATTERN = /会员|会员专属|搬后会员发|充电专属/;

function normalizeTitle(value) {
  return String(value || '')
    .replace(/【?EP\d{1,3}】?/gi, '')
    .replace(/怪力乱谈\d+/g, '')
    .replace(/[｜|].*$/g, '')
    .replace(/[#＃].*$/g, '')
    .replace(/[“”"'`]/g, '')
    .replace(/[。！，、,.!?？:：\-\s（）()《》【】\[\]·•]/g, '')
    .trim()
    .toLowerCase();
}

function extractPrimaryTitle(value) {
  return String(value || '')
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .split(/[！!？?。｜|]/)[0]
    .trim();
}

function extractEpisodeNumber(value) {
  const match = String(value || '').match(/\b(?:EP|PE)\s*0*(\d{1,3})\b/i);
  return match ? `EP${match[1].padStart(3, '0')}` : '';
}

function extractBvid(value) {
  const match = String(value || '').match(/BV[a-zA-Z0-9]{10}/);
  return match ? match[0] : '';
}

function extractInitialData(html) {
  const marker = 'var ytInitialData = ';
  const startIndex = html.indexOf(marker);
  if (startIndex < 0) {
    throw new Error('找不到 YouTube ytInitialData');
  }

  let i = startIndex + marker.length;
  let depth = 0;
  let inString = false;
  let escaped = false;
  const start = i;

  for (; i < html.length; i += 1) {
    const char = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(html.slice(start, i + 1));
      }
    }
  }

  throw new Error('无法解析 YouTube ytInitialData');
}

function extractYoutubeConfig(html) {
  const key = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || [])[1];
  const version = (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) || [])[1];
  const visitor = (html.match(/"VISITOR_DATA":"([^"]+)"/) || [])[1];
  if (!key || !version || !visitor) {
    throw new Error('缺少 YouTube Innertube 配置');
  }
  return { key, version, visitor };
}

function extractVideosFromInitialData(data) {
  const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.richGridRenderer?.contents || [];
  const videos = [];
  let continuation = '';

  for (const item of contents) {
    const renderer = item?.richItemRenderer?.content?.videoRenderer;
    if (renderer?.videoId && renderer?.title?.runs?.[0]?.text) {
      videos.push({
        id: renderer.videoId,
        title: renderer.title.runs[0].text,
        description: (renderer.descriptionSnippet?.runs || []).map((run) => run.text || '').join(''),
        url: `https://www.youtube.com/watch?v=${renderer.videoId}`
      });
    }

    const token = item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (token) continuation = token;
  }

  return { videos, continuation };
}

function extractVideosFromContinuation(data) {
  const items = data?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];
  const videos = [];
  let continuation = '';

  for (const item of items) {
    const renderer = item?.richItemRenderer?.content?.videoRenderer;
    if (renderer?.videoId && renderer?.title?.runs?.[0]?.text) {
      videos.push({
        id: renderer.videoId,
        title: renderer.title.runs[0].text,
        description: (renderer.descriptionSnippet?.runs || []).map((run) => run.text || '').join(''),
        url: `https://www.youtube.com/watch?v=${renderer.videoId}`
      });
    }

    const token = item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (token) continuation = token;
  }

  return { videos, continuation };
}

async function fetchYoutubeVideos() {
  const html = await fetch(YOUTUBE_CHANNEL_URL).then((response) => response.text());
  const config = extractYoutubeConfig(html);
  const initialData = extractInitialData(html);
  const firstPage = extractVideosFromInitialData(initialData);

  const seen = new Set(firstPage.videos.map((video) => video.id));
  const allVideos = [...firstPage.videos];
  let continuation = firstPage.continuation;
  let guard = 0;

  while (continuation && guard < 20) {
    const response = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${config.key}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-youtube-client-name': '1',
        'x-youtube-client-version': config.version,
        'x-goog-visitor-id': config.visitor
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: config.version,
            hl: 'en',
            gl: 'GB'
          }
        },
        continuation
      })
    });

    const data = await response.json();
    const nextPage = extractVideosFromContinuation(data);
    for (const video of nextPage.videos) {
      if (!seen.has(video.id)) {
        seen.add(video.id);
        allVideos.push(video);
      }
    }
    continuation = nextPage.continuation;
    guard += 1;
  }

  return allVideos;
}

function buildCandidateMap(items, episodeIds) {
  const byEpisodeId = new Map();
  const normalizedItems = items.map((item) => ({
    ...item,
    normalizedTitle: normalizeTitle(item.title),
    normalizedPrimaryTitle: normalizeTitle(extractPrimaryTitle(item.title)),
    episodeId: extractEpisodeNumber(item.title) || extractEpisodeNumber(item.description)
  }));

  for (const item of normalizedItems) {
    if (item.episodeId && episodeIds.has(item.episodeId)) {
      byEpisodeId.set(item.episodeId, item);
    }
  }

  return { byEpisodeId, normalizedItems };
}

function findMatch(episode, itemsByEpisodeId, normalizedItems) {
  if (itemsByEpisodeId.has(episode.id)) {
    return itemsByEpisodeId.get(episode.id);
  }

  const normalizedEpisodeTitle = normalizeTitle(episode.title);
  const normalizedEpisodePrimaryTitle = normalizeTitle(extractPrimaryTitle(episode.title));
  const candidates = normalizedItems.filter((item) => {
    if (!item.normalizedTitle || !normalizedEpisodeTitle) return false;
    return (
      item.normalizedTitle.includes(normalizedEpisodeTitle) ||
      normalizedEpisodeTitle.includes(item.normalizedTitle) ||
      (item.normalizedPrimaryTitle && normalizedEpisodePrimaryTitle && (
        item.normalizedPrimaryTitle === normalizedEpisodePrimaryTitle ||
        item.normalizedPrimaryTitle.startsWith(normalizedEpisodePrimaryTitle) ||
        normalizedEpisodePrimaryTitle.startsWith(item.normalizedPrimaryTitle)
      ))
    );
  });

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    candidates.sort((a, b) => a.normalizedTitle.length - b.normalizedTitle.length);
    return candidates[0];
  }

  return null;
}

function findSeasonEntryFromViewData(viewData, bvid) {
  const sections = viewData?.ugc_season?.sections || [];
  for (const section of sections) {
    for (const episode of section.episodes || []) {
      if (String(episode?.bvid || '').toLowerCase() === String(bvid || '').toLowerCase()) {
        return episode;
      }
    }
  }
  return null;
}

function inferBilibiliAccessFromViewData(viewData, bvid) {
  const seasonEntry = findSeasonEntryFromViewData(viewData, bvid);
  const textFields = [
    viewData?.title,
    viewData?.desc,
    ...(viewData?.pages || []).map((page) => page?.part),
    seasonEntry?.title,
    seasonEntry?.page?.part,
    seasonEntry?.arc?.title,
    ...(seasonEntry?.pages || []).map((page) => page?.part)
  ].filter(Boolean);

  if (
    viewData?.is_upower_exclusive === true ||
    viewData?.is_upower_exclusive_with_qa === true ||
    seasonEntry?.attribute === 8 ||
    textFields.some((field) => BILIBILI_MEMBER_TEXT_PATTERN.test(String(field)))
  ) {
    return 'member';
  }

  return 'public';
}

async function fetchBilibiliViewData(bvid, cache) {
  if (cache.has(bvid)) {
    return cache.get(bvid);
  }

  const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`, {
    headers: {
      'user-agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) {
    throw new Error(`B 站会员状态检查失败：${bvid} HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload?.code !== 0 || !payload?.data) {
    throw new Error(`B 站会员状态检查失败：${bvid} ${payload?.message || '无有效数据'}`);
  }

  cache.set(bvid, payload.data);
  return payload.data;
}

async function resolveManualBilibiliLink(link, cache) {
  if (!link?.url || link.status || link.platform !== 'bilibili' || link.access === 'member') {
    return link;
  }

  const bvid = extractBvid(link.url);
  if (!bvid) {
    throw new Error(`人工 B 站链接无法识别 BV 号，不能确认会员状态：${link.url}`);
  }

  const viewData = await fetchBilibiliViewData(bvid, cache);
  const access = inferBilibiliAccessFromViewData(viewData, bvid);
  return access === 'member' ? { ...link, access: 'member' } : link;
}

async function main() {
  const [inventoryRaw, seasonRaw, overridesRaw, episodeFiles] = await Promise.all([
    fs.readFile(bilibiliInventoryPath, 'utf8'),
    fs.readFile(bilibiliSeasonPath, 'utf8'),
    fs.readFile(overridesPath, 'utf8').catch(() => '{}'),
    fs.readdir(episodesDir)
  ]);

  const bilibiliInventory = JSON.parse(inventoryRaw);
  const season = JSON.parse(seasonRaw);
  const overrides = JSON.parse(overridesRaw || '{}');
  const seasonEntries = season.season.sections.flatMap((section) => section.episodes || []);
  const seasonByBvid = new Map(seasonEntries.map((entry) => [entry.bvid, entry]));

  const episodes = await Promise.all(
    episodeFiles
      .filter((file) => /^EP\d{3}\.json$/i.test(file))
      .map(async (file) => {
        const fullPath = path.join(episodesDir, file);
        const data = JSON.parse(await fs.readFile(fullPath, 'utf8'));
        return { file, fullPath, data };
      })
  );

  const episodeIds = new Set(episodes.map(({ data }) => data.id));
  const youtubeVideos = await fetchYoutubeVideos();

  const bilibiliItems = bilibiliInventory
    .filter((item) => seasonByBvid.has(item.bvid))
    .filter((item) => item.subtitle_status !== 'error')
    .map((item) => ({
      ...item,
      access: seasonByBvid.get(item.bvid)?.attribute === 8 ? 'member' : 'public'
    }));

  const { byEpisodeId: bilibiliByEpisodeId, normalizedItems: normalizedBilibili } = buildCandidateMap(bilibiliItems, episodeIds);
  const { byEpisodeId: youtubeByEpisodeId, normalizedItems: normalizedYoutube } = buildCandidateMap(youtubeVideos, episodeIds);

  const summary = {
    bilibiliAvailable: 0,
    bilibiliMember: 0,
    bilibiliUnavailable: 0,
    bilibiliManualAccessChecked: 0,
    youtubeAvailable: 0,
    youtubeUnavailable: 0
  };
  const bilibiliViewCache = new Map();
  let overridesChanged = false;

  for (const episode of episodes) {
    const bilibiliMatch = findMatch(episode.data, bilibiliByEpisodeId, normalizedBilibili);
    const youtubeMatch = findMatch(episode.data, youtubeByEpisodeId, normalizedYoutube);
    const override = overrides[episode.data.id] || {};
    let bilibiliLink;

    if (override.bilibili) {
      bilibiliLink = await resolveManualBilibiliLink(override.bilibili, bilibiliViewCache);
      if (override.bilibili.url && !override.bilibili.status && override.bilibili.access !== 'member') {
        summary.bilibiliManualAccessChecked += 1;
      }
      if (bilibiliLink.access !== override.bilibili.access) {
        overrides[episode.data.id] = {
          ...override,
          bilibili: bilibiliLink
        };
        overridesChanged = true;
      }
    } else {
      bilibiliLink = bilibiliMatch
        ? {
            platform: 'bilibili',
            url: bilibiliMatch.url,
            ...(bilibiliMatch.access === 'member' ? { access: 'member' } : {})
          }
        : {
            platform: 'bilibili',
            status: 'unavailable',
            note: '已下架'
          };
    }

    const youtubeLink = override.youtube
      ? override.youtube
      : youtubeMatch
        ? {
            platform: 'youtube',
            url: youtubeMatch.url
          }
        : {
            platform: 'youtube',
            status: 'unavailable',
            note: '未找到'
          };

    episode.data.videoLinks = [bilibiliLink, youtubeLink];

    if (!bilibiliLink.url) summary.bilibiliUnavailable += 1;
    else if (bilibiliLink.access === 'member') summary.bilibiliMember += 1;
    else summary.bilibiliAvailable += 1;

    if (youtubeLink.url) summary.youtubeAvailable += 1;
    else summary.youtubeUnavailable += 1;

    await fs.writeFile(episode.fullPath, `${JSON.stringify(episode.data, null, 2)}\n`, 'utf8');
  }

  if (overridesChanged) {
    await fs.writeFile(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`, 'utf8');
  }

  console.log('视频链接同步完成');
  console.log(summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
