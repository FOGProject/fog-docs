Yes! You are able to edit and modify the PXE server menu to run other
programs. Some of the programs that have been tested and found to be
working include the following.

##### Tested and supported programs {#tested_and_supported_programs}

Gparted - [1](http://gparted.sourceforge.net/livepxe.php)

Dell Diagnostics Software -
[2](http://www.youtube.com/watch?v=pDu9e_cnTU8&fmt=18) , works with
version CW1337A0, see link -
[3](http://support.dell.com/support/downloads/download.aspx?c=us&cs=555&l=en&s=biz&releaseid=R188840&SystemID=PREC_M2300&servicetag=&os=WLH&osl=en&deviceid=3841&devlib=0&typecnt=0&vercnt=4&catid=-1&impid=-1&formatcnt=2&libid=13&fileid=258592)

Netbootdisk - [4](http://netbootdisk.com/pxeboot.htm) \*\*When Booting a
NetBootDisk floppy disk image from PXE, you need to add the kernel raw
option, otherwise the process will hang when XP DOS is
\"Starting\...\"\*\*

Other software can also be launched via the PXE preboot menu, if you
happen to have a simple program that will run in DOS, more than likely
it will work with this PXE server.

##### Pre Setup {#pre_setup}

Before adding new menu options to your PXE server please verify the
following:

-   You have a valid FTP client installed and working.
-   You are able to TFTP into your FOG server with the root username and
    password.
-   You have downloaded the Syslinux
    [5](http://www.kernel.org/pub/linux/utils/boot/syslinux/) package.
    You will need the memdisk file for all additional software
    configurations.
-   In this example I did NOT set a password to use the application. You
    can adjust this to your liking

##### Modifying the PXE Server to include a new application {#modifying_the_pxe_server_to_include_a_new_application}

In this example I will be adding an additional option on the PXE server
to boot a network boot disk. Before you add a additional line in the
boot menu, you must first have a working floppy version of the disk, for
examples and a how-to video on this please see the following link (link
removed pending acceptace)

Once you have the floppy disk working properly you will need to create
an .img of the file. In this example I named the .img of my disk
boot.img (you can name it what ever you want, as long as you keep
everything case sensative)

1.  Connect to your FTP server and navigate to the root directory
2.  Navigate to your tftpboot folder
3.  You will need to modify the default file in notepad. This file is
    located in the pxelinux.cfg folder. In this example I will add the
    networkbootdisk image to the pxe server.
4.  Scroll to the end of the document and copy / modify the text to
    include the new program

```{=html}
</ul>
```
`LABEL Network Boot Disk`\
\
`kernel fog/netbootdisk/memdisk raw`\
`append initrd=fog/netbootdisk/boot.img`\
`MENU LABEL Network Boot Disk`\
`TEXT HELP`\
`Netbootdisk`\
`ENDTEXT`

-   In this example you can see I labeled the program **Network Boot
    Disk**.
-   The path of the .img file is located at
    **fog/netbootdisk/boot.img**.
-   Menu Label is what **shows up in the PXE menu**.
-   The line below TEXT HELP gives the **description of the application
    you can run**.

Now that you have modified the default file you need to save it and push
the modified file back to the server (in vmware simply replace the
existing file with your ftp program)

##### Adding the program image into the FOG folder {#adding_the_program_image_into_the_fog_folder}

1.  Navigate to your /tftpboot/fog folder and create a new subfolder and
    name it after your program (netbootdisk / dell / etc.)
2.  Place the memdisk file and your .img file in this location. Make
    sure that the path and file names corrispond with the modifications
    you made to your default file in the pxelinux.cfg folder
3.  Once you have placed both files in the correct locations disconnect
    from your FTP and try the PXE server out

```{=html}
</ul>
```
##### Video Example {#video_example}

Below is a video example of a modified pxe boot menu to include
netbootdisk

<http://www.youtube.com/watch?v=jjDtJtuwIps>

\--[Ssx4life](User:Ssx4life "wikilink") 16:52, 10 September 2009 (MST)

[category:pxe](category:pxe "wikilink")
[category:customization](category:customization "wikilink")

##### Adding ZENWorks Manual Mode Imaging to the FOG Menu {#adding_zenworks_manual_mode_imaging_to_the_fog_menu}

-   Create folder /tftpboot/zenworks on your FOG server.
-   Copy the tftp files from your zenworks server to /tftpboot/zenworks.
    (Found in SYS:/tftp)
-   Edit /tftpboot/pxelinux.cfg/default to add:

`LABEL zen`\
`   MENU PASSWD 1234`\
`   KERNEL zenworks/boot/linux`\
`   APPEND initrd=zenworks/boot/initrd vga=0x314 install=`[`tftp://192.168.0.X/zenworks/boot`](tftp://192.168.0.X/zenworks/boot)` PROXYADDR=192.168.0.Y rootimage=/root TFTPIP=192.168.0.X splash=silent PXEBOOT=YES mode=5 pci=nomsi`\
`   MENU LABEL Zenworks Manual Imaging`\
`   TEXT HELP`\
`   Runs Zenworks Manual imaging`\
`   ENDTEXT`\
`\n`

**192.168.0.X is the IP of the FOG server, 192.168.0.Y is the IP of the
Zenworks server**

```{=html}
<hr>
```
### Other References to Editing Boot Menu {#other_references_to_editing_boot_menu}

[Advanced_Boot_Menu_Configuration_options](Advanced_Boot_Menu_Configuration_options "wikilink")
