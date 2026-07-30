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
  — on-demand, partial-build, prerelease.
- [`create_release.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/create_release.yml)
  — on-demand, full-build, the actual "Latest"/official release.
- [`make_usb.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/make_usb.yml)
  — reacts to any published release and attaches a bootable USB image to it.

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
(`create_release.yml`) always builds all six kernel/init combinations — there
is no per-component selection here — and only proceeds to `release` if every
one of those six jobs succeeds (plain `needs:`, no `always()` override, unlike
the experimental workflow).

Two `workflow_dispatch` inputs decide what kind of release comes out:

| `is_official_release` | `official_fog_version` | Result |
|---|---|---|
| unchecked | *(must be blank)* | Rolling release, tag `<YYYYMMDD>`, name `Latest from <date>` |
| checked | *(required)* | Official release, tag and name both the given version, name `FOG {version} kernels and inits` |

`input_checks` enforces that pairing (version filled in iff the checkbox is
set) before anything builds. The rolling "Latest from …" naming is called out
in the workflow's own comments as load-bearing: **FOG's Kernel Update page
parses that exact release-name format**, so it must not change casually.

Every artifact (experimental or official) is verified with
`sha256sum -c` before it's attached to the release, and the release body
always states the exact Linux kernel and Buildroot versions built, read
straight out of `build.sh`.

## Promoting an experimental release to official

There is **no promotion step that reuses an experimental release's
artifacts** — the two workflows share no state. Running "Create Latest/Official
Release" always rebuilds all six kernel/init images from scratch; it never
downloads, retags, or republishes anything produced by
`create_experimental_release.yml` (whose artifacts carry `retention-days: 1`
and are never referenced outside that run). This is also the only correct way
to do it: `buildFilesystem()` in `build.sh` stamps `initversion` into
`funcs.sh` with the build's own date
(`export initversion=$(date +%Y%m%d)`), so an init built today and one built
next week from the identical source are not byte-identical — copying
yesterday's experimental artifact into today's official release would ship a
stale, misleading init version.

So "promoting" an experimental build to official is a manual, three-step
process:

1. Confirm the commit that produced the validated experimental release is
   still what you want to ship (typically just `master`'s current tip — the
   experimental workflow doesn't tag or otherwise pin the source commit it
   built from beyond the run's own checkout).
2. Dispatch **Create Latest/Official Release** from that same ref. Leave
   `is_official_release` unchecked for a routine rolling release, or check it
   and supply `official_fog_version` when this is meant to be the kernel/init
   set for an actual tagged FOG version (coordinate with
   [Fog Release](fog-release.md) — the FOG-version-level release process).
3. Once the workflow publishes the release, `make_usb.yml` fires
   automatically (see below) and attaches the USB image within the same run.

There is nothing to clean up on the experimental side — its prerelease stays
in the repo's release list as a dated, clearly-marked `EXP_*` artifact and
simply stops being the newest thing once the official release publishes.

## USB image attachment

`make_usb.yml` listens for `release: published` — it fires for **every**
published release from either workflow above, prerelease or not. It runs
`create-usb-image.sh` against
`https://github.com/<repo>/releases/download/<tag>`, i.e. it downloads the
just-published release's own kernel/init assets rather than rebuilding
anything, and uploads the resulting `fos-usb.img` back onto that same release.

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
