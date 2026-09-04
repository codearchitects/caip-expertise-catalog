# Categories

The folders exist for the people (and agents) maintaining the list. They do NOT affect matching:
the CAIP extension matches a pack to a container by the entry's `stack` keys alone, whatever
folder the entry lives in.

| Folder | What lives there | Examples |
| --- | --- | --- |
| `backend/` | Server-side frameworks | Django, FastAPI, Flask, Express, NestJS, Spring Boot, .NET/ASP.NET, Laravel, Rails |
| `frontend/` | Browser frameworks and their meta-frameworks | React, Next.js, Svelte, Vue, Angular |
| `mobile/` | Mobile platforms and their toolkits | Flutter, Swift/iOS, Kotlin/Android |
| `languages/` | A language rather than a framework | Python, TypeScript/Node, Java, Go, Rust, Dart |
| `data/` | Databases, caches, query languages | PostgreSQL, Redis |
| `platform/` | Infrastructure, containers, cloud, IaC | Docker, Kubernetes, Terraform |
| `quality/` | Testing, contracts, and how software is checked | Playwright, OpenAPI/REST |

## One file per topic

`catalog/backend/django.json` holds every entry serving Django, whatever the alias list says.
The file name is the `topic`; the file declares its own `category` and `topic` and CI checks
that both match where the file actually sits.

An entry's `stack` may carry `/`-separated aliases — `postgres/postgresql/sql` — so a container
declaring any one of them finds the pack. Keep every entry for a topic in that topic's file even
when their alias lists differ (`postgres/postgresql/sql` and `postgres/postgresql/google-cloud`
both live in `data/postgres.json`).

## Adding a category

Rarely needed, and it is a change to the schema and to `scripts/build.mjs` as well as to this
table — so it is a human-initiated pull request of its own, never part of a catalog update.
