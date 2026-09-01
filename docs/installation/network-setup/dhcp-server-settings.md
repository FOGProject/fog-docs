---
title: DHCP Server Settings
description: The DHCP options are the same on FOG 1.5 and 1.6 — how the UEFI boot script reaches the client is not
context_id: dhcp-server-settings-versions
tags:
    - version-chooser
    - pxe
    - ipxe
    - dhcp
    - proxy
    - option-66
    - option-67
    - network
    - network-config
    - kea
    - isc-dhcp
    - linux
---

# DHCP Server Settings

The boot **file names** you put in option 67 are identical on both versions —
1.5 and 1.6 package the same iPXE binaries, so a `dhcpd.conf` or
`kea-dhcp4.conf` written for one works unchanged on the other. What differs is
how the UEFI boot script reaches the client, and the `--boot-delay` option,
which 1.5 does not have.

- [[1.6/installation/network-setup/dhcp-server-settings|DHCP Server Settings (1.6)]]
- [[1.5/installation/network-setup/dhcp-server-settings|DHCP Server Settings (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
