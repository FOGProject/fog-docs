---
title: The Ping Hosts Service
description: 1.5 never sent a real ICMP ping and had no configurable port or timeout
context_id: ping-hosts-service-versions
tags:
    - version-chooser
    - reference
    - hosts
    - management
---

# The Ping Hosts Service

FOG 1.5's ping host service is a TCP-only reachability check, not a real ICMP
ping, and it has no configurable port or timeout. 1.6 changes what is actually
sent and what the Last Ping and Last Check-In fields mean.

- [[1.6/kb/reference/ping-hosts-service|The Ping Hosts Service (1.6)]]
- [[1.5/kb/reference/ping-hosts-service|The Ping Hosts Service (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
