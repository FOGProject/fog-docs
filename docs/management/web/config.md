---
title: Fog Configuration
aliases:
    - Fog Configuration
    - Fog Config
description: Documentation on the configuration settings in the web ui
context_id: config
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - config
---

# Fog Configuration

much more content is needed here

## Other Settings

## Table display mode (infinite scroll vs. paging)

The management list and export tables (Hosts, Images, Snapins, and so on) can
page through records in one of two ways, controlled by a single install‑wide
setting:

> Other Settings :octicons-arrow-right-24: FOG Settings :octicons-arrow-right-24: FOG View Settings :octicons-arrow-right-24: FOG_TABLE_SCROLL_MODE

- **infinite** *(default)* — virtual scroll: rows load in chunks as you scroll
  and there is no page‑number bar. Best for quickly skimming large lists.
- **paged** — the classic page‑number pager with a per‑page length selector.

The setting applies to every management table on the next page load. Choose
**paged** if you prefer page numbers, or if infinite scroll doesn't suit your
browser or workflow.

>[!note]
>A few tables — such as the FOG Settings table itself — always use paging
>regardless of this setting, because they are grouped and search‑driven.

## Boot Image Key Map

It is possible to change the keymap or keyboard layout of the linux boot
image. In order to change the key map, go to:

> Other Settings :octicons-arrow-right-24: FOG Settings :octicons-arrow-right-24: General Settings :octicons-arrow-right-24: FOG_KEYMAP

You can expand the possible values for keymaps below, if left blank it
will default to **us**.

``` 
azerty 
be-latin1 
fr-latin0 
fr-latin1 
fr-latin9 
fr 
fr-old 
fr-pc 
wangbe2 
wangbe 
ANSI-dvorak 
dvorak-l 
dvorak 
dvorak-r 
tr_f-latin5 
trf 
bg_bds-cp1251 
bg_bds-utf8 
bg-cp1251 
bg-cp855 
bg_pho-cp1251 
bg_pho-utf8 
br-abnt2 
br-abnt 
br-latin1-abnt2 
br-latin1-us 
by 
cf 
cz-cp1250 
cz-lat2 
cz-lat2-prog 
cz 
defkeymap 
defkeymap_V1.0 
dk-latin1 
dk 
emacs2 
emacs 
es-cp850 
es 
et 
et-nodeadkeys 
fi-latin1 
fi-latin9 
fi 
fi-old 
gr 
gr-pc 
hu101 
hypermap.m4 
il-heb 
il 
il-phonetic 
is-latin1 
is-latin1-us 
it2 
it-ibm 
it 
jp106 
ko 
la-latin1 
lt.baltic 
lt.l4 
lt 
mk0 
mk-cp1251 
mk 
mk-utf 
nl2 
nl 
no-latin1.doc 
no-latin1 
no 
pc110 
pl2 
pl 
pt-latin1 
pt-latin9 
pt 
ro 
ro_win 
ru1 
ru2 
ru3 
ru4 
ru-cp1251 
ru 
ru-ms 
ru_win 
ru-yawerty 
se-fi-ir209 
se-fi-lat6 
se-ir209 
se-lat6 
se-latin1 
sk-prog-qwerty 
sk-qwerty 
sr-cy 
sr-latin 
sv-latin1 
tralt 
tr_q-latin5 
trq 
ua 
ua-utf 
ua-utf-ws 
ua-ws 
uk 
us-acentos 
us 
croat 
cz-us-qwertz 
de_CH-latin1 
de-latin1 
de-latin1-nodeadkeys 
de 
fr_CH-latin1 
fr_CH 
hu 
sg-latin1-lk450 
sg-latin1 
sg 
sk-prog-qwertz 
sk-qwertz 
slovene
```

## Settings Cache

FOG reads its global settings constantly — on every page load, and inside the
background services. To avoid asking the database for the same values over and
over, FOG keeps a short-lived **cache** of those settings. You normally never
need to think about it: settings you change in the web UI take effect as usual,
and cached values are automatically re-read once the cache **TTL** expires
(5 minutes by default).

You can inspect and control the cache at the bottom of:

> FOG Configuration :octicons-arrow-right-24: FOG Settings

### Viewing the cache

At the bottom of the **FOG Settings** page is a read-only cache readout:

| Field | Meaning |
| --- | --- |
| **Keys cached** | How many distinct settings are currently held in the cache. |
| **Hits / Misses / Queries** | For the page you are viewing: how many setting reads were served from the cache (hits) versus the database (misses), and how many database queries that took. A high hit rate means the cache is doing its job. |
| **TTL** | How long, in seconds, a cached value is trusted before it is re-read from the database. |
| **Last flush** | How long ago the cache was last flushed, across all FOG processes. |
| **Cached keys** | The names of the settings currently cached. |

!!! note
    The Hits / Misses / Queries figures reflect the **page you are currently
    viewing** — reload the page to take a fresh sample. Only setting **names**
    are ever shown here; setting **values** (which can include passwords and API
    tokens) are never exposed.

### Flushing and refreshing

Two buttons on the FOG Settings page let you control the cache by hand:

- **Flush Settings Cache** — discards the cached values, so every setting is
  re-read from the database the next time it is needed.
- **Refresh Settings Cache** — reloads all settings from the database right away
  and reports how many were loaded.

Both actions raise a cross-process signal, so **every** FOG process — the web UI
*and* the background services — picks up the change on its next read, not just
the worker that handled your click.

!!! tip
    You rarely need these. The main reason to use them is when you have changed
    a setting **outside** the web UI — for example directly in the database — and
    want FOG to pick it up immediately instead of waiting up to the TTL
    (5 minutes). Changes made through the web UI do not require a manual flush.

### Automating with the API

The same actions are available through the FOG API for scripting. Like any FOG
API call, they require a valid `fog-api-token` and an API-enabled
`fog-user-token`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/fog/settings/cache` | Return the cache stats shown above as JSON (names and counters only — never values). |
| `POST` | `/fog/settings/cache/flush` | Flush the cache. Returns `{"status":"flushed"}`. |
| `POST` | `/fog/settings/cache/refresh` | Reload all settings. Returns `{"status":"refreshed","count":N}`. |

## FOG Client Kernel

### Overview

In FOG, there aren't really drivers you need to find and download for
your clients to work, this is because we ship a Linux kernel that has
the majority of hardware device built into it. What this means is if you
have a device that doesn't work with FOG you need to either build a new
kernel yourself or try a newer kernel that has been released via our
kernel updater.

### Kernel Types

We currently build two "lines" of kernels, one called KS or
KitchenSink. This kernel tries to include drivers for as many devices as
possible, sometimes as the cost of performance, and this is the kernel
that we ship with FOG by default. The other "line" is the PS kernel or
the Peter Sykes kernel, which is a based on a config submitted by a
user. This kernel line tries to be faster, but may not include as many
drivers as the KS kernel.

### Updating the Kernel

It is possible to update your client kernel from within the UI of FOG.
To do this perform the following steps:

-   Log into the FOG Management UI.
-   Go to **Other Information**
-   Select **Kernel Updates**
-   Select the Kernel you would like to download, typically the newest
    kernels are on the top of the list.
-   Click the download icon
-   Select a file name for your kernel, to make it the default kernel leave the name as **bzImage**
       * *!!! tip
	    If you set it to a different name, you can set a host to use t in the [[hosts#Kernel]]
-   Click the **Next** Button
