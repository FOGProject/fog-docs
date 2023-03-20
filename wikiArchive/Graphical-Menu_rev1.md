**This is a quick guide to replacing the default boot prompt with a
graphical menu.**

*As of FOG 0.20 the included pxelinux.0 version is 3.71*

The prep work:

    Create your backups first:
    cd /tftpboot/
    cp -p pxelinux.0 pxelinux.0.bak
    cd /tftpboot/pxelinux.cfg/
    cp -p default default.bak

    Grab a more recent version of syslinux:

    wget http://www.kernel.org/pub/linux/utils/boot/syslinux/syslinux-3.82.tar.gz
    tar -zxvf syslinux-3.82.tar.gz
    cd syslinux-3.82
    cp com32/menu/vesamenu.c32 /tftpboot/fog/
    cp core/pxelinux.0 /tftpboot/

    Edit a new file called default, make the menu and save it.
    cp default /tftpboot/pxelinux.cfg/

Original /tftpboot/pxelinux.cfg/default

    DISPLAY boot.txt

    DEFAULT fog.local

    LABEL fog.local
        localboot 0

    LABEL fog.memtest
        kernel fog/memtest/memtest

    LABEL fog.reg
        kernel fog/kernel/bzImage
        append initrd=fog/images/init.gz  root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=1.1.1.38 mode=autoreg web=1.1.1.100/fog/ quiet

    LABEL fog.reginput
        kernel fog/kernel/bzImage
        append initrd=fog/images/init.gz  root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=1.1.1.38 mode=manreg web=1.1.1.100/fog/ quiet

    LABEL fog.debug
        kernel fog/kernel/bzImage
        append initrd=fog/images/init.gz  root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=1.1.1.38 mode=onlydebug

    PROMPT 1
    TIMEOUT 30

Graphical menu


    DEFAULT fog/vesamenu.c32
    MENU TITLE FOG Imaging Solution

    LABEL fog.local
        localboot 0
        MENU DEFAULT
        MENU LABEL Boot from the local drive
        TEXT HELP
        Boot from the local hard drive.
        ENDTEXT

    LABEL fog.memtest
        kernel fog/memtest/memtest
        MENU LABEL Run Memtest86+
        TEXT HELP
        Run Memtest86+ on the client computer.
        ENDTEXT
        
    LABEL fog.reg
        kernel fog/kernel/bzImage
        append initrd=fog/images/init.gz  root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=1.1.1.38 mode=autoreg web=1.1.1.100/fog/ quiet
        MENU LABEL Auto register computer
        TEXT HELP
        Automatically register the client computer,
        and perform a hardware inventory.
        ENDTEXT

    LABEL fog.reginput
        kernel fog/kernel/bzImage
        append initrd=fog/images/init.gz  root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=1.1.1.38 mode=manreg web=1.1.1.100/fog/ quiet
        MENU LABEL Manually register computer
        TEXT HELP
        Manually input info and register the client computer.
        ENDTEXT

    LABEL fog.debug
        kernel fog/kernel/bzImage
        append initrd=fog/images/init.gz  root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=1.1.1.38 mode=onlydebug
        MENU LABEL Debug mode with shell
        TEXT HELP
        Debug mode will load the boot image and load a prompt so
        you can run any commands you wish.
        ENDTEXT

    PROMPT 0
    # timeout is in 1/10 of seconds
    TIMEOUT 300

Tips: Always make a backup and test your work. If you get a completely
blank screen make sure you have a pxelinux.0 and vesamenu.c32 from the
same distribution of syslinux.

Links: <http://syslinux.zytor.com/wiki/index.php/Menu>
