---
title: Secure Boot - MOK enrollment (Routes A and B) (1.5)
aliases:
    - Secure Boot - MOK enrollment (1.5)
description: Enroll FOG 1.5's Secure Boot certificate on a client via MokManager, from a live USB or straight from the FOG boot menu
context_id: secure-boot-mok-enrollment-1.5
tags:
    - how-to
    - secure-boot
    - uefi
    - advanced
    - pki
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[1.6/kb/how-tos/secure-boot-mok-enrollment|1.6 version]] of this page for FOG 1.6.

# Secure Boot: MOK enrollment (1.5)

This page covers the two MOK (Machine Owner Key) enrollment routes — both
end with a human confirming the certificate at the console, which is the
security property, not a limitation.

>[!info] There is no third route on FOG 1.5
>FOG 1.6 adds a Setup Mode enrollment route that skips the console entirely
>on supported firmware. **That does not exist on 1.5** — MOK enrollment,
>below, is the only automated route this line has. For the concepts behind
>any of this (why signing is needed, the CA/leaf split, what "MOK" actually
>refers to), start at
>[[1.5/kb/how-tos/secure-boot-signing|Secure Boot signing (1.5)]].

Repeat per machine. **You do not need to turn Secure Boot off to do this**,
and you should not: both routes below work with it left on.

The FOG web UI has a **FOG Configuration → Secure Boot** page. It shows your
certificate's fingerprint (SHA-256, and SHA-1 for MokManager's own "view key"
screen — see [[1.5/kb/reference/pki-glossary#fingerprint-aka-thumbprint|fingerprint (1.5)]]), offers a
small **enrollment kit**, and links back to this guide for the full per-client
steps below:

| File | What it is |
| --- | --- |
| `MOK.der` | your public certificate — this is the thing being enrolled |
| `fog-enroll-mok.sh` | does the enrollment, checks the fingerprint first |
| `fog-enroll-mok.desktop` | double-click launcher for the above |

Leave that page open on another screen — you are going to compare the
fingerprint against it.

## Route A — a stock Ubuntu or Debian live USB

This is the reliable route. A stock live image already boots with Secure Boot
**on**, using the distribution's own signed shim, GRUB and kernel, so there is
nothing to sign and no firmware setting to change.

1. Write a normal Ubuntu or Debian live image to a USB stick, however you
   usually do it. **Do not remaster it** — the point is that stock media
   already solves the Secure Boot problem.
2. Copy all three kit files onto the stick, next to each other.
3. Boot the client from it, with Secure Boot still on.
4. Open the stick in the file manager and run `fog-enroll-mok.desktop`.

The script prints the certificate's fingerprint and asks you to confirm it
matches the web page before it does anything. Then it asks for a one-time
password, twice — that password only exists to prove, after the reboot, that
the person at the keyboard is the person who ran the script. It is not stored
and does not need to be strong. Use the same one across a batch of machines and
your life is easier.

Reboot. The machine stops in a blue **MOK Manager** screen instead of booting:

1. `Enroll MOK`
2. `View key 0` — check the CN is yours before continuing
3. `Continue`
4. `Yes`
5. Enter the password you just chose
6. `Reboot`

Confirm afterward:

```bash
mokutil --list-enrolled | grep -A2 "FOG"
```

## Route B — from the FOG boot menu, no operating system and no USB stick

MokManager can read a certificate straight off a FAT filesystem, so a Linux
session is not required at all. The boot menu carries an **Enroll Secure Boot
Key** entry that takes you straight there — and the boot menu fetches
`MOK.der` into iPXE's memory before chaining to MokManager, the same way a
normal netboot already puts the FOS kernel and initrd there. MokManager's own
file browser walks that same in-memory image list, so the certificate shows up
in `Enroll key from disk` without you carrying anything to the machine.

>[!info] The entry appears on its own
>It needs no configuration and shows for registered and unregistered hosts
>alike, because a machine that needs its MOK enrolled has usually never been
>registered. Like any menu entry it can be edited or removed under
>**FOG Configuration → PXE Boot Menu**.

>[!warning] Why the menu item exists, rather than "just PXE-boot the shim"
>**A plain PXE boot through the shim never shows MokManager.** Shim only hands
>control to MokManager when a *pending* MOK enrollment request already exists —
>normally staged by `mokutil --import`, which is what Route A does. With
>nothing staged, the shim boots straight through to `snponly.efi` and the blue
>MokManager screen never appears, however long you wait.
>
>The menu item chains directly to `secureboot/mmx64.efi`, deliberately
>bypassing that gate, which is what makes `Enroll key from disk` reachable
>with nothing pre-staged.
>
>Nor can you point DHCP straight at `mmx64.efi` to get the same effect. It is
>signed by iPXE, not Microsoft, so the firmware — which checks the first binary
>against `db` alone (see
>[[1.5/kb/how-tos/secure-boot-signing#the-chain-you-are-building|the chain (1.5)]]) — will refuse to
>launch it. It boots here only because iPXE loads it
>*through shim's verification protocol*, and shim trusts iPXE's certificate.

You do **not** need Secure Boot currently enabled to do this, either. MokManager's
enrollment does not depend on the firmware currently enforcing anything, only
on shim having loaded it. That means you can stage enrollment across a fleet
before ever flipping Secure Boot on: run this while it is still off, and every
machine already trusts your key by the time enforcement begins.
Or you can leave secure boot on for a new machine, enroll it then register it
and you're off without needing to touch secure boot settings.

1. PXE-boot the client as normal — Secure Boot on or off, it makes no
   difference to this step.
2. Choose **Enroll Secure Boot Key** — from the boot menu, or from a task
   scheduled against the host or a group from **Task Scheduling**, which
   chains into the exact same flow without you having to find the menu item
   on each machine (see the tip below). FOG fetches `MOK.der` into memory,
   then hands off to MokManager.
3. `Enroll key from disk`.
4. Pick `MOK.der` from the list — it is already there.
   >[!warning] If it is not listed
   >Not every firmware/MokManager combination is confirmed to expose a plain
   >`imgfetch`ed file the same way it exposes a kernel/initrd. Fall back to a
   >FAT-formatted USB stick with `MOK.der` on it (from the enrollment kit) —
   >it will appear in the same browser, the same way Route A's stick does.
5. `Continue` → `Yes`. Check the CN is yours, **and compare the fingerprint
   MokManager shows against the FOG Secure Boot page before confirming** —
   automatic delivery removes the "you personally carried this file"
   assurance Route A's USB stick still gives you, so this comparison matters
   more here, not less.
6. `Reboot`. No stick to remove.

>[!warning] MokManager times out on its own — twice
>Neither timer is something FOG controls or can change:
>
>- If you do not press a key within roughly **10 seconds** of the screen
>  appearing, MokManager gives up waiting and continues booting normally —
>  silently skipping enrollment. Be at the console before you select the
>  menu item or schedule the task, not after.
>- Once you are inside the tool, an **idle timeout of a couple of minutes**
>  reboots the machine if you stop responding partway through. Finish the
>  walkthrough once you start it; do not step away mid-enrollment.

>[!note] Why the fingerprint isn't checked automatically
>iPXE could in principle hash the file it just fetched and compare it
>against a value the same server also serves — but that value would travel
>over the exact same unauthenticated network path as the file itself, so
>anyone able to substitute one can substitute the other just as easily. The
>fingerprint on the FOG Secure Boot page is the actual check: you read it on
>a separate, already-trusted screen before confirming in MokManager. That
>manual comparison is the security boundary here, not something iPXE can do
>for you.

The client now trusts your key and will boot the signed FOS kernel on its
next PXE boot. Unlike Route A there is no one-time password step, because you
are already standing at the machine when the enrollment happens.

>[!tip] Push it as a task instead of hunting for the menu item
>"Enroll Secure Boot Key" is also a task type, schedulable from **Task
>Scheduling** against a single host or a whole group, the same way you would
>schedule a Deploy or a Capture. A host with this task pending skips the
>interactive boot menu entirely and chains straight into the flow above on
>its next PXE boot — useful for pushing enrollment across many machines
>without walking a tech through which menu item to pick on each one. The
>final `Enroll key from disk` → `Yes` step still has to happen at the
>console; nothing removes that.

>[!tip] Which route to reach for
>FOG 1.5 has no Setup Mode alternative, so Route B — fewer moving parts, and
>needs neither a live image nor a USB stick — is the one to try first if you
>are standing at the machine anyway. Route A is the fallback: `Enroll key
>from disk` is reported to hang on some firmware, and a stock live USB
>sidesteps that entirely by using the distribution's own shim. If you need to
>enroll before a machine can reach the FOG server at all, Route A also works
>with nothing but a USB stick.

>[!note] arm64 clients
>The menu entry serves the matching MokManager automatically — `mmx64.efi` for
>x86-64 and `arm64-efi/mmaa64.efi` for arm64, if your install stages the
>arm64 set — based on the architecture the client reported at boot. There is
>nothing to select.

>[!danger] If MokManager does not appear
>Confirm you picked **`Enroll Secure Boot Key`** and not an ordinary boot
>entry. Booting through the shim normally will not show MokManager: that
>needs a *pending* MOK request staged first, and this route does not stage
>one. Secure Boot being on or off is not the cause either way — this route
>chains to MokManager directly and works in both states.

## What a MOK does not cover

A MOK is **shim's** trust store, and only shim reads it. Two consequences worth
knowing before you plan a fleet around this:

- **Firmware never reads MokList.** So a FOG-signed binary that the *firmware*
  launches directly — booting `fog-ipxe\fogipxe.efi` off an ESP, with no shim in
  the chain — is refused no matter how many MOKs are enrolled. That case needs
  the certificate in `db` instead, which on 1.5 means adding it by hand
  through your firmware's own Setup/Custom mode — there is no automated route.
- **shim only launches MokManager when a MOK request is already pending.** A first
  boot with nothing enrolled does not offer to enrol — it simply fails to load the
  next stage. Enrolment has to be staged first, which is what the routes above do.

## Withdrawing a key from one machine

To remove trust for a certificate from a single machine, without touching the
server at all:

```bash
mokutil --delete MOK.der
```

then reboot and confirm in MokManager, exactly as for enrollment.

## See also

- [[1.5/kb/reference/secure-boot-trust-stores|The two trust stores (1.5)]] — `db` vs `MokList`, and which one your boot path consults
- [[1.5/kb/how-tos/secure-boot-signing|Secure Boot signing (1.5)]] — start here for the concepts
- [[1.5/kb/reference/secure-boot-technical-details|Secure Boot technical details (1.5)]]
- [[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]]
- [[1.5/kb/reference/pki-glossary|PKI & Secure Boot Glossary (1.5)]]
