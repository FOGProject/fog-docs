---
title: Database Schema Updates
description: 1.5 has no roles system, and keeps its config file at a different path
context_id: database-schema-update-versions
tags:
    - version-chooser
    - troubleshooting
    - kb
    - installation
    - database
---

# Database Schema Updates

Who is allowed to run the schema updater differs. FOG 1.5 has no roles system —
authorization is a plain administrator account-type flag — and it keeps its
config file at `lib/fog/config.class.php` rather than
`commons/config.class.php`.

- [[1.6/kb/troubleshooting/database-schema-update|Database Schema Updates (1.6)]]
- [[1.5/kb/troubleshooting/database-schema-update|Database Schema Updates (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
