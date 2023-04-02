# DHCP Server Settings

If you do not use FOG to provide DHCP services in your network (which is a very common and completely supported configuration), then you must change the existing DHCP server to allow clients to boot from the network and use fog

These two DHCP options must be set:

## Option 66

Set Option 66, also called 'Boot Server', 'Next server' or 'TFTP Server' to the IP address or hostname of the FOG server.

## Option 67

Set option 67, also called 'Bootfile Name' to the ipxe boot file that works best in your environment.
For modern UEFI environments, either of these files have the best compatibility (you simply enter this file name into the dhcp setting)

* snponly.efi
* ipxe.efi

Most newer clients will be able to boot with ipxe.efi, but older hardware models that do not have EUFI but legacy BIOS firmware will not boot. If you have a mixed environment see [[BIOS-and-UEFI-Co-Existence]]

For older legacy models, these are the boot files to set

* undionly.kpxe
* undionly.kkpxe
* ipxe.kpxe
* ipxe.kkpxe
