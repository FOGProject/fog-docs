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

##### Primary Disk

> This option allows you to force a device to use during imaging if fog
> fails to detect the correct device node.

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
    settings, hardware, virus history, and login information.
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

### Creating Host Groups

-   FOG allows you to create groups of hosts which then allows you to
    take action on a whole grouping of hosts.
-   Hosts can be created either on the "List All Hosts" section or by
    doing a search for hosts.
-   To create a group select the computer you would like to be member of
    the group by placing a check in the box next to the hostname, or by
    clicking the check all button in the title row. After the hosts are
    selected scroll to the bottom of the screen and then enter a name in
    the create to group box or select a group to add the hosts to. Then
    click on the "Process Group Changes" button.
