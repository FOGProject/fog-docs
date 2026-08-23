---
title: The Ping Hosts Service
aliases:
    - Ping Hosts
    - FOGPingHosts
    - Host Reachability
description: How FOG decides whether a host is up, what the Last Ping and Last Check-In fields mean, and what changed in 1.6
context_id: ping-hosts-service
tags:
    - reference
    - hosts
    - management
    - 1_6-changes
---

# The Ping Hosts Service

`FOGPingHosts` is the background service that answers one question for every
host in your database: *can the server reach it right now?* Its verdict is what
the **Ping Status** column on [[hosts|Host Management]] shows, and since 1.6 it
also stamps the **Last Successful Ping** field on each host.

This page explains what that verdict actually measures — which is not what most
people assume — and what changed in 1.6.

>[!warning] It is not an ICMP ping
>Despite the name, the service has never sent an ICMP echo request. It opens a
>**TCP connection to a single port** and records whether the connection
>succeeded. A host that answers `ping` at the command line but does not listen
>on that port is reported unreachable, and that is working as designed.

## What "up" meant before 1.6

The old behavior, in order:

1. Resolve the host's **name** through DNS.
2. Open a TCP connection to **port 445** (SMB), giving up after **2 seconds**.
3. Record the resulting socket error number on the host. `0` means the
   connection succeeded.

Both the port and the timeout were fixed in the code with no way to change
them. Three consequences followed from that, and all three were reported as
bugs over the years:

- **"Is this host up?" really meant "does this host accept SMB?"** A Linux
  host, a Windows host with file and printer sharing turned off, and anything
  behind a host firewall are all permanently "unreachable" no matter how
  healthy they are.
- **Hosts were tested one at a time.** Every unreachable host cost the full
  2-second timeout before the next one was tried. 500 powered-off hosts is
  500 × 2s ≈ 17 minutes against a 300-second sleep interval, so on a fleet of
  any size the service simply ran continuously and its answers were always
  stale.
- **Only the latest verdict was kept.** There was no record of *when* a host
  was last reachable, so "this host has been off for a month" and "this host
  went off ten minutes ago" looked identical.

## What changed in 1.6

### The port and the timeout are yours to set

**FOG Configuration → FOG Settings → Ping Host Settings**

| Setting | Default | What it does |
|---|---|---|
| `PINGHOSTPORT` | `445` | The TCP port to connect to. It must be a port your hosts actually listen on. |
| `PINGHOSTTIMEOUT` | `2` | Seconds to wait for an answer before recording the host as unreachable. |

The defaults are exactly the old hardcoded values, so **upgrading changes
nothing** until you edit them. Both are re-read at the start of every cycle, so
a change takes effect on the next run without restarting the service.

Choosing a port:

- **Mostly Windows** → leave it at `445`.
- **Mostly Linux** → `22` is the usual choice.
- **Mixed** → the test is a single port, so pick the one most of your fleet
  answers and rely on the client check-in (below) for the rest.
- **A port nothing listens on** makes every host permanently unreachable. If
  every host in your fleet went red after an upgrade, check this setting first.

### Hosts are tested in parallel

Connections are now opened in batches of up to 128 at a time and waited on
together, so the timeout is roughly the length of a whole *cycle* rather than a
cost paid per host. On a test server with 88 hosts, of which 86 were switched
off, the connection phase fell from about 176 seconds to about 2.

`PINGHOSTTIMEOUT` therefore behaves differently than it reads: raising it to 5
adds about 3 seconds to a cycle, not 3 seconds per unreachable host.

### Hosts that just checked in are skipped

If a host's FOG client has checked in more recently than one sleep interval ago
(`PINGHOSTSLEEPTIME`, 300 seconds by default), the service does not ping it.

A check-in is a *better* liveness signal than the ping — it proves the machine
is on **and** that the agent is working, where the ping only proves that
something answered a TCP port — and it costs nothing to use, because the host
already told us. With `FOG_CLIENT_CHECKIN_TIME` at its default of 60 seconds, a
client-managed host checks in around five times per cycle and is skipped every
time.

What is left to ping is hosts with no client or a broken one, which is exactly
the set the ping is useful for. On the same 88-host test server, a full cycle
fell from about 5 minutes 26 seconds to under 6 seconds, because the dominant
cost was never the connections — it was one blocking DNS lookup per host, and
skipping a host skips its lookup too.

### `FOG_HOST_LOOKUP` does something again

The **List All Hosts** page does not ping anything. The Ping Status column
renders the verdict the *service* last recorded, which costs one
already-fetched database column, so the page is the same speed whether the
column is shown or not.

>[!note] Older advice about this setting no longer applies
>Long-standing documentation said to untick `FOG_HOST_LOOKUP` on fleets over
>about 250 hosts to stop the host list being slow. On 1.5 that setting is
>read by the configuration page and by nothing else — it gates no behavior at
>all, so unticking it never sped anything up. In 1.6 it does have an effect
>again: it controls whether the Ping Status column is **shown**. Turn it off
>if the column is noise on your fleet, not for speed.

A host that has never been pinged — a brand-new registration, or any host on a
server where the service is disabled — shows **Not pinged** rather than
pretending to a verdict.

## The two "last seen" fields

1.6 records two timestamps per host, shown on the host's **General** tab and as
columns on the host list.

| Field | Column | Written by | What it proves |
|---|---|---|---|
| **Last Successful Ping** | Last Ping | `FOGPingHosts`, only on a **successful** connection | the machine was powered on and reachable on your chosen port |
| **Last Client Check-In** | Last Check-In | the FOG client, on every check-in | the agent is installed, running, and can reach the server |

Both read **Never** until the event in question has happened at least once.

A failed ping deliberately does **not** touch Last Successful Ping. Overwriting
it with the time of a failed attempt would make a host that has been off for a
month indistinguishable from one that answered a minute ago, which is the whole
reason the field exists.

### Why two fields and not one "last seen"

Because the rollup is easy and the split is not: "last seen" is just the later
of the two, and you can read that off the pair at a glance. The pair cannot be
recovered from a single rolled-up value — and the case that costs you support
time is precisely the **disagreement** between them:

| Last Ping | Last Check-In | What it usually means |
|---|---|---|
| recent | recent | healthy, nothing to do |
| recent | old or Never | machine is up, **the FOG client is broken, stopped, or never installed** |
| old or Never | recent | client is fine — the host does not answer on `PINGHOSTPORT`. Normal for Linux hosts and firewalled Windows hosts; usually not a fault |
| old | old | the machine has genuinely been off since the later of the two |

The second row is the one worth acting on, and a single "last seen" column
erases it entirely.

### They are read-only

Both fields are displayed but cannot be edited — they are facts the server
records about the host, not settings. They are also not part of what a host
edit submits, so nothing you do on that form can alter them.

## Settings reference

| Setting | Category | Default |
|---|---|---|
| `PINGHOSTGLOBALENABLED` | FOG Linux Service Enabled | on |
| `PINGHOSTPORT` | Ping Host Settings | `445` |
| `PINGHOSTTIMEOUT` | Ping Host Settings | `2` |
| `PINGHOSTSLEEPTIME` | FOG Linux Service Sleep Times | `300` |
| `PINGHOSTLOGFILENAME` | FOG Linux Service Logs | `pinghost.log` |
| `PINGHOSTDEVICEOUTPUT` | FOG Linux Service TTY Output | `/dev/tty6` |
| `FOG_HOST_LOOKUP` | General Settings | on — shows the Ping Status column |

With `PINGHOSTGLOBALENABLED` off, no host is ever pinged, Ping Status stays at
whatever was last recorded, and **Last Successful Ping** stops advancing.
**Last Client Check-In** is unaffected, because the client writes it.

## Troubleshooting

**Every host shows unreachable.** Check `PINGHOSTPORT` first — a port your
fleet does not listen on produces exactly this. Then confirm the server can
resolve host names: the service looks hosts up by **name**, so it needs a DNS
server that your DHCP server updates, or the names in `/etc/hosts`. Test with

```
getent hosts somehostname
```

If that fails, the ping cannot succeed no matter what port you choose. Adding
your domain to the server's DNS **search domains** is the usual fix when a host
resolves as `somehostname.example.com` but not as `somehostname`.

**A single host shows unreachable but you can reach it.** Almost always a host
firewall blocking `PINGHOSTPORT`, or a service on the host that is not running.
Check its **Last Client Check-In**: if that is current, the host is fine and
only the port test is failing.

**Nothing is being pinged at all.** Check `PINGHOSTGLOBALENABLED`, then the
service log at `/var/log/fog/pinghost.log` (or wherever
`PINGHOSTLOGFILENAME` points). The log names how many hosts were pinged, how
many were skipped for a recent check-in, and how long the cycle took.

**The service says it is not the FOG web server.** `FOG_WEB_HOST` must resolve
to an address on the machine running the service. This is the guard that stops
a storage node from pinging your whole fleet.

## Related

- [[hosts|Host Management]]
- [[fog-client-installation-options|FOG Client installation options]]
- [[network-and-firewall-requirements|Network and firewall requirements]]
