---
title: Task Management
aliases:
    - Task Management
description: index page for tasks
context_id: tasks
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - tasks
---

# Task Management

## Overview

-   Tasks are all the actions that you can take on a computer, and in FOG there a numerous tasks that can be done including:

	-   Deploy (Unicast)
	-   Capture (Unicast)
	-   Deploy - Multicast
	-   Debug
	-   Memory Test
	-   Test Disk
	-   Disk Surface Test
	-   Recover (File Recovery)
	-   Hardware Inventory
	-   Password Reset
	-   Deploy All Snapins
	-   Deploy Single Snapin
	-   Wake-Up
	-   Deploy - Debug (Unicast)
	-   Capture - Debug (Unicast)
	-   Deploy - Without Snapins (Unicast)
	-   Fast Wipe
	-   Normal Wipe
	-   Full Wipe
	-   Virus Scan *(FOG 1.5 only)*
	-   Virus Scan - Quarantine *(FOG 1.5 only)*
	-   Donate
	-   Torrent-Cast

  
In the tasks section of FOG you can perform tasks on single hosts or groups of hosts. This section also allows you to monitor selective tasks, and stop/cancel tasks.

## General Tasks

The general/common Tasks in FOG include unicast image capture, and unicast image send, as well as a multicast image send. In FOG, sending an image to the server is considered an image capture, and deploying an image to the client is called a send. Both of these tasks can be started directly from the search, list all hosts, and list all groups pages.

To perform a simple image capture, click on the upward facing arrow next to the host. Captures are only possible on a host, not a group. Capturing an image will also overwrite any image file that may already exist for that host without any notification or confirmation.

Please note that capturing images of Windows Vista and Windows 7 requires special command to be run on the clients prior to image capture. Please see [What do I have to do to an image before capturing?](https://wiki.fogproject.org/wiki/index.php?title=What_do_I_have_to_do_to_an_image_before_capturing%3F "What do I have to do to an image before capturing?") for more details.

For a video demonstration of an image capture, please see: [http://www.youtube.com/watch?v=jPPZr0abVfg&fmt=18](http://www.youtube.com/watch?v=jPPZr0abVfg&fmt=18)

To perform a simple image send, click on the downward facing arrow next to the host. An image send can be done on a host or a group. When sending an image to multiple computers FOG works in queue mode, which means that it will only send to 10 (by default) computers at one time. This is done to keep the server from being overworked. As soon as the a machine finishes, another from the queue joins.

A multicast image send transmits one image to many machines at once. It can be started from a group of hosts on the "Task Management" page, from Image Management as a named session that machines join by name, or from a machine sitting at the boot menu. Multicast sends to all the participating computers at the same time, and does not begin transmitting until either every expected client has joined or the configured wait period expires — whichever happens first. Once it starts, the session is closed and no further machines can join it. After starting a multicast task, status can be viewed by clicking on [ctl]+[alt]+f2. A log is also kept for multicast transfers which is stored at /opt/fog/log.

See [Multicast Sessions](multicast.md) for how sessions are created and joined, and for the settings that control how many can run at once.

### Queued snapins, Deploy and Capture

>[!info] FOG 1.6 and later
>This behavior applies to FOG 1.6 and later. It is in the FOG 1.6 dev-branch builds after 2026-11-23. Older versions behave differently. See [[snapin-queued-capture-refused|Capture Refused — Host Has Queued Snapins]].

A Deploy erases the disk. A snapin that was queued for the old install cannot be right for the new one. So every Deploy cancels the leftover snapins of the host. This applies to a Deploy on a host, a Deploy on a group, and a multicast Deploy. It also applies to Deploy - Debug and Deploy - Without Snapins.

The Deploy cancels the queued or in-progress snapin jobs of the host. It also cancels their snapin tasks. A Deploy with snapins then starts a new snapin job.

A Capture builds a base image, so it waits for the queued snapins of the host. If the host has queued snapins, the Capture is refused with this message:

```
Host has queued snapins. Let them finish, or cancel them, before a capture.
```

To capture anyway, tick **Cancel queued snapins first** on the Capture task. FOG cancels the queued snapins and starts the Capture. In the REST API, send `cancelSnapins` in the task body. A scheduled Capture keeps the option, and the scheduler applies it when the task runs. Without the option, the scheduler skips the Capture at each run until the snapins finish.

A task that any check refuses cancels nothing. The queued snapins stay queued.

### Deploys to unregistered machines

>[!info] FOG 1.6.1 and later
>This section applies to FOG 1.6.1 and later. Earlier versions create no task for a machine that is not registered.

A machine that is not registered can pick **Deploy Image** or **Join Multicast Session** in the iPXE boot menu. FOG now creates a real task for the run. The task has no host.

-   The task shows in **Active Tasks** and in the Imaging Report as `<MAC> (unregistered)`. It shows full progress. It ends *Complete* or *Failed*.
-   The FOG user who signed in at the boot menu is the creator of the task.
-   The task respects the **Max Clients** limit of the storage node. At the limit, the task waits in the queue like the task of a registered host.
-   A host that is registered but still pending is treated as unregistered for this. It images and reports.
-   FOG sends the notification events for image complete and image failed for these runs. The host name in the event is `<MAC> (unregistered)`.

An init (FOS) older than the 1.6.1 release cannot report for these tasks. The run still shows in Active Tasks. After 24 hours, FOG moves the task to the state *No Report*. The reason is "FOS sent no report within 24 hours". *No Report* does not mean that the imaging failed. It means that FOS did not report. To fix this, update FOS. The installer pulls the latest FOS release.

To refuse imaging for machines that are not registered, see [[1.6/management/fos/using-fog-boot-menu#Requiring registration before imaging|Requiring registration before imaging]]. For the report view, see [[1.6/management/web/reports#Unregistered machines in the Imaging Report|Unregistered machines in the Imaging Report]].

## Advanced Tasks

The advanced Tasks in FOG include everything that is not a simple capture, simple deploy or mutlicast deploy.

### Debug

Debug mode boots the linux image to a bash prompt and allows the user to issue all commands by hand.

### Capture - Unicast (Debug)

Does the same thing that debug mode does, with the exception that the environment is setup to capture the image. To start the imaging process just type:

	fog

### Send - Unicast (Debug)

Does the same thing that debug mode does, with the exception that the environment is setup to send the image. To start the imaging process just type:

	fog

### Send - Unicast (Without Snapins)

This task does a normal send task with the exception that if any snapins are associated with the host, they are not deployed to the host.

### Deploy All Snapins

This task will send all the snapins associated with a host to the host without imaging it.

### Deploy Single Snapin

This task will send a single snapin that is associated with the host to the host without imaging it. (Note: The snapin must be associated with the host already)

### Memory Test

Boots to Memtest86, a memory testing tool. This a task will not exit with out user intervention at the client side. The task must also be manually stopped via the management front end.

### Wake Up

Wakes up host or group of hosts using Wake-on-Lan.

### Fast Wipe

This task does a quick and dirty wipe of the drive. This task writes zeros to the first ~40MB of the disk. This task should NOT be used if you don't want your data to be recoverable.

### Normal Wipe

This tasks writes random data to the entire surface area of the disk.

### Full Wipe

This tasks writes random data, multiple times to the entire surface of the disk.

### Disk Surface Test

This task will look for bad blocks on the hard disk and report them back to the client console.

### File Recovery

This task will load an application that can be used to recover lost files from the hard disk.

### Virus Scan

>[!warning] Removed in FOG 1.6
>Both virus-scan task types are gone in 1.6, and the upgrade drops the table
>behind them. On 1.6 the scan had no working endpoint to report to, so it
>scanned and discarded every result. See
>[[1.6/kb/reference/virus-scan-removed|The virus scan is gone in 1.6]] for
>what the upgrade removes and what to do instead. The description below
>applies to **FOG 1.5**.

This task will update and load ClamAV and scan the partition for viruses. It will either scan and report or scan and quarantine files, it will also report back to the management portal with the results of the scan.

### Hardware Inventory

[Video Tutorial](http://freeghost.sourceforge.net/videotutorials/InventoryUpdate.swf.html)

The hardware inventory task will execute the same task as the fog.reginput client side task. Since the host is already registered, all it will do is update the computers inventory and restart. It is visioned that this task could be run on a regular interval on a group of all computers in your network, or some sub group of computers in your network. Then on the next reboot of those computers an inventory would be performed.

## Scheduling

As of version 0.27 of FOG, select tasks can be scheduled using a static date/time combination or using a cron style repetitive task scheduling. Task scheduling can be performed on either single hosts, or on groups of computers. One thing to note about task scheduling that isn't intuitive is that it **requires an image to be associated with the host, even for non-image based tasks!** The reason for this is because tasks are only run on the master storage node associated with that host, and the only way to tie a storage node to a host is via an image. We did this to prevent multiple storage nodes to try running the same task for a specific host.

### Single Execution Scheduling

Single task execution will run a task at a single date and time, then the task will be discarded. To scheduled a single execution task, you would go to the tasks section of fog, then select the host or group you would like to schedule the task, then select the task you would like to schedule. You will then be presented with the screen show below.

![[Sched.png]]

To schedule a single execution task, click on white text box below "Schedule Single Task Execution?" and a pop up calendar will load and allow you to select your date and time for the task. Click on the date to close the calendar, then start you task.

### Cron Style Task Scheduling

A cron style task runs again and again on a schedule. It stays in the list after it runs. A single execution task does not. To make one, schedule the task as for a single execution task. Then select **Schedule Cron Style Task Execution**, and fill in the five fields:

| Field | Values |
| --- | --- |
| min | Minute, 0 to 59 |
| hour | Hour, 0 to 23 |
| dom | Day of the month, 1 to 31 |
| month | Month, 1 to 12 |
| dow | Day of the week, 0 to 7. Sunday is 0 or 7, Monday is 1, Saturday is 6. |

The fields use the server's time zone, the **FOG_TZ_INFO** setting. They do not use the time zone of the user who made the schedule.

This schedule runs a Capture at 10:00 PM every day:

	0 22 * * *

The minute is **0** and the hour is **22**. The `*` in the last three fields means every day of the month, every month, and every day of the week.

This schedule runs on every second day of the month, the 1st, 3rd, 5th, and so on:

	0 22 */2 * *

This schedule runs on every second day of the month, but only on Monday to Friday:

	0 22 */2 * 1-5

This schedule runs at 1:30 AM on the 1st of every month:

	30 1 1 * *

#### What a field can hold

| Form | Example | Meaning |
| --- | --- | --- |
| A number | `4` | 4 only |
| A list | `4,5,6,7` | each number in the list |
| A range | `4-7` | 4 to 7 |
| Ranges and lists | `4-7,10` | 4 to 7, and 10 |
| A step | `*/5` | every fifth value, from the first value of the field |
| A range with a step | `0-30/10` | 0, 10, 20, and 30 |
| A start with a step | `5/15` | 5, 20, 35, and 50 |
| A wildcard | `*` | every value |

A step counts from the first value of the field. So in the day of the month, `*/2` is the 1st, 3rd, 5th, and so on. In the month, `*/3` is January, April, July, and October.

FOG refuses a schedule that cannot run. Examples are a minute of 99, a range that goes down such as `30-10`, and a date that does not exist such as `0 0 30 2 *` (February 30).

FOG does not support month names, day names, or the `@daily` style of shortcut. Use numbers.

#### The day of the month and the day of the week

These two fields work together, the same as in cron:

- If both fields hold a restricted value, the task runs on a day that matches **either** field. `0 0 1 * 1` runs on the 1st of the month **and** on every Monday.
- If one of the two fields starts with `*`, the task runs on a day that matches **both** fields. `0 22 */2 * 1-5` runs on odd days that are also weekdays.

#### Daylight saving time

On the day the clocks go forward, a time in the skipped hour runs one hour later. For example, a task at 2:30 AM runs at 3:30 AM. Standard cron runs it at 3:00 AM. On the day the clocks go back, a time in the repeated hour runs one time, at its first occurrence. A schedule with `*` in the minute or the hour, such as `*/15 * * * *`, does not run during the second occurrence of that hour. Standard cron runs it then. FOG does not.

#### When a cron task runs

The FOG Task Scheduler service checks the schedules on each pass. The **SCHEDULERSLEEPTIME** setting sets the time between passes. A pass runs each task that was due since the last pass, one time. A task does not run twice in one minute, and a late pass does not skip it.

If a pass is late, the scheduler looks back at most 10 minutes, or two sleep intervals if that is longer. So a scheduler that was blocked does not run old schedules hours late. When the FOG Task Scheduler service starts, it checks only the current minute. A task that was due while the service was stopped does not run.

#### The Next Run column

Tasks > Scheduled Tasks shows a **Next Run** column. For a single execution task, it is the date and time that you selected. For a cron style task, it is the next time that the schedule matches. The page shows the time in your own time zone. The REST API gives the time in UTC, as it does for every other date.

#### Changes from earlier versions

FOG cron schedules now follow the rules of standard cron. Some saved schedules run at different times after the update. The reason is the same for each change: a schedule must mean in FOG what it means in cron. Then a schedule copied from a crontab, or from a cron guide, does what the guide says.

| Schedule | Before | Now | Why |
| --- | --- | --- | --- |
| `*/2` in the day of the month | even days: 2nd, 4th, 6th | odd days: 1st, 3rd, 5th | Cron counts a step from the first value of the field. The day of the month starts at 1. FOG counted from 0. |
| `*/3` in the month | March, June, September, December | January, April, July, October | The month starts at 1, so the same rule applies. |
| `*/2` in the day of the month, with a day of the week such as `1-5` | a day that matches either field | a day that matches both fields | In cron, a field that starts with `*` does not restrict the day by itself. |
| any schedule, on FOG 1.6.0 | the fields were read as UTC | the fields are read in FOG_TZ_INFO | The fields are local times. FOG 1.6.0 read them in the storage time zone, which is UTC. |
| a minute or hour that the scheduler checked late, or twice | the task could be skipped, or run twice | the task runs one time | The scheduler now checks every minute since its last pass. |

To keep the old days for a `*/2` day-of-month schedule, write the even days as a step from 2: `2-30/2`. To keep the old months for `*/3`, write `3-12/3`.

>[!info] FOG 1.6 and later
>The behavior in this section is in FOG 1.6 dev-branch builds after 2026-11-23. It ships in FOG 1.6.1. See [[cron-schedule-runs-at-the-wrong-time|Cron Schedule Runs at the Wrong Time]] for the symptoms on earlier versions.

For more information on cron, see [https://en.wikipedia.org/wiki/Cron](https://en.wikipedia.org/wiki/Cron).
