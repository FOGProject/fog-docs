---
title: Deploying a Dual-Boot Multi-Disk Image
aliases:
    - Deploying a Dual-Boot Multi-Disk Image
description: describe how to deploy a dual-boot multi-disk image to other devices
context_id: deploy-dual-boot-multi-disk-image
tags:
    - dual-boot
    - multi-disk
    - linux
    - postinstall
    - efibootmgr
    - how-to
---

# Deploying a Dual-Boot Multi-Disk Image

If you create a Multi-Disk image with a dual boot configuration, the efi
boot entries will not be maintained automatically when deployed to
different hardware

To Fix this you should create a post-install script to handle it

See also
<https://forums.fogproject.org/topic/16703/dual-boot-2-disks-unable-to-boot-grub>

## Post-Download Script

Post-download scripts live on the FOG server at `/images/postdownloadscripts/`.

You need to use `efibootmgr` in a post-download script to configure the EFI boot
entries and maintain your dual-boot config. This is an example of a line in a
post-download script that adds a Debian boot entry:

```bash
efibootmgr -c -d /dev/nvme0n1 -p 1 -L "Debian" -l "\EFI\debian\shimx64.efi"
```

For what each flag means, how to inspect and reorder entries, and how to wire the
script into `fog.postdownload`, see
[[uefi-boot-entries|Managing UEFI Boot Entries (efibootmgr)]] and
[[post-download-scripts|Post Download Scripts]].
