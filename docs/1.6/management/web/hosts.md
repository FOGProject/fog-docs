---
title: Host Management
aliases:
    - Host Management
description: index page for hosts
context_id: hosts
tags:
    - in-progress
    - management
    - hosts
---

# Host Management

## Hosts

[Video Overview of
Hosts](http://freeghost.sourceforge.net/videotutorials/hostinfo.html)

-   A host in FOG is typically a computer, but it can be any network
    device.
-   Hosts are used to identify a computer on the network and are used to
    manage the device.

## Adding a new host

[[1.6/management/web/storage-node#Adding a Storage Node|Adding a Storage Node]]

### Method 1: Adding a new host via Full registration

-   This is the preferred method, and maybe the easiest method for getting a host into the FOG database, but it requires you to visit the host.

    -   When at the client computer, during the boot up process when
        you see the PXE/iPXE boot menu select **Perform Full Host
        Registration and Inventory**.
    -   During this phase you will be prompted for information about
        the host like hostname, operation system, image, groups,
        Product Key, and other information.
    -   If you enter a valid operating system and image id, you will
        be asked to Image Now.
    -   If desired, you can set the task and it will deploy the
        image on the next network boot.

-   After the requested information is entered, FOG will pull a quick
    hardware inventory the client.

-   This method of registration will register the mac address(primary
    wired only), serial number(if available in BIOS), Make/Model, and
    other Hardware information with the FOG server.

-   For more information on these commands please see: [[1.6/management/fos/using-fog-boot-menu#Perform Full Registration and Inventory|Perform Full Registration and Inventory]]

### Method 2: Adding a new host via Quick Registration

-   Quick registration is very much like the Full host registration,
    with the exception that it will not prompt you for any input, nor
    give you the option to image the computer directly from the
    registration screen. When the host is added to the FOG server, it
    will be named with the hosts primary mac address. This method is
    great for adding a lab of 30 computers to FOG quickly and easily.
-   This feature is disabled by default, to enable this feature:

1.  Go to **FOG Configuration**

2.  Select **FOG Settings**

3.  Find section **FOG Quick Registration**

4.  Tick ON **FOG_QUICKREG_AUTOPOP** to &#10004;

5.  Set **FOG_QUICKREG_IMG_ID** to the image ID you would like to use
    for all newly created hosts.

6.  **FOG_QUICKREG_OS_ID** will be auto populated when "Save Changes"
    is selected. (OS is now associated within the image so no need to
    select an OS)

7.  Change **FOG_QUICKREG_SYS_NAME** to what you would like to name you new machines, where `*` will be replaced by a number.

    -   If you would like to zero pad numbers you can use
        **LAB300-**\*\* which would result with **LAB300-03** or
        **LAB300-09**.

8.  Set **FOG_QUICKREG_SYS_NUMBER** to the first number you would like to use.

    -   After each registration the computer will automatically
        image and the **FOG_QUICKREG_SYS_NUMBER** will incremented
        by 1.

### Method 3: Manually Adding

[Add Host Video
Tutorial](http://freeghost.sourceforge.net/videotutorials/addimghost.html)

-   Adding a new host can be done in the hosts section of FOG.
-   Then by clicking on the "Add New Host" button on the left hand
    menu.
-   At least a hostname and a MAC address must be entered in order to
    add the host to the FOG database.

------------------------------------------------------------------------

#### __Required__{ .red } Fields

A host consists of the following __Required__{ .red } Fields:

##### Hostname

> A string used for the Windows Hostname of client, this must be less
> than 15 characters long.

##### MAC address

> This field is used in for for a unique identifier for the host. The
> string must be separated by `:` (colon), in the format of
> `00:11:22:33:44:55`.

> [!NOTE]
> The MAC Address has a description field. This can currently only be set via the api and can be whatever you want it to be.
> For example you could use the [FOGApi powershell module](https://github.com/darksidemilk/FogApi) to set the mac descriptions to the make/model of the adapter like so

```
$fogHost = Get-FogHost
$fogHostMacs = Get-FogHostMacs -hostid $foghost.id;
$fogHostMacs | ForEach-Object {
    $fogmac = $_;
    $netAdapter = Get-NetAdapter -IncludeHidden | Where-Object macaddress -eq $fogmac.mac.replace(":","-");
    if ($Null -ne $netAdapter) {
        $fogMac.description = "$($netAdapter.name) - $($netAdapter.InterfaceDescription)"
        Update-FogObject -type object -coreObject macaddressassociation -jsonData ($fogMac | convertto-json) -IDofObject $fogmac.id -vb
    }
}
```

This does a POST to `{fogurl}/fog/macaddressassociation/{macID}/edit` with a json formatted like the following for each mac address on a windows machine that already exists in FOG.

```
{
  "id": 6355,
  "hostID": 1847,
  "mac": "f4:a4:75:ab:93:d4",
  "description": "Wi-Fi - Intel(R) Wi-Fi 6E AX210 160MHz",
  "pending": "0",
  "primary": "0",
  "clientIgnore": "0",
  "imageIgnore": "0"
}
```

------------------------------------------------------------------------

#### Optional Fields

Hosts can also include, but are not required:

##### Description

> Information for your own reference.

##### Image Association

> This field is a drop down box that will allow you select an image
> object created in the **Images** section.

##### Operating System

> Drop down box that allow you to select the primary type of operating
> system running on this host.

##### Kernel

> This is only used if you want to overwrite the default kernel used for
> FOG. Needs to be specified as fog/kernel/mybzImage

##### Kernel Arguments

> This allows you to add additional kernel arguments for booting the
> host (ie: vga=6, or irqpoll).
>
> Two arguments change which disk FOG images when **Primary Disk** is
> empty and the image is a single-disk type:
>
> - `largesize=1` picks the largest disk by capacity.
> - `smallsize=1` picks the smallest disk by capacity.
>
> Without either, FOG takes the first disk the kernel enumerates. USB and
> removable devices are only considered when no internal disk is present,
> so a USB stick or a USB device that exposes its driver files as a small
> disk is never chosen over an internal drive. Both arguments can be set
> on a group to apply to every host in it.

##### Primary Disk

> This option allows you to force a device to use during imaging if fog
> fails to detect the correct device node.
>
> The value can be a device path such as `/dev/nvme0n1`, or, because
> device paths can change between boots, the disk's serial number, WWN,
> filesystem UUID, or exact size in bytes. Naming a USB or removable
> device here works: the automatic rules above only apply when this field
> is empty.

------------------------------------------------------------------------

>[!note]
>This page also allows for configuration of Active Directory integration,
>but this topic will be covered later.


**When all settings are added, click on the "Add" button.**

### Method 4: Importing Host Information

-   When getting started with FOG, you need to enter the host
    information for the devices on your network. We understand this can
    be a long difficult process, so in order to make this process easier
    we created a page that allows you to import most of the host
    information from a CSV file.

>[!note]
>The CSV format changed significantly in FOG 1.6 (headered **or**
>positional columns, an `associations` column for groups/snapins/printers,
>and name-resolved foreign keys). See [[1.6/kb/reference/csv_import_export|CSV Import / Export]]
>for the full, current column layout and format rules — the safest workflow
>is **Export → edit → Import**, so you always start from a file FOG already
>considers valid.
>
>On FOG 1.5, the CSV format is strictly positional with no header row and no
>`associations` column — see the
>[[1.5/management/web/hosts|1.5 version]] of this page for that layout.

#### Importing the File

1.  After the file is prepared and saved, you will need to log into the
    FOG Management Portal.
2.  Then click on the Hosts icon .
3.  On the left-hand menu, click on **Import Hosts**.
4.  Browse for your file, then click "**Upload CSV**".

#### Create CSV From Network Scan

Per a community user in the forums. You can also use powershell to scan
the network and create a csv. See [Creating a csv host import from a
network
scan](https://forums.fogproject.org/topic/9560/creating-a-csv-host-import-from-a-network-scan?_=1602530061175)

``` {.powershell emphasize-lines="3,12"}
# examples, just gotta put subnets minus the final .x in a string array
# Could also be params if this was a function
$subnets = @("192.168.1", "192.168.2", "10.2.114", "192.168.0");
$subnets | ForEach-Object { # loop through each subnet
    for ($i=0; $i -lt 255; $i++) { # loop through 0 to 255 of the subnet
        $hn = nslookup "$_.$i"; # run nslookup on the current ip in the loop
        if ($hn[3] -ne $null -AND $hn[3] -ne "") { # does the ip have a dns entry
            $hostN = $hn[3].Replace("Name:","").Trim(); # parse the nslookup output into a fqdn host name
            $mac = getMac /S $hostN; # does the hostname have a mac addr. Can also add /U and /P for user and password if not running from a administrative account
            if ($mac -ne $null) { # was there a mac for the host?
                $macAddr = $mac[3].Split(' ')[0]; # use the first found mac address and parse it
                "$hostN,$macAddr" | Out-File C:\hosts.csv -Append -Encoding UTF8; # add the hostname,macaddress to the csv
            }
        }
    }
}
```

## Managing Hosts

### General

-   Once hosts have been added to the FOG database you can modify or
    delete them. Finding a host which you wish to edit can be done in
    two ways, the first is by listing all the hosts that exist. This is
    done by clicking on the "List All Hosts" button. The second way to
    locate a host is to use the search function. To search for hosts
    click on the "New Search" button, if you would like to search for
    all hosts you can enter a "\*" or "%". The search function will
    search in the host's name, description, IP and MAC address.
-   Once a host is located, it can be edited by clicking on the edit
    button or on the Host Name itself. Clicking on the edit button will
    display all the properties that were shown during host creation with
    the addition of snapin, printers, active directory, service
    settings, hardware, and login information.
-   The entire host object can be removed from the FOG system by
    clicking on the delete option at the bottom of the Host Menu.

### Multiple MAC Address Support

-   When FOG first registers your HOST computer it uses the first
    connected Ethernet cable and defaults it to the Primary MAC Address.
    Once the FOG Client is installed and reporting data back to the FOG
    server it may register other additional MAC addresses, such as
    wireless and other wired connections. Also, an additional MAC can
    also be added directly under the Host definition.

-   These new MAC Addresses will need to be approved before FOG will take advantage of them.

    1.  **Host Management** → **\[Selected Host\]** → *Additional MAC*
    2.  **Fog Configuration** → **MAC Address List** → *Approve Pending Addresses*

>[!note] A MAC is not the only way FOG can recognise a machine
>FOG 1.6 can also identify a booting host by what its firmware reports - the
>system UUID, serials and chassis asset tag - which covers shared USB NICs,
>docking stations and replaced network cards. It is a second opinion, not a
>replacement, and it changes nothing until you turn it up. See
>[[host-identity|Host Identity]].

-   **Fog Configuration** → **MAC Address List** At this location
    you can also *"Update Current Listings"* giving updated
    information on the MAC Addresses and their manufactures, listing it
    under the Host.

### Host Status

The **Ping Status** column on the host list shows whether the `FOGPingHosts`
service could reach the machine the last time it ran.

>[!warning] It is not an ICMP ping
>The check opens a **TCP connection to a single port** — port 445 by default —
>and reports whether it succeeded. A host that answers `ping` at the command
>line but does not listen on that port is reported unreachable, and that is
>working as designed. Linux hosts, Windows hosts with file and printer sharing
>off, and anything behind a host firewall are all affected.
>
>The port and the timeout are settings in 1.6: **FOG Configuration** →
>**FOG Settings** → **Ping Host Settings**. See
>[[1.6/kb/reference/ping-hosts-service|The Ping Hosts Service]] for how to choose them.

-   Hosts are looked up by **name**, so you need an internal DNS server tied in
    with your DHCP server, so that when a DHCP address is handed out the DNS
    server is notified of the new IP. Confirm the FOG server can resolve a host
    with:

        getent hosts somehostname

-   If that fails, the check cannot succeed whatever port you pick, and the
    host will always show as unreachable. If the name only resolves as a FQDN:

        #Replace fogproject.org with your domain suffix
        getent hosts somehostname.fogproject.org

-   then add your domain to the DNS **Search domains:** setting on your server.

-   If names resolve and a host still shows unreachable, check its
    **Last Client Check-In** below. If that is current, the machine is fine and
    only the port test is failing — usually a host firewall, or a host that
    genuinely does not run a service on that port.

>[!note] `FOG_HOST_LOOKUP` is not a performance setting
>Older documentation advised unticking **FOG Configuration** → **FOG Settings**
>→ **General Settings** → *FOG\_HOST\_LOOKUP* on fleets of 250+ hosts, on the
>grounds that the host list pinged each row as it loaded. It does not — the
>column renders a value the service already recorded, so the page costs the
>same either way. In 1.6 the setting controls whether the Ping Status column is
>**shown** at all.

### When was this host last seen?

Every host records two timestamps, shown on its **General** tab and as columns
on the host list. Both read **Never** until the event has happened at least
once, and neither can be edited — they are facts the server records, not
settings.

| Field on the host | Column on the list | What it proves |
|---|---|---|
| **Last Successful Ping** | Last Ping | the machine answered, at that time — it was powered on, on the network and routable from the server |
| **Last Client Check-In** | Last Check-In | the FOG client was installed, running, and able to reach the server, at that time |

"Answered" covers three ways of answering, and Last Successful Ping advances
for all of them:

- it replied to a real **ICMP echo request** — since 1.6 that is tried first;
- something answered on the TCP port FOG falls back to;
- it **refused** that connection. A host that is up with nothing listening
  still sends a TCP reset, and only a live machine can do that. Those show as
  **Up, port closed**.

Last Successful Ping records *how* the host answered, so it reads
`2026-08-23 01:14:52 (ICMP)` or `(TCP)`. A ping that gets no answer at all
leaves the field alone, so a host that has been off for a month is still
distinguishable from one that stopped answering ten minutes ago.

The pair is more useful than either half, because the interesting cases are
where the two disagree:

| Last Ping | Last Check-In | What it usually means |
|---|---|---|
| recent | recent | healthy |
| recent | old or Never | the machine is up but **the FOG client is broken, stopped, or was never installed** |
| old or Never | recent | the client is fine; the host is silently dropping both the echo request and the connection rather than refusing them — a host firewall. Not a fault, but the ping cannot see this machine |
| old | old | the machine has genuinely been off since the later of the two |

The second row is the one worth acting on. Full detail, including how to pick a
port for a mixed fleet: [[1.6/kb/reference/ping-hosts-service|The Ping Hosts Service]].

### Editing many hosts at once

Tick the hosts you want on the Hosts list and use **Edit selected hosts**.
This is where the settings that used to be pushed from a group page now live —
image, kernel, kernel arguments, primary disk, init, product key, BIOS and EFI
exit type, printer management level, Active Directory, hostname enforcement,
screen resolution and auto-logout.

The form is split into tabs the same way a single host's own page is —
**General**, **Active Directory** and **FOG Client**, plus a **Plugins** tab
when a plugin has added a field — so a setting is in the same place here as it
is on the host you would otherwise open. The tabs are only a layout: every
field is submitted whichever tab is on top, so you never have to visit a tab
to "confirm" the fields you left alone.

**Host Printer Management Level** is the one field whose tab may surprise you.
On a host's own page it sits on *Printer Associations*, and there is no such
tab here — you cannot assign printers in bulk, because printers are granted by
a group rather than copied onto hosts. What is left is the setting that decides
how hard the FOG client works on printers at each check-in, so it is on **FOG
Client** alongside screen resolution and auto-logout.

Every field carries its own action, and the default is always to do nothing:

| Action | What it does |
|---|---|
| **No change** | Leave every selected host's value alone |
| **Set on all** | Write the value you type to every selected host |
| **Clear on all** | Empty the field on every selected host |

Fields that are only on or off — joining the domain, hostname enforcement —
offer *No change*, *Enable on all* and *Disable on all* instead.

>[!note] Plugins can add fields here
>If you run the **Location** or **OU** plugins, their settings appear in this
>form alongside the built-in ones. Both used to have their own group tab that
>rewrote the value on every member; they use this form now, so *No change*
>works for them exactly as it does for everything else.

Two things follow from the action being separate from the value:

- **A form you open and submit without touching anything changes nothing.**
  There is no way to overwrite a field by forgetting about it.
- **"Set this to blank" and "leave this alone" are different instructions.**
  Choosing *Set on all* with an empty box makes the field blank; that is what
  *Clear on all* does explicitly, and it is why you never have to type a magic
  word to clear something.

Where the selection holds different values, the form says so — `(varies)` —
rather than picking one of them to show you.

>[!info] Coming from FOG 1.5?
>On 1.5 the only way to change a setting across many machines was to put them
>in a group and press *Update* on the group page. That wrote the value onto
>whichever hosts were members at that moment. *Edit selected hosts* works on
>any selection you can build — a search, a filter, a handful of ticks — and
>can be repeated. Those group-page controls are **gone** in 1.6 — not hidden,
>and there is no compatibility mode. See
>[[1.6/management/web/groups#Settings that are no longer on the group page|Group Management]]
>for the complete map of where each one went.
>
>**Power Management** used to be the exception here, and is not any more. A
>group's power *schedules* are grants like everything else in that table; only
>an immediate shut down, restart or wake is still a one-time push, because
>that is a task and a task acts on who is a member right now.

### Shutting down, restarting and waking hosts

Shut down, restart and wake are on the **Queue Task** list, in a **Power**
pane between *Basic Tasks* and *Advanced Tasks*. Tick the hosts, press *Queue
Task*, open **Power**, pick one.

They are there because they are tasks: each acts on whatever is selected the
moment you press it and leaves nothing standing behind it. A host that joins
the selection a minute later is not affected, and nothing is scheduled.

| Action | How it reaches the machine |
|---|---|
| **Wake** | The server sends a wake packet over the network. Nothing has to be installed on the machine, but the network in between has to carry it. |
| **Shut Down** | The FOG client carries it out at its next check-in. |
| **Restart** | Same as Shut Down — the FOG client, next check-in. |

>[!note] Shut Down and Restart need the FOG client
>They are handed to the machine rather than pushed at it, so a machine that
>is already off, or has no FOG client installed, is simply unaffected — you
>will not get an error saying so. Wake is the other way round: it is the
>server that sends it, so it works on a machine with nothing installed at all.

The same three are on a single host's own page, on the same **Queue Task**
button, so you do not have to go back to the list to restart one machine.

That is now the *only* place to ask for one. A host's **Power Management**
tab used to carry a *Create New Immediate* button beside its schedules; it
does not any more, and the tab is schedules only. Two things that behave
completely differently were sharing one card, and the immediate one belongs
with the other tasks.

>[!tip] For a *repeating* shutdown, use a schedule
>These three are one-offs — nothing is written down and nothing repeats.
>"Every weeknight at 22:00" is a power schedule: set it on the host's own
>**Power Management** tab, or grant it from a group so every member gets it. See
>[[1.6/management/web/groups#What a group gives its members|Group Management]].

>[!info] FOG 1.6
>Shutting down or restarting a *selection* could not be asked for before —
>the only route was one host's Power Management tab, one machine at a time,
>through a form built for scheduling. Wake could, but it was filed under
>*Advanced Tasks* beside Memtest and the disk wipes. All three are together
>now, and Wake has moved rather than been duplicated, so it is no longer
>under Advanced. *Create New Immediate* has gone from the host's Power
>Management tab in the same change — the tab is schedules only.

### Creating Host Groups

Group membership is editable straight from the Hosts list, which is usually
the fastest way to label a fleet:

1.  Filter or search until the machines you want are on screen. The **Groups**
    column shows each host's groups as links, in the order group assignments
    are applied, and it can be searched and filtered like any other column —
    so "everything in *Third Floor* that is not in *Dell PCs*" is a filter
    rather than a cross-referencing exercise.
2.  Tick the hosts, or use the check-all box in the title row.
3.  Click **Edit groups**, pick one or more groups, and choose **Add** or
    **Remove**.

Typing a name that is not a group yet **creates it** when you add. *Remove*
only works on groups that already exist.

>[!important] On FOG 1.6 that is the whole job
>A group **grants** its snapins, printers, client modules and power schedules
>to its members rather than copying them, so adding forty machines to a group
>is all it takes for those machines to receive what the group holds — there is
>no second step and no button to press afterwards. Removing a host takes them away again. See
>[[1.6/management/web/groups|Group Management]].
