---
title: Change FOG Server IP Address
aliases:
    - Change FOG Server IP Address
description: describes how to Change FOG Server IP Address
context_id: change-fog-server-ip-address
tags:
    - in-progress
    - convert-Wiki2MD
    - how-to
    - kb
    - ip-address
    - web-management
    - server-management
---


# Change FOG Server IP Address

## FOG 1.6 with `--server-ip`

Use these steps when `./installfog.sh --help` lists `--server-ip`. That
installer finds the new address itself. Otherwise, use
[[#Older installers|the steps for older installers]].

-   Follow appropriate steps for your Linux distribution to change the
    OS's IP address.
-   Rerun the installer from your FOG source directory:

    ```
    cd bin
    ./installfog.sh
    ```

    The installer sees that the saved address is gone. It shows the old and
    the new address, and asks before it uses the new one. If the server has
    more than one address, choose one with `--server-ip <address>`.
-   If this FOG server is also your DHCP server and the new address is on
    another subnet, the installer asks whether to change the DHCP settings.
    See
    [[1.6/installation/network-setup/dhcp-server-settings#When the FOG server's address changes|DHCP when the address changes]].

The installer then updates, by itself:

-   `NET_fog_server_ip` and `NET_interface` in
    [[1.6/management/server/install-fogsettings|.fogsettings]],
-   this server's record in **Storage Management**, with its ID, group,
    master flag, credentials and paths unchanged,
-   `FOG_TFTP_HOST` and `FOG_WEB_HOST`, each only when it still holds the
    old address. A host name you set there stays,
-   the web server configuration and the boot files,
-   the web certificate, for the new address. A storage node asks the
    master for a new one.

If the new address is outside the ranges the Web CA permits (all private
ranges, or your `--internal-subnet` list), the new certificate does not
verify, and the installer shows a warning. Remove the Web CA directory that
the warning names, then run the installer again. Do not use `--recreate-CA`
for this: it replaces the root CA that your FOG clients trust.

You still update these yourself:

-   Your network's DHCP options 66 and 67, if another DHCP server serves PXE
    clients. See [[1.6/installation/network-setup/dhcp-server-settings|DHCP Server Settings]].
-   Any other FOG server that points at this one. For example, a storage
    node's database host (`DB_host`) is the master's address.
-   Your NFS exports and Apache configuration, if you edited them by hand.
    The installer writes its own.

For an unattended run, add `-y`. With `-y` the installer uses the new address,
but it does not change DHCP unless you also add `--update-dhcp-subnet`.

## Older installers

-   Follow appropriate steps for your Linux distribution to change the
    OS's IP address.
-   Update the ipaddress= field (and other fields if necessary) inside
    the /opt/fog/.fogsettings file [[1.6/management/server/install-fogsettings|.fogsettings]]
-   Rerun the installer, you'll need to use **\--recreate-CA** and
    **\--recreate-keys keys** as the installer provides a certificate
    with a Common Name based on the ip which will be shipped in the iPxe
    kernel and failed to load any https resources as the certificate
    isn't valid anymore.
-   Update the IP address inside `/tftpboot/default.ipxe` (look for the
    chain line i.e
    `chain https://x.x.x.x/fog/service/ipxe/boot.php##params`)
-   Update the IP address for the storage node on the FOG system where
    you changed the IP address Web Interface → Storage Management
-   Update the IP address on a any master storage node that may
    reference this FOG server Web Interface → Storage Management
-   (For master server) Update the FOG_WEB_HOST value Web Interface →
    FOG Configuration → FOG Settings → Web Server → FOG_WEB_HOST
-   (For master server) Update the FOG_TFTP_HOST value Web Interface →
    FOG Configuration → FOG Settings → TFTP Server → FOG_TFTP_HOST

Optionaly if you have configured a dhcpd:

-   Update IP addresses (fog and gateway) inside the
    `/etc/dhcp/dhcpd.conf`.
-   Don't forgot to check your `/etc/export` for nfs server as well as
    your apache2 configuration as the installer override it.
