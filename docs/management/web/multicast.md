---
title: Multicast Sessions
aliases:
    - Multicast
    - Multicast Sessions
    - Multicast Deploy
description: How FOG multicast sessions work, how clients join them, and how to configure concurrent sessions
context_id: multicast
tags:
    - 1_6-changes
    - management
    - web-management
    - web-ui
    - tasks
    - multicast
---

# Multicast Sessions

## Overview

A multicast session deploys one image to many machines at the same time. Instead
of sending a separate copy to each client, the server runs a single `udp-sender`
process that transmits the image once, and every client receiving it writes the
same stream to disk.

That single transmission is the whole point, and it is also the constraint: a
machine that arrives after the transmission has started cannot be given the part
it missed. Everything below follows from that.

## Creating a session

There are three ways to start one.

**From Image Management** — creates a *named* session that other machines can
join by name. You give it a name, the number of clients to expect, and how long
to wait for them. This is the usual choice when you are imaging a room and want
machines to join as they boot.

**From a host or a group** — creates a session for exactly those machines. Group
tasking is the common case: every host in the group is added up front, so there
is nobody left to wait for.

**From a booting machine** — a machine at the boot menu can join a session by
name, and if no session has that name it can create one. FOG asks two questions
before it does:

- *Clients expected to join, including this one* — the number of machines that
  will receive the image.
- *Minutes to wait for them before starting* — how long the session stays open.

Both answers are required. A session with no expected size cannot be joined by
name by anyone else, so creating one without them would produce a session that
only ever images the machine that made it.

!!! note
    Creating a session from a booting machine requires a login that holds the
    `task.task` permission, the same permission needed to create tasking anywhere
    else. See [Roles & Permissions](roles.md).

## Joining a session

A machine joins by selecting the multicast join option at the boot menu, logging
in, and entering the session name.

The session stays open to new machines until the transmission actually begins,
which happens when **either**:

- every expected client has joined, **or**
- the wait period expires.

After that the session is closed and a machine trying to join is told the session
has already started. This is deliberate. Previously a late machine was allowed to
join, received only the tail of the image, and was still reported as a successful
deployment.

If you typo the session name, FOG offers to create a session with that name
rather than dropping you out of the menu. Answer `0` to the expected-clients
prompt to go back and re-enter the name instead.

## Watching a session

Active sessions appear under **Task Management :octicons-arrow-right-24: Active
Multicast Tasks**, and under **Image Management :octicons-arrow-right-24:
Multicast** for named sessions.

The client column reads **joined / expected** — for example `7 / 30` means seven
machines have checked in of the thirty the session is waiting for. A dash in
place of the expected number means the session was created without one, which is
normal for host and group sessions.

More detail is available on the client itself with [ctl]+[alt]+f2, and the
server keeps a per-session log under `/opt/fog/log`.

## Settings

All of these live under **FOG Configuration :octicons-arrow-right-24: FOG
Settings :octicons-arrow-right-24: Multicast Settings**.

### FOG_MULTICAST_PORT_OVERRIDE

The base ports FOG may use for multicast, as a comma separated list:

```
63100,63200,63300
```

**Each port in the list is one session that can run at the same time.** The
example above allows three concurrent sessions. A session uses the port you list
plus the one immediately above it, so ports must be even and between 1024 and
65534; anything else in the list is ignored.

Leave it at `0` (the default) to let FOG pick a port for each session
automatically.

!!! warning
    This setting used to be a single port, and every session was forced onto it — so
    setting it meant only one multicast session could ever really run, and a second
    would silently collide with the first. If you have a single port set today it
    keeps working: it is simply a pool of one. Add more ports to allow more
    concurrent sessions.

### FOG_MULTICAST_MAX_SESSIONS

The maximum number of multicast sessions allowed to run at once. Attempting to
create one beyond the limit fails with a message rather than starting a session
that cannot run.

!!! note
    This limit used to be checked only when creating a session from Image
    Management — sessions created from a host, a group, or a booting machine
    ignored it. It now applies to every path, so a server that was quietly running
    more sessions than this number may start refusing them. Raise the value if that
    is not what you want.

### FOG_UDPCAST_MAXWAIT

The default number of **minutes** a session waits for its expected clients before
transmitting anyway. Sessions created from a booting machine ask for this value
directly instead of using the default.

### FOG_MULTICAST_ADDRESS

An alternate multicast data address. Each concurrent session needs its own
address; when a port pool is configured FOG derives one per pool entry, which is
what keeps two sessions from colliding.

### FOG_UDPCAST_STARTINGPORT

The port FOG starts from when no port pool is configured. FOG moves this along
by itself as sessions are created; you do not normally need to touch it.

## Troubleshooting

**A session sits waiting and never starts.** It is waiting for clients that have
not arrived. It will transmit when the wait period expires. Check the expected
client count is right — if it is higher than the number of machines you are
actually imaging, every session waits the full period.

**A machine is told the session has already started.** The transmission is
already under way and it cannot be added. Start a new session for it.

**A machine cannot join a session by name.** Only sessions created with an
expected client count can be joined by name. Sessions created directly from a
host or group have no name to join.

**Sessions fail to start when several run at once.** Check
`FOG_MULTICAST_PORT_OVERRIDE`. If it holds a single port, only one session can
run; add more ports to the list.

## See also

- [Task Management](tasks.md)
- [Image Management](images.md)
- [Roles & Permissions](roles.md)
