---
title: Boot FOG over IPv6
aliases:
    - Boot FOG over IPv6
    - IPv6 PXE
    - IPv6 network boot
description: What the network must provide for a client to boot FOG over IPv6, and what the FOG installer does for IPv6
context_id: ipv6-network-boot
tags:
    - how-to
    - pxe
    - ipxe
    - ipv6
    - dhcp
    - certificates
    - 1_6-changes
---

# Boot FOG over IPv6

>[!info] FOG 1.6 and later
>This page applies to FOG 1.6 and later. FOG 1.5 does not support IPv6 network boot.

A UEFI client can boot FOG over an IPv6 network. The installer prepares the FOG server for it. The network must supply the rest.

If a Secure Boot client waits for DHCP or stops on the wrong NIC, read [[secure-boot-dhcp-ipv6-router-advertisement|Secure Boot Client Stops on the Wrong NIC or Waits for DHCP]].

## What the network must provide

Two services must run on the client network.

- **Router advertisements.** Use `radvd` or the router. FOG does not send them.
- **DHCPv6 with the boot file URL.** The server sends the URL in option 59.

You have two choices for DHCPv6.

- Use FOG's own server. Pass `--dhcp6-range START,END` to the installer. See [[1.6/installation/server/command-line-options|Fog installer command line options]].
- Use the DHCPv6 server of your site. Configure it to send option 59.

The `--dhcp6-range` option writes `/etc/kea/kea-dhcp6.conf`. The server needs an IPv6 address in the same /64 as the range. The installer opens 547/udp. The configuration sends no DNS servers.

## Name the FOG server in DNS

Give the FOG server and each storage node a DNS name. Add an A record and an AAAA record for each name. Use that name as the server address in FOG.

A literal IPv6 address also works. The name is recommended. It survives an address change, and it works for IPv4 clients.

## The web certificate

A new install creates the FOG Web CA with IPv6 coverage. The installer adds the IPv6 addresses of the server to the web certificate. These are the global and ULA addresses of the interface.

The FOG Web CA permits the /64 of each server address. An address change inside one /64 needs no new CA.

## Upgrading a server that gains IPv6

By default, an upgrade leaves the Web CA alone. The IPv6 addresses that the CA does not cover stay off the web certificate. The installer prints a message about this.

Boot by DNS name works without those addresses. This is the recommended way. See [[#Name the FOG server in DNS]].

Only a client that reaches FOG by a literal IPv6 address needs the addresses in the certificate. To add them, run the installer once with `--reissue-web-ca`. See [[1.6/installation/server/command-line-options|Fog installer command line options]].

The installer re-issues the Web CA. It keeps the same root and the same key. The installer keeps the old certificate as `.fogWebCA.pem.<timestamp>`. The installer does not save the option. Add it to each run that must re-issue the CA.

iPXE trusts the Web CA certificate itself. So the re-issue changes what iPXE must trust. Do these steps:

- Rebuild any USB or ESP boot media that you made from an older kit.
- Re-run the installer on each storage node that builds its own iPXE.

The installer rebuilds the iPXE of the server in the same run.

The root CA key can be offline. Then the installer cannot re-issue the CA. It prints a message. The certificate still verifies. Restore the key first, and run the installer again with `--reissue-web-ca`.

The installer never re-issues a CA that an admin supplied. With the option, it prints a message.

A server with no IPv6 address gets the same configuration as before. It gets no re-issue and no iPXE rebuild.

## Web and FTP services

- nginx listens on IPv6 on ports 80 and 443.
- vsftpd listens on IPv6 only when `net.ipv6.bindv6only` is `0`.

## FOS

The boot menu adds `ipv6boot=1` to the FOS kernel arguments. It does this when the client reached the FOG server over IPv6. FOS then brings up IPv6.

>[!warning] Needs a FOS release with IPv6 support
>The FOS support is pending. Until a FOS release has it, the client boots iPXE over IPv6, and FOS does not use IPv6.

## Not supported yet

- Multicast over IPv6.
- Legacy BIOS PXE over IPv6.
