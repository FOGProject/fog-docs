# Quartz (fog-docs' site build)

This folder builds the fog-docs site with [Quartz](https://quartz.jzhao.xyz/), replacing the project's original MkDocs setup, for native Obsidian wikilink, callout, tag, and graph-view support. It builds directly against the existing `../docs` folder — no content was moved or duplicated.

This started as a spike on the `quartz-docs` branch; MkDocs (`mkdocs.yml`, `hook.py`, `requirements.txt`, `make.ps1`, `buildFunctions.psm1`, `overrides/`) has since been removed from the repo now that Quartz is the site's only build.

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

## Known, accepted gaps

- 14 files using raw MkDocs `!!! type "title"` admonition syntax render as plain text (Quartz only understands Obsidian's `> [!type]` callout syntax).
- 3 files with a `context-id` (hyphen, not underscore) front-matter typo silently lack a short permalink — this is pre-existing MkDocs-era behavior, not a Quartz regression.
- `{ .red }`/`{ .orange }`/`{ .yellow }` inline attr_list color-class syntax has no Quartz equivalent (and isn't supported in Obsidian either) — documented, not built.
- A handful of pages `master` still served at the time of the cutover merge (a stale full user-guide, a dead-link blog roundup, a FOG-1.2-only boot-menu doc, and two pages whose content was merged forward into other pages) were restored as short stub/redirect pages rather than fully un-archived, so their old URLs keep working. The originals remain in `wikiArchive/Not-Migrating/` for reference.
- Two content edits were made beyond the planned 16 `README.md` → `index.md` renames: `docs/management/web/ad-integration.md` and `docs/management/web/printers.md` had tab characters in their YAML front-matter list indentation, which is invalid YAML and hard-failed the Quartz build (MkDocs' parser tolerated it). Fixed by converting to spaces — whitespace-only, no content or semantic change.

## Deployment

Quartz needs Node, which Read the Docs doesn't support natively — `.readthedocs.yml` fully overrides the default build via `build.commands` to install Node, run Quartz, and drop the result where RTD expects its output. This was proven out against a side `fog-docs-quartz-test` RTD project before the cutover merge; the real fog-docs RTD project now builds this directly from `master`.

The build entry point is `scripts/rtd-build.mjs`, not a bare `quartz build` — the site is published in several languages and the build has to vary by language. RTD serves translations as one project per language, all pointed at this same repo and branch; each project's Language setting arrives as `$READTHEDOCS_LANGUAGE`, and the script uses it to pick the Quartz UI locale and to compose the content tree (`../docs` with `../translations/<lang>/` laid over it, so untranslated pages fall back to English). It also derives `baseUrl` from `$READTHEDOCS_CANONICAL_URL` instead of the hardcoded value the config used to carry, and restores `quartz.config.yaml` after patching it. See the script's header and the `## Translations` section of the repo's `CLAUDE.md`.

To build a language locally:

```
cd quartz
node scripts/rtd-build.mjs --language fr -o /tmp/fr-site
```

Two things about that build worth knowing before changing it. The composed content tree is written to the OS temp dir rather than inside the repo, because Quartz globs content with `globby(..., { gitignore: true })` — a gitignored content root inside the working tree yields "Found 0 input files" and a clean-exiting build that publishes a site with no pages in it. And because the tree sits outside the repo, the `created-modified-date` plugin can't read dates from git for translated builds and falls back to filesystem mtimes, so translated pages carry weaker date information than English ones.

Quartz's link-resolution strips the `.html` extension from internal links unconditionally, assuming the host does clean-URL rewriting (the way GitHub Pages/Cloudflare Pages do). RTD's `build.commands` hosting serves by exact path instead, so a post-build fix-up (`quartz/scripts/rtd-fix-links.mjs`) promotes leaf pages to `foo/index.html` — see that script and `.readthedocs.yml` for details.
