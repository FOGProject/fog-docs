---
title: Bringing Your Own CA (1.5)
aliases:
    - Bringing Your Own CA (1.5)
description: How to replace FOG 1.5's own Web or Secure Boot certificates with a CA or key you supply, per zone
context_id: bringing-your-own-ca-1.5
tags:
    - reference
    - security
    - certificates
    - pki
    - secure-boot
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[1.6/kb/reference/bringing-your-own-ca|1.6 version]] of this page for FOG 1.6.

# Bringing your own CA (1.5)

FOG generates its own certificates by default, but each zone described in
[[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]] can be replaced
independently with a CA or key you already run. This page is the reference
for doing that on the 1.5 line; see
[[1.5/kb/reference/pki-glossary|the PKI glossary (1.5)]] if a term here is
unfamiliar.

>[!info] Version support
>`--web-ca-cert`/`--web-ca-key`/`--web-ca-root` are available on **both** the
>1.6 and 1.5 lines — update your installer before using them; the 1.5 line
>only gained them recently. The Secure Boot zone is where the lines diverge:
>1.5 can only take a **flat leaf** (`--secure-boot-key`/`--secure-boot-cert`),
>not a CA. `--secureboot-ca-cert`, which lets 1.6 take a genuine CA-plus-leaf
>replacement for that zone, does not exist on 1.5 — see
>[Secure Boot zone](#secure-boot-zone) below for what the flat-leaf
>limitation means in practice.

## Web zone

```bash
./installfog.sh --web-ca-cert /etc/pki/web-int.pem \
                --web-ca-key  /etc/pki/web-int.key \
                --web-ca-root /etc/pki/root.pem
```

This works identically to the 1.6 line — see
[[1.6/kb/reference/bringing-your-own-ca#web-zone|the 1.6 version of this section]]
for the same commands and gotchas. There is no `--external-ca` predecessor
distinction to worry about on 1.5; `--web-ca-*` is the only mechanism.

## Secure Boot zone

```bash
./installfog.sh --secure-boot-key  /etc/pki/sb-leaf.key \
                --secure-boot-cert /etc/pki/sb-leaf.pem
```

On 1.5 this is the **only** way to bring your own Secure Boot material, and
it always hands the installer a **leaf with no CA above it** — the flat
model. That certificate becomes both the signer and the thing you enroll,
same as FOG's own default before the CA/leaf split existed. Rotating a flat
key later means re-enrolling every machine — see
[[1.5/kb/how-tos/secure-boot-signing#rotating-or-removing-a-key|Rotating or removing a key (1.5)]].

### Generating a leaf yourself

If you already have a signing key — a site CA, or one shared with other
tooling — pass it and the installer will never touch or overwrite it:

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
- `MOK.der` — the public certificate, DER-encoded. This is what you
  distribute to clients and what `mokutil` enrolls; it is not sensitive.
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
>format it wanted, so keep both files and use `MOK.der` for enrollment and
>`MOK.pem` for signing. The installer's `--secure-boot-cert` accepts either
>and converts internally, so this only bites you when running
>`sbsign`/`sbverify` by hand.

The `-days 3650` gives ten years. Choose something you will actually remember
to renew — an expired MOK stops machines booting.

>[!tip] Use a descriptive CN
>It is shown in MokManager when someone enrolls it, and again years later
>when someone is trying to work out what that key is for. `FOG imaging -
>fog.example.edu` beats `MOK`.

### Getting a CA/leaf split by hand, without `--secureboot-ca-cert`

Nothing above requires your key to be self-signed. If your organization
already runs an internal CA (AD Certificate Services or similar) and can
issue a code-signing certificate, `--secure-boot-key`/`--secure-boot-cert`
(or `--sign-key`/`--sign-cert` in `fos/build.sh`) accept that leaf
certificate and its key exactly the same way — enroll that same leaf as the
MOK and nothing else changes. Standard code-signing templates do not carry
the Module-signing-only OID below, so this does not run into that trap.

A CA can do more than substitute for the leaf, if you want it to. shim does
not just exact-match the enrolled certificate — it validates the embedded
PKCS#7 signature's certificate chain against whatever is enrolled
(`sbsign --cert <leaf> --addcert <intermediate>` is what embeds that chain).
That means enrolling your CA's root or intermediate **once**, then signing
with any leaf issued under it afterward: reissue or rotate the leaf and no
machine needs to be touched again — the same benefit FOG's own auto-generated
key already gets automatically. Since 1.5 has no `--secureboot-ca-cert` to do
this for you, doing it with your own CA means signing and publishing by
hand — follow
[[1.5/kb/reference/secure-boot-technical-details#signing-the-fos-kernels|signing the FOS kernels (1.5)]]
with `--addcert` added to the `sbsign` call, and enroll the CA's certificate
rather than a leaf.

One thing this does **not** get you: a way to skip enrollment entirely by
piggybacking on infrastructure your fleet might already have. There is no
generic Intune/GPO mechanism to push an arbitrary org CA into UEFI `db` —
what exists there is only Microsoft's own certificate rollover. If your CA
is not already enrolled fleet-wide by some other means (vendor BIOS tooling),
the one-time-per-machine visit still applies — it just becomes permanent once
done. Unlike 1.6, there is no Setup Mode enrollment route on 1.5 to bypass
that visit even on firmware that supports it.

Nor does any of this extend to HTTPS. Kernel/shim trust and iPXE's TLS root
store are two unrelated mechanisms — enrolling a CA here changes nothing
about which HTTPS servers a Secure Boot client will fetch from, and on 1.5
HTTPS netboot and Secure Boot cannot be used together at all regardless —
see [[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]].

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
>The key FOG generates carries no such OID either, so this only applies if you
>are supplying your own.

## Client Communication zone — not replaceable this way

The Client Communication zone (`.srvprivate.key`/`.srvpublic.crt`) is
deliberately not replaceable by bringing your own CA, same as on 1.6. It's
anchored at the certificate every fog-client has already pinned, so
replacing it means re-deploying trust to every registered machine by some
other means (GPO, client reinstall) — there's no built-in path for it. See
[[1.5/kb/reference/pki-glossary#client-communication-keypair|Client Communication keypair (1.5)]].

## `pathlen:0` CAs

If your CA carries `pathlen:0` — an ordinary thing for an enterprise to
issue — it can't anchor an intermediate. The installer detects this, says
so, signs the web certificate directly from it instead, and leaves Secure
Boot on its self-signed key. Nothing is silently broken.

## See also

- [[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]]
- [[1.5/kb/reference/pki-glossary|PKI & Secure Boot Glossary (1.5)]]
- [[1.5/kb/how-tos/secure-boot-signing|Secure Boot signing (1.5)]]
- [[1.5/kb/reference/netboot-transport-and-pki|Netboot transport and PKI (1.5)]] — why replacing the CA doesn't change what iPXE must trust, and why HTTPS netboot and Secure Boot can't coexist on 1.5
