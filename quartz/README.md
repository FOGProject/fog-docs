# Quartz spike (branch: `quartz-docs`)

This folder is an exploratory spike replacing MkDocs with [Quartz](https://quartz.jzhao.xyz/) for fog-docs, to see what the site looks/feels like with native Obsidian wikilink, callout, tag, and graph-view support. It builds directly against the existing `../docs` folder — no content was moved or duplicated.

MkDocs itself (`mkdocs.yml`, `hook.py`, `.readthedocs.yml`, `requirements.txt`, `overrides/`) is untouched on this branch and still builds normally; this is an addition, not a replacement.

## Running locally

Requires Node.js 22+.

```
cd quartz
npm i
npm run docs:serve   # build + serve with live reload at http://localhost:8080
npm run docs:build    # one-shot build to quartz/public
```

Both scripts point Quartz at `../docs` via its `--directory` flag, so `docs/` remains the single source of truth for content.

## What's configured

See `quartz.config.yaml` (the file Quartz actually reads; `quartz.config.default.yaml` is Quartz's own upstream default, left untouched for reference) for the full plugin list. Notable pieces:

- Wikilinks, `![[embeds]]`, Obsidian callouts, tags, full-text search, and local/global graph view — all native Quartz features, replacing the `roamlinks`/`callouts`/`tags`/`search` MkDocs plugins.
- `local-plugins/context-id-aliases` and `local-plugins/context-id-permalink` — small local plugins that replicate fog-docs' `context_id` short-permalink feature (`hook.py` + `overrides/partials/tags.html` under MkDocs) without editing any content files. See `local-plugins/README.md`.
- Branding (indigo palette, Roboto/Roboto Mono, favicon, card-grid CSS) ported from `docs/assets/css/custom.css` and `mkdocs.yml`'s theme block into `quartz.config.yaml`'s `theme:` section and `quartz/styles/custom.scss`.
- Explorer sidebar ordered to mirror the old mkdocs nav's top-level section order (installation, management, kb, development) via a custom `sortFn`.

## Known, accepted gaps (not fixed in this spike)

- 14 files using raw MkDocs `!!! type "title"` admonition syntax render as plain text (Quartz only understands Obsidian's `> [!type]` callout syntax).
- 3 files with a `context-id` (hyphen, not underscore) front-matter typo silently lack a short permalink — this is pre-existing MkDocs behavior, not a Quartz regression.
- `{ .red }`/`{ .orange }`/`{ .yellow }` inline attr_list color-class syntax has no Quartz equivalent (and isn't supported in Obsidian either) — documented, not built.
- Two content edits were made beyond the planned 16 `README.md` → `index.md` renames: `docs/management/web/ad-integration.md` and `docs/management/web/printers.md` had tab characters in their YAML front-matter list indentation, which is invalid YAML and hard-failed the Quartz build (MkDocs' parser tolerated it). Fixed by converting to spaces — whitespace-only, no content or semantic change.

## Deployment (documented only — not wired up in this spike)

Quartz needs Node and can't run on Read the Docs (`.readthedocs.yml` stays MkDocs-only). If this graduates past spike status:

- **GitHub Pages via GitHub Actions** (recommended starting point — no extra third-party accounts): `npm ci && npx quartz build --directory ../docs`, publish `quartz/public/` via `actions/deploy-pages`.
- **Cloudflare Pages via GitHub Actions**: same build step, deploy via `cloudflare/pages-action` — gives per-PR preview deployments at the cost of extra account/token setup.

No `.github/workflows/*.yml` file exists yet — this section is a recommendation, not an implementation.
