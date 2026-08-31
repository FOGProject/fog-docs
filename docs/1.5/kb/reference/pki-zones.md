---
title: FOG PKI Infrastructure (1.5)
aliases:
    - FOG PKI Infrastructure (1.5)
description: How FOG 1.5 separates its certificates into independent zones, what changes on the endpoints, and how to bring your own CA for each one
context_id: pki-zones-1.5
tags:
    - reference
    - security
    - certificates
    - pki
    - https
    - secure-boot
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[kb/reference/pki-zones|1.6 version]] of this page for FOG 1.6.

# FOG PKI infrastructure (1.5)

FOG uses certificates for three unrelated jobs. This page describes how
they're kept separate on the 1.5 line, what that buys you, and how to replace
any of them with your own CA. For the Secure Boot signing workflow
specifically, see
[[1.5/kb/how-tos/secure-boot-signing|Secure Boot: signing FOS with your own key (1.5)]].
This page is the reference the other 1.5 PKI/Secure Boot pages link back to.

>[!info] Availability
>The zone split described here applies to every 1.5 server, generated
>automatically — there's no opt-in flag and no second layout to choose
>between. It is the **same three-zone hierarchy FOG 1.6 uses**; the
>differences are narrower than "1.5 has one CA" — see
>[What 1.6 adds on top of this](#what-16-adds-on-top-of-this) below for
>exactly what is missing here.

## The three zones

| Zone | What it protects | Lifetime | Cost of changing it |
|---|---|---|---|
| **Web TLS** | The browser/API connection to the FOG web UI | Leaf: 5 years default (Web CA: long-lived) | None. Browsers just need the issuer trusted. |
| **Client Communication** | fog-client's encrypted check-in with the server | 3–5 years | Medium. Every registered client must re-pin. |
| **Secure Boot** | The signature on the FOS kernels | CA: 10–20 years · leaf: 5 years | High. Firmware re-enrollment on every machine. |

The root "FOG Server CA" itself is long-lived too, same as both intermediates —
only the two leaf types (web, Secure Boot) default shorter.

They have nothing in common except that FOG generates all three, and their
costs differ by orders of magnitude — which is exactly why they don't share
key material.

## Why they were separated

In the historic (pre-split) layout, one self-signed CA did the first two
jobs, and one self-signed leaf did the third. That produced two problems with
the same shape:

**`.srvprivate.key` was the web server's TLS key *and* the key that decrypts
every fog-client handshake.** `FOGBase::certDecrypt()` opens that exact path
on every `authorize()` call. So an ACME renewal, a purchased certificate
dropped in place, or `--recreate-keys` installed a perfectly valid
certificate and silently broke client authentication, with nothing in the
logs connecting the two.

**The enrolled Secure Boot key was the signing certificate itself.** Because
the thing in the firmware was a leaf that can issue nothing, rotating or
revoking the signing key meant a physical MokManager trip to every machine.

Both are the same mistake: one file serving as both a *trust anchor* and an
*operational key* — the thing you must never change, and the thing you want
to change routinely, were the same object. Separating them is also the fix
for a real advisory
([GHSA-94p8-jg9j-99v4](https://github.com/FOGProject/fogproject/security/advisories/GHSA-94p8-jg9j-99v4)):
an unconstrained root CA key let anyone who could read it mint trusted certs
for arbitrary domains, or sign arbitrary binaries Windows would run without
warning. That fix landed on 1.5 too, not just on 1.6.

## The layout

```
FOG Server CA                     the existing CA, unchanged, published as ca.cert.der
├── FOG Web CA                    serverAuth  + name constraints
│     └── the certificate the web server serves
├── FOG Secure Boot CA            codeSigning + name constraints (opt-out — see below)
│     ├── MOK.der, enrolled in firmware ONCE
│     └── code-signing leaf, rotatable without re-enrollment
└── .srvprivate.key + srvpublic.crt
                                  the client communication keypair, unmoved
```

The anchor is the CA your server already has — nothing above it is created,
so `ca.cert.der` doesn't change and no fog-client re-pins.

Under `$fogprogramdir/pki/` (default `/opt/fog/pki/`), one subfolder per
zone, each split into `ca/` (the zone's own CA material) and `leaf/` (what
that CA issues day to day):

| Path | What it is |
|---|---|
| `root/ca/.fogCA.{key,pem}` | The anchor. Key never regenerated, `0400 root:root`. `.fogCA.pem` is a symlink to wherever the certificate already lived before this split. |
| `root/leaf/.srvprivate.key` | Symlink → `$sslpath/.srvprivate.key` |
| `root/leaf/.srvpublic.crt` | Symlink → `$sslpath/.srvpublic.crt` |
| `web/ca/.fogWebCA.{key,pem}` | Signs the vhost's certificate |
| `web/ca/.fogWebCAchain.pem` | CA + web intermediate |
| `web/leaf/.webLeaf.{key,pem}` | What the web server actually serves |
| `secureboot/ca/.fogSBCA.{key,pem,der}` | Signs the code-signing leaf; `.der` is the same certificate `MOK.der` publishes |
| `secureboot/leaf/sign.{key,pem}` | What `sbsign` actually signs with |

`.srvprivate.key`/`.srvpublic.crt` stay exactly where they've always been —
`root/leaf/` only adds discoverability symlinks to them.

An install that already ran the pre-split layout migrates its existing
key/cert material into this tree in place — nothing is re-issued.

## What an upgrade does and does not change

| | |
|---|---|
| `pki/root/ca/.fogCA.pem` | **unchanged**, byte for byte |
| `ca.cert.der` | **unchanged** — no client re-pins |
| `.srvprivate.key` | **unchanged** — client authentication is unaffected |
| the web certificate | **new**, issued by the Web CA, on its own keypair |
| the Secure Boot MOK | **new** — see [[1.5/kb/how-tos/secure-boot-signing\|the Secure Boot guide]], this one needs action |

The only endpoint-visible change on an upgrade into this layout is Secure
Boot.

## Private key protection

The CA private key used to be readable by the web user — a remote code
execution in the PHP application could read the key the entire installation
trusts. `_hardenPkiPermissions` locks each zone's CA key down after
generation:

| File | Mode | Why |
|---|---|---|
| `pki/root/ca/.fogCA.key` | `0400 root:root` | nothing on a running server needs it |
| `pki/secureboot/ca/.fogSBCA.key` | `0400 root:root` | same |
| `pki/web/ca/.fogWebCA.key` | `0600 root:root` | used only by root, through the sudo helper |
| `.srvprivate.key` | `0640 root:<apache>` | `certDecrypt()` must read this one |

>[!warning] This is pseudo-offline
>It protects the keys from a compromise of the web application, not from a
>compromise of the machine itself.

1.5 also anchors the FOG root CA in the server's **own** system trust store
(so local tooling on the server itself trusts `ca.cert.der` without extra
flags) — opt out with `--no-ca-trust` if you don't want that.

## Taking a key offline

```bash
/opt/fog/bin/fog-offline-ca-key /mnt/vault
/opt/fog/bin/fog-offline-ca-key /mnt/vault --zone secureboot
```

The helper copies the key, verifies the copy still matches the certificate
that stays behind, and only then shreds the original — the key is what
leaves, never the certificate.

>[!warning] It's the certificate that must never move, not the key
>Everything on the server chains to the CA's certificate, and the installer
>uses its presence — not the key's — to recognize that a CA already exists.
>Move or delete the *certificate* (root or intermediate alike) and the next
>run mints a brand new CA in its place, orphaning every intermediate and
>leaf beneath it and every client that already trusts what's enrolled.

Day to day nothing needs the key — only issuing a **new** intermediate does.
The installer detects an offlined key and says what to restore rather than
failing inside openssl.

## Leaf renewal

The web leaf and the Secure Boot signing leaf default to 5 years. To rotate
either one sooner:

```bash
/opt/fog/pki/renewal-helper --zone web
/opt/fog/pki/renewal-helper --zone secureboot
```

The web leaf re-issues from the online Web CA (or the root directly, on a
server whose root can't anchor an intermediate) and reloads the web server.
The Secure Boot leaf re-issues from the Secure Boot CA and needs no
reload — nothing has to be re-enrolled in firmware, because it's the
intermediate that's enrolled, not the leaf.

Either invocation refuses, and tells you the exact path to restore, if the
signing CA's private key isn't on this server. The web leaf invocation also
refuses on a leaf managed by an external ACME client (`acmeLeaf=yes` in
`.fogsettings`) — renew that one through your ACME client instead.

Nothing here runs on a timer — wire it into your own cron if you want
unattended renewal.

## Name constraints

Both intermediates carry `nameConstraints` and an `extendedKeyUsage`, so
neither can issue outside its zone or outside your network:

```
Web CA:          extendedKeyUsage = serverAuth
Secure Boot CA:  extendedKeyUsage = codeSigning
both:            permitted DNS: this server's hostname and domain
                 permitted IP:  all RFC1918 ranges, plus this server's own
```

Extend or narrow with:

```bash
./installfog.sh --internal-domain branch.example.local   # repeatable
./installfog.sh --internal-subnet 10.20.30.0/24          # repeatable; REPLACES
                                                          # the RFC1918 default
```

>[!warning] Constraints are fixed when the CA is issued, and a CA is never re-issued
>Renaming the server, or adding an `--extra-server-name` outside the
>permitted domains, produces a valid certificate that nothing accepts. The
>installer verifies the leaf against its issuer after signing and names the
>`rm -rf` that lets the CA be re-created with the new constraints.

**On FOG 1.5 the Secure Boot CA carries name constraints by default, the
same as the Web CA.** This is the opposite of FOG 1.6, which removed
constraints from the Secure Boot CA entirely (they don't constrain anything
that matters for code signing, and they sit in the one certificate UEFI and
shim actually parse — a critical extension the firmware mishandles costs a
physical trip to every machine). On 1.5, opt out per server with:

```bash
./installfog.sh --no-sb-name-constraints
```

so a rejection means re-issuing one intermediate rather than re-enrolling
every machine. Existing servers keep whatever their Secure Boot intermediate
already carries, since an intermediate is never re-minted.

>[!note] A related trap, measured rather than assumed
>OpenSSL applies DNS constraints to the subject **CN** when a certificate
>carries no DNS SAN. A CN of `evil.example.com` under a `corp.local`
>constraint is rejected; the Secure Boot signing CN passes only because
>"FOG Project Secure Boot Signing" isn't hostname-shaped. Depending on that
>would mean a rename of that CN stops the fleet booting, so the signing leaf
>carries a permitted DNS SAN instead.

## Bringing your own CA

Each zone is independently replaceable with a CA or key you already
run — the Web zone (`--web-ca-*`) and the Secure Boot zone
(`--secure-boot-key`/`--secure-boot-cert`, a flat leaf) each have their own
flags and their own gotchas. **The Client Communication zone is not
replaceable this way, deliberately** — it's anchored at the certificate
every fog-client has already pinned. Full detail, commands, and what "flat
leaf" means here: see
[[1.5/kb/reference/bringing-your-own-ca|Bringing your own CA (1.5)]].

**If your CA carries `pathlen:0`** — an ordinary thing for an enterprise to
issue — it can't anchor an intermediate. The installer detects this, says
so, signs the web certificate directly from it instead, and leaves Secure
Boot on its self-signed key. Nothing is silently broken.

## Storage nodes

Storage nodes on FOG 1.5 each generate their own independent self-signed
`FOG Server CA`, so a fleet of five nodes has six unrelated CAs — one per
node plus the master's. There is no mechanism on 1.5 for a node to request a
certificate from the master's Web CA; that's a FOG 1.6 addition.

## Certificate paths

FOG 1.5 has no canonical-path symlink indirection for the web leaf. If you
manage the web certificate outside FOG (an internal ACME client, a
purchased certificate you renew by hand), you point `.fogsettings` directly
at your files:

```
acmeLeaf=yes
sslprivkey=/path/to/your/key
sslpubcert=/path/to/your/cert
sslcachain=/path/to/your/chain
```

Setting `acmeLeaf=yes` is what tells FOG this leaf isn't its own to re-issue
or lock down — `_createWebLeaf()` leaves it alone, and
`_hardenPkiPermissions()` stops forcing its key to `root:root` so a renewal
hook can still write it. (1.6 replaced this flag with automatic detection —
whether the canonical path resolves outside FOG's own web zone directory —
so `acmeLeaf` no longer exists there; on 1.5 you still set it explicitly.)

## HTTPS and netboot

Unlike 1.6, FOG 1.5 has no way to put the web UI on HTTPS while keeping
netboot on HTTP, and no way to get HTTPS netboot without a local iPXE
rebuild — one setting, `httpproto`, decides all of it at once, and turning
it on **disables Secure Boot staging entirely**. Full detail:
[[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]].

## Secure Boot

The Secure Boot zone follows the same shape as the web zone: the CA issues a
**FOG Secure Boot CA**, that intermediate is what gets enrolled in firmware
(`MOK.der`), and it issues a short-lived **code-signing leaf** that actually
signs the FOS kernels. `sbsign --addcert` embeds the intermediate in the
signature so shim can chain the leaf back to what was enrolled.

The point is rotation. Under a flat model (no intermediate at all — see
[[1.5/kb/reference/bringing-your-own-ca|Bringing your own CA (1.5)]]) the
enrolled certificate *is* the signer, so replacing a signing key means a
physical MokManager trip to every machine. Enrolling the issuer instead
means leaves can be rotated or reissued while the fleet keeps booting.

Start at
[[1.5/kb/how-tos/secure-boot-signing|Secure Boot: signing FOS with your own key (1.5)]]
for the concepts and rotating/removing a key; enrollment itself is covered
in [[1.5/kb/how-tos/secure-boot-mok-enrollment|MOK enrollment (1.5)]] — MOK
is the only enrollment route on this line; there is no Setup Mode
(`db`/`KEK`/`PK`) enrollment on 1.5.

## What 1.6 adds on top of this

Everything above is shared with 1.6. What 1.6 adds, rather than changes:

| Addition | What it means on 1.5 instead |
|---|---|
| Storage node certificate issuance | Each node self-signs its own CA — see [Storage nodes](#storage-nodes) |
| Setup Mode (`db`/`KEK`/`PK`) enrollment | MOK enrollment only — see [[1.5/kb/how-tos/secure-boot-mok-enrollment\|MOK enrollment (1.5)]] |
| Per-zone bring-your-own-CA for Secure Boot (`--secureboot-ca-cert`) | Only a flat leaf swap (`--secure-boot-key`/`--secure-boot-cert`) — see [[1.5/kb/reference/bringing-your-own-ca\|Bringing your own CA (1.5)]] |
| Canonical-path symlink indirection for certificates | Point `.fogsettings` at your files directly with `acmeLeaf=yes` — see [Certificate paths](#certificate-paths) |
| Secure Boot CA name constraints removed | 1.5 keeps them by default; opt out per server with `--no-sb-name-constraints` — see [Name constraints](#name-constraints) |
| `WEB_`/`BOOT_` protocol split, install modes, HTTPS netboot without a rebuild | One `httpproto` setting; HTTPS always rebuilds iPXE and always disables Secure Boot staging — see [[1.5/kb/reference/netboot-transport-and-pki\|Netboot Transport and PKI (1.5)]] |

## See also

- [[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]]
- [[1.5/kb/reference/bringing-your-own-ca|Bringing your own CA (1.5)]]
- [[1.5/kb/reference/secure-boot-trust-stores|Secure Boot: the two trust stores (1.5)]]
- [[1.5/kb/reference/secure-boot-technical-details|Secure Boot technical details (1.5)]]
- [[1.5/kb/reference/pki-glossary|PKI Glossary (1.5)]]
- [[1.5/kb/how-tos/secure-boot-signing|Secure Boot: signing FOS with your own key (1.5)]]
- [[1.5/kb/how-tos/secure-boot-mok-enrollment|Secure Boot MOK Enrollment (1.5)]]
