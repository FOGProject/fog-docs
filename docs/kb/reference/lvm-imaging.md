---
title: LVM and Imaging
aliases:
    - LVM and Imaging
    - LVM
    - Logical Volume Manager
    - Imaging LVM Volumes
description: How FOG captures and deploys Linux LVM volumes per logical volume, which layouts are supported, and how to fall back to the old raw-blob behavior
context_id: lvm-imaging
tags:
    - imaging
    - linux
    - lvm
    - reference
---

# LVM and Imaging

Most modern Linux installers (Ubuntu, RHEL/Rocky/Alma, Fedora, openSUSE)
default to **LVM**: instead of putting filesystems directly on partitions,
they create one partition as an LVM **physical volume** (PV), group it into a
**volume group** (VG), and carve the actual filesystems out of that as
**logical volumes** (LVs) — typically a root LV and a swap LV.

FOG images these installs **per logical volume**. This is part of the FOS
imaging engine, so it applies to any FOG server version running a FOS build
that includes it.

> [!note]
> **Older FOS behavior.** FOS builds without per-LV support capture the whole
> PV partition byte-for-byte with `partclone.imager`, which has no used-block
> map for LVM — a 500 GB PV with 20 GB of data produced a ~500 GB read at
> capture. That path still exists and is what unsupported layouts fall back
> to (see below).

## What capture does

When capture finds a partition holding an LVM physical volume (detected by
content, so it works regardless of the partition's type ID), it:

1. Activates the volume group and checks the layout is supported (see
   below).
2. With a resizable image type, shrinks each ext logical volume's
   filesystem before capture — the same "Resizing filesystem" step flat
   partitions get — and expands it back on the source machine afterwards.
   This is what lets the image deploy to smaller disks (see
   [Sizing](#sizing-deploying-to-different-disk-sizes) below).
3. Records the PV/VG/LV layout — names, UUIDs, sizes, and how small each
   volume can go — in two small metadata files stored with the image
   (`dNpM.lvm` and `dNpM.lvm.vgcfg`).
4. Captures **each logical volume individually** with the partclone type
   matching its filesystem, used blocks only — the same way a plain
   partition is captured. Each LV becomes its own file in the image
   (`dNpM.<lvname>.img`).
5. Swap LVs are not imaged at all; only their UUID is recorded, exactly like
   swap partitions.

Image size and capture time become proportional to the **data in the logical
volumes**, not the size of the PV partition.

## What deploy does

Deploy recreates the partition, rebuilds the PV and VG from the recorded
metadata, restores each logical volume's filesystem, and regenerates swap
LVs. On a target the same size as (or larger than) the original, **every
UUID is preserved** — physical volume, volume group, logical volumes,
filesystems, and swap — so `/etc/fstab`, GRUB configs, and initramfs
references in the deployed OS keep working without modification. What
happens on other target sizes is covered in
[Sizing](#sizing-deploying-to-different-disk-sizes) below.

Deploy failures are treated as fatal: the task stops with a message rather
than leaving a half-restored volume group that might appear to boot.

## Supported layouts

Per-LV imaging handles the layout desktop and server installers create by
default:

- **one volume group** on the PV,
- the VG lives **entirely on that one PV**, and
- all logical volumes are **linear** (plain LVs — the default).

Anything else falls back to the old raw capture of the whole PV partition —
the pre-existing behavior, not a failure. The capture log tells you when
this happens and why:

```
 * LVM layout is not supported for per-LV capture: volume group vg0 spans 2 physical volumes
 * Falling back to raw capture of the whole physical volume
```

Layouts that fall back:

- **Multi-PV volume groups** — a VG spanning two or more disks/partitions.
- **Thin pools, RAID/mirror LVs, cache LVs, snapshots** — any non-linear LV
  in the VG.
- **A PV with no volume group** on it.

A raw-captured PV deploys the same way it did before: byte-for-byte, only
onto a partition of identical size (in practice this means the
*Multiple Partition Image - All Disks* image type).

Two more cases worth knowing:

- **LUKS inside an LV** (e.g. Ubuntu's "encrypt with LVM" option) is fine —
  the encrypted LV is captured raw, but only at the LV's size, and restores
  working.
- **Whole-disk PVs** (a PV created directly on `/dev/sdb` with no partition
  table) are not detected and not captured. This is unchanged from before.

## Sizing: deploying to different disk sizes

With the *Single Disk - Resizable* image type, LVM images resize to fit
the target disk, the same way flat partitions do. What happens depends on
the target's size relative to the source:

- **Same size** — the volume group is restored exactly as it was, every
  UUID preserved.
- **Larger** — the volume group is restored from its original metadata,
  then the PV partition and physical volume grow into the extra space,
  which is distributed among the non-swap logical volumes **proportionally
  to their original sizes**. Swap LVs stay their original size. Every UUID
  is preserved here too.
- **Smaller** — the volume group is rebuilt with the standard LVM tools at
  each volume's recorded minimum size plus a proportional share of whatever
  room the target has beyond that. The VG and LV **names**, the PV UUID,
  the filesystem UUIDs, and swap UUIDs are all preserved, so `/etc/fstab`,
  GRUB, and initramfs references keep working; the VG and LV UUIDs
  themselves are regenerated (nothing in a standard install references
  those).
- **Smaller than the recorded minimum** — the deploy refuses with a message
  stating the minimum, before anything is written to the disk.

Because a per-LV-captured PV is itself resizable, *Single Disk - Resizable*
no longer needs a separate resizable non-LVM partition on the disk — a
disk that is only EFI + PV works.

Two caveats:

- **Images captured before resize support** (or on a FOS build without it)
  record no minimum sizes, so they deploy to same-size-or-larger disks
  only; a smaller target is refused with a message saying to recapture.
  Recapturing with a current FOS makes the image shrinkable.
- **With the *Multiple Partition* image types** nothing is resized: the
  volume group is restored at its original size and, on a larger disk, the
  extra space is left unallocated after the PV partition — you can expand
  into it manually (`growpart`/`pvresize`/`lvextend`) after deploy.

## Multicast is not supported yet

The multicast sender does not yet know about per-LV image files, so a
multicast deploy of an LVM image stops with:

```
Multicast deploy of LVM images is not supported yet, deploy unicast
```

Deploy LVM images with **unicast** tasks (or group deploys, which are
unicast per host).

## Reverting to the old behavior: `skiplvm=1`

If per-LV capture misbehaves on some machine, add `skiplvm=1` to the host's
**Kernel Arguments** (Host Management → the host → *Host Kernel Arguments*)
and capture again. FOS then treats the PV partition exactly as older
versions did: one raw image of the whole partition. Remove the argument to
get per-LV behavior back.

## Image compatibility

- **Old images deploy unchanged.** An image captured before per-LV support
  has a raw PV image file and no LVM metadata files, so deploy takes the
  raw path it always has.
- **New images need a current FOS.** An LVM image captured with per-LV
  support cannot be deployed by an older FOS client — keep client (kernel +
  init) and images moving forward together, as with any FOS feature. A
  deploy will also refuse, rather than guess, if it meets metadata written
  by a **newer** FOS than the one deploying:

```
Image was captured with a newer LVM format (LVMFORMAT 3), update FOS
```

## See also

- [[images|Image Management]] — image types and their constraints
- [[capture-an-image|Capture an Image]]
- [[deploy-an-image|Deploy an Image]]
- [[sector-size-imaging|Sector Sizes and Imaging]] — the other geometry
  constraint on deploys
