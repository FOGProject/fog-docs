---
title: Fog Configuration
description: 1.5 has no settings cache and no table scroll-mode toggle
context_id: config-versions
tags:
    - version-chooser
    - management
    - web-management
    - web-ui
    - config
---

# Fog Configuration

Most settings are shared, but 1.5 renders management tables with an older
JavaScript table library and so has no scroll-mode toggle, and it has no
settings cache. The multicast settings, boot image keymap and FOG client kernel
options also differ in detail.

- [[1.6/management/web/config|Fog Configuration (1.6)]]
- [[1.5/management/web/config|Fog Configuration (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
