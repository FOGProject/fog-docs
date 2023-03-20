This article helps you modify \"/tftpboot/pxelinux.cfg/default\" file to
easily create sub menus and going back to main menu. Notice that you can
change sub-menu title and background (and others) by including those
parameters inside it. Of course, you can create sub-sub menus.

    DEFAULT vesamenu.c32
    MENU TITLE FOG Computer Cloning Solution
    MENU BACKGROUND fog/bg.png
    MENU MASTER PASSWD $1$0123456789
    \n
    menu color title 1;36;44 #ffffffff #00000000 std
    \n
    LABEL fog.local
    localboot 0
    MENU DEFAULT
    MENU LABEL Boot from hard disk
    TEXT HELP
    Boot from the local hard drive.
    If you are unsure, select this option.
    ENDTEXT
    \n
    LABEL fog.memtest
    kernel fog/memtest/memtest
    MENU LABEL Run Memtest86+
    TEXT HELP
    Run Memtest86+ on the client computer.
    ENDTEXT
    \n
    LABEL fog.reg
    kernel fog/kernel/bzImage
    append initrd=fog/images/init.gz root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=*.*.*.* mode=autoreg web=*.*.*.*/fog/ loglevel=4
    MENU LABEL Quick Host Registration and Inventory
    TEXT HELP
    Automatically register the client computer,
    and perform a hardware inventory.
    ENDTEXT
    \n
    LABEL fog.reginput
    kernel fog/kernel/bzImage
    append initrd=fog/images/init.gz root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=*.*.*.* mode=manreg web=*.*.*.*/fog/ loglevel=4
    MENU LABEL Perform Full Host Registration and Inventory
    TEXT HELP
    Perform a full host registration on the client
    computer, perform a hardware inventory, and
    optionally image the host.
    ENDTEXT
    \n
    LABEL fog.quickimage
    MENU PASSWD $1$0123456789
    kernel fog/kernel/bzImage
    append initrd=fog/images/init.gz root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=*.*.*.* mode=quickimage keymap= web=*.*.*.*/fog/ loglevel=4
    MENU LABEL Quick Image
    TEXT HELP
    This mode will allow you to image this host quickly with
    it's default assigned image.
    ENDTEXT
    \n
    LABEL fog.sysinfo
    kernel fog/kernel/bzImage
    append initrd=fog/images/init.gz root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=*.*.*.* mode=sysinfo loglevel=4
    MENU LABEL Client System Information
    TEXT HELP
    View basic client information such as MAC address
    and FOG compatibility.
    ENDTEXT

    LABEL fog.debug
    MENU PASSWD $1$0123456789
    kernel fog/kernel/bzImage
    append initrd=fog/images/init.gz root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=*.*.*.* mode=onlydebug
    MENU LABEL Debug Mode
    TEXT HELP
    Debug mode will load the boot image and load a prompt so
    you can run any commands you wish.
    ENDTEXT



    #The modified lines

    MENU BEGIN Rescue tools
    MENU LABEL Rescue tools
    MENU TITLE FOG Computer Cloning Solution

    LABEL Back
    MENU EXIT
    MENU LABEL Back

    LABEL Hirens
    kernel fog/hirens/memdisk
    append iso initrd=fog/dell/MyHirensBootCD.iso raw
    MENU LABEL Hiren's Boot CD
    TEXT HELP
    Run Hiren's Boot CD
    ENDTEXT

    LABEL Dell Diagnostics
    kernel fog/dell/memdisk
    append iso initrd=fog/dell/delldiags.iso raw
    MENU LABEL Dell Diagnostics
    TEXT HELP
    Dell(TM) Diagnostic software
    ENDTEXT

    MENU END

    \n
    PROMPT 0
    TIMEOUT 300\n

See
[Comboot/menu.c32](http://www.syslinux.org/wiki/index.php/Comboot/menu.c32)
for more info.
