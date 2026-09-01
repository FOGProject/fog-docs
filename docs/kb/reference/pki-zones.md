---
title: FOG PKI Infrastructure
description: Both versions use the same three-zone split — 1.6 adds storage nodes, paths and per-zone CAs
context_id: pki-zones-versions
tags:
    - version-chooser
    - reference
    - security
    - certificates
    - pki
    - https
    - secure-boot
---

# FOG PKI Infrastructure

The three-zone certificate split is not 1.6-exclusive; the same hierarchy
exists on 1.5. What 1.6 adds on top of it is storage node coverage, documented
certificate paths, and the per-zone bring-your-own-CA and Setup Mode options.

- [[1.6/kb/reference/pki-zones|FOG PKI Infrastructure (1.6)]]
- [[1.5/kb/reference/pki-zones|FOG PKI Infrastructure (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
