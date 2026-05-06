import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const episodesDir = path.join(rootDir, 'content', 'episodes');

function parseArgs(argv) {
  const options = {
    episode: null,
    strict: false,
    limit: 200
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--episode') {
      options.episode = argv[index + 1] || null;
      index += 1;
    } else if (arg.startsWith('--episode=')) {
      options.episode = arg.slice('--episode='.length);
    } else if (arg === '--limit') {
      options.limit = Number.parseInt(argv[index + 1] || '', 10) || options.limit;
      index += 1;
    } else if (arg.startsWith('--limit=')) {
      options.limit = Number.parseInt(arg.slice('--limit='.length), 10) || options.limit;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/audit-extension-relations.mjs [--episode EP117] [--strict] [--limit 200]

Checks content/episodes/* topic.extensions for explicit cross-episode relation notes.

Issue types:
  missing_refs          topic.extensions has no valid EPxxx reference.
  no_related_episodes  topic.extensions exists but relatedEpisodes is empty.
  orphan_related       relatedEpisodes contains an EP that is not explained in topic.extensions.
  weak_relation        an EP is mentioned, but the sentence is too generic to explain the relationship.
  unknown_ref          topic.extensions mentions an EP id that does not exist.
  unlisted_ref         topic.extensions mentions an existing EP not listed in relatedEpisodes.
`);
      process.exit(0);
    }
  }

  if (options.episode) {
    options.episode = options.episode.toUpperCase();
  }

  return options;
}

function collectEpisodeRefs(value) {
  return [...new Set(String(value || '').match(/\bEP\d{3}\b/g) || [])];
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, '');
}

function hasRelationExplanation(text, episodeId) {
  const compact = compactText(text);
  if (!compact.includes(episodeId) || compact.length < 48) return false;

  const explanatorySignals = [
    '讲',
    '说明',
    '解释',
    '提供',
    '对照',
    '承接',
    '延续',
    '补充',
    '验证',
    '落到',
    '放进',
    '放到',
    '形成',
    '连接',
    '回到',
    '对应',
    '同属',
    '作为',
    '前置',
    '后续',
    '判断',
    '提示',
    '看到',
    '链条',
    '样板',
    '样本',
    '案例',
    '框架',
    '机制',
    '制度',
    '利益',
    '规则',
    '路径',
    '差异',
    '分化'
  ];
  const connectorSignals = [
    '因为',
    '所以',
    '而',
    '则',
    '通过',
    '从',
    '把',
    '用',
    '可以',
    '会',
    '让',
    '显示',
    '体现'
  ];

  const hasExplanation = explanatorySignals.some((signal) => compact.includes(signal));
  const hasConnector = connectorSignals.some((signal) => compact.includes(signal));
  const weakOnly = /^这期(?:很|也)?适合(?:和|与)?.{0,80}(?:一起看|并读|连读)[。.!！?？]?$/.test(compact);

  return hasExplanation && hasConnector && !weakOnly;
}

async function readEpisodes() {
  const files = (await fs.readdir(episodesDir))
    .filter((file) => /^EP\d{3}\.json$/.test(file))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  const episodes = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(episodesDir, file), 'utf8');
    episodes.push(JSON.parse(raw));
  }
  return episodes;
}

function auditEpisode(episode, validIds) {
  const issues = [];
  const topicExtensions = Array.isArray(episode.topic?.extensions)
    ? episode.topic.extensions.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const relatedEpisodes = Array.isArray(episode.relatedEpisodes)
    ? episode.relatedEpisodes.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const refs = [...new Set(topicExtensions.flatMap(collectEpisodeRefs))];
  const validRefs = refs.filter((id) => validIds.has(id));
  const unknownRefs = refs.filter((id) => !validIds.has(id));

  if (!topicExtensions.length) {
    return issues;
  }

  if (!relatedEpisodes.length) {
    issues.push({
      id: episode.id,
      type: 'no_related_episodes',
      detail: 'topic.extensions exists but relatedEpisodes is empty'
    });
  }

  if (!validRefs.length) {
    issues.push({
      id: episode.id,
      type: 'missing_refs',
      related: relatedEpisodes,
      detail: 'topic.extensions has no valid EPxxx reference'
    });
    return issues;
  }

  for (const ref of unknownRefs) {
    issues.push({
      id: episode.id,
      type: 'unknown_ref',
      ref,
      detail: `${ref} is mentioned in topic.extensions but no matching episode file exists`
    });
  }

  for (const ref of validRefs) {
    if (ref === episode.id) continue;
    if (!relatedEpisodes.includes(ref)) {
      issues.push({
        id: episode.id,
        type: 'unlisted_ref',
        ref,
        detail: `${ref} is mentioned in topic.extensions but is not listed in relatedEpisodes`
      });
    }
  }

  for (const relatedId of relatedEpisodes) {
    const matchingExtensions = topicExtensions.filter((item) => collectEpisodeRefs(item).includes(relatedId));
    if (!matchingExtensions.length) {
      issues.push({
        id: episode.id,
        type: 'orphan_related',
        ref: relatedId,
        detail: `${relatedId} is listed in relatedEpisodes but not explained in topic.extensions`
      });
      continue;
    }
    if (!matchingExtensions.some((item) => hasRelationExplanation(item, relatedId))) {
      issues.push({
        id: episode.id,
        type: 'weak_relation',
        ref: relatedId,
        detail: `${relatedId} is mentioned but the relation note is too generic`
      });
    }
  }

  return issues;
}

function printIssue(issue) {
  const parts = [`${issue.id}`, issue.type];
  if (issue.ref) parts.push(issue.ref);
  if (issue.related?.length) parts.push(`related=${issue.related.join(',')}`);
  parts.push(issue.detail);
  console.log(parts.join('\t'));
}

const options = parseArgs(process.argv.slice(2));
const episodes = await readEpisodes();
const selectedEpisodes = options.episode
  ? episodes.filter((episode) => episode.id === options.episode)
  : episodes;
const validIds = new Set(episodes.map((episode) => episode.id));

if (options.episode && !selectedEpisodes.length) {
  console.error(`Episode not found: ${options.episode}`);
  process.exit(1);
}

const issues = selectedEpisodes.flatMap((episode) => auditEpisode(episode, validIds));
const counts = issues.reduce((acc, issue) => {
  acc[issue.type] = (acc[issue.type] || 0) + 1;
  return acc;
}, {});

console.log(`episodes_checked\t${selectedEpisodes.length}`);
console.log(`issues\t${issues.length}`);
for (const [type, count] of Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`${type}\t${count}`);
}

if (issues.length) {
  console.log('\nissue_details');
  for (const issue of issues.slice(0, options.limit)) {
    printIssue(issue);
  }
  if (issues.length > options.limit) {
    console.log(`... ${issues.length - options.limit} more issues omitted; rerun with --limit ${issues.length}`);
  }
}

if (options.strict && issues.length) {
  process.exit(1);
}
