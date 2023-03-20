## HP Procure Multicast Configuration {#hp_procure_multicast_configuration}

### Overview

#### Components Used {#components_used}

1.  Fog server running version 0.30
2.  HP ProCurve 5406zl (core layer 3 router)
3.  HP ProCurve 4108 (building layer 2 Switch)
4.  HP ProCurve 2520 (layer 2 Switch on my desk)
5.  2 PCs

#### Setup

1.  3 Subnets (and VLANs) one for servers and two for students/staff
2.  FOG server on vlan 1 with IP address 192.168.19.77 - connected to
    the 5406zl
3.  2 PCs on vlan 4 with IP address lease from DHCP (192.168.18.x) NOT
    from FOG server - connected to the 2520

#### Procuve Router Commands - Layer 3 {#procuve_router_commands___layer_3}

commands here are modified extracts of
<http://cdn.procurve.com/training/Manuals/3500-5400-6200-6600-8200-MRG-Mar10-K_14_52.pdf>
page 3-20

connect via telnet to Router (5406zl)

`ProCurve# config`\
`ProCurve(config)# ip routing`\
`ProCurve(config)# ip multicast-routing`\
`ProCurve(config)# router pim`\
`ProCurve(config)# vlan 1      //the 19 subnet`\
`ProCurve(vlan-1)# ip igmp`\
`ProCurve(vlan-1)# ip pim-dense ip-addr 192.168.19.21   //This is the switches IP in VLAN 1, you may only need this if the switch is multihomed in that subnet`\
`ProCurve(vlan-1-pim-dense)# vlan 4`\
`ProCurve(vlan-4)# ip igmp`\
`ProCurve(vlan-4)# ip pim-dense `\
`ProCurve(vlan-4-pim-dense)# vlan 5`\
`ProCurve(vlan-5)# ip igmp`\
`ProCurve(vlan-5)# ip pim-dense`\
`ProCurve(vlan-5-pim-dense)# write mem`\
`ProCurve(vlan-5-pim-dense)# exit`\
`ProCurve(vlan-5)# exit`

switch may need to be rebooted if router PIM was not already enabled
consult manual for exact details on your switch

### Procurve Switch Commands - Layer 2 {#procurve_switch_commands___layer_2}

Commands for the layer 2 switches to enable IGMP routing While applying
these settings to sub-switches is not required, not enabling IMGP on the
switch may create excessive traffic to ALL nodes of the switch during a
multicast session.

By enabling IGMP allows the switch to send multicast packets to only the
computers who have joined the session.

`ProCurve# config`\
`ProCurve(config)# ip routing`\
`ProCurve(config)# ip multicast-routing`\
`ProCurve(config)# vlan 1  `\
`ProCurve(vlan-1)# ip igmp`\
`ProCurve(vlan-1)# vlan 4  `\
`ProCurve(vlan-4)# ip igmp`\
`ProCurve(vlan-4)# vlan 5  `\
`ProCurve(vlan-5)# ip igmp`\
`ProCurve(vlan-5)# write mem`\
`ProCurve(vlan-5)# exit`
