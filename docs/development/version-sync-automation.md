---
title: Version Sync Automation
description: How FOG_VERSION/FOG_CHANNEL are kept in sync across branches
context_id: version-sync-automation
aliases:
    - Version Sync Automation
    - FOG_VERSION automation
tags:
    - development
    - release
    - automation
---
# Version Sync Automation

`FOG_VERSION` and `FOG_CHANNEL` (defined in
`packages/web/lib/fog/system.class.php`) are computed from git state — the
current branch name, distance from the last tag, and commit counts — rather
than being bumped by hand. See the main repo's README ("Versioning and
branches") for the version format itself
(`{CodeBaseMajor}.{Major}.{Minor}.{Patch}`) and what each branch represents.
This page covers how the version *string* stays correct on each branch
without anyone bumping it by hand.

## The formula lives in one script, split from the write

`.githooks/lib/fog-version.sh` is the single source of truth for the formula.
Given a branch name, it computes `FOG_VERSION`/`FOG_CHANNEL` and prints three
lines: the version, the channel, and whether that differs from what's
currently committed (`true`/`false`). It touches no files — purely a
function of git state, safe to run ad hoc (locally or in CI) without leaving
a dirty working tree behind.

`.githooks/lib/apply-fog-version.sh <version> <channel>` is the only thing
that writes `system.class.php` — two `sed` calls, nothing else. Callers
(the local hook, CI) run `fog-version.sh`, and only call `apply-fog-version.sh`
when the third line says `true`. This split exists so:

- the formula (the genuinely error-prone part — see *Incident history*
  below) and the write (mechanical, effectively foolproof) each live in
  exactly one place, and
- nothing gets written, staged, or committed at all when there's nothing to
  fix, instead of always writing and checking `git diff` afterward to
  decide whether to commit.

The formula per branch prefix:

| Branch prefix | Channel | Version scheme |
|---|---|---|
| `dev` (`dev-branch`) | *(none)* | `{tag base}.{commits since master}` |
| `stable` | *(none)* | Same as `dev`, but counted from `dev-branch` instead of `HEAD` |
| `working` (`working-1.6`) | Beta | `{branch suffix}.0-beta.{commits since master}` |
| `feature` (`feature-*`) | Feature | `{branch suffix}.0-feature.{commits since master}` |
| `rc` (`rc-*`) | Release Candidate | `{branch suffix}.0-RC-{n}`, where `n` increments by 1 from whatever's currently committed |

`dev-branch` and `stable` deliberately carry **no `FOG_CHANNEL` line at all**
— a clean version string with no channel text, by design. This isn't an
oversight; don't add one. `working`/`feature`/`rc` branches do show a channel
label. Because of this, drift detection only compares channel when a channel
line actually exists on that branch — otherwise every check on `dev-branch`
would find "drift" against an always-empty value that was never supposed to
be there.

The `rc` case is intentionally different from the others: it's a manual
per-change counter (each real change to a release candidate bumps `-N` by
one), not a commit count. That's a deliberate choice for how release
candidates are numbered, not something to make consistent with the
count-based branches. (It shares the same "anticipate the commit" flaw the
count-based branches used to have — every check proposes `current + 1`
regardless of whether a real change happened, so once an `rc-*` branch
exists this will need the same kind of fix the count-based branches already
got. No `rc-*` branch has existed yet to force the issue.)

## 1. The local pre-commit hook

`.githooks/pre-commit` calls `fog-version.sh` on every local commit to
`working-1.6`, `dev-branch`, `rc-*`, and `feature-*` branches. If the third
line says there's drift, it calls `apply-fog-version.sh` and stages the
result as part of that same commit; otherwise it does nothing. This is what
most contributors experience day-to-day, and it's why a version bump
usually rides along silently inside an otherwise-unrelated commit rather
than showing up as its own change.

## 2. The fog-workflows daily sweep

The pre-commit hook is client-side — it never runs for a PR merged through
GitHub's web UI (squash, merge-commit, or rebase), so a version merged that
way can silently go stale. This is backstopped by a single scheduled
workflow:
[`FOGProject/fog-workflows`'s `check-fog-version.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/check-fog-version.yml)
runs daily at 10:10 UTC (plus `workflow_dispatch` for a one-off or
all-branches run) — just over an hour before
[`stable-releases.yml`](stable-release-workflow.md)'s monthly 11:11 UTC run,
so a release day never reads a stale version. Each run:

1. Lists `fogproject`'s branches via the GitHub API and filters to the
   watched patterns (`working-1.6`, `dev-branch`, `rc-*`, `feature-*` — the
   same set the local hook covers, and **not** `stable`, see below).
2. For each match, checks out that branch and runs its own copy of
   `fog-version.sh` — the same script the local hook calls, not a
   separately-maintained copy of the formula.
3. If the third line says there's drift, runs `apply-fog-version.sh` and
   pushes a fixup commit directly to that branch (no PR — this is the same
   kind of mechanical correction the local hook already makes without
   review). Otherwise nothing is written, staged, or committed.

There's no stub file living in `fogproject` for this — the workflow discovers
branches itself via the API, so a new `feature-*`/`rc-*` branch is covered
automatically the next time the schedule fires, with nothing to propagate or
forget to add.

Daily rather than hourly exists specifically to bound how often this can
ever run at all — see *Incident history*.

### Run visibility

Each matrix instance writes its own outcome — fixed (old → new version), or
already correct — to `$GITHUB_STEP_SUMMARY`. GitHub renders every job's
summary together on the run's Summary page, so the state of every watched
branch is visible from one screen without opening individual job logs.
`discover-branches` also lists what it found watching, so a run's scope is
visible up front too.

### Why a fixup commit anticipates its own `+1`

A fixup commit is itself a real commit on the branch, so if it simply wrote
"the value that's correct right now" it would be wrong the instant it lands
— the next check would see the fixup commit itself as one more commit than
what got written, and "fix" it again. `fog-version.sh` avoids this with a
two-pass compute: first with the raw commit count; if that already matches
what's committed (the third line is `false`), nothing happens. If it
doesn't, it recomputes once more with the count incremented by one — the
value that will actually be true once this fix exists — and that's what
gets applied. This converges in exactly one commit no matter how large the
gap is, and is dynamic (a real recount every run), not a fixed offset
applied forever.

### Incident history (2026-07-28)

An earlier version of this workflow didn't anticipate its own commit. It
lived as a push-triggered stub in `fogproject` calling a reusable workflow in
`fog-workflows`, and its commit-count formula counted its own prior fixup
commits as real drift. A bot-authored push re-triggered the push-triggered
stub, which recomputed a value one higher than it had just committed, and
pushed another fixup — 30 commits landed on `dev-branch` in about 20 minutes
before it was caught. Moving to a schedule trigger (instead of push) removed
the immediate retrigger, and the two-pass anticipation above removed the
underlying non-convergence, which would otherwise have just repeated once
per scheduled run instead of once per push. The ~150 leftover fixup commits
from that incident were left in `dev-branch`/`working-1.6` history rather
than rewritten away; `stable-releases.yml`'s changelog generation excludes
them by commit-message pattern so they don't spam release notes, but they're
still there in `git log` for anyone who needs to look.

Two further refinements landed the same day, both about *how often* and
*how visibly* this runs rather than the formula itself:

- **`fog-version.sh` used to write `system.class.php` itself**, so running
  it for any reason — including a future "detect only, don't fix" use —
  mutated the working tree as a side effect. Splitting it into a pure
  compute (`fog-version.sh`) and a separate write (`apply-fog-version.sh`),
  gated on the compute step's own drift signal, means nothing gets written
  at all when nothing needs to change.
- **Hourly was excessive** for how rarely real drift actually occurs — every
  run that found nothing to fix was still real CI time spent for no reason,
  and any run that did find drift was one more bot commit than necessary if
  it happened to repeat before a human noticed. Daily (at 10:10 UTC, ahead
  of the monthly release check) caps any real fixup to at most one commit
  per branch per day.

## 3. stable-releases.yml

`stable`'s version is owned entirely by fog-workflows'
[`stable-releases.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/stable-releases.yml)
(see [Stable Release Workflow](stable-release-workflow.md) for how that
pipeline works end to end), which drives the whole release flow (validation,
tagging, release notes, syncing `stable` back into `dev-branch`). The daily
sweep above deliberately excludes `stable` so the two mechanisms never fight
over the same branch, and runs early enough in the day to stay ahead of it.

See [Fog Release](fog-release.md) for the manual side of cutting a release
(kernel/init/iPXE updates); this page covers only how the version *string*
itself stays correct.
