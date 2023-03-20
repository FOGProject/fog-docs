A bad designed PXE stack in the SiS 900-based NIC causes FOG to hang on
the pxelinux-phase (before the menu appears). In order to get things
working without replacing the NIC [Etherboot](http://www.etherboot.org)
comes in handy. Etherboot is an open-source PXE stack, supporting quite
a range of NIC\'s. In order to load Etherboot you have basically three
options:

-   Boot from a floppy, to load the PXE stack (not ideal).
-   Chainloading Etherboot
-   Flashing Etherboot into the system BIOS

The first option basically explains itself, you\'ll find pre-compiled
images at the [Rom-o-Matic](http://www.rom-o-matic.net) website. Write
them to floppy using rawwrite or rawwritewin.

The second option basically loads Etherboot using the NIC\'s built-in
PXE stack (Loading PXE using PXE). When Etherboot is loaded, it will
attempt a PXE boot again and will load FOG. To avoid an endless loop,
some tricking with the DHCP configuration is need. You\'ll find an
[Howto](http://etherboot.org/wiki/pxechaining) on the Etherboot website.

The third option is a bit tricky, it involves tampering with the system
bios which could lead to a bricked mainboard! The PXE code needed to
boot from LAN is stored as part of the system bios (in case of onboard
NIC\'s). On some mainboards, you\'ll be able to replace the existing
(buggy) PXE code with Etherboot. Try it at your own risk, you\'ll find
an howto [here](http://etherboot.org/wiki/biosext).
