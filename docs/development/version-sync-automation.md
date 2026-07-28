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
than being bumped by hand. Three separate mechanisms keep that computed value
in sync with what's actually committed, each covering a different branch and
a different way changes land on it.

## 1. The local pre-commit hook

`.githooks/pre-commit` is the source of truth for the version formula. Every
local commit on `working-1.6`, `dev-branch`, `rc-*`, and `feature-*` branches
recomputes `FOG_VERSION`/`FOG_CHANNEL` and stages the change as part of that
commit. This is what most contributors experience day-to-day.

## 2. The fog-workflows backstop

The pre-commit hook is client-side — it never runs for a PR merged through
GitHub's web UI (squash, merge-commit, or rebase), so a version merged that
way can silently go stale. This is backstopped across two repos:

- **[`FOGProject/fog-workflows`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/check-fog-version.yml)**
  holds all the actual logic, as a reusable (`workflow_call`) workflow. It
  independently recomputes the expected version/channel using the same
  formula as the pre-commit hook, compares it against what's actually
  committed, and — if they disagree — commits the fix **directly** to the
  branch (no PR, since this is the same kind of mechanical correction the
  hook already makes without review).
- **`FOGProject/fogproject`**'s own
  [`.github/workflows/check-fog-version.yml`](https://github.com/FOGProject/fogproject/blob/dev-branch/.github/workflows/check-fog-version.yml)
  is a thin, push-triggered stub that delegates to the fog-workflows
  reusable workflow via `uses:`. It only exists because GitHub Actions has
  no native cross-repo `push` trigger — some file has to live in `fogproject`
  to react to pushes there, but it should rarely need to change once in
  place.

This backstop watches `working-1.6`, `dev-branch`, `rc-*`, and `feature-*` —
the same branches the pre-commit hook covers. **It intentionally does not
watch `stable`** (see below). Because GitHub resolves a push-triggered
workflow from the copy of the file that exists on the branch receiving the
push, the stub has to be present on every branch being watched; new
`feature-*`/`rc-*` branches cut from `dev-branch` inherit it automatically,
but any long-lived branch not descended from `dev-branch` needs it added by
hand.

## 3. stable-releases.yml

`stable`'s version is owned entirely by fog-workflows'
[`stable-releases.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/stable-releases.yml),
which drives the whole release flow (validation, tagging, release notes,
syncing `stable` back into `dev-branch`). The version-sync backstop above
deliberately excludes `stable` so the two mechanisms never fight over the
same branch.

See [Fog Release](fog-release.md) for the manual side of cutting a release
(kernel/init/iPXE updates); this page covers only how the version *string*
itself stays correct.
