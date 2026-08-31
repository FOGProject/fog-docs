---
title: "Multicast Sessions (1.5)"
aliases:
    - "Multicast (1.5)"
    - "Multicast Sessions (1.5)"
description: How FOG multicast sessions work on FOG 1.5, and why cross-site multicast cannot be made to work by configuration alone on this line
context_id: "multicast-1.5"
tags:
    - management
    - web-management
    - web-ui
    - tasks
    - multicast
    - 1_5-legacy
---

# Multicast Sessions (1.5)

>[!info] This page describes FOG 1.5.
>See the [[management/web/multicast|1.6 version]] of this page for FOG 1.6.

## Overview

A multicast session deploys one image to many machines at the same time.
Instead of sending a separate copy to each client, the server runs a single
`udp-sender` process that transmits the image once, and every client
receiving it writes the same stream to disk.

That single transmission is the whole point, and it is also the constraint:
a machine that arrives after the transmission has started cannot be given
the part it missed. Everything below follows from that.

## Creating a session

There are three ways to start one.

**From Image Management** — creates a *named* session that other machines
can join by name. You give it a name, the number of clients to expect, and
how long to wait for them. This is the usual choice when you are imaging a
room and want machines to join as they boot.

**From a host or a group** — creates a session for exactly those machines.
Group tasking is the common case: every host in the group is added up
front, so there is nobody left to wait for.

**From a booting machine** — a machine at the boot menu can join a session
by name, and if no session has that name it can create one. FOG asks two
questions before it does:

- *Clients expected to join, including this one* — the number of machines
  that will receive the image.
- *Minutes to wait for them before starting* — how long the session stays
  open.

Both answers are required. A session with no expected size cannot be joined
by name by anyone else, so creating one without them would produce a
session that only ever images the machine that made it.

## Joining a session

A machine joins by selecting the multicast join option at the boot menu,
logging in, and entering the session name.

The session stays open to new machines until the transmission actually
begins, which happens when **either**:

- every expected client has joined, **or**
- the wait period expires.

After that the session is closed and a machine trying to join is told the
session has already started.

If you typo the session name, FOG offers to create a session with that name
rather than dropping you out of the menu. Answer `0` to the
expected-clients prompt to go back and re-enter the name instead.

## Watching a session

Active sessions appear under **Task Management → Active Multicast Tasks**,
and under **Image Management → Multicast** for named sessions.

The client column reads **joined / expected** — for example `7 / 30` means
seven machines have checked in of the thirty the session is waiting for. A
dash in place of the expected number means the session was created without
one, which is normal for host and group sessions.

More detail is available on the client itself with [ctl]+[alt]+f2, and the
server keeps a per-session log under `/opt/fog/log`.

## Multicast across multiple sites

A session is served by exactly **one** `udp-sender`, and that process runs
on the master node of the session's storage group. Multicast traffic also
does not ordinarily cross a router, a WAN link or a site-to-site VPN.

>[!warning] Cross-site multicast cannot be made to work by configuration
>A multicast session is always stamped with the image's **primary** storage
>group, no matter which site the host is actually at, and the Location
>plugin is not consulted when a multicast task is created — even with a
>storage group and a master node at every site, and the image replicated to
>every one of them, only the primary group's master ever transmits.
>Rearranging storage groups will not help.
>
>Keep multicast **within the site holding the master** and use unicast
>everywhere else. Hosts at any other site reach the gparted screen and wait
>there for a transmission that cannot arrive, until the wait period
>expires — having a storage node at the site is not by itself enough, since
>a node that is not the master does not transmit; it only holds a replica,
>which is what makes *unicast* imaging work locally there.

## Settings

All of these live under **FOG Configuration → FOG Settings → Multicast
Settings**.

### FOG_MULTICAST_PORT_OVERRIDE

The base ports FOG may use for multicast, as a comma separated list:

```
63100,63200,63300
```

**Each port in the list is one session that can run at the same time.** The
example above allows three concurrent sessions. A session uses the port you
list plus the one immediately above it, so ports must be even and between
1024 and 65534; anything else in the list is ignored.

Leave it at `0` (the default) to let FOG pick a port for each session
automatically.

### FOG_MULTICAST_MAX_SESSIONS

The maximum number of multicast sessions allowed to run at once. Attempting
to create one beyond the limit fails with a message rather than starting a
session that cannot run. This applies to every way of creating a session —
from Image Management, a host, a group, or a booting machine.

### FOG_UDPCAST_MAXWAIT

The default number of **minutes** a session waits for its expected clients
before transmitting anyway. Sessions created from a booting machine ask for
this value directly instead of using the default.

### FOG_MULTICAST_ADDRESS

An alternate multicast data address. Each concurrent session needs its own
address; when a port pool is configured FOG derives one per pool entry,
which is what keeps two sessions from colliding.

### FOG_UDPCAST_STARTINGPORT

The port FOG starts from when no port pool is configured. FOG moves this
along by itself as sessions are created; you do not normally need to touch
it.

## Troubleshooting

**A session sits waiting and never starts.** It is waiting for clients that
have not arrived. It will transmit when the wait period expires. Check the
expected client count is right — if it is higher than the number of
machines you are actually imaging, every session waits the full period.

**A machine is told the session has already started.** The transmission is
already under way and it cannot be added. Start a new session for it.

**A machine cannot join a session by name.** Only sessions created with an
expected client count can be joined by name. Sessions created directly from
a host or group have no name to join.

**Sessions fail to start when several run at once.** Check
`FOG_MULTICAST_PORT_OVERRIDE`. If it holds a single port, only one session
can run; add more ports to the list.

**Machines at one site image fine, machines at another sit at gparted.**
Cross-site multicast is not supported on this line — see
[Multicast across multiple sites](#multicast-across-multiple-sites) above.
Unicast working at the remote site does not rule this out — it only shows
the image is replicated there, not that anything is transmitting it.

**The multicast log says a session is already being sent by another node.**
Two nodes can reach the same session and only one may transmit it. This is
the server declining to start a second sender, not an error. If the
session never starts anywhere, the node that holds it is either offline or
missing the image file.

## See also

- [[management/web/images|Image Management]]
- [[management/web/storage-node|Storage Node Management]]
