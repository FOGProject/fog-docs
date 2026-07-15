---
title: DHCP Server Settings
context-id: dhcp-server-settings
description: The required settings for your DHCP server to point to fog on network boot
aliases:
    - DHCP Server Settings
    - Configuring DHCP Options 66 and 67
    - Other DHCP server than Fog
tags:
    - pxe
    - ipxe
    - dhcp
    - proxy
    - option-66
    - option-67
    - network
    - network-config
    - kea
    - isc-dhcp
    - linux
---

# DHCP Server Settings

If you do not use FOG to provide DHCP services in your network (which is a very common and completely supported configuration), then you need to configure the existing DHCP server to use fog as the tftp server to get the pxe boot files from, and you need to configure what boot file to use.

> [!info]
> If you do not have access to your DHCP server, or are using a device that isn't capable of specifying option 066 and 067 (next server and file name) you can use ProxyDHCP instead
> The most popular ProxyDHCP method with fog is dnsmasq. This article will walk you through that: [[proxy-dhcp|Proxy DHCP with DNSMasq]]

> [!tip]
> When using Palo Alto Networks firewalls as the DHCP server for PXE/iPXE booting, you may need to configure DHCP Option 150 with the FOG server IP address as the TFTP/next-server address. In some Palo Alto configurations, Option 66 is treated as a TFTP server name/FQDN and may not be enough for PXE clients. Keep Option 67 set to the boot file, such as `snp.efi` for UEFI clients. 


These two DHCP options must be set:

## Option 66

Set Option 66, also called 'Boot Server', 'Next server' or 'TFTP Server' to the IP address or hostname of the FOG server.

## Option 67

Set option 67, also called 'Bootfile Name' to the ipxe boot file that works best in your environment.
For modern UEFI environments, either of these files have the best compatibility (you simply enter this file name into the dhcp setting)

* snponly.efi
* ipxe.efi

Most newer clients will be able to boot with one of the efi boot files above, but older hardware models that do not have UEFI support and only support legacy BIOS firmware will not boot. 

> [!tip]
> If you have a mixed environment see [[bios-and-uefi-co-existence|Bios and UEFI Co-Existence]]

For older legacy models, these are the boot files to set

* undionly.kpxe
* undionly.kkpxe
* ipxe.kpxe
* ipxe.kkpxe

You can find other pxe boot files in you `/tftpboot` directory on your fogserver.

## Examples of DHCP server configurations

The below are some examples with screen shots on how to configure these settings in some servers.
The screenshots are a bit old but the general idea is still the same on modern versions

### Dedicated Linux DHCP server (Kea)

If you run a **dedicated [Kea DHCP](https://kea.readthedocs.io/) server** (separate from your FOG server), you can serve the right boot file to each client architecture (legacy BIOS vs. UEFI vs. ARM64) by classifying clients on the PXE vendor-class string. This is the same approach FOG uses when it hosts DHCP itself, so it is the most-tested configuration.

> [!tip]
> When you run the FOG installer and answer **No** to "Would you like to use the FOG server for DHCP service", FOG now writes a ready-to-copy sample to `kea-dhcp4.conf.fog-sample` in the FOG web root (e.g. `/var/www/html/fog/kea-dhcp4.conf.fog-sample`) with `next-server` already set to your FOG server. Copy that file to your Kea server as `/etc/kea/kea-dhcp4.conf` and edit the network-specific values below.

A complete `kea-dhcp4.conf` for a dedicated Kea server:

```json
{
    "Dhcp4": {
        "interfaces-config": { "interfaces": [ "eth0" ] },
        "lease-database": { "type": "memfile", "lfc-interval": 3600 },
        "valid-lifetime": 21600,
        "max-valid-lifetime": 43200,

        "next-server": "10.0.0.10",
        "option-data": [
            { "name": "tftp-server-name", "data": "10.0.0.10" }
        ],

        "subnet4": [
            {
                "id": 1,
                "subnet": "10.0.0.0/24",
                "pools": [ { "pool": "10.0.0.100 - 10.0.0.250" } ],
                "option-data": [
                    { "name": "subnet-mask", "data": "255.255.255.0" },
                    { "name": "routers", "data": "10.0.0.1" },
                    { "name": "domain-name-servers", "data": "10.0.0.2" }
                ]
            }
        ],

        "client-classes": [
            {
                "name": "FOG-Legacy-BIOS",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00000'",
                "boot-file-name": "undionly.kkpxe"
            },
            {
                "name": "FOG-UEFI-32-2",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00002'",
                "boot-file-name": "i386-efi/snponly.efi"
            },
            {
                "name": "FOG-UEFI-32-1",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00006'",
                "boot-file-name": "i386-efi/snponly.efi"
            },
            {
                "name": "FOG-UEFI-64-1",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00007'",
                "boot-file-name": "snponly.efi"
            },
            {
                "name": "FOG-UEFI-64-2",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00008'",
                "boot-file-name": "snponly.efi"
            },
            {
                "name": "FOG-UEFI-64-3",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00009'",
                "boot-file-name": "snponly.efi"
            },
            {
                "name": "FOG-UEFI-ARM64",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00011'",
                "boot-file-name": "arm64-efi/snponly.efi"
            },
            {
                "name": "FOG-Surface-Pro-4",
                "test": "substring(option[60].hex,0,32) == 'PXEClient:Arch:00007:UNDI:003016'",
                "boot-file-name": "snponly.efi"
            }
        ]
    }
}
```

**What to change for your network** (everything else can stay as-is):

| Value | Set it to |
| --- | --- |
| `interfaces` (`eth0`) | The NIC your Kea server listens on (or `"*"` for all) |
| `next-server` and `tftp-server-name` (`10.0.0.10`) | The IP address of your **FOG server** |
| `subnet` / `pools` (`10.0.0.0/24`, pool range) | The network and lease range you are serving |
| `routers` (`10.0.0.1`) | Your network's gateway |
| `domain-name-servers` (`10.0.0.2`) | Your DNS server(s) |

The `boot-file-name` values (`undionly.kkpxe`, `snponly.efi`, `i386-efi/snponly.efi`, `arm64-efi/snponly.efi`) are the standard iPXE binaries FOG ships in `/tftpboot` — leave them as-is. The `client-classes` match on DHCP option 60 (the PXE `PXEClient:Arch:NNNNN` vendor-class string) so each architecture is handed the correct binary automatically.

> [!note]
> Apple Intel netboot (BSDP) is **not** supported by Kea. If you must netboot Intel Macs, keep those on an ISC-DHCP server (FOG's ISC config still includes the BSDP class).

After editing, validate the file before starting the service:

```bash
kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

> [!tip]
> Prefer ISC-DHCP or already run it? A dedicated ISC `dhcpd.conf` uses the same idea with `class`/`filename` blocks (`match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00007"`). The easiest reference is the `/etc/dhcp/dhcpd.conf` FOG generates when it hosts DHCP — copy its `subnet` and `class` blocks to your dedicated server and change `next-server` to your FOG server's IP.

### Windows Server DHCP

#### Setting the options with powershell

This little powershell snippet will get all your dhcp server scopes and set option 66 and option 67 to the values you input into the script.
> [!note]
> This requires the dhcp module that is installed on a server when the dhcp role is added. You can also add it to your windows workstation machine by installing rsat tools, and of course it also requires admin privileges to manage the dhcp server options.
> This script will set the options at the scope/subnet levels rather than at a global server level

```powershell
#define your dhcp server hostname or ip
$dhcpSvr = 'dhcp.yourDomain.tld'
#define your fog server fqdn, hostname, or ip
$fogAddr = 'fogserver.yourDomain.tld'
#define you pxe boot file
$pxeBootFile = 'snponly.efi'

#get all the scopes from the main dhcp server and expand to the nested ipAddressToString property of the scopeIDs to get a string array of scope ids`

$scopes = (Get-DhcpServerv4Scope -ComputerName $dhcpSvr).scopeID.ipaddresstostring

#loop through all dhcp scopes and add the options
$scopes | Foreach-object {
	$dhcpOptions = @{
        ComputerName = $dhcpSvr;
        ScopeId = $_
	}
	Set-DhcpServerv4OptionValue @dhcpOptions -OptionID 66 -value $fogAddr;
    Set-DhcpServerv4OptionValue @dhcpOptions -OptionID 67 -value $pxeBootFile;
}

```



#### Setting the options in the dhcp console

You can get to the server or scope options of your dhcp server in `dhcpmgmt.msc` and set them like so

- Option 66
> [!tip]
> This can be the ip address, hostname, of fully qualified domain name (fqdn) of your fog server.


![[windows-66.png]]

-   Option 67
![[Windows_67.png]]

### Novell (Linux) Server DHCP

-   DHCP Overview from DNS/DHCP Console (Netware 6.5)
  ![[Novelldhcp.gif]]
-   Option 66
  ![[Novelloption66.gif]]
-   Option 67
  ![[Novelloption67.gif]]
Here is a link from Novell's website on how to setup their DHCP server:
<http://www.novell.com/coolsolutions/feature/17719.html>

<!-- ### MAC Server DHCP

Use OS X Server app to install and utilize DHCP.

Use DHCP Option Code Utility to generate the code necessary.
<https://docs.google.com/uc?id=0BwD4il5Z1G6fTmFFYU91bDNuRmc&export=download>\
\
One MUST generate the codes in order for PXE booting to work!\
bootpd.plist is located in /etc/bootpd.plist\
\
\*Option 66

-   -   ![[MACOption66.png]]

-   Option 67
    -   ![[MACOption67.png]]

\
\*Sample [bootpd.plist](bootpd.plist "wikilink")\
\*\* This is a sample file DO NOT USE THIS IN YOUR ENVIRONMENT!!!! OS X
Server app will generate most of this code for you, this example file is
to show you the place where the generated code needs to be placed.\
\*\*For Reference, your generated code should be placed between
\"dhcp_domain_search\" and \"dhcp_router\"\
\
Completed Bootpd.plist\
![[MACbootpd.png]] -->
