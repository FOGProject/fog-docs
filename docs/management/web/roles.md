---
title: Roles & Permissions
aliases:
    - Roles
    - Permissions
    - Role Management
    - RBAC
description: How FOG 1.6 role-based permissions work and how to manage them
context_id: roles
tags:
    - 1_6-changes
    - management
    - users
    - roles
    - permissions
    - web-ui
    - web-management
---

# Roles & Permissions

## Overview

Starting with FOG 1.6, role-based access control is built into FOG
itself. A **role** is a named set of permissions that you assign to one
or more user accounts. Once a user holds a role, they can only see and
do what that role's permissions allow — both in the web UI and through
the [REST API](../../kb/integrations/api.md).

This replaces the old **Access Control plugin**, which could define
roles but never actually enforced anything. See
[Upgrading from the Access Control plugin](#upgrading-from-the-access-control-plugin)
below for what happens to plugin-era roles on upgrade.

## How permissions work

Each permission is an **area** plus an **action**:

- **Areas** are the sections of FOG: Hosts, Groups, Images, Snapins,
  Printers, Tasks, Users, Roles, Storage Nodes, Storage Groups, Client
  Settings, FOG Settings, Reports, Plugins, and so on.
- **Actions** are what can be done there: **View**, **Create**,
  **Edit**, **Delete**, and **Task** (starting imaging/snapin tasks).

Not every area offers every action, and a few offer one of their own. The
clearest example is **Plugins**, which has **View**, **Edit** and **Install**:

- **Edit** activates, deactivates, installs and uninstalls plugins that are
  already on the server.
- **Install** uploads a *new* plugin archive.

They are separate on purpose. Switching on code an administrator already chose
to put on the server, and adding new code to it, are different authorities —
so a role that manages plugins does not thereby get to add one. See
[[plugins#Installing a plugin from an archive|Plugins]].

For example, a help-desk role might have full Host and Printer access
plus the ability to view Images and start imaging tasks, but no access
to Users, Roles, or FOG Settings.

A user may hold **multiple roles**; their effective permissions are the
combination of everything their roles grant.

## Managing roles

Roles are managed under the **Roles** section (key icon) of the main
menu.

### Creating a role

1. Go to **Roles → Create New Role**.
2. Give the role a unique name (and optionally a description), then
   click **Create**.
3. Open the new role and use its tabs:
    - **General** — name and description.
    - **Permissions** — a grid of areas and actions. Tick the boxes the
      role should grant, or tick **Administrator (full access)** to
      grant everything, then click **Update**.
    - **Users** — add or remove the user accounts that hold this role.

### Assigning roles to users

You can assign roles from either direction:

- On the role's **Users** tab, add the users who should hold it.
- On a user's **Roles** tab (under **Users**), add the roles that user
  should hold.

## Users without a role

A user with **no role at all has no access**. Access in FOG is granted,
never assumed: an account can only do what some role it holds says it
can do, and an account holding nothing can do nothing.

Such a user can still log in, and sees a warning banner explaining that
the account has no role and therefore no access to any management page,
along with a suggestion to ask an administrator to assign one. They keep
the handful of pages that belong to any signed-in user regardless —
their dashboard, the client-facing pages, and log out.

!!! warning "This changed during the 1.6 beta"

    Early 1.6 builds did the opposite: a role-less account was treated
    as a full administrator, so that adopting roles could not lock an
    existing server out before anyone had been assigned one.

    That was a trap. It made removing a user's last role a **promotion**
    rather than a restriction, and it meant any account created by an
    authentication plugin arrived with unlimited access simply by virtue
    of arriving without a role.

    The upgrade converts every account that was relying on the old
    behavior into an explicit role, so nobody's access changes silently
    — see [What the upgrade does to existing users](#what-the-upgrade-does-to-existing-users).

## What restricted users see

- Menu sections the user cannot view are hidden from the sidebar.
- Navigating directly to a denied page shows "You do not have
  permission to access this page" and returns the user to the
  dashboard.
- A restricted user's own name in the sidebar is no longer a link to
  their user record (editing users requires the Users **Edit**
  permission — and would otherwise let a user change their own roles).

## Narrowing a role to specific sites

Roles decide **what** a user can do; they do not decide **which**
objects those actions apply to. A role that grants Host edit lets that
user edit every host on the server.

If you need to restrict a user to only the hosts, users and groups of
their own location or team, install the **Site** plugin. It layers an
object boundary on top of the role: a site-scoped user keeps their
role's actions but only ever sees the objects in their site(s), in both
the web UI and the API. Users holding a full-access role are never
scoped.

See [Site Scoping](site-scoping.md) for the full workflow.

## API tokens follow roles

A user API token inherits that user's role permissions: API requests
made with the token can only do what the user could do in the web UI.
Scripts and integrations that need unrestricted access must authenticate
as a user holding a full-access role — a token belonging to a role-less
account can do nothing at all.

## Lockout protection

FOG will refuse any change that would leave the system with **no
effective administrator** — deleting the last admin role, removing its
last member, unticking its full access, or deleting the last admin
user account. You cannot accidentally lock everyone out.

## What the upgrade does to existing users

Because a role-less account now has no access, upgrading has to give
every existing account a role that says what it could already do.
The database upgrade does this for you, in one pass, for **local
accounts that hold no role at all**:

| Existing account | Role it receives |
|---|---|
| A normal FOG administrator | **Administrator** — full access, exactly as before |
| A "mobile" account (the restricted tier whose separate UI was removed back in 2017) | **Legacy Restricted** — a new role created by the upgrade |

**Legacy Restricted** grants what that old tier could actually do:
view hosts and images, start imaging tasks, watch tasks, and read
reports. It grants nothing that edits or deletes. It is deliberately
*not* the seeded **Technician** role, which is broader.

Accounts that **already hold a role** are left alone. Those were scoped
on purpose, and quietly widening them would undo your work.

**Accounts that came from an external directory are also left alone** —
see [LDAP Authentication](ldap.md). Their role is decided by the LDAP
plugin every time they log in, so the upgrade has nothing useful to say
about them, and copying their old account type across would hand every
directory account the administrator role.

!!! tip "After upgrading"

    Review **Roles → Administrator → Users**. Any account that was an
    administrator only because nobody had ever restricted it is now an
    administrator explicitly, and this is a good moment to move it to
    something narrower.

## Upgrading from the Access Control plugin

If you used the Access Control plugin on an earlier FOG version:

- **Your roles and user assignments carry over automatically.** The
  native feature adopts the plugin's own tables in place — same role
  names, same members.
- **Menu-key "rules" do not carry over.** The plugin never enforced
  them, so any pre-existing role with no real permissions is granted
  **full access** — preserving the access those users effectively
  already had, rather than inventing restrictions you never chose.
  Review each migrated role's **Permissions** tab and restrict it as
  desired.
- The plugin itself is removed automatically; there is nothing to
  uninstall.
