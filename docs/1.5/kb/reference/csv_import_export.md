---
title: "CSV Import / Export (1.5)"
description: "How FOG 1.5's CSV import/export works: raw, positional columns with no header row, no associations column, and no foreign-key name resolution"
context_id: "csv_import_export-1.5"
aliases:
    - "CSV Import / Export (1.5)"
tags:
    - import
    - export
    - csv
    - configuration
    - management
    - 1_5-legacy
---

# CSV Import / Export (1.5)

>[!info] This page describes FOG 1.5.
>See the [[kb/reference/csv_import_export|1.6 version]] of this page for FOG
>1.6, which reworks this into a headered-or-positional format with an
>associations column and name-resolved foreign keys.

FOG can mass-import and export several management object types (hosts,
images, snapins, groups, printers, users) as CSV files from each object's
**Export** / **Import** page. This has been part of FOG for a long time — it
is not a 1.6 addition — but 1.6 reworks the format significantly (see the
[[kb/reference/csv_import_export|1.6 version]] of this page). This page
describes what 1.5 actually does.

>[!warning] This page describes the mechanism, not an exact per-class column list
>Unlike the 1.6 page, this page does not give you a verified, column-by-column
>layout for every class — that would need reading each class's field
>declarations individually, which hasn't been done here. What's below (column
>order, no header row, no associations, no FK name resolution) is confirmed
>from the FOG 1.5.x source. For the exact column order on your server, **use
>Export first** — see [Exporting](#exporting) — and edit that file rather
>than writing one from scratch.

## Exporting

Each object type that supports this (Host, Image, Snapin, Group, Printer,
User) has an **Export** page with an **Export** button. It downloads a CSV of
every item currently loaded for that object type.

## Importing

The matching **Import** page takes a CSV upload (max size shown on the page,
governed by PHP's `post_max_size`) and applies it row by row.

## Format rules

- **No header row.** Every row, including the first, is read positionally
  with PHP's `fgetcsv()` and matched purely by field count — there is no
  by-name column mapping and no "first row is a header" option. A row must
  have no more fields than the class expects, or the whole import fails with
  *"Invalid data being parsed."*
- **Column order matches the class's own field list**, in the order that
  class declares its fields internally, **minus** the `id` column (which is
  never exported or expected on import — a new row is always created).
  Export always writes exactly the columns Import expects, in the same order,
  so **the safest way to build an import file is Export → edit → Import** —
  the same recommendation as on 1.6, and doubly true here since there is no
  header row to catch a misordered column.
- **Hosts get one extra leading column: the MAC list.** Before a host's other
  fields, Export writes a single pipe-separated (`|`) list of the host's MAC
  addresses as the first CSV field. Import expects that same leading column.
- **No associations column.** There is no way to set a host's groups,
  snapins, printers or modules — or a group's member hosts — from a CSV file
  on this version. Those relationships have to be set through the web UI or
  the API after import.
- **No foreign-key name resolution.** A column like a host's `imageID` is the
  **raw numeric database id**, exactly as stored — not a name. An export from
  one server will not resolve correctly on another server whose ids differ,
  and hand-authoring a file means looking up the numeric id yourself (for
  example from the URL of that item's edit page) rather than writing a name.
- **Existing items are skipped.** Importing a host whose MAC already exists,
  or an item whose unique name already exists, fails that one row; the rest
  of the file continues.

## What changed in 1.6

1.6 keeps CSV import/export for the same object types (and adds Storage Group
and Storage Node) but reworks the format: an optional header row lets you map
columns by name in any order, a trailing `associations` column lets a row
carry a host's groups/snapins/printers (or a group's member hosts) alongside
its own fields, and foreign-key columns like `imageID` resolve by name as
well as by id, so a file built on one server imports cleanly on another. See
the [[kb/reference/csv_import_export|1.6 version]] of this page for the full
column layouts.
