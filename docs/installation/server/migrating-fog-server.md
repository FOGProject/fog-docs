---
title: Migrating FOG Server
description: How to move FOG settings, database, images, and certificate trust from an old server to a new one
aliases:
    - Migrating FOG Server
    - FOG Server Migration
    - Moving FOG To A New Server
context_id: migrating-fog-server
tags:
    - install
    - migrating
    - new-server
    - fogserver
    - git
    - prerequisites
    - install-script
    - configuration
    - database
    - cli-switches
    - ssl
    - pki
    - certificates
    - secure-boot
    - storage-node
    - dhcp
---
# Overview

This article explains how to move a FOG server's settings, database, and
images from an old box to a new one. This is safer and more predictable than
attempting an in-place OS upgrade: you know exactly what's being moved and
how, and your old server stays intact as a fallback the whole time. An OS
upgrade, by contrast, can leave FOG in a broken state with no clear path back
if something goes wrong partway through.

We'll cover:

-   Deciding whether the new server keeps the old one's IP/hostname or gets
    its own (this decision affects almost everything else below).
-   Building the new server.
-   Migrating images and the database from the old server to the new one.
-   Migrating the certificate authority so existing FOG clients and
    PXE-embedded images keep working — including working out whether the old
    server is on the pre-PKI or post-PKI layout, because what you copy
    differs.
-   Migrating the Secure Boot signing material, if you sign FOS kernels for
    UEFI Secure Boot, so already-enrolled clients don't need re-enrolling.
-   Automating all of the above with a sample script, if you'd rather not
    run it step by step.
-   Reconciling IP-dependent settings, if the new server isn't reusing the
    old one's IP/hostname.
-   Adjusting DHCP if you aren't running DHCP on the new server.
-   Cutting over and retiring the old server.

# Decide: same IP/hostname, or a new one?

Before you start, decide how the new server will be identified on the
network, because it's the single biggest fork in how much work the rest of
this migration takes.

-   **Reuse the old server's IP and/or hostname (recommended when possible).**
    Stage the new server on a temporary IP, do the migration, then at cutover
    point DNS (and the old IP, if anything boots by IP rather than name) at
    the new box and retire the old one. If you also carry over the SSL/CA
    directory (see below), existing FOG clients and already-imaged machines
    need **no changes at all** — they keep talking to "the same" server.
-   **Give the new server its own permanent IP/hostname.** Simpler to stage
    since both servers can run side-by-side indefinitely, but because the
    database import brings the *old* server's IP and passwords with it,
    you'll need to walk through
    [[change-fog-server-ip-address|reconciling IP-dependent settings]]
    afterward, and update any DHCP/DNS configuration that pointed at the old
    address.

Either way, the old and new FOG servers do not need to be the same version —
you can go from an older version to a newer one, but not the reverse, so
don't install an older FOG version on the new box than the old one is
running.

# Building the new server

Build the new server using the latest release of whatever Linux distribution
you prefer — it does not need to match the old server's distribution (Ubuntu
to Rocky, Debian to Fedora, etc. are all fine).

Do not create a Linux user called `fog` — FOG creates its own `fog`/`fogproject`
service account, and a pre-existing user of that name will conflict with it.

Set a static IP or a DHCP reservation for the server (this can be a
temporary staging address per the decision above), and create a DNS record
for it once the address is settled.

To install FOG itself, follow [[install-fog-server|Install FOG Server]] —
check [[requirements|System Requirements]] first. Installing FOG here is no
different than any other fresh install; nothing about it changes because
you're migrating.

# Migrating images

FOG's installer already sets up an NFS export you can use to move images
between servers: `/images` (read-only) and `/images/dev` (read-write). The
easiest, most uniform way to migrate is to mount the **old** server's
read-only export on the **new** server and `rsync` from it — this works
whether or not the old server's web interface is currently functional.

On the **new** server:

```bash
mkdir /mnt/oldfog
mount OLD_SERVER_IP:/images /mnt/oldfog
rsync -av /mnt/oldfog/ /images/
```

`rsync` is preferred over a plain `cp -R`: it's resumable, and you can safely
re-run the exact same command close to cutover to pick up anything captured
on the old server in the meantime (only the changed/new files transfer).
Because drivers and postdownload scripts already live under `/images` on the
old server, they come along automatically — there's nothing extra to copy
for them.

Once the copy finishes, unmount the share:

```bash
umount /mnt/oldfog
```

> [!note]
> The larger your image store, the longer the initial `rsync` takes — plan
> for this, especially if you're staging over a WAN link. A same-subnet
> gigabit link is far more pleasant for a first sync of 100+ GB of images.

# Migrating the database

The entire point of migrating is usually preserving your host registrations,
group configurations, image assignments, and snapin links, along with your
images — all of that lives in the database.

**Recommended: let the installer produce the backup.** FOG's installer
automatically backs up the database every time it runs an update, dropping a
timestamped dump in `$backupPath/fogDBbackups/` (`$backupPath` defaults to
`/home/`, and is recorded in [[install-fogsettings|.fogsettings]]). On the
**old** server, re-run the installer (or just answer through an update) to
produce a fresh dump, then copy the resulting `fog_sql_*.sql` file to the
**new** server (over the same NFS mount used for images, or with `scp`), and
import it:

```bash
mysql -u root -p fog < fog_sql_<version>_<timestamp>.sql
```

**Fallback: manual `mysqldump`.** If the old server's web interface itself
isn't functioning (so the installer can't produce its own backup), dump the
database directly instead:

```bash
# on the OLD server
mysqldump -u root -p -B fog > fogdb.sql

# on the NEW server
mysql -u root -p fog < fogdb.sql
```

Adjust the `-u`/`-p`/`-h` flags to match however your MySQL/MariaDB
installation is actually secured (no root password, a different host, etc.).

> [!note]
> Because this import brings the old server's IP address and generated
> passwords with it, the new server's web interface login will be whatever
> the old server's was. If you don't know it, see
> [[install-fogsettings|.fogsettings]] for where FOG stores it, or reset it
> from a shell on the new server.

# Migrating the certificate authority

FOG generates its own certificate authority at install time, and three
different things depend on it: the web server's HTTPS certificate, the iPXE
binaries (which are compiled to trust that CA), and the **fog-client**, which
pins the CA and validates the server against it before acting on any task.
See [[pki-zones|FOG PKI Infrastructure]] for the full model and
[[external-ca-lets-encrypt|External CA & Let's Encrypt certificates]] for the
fog-client pinning specifically.

Because of that pinning, if the new server generates a **new** CA (the
default for any fresh install), every already-deployed fog-client — and any
image with the client baked in — will not trust the new server until it
re-pins (reinstalling the client, or rebuilding affected images).

So the CA has to be in place on the new server **before** you run the
installer there. *Where* it lives depends on which layout the old server is
on, and the two are not interchangeable.

## First: is the old server pre-PKI or post-PKI?

FOG 1.6 split its certificates into per-purpose *zones* under `/opt/fog/pki/`.
Everything before that kept a single CA — key and certificate together —
inside the SSL directory. Ask the **old** server which it is:

```bash
test -d /opt/fog/pki && echo "post-PKI layout" || echo "pre-PKI layout"
```

| | Pre-PKI (FOG 1.5.x, and 1.6 before the zone split) | Post-PKI (current 1.6 and dev-branch) |
|---|---|---|
| Root CA certificate | `/opt/fog/snapins/ssl/CA/.fogCA.pem` | `/opt/fog/snapins/ssl/CA/.fogCA.pem` — unchanged |
| Root CA **private key** | `/opt/fog/snapins/ssl/CA/.fogCA.key` | `/opt/fog/pki/root/ca/.fogCA.key` |
| Client-communication keypair | `/opt/fog/snapins/ssl/.srvprivate.key` + `.srvpublic.crt` | same |
| Web certificate | signed by the root directly | its own zone, `/opt/fog/pki/web/` |
| Secure Boot material | `/opt/fog/secureboot/` where it exists at all | `/opt/fog/pki/secureboot/` |
| **What you copy** | `/opt/fog/snapins/ssl` (plus `/opt/fog/secureboot` if present) | `/opt/fog/snapins/ssl` **and** `/opt/fog/pki` |

The certificate stayed put on purpose — it is the file fog-client pinned, and
relocating a *public* certificate buys nothing. It is the private key that
moved out of the web-readable SSL directory, and that move is the entire
reason a post-PKI server needs a second path copied.

Only the **old** server's layout decides what you copy. The new server ends up
on whatever layout the version you install there uses; pre-PKI → post-PKI is
the normal case, and the installer relocates the key into the zone tree by
itself on its first run. The reverse cannot arise, since you can't install an
older FOG on the new box than the old one runs.

## Copying it across

Run these on the **new** server, before installing FOG on it:

```bash
rsync -az -e ssh root@OLD_SERVER:/opt/fog/snapins/ssl/ /opt/fog/snapins/ssl/

# post-PKI old servers only — skip if /opt/fog/pki doesn't exist there
rsync -az -e ssh root@OLD_SERVER:/opt/fog/pki/ /opt/fog/pki/

# pre-PKI old servers that had Secure Boot configured
rsync -az -e ssh root@OLD_SERVER:/opt/fog/secureboot/ /opt/fog/secureboot/
```

`rsync -a` matters here: it preserves the ownership and modes these files are
installed with, and the CA private keys are deliberately root-only.

>[!warning] Don't route private keys through the images export
>The `/images` NFS share used for the image copy earlier is exported to the
>whole network, and these directories hold the private key that every machine
>in your estate trusts. Copy them over SSH as above, or on removable media —
>not through `/mnt/oldfog`.

Once the material is in place, a normal installer run leaves it alone: FOG
only generates a CA when one isn't already there, or when you explicitly pass
`-C`/`--recreate-CA` (see [[command-line-options]]). Every existing client
keeps trusting the server with no client-side change at all.

>[!warning] Post-PKI: copying only `snapins/ssl` leaves a server that can't issue anything
>A post-PKI installer decides "a CA already exists here" from the presence of
>the root **certificate**, not its key — deliberately, because a root whose key
>is kept offline is a supported configuration. Bring the certificate across
>without `/opt/fog/pki`, and the new server reads that as an offline root: it
>won't mint a replacement (nothing gets silently orphaned, which is the point
>of the check) but it also can't issue the Web CA beneath it, and says so:
>
>```
>Cannot issue 'FOG Web CA': the Root CA private key is not on this
>server (only /opt/fog/snapins/ssl/CA/.fogCA.pem is present).
>... Restore it to:
>  /opt/fog/pki/root/ca/.fogCA.key
>```
>
>Copy `/opt/fog/pki` across and run the installer again.

>[!note] Pre-PKI new servers work the other way round
>Migrating 1.5.x → 1.5.x, the installer tests for the CA **key**, not the
>certificate. There `snapins/ssl` really is the only path to copy — but it has
>to include `CA/.fogCA.key`, or the new server quietly builds a brand new CA
>and every fog-client stops trusting it.

If you'd rather run your own CA going forward — for example to integrate with
your organization's PKI — supply it at install time with
`--web-ca-cert`/`--web-ca-key`/`--web-ca-root` instead of using FOG's
generated one; see [[bringing-your-own-ca|Bringing your own CA]]. That
replaces the **web** certificate only and deliberately leaves fog-client's
pinned CA alone, which is what makes it safe to do on a live fleet. On
working-1.6, `--external-ca` with `--ca-cert`/`--ca-key`/`--ca-root` is an
older spelling of the same three options. If the goal is to stop importing one
CA per server across several FOG servers,
[[unify-certificates-across-fog-servers|Unifying certificates across several FOG servers]]
covers that case specifically.

# Migrating the Secure Boot signing material

Skip this entirely if you are not signing FOS kernels for UEFI Secure Boot —
check whether the old server's **FOG Configuration → Secure Boot** page shows
a certificate fingerprint, or whether `/opt/fog/pki/secureboot/` (post-PKI) or
`/opt/fog/secureboot/` (pre-PKI) exists there.

If it is configured, the copies in the previous section **already cover it**:
post-PKI it is a zone inside `/opt/fog/pki`, pre-PKI it is the flat
`/opt/fog/secureboot` in the third `rsync`. What follows is what is at stake,
and how to confirm it carried over.

>[!danger] Skipping this silently re-enrolls your whole fleet
>The installer only generates Secure Boot keys when none are present. If you
>do not carry the old ones forward, a fresh install on the new server
>generates new ones automatically, signs the FOS kernels with them, and
>nothing tells you this happened until a Secure Boot client fails to boot.
>Every already-enrolled client then needs a physical visit to enroll the new
>certificate — exactly the repeated work this section exists to avoid. See
>[[secure-boot-signing#rotating-or-removing-a-key|Rotating or removing a key]]
>for what that involves if it does happen.

**Post-PKI: what `/opt/fog/pki/secureboot/` holds.**

| Path | What it is | Why it has to come across |
|---|---|---|
| `ca/.fogSBCA.{key,pem,der}` | The Secure Boot CA — published as `MOK.der` and enrolled in firmware | A different one means a physical re-enrollment on every machine |
| `leaf/sign.{key,pem}` | The code-signing leaf the FOS kernels are actually signed with | Rotatable freely, but only while the CA above is the enrolled one |
| `PK.{key,pem}`, `KEK.{key,pem}` | This server's UEFI platform keys, used by [Setup Mode enrollment](../../kb/how-tos/secure-boot-setup-mode-enrollment.md) | They never regenerate; a machine enrolled with the old `PK` can never be updated by a server holding a different one |
| `mscerts/` | Microsoft's CA certificates, staged for the `.auth` builder | Rebuilt from the packaged copies, so nothing is lost if it is missing |

A normal installer run on the new server then finds all of that already there,
signs the FOS kernels with the same leaf, and republishes the same certificate
— and the same fingerprint — in the enrollment kit. Nothing needs
re-enrolling.

>[!warning] Pre-PKI → post-PKI needs one round of re-enrollment anyway
>An old server on the flat `MOK.key`/`MOK.pem` pair predates the CA/leaf
>split. Copying it forward is still worth doing — the new server's installer
>moves it into the zone tree and leaves the old files readable — but the
>certificate that ends up enrolled changes from that self-signed MOK to the
>new Secure Boot CA, so every machine that enrolled the old one must enroll
>once more. There is no way around that when the enrolled certificate itself
>changes; it buys you a hierarchy where no future signing-key change needs a
>firmware trip. See [[secure-boot-signing#the-old-flat-mok|The old flat MOK]].
>This only ever affected very early 1.6 testers — a 1.5.x server has no Secure
>Boot signing material at all, and nothing to re-enroll.

**Using a key of your own** (installed originally with
`--secure-boot-key`/`--secure-boot-cert`): make those same files available to
the new server — copied to the same path, or anywhere else — and pass the same
flags when installing it. Post-PKI those two flags name the code-signing
**leaf**, and `--secureboot-ca-cert` names the intermediate that is actually
enrolled in firmware:

```bash
cd /path/to/fogproject/bin
./installfog.sh \
  --secureboot-ca-cert /path/to/your/sbca.pem \
  --secure-boot-key    /path/to/your/sign.key \
  --secure-boot-cert   /path/to/your/sign.pem
```

See
[[secure-boot-signing#switching-to-a-key-you-supply|Switching to a key you supply]]
for what that run does, and [[bringing-your-own-ca|Bringing your own CA]] for
building the CA/leaf pair by hand.

After either path, confirm the fingerprint on the new server's **Secure Boot**
page matches what the old server showed, before decommissioning it — that
comparison is the whole check that the material really carried over.

# Migrating other snapin files

The SSL directory above lives under `/opt/fog/snapins`, alongside any snapin
files you've actually uploaded (installers, scripts, etc. — see
[[snapins|Snapin Management]]). Copy the rest of that directory over the same
way if you want existing snapin assignments to keep working without
re-uploading them:

```bash
# on the OLD server
cp -R /opt/fog/snapins/* /mnt/oldfog/snapins-backup/   # excluding ssl/, already handled above
```

# Automating it with a script

Everything above — images, the certificate material, snapins, the database,
and installing FOG itself — can be scripted into a single pass once the new
server is up and reachable. The script below **pulls** everything from the old
server over SSH rather than pushing from it, so the old (still-production)
server needs no setup beyond allowing the SSH connection — nothing is
installed or changed on it. Pulling over SSH is also what keeps the private
keys off the `/images` NFS export.

### Set up SSH access first

On the **new** server, generate a key (skip this if you already have one)
and copy it to the old server so the script can reach it without a password
prompt for every single command:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
ssh-copy-id root@OLD_FOG_HOST

# confirm it works before running the script:
ssh root@OLD_FOG_HOST true && echo OK
```

> [!note]
> If root SSH login is disabled on the old server (`PermitRootLogin no`),
> either enable it temporarily for the migration (and turn it back off
> afterward), or use a sudo-capable account instead and adjust the `ssh`
> calls in the script below to `sudo` their remote commands.

### The script

Run this **on the new server**, as root, once it has a static IP/hostname
and can reach the old server's SSH, HTTP, and MySQL ports. It takes the old
server's hostname as a required argument and the new server's hostname as an
optional one (used only to label the confirmation prompt below — the script
always acts on the machine it's run on):

```bash
#!/usr/bin/env bash
# migrate-fog.sh — pulls images, certificate trust, snapins, and the database
# from an existing FOG server onto this one, then installs FOG here.
#
# Usage: ./migrate-fog.sh <old-fog-host> [new-fog-host]
set -euo pipefail

OLD_HOST="${1:?Usage: $0 <old-fog-host> [new-fog-host]}"
NEW_HOST="${2:-$(hostname -f 2>/dev/null || hostname)}"

FOG_REPO_DIR="/root/fogproject"
FOG_BRANCH="stable"   # match or exceed the old server's branch/version — never go older
IMAGES_DIR="/images"
SNAPINS_DIR="/opt/fog/snapins"
PKI_DIR="/opt/fog/pki"                 # post-PKI: root CA key + the web/Secure Boot zones
SECUREBOOT_DIR="/opt/fog/secureboot"   # pre-PKI flat Secure Boot layout, if the old server has one
DB_DUMP="/root/fog_migrate_$(date +%Y%m%d_%H%M%S).sql"

ssh_old() { ssh -o BatchMode=yes "root@${OLD_HOST}" "$@"; }

echo "This will pull images, SSL/snapins, and the database from:"
echo "  OLD server: ${OLD_HOST}"
echo "and install/overwrite FOG on this machine:"
echo "  NEW server: ${NEW_HOST}"
echo
read -r -p "Continue? [y/N] " confirm
[[ "${confirm}" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

echo "==> Checking SSH access to ${OLD_HOST}"
ssh_old true

echo "==> Syncing images from ${OLD_HOST}:${IMAGES_DIR} (this can take a while)"
rsync -az --info=progress2 -e ssh "root@${OLD_HOST}:${IMAGES_DIR}/" "${IMAGES_DIR}/"

echo "==> Copying the CA certificate, client-communication keypair and snapins"
echo "    from ${OLD_HOST}:${SNAPINS_DIR}"
mkdir -p "${SNAPINS_DIR}"
rsync -az -e ssh "root@${OLD_HOST}:${SNAPINS_DIR}/" "${SNAPINS_DIR}/"

# Post-PKI servers keep the root CA's PRIVATE KEY, the web zone and the Secure
# Boot zone here instead — the snapins copy above carries only the certificate.
# Missing this leaves a server that reads its own root as offline and cannot
# issue the Web CA beneath it.
if ssh_old "[[ -d '${PKI_DIR}' ]]"; then
    echo "==> post-PKI layout on ${OLD_HOST}, copying ${PKI_DIR} forward"
    mkdir -p "${PKI_DIR}"
    rsync -az -e ssh "root@${OLD_HOST}:${PKI_DIR}/" "${PKI_DIR}/"
else
    echo "==> pre-PKI layout on ${OLD_HOST} (no ${PKI_DIR}); the CA key travels"
    echo "    inside ${SNAPINS_DIR}/ssl/CA and this installer will relocate it"
fi

# Pre-PKI flat Secure Boot layout. The installer moves it into the zone tree,
# which changes the enrolled certificate — every machine that enrolled the old
# flat MOK has to enroll once more. Copy it regardless: without it the new
# server generates fresh keys and nothing signed before can be re-signed.
if ssh_old "[[ -d '${SECUREBOOT_DIR}' ]]"; then
    echo "==> Flat Secure Boot material found on ${OLD_HOST}, copying it forward"
    mkdir -p "${SECUREBOOT_DIR}"
    rsync -az -e ssh "root@${OLD_HOST}:${SECUREBOOT_DIR}/" "${SECUREBOOT_DIR}/"
    chown -R root:root "${SECUREBOOT_DIR}"
    chmod 0700 "${SECUREBOOT_DIR}"
fi

echo "==> Fetching FOG source (${FOG_BRANCH})"
if [[ -d "${FOG_REPO_DIR}" ]]; then
    git -C "${FOG_REPO_DIR}" fetch --all
    git -C "${FOG_REPO_DIR}" checkout "${FOG_BRANCH}"
    git -C "${FOG_REPO_DIR}" pull
else
    git clone --branch "${FOG_BRANCH}" https://github.com/FOGProject/fogproject.git "${FOG_REPO_DIR}"
fi

echo "==> Installing FOG (the material copied above means the existing CA and"
echo "    Secure Boot keys, if any, are kept rather than regenerated)"
( cd "${FOG_REPO_DIR}/bin" && ./installfog.sh -Y )

echo "==> Dumping the fog database on ${OLD_HOST} (enter ITS MySQL root password if prompted)"
ssh -t "root@${OLD_HOST}" "mysqldump -u root -p -B fog" > "${DB_DUMP}"

echo "==> Importing it here (enter THIS server's MySQL root password if prompted)"
mysql -u root -p fog < "${DB_DUMP}"

cat <<EOF

==> Done.

Remaining manual steps:
  - If this server didn't inherit the old one's IP/hostname, work through
    "Reconciling IP-dependent settings" below.
  - Update DHCP/DNS to point at this server — see "If FOG isn't doing DHCP".
  - If Secure Boot material was copied above, confirm the fingerprint on this
    server's FOG Configuration -> Secure Boot page matches what the old
    server showed. A pre-PKI flat MOK is the exception: it is expected to
    change, and every enrolled machine needs enrolling once more.
  - Test a PXE boot and a live capture/deploy before retiring ${OLD_HOST}.
EOF
```

> [!warning]
> Treat this as a starting point, not a turnkey tool. Review it against your
> own environment before running it: `-Y` auto-accepts the installer's
> *guessed* defaults (network interface, DHCP, HTTPS, hostname), which is
> usually fine but worth confirming against the prompts documented in
> [[install-fog-server#Installer Prompts|Install FOG Server]]; the `mysqldump`/`mysql`
> steps assume interactive, password-based MySQL auth and will need
> adjusting if your servers use passwordless/socket auth or an external
> database; and `-B fog` faithfully drops and recreates every table FOG
> installed by default on the new server, replacing it with the old
> server's data — expected here, but worth knowing before you run it a
> second time by accident.

# Reconciling IP-dependent settings

Skip this section entirely if the new server ended up with the **same** IP
and hostname as the old one — there's nothing to reconcile.

If the new server has a different IP, the database import above brought the
**old** server's IP address and passwords with it, which will now conflict
with the new server. Follow [[change-fog-server-ip-address|Change FOG Server IP Address]]
to update the storage node's IP, `FOG_WEB_HOST`, `FOG_TFTP_HOST`, and the
iPXE default file to point at the new server.

You'll also want to confirm the FTP/TFTP credentials line up across the
places FOG expects them to match — see
[[troubleshoot-ftp#Credentials / Passwords|Troubleshooting FTP: Credentials / Passwords]].

# If FOG isn't doing DHCP

If you have an existing dedicated DHCP server (rather than letting FOG serve
DHCP itself), point it at the new server:

-   Update DHCP option 66 to the new server's IP or DNS name — see
    [[dhcp-server-settings|DHCP Server Settings]] for the current
    configuration examples (Kea, ISC, Windows Server).
-   If you don't control the DHCP server, or it can't set options 66/67,
    use [[proxy-dhcp|Proxy DHCP with dnsmasq]] instead.
-   If you support both legacy BIOS and UEFI clients, see
    [[bios-and-uefi-co-existence|BIOS and UEFI Co-Existence]].

If the new server reused the old one's IP and DNS name, there is usually
nothing to change here at all.

# Cut over and clean up

Once images, the database, and certificate trust are migrated:

1.  Do a final `rsync` pass for any images captured on the old server since
    your first sync.
2.  If you staged the new server on a temporary IP, flip DNS (and the IP
    itself, if anything boots by address) to the new server now.
3.  Test a PXE boot and a live image capture/deploy against the new server
    before retiring the old one.
4.  Keep the old server powered off (rather than immediately destroyed) for
    a while as a rollback option, then decommission it on your own schedule
    once you're confident the new server is stable.

# Related articles

-   [[install-fog-server|Install FOG Server]]
-   [[requirements|System Requirements]]
-   [[command-line-options|Fog installer command line options]]
-   [[change-fog-server-ip-address|Change FOG Server IP Address]]
-   [[install-fogsettings|The .fogsettings file]]
-   [[storage-node|Storage Node Management]]
-   [[snapins|Snapin Management]]
-   [[pki-zones|FOG PKI Infrastructure]]
-   [[bringing-your-own-ca|Bringing your own CA]]
-   [[unify-certificates-across-fog-servers|Unifying certificates across several FOG servers]]
-   [[external-ca-lets-encrypt|External CA & Let's Encrypt certificates]]
-   [[secure-boot-signing|Secure Boot: signing FOS with your own key]]
-   [[secure-boot-setup-mode-enrollment|Secure Boot: Setup Mode enrollment]]
-   [[fog-security|FOG Security]]
-   [[troubleshoot-ftp|Troubleshooting FTP]]
-   [[dhcp-server-settings|DHCP Server Settings]]
-   [[proxy-dhcp|Proxy DHCP with dnsmasq]]
-   [[bios-and-uefi-co-existence|BIOS and UEFI Co-Existence]]
