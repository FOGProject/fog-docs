---
title: Deploying a Dual-Boot Multi-Disk Image
description: describe how to deploy a dual-boot multi-disk image to other devices
tags:
	- dual-boot
	- multi-disk
	- linux
	- postinstall
	- efibootmgr
---

# Deploying a Dual-Boot Multi-Disk Image


If you create a Multi-Disk image with a dual boot configuration, the efi
boot entries will not be maintained automatically when deployed to
different hardware

To Fix this you should create a post-install script to handle it

See also
<https://forums.fogproject.org/topic/16703/dual-boot-2-disks-unable-to-boot-grub>

## Post-Install Script

Post install scripts can be added on the fog server at
/images/post-install

You need to use efibootmgr in a post script to configure the efi boot
entries and maintain your dual boot config

`` ` efibootmgr -c -d /dev/nvme0n1 -p 1 -L "Debian" -l "\EFI\debian\shimx64.efi" ``\`
