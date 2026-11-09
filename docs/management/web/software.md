---
title: Software Management
aliases:
    - Software Management
    - Software
description: Assign software to hosts and groups as desired state that the FOG Agent keeps installed, upgraded or absent through Chocolatey, Flatpak or Snap
context_id: software
tags:
    - 1_6-changes
    - management
    - web-management
    - software
    - agent
    - fog-agent
    - chocolatey
    - flatpak
    - snap
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

## Backends

Each software entry names a **backend**. You choose the backend for each
entry. The agent never chooses one for you.

| Backend | OS | What Source means | Version policies |
|---|---|---|---|
| Chocolatey | Windows | The package feed or folder, passed as `--source` | Any, Latest, Pinned |
| Flatpak | Linux | The Flatpak remote name. Empty means `flathub` | Any, Latest |
| Snap | Linux | The snap channel. Empty means the default channel of the snap | Any, Latest |

The agent groups the entries of a host by backend and converges each group
with its own package manager. A backend that the host cannot run reports
`cannot_run` for its entries. The other entries continue.

>[!note] Agent version
>Flatpak and Snap entries need fog-agent 0.1.22 or later. Older agents run
>every entry through Chocolatey, so the server sends them only their
>Chocolatey entries. Update the agent on those hosts. See
>[[agent-self-update|Agent Self-Update]].

### Chocolatey (Windows)

[Chocolatey](https://chocolatey.org/) is the Windows backend. The agent runs
as SYSTEM under the Windows service, and Chocolatey is the Windows package
manager built for exactly that: `winget` ships as an MSIX app that cannot be
registered for the SYSTEM account, so it is not usable from a service.
Chocolatey also accepts a folder or share as a package source, which is what
an offline lab needs. Nothing else in the Software tables is
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

### Flatpak (Linux)

The Flatpak backend installs applications from a Flatpak remote such as
[Flathub](https://flathub.org/). The agent runs as root, so it works on the
system-wide installation only (`--system`). It never installs per-user
Flatpaks. For each entry, the agent runs these commands:

| Action | Command |
|---|---|
| List | `flatpak list --system --app --columns=application,version` |
| Install | `flatpak install --system -y --noninteractive <source or flathub> <package> <extra arguments>` |
| Upgrade | `flatpak update --system -y --noninteractive <package> <extra arguments>` |
| Remove | `flatpak uninstall --system -y --noninteractive <package>` |

**Package** is the application ID, for example `org.videolan.VLC`.
**Source** is the remote name. An empty Source means `flathub`.

Flatpak supports two version policies: **Any version** and **Latest**. The
server refuses a **Pinned** entry when you save it. Flatpak pins an
application by commit, not by a version string, so the agent cannot install
"version 3.0.20" and keep it there. The agent also refuses a pinned Flatpak
entry that exists from older data, and reports it as `cannot_run`.

**The host needs two things in place before the agent can use Flatpak.** The
agent does not set them up. Do this once, in the image or with a snapin:

- Install Flatpak:
  - Fedora and RHEL: `sudo dnf install flatpak`
  - Debian and Ubuntu: `sudo apt install flatpak`
  - openSUSE: `sudo zypper install flatpak`
- Add the remote to the system-wide installation:
  `sudo flatpak remote-add --system --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo`

Check the result with two commands. `flatpak remotes --system` lists the
remote. `flatpak search <id>` finds the application.

>[!warning] Fedora can ship a filtered Flathub
>On some Fedora versions, the `flathub` remote is a filtered remote. The
>output of `flatpak remotes --system` shows "filtered". A filtered remote
>hides some applications, and the agent then reports that the package is not
>found. To remove the filter, run
>`sudo flatpak remote-modify --system --no-filter flathub`.

#### Doing it by hand

These commands give the same result without FOG. Run them as root.

```sh
flatpak install --system -y --noninteractive flathub org.videolan.VLC
flatpak update --system -y --noninteractive org.videolan.VLC
flatpak uninstall --system -y --noninteractive org.videolan.VLC
flatpak list --system --app --columns=application,version
```

### Snap (Linux)

The Snap backend installs snaps from the Snap Store through `snapd`. For each
entry, the agent runs these commands:

| Action | Command |
|---|---|
| List | `snap list` |
| Install | `snap install <package> [--channel=<source>] <extra arguments>` |
| Upgrade | `snap refresh <package> [--channel=<source>] <extra arguments>` |
| Remove | `snap remove <package>` |

**Package** is the snap name, for example `code`. **Source** is the channel,
for example `latest/stable` or `2/beta`. An empty Source means the default
channel of the snap. **Extra arguments** carries flags such as `--classic`.
A snap with classic confinement does not install without `--classic`.

Snap supports two version policies: **Any version** and **Latest**. The
server refuses a **Pinned** entry when you save it. Snap pins a snap by
revision, not by a version string. Also, `snapd` refreshes snaps on its own
schedule. For this reason, **Latest** mostly makes the host refresh now,
instead of waiting for `snapd`. The agent also refuses a pinned Snap entry
that exists from older data, and reports it as `cannot_run`.

>[!note] Holding a snap on a version
>To stop `snapd` from refreshing a snap on a host, run
>`sudo snap refresh --hold <name>`. With no value, the hold has no end date.
>The hold does not block the explicit `snap refresh <name>` that the agent
>runs for a **Latest** entry. For a held snap, use **Any version**.

**The host needs `snapd` and, for classic snaps, the `/snap` path.** The agent
does not set them up. Do this once, in the image or with a snapin:

- Install `snapd` and start its socket:
  - Ubuntu: `snapd` is already installed.
  - Fedora: `sudo dnf install snapd`
  - Debian: `sudo apt install snapd`
  - openSUSE: add the `system:snappy` repository first. See
    [Installing snap on openSUSE](https://snapcraft.io/docs/installing-snap-on-opensuse).
  - Then run `sudo systemctl enable --now snapd.socket`.
- Create the `/snap` link. Classic-confinement snaps (the ones that need
  `--classic`) require the `/snap` path. Fedora and other distributions put
  snaps in `/var/lib/snapd/snap`, so `/snap` does not exist. This is the
  filesystem requirement that admins find. Create the link with
  `sudo ln -s /var/lib/snapd/snap /snap`. Ubuntu needs nothing.
- On SELinux distributions, `snapd` needs its own policy package. On Fedora,
  the package is `snapd-selinux`, and the `snapd` package installs it for you.
- After the first snap install, log out and back in, or reboot. This puts
  `/var/lib/snapd/snap/bin` on the `PATH` of your users. The agent does not
  need it. Users who start the applications do.

Check the result with `snap version`. It shows a `snapd` version and no
"cannot communicate with server" error.

#### Doing it by hand

These commands give the same result without FOG. Run them as root.

```sh
snap install code --classic
snap refresh code
snap remove code
snap list
```

### What the agent does not do

- The agent does not install Flatpak or `snapd`, and it does not add
  remotes. A host without the tool reports `cannot_run` and gives the reason.
  The agent checks again at every poll, so the entry converges soon after you
  install the tool. Only Chocolatey has an optional bootstrap.
- The agent does not run a backend on the wrong OS. A Flatpak entry on a
  Windows host, for example in a mixed group, reports `cannot_run` with
  "flatpak runs only on Linux". Use a separate group for each OS to keep the
  reports clean.
- Homebrew (macOS) is not a backend yet.

## Creating a software entry

**Software → Create New Software**:

| Field | Meaning |
|---|---|
| Software Name, Description | For you |
| Backend | Chocolatey, Flatpak or Snap. See [[#Backends]] |
| Package | The id the package manager knows, for example `googlechrome` or `7zip` for Chocolatey, `org.videolan.VLC` for Flatpak, `code` for Snap |
| Version policy | **Any version**: present, whatever version is there. **Latest (upgrade at each check)**: `choco upgrade` at every check. **Pinned**: install exactly this version, and reinstall if the machine has another. Chocolatey only: Flatpak and Snap refuse a pinned entry at save |
| Version | Required for a pinned entry |
| State | **Present** or **Absent**. Absent removes the package if it is installed and does nothing otherwise |
| Source | Optional. For Chocolatey, passed verbatim as `--source`, for an internal feed or a folder. The community feed rate-limits fleets, so a shop with more than a handful of machines wants its own. For Flatpak, the remote name. For Snap, the channel |
| Extra arguments | Extra switches for the backend command, for example `--classic` for Snap |
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
| `cannot_run` | The backend is missing, is not executable, or does not run on this OS. The details column gives the reason |

## When it runs

The agent converges the software set when the assignment changes and
otherwise every **Re-check Interval** seconds (`FOG_SOFTWARE_DRIFT_INTERVAL`,
default six hours). Each check lists what each backend has installed once, then
walks the entries in order, one at a time, sharing the agent's single run
queue with snapins so two installers never run at once from FOG's side. A
host that is converged and stays converged reports once per check, which is
also the heartbeat the Software Status tab shows. Keep the interval in hours:
every check runs the package manager against every entry.

## Reports

**Reports → Software Report** is the fleet view: every host and entry with
its status and installed version, filterable, so "which machines are not on
the latest Chrome" is one page. **Reports → Installed Software** is the other
side, everything the operating system says is installed, whether FOG put it
there or not; it comes from the agent's facts and is documented on
[[management/web/fog-agent#what-the-agent-reports|The FOG Agent]].
