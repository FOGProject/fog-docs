# research/

Exploratory research and investigation notes. **Not documentation.**

## This directory is deliberately not published

Quartz builds the site from `docs/` only. `quartz/scripts/rtd-build.mjs` returns
`repoRoot/docs` directly for the English build, and composes `translations/<lang>/`
over a copy of `docs/` for every other language. Nothing outside those two trees is
ever globbed, so anything in here is versioned in git but never appears on
<https://docs.fogproject.org/>.

`wikiArchive/` sits outside `docs/` for the same reason.

**Do not move these files under `docs/`** to "fix" the fact that they are not
published. They are not published on purpose. If a finding in here matures into
something users should read, write a *new* page under `docs/` for it rather than
relocating the research note — the two have different audiences and different
standards of certainty.

## What belongs here

- Investigation spikes and feasibility studies
- Notes that record *why* an option was rejected, so it does not get re-proposed
- Analysis that is useful to maintainers but would mislead users, because it
  describes things FOG does not do (yet, or ever)

## What does not belong here

- Anything a FOG administrator needs in order to use FOG — that is `docs/`
- Anything confidential. **Every FOGProject repository is public**, so files here
  are world-readable on GitHub. "Unpublished" means "not on the docs site", not
  "private".

## Conventions

Files here are plain Markdown. They deliberately **do not** carry the `docs/`
front-matter contract (`title`, `aliases`, `description`, `context_id`, `tags`) and
do not use wikilinks, because neither applies to content Quartz never sees — and
because carrying them would invite exactly the relocation warned against above.

Name files `YYYY-MM-DD-short-topic.md` so the date a piece of research was current
is visible without opening it. Research goes stale; documentation gets updated.
