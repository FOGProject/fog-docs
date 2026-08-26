---
title: External CA & Let's Encrypt Certificates
description: Describes how to use external CAs and Let's Encrypt with FOG
context_id: external-ca-lets-encrypt
aliases:
    - External CA & Let's Encrypt
    - External CA
    - Let's Encrypt
tags:
    - integrations
    - certificates
    - configuration
    - management
    - step-ca
    - acme
    - lets-encrypt
    - security
    - pki
---

# External CA &amp; Let's Encrypt certificates

FOG generates its own self-signed root CA at install time, and issues a
separate intermediate for the web server and for fog-client's encrypted
check-in — see [[pki-zones|FOG's Certificate Zones]] for the full picture.
This page covers replacing the **web certificate** with your own CA or with
Let's Encrypt: the fog-client pinning that makes this non-trivial, the
`--external-ca` mechanism, and the ACME/Let's Encrypt recipes. iPXE's own
netboot fetches (`boot.php`, kernel, initrd) are a **separate case, not tied
to any of this** — see [How iPXE validates HTTPS](#how-ipxe-validates-https)
below.

Because of fog-client's pinning, you cannot simply drop a Let's Encrypt
certificate onto the Apache vhost and expect **clients** to keep working —
fog-client validates the server's certificate chain against the CA it
pinned at registration time. This page explains the supported way to use
your **own** CA for that (including an internal ACME / Let's Encrypt-style
CA), the trade-offs of using **public** Let's Encrypt for fog-client
specifically, and the renewal caveats you must plan around. None of this
applies to iPXE's own netboot fetches, which can already validate a public
Let's Encrypt certificate without any FOG-side change — see below.

> **TL;DR**
> - **iPXE's netboot fetches already work with a public Let's Encrypt
>   certificate on the web vhost**, with no FOG changes. This is unrelated
>   to Secure Boot status. See
>   [How iPXE validates HTTPS](#how-ipxe-validates-https). (It relies on the
>   booting client reaching `ca.ipxe.org`, which holds for most sites —
>   air-gapped networks are the exception, not the rule.)
> - **fog-client is the actual constraint.** Use the installer's
>   `--external-ca` support, or the newer per-zone `--web-ca-*` flags (FOG
>   1.6), to sign FOG's web certificate with **your own** intermediate CA.
> - An **internal ACME CA** (e.g.
>   [step-ca / smallstep](https://github.com/smallstep/certificates)) is the
>   best fit for fog-client — it gives you ACME automation without exposing
>   FOG publicly, and the CA you pin is stable.
> - **Public** Let's Encrypt for fog-client specifically is possible but
>   fragile: it requires a publicly resolvable name (or DNS-01 automation),
>   and LE rotates its intermediates, which breaks the pinning model on
>   renewal. Read the [caveats](#public-lets-encrypt-caveats) before going
>   down this road.

---

## Table of contents

- [How FOG uses certificates](#how-fog-uses-certificates)
- [How iPXE validates HTTPS](#how-ipxe-validates-https)
- [What `--external-ca` does](#what---external-ca-does)
- [Recommended: internal ACME CA (step-ca)](#recommended-internal-acme-ca-step-ca)
- [Public Let's Encrypt: caveats](#public-lets-encrypt-caveats)
- [Renewal and rotation](#renewal-and-rotation)
- [Switching an existing server to an external CA](#switching-an-existing-server-to-an-external-ca)
- [Troubleshooting](#troubleshooting)

---

## How FOG uses certificates

| Consumer | What it uses | Where it comes from |
|----------|--------------|---------------------|
| **Web server (Apache/Nginx)** | the web leaf certificate, served over HTTPS | Issued by the Web CA — see [[pki-zones]] |
| **iPXE** | Validates the vhost's actual leaf cert against whatever it can chain to — FOG's own CA (if baked in) **or** any publicly-trusted CA via a built-in fallback | See [How iPXE validates HTTPS](#how-ipxe-validates-https) |
| **fog-client** | Pins `ca.cert.der` and requires the server cert to chain to it | Downloaded from `/management/other/ca.cert.der` |

The critical detail for **fog-client** is the **pinned certificate**. The
client adds *only* `ca.cert.der` to its validation store and requires that
exact certificate to appear in the server's chain. That means:

> `ca.cert.der` must be the certificate that **directly signs** the server
> certificate — i.e. the **intermediate**, not the root.

This is why "just point Apache at a Let's Encrypt cert" does not work **for
fog-client**: the client never pinned LE's intermediate, so validation
fails. The same swap does not have this problem for iPXE — see the next
section.

>[!note] Not the same certificate as Secure Boot signing
>FOG's Secure Boot CA and signing leaf are a completely separate zone —
>different key, different certificate, generated separately, stored
>separately. Nothing here (`--external-ca`, a Let's Encrypt cert, or
>anything else on this page) touches Secure Boot signing, and nothing about
>Secure Boot touches the certificate this page is about. See
>[[secure-boot-signing|Secure Boot signing]] and
>[[pki-glossary|the PKI glossary]] if the terms here and there don't line up
>for you.

---

## How iPXE validates HTTPS

It's tempting to assume iPXE is in the same position as fog-client — that
its trust is whatever CA FOG happened to bake in at build time. It isn't:

1. **A baked-in CA is additive, not exclusive.** FOG's own iPXE build can
   compile a CA in as a pinned root, but that does not remove iPXE's other,
   unconditional default described next.
2. **iPXE ships a public-CA fallback by default, regardless of any baked-in
   CA.** Stock iPXE unconditionally defines a cross-signing endpoint
   (`ca.ipxe.org`). When iPXE meets a certificate chain it can't otherwise
   validate, it fetches a cross-signed certificate from `ca.ipxe.org`
   vouching for real-world public CAs — Let's Encrypt's root included. This
   is a stock iPXE feature, not a FOG addition.
3. **FOG's own build never disables it.** FOG's config overlay for iPXE
   only replaces a handful of files and never touches the crypto
   configuration, so the public-CA fallback stays on in every FOG-built
   binary.
4. **The republished Secure-Boot-signed binaries don't bake in a CA at
   all.** They're republished byte-for-byte from the iPXE project's own
   signed release, which never sets a `TRUST=`-equivalent build argument —
   so those binaries rely purely on the stock public-CA fallback.

**Net effect:** a FOG web vhost with a real Let's Encrypt certificate
validates fine for iPXE's netboot fetches (`boot.php`, kernel, initrd) with
**no FOG-side change**, on both FOG's own build and the republished
Secure-Boot-signed binaries, and independent of Secure Boot enrollment
status. This assumes the booting client can reach `ca.ipxe.org`, which holds
for most sites — outbound internet access is the common case, not the
exception. Only on a fully air-gapped network does that fallback not fire,
in which case FOG's own baked-in CA is what makes HTTPS boot work instead —
see [[pki-zones#https-and-netboot|HTTPS and netboot]]. **fog-client remains
the actual constraint on using public Let's Encrypt** — see the rest of this
page.

>[!note] Confirmed by ad-hoc testing
>A real Let's Encrypt certificate on the vhost does validate for iPXE
>netboot with no FOG-side change, as this section claims. Getting there in
>practice took two settings beyond just dropping the cert in place:
>`WEB_url_proto` in `.fogsettings` set to `https`, and `FOG_WEB_HOST` (in the
>FOG web UI's Settings page) set to the server's FQDN, not its IP address.

---

## What `--external-ca` does

The installer can sign FOG's web certificate with a CA **you** supply
instead of generating its own. You provide three files:

| Flag | File | Notes |
|------|------|-------|
| `--ca-cert` | Intermediate CA **certificate** (PEM) | Must be a real CA cert (`basicConstraints CA:TRUE`) |
| `--ca-key`  | Intermediate CA **private key** (PEM) | Must match `--ca-cert` |
| `--ca-root` | **Root** CA certificate (PEM) | `--ca-cert` must verify against this |

Enable it with `--external-ca`, or answer the interactive prompt during install:

```bash
./installfog.sh \
    --external-ca \
    --ca-cert /root/pki/intermediate.crt \
    --ca-key  /root/pki/intermediate.key \
    --ca-root /root/pki/root.crt
```

>[!info] FOG 1.6 adds a per-zone equivalent
>`--web-ca-cert`/`--web-ca-key`/`--web-ca-root` do the same thing under a
>name that makes clear which zone they target — see
>[[pki-zones#bringing-your-own-ca|Bringing your own CA]]. `--external-ca`
>predates the zone split and has always effectively meant "the Web zone."
>Whether both forms continue to coexist long-term isn't settled; treat
>`--web-ca-*` as the currently-recommended form if it's available to you,
>and `--external-ca` as the form to reach for otherwise. Either way, this
>only replaces the **Web** zone — the Client Communication keypair is not
>replaceable this way; see
>[[pki-zones#bringing-your-own-ca|Bringing your own CA]] for why.

What the installer does with these files:

1. Verifies the key matches the cert, that the cert is a CA, and that the
   intermediate chains to the root. Any failure **aborts** the install.
2. Imports the files into FOG's Web CA directory
   (`/opt/fog/pki/root/ca/` on installs predating the zone split; the
   Web-zone-specific flags import into `/opt/fog/pki/web/ca/` instead) as
   the CA certificate, key, and chain.
3. Signs the web leaf with your intermediate.
4. Exports the **intermediate** as `ca.cert.der` — this is what fog-client
   pins. (Pinning the root would break client validation, because the root
   is not what directly signs the server cert.)
5. Passes the full chain to the web server, and — only if you asked for the
   iPXE rebuild with `--rebuild-ipxe-with-my-ca` or `--install-mode embed-ca`
   — to the iPXE build. A public certificate needs no rebuild; see
   [[netboot-transport-and-pki|Netboot Transport and PKI]].

The relevant values are persisted to `.fogsettings` so re-running the
installer reuses them. If the source files are no longer readable on a
later run, the installer reuses the already-imported CA on disk.

---

## Recommended: internal ACME CA (step-ca)

This is the cleanest way to get "Let's Encrypt-style" automation without any
of the public-LE downsides. You run a small internal CA that speaks ACME,
point `acme.sh`/`certbot` at it, and feed the resulting CA into FOG via
`--external-ca` (or the per-zone `--web-ca-*` flags).

High-level setup:

1. **Stand up [step-ca](https://github.com/smallstep/certificates)** on a
   host you control. It issues you a **root** and an **intermediate** CA.
2. **Install FOG with `--external-ca`** (or `--web-ca-*`), passing step-ca's
   intermediate cert/key and root cert. FOG's web certificate is now signed
   by your intermediate; clients pin that intermediate.
3. **Issue / renew the web leaf via ACME** against step-ca (e.g.
   `acme.sh --server https://step-ca.internal/acme/acme/directory`).
   Because the leaf is signed by the **same** intermediate clients already
   pinned, renewing the leaf does **not** break client authentication.
4. After each renewal, install the renewed leaf where Apache/Nginx serves
   it (a renewal hook — see [Renewal and rotation](#renewal-and-rotation)).

**FOG does not automate any of this, by design** — running an ACME client
is a solved problem with several good implementations, and FOG wrapping one
would mean owning its failure modes, its renewal scheduling, and its
credential handling without adding anything those tools don't already do
better.

Let your ACME client own its own directory, and then make FOG's canonical
paths **resolve** there. That second step is what tells FOG the leaf is not
its own:

```bash
acme.sh --issue --server https://step-ca.internal/acme/acme/directory \
    -d fog.example.com --webroot /var/www/html
acme.sh --install-cert -d fog.example.com \
    --key-file       /etc/ssl/fog-acme/fog.example.com.key \
    --cert-file      /etc/ssl/fog-acme/fog.example.com.pem \
    --ca-file        /etc/ssl/fog-acme/chain.pem \
    --reloadcmd      "systemctl reload httpd"     # apache2 on Ubuntu
```

```bash
ln -sf /etc/ssl/fog-acme/fog.example.com.pem /opt/fog/pki/web/leaf/.webLeaf.pem
ln -sf /etc/ssl/fog-acme/fog.example.com.key /opt/fog/pki/web/leaf/.webLeaf.key
```

`--cert-file` is the leaf only and `--ca-file` the intermediate only,
matching Apache's `SSLCertificateFile`/`SSLCertificateChainFile` split.
Don't point the leaf at `--fullchain-file`, or the vhost ends up listing the
intermediate twice.

Use a DNS-01 plugin instead of `--webroot` if you do not want to expose port
80 — which is the usual case for an internal imaging server, and the only
practical option for public Let's Encrypt on a server that is not publicly
reachable.

>[!important] Do not have your ACME client write straight to the canonical paths
>It looks simpler and it silently reintroduces the exact failure this section
>exists to prevent. FOG decides whether a leaf is its own by asking where the
>canonical path *resolves*: a real file sitting at
>`/opt/fog/pki/web/leaf/.webLeaf.pem` is inside FOG's own web zone, so FOG
>concludes the leaf is its and re-issues it from the stored request — while your
>ACME private key sits beside it. That is a mismatched pair and a web server
>that will not start, and under `-y` there is nobody to notice.
>
>A symlink pointing out of the zone directory cannot be misread that way. This
>replaces FOG 1.5's `acmeLeaf=yes`, which had to be typed in by hand and had
>exactly this failure mode when it was forgotten. There is nothing to set now.

`--recreate-keys` and `--recreate-CA` deliberately override the symlinks,
since both regenerate the keypair anyway and a self-signed pair is the
correct fallback at that point.

>[!note] This used to be a much sharper trap
>Before FOG's certificate zones were separated, the web server's private
>key was the *same file* `FOGBase::certDecrypt()` used to decrypt every
>fog-client authorization handshake. An ACME client installing a renewed
>web key over that file installed a perfectly valid certificate and
>silently stopped every client authenticating, with nothing in the logs
>connecting the two. That coupling is gone — the web server has its own
>keypair now, and writing an ACME key over it no longer touches client
>authentication at all. See [[pki-zones|FOG's Certificate Zones]] for the
>full separation.

Why this is better than public LE: **the intermediate you pin is stable and
under your control**, so leaf renewals are transparent to clients, and
nothing needs to be publicly resolvable.

---

## Public Let's Encrypt: caveats

Everything in this section is about **fog-client's** pinning, not iPXE — a
public Let's Encrypt certificate on the vhost already works for iPXE's
netboot fetches with no caveats beyond internet reachability (see
[How iPXE validates HTTPS](#how-ipxe-validates-https)). For fog-client, you
*can* use the real public Let's Encrypt, but understand what you are
signing up for before you do.

1. **You need a publicly resolvable name.** HTTP-01 validation requires LE
   to reach your server on port 80 over the public internet. Most FOG
   servers are internal imaging boxes and should **not** be exposed. Use
   **DNS-01** validation (`acme.sh`/`certbot` with your DNS provider's API)
   to get a public cert without exposing the box.

2. **LE does not give you a CA key.** With public LE you only ever receive
   **leaf** certificates — you never hold LE's intermediate private key. So
   you cannot use `--external-ca` to have FOG *sign* with LE. Instead you
   would pin LE's **intermediate** as the CA and let LE issue your leaf.
   This works only as long as the next point holds:

3. **LE rotates intermediates.** Let's Encrypt periodically changes its
   intermediate CAs (e.g. R10/R11/R3…), and ACME clients can be handed
   certs from different chains. The moment your renewed leaf is signed by
   an intermediate your clients did **not** pin, client authentication
   breaks until every client re-pins. This is the core reason public LE is
   fragile for FOG and an internal ACME CA is preferred.

> **Bottom line:** if you want ACME automation, run an **internal** ACME CA.
> Use public LE only if you genuinely need publicly trusted certs (e.g. a
> public-facing portal) and you have a plan for re-pinning clients when LE
> rotates intermediates.

---

## Renewal and rotation

FOG's certificate setup happens at **install time**. It does **not**
auto-renew. When a certificate is renewed you are responsible for putting it
in place, and — if the **CA you pinned changes** — for re-distributing
trust:

- **Leaf renewal, same pinned CA** (the normal step-ca case, or FOG's own
  `renewal-helper --zone web` if you're not on an ACME-managed leaf — see
  [[pki-zones#leaf-renewal|Leaf renewal]]): just drop the new leaf where the
  web server reads it and reload the web server. Clients and iPXE are
  unaffected.
- **Pinned CA (intermediate) changes** (public LE rotation, or you rotate
  your internal intermediate): this is the disruptive case. You must:
  1. Re-run the FOG installer so `ca.cert.der` and the web server config are
     regenerated against the new CA.
  2. Have every host's fog-client **re-pin** the new `ca.cert.der` (re-run
     the client installer or whatever your re-registration flow is).
  3. If you run `embed-ca` — a baked-in-CA iPXE build for netboot HTTPS —
     have PXE clients pull the **rebuilt iPXE binaries** too. Sites on a
     public certificate have nothing to rebuild.

There is currently **no** automated client re-pinning on renewal, and nothing
schedules an installer run. The rebuild itself is at least self-correcting: the
installer stamps the CA it built against, so a changed CA forces a rebuild on
the next run rather than leaving stale binaries in place. Plan your CA
lifetimes accordingly: long-lived, stable intermediates, short-lived leaves.

---

## Switching an existing server to an external CA

If you re-run the installer with `--external-ca` (or `--web-ca-*`) on a
server that already issued a self-signed CA, the installer detects that the
existing web certificate no longer verifies against the new chain and
prints a warning: the web cert is regenerated under the new CA, and **any
host whose fog-client already pinned the old certificate will not trust the
server until it re-pins**. Re-run the fog-client installer after the
switch. If you also run `embed-ca`, reboot PXE clients so they pull the
rebuilt binary too — the rebuild happens on that same installer run, because
the embedded CA changed.

---

## Troubleshooting

- **`The supplied CA private key does not match the supplied CA certificate`** —
  `--ca-key` and `--ca-cert` (or `--web-ca-key`/`--web-ca-cert`) are not a
  pair. Confirm with:
  `openssl x509 -noout -modulus -in cert | openssl md5` vs
  `openssl rsa -noout -modulus -in key | openssl md5`.
- **`The supplied certificate is not a CA certificate`** — the certificate
  lacks `basicConstraints CA:TRUE`. You passed a leaf, not an intermediate
  CA.
- **`The intermediate CA does not verify against the supplied root`** — the
  intermediate does not chain to the root you supplied. Check you exported
  the correct root.
- **Clients stop trusting the server after a renewal** — the pinned CA
  changed. See [Renewal and rotation](#renewal-and-rotation); clients must
  re-pin the new `ca.cert.der`.

---

## See also

- [[pki-zones|FOG's Certificate Zones]]
- [[bringing-your-own-ca|Bringing your own CA]]
- [[pki-glossary|PKI & Secure Boot Glossary]]
- [[secure-boot-signing|Secure Boot signing]]

*Related: this is the supported answer to the "Let's Encrypt support"
request (issue #633); the underlying external/intermediate CA installer
support was added for issue #794.*
