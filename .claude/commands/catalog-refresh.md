---
description: Re-read every catalog entry against the GitHub API and propose the factual updates as a pull request
---

Refresh this catalog. Read `AGENTS.md` first and follow it — in particular: you propose, a human
decides, and you never push to `main`.

1. `git switch -c refresh/$(date +%Y-%m-%d)` — never work on `main`.
2. `node scripts/refresh.mjs --write` (set `GITHUB_TOKEN` if the rate limit bites), then
   `node scripts/build.mjs`.
3. Read `refresh-report.md`. The **Facts updated** section is done and needs no judgement.
   The **Needs a human** section does: for each flag, say in the pull request body what you
   think and why — gone, archived, path moved, quiet but still the best pack for that stack.
   Do NOT delete or re-categorise anything: propose it in prose, let the reviewer decide.
4. Commit `catalog/**` and `catalog.json` together. Leave `refresh-report.md` out of the commit —
   it is the pull request body, not repository content.
5. Open the pull request with `gh pr create`, title `refresh: re-read the catalog against the
   GitHub API`, body from the report plus your notes on the flags. Then stop: do not approve,
   do not merge, do not enable auto-merge.
