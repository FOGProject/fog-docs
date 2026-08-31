---
title: "Image Management (1.5)"
aliases:
    - "Image Management (1.5)"
description: Creating and managing image objects on FOG 1.5, including what deleting an image actually cleans up on this line
context_id: "images-1.5"
tags:
    - management
    - web-management
    - web-ui
    - images
    - 1_5-legacy
---

# Image Management (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/management/web/images|1.6 version]] of this page for FOG 1.6.

Image objects in FOG are the representation of the physical files that
contain the disk or partition images saved on the FOG server.

## Creating Image objects

Image objects are created in the Images section of the FOG management
portal. Click **New Image** on the left-hand menu. An image object requires
a name and an image file path.

### Image Name and Path

- **Image Name** is the friendly name used to identify the image throughout
  the FOG UI — when assigning it to hosts, scheduling tasks, and in reports.
  Use something descriptive (for example `win11-lab` or `ubuntu-2404-base`).
- **Image Path** is the folder name, under the storage node's image
  directory (`/images` by default), where the image's files are stored. It
  must be unique. By convention it matches the image name, contains no
  spaces, and is lower-case.

### Operating System

The **Operating System** tells FOG which OS the image contains. Select the
OS that matches the source machine — FOG uses this to apply the right
handling during capture and deploy (filesystem and bootloader fix-ups
appropriate to that OS). Setting it incorrectly can leave a deployed image
unable to boot.

### Image Type

The possible partition types:

- Single Disk - Resizable
- Multiple Partition Image - Single Disk (Not Resizable)
- Multiple Partition Image - All Disks (Not Resizable)
- Raw Image (Sector By Sector, DD, Slow)

#### Single Disk - Resizable

The default choice, working in most cases and allowing deployment to
smaller disks. It copies every partition on the disk, resizing partitions
with excessive free space down to a smaller size where possible — down to
only 2GB of free space per shrunk partition, so an image taken from a 6TB
drive with only 20GB used can deploy to a drive with roughly 25GB capacity.
On the destination drive, resized partitions are intelligently expanded to
fill it.

#### Multiple Partition Image - Single Disk (Not Resizable)

Backs up all supported partitions on the first detected disk, without
resizing — the image must be restored to a disk of the same or larger
capacity. Supports NTFS drives with vendor 'restore' partitions, and Linux
systems with a GRUB boot loader and ext2/ext3/ext4/reiserfs/swap partitions
(the swap partition should be moved out of the extended partition).

#### Multiple Partition Image - All Disks (Not Resizable)

Captures all partitions from multiple disks, without resizing. If you only
want a particular partition or drive captured in a multi-drive system,
define it in the host's **General** area under **Host Primary Disk**.

#### Raw Image (Sector By Sector, DD, Slow)

>[!warning]
>This should always be the last resort.

An absolute exact copy of an entire disk, uncompressed — a 6TB disk produces
a 6TB image — and significantly slower to capture and deploy than the other
types.

>[!note]
>All of these image types can be deployed using multicast or unicast to
>clients.

### Partition

Controls how much of the disk is captured and deployed:

- **Everything** (the default) — all partitions on the disk.
- **Partition Table and MBR only** — just the partition table and master
  boot record, none of the partition contents.
- **Partition _N_ only** — a single specific partition (1 through 10).

Most images use **Everything**; the other options are for special cases
where you only need part of a disk.

### Image Manager

FOG comes with two tools ("managers") to create an image of your
disks/partitions: partclone and partimage. In early versions partimage was
the only tool; partimage is still available but hardly anyone uses it since
partclone is the more active project, supporting newer filesystems like
APFS.

FOG 1.3.6 added compression (Gzip and Zstd) and splitting of image files,
useful when images are stored on storage that cannot handle huge files.
Compression makes image files smaller but takes longer, since it runs on
the client machine — recent CPU generations handle it efficiently enough to
make it worth using on most fleets.

## Adding Existing Image objects

To restore an image to the FOG database:

1. Create a new Image definition through the management browser.
2. Specify image name (e.g. `SampleXPImage`).
3. Specify storage group (`default`).
4. Specify image file path (`SampleXPImage`).
5. Specify image type.
6. Log into the box hosting FOG, and move/rename your image to match the
   name entered above.
7. Create the folder hierarchy if necessary — FOG puts images in `/images/`
   by default, so for the example above you would need
   `/images/SampleXPImage`.
8. Drop the image file into the folder (named the same as the image name
   above).

## Deleting an Image object

Deleting an image definition on this line already cleans up most of what
points at it, via the image's own delete method:

- **Hosts assigned that image are unassigned.** The host survives with no
  image rather than naming one that is gone.
- **The image's storage-group associations are removed with it.**
- **Windows key associations are removed too**, if that plugin is
  installed — handled by the Windows Key plugin's own hook rather than by
  core code.
- **Queued or in-progress tasks referencing the image are canceled**, not
  merely stripped of the image reference. This is a deliberate choice, not
  an oversight — it differs from how deleting a *host* removes task history
  outright.

>[!note]
>This removes the image *definition* from the FOG database. It does not
>delete the image files on the storage node.

>[!warning] This cleanup lives on the image's own delete method
>Unlike the current line, where this cascade is centralized so every
>deletion path (web UI and REST API alike) is guaranteed to run it, on this
>line the cleanup is code that runs when the image object's own delete
>method is called. Deleting through the management portal's Images page
>uses that path. Whether every other way of removing an image row (bulk or
>scripted deletes, for instance) goes through the same method was not
>confirmed while writing this page — if you are deleting images outside
>the normal Images page UI, verify the cleanup happened rather than
>assuming it did.
