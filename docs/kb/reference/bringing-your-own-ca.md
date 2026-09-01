---
title: Bringing Your Own CA
description: The Web zone works the same on both versions — the Secure Boot zone is where they diverge
context_id: bringing-your-own-ca-versions
tags:
    - version-chooser
    - reference
    - security
    - certificates
    - pki
    - secure-boot
---

# Bringing Your Own CA

The Web zone options (`--web-ca-*`) behave the same on 1.5 and 1.6. The Secure
Boot zone is where the lines part: 1.6's `--secureboot-ca-cert` is a genuine CA
replacement and has no 1.5 equivalent — 1.5 can only accept a flat leaf
certificate.

- [[1.6/kb/reference/bringing-your-own-ca|Bringing Your Own CA (1.6)]]
- [[1.5/kb/reference/bringing-your-own-ca|Bringing Your Own CA (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
