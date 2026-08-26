---
title: Secure Boot - Setup Mode enrollment (Route C)
aliases:
    - Secure Boot - Setup Mode enrollment
    - Setup Mode enrollment
description: Enroll FOG's Secure Boot certificate unattended by writing directly into UEFI db/KEK/PK, with nobody at the console
context_id: secure-boot-setup-mode-enrollment
tags:
    - how-to
    - secure-boot
    - uefi
    - advanced
    - pki
    - 1_6-changes
---

# Secure Boot: Setup Mode enrollment

>[!info] FOG 1.6
>This page is a FOG 1.6 addition. On earlier releases, use
>[[secure-boot-mok-enrollment|MOK enrollment]] instead — it needs a human at
>the console, but works everywhere.

>[!tip] Your firmware probably calls it "Custom"
>**Setup Mode** is the UEFI specification's term — it is the `SetupMode`
>variable. Dell, HP, Lenovo and AMI firmware menus almost all label it
>**Custom** or **Custom mode** instead, so searching your own firmware for
>"Setup Mode" tends to find nothing. Look for "Custom mode", "Erase all Secure
>Boot settings" or "Clear Secure Boot keys".

Many firmwares support **Setup Mode** — a state that lets you write
certificates directly into UEFI's own trust database (`PK`, `KEK`, `db`),
bypassing shim and MokManager entirely. This is Route C:
[[secure-boot-mok-enrollment|Routes A and B]] both end at a human pressing
keys, because MOK enrollment is
*designed* to require one. Route C sidesteps that by not using MOK at all: if
the platform is in Setup Mode, the running OS can write the real Secure Boot
databases directly, and FOS does it unattended.

For the concepts behind any of this (why signing is needed, the CA/leaf
split), start at [[secure-boot-signing|Secure Boot signing]].

## Running it

Schedule the **Enroll Secure Boot Key** task exactly as in
[[secure-boot-mok-enrollment#route-b--from-the-fog-boot-menu-no-operating-system-and-no-usb-stick|Route B]].
FOS decides which route to take by itself — it reads the firmware state
at boot, and only takes this path if it finds Setup Mode. Anything else falls
back to staging a MOK request, so scheduling the task against a mixed fleet
is safe.

What it writes, in this order and no other:

| Variable | Contents |
| --- | --- |
| `db` | Microsoft's five published CAs **plus** your `CN=FOG Project Secure Boot Signing` certificate |
| `KEK` | Microsoft's two KEK CAs plus this server's Key Exchange Key |
| `PK` | this server's Platform Key, alone |

The order is load-bearing. Writing `PK` is what takes the platform *out* of
Setup Mode, and every write after it must carry a signature the firmware
checks — so `PK` goes last. FOS also fetches all three blobs before writing any
of them, so a web server hiccup cannot leave a machine half-enrolled, and it
aborts on the first failure rather than pressing on to the write that closes the
door. A run that fails partway leaves the platform still in Setup Mode, still
booting anything, exactly as it was found.

`db.auth` embeds the **Secure Boot CA** — the intermediate, not the signing
leaf — alongside Microsoft's own certificates, which is what keeps leaf
rotation safe for Setup-Mode-enrolled clients too, the same as MOK
enrollment. See [[kb/reference/pki-zones#secure-boot|Secure Boot]] for why that split
matters.

Success is confirmed by `SetupMode` flipping 1 → 0 — the firmware accepting the
`PK`. Note that `SecureBoot` stays 0 until the next boot regardless, because the
firmware computes it during POST.

>[!warning] Microsoft's certificates are in that `db` on purpose
>It is tempting to read "your own trusted `db`" as "only your certificate".
>Removing Microsoft's CAs breaks Windows — and it breaks FOG, because the shim
>at the head of your own boot chain is Microsoft-signed. A `db` without them is
>a machine that no longer PXE boots.

>[!note] What still needs a human
>*Getting into* Setup Mode means clearing the `PK` at the firmware screen, and
>turning Secure Boot back **on** afterward is a firmware toggle too. Neither is
>reachable from a running OS by design. So Route C trades "a visit with a live
>USB, or keypresses at MokManager" for "a firmware visit" — the win is that the
>firmware half is scriptable through vendor tooling (Dell `cctk`, Redfish) where
>Routes A and B never were, and that once done it is permanent.

>[!danger] The task cannot run on a machine already enforcing Secure Boot
>iPXE 2.0.0 verifies both the kernel *and* the initrd through shim. On a machine
>with Secure Boot enforcing and your certificate not yet trusted, both are
>refused — `Verification failed: Security Policy Violation` — so FOS never
>starts and no task of any kind runs. This is a property of the boot chain, not
>of the enrollment task. Secure Boot must be off, or the platform in Setup Mode,
>for the machine to get far enough to enroll.

## Requirements

- **FOS release `20260804` or newer.** Earlier inits have no `fog.enrollsb`.
- **`efitools` on the server.** The installer installs it and builds the signed
  variable updates (`PK.auth`, `KEK.auth`, `db.auth`, via
  `cert-to-efi-sig-list`, `sign-efi-sig-list`, `efi-updatevar`) automatically.
  If it is missing the installer says so and skips building them — enrollment
  then falls back to the MOK routes rather than failing silently.
- **FOG 1.6.** The blobs are published at
  `<web-root>/service/secureboot/{db,KEK,PK}.auth` by the 1.6 installer only.
  FOS is shared between 1.5 and 1.6, so a 1.5 server ships an init that *has*
  `fog.enrollsb` — the MOK staging path still works there, but Route C cannot,
  because there are no `.auth` blobs to fetch.

>[!warning] `efitools` is unreliable on EL9 — check before you rely on it
>It's a declared dependency and installs normally on Debian/Ubuntu. On EL9:
>on a CentOS Stream 9 test box it's unavailable with EPEL *and* CRB enabled,
>and nothing else provides `sign-efi-sig-list`/`cert-to-efi-sig-list` — the
>upstream RPM tracker lists Fedora branches only, no EL9/EPEL rows at all.
>It is nonetheless present and working on at least one Rocky 9 FOG server,
>source not established. Only the three userspace tools are needed and they
>build from source in about a minute if your distribution doesn't package
>them:
>
>```bash
>dnf -y install gcc make openssl-devel git gnu-efi-devel
>git clone --depth 1 \
>    https://git.kernel.org/pub/scm/linux/kernel/git/jejb/efitools.git
>cd efitools
>make cert-to-efi-sig-list sign-efi-sig-list efi-updatevar
>install -m 0755 cert-to-efi-sig-list sign-efi-sig-list efi-updatevar /usr/bin/
>```
>
>`gnu-efi-devel` is required even for the userspace tools — they include
>`efi.h`. The EFI binaries (`KeyTool.efi` et al.) are not needed.

The server's `PK`, `KEK` and signing keys are generated once and **never
regenerate** on later installs. The `.auth` blobs are rebuilt every install, but
from those same keys, so re-running the installer does not invalidate machines
you have already enrolled.

MOK enrollment via MokManager works exactly the same regardless of whether
Setup Mode is also used — the two are independent enrollment routes for the
same Secure Boot CA, not alternatives that conflict. Confirmed on real UEFI
hardware: machines boot FOG's leaf-signed kernels while trusting only the
intermediate, whether that intermediate was enrolled as `MOK.der` through
MokManager or written into `db` through this path. That verification
predates a name-constraints extension that the Secure Boot CA briefly carried
and no longer does: FOG 1.6 took constraints off this zone entirely, precisely
because a critical extension firmware mishandles costs a trip to every machine.
There is no flag to re-enable them — `--no-sb-name-constraints` was removed with
the setting behind it. See [[kb/reference/pki-zones#name-constraints|Name constraints]].

>[!note] Validation status
>Route C has been validated end to end in VirtualBox: Setup Mode → task
>completes unattended → firmware holds exactly the certificates in the table
>above → Secure Boot switched on → the same machine PXE boots FOG's signed chain
>and images normally. Per-model validation on *physical* firmware is still
>outstanding, and a mistake there is not reversible from the OS — it needs a
>firmware trip. Treat the first machine of any model as a test.
>
>If you've validated this on physical firmware, please confirm it — good or
>bad — with a pull request against this page (an inline GitHub edit is fine)
>or a post on the [FOG forums](https://forums.fogproject.org/).

## Enrolling `db` by hand, without this task

The task above writes all three variables from a client. If you are doing it by
hand — at a firmware menu, or through a hypervisor — you want something different,
and the difference has bitten people:

**Firmware menus and hypervisors want a plain DER certificate, not the `.auth`
files.** The `.auth` blobs this page describes are *signed EFI variable updates*.
They are what FOS writes. A firmware file picker cannot read one. Hand it
`MOK.der` from `<webroot>/service/secureboot/` or from any `fog-esp-*` archive.

**And at a firmware menu you only need `db`** — not PK, not KEK. `db` is what
firmware checks to verify a boot image; PK and KEK only control who may *change*
`db`. With the platform in Setup/Custom Mode that write is unauthenticated, so
nothing has to vouch for it. Confirmed: `MOK.der` added to `db` by itself, then a
FOG-signed binary booted directly with no shim.

An existing machine's UI often asks for all three anyway, because in User Mode a
`db` write must be authenticated by a KEK-signed update — so it offers the only
write it can authenticate from a stranger, which is replacing the whole chain. You
do not have to accept that if you can write `db` directly.

>[!warning] This does not generalise to OS-side enrolment
>The `db`-alone shortcut applies to the **firmware's own tool** and to hypervisor
>settings. Writing Secure Boot variables from a running OS — the task this page
>describes, a Linux tool, or PowerShell's Secure Boot cmdlets — is a User Mode
>write and must be authenticated, so **expect to need PK, KEK and `db` together**.
>That is precisely why the `.auth` files exist and why this page's task writes all
>three.
>
>Neither route has been tested exhaustively across firmwares. If yours behaves
>differently, please report it on the [FOG forums](https://forums.fogproject.org/)
>or the issue tracker.

On VMware, put `MOK.der` in the VM's directory and add to the `.vmx`:

```
uefi.secureBoot.dbDefault.file0 = "MOK.der"
```

On an existing VM, `uefi.allowAuthBypass = "TRUE"` allows the firmware UI route.

>[!warning]
>**Append, never replace.** `uefi.secureBoot.dbDefault.append = "FALSE"` drops
>Microsoft's certificates and Windows stops booting.
>
>**Changing `db` is measured into TPM PCR 7**, so it can trigger BitLocker
>recovery. Suspend BitLocker first.

Full context, and what `db` enrolment unlocks beyond one machine, is in
[[kb/how-tos/local-esp-boot#enrolling-fogs-certificate|Local ESP boot]].

## See also

- [[secure-boot-trust-stores|The two trust stores]] — `db` vs `MokList`, and which one your boot path consults
- [[secure-boot-signing|Secure Boot signing]] — start here for the concepts
- [[secure-boot-mok-enrollment|MOK enrollment]] — the human-at-the-console alternative, works on any release
- [[local-esp-boot|Boot FOG from a machine's own ESP]] — where `db` enrolment removes the shim entirely
- [[secure-boot-technical-details|Secure Boot technical details]]
- [[pki-zones|FOG's Certificate Zones]]
- [[pki-glossary|PKI & Secure Boot Glossary]]
