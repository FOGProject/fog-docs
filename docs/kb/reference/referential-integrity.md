---
title: Referential Integrity
description: 1.5 has no database-level enforcement at all — cleanup after a delete is PHP's job
context_id: referential-integrity-versions
tags:
    - version-chooser
    - database
    - storage
    - images
    - hosts
    - management
---

# Referential Integrity

FOG 1.5 has no database-level foreign key enforcement. Cleanup after a delete is
PHP's job there, and nothing stops an orphaned reference. 1.6 documents what
actually happens when you delete a record other rows point at.

- [[1.6/kb/reference/referential-integrity|Referential Integrity (1.6)]]
- [[1.5/kb/reference/referential-integrity|Referential Integrity (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
