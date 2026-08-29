---
title: Arranging Lists
aliases:
    - Arranging Lists
    - Column Layout
    - Column Order
    - Remembering Columns
description: how to reorder, hide and resize the columns in any FOG list, and how FOG remembers each user's arrangement
context_id: list-layout
tags:
    - management
    - web-management
    - web-ui
---

# Arranging Lists

Every list in FOG — hosts, images, snapins, tasks, the association tabs inside
an edit page, and the lists a plugin adds — can be arranged to suit the work
you actually do with it, and **FOG remembers your arrangement**.

The arrangement is saved against your user account, not against the browser,
so it follows you to another machine and survives clearing your browser data.
Two people looking at the same list can each have it arranged their own way.

## What you can change

**Move a column.** Drag a column heading sideways and drop it where you want
it. Put the columns you read first on the left.

**Show or hide columns.** The **Column visibility** button above the list lists
every column with a tick beside the ones currently showing. Hiding the columns
you never read makes the rest wider and stops the table scrolling sideways.

**Resize a column.** Drag the divider between two headings.

**Sort.** Click a heading to sort by it; click again to reverse it.

**Rows per page.** The selector above the list.

## What FOG remembers

Saved per user, per list:

- the order the columns are in
- which columns are showing
- the sort column and direction
- how many rows per page

Each list is remembered separately, so the arrangement you give the host list
has no effect on the image list.

## What FOG deliberately does not remember

**Filters and searches are not saved.** Whatever you typed in the search box,
built in the **Filter** panel, or typed in the **Column search** row is gone
when you come back — see [[filtering-lists|Filtering Lists]].

This is on purpose. A filter that came back on its own would be invisible: the
list would simply be missing rows, with nothing on screen to say why, and the
obvious conclusion is that the data has gone. A layout you did not expect is
something you can see and fix in a second; rows that are not there are not.

## Starting over

To get a list back to how FOG ships it, show any columns you have hidden, drag
the headings back, and set the sort and page length you want — the new
arrangement replaces the old one as soon as you make it.

A saved arrangement also expires on its own after a year of not being touched,
so a list you have not used in a long time comes back in its default shape.
