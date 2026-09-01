---
title: Primary Mac Address Issues
description: The fix is the same on both versions — only how you authenticate to the API differs
context_id: primary-mac-address-issues-versions
tags:
    - version-chooser
    - primary-mac
    - primary-key
    - troubleshooting
    - hosts
---

# Primary Mac Address Issues

The API and database fix steps work the same way on both versions. The only
difference is authentication: 1.6 uses a Bearer token, while 1.5 uses the
token-pair or HTTP Basic methods.

- [[1.6/kb/troubleshooting/primary-mac-address-issues|Primary Mac Address Issues (1.6)]]
- [[1.5/kb/troubleshooting/primary-mac-address-issues|Primary Mac Address Issues (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
