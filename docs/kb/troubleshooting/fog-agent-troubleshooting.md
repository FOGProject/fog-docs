---
title: Troubleshooting the FOG Agent
aliases:
    - Troubleshooting the FOG Agent
    - FOG Agent Troubleshooting
description: What to look at when a FOG Agent will not enroll, stops checking in, or a capability reports a failure
context_id: fog-agent-troubleshooting
tags:
    - 1_6-changes
    - troubleshooting
    - agent
    - fog-agent
---

# Troubleshooting the FOG Agent

>[!info] FOG 1.6 and later
>This page is about the FOG Agent, which works only with a FOG 1.6 server.
>For the legacy FOG client see [[install-fog-client|Install the FOG client]].

Two things answer most questions. On the machine, the agent's log:
`C:\ProgramData\FOG\fog-agent.log` on Windows, `journalctl -u fog-agent` on
Linux. It writes one line per change of state rather than one per poll, so
a quiet log is a healthy one, and it never contains a key, certificate or
token, so it is safe to attach to a forum post. On the server, the host's
**History Items → Agent Activity** tab, which carries every result and the
reason for every failure the agent reported. Start with whichever you can
reach.

## The install fails on Windows

Read the `msiexec` log you asked for with `/l*v`. Two things fail the
install on purpose: a `CA` path that does not exist or is not a PEM file,
and a state directory the installer cannot write. A server that is not
answering does **not** fail the install; the token is kept and the service
keeps trying.

If the installer exits `1603` and the log shows the Setup action exiting
`2`, an older unversioned `fog-agent.exe` was left on disk by a hand
install or a rolled-back attempt. Delete `%ProgramFiles%\FOG\fog-agent.exe`
and run the MSI again.

Windows SmartScreen warning on install, or Defender quarantining the
binary: releases are not yet code-signed. See the download section of
[[installation/client/install-fog-agent#download|Install the FOG Agent]].

## It never enrolls

Run `fog-agent status`. `enrolled: false` with `has_key: true` means the
request is being made and is not being answered with a certificate. The
log says which case you are in.

**"pending approval on the server (reason); waiting".** Someone has to
approve it on **Host Management → Pending Agents**, or you need a token.
The reason tells you what the server saw; the table on
[[installation/client/install-fog-agent#enrollment-and-approval|Install the FOG Agent]] explains
each. Two are worth pausing on:

- `rebind`: the host record already has a *different* agent key bound. If
  you reimaged the machine outside FOG, or reinstalled the OS by hand, this
  is expected: approve it. If you did neither, something else is presenting
  this machine's firmware identity.
- `identity-conflict`: the firmware identity matches more than one host.
  Usually two host records for one machine, one registered by MAC years ago
  and one by a shared USB NIC. Merge or delete one, then the agent's next
  attempt matches cleanly. [[host-identity|Host Identity]] explains how FOG
  matches firmware identity.

**"denied by the server; retrying hourly".** An admin denied this key. The
agent will never be approved with that key. Stop the service, delete the
state directory, start it again, and it arrives as a new pending agent.

**"server does not support agent protocol 1".** The server URL points at a
FOG 1.5 server, or at a 1.6 server whose web root does not serve the
`/agent/` routes. Check that `https://fogserver/fog/agent/v1/enroll`
answers with JSON rather than a redirect to the login page. On a server
upgraded from an older 1.6 build, re-running the installer writes the
`<Location /fog/agent/>` block the web server needs.

**A TLS error naming the certificate.** The agent trusts only the bundle
you gave it. If the web UI uses FOG's own CA, the bundle must be
`management/other/ca.cert.pem` from *this* server; if the web UI uses a
public certificate, the bundle must be that public CA. A server whose
certificate was re-minted since the agent was installed needs the new
bundle: run `fog-agent run --once --ca newbundle.pem` (Windows: re-run the
MSI with `CA=`) and the agent stores it for every later poll.

**Nothing at all in the log.** The service is not running or cannot reach
the server. `fog-agent service status` on Windows, `systemctl status
fog-agent` on Linux. Then try `fog-agent run --once` from an administrator
or root shell, which prints what the service would have logged.

## It was enrolled and stopped checking in

**"server no longer recognizes this certificate; enrolling again".** The
host was deleted from FOG, or a different agent key was approved for it. The
agent has done the right thing: it dropped its certificate and is pending
again as `reissue` or `rebind`. Approve it if that is what you meant.

**"server refused this certificate (…); keeping it and retrying".** A 401
that is *not* about this host's binding: the database was down, a proxy
answered instead of FOG, or the web root stopped serving the agent routes
mid-upgrade. The agent keeps its certificate because re-enrolling would cost
you an approval, and retries. Fix the server; the agent recovers on its own.
It gives up and re-enrolls only after seven days of continuous refusal.

**Last Agent Check-In is old but Last Successful Ping is recent.** The
machine is up and the agent is not talking. Same steps as "nothing at all
in the log" above.

## A capability reports a failure

Every one of these appears in **Agent Activity** with the agent's own
sentence about why.

**Software: every entry is `cannot_run`.** Chocolatey is not at
`%ProgramData%\chocolatey\bin\choco.exe`. Install it, set the Chocolatey
Install Script setting so the agent installs it, or ship it in the image.
The agent checks for the binary every poll and converges as soon as it
appears. See [[software|Software Management]].

**Software: `retry` that never clears.** Another installer is holding the
Windows Installer mutex on every check. Look for a stuck `msiexec` on the
machine.

**Printers: `unsupported` against every printer.** The agent could not read
the installed printer set, so it refused to touch anything rather than
reinstall the lot. On Windows that is usually the Print Spooler service
stopped. On Linux, CUPS is not running.

**Printers: a printer will not install.** The URI or driver is wrong for
that machine. The error the spooler gave is in the `paError` column of the
**Printer Deployment** report and in Agent Activity. An empty driver against
a `socket://`, `lpd://` or `smb://` URI makes a raw queue; an empty driver
only means driverless against an `ipp://` or `ipps://` URI.

**Directory: the join succeeded and now I cannot reach the machine.** On
Windows a join moves the network profile from Private to Domain, and
firewall rules scoped to Private stop applying. RDP usually survives; ping
and SSH often do not. The agent is fine, because its traffic is outbound.
Scope your inbound rules to the Domain profile.

**Directory: a Linux host joined but users cannot log on with domain
accounts.** Expected. The agent joins with `adcli`, which creates the
machine account and keytab and configures no name service. sssd or winbind
is still yours to configure.

**Directory: the OU in FOG changed and the computer object did not move.**
Server-side placement is off by default. Set `FOG_DIRECTORY_PLACEMENT_ENABLED`
and the `FOG_DIRECTORY_*` bind account, delegated to move computer objects
in the right subtree. The **Directory Membership** report shows the drift
and the last placement error.

**Task reboot: "the firmware lists no network boot entry to arm".** The
machine's UEFI has a boot manager with no network boot option, usually
because PXE or network boot is disabled in firmware setup. The agent refuses
to reboot for the task, because the reboot would land on the local disk and
achieve nothing. Enable network boot in the firmware. The task stays queued
and runs at the next poll after you do. VirtualBox guests behave this way by
design and cannot be netbooted from an agent-armed entry.

**The machine reboots for a task, comes back to Windows, and the task is
still queued.** A BIOS machine, or a UEFI machine where arming succeeded
but the firmware ignored `BootNext`. The agent does not reboot a second
time for the same task in the same boot. Set the firmware boot order to
network first, as the legacy client always required.

**Auto log out never fires on a Linux desktop.** The desktop environment
is not telling logind it is idle, so the agent cannot know and does
nothing, which is the safe direction. Check `loginctl show-session <id> -p
IdleHint`.

**A user was logged off with no warning.** `FOG_CLIENT_AUTOLOGOFF_WARN` is
0, or the session is a graphical Linux session, which the agent cannot warn.

## Two agents on one machine

If the legacy FOG client and the agent are both installed, whichever polls
first consumes an on-demand shutdown or a queued snapin and the other never
sees it, and both report to the same host record. The MSI removes the
legacy client; a hand install does not. Uninstall "FOG Service" from Apps &
Features on Windows, or stop and remove the legacy service on Linux.

## Starting over on one machine

Stop the service, delete the state directory
(`%ProgramData%\FOG\agent` or `/var/lib/fog-agent`), start it again. The
agent generates a new key and arrives on Pending Agents as a new request for
the same host, with reason `rebind`, because the host still has the old key
bound. Approving it replaces the binding.
