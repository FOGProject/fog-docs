---
title: Fog installer command line options
aliases:
    - Fog installer command line options
    - installfog.sh options
    - Installer flags
description: Every option the FOG installer accepts, what it changes, and which ones are remembered in .fogsettings
context_id: command-line-options
tags:
    - installation
    - fog-server
    - configuration
    - certificates
    - secure-boot
---

# Fog installer command line options

>[!info] FOG 1.6
>This page describes FOG 1.6's installer options. FOG 1.5 takes a shorter
>list — no `--install-mode`, no `--netboot-proto`, no `--boot-delay`, and
>`-S`/`--force-https` still carries its pre-1.6 meaning. See the
>[[1.5/installation/server/command-line-options|1.5 version]] of this page.

The FOG installer takes a lot of options. Most installs need none of them —
the defaults are chosen for the common case, and anything you do pass is
recorded in [[management/server/install-fogsettings|the .fogsettings file]] so an upgrade keeps
it without you passing it again.

>[!note] Options beat the stored value
>The installer reads `.fogsettings` first and applies your command line after,
>so you never have to clear a setting before overriding it. The exception is
>`--install-mode`, which is a preset: it is applied *before* the individual
>options, so those still win over it.

## The four install modes

`--install-mode` sets four settings at once, and is the easiest way to pick a
combination that works. Full reasoning in
[[kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]].

| Mode | `WEB_url_proto` | `BOOT_url_proto` | `PKI_web_cert_publicly_trusted` | `BOOT_rebuild_ipxe_with_my_ca` |
|---|---|---|---|---|
| `standard` *(default)* | https | http | no | no |
| `http-only` | http | http | no | no |
| `public-cert` | https | **https** | **yes** | no |
| `embed-ca` | https | **https** | no | **yes** |

An attended install offers these as a numbered prompt on a machine that has not
had FOG on it before. Under `-y`, on a re-install, or with any of the transport
options below, it does not ask: you get `standard` on a first install unless you
passed something else, and on an upgrade you keep what you already had.

>[!warning] `--install-mode` does not touch the HTTP→HTTPS redirect
>No mode sets or clears `WEB_https_redirect`. A server upgraded from a `-S`
>install keeps its redirect whichever mode you pick, because that setting is
>seeded once from the old `httpproto=https` and is then yours for good. Use
>`--no-https-redirect` to turn it off.

>[!note] The mode is asked once and remembered
>Your choice is stored as `FOG_install_mode` in
>[[management/server/install-fogsettings|.fogsettings]], so `--install-mode` only needs giving to
>*change* it — an upgrade keeps the mode you picked, and the four-mode menu is
>not shown again.
>
>This is also what makes `http-only` stick. `WEB_url_proto` is set back to
>`https` early in every run (443 listens on every install either way), and the
>preset is applied *after* that line — so the mode survives where it previously
>had to be passed again on every upgrade or it silently reverted.
>
>Any of the individual transport options below **clears** the remembered mode,
>because the result is no longer one of the four named shapes. That is
>deliberate: a mode name left in place would have the next upgrade re-apply the
>preset over the very setting you changed.

## Transport options

These are the individual settings the modes above are shorthand for. Any of
them can be given on its own.

| Option | What it does |
| --- | --- |
| `--netboot-proto http\|https` | The protocol iPXE uses to fetch `boot.php`. Otherwise derived every run: `https` when the certificate is public or iPXE was rebuilt with your CA. Passing it explicitly is **remembered as explicit**, so later runs stop re-deriving it |
| `--public-web-cert` | States that the web certificate chains to a **public** root, so iPXE can validate it with no rebuild. Needs an FQDN, not an IP. Also stops FOG re-issuing the leaf |
| `--rebuild-ipxe-with-my-ca` | Recompiles iPXE with the configured CA embedded, for HTTPS netboot behind a **private** CA. The build takes 10–25 minutes but is stamped against the pinned iPXE version and the CA, so it re-runs only when one of those changes |
| `-S`, `--force-https`, `--https-redirect` | Redirect HTTP to HTTPS, **and send HSTS**. All three spellings are the same option |
| `--no-force-https`, `--no-https-redirect` | Serve both HTTP and HTTPS without redirecting. This is the default |
| `--boot-delay <0-120>` | Seconds a client waits before its first DHCP attempt, for switches slow to come out of STP or port power-save. `0` writes no delay. Any non-zero value gives BIOS clients exactly ten seconds, because that is the only pre-built BIOS binary |
| `--no-public-web-cert`, `--no-rebuild-ipxe-with-my-ca` | Undo the corresponding option |

>[!important] `-S` no longer means what it used to
>Before 1.6 `-S`/`--force-https` decided three unrelated things at once: the
>protocol FOG used for its own URLs, the redirect, and whether iPXE was
>recompiled. It now means **only** the redirect, which is what its help text
>always said. The other two are `--install-mode` and
>`--rebuild-ipxe-with-my-ca`.

>[!warning] HTTPS netboot needs `FOG_WEB_HOST` set to the certificate's name
>The boot script the installer writes uses the server's hostname, but FOG
>rebuilds every later boot URL from the `FOG_WEB_HOST` setting in the web
>interface — which holds the server's **IP address** unless you change it. On
>`public-cert` or `embed-ca`, set it to the same FQDN the certificate is issued
>to, or every fetch after the first fails iPXE's name check.

## The full option list

```
Usage: ./installfog.sh [-h?odEUHSCKYyXTFl] [-f <filename>] [-N <databasename>]
                [-D </directory/to/document/root/>] [-c <ssl-path>]
                [-W <webroot/to/fog/after/docroot/>] [-B </backup/path/>]
                [-s <192.168.1.10>] [-e <192.168.1.254>]
        -h -? --help                    Display this info
        -o    --oldcopy                 Copy back old data
        -d    --no-defaults             Don't guess defaults
        -U    --no-upgrade              Don't attempt to upgrade
        -H    --no-htmldoc              No htmldoc, means no PDFs
              --install-mode            Preset for the four settings below.
                                                standard (default): HTTPS web UI, HTTP
                                                  netboot, no redirect, no rebuild
                                                http-only: plain HTTP everywhere
                                                public-cert: a publicly-trusted cert, so
                                                  netboot can use HTTPS with no rebuild
                                                embed-ca: rebuild iPXE with your CA
                                                  (adds 10-25 min and a Secure Boot step)
        -S    --force-https             Force the HTTP->HTTPS redirect
              --https-redirect            (same thing, clearer name)
              --no-force-https          Undo --force-https: serve both HTTP and
              --no-https-redirect                       HTTPS without redirecting
              --public-web-cert         The web certificate chains to a PUBLIC
                                                root, so iPXE can validate it without
                                                a rebuild. Needs an FQDN, not an IP
              --no-public-web-cert      Undo --public-web-cert
              --rebuild-ipxe-with-my-ca Rebuild iPXE embedding the
                                                configured CA. Slow, and the
                                                result is not upstream's signed
                                                binary, so its MOK must be
                                                enrolled before a client netboots
              --no-rebuild-ipxe-with-my-ca      Undo the above
              --netboot-proto           http or https: the protocol iPXE uses to
              --boot-delay              seconds to sleep before the first DHCP
                                        attempt, for switches slow out of STP or
                                        powersave. 0 (default) writes no sleep.
                                                fetch boot.php. Defaults to http, and
                                                to https when the certificate is public
                                                or iPXE was rebuilt with your CA
        -C    --recreate-CA             Recreate the CA Keys
                                                Implies --recreate-keys below, and
                                                re-anchors what fog-client pins
        -K    --recreate-keys           Recreate the SSL Keys
                                                Replaces the client communication
                                                keypair. EVERY registered fog-client
                                                must then be reinstalled or re-pinned
              --external-ca             Sign FOG's server certificate with an
                                                existing external/intermediate CA instead
                                                of generating a self-signed CA
              --ca-cert                 Path to the intermediate CA certificate (PEM)
              --ca-key                  Path to the intermediate CA private key (PEM)
              --ca-root                 Path to the root CA certificate (PEM)
        -Y -y --autoaccept              Auto accept defaults and install
        -f    --file                    Use different update file
        -c    --ssl-path                Specify the ssl path
                                                defaults to /opt/fog/snapins/ssl
        -D    --docroot                 Specify the Apache Docroot for fog
                                                defaults to OS DocumentRoot
        -W    --webroot                 Specify the web root url want fog to use
                                                (E.G. http://127.0.0.1/fog,
                                                      http://127.0.0.1/)
                                                Defaults to /fog/
              --fogprogramdir           Specify the FOG base directory
                                                defaults to /opt/fog
                                                remembered in /etc/fog/fog.conf, so it
                                                only needs giving on a first install
              --hostname                Override the vhost/cert hostname
                                        defaults to `hostname -f`, remembered in .fogsettings
              --extra-server-name       Add an extra vhost/cert name (repeatable)
                                        alongside the primary hostname and detected IPs
              --internal-domain         Permit this domain in the Web and Secure Boot
                                                CAs' name constraints (repeatable). The server's
                                                own domain is always permitted
              --internal-subnet         Restrict those CAs to this subnet, e.g.
                                                10.20.30.0/24 (repeatable). REPLACES the default
                                                of all RFC1918 ranges
              --web-ca-cert/-key/-root  Bring your own CA for the WEB zone only
                                                (equivalent to --external-ca --ca-*)
              --secureboot-ca-cert      Your own SECURE BOOT intermediate: the
                                                certificate enrolled in firmware. Pair it with
                                                --secure-boot-key/--secure-boot-cert, which name
                                                the code-signing leaf issued from it. Rotate the
                                                leaf freely; the enrolled CA never changes
              --kernel-backup-count     How many prior kernel/init generations to
                                        keep (default 3). Restore one with
                                        bin/restorekernel.sh. See
                                        docs/SUPPORTED_CUSTOMIZATIONS.md
              --restore-kernel-backup   Also restore the previous kernel/init set
                                        this run. Used by updatefog.sh when reverting;
                                        not normally passed by hand
        -N    --mysqldbname             Specify the FOG database name
                                                defaults to fog
        -B    --backuppath              Specify the backup path
              --uninstall               Uninstall FOG. Removes FOG's own files,
                                                services and config, and restores the
                                                files FOG replaced. Your database,
                                                images, snapins, SSL CA and the fog
                                                account are KEPT unless purged below.
                                                Packages are never removed.
              --dry-run                 With --uninstall, list what would be
                                                removed and exit without changing anything
              --force                   With --uninstall, skip the typed
                                                confirmation (-Y does NOT skip it)
              --purge-db                Also drop the FOG database
              --purge-images            Also delete the image storage
              --purge-snapins           Also delete the snapins
              --purge-ssl               Also delete the SSL CA. This permanently
                                                breaks every deployed fog-client
              --purge-user              Also delete the fog Linux account
              --purge-all               All of the --purge-* options above
        -s    --startrange              DHCP Start range
        -e    --endrange                DHCP End range
        -E    --no-exportbuild          Skip building nfs file
        -X    --exitFail                Do not exit if item fails
        -T    --no-tftpbuild            Do not rebuild the tftpd config file
        -F    --no-vhost                Do not touch the vhost file at all. FOG
                                                normally rewrites only the region between its
                                                MANAGED BLOCK markers and leaves your own
                                                additions alone, so skipping also skips its
                                                security fixes to the parts it owns.
                                                See docs/SUPPORTED_CUSTOMIZATIONS.md
        -l    --list-packages           List of the basic packages FOG needs for install or is currently installed for FOG
              --secure-boot-key         Private key used to re-sign the FOS
                                                kernels for UEFI Secure Boot
              --secure-boot-cert        Certificate matching --secure-boot-key
                                                        (both are required together)
              --no-secure-boot          Do not publish Secure Boot ENROLMENT
                                                material: no MOK.der, no PK/KEK/db.auth,
                                                and no 'Enroll Secure Boot Key' menu
                                                entry. Binaries are still signed -- a
                                                signature is inert with Secure Boot off
```

The `--uninstall`, `--dry-run`, `--force` and `--purge-*` options are
covered in detail in [[uninstall-fog-server|Uninstalling the Fog server]].

>[!note] Two flags were removed in 1.6
>`--no-ca-trust` and `--no-sb-name-constraints` are gone, along with the
>settings behind them. Both were opt-outs that put the safe answer behind a flag
>nobody passes until something has already broken — see
>[[installation/server/command-line-options#Certificate options|Certificate options]] and
>[[installation/server/command-line-options#Name constraints|Name constraints]]. Passing either is
>now an unrecognized option.

## Certificate options

FOG generates its own Certificate Authority at install time and uses it to sign
this server's HTTPS certificate. These options change **which** CA does that
signing.

| Option | Use it when |
| --- | --- |
| *(none)* | The default. FOG generates a CA and a Web CA beneath it, and signs the vhost certificate from that. |
| `--web-ca-cert` + `--web-ca-key` + `--web-ca-root` | You want this server's HTTPS certificate signed by a CA **you** supply — your enterprise PKI, an internal ACME CA, or one issued by another FOG server. All three are required together. |
| `--external-ca` with `--ca-cert`/`--ca-key`/`--ca-root` | The older spelling of the same thing. It targets the same zone, which is what it has always effectively meant. |

Passing any one of `--web-ca-*` implies `--external-ca`, so you do not need
both. You supply the files **once** — they are imported and later upgrades
reuse the import without the flags.

All three are validated before anything is changed: the key must match the
certificate, the certificate must be a CA (`basicConstraints CA:TRUE`), and it
must verify against the root you supply. Any failure stops the install rather
than producing a server signed by the wrong thing.

>[!note] Both spellings now write one run-scoped input
>Before 1.6 these were six persisted settings holding three values — three from
>the prompt and three from the flags — resolved one against the other. That is
>what silently discarded anything typed at the prompt whenever the flags were
>also given, and made the flags appear to work *only* under `-y`. There is one
>set of import paths now, written by either spelling and by the prompt, and the
>canonical `PKI_web_ca_*` slots are set once the import validates.

>[!info] This does not affect fog-client
>`--web-ca-*` replaces the CA that signs the **web** certificate and nothing
>else. The root that fog-client pinned at registration is untouched, which is
>what makes this safe to do on a running fleet without re-registering a single
>machine.

### Name constraints

FOG restricts the Web CA to a set of permitted names, so a compromised CA
cannot issue for the whole internet.

| Option | What it does |
| --- | --- |
| `--internal-domain <domain>` | Permit this domain in the Web CA's constraints, and add it to the certificate and the vhost `ServerAlias`. Repeatable. The server's own domain is always permitted |
| `--internal-subnet <cidr>` | Restrict the Web CA to this subnet. Repeatable, and it **replaces** the default of all private ranges rather than adding to it |

>[!important] Constraints are fixed when a CA is first created
>FOG never re-mints an existing authority, so changing these on a server that
>already has one does nothing until you remove the intermediate as well.

>[!warning] A CA you supply must constrain only by DNS name or IP address
>iPXE enforces name constraints, and only understands `dNSName` and
>`iPAddress` permitted subtrees. A CA carrying any other subtree type — or any
>`minimum`/`maximum` — **fails to parse**, and the whole chain with it. Leave
>your intermediate unconstrained or constrain it with those two only. This
>matters only when netboot is on HTTPS.

>[!note] The Secure Boot zone gets no constraints at all
>`--no-sb-name-constraints` is gone because there is nothing left to turn off.
>See [[installation/server/command-line-options#Secure Boot options|Secure Boot options]].

### The local trust store

The installer adds this server's own CA to this server's system trust store, so
`curl`, `wget` and PHP's stream wrapper on the FOG server can verify the FOG
server without being handed a CA file each time. The store is detected from the
host — `/etc/pki/ca-trust/source/anchors` on the RHEL family,
`/usr/local/share/ca-certificates` on Debian/Ubuntu/Alpine,
`/etc/ca-certificates/trust-source/anchors` on Arch.

This is unconditional since 1.6. `--no-ca-trust` used to skip it, and was
removed with the setting behind it: declining it left a server that could not
verify its own certificate, with the failures surfacing far from the flag that
caused them.

>[!warning] This does not make your browser stop warning
>Firefox keeps its own certificate store and Chrome reads a per-user one, so
>neither consults what this writes — and your browser is usually on a different
>machine entirely. Import the CA into the browser yourself; it is published at
>`https://<your-fog-server>/fog/management/other/ca.cert.der`.

For the per-zone mechanism in full see
[[kb/reference/bringing-your-own-ca|Bringing your own CA]]. To point **several** FOG servers
at a single CA so one import covers all of them, see
[[unify-certificates-across-fog-servers|Unifying certificates across several FOG servers]].

### Recreating certificates

| Option | What it does |
| --- | --- |
| `-C`, `--recreate-CA` | Recreate the CA keys. Implies `--recreate-keys`, and re-anchors what fog-client pins |
| `-K`, `--recreate-keys` | Recreate the SSL keys. Replaces the client communication keypair, so **every registered fog-client must then be reinstalled or re-pinned** |

Neither touches Secure Boot material — see below for why.

## Secure Boot options

Since FOG 1.6.0 the installer **generates Secure Boot signing material by
default** and signs the FOS kernels with it, so a stock server always has a
certificate fingerprint to check and an enrollment kit to hand out.

FOG creates a Secure Boot **certificate authority** and enrols that, then
issues a separate **signing certificate** beneath it. Because firmware trusts
the issuer, the signing material can be rotated without a second trip to every
machine.

| Option | Use it when |
| --- | --- |
| *(none)* | The default. The material is generated on first install and **reused, never regenerated**, on every later upgrade. |
| `--secure-boot-key` + `--secure-boot-cert` | You already have a signing key you want FOG to use. Both are required together; the certificate may be PEM or DER. Your key is never overwritten. |
| `--secureboot-ca-cert` | You are supplying your own Secure Boot **intermediate** — the certificate enrolled in firmware. Pair it with the two above, which then name the code-signing certificate issued from it. |
| `--no-secure-boot` | You do not want enrollment material published: no `MOK.der`, no `PK`/`KEK`/`db.auth`, and no "Enroll Secure Boot Key" menu entry. |

>[!note] `--no-secure-boot` declines enrollment, not signing
>Binaries are still signed. A signature is inert on a machine with Secure Boot
>off, so signing costs nothing; what the option turns off is publishing the
>material a client would enrol.

`--no-secure-boot` is remembered in `.fogsettings`, so an upgrade will not
hand back a key and a `sudoers` rule you deliberately declined.

>[!warning] The signing key is never regenerated on its own, and that is deliberate
>A new signing key silently invalidates enrollment on **every machine that
>already trusted the old one**, and nothing reports that until a client fails
>to boot — long after the install that caused it. So re-running the installer
>reuses what is already there, and `--recreate-keys` does not reach the Secure
>Boot zone.
>
>**`--recreate-CA` does.** It removes the root CA and every intermediate
>beneath it, this zone included — an intermediate orphaned by a new root would
>chain to nothing — so the Secure Boot authority comes back as a *different*
>certificate and every enrolled machine has to enroll again. Do not reach for
>that flag to fix an unrelated web-certificate problem on a server with Secure
>Boot clients.
>
>To rotate on purpose, remove only what you mean to: `leaf/` to re-issue the
>signing certificate with no client-side work, or the whole
>`/opt/fog/pki/secureboot/` tree to mint a new authority and re-enroll
>everything. Then re-run the installer.

>[!tip] Migrating this server?
>Copy `/opt/fog/pki/` forward, or already-enrolled clients need enrolling a
>second time for no reason — see
>[[installation/server/migrating-fog-server#migrating-the-secure-boot-signing-material|Migrating the Secure Boot signing material]].

The material lives under `/opt/fog/pki/secureboot/`: the enrolled authority in
`ca/` and the signing certificate in `leaf/sign.{key,pem}`, private keys `0600`
inside a directory owned by root. Nothing there is copied into the web root and
the web server cannot read it — see
[[kb/how-tos/secure-boot-signing|Secure Boot: signing FOS with your own key]] for the
full procedure and for what to do on each client, and
[[kb/reference/pki-zones|FOG PKI Infrastructure]] for the layout.

## Kernel backups

| Option | What it does |
| --- | --- |
| `--kernel-backup-count <n>` | How many prior kernel and init generations to keep. Default 3. Restore one with `bin/restorekernel.sh` |
| `--restore-kernel-backup` | Also restore the previous kernel and init set on this run. Used by `updatefog.sh` when reverting; not normally passed by hand |

## See also

- [[kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]] — what the install modes mean
- [[management/server/install-fogsettings|The .fogsettings file]] — where these options are remembered
- [[installation/server/install-fog-server|Installing the FOG server]]
- [[installation/network-setup/dhcp-server-settings|DHCP server settings]] — where `--boot-delay` shows up on the client
