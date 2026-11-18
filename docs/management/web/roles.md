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
  Settings, FOG Settings, Reports, Plugins, System, and so on.
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
[[1.6/management/web/plugins#Installing a plugin from an archive|Plugins]].

**System** works the same way. Its only action is **Export**, and it controls
the whole-database dump on **FOG Configuration → Configuration Save**. That is
every host, every user, every stored credential and every setting in one
file, so it is a far larger authority than editing a setting is — and it
is held separately from **FOG Settings → Edit** for exactly that reason.
Without it the Export button is not rendered, the page refuses the request,
and `GET /api/system/export` answers 403.

>[!warning] This changed during the 1.6 beta
>
>Earlier 1.6 builds gated the database export on **FOG Settings → Edit**.
>It is now its own permission, **System → Export**, and nothing grants it
>automatically — including the upgrade, which seeds no default for it.
>
>A role that holds **FOG Settings → Edit** therefore **loses the export**
>until you tick **System → Export** on it as well. Full-access roles are
>unaffected. Deny-by-default is deliberate: a new permission that quietly
>arrives already granted is not a permission.

**Users** also has an **Export** action. It does not control the user export
itself: **Users → View** is enough to download the user list, because that
file holds nothing a viewer cannot already see. **Users → Export** adds an
**Include password hashes** box to the export page. When it is ticked,
**CSV (All)** includes each user's password hash, so the file can move the
accounts to another FOG server with their passwords intact.

A hash is not the password. But anyone who holds the file can try to crack
the hashes offline, so treat the file like a password list. API tokens are
never exported. Each hash export is recorded in the audit log. Like
**System → Export**, nothing grants **Users → Export** automatically: only
full-access roles have it until you tick it on a role.

A user export without the hashes still imports. Each imported user gets a
random password that nobody knows, and the import tells you to set a real
one before that user can sign in.

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
    - **General** — name, description, and **Allowed Networks**. See
      [Limiting where a role can sign in from](#limiting-where-a-role-can-sign-in-from).
    - **Permissions** — a grid of areas and actions. Tick the boxes the
      role should grant, or tick **Administrator (full access)** to
      grant everything, then click **Update**.
    - **Task Types** — the task types this role may start. See
      [Task type permissions](#task-type-permissions).
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

>[!warning] This changed during the 1.6 beta
>
>Early 1.6 builds did the opposite: a role-less account was treated
>as a full administrator, so that adopting roles could not lock an
>existing server out before anyone had been assigned one.
>
>That was a trap. It made removing a user's last role a **promotion**
>rather than a restriction, and it meant any account created by an
>authentication plugin arrived with unlimited access simply by virtue
>of arriving without a role.
>
>The upgrade converts every account that was relying on the old
>behavior into an explicit role, so nobody's access changes silently
>— see [What the upgrade does to existing users](#what-the-upgrade-does-to-existing-users).

## What restricted users see

- Menu sections the user cannot view are hidden from the sidebar.
- Navigating directly to a denied page shows "You do not have
  permission to access this page" and returns the user to the
  dashboard.
- A restricted user's own name in the sidebar is no longer a link to
  their user record (editing users requires the Users **Edit**
  permission — and would otherwise let a user change their own roles).

## Task type permissions

>[!info] FOG 1.6
>Task type permissions exist in FOG 1.6 only.

The **Task** action lets a role start tasks. By itself, it allows every task
type. A role that can deploy can also capture, wipe, and open a debug shell.
A task type permission limits a role to the task types you choose.

### What a task type permission is

Each task type has one permission, named `tasktype.<id>`. The `<id>` is the
task type ID. FOG stores the ID and not the name. The **Task Types** tab shows
the current name of each type. If you rename a task type with the
**tasktypeedit** plugin, the role keeps its grants.

The permission `tasktype.*` grants every task type, including types added
later.

### The Task Types tab

Open **Roles**, select a role, and click the **Task Types** tab. The tab shows
one row for each task type, with a tick box, the task type name, and its ID.

- Tick the task types the role may start.
- Tick **All task types, including types added later** to grant `tasktype.*`.
- Click **Update**.

A grant for a task type that no longer exists shows as **Removed task type**.
Untick it to clear it. A role with **Administrator (full access)** can start
every task type. The tab shows its tick boxes as disabled.

The **Permissions** tab does not show task types. When you click **Update** on
that tab, FOG keeps the task type grants of the role.

### A role needs both permissions

A role must hold two permissions to start a task:

- The **Task** action of the area, such as **Hosts → Task**, **Groups → Task**,
  or **Images → Task**.
- The task type permission for that task type.

For example, a role with **Hosts → Task** and only the **Deploy** task type
can deploy hosts. It gets a 403 error for every other task type. FOG records
each refusal in the audit log. The web UI hides the quick task buttons and
the task accordion entries for task types the role may not start.

### Where FOG checks the task type

FOG checks the task type everywhere a task starts:

- Deploy of a host, of a group, and of multiple selected hosts, instant or
  scheduled.
- Multicast sessions started from an image.
- The REST API route `POST /{class}/{id}/task`.
- Creating or editing a task or a scheduled task through the REST API. An edit
  checks the old task type and the new task type. A user cannot edit a
  scheduled Deploy into a wipe.
- The iPXE menu: quick image (Deploy), joining a multicast session
  (Multi-Cast), and the debug shell (Debug).
- Full registration with a deploy (Deploy).

FOG checks a scheduled task when a user schedules it. The scheduler service
does not check it again when the task runs.

>[!warning] The iPXE menu and full registration now check the role
>In earlier builds, the iPXE quick image and full registration with a deploy
>needed only a valid sign-in. They now need the Deploy task type. The iPXE
>debug shell needs the Debug task type.

### What the upgrade does

The database upgrade gives `tasktype.*` to every role that held a task
permission: **Hosts**, **Groups**, **Images**, or **Tasks** **Task**, or the
matching full-area permission. Nothing changes for these roles until an
administrator narrows the grant.

To narrow a role, untick **All task types, including types added later** on the
**Task Types** tab, tick the task types you want, and click **Update**. A role
with a list of single task types cannot start a task type added later until you
tick it. A role with no task permission has no task type permission.

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

## Limiting where a role can sign in from

A role can limit the networks its members use FOG from. Put the addresses
in the **Allowed Networks** box on the role's **General** tab.

Members of the role can then sign in to the web UI, and use the
[REST API](../../kb/integrations/api.md), only from those networks. The
iPXE boot menu is not limited. A technician can still sign in at the boot
menu of a computer on any network and start a task.

For example, a help-desk role with `10.20.0.0/16` in **Allowed Networks**
lets its members use the web UI from the office network only. At a site
on `172.16.5.0/24`, the same technician can still quick-image a computer
from its boot menu.

### What to type

- One entry per address or range: `192.168.1.50`, `10.0.0.0/24`, or an
  IPv6 range such as `fd00::/8`.
- Separate the entries with commas, spaces, or new lines. FOG saves them
  one per line.
- Leave the box empty for no limit. Every role starts empty, so nothing
  changes until you fill one in.
- FOG refuses to save an entry that is not a valid address or range, and
  names the bad entry.

### Users with more than one role

FOG combines the lists of all the roles a user holds, including roles that
reach the user through a user group. The user can sign in from any network
on any of those lists.

A role with an empty list does not lift the limit. If one of a user's
roles has a list, the user is limited to the lists, whatever other roles
they hold. Otherwise any harmless role without a list would undo the limit.

### What is limited, and what is not

| Way in | Limited? |
| --- | --- |
| Web UI sign-in: the password form, or a single sign-on provider | Yes |
| A web UI session that is already open | Yes, on its next page load |
| **Remember me** | Yes |
| REST API: Bearer token, token pair, or HTTP Basic | Yes. The API answers `403 Forbidden` |
| iPXE boot menu sign-in, and the advanced menu | No |
| Full registration and the FOS credential check | No |
| The FOG Client and the FOG agent | No. They do not sign in as a user |

A change to **Allowed Networks** takes effect for signed-in members on
their next page load. A member outside the new list goes back to the
sign-in page. The sign-in then says "Your role does not allow sign-in from
this network."

### Which address FOG checks

FOG checks the address the connection comes from. It never reads
`X-Forwarded-For`, because the caller writes that header and could name
any address.

>[!warning] Reverse proxies
>
>If a reverse proxy sits in front of FOG, every request arrives from the
>proxy's address. FOG then cannot tell users apart, and the limit does not
>work as intended:
>
>- If the proxy's address is on the list, every member passes, from
>  anywhere.
>- If it is not on the list, no member can sign in.
>
>This includes a proxy on the FOG server itself, where every request
>arrives from `127.0.0.1`. FOG gives `127.0.0.1` no special treatment.
>To allow sign-in from the server itself, add `127.0.0.1` to the list.

### Lockout protection

FOG refuses to save a change to **Allowed Networks** that would lock out
the user who makes it. This applies in the web UI and through the API.

Adding yourself to a limited role while you are outside its networks is
not checked. If a limit locks everyone out:

- sign in as an administrator whose roles have no list, and clear the
  box, or
- clear the `rAllowedNetworks` column of the `roles` table in the
  database.

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

>[!tip] After upgrading
>
>Review **Roles → Administrator → Users**. Any account that was an
>administrator only because nobody had ever restricted it is now an
>administrator explicitly, and this is a good moment to move it to
>something narrower.
>
>Then review **System → Export** on any role that is meant to be able to
>take a database backup — see the note under
>[How permissions work](#how-permissions-work).

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
