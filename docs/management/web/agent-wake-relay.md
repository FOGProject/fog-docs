---
title: Agent Wake Relay
aliases:
    - Agent Wake Relay
    - Wake Relay
    - Wake-on-LAN Relay
    - WoL Relay
description: How the FOG Agent wakes a host on a subnet that has no FOG server or storage node — how FOG finds hosts on the same subnet, which agents it asks, and why a wake can fail
context_id: agent-wake-relay
tags:
    - 1_6-changes
    - management
    - web-management
    - agent
    - fog-agent
    - wake-on-lan
---

# Agent Wake Relay

>[!info] FOG 1.6 and later
>The wake relay belongs to the FOG Agent, which works only with a FOG 1.6
>server. The legacy FOG client cannot send a Wake-on-LAN packet.

FOG wakes a host in two ways at the same time. First, the FOG server and the
storage nodes send the magic packet on their own subnets, as they always
did. Second, if you turn on the relay, the server asks up to three awake
agents on the host's own subnet to send the packet too.

**The server always chooses the host to wake and the agents that send.** An
agent only sends. It cannot choose a target, and it cannot send to an
address that it is given.

## The problem it solves

A Wake-on-LAN magic packet is a broadcast, and a broadcast stays on one
subnet. So FOG can wake a host only if a FOG server or a storage node is on
the same subnet. In a routed network, many subnets have neither.

To send a broadcast to a remote subnet (a "directed broadcast"), the routers
must forward it. Most network equipment disables this by default, because
attackers used it for amplification attacks. The
`wolbroadcast` [[1.6/management/web/plugins|plugin]] depends on this router
feature, so it cannot help where the network team keeps it off.

The relay needs no network change. A subnet with FOG hosts on it usually has
one host that is awake, and that host can send the packet for its neighbor.

## Turn it on

The relay is off by default, because one managed machine sends traffic for
another. Go to **FOG Configuration → FOG Settings → FOG Agent** and set
`FOG_AGENT_WAKE_RELAY_ENABLED` to on.

An agent sends wakes only while Power Management is enabled for it. That is
the same module you turn off to stop FOG from changing a machine's power
state.

## How FOG knows which hosts share a subnet

Each agent reports its network interfaces on every poll. For each IPv4
address, the report gives:

- the address and the prefix length, for example `10.1.5.23` and `/24`
- whether the interface is up and has a link (a network card with no cable
  is not up)
- whether the interface is wireless

The server does not trust a network address from an agent. It calculates the
network address and the broadcast address itself, from the address and the
prefix. If it trusted the agent, an agent could claim any subnet and join
that subnet's group of senders.

Two hosts share a subnet when the calculated network address **and** the
prefix are both equal:

| Host | Reported | Network the server calculates | Shares the subnet of host 41? |
|---|---|---|---|
| Host 41 (asleep) | `10.1.5.23/24` | `10.1.5.0/24` | — |
| Host 77 (awake) | `10.1.5.80/24` | `10.1.5.0/24` | Yes |
| Host 90 (awake) | `10.1.0.12/16` | `10.1.0.0/16` | No: a `/16` and a `/24` are never one subnet |

## Which agents the server asks

From the hosts that share a subnet with the sleeping host, the server keeps
only the hosts that meet all of these conditions:

| Condition | Reason |
|---|---|
| The interface on that subnet is up and has a link | A network card with no cable sends nothing |
| The subnet has a broadcast address | A `/31` or `/32` link has none |
| The interface is not wireless | An access point does not pass a broadcast to a machine that is asleep, because that machine is no longer connected to it |
| The agent checked in during the last 15 minutes | The machine must be awake to send |
| It is not the sleeping host | — |

The server sorts the result by the most recent check-in and asks the first
three. It asks more than one because an extra packet costs almost nothing.
With one sender, the wake fails with no error if that sender goes to sleep
before its next poll.

## What happens during a wake

**Someone asks for a wake.** The source is the **Wake Up** task, a group
wake, or a scheduled Wake-on-LAN task.

**The storage-node path runs first, and it does not change.** The server asks
every storage node, and itself, to send the packet on their own subnets. If
a storage node shares the host's subnet, this path is enough.

**The relay path runs in addition.** The server picks up to three senders as
described above. It stores one request for each sender. Each request expires
after 10 minutes, so a laptop that comes back next week does not send an old
wake. The server records the request in the audit log as `agent.wake`.

**Each sender receives the request on its next poll.** The agent does not
listen on a network port. The request is part of the answer to its normal
poll. The request holds the host id and that host's MAC addresses, and
nothing else. The server leaves out pending MAC addresses that nobody
approved.

**The agent sends the packet.** It checks each MAC address and rejects one
that is not valid. It sends the standard 102-byte magic packet to UDP port 9,
at `255.255.255.255` and at the broadcast address of each of its own
interfaces. This is the same packet a storage node sends. The agent handles
at most 32 hosts per poll, and it sends at most one packet for each MAC
address on each interface.

**The agent reports the result.** The result is `sent` with a packet count,
or `failed` with a reason. The server accepts a result only if it has a
pending request for that sender and that host. So an agent cannot report on
a host that the server did not ask it to wake.

## Why a relayed wake did not happen

**The sleeping host does not run the FOG Agent.** The server finds the
sleeping host's subnet from that host's own interface report. A host with the
legacy FOG client, or with no client, has sent no report, so no agent is
asked. The storage-node path still runs for it.

**The sleeping host moved.** The server uses the last report from the
sleeping host. A laptop that moved to another subnet while it was off is
looked for on the old subnet.

**No agent on the subnet is awake and wired.** The server asks no one if no
agent on that subnet meets the conditions above. Examples: every other
machine is asleep, or every awake machine is on Wi-Fi.

**The relay is off.** Check `FOG_AGENT_WAKE_RELAY_ENABLED`.

**The sender has not polled yet.** A relayed wake goes out on the sender's
next poll, so it can take up to one poll interval: 5 minutes by default. The
storage-node path still sends immediately.

**The host cannot wake from the network.** The relay only delivers the
packet. Wake-on-LAN must still be enabled in the host's firmware and on its
network card.

**Only IPv4 is used.** A magic packet uses an IPv4 broadcast.

## Security

A magic packet has no authentication. So the controls are on who can ask for
a wake and what can be asked for. The server and the agent each enforce them.

| Control | Where | Reason |
|---|---|---|
| A target must be a host in FOG, and the MAC addresses are that host's own | Server | There is no path from an arbitrary MAC address to an agent |
| The request comes only in the poll answer, over the agent's authenticated connection | Agent | The agent has no network port for a request to arrive on |
| The request has no address field | Agent | An agent that accepts a destination can be used to send traffic at any address |
| The payload is always the 102-byte magic packet, and the destination is always broadcast on port 9 | Agent | Nothing else can be put on the network |
| At most 32 hosts per poll | Agent | The traffic is bounded, whatever the server sends |
| A result needs a pending request for that sender and that host | Server | An agent cannot write a result for any host in FOG |

The relay does not wake a device that FOG does not manage. Agents do not
talk to each other. It does not wake a host across the internet, because a
magic packet stays on one subnet.

## Related

- [[management/web/fog-agent#Power|FOG Agent: Power]]
- [[kb/reference/fog-agent-reference|FOG Agent Reference]]
- [[kb/troubleshooting/fog-agent-troubleshooting|FOG Agent Troubleshooting]]
- [[management/web/tasks#Wake Up|Tasks: Wake Up]]
