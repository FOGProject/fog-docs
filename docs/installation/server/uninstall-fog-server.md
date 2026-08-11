---
title: Uninstalling the Fog server
aliases:
    - Uninstalling the Fog server
    - Uninstall Fog
description: How to remove FOG from a server, and what it does and does not delete
context_id: uninstall-fog-server
tags:
    - installation
    - fog-server
---

# Uninstalling the Fog server

The FOG installer can remove itself:

    cd fogproject/bin
    ./installfog.sh --uninstall

The guiding rule is **remove what FOG installed, keep what FOG stored**.
Everything FOG put on the server — its own files, its services, its
configuration — is removed. Your data is not, unless you explicitly ask for
it.

That means an uninstall is normally recoverable: reinstall over what is left
and FOG picks your hosts, images and snapins back up. It also makes this a
reasonable way to rebuild a server that has got into a bad state without
losing anything.

!!! warning "Uninstall is not reversible in every case"
    The `--purge-*` options below *are* destructive and there is no undo.
    Read [What the purge options remove](#what-the-purge-options-remove)
    before using them, particularly `--purge-ssl`.

## See what it would do first

`--dry-run` prints the complete plan and exits without changing anything:

    ./installfog.sh --uninstall --dry-run

Run this first. The output lists every path that would be removed, every
configuration file that would be restored, and the fate of each piece of your
data.

## What is always removed

| | |
|---|---|
| Services | The eight FOG daemons — stopped, disabled, and their unit files deleted |
| Program files | `/opt/fog/service`, `/opt/fog/log`, `/opt/fog/cache`, `/opt/fog/reporting`, `/opt/fog/php.loc`, `/opt/fog/.fogsettings` |
| Web files | The FOG web directory under your document root, and the `fog` symlink beside it |
| System entries | `/etc/fog`, the `/var/log/fog` symlink, `/etc/cron.d/fog_reporting`, `/etc/nfs.conf.d/fog-nfs.conf` |
| Web server | FOG's own virtual host (`fog.conf` or `001-fog.conf`) |
| TFTP | The contents of the TFTP root — PXE binaries and boot menus |

If your FOG lives somewhere other than `/opt/fog`, the uninstaller finds it
the same way the installer does, via `/etc/fog/fog.conf`. You can also point
it explicitly with `--fogprogramdir`.

## What is always kept

**Packages are never removed.** The web server, database server, NFS server
and PHP are routinely shared with other things on the same machine, and the
installer does not record which of them it installed versus found already
present. Removing them is left to you.

Your data is kept by default:

- the FOG database
- your images
- your snapins
- the SSL CA
- the `fogproject` Linux account

## Configuration files FOG replaced

FOG does not add lines to `/etc/exports`, `vsftpd.conf`, `dhcpd.conf` or (on
some distributions) the web server config. It moves the existing file aside as
`<file>.<timestamp>` and writes its own version.

On uninstall these are restored from the **oldest** such backup, which is the
genuine pre-FOG original — newer ones are just FOG's own earlier versions. The
version FOG was using is kept as `<file>.fog-uninstall.<timestamp>` rather than
deleted, so nothing is lost.

!!! note "Check these afterwards"
    If you edited any of those files yourself after installing FOG, those edits
    are in the `.fog-uninstall.` copy, not in the restored file. Review them
    before restarting the affected service.

## What the purge options remove

These are opt-in, and permanent.

| Option | Removes |
|---|---|
| `--purge-db` | Drops the FOG database — hosts, images, snapins, users, task history |
| `--purge-images` | Deletes your image storage, normally `/images` |
| `--purge-snapins` | Deletes your snapins |
| `--purge-ssl` | Deletes the SSL CA — **see below** |
| `--purge-user` | Deletes the `fogproject` Linux account and its home directory |
| `--purge-all` | All of the above |

!!! danger "`--purge-ssl` permanently breaks every fog-client"
    The CA private key signs the certificate every fog-client validates, and
    the iPXE binaries are built trusting it. Delete it and every client you
    have deployed stops talking to the server, and every PXE binary must be
    rebuilt. There is no recovery — each client has to be reinstalled by hand.

    Do not use this unless you are decommissioning the server for good.

The CA lives under the snapins directory (`/opt/fog/snapins/ssl` by default),
which is why the uninstaller removes FOG's directories individually rather than
deleting `/opt/fog` wholesale.

The database is dumped to your backup path before anything happens, whatever
options you pass, since it is the only part that cannot be rebuilt from the FOG
sources.

## Confirmation

The uninstaller shows you the full plan and asks you to type the server's
hostname to continue. Anything else aborts without changing a thing.

`-Y`/`--autoaccept` does **not** satisfy this prompt. That flag is already
present in a lot of people's install scripts, and it must never be enough to
wipe a server by accident. For automation that genuinely means it, use
`--force`:

    ./installfog.sh --uninstall --force

## Examples

Remove FOG, keep everything you care about:

    ./installfog.sh --uninstall

Preview a full decommission without touching anything:

    ./installfog.sh --uninstall --purge-all --dry-run

Rebuild a broken server — uninstall, then reinstall over the surviving data:

    ./installfog.sh --uninstall
    ./installfog.sh

Decommission the machine completely, unattended:

    ./installfog.sh --uninstall --purge-all --force

## Troubleshooting

**"No FOG installation found"**

The uninstaller reads `.fogsettings` to learn what your install created — which
document root, which storage location, which database. Without it there is
nothing it can safely remove, so it stops rather than guessing at paths that
might belong to something else.

If FOG is installed somewhere other than `/opt/fog`, tell it where:

    ./installfog.sh --uninstall --fogprogramdir /srv/fog

**Services still listed after uninstalling**

The unit files are removed and systemd is reloaded, but a shell that was open
beforehand may still show cached completions. Open a new one.

**The web server still serves something at /fog**

FOG's virtual host is removed but the web server is not restarted, in case the
machine serves other sites. Reload it yourself when you are ready.
