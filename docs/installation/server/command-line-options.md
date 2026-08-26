---
title: Fog installer command line options
aliases:
    - Fog installer command line options
description: Fog installer command line options
context_id: command-line-options
tags:
    - in-progress
    - updating-content
    - installation
    - fog-server
---


# Fog installer command line options

The FOG installer has quite a few command line options. See the output
below. You might want force FOG to setup the web interface via HTTPS,
change the web root directory, or install to a non-default location.

    ./installfog.sh --help
    Usage: ./installfog.sh [-h?odEUHSCKYyXTFl] [-f <filename>] [-N <databasename>]
            [-D </directory/to/document/root/>] [-c <ssl-path>]
            [-W <webroot/to/fog/after/docroot/>] [-B </backup/path/>]
            [-s <192.168.1.10>] [-e <192.168.1.254>]
        -h -? --help            Display this info
        -o    --oldcopy         Copy back old data
        -d    --no-defaults     Don't guess defaults
        -U    --no-upgrade      Don't attempt to upgrade
        -H    --no-htmldoc      No htmldoc, means no PDFs
        -S    --force-https     Force HTTPS for all comunication
        -C    --recreate-CA     Recreate the CA Keys
        -K    --recreate-keys   Recreate the SSL Keys
              --external-ca     Sign FOG's server certificate with an
                                existing external/intermediate CA instead
                                of generating a self-signed CA
              --ca-cert         Path to the intermediate CA certificate (PEM)
              --ca-key          Path to the intermediate CA private key (PEM)
              --ca-root         Path to the root CA certificate (PEM)
              --web-ca-cert     Bring your own CA for the WEB zone: the
                                intermediate that signs this server's
                                vhost certificate
              --web-ca-key      Private key matching --web-ca-cert
              --web-ca-root     Root certificate --web-ca-cert chains to
                                (all three are required together)
        -Y -y --autoaccept      Auto accept defaults and install
        -f    --file            Use different update file
        -c    --ssl-path        Specify the ssl path
                                defaults to /opt/fog/snapins/ssl
        -D    --docroot         Specify the Apache Docroot for fog
                                defaults to OS DocumentRoot
        -W    --webroot         Specify the web root url want fog to use
                                (E.G. http://127.0.0.1/fog,
                                      http://127.0.0.1/)
                                Defaults to /fog/
              --fogprogramdir   Specify the FOG base directory
                                defaults to /opt/fog
                                remembered in /etc/fog/fog.conf, so it
                                only needs giving on a first install
        -N    --mysqldbname     Specify the FOG database name
                                defaults to fog
        -B    --backuppath      Specify the backup path
              --uninstall       Uninstall FOG. Removes FOG's own files,
                                services and config, and restores the
                                files FOG replaced. Your database,
                                images, snapins, SSL CA and the fog
                                account are KEPT unless purged below.
                                Packages are never removed.
              --dry-run         With --uninstall, list what would be
                                removed and exit without changing anything
              --force           With --uninstall, skip the typed
                                confirmation (-Y does NOT skip it)
              --purge-db        Also drop the FOG database
              --purge-images    Also delete the image storage
              --purge-snapins   Also delete the snapins
              --purge-ssl       Also delete the SSL CA. This permanently
                                breaks every deployed fog-client
              --purge-user      Also delete the fog Linux account
              --purge-all       All of the --purge-* options above
        -s    --startrange      DHCP Start range
        -e    --endrange        DHCP End range
        -E    --no-exportbuild  Skip building nfs file
        -X    --exitFail        Do not exit if item fails
        -T    --no-tftpbuild    Do not rebuild the tftpd config file
        -F    --no-vhost        Do not overwrite vhost file
        -l    --list-packages   List of the basic packages FOG needs for install or is currently installed for FOG
              --secure-boot-key   Private key used to re-sign the FOS
                                  kernels for UEFI Secure Boot
              --secure-boot-cert  Certificate matching --secure-boot-key
                                  (both are required together)
              --secureboot-ca-cert  Your own Secure Boot intermediate: the
                                  certificate enrolled in firmware. Pair it
                                  with --secure-boot-key/--secure-boot-cert,
                                  which name the code-signing leaf issued
                                  from it
              --no-secure-boot    Do not publish Secure Boot enrollment
                                  material: no MOK.der, no PK/KEK/db.auth,
                                  and no 'Enroll Secure Boot Key' menu entry.
                                  Binaries are still signed
              --no-ca-trust       Do not add this server's CA to this
                                  server's own system trust store

The `--uninstall`, `--dry-run`, `--force` and `--purge-*` options are
covered in detail in [Uninstalling the Fog server](uninstall-fog-server.md).

## Certificate options

FOG generates its own Certificate Authority at install time and uses it to sign
this server's HTTPS certificate. These options change **which** CA does that
signing, and whether this server trusts the result locally.

| Option | Use it when |
| --- | --- |
| *(none)* | The default. FOG generates a CA and a Web CA beneath it, and signs the vhost certificate from that. |
| `--web-ca-cert` + `--web-ca-key` + `--web-ca-root` | You want this server's HTTPS certificate signed by a CA **you** supply — your enterprise PKI, an internal ACME CA, or one issued by another FOG server. All three are required together. |
| `--external-ca` with `--ca-cert`/`--ca-key`/`--ca-root` | The older spelling of the same thing. It targets the same zone, which is what it has always effectively meant. |
| `--no-ca-trust` | You do **not** want the installer adding this server's CA to this server's own system trust store. |

Passing any one of `--web-ca-*` implies `--external-ca`, so you do not need
both. You supply the files **once** — they are imported and later upgrades
reuse the import without the flags.

All three are validated before anything is changed: the key must match the
certificate, the certificate must be a CA (`basicConstraints CA:TRUE`), and it
must verify against the root you supply. Any failure stops the install rather
than producing a server signed by the wrong thing.

>[!info] This does not affect fog-client
>`--web-ca-*` replaces the CA that signs the **web** certificate and nothing
>else. The root that fog-client pinned at registration is untouched, which is
>what makes this safe to do on a running fleet without re-registering a single
>machine.

### `--no-ca-trust` and the local trust store

By default the installer adds this server's own CA to this server's system
trust store, so `curl`, `wget` and PHP's stream wrapper on the FOG server can
verify the FOG server without being handed a CA file each time. The store is
detected from the host — `/etc/pki/ca-trust/source/anchors` on the RHEL family,
`/usr/local/share/ca-certificates` on Debian/Ubuntu/Alpine,
`/etc/ca-certificates/trust-source/anchors` on Arch.

`--no-ca-trust` skips it, and is remembered in `.fogsettings` so an upgrade
does not quietly reverse the decision.

>[!warning] This does not make your browser stop warning
>Firefox keeps its own certificate store and Chrome reads a per-user one, so
>neither consults what this writes — and your browser is usually on a different
>machine entirely. Import the CA into the browser yourself; it is published at
>`https://<your-fog-server>/fog/management/other/ca.cert.der`.

For the per-zone mechanism in full see
[[bringing-your-own-ca|Bringing your own CA]]. To point **several** FOG servers
at a single CA so one import covers all of them, see
[[unify-certificates-across-fog-servers|Unifying certificates across several FOG servers]].

## Secure Boot options

Since FOG 1.6.0 the installer **generates Secure Boot signing material by
default** and signs the FOS kernels with it, so a stock server always has a
certificate fingerprint to check and an enrollment kit to hand out. The options
above only matter if you want to change that:

| Option | Use it when |
| --- | --- |
| *(none)* | The default. A Secure Boot CA and a signing leaf are generated under `/opt/fog/pki/secureboot/` on first install and **reused, never regenerated**, on every later upgrade. |
| `--secure-boot-key` + `--secure-boot-cert` | You have a code-signing **leaf** you want FOG to sign kernels with. Both are required together; the certificate may be PEM or DER. Your key is never overwritten. |
| `--secureboot-ca-cert` | You want your own **enrolled** certificate — the one that goes into firmware — rather than FOG's generated CA. Pair it with the two options above, which name the leaf issued from it. Rotating the leaf then needs no re-enrollment. |
| `--no-secure-boot` | You do not want this server publishing **enrollment** material. |

>[!warning] `--no-secure-boot` does not turn signing off
>It declines *enrollment*, not *signing*. With it set there is no `MOK.der`, no
>`PK`/`KEK`/`db.auth` blobs and no **Enroll Secure Boot Key** boot-menu entry —
>but the Secure Boot CA is still minted and the FOS kernels are still signed.
>That is deliberate: a signature is inert on a machine with Secure Boot off, so
>signing costs nothing, while enrollment material is a decision.
>
>Earlier releases behaved as the name suggests and left the kernels unsigned.
>If you are relying on that, check the fingerprint on
>**FOG Configuration → Secure Boot** rather than assuming.

`--no-secure-boot` is remembered in `.fogsettings` (as `PKI_sb_enabled`), so an
upgrade will not hand back enrollment material you deliberately declined.

The two certificates are not the same thing, and this is the distinction that
matters when something has to be rotated:

| Path | What it is | If it changes |
| --- | --- | --- |
| `/opt/fog/pki/secureboot/ca/.fogSBCA.{key,pem,der}` | The Secure Boot CA — published as `MOK.der`, and the thing enrolled in firmware | **Every already-enrolled machine must be re-enrolled** |
| `/opt/fog/pki/secureboot/leaf/sign.{key,pem}` | The code-signing leaf, issued by that CA — what actually signs kernels day to day | Nothing to re-enroll; clients trust the CA above it |

Both private keys are `0600` inside a `0700` directory owned by root. Neither is
ever copied into the web root, and the web server cannot read them.

>[!warning] `--recreate-CA` destroys the Secure Boot CA
>It removes the root CA and **every intermediate beneath it, the Secure Boot
>zone included** — because an intermediate orphaned by a new root would produce
>chains that verify against nothing. The Secure Boot CA is then re-issued as a
>*different* certificate, so every machine that enrolled the old one must enroll
>again, and nothing reports that until a client fails to boot.
>
>`--recreate-keys` is narrower and does **not** reach the Secure Boot zone.
>
>To rotate on purpose, remove only what you mean to: the `leaf/` directory to
>re-issue the signing key with no client-side work, or the whole
>`/opt/fog/pki/secureboot/` tree to mint a new CA and re-enroll everything. Then
>re-run the installer.

Migrating this server? Copy `/opt/fog/pki/` forward, or already-enrolled clients
need enrolling a second time for no reason — see
[[migrating-fog-server#migrating-the-secure-boot-signing-material|Migrating the Secure Boot signing material]].

For the full procedure and what to do on each client, see
[[secure-boot-signing|Secure Boot: signing FOS with your own key]],
[[secure-boot-netboot|Moving to Secure Boot]] for the two-step version, and
[[bringing-your-own-ca#secure-boot-zone|Bringing your own CA]] for the
`--secureboot-ca-cert` recipe.

>[!note] Pre-PKI installs
>A server first installed before FOG's PKI zones existed has a flat
>`/opt/fog/secureboot/` holding `MOK.key`/`MOK.pem`. The installer migrates it
>into the zone tree above and leaves the old files untouched, so both paths may
>exist — the ones under `pki/` are the live ones. See
>[[pki-zones|FOG PKI Infrastructure]].
