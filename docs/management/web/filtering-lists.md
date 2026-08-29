---
title: Filtering Lists
aliases:
    - Filtering Lists
    - Column Filters
    - Column Search
description: how to filter any list in the FOG web interface by individual columns, from the Filter panel or the per-column header row, including date ranges
context_id: filtering-lists
tags:
    - management
    - web-management
    - web-ui
---

# Filtering Lists

Every list in FOG — hosts, images, snapins, tasks, reports, the association
tabs inside an edit page, and the lists a plugin adds — carries two ways to
narrow what it shows.

The **search box** above the list is a quick free-text match: type anything and
FOG returns rows where *any* column contains it. It is the fastest way to find
one thing you can already name.

The **Filter** button, next to Select All and Refresh, is for everything else.
It builds a filter one rule at a time, and each rule names a single column.

The **Column search** button beside it is the same thing in a different shape:
a row of boxes under the column headings, one per column, so you can type
straight under the heading you mean. Use whichever suits the job — a quick
"host name starts with lab" is faster in the header row, while anything with
brackets or an *Or* in it wants the Filter panel.

Neither is remembered between visits: a list always opens unfiltered. That is
deliberate — see [[list-layout|Arranging Lists]], which covers what FOG *does*
remember about a list and why filters are kept out of it.

## Building a filter

Click **Filter**, then **Add condition**. A rule has three parts:

1. the **column** to look at,
2. the **condition** to apply,
3. the **value** to compare against.

Add more rules to narrow further. The **And / Or** control to the left of the
rules decides how they combine: *And* keeps only the rows matching every rule,
*Or* keeps the rows matching any of them. **Add group** nests a set of rules
inside brackets, so you can express things like *"deployed this month, and
called either lab-a or lab-b"*.

The button counts the rules you have added, so `Filter (2)` means two are
active. **Clear All** removes them.

>[!note]
>The filter and the search box work together — with both in use, a row has to
>satisfy the search *and* the filter. If a list looks emptier than you expect,
>check both.

## The conditions you get depend on the column

FOG knows what each column really holds, and offers only the conditions that
make sense for it.

| Kind of column | Examples | Conditions offered |
| --- | --- | --- |
| Text | Host name, image name, description | Equals, Not, Starts With, Ends With, Contains, Does Not Contain, Empty, Not Empty |
| Number | ID, size, port | Equals, Not, `<`, `<=`, `>=`, `>`, Between, Not Between, Empty, Not Empty |
| Date and time | Last deployed, last seen, created, checked in | Equals, Not, Before, After, Between, Not Between, Empty, Not Empty |

A few columns cannot be filtered on and are simply not listed as choices. Two
kinds: values FOG never sends to the browser in the first place (a host's
security token, for instance), and columns the list *calculates* rather than
stores — a group's member count, or a site's host count. There is nothing in
the database for a rule to match against.

>[!note]
>The list of choices comes from the server, so a plugin's own lists get the
>right conditions for their own columns with nothing to configure.

## Filtering by date

Date conditions open a calendar. Pick a day rather than typing one, and note
that a date condition always means **the whole of that day**:

- **Equals 2026-08-29** — anything that happened at any time on the 29th.
- **Before 2026-08-29** — anything up to midnight starting the 29th. The 29th
  itself is *not* included.
- **After 2026-08-29** — anything from midnight starting the 30th. The 29th
  itself is *not* included.
- **Between 2026-08-01 and 2026-08-31** — both days included, in full.

**Empty** and **Not Empty** are the ones worth knowing about. A date column is
empty when the thing has never happened: a host that has never been deployed
has no deploy date at all, which is a different fact from having an old one.
Those rows are excluded from *Before* and *After* — asking for "deployed before
today" gives you hosts that were deployed, and not the ones that never were.
Use **Empty** when the never-happened rows are what you are looking for.

## Searching under the column headings

Click **Column search** and a row of boxes appears beneath the headings. Each
box has a small picker to its left choosing how to match, and the choices are
the same ones the Filter panel offers for that column — so a text column can
do `has` (contains), `is` (exactly), `a…` (starts with), `…z` (ends with) and
their negatives, a number column gets the comparisons, and a date column gets
`on`, `before`, `after`, `not on` and `never`. Hover a choice to see its full
name.

Typing filters as you go. On a date column the box is a date picker, and on
`empty` / `never` / `set` the box switches off, because those conditions have
nothing to compare against.

Boxes on several columns combine with *And* — every box you fill narrows the
list further. They also combine with the Filter panel and with the search box,
so a row has to satisfy all three.

>[!note]
>Turning **Column search** off clears the boxes as well as hiding them. That is
>deliberate: a filter you cannot see looks exactly like missing data.

Columns that cannot be filtered get no box, the same ones and for the same
reasons as in the Filter panel. Narrow columns put the picker above the box
rather than beside it; you can drag a column wider if you would rather have
them on one line.

## Exporting what you filtered

On the pages that offer a **CSV (All)** button, the export follows the filter.
Whatever the list is showing when you click it is what the file contains —
every matching row, not just the page on screen.

>[!note]
>The other toolbar buttons — Copy, CSV, Excel, Print — are the browser's own
>and can only see the rows it is currently holding, which on a long list is one
>page. **CSV (All)** is the one that asks the server for the whole result.

## Wildcards

You do not need them, and they are not interpreted. The condition itself says
where the match may fall, so *Contains* already means "anywhere". A `%` or `_`
typed into a filter value is treated as that character — searching for `50%`
finds the text `50%`.

The free-text search box above the list behaves differently and is deliberately
looser.
