---
title: Storage Node Management
description: 1.5 has no referential-integrity checks — deleting a group or node silently orphans things
context_id: storage-node-versions
tags:
    - version-chooser
    - storage
    - storage-node
    - management
    - web-management
    - web-ui
    - scalability
    - networking
    - locations
---

# Storage Node Management

Storage groups, nodes and the master node work the same way on both versions.
The difference is deletion: 1.5 has none of 1.6's referential-integrity
checking, so deleting a group or a node is unconditional and silently orphans
anything still pointing at it.

- [[1.6/management/web/storage-node|Storage Node Management (1.6)]]
- [[1.5/management/web/storage-node|Storage Node Management (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
