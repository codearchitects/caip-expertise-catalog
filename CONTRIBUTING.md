# Contributing

This is a curated shortlist. Everything in it will be offered to developers inside their IDE
and, once installed, read by agents that hold a shell in their repository. The bar is therefore
higher than "it exists and it is popular".

## Who decides

Pull requests are reviewed and merged by Code Architects. Nobody merges their own — and that
includes the AI: an assistant may open a pull request, never approve or merge one.

## The bar for an entry

An entry gets in when all of these are true:

1. **It is pack-shaped.** The `path` you list holds `SKILL.md`, agent `.md`, or instruction
   files. A repository that merely writes about a framework is not a pack.
2. **It is alive.** Not archived; pushed to within about a year.
3. **It is readable.** The licence is stated (`license: none` is allowed, but then the reviewer
   has read the repository and accepted it, and the description says so).
4. **The prose is teaching, not driving.** It explains how a stack works. It does not tell the
   agent to skip tests, weaken assertions, edit generated model files, stamp requirement
   metadata, read `.env` or credentials, or run a downloaded script. If it does, it does not
   belong here — the installer's lint is the last line of defence, not the first.
5. **It has been verified against the GitHub API**, not against its README, and `verifiedAt`
   says when.

## How to propose one

1. Add it to `catalog/<category>/<topic>.json` — see [CATEGORIES.md](CATEGORIES.md) for where,
   and [`schema/topic.schema.json`](schema/topic.schema.json) for the shape.
2. Run `node scripts/build.mjs` and commit the regenerated `catalog.json` with it.
3. Open a pull request using the template. Say what you checked and what you read.

Prefer one topic per pull request. A reviewer can then take the Django entry and leave the
Rust one for another day.

## The generated file

`catalog.json` at the root is **generated**. It is committed so that a raw GitHub URL serves it
without a build step, but it is never hand-edited. CI runs `node scripts/build.mjs --check` and
fails when it is out of date.

## Removing an entry

Removals are welcome and need the same care: say what happened (gone, archived, path moved,
prose no longer acceptable) and put the evidence in the pull request. Somebody may already have
installed it.
