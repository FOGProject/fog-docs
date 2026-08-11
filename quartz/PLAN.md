> **Implementation note:** This is the plan as approved before implementation began. It assumed a classic Quartz v4 layout (`quartz.config.ts` + `quartz.layout.ts`, TypeScript plugin imports). The actual `jackyzha0/quartz` checkout turned out to be a newer v5 plugin-marketplace architecture — config lives in `quartz.config.yaml`, plugins are `@quartz-community/*` npm packages, and local custom plugins live under `quartz/local-plugins/`. The plan's goals, decisions, and verification checklist below were all carried out; only the specific file paths in Phases 2/5/6/7 and "Critical files" differ from what was actually built. See `quartz/README.md` for what's actually there.
>
> **Also since this plan was written:** Phase 8's deployment sketch (GitHub Pages / Cloudflare Pages) was superseded — the site is deployed via a native Node/Quartz build in `.readthedocs.yml`, running directly on Read the Docs. This branch has since been merged into `master` as the site's real docs build, not just a spike; see `quartz/README.md` for the current state, including a few pages restored as short stub/redirect pages for URLs `master` had kept live.

# Spike: Quartz as a Quartz-based alternative to MkDocs for fog-docs

## Context

`fog-docs` (FOG Project documentation) is built today with MkDocs + mkdocs-material, deployed via Read the Docs. The `docs/` folder doing double duty as an MkDocs `docs_dir` **and** a live Obsidian vault (it has a checked-in `docs/.obsidian/`), and three MkDocs plugins (`roamlinks`, `callouts`, `tags`) exist purely to bridge Obsidian-authored content (wikilinks, callouts, front-matter tags) into MkDocs. That bridging is a workaround; [Quartz](https://quartz.jzhao.xyz/) is a static site generator built specifically for Obsidian-flavored markdown and its headline feature — a local + global link graph — is exactly what's currently only viewable inside Obsidian itself, not on the published site.

The goal of this branch is a **spike**: stand up Quartz against the real, existing `docs/` content (no restructuring, no bulk content edits) to see what the docs look and feel like with native wikilink/callout/tag/graph support and a branding pass, so the results can be compared against the live MkDocs site before any real migration decision is made.

Decisions already made:
- **Quartz-only focus** — don't worry about keeping MkDocs building in parallel on this branch; its config is left untouched but not actively maintained alongside Quartz changes.
- **Match branding now** — put real effort into porting the current mkdocs-material indigo look (palette, font, favicon, custom CSS helpers) rather than shipping Quartz's stock theme.
- **Sketch, don't build, deployment** — Quartz needs Node and can't run on Read the Docs; document a GitHub Pages/Cloudflare Pages recommendation as a follow-up, don't wire up any CI in this spike.
- **Rename the 16 `README.md` folder-index files to `index.md`** — confirmed with the user. This is the one departure from "leave `docs/` untouched": Quartz treats `index.md` as a folder's own landing page, whereas `README.md` builds at an awkward sibling URL and Quartz auto-generates a generic stub at the real folder URL instead. This is a pure `git mv`, no content/frontmatter changes.

**Verified directly (not just inferred):**
- Node.js/npm are **not installed** on this machine — real Phase 0 blocker.
- `overrides/partials/tags.html` renders a visible **"Permalink"** link built from `page.meta.context_id` (`https://docs.fogproject.org/en/latest/{{context_id}}`) — this is the UI half of the context_id feature; `hook.py` is the routing half. Both need a Quartz equivalent.

## Approach

### Phase 0 — Prerequisites & branch
- Install Node.js LTS (20.x/22.x) — required, currently absent.
- `git checkout -b spike/quartz-docs`.
- Do not touch `mkdocs.yml`, `hook.py`, `requirements.txt`, `.readthedocs.yml`, `overrides/`, `make.ps1`, `buildFunctions.psm1`.

### Phase 1 — Scaffold Quartz without disturbing `docs/`
- `git clone https://github.com/jackyzha0/quartz.git quartz` at repo root, then **remove `quartz/.git`** immediately (easy to forget — otherwise it becomes a nested-repo/gitlink instead of normal tracked files).
- `npm i` inside `quartz/`.
- Skip the interactive `npx quartz create` wizard (it wants to symlink/copy content into `quartz/content/`) — instead always invoke Quartz with `--directory ../docs` so `docs/` remains the single source of truth (no symlinks, no duplication). `quartz/content/`'s sample files are simply unused.
- Add to root `.gitignore`: `quartz/node_modules`, `quartz/public`, `quartz/.quartz-cache`.
- Add convenience scripts to `quartz/package.json` (`"docs:build": "quartz build --directory ../docs"`, `"docs:serve": "quartz build --serve --directory ../docs"`).

### Phase 2 — Baseline `quartz.config.ts`
File: `quartz/quartz.config.ts`
- `pageTitle: "FOG Project Documentation"` (matches `site_name`); placeholder `baseUrl` for now.
- Confirm (empirically, in Phase 9) that `docs/.obsidian/` is excluded by Quartz's default dotfolder ignore — don't just assume it.
- `docs/assets/{css,js,video}/` pass through as static files automatically; no config needed, just confirm no build errors.

### Phase 3 — Feature-parity content pipeline
All native Quartz plugins/components, configured in `quartz.config.ts` / `quartz.layout.ts` — no custom code needed here (custom code is scoped to Phase 6 only):
- **Wikilinks + embeds**: `Plugin.ObsidianFlavoredMarkdown({ wikilinks: true })` — default on, replaces `roamlinks`. Covers `![[image.png]]` embeds too (96 images under `docs/assets/img/`).
- **Callouts**: `Plugin.ObsidianFlavoredMarkdown({ callouts: true })` — replaces `mkdocs-callouts`, covers the ~15 files using `> [!note]` style. **Known gap**: 14 files use raw MkDocs `!!! type "title"` syntax instead (`management/web/{site-scoping,multicast,roles,config,images,ldap,hosts,printers,reports}.md`, `kb/troubleshooting/{database-schema-update,troubleshoot-ftp}.md`, `kb/integrations/{api-expansion-and-pagination,api}.md`, `kb/reference/fog-client-installation-options.md`) — Quartz has no transformer for this syntax, these will render as plain/garbled text. Do not bulk-edit these files in this spike; just name this explicitly as a known limitation when demoing.
- **Tags**: native tag pages/index, reading the same `tags:` front matter already in use. This makes `docs/tags.md` + `overrides/partials/tags.html`'s tag rendering + the mkdocs `tags` plugin redundant *under Quartz specifically* — leave `docs/tags.md` completely alone (MkDocs still needs it; decision was Quartz-only focus, not deleting MkDocs assets).
- **Search**: `Component.Search()` (flexsearch, ships default) replaces the `search` plugin.
- **Graph view**: `Component.Graph()` for both local (per-page) and global graph — the actual point of this spike. `docs/.obsidian/graph.json` has no custom color groups/tuning to port, so start from Quartz defaults.
- **TOC**: `Plugin.TableOfContents()` + `Component.TableOfContents()`.
- **Syntax highlighting**: `Plugin.SyntaxHighlighting()`.
- Keep default-on and harmless: `Plugin.GitHubFlavoredMarkdown()` (tables/tasklists), `Plugin.CrawlLinks()` (resolves the ~15 files using plain `[text](path.md)` links), `Plugin.CreatedModifiedDate()` (rough analog of `git-revision-date`).

### Phase 4 — Front-matter compatibility
- `title`, `tags`, `aliases`, `description` are read natively by Quartz's `FrontMatter` transformer — zero changes needed.
- `context_id` is inert/ignored by default under Quartz; its actual behavior is rebuilt explicitly in Phase 6, not assumed free.
- No renames of front-matter keys anywhere in the 94 content files.

### Phase 5 — Nav: Explorer config + the README→index rename
- In `quartz/quartz.layout.ts`, configure `Component.Explorer()`:
  - `folderClickBehavior: "collapse"`.
  - Custom `sortFn` ordering top-level folders to mirror current section order (`installation`, `management`, `kb`, `development`), alphabetical within each folder. The old hand-curated cross-cutting "Home/Getting Started" nav section (which pulled individual pages from three different folders) doesn't map onto a folder tree — but that curated jump-off content already exists as prose + wikilinks inside `docs/index.md`, so nothing needs to be reproduced structurally.
- **Execute the confirmed rename**: `git mv` these 16 files from `README.md` to `index.md` (pure rename, no content/frontmatter edit):
  `docs/development/README.md`, `docs/installation/README.md`, `docs/installation/client/README.md`, `docs/installation/network-setup/README.md`, `docs/installation/server/README.md`, `docs/kb/README.md`, `docs/kb/customization/README.md`, `docs/kb/faqs/README.md`, `docs/kb/how-tos/README.md`, `docs/kb/integrations/README.md`, `docs/kb/reference/README.md`, `docs/kb/troubleshooting/README.md`, `docs/management/README.md`, `docs/management/fos/README.md`, `docs/management/server/README.md`, `docs/management/web/README.md`.
  (`docs/assets/img/readme.md` and `docs/assets/video/readme.md` are asset-folder notes, not navigable sections — leave those as `README.md`.)
  - Verify the predicted duplicate-page behavior first against the un-renamed content in an initial build (Phase 9), before committing to the rename, so the fix is confirmed necessary rather than assumed.

### Phase 6 — `context_id` short-permalink parity (redirect + visible UI)
Two things to rebuild, since both halves exist today (`hook.py` = routing, `overrides/partials/tags.html` = visible link):
- **Redirect**: add a small custom transformer, `quartz/quartz/plugins/transformers/contextId.ts`, registered right after `Plugin.FrontMatter()` in `quartz.config.ts`. In-memory only (no file edits): if `frontmatter.context_id` is set and not already present in `frontmatter.aliases`, append it. This lets Quartz's existing built-in `AliasRedirects` emitter generate the `{context_id}/` redirect stub automatically for every page — the same guarantee `hook.py` provides today, including the same duplicate-context_id risk (verify none exist via a one-time grep across `docs/**/*.md` in Phase 9, mirroring what `hook.py`'s runtime warning already checks). Note: 3 files (`installation/network-setup/dhcp-server-settings.md`, `management/server/install-fogsettings.md`, `installation/network-setup/legacy-proxy-dhcp.md`) use the front-matter key `context-id` (hyphen) instead of `context_id` and already silently get no short permalink today under MkDocs — this is pre-existing, not a Quartz regression, and is not being fixed in this spike.
- **Visible "Permalink" UI**: add a small custom component, `quartz/quartz/components/ContextIdPermalink.tsx` (modeled on Quartz's existing `TagList`/`ContentMeta` components), reading `fileData.frontmatter.context_id` and rendering a "Permalink" link — wired into `quartz.layout.ts`'s per-page component list near `TagList`, mirroring where it sits today.

### Phase 7 — Branding / theme fidelity
Since `docs/.obsidian/appearance.json` is empty (`{}`), there's no saved Obsidian theme to port — branding fidelity means matching the current mkdocs-material look:
- `quartz/quartz.config.ts` → `theme.colors.lightMode`/`darkMode`: map Material's indigo primary/accent onto Quartz's palette keys (`secondary`/`tertiary`/`highlight` for accent/link roles, `light`/`dark` for backgrounds, `gray`/`lightgray`/`darkgray` for text/borders) approximating Material's `default` (light) and `slate` (dark) schemes. `theme.typography`: `header`/`body: "Roboto"`, `code: "Roboto Mono"`.
- Copy (don't move) `docs/assets/favicon.png` into Quartz's `quartz/static/` location, referenced from `quartz.config.ts` — MkDocs's own reference to the same file stays untouched.
- `quartz/quartz/styles/custom.scss` — port from `docs/assets/css/custom.css`:
  - `.red`/`.orange`/`.yellow` classes, verbatim.
  - The `.grid`/`.grid.cards` homepage card-layout CSS, retargeted from mkdocs-material's `.md-typeset` wrapper class to Quartz's actual content-wrapper class (manual one-time lookup while porting, not a mechanical copy-paste).
  - The `.permalink` sizing rule, retargeted to the new `ContextIdPermalink` component's class.
- The `{ .red }` attr_list inline-class syntax has no native Quartz equivalent, and isn't supported in Obsidian either (per the existing CSS comment) — don't build custom remark tooling for this in the spike; grep `docs/**/*.md` during Phase 9 for `{ .red }`/`{ .orange }`/`{ .yellow }` usage and just note which files use it as a documented future follow-up.

### Phase 8 — Deployment path (documented only, not implemented)
Add a `quartz/README.md` scoped to this spike, documenting (not building):
- **GitHub Pages via GitHub Actions** (recommended starting point if this graduates past spike status — zero extra third-party accounts): `npm ci && npx quartz build --directory ../docs`, publish `quartz/public/` via `actions/deploy-pages`.
- **Cloudflare Pages via GitHub Actions**: same build, `cloudflare/pages-action` — gives per-PR preview deployments at the cost of extra account/token setup.
- No `.github/workflows/*.yml` file is created in this branch.

### Phase 9 — Verification checklist
1. `cd quartz && npm run docs:serve` — confirm it builds all of `docs/` without error, including the orphan `assets/templates/metadata-template.md` and the two `assets/*/readme.md` files.
2. Confirm `docs/.obsidian/` and root `wikiArchive/` are absent from the build output.
3. Wikilinks/embeds: check `docs/index.md`, `docs/management/web/dashboard.md` — `[[file|Alias]]`, `[[file#Heading|Alias]]`, `![[image.png]]` all resolve.
4. Callouts: confirm 2-3 native `> [!note]` files render correctly; confirm (expected-fail) 2-3 `!!! type` files render as plain text — named gap, not a surprise.
5. Tags: confirm `/tags/` index and individual tag pages populate.
6. Search: confirm flexsearch returns results for a real query.
7. Graph view: confirm local + global graph render and reflect real link density — spend real time here, it's the point of the spike.
8. TOC + syntax highlighting: spot check a long page and a page with fenced code.
9. Build once **before** the README rename to confirm the predicted duplicate-page issue actually occurs; rename; rebuild; confirm each section's root URL now shows the real content.
10. context_id parity: hit `/{context_id}/` for 3-4 pages, confirm redirect to the real page; confirm the "Permalink" UI element renders.
11. Branding: side-by-side Quartz's `localhost` preview against `mkdocs serve` for the same page — palette/font/favicon/color-classes/card-grid should look reasonably close.
12. `git diff --stat` against `docs/` should show only the 16 README→index renames — nothing else in `docs/` modified.

## Critical files
- `quartz/quartz.config.ts` — plugins, theme palette/typography, ignore patterns
- `quartz/quartz.layout.ts` — Explorer sort/collapse config, Graph/Search/TOC/ContextIdPermalink component wiring
- `quartz/quartz/styles/custom.scss` — ported branding CSS
- `quartz/quartz/plugins/transformers/contextId.ts` (new) — context_id → aliases bridge
- `quartz/quartz/components/ContextIdPermalink.tsx` (new) — visible permalink UI
- `docs/` — 16 `README.md` → `index.md` renames only; all other content/frontmatter untouched
- `.gitignore` — add `quartz/node_modules`, `quartz/public`, `quartz/.quartz-cache`
- `quartz/README.md` (new) — deployment-path writeup

## Known, accepted gaps (not fixed in this spike)
- 14 files using raw `!!! type` MkDocs admonition syntax will misrender.
- 3 files with the `context-id` (hyphen) typo continue to silently lack a short permalink (pre-existing MkDocs behavior, not a regression).
- `{ .red }`/`{ .orange }`/`{ .yellow }` inline attr_list syntax has no Quartz equivalent — documented, not built.
- Two pre-existing broken links in `docs/index.md` (`knowledge-base\customization`, `development\fog_release`) are already broken under MkDocs — not this spike's concern to fix.
