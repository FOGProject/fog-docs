---
title: Supported Hardware
aliases:
    - Supported Hardware
    - Hardware Compatibility
description: What hardware works with FOG, the areas that commonly need attention, and where to find the community compatibility list
context_id: hardware
tags:
    - hardware
    - compatibility
    - usb-nic
    - uefi
    - reference
---

# Supported Hardware

FOG is broadly compatible with PC hardware. If a machine can PXE boot and run a
modern Linux kernel, it can almost certainly be imaged with FOG. There is no
official "certified hardware" list — instead this page describes the general
picture, the areas that commonly need attention, and where to find the
community-maintained compatibility list.

## General compatibility

-   **Firmware:** both legacy BIOS and UEFI (32- and 64-bit) are supported, as is
    ARM64 UEFI. See [[bios-and-uefi-co-existence|BIOS and UEFI Co-Existence]] if
    you have a mix of firmware types on your network.
-   **Disks and controllers:** SATA, NVMe, and most common storage controllers
    are handled by the FOS kernel.
-   **Network:** most onboard wired NICs work out of the box. Wireless is not used
    for imaging — FOG always images over a wired connection.

The FOS kernel bundles drivers for a very wide range of hardware. When a
brand-new machine isn't recognized, the usual fix is a newer kernel — see
[[manual-kernel-upgrade|Manual Kernel Upgrade]], or [[compile-fos-kernel|Compile
the FOS Kernel]] to build your own.

## Community compatibility list

The most up-to-date, real-world list of what works is maintained by the community
on the forums:

-   [Hardware currently working with FOG (FOG forums)](https://forums.fogproject.org/topic/2987/hardware-currently-working-with-fog-v1-x-x)

## Areas that commonly need attention

### USB-to-Ethernet adapters

Tablets, ultrabooks, and 2-in-1s often have no onboard wired NIC and rely on a
USB-to-Ethernet adapter. Two separate things have to work: the adapter must be
able to **PXE boot**, and the FOS kernel must have a **driver** for it during
imaging.

-   For PXE booting over a USB NIC, FOG ships a dedicated iPXE binary,
    `ncm--ecm--axge.efi`, in `/tftpboot` for the common ASIX/CDC chipsets.
-   The FOS kernel supports many USB NIC chipsets (ASIX AX887xx / AX88179, Realtek
    RTL8152 / RTL8153, and others).

Forum references:

-   [PXE boot with a USB-to-Ethernet adapter](https://forums.fogproject.org/topic/2666/fog-pxe-boot-with-usb-to-ethernet-adapter)
-   [Realtek 8153 USB network adapter](https://forums.fogproject.org/topic/2620/realtek-8153-usb-network-adapter)

### Surface and 2-in-1 tablets

Microsoft Surface and similar tablets are a recurring source of PXE and boot
quirks (firmware boot settings, USB NIC, secure boot). Search the forums for your
exact model — for example:

-   [Surface 3 imaging](https://forums.fogproject.org/topic/6227/surface-3-fails-to-image)

## Reporting hardware

If you get a device working (or get stuck), posting the details on the
[FOG forums](https://forums.fogproject.org/) helps keep the community list above
useful for everyone.
