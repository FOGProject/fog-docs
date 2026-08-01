---
title: Secure Boot - signing FOS with your own key
aliases:
    - Secure Boot - signing FOS with your own key
description: How to run FOG on machines with UEFI Secure Boot enabled by signing the FOS kernel with a key you control and enrolling it as a MOK
context_id: secure-boot-signing
tags:
    - how-to
    - secure-boot
    - uefi
    - advanced
---

# Secure Boot: signing FOS with your own key

!!! warning "This is an advanced, hands-on procedure"
    It requires generating and looking after a signing key, and **physically
    visiting each machine once**. If your site can leave Secure Boot disabled
    for imaging, that remains far less work. Read [Why FOG cannot do this for
    you](#why-fog-cannot-do-this-for-you) before deciding.

FOG does not ship signed FOS kernels, and cannot. If your estate mandates UEFI
Secure Boot and turning it off is not an option, this guide walks through
becoming your own signing authority: you generate a key, you sign the FOS
kernel with it, and you tell each machine's firmware to trust that key.

The result is entirely under your control — which is also the point. Nobody
else, FOG Project included, can produce something your machines will boot.

---

## Why FOG cannot do this for you

Secure Boot is a chain of signatures, and each link only trusts what it was
built to trust.

Your firmware ships with Microsoft's certificates in its allowed-signature
database (`db`). Practically everything bootable is signed either directly by
Microsoft or by a **shim** — a small loader that Microsoft signs once, and
which then carries the *distribution's own* certificate inside it. That is how
Ubuntu and Fedora work: Canonical and Red Hat each got one shim signed, and
from then on they sign their own kernels with their own keys, checked against
the certificate baked into their shim.

For FOG to do the same, the FOG Project would have to own a signing key with
the operational discipline that implies, and get a shim through Microsoft's
review process. Even then, a signature is only as meaningful as the key behind
it — a signing key that ships to everyone protects nobody.

The alternative the firmware already provides is **MOK** (Machine Owner Key):
a per-machine list of extra certificates that *you*, as the physical owner of
the machine, choose to trust. That is the route this guide takes.

!!! info "Why enrolment cannot be automated"
    MOK enrolment requires a human at the physical console pressing keys. That
    is not an oversight — it is the security property. If a remote process
    could enrol a signing key, Secure Boot would be decorative. Budget for one
    visit per machine, the same way you would for a firmware password.

---

## What actually needs signing

Less than most people expect.

| Component | Signed? | Why |
| --- | --- | --- |
| iPXE (`ipxe.efi`, `snponly.efi`, …) | **Yes** — but upstream already does it | iPXE publishes Microsoft-signed binaries |
| FOS kernel (`bzImage`, `bzImage32`) | **Yes — this is your job** | The firmware refuses to load an unsigned kernel |
| FOS init (`init.xz`, `init_32.xz`) | **No** | See below |
| Your images, snapins, scripts | **No** | They are never executed by firmware |

### The initrd is not verified — by anyone

This surprises people, so it is worth stating plainly: **the initramfs is not
covered by Secure Boot**, on any distribution. Ubuntu and Fedora do not sign
theirs either. They cannot — `dracut` and `initramfs-tools` build the initramfs
locally on each machine at install time and on every kernel update, so the
distribution never sees those bytes.

It is a well-known gap in the model, and the modern answer to it is the
Unified Kernel Image (kernel, initrd and command line stapled into a single
signed binary). FOG does not use UKIs today.

The practical consequence for you: **you only ever need to sign `bzImage` and
`bzImage32`.** Leave `init.xz` and `init_32.xz` alone.

### The chain you are building

```
UEFI firmware  (trusts Microsoft's certificate)
  └─ shim, from the iPXE project      ← Microsoft-signed, published upstream
      └─ ipxe.efi                     ← signed, published upstream
          └─ bzImage                  ← YOU sign this; shim checks it against MOK
              └─ init.xz              ← not verified, nothing to do
```

The middle link is the one to understand. **MOK is shim's database, not the
firmware's** — the firmware has never heard of it. Shim installs itself as the
authority that later `LoadImage()` calls consult, and *that* is what accepts
your key. Boot a signed iPXE directly, without shim in front of it, and your
MOK-signed kernel will be rejected: there is nothing in the chain that knows to
look at MOK.

---

## Before you start

You will need, on the FOG server:

```bash
# Debian / Ubuntu
apt install sbsigntool openssl

# RHEL / Rocky / Alma / Fedora
dnf install sbsigntools openssl
```

and on each client machine you intend to enrol, a way to run `mokutil` — most
simply, boot it once from any Linux live USB.

You also need iPXE binaries that can work under Secure Boot at all. FOG's
default binaries have their boot script *compiled in*, and an embedded script
is not permitted in a Secure Boot build. Use the binaries from
`packages/tftp/autoexec/` instead, which read their script from
`autoexec.ipxe` on the TFTP server. Point your DHCP `filename` option at those.

!!! note "Verify your FOS kernel has an EFI stub"
    Under Secure Boot the kernel is loaded by the firmware's own loader rather
    than by iPXE's Linux loader, which requires `CONFIG_EFI_STUB=y`. Stock FOS
    kernels are expected to have it; if boot fails immediately after signing
    with a format complaint rather than a signature complaint, this is the
    first thing to check.

---

## Step 1 — Generate a signing key

Do this **once**, on the FOG server, and keep the result safe. Anyone with
`MOK.priv` can produce something your machines will boot.

```bash
mkdir -p /root/fog-secureboot && cd /root/fog-secureboot

openssl req -new -x509 -newkey rsa:2048 \
  -keyout MOK.priv -outform DER -out MOK.der \
  -days 3650 -subj "/CN=FOG imaging - $(hostname -f)/" \
  -nodes

chmod 600 MOK.priv
```

- `MOK.priv` — the private key. **Never leaves this machine.** Back it up
  somewhere you would put a root password, not somewhere you would put a
  config file.
- `MOK.der` — the public certificate. This is what you distribute to clients;
  it is not sensitive.

The `-days 3650` gives ten years. Choose something you will actually remember
to renew — an expired MOK stops machines booting.

!!! tip "Use a descriptive CN"
    It is shown in MokManager when someone enrols it, and again years later
    when someone is trying to work out what that key is for. `FOG imaging -
    fog.example.edu` beats `MOK`.

---

## Step 2 — Enrol the certificate on a client

Repeat per machine. Copy `MOK.der` to the client, then:

```bash
mokutil --import MOK.der
```

You will be asked for a password **twice**. This is a one-time password used
only for the next reboot — it confirms that whoever is at the keyboard after
the reboot is the same person who ran this command. It is not stored and does
not need to be strong; it needs to be something you can retype in sixty
seconds. Use the same one across a batch of machines and your life is easier.

Reboot. The machine will stop in a blue **MOK Manager** screen instead of
booting normally:

1. `Enroll MOK`
2. `View key 0` — check the CN is yours before continuing
3. `Continue`
4. `Yes`
5. Enter the password from `mokutil --import`
6. `Reboot`

Confirm afterwards:

```bash
mokutil --list-enrolled | grep -A2 "FOG imaging"
```

!!! danger "If MokManager does not appear"
    The machine booted something that is not shim. Check that Secure Boot is
    actually enabled (`mokutil --sb-state`) and that the boot entry you are
    using goes through a shim. A machine that boots straight past MokManager
    has not enrolled anything.

---

## Step 3 — Sign the FOS kernels

On the FOG server:

```bash
cd /var/www/fog/service/ipxe    # or /var/www/html/fog/service/ipxe

for k in bzImage bzImage32; do
  cp -a "$k" "$k.unsigned"
  sbsign --key /root/fog-secureboot/MOK.priv \
         --cert /root/fog-secureboot/MOK.der \
         --output "$k" "$k.unsigned"
done

chown $(stat -c %U .) bzImage bzImage32
```

Verify:

```bash
sbverify --cert /root/fog-secureboot/MOK.der bzImage
# Signature verification OK
```

Keeping the `.unsigned` copies matters — `sbsign` will not sign an
already-signed image cleanly, so the next round needs the original.

!!! warning "This must be repeated after every FOG update"
    A FOG upgrade replaces `bzImage` and `bzImage32` with fresh unsigned ones,
    and Secure Boot clients will stop booting the moment it does. This is the
    single most common way this setup breaks. Save the loop above as a script
    and run it as the last step of every upgrade — see
    [Automating the re-sign](#automating-the-re-sign).

---

## Step 4 — Verify end to end

Take one enrolled machine and PXE boot it with Secure Boot **on**:

- iPXE loads and shows its banner — the upstream signed binaries are working.
- The FOG menu appears — `autoexec.ipxe` is being served and read.
- Selecting a task boots FOS rather than failing — your signature is accepted.

If it stops at the third step with a security violation, the kernel signature
is not being accepted. In order of likelihood:

| Symptom | Cause |
| --- | --- |
| `Security Policy Violation` | Key not enrolled on *this* machine, or you signed with a different key than you enrolled |
| Fails on every machine, including enrolled ones | Shim is not in the boot chain — see [the chain](#the-chain-you-are-building) |
| Worked yesterday, fails today | FOG was updated and the kernels were replaced unsigned |
| Complains about format, not signature | Kernel lacks `CONFIG_EFI_STUB` |

---

## Automating the re-sign

Save as `/root/fog-secureboot/resign.sh`:

```bash
#!/bin/bash
# Re-sign FOS kernels after a FOG update. Secure Boot clients will not boot
# until this has run.
set -euo pipefail
KEYDIR=/root/fog-secureboot
IPXE=/var/www/fog/service/ipxe

for k in bzImage bzImage32; do
  [[ -f "$IPXE/$k.unsigned" ]] || cp -a "$IPXE/$k" "$IPXE/$k.unsigned"
  sbverify --cert "$KEYDIR/MOK.der" "$IPXE/$k" &>/dev/null && continue
  cp -a "$IPXE/$k" "$IPXE/$k.unsigned"
  sbsign --key "$KEYDIR/MOK.priv" --cert "$KEYDIR/MOK.der" \
         --output "$IPXE/$k" "$IPXE/$k.unsigned"
  echo "re-signed $k"
done
```

It is safe to run when nothing has changed — already-signed kernels are skipped.

---

## Rotating or removing a key

To withdraw a key from a machine:

```bash
mokutil --delete MOK.der
```

then reboot and confirm in MokManager, exactly as for enrolment.

**There is no remote revocation.** If `MOK.priv` is compromised, every machine
that enrolled it needs a physical visit to remove it. That is the trade you
accept in exchange for not needing anyone else's permission — treat the private
key accordingly.

---

## Known limits

- **EFI only.** Secure Boot is a UEFI feature; BIOS/legacy PXE clients are
  unaffected and need none of this.
- **One visit per machine, always.** There is no supported way to enrol a MOK
  without physical presence.
- **The initrd is unverified**, as it is everywhere else. If your threat model
  requires a verified initramfs, Secure Boot alone does not give you that on
  any distribution.
- Signing covers *booting*. It says nothing about whether the image FOS then
  writes to disk is trustworthy.

## See also

- [BIOS and UEFI co-existence](bios-and-uefi-co-existence.md)
- [UEFI boot entries](uefi-boot-entries.md)
