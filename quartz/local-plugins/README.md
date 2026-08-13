# Local plugins (spike-only)

The first two local plugins replicate fog-docs' `context_id` short-permalink feature under Quartz, without editing any of the 94 content files in `docs/`:

- **context-id-aliases** (transformer, runs after `note-properties`): appends each page's `context_id` front-matter value into its in-memory `aliases` list, so Quartz's built-in `alias-redirects` emitter generates a `/{context_id}` redirect stub automatically — the same guarantee `hook.py` provides today under MkDocs.
- **context-id-permalink** (component): renders a small "Permalink" link from `context_id`, mirroring `overrides/partials/tags.html`'s visible link under mkdocs-material. The href is built with `resolveRelative(fileData.slug, context_id)` and **must stay relative** — Read the Docs serves the site under a language/version prefix (`/en/latest/` today), so a root-absolute `/{context_id}` drops that prefix and 404s, and `scripts/rtd-fix-links.mjs` can't repair it (its `fixUrl` pass skips URLs resolving outside the output dir). Don't "fix" it by prepending `cfg.baseUrl` either: that would bake `en/latest` into every page, breaking future translations/versions and pointing local dev links at production.

The rest cover mkdocs-material features with no `@quartz-community` equivalent:

- **github-source-link** (component): renders "Edit this page" / "View source" links to GitHub, mirroring mkdocs-material's `content.action.edit`/`content.action.view` theme features. Takes `repoUrl`/`branch`/`contentDir` options (set in `quartz.config.yaml`) since, unlike `context_id`, there's no front-matter field to read this from.
- **section-shortcuts** (component): a row of pill links to the top-level sections (+ Tags), pinned above the Explorer tree in the left sidebar and highlighting whichever section the current page is in. Quartz's page shell has no full-width top-bar region, so this is the closest analog to mkdocs-material's `navigation.tabs` without editing the core page frame.
- **prev-next-nav** (component): renders Previous/Next links at the bottom of the page, mirroring mkdocs-material's `navigation.footer` feature. Rebuilds the same folder/file tree the Explorer sidebar shows (same `TOP_ORDER`/`EXPLICIT_ORDER` tables — keep in sync with the Explorer's `sortFn` in `quartz.config.yaml`) and flattens it depth-first to find each page's neighbors.

All are pre-built (`dist/` committed directly, no build step) since they're plain ESM JS with no compile step required — see `quartz.config.yaml`'s `plugins:` list for how they're registered as local sources.
