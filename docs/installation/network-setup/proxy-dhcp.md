---
title: Proxy DHCP with dnsmasq
description: The dnsmasq boot file names match across versions — Secure Boot behaviour under HTTPS does not
context_id: proxy-dhcp-versions
tags:
    - version-chooser
    - pxe
    - ipxe
    - dhcp
    - proxy
    - proxy-dhcp
    - option-66
    - option-67
    - advanced-configuration
    - network
    - network-config
---

# Proxy DHCP with dnsmasq

The boot file names below, including the signed Secure Boot chain, are the same
on both versions since their iPXE binaries come from the same release
packaging. Two things genuinely differ on 1.5: how the UEFI boot script reaches
the client for FOG's own non-Secure-Boot builds, and that **Secure Boot is
unavailable once HTTPS is turned on**.

- [[1.6/installation/network-setup/proxy-dhcp|Proxy DHCP with dnsmasq (1.6)]]
- [[1.5/installation/network-setup/proxy-dhcp|Proxy DHCP with dnsmasq (1.5)]]

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.
