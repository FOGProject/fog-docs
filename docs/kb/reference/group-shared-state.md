---
title: Group Shared State
description: How FOG 1.6 works out what a host actually gets from its groups, and what the group page's remaining push-to-all controls do
context_id: group-shared-state
aliases:
    - Group Shared State
    - Group State
    - Group Resolution
tags:
    - 1_6-changes
    - groups
    - group-management
    - configuration
    - management
---

# Group Shared State

>[!info] FOG 1.6
>This page describes FOG 1.6, where a group **owns** its snapins, printers and
>modules. On FOG 1.5 a group owned nothing at all and every group action wrote
>onto its members — see [[1.5/management/web/groups|Group Management (1.5)]].

[[1.6/management/web/groups|Group Management]] is the page to start on. This
one is the detail behind it: exactly how FOG decides what a host gets, and
what the group page's remaining push-to-all controls do.

> **Two kinds of state on a group page, and they behave differently:**
> 1. **Grants** — snapins, printers and modules. The group **owns** these. A
>    ticked box is a row about the group, and every member gets the item,
>    including hosts added later. Nothing is written onto a host.
> 2. **Pushed values** — Active Directory, auto-logout, kernel and general
>    fields, screen resolution, image, product key. These were **not** group
>    properties: pressing *Update* wrote the value onto the hosts that were
>    members at that instant, once. **They are gone from the group page in
>    1.6.** Use *Edit selected hosts* on the Hosts list instead. The section
>    below is kept as the record of what they did and why they went.
> 3. **Power Management** — the one push that is **still there** in 1.6, and
>    still a push. See [Power Management](#power-management) below.

---

## Table of contents

- [What a host actually gets](#what-a-host-actually-gets)
  - [Precedence](#precedence)
  - [The default printer](#the-default-printer)
  - [Modules: the third state](#modules-the-third-state)
- [When it is worked out](#when-it-is-worked-out)
- [Pushed values, and why they are gone](#pushed-values-and-why-they-are-gone)
  - [The shared-value hints](#the-shared-value-hints)
  - [The no-clobber convention](#the-no-clobber-convention)
  - [Active Directory](#active-directory)
  - [Auto-logout](#auto-logout)
  - [General fields](#general-fields)
  - [Enforce hostname / AD-join reboots](#enforce-hostname--ad-join-reboots)
- [Power Management](#power-management)
- [Out of scope](#out-of-scope)

---

## What a host actually gets

A host's effective list is its **own** assignments unioned with the grants of
**every** group it belongs to. Nothing is copied: the union is computed each
time FOG needs it, so membership changes take effect on their own.

That gives you two properties the 1.5 model could not offer:

- **adding a host to a group is enough** for it to gain that group's snapins
  and printers; and
- **removing it is enough** to lose them again.

A host's own assignments are untouched by either. A snapin given to one machine
directly stays with that machine when the group revokes its grant, because a
direct assignment and a grant are two separate facts.

### Precedence

Order matters when the same item comes from more than one place.

1. **The host's own assignments come first**, in the order set on the host.
2. **Then each group**, sorted by `groups.groupOrder`, then by group **name**,
   then by internal id.
3. Within a group, in the order set on that group's **Snapin Run Order** card.

An item present in more than one of those places is included **once**, at the
earliest position it appears. So a snapin a host holds directly and also
receives from two groups runs once, in the host's position.

`groupOrder` is the **Group Order** field on the group's General tab, and it
defaults to `0` on every group — so an install that never touches it resolves
groups alphabetically. Set it only where two groups genuinely disagree.

Falling back to name rather than to id is deliberate: it makes the resolved
order a property of what you configured rather than of what you created first.
The id tiebreak behind it is what stops two identically named groups — which
the database does not allow, but which a hand-edited one could hold — from
resolving unpredictably.

### The default printer

Same precedence, applied to one value:

- a host that has set its own default printer keeps it;
- otherwise the default is taken from the **first group in the resolved
  order** that names one — the lowest **Group Order**, and alphabetically
  first among groups sharing one;
- if no group names one, the host has no default.

A group's default is set on **Associations → Printer Associations → Group
Default Printer**, and the hint there reads `Group default: <printer>` or
`Group default: (none)` — it is the group's own answer, not a summary of what
its members happen to have.

### Modules: the third state

A snapin or printer is a thing a host either has or does not. A module is a
**switch**, so it takes a third answer.

| Tier | What it means | Beats |
|---|---|---|
| Host says **Off** | The module does not run on this host | everything |
| Host says **On** | The module runs on this host | group grants |
| A group **grants** it | The module runs on this host | nothing below |
| Nothing anywhere | The module does not run | — |

**Lowest tier wins, and only a host may say Off.** A group grant is
presence-only — a group either grants a module or says nothing about it — so
two groups can only ever union and can never contradict each other. That
absence of a "disabled" grant is the whole reason there is no conflict to
resolve.

The host's **Modules** tab is therefore a dropdown, not a checkbox: *On*,
*Off*, *Not set*. *Not set* is the absence of an opinion, and it is what
unticking the old checkbox actually meant — which is why a checkbox could not
express this and had to go.

---

## When it is worked out

| | Resolved | Editing the group afterwards |
|---|---|---|
| **Snapins** | at task creation | does **not** change a queued task — re-task to pick it up |
| **Printers** | live, on every client check-in | reaches machines on their next check-in |
| **Modules** | live, on every client check-in | reaches machines on their next check-in |

A task is a promise about a specific moment: you queued *that* set of snapins
for *that* machine, and a machine that reboots into the job three hours later
should get the job you queued. Printers and modules have no task to hang a
snapshot on — the FOG client reconciles them on a schedule — so a removal has
to be able to reach the machine on its own.

>[!warning] Printer level "FOG Handles all printers"
>On that level the list FOG sends is authoritative in **both** directions: the
>client removes every installed printer that is not on it, including printers
>FOG did not install. That has always been true of that mode, and is worth
>re-reading now that a group can add to the list.

---

## Pushed values, and why they are gone

>[!warning] Removed from the group page in FOG 1.6
>Everything in this section describes how these controls behaved **on FOG
>1.5**, and on 1.6 before they were removed. They are no longer on the group
>page. **Use Hosts → tick → Edit selected hosts instead** — it does the same
>job over any selection, with an explicit *No change* / *Set on all* /
>*Clear on all* per field.
>
>It is kept because the behavior explains a class of question that will keep
>arriving from 1.5 installs: values that appear on a host with no record of
>how they got there.

Everything in this section applied a value **once**, to the hosts that were
members at the moment you pressed *Update*. A host added afterwards did not
get it; a host removed kept it. Nothing recorded that the write had happened,
so nothing could replay it — which is the whole reason the model was replaced
rather than repaired.

The two plugin equivalents, the `location` and `ou` group tabs, went the same
way and for the same reason, with one extra defect: they had no *No change*
state at all, so saving either tab rewrote the value on **every** member.

### The shared-value hints

Because these fields were per-host, the group page showed a muted hint beneath
each control saying what the members held. The same hints appear in **Edit
selected hosts**, computed over your selection rather than over a group:

| Hint | Meaning |
|------|---------|
| `Hosts: bzImage (all)` | every member host holds that value |
| `Hosts: (varies)` | member hosts differ |
| `Hosts: (empty on all)` | none of the hosts have a value |

The hint is **information only** — it never prefills the input.

### The no-clobber convention

Saving one of these tabs pushes to all current members, but:

- **blank field** → leave each host's value **unchanged**;
- literal **`NULL`** (case-insensitive) → **clear** the field on every host;
- **any other value** → push that value to every host.

That is what lets you set one kernel argument across a group without wiping
every other per-host field. It is also the convention *Edit selected hosts*
replaces with something explicit, because "blank means leave alone" is
undiscoverable and gives you no way to store the literal string `NULL`.

### Active Directory

- **Domain joining** is a tri-state select: **No change**, **Enable on all**,
  **Disable on all**.
- Domain, OU and username follow the no-clobber convention above. The
  password's 32-asterisk placeholder means "unchanged".
- Choosing **Enable on all** populates the blank fields from the FOG AD
  defaults — only when you choose it, never just from existing state.
- A **Current member-host AD state** summary shows join/domain/OU/username
  uniformity above the form.

### Auto-logout

Blank by default, with the global minimum shown only as a placeholder. A blank
save leaves each host alone; a number pushes to all, and under five minutes
disables it. The hint reads `Hosts: N min (all)`, `(varies)` or
`(default on all)`.

### General fields

Kernel, kernel arguments, init, primary disk, BIOS/EFI exit and product key
each carry a `Hosts: …` hint. The kernel, args, init and disk inputs prefill
from the **group's own template** — a group does store those four for itself —
while the hint reports the *members'* state independently. Pushing still
honors the no-clobber convention.

### Enforce hostname / AD-join reboots

A tri-state select — **No change / Enable on all / Disable on all** — with a
`Hosts: enabled (all) / disabled (all) / (varies)` hint.

---

## Power Management

The one control on the group page that is **still** a push in 1.6, and the only
reason the "pushed values" model above is worth understanding as current
behavior rather than as history.

Saving a schedule on a group's **Service Settings → Power Management** tab
writes one `powerManagement` row per host that is a member at that instant. It
is not a group property and nothing records that the write came from a group.

| | Behavior |
|---|---|
| Host added to the group afterward | gets **no** schedule |
| Host removed from the group | **keeps** the schedule |
| *Delete all* on the group tab | reaches **current members only** |
| Saving a second, different schedule | **adds** it; the first stays |
| Saving the same schedule twice | no-op — the row is keyed on host + cron expression + action |

It was not moved into *Edit selected hosts* with the rest, because a schedule
is a cron expression plus an action rather than a single value: it has no
meaningful *Clear on all*, a host may legitimately hold several at once, and
squeezing it into the three-state shape would have made the form lie about what
it does. The correct fix is to make it a **grant**, resolved at read time like
snapins and printers, which needs a group-owned table — a schema change, and so
not part of this release.

Reading a host's own Power Management tab is the only reliable answer to "what
is this machine actually scheduled to do".

---

## Out of scope

- **Force reboot** is a global setting (`FOG_TASK_FORCE_REBOOT`) and a
  per-task option, not per-host configuration, so it has no group control.
- **Tasking** is not shared state. A task acts on the membership at the moment
  you start it, which is what a task should do, and is unaffected by
  everything on this page.
