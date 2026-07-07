---
title: Deploy Refused — Sector Size Mismatch
aliases:
    - Sector Size Mismatch
    - Deploy Refused Sector Size
description: What to do when a deploy stops with a "Sector size mismatch" message
context_id: sector-size-mismatch
tags:
    - troubleshooting
    - imaging
    - deploy
    - nvme
    - 4kn
---

# Deploy Refused — Sector Size Mismatch

## Symptom

A deploy task stops early — before the disk is written — with a message like:

```
Sector size mismatch
   Image was captured on a disk with 4096-byte logical sectors, but /dev/sda
   uses 512-byte logical sectors.
   Partition-table and filesystem geometry cannot be translated between logical
   sector sizes, so this image cannot be deployed to this disk.
   Deploy this image only to a disk with 4096-byte logical sectors, or capture a
   new image on a disk with 512-byte logical sectors.
```

## What it means

The image was captured on a disk whose **logical sector size** (512 or 4096
bytes) is different from the disk you're deploying to. FOG cannot translate
partition-table and filesystem geometry between the two, so it refuses rather
than write a disk that won't boot. **Nothing was written** — the target disk is
untouched.

On newer FOS builds the message also includes a line about the target's device
type, for example:

```
   /dev/mmcblk0 is an eMMC/SD device; its 512-byte logical sector size is fixed
   by the MMC/SD specification and cannot be changed. Only an image captured on
   512-byte-sector hardware can deploy to it.
```

That line tells you which side of the mismatch can be fixed: if the target's
sector size is **fixed** (eMMC/SD, UFS), recapturing on matching hardware is
the only remedy; if the target is a **virtual disk**, you can change its sector
size in the VM's disk configuration instead.

For the full explanation of why this happens — and what each device type can
and can't do — see
[[sector-size-imaging|Sector Sizes and Imaging]].

## How to fix it

Pick whichever fits your situation:

1. **Deploy to matching hardware.** Send this image to a disk with the same
   logical sector size it was captured on (the message tells you which). 512n and
   512e disks are interchangeable; 4Kn disks are not interchangeable with either.

2. **Recapture on the target geometry.** If you need this image on the current
   hardware, capture a fresh image from a machine whose disk matches, then deploy
   that image instead.

3. **Let FOS reformat an NVMe target.** If the target is an **NVMe** drive that
   supports the image's sector size, FOS offers to low-level reformat it to match
   after a 60-second cancel window. See
   [[sector-size-imaging#nvme-targets-can-be-reformatted-to-match|NVMe targets can be reformatted to match]].
   NVMe is the only device type this works for — not SATA/SAS, eMMC/SD, UFS, or
   USB targets, and not NVMe drives that are 4Kn-only. See
   [[sector-size-imaging#sector-sizes-by-device-type|Sector sizes by device type]]
   for the per-type breakdown.

4. **Virtual machine target?** The disk's logical sector size is set by the
   hypervisor, not the virtual disk itself. Change the disk's
   `logical_block_size` (QEMU/libvirt/Proxmox) to match the image and redeploy.

## Checking a disk's sector size

From a FOS shell (a debug task) or any Linux host:

```
blockdev --getss /dev/sdX     # logical sector size: 512 or 4096
blockdev --getpbsz /dev/sdX   # physical sector size
```

Match the **logical** size (`--getss`) between the image's source disk and the
deploy target.

## See also

- [[sector-size-imaging|Sector Sizes and Imaging]] — the full reference
- [[deploy-an-image|Deploy an Image]]
