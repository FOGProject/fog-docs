---
title: Host Management
description: Host management is largely shared — 1.5 uses the older positional CSV import/export format
context_id: hosts-versions
tags:
    - version-chooser
    - management
    - hosts
    - web-management
    - web-ui
---

# Host Management

Adding and managing hosts works much the same way on both versions. The
significant difference is CSV import/export: 1.5 uses the older positional
format with no header row, no associations column and no foreign-key name
resolution.

- [[1.6/management/web/hosts|Host Management (1.6)]]
- [[1.5/management/web/hosts|Host Management (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
