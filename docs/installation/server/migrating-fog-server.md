---
title: Migrating FOG Server
description: Migrating to a 1.6 server and migrating 1.5.x to another 1.5.x server are different jobs
context_id: migrating-fog-server-versions
tags:
    - version-chooser
    - install
    - migrating
    - new-server
    - fogserver
    - configuration
    - database
    - ssl
    - pki
    - certificates
    - secure-boot
    - storage-node
    - dhcp
---

# Migrating FOG Server

Moving to a **new FOG 1.6 server** — including from an older 1.5.x server, which
is a normal upgrade path — is covered by the 1.6 page. Moving a **1.5.x server
to another 1.5.x server**, with no version change, differs: there is no
`updatefog.sh` or `--channel`, the certificate CLI is narrower, and
`--secureboot-ca-cert` does not exist.

- [[1.6/installation/server/migrating-fog-server|Migrating FOG Server (1.6)]]
- [[1.5/installation/server/migrating-fog-server|Migrating FOG Server (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
