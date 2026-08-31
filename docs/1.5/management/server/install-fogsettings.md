---
title: The .fogsettings file (1.5)
aliases:
    - The .fogsettings file (1.5)
description: What .fogsettings holds on FOG 1.5, how each flat key gets its value, what every setting means, and which of them are safe to edit by hand
context_id: install-fogsettings-1.5
tags:
    - install
    - settings
    - security
    - automation
    - network-settings
    - management
    - linux
    - server
    - server-management
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[management/server/install-fogsettings|1.6 version]] of this page for FOG 1.6.

# The .fogsettings file

`.fogsettings` is what makes an *upgrade* different from a *reinstall*. Every
answer you gave the installer, every option you passed, and everything it worked
out for itself is written there at the end of a run and read back at the start of
the next one — so re-running the installer on an existing server goes straight to
work instead of asking eighty questions again.

- **Path:** `/opt/fog/.fogsettings` (or `$fogprogramdir/.fogsettings` if you
  installed elsewhere)
- **Format:** shell. The installer *sources* it, so it is `key='value'`, one per
  line. A stray quote breaks the next install rather than being ignored.
- **Permissions:** `0600 root:root` — it holds two cleartext passwords, `password`
  and `snmysqlpass`. See [[1.5/management/server/install-fogsettings#Security|Security]].

>[!warning] Do not paste this file into a forum post or a bug report
>It contains your `fogproject` account password (`password`, also the FTP account
>used for image replication, so it is fleet-wide) and your database password
>(`snmysqlpass`). Redact both before sharing.

## Flat key names

Every setting the installer manages is a bare, lower/mixed-case shell variable —
`ipaddress`, `snmysqlpass`, `secureBootKey`, and so on. There is no category
prefix and no fixed naming convention; names accumulated one feature at a time
over the file's history, which is why some read as one long word
(`storageLocationCapture`) and others are all lowercase
(`snmysqlpass`). FOG 1.6 renamed all of these into nine `CATEGORY_snake_case`
namespaces — see [[management/server/install-fogsettings#The 1.6 rename|the 1.6 version of this page]]
if you are planning an upgrade.

**One flag covers both the web UI and netboot.** `httpproto` is the only
protocol setting in this file: it decides whether the web UI is served over
HTTPS *and* whether iPXE fetches `boot.php` over HTTPS, together. `-S` /
`--force-https` sets it to `https` for the whole install; there is no separate
knob for "web UI over HTTPS, netboot over HTTP" the way 1.6 has (its `WEB_` and
`BOOT_` namespaces split this apart deliberately). iPXE is also always compiled
with FOG's CA embedded — there is no separate opt-in for that on 1.5.

## Where each value comes from

Each setting is filled in from the first source below that supplies a value,
highest precedence first:

1. **An installer option on this run.**
2. **An exported environment variable**, for scripted installs.
3. **`.fogsettings` from the previous install.**
4. **An interactive prompt.** `-y` skips the prompts and takes each default.
5. **The distribution defaults** — package lists, web server, paths.

An option on the command line always beats the stored value: the installer
applies your flags *after* reading `.fogsettings`, so you never have to clear a
setting before overriding it.

## How the file is rewritten

The installer rewrites `.fogsettings` at the end of every successful run.

If the file already exists and carries a recognizable header (`## Start of FOG
Settings` or a `## Version:` line), it is **merged in place**:

- Settings the installer manages are updated **where they already are**.
- Keys written by an older installer that the current one no longer manages —
  `storageftpuser`, `storageftppass`, `bootfilename`, `notpxedefaultfile`,
  `php_verAdds` — are **deleted**.
- **Everything else is left exactly as it is** — your comments, your blank
  lines, and any variable you added yourself. Nothing you put in this file is
  lost.
- Managed settings that were not already present are **appended at the end**.

If there is no file at all, or it has no recognizable header, it is written
fresh, one managed key per line, in the order the installer's own list uses.

Two steps then finish the run:

1. `.fogsettings` is set to `0600`, owned by the FOG system account.
2. Nothing else is written. FOG 1.5 has no companion public file — see
   [[1.5/management/server/install-fogsettings#Security|Security]] below.

## Settings reference

Meanings below come from reading `dev-branch`'s installer source
(`lib/common/functions.sh`, `bin/installfog.sh`, `lib/common/config.sh`) rather
than being asserted from memory, since the wiki-era documentation for this file
predates most of these.

### Network identity and DHCP

| Setting | Meaning |
|---|---|
| `ipaddress` | This server's primary address |
| `ipaddresses` | Every other address this server answers on. Used for certificate SANs and the nginx-style maintenance allow list |
| `interface` | The NIC FOG binds services to and takes its address from |
| `submask` | Netmask, used when FOG runs DHCP |
| `hostname` | The name put in the web certificate and the vhost |
| `dodhcp`, `bldhcp` | Whether FOG runs DHCP — one answer, written twice in two older encodings |
| `dhcpd` | The DHCP service name on your distribution |
| `dhcpengine` | `isc` or `kea`. Leave blank to let FOG detect; it prefers Kea only where ISC is unavailable |
| `routeraddress` | The router handed to DHCP clients, pre-formatted for the config file (including the "no router" comment when empty) |
| `plainrouter` | The same value, unformatted — used for display |
| `dnsaddress` | The DNS server handed to DHCP clients |
| `startrange`, `endrange` | The DHCP pool |
| `blexports` | Whether to rebuild `/etc/exports` for NFS |

### Database

| Setting | Meaning |
|---|---|
| `mysqldbname` | The database name, normally `fog` |
| `snmysqlhost` | Where the database is. On a storage node, this is the main server |
| `snmysqluser` | `fogmaster` on a server, `fogstorage` on a node |
| `snmysqlpass` | That user's password, generated on first install. **Cleartext** |
| `snmysqlexternal` | Set when the database is on a host FOG does not administer. The installer then only verifies the connection |
| `backupPath` | Where the database is dumped before a schema change |

### Web server and install shape

| Setting | Meaning |
|---|---|
| `installtype` | `N` for a full server, `S` for a storage node |
| `osid` | Detected distribution family: `1` Redhat, `2` Debian, `3` Arch. FOG 1.5 has no Alpine target, so there is no `4` — 1.6 added Alpine as `3` and moved Arch to `4`, which is why the number is not portable across versions |
| `osname` | The detected distribution family, as text |
| `installlang` | Whether the extra language packs were installed |
| `fogupdateloaded` | `1` once a first install has completed; lets later runs skip the full question set. Deliberately unquoted and numeric |
| `packages` | What was installed on this box. Re-derived every run from the distribution package lists |
| `copybackold` | Copy the old web directory aside before replacing it (`-o`) |
| `docroot` | The web server's document root |
| `webroot` | The URL path FOG is served under — `/fog/`, or `/` to serve at the site root |
| `php_ver` | The PHP version found |
| `httpproto` | `http` or `https` — covers both the web UI and netboot; see [[1.5/management/server/install-fogsettings#Flat key names\|Flat key names]] above |
| `sendreports` | `Y`/`N` — send OS name, OS version and FOG version to the project. Anonymous version telemetry, nothing else |

### Boot / TFTP

| Setting | Meaning |
|---|---|
| `noTftpBuild` | Your TFTP server is elsewhere, so leave the TFTP configuration alone. Also keeps `69/udp` closed in the firewall |
| `tftpAdvOpts` | Extra options for `in.tftpd` |

### Storage

| Setting | Meaning |
|---|---|
| `storageLocation` | Where images are kept, normally `/images` |

### FOG's system account

| Setting | Meaning |
|---|---|
| `username` | FOG's system account, normally `fogproject`. Also the FTP account used for replication |
| `password` | That account's password, generated on first install. **Cleartext, and fleet-wide** |
| `fwconfigure` | `configure`, `disable` or `skip` for the local firewall. Remembered so an upgrade cannot quietly reverse your choice |

### Certificates and trust

| Setting | Meaning |
|---|---|
| `rootCAPem`, `rootCAKey` | FOG's root certificate authority — the trust anchor |
| `sslcakey`, `sslcapem` | The intermediate CA that signs the web (vhost) certificate |
| `sslcachain` | The web zone's trust path — intermediate plus the root that issued it |
| `sslprivkey`, `sslpubcert` | The certificate and key the web server actually serves |
| `sslpath` | Where uploaded snapin SSL material and the client communication certificate live |
| `sslcsr` | A certificate signing request path, used only transiently during CA creation |
| `caCreated` | Whether FOG's own CA was created this run |
| `internalDomains` | Domains the web CA may issue for, and names added to the certificate. Set with `--internal-domain` |
| `internalSubnets` | Restricts the web CA to these subnets. Set with `--internal-subnet` |
| `extraServerNames` | Extra names this server answers to, set with `--extra-server-name` |
| `externalca`, `extcacert`, `extcakey`, `extcaroot` | Set when you supply your own web CA instead of letting FOG mint one, via `--web-ca-cert`/`--web-ca-key`/`--web-ca-root` |

### Secure Boot

| Setting | Meaning |
|---|---|
| `secureboot` | `1`/`0`. On by default. `--no-secure-boot` turns it off, and the choice is remembered so an upgrade cannot silently re-enable it |
| `secureBootMokCert` | The Secure Boot **certificate authority** — what gets enrolled in firmware |
| `secureBootKey`, `secureBootCert` | The **signing** keypair beneath that authority — what actually signs the FOS kernels. Rotating these needs no firmware trip |
| `sbNameConstraints` | On by default. Adds name constraints to the Secure Boot authority. `--no-sb-name-constraints` turns it off. **This is the opposite of FOG 1.6**, which removed both the setting and the constraints entirely — see [[management/server/install-fogsettings#No name constraints in this zone\|the 1.6 version of this page]] |
| `catrust` | `1`/`0`. On by default: anchor FOG's own CA in this server's own trust store, so HTTPS calls the server makes to itself verify. `--no-ca-trust` turns it off |

### Settings only you can set

Nothing writes these; the installer only reads them, guarded on being empty.
They survive because the merge preserves lines it does not manage.

| Setting | What it does |
|---|---|
| `snapinLocation` | Where snapins live, if not under the default. `FOGBackup.sh` reads it and will tell you to add it by hand when it needs it |
| `storageLocationCapture` | Where captured images land, if you want them off `storageLocation` |
| `inetConnectTimeout`, `inetMaxTime` | Bounds on the installer's downloads — 5s to connect, 15s total by default |
| `ftppasvmin`, `ftppasvmax` | The FTP passive port range |
| `mcastportmin`, `mcastportmax` | The multicast port range |

## Security

`.fogsettings` is `0600 root:root`, because it holds two cleartext passwords:
`password` (the FOG system account, which is also the replication FTP account)
and `snmysqlpass` (the database).

**FOG 1.5 has no `.fogsettings.pub` companion file.** That split — a
`0644`-readable file carrying only a handful of non-secret facts, for
unprivileged callers like `/api/whoami` — was added in FOG 1.6. On 1.5, a
script that needs to know facts about the server (its own IP, its own hostname)
without running as root has no unprivileged read path onto `.fogsettings`; it
either runs as root or gets those values another way (e.g. querying the FOG
API itself, or the database).

>[!warning] Never copy `.fogsettings` between servers
>The credentials in it belong to the machine that generated them. To move a
>server, follow [[installation/server/migrating-fog-server|Migrating FOG Server]].

## Editing it by hand

Before you edit:

1. **You need root**, and you should leave the permissions at `0600`.
2. **Keep the `key='value'` form.** An unbalanced quote breaks the next
   install.
3. **Some values are recomputed on the next run** — `ipaddress`, `packages`,
   and the certificate paths under `sslpath`/`sslca*`/`rootCA*` in particular.
   Editing them here changes nothing until you use the matching installer
   option instead.
4. **Take a copy first.** The installer rewrites the file with no backup.

## Related

- [[installation/server/install-fog-server|Install FOG Server]] — the install itself
- [[management/server/install-fogsettings|The .fogsettings file]] — the FOG 1.6 version of this page, including the full old-name → new-name rename table
- [[installation/server/migrating-fog-server|Migrating FOG Server]]
