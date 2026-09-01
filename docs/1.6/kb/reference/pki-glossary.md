---
title: PKI & Secure Boot Glossary
aliases:
    - PKI & Secure Boot Glossary
    - Certificate Glossary
description: Plain-language definitions for FOG's certificate and Secure Boot terminology
context_id: pki-glossary
tags:
    - reference
    - security
    - certificates
    - pki
    - secure-boot
---

>[!info] Most of these terms also apply to FOG 1.5
>The zone/CA/leaf vocabulary here is shared with 1.5; only *Setup Mode* is
>1.6-only. See the [[1.5/kb/reference/pki-glossary|1.5 version]] of this page.

# PKI &amp; Secure Boot glossary

Short definitions for terms used across
[[1.6/kb/reference/pki-zones|FOG's Certificate Zones]],
[[1.6/kb/how-tos/secure-boot-signing|Secure Boot signing]], and
[[external-ca-lets-encrypt|External CA & Let's Encrypt]]. If a term you hit
in one of those pages isn't here, treat that as a gap in this page, not in
your understanding.

### Zone

One of FOG's independent certificate hierarchies — Web TLS, Client
Communication, or Secure Boot — each isolating key material by how
expensive it is to change. See [[1.6/kb/reference/pki-zones|FOG's Certificate Zones]].

### Root CA

`FOG Server CA`. The one certificate every zone ultimately chains to, and
the one fog-client pins. Self-signed, long-lived, never re-issued on an
existing server.

### Web CA

`FOG Web CA`. The intermediate that signs the web server's certificate.
Restricted to `serverAuth` and name-constrained to your own
network/domain, so a compromised web certificate can't be used to
impersonate anything outside it.

### Web leaf

The certificate the web server (Apache/nginx) actually presents to
browsers. Rotatable on its own — see
[[1.6/kb/reference/pki-zones#leaf-renewal|Leaf renewal]] — without touching the Web CA.

### Secure Boot CA

`FOG Secure Boot CA`. The intermediate restricted to `codeSigning`. **This
is the certificate enrolled in firmware** as the MOK — see *MOK cert vs.
signing cert* below.

### Secure Boot signing leaf

The key that actually signs FOS kernels (`sbsign`). Issued by the Secure
Boot CA, rotatable without any firmware re-enrollment, because what's
enrolled is the CA above it, not this leaf.

### MOK (Machine Owner Key)

The firmware/shim mechanism that lets you enroll extra certificates a
machine will trust, without needing Microsoft's sign-off. "The MOK" in
conversation usually means whichever certificate is currently enrolled.

### `db` (the firmware's signature database)

The UEFI variable the **firmware** checks every image against, governed by
`PK`/`KEK` above it. Distinct from `MokList` below, and the distinction
decides whether a given boot path can see your certificate at all — see
[[1.6/kb/reference/secure-boot-trust-stores|The two trust stores]].

### `MokList`

**Shim's** trust store, written by MokManager. Stored in a UEFI variable,
but firmware never reads it: only shim does, which is why a MOK is inert on
any boot path with no shim in the chain.

### MOK cert vs. signing cert

The load-bearing distinction of the whole Secure Boot redesign. *MOK cert*
= the Secure Boot CA, enrolled once in firmware (published as `MOK.der`).
*Signing cert* = the Secure Boot signing leaf, used day-to-day, rotatable
freely. Before the redesign these were the same certificate (see *flat
MOK*) — rotating the signer meant re-enrolling every machine in the fleet.

### Flat MOK

The superseded, pre-intermediate model: a single self-signed, `CA:FALSE`,
code-signing certificate that's simultaneously the enrolled anchor and the
signer. Existed only as an early proof-of-concept and never shipped in a
stable release — see the note in
[[1.6/kb/how-tos/secure-boot-signing#the-old-flat-mok|the Secure Boot guide]] if you're
recovering from one.

### Client Communication keypair

`.srvprivate.key`/`.srvpublic.crt`. A separate zone, signed directly by the
root, used only for `FOGBase::certDecrypt()` — the encryption on
fog-client's check-in handshake — never for TLS. Not replaceable by
bringing your own CA; see
[[1.6/kb/reference/pki-zones#bringing-your-own-ca|Bringing your own CA]].

### Fingerprint (aka thumbprint)

A hash (SHA-256, sometimes SHA-1) of a certificate's raw bytes, shown so you
can manually confirm you're enrolling the certificate you think you are.
FOG's UI and code call this "fingerprint." You'll also see "thumbprint" for
the exact same thing — that's what Windows' own certificate-details view
calls it, so both terms show up depending on which screen you're looking
at.

### ACME leaf

The web leaf when it's sourced from an external ACME client (e.g.
`acme.sh`) instead of FOG's own Web CA. FOG detects this rather than being
told: the canonical path `PKI_web_vhost_cert` resolving outside the web zone
directory *is* the signal, so there is nothing to set. FOG 1.5's `acmeLeaf=yes`
flag is retired. See
[[external-ca-lets-encrypt|External CA & Let's Encrypt]].

### Pinning (fog-client)

fog-client adds *only* `ca.cert.der` to its trust store at registration and
requires that exact certificate to appear in the server's chain later.
That's why swapping the web certificate's issuer, without re-pinning every
client, breaks client authentication — see
[[external-ca-lets-encrypt|External CA & Let's Encrypt]].

### Enrollment (spelling)

Written "enrollment" (US) throughout current docs, matching FOG's own
identifiers and filenames (`fog-enroll-mok.sh`, "Enroll Secure Boot Key").
You may still see "enrolment" (UK) in older text — same concept.

### Setup Mode

A firmware state that lets you write new certificates directly into UEFI's
own trust database (`PK`/`KEK`/`db`), bypassing Microsoft's shim chain
entirely. FOG 1.6 can enroll a Secure Boot CA this way instead of (or
alongside) MOK/MokManager enrollment — see
[[secure-boot-setup-mode-enrollment|Setup Mode enrollment]].
