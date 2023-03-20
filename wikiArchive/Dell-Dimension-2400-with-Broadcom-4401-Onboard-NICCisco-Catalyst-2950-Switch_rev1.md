Ethernet card takes too long to negotiate with Cisco switch and fails to
get DHCP Address. **Resolution**: Press *Pause/Break* on keyboard after
BIOS until port is negotiated on switch (port is green), hit ESC, and
DHCP will get address.

Another option might be to adjust your spanning tree protocol (STP)
settings to allow portfast for all non-uplink ports (ports that connect
to a leaf object, not another switch/router).
