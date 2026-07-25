---
title: LDAP Authentication
aliases:
    - LDAP
    - LDAP Plugin
    - Active Directory Login
    - Directory Authentication
description: How the LDAP plugin authenticates users against a directory and which role each one receives
context_id: ldap
tags:
    - 1_6-changes
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

## Overview

The **LDAP** plugin lets people sign in to FOG with their directory
account — Active Directory, OpenLDAP, FreeIPA, or any generic LDAP
server — instead of a password stored in FOG.

You do not create these users by hand. The first time someone signs in
successfully, FOG creates a matching user account for them
automatically, and refreshes it on every later login.

## What FOG stores for a directory user

- **The directory password is never stored.** The account is marked as
  authenticated by the directory itself; the password field is filled
  with a random value that no typed password can ever match.
- The account is stamped with its **source** so FOG knows it came from a
  directory rather than being created locally. That stamp is what keeps
  the upgrade, the CSV export and the local login path from treating
  directory accounts as ordinary FOG users.

!!! note "Upgrading from an earlier build"

    Older versions of this plugin stored a hash of the user's real
    directory password in FOG. Those rows are cleaned up automatically
    on each user's first login after upgrading.

## Which role a directory user gets

Directory users are subject to [roles](roles.md) exactly like anyone
else, and — like anyone else — **a directory user with no role has no
access**. The plugin decides which role each login earns.

Go to **LDAP → Global Options**. Three settings map a login outcome to
a role:

| Setting | Applies to |
|---|---|
| **Role for LDAP admin group** | The user is a member of the server's configured admin group |
| **Role for LDAP user group** | The user is a member of the server's configured user group |
| **Role when group matching is off** | The server has group matching disabled |

Leaving one of these unset means a login of that kind earns no role,
and therefore no access.

!!! warning "Group matching off means *everyone*"

    On a server with group matching disabled, FOG can authenticate the
    account but has no way to tell an administrator from anybody else.
    The "group matching is off" role is therefore granted to **every
    account in the directory that can bind** — not a subset. Choose it
    accordingly, or leave it blank.

### Roles are re-evaluated on every login

The three roles above are recomputed from the directory each time the
user signs in. Remove someone from the admin group in your directory
and their next FOG login downgrades them automatically.

Any **other** role an administrator attached to that user by hand is
left alone. That carve-out is deliberate: without it the sync would
silently revoke grants you made on purpose, and you would have no way
to give a directory user anything extra.

## Multiple LDAP servers

If more than one LDAP server is configured, FOG tries them all and
keeps the **most privileged** result:

```
admin group  >  user group  >  group matching off  >  no match
```

A server where the account does not exist never downgrades a match
found on another server. A server with group matching disabled ranks
*below* a verified user-group match, because "this account can bind and
we cannot check what it is" is a weaker answer than one the directory
actually gave.

## API access

Each LDAP server has its own **allow API** setting, which controls
whether accounts authenticated through that server may use the
[REST API](../../kb/integrations/api.md). A directory user's API token
still carries only their role's permissions — see
[API tokens follow roles](roles.md#api-tokens-follow-roles).

## Upgrade notes

- **Existing directory accounts are not given a role by the upgrade.**
  The plugin assigns their role at login, so there is nothing useful for
  a one-time migration to say about them, and copying their old account
  type across would hand every directory account administrator access.
  Configure the three role settings above **before** telling users to
  sign in again.
- Before roles existed, every account this plugin created was in effect
  a full administrator. If that is not what you want, the role mapping
  is where you fix it.
