How to forward Wake-on-LAN and DHCP traffic from one subnet to another
subnet.

## Cisco\'s implementation {#ciscos_implementation}

### DHCP Forwarding {#dhcp_forwarding}

We shall assume you wimped out configuring your own DHCP server (if you
do not know about \'ip helper-address\') and your FOG server is the
center of life on your network. The IP of your FOG server is 10.10.10.1.

If an IP helper address is specified and UDP forwarding is enabled,
broadcast packets destined to the following port numbers are forwarded
by default.

`  Time Service             Port 37`\
`  TACACS                   Port 49`\
`  Domain Name Services     Port 53`\
`  Trivial File Transfer    Port 69`\
`  DHCP (BootP)             Port 67 and Port 68`\
`  NetBIOS Name Server      Port 137`\
`  NetBIOS Datagram Server  Port 138`

To have the Cisco IOS software forward User Datagram Protocol (UDP)
broadcasts, including BOOTP, received on an interface, use the ip
helper-address interface configuration command. To disable the
forwarding of broadcast packets to specific addresses, use the no form
of this command.

`ip helper-address 10.10.10.1`

`no ip helper-address 10.10.10.1`

Now you want to turn off *broadcast* forwarding for all of the other
services, you would have to be crazy to want them to spill over, with:

`no ip forward-protocol udp time`\
`no ip forward-protocol udp tacacs`\
`no ip forward-protocol udp domain`\
`no ip forward-protocol udp tftp`\
`no ip forward-protocol udp netbios-ns`\
`no ip forward-protocol udp netbios-dgm`

**N.B.** these affect only *broadcast* traffic on these UDP ports, not
the functionality of, for example, unicast TFTP traffic on your network

### WoL Forwarding {#wol_forwarding}

To actually forward the WoL packets to VLAN\'s without opening yourself
up to being the source of a [Smurf
Attack\'s](http://en.wikipedia.org/wiki/Smurf_attack) you need to [use
\'ip directed-broadcast\' with
care](http://www.cisco.com/en/US/products/hw/switches/ps5023/products_configuration_example09186a008084b55c.shtml#directed).
You create a standard access-list (numbered \'50\' in our example):

`access-list 50 remark directed broadcast permits (ie WoL)`\
`access-list 50 permit 10.10.10.1`

and for all the VLAN\'s you want to use WoL on you slip into the
configuration:

`ip directed-broadcast 50`

If you want to be able to send WoL packets from other machines on your
network then obviously add additional whitelisted of IP\'s to the
access-list.

Alas we have not finished yet, we need to fix some *serious* problems in
FOG servers methology when doing WoL. It has no concept of support for
cross-subnet WoL and shockingly you need to use sudo to create a UDP
packet that can be created by a regular user; using root pointlessly (a
webserver should *never* run a command directly as root).

As most of your are Deadrat weenies (Debian users just type \'aptitude
install wakeonlan\') so you should from [download the wakeonlan
tool](http://gsd.di.uminho.pt/jpo/software/wakeonlan/) (the
[wakeonlan-`<version>`{=html}.noarch.rpm](http://gsd.di.uminho.pt/jpo/software/wakeonlan/downloads/wakeonlan-0.41-0.fdr.1.noarch.rpm)
file) and install it running as root:

`rpm -i wakeonlan-``<version>`{=html}`.noarch.rpm`

If you prefer Mac computers - then you can use [osx safe
mode](http://mackeeper.zeobit.com/how-to-make-your-mac-faster) Once
installed just edit \'/var/www/html/fog/wol/wol.php\' to match something
like:

```{=html}
<?php
 require_once( "../commons/config.php" );
 require_once( "../commons/functions.include.php" );
 
 $mac = $_GET["wakeonlan"];
 if ( isValidMACAddress( $mac ) )
 {
         $output;
         $ret = "";
 
         # ewwwww GAH, yuck, barf, wtf?
         #exec ( "sudo /sbin/ether-wake -i " . WOL_INTERFACE . " " . $mac, $output, $ret );
 
         exec ( "/usr/bin/wakeonlan -i 10.10.12.255 " .  $mac, $output, $ret );
         exec ( "/usr/bin/wakeonlan -i 10.10.13.255 " .  $mac, $output, $ret );
         exec ( "/usr/bin/wakeonlan -i 10.10.14.255 " .  $mac, $output, $ret );
 }
 ?>
```
The IP\'s \'10.10.1\[234\].255\' are the broadcast addresses of the
VLAN\'s you want to send WoL packets too; the above example will mean
that the suitable WoL packets for the MAC address you are interested in
will be sent to the subnets \'10.10.1\[234\].0/24\'.

This will probably be made much nicer once the authors find this and
make FOG subnet aware (guys please do not use the last IP of the
workstation, it might have moved subnets, WoL packets should be
duplicated to every VLAN separately).

#### WoL With 802.1x {#wol_with_802.1x}

Just amend your usual 802.1x per-port configuration section to have:

`switchport access vlan ``<unauthorised VLAN ID>`{=html}\
`dot1x control-direction in`

This means that you send your WoL packet to the broadcast address of the
VLAN with the number ID that you put in place of
\'`<unauthorised VLAN ID>`{=html}\' and your workstations should still
wake up\...whilst you still benefit from the goodness of 802.1x.

## Dell PowerConnect 6024/6024F Systems {#dell_powerconnect_60246024f_systems}

The following example enables the software to forward UDP broadcasts on
interface 1.100.100.0 to IP address 172.16.9.9 to ports 49 and 53.

`Console(config)# interface ip 1.100.100.0`

`Console (config-ip)# helper-address 172.16.9.9 49 53`

## Juniper\'s implementation {#junipers_implementation}

`host1(config)#set dhcp relay 192.168.29.10`

## Enterasys Matrix Router {#enterasys_matrix_router}

This example shows how to permit UDP broadcasts from hosts received by
VLAN 1 to reach server 191.168.1.24 and broadcasts received by VLAN 2 to
reach server 192.24.1.10:

`matrix-x(switch-su)-> router`\
`matrix-x(router-exec)# configure`\
`matrix-x(router-config)# ip forward-protocol udp`\
`matrix-x(router-config)# interface vlan.1.1`\
`matrix-x(router-config-if-vlan-1)# ip helper-address 192.168.1.24`\
`matrix-x(router-config-if-vlan-1)# exit`\
`matrix-x(router-config)# interface vlan.1.2`\
`matrix-x(router-config-if-vlan-2)# ip helper-address 192.24.1.10`

## The Simple One Modification Method: Modify wol.php {#the_simple_one_modification_method_modify_wol.php}

For FOG ver 0.29 with wakeonlan. Just modify your wol.php file in
/var/www/fog/wol/.

This is an option that allows you to route the magic packet by using the
optional -i switch with wakeonlan. The -i switch in the wakeonlan
program accepts either an ip address or computer name (DNS).

**The best part is that there is no broadcasting setup needed.**

*Unfortunately, this will only work for as long as the ARP cache is held
on your switches. For Cisco, the default is 4 hours.*

You can simply add code to query the MySQL database using the MAC
address to pull the computer name, which is then inserted (along with
the MAC) into the wakeonlan command for the -i switch. The packet is
then directed exactly where it needs to go, as long as the computer has
been inventoried with the correct PC name used in DNS.

There are likely improvements that can be made, such as passing the FOG
variables in from the FOG config file instead of hardcoding here for
username and password, as well as error checking, improved coding, or
anything else that could help, but nonetheless it is a very simple
solution for WOL accross a WAN.

Here is the modified wol.php code: (You may want to save a copy of the
original wol.php first and modify your variables)

`@error_reporting(0);`\
`function __autoload($class_name) `\
`{`\
`   require( "../lib/fog/" . $class_name . '.class.php');`\
`}`\
`$mac = new MACAddress($_GET["wakeonlan"]);                                         #########  <---This is the same`\
\
`   #Added by Bwild 1/7/11:`\
`   ###################### Modify these variables below if needed.`\
`   $mysqlserver = "localhost";`\
`   $mysqlusername = "yourusername";`\
`   $mysqlpassword = "yourpassword";`\
`   $dbname = "fog";`\
`   ######################`\
\
`if ( $mac != null && $mac->isValid( ) )                                            #########  <---This is the same`\
`{`\
`   $conn = mysql_connect("$mysqlserver", "$mysqlusername", "$mysqlpassword");  ##############   This section is new; it is the MySQL database query.`\
`       if (!$conn) {`\
`       die('Could not connect: ' . mysql_error());`\
`       }`\
`   mysql_select_db("$dbname");`\
\
`   $sql = "SELECT hostName from hosts WHERE hostMAC = '$mac'";`\
`   $hostrow = mysql_query($sql);`\
\
`   if (!$hostrow) {`\
`       die('Invalid query: ' . mysql_error());`\
`       }`\
\
`   $hostname =  mysql_fetch_row($hostrow);                                     ##############   End of the query.`\
`##### This will wake up on the same subnet (doesn't cross routers)`\
`   $wol = new WakeOnLan($mac->getMACWithColon());`\
`   $wol->send();`\
\
`##### This will wake up over a WAN (routed with the IP listed w/ this MAC in the HOSTS table in MySQL)`\
`   exec ( "/usr/bin/wakeonlan -i " . $hostname[0] . " " . $mac );`\
`       `\
`}`

Thanks and credit to the earlier contributors that led to this wol.php
solution. \--[Bwild](User:Bwild "wikilink") 20:36, 7 January 2011 (UTC)
