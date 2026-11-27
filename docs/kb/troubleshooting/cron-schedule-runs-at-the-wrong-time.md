---
title: Cron Schedule Runs at the Wrong Time
aliases:
    - Cron Schedule Runs at the Wrong Time
    - Scheduled task runs at the wrong time
    - Wake on LAN schedule runs at the wrong time
description: Why a cron style scheduled task or power-management schedule runs hours off, on the wrong days, twice, or not at all, and what to do
context_id: cron-schedule-runs-at-the-wrong-time
tags:
    - troubleshooting
    - tasks
    - scheduling
---

# Cron Schedule Runs at the Wrong Time

>[!info] FOG 1.6 and later
>The fix is in FOG 1.6 dev-branch builds after 2026-11-23. It ships in FOG 1.6.1.

## Symptom

A cron style scheduled task, or a power-management schedule such as Wake on LAN, does one of these:

- It runs some hours early or late. The difference is the offset of your time zone from UTC. A schedule of `0 23 * * *` on a server in America/Chicago runs at 5:00 PM.
- It runs on even days, when cron would run it on odd days, for a day of the month of `*/2`.
- It runs on a day that matches only one of the two day fields, for a schedule such as `0 22 */2 * 1-5`.
- It does not run on some days, or it runs twice.

The scheduler log (`/opt/fog/log/fogscheduler.log`) writes the run time in UTC (`+0000`). On an affected version, the UTC hour is the same as the hour in the schedule. For `0 23 * * *`:

```
 * Scheduled Task run time: Mon, 23 Nov 2026 23:00:00 +0000
```

On a fixed version, the log shows the schedule's local time converted to UTC. On a server in America/Chicago, that is `05:00:00 +0000` on the next day.

The **Start Time** column of Tasks > Scheduled Tasks shows a time that is not when the task runs.

## Cause

FOG 1.6.0 stores dates in UTC. The scheduler read the five cron fields in that storage time zone, not in the server's time zone (FOG_TZ_INFO). So every cron schedule moved by the UTC offset.

Separately, earlier versions of the FOG scheduler did not follow some rules of standard cron:

- A step such as `*/2` counted from 0, not from the first value of the field.
- A field that starts with `*` was not treated as unrestricted in the day-of-month and day-of-week rule.
- The scheduler checked only "does this minute match" on each pass. A late pass skipped the minute. A sleep time below 60 seconds ran the same minute twice.

## Fix

Update to a FOG version that has the fix. The cron fields are then read in FOG_TZ_INFO, and the rules match standard cron. The column is now **Next Run**, and it shows the next time in your own time zone.

After the update, some saved schedules run on different days. See [[management/web/tasks#Changes from earlier versions|Changes from earlier versions]] for each change and the reason for it.

## Workaround on FOG 1.6.0

Write the cron fields in UTC. For example, on a server in America/Chicago (UTC-6 in winter), write `0 5 * * *` for 11:00 PM. Change the schedule back after you update, because the update reads the fields as local time. A UTC schedule also moves by one hour at each daylight saving change.

## See also

- [[tasks|Task Management]]
