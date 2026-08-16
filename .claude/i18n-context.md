# fog-docs translations — working context

The durable version of everything that used to live here is now
**`translations/SEEDING.md`** — status per language, the per-page seeding
rules, the gettext glossary method, every gotcha already paid for, and the
RTD dashboard checklist (versions, translations page, short-URL redirects).
Keep that file updated as languages land; it is the handoff document.

Related references:

- `translations/README.md` — creating the Cloudflare Workers AI account/token
  and the GitHub secret/variables that turn `.github/workflows/translate.yml`
  on (the job is gated on `vars.TRANSLATE_ENDPOINT` being set).
- `CLAUDE.md` `## Translations` — the design and the rejected alternatives.

Current state (2026-08-15): French is 99/99 and live-tested; the other six
languages are unseeded. The automated workflow is off until the Cloudflare
account exists.
