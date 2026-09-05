---
title: Software Management
aliases:
    - Software Management
    - Software
description: Assign software to hosts and groups as desired state that the FOG Agent keeps installed, upgraded or absent through Chocolatey
context_id: software
tags:
    - 1_6-changes
    - management
    - web-management
    - software
    - agent
    - fog-agent
    - chocolatey
---

# Software Management

>[!info] FOG 1.6 and later
>The Software node and the agent that acts on it are new in FOG 1.6 and need
>the [[install-fog-agent|FOG Agent]] on the host. On 1.5, and for anything a
>package manager cannot express, use [[snapins|snapins]].

A snapin runs a file once and reports its exit code. It cannot tell whether
the program was already installed, whether it is still there a month later,
or what version the machine ended up with. **Software** is the other shape:
an entry says *package X should be present on this host, at this version
policy*, and the agent keeps the machine that way and reports the truth.

| | Snapin | Software |
|---|---|---|
| Unit | a file plus arguments, run once per task | a package id plus a version policy, held continuously |
| Knows what is installed | no | yes, from the package manager |
| Drift | invisible | corrected at the next check and reported |
| Upgrade | queue another task | *Latest* upgrades at each check |
| Remove | write a second snapin that uninstalls | set the state to *Absent* |
| Reporting | one exit code | installed version, status, when last checked, per host |

Snapins are not going anywhere. They remain the escape hatch for anything a
package manager cannot do.

## The backend is Chocolatey

Software entries name a **backend**, and in this release the only backend is
[Chocolatey](https://chocolatey.org/). The agent runs as SYSTEM under the
Windows service, and Chocolatey is the Windows package manager built for
exactly that: `winget` ships as an MSIX app that cannot be registered for
the SYSTEM account, so it is not usable from a service. Chocolatey also
accepts a folder or share as a package source, which is what an offline lab
needs. Other backends (winget through a user session, apt and dnf on Linux)
are designed for behind the same field and the same tables; nothing here is
Chocolatey-specific except the package ids.

The agent calls `%ProgramData%\chocolatey\bin\choco.exe` by full path, for
the reason [[chocolatey-snapins|the Chocolatey snapin guide]] gives: the
service's `PATH` predates Chocolatey's entry in it.

**Chocolatey has to be on the host.** A host with software assigned but no
Chocolatey reports every entry as `cannot_run`, says once on its Software
Status tab that Chocolatey is not installed, and then checks for the binary
on every poll so it converges the moment Chocolatey appears. You have three
ways to get it there:

- Put it in the image.
- Set **Chocolatey Install Script** (`FOG_SOFTWARE_CHOCO_BOOTSTRAP_URL`) on
  the Software module's settings page under FOG Configuration → FOG Settings
  → FOG Client. The agent fetches that script and runs it as SYSTEM, then
  converges in the same run. The public script is
  `https://community.chocolatey.org/install.ps1`; a copy on a server you
  control works too. This is empty by default because it runs a downloaded
  script as SYSTEM, and you should decide that on purpose. **Chocolatey
  Package Source** (`FOG_SOFTWARE_CHOCO_NUPKG_URL`) points the script at a
  `.nupkg` you host, for machines with no route to the community feed.
- A snapin that runs the bootstrap script, as before.

## Creating a software entry

**Software → Create New Software**:

| Field | Meaning |
|---|---|
| Software Name, Description | For you |
| Backend | Chocolatey |
| Package | The id the package manager knows, for example `googlechrome` or `7zip` |
| Version policy | **Any version**: present, whatever version is there. **Latest (upgrade at each check)**: `choco upgrade` at every check. **Pinned**: install exactly this version, and reinstall if the machine has another |
| Version | Required for a pinned entry |
| State | **Present** or **Absent**. Absent removes the package if it is installed and does nothing otherwise |
| Source | Optional. Passed to Chocolatey verbatim as `--source`, for an internal feed or a folder. The community feed rate-limits fleets, so a shop with more than a handful of machines wants its own |
| Extra arguments | Extra `choco` switches |
| Timeout | Seconds before the agent gives up on one operation. 0 for none |
| Return Codes | Which exit codes mean success, retry, reboot required, or failure, in the same `code=class` form as snapins. Chocolatey's `350` (pending reboot) and the MSI `1618` (another installer running) are handled by default |
| Enabled | Disabled entries are not sent to any host |

## Assigning it

Assign entries on a host's **Software** tab or a group's, in order. A host's
set is its own entries followed by each group's, deduplicated by entry. If
the same entry is assigned twice with different policies, the first
assignment wins and the host's tab says so.

The host's **Software Status** tab shows, per entry, what the agent
reported: the status, the installed version, and when it was checked.

| Status | Meaning |
|---|---|
| `converged` | Already in the desired state; nothing was done |
| `installed`, `upgraded`, `removed` | The agent changed it on this check |
| `reboot` | The installer wants a reboot. Handed to the reboot coordinator as a normal, non-forced reason, so it waits for the user to log off |
| `retry` | A transient failure, usually another installer holding the MSI mutex. Tried again at the next re-check |
| `failed` | The installer returned a failure code; the details column has its output |
| `cannot_run` | Chocolatey is missing or not executable at the expected path |

## When it runs

The agent converges the software set when the assignment changes and
otherwise every **Re-check Interval** seconds (`FOG_SOFTWARE_DRIFT_INTERVAL`,
default six hours). Each check lists what Chocolatey has installed once, then
walks the entries in order, one at a time, sharing the agent's single run
queue with snapins so two installers never run at once from FOG's side. A
host that is converged and stays converged reports once per check, which is
also the heartbeat the Software Status tab shows. Keep the interval in hours:
every check runs `choco` against every entry.

## Reports

**Reports → Software Report** is the fleet view: every host and entry with
its status and installed version, filterable, so "which machines are not on
the latest Chrome" is one page. **Reports → Installed Software** is the other
side, everything the operating system says is installed, whether FOG put it
there or not; it comes from the agent's facts and is documented on
[[management/web/fog-agent#what-the-agent-reports|The FOG Agent]].
