---
title: Netboot Transport and PKI
description: 1.5 has one httpproto setting controlling everything — 1.6 splits web and netboot protocols apart
context_id: netboot-transport-and-pki-versions
tags:
    - version-chooser
    - reference
    - security
    - certificates
    - pki
    - netboot
    - ipxe
    - secure-boot
---

# Netboot Transport and PKI

On 1.5.x a single `httpproto` setting decides the web protocol, the HTTP→HTTPS
redirect and whether iPXE is recompiled, all at once — and turning it on
disables Secure Boot staging entirely. 1.6 splits those apart into separate
settings, and renamed every one of them; an existing `.fogsettings` migrates
itself on first run.

- [[1.6/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.6)]]
- [[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
