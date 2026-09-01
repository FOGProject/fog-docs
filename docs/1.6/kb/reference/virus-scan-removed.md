---
title: The virus scan is gone in 1.6
aliases:
    - The virus scan is gone in 1.6
    - Virus Scan
    - Virus Scan - Quarantine
    - Virus History
    - ClamAV
    - Anti-Virus
    - Antivirus
description: "FOG 1.6 removes the ClamAV virus scan task types and the virus table. Why it went, what the upgrade deletes, and what to do instead"
context_id: virus-scan-removed
tags:
    - 1_6-changes
    - kb
    - reference
    - tasks
---

# The virus scan is gone in 1.6

>[!info] FOG 1.6
>FOG 1.5 offers two virus-scan task types and a Virus History view. **FOG 1.6
>removes both**, and the database upgrade drops the table behind them. This
>page explains what went and why. On 1.5 the feature is unchanged — see
>[[1.5/management/web/reports|Report Management (1.5)]].

If you have upgraded to 1.6 and the **Virus Scan** and **Virus Scan -
Quarantine** entries are missing from a host's or group's task list, they were
removed deliberately. Nothing is misconfigured and there is no setting to turn
them back on.

## Why it was removed

**It had not worked on 1.6 for the whole life of the branch.**

The scan itself ran on the client. FOS — the small Linux image a machine boots
into for FOG tasks — carried a script, `bin/fog.av`, that loaded ClamAV,
updated its definitions, scanned the disk, and then posted what it found back
to the server at `service/av.php`.

FOG 1.6 never carried that endpoint across from 1.5. Look for it in the
webroot of each and only one of them has it:

```
$ ls /var/www/html/fog/service/av.php
# on a 1.5 server:  /var/www/html/fog/service/av.php
# on a 1.6 server:  No such file or directory
```

So on 1.6 the whole sequence ran and then threw its results away against a
404. The machine booted, downloaded definitions, scanned every file on the
disk, and reported into nothing.

And there was nothing waiting to receive them in any case. 1.6 has no virus
model, no manager, no report and no page — the only thing left of the feature
was the `virus` database table, holding rows a 1.5 install had written before
the upgrade, which 1.6 has had no way to display since.

What remained on offer, then, was two task types for a scan that could not
report, and a `clamav=` kernel argument pointing at a boot image with nowhere
to send its findings. Removing them is removing an option that could only
waste a machine's time.

>[!note] This is a removal, not a regression
>The scan being broken on 1.6 was not noticed for a long time precisely
>because nothing errors: the task queues, the machine boots, the scan runs,
>and the machine reboots. Everything looks like it worked. Only the results
>are missing, and there was no page on which to notice their absence.

## What the upgrade does

When you run the 1.6 database upgrade, it:

- **deletes the two task types** — `Virus Scan` (21) and `Virus Scan -
  Quarantine` (22), plus the original 1.x `Virus Scan` (9) if you are
  restoring from a very old database;
- **deletes any tasks of those types**, queued, scheduled or historical;
- **drops the `virus` table.**

Every task list in the web UI is built from the task-types table itself, so
removing those rows is what clears the entries from the host page, the group
page, the queue-task modal and the API — all at once, with no separate step.

The upgrade records how many rows of each kind it removed, in the server log
and in the audit log, so you can find out afterward exactly what went.

### What you lose, stated plainly

| Thing | What happens |
|---|---|
| A **scheduled** virus scan | Deleted. It could never have run again, so nothing usable is lost. |
| A queued or historical **task** row | Deleted. |
| The **run history** of past scans | **Kept.** |
| Rows in the **`virus` table** | Deleted with the table. These are 1.5-era leftovers 1.6 could not display. |

The run history survives because FOG already keeps task history somewhere
else, deliberately: the **task log** stores the task type as *text* rather
than as a reference. A scan that ran in 2024 still appears there, still named
`Virus Scan`, after the task type it pointed at has gone. That is the same
reasoning that let the old imaging log be retired — the log of what happened
is not the same record as the definition of what could be done.

>[!important] Take a database backup before upgrading
>Good practice for any upgrade, and this one drops a table. If you want the
>contents of `virus` from a 1.5 install for your own records, export it
>before you upgrade — afterward it is gone.

## What to do instead

**Scan from inside the running operating system, not from a boot image.** That
is where antivirus is designed to work: it can see the running processes, the
registry, the user profiles and the files that are actually in use, and it can
act on what it finds. An offline scan of a mounted partition sees a subset of
that and cannot quarantine anything the OS will not later undo.

FOG's part in this is deployment and scheduling, which it is good at:

- **Install your antivirus with a snapin.** If your hosts use Chocolatey,
  [[chocolatey-snapins|the Chocolatey templates]] will install and update a
  package for you; otherwise a normal snapin running the vendor's silent
  installer does the job.
- **Grant it to a group** so every member gets it, including hosts you add
  later — see [[1.6/management/web/groups|Group Management]].
- **Let the antivirus schedule its own scans.** Every product worth deploying
  has scheduling built in, and it will run against a live system rather than
  against a disk that is not booted.

If what you actually want is to inspect a machine that will not boot, that is
a different job from routine antivirus, and a rescue medium is the right tool
for it.

## The FOS side

`bin/fog.av` and ClamAV in the FOS buildroot configuration are removed
separately, in the FOS repository. Once the server change above is in, nothing
can set `mode=clamav`, so the script is unreachable regardless of which FOS
version a server is serving — an older FOS on a 1.6 server simply never gets
asked to scan.

## See also

- [[tasks|Task Management]] — the task types that remain
- [[snapins|Snapin Management]] and
  [[chocolatey-snapins|Install software with Chocolatey snapins]]
- [[1.6/management/web/groups|Group Management]] — granting a snapin to every
  member of a group
