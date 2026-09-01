---
title: API
description: API tokens and Bearer authentication arrive in 1.6 — 1.5 uses the token pair or HTTP Basic
context_id: api-versions
tags:
    - version-chooser
    - kb
    - integrations
    - api
---

# API

Authentication is what differs. API tokens and Bearer authentication are
available from FOG 1.6.0; on 1.5.x you authenticate with the token pair or
HTTP Basic instead. Both older methods keep working on 1.6 and are not
deprecated, so nothing you have already built needs to change.

- [[1.6/kb/integrations/api|API (1.6)]]
- [[1.5/kb/integrations/api|API (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
