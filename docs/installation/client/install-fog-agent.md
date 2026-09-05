---
title: Install the FOG Agent
aliases:
    - Install the FOG Agent
    - Install FOG Agent
    - fog-agent
description: Install and enroll the FOG Agent, the management agent that replaces the legacy FOG client on FOG 1.6 servers
context_id: install-fog-agent
tags:
    - 1_6-changes
    - install
    - client
    - agent
    - fog-agent
    - silent-install
    - setup
---

# Install the FOG Agent

>[!info] FOG 1.6 and later
>The FOG Agent talks to the `/agent/v1` routes that exist only on a FOG 1.6
>server. Against a 1.5 server it logs "server does not support agent
>protocol 1" and retries hourly, doing nothing else. For 1.5, install the
>legacy client instead: [[install-fog-client|Install the FOG client]].

The FOG Agent (`fog-agent`) is the program that runs on the machines you
manage. It replaces the legacy FOG client. Where the old client polled for
jobs and ran them, the agent holds the state your FOG server describes for
the host and keeps the machine in it: the hostname, directory membership,
printers, software, power schedule, and auto log out. It also reports what
the machine actually is, so hardware inventory, installed software, logon
sessions, and Secure Boot posture on the host page come from the agent
rather than from the last imaging task.

This page gets the agent onto a machine and enrolled. What it does once it
is running, and how you steer it from the web UI, is on
[[fog-agent|The FOG Agent]].

## Before you start

- **A FOG 1.6 server reachable over HTTPS.** The agent never speaks plain
  HTTP. The server URL is the same one the web UI uses, plus `/fog`, for
  example `https://fog.example.org/fog`.
- **The CA certificate the agent should trust.** The agent trusts only the
  certificate bundle you hand it at install, never the operating system's
  trust store. For a server using FOG's own certificate authority, that file
  is published at `https://fog.example.org/fog/management/other/ca.cert.pem`.
  If your web UI uses a public certificate, for example from Let's Encrypt,
  give the agent that CA's PEM instead.
- **A way to approve the enrollment.** Either an enrollment token from
  **Host Management → Agent Enrollment Tokens**, or a person who will approve
  the host on **Host Management → Pending Agents** after install. See
  [Enrollment and approval](#enrollment-and-approval).
- **Supported platforms.** Windows 10 and later on x64 and arm64 is the
  supported install and the only one with a packaged installer. Linux on
  x64, arm64 and armv7 runs the same agent from a service unit you provide.
  macOS binaries are built but the agent is not yet supported there.

>[!warning] The legacy FOG client must not run beside the agent
>Both talk to the same host record. When both are installed, whichever asks
>first consumes an on-demand shutdown or a queued task and the other never
>sees it. The Windows installer removes the legacy client for you. On
>Linux, uninstall it yourself before enrolling the agent.

## Download

Releases are published on GitHub at
<https://github.com/FOGProject/fog-agent/releases>. Each release carries:

| File | Use |
|---|---|
| `fog-agent-<version>-x64.msi` | Windows installer, 64-bit. The supported way to install on Windows |
| `fog-agent-windows-amd64.exe`, `fog-agent-windows-arm64.exe`, `fog-agent-windows-386.exe` | Bare Windows binaries, for a hand install |
| `fog-agent-linux-amd64`, `fog-agent-linux-arm64`, `fog-agent-linux-arm` | Linux binaries |
| `fog-agent-darwin-amd64`, `fog-agent-darwin-arm64` | macOS binaries, unsupported for now |
| `SHA256SUMS` | Checksums for everything above |

>[!warning] Releases are not yet code-signed
>The project has applied for a code-signing certificate but does not hold
>one yet. Until it does, Windows shows a SmartScreen warning on install and
>Defender may quarantine the binary. The release notes on GitHub say
>whether a given release is signed. Verify the download against
>`SHA256SUMS` before deploying it.

Unlike the legacy client, the agent is not served from your FOG server. One
release serves every FOG server, and the agent works against a server that
is behind it: features the server does not offer simply stay idle.

## Windows

The agent runs as a Windows service named `fog-agent`, display name
**FOG Agent**, under the SYSTEM account.

### The MSI

The MSI takes its settings as properties, so it works from a command line,
a Group Policy software installation, or any deployment tool:

```
msiexec /i fog-agent-1.2.3-x64.msi /qn SERVER=https://fog.example.org/fog CA=C:\path\ca.cert.pem TOKEN=... /l*v C:\fog-agent-install.log
```

| Property | Meaning |
|---|---|
| `SERVER` | Base URL of the FOG server, the web UI's address plus `/fog` |
| `CA` | Path to the PEM bundle to trust: the FOG CA (`management/other/ca.cert.pem` on the server) or the public CA the web UI uses |
| `TOKEN` | An enrollment token. Optional. Without one the host waits on **Pending Agents** until someone approves it |
| `WEBADDRESS`, `WEBROOT` | The legacy client's property names, honored when `SERVER` is absent. `SERVER` becomes `https://WEBADDRESS` + `WEBROOT`, so deployment scripts written for the old client keep working |

The installer, in order:

1. Removes the legacy FOG client ("FOG Service", fog-client 0.x) if it is
   installed.
2. Puts `fog-agent.exe` in `%ProgramFiles%\FOG`.
3. Runs `fog-agent setup` as SYSTEM. This writes the server URL and CA
   bundle into the state directory `%ProgramData%\FOG\agent`, restricts that
   directory to SYSTEM and Administrators before the host's private key is
   generated, and makes the first enrollment request.
4. Registers the service for automatic start and starts it.

A server that does not answer at install time is not an install failure.
The token is kept and the service keeps trying, so the MSI can go onto
machines that are off the network at that moment. A bad CA path or an
unwritable state directory does fail the install, and the reason is in the
`msiexec` log.

Running a newer MSI over an older one replaces the binary in place and
leaves the state directory alone. The host keeps its key and certificate
and does not re-enroll, and the properties are optional on an upgrade.

Uninstalling through Apps & Features, or with `msiexec /x`, removes the
service and the binary. It deliberately leaves the state directory, so a
reinstall picks up the same identity without another approval. Delete
`%ProgramData%\FOG\agent` by hand if you want the machine to enroll fresh.

### Hand install

From an administrator prompt:

```
fog-agent.exe service install --server https://fog.example.org/fog --ca ca.cert.pem [--token T]
```

This does what the MSI does using the binary itself: the `setup` step, a
copy to `%ProgramFiles%\FOG\fog-agent.exe`, the service registration with
restart on failure (10 seconds, 1 minute, then 5 minutes), an Application
event log source, and start. It does not remove the legacy client.

`fog-agent service status`, `service stop`, `service start` and
`service uninstall` manage the service afterward.

### Where things are on Windows

| What | Where |
|---|---|
| Binary | `%ProgramFiles%\FOG\fog-agent.exe` |
| State: key, certificate, server URL, CA bundle | `%ProgramData%\FOG\agent`, readable by SYSTEM and Administrators only |
| Log | `C:\ProgramData\FOG\fog-agent.log`, rolled to `fog-agent.log.1` past 1 MB. Readable by any user, and it never contains a key, certificate or token, so it is safe to post on the forums |
| Event log | Application log, source `fog-agent`: start, stop and fatal errors |
| Installer log | Wherever you pointed `/l*v` |

## Linux

There is no Linux package yet. The agent is a single static binary and runs
from a systemd unit you write. Everything runs as root: the agent changes
the hostname, joins directories, and manages CUPS.

1. Put the binary somewhere on the root path and make it executable:

   ```bash
   sudo install -m 0755 fog-agent-linux-amd64 /usr/local/bin/fog-agent
   ```

2. Enroll once. This creates the state directory `/var/lib/fog-agent`,
   generates the key, remembers the server and CA, and waits for the
   certificate to be issued:

   ```bash
   sudo fog-agent enroll --server https://fog.example.org/fog --ca ca.cert.pem --token T
   ```

   Without a token the command waits until someone approves the host on
   **Pending Agents**. Add `--once` to send one request and exit instead.

3. Create a unit. The agent writes its log to standard error, which the
   journal captures:

   ```ini
   [Unit]
   Description=FOG Agent
   After=network-online.target
   Wants=network-online.target

   [Service]
   ExecStart=/usr/local/bin/fog-agent run
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

   Save it as `/etc/systemd/system/fog-agent.service`, then:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now fog-agent
   journalctl -u fog-agent -f
   ```

`fog-agent run` enrolls first if step 2 was skipped, using `--server`,
`--ca` and `--token` if you put them on the `ExecStart` line, so the
separate enroll step is a convenience for watching the approval happen.

## macOS

Binaries are built for both Intel and Apple Silicon and the agent will
enroll and poll from `/Library/Application Support/fog-agent`, but no
capability has been proven on macOS and there is no launchd integration
or package. Treat it as unsupported for now.

## Enrollment and approval

The agent identifies the machine by its firmware identity, the SMBIOS
system UUID, serial numbers and asset tag, plus its MAC addresses, the same
values FOG records at PXE boot. It authenticates with a private key it
generates on the machine and never sends. Enrollment is the agent asking
the server to issue a certificate for that key, and the server deciding
which host record the key belongs to.

Approval is automatic in exactly two cases:

- **A valid enrollment token.** Mint one at **Host Management → Agent
  Enrollment Tokens**. A token is shown once, has a required expiry, and
  allows a fixed number of uses or unlimited uses until it expires. Revoke
  it there at any time. A token also registers a machine FOG has never seen,
  so it is how you enroll a host that was not imaged by FOG.
- **A deploy FOG just finished.** If this server completed a deploy task to
  the matched host within `FOG_AGENT_ENROLL_DEPLOY_WINDOW` hours (default 24,
  under FOG Configuration → FOG Settings → General Settings), the agent is
  enrolled without a click. The deploy was the approval. Set it to 0 to turn
  this off.

Everything else waits on **Host Management → Pending Agents**, where the
reason is shown:

| Reason | What it means |
|---|---|
| `unknown-host` | Nothing matched. A pending host record was created, so approving also registers the machine |
| `known-host-no-agent` | The host exists and has never had an agent |
| `rebind` | The host already has a different key bound to it. Either it was reimaged without a deploy FOG knows about, or something is claiming an enrolled machine's identity. Look before approving |
| `identity-conflict` | The firmware identity matches more than one host. Fix the duplicate host records first |
| `reissue` | The same key, asking again after its certificate was lost. The agent kept its key but not its certificate |
| `no-mac` | The request carried no usable MAC address |

Approving issues the certificate, which the agent collects on its next
attempt, every five minutes while pending. Denying pins the key as refused.
A denied agent keeps asking hourly and keeps being refused until it is
enrolled with a new key, which means deleting its state directory.

Once enrolled, every request is mutual TLS and the certificate maps to the
host record. Renames, address changes and DHCP moves do not touch it. The
certificate lasts one year and the agent renews it over its existing
session inside the last 120 days. If the host is deleted from FOG, or a
different key is approved for it, the old certificate stops working at once
and the agent goes back to pending.

## Check that it worked

On the machine:

```
fog-agent status
```

prints the state directory, the server URL, whether a key exists, whether
the machine is enrolled, and the host id it enrolled as. `fog-agent
identity` prints the firmware identity the server matched on, which is the
thing to compare against the host's record when a match goes wrong.

On the server, the host's page shows **Last Agent Check-In** on the General
tab, and the **Agent Activity** tab under History Items lists what the agent
has done.

## Upgrading

The agent does not update itself. On Windows, run the newer MSI; on Linux,
replace the binary and restart the unit. Enrollment survives both because
the state directory is untouched. The agent is released more often than
FOG, and a newer agent against an older 1.6 server is the expected case:
the server tells the agent which capabilities it has, and the agent leaves
the rest idle.

## Moving from the legacy client

Nothing on the server has to change first. Hosts, groups, printers, snapins,
power schedules and module toggles all carry over, and the legacy client's
endpoints stay live, so a fleet can run both generations while you migrate.
Per host, install the agent and let the installer remove the old client.
The differences an admin notices are on [[fog-agent|The FOG Agent]]: printers
are described by URI rather than type, the Active Directory join no longer
sends the join password to every machine, and user tracking records sessions
rather than login and logout events.
