---
title: "LDAP Authentication (1.5)"
aliases:
    - "LDAP Authentication (1.5)"
description: How the LDAP plugin authenticates users against a directory on FOG 1.5, including its two-tier admin/user group model and single nested-group checkbox
context_id: "ldap-1.5"
tags:
    - management
    - users
    - plugins
    - ldap
    - web-ui
    - web-management
    - 1_5-legacy
---

# LDAP Authentication (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/management/web/ldap|1.6 version]] of this page for FOG 1.6.

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

>[!note] Upgrading from an earlier build
>Older versions of this plugin stored a hash of the user's real
>directory password in FOG. Those rows are cleaned up automatically
>on each user's first login after upgrading.

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
the default.

### Both fields are per server, deliberately

One FOG install can have an Active Directory and an OpenLDAP configured
at the same time, and whether verification can succeed is a property of
the *directory*, not of FOG. Putting a server on **Hard** with its own
CA leaves every other server's setting alone.

>[!warning] Never is a diagnostic, not a fix
>**Never** encrypts the traffic but accepts any certificate at all,
>including one presented by a machine that is not your directory
>server. Use it to confirm that a connection problem really is
>certificate-related, then fix the certificate and move back off it.

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

>[!note] The path must be absolute, and readable by PHP
>A relative path is resolved against the PHP process's working
>directory, which is not where you would expect — always give a full
>path beginning with `/`.
>
>The file is opened by the **PHP-FPM pool user**, which is not
>necessarily the account that owns your web root (on RedHat with
>nginx, PHP runs as `apache` while nginx runs as `nginx`). If FOG
>cannot read the file, it writes a line to the web server's error log
>and carries on **without** it — so a private CA quietly stops being
>trusted and **Hard** starts failing until the permissions are fixed.
>
>FOG deliberately does not reject an unreadable path when you save
>it. Administrators routinely configure a server before its
>certificate is in place, and refusing the save would make that
>impossible.

## What a directory user gets

Directory users are subject to whatever access model your FOG install
has — on 1.5 that is either the built-in administrator/mobile split, or
the [[1.5/management/web/plugins|Access Control plugin]] if you have it
active. The LDAP plugin's own job is narrower and simpler than on the
current line: **one admin group and one user group, per server**.

On the server's **General** tab you configure a single **LDAP admin
group** and a single **LDAP user group**, each as one directory group
name. A login is matched against both in turn:

- **Matches the admin group** → the account is created (or refreshed) as
  a full FOG administrator.
- **Matches the user group instead** → the account is created as a
  restricted "mobile" user — FOG's other, more limited account tier.
- **Matches neither** → the login is refused.

There are no per-group role mappings, no arbitrary number of groups, and
no additive combination of grants the way the current line has. Every
directory login lands in exactly one of the two tiers, decided by which
of the two configured groups it belongs to.

### Grants are re-evaluated on every login

Group membership is checked fresh every time the user signs in. Remove
someone from the admin group in your directory and their next FOG login
drops them to the user tier (or refuses them, if they are not in the
user group either).

## Nested groups

By default a user must be a **direct** member of the admin or user
group. If your directory nests groups — the admin group's members
include *other* groups — those users match nothing until you turn
nesting on.

1.5 has a single **nested group** checkbox, and it works one specific
way: it enables `LDAP_MATCHING_RULE_IN_CHAIN`, an **Active Directory**
matching rule that asks the directory to resolve the whole group chain
server-side, in one query.

>[!warning] This only works on Active Directory
>On OpenLDAP, FreeIPA or anything else, `LDAP_MATCHING_RULE_IN_CHAIN`
>matches **nobody** — the directory does not implement it. 1.5 does not
>check whether your directory supports the rule before using it, so the
>checkbox ticks, saves, and silently grants nothing to nested members.
>There is no equivalent of the current line's "Expand" strategy, which
>walks the group tree itself and works on any directory.

>[!warning] The setting may not even be reachable
>Nested groups needs a database column that was added to the LDAP
>plugin's table in **February 2026**, and 1.5 has no mechanism to add a
>column to a *plugin's* table on an install that already exists — the
>core schema updater only ever touches core tables. If your LDAP plugin
>was installed before that date, the column is simply not there and the
>setting has nowhere to go: the checkbox itself may not appear.
>
>Reinstalling the plugin would create the column, and would also drop
>every LDAP server you have configured along with the FOG accounts the
>plugin created, so it is not a workaround. Upgrading to the current
>line is the real fix — see
>[issue #892](https://github.com/FOGProject/fogproject/issues/892).

>[!note] posixGroup / memberUid groups cannot nest
>If your groups record membership with `memberUid` rather than
>`member`, nesting cannot work — and that is a property of the schema,
>not a limitation of FOG. `memberUid` holds bare **usernames**, so
>there is no way to express "this group contains that group". Direct
>membership works exactly as before.

## Multiple LDAP servers

If more than one LDAP server is configured, FOG tries them **all**. The
first server that authenticates the account decides which tier (admin or
user) the login gets — servers are not combined the way group mappings
are on the current line.

A server where the account does not exist is simply skipped; FOG moves
on to the next configured server.

## Upgrade notes

If you later move to FOG 1.6, your admin/user group lists convert
automatically into per-group role mappings — see the current line's
[[1.6/management/web/ldap|LDAP Authentication]] page for what that looks
like and what the two settings that carry the old lists forward are for.
Nobody's access changes as a result of that conversion.
