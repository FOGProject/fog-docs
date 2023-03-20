## What is PXE? {#what_is_pxe}

### Abbreviation Means {#abbreviation_means}

Preboot Execution Environment (PXE)

### Alternate Resources {#alternate_resources}

A good resource to use to gain a great understand of exactly what PXE is
would be to click [Understanding PXE
Booting](http://docs.oracle.com/cd/E24628_01/em.121/e27046/appdx_pxeboot.htm)

### Summary

The PXE protocol is, approximately, a combination of DHCP and TFTP
working together to provide a boot environment over networking means.
Subtle modifications to both DHCP and TFTP during the PXE Boot
environment are made. DHCP is used to locate the appropriate boot
server. TFTP is used to download the initial bootstrap program and/or
additional files as needed.

To initiate a PXE bootstrap session the PXE firmware broadcasts a
DHCPDISCOVER packet extended with PXE-specific options (extended
DHCPDISCOVER) to port 67/UDP (DHCP server port). The PXE options
identify the firmware as capable of PXE, but they will be ignored by
standard DHCP servers. If the firmware receives DHCPOFFERs from such
servers, it may configure itself by requesting one of the offered
configurations.

These are normally portrayed with:

#### Linux DHCP (ISC\|DHCP\|DHCP3) {#linux_dhcp_iscdhcpdhcp3}

##### Server Location {#server_location}

    next-server

##### File to Download {#file_to_download}

    filename "<FILENAME TO RECIEVE>"

#### Windows DHCP/AD {#windows_dhcpad}

##### Server Location {#server_location_1}

    Option 66

##### File to Download {#file_to_download_1}

    Option 67

#### DNSMasq/proxyDHCP

Item\'s in reference are bolded to help standout. The 3 fields are not
needed, just used here to represent typical usage. You can set dhcp-boot
with only one field (the boot filename) or two (bootfilename and
server).

##### Server Location {#server_location_2}

dhcp-boot=pxelinux.0,**fogserver**,**10.0.0.10**

##### File to Download {#file_to_download_2}

dhcp-boot=**pxelinux.0**,fogserver,10.0.0.10

## What is iPXE? {#what_is_ipxe}

Formerly gPXE project, iPXE is an open source PXE implementation and
bootloader. It can be used to enable computers without built-in PXE
support to boot from the network, or to extend an existing PXE
implementation with support for additional protocols. While traditional
PXE clients use TFTP to transfer data, iPXE adds the ability to retrieve
data through other protocols like HTTP, iSCSI, ATA over Ethernet (AoE),
and Fibre Channel over Ethernet (FCoE), and can work with Wi-Fi rather
than requiring a wired connection.

-   YES, (technically) wireless imaging is supported but largely
    untested due to the absence in most BIOS setups.

## What are the differences between the different PXE files? {#what_are_the_differences_between_the_different_pxe_files}

### Filenames

-   ipxe has drivers native to the ipxe project. Those drivers are
    handled from the iPXE developers.
-   undionly uses the \"undi\" stack made by the manufacturer of the
    NIC.

Universal Network Device Interface (UNDI) is an application programming
interface (API) for network interface cards (NIC) used by the Preboot
Execution Environment (PXE) protocol.

When chainloading iPXE from PXE, iPXE can use this API (instead of
loading a hardware driver). This way, you\'re getting support for
network controllers that are not natively supported by iPXE. Some
network controllers have improved performance when using the UNDI driver
over the vendor specific iPXE driver.

To use the UNDI driver, select the UNDI driver (undionly) when
generating the iPXE ROM. (e.g. make bin/undionly.kpxe
EMBED=embedscriptname) [Reference without edits
here.](http://etherboot.org/wiki/pxechaining)

### Extensions

More info can be referenced here:
[1](http://etherboot.org/wiki/gpxe_imagetypes)

1.  .pxe is an image designed to be chain loaded, unloading both the
    underlying PXE and UNDI code sections. This is ultimately the goal,
    but there\'s not enough information to allow this to actually work
    flawlessly every time. It uses, purely, the drivers from the iPXE
    information. One of the benefits is the codebase for the drivers are
    handled by the iPXE developers. So, in theory and given enough time,
    all NICs could potentially be supported.
    -   .pxe is an image designed to be chain loaded, unloading both the
        underlying PXE and UNDI code sections.
        [etherboot.org](http://etherboot.org/wiki/gpxe_imagetypes)
2.  .kpxe unloads just the pxe stack and is the normal file we want in
    use as it seems to be the best between pxe/chaining I can find
    without flashing roms.
    -   .kpxe is a PXE image that keeps UNDI loaded and unloads PXE
        [etherboot.org](http://etherboot.org/wiki/gpxe_imagetypes)
3.  .kkpxe keeps both undi and pxe stacks in place. kkpxe works best for
    buggy hardware. Only recommended if you\'re having weird issues with
    the undionly.kpxe
    -   .kkpxe is a PXE image that keeps PXE+UNDI loaded and return to
        PXE (instead of int 18h). From
        [here](http://www.etherboot.org/wiki/soc/2008/stefanha/journal/week8)
        [etherboot.org](http://etherboot.org/wiki/gpxe_imagetypes)
4.  .kkkpxe is only used to generate the ipxelinux.0 file. This is only
    used in conjunction with the syslinux project. When gpxe was the
    developed software of this type the file was called gpxelinux.0
    which can usually be built with modern syslinux.

More information on this can be found on the ipxe forum thread located
[here.](http://forum.ipxe.org/showthread.php?tid=6989)

## Undi and iPXE Stack {#undi_and_ipxe_stack}

More information on differences and when to use are located
[here.](http://forum.ipxe.org/showthread.php?tid=6989) The UNDI driver
is a generic driver that works on network cards that have a vendor UNDI
ROM. The ROM contains driver code that is supposed to conform to the
PXE/UNDI specification. iPXE can load the UNDI driver and use it instead
of a native driver.

Depending on the iPXE image type, UNDI support works as follows:

-   undionly.kpxe is loaded from a vendor PXE stack and uses UNDI on the
    network card that it was booted from.

```{=html}
<!-- -->
```
-   All-driver (ipxe) or undi images can load the UNDI for PCI network
    cards. The network boot ROM must be enabled in the BIOS in order for
    the UNDI ROM to be visible to iPXE. Note that only the first network
    card is supported with UNDI since multiple instances of UNDI is
    unreliable and cannot be supported.

#### Why write native drivers if UNDI works with every network card? {#why_write_native_drivers_if_undi_works_with_every_network_card}

-   iPXE is an open source PXE stack and provides UNDI services. iPXE
    cannot be used as an option ROM without a native driver.

```{=html}
<!-- -->
```
-   UNDI is slow because iPXE must switch CPU modes when calling it.

```{=html}
<!-- -->
```
-   UNDI ROMs can be buggy or violate the PXE specification. Native
    drivers are known to work with iPXE and can be fixed if there is a
    bug since they are part of the iPXE codebase.

```{=html}
<!-- -->
```
-   Enabling the network boot ROM in the BIOS is not always possible or
    desirable.

------------------------------------------------------------------------

## STP/Portfast/RSTP/MSTP To Enable or Disable? {#stpportfastrstpmstp_to_enable_or_disable}

### STP

-   What is STP?
    -   The Spanning Tree Protocol (STP) is a network protocol that
        ensures a loop-free topology for any bridged Ethernet local area
        network. The basic function of STP is to prevent bridge loops
        and the broadcast radiation that results from them. Spanning
        tree also allows a network design to include spare (redundant)
        links to provide automatic backup paths if an active link fails,
        without the danger of bridge loops, or the need for manual
        enabling/disabling of these backup links.

### Port Fast {#port_fast}

-   What is Portfast?
    -   The time Spanning Tree Protocol (STP) takes to transition ports
        over to the Forwarding state can cause problems. PortFast is a
        Cisco network function which can be configured to resolve this
        problem. This factor of time is not an issue for many people,
        but it can cause problems for some. (i.e. Fog imaging) You may
        see this issue is with Pre-Boot Execution (PXE) devices, such as
        Windows Deployment Services. PortFast is the solution to this
        problem of delays when client computers are connecting to
        switches. PortFast is not enabled by default. With PortFast
        enabled on a port, you effectively take the port and tell
        spanning tree not to implement STP on that port.

### RSTP

-   What is Rapid STP(RSTP)?
    -   The 802.1D Spanning Tree Protocol (STP) standard was designed at
        a time when the recovery of connectivity after an outage within
        a minute or so was considered adequate performance. With the
        advent of Layer 3 switching in LAN environments, bridging now
        competes with routed solutions where protocols, such as Open
        Shortest Path First (OSPF) and Enhanced Interior Gateway Routing
        Protocol (EIGRP), are able to provide an alternate path in less
        time. Cisco enhanced the original 802.1D specification with
        features such as Uplink Fast, Backbone Fast, and Port Fast to
        speed up the convergence time of a bridged network. The drawback
        is that these mechanisms are proprietary and need additional
        configuration. Rapid Spanning Tree Protocol (RSTP; IEEE 802.1w)
        can be seen as an evolution of the 802.1D standard more than a
        revolution. The 802.1D terminology remains primarily the same.
        Most parameters have been left unchanged so users familiar with
        802.1D can rapidly configure the new protocol comfortably. In
        most cases, RSTP performs better than proprietary extensions of
        Cisco without any additional configuration. 802.1w can also
        revert back to 802.1D in order to interoperate with legacy
        bridges on a per-port basis. This drops the benefits it
        introduces.

### MSTP

-   What is Multiple STP (MSTP)?
    -   The Multiple Spanning Tree Protocol (MSTP), originally defined
        in IEEE 802.1s and later merged into IEEE 802.1Q-2005, defines
        an extension to RSTP to further develop the usefulness of
        virtual LANs (VLANs). This Multiple Spanning Tree Protocol
        configures a separate Spanning Tree for each VLAN group and
        blocks all but one of the possible alternate paths within each
        Spanning Tree. If there is only one Virtual LAN (VLAN) in the
        network, single (traditional) STP works appropriately. If the
        network contains more than one VLAN, the logical network
        configured by single STP would work, but it is possible to make
        better use of the alternate paths available by using an
        alternate spanning tree for different VLANs or groups of VLANs.

### What do I enable and disable? {#what_do_i_enable_and_disable}

-   If you don\'t need STP all these options should be disabled already
    and nothing should need to be done. (**DISABLE ALL**)
-   If you have to use STP, to get (ipxe/dhcp) Fog (v1.x.x) working
    correctly you will need to *ENABLE PORTFAST* **OR** *ENABLE RSTP*.
-   Currently MSTP is untested with Fog but may be useful for networks
    with multiple VLANS.

### More information on Spanning Tree Protocol {#more_information_on_spanning_tree_protocol}

<http://en.wikipedia.org/wiki/Spanning_Tree_Protocol#Multiple_Spanning_Tree_Protocol>

## Compile

Moved to the official docs, see here:
<https://docs.fogproject.org/en/latest/reference/compile_ipxe_binaries.html>

## rom-o-matic.eu {#rom_o_matic.eu}

Instead of compiling iPXE on your own machine you can use the online
service at <https://rom-o-matic.eu/> if you don\'t want to be bothered
with installing compiler toolchain.

Click \"Advanced, for experienced users\" to get the full options! Then
choose an output format (undionly.kpxe would be \"PXE bootstrap loader
image \[keep PXE stack method 1\] (.kpxe)\" plus NIC type \"undionly\".
See the following listing for options we have included in the official
FOG iPXE binaries.

As well you might want to add our embedded script. The most current
version you can find in the git
([BIOS](https://github.com/FOGProject/fogproject/blob/dev-branch/src/ipxe/src/ipxescript)/[UEFI](https://github.com/FOGProject/fogproject/blob/dev-branch/src/ipxe/src-efi/ipxescript))
or svn
([BIOS](https://sourceforge.net/p/freeghost/code/HEAD/tree/trunk/src/ipxe/src/ipxescript)/[UEFI](https://sourceforge.net/p/freeghost/code/HEAD/tree/trunk/src/ipxe/src-efi/ipxescript))
repository.

### BIOS

-   ISA options (no change)
-   VMware options
    -   VMWARE_SETTINGS = YES
-   PCIAPI options (no change)
-   Serial options (no change)
-   Timer configuration (no change)
-   Network protocols (no change)
-   PXE support
    -   PXE_STACK = YES
-   Download protocols
    -   DOWNLOAD_PROTO_HTTPS = YES
    -   DOWNLOAD_PROTO_FTP = YES
    -   DOWNLOAD_PROTO_NFS = YES
-   SAN boot protocols (no change)
-   HTTP extensions (no change)
-   Wireless Interface Options (no change)
-   Name resolution modules (no change)
-   Image types
    -   IMAGE_PXE = YES
    -   IMAGE_SCRIPT = YES
    -   IMAGE_BZIMAGE = YES
    -   IMAGE_PNM = YES
    -   IMAGE_PNG = YES
-   Command-line commands to include
    -   IWMGMT_CMD = NO
    -   NSLOOKUP_CMD = YES
    -   TIME_CMD = YES
    -   DIGEST_CMD = YES
    -   LOTEST_CMD = YES
    -   VLAN_CMD = YES
    -   PXE_CMD = YES
    -   REBOOT_CMD = YES
    -   POWEROFF_CMD = YES
    -   IMAGE_TRUST_CMD = YES
    -   PCI_CMD = YES
    -   PARAM_CMD = YES
    -   NEIGHBOUR_CMD = YES
    -   PING_CMD = YES
    -   CONSOLE_CMD = YES
    -   IPSTAT_CMD = YES
-   ROM-specific options (no change)
-   Virtual network devices (no change)
-   Error message tables to include (no change)
-   Debugger options (no change)
-   USB configuration (no change)
-   Console options
    -   CONSOLE_FRAMEBUFFER = YES
-   Branding options (no change)
-   DHCP timeout parameters (no change)
-   PXE Boot Server timeout parameters (no change)

### UEFI

-   ISA options (no change)
-   VMware options
    -   VMWARE_SETTINGS = YES
-   PCIAPI options (no change)
-   Serial options (no change)
-   Timer configuration (no change)
-   Network protocols (no change)
-   PXE support (**no change - important!**)
-   Download protocols
    -   DOWNLOAD_PROTO_HTTPS = YES
    -   DOWNLOAD_PROTO_FTP = YES
    -   DOWNLOAD_PROTO_NFS = YES
-   SAN boot protocols (no change)
-   HTTP extensions (no change)
-   Wireless Interface Options (no change)
-   Name resolution modules (no change)
-   Image types
    -   IMAGE_PNG = YES
-   Command-line commands to include
    -   IWMGMT_CMD = NO
    -   NSLOOKUP_CMD = YES
    -   TIME_CMD = YES
    -   DIGEST_CMD = YES
    -   LOTEST_CMD = YES
    -   VLAN_CMD = YES
    -   PXE_CMD = **NO**
    -   REBOOT_CMD = YES
    -   POWEROFF_CMD = YES
    -   IMAGE_TRUST_CMD = YES
    -   PCI_CMD = YES
    -   PARAM_CMD = YES
    -   NEIGHBOUR_CMD = YES
    -   PING_CMD = YES
    -   CONSOLE_CMD = YES
    -   IPSTAT_CMD = YES
-   ROM-specific options (no change)
-   Virtual network devices (no change)
-   Error message tables to include (no change)
-   Debugger options (no change)
-   USB configuration (no change)
-   Console options
    -   CONSOLE_FRAMEBUFFER = YES
-   Branding options (no change)
-   DHCP timeout parameters (no change)
-   PXE Boot Server timeout parameters (no change)

If you find those settings are causing trouble for you or don\'t match
what you have online then please let us know in the forums!
