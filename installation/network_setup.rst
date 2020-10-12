.. _other_dhcp_server_than_fog:

Other DHCP Server than FOG
^^^^^^^^^^^^^^^^^^^^^^^^^^

If you do not use FOG to provide DHCP services in your network, then you must change the existing DHCP server to allow clients to boot from the network.

These two DHCP options must be set:

**Option 66**

Set Option 66, also called 'Boot Server', 'Next server' or 'TFTP Server' to the IP address of the FOG server.

**Option 67**

Set option 67, also called 'Bootfile Name' to ipxe.efi

Most newer clients will be able to boot with ipxe.efi, but older hardware models that do not have EUFI but legacy BIOS firmware will not boot.

For older models, try undionly.kpxe.
