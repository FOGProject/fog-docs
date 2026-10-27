---
title: Post-init Scripts
aliases:
    - Post-init Scripts
    - Post Init Scripts
    - fog.postinit
description: How to run your own script inside FOS before every task, to change FOS for one boot without building a custom init
context_id: post-init-scripts
tags:
    - how-to
    - fos
    - post-init
---

# Post-init Scripts

A post-init script is your own bash script that FOS runs **at the start of
every task**, before the task does any work. The script lives on your storage
node, not inside the init. So you can change how FOS behaves without building
a custom init, and a FOG or FOS update never overwrites your change.

## Which customization do you need?

Use the first row that does the job. Each row down is more work to keep
current.

| You want to | Use | It lives in |
|---|---|---|
| Change a deployed computer after imaging (drivers, boot entries, config files) | [[post-download-scripts\|Post-download script]] | `/images/postdownloadscripts/` |
| Change FOS itself before a task: add a tool, replace a FOS file, set a variable, prepare a disk | **Post-init script** (this page) | `/images/dev/postinitscripts/` |
| Change FOS before the network or the post-init step starts, or change it on a computer that cannot reach the storage node | [[customize-the-fos-init\|Custom init]] | a custom init file plus the host's **Host Init** field |

A custom init is a copy of FOS that you must build again for every FOS
release. A post-init script applies to whatever FOS release boots. Use a
custom init only when a script cannot do the job.

## How it works

The installer creates the entry script on each storage node:

```
/images/dev/postinitscripts/fog.postinit
```

The installer writes this file only when it is missing. An update does not
change it.

At the start of every task, FOS does these steps:

- It mounts the storage node's `/images/dev/` share over NFS.
- It **sources** `fog.postinit` with the `.` builtin. Your script runs in the
  same shell as FOS and sees all of the FOS variables.
- It unmounts the share, and then it starts the task.

This happens for **every** task type: deploy, capture, wipe, inventory,
Performance Test, and the others. If your script must act on only some tasks,
test `$type` and `$mode` (see the variables below).

FOS runs from memory. A file that your script writes or replaces inside FOS
stays changed until the computer reboots. The next boot starts again from the
unchanged init.

## Add a script

1. Put your script in `/images/dev/postinitscripts/` on the storage node. For
   example: `/images/dev/postinitscripts/myscript.sh`.
2. Add one line to `fog.postinit` that sources your script:

   ```bash
   . ${postinitpath}myscript.sh
   ```

   `${postinitpath}` holds the path of the scripts folder as FOS sees it.

3. Make the files readable to everyone. FOS reads them over NFS.

If you have more than one storage node, put the same files on each node that
runs tasks. FOS reads the scripts from the node that the task uses.

## Variables your script can use

These were read in a lab boot of a Performance Test task:

| Variable | Holds | Example |
|---|---|---|
| `$mac` | the host's primary MAC address | `08:00:27:71:5e:1f` |
| `$hostname` | the host's name in FOG | `fos-perftest` |
| `$type` | `down` for a deploy, `up` for a capture, empty for other tasks | `down` |
| `$mode` | the task for a non-imaging task, empty for a deploy or capture | `perftest`, `wipe`, `inventory` |
| `$osid` | the OS ID of the host's image | `9` |
| `$img` | the image name. It can be empty for a non-imaging task | `win11-lab` |
| `$storage` | the NFS share that FOS mounted | `10.255.20.1:/images/dev/` |
| `$postinitpath` | the scripts folder as FOS sees it | `/imagesinit/postinitscripts/` |

To see every variable in your FOS release, add `printenv | sort` to your
script for one boot.

## Example: replace a FOS file for one boot

This script replaces one FOS file, only on one host, and only for a deploy.
The new file is in the scripts folder next to the script:

```bash
#!/bin/bash
# /images/dev/postinitscripts/fix-one-host.sh
[[ $mac == 00:11:22:33:44:55 && $type == down ]] || return 0
cp ${postinitpath}myfile /usr/share/fog/lib/myfile
```

The `cp` runs before the task starts, so the deploy uses the new file. The
same method was tested in the lab: a post-init script replaced
`/bin/fog.perftest`, and the task ran the replacement.

> [!warning] A replaced FOS file does not follow FOS updates
> When you replace a whole FOS file, FOS uses your copy even after a FOS
> update changes the original. An old copy of a file such as `funcs.sh` can
> break a newer FOS. Replace the smallest file that does the job. Check your
> copies again after each FOS update.

## Rules that prevent a failed task

- **Use `return`, not `exit`.** FOS sources your script, so `exit` stops FOS
  itself, and the task never starts.
- **Do not leave a command that waits for input.** The task waits at the
  post-init step until someone presses a key.
- **Keep it short.** The task does not start until the script finishes.
- **Test on one host first.** A test on `$mac`, as in the example, limits the
  script to that host.

## Related

- [[post-download-scripts|Post-download scripts]] run after a deploy.
- [[customize-the-fos-init|Customize the FOS init]] covers a custom init.
