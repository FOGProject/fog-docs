---
title: Group Management
aliases:
    - Group Management
    - Fog Group Management
    - Group Grants
description: "How FOG 1.6 groups work: a group owns its snapins and printers and applies them to every member, including hosts added later"
context_id: groups
tags:
    - 1_6-changes
    - management
    - web-management
    - web-ui
    - groups
---

# Group Management

>[!info] FOG 1.6
>Groups themselves are not new, but what a group **is** changed in 1.6. On
>1.5 a group owned nothing: pressing a button on the group page wrote rows
>onto whichever hosts were members at that instant. In 1.6 a group owns its
>snapins and printers, and every member gets them — including hosts you add
>tomorrow. See the [[1.5/management/web/groups|1.5 version]] of this page for
>the old behavior.

A **group** is a label you put on hosts. A host can be in as many groups as
you like: a machine can be in *Third Floor*, *Math Department* and *Dell PCs*
at once, and each of those groups can hand it something.

## What a group gives its members

A group holds three kinds of thing, and hands all of them to every member:

| The group holds | Where you set it | What the member gets |
|---|---|---|
| **Snapins** | Associations → Snapin Associations | Included when you deploy snapins to that host |
| **Printers** | Associations → Printer Associations | Installed by the FOG client on its next check-in |
| **Client modules** | Service Settings → Client Settings | The module is switched on |

Tick an item and the group grants it. Untick it and the grant is gone. Neither
click touches a host record, so nothing you do here can overwrite something an
admin set on a machine directly.

>[!important] This is the change people notice first
>**A host added to the group later gets the group's snapins and printers.** On
>1.5 it got nothing — silently — which is why so many sites ended up with a
>plugin, a script, or a habit of re-pressing the group's buttons after adding
>a machine. None of that is needed now.
>
>**A host removed from the group loses them.** On 1.5 the copied rows stayed
>behind forever, with nothing to say where they had come from.

## What a host ends up with

A host's real list is **its own assignments plus every grant from every group
it belongs to**, worked out fresh each time FOG needs it. Two rules cover
almost every question about it:

1. **The host's own assignments come first.** A snapin you gave a machine
   directly stays where you put it in that machine's run order; a grant never
   reorders it.
2. **Groups follow, in group order** — the **Group Order** field on each
   group, lowest first, then by name for groups sharing a number. Every group
   starts at `0`, so out of the box that is plain alphabetical order; set the
   field only on the groups where the order actually matters. Falling back to
   name rather than to creation date is what makes the result something you
   can predict by reading the group list.

An item assigned **both** directly and by a group appears **once**, in the
host's position. There is no double install and no duplicate row.

The **default printer** follows exactly the same precedence: a host that has
chosen its own default keeps it, and otherwise the default comes from the
first group in that order which names one.

>[!note] If two groups grant conflicting defaults, group order decides
>Give the group whose default should win a **lower Group Order** than the
>other. Setting the default on the host itself also works and beats every
>group, but that is a per-host edit you then have to remember — the order is
>set once and keeps applying as hosts come and go.

>[!tip] Where to see the result
>The host's own Printers and Snapins tabs show what that host was assigned
>directly. To see what it will actually *get*, look at the groups it is in —
>the Groups column on the Hosts list names them, in the order above.

## Snapins are a snapshot; printers are live

These two behave differently, and the difference matters the moment you edit a
group while work is queued.

- **Snapins are resolved when the task is created.** A snapin deployment
  records the list it is going to run at the moment you queue it. Editing the
  group afterwards does **not** change a task that is already waiting — you
  have to re-task to pick the change up.
- **Printers are resolved live, on every client check-in.** Add a printer to a
  group and members install it on their next check-in; remove one and they
  uninstall it. There is nothing to re-task.

The reason is that a task is a promise about a specific moment — you queued
*that* set of snapins for *that* machine, and a machine that reboots into a
job three hours later should get the job you queued, not a different one.
Printers have no task to hang a snapshot on: the FOG client reconciles them on
a schedule, so a removal has to be able to reach the machine on its own.

>[!warning] Printer level "FOG Handles all printers"
>On that level the list FOG sends is authoritative **in both directions** —
>the client removes every installed printer that is not on it, including ones
>FOG did not add. That has always been true of that mode, and it is worth
>re-reading now that a group can add to the list.

## Settings that are no longer on the group page

Image, kernel, kernel arguments, primary disk, init, AD details, product key,
printer management level, BIOS/EFI exit type, screen resolution, auto-logout
and hostname enforcement are **not** set from a group any more. They were
never group properties — pressing *Update* wrote the value onto each member
host once — so they moved to where that operation belongs: the **Hosts** list.

**Hosts → tick the hosts you want → Edit selected hosts.**

That does the same job on any selection you can build, not only on a group,
and you can repeat it whenever you like. Each field has its own action:

| Action | What it does |
|---|---|
| **No change** | Leave every selected host's value alone. This is the default for every field. |
| **Set on all** | Write the value you type to every selected host. |
| **Clear on all** | Empty the field on every selected host. |

Fields that only make sense as on/off (joining the domain, hostname
enforcement) offer *No change*, *Enable on all* and *Disable on all* instead.

>[!note] Where each setting went
>| Was on the group page | Now |
>|---|---|
>| Image | Edit selected hosts → **Image** |
>| Kernel, kernel arguments, primary disk, init | Edit selected hosts → **Host Kernel** / **Host Kernel Arguments** / **Host Primary Disk** / **Host Init** |
>| Product key | Edit selected hosts → **Product Key** |
>| BIOS / EFI exit type | Edit selected hosts → **Host BIOS Exit Type** / **Host EFI Exit Type** |
>| Printer management level | Edit selected hosts → **Host Printer Management Level** |
>| Active Directory (join, domain, OU, username, password) | Edit selected hosts → the **Active Directory** fields |
>| Enforce hostname changes | Edit selected hosts → **Host Enforce Hostname Changes** |
>| Screen resolution | Edit selected hosts → **Host Screen Resolution** |
>| Auto log out time | Edit selected hosts → **Auto Log Out Time (in minutes)** |
>| Building | **Removed.** Nothing read it and nothing wrote it — it was a leftover column, not a setting. |

The old controls are **still on the group page in 1.6**, marked deprecated, so
nobody loses a workflow in the middle of an upgrade. They are removed in a
later release. Where they remain, they still behave the old way: the value is
applied **once**, to the hosts that are members at that moment.

## Groups as labels: doing it from the Hosts list

Group membership is editable from the host side in bulk, which is usually the
faster way round. Labelling forty machines is one action rather than three
trips through Group Management:

1. **Hosts** → filter or search until you have the machines on screen. The
   **Groups** column shows each host's groups and can be searched and filtered
   like any other column, so "everything in *Third Floor* that is not in
   *Dell PCs*" is a filter rather than a cross-referencing exercise.
2. Tick the hosts you want.
3. **Edit groups** → pick one or more groups → **Add** or **Remove**.

Typing a name that is not a group yet **creates it** when you add. *Remove*
only works on groups that already exist.

Because a group grants rather than copies, adding those forty machines to a
group is all it takes for them to receive that group's snapins and printers —
there is no second step, and no button to press afterwards.

## The rest of the group page

- **General** — the group's own name and description, plus the deprecated
  push-to-all fields described above.
- **Image** — the deprecated one-time image push.
- **Tasks** — deploy, capture, multicast, wake, and the rest, run across every
  current member. Tasking is unchanged: it acts on the membership at the
  moment you start the task, which is what you want from a task.
- **Associations → Host Associations** — who is in the group. Add and remove
  members here, or from the Hosts list as above.
- **Associations → Printer Associations** — the group's printers, plus which
  of them is the group's default.
- **Associations → Snapin Associations** — the group's snapins, plus the
  **Snapin Run Order** card, which orders the group's own snapins. A host runs
  its own snapins first, then these, in this order. Order only changes
  anything when *Abort snapin sequence on failure* is enabled for the task.
- **Service Settings → Client Settings** — the group's modules, plus the
  deprecated screen-resolution and auto-logout pushes.
- **Service Settings → Active Directory** — deprecated; see the table above.
- **Service Settings → Power Management** — schedules power tasks across
  members. Not deprecated: it creates tasks rather than copying a value.
- **Inventory**, **Login History**, **History Items** — reporting across the
  group's members.
- **Site** — which site the group belongs to, if you use site scoping.

## Modules have one extra rule: only a host can turn one off

A snapin or a printer is a thing a host either has or does not. A **module** is
a switch, so it needs a third answer, and 1.6 gives it one.

A group can turn a module **on** and can never turn one **off** — there is no
"disabled" a group can express. That means two groups can never contradict
each other over a module, and there is no "this group says on, that one says
off, which wins" to resolve.

A host can say all three, on its own **Modules** tab, which is a dropdown
rather than a checkbox:

| The host says | Result |
|---|---|
| **On** | The module runs on this host. |
| **Off** | The module does not run, no matter how many groups grant it. |
| **Not set** | The host has no opinion; a group grant switches it on, and nothing else does. |

*Off* is the host's own answer and beats every grant. Note that this is the
one place where unticking used to mean something different: on the old
checkbox, unticking deleted the row, which under these rules means *Not set* —
so a group granting the module would have switched it straight back on.

## Hosts that already carry copies

An upgraded server keeps every association it had. That is deliberate — an
upgrade that removed assignments would be an upgrade that changed what
installs on your machines — but it has a consequence worth understanding
before you go looking for it:

**Nothing distinguishes a row that a 1.5 group copied onto a host years ago
from one an admin chose for that host deliberately.** They are the same row in
the same table, and the copy never recorded where it came from. FOG cannot
tell them apart, so it does not try, and neither will any script you write.

So the most likely surprise reads like this:

> *"I removed the host from the group and it still has the snapin."*

That is the old copy, sitting on the host as a direct assignment. Removing the
host from the group removed the **grant**; it cannot remove an assignment that
was never a grant in the first place. Look at the host's own Snapins or
Printers tab and you will see it listed there.

Nothing needs cleaning up for FOG to work correctly — a host holding both the
direct copy and the grant gets the item **once**. Clean up only if you want the
group to be the single place that decides, in which case the routine is:

1. Confirm the group grants the item (Associations → Snapin Associations).
2. On the Hosts list, filter to the group's members.
3. Open each host's Snapins or Printers tab and remove the direct assignment.

After that the group is the only thing granting it, and adding or removing a
host does the whole job.

>[!tip] New groups do not have this problem
>Anything you set up on 1.6 is a grant from the start. This only affects
>associations that existed before the upgrade.

## persistentgroups is retired

The **persistentgroups** plugin existed to work around exactly the defect this
release fixes: it copied settings from a template host onto every machine that
joined a group, because a group could not hand anything to a machine by
itself. A group can now, so the plugin is gone and the template-host naming
convention it needed goes with it.

Upgrading handles the removal for you. The plugin's code disappears with the
upgrade like any other bundled plugin, and — importantly — the upgrade also
**drops the database trigger it installed**. That matters because removing the
plugin's files never removed the trigger: it would otherwise have kept copying
settings onto every new group member, silently, long after the plugin that
created it was gone.

You do not need to do anything. If you had it installed, check afterwards that
the groups which relied on it now grant the snapins and printers you expect —
the grants are the replacement, and they are more capable than what they
replace, because they also apply to hosts that were already members.

## See also

- [[group-shared-state|Group Shared State]] — the detail behind resolution
  order, precedence, and the deprecated push-to-all controls.
- [[1.6/management/web/hosts|Host Management]] — the Hosts list, mass edit and
  bulk group membership.
- [[management/web/snapins|Snapin Management]] and
  [[management/web/printers|Printer Management]] — creating the things a group
  grants.
