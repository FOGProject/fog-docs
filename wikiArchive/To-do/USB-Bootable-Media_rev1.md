# USB Boot UEFI client into FOG menu (harder way) {#usb_boot_uefi_client_into_fog_menu_harder_way}

You may ask why do we need this?

UEFI PXE booting is a bit different than BIOS based PXE booting. Some of
the early UEFI systems like the Dell Latitude e6420 and the OptiPlex 790
do not support PXE booting in UEFI mode. But through testing they do
support USB booting in PXE mode. So knowing this Im going to create the
harder solution (see easier solution if this method is too complicated
for your needs) to PXE boot these devices in UEFI mode. This method we
will create a new efi boot kernel to install on our usb flash drive to
boot into the FOG environment. Building linux kernels are not extremely
difficult using the rom-o-matic, but because of the number of options
you can choose, you can run into problems if not created correctly. I
can say for sure this method works with the previous mentioned systems.
YMMV with other hardware platforms.

The process steps are not that hard, its a bit like giving your self a
root canal without medicine. It will hurt like crazy while you are doing
it, but once its over you will have the satisfaction of not wanting to
ever do it again `<jk>`{=html}. Its not really that hard, the
rom-o-matic does all of the work.

You will need to acquire these things.

-   A 2GB (min) flash drive
-   A UEFI pxe boot image we will create from the rom-o-matic web site

**iPXE UEFI boot kernel creation process**

1.  From a browser access the rom-o-matic web site at
    <https://rom-o-matic.eu/>
2.  Select **Advanced, for experienced users** radio button
3.  In the drop down list for the output format select **EFI PXE
    bootstrap 64-bit (.efi)** selection.
4.  Ensure that NIC type is set to **all-drivers (default)**
    `<font color="red">`{=html}Since there are a ton of settings that
    could be changed here, I\'m only going to post the changes from the
    default settings for the PXE boot. HINT: You may want to search in
    your browser for the variable names I used below to locate the exact
    setting in question.`</font>`{=html}
5.  Section: **Download protocols.** DOWNLOAD_PROTO_HTTPS = checked
    DOWNLOAD_PROTO_FTP = checked DOWNLOAD_PROTO_NFS = checked
6.  Section: **SAN boot protocols** All checked in this section except
    HTTP_ENC_PEERDIST = unchecked
7.  Section: **Image types** All unchecked except IMAGE_PNG = checked
8.  Section: **Command-line commands to include** All checked except
    IWMGMT_CMD = unchecked, PXE_CMD = unchecked, PROFSTAT_CMD, =
    unchecked
9.  Section: **Console options** All unchecked except
    CONSOLE_FRAMEBUFFER = checked
10. Section: **Embedded script add in the following script**
        #!ipxe

        dhcp
        set next-server 192.168.1.88
        set filename ipxe.efi
        chain tftp://${next-server}/${filename}

    `<font color="red">`{=html}Be sure to change the ip address above
    for next-server to the IP address of your FOG server. You must use
    an IP address and not the conical name of your fog
    server.`</font>`{=html}
11. Section: **Which revision** should be set to **Master (default)**
12. Press the **Proceed \>\>** button. After a bit you will be prompted
    to download a file called **ipxe.efi** be sure to save it. We will
    need this file in the section below.

**Boot drive creation process**

1.  Insert your flash drive into a Windows based computer and format it
    with FAT32 disk format
2.  On that flash drive create a folder called **EFI**
3.  On that same flash drive create a folder called **BOOT** in the
    **EFI** folder creating this path \"**x:\\EFI\\BOOT**\".
    `<font color="red">`{=html}Note: I have not tested if case is
    important or not, I used upper case for everything and it worked.
    That is as far as I tested.`</font>`{=html}
4.  Copy the ipxe.efi kernel created in the previous section to the
    flash drive in the EFI\\BOOT folder. That file **MUST BE RENAMED to
    bootx64.efi** (note the case difference. I did not test to see if
    case is important)
5.  At this point remove the usb thumb drive from the build up computer
    and insert the drive into a target computer
6.  Power on the target computer and press **F10** or **F12** (depending
    on the mfg) to call up the EFI boot menu.
7.  Select the USB boot device under the EFI section of the EFI menu
8.  You should see the iPXE boot banner and then after about 30 seconds
    it should be prompted for the IP address of your FOG server. Key in
    the **IP ADDRESS** of your **FOG server** and press **Enter**.
9.  At this point you should boot into the FOG iPXE menu.

## Reference

[USB Boot UEFI client into FOG menu (harder
way)](https://forums.fogproject.org/topic/6400/usb-boot-uefi-client-into-fog-menu-harder-way)

# USB Boot UEFI client into FOG menu (easy way) {#usb_boot_uefi_client_into_fog_menu_easy_way}

You may ask why do we need this?

UEFI PXE booting is a bit different than BIOS based PXE booting. Some of
the early UEFI systems like the Dell Latitude e6420 and the OptiPlex 790
do not support PXE booting in UEFI mode. But through testing they do
support USB booting in PXE mode. So knowing this Im going to set out a
simple solution to PXE boot these devices in UEFI mode. I can say for
sure this method works with the previous mentioned systems. YMMV with
other hardware platforms.

The process steps are not hard at all (actually even easier than USB
BIOS PXE booting). You will need to acquire these things.

-   A 2GB (min) flash drive
-   A UEFI pxe boot image from a functioning FOG server.

**Boot image creation process**

1.  Insert your flash drive into a Windows based computer and format it
    with FAT32 disk format
2.  On that flash drive create a folder called EFI
3.  On that same flash drive create a folder called BOOT in the EFI
    folder creating this path \"x:\\EFI\\BOOT\".
    `<font color="red">`{=html}Note: I have not tested if case is
    important or not, I used upper case for everything and it worked.
    That is as far as I tested.`</font>`{=html}
4.  From a functioning FOG server copy /tftpboot/ipxe.efi to your
    windows computers. (pscp from putty tools works great)
5.  Copy that file to the flash drive in the EFI\\BOOT folder. That file
    MUST BE RENAMED to bootx64.efi (note the case difference. I did not
    test to see if case is important)
6.  At this point remove the usb thumb drive from the build up computer
    and insert the drive into a target computer
7.  Power on the target computer and press F10 or F12 (depending on the
    mfg) to call up the EFI boot menu.
8.  Select the USB boot device under the EFI section of the EFI menu
9.  You should see the iPXE boot banner and then after about 30 seconds
    it should be prompted for the IP address of your FOG server. Key in
    the IP ADDRESS of your FOG server and press Enter.
10. At this point you should boot into the FOG iPXE menu.

## Reference {#reference_1}

[USB Boot UEFI client into FOG menu (easy
way)](https://forums.fogproject.org/topic/6350/usb-boot-uefi-client-into-fog-menu-easy-way)

# Older instructions {#older_instructions}

`<font color="red">`{=html}The below instructions have not been updated
since 6 October 2009. I\'ve tried to follow them, and made some progress
using resources that were the latest available in October
2009.`</font>`{=html}

------------------------------------------------------------------------

Sometimes a computer may not support PXE booting, or there other
limitations which prevent this. This is a quick guide to get you
started, more information can be found in depth at the sites of the
projects. The drawbacks of this method is when you upgrade FOG you must
also upgrade the files on the media.

**Bootable USB Stick**

This method involves making the usb stick bootable using some
capabilities of the Syslinux project
<http://syslinux.zytor.com/wiki/index.php/SYSLINUX>

Prep the stick: Your usb stick usually is formatted as FAT/FAT32. Grab a
version of syslinux from
<http://www.kernel.org/pub/linux/utils/boot/syslinux/> Extract the
files. Under Windows change to the syslinux-x.xx\\win32 and run syslinux
-ma `<drive>`{=html}: Example: *syslinux -ma E:* where E is the drive of
to the usb stick. For Linux change to syslinux-x.xx/unix (3.7x is
syslinux-x.xx/linux) and run ./syslinux -ma /dev/`<device>`{=html}
Example: *./syslinux -ma /dev/da0* where da0 is the device the usb
stick. You may have to mount the stick first.

Copy or download the fog folder from /tftpboot/ to the root of the usb
stick. Then copy the /tftpboot/pxelinux.cfg/default file to the root of
the usb stick and rename it to syslinux.cfg. This should be it, your
drive should contain the following: \\fog\\ syslinux.cfg

If you need to image a computer and you feel the need to boot the task
from the USB stick, it is possible to do this. Given the same above
instructions the only difference is you copy the 01-00-01-a2-c3-d4-e5
from /tftpboot/pxelinux.cfg/ to the usb stick and rename it to
syslinux.cfg. `<font color="red">`{=html}You should use caution when
using this method because depending on your computer, bios, and random
other mysterious factors you may image the usb stick, or corrupt the
data if you pull your stick out at the wrong time in a
panic.`</font>`{=html}

**Isolinux**

Isolinux is part of the Syslinux project and allows you to make a
bootable CD with FOG on it.
<http://syslinux.zytor.com/wiki/index.php/ISOLINUX> The drawback of this
method is you have to toss a disk when you upgrade FOG unless you are
using RW media.

*More info on this coming soon to a wiki near you.*

**GPXE**

GPXE is part of the Etherboot Project, and can be used to mimic the PXE
process, among other things, when the computer or network doesn\'t
support it. <http://etherboot.org/wiki/index.php> This method will usa a
CD to assist in the netboot process.. There are 2 options here: 1.
Download the source, build it yourself, and generate a gpxe.iso.
<http://etherboot.org/wiki/download> 2. Download pre-built binaries
ROMS/ISOs for your network card <http://rom-o-matic.net/>

In the absence of a properly configured DHCP server to do the
configuration pointing and PXE information you can also manually set the
important info using some commands during the gpxe process. When
prompted hit Control+B and you will get a command prompt. Help is
available using the help command.

Tell pxe which file to look for on the tftp server. Show it which server
is the tftp server.

    gpxe> set filename pxelinux.0
    gpxe> set next-server 1.1.1.100
    gpxe> autoboot

[ Making sense of the above commands.](Linux_DHCP_Server "wikilink")

[category:linux](category:linux "wikilink")
[category:customization](category:customization "wikilink")
