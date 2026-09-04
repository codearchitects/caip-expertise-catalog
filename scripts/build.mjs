#!/usr/bin/env node
/**
 * Builds `catalog.json` — the one flat file the CAIP extension reads — out of the per-topic
 * files under `catalog/`.
 *
 * Two audiences, one truth: people (and the agents helping them) maintain small files sorted
 * by category, and the extension fetches a single document. The generated file is committed so
 * that a raw GitHub URL serves it with no build step in the middle; CI runs `--check` to make
 * sure nobody edits it by hand or forgets to rebuild.
 *
 *   node scripts/build.mjs          write catalog.json
 *   node scripts/build.mjs --check  fail when it would change (CI)
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATEGORIES = ['backend', 'frontend', 'mobile', 'languages', 'data', 'platform', 'quality'];
const KINDS = ['skills', 'agents', 'instructions', 'mixed'];
const NOTE =
  'Reviewed shortlist for the CAIP Expertise marketplace. Every entry was checked against the ' +
  'GitHub API (existence, license, stars, forks, default branch) and its path checked to hold ' +
  "SKILL.md / agent / instruction files. A 'stack' may carry '/'-separated aliases. Stars are a " +
  "snapshot, not a verdict; 'license: none' means no LICENSE file was found — read before relying " +
  'on it. Curated at https://github.com/codearchitects/caip-expertise-catalog — open an issue or a ' +
  'PR to add, correct or remove an entry.';

/** Every topic file on disk, category by category. @returns {{file: string, body: object}[]} */
function topicFiles() {
  const out = [];
  for (const category of CATEGORIES) {
    const dir = join(ROOT, 'catalog', category);
    let names;
    try {
      names = readdirSync(dir).sort();
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith('.json') || !statSync(join(dir, name)).isFile()) continue;
      const file = relative(ROOT, join(dir, name));
      out.push({ file, body: JSON.parse(readFileSync(join(dir, name), 'utf8')) });
    }
  }
  return out;
}

const problems = [];
const entries = [];
const seen = new Map();

for (const { file, body } of topicFiles()) {
  const where = (msg) => problems.push(`${file}: ${msg}`);
  const expectedCategory = file.split('/')[1];
  const expectedTopic = file.split('/')[2].replace(/\.json$/, '');
  if (body.category !== expectedCategory) where(`declares category '${body.category}' but lives in '${expectedCategory}/'`);
  if (body.topic !== expectedTopic) where(`declares topic '${body.topic}' but the file is '${expectedTopic}.json'`);
  if (!body.title || body.title.length < 2) where('has no title');
  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    where('has no entries — delete the file instead of leaving it empty');
    continue;
  }
  for (const entry of body.entries) {
    const id = `${entry.fullName}#${entry.path ?? ''}`;
    for (const field of ['stack', 'fullName', 'url', 'kind', 'license', 'defaultBranch', 'description', 'verifiedAt']) {
      if (!entry[field]) where(`${id}: '${field}' is required`);
    }
    if (entry.url && entry.url !== `https://github.com/${entry.fullName}`) where(`${id}: url does not match fullName`);
    if (entry.kind && !KINDS.includes(entry.kind)) where(`${id}: kind '${entry.kind}' is not one of ${KINDS.join(', ')}`);
    if (entry.path && (entry.path.startsWith('/') || entry.path.split('/').includes('..'))) where(`${id}: path must be repository-relative`);
    if (entry.description && entry.description.length < 20) where(`${id}: description says too little`);
    if (entry.verifiedAt && !/^\d{4}-\d{2}-\d{2}$/.test(entry.verifiedAt)) where(`${id}: verifiedAt is not an ISO date`);
    // The same repository may serve several stacks; the same repository AND path twice is a duplicate.
    const key = `${id}@${entry.stack}`;
    if (seen.has(key)) where(`${id} for '${entry.stack}' is already listed in ${seen.get(key)}`);
    else seen.set(key, file);
    entries.push({
      stack: entry.stack,
      fullName: entry.fullName,
      url: entry.url,
      ...(entry.path ? { path: entry.path } : {}),
      kind: entry.kind,
      license: entry.license,
      stars: entry.stars ?? 0,
      forks: entry.forks ?? 0,
      defaultBranch: entry.defaultBranch,
      description: entry.description,
    });
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

// Stack first, then stars: the extension groups by stack, and a reader wants the busiest first.
entries.sort((a, b) => a.stack.localeCompare(b.stack) || b.stars - a.stars || a.fullName.localeCompare(b.fullName));

const target = join(ROOT, 'catalog.json');
const previous = (() => {
  try {
    return JSON.parse(readFileSync(target, 'utf8'));
  } catch {
    return undefined;
  }
})();
// `generatedAt` moves on every run; only a change in the ENTRIES is a change worth a commit.
const unchanged = previous && JSON.stringify(previous.entries) === JSON.stringify(entries) && previous.note === NOTE;
const built = { generatedAt: unchanged ? previous.generatedAt : new Date().toISOString(), note: NOTE, entries };
const text = JSON.stringify(built, null, 2) + '\n';

if (process.argv.includes('--check')) {
  if (!unchanged) {
    console.error('catalog.json is out of date — run `node scripts/build.mjs` and commit the result.');
    process.exit(1);
  }
  console.log(`catalog.json is current: ${entries.length} entries, ${seen.size} (repo, path, stack) rows.`);
} else {
  writeFileSync(target, text);
  console.log(`catalog.json: ${entries.length} entries across ${new Set(entries.map((e) => e.stack)).size} stacks.`);
}
