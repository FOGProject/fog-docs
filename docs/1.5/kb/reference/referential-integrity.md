---
title: "Referential Integrity (1.5)"
aliases:
    - "Referential Integrity (1.5)"
description: FOG 1.5 has no database-level foreign key enforcement — cleanup after a delete is PHP's job, and what that means for you
context_id: "referential-integrity-1.5"
tags:
    - database
    - storage
    - images
    - hosts
    - management
    - 1_5-legacy
---

# Referential Integrity (1.5)

>[!info] This page describes FOG 1.5.
>See the [[kb/reference/referential-integrity|1.6 version]] of this page for FOG 1.6.

FOG 1.5's database does not record that one row points at another. There is no
foreign key enforcement in the schema at all — nothing stops you deleting an
image that hosts are still assigned to, a storage group that storage nodes
still belong to, or a group that hosts are still members of.

## What actually cleans up after a delete

Whatever cleanup happens is the job of the PHP code that runs the delete, not
the database. Every delete path has to remember, by hand, every other table
that might point at the record it is removing. A path that forgets one leaves
rows behind pointing at something that no longer exists.

Nobody notices those rows until one of them does something visible: a host
still listed in a group that no longer exists, a task referencing an image
that is gone, a storage node that belongs to no group at all. On at least one
real installation, deleting a single storage group silently orphaned three
storage nodes that pointed at it — the delete was simply allowed, with nothing
to stop it and nothing to warn about it afterward.

## What this means for you

- **No delete is ever refused for referential reasons.** Deleting an image
  type in use, a storage group with nodes still in it, or a task state that is
  actively referenced all succeed on 1.5, they just leave whatever pointed at
  the deleted record in an inconsistent state.
- **No automatic cascade or cleanup you can rely on.** Some delete paths do
  clean up related rows correctly; others do not. Whether a given delete
  leaves orphans behind depends entirely on whether that specific code path
  remembered to handle it — there is no single rule to reason about ahead of
  time.
- **No error message pointing at what's still using a record.** If you delete
  something other data depends on, you find out later, indirectly, when the
  orphaned reference causes something else to behave oddly — not at the moment
  of the delete.
- **Be deliberate before deleting shared configuration.** Storage groups,
  storage nodes, image types, and task states are the ones most likely to have
  other records quietly depending on them. Check for dependents yourself
  before removing one, since FOG will not check for you.

>[!note]
>FOG 1.6 declares these relationships in the database itself, so MariaDB
>enforces cascades, reference-clearing, and outright refusals on every delete
>— see the [[kb/reference/referential-integrity|1.6 version]] of this page.
>The reasoning behind that change, and the full classification of every
>relationship, are in the `fogproject` repository's
>`docs/adr/0031-referential-integrity-is-declared-in-the-database.md`.
