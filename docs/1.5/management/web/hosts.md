---
title: "Host Management (1.5)"
aliases:
    - "Host Management (1.5)"
description: Adding and managing hosts on FOG 1.5, including the pre-1.6 positional CSV import/export format
context_id: "hosts-1.5"
tags:
    - management
    - hosts
    - 1_5-legacy
---

# Host Management (1.5)

>[!info] This page describes FOG 1.5.
>See the [[management/web/hosts|1.6 version]] of this page for FOG 1.6.

## Hosts

- A host in FOG is typically a computer, but it can be any network device.
- Hosts are used to identify a computer on the network and are used to
  manage the device.

## Adding a new host

### Method 1: Full registration

The preferred method, and maybe the easiest for getting a host into the FOG
database, but it requires you to visit the host.

- When at the client computer, during the boot up process when you see the
  PXE/iPXE boot menu select **Perform Full Host Registration and
  Inventory**.
- You will be prompted for information about the host like hostname,
  operating system, image, groups, product key, and other information.
- If you enter a valid operating system and image id, you will be asked to
  Image Now.
- After the requested information is entered, FOG pulls a quick hardware
  inventory from the client — MAC address (primary wired only), serial
  number (if available in BIOS), make/model, and other hardware information.

### Method 2: Quick Registration

Like full registration, but with no prompts and no option to image directly
from the registration screen. The host is named with its primary MAC
address. This is disabled by default — enable it under **FOG Configuration →
FOG Settings → FOG Quick Registration**, where you also set the image and OS
to assign, a naming pattern, and a starting number.

### Method 3: Manually Adding

- Adding a new host can be done in the hosts section of FOG, by clicking
  **Add New Host** on the left-hand menu.
- At least a hostname and a MAC address must be entered.

#### Required fields

- **Hostname** — the Windows hostname of the client, under 15 characters.
- **MAC address** — colon-separated, `00:11:22:33:44:55`.

#### Optional fields

- **Description** — for your own reference.
- **Image Association** — a drop-down of images created in **Images**.
- **Operating System** — the primary OS running on the host.
- **Kernel** — overrides the default kernel used for FOG, specified as
  `fog/kernel/mybzImage`.
- **Kernel Arguments** — additional kernel arguments for booting (e.g.
  `vga=6`, `irqpoll`).
- **Primary Disk** — forces a device to use during imaging if FOG fails to
  detect the correct one.

### Method 4: Importing Host Information

FOG can import host information from a CSV file, which is much faster than
adding hosts one at a time when you already have a spreadsheet of them.

#### The CSV format

The import is **strictly positional** — there is no header row, and no
autodetection of which column is which. Every row must carry exactly the
same columns, in exactly this order:

```
macs, name, description, ip, imageID, building, createdTime, deployed,
createdBy, useAD, ADDomain, ADOU, ADUser, ADPass, ADPassLegacy, productKey,
printerLevel, kernelArgs, kernel, kernelDevice, init, pending, pub_key,
sec_tok, prev_sec_tok, sec_time, pingstatus, biosexit, efiexit, enforce,
token, tokenlock
```

That is every field FOG stores against a host except its internal ID — the
import exposes internal fields like `pub_key`, `sec_tok` and `token` as
plain CSV columns, because it maps columns straight onto the host's field
list by position rather than by name.

- **Multiple MAC addresses** go in the first column only, separated by a
  pipe (`|`) — `aa:bb:cc:dd:ee:ff|11:22:33:44:55:66`. No other field
  supports multiple values; there is no way to represent group, snapin or
  printer associations in a 1.5 host CSV at all.
- **Quoting and escaping** follow ordinary CSV rules — enclose a field in
  double quotes if it contains a comma.
- **A row with too many columns aborts the whole file**, not just that row.
  A row with too few is not checked and can silently read garbage into the
  fields that are missing.
- **Matching is by MAC address or by hostname** — if either already exists,
  the import throws "already exists" for that row. There is no
  update-by-CSV path; import only ever inserts new hosts.

>[!warning] Exporting and re-importing your own file can shift columns
>FOG's own CSV **export** for hosts omits both the internal ID and the
>`pingstatus` column (29 columns). Its **import** only omits the ID
>(30 columns expected). Feeding an exported file straight back into import
>therefore shifts every column after `pingstatus` — `biosexit`, `efiexit`,
>`enforce`, `token`, `tokenlock` — one position to the left. Build your
>import file from scratch against the column list above rather than
>trusting a round trip through export.

#### Importing the file

1. Log into the FOG Management Portal.
2. Click on the Hosts icon.
3. On the left-hand menu, click **Import Hosts**.
4. Browse for your file, then click **Upload CSV**.

## Managing Hosts

### General

- Once hosts have been added you can modify or delete them. List all hosts
  with **List All Hosts**, or search — click **New Search** and enter `*`
  or `%` to match everything. Search covers the host's name, description,
  IP and MAC address.
- Open a host by clicking its name or the edit button to see snapin,
  printer, Active Directory, service, hardware, virus history and login
  information alongside the fields shown at creation.
- Remove a host entirely from the delete option at the bottom of the host
  menu.

### Multiple MAC Address Support

- FOG registers a host's first connected Ethernet cable as its primary MAC
  address. Once the FOG Client is installed and reporting, it may register
  additional MAC addresses (wireless, other wired connections). You can
  also add one directly under the host.
- New MAC addresses need approval before FOG uses them: **Host Management**
  → *[Selected Host]* → *Additional MAC*, then **FOG Configuration** →
  **MAC Address List** → *Approve Pending Addresses*.
- **FOG Configuration → MAC Address List** also lets you *Update Current
  Listings* to refresh manufacturer information against each MAC.

### Host Status

The **Ping Status** column on the host list shows whether the last check
from the ping-hosts service reached the machine.

>[!warning] It is not an ICMP ping
>The check opens a **TCP connection to a single port** — port 445 by
>default — and reports whether it succeeded. A host that answers `ping` at
>the command line but does not listen on that port is reported unreachable,
>and that is working as designed. Linux hosts, Windows hosts with file and
>printer sharing off, and anything behind a host firewall are all affected.

- Hosts are looked up by **name**, so you need an internal DNS server tied
  in with your DHCP server, so that when a DHCP address is handed out the
  DNS server is notified of the new IP. Confirm the FOG server can resolve
  a host with:

      getent hosts somehostname

- If that fails, the check cannot succeed whatever port you pick, and the
  host always shows unreachable.

### Creating Host Groups

- FOG allows you to create groups of hosts, which then allows you to take
  action on a whole grouping of hosts.
- Select the hosts you want in the group from **List All Hosts** or a
  search result — check them individually, or use the check-all button in
  the title row.
- Scroll to the bottom, enter a name in the create-group box (or select an
  existing group), then click **Process Group Changes**.
