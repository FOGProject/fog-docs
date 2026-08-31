---
title: PKI & Secure Boot Glossary (1.5)
aliases:
    - PKI & Secure Boot Glossary (1.5)
description: Plain-language definitions for FOG 1.5's certificate and Secure Boot terminology
context_id: pki-glossary-1.5
tags:
    - reference
    - security
    - certificates
    - pki
    - secure-boot
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[kb/reference/pki-glossary|1.6 version]] of this page for FOG 1.6.

# PKI &amp; Secure Boot glossary (1.5)

Short definitions for terms used across
[[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]],
[[1.5/kb/how-tos/secure-boot-signing|Secure Boot signing (1.5)]], and this
page's neighbors. If a term you hit in one of those pages isn't here, treat
that as a gap in this page, not in your understanding.

### Zone

One of FOG's independent certificate hierarchies — Web TLS, Client
Communication, or Secure Boot — each isolating key material by how
expensive it is to change. Present on 1.5 the same as on 1.6. See
[[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]].

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
[[1.5/kb/reference/pki-zones#leaf-renewal|Leaf renewal (1.5)]] — without
touching the Web CA.

### Secure Boot CA

`FOG Secure Boot CA`. The intermediate restricted to `codeSigning`. **This
is the certificate enrolled in firmware** as the MOK — see *MOK cert vs.
signing cert* below. Unlike 1.6, this CA carries name constraints by
default on 1.5 — opt out with `--no-sb-name-constraints`.

### Secure Boot signing leaf

The key that actually signs FOS kernels (`sbsign`). Issued by the Secure
Boot CA, rotatable without any firmware re-enrollment, because what's
enrolled is the CA above it, not this leaf — *if* you're on the CA/leaf
split. An admin-supplied key (`--secure-boot-key`/`--secure-boot-cert`) is
always a flat leaf on 1.5, with no CA above it to protect this — see
*Flat MOK* below.

### MOK (Machine Owner Key)

The firmware/shim mechanism that lets you enroll extra certificates a
machine will trust, without needing Microsoft's sign-off. "The MOK" in
conversation usually means whichever certificate is currently enrolled.
It is the *only* enrollment mechanism FOG 1.5 automates — see *Setup Mode*
below for the 1.6-only alternative.

### `db` (the firmware's signature database)

The UEFI variable the **firmware** checks every image against, governed by
`PK`/`KEK` above it. Distinct from `MokList` below, and the distinction
decides whether a given boot path can see your certificate at all — see
[[1.5/kb/reference/secure-boot-trust-stores|The two trust stores (1.5)]].

### `MokList`

**Shim's** trust store, written by MokManager. Stored in a UEFI variable,
but firmware never reads it: only shim does, which is why a MOK is inert on
any boot path with no shim in the chain.

### MOK cert vs. signing cert

The load-bearing distinction behind the whole CA/leaf redesign. *MOK cert*
= the Secure Boot CA, enrolled once in firmware (published as `MOK.der`).
*Signing cert* = the Secure Boot signing leaf, used day-to-day, rotatable
freely. Before this split (or if you bring your own flat key today — see
*Flat MOK*) these are the same certificate — rotating the signer means
re-enrolling every machine in the fleet.

### Flat MOK

A single self-signed, `CA:FALSE`, code-signing certificate that's
simultaneously the enrolled anchor and the signer. Two ways to end up on
one on 1.5: a server that ran an early pre-split build and hasn't
re-enrolled since, or a deliberate `--secure-boot-key`/`--secure-boot-cert`
supply — 1.5 has no `--secureboot-ca-cert` equivalent, so **every**
admin-supplied Secure Boot key on this line is flat, unlike 1.6 where a
supplied CA is possible. See
[[1.5/kb/how-tos/secure-boot-signing#the-old-flat-mok|the note in the Secure Boot guide (1.5)]]
if you're recovering from a pre-split server.

### Client Communication keypair

`.srvprivate.key`/`.srvpublic.crt`. A separate zone, signed directly by the
root, used only for `FOGBase::certDecrypt()` — the encryption on
fog-client's check-in handshake — never for TLS. Not replaceable by
bringing your own CA; see
[[1.5/kb/reference/pki-zones#bringing-your-own-ca|Bringing your own CA (1.5)]].

### Fingerprint (aka thumbprint)

A hash (SHA-256, sometimes SHA-1) of a certificate's raw bytes, shown so you
can manually confirm you're enrolling the certificate you think you are.
FOG's UI and code call this "fingerprint." You'll also see "thumbprint" for
the exact same thing — that's what Windows' own certificate-details view
calls it, so both terms show up depending on which screen you're looking
at.

### ACME leaf

The web leaf when it's sourced from an external ACME client (e.g.
`acme.sh`) instead of FOG's own Web CA. On 1.5, set `acmeLeaf=yes` in
`.fogsettings` to tell FOG about it explicitly — FOG doesn't detect this
automatically the way 1.6 does (1.6 infers it from the canonical certificate
path resolving outside its own web zone directory). See
[[1.5/kb/reference/pki-zones#certificate-paths|Certificate paths (1.5)]].

### Pinning (fog-client)

fog-client adds *only* `ca.cert.der` to its trust store at registration and
requires that exact certificate to appear in the server's chain later.
That's why swapping the web certificate's issuer, without re-pinning every
client, breaks client authentication.

### Enrollment (spelling)

Written "enrollment" (US) throughout current docs, matching FOG's own
identifiers and filenames (`fog-enroll-mok.sh`, "Enroll Secure Boot Key").
You may still see "enrolment" (UK) in older text — same concept.

### Setup Mode

A firmware state that lets you write new certificates directly into UEFI's
own trust database (`PK`/`KEK`/`db`), bypassing Microsoft's shim chain
entirely. **This is a FOG 1.6 addition.** FOG 1.5 has no tooling that
enrolls into Setup Mode — the only automated route on 1.5 is MOK/MokManager
enrollment, and reaching `db` directly on 1.5 means using your firmware's
own Setup/Custom mode UI by hand, with FOG contributing nothing but the
certificate file.
