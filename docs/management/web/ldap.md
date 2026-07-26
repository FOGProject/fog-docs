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

## Connecting over LDAPS

Tick **Use LDAP SSL** on the server and FOG connects with `ldaps://`
instead of `ldap://`, on whichever port you have set — normally 636.
Two fields on the server's **General** tab then decide how hard FOG
checks the certificate the directory presents.

| **Certificate Verification** | What FOG does |
|---|---|
| **Inherit - use the system ldap.conf setting** | Whatever `TLS_REQCERT` says on the FOG server itself. The default. |
| **Hard - require a valid certificate** | The certificate must be trusted *and* must match the address FOG connects to, or the sign-in fails. |
| **Never - do not verify (insecure)** | The connection is encrypted, but the certificate is not checked at all. |

**CA Certificate Path** is the absolute path to a PEM file holding the
CA that signed your directory's certificate. Leave it blank when that CA
is already in the server's system trust store — which is the case for
any publicly issued certificate, and for a private CA you have installed
system-wide.

Both fields are ignored on a server with **Use LDAP SSL** off, because
there is no certificate to check. There is no StartTLS option — a
connection is either LDAPS or plain LDAP.

### "Inherit" means the operating system, not FOG

**Inherit** does not inherit anything from FOG. It means *make no demand
of my own*, which leaves the decision to the OpenLDAP client library on
the FOG server. That library resolves it from configuration, in this
order:

1. the `LDAPTLS_REQCERT` environment variable, if it is set;
2. `TLS_REQCERT` in `$LDAPCONF`, `/etc/openldap/ldap.conf` or
   `/etc/ldap/ldap.conf`, whichever exists;
3. `demand` — verify, and refuse the connection if verification fails —
   when none of those say anything.

So on an untouched server, **Inherit** verifies. If someone has
previously relaxed `TLS_REQCERT` there to get an internal CA working,
**Inherit** keeps that arrangement running — which is exactly why it is
the default. The plugin asserted no TLS setting of its own before these
fields existed, so `ldap.conf` governed, and defaulting to **Hard** on
upgrade would have broken every install that depended on it.

### Both fields are per server, deliberately

One FOG install can have an Active Directory and an OpenLDAP configured
at the same time, and whether verification can succeed is a property of
the *directory*, not of FOG. Putting a server on **Hard** with its own
CA leaves every other server's setting alone.

!!! warning "Never is a diagnostic, not a fix"

    **Never** encrypts the traffic but accepts any certificate at all,
    including one presented by a machine that is not your directory
    server. Use it to confirm that a connection problem really is
    certificate-related, then fix the certificate and move back off it.

### Getting Hard to work with a private CA

Two things have to be true, and only the first one is obvious:

- **FOG has to trust the CA.** Point **CA Certificate Path** at the CA's
  PEM file, or install that CA into the server's system trust store.
- **The certificate has to name the address FOG connects to.** A
  certificate issued as `CN=dc1.example.local` with no subjectAltName
  will not verify when the server's address in FOG is an IP address, no
  matter how correctly the CA is trusted. The failure reads *hostname
  does not match name in peer certificate*. Fix it by entering the name
  the certificate carries in **LDAP Server Address**, or by reissuing
  the certificate with the address you actually use as a
  subjectAltName.

!!! note "The path must be absolute, and readable by PHP"

    A relative path is resolved against the PHP process's working
    directory, which is not where you would expect — always give a full
    path beginning with `/`.

    The file is opened by the **PHP-FPM pool user**, which is not
    necessarily the account that owns your web root (on RedHat with
    nginx, PHP runs as `apache` while nginx runs as `nginx`). If FOG
    cannot read the file, it writes a line to the web server's error log
    and carries on **without** it — so a private CA quietly stops being
    trusted and **Hard** starts failing until the permissions are fixed.

    FOG deliberately does not reject an unreadable path when you save
    it. Administrators routinely configure a server before its
    certificate is in place, and refusing the save would make that
    impossible.

!!! note "Settable outside the web UI too"

    Both fields are part of the LDAP server CSV export and import, and
    both are readable and writable on `/fog/ldap/<id>` through the
    [REST API](../../kb/integrations/api.md). An illegal verification
    level, or a CA path that is relative or too long, is refused there
    with a **406** naming the value it rejected — the same rule the form
    applies.

## What a directory user gets

Directory users are subject to [roles](roles.md) exactly like anyone
else, and — like anyone else — **a directory user with no role has no
access**. The plugin decides what each login earns.

You map **each directory group to whatever it should grant**. On the
server's **General** tab, click **Create New LDAP Group**, enter the
directory group's name, and pick the server it belongs to. Then open
that group and use its **Role Association** and **User Group
Association** tabs to say which [roles](roles.md) and which FOG user
groups it hands out.

The server's own **Grants** tab is a read-only summary of that: one
table listing every directory group on the server and the roles it
grants, another listing the user groups. The grants themselves are
always edited on the group, not here.

Group mappings are **additive**. A user in three mapped groups receives
everything all three grant; there is no ranking and no "highest wins".
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

### Grants are re-evaluated on every login

The roles and user groups above are recomputed from the directory each
time the user signs in. Remove someone from a mapped group in your
directory and their next FOG login drops whatever that group granted.

Anything an administrator attached to that user **by hand** is left
alone. That carve-out is deliberate: without it the sync would silently
revoke grants you made on purpose, and you would have no way to give a
directory user anything extra.

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
combines the result. Every role and user group earned on every server is
granted, the same way multiple group mappings on one server combine.

A server where the account does not exist contributes nothing and never
takes away a match found on another server.

Group mappings belong to the server they were created on, so the same
directory group name on two different servers is two separate mappings
and can grant different things.

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
- **Certificate verification does not change on upgrade.** Existing
  servers come through set to **Inherit**, which is the behaviour they
  already had — whatever `TLS_REQCERT` on the FOG server says. Nothing
  starts failing because the setting arrived.
