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

## 2. The fog-workflows sweep

The pre-commit hook is client-side — it never runs for a PR merged through
GitHub's web UI (squash, merge-commit, or rebase), so a version merged that
way can silently go stale. That gap is covered by
[`FOGProject/fog-workflows`'s `update-lang-fix-psr-and-sync-version.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/update-lang-fix-psr-and-sync-version.yml),
which despite the "version sync" shorthand keeps *three* derived things in
step — gettext translations, PSR2 formatting, and `FOG_VERSION`/`FOG_CHANNEL`
— as one job, one commit, one push per branch. They cannot be separated: a
translation or formatting fixup is itself a commit, so it changes the count
the version is derived from, and the version therefore has to be computed
after those are staged rather than racing them.

It has **two entry points**:

- **On merge.** `fogproject`'s
  `.github/workflows/sync-generated-files.yml` — a trigger stub carrying no
  logic — calls it over `workflow_call` when a PR is merged into
  `working-1.6` or `dev-branch`, so the version is correct within minutes of
  a merge instead of at the next tick. One copy of that stub lives on each of
  those branches, byte-identical; GitHub reads a `pull_request` workflow from
  the PR's *base* branch, so each copy only ever acts on merges into its own
  branch. A merged PR from a *fork* is skipped and left to the schedule —
  see below.
- **Daily at 10:10 UTC**, plus `workflow_dispatch` for a one-off or
  all-branches run — just over an hour before
  [`stable-releases.yml`](stable-release-workflow.md)'s monthly 11:11 UTC run,
  so a release day never reads a stale version. This is the only cover for
  direct pushes, for merged pull requests from forks, and for
  `rc-*`/`feature-*` branches, which are deliberately left off the merge path
  (see below).

Each run:

1. Works out which branches to act on. Given a `branch` input (the merge
   path, and `stable-releases.yml`) it takes just that one; otherwise it
   lists `fogproject`'s branches via the GitHub API and filters to the
   watched patterns (`working-1.6`, `dev-branch`, `rc-*`, `feature-*` — the
   same set the local hook covers, and **not** `stable`, see below).
2. For each match, checks out that branch, fetches the plugin tree, then
   regenerates the translation catalogue with `update-language.sh` and
   reformats `packages/web` with a pinned `php-cs-fixer` — the same
   `.githooks/lib` scripts the local hook calls, not separately-maintained
   copies. This is also the backstop for contributors whose machines lack
   `gettext`/`php-cs-fixer`, where the hook skips those steps loudly rather
   than refusing the commit.
3. Runs `fog-version.sh`, passing the same "mid-commit" flag the hook passes
   when step 2 staged something — so the version it computes already accounts
   for the commit about to exist.
4. If the third line says there's drift, runs `apply-fog-version.sh`.
5. If anything from steps 2 or 4 is staged, commits as the GitHub App bot and
   pushes directly to that branch (no PR — this is the same kind of
   mechanical correction the local hook already makes without review).
   Otherwise nothing is written, staged, or committed.
6. For `dev-branch` and `working-1.6`, updates that branch's
   `badges/<branch>.json` in fog-workflows, using its own App token scoped to
   that repo. Not `github.token`: under `workflow_call` that is the *caller's*
   token, and a `GITHUB_TOKEN` cannot write to another repository.

The merge path needs a stub file in `fogproject` because GitHub Actions has
no cross-repo merge trigger — something has to live there to react to the
event. The scheduled path needs nothing propagated: it discovers branches
itself via the API, so a new `feature-*`/`rc-*` branch is covered
automatically the next time the schedule fires.

`rc-*` and `feature-*` are deliberately left off the merge path. `rc-*`
especially: the formula increments an RC off the *committed* suffix rather
than off a commit count, so it reports drift on every run by design (only
`head` mode special-cases that), and syncing it per merge would bump the RC
suffix on every merge. The daily tick keeps that to at most one per day.

Keeping the version correct within minutes of a merge does cost one bot
commit per merged PR on `working-1.6`/`dev-branch`. That is inherent rather
than incidental — the version *is* the commit count, so a merge changes what
it should be — and it is a deliberate trade against the older "daily bounds
how often this can run at all" position in *Incident history* below. One
knock-on: `stable`'s version is computed from `master..dev-branch`, so it now
advances faster. That is larger, not wrong; the count is what the version is
defined as.

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

#### Why the merge trigger isn't a repeat of it

The merge path described above reacts to repository activity, which is what
the reverted stub did — so the difference is worth stating plainly rather
than trusting that it will be remembered.

The rule that came out of the incident is not "the trigger must be a cron".
It is that **version syncing must not be triggered by any event the sync bot's
own push can raise**. A cron passes that test because it cannot see what was
last pushed. `push` fails it: the bot pushes its fixup directly to the branch,
the trigger fires, and the workflow feeds itself. A merge event —
`pull_request: types: [closed]` — passes it for a different reason: a direct
push is not a PR merge, so the bot cannot raise the event that would call the
workflow again.

So the loop is closed by the shape of the event, not by an actor-name guard
that has to be kept correct as bot identities change. The two fixes above
still hold underneath it: the two-pass anticipation means a fixup is right
the instant it lands, and the translation regen is byte-idempotent
(`--omit-header --no-location`, sorted and unwrapped), so a second look at an
unchanged tree finds nothing to do. Even without the trigger's structural
guarantee those would converge; with it, there is no second run to converge.

Apply that one question to any new trigger, rather than pattern-matching on
this list of examples.

#### A second question: which ref is the trigger read from?

Safety is not the only thing that decides whether a trigger works, and the
first attempt at the merge path got this wrong. It used
`pull_request_target`, which is the obvious choice because it is the variant
that receives secrets on a fork PR — and it never fired once.

GitHub reads a `pull_request_target` workflow from the repository's **default**
branch, which here is `stable`, rather than from the pull request's base
branch. A stub living on `working-1.6` and `dev-branch` is therefore never
consulted, however correct it is: it did not appear in the repository's
Actions workflow list at all, and four pull requests merged into
`working-1.6` without producing a run. Most events behave this way —
`schedule` and `workflow_dispatch` among them. `push`, `create` and
`pull_request` are the ones that resolve per-ref.

`pull_request` is what the stub uses now, for exactly that reason. The cost is
that `pull_request` withholds secrets from a fork PR, so the App token cannot
be minted there; the stub skips merged fork PRs with a same-repo guard and the
daily schedule picks them up, the same way it covers direct pushes.

Worth checking deliberately, because a workflow that is correct but never runs
looks identical to one that ran and found nothing to do. Confirm a new trigger
actually produced a run.

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
tagging, release notes, syncing `stable` back into `dev-branch`). The sweep
above deliberately excludes `stable` on both of its entry points — the
schedule's branch filter skips it, and the merge stub's allowlist names only
`working-1.6` and `dev-branch` — so the two mechanisms never fight over the
same branch, and the schedule runs early enough in the day to stay ahead of
it.

One interaction worth knowing: that last step, syncing `stable` back into
`dev-branch`, is done by merging a PR whose base is `dev-branch`, so it trips
the merge stub and re-syncs `dev-branch` once the release lands. That is
correct — the commit count really did change — and it cannot loop, because
the sync's own push is not a PR merge. The earlier `dev-branch → stable`
merge has `stable` as its base, which is not in the allowlist, so it does
nothing.

See [Fog Release](fog-release.md) for the manual side of cutting a release
(kernel/init/iPXE updates); this page covers only how the version *string*
itself stays correct.
