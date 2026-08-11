---
title: FOS Release Workflows
description: How the FOS repo's GitHub Actions build and publish kernels/inits, and how an experimental release becomes the official one
context_id: fos-release-workflows
aliases:
    - FOS Release Workflows
    - Experimental Release
    - Promoting a FOS experimental release
tags:
    - development
    - release
    - automation
    - fos
---
# FOS Release Workflows

[`FOGProject/fos`](https://github.com/FOGProject/fos) — the Buildroot/kernel
build repo covered in [Fog Release](fog-release.md) — publishes its kernels and
inits through three GitHub Actions workflows rather than the `dev-branch` →
`stable` PR pipeline described in
[Stable Release Workflow](stable-release-workflow.md). FOS has no `dev-branch`;
every workflow here builds directly from whatever ref is checked out (normally
`master`) and publishes straight to a tagged GitHub release.

- [`create_experimental_release.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/create_experimental_release.yml)
  — on-demand, partial-build, prerelease. This is the workflow that actually
  gets used, including as the basis for the "official" release (see below).
- [`create_release.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/create_release.yml)
  — named "Create Latest/Official Release", designed as the full-build/official
  path, but it has **never once been run** (verified via the Actions API).
- [`make_usb.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/make_usb.yml)
  — intended to react to any published release and attach a bootable USB
  image, but has fired exactly once in the repo's history, and that run
  failed.

## Experimental Release

Triggered by hand (`workflow_dispatch`) with six boolean inputs — init and
kernel, each for `arm64`/`x64`/`x86` — so a maintainer can build just the
piece under test (e.g. only the arm64 kernel after a driver change) instead of
everything. `input_checks` fails the run if every input is left unchecked.

Only the selected `build_kernel_*`/`build_initrd_*` jobs run; the init jobs
additionally restore a Buildroot download cache and an arch-specific ccache
(keyed on `build.sh`'s hash and the run ID) to keep iteration fast. The final
`release` job runs once every requested build job has finished, gated on
`!contains(needs.*.result, 'failure') && !contains(needs.*.result,
'cancelled')` — a job that was never requested is neither failed nor
cancelled, so skipping components doesn't block the release.

The release it publishes is deliberately marked as **not** the "real" one:

- Tag: `EXP_<UTC timestamp>` (e.g. `EXP_20260730-141502`).
- Name: `Experimental release from <UTC date/time>`.
- `prerelease: true`, and the body is prefixed with an explicit backup warning.

This is the mechanism for getting a build in front of the community — testers
install it manually — without it ever being mistaken for, or picked up by,
tooling that looks for the latest non-prerelease/official release.

## Create Latest/Official Release

The workflow actually named **"Create Latest/Official Release"**
(`create_release.yml`) is built to always build all six kernel/init
combinations — there is no per-component selection here — and only proceed to
`release` if every one of those six jobs succeeds (plain `needs:`, no
`always()` override, unlike the experimental workflow).

Two `workflow_dispatch` inputs are designed to decide what kind of release
comes out:

| `is_official_release` | `official_fog_version` | Result |
|---|---|---|
| unchecked | *(must be blank)* | Rolling release, tag `<YYYYMMDD>`, name `Latest from <date>` |
| checked | *(required)* | Official release, tag and name both the given version, name `FOG {version} kernels and inits` |

`input_checks` enforces that pairing (version filled in iff the checkbox is
set) before anything builds.

**In practice, this workflow has never been run.** Checking its GitHub Actions
history directly (`gh api repos/FOGProject/fos/actions/workflows/49199525/runs`)
shows `"total_count": 0` — zero runs, ever, since it was added in February
2023. Every "Latest from …"/official-looking release actually published (see
below) was produced a different way. Treat this workflow as designed-but-unused
rather than as the real release path, and see the runner-image note at the end
of this page before ever dispatching it for real.

## How a release actually gets made official

The rolling "Latest from …" release name is called out in `create_release.yml`'s
own comments as load-bearing — **FOG's Kernel Update page parses that exact
release-name format** — but the release that actually carries that meaning
(the repo's newest non-prerelease release) is produced by hand, by editing an
**Experimental Release**'s output in place rather than by dispatching the
dedicated workflow:

1. Dispatch **Experimental Release** as usual (all six components, or just the
   ones under test). It builds and auto-publishes its normal
   `EXP_<UTC timestamp>` prerelease, with all six kernel/init assets and their
   `.sha256` files attached.
2. Once that build is confirmed good, edit that **same** release in place:
   change its tag to the plain rolling-release form (e.g. `EXP_20260726-203912`
   → `20260730`), rename the title (e.g. `Release 20260730`), and clear the
   "Set as a pre-release" checkbox. No files are re-uploaded — the six assets
   that experimental run already built and attached become the official
   release's assets untouched.

This was confirmed directly from a real example: the `20260730` release
(published 2026-07-26) has `author: github-actions[bot]` and a `created_at`
that matches — to the second — the commit date of the `master` HEAD that an
`Experimental Release` run (dispatched by a maintainer, `run:30216684381`)
built from that same day; the release object is the bot-created prerelease
from that run, edited afterward. GitHub's release `created_at` reflects the
tagged commit's date rather than the API-call time, which is what makes this
identifiable after the fact.

Editing the release like this only works cleanly **the same day** (or soon
after) the experimental build finished: `buildFilesystem()` in `build.sh`
stamps `initversion` into `funcs.sh` with the build's own date
(`export initversion=$(date +%Y%m%d)`), so retagging a much older experimental
release as today's "Latest" would ship an init whose embedded version string
no longer matches the release date.

There is nothing to separately clean up — the experimental prerelease doesn't
keep existing under its old `EXP_*` tag once retagged; it *becomes* the
official release object.

## USB image attachment (currently not working)

`make_usb.yml` is written to listen for `release: published`, intending to
build a bootable USB image from the release's own assets
(`create-usb-image.sh` against
`https://github.com/<repo>/releases/download/<tag>`) and attach `fos-usb.img`
back onto that same release. In practice this does not happen:

- It has fired exactly **once** in the repo's entire history
  (2026-07-05), and that run **failed**.
- It does **not** fire for a release that's promoted by editing an existing
  prerelease (the method above) — GitHub only sends the `published` action
  when a release is first published, not when a prerelease is later flipped
  to a full release, so the retag-in-place method described above never
  triggers it.
- Confirmed on the live `20260730` release: its only assets are the six
  kernel/init files and their checksums — no `fos-usb.img`.

So no FOS release currently ships an automatically-attached USB image; a USB
image today would have to be built and attached by hand with
`create-usb-image.sh` if one is needed.

## If you do want to dispatch Create Latest/Official Release for real

Since it's never run, nothing here is proven — this is a static read of the
YAML, not a live result:

- No structural blockers found: repo-level `default_workflow_permissions` is
  `write`, so the implicit `GITHUB_TOKEN` can create a release with no explicit
  `permissions:` block, same as the (working) Experimental Release workflow.
  The kernel/Buildroot-version extraction and input-pairing validation are
  byte-identical to logic Experimental Release already runs successfully.
- It runs on `ubuntu-22.04`, which GitHub began deprecating on 2026-09-17
  (full removal 2027-04-17) — jobs will start being intermittently failed
  during that window. Experimental Release was already moved to `ubuntu-24.04`
  in the same commit that added it; this workflow was not.
- Its pinned action versions are two majors behind Experimental Release's
  (`actions/checkout@v4` vs `@v6`, `upload`/`download-artifact@v4` vs
  `@v7`/`@v8`, `softprops/action-gh-release@v2` vs `@v3`) — nothing currently
  broken, just a sign it hasn't been touched since 2024-04-03.
- Unlike Experimental Release, its filesystem-build jobs have no Buildroot
  download/ccache caching, so a real run does a fully cold build for all
  three architectures — expect it to run considerably longer and be more
  exposed to network flakiness than the experimental builds you've actually
  been running.

## Related

- [Fog Release](fog-release.md) — the manual kernel/Buildroot/iPXE version-bump
  process that normally precedes a FOS release; that page's "FOS kernel" and
  "FOS init" sections describe updating `configs/kernel*.config`/
  `configs/fs*.config`, which is what these workflows then build and publish.
- [Stable Release Workflow](stable-release-workflow.md) — the analogous
  promotion pipeline for `fogproject` itself. Unlike FOS, that repo promotes
  through a `dev-branch → stable` PR gated on install-validation tests; FOS
  has no equivalent branch model or automated test gate — promotion here is
  the manual dispatch described above, with community testing of the
  experimental prerelease standing in for automated validation.
