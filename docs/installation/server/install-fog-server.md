---
title: Install FOG Server
description: The branch choice, installer prompts and update process all differ between FOG 1.5 and 1.6
context_id: install-fog-server-versions
tags:
    - version-chooser
    - install
    - fogserver
    - git
    - prerequisites
    - install-script
    - configuration
    - database
    - cli-switches
---

# Install FOG Server

The installer works differently on each line. FOG 1.5 asks you to choose
between the stable and dev branches and is updated by re-running
`installfog.sh` by hand; FOG 1.6 ships a bootstrap one-liner and a different
sequence of prompts. Branch choice, the prompts and the update process all
differ.

- [[1.6/installation/server/install-fog-server|Install FOG Server (1.6)]]
- [[1.5/installation/server/install-fog-server|Install FOG Server (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
