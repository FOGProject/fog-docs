---
title: Secure Boot - signing FOS with your own key (1.5)
aliases:
    - Secure Boot - signing FOS with your own key (1.5)
description: How FOG 1.5 signs FOS kernels for UEFI Secure Boot, and where to go to enroll a client, bring your own certificate, or dig into the mechanics
context_id: secure-boot-signing-1.5
tags:
    - how-to
    - secure-boot
    - uefi
    - advanced
    - pki
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[kb/how-tos/secure-boot-signing|1.6 version]] of this page for FOG 1.6.

# Secure Boot: signing FOS with your own key (1.5)

>[!warning] This is a hands-on procedure
>Enrolling a certificate requires **physically visiting each machine once** —
>FOG 1.5 has no unattended alternative (1.6 adds one; see the note below). If
>your site can leave Secure Boot disabled for imaging, that remains far less
>work. Read [Why FOG cannot do this for you](#why-fog-cannot-do-this-for-you)
>before deciding.
>
>The server side is automatic — the installer generates a Secure Boot CA and
>a signing key, signs the FOS kernels, and keeps them signed across
>upgrades, with nothing to configure. What you cannot avoid is enrolling the
>certificate on each client, one way or another.

>[!info] The certificate you enroll and the key that signs are different certificates
>FOG 1.5's Secure Boot setup has two parts: a **Secure Boot CA**, which is what
>gets enrolled on each machine (published as `MOK.der`), and a **signing
>leaf** issued by that CA, which is what actually signs kernels day to day.
>That split means rotating the signing key — see [Rotating or removing a
>key](#rotating-or-removing-a-key) — normally doesn't require re-enrolling
>anything. For the full picture of how this fits alongside FOG's other
>certificates, see [[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]] and
>[[1.5/kb/reference/pki-glossary|the PKI glossary (1.5)]]. If you're recovering from
>a much earlier build that predates this split, see
>[the old flat MOK](#the-old-flat-mok) below.
>
>Signing is on by default. Use `--no-secure-boot` to turn it off.

>[!danger] HTTPS and Secure Boot are mutually exclusive on FOG 1.5
>If your server has `httpproto=https` set, the installer does not stage the
>signed Secure Boot chain at all — there's nothing here for a client to
>enroll or boot through. See
>[[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]]
>for why. Everything on this page assumes `httpproto=http` (the default).

FOG does not ship signed FOS kernels, and cannot. If your estate mandates UEFI
Secure Boot and turning it off is not an option, this guide explains why, and
routes you to the right page for what you need to do about it.

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

**FOG does not ship stock iPXE binaries.** FOG builds its own — with the boot
script compiled in for its own binaries, and, whenever `httpproto=https`, with
this server's CA baked in so iPXE can validate the vhost's certificate. Those
are by definition custom binaries, so upstream's signed shim will not accept
them on the strength of iPXE's vendor certificate alone, exactly as it should.
A shim that loaded any binary calling itself iPXE would be worthless.

What FOG *does* do is sign them itself. Every `.efi` in FOG's TFTP tree that
isn't already signed by iPXE is signed with this server's own Secure Boot key,
and shim will load one once that key has been enrolled as a MOK on the
machine — which is the physical visit this guide is about. So the choice is
not "signed shim or custom binary"; it is whether you need a custom binary
badly enough to enrol a key before the machine can netboot. Most sites do not,
which is why the section below matters.

>[!note] Only your own tree is signed
>`secureboot/` is left strictly alone — that is upstream's Microsoft-signed
>shim, its loaders and MokManager, and adding a second signature to them buys
>nothing. Binaries you build and copy into `/tftpboot` by hand are not signed
>either; re-run the installer so it signs them.

The way out is to stop needing a custom binary. FOG's embedded boot script is
entirely generic, and iPXE 2.0 can fetch that script from the TFTP server
instead (`autoexec.ipxe`). That lets you run **upstream's signed `snponly.efi`**
and still get FOG's boot behavior — which is the approach FOG takes.

The alternative the firmware already provides is **MOK** (Machine Owner Key):
a per-machine list of extra certificates that *you*, as the physical owner of
the machine, choose to trust. That is what
[[1.5/kb/how-tos/secure-boot-mok-enrollment|MOK enrollment (1.5)]] uses.

>[!info] Why enrollment usually cannot be automated
>MOK enrollment requires a human at the physical console pressing keys. That
>is not an oversight — it is the security property. If a remote process
>could enroll a signing key, Secure Boot would be decorative. Budget for one
>visit per machine, the same way you would for a firmware password. **FOG 1.6
>adds a way to skip this per-machine visit entirely by enrolling directly
>into firmware (Setup Mode); FOG 1.5 has no equivalent** — the visit is not
>optional on this line, however your firmware is configured.

---

## What actually needs signing

Less than most people expect.

| Component | Signed? | Why |
| --- | --- | --- |
| iPXE (`snponly.efi` / `ipxe.efi`) | **No — use upstream's signed build** | Signed by the iPXE project via its shim; FOG's own builds are custom and unsigned |
| shim (`snponly-shimx64.efi` / `ipxe-shimx64.efi`) | **No — Microsoft already signed it** | Published by the iPXE project |
| FOS kernel (`bzImage`, `bzImage32`) | **Yes — this is your job** | The firmware refuses to load an unsigned kernel |
| FOS init (`init.xz`, `init_32.xz`) | **No** | See below |
| Your images, snapins, scripts | **No** | They are never executed by firmware |

>[!note] `TRUST=`-rebuilt iPXE is never Secure-Boot-signed on this line
>1.6 lets you sign a `TRUST=`-rebuilt iPXE with your own key for use with
>Setup Mode enrollment. 1.5 doesn't need the equivalent row: whenever iPXE
>gets rebuilt at all (any `httpproto=https` server), the Secure Boot chain is
>skipped entirely — see the danger box near the top of this page.

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
your certificate.

The consequence is easy to get wrong: **MOK cannot help the first binary in the
chain.** When the firmware PXE-boots a file directly, it checks that file
against `db` only, because nothing has loaded shim yet to consult MOK. That is
why the shim — not iPXE — has to be your DHCP boot file. Point DHCP straight at
an iPXE binary and no amount of signing or enrolling will save you.

The iPXE shim decides what to load next **from its own filename**, by stripping
`-shim` out of it. Named `snponly-shimx64.efi`, it loads `snponly.efi` from the
directory it was itself loaded from; named `ipxe-shimx64.efi`, it loads
`ipxe.efi`. Whichever you pick, the second-stage file has to be sitting beside
it under exactly that name. Serving the signed chain and signing the kernels
is covered in
[[1.5/kb/reference/secure-boot-technical-details|Secure Boot technical details (1.5)]].

---

## Enrollment route

>[!info] MOK enrollment only
>FOG 1.6 offers a choice between Setup Mode enrollment (unattended, on
>firmware that supports it) and MOK enrollment. **FOG 1.5 has only MOK
>enrollment** — see
>[[1.5/kb/how-tos/secure-boot-mok-enrollment|MOK enrollment (1.5)]], Routes A
>and B, both requiring a person at the console once per machine. Neither
>requires turning Secure Boot off.

---

## Before you start

>[!tip] Planning to migrate this server soon? Do that first
>If a server migration (moving FOG to new hardware) is already on your
>roadmap, do it **before** setting up Secure Boot here, not after. Migrating
>an already-enrolled Secure Boot setup is a viable, well-understood path —
>copy the `pki/secureboot/` directory forward — but it is still one more
>thing to get right, and getting it wrong means every already-enrolled
>client needs re-enrolling a second time for no reason. Enrolling once, on
>the server you intend to keep, is strictly less work than enrolling now and
>potentially again later. See
>[[installation/server/migrating-fog-server|Migrating FOG Server]] (not yet
>forked for 1.5 — check its steps against your installed version).

On the FOG server, nothing. `sbsigntool` (`sbsigntools` on RHEL/Rocky/Alma/
Fedora and Arch) is part of the installer's baseline package set, alongside
`openssl`. If your distribution ships neither name the installer says so and
carries on, leaving the kernels unsigned — read the installer output rather
than assuming.

On each client machine you intend to enroll via MOK, you need a way to run
`mokutil` — most simply, boot it once from any Linux live USB.

You do **not** need to download the signed shim or the signed `snponly.efi`.
Every install with `httpproto=http` stages them at `/tftpboot/secureboot/`:

```
/tftpboot/secureboot/
├── snponly-shimx64.efi   Microsoft-signed shim (2011 + 2023), from ipxe/shim
├── snponly.efi           upstream's signed iPXE — firmware's own NIC driver
├── ipxe-shimx64.efi      the same shim again, under the name that loads ipxe.efi
├── ipxe.efi              upstream's signed iPXE — iPXE's own NIC drivers
├── mmx64.efi             MokManager, used during enrolment
├── autoexec.ipxe         FOG's boot script
└── arm64-efi/            the same set for arm64, if your install stages it
```

Two complete chains, so you can switch between them with nothing but a DHCP
change. `snponly` is the default and the right first choice; `ipxe` is the
fallback for firmware whose own network stack does not work — see
[[1.5/kb/reference/secure-boot-technical-details|Secure Boot technical details (1.5)]]
for which to use and how to serve it.

Nothing is served from this directory unless you point DHCP at it, so its
presence changes nothing for your existing clients.

>[!info] If the directory is missing
>Two possible reasons: the download failed (deliberately not fatal, so the
>install completed and said so in its output — re-run it), or `httpproto` is
>`https` on this server, in which case the directory is never staged at
>all — see the danger box near the top of this page.

You can confirm you have a signed binary — a signed one has a non-empty
certificate table, an unsigned one does not:

```bash
sbverify --list /tftpboot/secureboot/snponly.efi
```

The signer should be **iPXE Secure Boot Intermediate G1A**. FOG's own builds
elsewhere in the TFTP tree are either unsigned or signed by **FOG Project
Secure Boot Signing**, this server's own key. Either of those means you are
looking at the wrong file.

On arm64 the equivalents are `arm64-efi/snponly-shimaa64.efi` and
`arm64-efi/snponly.efi`.

>[!note] Why the shim is renamed `snponly-shimx64.efi`
>The shim decides what to load next by **stripping `-shim` out of its own
>filename** — `ipxe-shimx64.efi` looks for `ipxe.efi`, and
>`snponly-shimx64.efi` looks for `snponly.efi`. That is upstream's own
>mechanism, not a trick. Renaming does not disturb the signature, which
>covers the file's contents rather than its name.

>[!note] Verify your FOS kernel has an EFI stub
>Under Secure Boot the kernel is loaded by the firmware's own loader rather
>than by iPXE's Linux loader, which requires `CONFIG_EFI_STUB=y`. Stock FOS
>kernels are expected to have it; if boot fails immediately after signing
>with a format complaint rather than a signature complaint, this is the
>first thing to check.

---

## The signing key

**The installer already did this.** On first install (with `httpproto=http`)
it generates a Secure Boot CA and a signing leaf under that CA, and signs the
FOS kernels with the leaf, so unless you want to supply your own key there is
nothing to run here.

```
/opt/fog/pki/secureboot/
├── ca/
│   ├── .fogSBCA.key           0400 root:root — signs the leaf below
│   ├── .fogSBCA.pem
│   └── .fogSBCA.der           this is what MOK.der publishes — ENROL THIS
└── leaf/
    ├── sign.key                0600 root:root — what sbsign actually signs with
    └── sign.pem
```

The directory sits under `$fogprogramdir`, which is never inside the web root,
so none of it is reachable over HTTP. **The web server cannot read either
private key**: kernel downloads from the web UI are signed by a small
root-only helper (`fog-sign-kernel`) that takes no arguments, rather than in
the web server itself. Only the public certificate is published, as `MOK.der`
in the enrollment kit.

Back up the whole `pki/secureboot/` directory somewhere you would put a root
password. Anyone holding the CA key can mint a new signer your machines will
trust without re-enrolling; anyone holding the leaf key can sign a kernel,
full stop.

>[!warning] The CA is never regenerated on its own — but `--recreate-CA` destroys it
>Re-running the installer reuses the existing CA. A fresh CA silently
>invalidates enrollment on **every machine that already trusted the old one**,
>and nothing surfaces that until a client fails to boot.
>
>`--recreate-keys` does not reach the Secure Boot zone. **`--recreate-CA`
>does** — it removes the root CA and every intermediate beneath it, this zone
>included, because an intermediate orphaned by a new root would chain to
>nothing. The Secure Boot CA is re-issued as a different certificate, and every
>enrolled machine has to enroll again. Do not reach for that flag to fix an
>unrelated web-certificate problem on a server with Secure Boot clients.
>
>To rotate the CA on purpose, delete `pki/secureboot/`, re-run the installer,
>and re-enroll every client — see
>[Rotating or removing a key](#rotating-or-removing-a-key). Rotating just the
>*leaf* — the normal case — does not require any of this; see the same section.

### Bringing your own key

Want to sign with a key you already control instead of FOG's auto-generated
one? See [[1.5/kb/reference/bringing-your-own-ca|Bringing your own CA (1.5)]] —
it covers generating a leaf and getting a CA/leaf split by hand. Unlike 1.6,
1.5 has no `--secureboot-ca-cert` flag, so an admin-supplied key is always a
flat leaf unless you do the CA/leaf split yourself.

### Turning signing off

`--no-secure-boot` skips key generation entirely and leaves the FOS kernels
unsigned. It is remembered in `.fogsettings`, so an upgrade will not hand back
a key and a `sudoers` rule you deliberately declined.

### The old flat MOK

If you're reading this because a machine somewhere already enrolled a
self-signed `MOK.key`/`MOK.pem` pair predating the CA/leaf split, two things:

- Any server still on that layout gets moved onto the CA/leaf hierarchy
  automatically. The old `MOK.{key,pem}` is left on disk untouched, so
  anything already signed with it can still be re-signed, but new signing
  uses the new leaf.
- Every machine that enrolled the old flat MOK needs to enroll the new CA
  once more — there is no way around a fleet-wide re-enrollment when the
  enrolled certificate itself changes. If this affects you, back up your
  existing `pki/secureboot/`/`secureboot/` directories and
  [open an issue](https://github.com/FOGProject/fogproject/issues) or ask on
  the [FOG forums](https://forums.fogproject.org/).

Note this is distinct from a **deliberately** supplied flat key
(`--secure-boot-key`/`--secure-boot-cert`, with no `--secureboot-ca-cert`
equivalent to turn it into a CA on 1.5) — that one stays flat by design; see
[[1.5/kb/reference/pki-glossary#flat-mok|Flat MOK]] in the glossary.

---

## Rotating or removing a key

### Rotating FOG's own auto-generated leaf — the normal case

If you're using FOG's own auto-generated key (no `--secure-boot-key`/
`--secure-boot-cert` passed), the signing leaf rotates **without touching
any client**:

```bash
/opt/fog/pki/renewal-helper --zone secureboot
```

This re-issues the leaf from the Secure Boot CA and re-signs the kernels.
Nothing is re-enrolled in firmware, because what's enrolled is the CA, not
this leaf — see
[[1.5/kb/reference/pki-zones#secure-boot|Secure Boot (1.5)]]. This is the
case to reach for on a normal schedule; the two cases below are the
disruptive ones.

### Switching to a key you supply

Nothing needs deleting for this one — an admin-supplied key/cert always
takes over immediately, whether or not FOG's own CA/leaf pair already exists:

```bash
cd /path/to/fogproject/bin
./installfog.sh \
  --secure-boot-key  /path/to/your/MOK.priv \
  --secure-boot-cert /path/to/your/MOK.der
```

That one run re-signs the FOS kernels with your key and republishes the
enrollment kit — `MOK.der` and the fingerprint on the **Secure Boot** page —
from your certificate, in the same pass. This always switches you to the
**flat model** (see
[[1.5/kb/reference/bringing-your-own-ca|Bringing your own CA (1.5)]] — there
is no `--secureboot-ca-cert` on 1.5 to avoid it), so every already-enrolled
client needs re-enrolling — see the danger box below. The paths are recorded
in `.fogsettings`, so every later upgrade keeps using them without the flags
being passed again.

>[!warning] Keep the files where you pointed the installer
>The installer never copies your key or certificate in anywhere — it only
>remembers the paths you gave it. Moving or deleting those files afterward
>breaks signing on the next install or upgrade run, the same way losing any
>other private key would.

### Rotating FOG's own CA

If you want a fresh CA rather than just a fresh leaf under the existing one,
delete the directory first — the installer only generates a new CA when none
is present:

```bash
rm -rf /opt/fog/pki/secureboot
cd /path/to/fogproject/bin && ./installfog.sh
```

That produces a new CA and leaf and re-signs the kernels with the new leaf.

>[!danger] Changing the enrolled certificate stops every already-enrolled client booting at that moment
>This applies to switching to your own flat key, or rotating the CA itself —
>not to rotating just the auto-generated leaf, which is the whole point of
>having a CA above it. Either disruptive path invalidates every client's
>existing trust at once, and nothing surfaces that until a client fails to
>boot. Treat it as a deliberate, planned, estate-wide operation with every
>machine's new fingerprint re-enrolled in the same window, not a routine
>step or something to do mid-troubleshooting.

To remove trust for a certificate from a single MOK-enrolled machine, see
[[1.5/kb/how-tos/secure-boot-mok-enrollment#withdrawing-a-key-from-one-machine|Withdrawing a key from one machine (1.5)]].

### If the private key is compromised

**There is no remote revocation.** If the compromised key is the auto-
generated leaf, rotate it per [above](#rotating-fogs-own-auto-generated-leaf--the-normal-case)
and nothing else needs to happen. If the compromised key is the CA itself
(or a flat admin-supplied key), every machine that enrolled it needs a
physical visit to remove it and enroll the replacement's fingerprint, exactly
like a planned rotation, just unplanned. That per-machine visit is the trade
you accept for not needing anyone else's permission to sign your own
kernels — treat the private key accordingly, and back it up somewhere you
would put a root password; see [The signing key](#the-signing-key).

---

## Known limits

- **EFI only.** Secure Boot is a UEFI feature; BIOS/legacy PXE clients are
  unaffected and need none of this.
- **HTTPS and Secure Boot cannot be combined on this line.** See the danger
  box near the top of this page and
  [[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]].
- **One visit per machine, always.** There is no supported way to enroll a
  MOK without physical presence — that is the security property, not an
  oversight. FOG 1.5 has no Setup Mode alternative to remove it.
- **The initrd is unverified**, as it is everywhere else. If your threat model
  requires a verified initramfs, Secure Boot alone does not give you that on
  any distribution.
- Signing covers *booting*. It says nothing about whether the image FOS then
  writes to disk is trustworthy.
- **A Secure Boot USB stick does not work the same way.** The filename trick
  the shim uses to find its second stage — `automatic_next_path()` — is called
  only from shim's network and HTTP boot paths. There is no local-filesystem
  equivalent, so a shim booted from a USB stick or an ESP ignores the `-shim`
  rename entirely and falls back to its compiled-in default, `ipxe.efi`. If you
  build a Secure Boot USB from these instructions, name the second stage
  `ipxe.efi` or it will not be found.

>[!warning] Turning Secure Boot on can break existing Windows Hello for Business sign-in
>If a machine already has users signed in with Windows Hello for Business
>(PIN or biometric) from before Secure Boot was enabled, those sign-in
>methods typically stop working once it is turned on -- WHfB's local key
>container is sealed against the machine's boot security state, and enabling
>Secure Boot changes it. This is a Windows Hello/Entra ID consequence of
>changing Secure Boot state, not a FOG or MOK issue; it happens the same way
>no matter what enables Secure Boot.
>
>To fix it per affected user:
>
>1. In the Entra admin center: **Users → *(the user)* → Authentication
>   methods → remove Windows Hello for Business.**
>2. Log the user in with their password.
>3. As that user, run:
>   ```
>   certutil.exe -DeleteHelloContainer
>   ```
>4. If Group Policy enables/enforces Windows Hello for Business, also run:
>   ```
>   gpupdate /force
>   ```
>5. Restart the computer. The user signs in with their password and can then
>   re-create their PIN and biometric sign-in.

>[!note] Clearing the TPM does not touch enrolled keys
>Separately from the above: clearing a machine's TPM removes what is sealed
>*to* the TPM (BitLocker keys, the Windows Hello for Business container,
>etc.), but MOK enrollment is not TPM-backed at all — MokList lives in
>ordinary UEFI (NVRAM) variables that shim reads directly. Clearing the TPM
>neither enrolls nor un-enrolls a MOK, and does not interact with anything else
>in this guide.

## See also

- [[1.5/kb/reference/secure-boot-trust-stores|The two trust stores (1.5)]] — `db` vs `MokList`, and which one your boot path consults
- [[1.5/kb/how-tos/secure-boot-mok-enrollment|MOK enrollment (1.5)]] — Routes A and B
- [[1.5/kb/reference/secure-boot-technical-details|Secure Boot technical details (1.5)]] — serving the signed chain, signing kernels, signing your own FOS builds
- [[1.5/kb/reference/bringing-your-own-ca|Bringing your own CA (1.5)]]
- [[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]]
- [[1.5/kb/reference/pki-glossary|PKI & Secure Boot Glossary (1.5)]]
- [[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]] — why HTTPS and Secure Boot can't be combined on this line
