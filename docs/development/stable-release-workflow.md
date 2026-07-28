---
title: Stable Release Workflow
description: How dev-branch changes become a tagged stable release
context_id: stable-release-workflow
aliases:
    - Stable Release Workflow
    - stable-releases.yml
tags:
    - development
    - release
    - automation
---
# Stable Release Workflow

[`stable-releases.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/stable-releases.yml)
in `FOGProject/fog-workflows` is the pipeline that turns whatever's currently
on `dev-branch` into a tagged, published `stable` release. It runs monthly
(`11 11 11 * *` — the 11th at 11:11 UTC) or on demand via
`workflow_dispatch`. See [Version Sync Automation](version-sync-automation.md)
for how the version *number* itself gets computed; this page covers what
happens once a release is actually cut.

## The flow

1. **`create-release-pull-request`** reads `FOG_VERSION` straight out of
   `dev-branch`'s `system.class.php` and compares it to the tag name of the
   latest published GitHub release. If they match, there's nothing new to
   release — the run stops here (**`no-release-needed`** posts a "nothing to
   release" note to Discord and exits). If they differ, it opens a
   `dev-branch → stable` PR titled `Stable Release PR For {version} -
   {date}`.
2. **`run-install-tests`** triggers `FOGProject/fogproject-install-validation`'s
   `run_all_distros.yml` — the full matrix of supported distros.
3. **`check-all-tests-completed-successfully`** polls that run until it
   reports `success` or `failure`, and fails the job if the distro tests
   failed.
4. On success, **`merge-after-all-tests-passed`** merges the PR
   (`dev-branch` into `stable`). On failure,
   **`close-pr-if-tests-fail`** closes the PR instead and posts a failure
   notice to Discord — nothing gets released.
5. **`tag-and-release`** (only after a successful merge) builds the release:
   - Generates base notes via GitHub's `releases/generate-notes` API.
   - Appends a `## Commits` section built from `git log`, filtering out
     merge commits, prior "Stable Release" PR commits, and
     `chore: fix stale FOG_VERSION/FOG_CHANNEL` fixup commits (see
     [Version Sync Automation](version-sync-automation.md)) — those stay in
     git history, they're just excluded from the rendered changelog so a
     run of near-identical bot commits doesn't spam the notes.
   - Appends issues closed since the previous release, and any new/updated
     GitHub security advisories — for the latter, it also **PATCHes the
     advisory itself**, appending this release's tag to
     `patched_versions`.
   - Publishes the GitHub release (`gh release create`) tagged and titled
     with the version, marked `--latest`.
6. **`sync-branches`** opens and merges a `stable → dev-branch` PR, so the
   release commit (and its tag-adjacent history) flows back into
   `dev-branch` rather than the two branches silently diverging.
7. **`discord-success`** posts the release announcement with a link to the
   GitHub release notes.

## Why it's structured this way

- **Reading the version instead of computing it**: this workflow only ever
  *reads* `FOG_VERSION` to decide whether there's something new to release —
  it never recomputes it. `stable`'s version is entirely the one already
  computed on `dev-branch` by the mechanisms in
  [Version Sync Automation](version-sync-automation.md); this workflow just
  decides when to promote it. That's also why the version-sync daily sweep
  runs at 10:10 UTC, just over an hour before this workflow's 11:11 UTC
  slot — a release day always reads a version that's current.
- **Tests gate the merge, not the version**: nothing here is a
  `pull_request`-triggered CI check. The install-validation suite runs
  *after* the release PR is opened, and only a passing run causes the merge
  to happen — a failing run closes the PR instead of leaving it open
  indefinitely.
- **The sync-back PR** exists so `stable` and `dev-branch` never drift apart
  after a release — without it, the release/tag commit created directly on
  `stable` would only ever exist there.

## Related

- [Version Sync Automation](version-sync-automation.md) — how
  `FOG_VERSION`/`FOG_CHANNEL` are kept correct on every branch, including
  `dev-branch` before this workflow ever reads it.
- [Fog Release](fog-release.md) — the manual side of a release (kernel,
  init, and iPXE binary updates) that typically happens before this
  workflow is triggered.
