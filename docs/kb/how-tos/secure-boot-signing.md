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

!!! warning "This is a hands-on procedure"
    It requires **physically visiting each machine once**. If your site can
    leave Secure Boot disabled for imaging, that remains far less work. Read
    [Why FOG cannot do this for you](#why-fog-cannot-do-this-for-you) before
    deciding.

    The server side is automatic since FOG 1.6.0 — the installer generates a
    signing key, signs the FOS kernels with it, and keeps them signed across
    upgrades, with nothing to configure. The per-machine visit does **not**
    require turning Secure Boot off. What you cannot avoid is the visit.

>[!info] What changed in FOG 1.6.0
>Signing used to be opt-in, enabled by passing `--secure-boot-key` and
>`--secure-boot-cert`. It is now on by default and the key is generated for
>you, so [Step 1](#step-1-the-signing-key) is reading rather than doing unless
>you want to supply your own key. Use `--no-secure-boot` to turn it off.

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
binaries with that key — both the all-drivers `ipxe.efi` and the `snponly.efi`
variant FOG already prefers, for x86_64 and arm64 alike. So a **stock upstream
iPXE** boots under Secure Boot with nothing for you to sign.

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
instead (`autoexec.ipxe`). That lets you run **upstream's signed `snponly.efi`**
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
| iPXE (`snponly.efi`) | **No — use upstream's signed build** | Signed by the iPXE project; FOG's own builds are custom and unsigned |
| shim (`snponly-shimx64.efi`) | **No — Microsoft already signed it** | Published by the iPXE project |
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
UEFI firmware        (trusts Microsoft's certificate, via `db`)
  └─ snponly-shimx64.efi  ← Microsoft-signed, published by the iPXE project
      └─ snponly.efi      ← signed by iPXE; UPSTREAM's build, not FOG's
          └─ bzImage      ← YOU sign this; shim checks it against MOK
              └─ init.xz  ← not verified, nothing to do
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

The iPXE shim decides what to load next **from its own filename**, by stripping
`-shim` out of it. Named `snponly-shimx64.efi`, it loads `snponly.efi` from the
directory it was itself loaded from; named `ipxe-shimx64.efi`, it loads
`ipxe.efi`. Whichever you pick, the second-stage file has to be sitting beside
it under exactly that name.

!!! warning "Use upstream's signed build, not FOG's"
    FOG's own binaries in `/tftpboot` — including those in `autoexec/` — are
    locally built and unsigned, so the shim will reject them, even though one
    of them is also called `snponly.efi`. Download the signed build from the
    iPXE project. FOG's boot logic reaches it through `autoexec.ipxe` instead
    of being compiled in.

!!! tip "The alternative: enrol into `db` instead"
    Many firmwares can be put into Custom or Setup mode, letting you add your
    own certificate to `db` directly. That removes shim from the picture — sign
    whatever you like and the firmware loads it. It is the only route if you
    need FOG's *custom* iPXE (embedded CA for HTTPS) under Secure Boot, but the
    menus vary enormously between vendors and some do not expose `db` editing
    at all.

---

## Before you start

On the FOG server, nothing. `sbsigntool` (`sbsigntools` on RHEL/Rocky/Alma/
Fedora and Arch) is part of the installer's baseline package set since FOG
1.6.0, alongside `openssl`. If your distribution ships neither name the
installer says so and carries on, leaving the kernels unsigned — read the
installer output rather than assuming.

On each client machine you intend to enrol, you need a way to run `mokutil` —
most simply, boot it once from any Linux live USB.

You do **not** need to download the signed shim or the signed `snponly.efi`.
Since FOG 1.6.0, every install stages them at `/tftpboot/secureboot/`:

```
/tftpboot/secureboot/
├── snponly-shimx64.efi   Microsoft-signed shim (2011 + 2023), from ipxe/shim
├── snponly.efi           upstream's signed iPXE
├── mmx64.efi             MokManager, used during enrolment
├── autoexec.ipxe         FOG's boot script
├── MANIFEST              where each file came from, with checksums
└── arm64-efi/            the same set for arm64
```

Everything but `autoexec.ipxe` is upstream's, republished byte for byte through
the [fog-ipxe](https://github.com/FOGProject/fog-ipxe) release the installer
already downloads. Every file's SHA-256 and its signer are verified when that
release is built, so a test-signed or tampered binary fails the release rather
than reaching your server. `MANIFEST` records the source URL and checksum of
each file if you want to confirm that yourself.

Nothing is served from this directory unless you point DHCP at it, so its
presence changes nothing for your existing clients.

!!! info "If the directory is missing"
    Two reasons it would not be there. **HTTPS installs skip it** — these are
    upstream's generic binaries, so they cannot carry your server's CA, and a
    signed binary cannot be rebuilt without voiding the signature, which makes
    Secure Boot and FOG's HTTPS mode mutually exclusive. See [the note on
    enrolling into `db`](#the-chain-you-are-building) for the way round that.
    Otherwise the download failed — it is deliberately not fatal — and the
    installer will have said so. Re-run it.

You can confirm you have a signed binary — a signed one has a non-empty
certificate table, an unsigned one does not:

```bash
sbverify --list /tftpboot/secureboot/snponly.efi
```

The signer should be **iPXE Secure Boot Intermediate G1A**. FOG's own
`/tftpboot/ipxe.efi` and `/tftpboot/autoexec/snponly.efi` have no signature at
all — if you see that, you are looking at the wrong file.

On arm64 the equivalents are `arm64-efi/snponly-shimaa64.efi` and
`arm64-efi/snponly.efi`.

>[!note] Why the shim is renamed `snponly-shimx64.efi`
>The shim decides what to load next by **stripping `-shim` out of its own
>filename** — `ipxe-shimx64.efi` looks for `ipxe.efi`, and
>`snponly-shimx64.efi` looks for `snponly.efi`. That is upstream's own
>mechanism, not a trick: `ipxeboot.tar.gz` ships `ipxe-shim.efi` and
>`snponly-shim.efi` as two symlinks to a single `shimx64.efi` for exactly this
>reason. Renaming does not disturb the signature, which covers the file's
>contents rather than its name.

>[!note] The shim comes from the ipxe/shim release, not from `ipxeboot.tar.gz`
>The tarball contains a `shimx64.efi` too, but it carries only the Microsoft
>UEFI CA **2011** signature. The standalone `ipxe-shimx64.efi` — the one FOG
>stages — carries **two**, 2011 and 2023, which matters on newer hardware that
>ships only the 2023 certificate.
>
>Both facts were confirmed by reading the PE certificate tables directly: the
>standalone shim has two `WIN_CERTIFICATE` entries, the bundled one has a
>single 2011 entry. The fog-ipxe release asserts **both** signatures are
>present, so a silent upstream regression to a 2011-only build fails the
>release rather than stranding anyone on 2023-only firmware.

!!! note "Verify your FOS kernel has an EFI stub"
    Under Secure Boot the kernel is loaded by the firmware's own loader rather
    than by iPXE's Linux loader, which requires `CONFIG_EFI_STUB=y`. Stock FOS
    kernels are expected to have it; if boot fails immediately after signing
    with a format complaint rather than a signature complaint, this is the
    first thing to check.

---

## Step 1 — The signing key

**The installer already did this.** On first install it generates a signing
key and signs the FOS kernels with it, so unless you want to supply your own
key there is nothing to run here.

```
/opt/fog/secureboot/          0700, root:root
├── MOK.key                   0600 — the private key
├── MOK.pem                   0644 — the certificate, PEM (what sbsign reads)
└── mok.cnf                   the openssl config used to generate the pair
```

The directory sits under `$fogprogramdir`, which is never inside the web root,
so none of it is reachable over HTTP. **The web server cannot read the private
key**: kernel downloads from the web UI are signed by a small root-only helper
(`/opt/fog/bin/fog-sign-kernel`) that takes no arguments, rather than in the
web server itself. Only the public certificate is published, as `MOK.der` in
the enrolment kit.

Back up `MOK.key` somewhere you would put a root password. Anyone holding it
can produce something your machines will boot.

>[!warning] The key is never regenerated, on purpose
>Re-running the installer reuses the existing pair. A fresh key silently
>invalidates enrolment on **every machine that already trusted the old one**,
>and nothing surfaces that until a client fails to boot. `--recreate-keys` and
>`--recreate-CA` deliberately do not reach it. To rotate on purpose, delete
>`/opt/fog/secureboot/`, re-run the installer, and re-enrol every client — see
>[Rotating or removing a key](#rotating-or-removing-a-key).

### Bringing your own key

If you already have a signing key — a site CA, or one shared with other
tooling — pass it instead and the installer will never touch or overwrite it:

```bash
mkdir -p /root/fog-secureboot && cd /root/fog-secureboot

openssl req -new -x509 -newkey rsa:2048 \
  -keyout MOK.priv -outform DER -out MOK.der \
  -days 3650 -subj "/CN=FOG imaging - $(hostname -f)/" \
  -nodes

# The same certificate in PEM. Both formats are needed -- see the note below.
openssl x509 -inform DER -in MOK.der -outform PEM -out MOK.pem

chmod 600 MOK.priv
```

```bash
cd /path/to/fogproject/bin
./installfog.sh \
  --secure-boot-key  /root/fog-secureboot/MOK.priv \
  --secure-boot-cert /root/fog-secureboot/MOK.der
```

- `MOK.priv` — the private key. **Never leaves this machine.** Back it up
  somewhere you would put a root password, not somewhere you would put a
  config file.
- `MOK.der` — the public certificate, DER-encoded. This is what you distribute
  to clients and what `mokutil` enrols; it is not sensitive.
- `MOK.pem` — the same certificate, PEM-encoded. This is what `sbsign` and
  `sbverify` read.

Both paths are recorded in `.fogsettings`, so later upgrades keep using them
without the flags being passed again. The two options are only meaningful
together — the installer refuses half a pair rather than leaving kernels
unsigned on a server whose admin believes they are signed.

>[!warning] `sbsign` and `sbverify` cannot read a DER certificate
>They load certificates with OpenSSL's `PEM_read_bio_X509`, which rejects DER
>outright:
>
>```
>$ sbsign --key MOK.priv --cert MOK.der --output out.efi in.efi
>Can't load certificate from file 'MOK.der'
>error:0480006C:PEM routines:get_name:no start line ... Expecting: CERTIFICATE
>```
>
>`mokutil` and MokManager want the opposite. Neither tool tells you which
>format it wanted, so keep both files and use `MOK.der` for enrolment and
>`MOK.pem` for signing. The installer's `--secure-boot-cert` accepts either and
>converts internally, so this only bites you when running `sbsign`/`sbverify`
>by hand.

The `-days 3650` gives ten years. Choose something you will actually remember
to renew — an expired MOK stops machines booting. The installer-generated key
uses the same ten years, with the CN `FOG Project Secure Boot Signing`.

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
>
>The key the installer generates carries no such OID either, so this only
>applies if you are supplying your own.

### Turning signing off

`--no-secure-boot` skips key generation entirely and leaves the FOS kernels
unsigned. It is remembered in `.fogsettings`, so an upgrade will not hand back
a key and a `sudoers` rule you deliberately declined.

---

## Step 2 — Enrol the certificate on a client

Repeat per machine. **You do not need to turn Secure Boot off to do this**, and
you should not: both routes below work with it left on.

The FOG web UI has a **FOG Configuration → Secure Boot** page. It shows your
certificate's SHA-256 fingerprint, offers a small **enrolment kit**, and
repeats the per-client steps below as a checklist:

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
**`secureboot/snponly-shimx64.efi`**. Nothing in this step needs signing by you —
both binaries already carry signatures the firmware and shim trust.

>[!tip] This is the same driver model FOG already uses
>`snponly` binds only the firmware's own UEFI network protocol instead of
>replacing the NIC driver, which is exactly why FOG serves `snponly.efi` to
>every other client. So a Secure Boot machine now behaves like the rest of your
>estate rather than being a special case — the only difference is the shim in
>front and the signature on the kernel.
>
>Upstream also publishes a signed all-drivers `ipxe.efi` in the same
>`<arch>-sb/` directory, paired with `ipxe-shim.efi`. Use it only if you have a
>NIC the firmware's own driver does not handle; it is the more invasive option,
>and it is the one that hangs on hardware where the takeover fails.

Because upstream's `snponly.efi` has no boot script compiled in, it fetches one
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

The installer satisfies both. It hard-links `autoexec.ipxe` into every
directory an EMBED-less binary can be booted from — the TFTP root,
`autoexec/`, `autoexec/i386-efi/`, `autoexec/arm64-efi/`, `secureboot/` and
`secureboot/arm64-efi/`. All six are one file, so editing any of them changes
all of them and there is no copy left quietly running the old script.

A hard link rather than a symlink because some TFTP daemons refuse to follow
symlinks, while a hard link is indistinguishable from a regular file to all of
them. A hard link rather than a copy so the paths cannot drift apart.

If a link has been broken — an older install, or the file was replaced by an
editor that writes-and-renames — re-running the installer restores it, or:

```bash
sudo ln -f /tftpboot/autoexec/autoexec.ipxe /tftpboot/secureboot/autoexec.ipxe
```

You can check they really are one file: every copy should report the same
inode and a link count of 6.

```bash
find /tftpboot -name autoexec.ipxe -printf '%i  links=%n  %p\n'
```

!!! tip "If nothing seems to happen"
    Watch the TFTP server's log during a boot — it tells you exactly which
    filenames the client asked for and whether they were served, which beats
    guessing every time.

Your existing clients are unaffected — FOG's own unsigned `snponly.efi` stays
at the TFTP root, and non-Secure-Boot machines keep booting it. The signed copy
lives under `secureboot/` and is reached only by machines you point there.

>[!note] Both files are called `snponly.efi`, and that is fine
>`/tftpboot/snponly.efi` is FOG's own build — the boot script compiled in, no
>signature. `/tftpboot/secureboot/snponly.efi` is upstream's signed build,
>which reads its script from `autoexec.ipxe` instead. They are different
>binaries doing the same job by different means, which is why the signed one
>gets its own directory rather than replacing the other.

### 3b — The FOS kernels

This is the part that is genuinely yours to sign, and **the installer has
already done it** — there is no step here unless you supplied your own key,
in which case [Step 1](#bringing-your-own-key) covers passing it.

Every install and upgrade re-signs the kernels, and it has to: the FOS
binaries are re-copied into place unsigned on every run, so the signature is
removed and immediately re-applied in the same pass. That is what stops an
upgrade silently leaving you with kernels your clients will not boot — which
is the single most common way this setup breaks.

Verify — and note the certificate must be the **PEM**, because `sbverify` will
not read DER:

```bash
sbverify --cert /opt/fog/secureboot/MOK.pem \
  /var/www/fog/service/ipxe/bzImage
# Signature verification OK
```

The signer shown should match the fingerprint on the **FOG Configuration →
Secure Boot** page; that page's SHA-256 is the digest of the same certificate
your clients enrol.

The installer keeps a `.unsigned` copy of each kernel beside the signed one,
because `sbsign` will not cleanly re-sign an already-signed image. Leave them
alone; they are refreshed on every download.

>[!note] The web Kernel Update page is covered too
>Downloading a kernel from **FOG Configuration → Kernel Update** signs it
>before it is sent to the TFTP server, so that route cannot leave you with an
>unsigned kernel either. It signs through a small root-only helper
>(`$fogprogramdir/bin/fog-sign-kernel`, `/opt/fog/bin/…` by default) rather
>than in the web server itself, so the
>web server never gets read access to your private key. If signing fails the
>update is refused outright rather than quietly installing a kernel your
>clients will not boot.
>
>Be aware of the limit of that protection: anyone who can already run code as
>your web server can ask the helper to sign a kernel of their choosing. What
>they cannot do is walk off with the key.

>[!warning] If `sbsigntool` could not be installed
>The installer adds `sbsigntool` (`sbsigntools` on RHEL/Arch) to its baseline
>package set, but if neither name exists in your distribution's repositories
>it skips the package, then warns and carries on **unsigned** rather than
>aborting the whole install. Read the installer output — an unsigned kernel
>only announces itself at a client, as a `Security Policy Violation`.

---

## Step 4 — Verify end to end

Take one enrolled machine and PXE boot it with Secure Boot **on**:

- iPXE loads and shows its banner — the shim accepted `snponly.efi`, so the
  upstream signed binaries are working.
- The FOG menu appears — `autoexec.ipxe` is being served and read.
- Selecting a task boots FOS rather than failing — your signature is accepted.

If it stops at the third step with a security violation, the kernel signature
is not being accepted. In order of likelihood:

| Symptom | Cause |
| --- | --- |
| `Security Policy Violation` | Key not enrolled on *this* machine, or you signed with a different key than you enrolled |
| `Security Policy Violation`, but the key *is* listed by `mokutil --list-enrolled` | The key carries the Module-signing only OID — see [Step 1](#step-1-the-signing-key) |
| Fails on every machine, including enrolled ones | Shim is not in the boot chain — see [the chain](#the-chain-you-are-building) |
| Worked yesterday, fails today | Something replaced the kernels without re-signing them. On FOG 1.6.0+ the installer always re-signs, so suspect anything that copies into `service/ipxe/` outside it — check with `sbverify` and re-run the installer |
| Every machine stops working after a key change | The signing key was regenerated. Enrolment is per-key, so all clients need re-enrolling — see [Rotating or removing a key](#rotating-or-removing-a-key) |
| Complains about format, not signature | Kernel lacks `CONFIG_EFI_STUB` |

---

## Signing your own FOS builds

If you build FOS yourself rather than using the released kernels, `build.sh`
can sign as part of the build, so the published `.sha256` covers the signed
image:

```bash
./build.sh -nka x64 \
  --sign-key  /root/fog-secureboot/MOK.priv \
  --sign-cert /root/fog-secureboot/MOK.pem
```

If you are using the key the installer generated, that is
`--sign-key /opt/fog/secureboot/MOK.key --sign-cert /opt/fog/secureboot/MOK.pem`.

`--sign-cert` must be the **PEM** here — `build.sh` hands it straight to
`sbsign`, which cannot read DER.

`FOS_SIGN_KEY` and `FOS_SIGN_CERT` work too, which is easier in CI. With
neither set the build is byte-for-byte what it always was.

---

## Rotating or removing a key

To withdraw a key from a machine:

```bash
mokutil --delete MOK.der
```

then reboot and confirm in MokManager, exactly as for enrolment.

To rotate the **installer-generated** key, delete the directory and re-run the
installer — it only generates when no pair is present:

```bash
rm -rf /opt/fog/secureboot
cd /path/to/fogproject/bin && ./installfog.sh
```

That produces a new key and re-signs the kernels with it. **Every already-
enrolled client stops booting at that moment** and needs re-enrolling by hand,
so treat it as a deliberate estate-wide operation, not a troubleshooting step.

**There is no remote revocation.** If the private key is compromised, every
machine that enrolled it needs a physical visit to remove it. That is the trade
you accept in exchange for not needing anyone else's permission — treat the
private key accordingly.

---

## Verified

These steps have been run end to end with Secure Boot enforcing, through to a
completed deploy:

```
firmware (Secure Boot on, Microsoft certificates in db)
  └─ secureboot/snponly-shimx64.efi
      └─ secureboot/snponly.efi        ← shim rewrote its own filename to find it
          └─ secureboot/autoexec.ipxe → default.ipxe → boot.php
              └─ bzImage (MOK-signed)  ← LoadImage() consulted MokList, accepted it
                  └─ FOS → partclone → 42 GB deployed, Task Complete
```

Worth stating because a reader might reasonably fear the opposite: **no `shim`
command in the boot script and no `ShimRetainProtocol` handling were needed.**
Shim installs itself as the authority that later `LoadImage()` calls consult,
and that survives into iPXE on its own — so when iPXE loads the kernel, the
check goes against MokList rather than falling back to the firmware's `db`.
That assumption is what the whole MOK approach rests on, and it holds.

The signed binaries FOG stages are byte-for-byte the ones used in that run.

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
  `snponly.efi` has no such CA, and adding one would make it a custom binary
  again — which the shim would then reject. Secure Boot clients need FOG in
  HTTP mode, or a certificate chain the stock binary already trusts.
- **A Secure Boot USB stick does not work the same way.** The filename trick
  the shim uses to find its second stage — `automatic_next_path()` — is called
  only from shim's network and HTTP boot paths. There is no local-filesystem
  equivalent, so a shim booted from a USB stick or an ESP ignores the `-shim`
  rename entirely and falls back to its compiled-in default, `ipxe.efi`. If you
  build a Secure Boot USB from these instructions, name the second stage
  `ipxe.efi` or it will not be found.
- **Not confirmed on physical hardware.** The whole chain has been confirmed
  end to end in a VM — see [Verified](#verified) above — but nobody has yet
  reported it from real hardware. Reports very welcome; see
  [fogproject#960](https://github.com/FOGProject/fogproject/issues/960).

    An earlier revision of this page said there was no signed `snponly.efi` and
    that the all-drivers binary's device-init hang left Secure Boot users with
    nowhere to go. That was wrong: signed `snponly.efi` binaries ship in
    `ipxeboot.tar.gz` for x86_64 and arm64, and switching to them removes that
    problem entirely.

## See also

- [BIOS and UEFI co-existence](bios-and-uefi-co-existence.md)
- [UEFI boot entries](uefi-boot-entries.md)
