---
title: Secure Boot - the two trust stores
description: The db/MokList model and MOK enrollment mechanics are shared — Setup Mode is 1.6-only
context_id: secure-boot-trust-stores-versions
tags:
    - version-chooser
    - reference
    - secure-boot
    - uefi
    - pki
---

# Secure Boot - the two trust stores

The `db`/`MokList` mental model and FOG's MOK enrollment mechanics are the same
on both versions. The only difference is Setup Mode enrollment, which is
1.6-only.

- [[1.6/kb/reference/secure-boot-trust-stores|Secure Boot - the two trust stores (1.6)]]
- [[1.5/kb/reference/secure-boot-trust-stores|Secure Boot - the two trust stores (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
