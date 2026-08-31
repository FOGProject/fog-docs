---
title: "Fog Configuration (1.5)"
aliases:
    - "Fog Configuration (1.5)"
    - "Fog Config (1.5)"
description: FOG Settings on FOG 1.5 — multicast settings, boot image keymap, and the FOG client kernel, with no settings cache and no table scroll-mode toggle
context_id: "config-1.5"
tags:
    - management
    - web-management
    - web-ui
    - config
    - 1_5-legacy
---

# Fog Configuration (1.5)

>[!info] This page describes FOG 1.5.
>See the [[management/web/config|1.6 version]] of this page for FOG 1.6.

## Multicast Settings

The settings under **FOG Settings → Multicast Settings** control how many
multicast sessions may run at the same time, which ports and addresses they
use, and how long a session waits for its clients before it starts
transmitting.

`FOG_MULTICAST_PORT_OVERRIDE` is a comma separated pool of base ports, and
**each port in the list is one session that can run concurrently**. A
single port still works and behaves as a pool of one.

These are documented in full on the
[[1.5/management/web/multicast|Multicast Sessions]] page.

## Table rendering: no scroll-mode setting

The current line's `FOG_TABLE_SCROLL_MODE` toggle (infinite scroll vs. a
classic page-number pager) does not exist on this line — the management
list tables (Hosts, Images, Snapins, and so on) are built on an older,
different JavaScript table library and have no equivalent switch.

>[!warning] Unconfirmed
>Exactly how these tables page or scroll on this line was not fully
>confirmed while writing this page — if the specific behavior matters for
>your workflow, check it against your own install rather than assuming it
>matches either of the current line's two modes.

## Boot Image Key Map

It is possible to change the keymap or keyboard layout of the Linux boot
image. To change the key map, go to:

> Other Settings → FOG Settings → General Settings → FOG_KEYMAP

If left blank it defaults to **us**. See the
[[management/web/config#Boot Image Key Map|current line's page]] for the
full list of supported keymap values — the list itself has not changed.

## No settings cache

FOG reads its global settings from the database on every read — there is no
caching layer on this line at all, and no cache readout on the FOG Settings
page. Every setting change made through the web UI takes effect on the very
next request; there is nothing to flush or refresh.

## FOG Client Kernel

### Overview

In FOG, there aren't really drivers you need to find and download for your
clients to work — FOG ships a Linux kernel that has the majority of
hardware device support built in. If you have a device that doesn't work
with FOG you need to either build a new kernel yourself or try a newer
kernel released through our kernel updater.

### Kernel Types

Two "lines" of kernels are built: **KS**, or KitchenSink, which tries to
include drivers for as many devices as possible (sometimes at the cost of
performance) and is what ships with FOG by default; and **PS**, the Peter
Sykes kernel, based on a config submitted by a user, which tries to be
faster but may not include as many drivers.

### Updating the Kernel

1. Log into the FOG Management UI.
2. Go to **Other Information**.
3. Select **Kernel Updates**.
4. Select the kernel you would like to download — typically the newest
   kernels are at the top of the list.
5. Click the download icon.
6. Select a file name for your kernel — to make it the default kernel,
   leave the name as **bzImage**.
   >[!tip]
   >If you set it to a different name, you can set a host to use it in the
   >[[1.5/management/web/hosts#Optional fields|host's Kernel field]].
7. Click **Next**.
