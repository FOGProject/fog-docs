---
title: "Report Management (1.5)"
aliases:
    - "Report Management (1.5)"
    - "Reports (1.5)"
description: The single flat list of reports on FOG 1.5, none of which carry a date window
context_id: "reports-1.5"
tags:
    - reports
    - management
    - web-management
    - web-ui
    - 1_5-legacy
---

# Report Management (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/management/web/reports|1.6 version]] of this page for FOG 1.6.

## Overview

Reports live under **Reports** in the main menu, and each one is a page of
its own in the left-hand list. Unlike the current line, there is **no
grouping** — every report and every plain list sits in one flat menu, sorted
alphabetically, built by scanning `packages/web/lib/reports/` on disk (plus
any report a plugin adds).

There is also **no date-window control** anywhere on this line. A report
either filters by a specific object you pick from a drop-down (host, group,
image, user, location, snapin) or shows everything it has — there is no
concept of "last 30 days" applied uniformly the way the current line's
**Reports** group has.

## The reports

| Report | Filters by | Notes |
|---|---|---|
| **Host List** | host/group/image/user selects | A row per host |
| **Hosts And Users** | host/group/image/user selects | Hosts alongside the user logged in |
| **History Report** | host/group/image/user selects | Every history entry FOG has recorded |
| **Imaging Log** | image/user/host selects | **Start** and **End** are result columns showing each row's timestamps, not a date filter |
| **Inventory Report** | host/group/image/user selects | Hardware inventory |
| **Snapin Log** | host/group/image/user/snapin selects | Which snapins ran, where |
| **User Tracking** | host/group/image/user selects | Hosts and the users who have logged into them |
| **Pending MAC List** | none | MAC addresses awaiting approval |
| **Product Keys** | none | Each host's stored Windows product key, unmasked |
| **Virus History** | none | Antivirus history entries |
| **Equipment Loan** | host/group/image/user selects | Equipment loan tracking |

Several bundled plugins add a report of their own to this same flat list —
the mechanism treats a plugin's report file identically to a core one, so it
appears in the same alphabetical menu rather than in a group of its own.

## Exporting

Every report has exactly one **Export CSV** button. There is no separate
"export everything, including rows off the current page" button — this
line's reports have no equivalent of the current line's **CSV (All)**.

>[!warning] Unconfirmed: row-count cap
>Whether a client-side table limit silently caps what actually renders (as
>opposed to what the server returns) could not be confirmed while writing
>this page. If you rely on a report returning genuinely every matching row
>on a large fleet, verify against your own data rather than assuming an
>unbounded export.

## Writing a report

A report is one PHP file in `packages/web/lib/reports/`, named after the
class it declares, extending `ReportManagementPage` rather than the current
line's `ReportManagement`. There is no `fullExport`/`reportRows()` split —
a report builds and renders its own table directly, so the on-screen grid
and the CSV export are not guaranteed to agree the way they are on the
current line.

If you are starting a new report from scratch, consider writing it against
the current line's shape instead — see
[[1.6/management/web/reports#Writing a report|Report Management]] — since the
newer API is where ongoing report development happens.
