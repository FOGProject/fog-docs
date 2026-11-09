---
title: Post Download Scripts
aliases:
    - Post Download Scripts
    - Post Install Scripts
description: How to use FOG post download scripts to run custom automation on a host after an image is deployed
context_id: post-download-scripts
tags:
    - driver-injection
    - post-download
    - how-to
    - fos
---

# Post Download Scripts

FOG can run your own bash scripts on a host **after an image finishes deploying
but before the host reboots**, from inside the FOS imaging environment. This is
the hook you use for anything FOG itself doesn't do — injecting drivers,
recreating UEFI boot entries, renaming partitions, writing host-specific config,
and so on.

> [!note]
> These run **after a deploy (download)** only. To run something before any
> task, or to change FOS itself without building a custom init, use a
> [[post-init-scripts|post-init script]].

## How it works

The installer creates a scripts directory and a master script on your FOG server:

```
/images/postdownloadscripts/fog.postdownload
```

`fog.postdownload` is the entry point that FOS runs. FOS runs it after the
last partition is written, and before it renames the Windows computer and
tells the server that the task is complete. The installer writes this file
only when it is missing, so an update does not change it.

The file is **sourced** (with the
`.` / `source` builtin), so any script you call from it runs in the same shell
and inherits all of the imaging environment's variables. The file ships with the
calling syntax in its comments:

```bash
#!/bin/bash
## This file serves as a starting point to call your custom postimaging scripts.
## <SCRIPTNAME> should be changed to the script you're planning to use.
## Syntax of post download scripts are
#. ${postdownpath}<SCRIPTNAME>
```

To add your own script:

1.  Drop it in `/images/postdownloadscripts/`, e.g.
    `/images/postdownloadscripts/myscript.sh`.
2.  Add a line to `fog.postdownload` that sources it (note the leading `.` and
    that `${postdownpath}` already points at the scripts directory):

    ```bash
    . ${postdownpath}myscript.sh
    ```

3.  That's it — the script runs on every deploy. Use the variables described
    below to limit it to specific hosts or images.

> [!tip]
> Because `fog.postdownload` is sourced, you generally don't need to `chmod +x`
> your script — but keeping it executable does no harm. Make sure the files are
> readable by the FOG/apache user so FOS can pull them over NFS.

## Variables available to your script

FOS exports a number of variables you can branch on. The commonly used ones
include:

| Variable | Meaning |
| --- | --- |
| `$hd` | the disk that was imaged (for example `/dev/sda` or `/dev/nvme0n1`) |
| `$disks` | space-separated list of all target disks, for multi-disk images |
| `$hostname` | the host's name as registered in FOG |
| `$mac` | the host's primary MAC address |
| `$img` | the name of the image that was deployed |
| `$osid` | the numeric OS ID set on the image |
| `${postdownpath}` | path to the post-download scripts directory |

The deployed partitions are present as the usual block devices, but FOS does not
necessarily leave them mounted — if your script needs to read or write files on
the deployed OS, mount the partition yourself (for example
`mount /dev/sda2 /mnt`) and unmount it when you're done.

> [!tip]
> The exact set of variables can differ between FOS versions. To see everything
> that is available in your environment, temporarily add `printenv | sort` to
> your script and watch the host's screen (or its imaging log) during a deploy.

## Domain join password and product key

FOS does not put the host's Active Directory join password or its Windows
product key into the imaging environment. A script that writes them into an
`unattend.xml` must ask the server for them. It first gets a one-time host
token from `status/hostgetkey.php`. It then posts that token to
`service/hostinfo.php`, and the reply sets `$hostadpass` and
`$hostproductkey`.

>[!warning] FOG 1.6 releases after 1.6.0.14
>`service/hostinfo.php` sends `$hostadpass` and `$hostproductkey` only when
>the **FOG_HOSTKEY_ALLOWED_SOURCES** setting lists your imaging networks, and
>only to a caller inside them. While the setting is empty, which is the
>default, both variables are empty. The other variables, such as
>`$hostaddomain`, `$hostaduser` and `$hostadou`, are still sent.
>
>The reason: the host token needs no password. Any machine that knows a
>host's MAC address can get it while that host has a task. Before this
>change, that machine could then read the plaintext join password
>(GHSA-666x-5fjv-v8j9).

To keep a script that reads these two variables working, set the imaging
networks:

1.  In the web UI, open **FOG Configuration → FOG Settings**, and find
    **FOG_HOSTKEY_ALLOWED_SOURCES** in the **Security** section.
2.  Enter the networks your hosts image from, as a comma-separated list of
    CIDR ranges or single addresses, for example `10.0.0.0/8,192.168.5.20`.
3.  Save, and deploy one host to check that the script gets the values.

A caller outside the listed networks gets no host token at all, so make sure
the list includes every network that USB-booted hosts image from.

The listed networks are the only protection left. Any machine inside them
that knows a host's MAC address can still get the password while that host
has a task. Use a join account that can only join computers to the domain,
and keep the imaging networks separate from user networks where you can.

## Worked examples

-   **Recreate UEFI boot entries** after a multi-disk or dual-boot deploy —
    [[uefi-boot-entries|Managing UEFI Boot Entries (efibootmgr)]] and
    [[deploy-dual-boot-multi-disk-image|Deploying a Dual-Boot Multi-Disk Image]].
-   **Windows driver injection** — see the forum write-up linked below.

A minimal skeleton that only acts on one image looks like this:

```bash
#!/bin/bash
# /images/postdownloadscripts/example.sh
case "$img" in
    win11-lab)
        # mount the deployed Windows partition and do something
        mount /dev/${hd#/dev/}2 /mnt 2>/dev/null
        # ... your changes here ...
        umount /mnt 2>/dev/null
        ;;
esac
```

## Rules that prevent a failed task

- **Use `return`, not `exit`.** FOS sources your script, so `exit` stops FOS
  before it tells the server that the task is complete. The host then shows
  the task as still running.
- **Unmount what you mount.** Unmount each partition before your script ends.

## Post-init scripts

To run a script before every task, see [[post-init-scripts|Post-init scripts]].

## More examples and discussion

-   [The magical, mystical FOG post download script (FOG forums)](https://forums.fogproject.org/topic/7740/the-magical-mystical-fog-post-download-script)
-   [FOG post install script for Windows driver injection (FOG forums)](https://forums.fogproject.org/topic/8889/fog-post-install-script-for-win-driver-injection)
