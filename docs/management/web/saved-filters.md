---
title: Saved Filters
aliases:
    - Saved Filters
    - Sharing Filters
    - Saved Searches
description: how to save a filter you have built on a FOG list, apply it again later, and share it with a person, a user group, a role or everybody
context_id: saved-filters
tags:
    - management
    - web-management
    - web-ui
---

# Saved Filters

A filter you have built once — see [[filtering-lists|Filtering Lists]] — can be
given a name and kept. **Saved filters** is the button beside **Filter** on any
list, and it does two jobs: it hands back the filters you have kept, and it
saves the one you have on screen right now.

Filters are saved per list. A filter you save on the host list is offered on
the host list and nowhere else, because the columns it names only exist there.

## Saving one

1. Build the filter you want with the **Filter** panel, so the list is showing
   what you are after.
2. Click **Saved filters**.
3. Type a name at the bottom, under *Save the current filter*, and click
   **Save**.

If nothing is filtered when you open it, that section says so instead — there
is nothing to save.

Saving under a name you have already used replaces that filter, which is how
you adjust one: apply it, change the rules, and save it under the same name.

## Applying one

Open **Saved filters** and click **Apply** next to the one you want. The list
filters immediately and a **chip** appears above it naming the filter that is
in force.

>[!note]
>**A saved filter is never applied on its own.** Coming back to a list, or
>signing in tomorrow, always gives you the whole list. This is the same rule
>that keeps searches out of a saved layout — a list that came back short with
>nothing on screen to explain it looks exactly like data that has gone missing.
>See [[list-layout|Arranging Lists]].

## Turning one off

Click the **×** on the chip. That is the whole gesture — one click, from
anywhere on the page, and the list is complete again.

The chip is the only thing on screen that says a saved filter is running, so it
goes away by itself if you clear the filter some other way, such as **Clear
All** in the Filter panel.

## Sharing

A filter can be handed to other people. Open **Saved filters**, click **Share**
next to one you own, and tick who should have it:

| Share with | They see it | Good for |
| --- | --- | --- |
| **Users** | the people you tick, and nobody else | a filter you want one person to look over |
| **User groups** | everyone in the group, including people added later | a team's standing view of a list |
| **Roles** | everyone holding that role | "every helpdesk operator should have this" |

You can tick any combination. Sharing does not give anything away: the people
you share with can *apply* the filter, and only you can rename, re-share or
delete it.

You can only share with users, groups and roles you are already allowed to see.
If you have no permission to view users, that column is simply not offered —
you can still save filters for yourself.

### Sharing with everybody

**Share with everyone** makes a filter appear in every user's picker on that
list. It is a separate permission (`savedfilter.create`) precisely because it
changes what other people see, so the option is only shown to an account whose
role grants it. See [[roles|Roles & Permissions]].

A global filter has no owner, so it stays where it is if the person who created
it is later deleted.

### Which reason is shown

The same filter can reach you several ways at once — a colleague ticks your
name, *and* you are in the group they shared it with, *and* you hold the role.
It is still one entry in your picker, labeled with the most specific reason you
can see it:

    yours → shared with you → shared with a group you are in →
    shared with a role you hold → everyone

So a filter your manager shared with you directly says *Shared with you by*
them, even if it also went to your whole team.

## Renaming and deleting

**Rename** and **Delete** sit next to **Share**, on filters you own. Deleting
one removes it for everybody it was shared with; nothing is left behind.

You cannot delete a filter somebody shared with you — it is not yours, and for
a filter shared to a role it was never a decision one person makes. If you do
not want it, ignore it: it sits in a picker you only open on purpose, and
nothing about it changes what your lists show until you apply it.

## What is remembered, and what is not

Whether the **Column search** row is showing is remembered against your
account, so a list you like filtering from the headings opens that way. What
you *typed* in those boxes is not remembered — the row comes back empty. The
same distinction runs through all of this: FOG remembers how you like to work,
and never a question you asked once.
