---
title: Multicast Sessions
aliases:
    - Multicast
    - Multicast Sessions
    - Multicast Deploy
description: How FOG multicast sessions work, how clients join them, how to configure concurrent sessions, and how to run multicast across multiple sites
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

>[!note]
>Creating a session from a booting machine requires a login that holds the
>`task.task` permission, the same permission needed to create tasking anywhere
>else. See [Roles & Permissions](roles.md).

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

Active sessions appear under **Task Management → Active
Multicast Tasks**, and under **Image Management →
Multicast** for named sessions.

The client column reads **joined / expected** — for example `7 / 30` means seven
machines have checked in of the thirty the session is waiting for. A dash in
place of the expected number means the session was created without one, which is
normal for host and group sessions.

More detail is available on the client itself with [ctl]+[alt]+f2, and the
server keeps a per-session log under `/opt/fog/log`.

## Multicast across multiple sites

A session is served by exactly **one** `udp-sender`, and that process runs on the
master node of the session's storage group. Multicast traffic also does not
ordinarily cross a router, a WAN link or a site-to-site VPN.

Put those two facts together and the rule falls out: **the stream reaches only
the machines that share a network with the group's master node.** Hosts at any
other site reach the gparted screen and wait there for a transmission that
cannot arrive, until the wait period expires.

Having a storage node at each site is not by itself enough. Nodes that are not
the master do not transmit — they hold a replica of the image, which is what
makes *unicast* imaging work locally, and that is why unicast can look fine while
multicast hangs.

### What to configure

Give each site **its own storage group**:

1. Create a storage group per site.
2. Make that site's node the **master** of its own group.
3. Associate the image with **every** group. Each site's node must physically
   hold the image file, or its sender has nothing to transmit.
4. Install the **Location** plugin, create a location per site pointing at that
   site's group, and assign each host to its location.
5. Confirm `FOGMulticastManager` is running on every node.

Each site's hosts then get their own session — its own port, its own local
sender — and each site images at local network speed.

>[!note]
>Start multicast **per site** rather than as one task spanning sites. A session
>holds until its expected client count arrives, so a single session covering
>every site would make each site's sender wait for machines at the other sites
>before starting.

>[!warning] Before FOG 1.6
>Cross-site multicast could not be made to work by configuration alone. A
>session was always stamped with the image's *primary* storage group no matter
>where the host was, so only that group's master ever transmitted, and the
>Location plugin was not consulted when tasking. Rearranging storage groups on
>an older release will not help. This is still current behavior on FOG 1.5 —
>see the [[1.5/management/web/multicast#Multicast across multiple sites|1.5 version]]
>of this page. Keep multicast within the site holding the master and use
>unicast elsewhere until you upgrade.

## Multicast over IPv6

>[!info] FOG 1.6 and later
>This section applies to FOG 1.6 and later. It needs a FOS init that includes IPv6 multicast. TODO-FOS-PR: a FOS release that includes IPv6 multicast (FOGProject/fos#<to be filled>).

FOG runs an IPv6 multicast session when the IP Address of the storage node is an IPv6 literal, for example `fd00:f06:0:1::1`. A node that you enter by host name stays IPv4. Upper case, lower case, and brackets are all accepted. FOG compares the canonical form of the address.

The session works the same way as an IPv4 session. It waits for the hosts in the task, as set by the session waiting time and the maximum wait. It drops a host that stops answering. It starts on the same signals. There is no new setting.

### Requirements

- The server needs the udpcast that the installer builds from this release. Run the installer again to upgrade.
- The clients need the matching FOS init. Use **Kernel Update** to get it.
- All hosts in a session use the family of the storage node. A session with mixed families is not supported.

### Multicast addresses

FOG uses `FOG_MULTICAST_ADDRESS` and `FOG_MULTICAST_RENDEZVOUS` only when their family matches the session. On an IPv6 session, FOG ignores an IPv4 value and logs it. On an IPv4 session, FOG ignores an IPv6 value and logs it. Leave both settings empty to use the defaults.

| Address | IPv6 default |
| --- | --- |
| Rendezvous | `ff02::1` (all nodes, link local) |
| Data group | `ff15::7564:0:<low 32 bits of the server address>` |

FOG adds the offset of the task to the low 32 bits of an IPv6 multicast address. It does the same for an IPv4 one.

### Network

- The clients must be on the same layer 2 segment as the storage node. Otherwise the network must route the multicast groups (PIM). The rendezvous address `ff02::1` is link local.
- Enable MLD snooping on the switches. MLD snooping is the IPv6 counterpart of IGMP snooping. Without it, the stream floods every port.
- On IPv6, udpcast sends blocks of 1436 bytes by default. On IPv4 it sends 1456 bytes. An IPv6 packet then fits a 1500-byte MTU with no fragmentation.
- Open the multicast UDP port range for IPv6 in the firewall. The iptables summary of the installer now prints an ip6tables line for it. The ufw and firewalld rules already cover both families.

See also [[kb/how-tos/ipv6-network-boot|Boot FOG over IPv6]].

## Settings

All of these live under **FOG Configuration → FOG
Settings → Multicast Settings**.

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

>[!warning]
>This setting used to be a single port, and every session was forced onto it — so
>setting it meant only one multicast session could ever really run, and a second
>would silently collide with the first. If you have a single port set today it
>keeps working: it is simply a pool of one. Add more ports to allow more
>concurrent sessions.

### FOG_MULTICAST_MAX_SESSIONS

The maximum number of multicast sessions allowed to run at once. Attempting to
create one beyond the limit fails with a message rather than starting a session
that cannot run.

>[!note]
>This limit used to be checked only when creating a session from Image
>Management — sessions created from a host, a group, or a booting machine
>ignored it. It now applies to every path, so a server that was quietly running
>more sessions than this number may start refusing them. Raise the value if that
>is not what you want.

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

**Machines at one site image fine, machines at another sit at gparted.** The
sender runs only on the master node of the session's storage group, and its
traffic does not cross the link between sites. See
[Multicast across multiple sites](#multicast-across-multiple-sites). Unicast
working at the remote site does not rule this out — it only shows the image is
replicated there, not that anything is transmitting it.

**The client shows the wrong node's IP.** The host is being pointed at the
master of the image's storage group rather than at its local node. Check the host
is assigned to a location, and that the location points at a group whose master
is the local node.

**The multicast log says a session is already being sent by another node.** Two
nodes can reach the same session and only one may transmit it. This is the
server declining to start a second sender, not an error. If the session never
starts anywhere, the node that holds it is either offline or missing the image
file.

## See also

- [Task Management](tasks.md)
- [Image Management](images.md)
- [Storage Node Management](storage-node.md)
- [Roles & Permissions](roles.md)
