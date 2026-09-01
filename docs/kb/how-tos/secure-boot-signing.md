---
title: Secure Boot - signing FOS with your own key
description: The signing model is shared — but 1.5 cannot take a CA, and cannot combine HTTPS with Secure Boot
context_id: secure-boot-signing-versions
tags:
    - version-chooser
    - how-to
    - secure-boot
    - uefi
    - advanced
    - pki
---

# Secure Boot - signing FOS with your own key

The signing model — the CA/leaf split, key locations and rotation — is the same
on both versions. Two things differ on 1.5: there is no
`--secureboot-ca-cert`, so an admin-supplied key is always a flat leaf, and
HTTPS and Secure Boot cannot be combined at all.

- [[1.6/kb/how-tos/secure-boot-signing|Secure Boot - signing FOS with your own key (1.6)]]
- [[1.5/kb/how-tos/secure-boot-signing|Secure Boot - signing FOS with your own key (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
