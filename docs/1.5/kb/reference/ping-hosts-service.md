---
title: "The Ping Hosts Service (1.5)"
aliases:
    - "The Ping Hosts Service (1.5)"
description: How FOG 1.5's ping host service decides whether a host is reachable — a TCP-only check, not an ICMP ping — and what the Ping Status column shows
context_id: "ping-hosts-service-1.5"
tags:
    - reference
    - hosts
    - management
    - 1_5-legacy
---

# The Ping Hosts Service (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/kb/reference/ping-hosts-service|1.6 version]] of this page for FOG 1.6.

`FOGPingHosts` is the background service that answers one question for every
host in your database: *can the server reach it right now?* Its verdict is
what the **Ping Status** column on [[1.5/management/web/hosts|Host Management]]
shows.

>[!warning] Despite the name, it never sends an ICMP echo request
>The service does not "ping" a host the way `ping` at a command line does. It
>opens a **TCP connection to port 445** (SMB) and records whether the
>connection succeeded, so a host that answers `ping` but does not listen on
>port 445 — most Linux hosts, or any Windows host with file and printer
>sharing turned off — is reported unreachable. That is working as designed on
>this version.

## How it decides "up"

For every host, in order:

1. Resolve the host's **name** through DNS.
2. Open a TCP connection to **port 445**, giving up after **2 seconds**.
3. Record the resulting socket error number on the host. `0` means the
   connection succeeded.

Both the port and the timeout are **fixed in the code** — 1.5 has no setting
for either, and no way to change them without editing `ping.class.php`.

## What this means in practice

- **"Is this host up?" really means "does this host accept SMB?"** A Linux
  host, a Windows host with file and printer sharing off, and anything behind
  a host firewall are all permanently reported unreachable no matter how
  healthy they are.
- **A refused connection still counts as reachable.** If a host is powered on
  but nothing is listening on port 445, its kernel replies with a TCP reset.
  That is proof of life — only a machine that is on, on the network and
  routable from the server can send that reset — so it is recorded as up. A
  host that silently *drops* the connection instead (a firewall configured to
  drop rather than reject) looks identical to one that is switched off.
- **Hosts are tested one at a time.** Every unreachable host costs the full
  2-second timeout before the next one is tried. On a fleet with any number of
  powered-off hosts, this adds up quickly against the sleep interval between
  cycles (`PINGHOSTSLEEPTIME`, 300 seconds by default), and the service can end
  up running continuously with stale answers.
- **Only the latest verdict is kept.** There is no "Last Successful Ping"
  field on this version — just the current Ping Status. "This host has been
  off for a month" and "this host went off ten minutes ago" look identical,
  because nothing records *when* a host was last seen reachable. (1.6 adds a
  Last Successful Ping / Last Client Check-In pair for exactly this reason —
  see the [[1.6/kb/reference/ping-hosts-service|1.6 version]] of this page.)

## Settings reference

| Setting | Category | Default |
|---|---|---|
| `PINGHOSTGLOBALENABLED` | FOG Linux Service Enabled | on |
| `PINGHOSTSLEEPTIME` | FOG Linux Service Sleep Times | `300` |
| `PINGHOSTLOGFILENAME` | FOG Linux Service Logs | `pinghost.log` |
| `PINGHOSTDEVICEOUTPUT` | FOG Linux Service TTY Output | `/dev/tty3` |

There is no `PINGHOSTPORT`, `PINGHOSTTIMEOUT`, or `PINGHOSTUSEICMP` setting on
this version — those are all 1.6 additions. The port and timeout are the
`445` / `2` values hardcoded in `ping.class.php`.

With `PINGHOSTGLOBALENABLED` off, no host is ever pinged and Ping Status stays
at whatever was last recorded.

>[!note] `FOG_HOST_LOOKUP` does nothing on this version
>The **List All Hosts** page has an `FOG_HOST_LOOKUP` setting on the
>configuration page, and long-standing advice says to untick it on fleets over
>about 250 hosts to keep the host list fast. On 1.5 that setting is read by
>the configuration page and by nothing else — it does not gate any behavior,
>so unticking it never sped anything up. (1.6 wires it up for real, to control
>whether the Ping Status column is shown.)

## Troubleshooting

**Every host shows unreachable.** Start with DNS, not the port. The service
looks hosts up by **name**, so it needs a DNS server your DHCP server updates,
or entries in `/etc/hosts`. Test with:

```
getent hosts somehostname
```

If that fails, the ping cannot succeed regardless of what is listening on port
445.

**A single host shows unreachable but you can reach it.** Most likely a host
firewall that silently *drops* the connection instead of refusing it — that
looks identical to a host that is switched off, because nothing comes back at
all. Allowing port 445 through that host's firewall, even to a closed
service, is enough to make it show as reachable (a refused connection still
counts, as above).

**Nothing is being pinged at all.** Check `PINGHOSTGLOBALENABLED`, then the
service log at `/var/log/fog/pinghost.log` (or wherever `PINGHOSTLOGFILENAME`
points).

**The service says it is not the FOG web server.** `FOG_WEB_HOST` must
resolve to an address on the machine running the service — this is the guard
that stops a storage node from pinging your whole fleet.

## Related

- [[1.5/management/web/hosts|Host Management]]
- [[fog-client-installation-options|FOG Client installation options]]
- [[network-and-firewall-requirements|Network and firewall requirements]]
