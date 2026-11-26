---
title: IPv6-Only Client Stops After default.ipxe — Network unreachable
aliases:
    - IPv6-Only Client Stops After default.ipxe — Network unreachable
    - default.ipxe chains to the IPv4 address
description: On an IPv6-only segment, iPXE loads default.ipxe and then cannot reach boot.php at the server's IPv4 address
context_id: ipv6-ipxe-cannot-reach-boot-php
tags:
    - troubleshooting
    - ipxe
    - ipv6
---

# IPv6-Only Client Stops After default.ipxe — Network unreachable

>[!info] FOG 1.6 and later
>The installer on `dev-branch` fixes this (FOGProject/fogproject#2173). Run the installer again to rewrite `default.ipxe`.

## Symptom

The client boots iPXE over IPv6 and loads `default.ipxe`. iPXE then fails to load the boot menu from the server's IPv4 address:

```
http://192.168.0.1/fog/service/ipxe/boot.php... Network unreachable
```

## Cause

The installer wrote one chain line in `default.ipxe`, to the server's IPv4 address. A client with only an IPv6 address cannot reach it. This applies when netboot uses HTTP. HTTPS netboot uses the server's host name and is not affected.

## Fix

Run the installer again. When the server has an IPv6 address, `default.ipxe` now chains to the IPv4 address only if iPXE has an IPv4 address. Otherwise it chains to the IPv6 address. A server with no IPv6 address gets the same file as before.

After `default.ipxe`, the boot menu uses `FOG_WEB_HOST` for the next steps. On an IPv6-only segment, set `FOG_WEB_HOST` to a name with an AAAA record, or to the IPv6 address.

## Workaround for older installs

Edit the last line of `/tftpboot/default.ipxe`. Replace the chain line with one line like this, with your own addresses:

```
isset ${ip} && chain http://192.168.0.1/fog/service/ipxe/boot.php##params || chain http://[fd71:6a85:f038:1::1]/fog/service/ipxe/boot.php##params
```

Keep it on one line. iPXE does not continue `||` on the next line. The installer rewrites this file on each run, so the edit is lost on the next install.

See also [[kb/how-tos/ipv6-network-boot|Boot FOG over IPv6]].
