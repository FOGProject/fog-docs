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
> These run **after a deploy (download)**. If you need to run something *before*
> imaging (for example, custom partitioning), use a post-init script instead —
> see [Post-init scripts](#post-init-scripts-before-imaging) below.

## How it works

The installer creates a scripts directory and a master script on your FOG server:

```
/images/postdownloadscripts/fog.postdownload
```

`fog.postdownload` is the entry point that FOS runs. It is **sourced** (with the
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
| `$disk` | the disk that was imaged (for example `/dev/sda` or `/dev/nvme0n1`) |
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
        mount /dev/${disk#/dev/}2 /mnt 2>/dev/null
        # ... your changes here ...
        umount /mnt 2>/dev/null
        ;;
esac
```

## Post-init scripts (before imaging)

There is a matching hook that runs **before** imaging begins (right after FOS
loads), useful for custom partitioning or disk prep. It mirrors the
post-download layout:

```
/images/dev/postinitscripts/fog.postinit
```

Call your scripts from `fog.postinit` with:

```bash
. ${postinitpath}<SCRIPTNAME>
```

## More examples and discussion

-   [The magical, mystical FOG post download script (FOG forums)](https://forums.fogproject.org/topic/7740/the-magical-mystical-fog-post-download-script)
-   [FOG post install script for Windows driver injection (FOG forums)](https://forums.fogproject.org/topic/8889/fog-post-install-script-for-win-driver-injection)
