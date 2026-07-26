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

You map **each directory group to whatever roles it should grant**. Open
the server, go to its **LDAP Groups** tab, add the directory group by
name, then attach roles to it.

Group mappings are **additive**. A user in three mapped groups receives
the roles from all three; there is no ranking and no "highest wins".
Directory groups you have not mapped grant nothing.

One setting in **LDAP → Global Options** covers the case where there are
no groups to look at:

| Setting | Applies to |
|---|---|
| **Role when group matching is off** | The server has group matching disabled |

Leaving it unset means such a login earns no role, and therefore no
access.

!!! warning "Group matching off means *everyone*"

    On a server with group matching disabled, FOG can authenticate the
    account but has no way to tell an administrator from anybody else.
    The "group matching is off" role is therefore granted to **every
    account in the directory that can bind** — not a subset. Choose it
    accordingly, or leave it blank.

!!! note "Where the old admin/user group settings went"

    Earlier builds had a single **admin group** and **user group** per
    server, each mapped to one role. Those became per-group mappings so
    that different groups can grant different roles. Your existing group
    lists are converted automatically on upgrade, using the **Role for
    LDAP admin group** and **Role for LDAP user group** settings as the
    targets — which is all those two settings are still for. Nobody's
    access changes as a result of the conversion.

### Roles are re-evaluated on every login

The roles above are recomputed from the directory each time the user
signs in. Remove someone from a mapped group in your directory and their
next FOG login drops the roles that group granted.

Any **other** role an administrator attached to that user by hand is
left alone. That carve-out is deliberate: without it the sync would
silently revoke grants you made on purpose, and you would have no way
to give a directory user anything extra.

## Nested groups

By default a user must be a **direct** member of a mapped group. If your
directory nests groups — a mapped group whose members include *other*
groups — those users match nothing until you turn nesting on.

For example, with only `all-techs` mapped:

```
all-staff ──▶ all-techs ──▶ chicago-techs ──▶ alice
```

`alice` is a member of `chicago-techs`, which is a member of
`all-techs`. With nesting off she matches nothing, because she is not a
direct member of anything mapped. Note that `chicago-techs` does **not**
need to be mapped — nesting is about reaching mapped groups through
unmapped ones.

Set this **per server**, on the server's own page, because whether
nesting works and what it costs depends on the directory:

| **Nested Groups** | What it does |
|---|---|
| **Off - direct membership only** | Today's behaviour. Direct members only. |
| **Expand - walk the chain (any directory)** | FOG walks up the group tree itself, one query per level. Works on **every** directory. |
| **Chain - LDAP_MATCHING_RULE_IN_CHAIN (AD only)** | The directory resolves the whole chain server-side, in a single query. |

**If you are unsure, choose Expand.** It works everywhere and the cost
is small. Choose **Chain** on Active Directory when you want the lowest
possible query count.

!!! warning "Nesting widens access, including for users who already matched"

    A parent group's roles reach **everyone beneath it**. That includes
    people who were already matching directly.

    In the example above, if `all-staff` is also mapped, then turning
    nesting on gives `alice` the roles from both `all-techs` and
    `all-staff` — and it does the same for a user who was already a
    direct member of `all-techs`, because that group is still beneath
    `all-staff`.

    Before enabling it, look at what your **top-level** groups are
    mapped to. A role attached to a broad parent group like "all staff"
    reaches every nested member of it.

    Turning nesting on can only ever **add** access, never remove it, so
    it is safe to enable in the sense that nobody loses anything.

### Chain is refused on directories that cannot do it

`LDAP_MATCHING_RULE_IN_CHAIN` is an Active Directory feature. OpenLDAP,
FreeIPA and other directories do not implement it, and a filter that
uses it there simply matches **nothing** — every nested login would
fail silently.

So FOG asks the directory before saving. Choose **Chain** against a
server that does not advertise support and the save is **rejected**,
with a message telling you to use **Expand** instead. This applies
however the setting is written, including through the REST API.

If FOG cannot reach the directory at all when you save, it cannot prove
support is missing, so the setting is stored and a note is written to
the web server's error log. Configuring a server before it is reachable
therefore still works.

### Depth limit (Expand only)

Walking the tree costs one directory query per level, so **Expand** has
a depth limit. **Chain** has none — the directory does the work — and
ignores this setting entirely.

- **LDAP → Global Options → Default nested group depth** sets the
  default. It ships as **10**.
- **Nested Depth** on an individual server overrides it. Leave it blank
  to inherit the global.

Ten levels is far deeper than most directories nest. If a walk does hit
the limit, FOG writes a line to the web server's error log naming the
server, the user and the depth — so a truncated result tells you it was
truncated rather than looking like a user who simply matched nothing.
If you see it, raise the depth.

Cycles are handled automatically. A group that contains a group that
contains the first one resolves correctly and does not consume the depth
limit.

!!! note "posixGroup / memberUid groups cannot nest"

    If your groups record membership with `memberUid` rather than
    `member`, nesting cannot work — and that is a property of the schema,
    not a limitation of FOG. `memberUid` holds bare **usernames**, so
    there is no way to express "this group contains that group". Direct
    membership works exactly as before.

### Cost per login

Nesting adds directory queries to each sign-in:

| Strategy | Queries per login |
|---|---|
| Off | 1 |
| Chain | 1 |
| Expand | one per level, up to the depth limit |

There is deliberately **no caching** of group membership, so removing
someone from a directory group takes effect on their very next login
rather than whenever a cache expires.

If the extra queries matter for automation, note that a
[REST API token](../../kb/integrations/api.md) does not touch the
directory at all — only interactive sign-in does. Scripts using a token
cost nothing here, and revoking a token is immediate.

## Multiple LDAP servers

If more than one LDAP server is configured, FOG tries them **all** and
combines the result. Every role earned on every server is granted, the
same way multiple group mappings on one server combine.

A server where the account does not exist contributes nothing and never
takes away a match found on another server.

Group mappings belong to the server they were created on, so the same
directory group name on two different servers is two separate mappings
and can grant different roles.

The display name and the **allow API** setting are taken from the first
server that accepted the credential, rather than combined — otherwise a
server that grants nothing else could still hand out API access.

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
