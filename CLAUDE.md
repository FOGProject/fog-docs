# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the documentation site for the FOG Project (a computer cloning/imaging
system), built with [Quartz](https://quartz.jzhao.xyz/) and published via
Read the Docs at <https://docs.fogproject.org/>. There is no application code
here — this repo is pure content (Markdown) plus the Quartz build.

Content is written to be dual-compatible: viewable/editable as an
[Obsidian](https://obsidian.md) vault (open the `docs/` folder as a vault) and
built as a static site by Quartz, which has native support for Obsidian's
wikilinks, callouts, tags, and graph view — no bridging plugins needed.
`docs/.obsidian/` holds vault settings.

## Commands

Build/preview locally (from `quartz/`, requires Node.js 22+):

```bash
cd quartz
npm i
npm run docs:serve   # build + serve with live reload at http://localhost:8080
npm run docs:build   # one-shot build to quartz/public
```

Both scripts point Quartz at `../docs` via its `--directory` flag, so `docs/`
remains the single source of truth for content — nothing is copied or
symlinked into `quartz/content/`.

There are no tests or linters in this repo — the only "validation" is that
`npm run docs:build` completes without errors (broken wikilinks, duplicate
`context_id`s, etc. surface as build warnings/errors).

Production builds happen on Read the Docs per `.readthedocs.yml`, which fully
overrides RTD's default build via `build.commands`: install Node, run Quartz,
then run `quartz/scripts/rtd-fix-links.mjs` as a post-build fix-up (Quartz
assumes clean-URL host rewriting; RTD serves by exact path, so leaf pages get
promoted to `foo/index.html`).

## Content architecture

- **Navigation**: `quartz/quartz.config.yaml`'s `@quartz-community/explorer`
  plugin builds the sidebar tree directly from `docs/`'s folder structure
  (with a custom `sortFn` for section/page ordering) — adding a new page
  under an existing folder needs no nav config changes. Top-level sections
  also get pinned shortcut links via `local-plugins/section-shortcuts`, kept
  in sync with the Explorer's `sortFn`.
- **Every folder needs an `index.md`** (not `README.md`) with front matter —
  it serves as that folder's landing page. Quartz treats `index.md` as a
  folder's own page; `README.md` would build at an awkward sibling URL
  instead, with Quartz auto-generating a generic stub at the real folder URL.
- **Front matter is required on every page.** Template at
  `docs/assets/templates/metadata-template.md`:
  ```yaml
  ---
  title: Page Title
  aliases:
      - Page Title
  description: brief description of the page
  context_id: unique-id-usually-matching-filename-without-extension
  tags:
      - relevant
      - tags
  ---
  ```
  `context_id` must be unique across the whole site.
  `quartz/local-plugins/context-id-aliases` bridges each page's `context_id`
  into Quartz's native `aliases`, so the built-in `@quartz-community/alias-redirects`
  emitter generates a `/{context_id}` redirect stub automatically.
  `quartz/local-plugins/context-id-permalink` renders the visible "Permalink"
  link built from it. `aliases` can also hold full slug paths (not just
  human-readable title variants) to create redirects from old/retired URLs
  to their replacement page — see the `kb/how-tos/active-directory-fog-setting`
  and `installation/network-setup/legacy-proxy-dhcp` entries in
  `docs/management/web/ad-integration.md` and
  `docs/installation/network-setup/proxy-dhcp.md` for examples.
- **File naming**: all lowercase, dashes not spaces (e.g.
  `plugin-schema-migrations.md`).
- **Internal links use Obsidian wikilink syntax** natively (no bridging
  plugin — `@quartz-community/obsidian-flavored-markdown` handles this):
  - Page: `[[file-name|Friendly Title]]`
  - Heading: `[[file-name#Heading name|Friendly Title]]`
  - Image: `![[image-name.ext]]` — all images live under `docs/assets/img/`
    and are referenced by filename only (no path), so names must be unique
    site-wide.
- **Callouts, not raw admonitions**: write Obsidian callout syntax —
  ```
  >[!note]
  >Contents
  ```
  — rendered natively. Don't hand-write MkDocs-style `!!! note` admonition
  syntax; Quartz doesn't understand it (a small number of pre-existing pages
  still have it as a known, accepted gap — see `quartz/README.md`).
- **Tags**: native Quartz tag pages/index (`@quartz-community/tag-page`),
  reading the same `tags:` front matter already in use.
- `wikiArchive/` holds the pre-migration wiki export (`.txt` files, plus a
  few retired pages moved there wholesale) sorted into `Done/`,
  `In-Progress-*/`, `Not-Migrating/`, `To-do/` — reference material, not live
  docs. It sits outside `docs/`, so Quartz never builds it.
- The old RST/Sphinx source has been fully removed; Markdown/Quartz is the
  only current format (full history is still in git if ever needed).

## Quartz build details

- Config lives in `quartz/quartz.config.yaml` (plugin list, theme
  palette/typography, Explorer sort order, layout). This is a Quartz v5
  plugin-marketplace setup — plugins are `@quartz-community/*` npm packages
  configured declaratively; there's no `quartz.config.ts`/`quartz.layout.ts`
  to edit.
- `quartz/local-plugins/` holds small custom plugins with no
  `@quartz-community` equivalent: `context-id-aliases` /
  `context-id-permalink` (described above), `github-source-link`
  ("Edit this page" / "View source" links), `section-shortcuts` (pinned
  top-level nav pills), `prev-next-nav` (Previous/Next page links), and
  `site-logo`. See `quartz/local-plugins/README.md` for details on each.
- Branding (indigo palette, Roboto/Roboto Mono, favicon, card-grid CSS) lives
  in `quartz.config.yaml`'s `theme:` section and `quartz/styles/custom.scss`.
- See `quartz/README.md` for the full picture, including known, accepted
  gaps (unconverted MkDocs admonition syntax in a few files, an unsupported
  color-class syntax, and pre-existing `context-id` front-matter typos).

## Documenting FOG's release/version automation

`docs/development/` documents process that lives in *other* FOGProject repos
(`fogproject`, `fog-workflows`, `fos`), not in this one — there's nothing to
run or test locally for these mechanisms. When updating these pages, keep the
cross-links between them intact:

- [`version-sync-automation.md`](docs/development/version-sync-automation.md) —
  how `FOG_VERSION`/`FOG_CHANNEL` stay correct per-branch (local pre-commit
  hook + hourly sweep workflow + `stable-releases.yml`).
- [`stable-release-workflow.md`](docs/development/stable-release-workflow.md) —
  how `dev-branch` gets promoted to a tagged `stable` release.
- [`fog-release.md`](docs/development/fog-release.md) — the manual side of a
  release (kernel/init/iPXE binary updates in the `fos` repo).

These three intentionally divide the same overall release process into
distinct concerns (version string correctness vs. the promotion pipeline vs.
manual binary updates) and each links to the others rather than repeating
content — preserve that split rather than merging them.
