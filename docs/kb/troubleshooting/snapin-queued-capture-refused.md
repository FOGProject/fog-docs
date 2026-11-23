---
title: Capture Refused — Host Has Queued Snapins
aliases:
    - Host has queued snapins
    - Capture Refused Queued Snapins
description: What to do when a capture is refused because the host has queued snapins
context_id: snapin-queued-capture-refused
tags:
    - troubleshooting
    - imaging
    - capture
    - snapins
---

# Capture Refused — Host Has Queued Snapins

>[!info] FOG 1.6 and later
>This refusal exists in FOG 1.6 dev-branch builds after 2026-11-23. It will ship in the next FOG 1.6 patch release after 1.6.0.

## Symptom

You start a Capture on a host. FOG refuses the task with this message:

```
Host has queued snapins. Let them finish, or cancel them, before a capture.
```

## Cause

A Capture builds a base image. Queued snapins would run on the host after the Capture, so FOG refuses the Capture while they wait. The refusal cancels nothing. The queued snapins stay queued.

## What to do

Pick one:

- Let the queued snapins finish. Then start the Capture again.
- Tick **Cancel queued snapins first** on the Capture task. FOG cancels the queued snapins and starts the Capture. In the REST API, send `cancelSnapins` in the task body.
- Cancel the snapin task under Tasks. Then start the Capture again.

A scheduled Capture keeps the option. Tick it when you schedule the Capture, and the scheduler cancels the queued snapins when the task runs. Without the option, the scheduler skips the Capture at each run and tries again later. The scheduler log shows "Skipping scheduled task" with this message.

A Capture scheduled before the upgrade to schema 467 has the option set, because a Capture canceled queued snapins on those versions.

## Older versions

On older versions, a Deploy could leave old snapins queued. Those snapins then ran on the new install. To avoid this, cancel the snapin task before you deploy. In the FOG 1.6 builds named above, a Deploy cancels them for you. See [[management/web/tasks#Queued snapins, Deploy and Capture|Queued snapins, Deploy and Capture]].

## See also

- [[tasks|Task Management]]
