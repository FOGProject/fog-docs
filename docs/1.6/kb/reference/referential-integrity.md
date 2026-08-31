---
title: Referential Integrity
description: What FOG 1.6 does when you delete something other records point at
context_id: referential-integrity
aliases:
    - Referential Integrity
    - Foreign Keys
tags:
    - 1_6-changes
    - database
    - storage
    - images
    - hosts
    - management
---

# Referential Integrity

>[!info] FOG 1.6
>This page describes FOG 1.6. See the
>[[1.5/kb/reference/referential-integrity|1.5 version]] of this page for FOG
>1.5, which has no database-level enforcement at all — cleanup after a delete
>is PHP's job, and nothing stops an orphaned reference.

Up to and including FOG 1.5, nothing in the database itself recorded that one
record pointed at another; cleaning up after a delete was the job of the PHP
that ran the delete, and a path that forgot a dependent table left rows behind
pointing at something that no longer existed. See the
[[1.5/kb/reference/referential-integrity|1.5 version]] of this page for what
that means in practice on that version.

FOG 1.6 declares those relationships in the database. The rules below are
enforced by MariaDB on every delete, whatever performed it — the web UI, the
API, a plugin, or a query someone typed by hand.

>[!note]
>Nothing here changes what you can *create* or *edit*. It only changes what
>happens to related records when something is deleted, and which deletes are
>refused outright.

## The three outcomes

Every relationship resolves to one of three behaviors:

| Outcome | What happens | Used for |
|---|---|---|
| **Cascade** | The dependent rows go too, in the same operation | Things owned by the record — a host's MAC addresses, a group's membership rows |
| **Clear the reference** | The dependent row survives with the reference emptied | Things that *mention* the record — a host's assigned image |
| **Refuse** | The delete is rejected and nothing changes | Configuration something else is actively relying on |

**The audit trail and history take none of these.** Audit and history rows
deliberately outlive their subject: the record of who deleted a host is worth
nothing if it disappears when the host does. Those rows stay, and they keep
naming the id that used to exist.

## What each delete now does

### Deleting a host

Everything belonging to that host goes with it, in one step: its MAC
addresses, group memberships, snapin and printer assignments, inventory,
module status, screen and auto-logout settings, power management, site
membership, its tasks and snapin jobs, and its location and OU associations
if those plugins are installed.

Its **history and audit rows stay.**

### Deleting an image

- **Hosts assigned that image are unassigned** — the host survives with no
  image, rather than pointing at one that is gone.
- Scheduled tasks and any running task lose the image reference the same way.
- Storage-group associations for the image are removed, as are Windows key
  associations if that plugin is installed.

### Deleting a storage group

**This is refused** while any of the following still points at the group:

- **storage nodes** that belong to it
- **pending file deletions** queued against it
- a **location** naming it, if that plugin is installed

Move or delete those first, then delete the group. Snapin and image
associations to the group are *not* a blocker — those are removed with it,
and a running multicast session on the group ends with it.

>[!warning]
>Before 1.6 this delete was allowed and silently orphaned whatever was
>pointing at the group — see the
>[[1.5/kb/reference/referential-integrity|1.5 version]] of this page. On one
>real installation, deleting a single storage group left three storage nodes
>belonging to nothing.

### Deleting a storage node

Not refused. Anything referring to the node loses the reference and carries
on: a running multicast session drops its sender node, tasks drop their node
references, and a **location** that named that specific node falls back to
choosing the best node in its storage group — which is the same thing a
location does when no specific node is set.

### Removing a storage node from its group

**A storage node must belong to a storage group.** A group with no nodes is
fine; a node in no group is not — it is invisible to replication and to
multicast, and nothing will ever assign it work.

There is therefore no "remove from group" operation any more. **To move a
node, assign it to the group you want it in** — that moves it in one step,
and leaving its old group empty is not a problem.

### Deleting an image type, an OS, or a task state

**Refused** while any image or task is using it. These are the fixed lists
FOG's own behavior keys off; deleting one out from under a record in use
would leave that record undescribable.

### Deleting a user or a role

Everything granted to or through them goes: site memberships, role
assignments, group memberships, API tokens, stored credentials, and any
LDAP or OIDC grants and identities.

An OIDC **identity** — the record that a particular external account *is* a
particular FOG user — goes with either end. That is deliberate: left behind,
the next user created could inherit someone else's sign-in binding.

## What a refused delete looks like

The refusal comes from the database, but what you see is a sentence naming
what is still using the record:

```
Cannot delete this storage group because a location still refers to it.
Reassign or remove it first.
```

Move or delete the thing it names, then try the delete again. **Nothing was
changed** — a refused delete leaves the record and everything pointing at it
exactly as they were.

Over the API the same message comes back as **HTTP 409 Conflict**, with the
sentence under `error` in the response body:

```json
{"error": "Cannot delete this storage group because a location still refers to it. Reassign or remove it first."}
```

409 rather than a generic error is deliberate: it means the request itself
was fine and will work once the blocking record is dealt with, so a script
can tell "fix this and retry" apart from "this request was wrong".

>[!note]
>Occasionally the message is the database's own instead:
>
>```
>Cannot delete or update a parent row: a foreign key constraint fails
>(`fog`.`nfsGroupMembers`, CONSTRAINT `fk_nfsGroupMembers_ngmGroupID`
>FOREIGN KEY (`ngmGroupID`) REFERENCES `nfsGroups` (`ngID`))
>```
>
>That happens when the rule involved is one FOG does not have a plain-English
>description for — a constraint added by hand, or left by an older release.
>The delete is still refused and nothing is changed; only the wording is
>less helpful. Read it as **`nfsGroupMembers` still has rows in this group**:
>the constraint name is always `fk_<table>_<column>`, and that table and
>column are what is holding the record.

## What happens on upgrade

The upgrade to 1.6 has to make the existing data consistent before it can
declare any of these rules, because the database will not accept a rule that
the rows already there break.

- **Rows pointing at something that no longer exists are cleaned up once.**
  Where the row can survive with an empty reference it is emptied; where it
  cannot, it is removed. On a healthy installation this finds nothing.
- **What it did is recorded in the audit log**, with a per-table count, under
  the type `schema.orphan.sweep`. A silent cleanup would be worse than no
  cleanup — if rows were removed, you can see how many and from where.
- **Columns that spelled "no reference" as `0` now use an empty reference
  instead.** Nothing about how FOG reads them changed; `0` and empty behave
  identically everywhere they are read.

>[!note]
>If a rule cannot be applied because of data the upgrade could not safely
>decide about, the upgrade **does not fail.** The rule is skipped, the reason
>is written to the web server's error log, and FOG carries on behaving as it
>did in 1.5 for that one relationship. Fixing the data and running the
>upgrade check again applies it.
>
>The one that occurs in practice is a **storage node sitting in no group**,
>from before this was prevented. Nothing can guess which group it belongs in,
>so assign it to one and the rule applies on the next upgrade check.

## Where the detail lives

The full classification of every relationship, the reasoning behind each
choice, and the measurements behind them are in the `fogproject` repository:
`docs/development/foreign-keys.md` and
`docs/adr/0031-referential-integrity-is-declared-in-the-database.md`.
