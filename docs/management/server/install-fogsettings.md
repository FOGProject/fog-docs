---
title: The .fogsettings file
description: 1.6 renamed every setting and groups them — 1.5 uses a flat set of keys
context_id: install-fogsettings-versions
tags:
    - version-chooser
    - install
    - settings
    - security
    - automation
    - updates
    - network-settings
    - management
    - linux
    - server
    - server-management
---

# The .fogsettings file

The file does the same job on both versions, but 1.6 renamed every setting and
changed how values get there. 1.5 holds a flat set of keys. An existing
`.fogsettings` migrates itself on the first 1.6 run, so you do not have to
rewrite it by hand.

- [[1.6/management/server/install-fogsettings|The .fogsettings file (1.6)]]
- [[1.5/management/server/install-fogsettings|The .fogsettings file (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
