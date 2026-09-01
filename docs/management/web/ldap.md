---
title: LDAP Authentication
description: LDAP group handling changed significantly — 1.5 has two fixed tiers instead of role mappings
context_id: ldap-versions
tags:
    - version-chooser
    - management
    - users
    - roles
    - permissions
    - plugins
    - ldap
    - web-ui
    - web-management
---

# LDAP Authentication

Group handling is what changed. On 1.5 a directory login receives one of two
fixed tiers (admin or user) rather than per-group role mappings, and nested
group support is a single AD-only checkbox rather than a choice of strategies.

- [[1.6/management/web/ldap|LDAP Authentication (1.6)]]
- [[1.5/management/web/ldap|LDAP Authentication (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
