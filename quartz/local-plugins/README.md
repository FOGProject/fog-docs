# Local plugins (spike-only)

The first two local plugins replicate fog-docs' `context_id` short-permalink feature under Quartz, without editing any of the 94 content files in `docs/`:

- **context-id-aliases** (transformer, runs after `note-properties`): appends each page's `context_id` front-matter value into its in-memory `aliases` list, so Quartz's built-in `alias-redirects` emitter generates a `/{context_id}` redirect stub automatically — the same guarantee `hook.py` provides today under MkDocs.
- **context-id-permalink** (component): renders a small "Permalink" link from `context_id`, mirroring `overrides/partials/tags.html`'s visible link under mkdocs-material.

A third plugin covers a separate mkdocs-material feature with no `@quartz-community` equivalent:

- **github-source-link** (component): renders "Edit this page" / "View source" links to GitHub, mirroring mkdocs-material's `content.action.edit`/`content.action.view` theme features. Takes `repoUrl`/`branch`/`contentDir` options (set in `quartz.config.yaml`) since, unlike `context_id`, there's no front-matter field to read this from.

All three are pre-built (`dist/` committed directly, no build step) since they're plain ESM JS with no compile step required — see `quartz.config.yaml`'s `plugins:` list for how they're registered as local sources.
