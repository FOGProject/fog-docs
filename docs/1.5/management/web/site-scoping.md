---
title: "Site Scoping (1.5)"
aliases:
    - "Site Scoping (1.5)"
    - "Site Plugin (1.5)"
description: How the Site plugin restricts what a FOG 1.5 user can see to their own hosts and users
context_id: "site-scoping-1.5"
tags:
    - management
    - users
    - sites
    - plugins
    - web-ui
    - web-management
    - 1_5-legacy
---

# Site Scoping (1.5)

>[!info] This page describes FOG 1.5.
>See the [[management/web/site-scoping|1.6 version]] of this page for FOG 1.6.

## Overview

On 1.5, restricting what a user can see by location is a separate plugin
called **Site**, not something built into FOG. It has to be installed and
activated like any other plugin before there is anything to configure — see
[[1.5/management/web/plugins|Plugins]].

The plugin is much simpler than the current line's core Sites feature: it
scopes **hosts and users only**, it has no roles or grants to layer onto, and
membership is set per account rather than through group mappings.

## Turning it on

Enable the plugin system (`FOG_PLUGINSYS_ENABLED` in **FOG Configuration →
FOG Settings**) if it is not already on, then activate and install **Site**
from the plugin pages. Once installed, a **Sites** entry (building icon)
appears in the main menu, opening **Site Control Management**.

## Creating and populating a site

1. In **Site Control Management**, create a new site with a name and optional
   description.
2. Open the site and use its **Host Membership** tab to assign hosts to it.
   **A host belongs to at most one site** — assigning it to a new site moves
   it, it does not add a second membership.
3. Assign users to the site from the **Membership** tab, or from the user's
   own edit page.

>[!note] Groups are not really scoped, they are derived
>There is no group-to-site table. Adding a *group* to a site is a one-time
>bulk operation: FOG writes a host membership row for every host currently in
>that group at that moment. It is not a live link — hosts added to the group
>later do not inherit the site, and a group's own "site" in list views is
>only ever computed afterward from which of its member hosts are in scope.

## Restricting a user

Site membership by itself does nothing. Each FOG user account carries its own
separate **restricted** flag, set with a checkbox on the user's edit page:

- **Unticked (the default)** — the account is not restricted and sees every
  host and user on the server, whether or not it is a member of any site.
- **Ticked** — the account only sees hosts and users in the site(s) it has
  been assigned to. An account restricted but assigned to **no** site sees
  **nothing** — restriction fails closed, the same way the current line's
  scoping does.

This is independent of whether the account is a FOG administrator or a
restricted "mobile" user (1.5's other access split, unrelated to this
plugin) — the Site plugin's restriction flag is a separate switch on top of
either account type.

>[!warning] Only hosts, users and groups (indirectly) are scoped
>Images, snapins, storage nodes and every other shared resource have no site
>boundary at all. Every user who can see them sees all of them, restricted or
>not — this is unchanged from how the current line's Sites feature also
>leaves shared resources unscoped.

## Where restriction applies

The restriction narrows both the web UI (host/group lists and search) and the
REST API — a restricted user's API requests are narrowed the same way their
screens are, not just the pages they click through.

## Removing scoping

- **Unrestrict one user** — untick the restricted flag on their account.
- **Turn it off for everyone** — deactivate or uninstall the Site plugin.
  Uninstalling drops the plugin's tables entirely, including every site,
  membership and restriction flag; there is no way to pause it while keeping
  the data. Reactivating later starts from empty.

## Upgrading to the current line

FOG 1.6 replaces this plugin with Sites built into core, with roles, grants,
a catch-all site and user-group support the plugin never had. See
[[management/web/site-scoping|Site Scoping]] for that model.
