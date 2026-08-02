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

    The signing itself is automated once configured — the installer keeps the
    kernels signed across upgrades — and the per-machine visit does **not**
    require turning Secure Boot off. What you cannot avoid is the visit.

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

**The iPXE project has already done exactly this.** Since iPXE 2.0, there is a
dedicated iPXE shim — published at
[ipxe/shim](https://github.com/ipxe/shim/releases), Microsoft-signed against
both the 2011 and 2023 certificates — which carries iPXE's own code-signing
certificate as its vendor certificate. Upstream then signs its released
`ipxe.efi` with that key. So a **stock upstream iPXE** boots under Secure Boot
with nothing for you to sign.

The catch is specific to FOG, and it is worth being precise about, because it
is the whole reason this guide exists:

**FOG does not ship stock iPXE binaries.** FOG builds its own, with the boot
script compiled in (`EMBED=ipxescript`) and — on HTTPS installs — the server's
CA baked in (`CERT=`/`TRUST=`). Those are by definition custom binaries, they
carry no signature, and iPXE's signed shim will refuse them, exactly as it
should. A shim that loaded any binary calling itself iPXE would be worthless.

FOG could not fix this by signing its own builds either. The shim only trusts
iPXE's vendor certificate, so a FOG-signed binary would need every machine to
enrol FOG's key first — the same physical visit this guide already asks for,
while making one key compromise everyone's problem at once.

The way out is to stop needing a custom binary. FOG's embedded boot script is
entirely generic, and iPXE 2.0 can fetch that script from the TFTP server
instead (`autoexec.ipxe`). That lets you run **upstream's signed `ipxe.efi`**
and still get FOG's boot behaviour — which is the approach this guide takes.

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
| iPXE (`ipxe.efi`) | **No — use upstream's signed build** | Signed by the iPXE project; FOG's own builds are custom and unsigned |
| shim (`ipxe-shimx64.efi`) | **No — Microsoft already signed it** | Published by the iPXE project |
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
UEFI firmware  (trusts Microsoft's certificate, via `db`)
  └─ ipxe-shimx64.efi   ← Microsoft-signed, published by the iPXE project
      └─ ipxe.efi       ← signed by iPXE; use UPSTREAM's build, not FOG's
          └─ bzImage    ← YOU sign this; shim checks it against MOK
              └─ init.xz ← not verified, nothing to do
```

Only the kernel is yours to sign. The two links above it are already signed by
people whose certificates the firmware and the shim respectively trust.

The first link is the one to understand. **MOK is shim's database, not the
firmware's** — the firmware has never heard of it. Shim installs itself as the
authority that later `LoadImage()` calls consult, and *that* is what accepts
your key.

The consequence is easy to get wrong: **MOK cannot help the first binary in the
chain.** When the firmware PXE-boots a file directly, it checks that file
against `db` only, because nothing has loaded shim yet to consult MOK. That is
why the shim — not iPXE — has to be your DHCP boot file. Point DHCP straight at
an iPXE binary and no amount of signing or enrolling will save you.

The iPXE shim loads **`ipxe.efi`** from the directory it was itself loaded from.
That name is fixed, so the file has to be present under exactly that name.

!!! warning "Use upstream's `ipxe.efi`, not FOG's"
    FOG's own binaries in `/tftpboot` — including those in `autoexec/` — are
    locally built and unsigned, so the shim will reject them. Download the
    signed build from the iPXE project. FOG's boot logic reaches it through
    `autoexec.ipxe` instead of being compiled in.

!!! tip "The alternative: enrol into `db` instead"
    Many firmwares can be put into Custom or Setup mode, letting you add your
    own certificate to `db` directly. That removes shim from the picture — sign
    whatever you like and the firmware loads it. It is the only route if you
    need FOG's *custom* iPXE (embedded CA for HTTPS) under Secure Boot, but the
    menus vary enormously between vendors and some do not expose `db` editing
    at all.

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

You will also need the iPXE project's signed shim and its signed `ipxe.efi`.
Both come from upstream, not from FOG:

>[!tip] The installer can do all of this for you
>Passing `--secure-boot-stage` downloads the shim and `mmx64.efi`, extracts
>upstream's signed `ipxe.efi` out of the USB image, drops `autoexec.ipxe` in
>beside them and fixes up SELinux labels — everything in the rest of this
>section. It also writes a commented-out Secure Boot class into the generated
>DHCP config for you to adapt.
>
>It is opt-in and never fatal: it pulls pinned third-party binaries over the
>network, and an upstream hiccup should not be able to fail your install. If it
>reports a failure, fall back to the manual steps below.
>
>The rest of this section is worth reading anyway, because it explains *why*
>each file has to be where it is.

Put them in their own directory under the TFTP root. **Do not drop them in
`/tftpboot` itself** — FOG already ships its own `ipxe.efi` there, and
overwriting it breaks every non-Secure-Boot client that boots that file.

```bash
sudo mkdir -p /tftpboot/secureboot
cd /tftpboot/secureboot

# Microsoft-signed shim, carrying iPXE's vendor certificate
sudo curl -LO https://github.com/ipxe/shim/releases/download/ipxe-16.1/ipxe-shimx64.efi
# MokManager, used during enrolment
sudo curl -LO https://github.com/ipxe/shim/releases/download/ipxe-16.1/mmx64.efi
```

Check <https://github.com/ipxe/shim/releases> for the current version rather
than assuming `16.1` is still latest.

The signed `ipxe.efi` is **not** published as a standalone release asset. It
ships inside upstream's Secure Boot disk images, so you have to pull it out:

```bash
cd /tftpboot/secureboot
sudo curl -LO https://github.com/ipxe/ipxe/releases/download/v2.0.0/ipxe-x86_64-sb.usb

# EFI/BOOT/IPXE.EFI is the signed binary
sudo 7z e -y ipxe-x86_64-sb.usb EFI/BOOT/IPXE.EFI
sudo mv IPXE.EFI ipxe.efi
sudo rm ipxe-x86_64-sb.usb

# copy FOG's boot script in beside them, and fix ownership + SELinux labels
sudo cp /tftpboot/autoexec/autoexec.ipxe /tftpboot/secureboot/
sudo chown -R "$(stat -c %U /tftpboot)" /tftpboot/secureboot
sudo restorecon -Rv /tftpboot
```

!!! warning "The `restorecon` is not optional on SELinux systems"
    Files created with `cp`/`curl` under `/tftpboot` get the `default_t`
    context rather than `tftpdir_t`, and `in.tftpd` is then denied read on
    them. The client sees a plain "file not found" with nothing obviously
    wrong on the server, which is a genuinely confusing way to lose an hour.

(`7z` comes from `p7zip`/`7zip`; `mcopy` from `mtools` works equally well.)

You can confirm you have the right file before going any further — a signed
binary has a non-empty certificate table, an unsigned one does not:

```bash
osslsigncode verify -in ipxe.efi 2>&1 | head -5
```

The signer should be **iPXE Secure Boot Intermediate G1A**. FOG's own
`/tftpboot/ipxe.efi` and `/tftpboot/autoexec/snponly.efi` have no signature at
all — if you see that, you have picked up a FOG binary by mistake.

!!! note "Prefer the standalone shim over the one in the image"
    The image also contains `EFI/BOOT/BOOTX64.EFI`, which is a shim — but it
    carries only the Microsoft UEFI CA **2011** signature. The separate
    `ipxe-shimx64.efi` download above is signed against **both 2011 and 2023**,
    which matters on newer hardware that ships only the 2023 certificate.

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

>[!warning] Generate a fresh key — do not reuse the MOK you already have
>If this machine has ever built a DKMS module, it already has a MOK, and it is
>tempting to reuse it. It will not work.
>
>Since shim 15.4 (Ubuntu 21.04 and later), keys carrying the *Module-signing
>only* KeyUsage OID `1.3.6.1.4.1.2312.16.1.2` are deliberately **ignored** by
>both shim and GRUB when validating something to boot — they are only good for
>signing kernel modules. Ubuntu's and Debian's automatically generated DKMS
>MOK carries exactly that OID.
>
>The failure is a plain `Security Policy Violation` at boot with the key
>showing up quite happily in `mokutil --list-enrolled`, which is a
>memorably unhelpful combination. The `openssl req` command above produces a
>key without the OID, so just use it.

---

## Step 2 — Enrol the certificate on a client

Repeat per machine. **You do not need to turn Secure Boot off to do this**, and
you should not: both routes below work with it left on.

Once the installer has been run with `--secure-boot-cert`, the FOG web UI grows
a **FOG Configuration → Secure Boot** page. It shows your certificate's SHA-256
fingerprint and offers a small **enrolment kit**:

| File | What it is |
| --- | --- |
| `MOK.der` | your public certificate — this is the thing being enrolled |
| `fog-enroll-mok.sh` | does the enrolment, checks the fingerprint first |
| `fog-enroll-mok.desktop` | double-click launcher for the above |

Leave that page open on another screen — you are going to compare the
fingerprint against it.

### Route A — a stock Ubuntu or Debian live USB

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

Confirm afterwards:

```bash
mokutil --list-enrolled | grep -A2 "FOG imaging"
```

### Route B — no operating system at all

MokManager can read a certificate straight off a FAT filesystem, so a Linux
session is not strictly required: put `MOK.der` on a FAT32 stick, PXE-boot the
shim, and use **`Enroll key from disk`** from the MokManager menu.

Fewer moving parts, but `Enroll key from disk` is known to hang on some
firmware, which is why Route A is the one to reach for first.

>[!danger] If MokManager does not appear
>The machine booted something that is not shim. Check that Secure Boot is
>actually enabled (`mokutil --sb-state`) and that the boot entry you are using
>goes through a shim. A machine that boots straight past MokManager has not
>enrolled anything.

---

## Step 3 — Point Secure Boot clients at the shim, and sign the FOS kernels

### 3a — Serve the signed chain

Set the DHCP boot file for Secure Boot clients to
**`secureboot/ipxe-shimx64.efi`**. Nothing in this step needs signing by you —
both binaries already carry signatures the firmware and shim trust.

Because upstream's `ipxe.efi` has no boot script compiled in, it fetches one
over TFTP, and **where it looks is not a single fixed path**. iPXE asks for the
bare name `autoexec.ipxe` and tries two locations in order:

1. relative to its *current working URI* — the TFTP directory the running
   `.efi` was itself downloaded from, i.e. `secureboot/autoexec.ipxe`
2. absolute at the TFTP root — `/autoexec.ipxe`

You can watch both attempts on the client console:

```
autoexec.ipxe...  Not found
/autoexec.ipxe... Not found
```

The `sudo cp` in the previous step satisfies (1). Current FOG installers also
satisfy (2) by hard-linking `/tftpboot/autoexec.ipxe` to
`/tftpboot/autoexec/autoexec.ipxe`, so both paths are one file and editing
either changes both. Either location works; having both is harmless.

If the root link is missing — an older install, or the file was replaced by an
editor that writes-and-renames — recreate it:

```bash
sudo ln -f /tftpboot/autoexec/autoexec.ipxe /tftpboot/autoexec.ipxe
```

A hard link rather than a symlink because some TFTP daemons refuse to follow
symlinks, while a hard link is indistinguishable from a regular file to all of
them. A hard link rather than a copy so the two paths cannot drift apart.

!!! tip "If nothing seems to happen"
    Watch the TFTP server's log during a boot — it tells you exactly which
    filenames the client asked for and whether they were served, which beats
    guessing every time.

Your existing clients are unaffected — leave `snponly.efi` in place and keep
pointing non-Secure-Boot machines at it.

!!! warning "The only signed binary is an all-drivers build"
    Upstream publishes exactly one signed x86-64 iPXE binary, and it is an
    all-drivers build: it binds iPXE's own NIC drivers, disconnecting the
    firmware's UEFI network driver. On hardware where that takeover does not
    work, iPXE stops right after `initialising devices` — no banner, no DHCP —
    and there is currently **no way out**, because the usual answer
    (`snponly.efi`, which FOG ships as its default for exactly this reason)
    has no signed equivalent. Building your own loses the signature.

    This is what happens on VirtualBox's emulated Intel 82540EM, where the
    signature chain verifies perfectly and iPXE then hangs. Requested upstream
    as [ipxe/ipxe#1776](https://github.com/ipxe/ipxe/issues/1776).

### 3b — The FOS kernels

This is the part that is genuinely yours to sign, and the installer will do it
for you. Tell it where the key lives:

```bash
cd /path/to/fogproject/bin
./installfog.sh \
  --secure-boot-key  /root/fog-secureboot/MOK.priv \
  --secure-boot-cert /root/fog-secureboot/MOK.der
```

Both paths are stored in `.fogsettings`, so **every later upgrade re-signs the
kernels automatically** — you do not have to pass them again. Verify:

```bash
sbverify --cert /root/fog-secureboot/MOK.der \
  /var/www/fog/service/ipxe/bzImage
# Signature verification OK
```

The installer keeps a `.unsigned` copy of each kernel beside the signed one,
because `sbsign` will not cleanly re-sign an already-signed image. Leave them
alone; they are refreshed on every download.

>[!note] The web Kernel Update page is covered too
>Downloading a kernel from **FOG Configuration → Kernel Update** signs it
>before it is sent to the TFTP server, so that route cannot leave you with an
>unsigned kernel either. It signs through a small root-only helper
>(`/opt/fog/bin/fog-sign-kernel`) rather than in the web server itself, so the
>web server never gets read access to your private key. If signing fails the
>update is refused outright rather than quietly installing a kernel your
>clients will not boot.
>
>Be aware of the limit of that protection: anyone who can already run code as
>your web server can ask the helper to sign a kernel of their choosing. What
>they cannot do is walk off with the key.

>[!warning] Install `sbsigntool` before you enable this
>If `sbsign`/`sbverify` are missing the installer warns and carries on
>unsigned rather than aborting the whole install. Read the installer output.

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
| `Security Policy Violation`, but the key *is* listed by `mokutil --list-enrolled` | The key carries the Module-signing only OID — see [Step 1](#step-1-generate-a-signing-key) |
| Fails on every machine, including enrolled ones | Shim is not in the boot chain — see [the chain](#the-chain-you-are-building) |
| Worked yesterday, fails today | FOG was updated *before* `--secure-boot-key` was configured, so the kernels were replaced unsigned. Re-run the installer with the key set and it will not happen again |
| Complains about format, not signature | Kernel lacks `CONFIG_EFI_STUB` |

---

## Signing your own FOS builds

If you build FOS yourself rather than using the released kernels, `build.sh`
can sign as part of the build, so the published `.sha256` covers the signed
image:

```bash
./build.sh -nka x64 \
  --sign-key  /root/fog-secureboot/MOK.priv \
  --sign-cert /root/fog-secureboot/MOK.der
```

`FOS_SIGN_KEY` and `FOS_SIGN_CERT` work too, which is easier in CI. With
neither set the build is byte-for-byte what it always was.

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
  without physical presence — that is the security property, not an oversight.
  The enrolment kit makes the visit short; it cannot remove it. Enrolling into
  the firmware's own `db` instead would avoid the visit, but `db` updates must
  be signed by a private PK or KEK, and on OEM hardware that key is
  Microsoft's. In practice only Dell exposes a genuinely scriptable path, via
  Custom Mode in Dell Command | Configure and iDRAC.
- **The initrd is unverified**, as it is everywhere else. If your threat model
  requires a verified initramfs, Secure Boot alone does not give you that on
  any distribution.
- Signing covers *booting*. It says nothing about whether the image FOS then
  writes to disk is trustworthy.
- **HTTPS is not supported under Secure Boot.** FOG's HTTPS mode works because
  the server's CA is compiled into FOG's own iPXE binaries. Upstream's signed
  `ipxe.efi` has no such CA, and adding one would make it a custom binary again
  — which the shim would then reject. Secure Boot clients need FOG in HTTP
  mode, or a certificate chain the stock binary already trusts.
- **The signature chain is verified; the device-init half is not.** FOG has
  confirmed on VirtualBox that the firmware accepts the signed shim, the shim
  accepts upstream's `ipxe.efi`, and iPXE loads `autoexec.ipxe` — and that
  removing the shim makes the firmware reject the same binary, so the trust
  boundary is real. What has *not* been confirmed anywhere is a MOK-signed
  `bzImage` actually booting, because the all-drivers binary hangs during
  device init on that hardware (see the warning in Step 3a). Reports from
  physical hardware are very welcome — see
  [fogproject#960](https://github.com/FOGProject/fogproject/issues/960).

## See also

- [BIOS and UEFI co-existence](bios-and-uefi-co-existence.md)
- [UEFI boot entries](uefi-boot-entries.md)
