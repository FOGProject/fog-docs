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
| `$osfamily` | the OS family the server sends: `windows`, `linux`, `macos` or `other`. Empty on a server that does not send it |
| `$osClass` | the OS class FOS resolved from `$osid` and `$osfamily`. See [Branch on the operating system](#branch-on-the-operating-system) |
| `${postdownpath}` | path to the post-download scripts directory |

The deployed partitions are present as the usual block devices, but FOS does not
necessarily leave them mounted — if your script needs to read or write files on
the deployed OS, mount the partition yourself (for example
`mount /dev/sda2 /mnt`) and unmount it when you're done.

> [!tip]
> The exact set of variables can differ between FOS versions. To see everything
> that is available in your environment, temporarily add `printenv | sort` to
> your script and watch the host's screen (or its imaging log) during a deploy.

## Branch on the operating system

Do not test a list of OS IDs in your script. A list such as
`case $osid in 5|6|7|9|10|11)` breaks each time FOG adds an OS. A new Windows
release gets a new ID, and your list does not include it.

Test `$osClass` instead. FOS sets it once, before your post-download script
runs. Each OS ID maps to one class:

| `$osClass` | OS IDs |
| --- | --- |
| `xp` | 1 (Windows 2000/XP) |
| `vista` | 2 (Windows Vista) |
| `win98` | 3 (Windows 98) |
| `winother` | 4 (Windows Other) |
| `win7` | 5, 6, 7 (Windows 7, 8, 8.1) |
| `winmodern` | 9, 10, 11 (Windows 10, 11, Server), and every newer Windows ID |
| `linux` | 50, 51 (Linux, Chromium OS), and every newer Linux ID |
| `mac` | 8 (Apple Mac OS), and every newer macOS ID |
| `other` | 99 (Other OS), and every newer ID in the Other family |

IDs 1 to 7 are old Windows releases, so their classes never change. Every
newer ID gets its class from the family that the FOG server stores for that
OS. The server sends the family as `$osfamily`.

Example: the old form of a script that runs only for Windows 7 and later:

```bash
case $osid in
    5|6|7|9|10|11)
        # Windows 7 and later
        ;;
esac
```

The same test with `$osClass`. It also matches a Windows ID that FOG adds later:

```bash
case $osClass in
    win7|winmodern)
        # Windows 7 and later
        ;;
esac
```

To test for any Windows, list every Windows class. Do not test `$osfamily`
for this: it is empty when the server does not send it.

```bash
case $osClass in
    xp|vista|win98|winother|win7|winmodern)
        # any Windows
        ;;
esac
```

> [!note] Older FOS and older servers
> `$osClass` exists in FOS builds released after 2026-11-10 (fos#204). An older
> FOS leaves it empty. `$osfamily` comes from the FOG server. A server that
> does not send it leaves it empty, and FOS then uses its own table for the
> IDs it knows. A script that must run on an older FOS can test `$osClass`
> first, and keep its old `$osid` test only for an empty `$osClass`:
>
> ```bash
> if [[ -n $osClass ]]; then
>     [[ $osClass == @(win7|winmodern) ]] && is_modern_windows=1
> else
>     [[ $osid == @(5|6|7|9|10|11) ]] && is_modern_windows=1
> fi
> ```

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
