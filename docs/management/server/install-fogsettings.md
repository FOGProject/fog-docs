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
>Redact `SVC_password` and `DB_password` first.

## Key names tell you who owns the setting

Every setting the installer manages is named `CATEGORY_lower_snake_case`. The
first `_` is the category boundary, and there are nine categories:

| Prefix | Owns |
|---|---|
| `FOG_` | Install shape, OS records, update channel, install location |
| `NET_` | This server's own network identity |
| `DHCP_` | FOG acting *as* a DHCP server |
| `DB_` | The database connection and its dump path |
| `WEB_` | The web server and the web-UI URL surface |
| `PKI_` | Certificate authorities and trust, with a zone token in the name |
| `BOOT_` | The client netboot path: iPXE, TFTP, FOS kernels |
| `STORAGE_` | Image storage and its NFS export |
| `SVC_` | FOG's own system account and host services |

**The category is the subsystem that *owns* the value, not every subsystem that
reads it.** That is what settles the settings that could plausibly sit in two
places: the storage-node database password is `DB_password`, not a `STORAGE_`
key, because it is a database credential — that a node also uses it is carried
by `FOG_install_type='S'` instead.

>[!note] `WEB_` and `BOOT_` look like one category and are not
>"The web UI uses HTTPS" says nothing about how clients netboot. `WEB_url_proto`
>and `BOOT_url_proto` are deliberately parallel names in separate namespaces, so
>that independence is visible in the file you edit. See
>[[netboot-transport-and-pki|Netboot Transport and PKI]].

If you are upgrading from FOG 1.5, every name in this file changed — see
[[install-fogsettings#The 1.6 rename|The 1.6 rename]]. You do not have to do
anything about it.

## The four kinds of setting

Confusing these is the source of most surprises in this file, so it is worth
knowing which kind you are looking at before you edit anything. Every table in
the reference below marks each setting with its kind.

| Kind | Meaning | Editing it by hand |
|---|---|---|
| **Preference** | Your decision. Persisted so it survives an upgrade, and nothing may silently reverse it | **Works.** This is the intended way to change some of them |
| **Record** | Written so you can read it back. The installer recomputes the real value every run and ignores what is stored | **Does nothing.** Use the installer option instead |
| **Hand-set** | Nothing in the installer ever writes it. It survives only because the merge preserves lines it does not manage | **The only way to set it** |
| **Inferred preference** | A preference the installer may write *once* from what it observed, and then treats as yours | **Works**, and your value is then final |

>[!important] A preference and a record can never be the same setting
>`BOOT_url_proto` used to be both, and it caused a real bug: a value one run
>*derived* was indistinguishable from one an admin *forced*, so it went on
>overriding the very settings it had been derived from. On a live server, an
>install resolved `http` and wrote it down; the admin then set
>`PKI_web_cert_publicly_trusted='yes'` and watched it be read and ignored.
>
>The pair is split now. `BOOT_url_proto` is a record, re-derived every run;
>`BOOT_url_proto_forced` is the preference that says you chose it.

## Example

A freshly written file, with the category blocks the installer emits:

```bash
## Start of FOG Settings
## Created by the FOG Installer
## Find more information about this file in the FOG Project wiki:
##     https://wiki.fogproject.org/wiki/index.php?title=.fogsettings
## Version: 1.6.0
## Install time: Mon 17 Aug 2026 05:13:02 PM CDT

## FOG -- install shape, OS records, update channel, install location
FOG_install_type='N'
FOG_os_id='1'
FOG_os_name='Redhat'
FOG_install_lang='0'
FOG_send_reports='Y'
FOG_copy_back_old='0'
FOG_installed=1
FOG_packages='...'
FOG_git_path='/root/fogproject'
FOG_update_channel='stable'
FOG_program_dir='/opt/fog'

## NET -- this server own network identity
NET_interface='ens3'
NET_fog_server_ip='10.0.0.39'
NET_subnet_mask='255.255.255.0'
NET_hostname='fog.example.lan'

## DHCP -- FOG acting AS a DHCP server
DHCP_enabled='0'
DHCP_engine='isc'
DHCP_service_name='dhcpd'
DHCP_router='10.0.0.1'
DHCP_dns_server_ip='208.67.222.222'
DHCP_range_start=''
DHCP_range_end=''

## DB -- the database connection and its dump path
DB_name='fog'
DB_host='localhost'
DB_user='fogmaster'
DB_password='<redacted>'
DB_external=''
DB_backup_path='/home/'

## WEB -- the web server and the web-UI URL surface
WEB_server_engine='nginx'
WEB_docroot='/var/www/html/'
WEB_root='/fog/'
WEB_php_version='8.3'
WEB_url_proto='https'
WEB_https_redirect='no'

## BOOT -- the client netboot path: iPXE, TFTP, FOS kernels
BOOT_url_proto='http'
BOOT_url_proto_forced=''
BOOT_rebuild_ipxe_with_my_ca='no'
BOOT_external_tftp_server=''
BOOT_tftp_options=''
BOOT_dhcp_delay_seconds='0'
BOOT_kernel_backups_kept='3'

## STORAGE -- image storage and its NFS export
STORAGE_image_share_path='/images'
STORAGE_rebuild_nfs_exports='1'

## SVC -- FOG own system account and host services
SVC_user='fogproject'
SVC_password='<redacted>'
SVC_firewall_control='configure'

## PKI -- certificate authorities and trust
PKI_sb_enabled='1'
PKI_web_cert_publicly_trusted='no'
PKI_allowed_domain_names=''
PKI_internal_subnets=''
PKI_san_ip_addresses='10.0.0.39'
PKI_san_dns_names=''
PKI_client_cert_dir='/opt/fog/snapins/ssl'

## Derived -- do not edit
## Canonical certificate paths. The installer recomputes these every
## run, so editing a path here moves nothing. To use a certificate FOG
## did not issue, leave the path alone and make it resolve to your file
## (a symlink is enough) -- FOG then reads the target and leaves it be.
PKI_root_ca_cert='/opt/fog/snapins/ssl/CA/.fogCA.pem'
PKI_root_ca_key='/opt/fog/snapins/ssl/CA/.fogCA.key'
PKI_web_ca_cert='/opt/fog/pki/web/ca/.fogWebCA.pem'
PKI_web_ca_key='/opt/fog/pki/web/ca/.fogWebCA.key'
PKI_web_external_root_cert=''
PKI_web_trust_chain='/opt/fog/pki/web/ca/.fogWebCAchain.pem'
PKI_web_vhost_cert='/opt/fog/pki/web/leaf/.webLeaf.pem'
PKI_web_vhost_key='/opt/fog/pki/web/leaf/.webLeaf.key'
PKI_client_encrypt_cert='/opt/fog/snapins/ssl/.srvpublic.crt'
PKI_client_encrypt_key='/opt/fog/snapins/ssl/.srvprivate.key'
PKI_sb_ca_cert='/opt/fog/pki/secureboot/ca/.fogSBCA.pem'
PKI_sb_codesign_cert='/opt/fog/pki/secureboot/leaf/sign.pem'
PKI_sb_codesign_key='/opt/fog/pki/secureboot/leaf/sign.key'
## End of FOG Settings
```

>[!note] Your file may have keys after the `## End of FOG Settings` line
>That marker is cosmetic — the file is sourced in full. When an upgrade
>introduces a new setting the installer appends it, so on a server that has been
>upgraded a few times there are live settings below the marker. See
>[[install-fogsettings#How the file is rewritten|How the file is rewritten]].

## Where each value comes from

Each setting is filled in from the first source below that supplies a value.
**Highest precedence first:**

1. **An installer option on this run** — see [[command-line-options|Fog installer command line options]].
2. **An exported environment variable**, for scripted installs.
3. **`.fogsettings` from the previous install** — unless you pass `-U`.
4. **An interactive prompt.** `-y` skips the prompts and takes each default.
5. **The distribution defaults** — package lists, web server, paths.

Two consequences worth knowing:

- **An option always beats the stored value.** The installer applies your
  command line *after* reading `.fogsettings`, so you never have to clear a
  setting before overriding it.
- **Repeatable options replace rather than add.** `--extra-server-name`,
  `--internal-domain` and `--internal-subnet` each replace the stored list, so
  re-running with a shorter list genuinely shortens it.

`--install-mode` sits slightly outside this order: it is a *preset* that writes
four settings at once, and it is applied **before** the individual options, so
`--install-mode public-cert --no-rebuild-ipxe-with-my-ca` means what it reads
like. Each individual option overrides its own field and nothing else.

### Where the install lives

`.fogsettings` cannot record its own location, because it lives *inside* it. The
installer keeps a one-line pointer at `/etc/fog/fog.conf` instead:

```bash
fogprogramdir='/opt/fog'
```

`FOG_program_dir` also appears in `.fogsettings`, but only as a record — the
installer recomputes it, and re-asserts the value it actually resolved after
sourcing this file, so a stale line cannot relocate an install half way through
a run. To move an install, re-run with `--fogprogramdir`; do not edit either
file. `FOG_git_path` is a record in the same sense.

>[!note] `fog.conf` keeps the old spelling on purpose
>`/etc/fog/fog.conf` still says `fogprogramdir=`, not `FOG_program_dir=`. Every
>existing server already carries that spelling, and it is the one file that
>cannot be found by reading `.fogsettings`. Renaming it is a separate decision.

## How the file is rewritten

The installer rewrites `.fogsettings` at the end of every successful run.

If the file already exists and looks valid, it is **merged in place**:

- Settings the installer manages are updated **where they already are**.
- Retired settings are **deleted** (see below).
- **Everything else is left exactly as it is** — your comments, your blank lines,
  and any variable you added yourself. Nothing you put in this file is lost.
- Managed settings that were not already present are **appended at the end**,
  which is why upgraded servers have live settings after the footer.

A file that still carries only pre-1.6 names is a special case: it gets a
**one-time canonical rewrite** into the category blocks shown above, with
everything the installer does not manage carried through into a trailing
section. The in-place merge cannot do that run — with every old name retired and
every new one absent, it would strip all 79 old lines and append 66 new ones
after the footer, leaving the category headers describing nothing.

If there is no file at all, or it has no recognizable header, it is written fresh
in canonical order.

Two steps then finish the run:

1. `.fogsettings` is set to `0600 root:root`.
2. `.fogsettings.pub` is written beside it (`0644`), holding only the handful of
   facts the `/api/whoami` endpoint publishes. See
   [[install-fogsettings#Security|Security]].

### The 1.6 rename

FOG 1.6 renamed all 79 managed keys into the nine categories above: 79 became
**66** — six retired, nine absorbed into settings that already existed, and two
promoted from internal variables.

>[!important] You do not need to do anything
>The first 1.6 installer run copies each old value onto its new name and deletes
>the old line, so an existing `.fogsettings` migrates itself in one pass. Your
>hand-set keys and your own comments are carried through.
>
>**No aliases are kept.** A file carrying two spellings of one setting, with
>nothing to say which is live, is worse than a rename — and because this file is
>*sourced*, a stale line keeps having effects. If you have scripts that read
>`.fogsettings` directly, they need the new names.

A few renames are worth knowing because the setting also changed category:

| Was | Is now | Note |
|---|---|---|
| `snmysqlpass`, `snmysqluser`, `snmysqlhost` | `DB_password`, `DB_user`, `DB_host` | The `sn` prefix read as "storage node", but these are used on a full server too |
| `password` | `SVC_password` | Two different secrets were in this file and the generic name held the fleet-wide one |
| `sslpath` | `PKI_client_cert_dir` | It stopped holding FOG's authorities two restructurings ago |
| `ipaddresses` | `PKI_san_ip_addresses` | It reaches past certificates: it also writes the nginx maintenance allow list |
| `extraServerNames` | `PKI_san_dns_names` | Mirrored into `FOG_EXTRA_SERVER_NAMES` in the web UI |
| `noTftpBuild` | `BOOT_external_tftp_server` | Same polarity, so the value carries across untouched — it now names the *reason* rather than the mechanic |
| `secureBootMokCert` | `PKI_sb_ca_cert` | The certificate enrolled in firmware is an authority, not a leaf |
| `secureBootKey`, `secureBootCert` | `PKI_sb_codesign_key`, `PKI_sb_codesign_cert` | `codesign`, not `leaf`: nothing in this zone authenticates a server |

>[!note] Two lookalikes are not affected
>Neither is a key in this file: the storage-node `sslpath` field used by the API
>and by CSV import/export, and PHP's own `httpproto`.

### Settings the installer removes

These are written by older versions and stripped on upgrade. If a guide tells you
to set one of them, that guide predates FOG 1.6:

| Removed | Why |
|---|---|
| Every pre-1.6 spelling of a setting that still exists | Renamed as above. Your value is copied onto the new name once, then the old line goes |
| `caCreated` | Stood in for "the CA exists". Both of its readers already paired it with an existence check on the very file it named |
| `acmeLeaf` | Now derived — see [[install-fogsettings#Certificates FOG did not issue\|Certificates FOG did not issue]] |
| `webCertFile`, `webKeyFile` | Folded into `PKI_web_vhost_cert`/`PKI_web_vhost_key`, which are now canonical paths |
| `sslcsr` | Could only ever hold one path, and was re-derived to it every run |
| `externalca` | Derivable from "is an import path set", and now scoped to the run rather than persisted |
| `catrust` | FOG's CA is now always anchored in this server's own trust store |
| `sbNameConstraints` | Name constraints come off the Secure Boot zone entirely — see [[install-fogsettings#Secure Boot\|Secure Boot]] |
| `extcacert`, `extcakey`, `extcaroot`, `webExtCACert`, `webExtCAKey`, `webExtCARoot` | Six keys that only ever held three values, reached two ways. Both spellings of the flag still work; they are run-scoped inputs now |
| `bootfilename`, `notpxedefaultfile` | Replaced by per-architecture boot file selection |
| `storageftpuser`, `storageftppass` | Storage node FTP credentials moved into the database |
| `php_verAdds` | Folded into the distribution package lists |
| `pkiMode`, `fogClientCACN` | Belonged to the retired four-tier certificate layout |

>[!note] Four of these were retired for the same reason
>`acmeLeaf`, `caCreated`, `externalca` and `sslcsr` each stood in for something
>already knowable from the filesystem, and each had failed in the same way: a
>persisted flag and the thing it described could disagree, and did. FOG asks the
>filesystem now.
>
>`catrust` and `sbNameConstraints` went for a different reason — both were
>opt-outs that put the safe answer behind a flag nobody passes until something
>has already broken.

## Settings reference

### `FOG_` — install shape and location

| Setting | Kind | Meaning |
|---|---|---|
| `FOG_install_type` | Preference | `N` for a full server, `S` for a storage node |
| `FOG_os_id` | Record | `1` Redhat, `2` Debian, `3` Alpine (experimental), `4` Arch |
| `FOG_os_name` | Record | The detected distribution family |
| `FOG_install_lang` | Preference | Whether the extra language packs were installed |
| `FOG_send_reports` | Preference | `Y`/`N` — send OS name, OS version and FOG version to the project. This is anonymous version telemetry and nothing else |
| `FOG_copy_back_old` | Preference | Copy the old web directory aside before replacing it (`-o`) |
| `FOG_installed` | Record | `1` once a first install has completed; lets later runs skip the full question set. Deliberately unquoted and numeric, to match the historical format |
| `FOG_packages` | Record | What was installed on this box. Re-derived every run from the distribution package lists |
| `FOG_git_path` | Record | Where the checkout is. Re-asserted from what the run actually resolved, so a moved or re-cloned tree cannot point `updatefog.sh` at a directory that is gone |
| `FOG_update_channel` | Preference | Which channel this server tracks: `stable`, `patches` or `beta`. The same word as the `FOG_CHANNEL` the server reports, in lowercase. The earlier spellings `staging` and `dev` mean `patches` and `beta`, and are still accepted so existing servers keep updating |
| `FOG_program_dir` | Record | Where this install lives, so `grep FOG_program_dir .fogsettings` answers the question. Not a control — see [[install-fogsettings#Where the install lives\|Where the install lives]] |

>[!warning] `FOG_os_id` changed meaning between 1.5 and 1.6
>In FOG 1.5, Arch was `3`. In 1.6, `3` is Alpine and Arch is `4`. An Arch server
>upgrading from 1.5 carries the old value; the installer corrects it, but do not
>set `FOG_os_id='3'` by hand expecting Arch.

### `NET_` — this server's network identity

| Setting | Kind | Meaning |
|---|---|---|
| `NET_interface` | Preference | The NIC FOG binds services to and takes its address from |
| `NET_fog_server_ip` | Record | The server's **primary** address. Everything that needs "the FOG server" uses this |
| `NET_subnet_mask` | Record | Netmask, used when FOG runs DHCP |
| `NET_hostname` | Preference | The name put in the web certificate and the vhost. **This does not set your system hostname.** Change it with `--hostname` |

Every *other* address on that interface is `PKI_san_ip_addresses`, and extra
names this server answers to are `PKI_san_dns_names` — both under `PKI_` because
they reach past certificates into the vhost and the maintenance allow list.

### `DHCP_` — FOG acting as a DHCP server

| Setting | Kind | Meaning |
|---|---|---|
| `DHCP_enabled` | Preference | `1`/`0` — whether FOG runs DHCP. Replaces `dodhcp` and `bldhcp`, which were one answer in two encodings |
| `DHCP_engine` | Preference | `isc` or `kea`. Leave blank to let FOG detect; it prefers Kea only where ISC is unavailable, and never switches an existing install |
| `DHCP_service_name` | Record | The DHCP service name on your distribution |
| `DHCP_router` | Preference | The router handed to DHCP clients, or empty. Holds the clean value only — the config writers emit the "no router" comment themselves |
| `DHCP_dns_server_ip` | Preference | The DNS server handed to DHCP clients, same treatment |
| `DHCP_range_start`, `DHCP_range_end` | Preference | The DHCP pool, set with `-s` and `-e`. Passing either also turns `DHCP_enabled` on |

### `DB_` — the database

| Setting | Kind | Meaning |
|---|---|---|
| `DB_name` | Preference | The database name, normally `fog` |
| `DB_host` | Preference | Where the database is. On a storage node, this is the main server |
| `DB_user` | Record | `fogmaster` on a server, `fogstorage` on a node |
| `DB_password` | Record | That user's password, generated on first install. **Cleartext** |
| `DB_external` | Preference | Set to `1` when the database is on a host FOG does not administer. The installer then only verifies the connection, and skips the backup, the user management and the grants |
| `DB_backup_path` | Preference | Where the database is dumped before a schema change |

### `WEB_` — the web server and the web UI

| Setting | Kind | Meaning |
|---|---|---|
| `WEB_server_engine` | Record | `apache`, `httpd` or `nginx` |
| `WEB_docroot` | Preference | The web server's document root |
| `WEB_root` | Preference | The URL path FOG is served under — `/fog/`, or `/` to serve at the site root |
| `WEB_php_version` | Record | The PHP version found, e.g. `8.3` |
| `WEB_url_proto` | Record | The protocol FOG uses for its **own non-netboot** URLs. The installer sets it to `https` on every run, because 443 listens on every install. `--install-mode http-only` lowers it for that run only |
| `WEB_https_redirect` | Inferred preference | Redirect HTTP to HTTPS, **and send HSTS**. Seeded once from a pre-existing `httpproto=https`, then yours for good |

>[!warning] `--install-mode http-only` does not persist
>`WEB_url_proto` is set back to `https` at the start of every run — 443 listens
>either way — so pass `--install-mode http-only` on each upgrade or it silently
>reverts.

>[!note] No install mode turns the redirect on
>A redirect only helps machines that already trust the certificate, and FOG
>cannot know how you got that trust there. fog-client installing FOG's root is
>the common route, but your own deployment tooling or a public CA work too. Turn
>`WEB_https_redirect` on once one of them is true.

### `BOOT_` — the client netboot path

| Setting | Kind | Meaning |
|---|---|---|
| `BOOT_url_proto` | Record | The protocol iPXE uses to reach `boot.php`. Re-derived every run: `https` when either `PKI_web_cert_publicly_trusted` or `BOOT_rebuild_ipxe_with_my_ca` is `yes`, otherwise `http` |
| `BOOT_url_proto_forced` | Inferred preference | `yes` once `--netboot-proto` has been passed explicitly. This is the only thing that distinguishes "the admin chose this" from "a previous run worked this out" |
| `BOOT_rebuild_ipxe_with_my_ca` | Preference | Recompile iPXE with the configured CA embedded, so netboot can use HTTPS behind a **private** CA. The build takes 10–25 minutes, but is stamped against the pinned iPXE version and the CA, so it re-runs only when one of those changes |
| `BOOT_external_tftp_server` | Preference | Your TFTP server is elsewhere, so leave the TFTP configuration alone. Also keeps `69/udp` closed in the firewall |
| `BOOT_tftp_options` | Hand-set | Extra options for `in.tftpd` |
| `BOOT_dhcp_delay_seconds` | Preference | Seconds (0–120) a client waits before its first DHCP attempt, for switches slow to come out of STP or port power-save. `0` writes no delay. See [[dhcp-server-settings\|DHCP server settings]] |
| `BOOT_kernel_backups_kept` | Preference | How many previous kernel and init sets to keep. Default 3 |

### `STORAGE_` — image storage

| Setting | Kind | Meaning |
|---|---|---|
| `STORAGE_image_share_path` | Preference | Where images are kept, normally `/images` |
| `STORAGE_rebuild_nfs_exports` | Preference | Whether to rebuild `/etc/exports` for NFS |

### `SVC_` — FOG's system account and host services

| Setting | Kind | Meaning |
|---|---|---|
| `SVC_user` | Record | FOG's system account, `fogproject`. Also the FTP account used for replication |
| `SVC_password` | Record | That account's password, generated on first install. **Cleartext, and fleet-wide** |
| `SVC_firewall_control` | Preference | `configure`, `disable` or `skip` for the local firewall. Remembered so an upgrade cannot quietly reverse your choice |

### `PKI_` — certificates and trust

The zone token in each name (`root`, `web`, `client`, `sb`) says which authority
it belongs to; [[pki-zones|FOG PKI Infrastructure]] explains the split.

**Policy and inputs** — these are yours to set:

| Setting | Kind | Meaning |
|---|---|---|
| `PKI_web_cert_publicly_trusted` | Preference | A **statement** that the web certificate chains to a public root. Steers netboot to HTTPS with no iPXE rebuild, and stops FOG re-issuing the leaf. Never measured: FOG anchors its own CA in the host trust store, so probing the store would answer "trusted" for FOG's own leaf — exactly the case that does need the rebuild |
| `PKI_allowed_domain_names` | Preference | Domains the Web CA may issue for, and names added to the certificate and the vhost `ServerAlias`. Set with `--internal-domain`. The server's own domain is always permitted |
| `PKI_internal_subnets` | Preference | Restricts the Web CA to these subnets. Set with `--internal-subnet`, and it **replaces** the default of all private ranges rather than adding to it |
| `PKI_san_ip_addresses` | Preference | Every address this server answers on. Used for certificate names, `server_name`/`ServerAlias`, and the nginx maintenance allow list |
| `PKI_san_dns_names` | Preference | Extra names this server answers to, set with `--extra-server-name`. Mirrored into `FOG_EXTRA_SERVER_NAMES` in the web UI |
| `PKI_client_cert_dir` | Preference | Holds uploaded snapin SSL material and the client communication certificate. **Not** where FOG's own authorities live any more |
| `PKI_sb_enabled` | Preference | `1`/`0`. On by default. See [[install-fogsettings#Secure Boot\|Secure Boot]] |

**Canonical paths** — these are records, under the `## Derived — do not edit`
marker in the file:

| Setting | Meaning |
|---|---|
| `PKI_root_ca_cert`, `PKI_root_ca_key` | The trust anchor — what `ca.cert.der` publishes and what fog-client pins. Recorded in its own right rather than inferred from the Web CA, which would mistake the intermediate for the root on the next run |
| `PKI_web_ca_cert`, `PKI_web_ca_key` | The CA that signs the vhost certificate — and all that an external CA replaces |
| `PKI_web_external_root_cert` | A root you imported that FOG does not already have. Empty on an ordinary install, and kept deliberately separate from `PKI_root_ca_cert`: an external web CA's root feeds the chain file only, and is not what fog-client pins |
| `PKI_web_trust_chain` | The web zone's **trust path** — intermediate plus the root anchoring it. Not what the vhost serves; those files are rebuilt every run and never persisted |
| `PKI_web_vhost_cert`, `PKI_web_vhost_key` | The certificate and key the web server actually serves |
| `PKI_client_encrypt_cert`, `PKI_client_encrypt_key` | The client-communication keypair that every registered client pins |
| `PKI_sb_ca_cert` | The Secure Boot certificate **enrolled in firmware** |
| `PKI_sb_codesign_cert`, `PKI_sb_codesign_key` | The Secure Boot material that **signs** the FOS kernels |

>[!note] The client-encryption keys are new, and their names are not free
>These were internal variables until 1.6, which made the client zone the only one
>you could not point elsewhere — an odd exception in a model whose whole premise
>is "say where the certificate is". But `FOGBase` builds `.srvprivate.key` with
>the filename hardcoded, taking the directory from the storage-node record. So
>these name a canonical path whose *target* may move while the name may not.

#### Certificates FOG did not issue

This is the inverse of how it worked before 1.6, and it is worth reading before
you touch a certificate path.

**A `PKI_*` path is canonical.** FOG always refers to the vhost certificate as
`PKI_web_vhost_cert`, and recomputes that path every run — so editing it moves
nothing. To use a certificate FOG did not issue, leave the path alone and make it
**resolve** to your file. A symlink is enough:

```bash
ln -sf /etc/letsencrypt/live/fog.example.com/fullchain.pem \
       /opt/fog/pki/web/leaf/.webLeaf.pem
ln -sf /etc/letsencrypt/live/fog.example.com/privkey.pem \
       /opt/fog/pki/web/leaf/.webLeaf.key
```

FOG then reads the target and leaves it alone. That is the whole mechanism: when
the canonical path resolves *outside* FOG's own web zone directory, the leaf is
somebody else's, so FOG will neither re-issue it nor lock its private key away
from whatever renews it.

>[!important] This replaces `acmeLeaf`, and you no longer set anything by hand
>`acmeLeaf` had to be typed in, and forgetting it was expensive: FOG re-issued
>the web certificate from the original request while an ACME private key sat
>beside it, producing a mismatched pair and a web server that would not start —
>silently, under `-y`.
>
>A symlink cannot disagree with itself, where a persisted flag and two recorded
>paths could each disagree with the vhost. That is why the flag is gone.

If your certificate chains to a **public** root, also set
`PKI_web_cert_publicly_trusted='yes'` (or install with `--install-mode
public-cert`) — that is a separate question from who renews it, and it is what
lets netboot use HTTPS with no iPXE rebuild. An internal ACME server such as
step-ca is a symlinked leaf with `PKI_web_cert_publicly_trusted='no'`.

Full walkthrough: [[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]].

>[!note] Name constraints are fixed when a CA is first created
>`PKI_allowed_domain_names` and `PKI_internal_subnets` only take effect when the
>authority is issued, and FOG never re-mints one. Changing them on an existing
>server does nothing until the intermediate is removed as well.

### Settings only you can set

A few values the installer *reads* but never writes. They have no option and no
prompt, so the only way to set one is to add the line to `.fogsettings`
yourself. They survive because the merge preserves what it does not manage.

| Setting | What it does |
|---|---|
| `snapinLocation` | Where snapins live, if not under the default. `FOGBackup.sh` reads it and will tell you to add it by hand when it needs it |
| `storageLocationCapture` | Where captured images land, if you want them off `STORAGE_image_share_path` |
| `inetConnectTimeout`, `inetMaxTime` | Bounds on the installer's downloads — 5s to connect, 15s total. Raise them only for a genuinely slow link |
| `ftppasvmin`, `ftppasvmax` | The FTP passive port range |
| `mcastportmin`, `mcastportmax` | The multicast port range |

These work because `.fogsettings` is sourced *before* the installer applies its
own defaults, and each of those defaults is guarded on the value being empty.

## Secure Boot

This is the part of `.fogsettings` most worth understanding, because getting it
wrong produces machines that will not boot, and the failure shows up at the
*client* as a Security Policy Violation with nothing on the server to explain it.

### Signing and enrolment are different keys

| Setting | Role | Cost of changing it |
|---|---|---|
| `PKI_sb_codesign_key` + `PKI_sb_codesign_cert` | The **signing** material. What actually signs kernels | None. Re-sign and carry on |
| `PKI_sb_ca_cert` | The **enrolled** certificate. What firmware trusts | A physical trip to **every machine** |

FOG creates a Secure Boot certificate authority and enrols *that*, then issues a
separate signing certificate beneath it. Because firmware trusts the issuer, the
signing material can be rotated — or issued per storage node — and your fleet
keeps booting.

The names say which is which: the Secure Boot zone carries
`extendedKeyUsage = codeSigning` on both the authority and the certificate it
issues, where the web zone carries `serverAuth`. Nothing here authenticates a
server, so nothing here is called a leaf.

>[!warning] Servers upgrading from the older layout must re-enrol once
>FOG used to enrol the signing certificate itself, which made the thing you must
>never change and the thing you want to rotate the same object. Upgrading moves
>you onto the certificate authority, so **every machine that enrolled the old key
>must enroll once more**. The installer prints a notice when this happens. After
>that, no future signing key change needs a firmware trip. Your previous key is
>left on disk so you can still re-sign with it.

### Why these are remembered

An upgrade that quietly replaced signed kernels with unsigned ones is the main
way this breaks, so the settings persist and every later upgrade re-signs without
you passing anything. `PKI_sb_enabled='0'` persists for the mirror reason: opting
out must not be undone by the next upgrade.

>[!important] The signing key is never regenerated once it exists
>A new key silently invalidates enrolment everywhere, and you would not find out
>until a client failed to boot. Even `--recreate-keys` deliberately leaves Secure
>Boot material alone. To force a new one, remove the directory — the installer
>then reports the recorded key as missing and generates a fresh one.

### No name constraints in this zone

The Secure Boot authority carries **no name constraints**, and there is
deliberately no setting or flag to add them. FOG 1.6 retired both
`sbNameConstraints` and `--no-sb-name-constraints`.

They constrained nothing that matters for code signing — a code-signing
certificate carries no names anyone resolves — while this is the one certificate
UEFI and shim actually parse, and a critical extension they mishandle costs a
firmware trip to every machine. An opt-out was the wrong shape for that risk: it
put the safe answer behind a flag nobody passes until a fleet has already failed
to boot.

The Web CA still gets constraints, because iPXE is a verifier FOG can patch and
firmware is not. Existing servers keep whatever their Secure Boot authority
already carries — an intermediate is never re-minted.

### Bringing your own key

Both forms work. Supplying only the signing pair enrols that certificate, as it
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
`SVC_password` (the `fogproject` account, which is also the replication FTP
account) and `DB_password` (the database).

It used to be world-readable, so any local account on the server could read both.
That was not simple carelessness — FOG's `/api/whoami` endpoint read the file
directly and needed it readable. The two jobs are now separate:

| File | Permissions | Contents |
|---|---|---|
| `/opt/fog/.fogsettings` | `0600 root:root` | Everything, including the passwords |
| `/opt/fog/.fogsettings.pub` | `0644 root:root` | Only `NET_fog_server_ip`, `NET_hostname`, `FOG_os_id`, `FOG_os_name`, `FOG_install_type` |

Re-running the installer is the whole migration — it corrects the permissions and
writes the public file, on servers and storage nodes alike.

>[!tip] Which file to read from a script
>If you only need to know *which server this is*, read `.fogsettings.pub` and
>stay unprivileged. Reading `.fogsettings` needs root.

>[!warning] `/api/whoami` renamed its response keys too
>The five fields it publishes are the ones above, and they are renamed rather
>than mapped back to their old spellings. A client reading `osid` or `hostname`
>from that route needs updating. On a server whose web tree is newer than its
>last installer run, the route answers empty strings until the installer runs.

Two habits worth keeping:

- **Never copy `.fogsettings` between servers** to clone a configuration. The
  credentials in it belong to the machine that generated them. To move a server,
  follow [[migrating-fog-server|Migrating FOG Server]].
- **Redact before sharing.** `.fogsettings.pub` is safe to post; `.fogsettings`
  is not.

## Editing it by hand

Which settings respond to a hand edit follows straight from
[[install-fogsettings#The four kinds of setting|the four kinds]]: **preferences**
and **hand-set** values do, **records** do not. Some common ones:

| Setting | When you would |
|---|---|
| `PKI_web_cert_publicly_trusted='yes'` | Your web certificate chains to a public root |
| `DB_external='1'` | Your database is on a host FOG does not administer |
| `DHCP_engine='kea'` or `'isc'` | Force a DHCP engine instead of letting FOG detect one |
| `BOOT_tftp_options` | Extra `in.tftpd` options |
| `SVC_firewall_control` | Change your mind about the firewall without being asked again |
| `inetConnectTimeout`, `inetMaxTime` | Your link is genuinely slower than 5s/15s |

Before you edit:

1. **You need root**, and you should leave the permissions at `0600`.
2. **Keep the `key='value'` form.** An unbalanced quote breaks the next install.
3. **Records are recomputed on the next run.** Editing `NET_fog_server_ip` here
   changes nothing — use the installer option instead. To change the server's
   address properly, follow [[change-fog-server-ip-address|Change FOG Server IP Address]].
4. **Certificate paths are canonical.** Do not repoint one at your own file;
   make the path *resolve* there instead. See
   [[install-fogsettings#Certificates FOG did not issue|Certificates FOG did not issue]].
5. **Take a copy first.** The installer rewrites the file with no backup.
6. **Do not edit `.fogsettings.pub`** — it is regenerated from `.fogsettings`
   every run.

## Related

- [[command-line-options|Fog installer command line options]] — every option that writes a setting here
- [[netboot-transport-and-pki|Netboot Transport and PKI]] — why `WEB_` and `BOOT_` are separate
- [[install-fog-server|Install FOG Server]] — the install itself
- [[install-script-architecture|Install Script Architecture]] — how the installer is put together
- [[pki-zones|FOG PKI Infrastructure]] — what each `PKI_` zone is for
- [[secure-boot-signing|Secure Boot - signing FOS with your own key]]
- [[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]]
- [[unify-certificates-across-fog-servers|Unifying certificates across several FOG servers]]
- [[migrating-fog-server|Migrating FOG Server]]
- [[uninstall-fog-server|Uninstalling the Fog server]]
