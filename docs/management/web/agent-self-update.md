---
title: Agent Self-Update
aliases:
    - Agent Self-Update
    - Agent Updates
    - Updating the FOG Agent
    - Desired Agent Version
description: How the FOG Agent updates its own binary, what it verifies before it will run one, how to stage a rollout, and how a bad version rolls back
context_id: agent-self-update
tags:
    - 1_6-changes
    - management
    - web-management
    - agent
    - fog-agent
    - security
---

# Agent Self-Update

>[!info] FOG 1.6 and later
>Self-update belongs to the FOG Agent, which works only with a FOG 1.6
>server. The legacy FOG client has no equivalent — it was updated by a
>separate module that pushed binaries from your own server.

An agent can replace its own binary. You name a version; the agents on your
fleet fetch that release, check it, install it and restart into it, without
anyone visiting the machines.

The one idea to hold onto: **this server names a version, and cannot invent
one.** What that version *is* comes from a release manifest signed by FOG
Project, and every agent checks that signature against a certificate
compiled into its own binary before it will run a byte of it. So a FOG
server that is compromised, or simply mistaken, can choose which *published*
version your machines run — and cannot publish one. That boundary is the
reason it is safe to point an unattended update channel at every managed
machine you have.

>[!warning] Nothing updates until you say so
>`FOG_AGENT_DESIRED_VERSION` ships empty, and empty means no host ever
>updates itself. Upgrading your FOG server does not start moving agent
>versions. Unlike every other agent capability, this one is not gated on a
>module switch — it is gated on you having named a version.

## Turning it on

**FOG Configuration → FOG Settings → General Settings →
`FOG_AGENT_DESIRED_VERSION`.** Put an exact version in it, for example
`0.4.2`. Every enrolled host that is not already running that version will
move to it on its next poll.

There is deliberately no `latest`. A fleet-wide channel that tracks whatever
was published this morning hands the decision to the release process rather
than to you, and the whole point of the design is that you choose.

## Staging a rollout

A host's own **Desired Agent Version** beats the global setting, which is
what makes a staged rollout possible:

1. Set **Desired Agent Version** on a handful of hosts — the host's
   **General** tab, or select a group in the host list and use mass edit.
2. Watch the host list. **Agent Version** is what each machine is actually
   running; **Desired Agent Version** is what you told it to become. The
   only question worth asking is whether those two agree.
3. When you are satisfied, set `FOG_AGENT_DESIRED_VERSION` globally and
   clear the per-host values. Clearing them is one mass edit.

>[!note] A per-host override is sticky
>It wins even when it names a version *lower* than the global one. That is
>deliberate and it is the whole recovery story — see
>[[management/web/agent-self-update#Going backwards on purpose|Going backwards on purpose]]
>below. The cost is that a forgotten override holds a machine back silently,
>which is why the host list carries the column: "everything not following
>the fleet" is a filter, and clearing them is one edit.

## What the agent checks before it runs anything

TLS proves where bytes came from. It does not prove who wrote them, and a
compromised server is exactly the case this defends against. So the
transport is not trusted, and four things are checked instead:

| Check | What it stops |
|---|---|
| **Signature.** The release manifest is signed, and the agent verifies it against a code-signing certificate compiled into its own binary | Anything not published by FOG Project — including something served by your own FOG server, or by a mirror you host |
| **Sequence floor.** Each manifest carries a number that only goes up, and the agent remembers the highest it has accepted | A manifest that FOG Project really did sign, months ago, being replayed to walk a fleet back onto a version with a known hole |
| **Artifact hash.** The manifest names the SHA-256 of every download, and the agent streams the file and stops at the size the manifest gave | A mirror that serves a genuine manifest and different bytes. This is the case TLS cannot help with at all |
| **Version floor.** An agent refuses to become a version older than the first one that carried self-update | Downgrading a fleet onto a build with no way to update itself forward again. That is not a rollback, it is a fleet you have to visit |

If any check fails, **nothing is installed and the running binary is not
touched.** The agent reports the failure on its next poll and carries on
doing its job on the version it already has.

## When it goes wrong

Failures appear per host under **History Items → Agent Activity**, and the
same feed for all hosts is under **Logging → Agent Activity**. Each carries
one of these:

| Reported | What happened |
|---|---|
| `bad_desired_version` | The version you typed is not a version |
| `below_floor` | You asked for something older than the oldest version that can update itself |
| `no_signing_root` | This build carries no signing certificate, so it can never accept an update. A packaging fault — report it |
| `signature_invalid` | The manifest is not signed by a key this build trusts |
| `stale_manifest` | The manifest is older than one this agent has already accepted |
| `no_artifact` | The version exists but publishes nothing for this host's OS and architecture |
| `hash_mismatch` | The bytes served are not the bytes the manifest describes |
| `fetch_failed` | The manifest or the download could not be retrieved |
| `cannot_arm_rollback` | The agent could not record what it was replacing, so it refused to replace it |
| `swap_failed` | Replacing the file failed. The old binary is still in place |

`cannot_arm_rollback` is worth reading twice: an update that cannot arm its
own rollback does not happen. The agent will not put itself somewhere it
cannot come back from.

## Rollback

Three layers, and it is worth knowing what each one actually catches.

**The new binary must start.** Replacing the file is a rename, so the
running process keeps executing the old copy until it exits; the agent exits
non-zero, which is how it tells the service manager to start the new one. A
binary that will not start at all is the service manager's problem, and it
already has recovery actions for that.

**The new binary must be able to talk to this server.** This is the one that
matters, because it catches the quieter failure: a version that installs,
starts, runs happily for hours and cannot reach the server that manages it.
An updated agent is on *probation* until it completes one successful
authenticated poll. If it has not managed one within fifteen minutes, it
puts back the binary it replaced, on its own, with nobody logged in.

**A version that is healthy by every local measure and still wrong.** No
agent can detect this — by everything it can see, it is fine. The fix is
this server naming an older version, which is the next section.

>[!note] Hands on the machine
>`fog-agent update-revert` puts back the previous binary immediately. It is
>a separate command on purpose: the code that reverts must not live inside a
>process too broken to run. The previous binary is kept after probation
>passes, precisely so this still works hours later.

## Going backwards on purpose

Set the **Desired Agent Version** to the older version. A per-host value
beats the global one in both directions, so you can pull one machine back
without touching the fleet, or set the global lower to pull everything back.

The floor still applies: an agent will not go below the first version that
carried self-update, because a version without this feature cannot be
updated forward again by anything the agent itself carries.

## Hosting a mirror

**`FOG_AGENT_UPDATE_MANIFEST_URL`** points agents somewhere other than the
location built into them. Empty is the default and means "wherever this
build was told to look".

Set it for a site with no route to the internet, or simply to stop every
machine fetching the same file separately. A copy on any web server will do,
including this one.

>[!important] The mirror is not trusted, and does not need to be
>Whatever it serves still has to carry FOG Project's signature and match the
>hash in the signed manifest. Hosting a mirror gives nobody — including you,
>and including anyone who takes over your FOG server — the ability to change
>what your machines run. The worst a hostile mirror can do is serve nothing,
>or serve something old, and the sequence floor covers the second one.

## Settings

Both under **FOG Configuration → FOG Settings**.

| Setting | Category | Default | Meaning |
|---|---|---|---|
| `FOG_AGENT_DESIRED_VERSION` | General Settings | empty | The version every enrolled host should be running. Empty means no host ever updates itself. A host's own Desired Agent Version overrides it |
| `FOG_AGENT_UPDATE_MANIFEST_URL` | General Settings | empty | Where agents look for the signed release manifest. Empty means the location built into the agent |

## See also

- [[fog-agent|The FOG Agent]] — what the agent does the rest of the time
- [[kb/reference/fog-agent-reference#Commands|FOG Agent Reference]] — the `update` and `update-revert` commands
- [[install-fog-agent|Install the FOG Agent]] — getting an agent onto a machine in the first place
- [[hosts|Host Management]] — the host list, its columns and mass edit
