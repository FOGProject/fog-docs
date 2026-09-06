---
title: The FOG Agent
aliases:
    - The FOG Agent
    - FOG Agent
    - Managing the FOG Agent
    - Pending Agents
    - Agent Enrollment Tokens
description: What the FOG Agent does on a managed host, how it decides when to reboot, and where in the web UI you approve, steer and observe it
context_id: fog-agent
tags:
    - 1_6-changes
    - management
    - web-management
    - agent
    - fog-agent
    - hosts
---

# The FOG Agent

>[!info] FOG 1.6 and later
>The FOG Agent works only with a FOG 1.6 server. On 1.5 the equivalent is the
>legacy FOG client, documented under
>[[service|Fog Service (aka Client) Management]].

The FOG Agent is the successor to the FOG client. Installing and enrolling it
is covered on [[install-fog-agent|Install the FOG Agent]]. This page is
about what it does once it is running, and where you deal with it in the web
UI.

The one idea to hold onto: **the agent keeps the host in the state the
server describes, and reports what the host actually is.** The legacy client
received jobs and ran them once. The agent fetches the host's desired state
whenever it changes, compares it with the machine, corrects the difference,
and reports the outcome. A snapin still runs once, because that is what a
snapin is, but a hostname, a domain, a printer set or a software set is held
continuously and re-checked, and a user who deletes an assigned printer gets
it back within the hour.

## What it manages, and which module switch controls it

The agent's capabilities are gated by the module switches you already have.
The global default is under **FOG Configuration → FOG Settings → FOG
Client**, and per host on the host's **Service Settings → Client Settings**
tab, with group grants resolved the way [[group-shared-state|Group Shared State]]
describes. Turning a module off for a host turns that capability off; the
agent stays idle on it and logs one line saying so.

| Capability | Module | What the agent does |
|---|---|---|
| Hostname | Hostname Changer | Renames the machine to the host's name. A rename that needs a reboot waits for the reboot coordinator |
| Directory membership | Hostname Changer | Joins the machine to the Active Directory domain set on the host. Never unjoins |
| Snapins | Snapin Client | Runs queued snapin tasks, verifying each payload's SHA-512 before it runs |
| Software | Software | Keeps the host's assigned software set present, at the version policy each entry names. See [[software\|Software Management]] |
| Printers | Printer Manager | Installs assigned printers, sets the default, and in exclusive mode removes the rest |
| Power schedules and on-demand actions | Power Management | Fires scheduled shutdowns and reboots on the machine's own clock; carries out Shut Down and Restart from the host list |
| Wake relay | Power Management | Sends a Wake-on-LAN packet for a neighbour when the server asks. Off until `FOG_AGENT_WAKE_RELAY_ENABLED` is set |
| Auto log out | Auto Log Out | Logs an idle user off after the host's timeout, with a warning first |
| Task reboot | Task Reboot | Reboots the machine into a queued imaging task, arming a one-time network boot first where the firmware allows |
| User sessions | User Tracker | Reports who is logged in, as sessions with a start and an end |
| Facts | `FOG_AGENT_INVENTORY_ENABLED` | Hardware inventory, installed software, Secure Boot posture, printers present, directory membership, network interfaces |

Display Manager, GreenFOG and the auto log out background image are gone.
The agent does not implement them and their settings were removed from 1.6.

## Approving and denying agents

**Host Management → Pending Agents** lists every agent waiting for a decision,
with the host it matched, the reason it is waiting, and the machine's
reported hostname and identity. The reasons, and when approval is automatic,
are explained in the install guide under
[[installation/client/install-fog-agent#enrollment-and-approval|Enrollment and approval]].

- **Approve Pending Agents** issues each selected agent a certificate. The
  agent collects it on its next attempt, within five minutes.
- **Deny Pending Agents** refuses the key. A denied agent keeps asking, hourly,
  and keeps being refused until it is enrolled with a new key.

**Host Management → Agent Enrollment Tokens** is where you mint the tokens
that let an install approve itself. Give a token a name, a number of uses or
unlimited, and an expiry, which is required. The token value is shown once,
with a Copy button, and only its hash is stored. Revoking a token stops it
approving anything further; enrollments it already approved are unaffected.

## The host page

Three places on a host's page belong to the agent:

- **General → Last Agent Check-In.** When the agent last polled. It sits
  beside Last Client Check-In and Last Successful Ping, and the same "ping
  recent, check-in old" reading described on
  [[1.6/management/web/hosts#when-was-this-host-last-seen|Host Management]]
  applies: a machine that answers pings but has not checked in has an agent
  that is stopped, broken, or not installed.
- **History Items → Agent Activity.** Every capability result and every
  fact the agent reported for this host, newest first, with the outcome and
  detail. When a printer will not install or a join fails, the reason is
  here. The same feed across all hosts is under **Logging → Agent Activity**
  in the main menu.
- **History Items → Software Status, Installed Software, Login History.**
  What the agent reports for the software you assigned, the software the
  machine actually has, and the sessions it has seen.

Deleting a host, or approving a different agent key for it, revokes the
certificate the old agent holds immediately. That agent drops back to
pending on its next poll.

## How and when it reboots

Only one thing in the agent reboots the machine, and every capability that
needs one asks it. The coordinator collects the reasons pending on this
poll, looks at who is logged in, and applies one rule:

- **Nobody logged in:** reboot now, for any reason.
- **Someone logged in:** reboot only for a *forced* reason, after a warning
  of `FOG_GRACE_TIMEOUT` seconds (FOG Configuration → FOG Settings). An
  imaging task is forced when `FOG_TASK_FORCE_REBOOT` says so. A hostname
  change or a domain join is forced when the host's **Enforce Hostname | AD
  Join Reboots** flag is set. A scheduled or on-demand power action is always
  forced, because an admin asked for it.
- Reasons that are not forced wait until the user logs off. One reboot
  satisfies every reason pending at the time.
- A mix of shutdown and reboot reasons reboots. A shutdown would leave a
  machine that needed to come back, for an imaging task or a rename, sitting
  off.

The warning on Windows is the operating system's own shutdown countdown, so
users see the standard dialog. On Linux the agent notifies terminal sessions;
graphical sessions get no warning.

### Reboots into an imaging task

When a task is queued for the host, the agent reboots it, but first asks the
firmware to boot from the network **once** by setting the UEFI `BootNext`
variable to the machine's network boot entry. The firmware clears it itself,
so a task that is cancelled, or a machine that loses power, costs at most one
extra netboot, and iPXE with no task chains to the local disk as it always
has. Nothing permanent changes: `BootOrder` is left alone, and a machine
already set to boot network-first behaves exactly as before.

If the firmware has a boot manager but **no network boot entry** at all, the
agent refuses to reboot for the task. The task stays queued and the reason
appears in Agent Activity: *the firmware lists no network boot entry to arm;
enable PXE or network boot in firmware setup*. That is a far better outcome
than the legacy behaviour, which rebooted the machine to its own disk, saw
the task still waiting, and rebooted it again in a loop. Other reasons
pending at the same time still proceed.

A BIOS machine has no boot manager to ask, so the agent arms nothing and
reboots anyway, relying on the firmware boot order reaching the network as
it always has.

## Hostname and directory membership

The hostname comes from the host's name in FOG, compared
case-insensitively. Windows needs a reboot to finish a rename, which goes
through the coordinator above.

The directory join uses the host's existing **Active Directory** tab: the
domain, OU and join credential you already fill in, seeded from the
`FOG_AD_DEFAULT_*` settings. What changes is how the agent treats them:

- **It only ever joins.** It never unjoins a machine and never re-joins one
  that is already in the target domain. Leaving a domain is a deliberate act
  you take on the machine, never a side effect of editing a host.
- **The join password no longer travels to every machine.** The legacy client
  received it on every check-in for the life of the host. The agent receives
  it only inside a poll answer for a host that is not joined and should be,
  holds it in memory for the join, and never writes or logs it. A joined
  estate carries no join credential anywhere.
- **The machine reports where it is.** The observed domain, computer object
  DN, machine account and site appear in the **Directory Membership** report
  under Reports, with a Drift column that compares what you asked for with
  what the machine says.
- **The OU is enforced by the server, not the machine.** Editing a host's OU
  used to do nothing after the initial join. Now the server can move the
  computer object itself with one LDAP rename, no reboot, no re-join. That
  writes to your directory, so it is off until you set
  `FOG_DIRECTORY_PLACEMENT_ENABLED` and give FOG a bind account under the
  **FOG Directory** settings (`FOG_DIRECTORY_LDAP_URI`, `FOG_DIRECTORY_BIND_DN`,
  `FOG_DIRECTORY_BIND_PASSWORD`, `FOG_DIRECTORY_BASE_DN`,
  `FOG_DIRECTORY_CA_CERT`). Delegate that account only *create and delete
  computer objects* on the OU subtree FOG should manage. An account refused
  outside its subtree is the point.

On Windows the join uses the native `NetJoinDomain` call. On Linux it uses
`adcli`, which joins the machine and writes its keytab but configures no
name service: if you want domain logons on a Linux host, sssd or winbind is
still yours to set up. Samba AD domains are Active Directory from the
machine's point of view and need nothing special.

>[!warning] A Windows join changes the firewall profile
>A successful join moves the machine's network profile from Private to
>Domain, and inbound firewall rules scoped to the old profile stop applying.
>On a freshly joined host, RDP may stay reachable while SSH and ping stop
>answering. The agent is unaffected, because its traffic is outbound, and it
>will not open a firewall the site closed. Expect it, and scope your rules
>to the Domain profile before joining.

## Printers

A printer in 1.6 is described the way both print subsystems describe one: a
**Device URI** (`socket://10.0.4.20:9100`, `ipp://printer.corp/ipp/print`,
`lpd://host/queue`, `smb://server/share`) and a driver, or no driver for an
IPP Everywhere printer. The four legacy printer types were really four code
paths, three of which failed on any given platform. Existing printers were
converted to a URI on upgrade and the old fields are kept; a row whose URI
could not be derived is listed in the Printer Deployment report rather than
dropped.
One printer entry now serves Windows and Linux hosts alike.

The host's **Printer Management Level** keeps its three values:

| Level | What the agent does |
|---|---|
| No Printer Management | Touches nothing |
| Add/Remove Managed Printers | Installs and maintains the assigned printers and sets the default. Anything else on the machine is left alone |
| All Printers | As above, and removes printers FOG did not assign |

The agent re-checks the printer set when the assignment changes and once an
hour otherwise, so a queue a user deleted comes back. It compares printers
by URI, never by driver name, because the spooler reports its own driver
string and comparing them would reinstall every printer every poll. If it
cannot read the installed printers it changes nothing and reports why. On
Windows it uses the `Add-Printer` family of PowerShell commands; on Linux,
`lpadmin`, which the legacy client could add with but never remove with.

The **Printer Deployment** report shows every host with printer management on against
what it reported: assigned, installed, default, and a state of `ok`,
`missing`, `extra`, `failed` or `never reported`, with the last error. A
failed install finally has somewhere to be seen.

## Snapins

Snapins work as before, from the same **Snapin Associations** and the same
queued tasks, in the same order. The agent fetches each payload over its own
authenticated session, refuses it unless the SHA-512 matches what the server
declared, runs it with the interpreter and arguments the snapin carries, and
reports the exit code and the tail of the output. A snapin's reboot or
shutdown flag is handed to the reboot coordinator rather than acted on
directly. For software that a package manager can express, prefer
[[software|Software Management]], which knows whether the thing is already
there.

## Power

Power Management on the host and group pages is unchanged. Scheduled
shutdowns and reboots are sent to the agent as desired state and fire on the
machine's own clock, so a shutdown happens on its minute whether or not a
poll landed there. **Shut Down** and **Restart** from the Hosts list reach
the agent on its next poll, and the request is consumed only when the agent
acknowledges it, so a click that never reached a machine is not silently
lost. Both kinds count as forced reasons, so logged-in users get the grace
countdown.

Wake-on-LAN schedules are not handed to the agent; the server and storage
nodes send those packets as they always have.

### Waking a host on a subnet with no FOG server

A magic packet is a broadcast, so FOG can only wake a host on a link where
it has a server or storage node. With `FOG_AGENT_WAKE_RELAY_ENABLED` set
(FOG Configuration → FOG Settings → FOG Agent; off by default), the server may
also ask an enrolled, awake agent on the target's own subnet to send the
packet. The existing fan-out to storage nodes still runs first and this is
additional.

The server picks the senders: agents on the same network and prefix, on a
wired interface that is up, that checked in within the last fifteen minutes.
It asks more than one. The agent sends only to its own broadcast addresses
and only for MAC addresses of hosts FOG knows, at most a bounded number per
poll; there is no field in which to give it any other address. Because the
neighbour learns of the request at its next poll, a relayed wake can take up
to five minutes, which is fine for the scheduled overnight window it exists
for.

## Auto log out

The host's auto log out time, and the global default under FOG Configuration
→ FOG Settings → FOG Client, work as before, with the same five-minute
minimum. New in 1.6 is `FOG_CLIENT_AUTOLOGOFF_WARN`, the seconds of warning
before the log out (default 60; 0 warns nobody), edited beside the timeout.
Idle time is checked every thirty seconds, not every poll, so a
fifteen-minute policy is enforced at fifteen minutes.

On Windows the warning is a message box shown inside the user's own session;
moving the mouse or pressing a key cancels the log out. The legacy client's
styled countdown window with a background image is gone, and so is the
`FOG_CLIENT_AUTOLOGOFF_BGIMAGE` setting. On Linux, text sessions are warned
on their terminal; graphical sessions get no warning but are still logged
off. A session whose idle time the operating system cannot report is left
alone, so the capability fails in the safe direction.

## What the agent reports

With `FOG_AGENT_INVENTORY_ENABLED` on (the default), the agent collects a set
of facts about the machine once an hour and sends only the ones that changed:

| Fact | Where it lands |
|---|---|
| Hardware inventory | The host's **Inventory** tab and the Hardware report, the same place a FOS inventory task writes |
| Installed software | The host's **Installed Software** tab and the Installed Software report: every program the OS knows, with version, publisher and install date |
| Secure Boot posture | The host's Secure Boot state, which previously only updated at a netboot. A machine that turned Secure Boot on after its last imaging no longer looks like an enrollment target |
| Printers present | The Printer Deployment report |
| Directory membership | The Directory Membership report |
| Network interfaces | Used to work out which agents share a link, for the wake relay. Gathered every poll |

User sessions are separate and gated by the **User Tracker** module. The
agent samples the logged-in sessions every thirty seconds and reports each
one as a row with a start, an end, an end reason, the account and domain,
the type (console, remote, tty, X11, Wayland) and, for a remote session,
where it came from. A machine that loses power never sends a logout; the
server closes the open session at the time it was last seen and marks the
end as *inferred*, so the **User Sessions** report and the host's **Login
History** never show a session that has been open for six months. When the
module is off for a host, the agent does not collect sessions at all.

Two settings under FOG Configuration → FOG Settings:
`FOG_USERTRACKING_COMPAT_WRITE` (default on) also writes each session to the
legacy user tracking table so the Activity page keeps working during a
migration, and `FOG_HOSTUSERSESSION_RETENTION_DAYS` (default 365) ages the
sessions out.

For a plain statement of what leaves the machine, see
[[kb/reference/fog-agent-reference#what-the-agent-sends|What the agent sends]].

## Settings added for the agent

All under **FOG Configuration → FOG Settings**, in the category named.

| Setting | Category | Default | Meaning |
|---|---|---|---|
| `FOG_AGENT_ENROLL_DEPLOY_WINDOW` | General Settings | 24 | Hours after a deploy during which the deployed host's agent enrolls without approval. 0 turns the shortcut off |
| `FOG_AGENT_INVENTORY_ENABLED` | FOG Client | 1 | Whether agents collect and report facts at all |
| `FOG_AGENT_WAKE_RELAY_ENABLED` | FOG Agent | 0 | Whether the server may ask an agent to wake a neighbour |
| `FOG_SOFTWARE_DRIFT_INTERVAL` | FOG Client | 21600 | Seconds between software re-checks when the set has not changed. Shown as *Re-check Interval* on the Software module's settings |
| `FOG_SOFTWARE_CHOCO_BOOTSTRAP_URL` | FOG Client | empty | Chocolatey install script for hosts with software assigned but no Chocolatey. Empty means never install it |
| `FOG_SOFTWARE_CHOCO_NUPKG_URL` | FOG Client | empty | A `.nupkg` the bootstrap script installs Chocolatey from, for hosts with no route to the community feed |
| `FOG_CLIENT_AUTOLOGOFF_WARN` | FOG Client - Auto Log Off | 60 | Seconds of warning before an automatic log out |
| `FOG_USERTRACKING_COMPAT_WRITE` | FOG Client | 1 | Also write agent sessions to the legacy user tracking table |
| `FOG_HOSTUSERSESSION_RETENTION_DAYS` | FOG Audit | 365 | Days of agent-reported sessions to keep. 0 keeps them forever |
| `FOG_DIRECTORY_PLACEMENT_ENABLED` and the `FOG_DIRECTORY_*` account settings | FOG Directory | off, empty | Server-side OU placement, described above |

`FOG_GRACE_TIMEOUT` and `FOG_TASK_FORCE_REBOOT` are existing settings the
agent's reboot coordinator now honours.

## Reports

Under **Reports**, the agent feeds:

- **Directory Membership**: desired versus observed domain and OU per host,
  with drift.
- **Printer Deployment**: assigned versus installed printers per host, with
  the last error.
- **Installed Software** and **Software Report**: what is on each machine,
  and how the assigned software set is converging.
- **User Sessions**: sessions with start, end and end reason.

And under **Logging → Agent Activity**, the raw feed of everything every
agent reported.
