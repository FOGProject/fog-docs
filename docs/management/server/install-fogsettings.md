---
title: The .fogsettings file
description: What .fogsettings holds, how each value gets there, what every setting means, and which of them are safe to edit by hand
context_id: install-fogsettings
aliases:
    - .fogsettings
    - The .fogsettings file
    - Fog Server install settings
tags:
    - install
    - settings
    - security
    - automation
    - updates
    - network-settings
    - management
    - linux
    - server
    - server-management
---

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
- **Permissions:** `0600 root:root` — it holds two cleartext passwords. See
  [[install-fogsettings#Security|Security]].

>[!warning] Do not paste this file into a forum post or a bug report
>It contains your `fogproject` account password (which is also the FTP account
>used for image replication, so it is fleet-wide) and your database password.
>Redact `password` and `snmysqlpass` first.

## Example

```bash
## Start of FOG Settings
## Created by the FOG Installer
## Find more information about this file in the FOG Project wiki:
##     https://wiki.fogproject.org/wiki/index.php?title=.fogsettings
## Version: 1.6.0
## Install time: Mon 17 Aug 2026 05:13:02 PM CDT
ipaddress='10.0.0.39'
copybackold='0'
interface='ens3'
submask='255.255.255.0'
hostname='fog.example.lan'
routeraddress='10.0.0.1'
plainrouter='10.0.0.1'
dnsaddress='208.67.222.222'
username='fogproject'
password='<redacted>'
osid='1'
osname='Redhat'
dodhcp='N'
bldhcp='0'
dhcpd='dhcpd'
blexports='1'
installtype='N'
snmysqluser='fogmaster'
snmysqlpass='<redacted>'
snmysqlhost='localhost'
mysqldbname='fog'
installlang='0'
storageLocation='/images'
fogupdateloaded=1
docroot='/var/www/html/'
webroot='/fog/'
caCreated='yes'
httpProto='https'
httpsRedirect='no'
publicWebCert='no'
rebuildIpxeWithMyCA='no'
sslPath='/opt/fog/snapins/ssl'
backupPath='/home/'
php_ver='8.3'
sslPrivKey='/opt/fog/pki/web/leaf/.webLeaf.key'
sslCAPem='/opt/fog/pki/web/ca/.fogWebCA.pem'
rootCAPem='/opt/fog/snapins/ssl/CA/.fogCA.pem'
secureBoot='1'
secureBootKey='/opt/fog/pki/secureboot/leaf/sign.key'
fwconfigure='configure'
netbootProto='http'
webserver='nginx'
sendreports='Y'
## End of FOG Settings
```

>[!note] Your file will have keys after the `## End of FOG Settings` line
>That marker is cosmetic. When an upgrade introduces a new setting the installer
>appends it to the end of the file, so on any server that has been upgraded a few
>times there are live settings below the marker. See
>[[install-fogsettings#How the file is rewritten|How the file is rewritten]].

## Where each value comes from

Each setting is filled in from the first source below that supplies a value.
**Highest precedence first:**

1. **An installer option on this run** — see [[command-line-options|Fog installer command line options]].
2. **`--install-mode`**, which is a *preset*: it writes `httpProto`,
   `netbootProto`, `publicWebCert` and `rebuildIpxeWithMyCA` in one go. It is
   applied **before** the discrete options above, so
   `--install-mode public-cert --no-rebuild-ipxe-with-my-ca` means what it reads
   like — each discrete option overrides its own field and nothing else.
3. **An exported environment variable**, for scripted installs.
4. **`.fogsettings` from the previous install** — unless you pass `-U`.
5. **An interactive prompt.** `-y` skips the prompts and takes each default.
6. **The distribution defaults** — package lists, web server, paths.

Two consequences worth knowing:

- **An option always beats the stored value.** The installer applies your
  command line *after* reading `.fogsettings`, so you never have to clear a
  setting before overriding it.
- **Repeatable options replace rather than add.** `--extra-server-name`,
  `--internal-domain` and `--internal-subnet` each replace the stored list, so
  re-running with a shorter list genuinely shortens it.

### Settings only you can set

A few values the installer *reads* but never writes. They have no option and no
prompt, so the only way to set one is to add the line to `.fogsettings`
yourself. The installer preserves anything it does not manage, so it will stay.

| Setting | What it does |
|---|---|
| `snapinLocation` | Where snapins live, if not under the default. `FOGBackup.sh` reads it and will tell you to add it by hand when it needs it |
| `storageLocationCapture` | Where captured images land, if you want them off `storageLocation` |
| `inetConnectTimeout`, `inetMaxTime` | Bounds on the installer's downloads — 5s to connect, 15s total |
| `ftppasvmin`, `ftppasvmax` | The FTP passive port range |
| `mcastportmin`, `mcastportmax` | The multicast port range |

### Where the install lives

`.fogsettings` cannot record its own location, because it lives *inside* it. The
installer keeps a one-line pointer at `/etc/fog/fog.conf` instead:

```bash
fogprogramdir='/opt/fog'
```

`fogprogramdir` also appears in `.fogsettings`, but only as a record — the
installer recomputes it. To move an install, re-run with `--fogprogramdir`; do
not edit either file. `fog_git_path` is a record in the same sense.

## How the file is rewritten

The installer rewrites `.fogsettings` at the end of every successful run.

If the file already exists and looks valid, it is **merged in place**:

- Settings the installer manages are updated **where they already are**.
- Retired settings are **deleted** (see below).
- **Everything else is left exactly as it is** — your comments, your blank lines,
  and any variable you added yourself. Nothing you put in this file is lost.
- Managed settings that were not already present are **appended at the end**,
  which is why upgraded servers have live settings after the footer.

If there is no file, or it has no recognizable header, it is written fresh in the
canonical order.

Two steps then finish the run:

1. `.fogsettings` is set to `0600 root:root`.
2. `.fogsettings.pub` is written beside it (`0644`), holding only the handful of
   facts the `/api/whoami` endpoint publishes. See
   [[install-fogsettings#Security|Security]].

### Settings the installer removes

These were written by older versions and are stripped on upgrade. If a guide
tells you to set one of them, that guide predates FOG 1.6:

| Removed | Why |
|---|---|
| `bootfilename`, `notpxedefaultfile` | Replaced by per-architecture boot file selection |
| `storageftpuser`, `storageftppass` | Storage node FTP credentials moved into the database |
| `php_verAdds` | Folded into the distribution package lists |
| `pkiMode`, `fogClientCACN` | Belonged to the retired four-tier certificate layout |
| `httpproto`, `netbootproto`, `bootdelay`, `catrust`, `secureboot`, `externalca`, `extcacert`, `extcakey`, `extcaroot`, `sslpath`, `sslprivkey`, `sslpubcert`, `sslcakey`, `sslcapem`, `sslcachain`, `sslcsr` | The pre-1.6 lower-case spellings of keys that still exist. Your value is copied onto the camelCase name once and the old line is then removed — see below |

>[!note] The transport and PKI keys were renamed in 1.6
>They used to be lower-case run-together names sitting beside camelCase ones
>added later, which made one settings model look like two. They are all
>camelCase now.
>
>**You do not need to do anything.** The first 1.6 installer run copies each old
>value onto its new name and deletes the old line, so an existing
>`.fogsettings` migrates itself. No aliases are kept — a file carrying two
>spellings of one setting, with nothing to say which is live, is worse than a
>rename. If you have scripts that read `.fogsettings` directly, they need the
>new names.
>
>Two lookalikes are **not** affected, because they are not this file's keys: the
>storage-node `sslpath` field used by the API and by CSV import/export, and
>PHP's own `httpproto`.

## Settings reference

### Network and host identity

| Setting | Meaning |
|---|---|
| `interface` | The NIC FOG binds services to and takes its address from |
| `ipaddress` | The server's **primary** address. Everything that needs "the FOG server" uses this |
| `ipaddresses` | **Every** address on that interface. Used for certificate names, `server_name`/`ServerAlias`, and the maintenance allow list |
| `submask` | Netmask, used when FOG runs DHCP |
| `hostname` | The name put in the web certificate and vhost. **This does not set your system hostname.** Change it with `--hostname` |
| `extraServerNames` | Additional names this server answers to. Set with `--extra-server-name` |

### DHCP

| Setting | Meaning |
|---|---|
| `dodhcp` / `bldhcp` | Whether FOG runs DHCP — the same answer as `Y`/`N` and as `1`/`0` |
| `dhcpengine` | `isc` or `kea`. Leave blank to let FOG detect; it prefers Kea only where ISC is unavailable and never switches an existing install |
| `dhcpd` | The DHCP service name on your distribution |
| `routeraddress` / `dnsaddress` | Handed to DHCP clients. When DHCP is off these hold a literal comment string, because the value is written straight into a config file |
| `plainrouter` | The router address without that comment fallback |
| `startrange` / `endrange` | The DHCP pool, set with `-s` and `-e` |

### Install shape

| Setting | Meaning |
|---|---|
| `installtype` | `N` for a full server, `S` for a storage node |
| `osid` / `osname` | `1` Redhat, `2` Debian, `3` Alpine (experimental), `4` Arch |
| `packages` | What was installed on this box, as a record |
| `php_ver` | The PHP version found, e.g. `8.3` |
| `webserver` | `apache`, `httpd` or `nginx` |
| `installlang` | Whether the extra language packs were installed |
| `sendreports` | `Y`/`N` — send OS name, OS version and FOG version to the project. This is anonymous version telemetry and nothing else |
| `fogupdateloaded` | `1` once a first install has completed; lets later runs skip the full question set |
| `copybackold` | Copy the old web directory aside before replacing it (`-o`) |
| `fog_update_channel` | Which channel this server tracks: `stable`, `staging` or `dev` |
| `fogprogramdir`, `fog_git_path` | Records of where things are. The installer recomputes both |

>[!warning] `osid` changed meaning between 1.5 and 1.6
>In FOG 1.5, Arch was `3`. In 1.6, `3` is Alpine and Arch is `4`. An Arch server
>upgrading from 1.5 carries the old value; the installer corrects it, but do not
>set `osid='3'` by hand expecting Arch.

### Paths

| Setting | Meaning |
|---|---|
| `docroot` | The web server's document root |
| `webroot` | The URL path FOG is served under — `/fog/`, or `/` to serve at the site root |
| `storageLocation` | Where images are kept, normally `/images` |
| `backupPath` | Where the database is dumped before a schema change |
| `sslPath` | Holds uploaded snapin SSL material and the client communication certificate. **Not** where FOG's own certificate authorities live any more |

### Database

| Setting | Meaning |
|---|---|
| `mysqldbname` | The database name, normally `fog` |
| `snmysqlhost` | Where the database is. On a storage node, this is the main server |
| `snmysqluser` | `fogmaster` on a server, `fogstorage` on a node |
| `snmysqlpass` | That user's password, generated on first install |
| `snmysqlexternal` | Set to `1` when the database is on a host FOG does not administer. The installer then only verifies the connection, and skips the backup, the user management and the grants |

### Web and certificates

The first six decide how FOG is reached and what its certificate is. They are
independent — none of them silently changes another — and
[[netboot-transport-and-pki|Netboot Transport and PKI]] explains which
combinations make sense and what `--install-mode` sets them to.

| Setting | Meaning |
|---|---|
| `httpProto` | The protocol FOG uses for its **own non-netboot** URLs. A **record**, not a preference: the installer sets it to `https` on every run, because 443 listens on every install. `--install-mode http-only` lowers it for that run only and does not persist |
| `netbootProto` | The protocol iPXE uses to reach `boot.php`. Defaults to `http`, and moves to `https` when **either** `publicWebCert=yes` or `rebuildIpxeWithMyCA=yes`. Re-derived on every run, so turning the trigger off puts it back |
| `netbootProtoForced` | `yes` when `--netboot-proto` was passed explicitly. This is what protects a forced value from being re-derived — without it, "the admin chose this" and "a previous run worked this out" are the same thing |
| `httpsRedirect` | Redirect HTTP to HTTPS, **and send HSTS**. Off by default, and no install mode turns it on. Trust in FOG's CA reaches a machine when fog-client installs it there, so on a fresh server a forced redirect breaks exactly the machines that cannot fix themselves |
| `publicWebCert` | A statement that the web certificate chains to a **public** root. Steers netboot to HTTPS, and stops FOG re-issuing the leaf or locking its key away |
| `rebuildIpxeWithMyCA` | Recompile iPXE with the configured CA embedded, so netboot can use HTTPS behind a **private** CA. Adds 10–25 minutes to this install and every future one |
| `caCreated` | Set once FOG's certificate authority exists |
| `caTrust` | Whether FOG adds its own CA to *this server's* trust store. On by default; without it FOG's HTTPS calls to itself fail to verify |
| `externalCA`, `extCACert`, `extCAKey`, `extCARoot` | Your own certificate authority. See [[external-ca-lets-encrypt\|External CA & Let's Encrypt Certificates]] |
| `webExtCACert`, `webExtCAKey`, `webExtCARoot` | The same, for the web certificates only |
| `rootCAPem`, `rootCAKey` | The trust anchor — what `ca.cert.der` publishes and what the fog-client pins |
| `sslCAPem`, `sslCAKey`, `sslCAChain` | The web certificate authority |
| `sslPrivKey`, `sslPubCert`, `sslCSR` | The web server's own certificate and key |
| `internalDomains`, `internalSubnets` | Which names FOG's authorities may issue for. Anything you list in `internalSubnets` **replaces** the default of all private ranges rather than adding to it |
| `acmeLeaf` | Your web certificate is managed outside FOG — certbot, acme.sh, a corporate process. Set it by hand; the installer may also infer it once from the certificate it finds, and records it when it does |
| `webCertFile`, `webKeyFile` | Where that externally-managed leaf and key actually live, captured from the vhost. Empty means "FOG's own". FOG rewrites the vhost on every run, so without these it would point the web server back at its own certificate |

>[!important] `acmeLeaf` and `publicWebCert` answer different questions
>`acmeLeaf` is **who renews the leaf**; `publicWebCert` is **what it chains
>to**. All four combinations are real — an internal ACME server such as step-ca
>is `acmeLeaf=yes` with `publicWebCert=no`. Either one on its own tells FOG the
>certificate was issued elsewhere, so FOG will neither re-issue it nor lock its
>private key away from whatever renews it. Neither implies the other.

>[!important] Set `acmeLeaf` before your first ACME renewal
>The installer infers it only from evidence it can see. If it has not, and you
>do not set it, the installer regenerates the web certificate from the original
>request while your ACME client owns the key — producing a certificate/key
>mismatch that stops the web server. See
>[[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]].

>[!note] Name constraints are fixed when a CA is first created
>`internalDomains` and `internalSubnets` only take effect when the authority is
>issued, and FOG never re-issues one. Changing them on an existing server does
>nothing until the intermediate is removed as well — which is why the installer
>stops asking once `caCreated='yes'`.

### Services

| Setting | Meaning |
|---|---|
| `username` | FOG's system account, `fogproject`. Also the FTP account used for replication |
| `password` | That account's password, generated on first install |
| `blexports` | Whether to rebuild `/etc/exports` for NFS |
| `noTftpBuild` | Set to leave the TFTP configuration alone |
| `tftpAdvOpts` | Extra options for `in.tftpd` |
| `bootDelay` | Seconds (0–120) a client waits before its first DHCP attempt, for switches slow to come out of STP or port power-save. Set with `--boot-delay`; see [[dhcp-server-settings#Adding a delay before the first DHCP attempt\|Adding a delay before the first DHCP attempt]] |
| `fwconfigure` | `configure`, `disable` or `skip` for the local firewall. Remembered so an upgrade cannot quietly reverse your choice |
| `kernelBackupGenerations` | How many previous kernel sets to keep. Default 3 |
| `inetConnectTimeout`, `inetMaxTime` | Bounds on the installer's downloads — 5s to connect, 15s total. Raise them only for a genuinely slow link |

### Secure Boot

| Setting | Meaning |
|---|---|
| `secureBoot` | `1`/`0`. On by default |
| `secureBootKey`, `secureBootCert` | The key and certificate that **sign** the FOS kernels |
| `secureBootMokCert` | The certificate **enrolled in firmware** — not always the same file |
| `sbNameConstraints` | Set to `no` to issue the Secure Boot CA without name constraints, if your firmware rejects the chain |

## Secure Boot

This is the part of `.fogsettings` most worth understanding, because getting it
wrong produces machines that will not boot, and the failure shows up at the
*client* as a Security Policy Violation with nothing on the server to explain it.

### Signing and enrollment are different keys

| Setting | Role | Cost of changing it |
|---|---|---|
| `secureBootKey` + `secureBootCert` | The **signing key**. What actually signs kernels | None. Re-sign and carry on |
| `secureBootMokCert` | The **enrolled certificate**. What firmware trusts | A physical trip to **every machine** |

FOG creates a Secure Boot certificate authority and enrolls *that*, then issues a
separate signing key beneath it. Because firmware trusts the issuer, the signing
key can be rotated — or issued per storage node — and your fleet keeps booting.

>[!warning] Servers upgrading from the older layout must re-enroll once
>FOG used to enroll the signing certificate itself, which made the thing you must
>never change and the thing you want to rotate the same object. Upgrading moves
>you onto the certificate authority, so **every machine that enrolled the old key
>must enroll once more**. The installer prints a notice when this happens. After
>that, no future signing key change needs a firmware trip. Your previous key is
>left on disk so you can still re-sign with it.

### Why these are remembered

An upgrade that quietly replaced signed kernels with unsigned ones is the main
way this breaks, so the settings persist and every later upgrade re-signs without
you passing anything. `secureBoot='0'` persists for the mirror reason: opting out
must not be undone by the next upgrade.

>[!important] The signing key is never regenerated once it exists
>A new key silently invalidates enrollment everywhere, and you would not find out
>until a client failed to boot. Even `--recreate-keys` deliberately leaves Secure
>Boot material alone. To force a new one, remove the directory — the installer
>then reports the recorded key as missing and generates a fresh one.

### Bringing your own key

Both forms work. Supplying only the signing pair enrolls that certificate, as it
always did:

```bash
./installfog.sh --secure-boot-key /path/sign.key --secure-boot-cert /path/sign.pem
```

Supplying your own authority as well lets you rotate signing keys under a
certificate that stays enrolled:

```bash
./installfog.sh --secureboot-ca-cert /path/your-sb-ca.pem \
                --secure-boot-key    /path/leaf.key \
                --secure-boot-cert   /path/leaf.pem
```

The key and certificate must be given together; supplying one alone is refused
rather than leaving your kernels unsigned.

>[!note] Your files are copied, and your originals are never touched
>FOG copies the pair into its own directory and points `.fogsettings` at the
>copy. This matters if you keep them under the web root, which is rebuilt during
>the install — without the copy they would be deleted before the kernels were
>ever signed.

Full walkthrough: [[secure-boot-signing|Secure Boot - signing FOS with your own key]].

## Security

`.fogsettings` is `0600 root:root`, because it holds two cleartext passwords:
`password` (the `fogproject` account, which is also the replication FTP account)
and `snmysqlpass` (the database).

It used to be world-readable, so any local account on the server could read both.
That was not simple carelessness — FOG's `/api/whoami` endpoint read the file
directly and needed it readable. The two jobs are now separate:

| File | Permissions | Contents |
|---|---|---|
| `/opt/fog/.fogsettings` | `0600 root:root` | Everything, including the passwords |
| `/opt/fog/.fogsettings.pub` | `0644 root:root` | Only `ipaddress`, `hostname`, `osid`, `osname`, `installtype` |

Re-running the installer is the whole migration — it corrects the permissions and
writes the public file, on servers and storage nodes alike.

>[!tip] Which file to read from a script
>If you only need to know *which server this is*, read `.fogsettings.pub` and
>stay unprivileged. Reading `.fogsettings` needs root.

Two habits worth keeping:

- **Never copy `.fogsettings` between servers** to clone a configuration. The
  credentials in it belong to the machine that generated them. To move a server,
  follow [[migrating-fog-server|Migrating FOG Server]].
- **Redact before sharing.** `.fogsettings.pub` is safe to post; `.fogsettings`
  is not.

## Editing it by hand

Some settings exist only for you to set — nothing in the installer writes them:

| Setting | When you would |
|---|---|
| `acmeLeaf='yes'` | Your web certificate is managed by certbot or acme.sh |
| `snmysqlexternal='1'` | Your database is on a host FOG does not administer |
| `dhcpengine='kea'` or `'isc'` | Force a DHCP engine instead of letting FOG detect one |
| `tftpAdvOpts` | Extra `in.tftpd` options |
| `fwconfigure` | Change your mind about the firewall without being asked again |
| `inetConnectTimeout`, `inetMaxTime` | Your link is genuinely slower than 5s/15s |

This works because FOG reads `.fogsettings` before applying its own defaults, and
the in-place merge never touches a line it does not manage.

Before you edit:

1. **You need root**, and you should leave the permissions at `0600`.
2. **Keep the `key='value'` form.** An unbalanced quote breaks the next install.
3. **Managed settings are overwritten on the next run.** Editing `ipaddress` or
   `hostname` here changes nothing — use the installer option instead. To change
   the server's address properly, follow [[change-fog-server-ip-address|Change FOG Server IP Address]].
4. **Take a copy first.** The installer rewrites the file with no backup.
5. **Do not edit `.fogsettings.pub`** — it is regenerated from `.fogsettings`
   every run.

## Related

- [[command-line-options|Fog installer command line options]] — every option that writes a setting here
- [[install-fog-server|Install FOG Server]] — the install itself
- [[install-script-architecture|Install Script Architecture]] — how the installer is put together
- [[secure-boot-signing|Secure Boot - signing FOS with your own key]]
- [[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]]
- [[unify-certificates-across-fog-servers|Unifying certificates across several FOG servers]]
- [[migrating-fog-server|Migrating FOG Server]]
- [[uninstall-fog-server|Uninstalling the Fog server]]
