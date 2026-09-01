---
title: "Plugins (1.5)"
aliases:
    - "Plugins (1.5)"
description: Turning the plugin system on, the bundled 1.5.x plugin set, and how the three-page activate/install/installed workflow works, on FOG 1.5
context_id: "plugins-1.5"
tags:
    - management
    - web-management
    - plugins
    - 1_5-legacy
---

# Plugins (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/management/web/plugins|1.6 version]] of this page for FOG 1.6.

Plugins add functionality that some FOG sites want and others do not — LDAP
and Active Directory login, Slack notifications, Windows product keys.
Each one is a directory of PHP that FOG discovers, activates on request, and
gives its own entry in the sidebar.

## Turning the plugin system on

Plugins are off until you enable them.

1. Log in to the FOG web UI.
2. Go to **FOG Configuration → FOG Settings**.
3. Find the **Plugin System** section.
4. Tick **FOG_PLUGINSYS_ENABLED**.
5. Click **Save Changes**.

Reload the UI and a **Plugins** entry — a gear wheel — appears in the main
menu. It opens the first of three pages, described below.

## The three-page workflow

1.5 has no single plugin list. Which of three pages a plugin appears on is
decided entirely by its state, so a plugin moves from one page to the next as
you work on it:

| Page | Shows | What you do there |
|---|---|---|
| **Activate Plugins** (the default) | plugins that are neither activated nor installed | Click one to activate it. It then disappears from this page |
| **Install Plugins** | plugins you have activated whose database is not set up yet | Run the install |
| **Installed Plugins** | plugins that are activated *and* installed | Nothing — this is the "these are live" list |

>[!note] The middle page is easy to misread
>**Install Plugins** does not list plugins waiting to be activated. It lists
>ones you have *already* activated that still need their database creating.
>Older versions of this page had these the wrong way round.

**Activate** and **Install** are two different things, same as on the current
line: activating makes a plugin's code run — its hooks register, its pages
route, its menu entry appears. Installing sets up its database tables. A
plugin normally wants both, and you do them one at a time on this line rather
than as a bulk action on a shared list.

## What 1.5 does not have

- **No second plugin directory.** Discovery reads `../lib/plugins/` and
  nothing else. There is a `FOG_PLUGINSYS_DIR` setting, but FOG overwrites it
  back to that path every time it looks, so pointing it somewhere safer does
  not work. Since the installer rewrites the web root on every run, **any
  plugin you add by hand on 1.5 is removed by your next upgrade** and there is
  no supported way around it. It is recoverable — the installer copies the old
  tree to `/home/fog_web_<version>.BACKUP` before deleting it — but it will
  not be running, and nothing tells you.
- **No manifest beyond name, description and icon.** No version, no supported
  FOG range, no dependency list — so nothing stops you activating a plugin
  that cannot work on your server, and an upgrade that breaks a plugin gives
  you no warning.
- **No upload.** Plugins arrive on disk or not at all — copy or `git clone`
  the plugin's directory into `../lib/plugins/` yourself.
- **No migration tracking.** The `plugins` table has no `pSchema` column, so
  there is no record of which of a plugin's database steps have run. Plugins
  that need to change their tables later have to do it destructively.

## The bundled plugins

| Plugin | What it does |
|---|---|
| **accesscontrol** | Restrict what users can see and do — 1.5's only access-control mechanism, since it has no built-in roles |
| **capone** | Match a machine's DMI value against a key you define and deploy the associated image, without registering the host first |
| **example** | A skeleton example plugin — the reference for people writing their own |
| **fileintegrity** | Records checksums, modification dates and locations for files on storage nodes |
| **hoststatus** | Adds a live power/OS status entry to the host edit page. Needs TCP 445 open on the client |
| **ldap** | Authenticate FOG users against an LDAP or Active Directory server. Needs your distribution's `php-ldap` package. See [[1.5/management/web/ldap\|LDAP Authentication]] |
| **location** | Point hosts at the storage node local to their site, for sites with more than one place to fetch an image from |
| **persistentgroups** | When a host joins a group, copy image, AD, printer, snapin and location settings onto it from a template host named after that group |
| **pushbullet** | Pushbullet notifications |
| **site** | Restrict what a user can see to their own site. See [[1.5/management/web/site-scoping\|Site Scoping]] |
| **slack** | Slack notifications |
| **subnetgroup** | Assign hosts to groups automatically based on their IP subnet |
| **taskstateedit** | Create and edit FOG's task states |
| **tasktypeedit** | Create and edit FOG's task types |
| **windowskey** | Associate Windows product keys with images, applied to hosts on deploy. Keys stay with the host if the plugin is removed |
| **wolbroadcast** | Wake-on-LAN across separate broadcast addresses, for when you cannot configure your switches to forward it |

## Writing your own

The plugin API this version implements is the same shape covered by the
current [[plugin-development|Building a FOG Plugin — Start to Finish]] guide,
minus the manifest fields and migration hooks noted above as missing on this
line.
