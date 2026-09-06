---
title: FOG Agent Reference
aliases:
    - FOG Agent Reference
    - fog-agent command line
    - fog-agent reference
description: The fog-agent commands, the files it keeps, how it authenticates, how often it does things, and exactly what it sends to the server
context_id: fog-agent-reference
tags:
    - 1_6-changes
    - reference
    - agent
    - fog-agent
    - security
    - privacy
---

# FOG Agent Reference

>[!info] FOG 1.6 and later
>The FOG Agent works only against a FOG 1.6 server. Installing it is on
>[[install-fog-agent|Install the FOG Agent]]; what it does day to day is on
>[[fog-agent|The FOG Agent]]. This page is the reference behind both.

## Commands

`fog-agent` is one binary with subcommands. Every command that touches the
state directory takes `--dir DIR` to use a different one; the default is the
platform's state directory below.

| Command | What it does |
|---|---|
| `fog-agent identity` | Prints the firmware identity and MAC list the agent will present: system UUID, system and board serials, chassis asset tag, SMBIOS version. This is what the server matches against a host record |
| `fog-agent enroll --server URL --ca FILE [--token T] [--once]` | Creates the key if needed, sends the enrollment request, and waits until a certificate is issued. `--once` sends one request, prints the answer as JSON and exits |
| `fog-agent run [--server URL] [--ca FILE] [--token T] [--once]` | The service loop: enroll if there is no certificate, then poll. `--server` and `--ca` are needed only the first time; both are remembered. `--once` does one poll and exits |
| `fog-agent status` | Prints the state directory, server URL, host id, whether a key exists and whether the machine is enrolled |
| `fog-agent renew` | Renews the certificate now for the same key, regardless of expiry |
| `fog-agent version` | Prints the version, OS and architecture |
| `fog-agent setup --server URL --ca FILE [--token T]` | Windows. Prepares the state directory, its permissions and the first enrollment request without registering a service. The MSI runs this |
| `fog-agent service install --server URL --ca FILE [--token T]` | Windows. `setup`, then copies the binary to Program Files, registers and starts the service |
| `fog-agent service uninstall`, `start`, `stop`, `status` | Windows service control. On Linux and macOS the agent is run by systemd or launchd and this command refuses |

The agent has no configuration file to edit. The server URL and CA bundle
are written into the state directory at enrollment; everything else comes
from the server on each poll.

## Files

| Platform | State directory | Log |
|---|---|---|
| Windows | `%ProgramData%\FOG\agent`, ACL cut to SYSTEM and Administrators | `C:\ProgramData\FOG\fog-agent.log`, rolled to `.log.1` at 1 MB; start, stop and fatal errors also in the Application event log, source `fog-agent` |
| Linux | `/var/lib/fog-agent`, root only | Standard error, so the journal of whatever unit runs it |
| macOS | `/Library/Application Support/fog-agent` | Standard error |

The state directory holds the private key, the issued certificate, the CA
bundle the agent trusts, the server URL, the host id, the firmware identity
the key was generated for, and a small amount of bookkeeping (which desired
state revision was applied, hashes of the facts last sent, the minute a
schedule last fired). The log records what the agent did. It never contains
the key, the certificate, a token, or a credential the server sent.

## Identity and trust

**Which host is this?** is answered by the firmware identity plus MAC list,
the same values FOG reads at PXE boot, so an agent, iPXE and FOS all name a
machine the same way. That identity is discoverable by anyone, so it may
resolve a host record but never authenticates.

**Is this really that host?** is answered by an ECDSA P-256 key the agent
generates on the machine and never sends. The key is generated *for* an
identity: if the firmware identity changes underneath it, a motherboard swap
or a captured image with an enrolled agent's key inside it landing on
different hardware, the agent discards the key and enrolls again as a new
machine. A clone cannot present as the original.

Enrollment sends a certificate signing request. The server signs it with a
dedicated **FOG Agent CA**, an intermediate under the FOG root that issues
client certificates only, so nothing it signs can pose as a server. The
certificate's subject is `fog-agent host N` and nothing else: it names a
host row, not a hostname or address, so renames and re-addressing never
touch it. It lasts one year; the agent renews it over its existing session
during the last 120 days.

Every request after enrollment is mutual TLS. The web server verifies the
client certificate on `/agent/`, PHP verifies it again independently, and
the certificate's key fingerprint is looked up on the host row. There are no
shared secrets, no per-host AES key, and nothing to rotate. Revocation is
the database: clearing the fingerprint, deleting the host, or approving a
different key all refuse the old certificate at once, and the agent, seeing
that refusal, drops its certificate and goes back to enrolling.

The agent trusts only the CA bundle it was given at install, never the
operating system trust store, and it talks to exactly one server. A
different server with a valid public certificate is still not its server.

Where the FOG certificate authorities sit relative to each other is on
[[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]].

## The protocol

HTTPS and JSON, outbound from the agent only, under `/agent/v1/` on the FOG
server. Both the routes and their schemas are in the server's own OpenAPI
document, see [[api-openapi-reference|the API reference]].

| Route | Purpose |
|---|---|
| `POST /agent/v1/enroll` | Server-authenticated TLS only; the agent has no certificate yet. Idempotent: the agent repeats the identical request until it gets `issued` or `denied` |
| `POST /agent/v1/poll` | The heartbeat. Carries the agent version, the desired-state revision it applied, and any facts or sessions that changed. The answer carries the poll interval, and the full desired state only when the revision the agent applied is not current |
| `GET /agent/v1/payload/{capability}/{id}` | Fetches a snapin payload over the authenticated session, checked against the SHA-512 the desired state declared |
| `POST /agent/v1/result` | What the agent did with one capability at one revision. The server answers with the outcome, which is what the agent acts on |
| `POST /agent/v1/renew` | A new certificate for the same key |

The agent owns the contract and the server answers what it can. On every
poll the server lists the capabilities it supports, and the agent exercises
only those. A capability the server does not list leaves that provider
idle, with one informative log line, never an error. This is why a current
agent runs against an older 1.6 server without complaint, and why the
project releases the agent independently of FOG.

Credentials never ride a routine poll. The domain-join credential appears
only inside a poll answer for a host that is not joined and should be, and
is not sent again once the host reports it is joined.

## Timing

| What | How often |
|---|---|
| Poll | Every 300 seconds, set by the server in each answer |
| Pending enrollment retry | Every 5 minutes, or the interval the server names |
| Denied or unsupported-protocol retry | Hourly |
| Certificate renewal | Attempted after a successful poll, inside the last 120 days of validity |
| Facts (inventory, installed software, Secure Boot, printers, directory) | Collected hourly; sent only when the hash changed or the server asked |
| Network interfaces | Every poll; sent only when changed |
| Session sampling, idle check for auto log out | Every 30 seconds |
| Full session set resync | Hourly, even when unchanged |
| Software re-check | `FOG_SOFTWARE_DRIFT_INTERVAL`, default 21600 seconds, plus at every change of the assigned set, plus every poll while Chocolatey is missing |
| Printer set re-check | Hourly, plus at every change of the assigned set |
| Power schedules | On their own cron minute, on the machine's clock |

## What the agent sends

The agent sends data to exactly one place: the FOG server the machine is
enrolled with, run by the organisation that owns the machine. It contacts
no other host, contains no telemetry or crash reporting, and sends nothing
to the FOG Project. The organisation running the FOG server is the data
controller for everything below.

| Category | Contents |
|---|---|
| Machine identity | Hostname, SMBIOS UUID, serial numbers, MAC addresses |
| Hardware inventory | Manufacturer, model, BIOS, CPU, memory, motherboard, chassis, disk model and serial, GPU |
| Installed software | Package or product name, version, publisher, install date |
| Logon sessions | Account name and domain, OS security identifier, session type and state, the remote host of a remote session, logon and logoff times |
| Firmware posture | Secure Boot state, boot mode, boot entry configuration |
| Printers | Queue name, device URI, driver name, default and shared flags |
| Directory membership | Domain, NetBIOS name, computer object DN, machine account, site |
| Network interfaces | Addresses and prefixes, for the wake relay |
| Task results | Exit code and output of snapins and software operations |
| Agent state | Version and the time of each check-in |

**Logon sessions identify people.** That reporting exists so an admin can
see which machine a user is on and which machines are in use, and it is
gated by the per-host and per-group **User Tracker** module. When the module
is off for a host, the agent does not collect sessions, rather than
collecting and discarding them.

Never sent: passwords or any credential the agent is given (the join
credential is held in memory for the join and never written or logged),
file contents, documents, browser history, keystrokes, screen or clipboard
contents, and the agent's own private key. Uninstalling the agent stops all
reporting immediately; the records already on the FOG server are the
administrator's to delete.

The authoritative version of this statement is `PRIVACY.md` in the
[fog-agent repository](https://github.com/FOGProject/fog-agent), whose git
history is its change log.

## Platforms and what each can do

| | Windows 10 and later | Linux | macOS |
|---|---|---|---|
| Enroll, poll, facts, sessions | yes | yes | enrolls and polls; unproven |
| Hostname | yes | yes | code exists, unproven |
| Directory join | `NetJoinDomain` | `adcli` (keytab only; no sssd configuration) | no |
| Printers | PowerShell `Add-Printer` family | CUPS `lpadmin` | no |
| Software | Chocolatey | Chocolatey only, if a `choco` is on the path; no native backend yet | no |
| Snapins | yes | yes | no |
| Power schedules, on-demand | yes | yes | no |
| Wake relay | yes | yes | no |
| Auto log out | warning as a message box in the session | warning on text terminals only | no |
| Task reboot with network-boot arming | UEFI `BootNext` | UEFI `BootNext` via efivarfs | no |
| Secure Boot fact | yes | yes | not sent |
| Packaging | MSI | none yet; run from a unit | none |

Go dropped Windows 7, 8 and 8.1 some releases ago, so Windows 10 is the
floor and there is no 32-bit macOS build.
