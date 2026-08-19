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

Some machines cannot netboot. The network card has no PXE option ROM, the
switch takes too long to bring the link up, DHCP belongs to someone who will not
add option 66, or the firmware's PXE stack is simply broken. For those, FOG
publishes a set of ready-made archives holding everything needed to start iPXE
from local storage — the machine's own **EFI System Partition (ESP)**, or a USB
stick. It boots iPXE from there and joins FOG; everything after that first hop is
identical to a network boot.

The archive is deliberately more than one route. Depending on what the machine
lets you do, you can lay it on the ESP, run it off a stick from a UEFI shell,
have rEFInd present it as a menu entry, or use it purely to enrol a Secure Boot
key on a machine that cannot reach the network yet.

>[!note] Terms used on this page
>**ESP — EFI System Partition.** A small FAT32 partition every UEFI machine has,
>which the firmware reads boot loaders from. It is usually the first partition
>on the disk and is normally not mounted while the operating system is running.
>
>**UEFI** is the firmware interface that replaced the traditional BIOS.
>**PXE** is the network-boot mechanism this page is an alternative to.
>
>**shim** is a small, Microsoft-signed loader that Secure Boot machines will
>accept, whose only job is to check and load the next stage.
>
>**MOK — Machine Owner Key.** A certificate you enrol into a machine's firmware
>so Secure Boot will accept things signed by it — here, the binaries this FOG
>server signed. **MokManager** is the little blue-screen tool shim launches to
>let you enrol one.
>
>**SNP — Simple Network Protocol.** The UEFI firmware's own network driver.
>Binaries named `snp`/`snponly` use it instead of iPXE's built-in drivers.
>
>**rEFInd** is a third-party boot manager FOG can chainload when you *leave* the
>FOG menu to boot the machine's installed operating system.

>[!info] New in FOG 1.6
>This is a **new capability**, not a change to an existing one — there is nothing
>to migrate from. Booting FOG off a machine's own disk was previously something
>you assembled yourself: find an iPXE binary that drives the hardware, write a
>boot script for it, put both on the ESP, and keep them in step with the server
>by hand. FOG now builds and publishes that for you, per architecture, signed,
>with the enrolment material alongside.
>
>If you already have a hand-rolled ESP setup, it keeps working. These archives
>are worth switching to mainly because the server regenerates them on every
>upgrade, so the binaries and the boot script cannot drift out of step with it.

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

>[!note] Kernels are listed, not shipped
>`manifest.json` has a `kernels` array describing `bzImage` and `init.xz` for
>each architecture. Those are **not** in the archives — the machine fetches them
>from the FOG server at boot, as it would over PXE. The archive only has to get
>iPXE running.

>[!note] The directory is rebuilt on every install
>`service/localboot/` is deleted and regenerated each time the installer runs.
>It is a publication point, not somewhere to keep anything.

## Where to put the files

**This is a kit, not a procedure.** The same files work from the machine's own
ESP, from a USB stick, or launched by a boot manager — the point is that you can
pick whichever route the machine in front of you actually allows.

Whatever you choose: copy the **contents** of the extracted folder, keep the
`local/` and `refind/` subdirectories, and put them somewhere identifiable.
`\EFI\FOG\` is the conventional place.

>[!warning] Do not flatten the layout
>The subdirectories are load-bearing. The archive root and `local/` each hold
>their own `autoexec.ipxe`, and merging them stops the machine booting — see
>[why there are two](#why-there-are-two-autoexecipxe-files).

### On Windows, with FogApi

Windows does not mount the ESP by default. The
[FogApi](https://github.com/darksidemilk/FogApi) PowerShell module has a helper
for it:

```powershell
Install-Module -Name FogApi -Scope AllUsers     # once, from the PowerShell Gallery

Mount-WinEfi                                    # mounts the ESP at A:
New-Item -ItemType Directory A:\EFI\FOG -Force
Copy-Item .\fog-esp-x86_64\* A:\EFI\FOG\ -Recurse -Force
Dismount-WinEFI
```

`Mount-WinEfi` defaults to `A:` and takes `-mountLtr` for a different letter. It
wraps `mountvol.exe /S`, and if the ESP is already mounted somewhere else it
dismounts and remounts it where you asked. `Get-EfiMountLetter` reports where it
currently is. Without the module, `mountvol A: /S` from an elevated prompt does
the mounting part and the rest is an ordinary copy.

>[!note] A single command for this is planned, not released
>A FogApi command to do the whole job — lay the kit down and point the firmware
>at it — is expected, in the same shape as its host-boot helpers. It does not
>exist yet, so use the steps above.

### On Linux

```bash
sudo mount /dev/sda1 /mnt/esp          # your ESP, usually the small FAT32 one
sudo mkdir -p /mnt/esp/EFI/FOG
sudo cp -r fog-esp-x86_64/* /mnt/esp/EFI/FOG/
sudo umount /mnt/esp
```

### On a USB stick

Format it FAT32 and unpack the archive onto it. Nothing needs mounting and
nothing on the machine's own disk changes — this is the route for a machine you
cannot log into, or whose ESP you would rather not touch. Two ways to use it:

- **From a UEFI shell**, if the firmware offers one: change to the stick's
  filesystem and run the entry point directly.
- **From the firmware boot menu**, if it will boot removable media: copy the
  entry point to `\EFI\BOOT\bootx64.efi` on the stick and it shows up as a
  bootable device.

A USB copy is also the most direct way to **enrol Secure Boot material on a
machine that cannot netboot at all**. `MOK.der` and the `.auth` files travel
inside the archive, so one stick carries both the enrolment material and
something to boot in order to enrol it.

### Letting rEFInd choose

If you can get rEFInd running — from the ESP, from the stick, or because it is
already the machine's boot manager — it scans for EFI binaries and lists them as
a menu. That includes the shim, so you can **select `snponly-shimx64.efi` and get
into FOG without adding a firmware boot entry or touching the boot order**.

Useful when the firmware's own boot menu is awkward, locked down, or simply will
not show a file you added by hand.

### Making it permanent

To turn any of the above into a real boot entry, see
[[uefi-boot-entries|Managing UEFI Boot Entries (efibootmgr)]] — or copy the entry
point to `\EFI\BOOT\bootx64.efi`, which is the path firmware falls back to when
nothing else is configured.

## Which entry point

| Situation | Point the firmware at |
|---|---|
| Secure Boot **off** | `local/fogipxe.efi` |
| Secure Boot **on**, via shim + MOK | `snponly-shimx64.efi` (or `ipxe-shimx64.efi`) |
| Secure Boot **on**, via firmware Setup Mode | `local/fogipxe.efi`, after enrolling the `.auth` files |

On arm64 the shim is `snponly-shimaa64.efi`. On i386 there is no shim at all —
Microsoft signs none for 32-bit UEFI — so only the Secure Boot **off** and
Setup Mode routes exist there.

The first time on a given machine, shim will not be able to verify FOG's binary
and launches **MokManager** instead. Choose *Enroll key from disk*, select
`MOK.der` from the archive root, and reboot. It boots unattended from then on.
See [[secure-boot-mok-enrollment|Secure Boot MOK Enrollment]].

For the Setup Mode route, put the firmware into Setup Mode and enrol `PK.auth`,
`KEK.auth` and `db.auth` from the archive; the firmware then verifies FOG's
signed binaries directly and shim is not involved. See
[[secure-boot-setup-mode-enrollment|Secure Boot Setup Mode Enrollment]].

## Why there are two `autoexec.ipxe` files

This is the part worth understanding, because it explains the whole layout.

Since fog-ipxe `v2.0.0-fog.8`, **no EFI binary carries FOG's boot script inside
it**. Each one *reads* a file called `autoexec.ipxe`, and iPXE resolves that
name against the directory the running binary was loaded from. Two different
binaries need two different scripts, so they live in two different directories:

| File | Read by | What it does |
|---|---|---|
| `autoexec.ipxe` *(archive root)* | upstream's signed loader, after shim | A chain ladder. Tries `local/fogipxe.efi`, then `fogsnp`, `fogintel`, `fogrealtek`, `fogsnponly` |
| `local/autoexec.ipxe` | whichever `local/fog*.efi` runs | **FOG's real boot logic** — walks `net0`/`net1`/`net2` for DHCP, handles proxyDHCP and `next-server`, then chains `default.ipxe` |

Neither binary can reach the other's script, which is exactly the point. A flat
archive gave the FOG binaries the *ladder* instead of the boot logic, so
`fogipxe.efi` read `chain fogipxe.efi` — itself — and via shim came up with no
FOG script at all.

>[!important] `ipxe.efi` in the archive root is upstream's, not FOG's
>It carries iPXE's own NIC drivers, and booted locally off an ESP it **does not
>load them**. It works only as a chain stage on the way to `local/fog*.efi`.
>Nothing in either source tree predicts this; it took a machine to find. This is
>the single most likely thing to trip you up if you rearrange the archive.

>[!tip] `local/autoexec.ipxe` is a plain text file you can edit
>It is FOG's boot logic sitting on the ESP, not baked into a binary. Change it
>and the next boot picks it up — nothing to rebuild and nothing to re-download.

## What is in an archive

**Archive root** — upstream's signed material and the enrolment kit:

| File | What it is |
|---|---|
| `snponly-shim<arch>.efi`, `ipxe-shim<arch>.efi` | Upstream's Microsoft-signed shim, under two names |
| `snponly.efi`, `ipxe.efi` | Upstream's signed iPXE loaders, which shim vouches for |
| `mmx64.efi` / `mmaa64.efi` | MokManager, for enrolling the key |
| `autoexec.ipxe` | The chain ladder the signed loader runs |
| `MOK.der`, `PK.auth`, `KEK.auth`, `db.auth` | Enrolment material for each route |
| `fog-enroll-mok.sh`, `fog-enroll-mok.desktop` | Helpers for enrolling from a running Linux |
| `README.txt`, `MANIFEST.json` | Instructions and inventory for this archive |

**`local/`** — FOG's own builds and FOG's boot script:

| File | Driver set |
|---|---|
| `fogipxe.efi` | All NIC drivers |
| `fogsnp.efi` | Firmware SNP |
| `fogintel.efi`, `fogrealtek.efi` | Single vendor |
| `fogsnponly.efi` | SNP on the load device only |
| `autoexec.ipxe` | FOG's boot logic |

**`refind/`** — `refind.efi` (or the right arch's variant) plus `refind.conf`,
in its own directory because rEFInd reads its config from wherever it was
loaded from.

>[!note] What is missing, and when
>An **i386** archive has no shim, no upstream loader, no MokManager and **no
>root `autoexec.ipxe`** — nothing in it would read one. It does have
>`local/autoexec.ipxe`, because its `fog*.efi` still needs a boot script. The
>same shape appears on any architecture if the server's Secure Boot download
>failed. A server with no rEFInd simply has no `refind/` directory rather than
>an empty one, and a server with Secure Boot declined ships neither `MOK.der`
>nor the `.auth` files.

The `fog` prefix on FOG's builds is historical — `snponly.efi` and `ipxe.efi`
are reserved at the root for upstream's signed copies. The names are kept
because they are in every bug report since GH-1117.

`MANIFEST.json` records a `sha256`, a `role` and an `origin` for every file, and
a `fogSigned` boolean that is *measured* from the file rather than assumed.
Paths in it are relative to the archive root, so `local/fogipxe.efi` appears in
full.

## Adding a delay before DHCP

If the switch runs STP or port power-save, the link may not be up by the time
iPXE first asks for DHCP. Install with:

```bash
./installfog.sh --boot-delay 15        # whole seconds, 0-120
```

That writes a live `sleep` into `local/autoexec.ipxe` **and** into the server's
own netboot copy, so one option covers both paths. With no delay configured the
same two lines are present but commented out, so you can also fix it on a single
machine at 2am by editing the file on its ESP.

>[!note] BIOS clients always get exactly ten seconds
>Any non-zero value gives BIOS clients ten seconds, because
>`10secdelay/undionly.kkpxe` is the only pre-built BIOS binary with a delay. EFI
>and ESP boot get the value you asked for. The installer says so when the two
>differ.

## If the network never comes up

Try the binaries in this order: `local/fogipxe.efi`, `local/fogsnp.efi`,
`local/fogintel.efi`, `local/fogrealtek.efi`, `local/fogsnponly.efi`.
`fogsnponly.efi` is last on purpose — it binds only the device iPXE was loaded
from, which off an ESP is the disk, so it usually finds no NIC at all.

>[!important] The fallback chain covers missing files, not wrong drivers
>The root `autoexec.ipxe` already tries those five in order, but
>`chain X || goto Y` branches **only when an image fails to load** — absent,
>malformed, or rejected by shim. Once a binary loads and runs, control never
>returns: one that starts cleanly and then binds no NIC stops at its own prompt,
>and the next branch is never reached.
>
>So the ladder tells you which files got copied, not which driver works. **If it
>is the wrong driver you have to change which file is there** — point the
>firmware directly at the one you want.

## Leaving FOG

From 1.6, a UEFI host exiting the FOG boot menu uses iPXE's own `sanboot`,
which hands control back to firmware to boot the next entry. That needs nothing
on the ESP.

rEFInd is still in the archive because `refind_efi` remains selectable, including
**per host**, and because an ESP assembled by hand may never talk to this server
again — so the kit carries every route off FOG rather than only the one this
server happens to be configured for today.

## What the archives cannot do

Everything is published inside an archive, so **no individual binary has a URL of
its own**. Nothing under `service/localboot/` can be used as a UEFI HTTP Boot
target or as an iPXE `chain` destination. If you need either, unpack the archive
and serve the file yourself from somewhere you control.

## See also

- [[secure-boot-mok-enrollment|Secure Boot MOK Enrollment]] — the shim + MokManager route
- [[secure-boot-setup-mode-enrollment|Secure Boot Setup Mode Enrollment]] — the `db`/`KEK`/`PK` route
- [[secure-boot-signing|Secure Boot Signing]] — what FOG signs, and with which key
- [[uefi-boot-entries|Managing UEFI Boot Entries (efibootmgr)]] — adding the boot entry
- [[netboot-transport-and-pki|Netboot Transport and PKI]] — the PXE path this replaces
