---
title: Site Scoping
aliases:
    - Sites
    - Site Scoping
    - Site Plugin
    - Object Scoping
    - Multi-Site
description: How the Site plugin narrows a user's access to only the hosts, users and groups that belong to their site
context_id: site-scoping
tags:
    - 1_6-changes
    - management
    - users
    - roles
    - permissions
    - plugins
    - sites
    - web-ui
    - web-management
---

# Site Scoping

## Overview

[Roles & Permissions](roles.md) control **what actions** a user can
perform — view hosts, edit images, start tasks, and so on. They do not
control **which objects** a user sees: a role that grants Host edit
lets that user edit *every* host on the server.

The **Site** plugin adds that second dimension. It lets you group
hosts, users, groups and user groups into **sites**, and restrict a
user so they only see and touch the objects in their own site(s). A
site-scoped help-desk admin at the "Chicago" site sees only Chicago's
hosts, both in the web UI and through the [REST
API](../../kb/reference/api.md).

Site scoping is layered **on top of** roles, not instead of them. A
user's role still decides what they can do; their site membership
decides which objects those actions apply to.

## Enabling the plugin

1. Go to **FOG Configuration → Plugin System** and enable the plugin
   system if you have not already.
2. On the **Plugins** tab, install and activate **Site**.
3. A **Sites** section (globe icon) appears in the main menu.

See [Plugins](plugins.md) for the general plugin workflow.

## Creating sites

1. Go to **Sites → Create New Site**.
2. Give the site a unique name (and optional description) and click
   **Create**.

Repeat for each physical location or team you want to scope by.

## Assigning objects to a site

A site can contain four kinds of object: **hosts**, **users**,
**groups** and **user groups**. Assignment is always explicit — a
group's site is its *own* setting, not inferred from the sites of its
member hosts.

You can assign objects from either direction:

- **From the site.** Open a site and use its **Associations** tab
  (Host Association / User Association) to add or remove members in
  bulk.
- **From the object.** Open a host, user, group or user group and use
  its **Site Association** tab to choose which site it belongs to, then
  click **Update**.

## Restricting a user to their site

Two things make a user site-scoped:

1. **They hold a role.** A user with *no* role has full administrator
   access and is never scoped (see
   [Users without a role](roles.md#users-without-a-role)). The same is
   true of any role that grants **Administrator (full access)**.
2. **They are assigned to one or more sites**, via their **Site
   Association** tab.

Once both are true, that user only sees the hosts, users, groups and
user groups that belong to their site(s) — in list views, in search,
on edit pages, and over the API. Trying to open an out-of-scope object
directly returns them to the dashboard with a permission error.

## Deny-all: a role but no site

!!! warning "A restricted user with no site sees nothing"
    Once the Site plugin is active, any user who holds a role (other
    than a full-access one) and has **no site assignment** sees an
    **empty list** of hosts, users, groups and user groups. This is
    deliberate — scoping fails closed, so a user is never shown objects
    you did not explicitly grant.

    If a role-holding user should see everything, either give their role
    **Administrator (full access)** or leave them role-less. Otherwise,
    make sure every scoped user is assigned to at least one site.

## Who is never scoped

- **Role-less users** — full administrators, unaffected by sites.
- **Full-access roles** — any role with **Administrator (full access)**
  ticked bypasses site scoping entirely.

Site scoping only ever *narrows* a user who already holds a restricting
role. It cannot grant access a role does not already allow.

## The REST API respects sites

Scoping applies to [API tokens](roles.md#api-tokens-follow-roles) the
same way it applies to the web UI. A site-scoped user's token returns
only in-scope hosts, users, groups and user groups from list and search
endpoints, and is denied out-of-scope objects on single-object
requests. Scripts and integrations that need to see everything should
authenticate with an administrator (a role-less user or a full-access
role).

## Removing scoping

- **Unassign the user** from their site(s) to change what they see, or
  give them a full-access role / remove their role to make them an
  administrator again.
- **Uninstalling the Site plugin** removes the object boundary
  entirely; every user's role permissions
  ([Roles & Permissions](roles.md)) are unchanged, and all users can
  again see every object their role allows.
