## What this changes

<!-- One line. "Adds two Terraform packs", "Removes a repository that was archived". -->

## Entries touched

| Repository | Stack | Added / changed / removed |
| --- | --- | --- |
|  |  |  |

## Verification

- [ ] `GET /repos/{owner}/{name}` — exists, not archived, pushed within the year
- [ ] `GET /repos/{owner}/{name}/contents/{path}` — the listed path really holds SKILL.md / agent / instruction files
- [ ] I opened the prose and read it
- [ ] It teaches the stack; it does not tell the agent to skip tests, edit generated model files, stamp requirement metadata, read credentials, or run a downloaded script
- [ ] Licence recorded (`none` only when I read the repository and accepted it)
- [ ] `node scripts/build.mjs` run; `catalog.json` committed with the source file

## Anything the reviewer should know

<!-- Licence oddities, overlap with an existing entry, why a "none" licence is acceptable here. -->

---

<!-- If an assistant wrote this pull request, say so here. It changes nothing about the review,
     but the reviewer should know what they are reading. -->
