---
title: Agent Self-Update
aliases:
    - Agent Self-Update
    - Agent Updates
    - Updating the FOG Agent
    - Desired Agent Version
    - Agent Update Mode
    - Agent Update Rings
description: How the FOG Agent updates itself — update modes, update rings, the minimum version, the server's copy of each release, what the agent verifies, and how a bad version rolls back
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

An agent can replace its own binary. You choose how the fleet updates: not
at all, to one version that you name, or to each new release in stages.
The agents fetch the release, check it, install it and restart into it.
Nobody has to visit the machines.

The one idea to hold onto: **this server names a version, and cannot invent
one.** What that version *is* comes from a release manifest signed by FOG
Project, and every agent checks that signature against a certificate
compiled into its own binary before it will run a byte of it. So a FOG
server that is compromised, or simply mistaken, can choose which *published*
version your machines run — and cannot publish one. That boundary is the
reason it is safe to point an unattended update channel at every managed
machine you have.

>[!warning] Nothing updates until you say so
>`FOG_AGENT_UPDATE_MODE` ships as **Off**. Upgrading your FOG server does
>not start moving agent versions. A server that already had
>`FOG_AGENT_DESIRED_VERSION` set is upgraded to **Pinned** on that version,
>so it continues to do what it did.

## Update modes

**FOG Configuration → FOG Settings → FOG Agent → `FOG_AGENT_UPDATE_MODE`.**

| Mode | What hosts do |
|---|---|
| **Off** | No host updates. The exceptions are a host with its own **Desired Agent Version**, and a host below `FOG_AGENT_MIN_VERSION` |
| **Pinned** | Every host runs `FOG_AGENT_DESIRED_VERSION`, an exact version such as `0.1.8` |
| **Latest** | Every host runs the newest release, after the delay of its update ring |

In every mode, a host's own **Desired Agent Version** wins over the mode,
and `FOG_AGENT_MIN_VERSION` is a floor under all of them.

**The server decides what Latest means.** It reads the signed release
manifest and turns "the newest release for this host's ring" into an exact
version. The agent still receives an exact version and still checks the
signature. So Latest does not change what a server can do: it can choose
only a published version. Every agent that can update itself follows
Latest, because it receives a version as before.

## Update rings

Latest mode sends a new release to your hosts in stages. A ring is a delay
in days.

- **`FOG_AGENT_UPDATE_RINGS`** lists the delays, separated by commas. The
  default is `0,3,7`: ring 0 gets a release at once, ring 1 after 3 days,
  and ring 2 after 7 days.
- **Agent Update Ring** on each host sets its ring. Set it on the host's
  **General** tab, or select hosts in the host list and use mass edit. Mass
  edit shows each ring with its delay, for example *Ring 1 (3 days)*.
- **A blank ring is the last ring.** A ring number past the end of the list
  is also the last ring. So a new host is never among the first to update.

A delay counts from **when this server first saw the release**, not from
the release date. The release sync records that time when a release first
appears in the manifest it downloads.

>[!note] The first sync starts every clock
>At its first sync, the server sees every published release for the first
>time. A host in ring 2 then waits 7 days for any release, even a release
>that is months old. To move a host now, set its ring to 0.

Latest never moves a host below the version it runs. A host that a pin or
an override took to a newer version stays there when you clear the pin. The
exception is a withdrawn release. When FOG Project removes a version from
the manifest, that version does not hold its hosts, and they go to the
newest release that their ring allows.

### A rollout with rings

1. Put a few test machines in ring 0, and the rest of the fleet in rings 1
   and 2. Select the machines with a group filter in the host list, then
   mass edit **Agent Update Ring**.
2. Set `FOG_AGENT_UPDATE_MODE` to **Latest**.
3. When a new release appears, ring 0 gets it at the first poll after the
   next release sync. Watch **Agent Version** in the host list, and
   **History Items → Agent Activity** for failures.
4. If ring 0 shows a problem, stop the later rings before their delay ends.
   Set the mode to **Pinned** with the version they run in
   `FOG_AGENT_DESIRED_VERSION`, or give those hosts that version as their own
   **Desired Agent Version**.

## Staging a rollout by hand

A host's own **Desired Agent Version** wins over the mode. In Pinned mode,
that is how you stage a rollout without rings:

1. Set **Desired Agent Version** on a handful of hosts — the host's
   **General** tab, or select a group in the host list and use mass edit.
2. Watch the host list. **Agent Version** is what each machine is actually
   running; **Desired Agent Version** is what you told it to become. The
   only question worth asking is whether those two agree.
3. When you are satisfied, set `FOG_AGENT_DESIRED_VERSION` to that version
   and clear the per-host values. Clearing them is one mass edit.

>[!note] A per-host override is sticky
>It wins even when it names a version *lower* than the mode does. That is
>deliberate and it is the whole recovery story — see
>[[management/web/agent-self-update#Going backwards on purpose|Going backwards on purpose]]
>below. The cost is that a forgotten override holds a machine back silently,
>which is why the host list carries the column: "everything not following
>the fleet" is a filter, and clearing them is one edit.

## Minimum version

**`FOG_AGENT_MIN_VERSION`** is the lowest version that any enrolled host may
run. Use it after a security release, to move every host off the older
versions at once.

- No host is told to run a version below the minimum. A pinned version, a
  host's own **Desired Agent Version**, or the version of a ring that is
  below the minimum is raised to the minimum.
- A host that runs a release below the minimum is updated to it, **also in
  Off mode**.
- The settings page does not save a `FOG_AGENT_DESIRED_VERSION` below the
  minimum. The host page does not save a **Desired Agent Version** below
  it.
- After the server has synced a manifest, the minimum must be a version in
  that manifest.
- A host that runs a build that is not a release, such as
  `0.1.7-2-gabc1234` from a source build, is not changed. That version
  cannot be compared with a release, so the server does not replace it.

## Where agents get the release

**FOGAgentReleaseSync** is a service on the FOG server. It runs as the web
server user, not as root. Every `AGENTRELEASESYNCSLEEPTIME` seconds (default
3600), it does these steps:

- It downloads the signed release manifest and its signature from
  `FOG_AGENT_UPDATE_MANIFEST_URL`. When that setting is empty, it uses
  `https://fogproject.org/version/agent-stable.json`.
- It records the time it first sees each release. The ring delays count
  from that time.
- It downloads each file that an enrolled host runs or must run, for that
  host's OS and architecture, into `/opt/fog/agent/versions/<version>/`. It
  compares each file's size and SHA-256 with the manifest before it keeps
  the file.
- It deletes the files that no host needs. It keeps the newest
  `FOG_AGENT_KEEP_VERSIONS` releases (default 3), so a rollback works when
  the internet is not available.

The service is idle while the mode is Off, no host has its own **Desired
Agent Version**, and `FOG_AGENT_MIN_VERSION` is empty. Its log is under
**FOG Configuration → Log Viewer**, file **Agent Release Sync**.

Agents 0.1.8 and later get the manifest and the file from this server. The
poll answer carries the manifest, and the file comes over the agent's
client certificate. So the hosts do not need internet access. The FOG
server needs access to `fogproject.org` and to GitHub, where the files are.

If the server's copy fails a check, or the server has no copy, the agent
tries the origin once: the manifest URL, and the download address in the
manifest. So a server whose sync stopped does not strand its hosts while
the internet is available. Agents older than 0.1.8 ignore the server's copy
and download both from the origin themselves.

>[!important] The server's copy is not trusted, and does not need to be
>The server does not check the signature. Every agent checks it against the
>certificate compiled into the agent, and checks the hash of each file. A
>server that sends the wrong bytes, including a server that somebody else
>controls, cannot change what your machines run. The worst it can do is
>send nothing or send something old. The agent then goes to the origin, and
>the sequence floor refuses an old manifest.

>[!tip] Sync now
>A new release, or a change that needs a new file, takes effect at the next
>sync. To sync now, restart the service:
>`sudo systemctl restart FOGAgentReleaseSync`.

### Hosting a mirror

**`FOG_AGENT_UPDATE_MANIFEST_URL`** changes where the server downloads the
manifest. Empty is the default and means `fogproject.org`. Agents older than
0.1.8 also use this address for the manifest.

A mirror changes only where the manifest comes from. Each file still comes
from the address inside the signed manifest, and a mirror cannot change that
address without breaking the signature. Whatever a mirror serves must still
carry FOG Project's signature, and the sequence floor refuses a manifest
older than one an agent has already accepted.

## What the agent checks before it runs anything

TLS proves where bytes came from. It does not prove who wrote them, and a
compromised server is exactly the case this defends against. So the
transport is not trusted, and four things are checked instead:

| Check | What it stops |
|---|---|
| **Signature.** The release manifest is signed, and the agent verifies it against a code-signing certificate compiled into its own binary | Anything not published by FOG Project — including something served by your own FOG server, or by a mirror you host |
| **Sequence floor.** Each manifest carries a number that only goes up, and the agent remembers the highest it has accepted | A manifest that FOG Project really did sign, months ago, being replayed to walk a fleet back onto a version with a known hole |
| **Artifact hash.** The manifest names the SHA-256 of every download, and the agent streams the file and stops at the size the manifest gave | A server or mirror that serves a genuine manifest and different bytes. This is the case TLS cannot help with at all |
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
| `stale_manifest` | The manifest is older than one this agent has already accepted, or it has expired |
| `no_artifact` | The version exists but publishes nothing for this host's OS and architecture |
| `hash_mismatch` | The bytes served are not the bytes the manifest describes |
| `fetch_failed` | The manifest or the download could not be retrieved |
| `cannot_arm_rollback` | The agent could not record what it was replacing, so it refused to replace it |
| `swap_failed` | Replacing the file failed. The old binary is still in place |

When the server's copy and the origin both fail, the detail names the two
attempts, for example `signature_invalid: server copy: stale_manifest: the
manifest has expired; origin: signature_invalid: …`. The code at the start
is the result of the origin attempt.

`cannot_arm_rollback` is worth reading twice: an update that cannot arm its
own rollback does not happen. The agent will not put itself somewhere it
cannot come back from.

### A host does not update

Examine these items:

- **The ring.** In Latest mode, the delay counts from when this server
  first saw the release. A host with a blank ring waits for the longest
  delay.
- **The release sync.** The server sees a new release only at its next
  sync. Read the **Agent Release Sync** log. *Agent releases are current*
  means that the last sync was successful.
- **An override.** A host's own **Desired Agent Version** wins over the
  mode, and keeps the host on the version it names.
- **The agent's report.** **Agent Version** in the host list is what the
  machine runs. **History Items → Agent Activity** gives the reason when the
  agent refused an update.

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

Set the **Desired Agent Version** of a host to the older version, or set
the mode to **Pinned** with the older version in
`FOG_AGENT_DESIRED_VERSION`. A per-host value wins over the mode in both
directions, so you can pull one machine back without touching the fleet.

The server keeps the newest `FOG_AGENT_KEEP_VERSIONS` releases and every
version that a host runs. So the older file is usually on the server
already. If it is not, the next sync downloads it.

Two floors still apply. `FOG_AGENT_MIN_VERSION` raises a version below it.
And an agent will not go below the first version that carried self-update,
because a version without this feature cannot be updated forward again by
anything the agent itself carries.

## Settings

All under **FOG Configuration → FOG Settings**.

| Setting | Category | Default | Meaning |
|---|---|---|---|
| `FOG_AGENT_UPDATE_MODE` | FOG Agent | Off | Off, Pinned or Latest. See [[management/web/agent-self-update#Update modes\|Update modes]] |
| `FOG_AGENT_DESIRED_VERSION` | FOG Agent | empty | The exact version that every host runs in Pinned mode |
| `FOG_AGENT_UPDATE_RINGS` | FOG Agent | `0,3,7` | The ring delays in days for Latest mode |
| `FOG_AGENT_MIN_VERSION` | FOG Agent | empty | The lowest version that any host may run, in every mode. Empty means no minimum |
| `FOG_AGENT_KEEP_VERSIONS` | FOG Agent | 3 | How many of the newest releases the server keeps after hosts stop needing them |
| `FOG_AGENT_UPDATE_MANIFEST_URL` | FOG Agent | empty | Where the server downloads the signed release manifest. Empty means `https://fogproject.org/version/agent-stable.json` |
| `AGENTRELEASESYNCGLOBALENABLED` | FOG Linux Service Enabled | 1 | Turns the release sync service on or off |
| `AGENTRELEASESYNCSLEEPTIME` | FOG Linux Service Sleep Times | 3600 | Seconds between syncs. It is also the longest a new release waits before the server sees it |
| `AGENTRELEASESYNCLOGFILENAME` | FOG Linux Service Logs | `fogagentreleasesync.log` | The sync's log file, in the `agentreleasesync/` folder of the service log path |
| `AGENTRELEASESYNCDEVICEOUTPUT` | FOG Linux Service TTY Output | `/dev/tty3` | The terminal that the sync writes to |

Two settings are on each host, on the **General** tab and in mass edit:
**Agent Update Ring** and **Desired Agent Version**.

## See also

- [[fog-agent|The FOG Agent]] — what the agent does the rest of the time
- [[kb/reference/fog-agent-reference#Commands|FOG Agent Reference]] — the `update` and `update-revert` commands
- [[install-fog-agent|Install the FOG Agent]] — getting an agent onto a machine in the first place
- [[hosts|Host Management]] — the host list, its columns and mass edit
