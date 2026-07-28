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

## The formula lives in one script

`.githooks/lib/fog-version.sh` is the single source of truth. Given a branch
name, it recomputes `FOG_VERSION`/`FOG_CHANNEL` and rewrites
`system.class.php` in place. It deliberately does **not** `git add` or
`git commit` anything, and makes no assumption that it's running mid-commit
— that's what lets both mechanisms below share it instead of keeping two
copies of the formula that can silently drift apart (which is exactly what
happened before this was factored out — see *Incident history* below).

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
label.

The `rc` case is intentionally different from the others: it's a manual
per-change counter (each real change to a release candidate bumps `-N` by
one), not a commit count. That's a deliberate choice for how release
candidates are numbered, not something to make consistent with the
count-based branches.

## 1. The local pre-commit hook

`.githooks/pre-commit` calls `fog-version.sh` on every local commit to
`working-1.6`, `dev-branch`, `rc-*`, and `feature-*` branches, then stages the
result as part of that same commit. This is what most contributors experience
day-to-day, and it's why a version bump usually rides along silently inside
an otherwise-unrelated commit rather than showing up as its own change.

## 2. The fog-workflows hourly sweep

The pre-commit hook is client-side — it never runs for a PR merged through
GitHub's web UI (squash, merge-commit, or rebase), so a version merged that
way can silently go stale. This is backstopped by a single scheduled
workflow:
[`FOGProject/fog-workflows`'s `check-fog-version.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/check-fog-version.yml)
runs hourly (plus `workflow_dispatch` for a one-off or all-branches run). Each
run:

1. Lists `fogproject`'s branches via the GitHub API and filters to the
   watched patterns (`working-1.6`, `dev-branch`, `rc-*`, `feature-*` — the
   same set the local hook covers, and **not** `stable`, see below).
2. For each match, checks out that branch and runs its own copy of
   `.githooks/lib/fog-version.sh` — the same script the local hook calls, not
   a separately-maintained copy of the formula.
3. If the recomputed value disagrees with what's committed, pushes a fixup
   commit directly to that branch (no PR — this is the same kind of
   mechanical correction the local hook already makes without review).

There's no stub file living in `fogproject` for this — the workflow discovers
branches itself via the API, so a new `feature-*`/`rc-*` branch is covered
automatically the next time the schedule fires, with nothing to propagate or
forget to add.

### Why a fixup commit anticipates its own `+1`

A fixup commit is itself a real commit on the branch, so if it simply wrote
"the value that's correct right now" it would be wrong the instant it lands
— the next check would see the fixup commit itself as one more commit than
what got written, and "fix" it again. `fog-version.sh` avoids this with a
two-pass compute: first with the raw commit count; if that already matches
what's committed, nothing happens. If it doesn't, it recomputes once more
with the count incremented by one — the value that will actually be true
once this fix exists — and writes that instead. This converges in exactly
one commit no matter how large the gap is, and is dynamic (a real recount
every run), not a fixed offset applied forever.

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

## 3. stable-releases.yml

`stable`'s version is owned entirely by fog-workflows'
[`stable-releases.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/stable-releases.yml),
which drives the whole release flow (validation, tagging, release notes,
syncing `stable` back into `dev-branch`). The hourly sweep above deliberately
excludes `stable` so the two mechanisms never fight over the same branch.

See [Fog Release](fog-release.md) for the manual side of cutting a release
(kernel/init/iPXE updates); this page covers only how the version *string*
itself stays correct.
