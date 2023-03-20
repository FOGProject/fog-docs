## Overview

Installing FOG on Ubuntu 11.04 follows the same steps as [installing FOG
on 10.04 LTS](Ubuntu_10.04 "wikilink") with these exceptions.

## Known (FOG) version issues {#known_fog_version_issues}

### FOG 0.31 {#fog_0.31}

#### dhcp3-server to isc-dhcp-server {#dhcp3_server_to_isc_dhcp_server}

With Ubuntu 11.04, the standard dhcp package was changed to
isc-dhcp-server. FOG 0.31 only looks for isc-dhcp-server (this was fixed
in .32), therefore to use FOG version .31 with Ubuntu 11.04 you will
need to edit the following files:

    /opt/fog_0.31/lib/ubuntu/config.sh

  ------ ---------------------- -----------------------
  Line   Original               Change
  24     isc-dhcp-server        dhcp3-server
  27     isc-dhcp-server        dhcp3-server
  46     /etc/dhcp/dhcpd.conf   /etc/dhcp3/dhcpd.conf
  ------ ---------------------- -----------------------

    /opt/fog_0.31/lib/ubuntu/function.sh

  ------ ----------------- --------------
  Line   Original          Change
  353    isc-dhcp-server   dhcp3-server
  354    isc-dhcp-server   dhcp3-server
  355    isc-dhcp-server   dhcp3-server
  ------ ----------------- --------------
