---
title: Site Scoping
aliases:
    - Sites
    - Site Scoping
    - Site Plugin
    - Object Scoping
    - Multi-Site
    - Site Grants
description: How sites narrow a user's access to only the hosts, users and groups that belong to their site
context_id: site-scoping
tags:
    - 1_6-changes
    - management
    - users
    - roles
    - permissions
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

**Sites** add that second dimension. You group hosts, users, groups and
user groups into sites, and a site-scoped user only sees and touches
the objects in their own site(s). A site-scoped help-desk admin at the
"Chicago" site sees only Chicago's hosts, both in the web UI and
through the [REST API](../../kb/integrations/api.md).

Site scoping is layered **on top of** roles, not instead of them. A
user's role still decides what they can do; their sites decide which
objects those actions apply to. Scoping only ever *narrows* — it cannot
grant access a role does not already allow.

!!! note "Sites are part of FOG in 1.6"
    Sites used to be a plugin you installed from **FOG Configuration →
    Plugin System**. In 1.6 they are part of FOG itself: the **Sites**
    section is always in the main menu, and there is nothing to enable.
    Upgrading carries your existing sites and their members across.

## Creating sites

1. Go to **Sites → Create New Site**.
2. Give the site a unique name (and optional description) and click
   **Create**.

Repeat for each physical location or team you want to scope by.

## Putting objects in a site

A site can contain four kinds of object: **hosts**, **users**,
**groups** and **user groups**. Assignment is always explicit — a
group's site is its *own* setting, not inferred from the sites of its
member hosts.

You can assign from either direction, and both write the same thing:

- **From the site.** Open a site and use its **Associations** tabs —
  Host Association, User Association, Group Association, User Group
  Association — to add or remove members in bulk.
- **From the object.** Open a host, user, group or user group and use
  its **Site Association** tab to choose which site it belongs to, then
  click **Update**.

## Granting a site to a role or a user group

Listing every user on every site works, but it means maintaining the
same list twice: once as "who is in the help-desk role" and once as
"who is in the Chicago site". **Grants** remove the second list.

A site can be granted to:

- a **role** — everyone holding that role gets the site, whether they
  hold it directly or through a user group;
- a **user group** — every member of that group gets the site.

Set them up from either end, exactly like the associations above:

- **From the site.** Open a site and use its **Granted To** tabs —
  **Roles** and **User Groups**.
- **From the role or the user group.** Open a role or a user group and
  use its **Site Grants** tab.

A grant is inherited the moment it applies. Add someone to the
"Chicago Techs" user group and they are in the Chicago site on their
next request; remove them and they are out of it. Nothing is copied, so
the two never drift.

### A grant is not a membership

The distinction matters, and it is why they are separate tabs:

|  | What it means |
|---|---|
| **Association** (Host / User / Group / User Group) | This object *is in* the site. It is one of the things a scoped user at that site can see. |
| **Grant** (Roles / User Groups) | Holders of this role, or members of this user group, *get* the site. It is what puts a person in scope. |

So putting the "Chicago Techs" user group in a site's **User Group
Association** tab makes that group an object Chicago's staff can open
and edit. Putting it in the site's **Granted To → User Groups** tab
gives its members Chicago's hosts. They are different questions about
the same two things, and you may well want one without the other.

### Grants only ever add

A user's sites are the union of everything that reaches them —
their own assignment, plus every grant they inherit. There is no grant
that takes a site away, so adding one can never narrow what somebody
already sees.

## Restricting a user to their site

Two things make a user site-scoped:

1. **They hold a role that is not full access.** A role granting
   **Administrator (full access)** bypasses site scoping entirely. A
   user with *no* role has no access at all and so is never scoped
   either — see [Users without a role](roles.md#users-without-a-role).
2. **They reach one or more sites**, through their own **Site
   Association**, through a role they hold, or through a user group
   they belong to.

Once both are true, that user only sees the hosts, users, groups and
user groups in those sites — in list views, in search, on edit pages,
and over the API. Trying to open an out-of-scope object directly
returns them to the dashboard with a permission error.

Tasks follow their host: a scheduled or active task is in scope if the
host it runs against is. Images, snapins and printers are **not**
scoped — they are shared resources, and every user who can see them at
all sees all of them.

## The catch-all site

One site can be marked **Catch-All**, on its General tab. Its members
are in scope for **everything**, including hosts registered after they
were added — it is a flag, not a copied list, so it cannot go stale.

Upgrading to 1.6 creates a catch-all site and puts every existing
account in it, which is why an upgrade changes nothing about who sees
what. New accounts join it too, but only for as long as the catch-all
is the *only* site on the server: once you create a real site, which
site a new user belongs to becomes an administrative decision rather
than a default.

Only one site can be the catch-all at a time. Ticking the box on a
second site moves the flag.

!!! tip "Scoping switches itself on when you start using it"
    While the catch-all is the only site that exists, scoping is
    inactive and everyone sees everything. Creating your first real
    site is what turns it on. That is deliberate: it means the upgrade
    does not silently start restricting a feature nobody has set up.

## Deny-all: a role but no site

!!! warning "A restricted user who reaches no site sees nothing"
    Once real sites exist, any user who holds a role (other than a
    full-access one) and reaches **no site at all** — no assignment, no
    grant through a role, no grant through a user group — sees an
    **empty list** of hosts, users, groups and user groups. This is
    deliberate: scoping fails closed, so a user is never shown objects
    you did not grant.

    If a user should see everything, give them a role with
    **Administrator (full access)** ticked, or add them to the
    catch-all site. Otherwise make sure every scoped user reaches at
    least one site.

## Who is never scoped

- **Full-access roles** — any role with **Administrator (full access)**
  ticked bypasses site scoping entirely.
- **Members of the catch-all site.**

Users with no role are not "unscoped" — they have no access to scope in
the first place.

## Who can change all this

Site pages and tabs follow the ordinary [role
permissions](roles.md) for the **Site** node: `view` to see them,
`edit` to change them, `create` to add a site, `delete` to remove one.

The **Site Grants** tabs on the Role and User Group pages are the one
place worth calling out. They take the **Site** permissions, not the
Role or User Group ones — granting a site to a role widens what every
holder of that role can see, so being able to edit roles is not by
itself enough to hand out access. Someone with role edit but no site
edit will not see those tabs at all.

## The REST API respects sites

Scoping applies to [API tokens](roles.md#api-tokens-follow-roles) the
same way it applies to the web UI. A site-scoped user's token returns
only in-scope hosts, users, groups and user groups from list and search
endpoints, and is denied out-of-scope objects on single-object
requests. Scripts and integrations that need to see everything should
authenticate as a user holding a full-access role.

## Removing scoping

- **Change what one user sees** — unassign them from their site(s), and
  remove any grant that reaches them. Check the role and user group
  grants too; an assignment removed on its own leaves an inherited site
  in place.
- **Make somebody an administrator again** — give them a full-access
  role, or add them to the catch-all site.
- **Turn scoping off entirely** — delete every site except the
  catch-all. Scoping goes inactive on its own, and every user's role
  permissions ([Roles & Permissions](roles.md)) are unchanged.
