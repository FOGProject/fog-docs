# Local plugins (spike-only)

These two local plugins replicate fog-docs' `context_id` short-permalink feature under Quartz, without editing any of the 94 content files in `docs/`:

- **context-id-aliases** (transformer, runs after `note-properties`): appends each page's `context_id` front-matter value into its in-memory `aliases` list, so Quartz's built-in `alias-redirects` emitter generates a `/{context_id}` redirect stub automatically — the same guarantee `hook.py` provides today under MkDocs.
- **context-id-permalink** (component): renders a small "Permalink" link from `context_id`, mirroring `overrides/partials/tags.html`'s visible link under mkdocs-material.

Both are pre-built (`dist/` committed directly, no build step) since they're plain ESM JS with no compile step required — see `quartz.config.yaml`'s `plugins:` list for how they're registered as local sources.
