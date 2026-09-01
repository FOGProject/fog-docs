---
title: Secure Boot Technical Details
description: The signing chain is the same on both — but 1.5 stages none of it under HTTPS
context_id: secure-boot-technical-details-versions
tags:
    - version-chooser
    - reference
    - secure-boot
    - uefi
    - advanced
    - pki
---

# Secure Boot Technical Details

The signed-chain staging, kernel signing and verification steps work the same
way on both versions, with one significant exception: on 1.5 none of it is
staged at all if `httpproto=https`, because that version has no way to combine
HTTPS netboot with Secure Boot. The TFTP staging paths also differ slightly.

- [[1.6/kb/reference/secure-boot-technical-details|Secure Boot Technical Details (1.6)]]
- [[1.5/kb/reference/secure-boot-technical-details|Secure Boot Technical Details (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
