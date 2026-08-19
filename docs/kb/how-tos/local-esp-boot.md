---
title: Local ESP Boot
aliases:
    - Local ESP Boot
    - Boot FOG from the EFI System Partition
    - ESP boot kits
    - fog-esp archives
description: Boot a machine into FOG from files on its own EFI System Partition when PXE is unavailable, using the fog-esp archives FOG publishes
context_id: local-esp-boot
tags:
    - how-to
    - netboot
    - ipxe
    - secure-boot
    - uefi
---

# Local ESP boot

Some machines cannot netboot. The NIC has no PXE option ROM, the switch takes
too long to bring the link up, DHCP belongs to someone who will not add option
66, or the firmware's PXE stack is simply broken. For those, FOG publishes a
set of ready-made archives you copy onto the machine's own **EFI System
Partition**. The machine then boots iPXE from its own disk and joins FOG from
there — everything after that first hop is identical to a PXE boot.

>[!info] FOG 1.6
>These archives are new in 1.6 and replace an earlier arrangement that published
>the same binaries loose in a browsable directory.

## Getting the archives

They are static files under your FOG server's web root:

```
<http|https>://<your-fog-server>/fog/service/localboot/manifest.json
<http|https>://<your-fog-server>/fog/service/localboot/fog-esp-x86_64.zip
```

There is no index page and no directory listing — start from `manifest.json`,
which names every archive the server actually built.

| Archive | For |
|---|---|
| `fog-esp-x86_64.zip` | 64-bit UEFI, the usual case |
| `fog-esp-arm64.zip` | ARM64 UEFI |
| `fog-esp-i386.zip` | 32-bit UEFI |

If the `zip` command was not installed when FOG last ran, the same content is
published as `.tar.gz` instead. The manifest records the real filename either
way, which is why you should read it rather than guessing the extension.

>[!warning] The `-10sec` archives are currently not usable
>The manifest also lists `fog-esp-x86_64-10sec` and `fog-esp-arm64-10sec`,
>intended to carry binaries that wait ten seconds before their first DHCP
>attempt. As of the current release those two archives ship **without** FOG's
>own EFI binaries — the build they are sourced from is no longer produced — so
>the `autoexec.ipxe` inside them refers to files that are not there. Use the
>plain archive for your architecture. `--boot-delay` does not help here either;
>it adjusts the TFTP server's boot script, not an ESP.

>[!note] Kernels are listed, not shipped
>`manifest.json` has a `kernels` array describing `bzImage` and `init.xz` for
>each architecture, with paths relative to the manifest. Those are **not** in
>the archives — the machine fetches them from the FOG server at boot, as it
>would over PXE. The archive only has to get iPXE running.

## Installing onto the ESP

Mount the EFI System Partition and copy the **contents** of the extracted
folder into a directory on it. `\EFI\FOG\` is the conventional place:

```bash
sudo mount /dev/sda1 /mnt/esp          # your ESP, usually the small FAT32 one
sudo mkdir -p /mnt/esp/EFI/FOG
sudo cp -r fog-esp-x86_64/* /mnt/esp/EFI/FOG/
sudo umount /mnt/esp
```

Then add a firmware boot entry pointing at one of the entry points below — see
[[uefi-boot-entries|Managing UEFI Boot Entries (efibootmgr)]] — or copy the
entry point to `\EFI\BOOT\bootx64.efi` if you want it to be the machine's
default.

Do not extract two archives into the same folder. The FOG binaries in each are
named identically, so they would overwrite each other.

## Which entry point

| Situation | Point the firmware at |
|---|---|
| Secure Boot **off** | `fogipxe.efi` |
| Secure Boot **on**, via shim + MOK | `snponly-shimx64.efi` (or `ipxe-shimx64.efi`) |
| Secure Boot **on**, via firmware Setup Mode | `fogipxe.efi`, after enrolling the `.auth` files |

On arm64 the shim is `snponly-shimaa64.efi`. On i386 there is no shim at all —
Microsoft signs none for 32-bit UEFI — so only the Secure Boot **off** and
Setup Mode routes exist there.

### The chain, once shim starts

Shim establishes trust, then loads one of upstream's signed loaders from the
same folder. That loader reads `autoexec.ipxe` out of the folder it was loaded
from, and the script chains FOG's own build.

>[!note] Which loader shim picks is not worth worrying about
>Over the network, shim chooses its second stage by rewriting its own
>`-shim<arch>` suffix — so `snponly-shimx64.efi` loads `snponly.efi`. That
>rename happens on shim's network and HTTP boot paths; booted off a local
>filesystem it may instead fall back to its compiled-in default, `ipxe.efi`.
>Both loaders are in the archive precisely so that either behaviour works.

The first time on a given machine, shim will not be able to verify FOG's binary
and launches **MokManager** instead. Choose *Enroll key from disk*, select
`MOK.der` from the same folder, and reboot. It boots unattended from then on.
See [[secure-boot-mok-enrollment|Secure Boot MOK Enrollment]].

For the Setup Mode route, put the firmware into Setup Mode and enrol `PK.auth`,
`KEK.auth` and `db.auth` from the archive; the firmware then verifies FOG's
signed binaries directly and shim is not involved. See
[[secure-boot-setup-mode-enrollment|Secure Boot Setup Mode Enrollment]].

## What is in an archive

| File | What it is |
|---|---|
| `snponly-shim<arch>.efi`, `ipxe-shim<arch>.efi` | Upstream's Microsoft-signed shim, under two names |
| `snponly.efi`, `ipxe.efi` | Upstream's signed iPXE loaders, which shim vouches for |
| `mmx64.efi` / `mmaa64.efi` | MokManager, for enrolling the key |
| `fogipxe.efi` | FOG's build, all NIC drivers |
| `fogsnp.efi` | FOG's build, firmware SNP |
| `fogintel.efi`, `fogrealtek.efi` | FOG's build, single-vendor drivers |
| `fogsnponly.efi` | FOG's build, SNP on the load device only |
| `autoexec.ipxe` | The script the signed loader runs |
| `MOK.der`, `PK.auth`, `KEK.auth`, `db.auth` | Enrolment material for each route |
| `fog-enroll-mok.sh`, `fog-enroll-mok.desktop` | Helpers for enrolling from a running Linux |
| `MANIFEST.json`, `README.txt` | Inventory and instructions for this archive |

The `fog` prefix is not cosmetic. `snponly.efi` and `ipxe.efi` are reserved for
upstream's signed loaders, because those are the exact bytes shim's embedded
certificate vouches for — FOG's own builds cannot use those names.

`MANIFEST.json` records a `sha256`, a `role` and an `origin` for every file, and
a `fogSigned` boolean that is *measured* from the file rather than assumed.

## If the network never comes up

Try the binaries in this order: `fogipxe.efi`, `fogsnp.efi`, `fogintel.efi`,
`fogrealtek.efi`, `fogsnponly.efi`. `fogsnponly.efi` is last on purpose — it
binds only the device iPXE was loaded from, which off an ESP is the disk, so it
usually finds no NIC at all.

>[!important] The fallback chain covers missing files, not wrong drivers
>`autoexec.ipxe` already tries those five in order, but `chain X || goto Y`
>branches **only when an image fails to load** — absent, malformed, or rejected
>by shim. Once a binary loads and runs, control never returns: one that starts
>cleanly and then binds no NIC stops at its own prompt, and the next branch is
>never reached.
>
>So the ladder tells you which files got copied, not which driver works. **If it
>is the wrong driver you have to change which file is there** — point the
>firmware directly at the one you want.

## What you give up

Because these are archives rather than individual published files, **no single
binary has a URL of its own** any more. Nothing under `service/localboot/` can
be used as a UEFI HTTP Boot target or as an iPXE `chain` destination. If you
need that, serve the file yourself from somewhere you control.

## See also

- [[secure-boot-mok-enrollment|Secure Boot MOK Enrollment]] — the shim + MokManager route
- [[secure-boot-setup-mode-enrollment|Secure Boot Setup Mode Enrollment]] — the `db`/`KEK`/`PK` route
- [[secure-boot-signing|Secure Boot Signing]] — what FOG signs, and with which key
- [[uefi-boot-entries|Managing UEFI Boot Entries (efibootmgr)]] — adding the boot entry
- [[netboot-transport-and-pki|Netboot Transport and PKI]] — the PXE path this replaces
