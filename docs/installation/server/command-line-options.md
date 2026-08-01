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

The `--uninstall`, `--dry-run`, `--force` and `--purge-*` options are
covered in detail in [Uninstalling the Fog server](uninstall-fog-server.md).
