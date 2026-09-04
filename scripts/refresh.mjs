#!/usr/bin/env node
/**
 * Re-reads every entry from the GitHub API and writes back what changed.
 *
 * What it touches: stars, forks, license, defaultBranch, verifiedAt — the facts that go stale
 * on their own. What it NEVER touches: stack, kind, description, path — those are judgements a
 * person made, and a script has no business rewriting a judgement.
 *
 * It also checks that `path` still exists on the default branch, and flags entries whose
 * repository is gone, archived, or has not been pushed to in a long time. Flags are printed
 * and written to `refresh-report.md`; nothing is deleted automatically — a removal is a
 * decision, and decisions go through review.
 *
 *   node scripts/refresh.mjs              read-only report
 *   node scripts/refresh.mjs --write      apply the factual updates
 *   GITHUB_TOKEN=… node scripts/refresh.mjs --write     (lifts the rate limit)
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const TOKEN = process.env.GITHUB_TOKEN ?? '';
const STALE_DAYS = 400;
const today = new Date().toISOString().slice(0, 10);

/**
 * One GitHub API call.
 * @param {string} path API path.
 * @returns {Promise<{status: number, body: any}>}
 */
async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'caip-expertise-catalog',
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (res.status === 403 && (res.headers.get('x-ratelimit-remaining') ?? '') === '0') {
    throw new Error('GitHub rate limit reached — set GITHUB_TOKEN and run again.');
  }
  return { status: res.status, body: res.status === 200 ? await res.json() : undefined };
}

const files = [];
for (const category of readdirSync(join(ROOT, 'catalog'))) {
  const dir = join(ROOT, 'catalog', category);
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
    files.push({ path: join(dir, name), rel: `catalog/${category}/${name}`, body: JSON.parse(readFileSync(join(dir, name), 'utf8')) });
  }
}

const changes = [];
const flags = [];
const repoCache = new Map();

for (const file of files) {
  let touched = false;
  for (const entry of file.body.entries) {
    if (!repoCache.has(entry.fullName)) repoCache.set(entry.fullName, await api(`/repos/${entry.fullName}`));
    const repo = repoCache.get(entry.fullName);
    if (repo.status === 404) {
      flags.push(`**gone** — \`${entry.fullName}\` returns 404 (${file.rel})`);
      continue;
    }
    if (repo.status !== 200) {
      flags.push(`**unreadable** — \`${entry.fullName}\` answered ${repo.status} (${file.rel})`);
      continue;
    }
    const facts = {
      stars: repo.body.stargazers_count ?? 0,
      forks: repo.body.forks_count ?? 0,
      license: repo.body.license?.spdx_id && repo.body.license.spdx_id !== 'NOASSERTION' ? repo.body.license.spdx_id : 'none',
      defaultBranch: repo.body.default_branch ?? entry.defaultBranch,
    };
    if (repo.body.archived) flags.push(`**archived** — \`${entry.fullName}\` (${file.rel})`);
    const idleDays = Math.round((Date.now() - Date.parse(repo.body.pushed_at ?? Date.now())) / 86_400_000);
    if (idleDays > STALE_DAYS) flags.push(`**quiet ${idleDays}d** — \`${entry.fullName}\` (${file.rel})`);

    if (entry.path) {
      const probe = await api(`/repos/${entry.fullName}/contents/${entry.path.split('/').map(encodeURIComponent).join('/')}?ref=${facts.defaultBranch}`);
      if (probe.status === 404) flags.push(`**path gone** — \`${entry.fullName}/${entry.path}\` is not on ${facts.defaultBranch} (${file.rel})`);
    }

    for (const [key, value] of Object.entries(facts)) {
      if (entry[key] !== value) {
        changes.push(`\`${entry.fullName}\` ${key}: ${entry[key]} → ${value}`);
        entry[key] = value;
        touched = true;
      }
    }
    if (entry.verifiedAt !== today) {
      entry.verifiedAt = today;
      touched = true;
    }
  }
  if (touched && WRITE) {
    file.body.entries.sort((a, b) => b.stars - a.stars || a.fullName.localeCompare(b.fullName));
    writeFileSync(file.path, JSON.stringify(file.body, null, 2) + '\n');
  }
}

const report = [
  `# Refresh report — ${today}`,
  '',
  `${repoCache.size} repositories read.`,
  '',
  '## Facts updated',
  '',
  changes.length > 0 ? changes.map((c) => `- ${c}`).join('\n') : '_Nothing moved._',
  '',
  '## Needs a human',
  '',
  flags.length > 0 ? flags.map((f) => `- ${f}`).join('\n') : '_Nothing flagged._',
  '',
  '> Removals, re-categorisations and description edits are judgements: this script never makes them.',
  '',
].join('\n');
writeFileSync(join(ROOT, 'refresh-report.md'), report);
console.log(report);
if (!WRITE) console.log('\n(read-only — pass --write to apply the factual updates)');
