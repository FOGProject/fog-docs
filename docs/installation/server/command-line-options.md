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
              --no-secure-boot    Do not generate a Secure Boot signing
                                  key, and leave the FOS kernels unsigned

The `--uninstall`, `--dry-run`, `--force` and `--purge-*` options are
covered in detail in [Uninstalling the Fog server](uninstall-fog-server.md).

## Secure Boot options

Since FOG 1.6.0 the installer **generates a Secure Boot signing key by
default** and signs the FOS kernels with it, so a stock server always has a
certificate fingerprint to check and an enrolment kit to hand out. The three
options above only matter if you want to change that:

| Option | Use it when |
| --- | --- |
| *(none)* | The default. A key is generated at `/opt/fog/secureboot/` on first install and **reused, never regenerated**, on every later upgrade. |
| `--secure-boot-key` + `--secure-boot-cert` | You already have a signing key you want FOG to use. Both are required together; the certificate may be PEM or DER. Your key is never overwritten. |
| `--no-secure-boot` | You do not want a signing key or the root-only signing helper on this server. The FOS kernels are left unsigned. |

`--no-secure-boot` is remembered in `.fogsettings`, so an upgrade will not
hand back a key and a `sudoers` rule you deliberately declined.

>[!warning] The generated key is never regenerated, and that is deliberate
>A new signing key silently invalidates enrolment on **every machine that
>already trusted the old one**, and nothing reports that until a client fails
>to boot — long after the install that caused it. `--recreate-keys` and
>`--recreate-CA` deliberately do not touch it. To rotate deliberately, remove
>`/opt/fog/secureboot/` and re-run the installer, then re-enrol every client.

The private key lives at `/opt/fog/secureboot/MOK.key`, `0600` inside a `0700`
directory owned by root. It is never copied into the web root and the web
server cannot read it — see
[[secure-boot-signing|Secure Boot: signing FOS with your own key]] for the
full procedure and for what to do on each client.
