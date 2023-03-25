## Overview

This tutorial will show you how to setup a bond where multiple network
cards are combined to look like a single NIC for increased throughput
and redundancy.

\_\_TOC\_\_

## Ubuntu 10.04 or higher {#ubuntu_10.04_or_higher}

-   Install ifenslave

`sudo apt-get update && sudo apt-get install ifenslave`

We are using a basic bonding mode 2. For other modes, please see:
<https://help.ubuntu.com/community/UbuntuBonding>

**We have had issues on Ubuntu 10.04 using mode 0, we have had better
luck using mode 2**

==== mode=0 (balance-rr) (See note above!) ==== Round-robin policy:
Stripes traffic across multiple interfaces. This mode provides load
balancing and fault tolerance. the striping generally results in peer
systems receiving packets out of order, causing TCP/IPs congestion
control system to kick in, often by retransmitting segments. ====mode=1
(active-backup)==== Active-backup policy: Only one slave in the bond is
active. A different slave becomes active if, and only if, the active
slave fails. The bonds MAC address is externally visible on only one
port (network adapter) to avoid confusing the switch. This mode provides
fault tolerance. The primary option affects the behavior of this mode.
====mode=2 (balance-xor)==== XOR policy: Transmit based on \[(source MAC
address XOR\'d with destination MAC address) modulo slave count\]. This
selects the same slave for each destination MAC address. This mode
provides load balancing and fault tolerance. ====mode=3 (broadcast)====
Broadcast policy: transmits everything on all slave interfaces. This
mode provides fault tolerance.

-   Edit your interfaces file, /etc/network/interfaces.

`auto lo`\
`iface lo inet loopback`\
`auto bond0`\
`iface bond0 inet static`\
`   bond-slaves none`\
`   bond-mode 2`\
`   bond-miimon 100`\
`   address 192.168.1.50`\
`   netmask 255.255.255.0`\
`   network 192.168.1.0`\
`   broadcast 192.168.0.255`\
`   gateway 192.168.1.1`\
`   hwaddress ether 00:AA:BB:CC:DD:EE`\
`auto eth0`\
`iface eth0 inet manual`\
`   bond-master bond0`\
`   bond-primary eth0 eth1`\
`auto eth1`\
`iface eth1 inet manual`\
`   bond-master bond0`\
`   bond-primary eth0 eth1`

hwaddress could be the MAC address of one of you network cards, this can
be found by running:

`ifconfig`

-   Reboot your server

`sudo reboot`

## CentOS / RedHat {#centos_redhat}

Edit /etc/modprobe.conf and add the following (see the note above in the
Ubuntu section about this type of bonding):

    alias bond0 bonding
    options bonding mode=0 miimon=100 downdelay=200 updelay=200

Create the file /etc/sysconfig/network-scripts/ifcfg-bond0 and add the
following (substitute your server\'s IP address, netmask and gateway of
course):

    # Bonded interface
    DEVICE=bond0
    BOOTPROTO=static
    ONBOOT=yes
    IPADDR=<Your server IP here>
    NETMASK=<Your netmask>
    GATEWAY=<Your server's default gateway>
    TYPE=Ethernet

Edit the file /etc/sysconfig/network-scripts/ifcfg-eth0 so that it looks
similar to this. This file should already exist, you\'re just editing
out the IP address configuration. Preserve your server\'s MAC address if
this file is already there to make things easier.

    DEVICE=eth0
    BOOTPROTO=none
    ONBOOT=yes
    HWADDR=<MAC address of NIC>
    MASTER=bond0
    SLAVE=yes
    TYPE=Ethernet

Edit /etc/sysconfig/network-scripts/ifcfg-eth1 and so on for each
interface you want to bond together. All that\'s needed in the ifcfg
script is what is shown above. Again, substitute your server\'s MAC
addresses in place of the HWADDR listed above. Don\'t forget to change
the DEVICE= line as well to correspond to the interface you\'re setting
up (eth1, eth2, etc)
