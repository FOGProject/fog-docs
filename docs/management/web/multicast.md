---
title: Multicast Sessions
description: 1.5 cannot do cross-site multicast by configuration alone
context_id: multicast-versions
tags:
    - version-chooser
    - management
    - web-management
    - web-ui
    - tasks
    - multicast
---

# Multicast Sessions

The core mechanism — one `udp-sender` transmission that many clients write to
disk at once — is the same on both versions. The difference is reach: on 1.5,
cross-site multicast cannot be made to work by configuration alone, and
concurrent session configuration is more limited.

- [[1.6/management/web/multicast|Multicast Sessions (1.6)]]
- [[1.5/management/web/multicast|Multicast Sessions (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
