## Cisco Multicast Configuration - Layer 3 {#cisco_multicast_configuration___layer_3}

### Overview

#### Components Used {#components_used}

1.  Fog server running version 0.29
2.  Cisco Catalyst 3560G switch runs Cisco IOS software
    C3560-ipservicesk9-m version 12.2(53)SE2
3.  2 PCs

#### Setup

1.  FOG server on vlan 50 with IP address 10.2.50.70
2.  2 PC on vlan 130 with IP address lease from DHCP running on FOG
    server

#### Cisco IOS Commands {#cisco_ios_commands}

`ip multicast-routing distributed`\
`interface Vlan50`\
` ip pim sparse-dense-mode`\
`!`\
`interface Vlan130`\
` ip pim sparse-dense-mode`\
`!`

### Complete Basic config.text {#complete_basic_config.text}

The output below was dumped with

`Switch # sh run `

`version 12.2`\
`!`\
`ip multicast-routing distributed`\
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
`interface GigabitEthernet0/3`\
` switchport access vlan 130`\
` switchport mode access`\
` spanning-tree portfast`\
`!`\
`interface Vlan50`\
` ip address 10.2.50.1 255.255.255.0`\
`ip pim sparse-dense-mode`\
`!`\
`interface Vlan130`\
` ip address 10.2.130.1 255.255.255.0`\
` ip helper-address 10.2.50.70`\
`ip pim sparse-dense-mode`\
`!`\
`end`
