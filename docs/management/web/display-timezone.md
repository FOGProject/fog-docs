---
title: Display Timezone
aliases:
    - Display Timezone
    - Timezone
    - Time Zone
    - FOG_TZ_INFO
description: how FOG decides which timezone to show dates and times in, how each user can choose their own, and why that is separate from the timezone the database is written in
context_id: display-timezone
tags:
    - management
    - web-management
    - web-ui
---

# Display Timezone

FOG shows every date and time in a timezone. Which one depends on two settings
that are easy to confuse, so it is worth being clear about both.

## The install's timezone

`FOG_TZ_INFO`, under **FOG Configuration → FOG Settings**, is the timezone the
server itself works in. It is the default everyone sees, and — importantly —
**it is also the timezone FOG writes into the database**.

That second part is what makes it more than a display setting. When FOG records
that a host checked in, it writes the time as `FOG_TZ_INFO` reads it. So
changing `FOG_TZ_INFO` does not re-present the times already recorded; it
changes what those recorded times are taken to *mean*. A row written at 09:00
when the setting said `America/Chicago` will be read as 09:00 `Europe/London`
after the setting changes, which is a different moment.

!!! warning "Changing FOG_TZ_INFO re-labels existing records"
    Set it once, when the server is installed, and leave it alone. If you do
    need to change it — the server physically moved, or it was wrong from the
    start — be aware that every timestamp already in the database will be read
    in the new zone. Nothing is rewritten, and nothing warns you.

    If you only want people to *see* a different timezone, that is the per-user
    setting below, and it is the one you almost certainly want.

## Your own timezone

Click the **clock icon** in the top bar. Choose a timezone and save; the page
reloads and every date on it is now shown in the zone you picked.

This changes only what **you** see. It does not change anything that is stored,
and it does not affect anyone else — two people looking at the same host see
the same moment, each in their own zone.

The choice is saved against your user account rather than your browser, so it
follows you to another machine. Choosing **Server default** clears it and puts
you back on `FOG_TZ_INFO`.

Every signed-in user can set this, including an account with no role assigned.

### What it covers

- dates on any list — tasks, hosts, images, snapins, the audit log
- dates on edit and detail pages
- **filtering by date**. If you filter a list to "on 29 August", that means
  *your* 29 August. This matters more than it sounds: near midnight the
  server's day and yours are different days, and a filter that showed one and
  searched the other would look like missing rows.

### What it does not cover

**The REST API.** Dates from `/api/…` are always in the server's timezone,
whichever user's token was used. A script needs one stable answer, not one that
changes depending on who is running it — and the values carry no timezone
marker to tell the difference.

**Scheduled tasks.** A task set to run at 02:00 runs at 02:00 on the server. The
schedule is the server's clock, not the viewer's, and changing your display
timezone does not move it.

## What is stored

FOG stores times in the server's timezone rather than in UTC. That is a known
limitation and the reason the warning above exists. Moving storage to UTC is a
one-way conversion of every date in the database, so it is being done as its own
release rather than folded into the display setting.

The per-user setting above works today regardless, and nothing about it is
affected by that later change.
