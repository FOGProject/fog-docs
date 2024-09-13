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
change the default PXE boot file or web root directory.

    ./installfog.sh --help
    Usage: ./installfog.sh [-h?dEUuHSCKYXTFA] [-f <filename>] [-N <databasename>]
            [-D </directory/to/document/root/>] [-c <ssl-path>]
            [-W <webroot/to/fog/after/docroot/>] [-B </backup/path/>]
            [-s <192.168.1.10>] [-e <192.168.1.254>] [-b <undionly.kpxe>]
        -h -? --help            Display this info
        -o    --oldcopy         Copy back old data
        -d    --no-defaults     Don't guess defaults
        -U    --no-upgrade      Don't attempt to upgrade
        -H    --no-htmldoc      No htmldoc, means no PDFs
        -S    --force-https     Force HTTPS for all comunication
        -C    --recreate-CA     Recreate the CA Keys
        -K    --recreate-keys   Recreate the SSL Keys
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
        -B    --backuppath      Specify the backup path
              --uninstall       Uninstall FOG
        -s    --startrange      DHCP Start range
        -e    --endrange        DHCP End range
        -b    --bootfile        DHCP Boot file
        -E    --no-exportbuild  Skip building nfs file
        -X    --exitFail        Do not exit if item fails
        -T    --no-tftpbuild    Do not rebuild the tftpd config file
        -F    --no-vhost        Do not overwrite vhost file
        -l    --list-packages		List of the basic packages FOG needs for install or is currently installed for FOG
