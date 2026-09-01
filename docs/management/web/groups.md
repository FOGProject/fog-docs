---
title: Group Management
description: What a group *is* changed in 1.6 — it now owns its snapins and printers instead of copying them onto members
context_id: groups-versions
tags:
    - version-chooser
    - management
    - web-management
    - web-ui
    - groups
---

# Group Management

Groups themselves are not new, but what a group **is** changed in 1.6. On 1.5 a
group owned nothing: pressing a button on the group page wrote rows onto
whichever hosts were members at that instant. In 1.6 a group owns its snapins
and printers, and every member gets them — including hosts you add tomorrow.
This is the largest difference between the two lines in the web UI.

- [[1.6/management/web/groups|Group Management (1.6)]]
- [[1.5/management/web/groups|Group Management (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
