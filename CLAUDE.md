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

The only tests in this repo cover the translation pipeline's helpers
(`node --test "scripts/*.test.mjs"`). There are no linters — otherwise the only
"validation" is that `npm run docs:build` completes without errors (broken
wikilinks, duplicate `context_id`s, etc. surface as build warnings/errors).

Production builds happen on Read the Docs per `.readthedocs.yml`, which fully
overrides RTD's default build via `build.commands`: install Node, then run
`quartz/scripts/rtd-build.mjs`. That script picks the language, composes the
content tree, runs Quartz, and finishes with `quartz/scripts/rtd-fix-links.mjs`
as a post-build fix-up (Quartz assumes clean-URL host rewriting; RTD serves by
exact path, so leaf pages get promoted to `foo/index.html`). To build a
non-English language locally:

```bash
cd quartz
node scripts/rtd-build.mjs --language fr -o /tmp/fr-site
```

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
  - **Keep each wikilink on one line.** A link wrapped across a newline to
    respect the file's line width does not parse — it renders literally as
    `[[page|Text]]` on the published page, and the build does not warn. Rewrap
    the sentence around the link instead. Worth grepping the built HTML for
    `[[` after adding links (`grep -o '\[\[' quartz/public/**/*.html`); the
    only legitimate hits are inside code blocks.
  - **Escape the pipe inside a wikilink in a table cell**: `[[page\|Text]]`.
    Markdown splits table cells on `|` before wikilinks are parsed, so an
    unescaped one truncates the link and renders literally — same silent
    failure as the wrapped-link case above, and the build does not warn.
  - **A bare wikilink with an `#anchor` can drop the anchor.** It sometimes
    resolves to the root `/{context_id}` permalink stub, which is a
    `meta refresh` to a URL with no fragment, so the reader lands at the top
    of the page. Path-qualified (`[[kb/reference/page#anchor|Text]]`) always
    resolves to the real page — use it whenever a cross-page link carries an
    anchor.
  - **Anchors come from the slugified heading, and an em dash becomes a
    double hyphen.** `## Route B — from the FOG boot menu` is
    `#route-b--from-the-fog-boot-menu`. Nothing warns when an anchor misses;
    the link renders and lands at the top. Grep the built HTML for the
    `id="…"` you are targeting rather than deriving it by hand.
- **Arrows in menu paths are the literal `→` character.** Quartz has no
  icon-shortcode support, so mkdocs-material's `:octicons-arrow-right-24:`
  renders as that raw text on the published page. All 76 occurrences were
  converted to `→`, which needs no renderer support and reads correctly in
  Obsidian. Don't reintroduce the shortcode form.
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

## Translations

The site is published in several languages. `docs/` is English and is the only
source of truth; everything under `translations/` is machine-generated from it
and is safe to delete and regenerate.

- **Read the Docs serves translations as one project per language**, all
  pointed at this same repo and branch and linked from the parent project's
  *Translations* page. The only difference between them is each project's
  Language setting, which arrives in the build as `$READTHEDOCS_LANGUAGE`.
  Adding a language is one entry in `translations/languages.json` plus one RTD
  project — there are no per-language branches and no config to keep in sync.
- **Layout**: `translations/<lang>/` mirrors `docs/`, holding only the pages
  actually translated. `quartz/scripts/rtd-build.mjs` lays it over a copy of
  `docs/`, so an untranslated page falls back to English rather than 404ing.
- **`scripts/translate.mjs`** regenerates a language from `docs/`. It tracks
  which pages are stale by hashing their English source into
  `translations/<lang>/.translation-state.json`, and
  `.github/workflows/translate.yml` runs it on every push to `master` that
  touches `docs/**`, plus nightly to drain whatever the rate limit deferred.
- **The automated translation is off until a provider is configured.** It was
  built on GitHub Models via the workflow's own `GITHUB_TOKEN` (`models: read`)
  — free, no API key — and GitHub retired that service on 30 July 2026 (every
  request returns 410). The workflow's job is now gated on the
  `TRANSLATE_ENDPOINT` repository variable: unset, every run skips cleanly;
  setting it (plus `TRANSLATE_MODEL` and the `TRANSLATE_API_KEY` secret) turns
  the workflow on with no code change. `translations/README.md` is the
  step-by-step for creating the Cloudflare account and token.
  Everything that does not call a model still works: `--dry-run` reports which
  pages have drifted, and `--verify`/`--relink` are unaffected. Seeding by hand
  and running those checks is how the French tree was built — the full recipe
  and its gotchas live in `translations/SEEDING.md`.
- **Cloudflare Workers AI is the intended replacement**, chosen because it
  keeps this free — an open-source project cannot carry a per-token bill. It is
  OpenAI-compatible and takes the same bearer header the script already sends,
  so reviving the workflow is configuration, not code. Set `TRANSLATE_API_KEY`
  (secret) plus `TRANSLATE_ENDPOINT` and `TRANSLATE_MODEL` (variables):
  `https://api.cloudflare.com/client/v4/accounts/<id>/ai/v1/chat/completions`
  and `@cf/zai-org/glm-4.7-flash`. The Workers **Free** plan includes 10,000
  Neurons/day, resetting 00:00 UTC — enough to track `docs/` changes, not
  enough to seed a language from nothing, which is what the request budget and
  nightly drain are already shaped around. Seed in bulk by hand; let the
  workflow hold the line.
- Two options that look right and are not: **Azure Translator** has the biggest
  free tier (F0, 2M characters/month) and cannot do this job — it takes no
  prompt, so the glossary has nowhere to go, and its `textType` is plain/html
  only, so wikilinks and fenced code do not survive; `checkStructure` rejects
  essentially every page. **Azure Foundry Models** would drop straight in but is
  pay-per-token with no free allowance.

Rules that matter when touching any of this:

- **Filenames stay English.** The Explorer `sortFn`, `section-shortcuts`,
  `prev-next-nav` and every wikilink target key off slugs, which come from
  filenames. Only front-matter `title`/`description` and the prose are
  translated; the visible nav localizes through `title` alone.
- **`context_id`, `tags` and `aliases` are copied verbatim.** `context_id` must
  match English for the `/{context_id}` permalink to resolve, `aliases` hold
  redirect slugs from retired URLs, and translating `tags` would fragment the
  tag tree. Each language is its own site build, so a repeated `context_id`
  across languages is not a collision.
- **Terminology comes from the FOG web UI's own gettext catalogs**
  (`fogproject`'s `packages/web/management/languages/`), fetched at run time and
  fed to the model as a glossary. This is not cosmetic: FOG's French UI calls a
  Host a *Machine*, not an *Hôte*, and without the glossary the docs name
  buttons that do not exist on the reader's screen.
- **Every translated page carries a machine-translation warning callout**
  linking to the English original, injected by code rather than by the model.
- **Headings are translated, so heading anchors are rewritten.** Translating a
  heading changes the id Quartz generates for it, which would break every
  `](#anchor)` and `[[page#Heading]]` link pointing at it — 115 of them across
  this repo, none of which the build warns about (the link renders and just
  lands at the top of the page). `translate.mjs <lang> --relink` remaps them by
  heading *position*, which works because `checkStructure` guarantees a
  translation has the same headings in the same order as its source. It runs
  automatically after translating, is idempotent, and leaves anchors into
  not-yet-translated pages alone — those pages are served in English, so the
  English anchor is the live one.
- **Human edits to a translation survive until the English page changes**, at
  which point the page is regenerated and the edit is lost. Fixes belong
  upstream in `docs/`. Run `node scripts/translate.mjs <lang> --verify` after
  editing a translation by hand — it re-checks every page against its English
  source for dropped wikilinks, altered code blocks and the like, none of which
  the Quartz build would warn about.

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
