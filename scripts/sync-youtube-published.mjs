import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const episodesDir = path.resolve(__dirname, '../content/episodes');

async function fetchYoutubePublishedAt(videoId) {
  const html = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'user-agent': 'Mozilla/5.0', 'accept-language': 'en-US,en;q=0.9' }
  }).then((r) => r.text());

  const metaMatch = html.match(/<meta itemprop="datePublished" content="([^"]+)"/i)
    || html.match(/<meta itemprop="uploadDate" content="([^"]+)"/i);
  if (metaMatch) {
    const iso = new Date(metaMatch[1]);
    if (!Number.isNaN(iso.getTime())) return iso.toISOString();
  }

  const microMatch = html.match(/"publishDate":"(\d{4}-\d{2}-\d{2})"/)
    || html.match(/"uploadDate":"(\d{4}-\d{2}-\d{2})"/);
  if (microMatch) {
    return new Date(`${microMatch[1]}T12:00:00.000Z`).toISOString();
  }

  return '';
}

function extractYoutubeId(url) {
  return (String(url || '').match(/[?&]v=([\w-]+)/) || [])[1] || '';
}

async function main() {
  const files = (await fs.readdir(episodesDir)).filter((f) => /^EP\d{3}\.json$/i.test(f)).sort();
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const fullPath = path.join(episodesDir, file);
    const data = JSON.parse(await fs.readFile(fullPath, 'utf8'));
    const youtube = (data.videoLinks || []).find((link) => link?.platform === 'youtube' && link?.url);
    const videoId = extractYoutubeId(youtube?.url);
    if (!videoId) {
      skipped += 1;
      continue;
    }
    try {
      const published = await fetchYoutubePublishedAt(videoId);
      if (!published) {
        failed += 1;
        console.warn(`${data.id}: 未找到 publishDate`);
        continue;
      }
      if (published === data.publishedAt) {
        unchanged += 1;
        continue;
      }
      data.publishedAt = published;
      await fs.writeFile(fullPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
      updated += 1;
      console.log(`${data.id}: ${published}`);
    } catch (error) {
      failed += 1;
      console.warn(`${data.id}: ${error.message}`);
    }
  }

  console.log('YouTube publishedAt 同步完成');
  console.log({ updated, unchanged, skipped, failed });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
