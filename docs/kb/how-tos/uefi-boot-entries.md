---
title: Managing UEFI Boot Entries (efibootmgr)
aliases:
    - Managing UEFI Boot Entries (efibootmgr)
    - UEFI Boot Entries
    - efibootmgr
description: Why some imaged UEFI machines won't boot, and how to recreate their UEFI boot entries with efibootmgr from a post-download script
context_id: uefi-boot-entries
tags:
    - uefi
    - efibootmgr
    - boot-entries
    - post-download
    - dual-boot
    - multi-disk
    - troubleshooting
    - how-to
---

# Managing UEFI Boot Entries (efibootmgr)

## Why FOG doesn't handle this for you

On a UEFI system the firmware doesn't scan disks for bootloaders the way legacy
BIOS did. Instead it keeps an ordered list of **boot entries** in the
motherboard's NVRAM. Each entry records a label, the disk and EFI System
Partition (ESP) to use, and the path to a bootloader (for example
`\EFI\debian\shimx64.efi`).

Those entries live in firmware, **not on the disk**. FOG captures and deploys
*disk* contents — it does not recreate the firmware's boot entries. So a freshly
imaged UEFI machine can have a perfectly intact filesystem but **no working boot
entry**, and it fails to boot, drops to a GRUB rescue prompt, or reports "no
bootable device."

This most commonly bites you when:

-   deploying to **different hardware** than the image was captured on,
-   the image spans **multiple disks**, or
-   the machine is **dual-boot** (for example Windows + Linux), where the
    secondary OS's entry goes missing.

> [!note]
> Single-disk, single-OS Windows deployments usually boot fine because most
> firmware falls back to the default `\EFI\BOOT\bootx64.efi` path. The problem
> shows up for the *non-default* loaders — which is exactly the dual-boot or
> second-disk case.

## Inspecting boot entries

Run `efibootmgr` from a booted Linux system (or the FOS post-download
environment) to see the current entries:

```bash
efibootmgr -v
```

This lists each `Boot####` entry, the current `BootOrder`, and the device path
each entry points to. Use it to confirm whether the entry you expect is missing
or pointing at the wrong disk or partition.

## Creating a boot entry

To create a new entry you tell `efibootmgr` the disk, the ESP partition number,
a label, and the loader path:

```bash
efibootmgr -c -d /dev/nvme0n1 -p 1 -L "Debian" -l "\EFI\debian\shimx64.efi"
```

| Flag | Meaning |
| --- | --- |
| `-c` | create a new boot entry |
| `-d /dev/nvme0n1` | the **disk** holding the ESP |
| `-p 1` | the ESP **partition number** on that disk |
| `-L "Debian"` | the human-readable **label** shown in the firmware boot menu |
| `-l "\EFI\debian\shimx64.efi"` | **path** to the bootloader on the ESP (EFI-style backslashes) |

A new entry is added to the front of the boot order. Other useful operations:

```bash
efibootmgr -o 0002,0000     # set the boot order (highest priority first)
efibootmgr -b 0003 -B       # delete boot entry 0003
```

## Running it automatically with a post-download script

You don't want to run this by hand on every deploy. FOG can run a script on the
host **after the image is laid down but before it reboots** — a *post-download
script*.

The master script lives on the FOG server at:

```
/images/postdownloadscripts/fog.postdownload
```

`fog.postdownload` is the entry point FOS runs. From it you call your own scripts
using the `${postdownpath}` variable. For example, create
`/images/postdownloadscripts/efi-fixup.sh` containing your `efibootmgr`
command(s), then enable it by adding this line to `fog.postdownload`:

```bash
. ${postdownpath}efi-fixup.sh
```

Inside the script the deployed disks are available as the usual block devices
(for example `/dev/nvme0n1`), so the same `efibootmgr -c …` command shown above
works there. FOS exports variables such as `$hostname` and `$imagename`, so you
can branch on the host or image if a fix-up should only apply to certain
machines.

See [[post-download-scripts|Post Download Scripts]] for the broader post-download
mechanism, and [[deploy-dual-boot-multi-disk-image|Deploying a Dual-Boot
Multi-Disk Image]] for the dual-boot walkthrough this came from.

## References

-   [Dual boot 2 disks unable to boot grub (FOG forums)](https://forums.fogproject.org/topic/16703/dual-boot-2-disks-unable-to-boot-grub)
