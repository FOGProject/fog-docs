## Cisco - Wake On Lan VLan Interface Configuration - Layer 3 {#cisco___wake_on_lan_vlan_interface_configuration___layer_3}

### Overview

#### Components Used {#components_used}

1.  FOG server running version 0.29
2.  Cisco Catalyst 3560G switch runs Cisco IOS software
    C3560-ipservicesk9-m version 12.2(53)SE2
3.  PC with BIOS setup with Wake-on-Lan

#### Setup

1.  FOG server on vlan 50 with IP address 10.2.50.70
2.  PC on vlan 130 with IP address lease from DHCP running on FOG server

### Cisco IOS Commands {#cisco_ios_commands}

`ip forward-protocol udp discard`\
`access-list 101 permit udp host 10.2.50.70 any eq 9`\
`interface Vlan50`\
` ip address 10.2.50.1 255.255.255.0`\
` ip helper-address 10.2.130.255`\
\
`interface Vlan130`\
` ip address 10.2.130.1 255.255.255.0`\
` ip helper-address 10.2.50.35`\
` ip directed-broadcast 101`

### Complete Basic config.text {#complete_basic_config.text}

The output below was dumped with

`Switch # sh run `

`Cisco switch config `\
`hostname Switch`\
`!`\
`boot-start-marker`\
`boot-end-marker`\
`!`\
`!`\
`no aaa new-model`\
`system mtu routing 1500`\
`vtp domain Cisco`\
`vtp mode transparent`\
`authentication mac-move permit`\
`ip subnet-zero`\
`ip routing   `\
`vlan internal allocation policy ascending`\
`!`\
`vlan 50`\
` name server`\
`!`\
`vlan 130`\
` name client`\
`!`\
`interface GigabitEthernet0/1`\
` switchport access vlan 50`\
` switchport mode access`\
` spanning-tree portfast`\
`!`\
`interface GigabitEthernet0/2`\
` switchport access vlan 130`\
` switchport mode access`\
` spanning-tree portfast`\
`!`\
`interface Vlan50`\
` ip address 10.2.50.1 255.255.255.0`\
` ip helper-address 10.2.130.255`\
`!`\
`interface Vlan130`\
` ip address 10.2.130.1 255.255.255.0`\
` ip helper-address 10.2.50.70`\
` ip directed-broadcast 101  `\
`ip forward-protocol udp discard`\
`access-list 101 permit udp host 10.2.50.70 any eq discard`\
`!`\
`end`
