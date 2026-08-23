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

>[!warning] Before 1.6, it was not an ICMP ping
>Despite the name, the service never sent an ICMP echo request until 1.6. It
>opened a **TCP connection to a single port** and recorded whether the
>connection succeeded, so a host that answered `ping` at the command line but
>did not listen on that port was reported unreachable — and that was working as
>designed. Since 1.6 it sends a real echo request first and falls back to the
>TCP check; see [[#It sends a real ping now]].

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

### It sends a real ping now

Since 1.6 the service sends an **ICMP echo request** — an actual ping, the same
thing `ping` at a command line sends. That asks the question the field is named
after: *is this machine up?*, rather than *does this machine run a service on
the one port we guessed at?*

The TCP check has not gone away. It runs **second**, and only for the hosts the
echo did not positively answer:

1. Send an ICMP echo request to every host, all of them in flight at once.
2. Anything that replies is **Online**, recorded as reached by ICMP.
3. Everything else falls through to the TCP connection described below, and the
   TCP result decides those.

The fallback is the point. Plenty of healthy networks filter ICMP, so a host
that does not answer an echo has told you nothing on its own — it is the TCP
probe that gets the final say. That also means **upgrading cannot lose you a
host**: anything detected before is still detected the same way, and hosts that
only ever answered `ping` now appear as well.

>[!note] No setup needed
>The service already runs as root, so it can open the socket it needs on any
>supported distribution. There is nothing to install, no `sysctl` to change and
>no firewall rule to add on the FOG server.

#### Turning it off

| Setting | Default | What it does |
|---|---|---|
| `PINGHOSTUSEICMP` | on | Send an ICMP echo request before falling back to the TCP check. |

Turn it off and the service behaves exactly as it did before — TCP only. Worth
doing if your network floods on ICMP, or if a security policy forbids it.

If ICMP is enabled but the server cannot open the socket, the service says so
in its log **once per cycle** and carries on with the TCP check alone. It will
not fail silently:

```
 * ICMP is enabled but no echo socket could be opened; falling back to the TCP check only
```

#### Which way a host answered

FOG records *how* each host was reached, because on a mixed fleet "Online"
alone hides a difference people ask about. You will see it in two places:

- **Host Management** — the Ping Status badge reads **Online · ICMP** or
  **Online · TCP**.
- **The host's own page** — appended to Last Successful Ping, e.g.
  `2026-08-23 01:14:52 (ICMP)`.

A host that switches from `ICMP` to `TCP` between cycles is usually a firewall
rule change, not a fault.

### The port and the timeout are yours to set

**FOG Configuration → FOG Settings → Ping Host Settings**

| Setting | Default | What it does |
|---|---|---|
| `PINGHOSTPORT` | `445` | The TCP port to connect to. |
| `PINGHOSTTIMEOUT` | `2` | Seconds to wait for an answer before recording the host as unreachable. |

The defaults are exactly the old hardcoded values, so **upgrading changes
nothing** until you edit them. Both are re-read at the start of every cycle, so
a change takes effect on the next run without restarting the service.

Choosing a port matters much less than it looks. Two reasons: the ICMP echo
already answered for most of your fleet before the port is ever tried, and a
host that *refuses* the connection has still proved it is alive. What you are
really choosing is how the remainder gets detected:

- **Mostly Windows** → leave it at `445`.
- **Mostly Linux** → `22` is a reasonable choice.
- **Mixed** → pick whichever the larger half answers. The other half will
  mostly still be detected, as **Up, port closed**.
- **The port only fails you against a host firewall that silently DROPs**
  rather than rejecting, because then nothing comes back at all. That host is
  indistinguishable from one that is switched off, and the client check-in is
  the only thing that will tell you otherwise.

### A refused connection means the host is up

This is the single most useful thing to understand about the check.

If a host is powered on but nothing is listening on the port, its kernel
replies with a TCP reset and FOG records `Connection refused`. **That is proof
of life** — a machine can only send that reset if it is on, on the network and
routable from the server. It counts as reachable, it advances Last Successful
Ping, and the host list shows it as **Up, port closed**.

So the states you will see in the Ping Status column are:

| Badge | Means |
|---|---|
| **Online · ICMP** | up — it answered a real ping |
| **Online · TCP** | up — it did not answer the ping, but something answered on `PINGHOSTPORT` |
| **Up, port closed** | up — the host refused the connection. Normal for a Linux host on 445, or a Windows host on 22 |
| *an error, e.g. Connection timed out* | nothing came back at all. Switched off, or a firewall dropping silently — genuinely unknown |
| **Not pinged** | never tested |

A plain **Online** with no suffix is a host last pinged by an older version;
it gets its suffix on the next cycle.

>[!note] One false positive worth knowing about
>A firewall or middlebox configured to **reject** on a host's behalf sends the
>same reset, so "Up, port closed" would really mean "the firewall in front of
>it is up". A firewall that **drops** — the more common default — still times
>out and is still reported correctly. The trade is deliberate: the alternative
>mislabels every perfectly healthy host that happens not to run the service you
>picked.

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
| **Last Successful Ping** | Last Ping | `FOGPingHosts`, whenever the host **answered** | the machine was powered on, on the network, and routable from the server |
| **Last Client Check-In** | Last Check-In | the FOG client, on every check-in | the agent is installed, running, and can reach the server |

Both read **Never** until the event in question has happened at least once.

"Answered" includes a refused connection — see above. A ping that got no
answer at all deliberately does **not** touch Last Successful Ping. Overwriting
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
| old or Never | recent | client is fine, and the host is silently dropping the connection rather than refusing it — a host firewall. Not a fault, but the ping cannot see this host |
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
| `PINGHOSTUSEICMP` | Ping Host Settings | on |
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

**Every host shows unreachable.** Start with DNS, not with the port — a wrong
port normally produces **Up, port closed**, not "unreachable". The service
looks hosts up by **name**, so it needs a DNS server that your DHCP server
updates, or the names in `/etc/hosts`. Test with

```
getent hosts somehostname
```

If that fails, the ping cannot succeed no matter what port you choose. Adding
your domain to the server's DNS **search domains** is the usual fix when a host
resolves as `somehostname.example.com` but not as `somehostname`.

**A single host shows unreachable but you can reach it.** A host firewall that
silently drops the connection instead of refusing it. Check its **Last Client
Check-In**: if that is current, the machine is fine and only the port test
cannot see it. Allowing the port through that host's firewall — even to a
closed port — is enough to make it show as **Up, port closed**.

**A host shows "Up, port closed" and you expected "Online".** Working as
intended: the machine is up and nothing is listening on `PINGHOSTPORT`. Change
the port if you would rather test a service this host actually runs, or leave
it — the liveness answer is the same either way.

**Every host shows "Online · TCP" and none shows ICMP.** Either
`PINGHOSTUSEICMP` is off, or the echo socket could not be opened — look in the
service log for `no echo socket could be opened`, which is written once per
cycle. If neither applies, your network is filtering ICMP, and the TCP fallback
is doing exactly what it is there for.

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
