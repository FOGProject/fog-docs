This method (a summary) has been successfully used to get high rates of
successful deployment on varying hardware without using \'sysprep\'.

1\. Start with nLite [1](http://www.nliteos.com) to optimize the XP
media, and the BTS DriverPacks [2](http://www.driverpacks.net) to
pre-integrate most common CPU/Mass Storage/Chipset/Video/LAN/WLAN/Audio
drivers into the updated XP media. You will need to use nLite to remove
unnecessary programs like Pinball, MSN, to make space for the
DriverPacks on the 700MB available on a CD disc. You can avoid reduction
if you plan to install from ISO only or DVD.

2\. Install XP with the customized media into VM (Using your favorite VM
software like VMware Server, Xen or VirtualBox) and customize the final
image to suit.

3\. The CRITICAL STEP: While in the VM XP/2000 go to the \'Device
Manager -\> IDE ATA/ATAPI Controllers\' section and update the
proprietary busmaster IDE or SATA controller driver - select \'Install
from specific location -\> Don\'t Search \...\' -\> select \'Standard
Dual Channel PCI IDE Controller\' -\> Next to install it. (The same
thing applies to extracting the image from a real hardware PC). This is
what prevents the 0x0000007b error related at boot up.

4\. Put a copy of \'Newsid\' from Microsoft/Sysinternals on the VM. You
will need this to rename the computer and change the SID easily after
booting it up on the target PC. This step is not important for
non-networked environments but important for non-domain workgroups. See
[3](http://technet.microsoft.com/en-us/sysinternals/bb897418.aspx)

5\. Then make the image with your preferred tool (FOG, Selfimage, etc)
right from the VM.

6\. When you restore to the target computer it may take between 3-10
minutes before you get keyboard and mouse control. When it does login as
the administrator and if prompted for certain basic drivers just let it
look for them automatically. Hint: With the LAN drivers integrated and
VNC server installed in the image you can remote the target computer
after it gets a DHCP address to finish up the installation remotely.

It takes some work to understand how to use the tools but the effort can
be worth it. Occasionally you will run into mis-detected hardware and
have to get drivers for it or a BSOD caused by errant audio drivers or
new PCs with a BIOS that does not allow the selection of
Legacy/Normal/IDE mode for the SATA interfaces and default to AHCI or
RAID mode. See [SATA Support](SATA_Support "wikilink"). If you have
older hardware that does not have a fully ACPI compliant BIOS you may
need to change the HAL (kernel) in the image to the ACPI PIC type so
that it boots properly. See [4](http://support.microsoft.com/kb/309283)

Of course, like any other set of technology tools, your experience may
vary.
