---
title: Version Sync Automation
description: How FOG_VERSION/FOG_CHANNEL are computed from git state and generated into a local file
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

`FOG_VERSION` and `FOG_CHANNEL` are computed from git state — the branch
name, distance from the last tag, and commit counts — rather than being
bumped by hand. See the main repo's README ("Versioning and branches") for
the version format itself (`{CodeBaseMajor}.{Major}.{Minor}.{Patch}`) and
what each branch represents. This page covers how the version *string*
stays correct without anyone bumping it, and how that changed in August
2026.

>[!warning] This mechanism changed in August 2026 (GH-1510, GH-1513)
>Earlier, `FOG_VERSION`/`FOG_CHANNEL` were stamped into a **tracked** line
>of `packages/web/src/Base/System.php` — by a local pre-commit hook, and
>(for `working-1.6`) by a CI job predicting the version a pull request would
>carry once merged. That broke structurally: every branch open at once
>wrote a *different* value onto the *same* line, so getting current before
>merging (which the branch ruleset requires) routinely conflicted on that
>line and had to be redone. The fix wasn't a smarter prediction — it was to
>stop tracking the value in git at all.

## The formula: unchanged, still one script

`.githooks/lib/fog-version.sh` is still the single source of truth for the
formula. Given a branch name and a mode, it computes
`FOG_VERSION`/`FOG_CHANNEL` and prints three lines: the version, the
channel, and whether that differs from the value it's comparing against
(`true`/`false`).

| Branch prefix | Channel written | Channel computed | Version scheme |
|---|---|---|---|
| `dev` (`dev-branch`) | *(none)* | Patches | `{tag base}.{commits since master}` |
| `stable` | *(none)* | Stable | Same as `dev`, but counted from `dev-branch` instead of `HEAD` |
| `working` (`working-1.6`) | Beta | Beta | `{branch suffix}.0-beta.{commits since master}` |
| `feature` (`feature-*`) | Feature | Feature | `{branch suffix}.0-feature.{commits since master}` |
| `rc` (`rc-*`) | Release Candidate | Release Candidate | `{branch suffix}.0-RC-{n}`, incrementing off whatever's currently committed |

**One vocabulary, shared with `FOG_update_channel`.** Since
[fogproject#1279](https://github.com/FOGProject/fogproject/issues/1279) the
channel label is the title-case form of the update channel a server tracks:

| Branch | `FOG_update_channel` | `FOG_CHANNEL` |
|---|---|---|
| `stable` | `stable` | Stable |
| `dev-branch` | `patches` | Patches |
| `working-1.6` | `beta` | Beta |
| `rc-*` / `feature-*` | *(none — not a track anyone follows)* | Release Candidate / Feature |

`lib/common/functions.sh` owns the update-track half and `fog-version.sh`
owns the label half; `tests/update-channel-vocabulary.test.sh` parses both
and fails if they disagree. The retired spellings `staging` and `dev` still
resolve, so existing servers keep updating — see
[[1.6/management/server/install-fogsettings|.fogsettings]].

`dev-branch` and `stable` deliberately carry **no `FOG_CHANNEL` line at
all** — a clean version string with no channel text, by design.
`working`/`feature`/`rc` branches do show a channel label. The `rc` case is
a manual per-change counter, not a commit count — a deliberate, separate
choice from the count-based branches.

## Where the version actually lives now: a generated file, not git

`packages/web/commons/version.php` carries `FOG_VERSION`/`FOG_CHANNEL` for
a git checkout. It is **generated and gitignored** — never committed, never
part of a diff, never a merge conflict. `.githooks/lib/write-version-file.sh`
writes it, run from four places:

- `.githooks/post-commit`, `post-checkout`, `post-merge` — so a working
  checkout always reports the build it's actually on, refreshed the instant
  anything moves the commit count. None of these stage anything, so unlike
  `pre-commit` they can never change what a commit contains.
- `bin/installfog.sh` — so an install from a clone stamps the exact build
  being deployed, whether or not the installer's hooks are enabled.

`packages/web/src/Base/System.php` `include`s this file when it's readable,
and falls back to release constants it carries itself when it isn't — a
source zip with no `.git`, or a checkout by someone who never enabled
hooks, still reports a truthful, if less precise, version. **That fallback
is rewritten only at an actual release**, never by a commit, a merge, or
CI. `write-version-file.sh` fails open at every step — a version string
isn't worth blocking a commit, checkout, or install over.

`bin/installfog.sh`, `bin/updatefog.sh`, and `lib/common/utils.sh` all read
the version with an `awk` for the identical `define('FOG_VERSION', '...');`
shape the generated file and the fallback both use — one parser works
against either.

## What this replaced, and why it had to change

Two writers used to stamp the tracked line in `System.php`:

- `.githooks/pre-commit`, on every local commit — **removed**, along with
  `.githooks/pre-push` (which only ever existed to refuse a push whose
  committed version had drifted; with nothing stamping a version there was
  nothing left for it to guard).
- `working-1.6`'s PR-time regeneration job (`tests.yml`'s `regen` job, via
  `fogproject-pr-regen.yml`'s `sync_version: true`), predicting the version
  a pull request would carry once its merge commit landed — **removed**.
  `fogproject`'s `tests.yml` no longer passes `sync_version` at all, and
  `.github/workflows/sync-generated-files.yml` — the merge-time backstop
  this fed into — is deleted from `working-1.6` entirely.

The problem wasn't that the prediction was wrong — it's that it could only
ever be right for the *one* pull request that merged next. Every other open
branch was left holding a different value on the same tracked line, and the
ruleset's "branches must be up to date before merging" turned that into
recurring, structural conflict:

| | |
|---|---|
| #1504 | needed three separate version commits (`4598` → `4600` → `4608`) as neighboring PRs landed |
| `3fbacbc73` | records the `System.php` conflict this caused, in its own commit message |
| #1507 / #1508 | sat open simultaneously holding `4620` and `4619` |

Worse than a plain race: getting a branch current *changed the very count
being predicted* — merging the base in added a commit, the bot's re-stamp
got rejected as non-fast-forward, merging the bot's fix added another
commit, and so on. A busy afternoon could make a PR lose that race
indefinitely with every check green. A derived value belongs in a generated
file instead — the same reasoning that keeps `commons/config.class.php`
generated rather than tracked.

Second-order effect worth knowing: a merge no longer produces a follow-up
bot commit on the base branch, so each merge now moves the base by exactly
**one** commit instead of two.

## The fog-workflows sweep still exists — for what's left

[`FOGProject/fog-workflows`'s `update-lang-fix-psr-and-sync-version.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/update-lang-fix-psr-and-sync-version.yml)
still runs daily and corrects gettext translations and PSR2 formatting on
`working-1.6`, `dev-branch`, `rc-*`, and `feature-*` — the gap the local
pre-commit hook can't close, since it never runs for a PR merged through
GitHub's web UI, and doesn't run at all for a direct push or a merged fork
PR.

**It detects the generated-version mechanism from the tree, not from a
branch name**, and skips its own version-stamping step wherever it finds
`.githooks/lib/write-version-file.sh` present: stamping a commit count into
the release fallback on a branch that generates its own version would put
the removed churn straight back. `working-1.6`'s PR-time regeneration job
makes the identical check for the same reason
([FOGProject/fog-workflows#39](https://github.com/FOGProject/fog-workflows/pull/39)).
Neither has a branch listed anywhere for this — a branch flips itself the
moment its own port of GH-1513 lands, with no workflow edit needed.

>[!warning] `dev-branch` is mid-migration as of this writing
>`dev-branch`'s pre-commit hook no longer stamps a version — that removal
>ported cleanly — but it has **not yet** received `write-version-file.sh`,
>so it has no generated-file version either. Until that lands, `dev-branch`'s
>version is written only by the sweep's legacy path (still stamping the
>tracked line in `System.php`, the way both branches worked before this
>change) and by `stable-releases.yml`'s pre-release pass. Check
>`git show dev-branch:.githooks/lib/write-version-file.sh` before trusting
>anything on this page as still-accurate for `dev-branch` specifically.

### Verification

`tests/generated-version-file.test.sh` pins the contract on branches that
have adopted it: the generated file is gitignored and untracked, its shape
is what the shell parsers expect, `System.php`'s `include` is guarded so the
generated file wins when present, and no hook writes a version into a
tracked file. Each assertion was proven to fail before being kept —
removing the `.gitignore` entry, force-adding the generated file, breaking
the generator's `define()` shape, unguarding the `include`, and making a
hook call the old tracked-file writer all fail their respective checks.

## stable-releases.yml

`stable`'s version is still owned entirely by fog-workflows'
[`stable-releases.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/stable-releases.yml)
(see [[stable-release-workflow|Stable Release Workflow]] for the full
pipeline), which drives tagging, release notes, and syncing `stable` back
into `dev-branch`. Before opening the release PR it still calls the sweep
against `dev-branch` for a full whole-tree PSR2/gettext pass — not
version-only, since `dev-branch` doesn't yet generate its own version (see
the migration note above) and this remains the last correction before a
tagged release.

See [[fog-release|Fog Release]] for the manual side of cutting a release
(kernel/init/iPXE updates); this page covers only how the version *string*
stays correct.
