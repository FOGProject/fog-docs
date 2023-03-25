## ProCurve - Wake On Lan VLan Interface Configuration {#procurve___wake_on_lan_vlan_interface_configuration}

### Overview

#### Components Used {#components_used}

1.  FOG server running version 0.29
2.  ProCurve 5406zl switch running slightly outdated fw revision K.13.51
    with premium Edge licensing
3.  PC with BIOS setup with Wake-on-Lan

#### Setup

1.  FOG server on vlan 2 with IP address 10.0.1.13
2.  PC on vlan 5 with IP address lease from DHCP running on standalone
    DHCP server

### ProCurve CLI commands {#procurve_cli_commands}

`ip directed-broadcast`\
`ip udp-bcast-forward`\
`vlan 2`\
` ip address 10.0.1.2 255.255.255.0`\
` ip forward-protocol udp 10.0.16.255 9`\
`vlan 5`\
` ip address 10.0.16.2 255.255.255.0`
