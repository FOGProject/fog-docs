---
title: Sector Sizes and Imaging
aliases:
    - Sector Sizes and Imaging
    - Logical Sector Size
    - 4Kn
    - 512e
description: Why an image's logical sector size must match the disk you deploy it to, what FOG does when they differ, and when an NVMe target can be reformatted to match
context_id: sector-size-imaging
tags:
    - imaging
    - disks
    - nvme
    - 4kn
    - reference
---

# Sector Sizes and Imaging

Every disk reports two sector sizes: a **logical** sector size (the unit the
operating system reads and writes in) and a **physical** sector size (the unit
the drive actually stores data in). For imaging, the one that matters is the
**logical** sector size.

- **512n** — 512-byte logical, 512-byte physical. Traditional drives.
- **512e** — 512-byte logical, 4096-byte physical. Most current SATA/SAS drives.
  As far as FOG is concerned these behave exactly like 512n: the logical size is
  512.
- **4Kn** — 4096-byte logical, 4096-byte physical. Common on enterprise NVMe and
  some large SAS drives.

You can read a disk's logical sector size from a FOS shell (or any Linux host)
with `blockdev --getss /dev/sdX`, which prints `512` or `4096`.

> [!important]
> **512n and 512e mix freely.** An image captured on a 512e disk deploys fine to
> a 512n disk and the reverse, because both use a **512-byte logical** sector. The
> problem described below is only between **512-byte-logical** disks and **4Kn**
> (4096-byte-logical) disks.

## Why a mismatch breaks imaging

FOG captures partition contents with partclone and captures the partition table
with sfdisk. Both record geometry in the source disk's **logical sectors**:

- the partition table stores each partition's start and length in LBA units
  (logical sectors), and
- each filesystem's own metadata bakes in the sector size it was created with.

On deploy, FOG restores that table and those filesystems **verbatim** — it does
not, and cannot safely, translate the numbers from one sector size to another. So
if you capture on a 4Kn disk and deploy to a 512-byte disk (or the reverse), the
partition offsets land in the wrong place and the filesystems describe a geometry
the disk doesn't have. The result is an unmountable, unbootable disk — often with
no obvious error at deploy time.

There is no reliable way to convert an image between logical sector sizes after
capture. The image has to be deployed to a disk with the **same logical sector
size** it was captured on.

## What FOG does about it

FOS checks for this before it touches the target disk. This is part of the FOS
imaging engine, so it applies to any FOG server version running a FOS build that
includes it. When FOS begins a partition-table restore it compares:

- the **image's** sector size, read from the stored sfdisk dump's `sector-size:`
  line, against
- the **target disk's** logical sector size from `blockdev --getss`.

If both are known and they differ, FOS **stops the deploy** rather than write an
unbootable disk. The message names both sizes, for example:

```
Sector size mismatch
   Image was captured on a disk with 4096-byte logical sectors, but /dev/nvme0n1
   uses 512-byte logical sectors.
   Partition-table and filesystem geometry cannot be translated between logical
   sector sizes, so this image cannot be deployed to this disk.
   Deploy this image only to a disk with 4096-byte logical sectors, or capture a
   new image on a disk with 512-byte logical sectors.
```

This is a refusal, not a corruption — nothing has been written to the disk at
this point.

### NVMe targets can be reformatted to match

NVMe namespaces can often be **low-level reformatted** to a different logical
sector size, because the drive exposes one or more selectable "LBA formats." When
the target is an NVMe device and it exposes an LBA format that matches the image's
sector size, FOS reformats it to match instead of simply refusing:

```
 *** Logical sector-size mismatch on /dev/nvme0n1 ***
   This image was captured with 4096-byte logical sectors.
   /dev/nvme0n1 is an NVMe device that exposes a matching 4096-byte LBA format (lbaf 1).
   FOS will LOW-LEVEL REFORMAT this namespace to 4096-byte sectors so the image can deploy.
   This ERASES the drive (the deploy would erase it regardless) and cannot be undone.

 You have 60 seconds to power off this computer to cancel!
```

- FOS counts down for **60 seconds**. To cancel, **power the machine off** during
  the countdown — nothing has been changed yet.
- If you let it run, FOS reformats the namespace with `nvme format`, confirms the
  new logical size by re-reading the disk, and then continues the deploy. If the
  reformat doesn't take, FOS refuses instead of proceeding.
- The reformat **erases the namespace**. This is not extra data loss — a deploy
  overwrites the disk anyway — but it does mean there is no "undo."

> [!note]
> This only applies to **NVMe**. SATA and SAS drives cannot be re-sectored by
> FOG: a 4Kn SATA/SAS disk can only receive a 4Kn image, and a 512-byte disk can
> only receive a 512-byte image. Some NVMe drives are **4Kn-only** and expose no
> 512-byte LBA format; those can only receive 4Kn images. In every case where the
> geometry can't be matched, FOS refuses rather than produce a bad disk.

## When the check does and doesn't apply

**It applies to** normal partition-image deploys — single-disk and
multi-partition, resizable and non-resizable — in both directions (512 ↔ 4Kn).

**It does not apply to:**

- **Raw / `dd` whole-disk images.** These store no sfdisk geometry, so there is
  nothing to compare. A raw image is a byte-for-byte copy and will only work on a
  disk of matching size and geometry regardless.
- **Single-partition restores** (the "no partition table" / `nombr` path). These
  deliberately skip the partition-table rewrite, so the sector-size check is
  skipped with it.
- **Images captured by very old FOS versions.** sfdisk did not record a
  `sector-size:` line until util-linux 2.35 (around 2020). An image captured by a
  FOS older than that carries no recorded source size, so FOS allows the deploy
  rather than guess and risk a wrong refusal. Every image current FOS produces
  records the line, so recent captures are checked in both directions.

## What to do about a mismatch

- **Preferred:** capture your golden image on hardware with the **same logical
  sector size** as the machines you deploy to. If your fleet is 512-byte disks,
  capture on a 512-byte disk; if it's 4Kn, capture on 4Kn.
- **NVMe fleets:** if your targets are NVMe, let FOS reformat them to match (see
  above), or pre-format them yourself to the needed LBA format.
- **Mixed fleets:** if you deploy the same OS to both 512-byte and 4Kn hardware,
  keep **two images** — one captured on each geometry.

## See also

- [[sector-size-mismatch|Troubleshooting: deploy refused for a sector-size mismatch]]
- [[capture-an-image|Capture an Image]]
- [[deploy-an-image|Deploy an Image]]
- [[hardware|Supported Hardware]]
