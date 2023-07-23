---
title: Advanced Boot Menu Configuration Options
aliases:
    - Advanced Boot Menu Configuration Options
    - Advanced Configuration Options
description: Describes how to manually create custom boot configurations at the php level
tags:
    - in-progress
    - convert-Wiki2MD
    - customization
    - boot-menu
    - php
    
---

# Advanced Configuration Options 


> [!NOTE]
> The things in this article apply to FOG 1.2.0 and below. FOG 1.3.0
uses a web-based interface that easily alters the boot menu. Many of the
things in this article still apply, but the process has been greatly
simplified.


The Advanced configuration options in the FOG PXE Boot Menu
Configuration screen allows you to create a secondary menu that can be
accessed from the boot menu screen

## View All Boot Menu code

Where x.x.x.x is the FOG server\'s IP address, put this into a
browser\'s address bar:

    x.x.x.x/fog/service/ipxe/boot.php

This is the start of the ipxe advanced.php file.

## Contents of php file

    <?php
    header("Content-type: text/plain");
    require_once('../../commons/base.inc.php');
    if ($_REQUEST['login'] == 1)
    {
        print "#!ipxe\n";
        print "login\n";
        print "params\n";
        print "param username \${username}\n";
        print "param password \${password}\n";
        print "chain \${boot-url}/service/ipxe/advanced.php##params\n";
        unset($_REQUEST['login']);
    }
    if ($_REQUEST['username'])
    {
        if ($FOGCore->attemptLogin($_REQUEST['username'],$_REQUEST['password']))
        {   
            print "#!ipxe\n";
            print "set userID \${username}\n";
            print "chain \${boot-url}/service/ipxe/advanced.php\n";
        }   
        else
        {   
            print "#!ipxe\n";
            print "clear \${username}\n";
            print "clear \${password}\n";
            unset($_REQUEST['username'],$_REQUEST['password']);
            print "echo Invalid login!\n";
            print "sleep 3\n";
            print "chain -ar \${boot-url}/service/ipxe/advanced.php\n";
        }   
    }
    print "#!ipxe\n";
    print "set fog-ip ".$FOGCore->getSetting('FOG_WEB_HOST')."\n";
    print "set fog-webroot ".basename($FOGCore->getSetting('FOG_WEB_ROOT'))."\n";
    print "set boot-url http://\${fog-ip}/\${fog-webroot}\n";
    print $FOGCore->getSetting('FOG_PXE_ADVANCED');                                            

note: The variables fog-ip and fog-webroot have been created
automatically for you, and assigned values relevant to your
installation.

# Examples Basic Menu

    :MENU
    menu
    item --gap -- ---------------- iPXE boot menu ----------------
    item ipxedemo        ipxe online boot demo
    item shell          ipxe shell
    item return        return to previous menu
    choose --default return --timeout 5000 target && goto ${target}
     
    :ipxedemo
    chain http://boot.ipxe.org/demo/boot.php ||
    goto MENU
     
    :shell
    shell ||
    goto MENU
     
    :return
    chain  http://${fog-ip}/${fog-webroot}/service/ipxe/boot.php?mac=${net0/mac} ||
    prompt
    goto MENU
     
    autoboot

    :MENU
    menu
    item --gap -- ---------------- iPXE boot menu ----------------
    item WIN7PE64BIT    Boot Windows 7 64 bit iso
    item WIN7PE32BIT    Boot Windows 7 32 bit iso
    item shell          ipxe shell
    item return        return to previous menu
    choose --default WIN7PE64BIT --timeout 5000 target && goto ${target}
     
    :WIN7PE64BIT
    initrd http://${fog-ip}/ISO/Win7PE_x64.ISO
    chain memdisk iso raw ||
    goto MENU
     
    :WIN7PE32BIT
    initrd http://${fog-ip}/ISO/Win7PE_x86.ISO
    chain memdisk iso raw ||
    goto MENU
     
    :ipxedemo
    chain http://boot.ipxe.org/demo/boot.php ||
    goto MENU
     
    :shell
    shell ||
    goto MENU
     
    :return
    chain  http://${fog-ip}/${fog-webroot}/service/ipxe/boot.php?mac=${net0/mac} ||
    prompt
    goto MENU
     
    autoboot

    :MENU
    menu
    item --gap -- ---------------- iPXE boot menu ----------------
    item ipxedemo        ipxe online boot demo
    item shell          ipxe shell
    item return        return to previous menu
    item hostinfo        details about this computer
    choose --default return --timeout 5000 target && goto ${target}
     
    :ipxedemo
    chain http://boot.ipxe.org/demo/boot.php ||
    goto MENU
     
    :shell
    shell ||
    goto MENU
     
    :return
    chain  http://${fog-ip}/${fog-webroot}/service/ipxe/boot.php?mac=${net0/mac} ||
    prompt
    goto MENU
     
    :hostinfo
    echo This computer : ||
    echo MAC address....${net0/mac} ||
    echo IP address.....${ip} ||
    echo Netmask........${netmask} ||
    echo Serial.........${serial} ||
    echo Asset number...${asset} ||
    echo Manufacturer...${manufacturer} ||
    echo Product........${product} ||
    echo BIOS platform..${platform} ||
    echo ||
    echo press any key to return to Menu ||
    prompt
    goto MENU
     
    autoboot

# Example secured menu advanced option

    isset ${userID} && goto do_me || goto MENU
    :do_me
    kernel bzImage root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=8.8.8.8 web=${fog-ip}/fog/ consoleblank=0 loglevel=4 type=down img=win7actsysprep ftp=${fog-ip} imgType=n osid=7 storage=${fog-ip}:/images capone=1 imgFormat=0
    imgfetch init.xz && boot || goto MENU
    :MENU
    menu
    item --gap Please Select one of the images below
    item fog.local Boot from hard disk
    item d101_64 D101 Base Image (64 bit load)
    item return Return to main menu
    choose --default fog.local target && goto ${target}
    :fog.local
    sanboot --no-describe --drive 0x80 || goto MENU
    :d101_64
    chain -ar ${boot-url}/service/ipxe/advanced.php?login=1 || goto MENU
    :return
    chain http://${fog-ip}/${fog-webroot}/service/ipxe/boot.php?mac=${net0/mac} || goto MENU
    autoboot

Notice the :d101_64 how it has the chain -ar
\${boot-url}/service/ipxe/advanced.php?login=1 \|\| goto MENU ?That\'s
all that\'s needed to have a \"login\" for your menu item. Notice the
top where it says :do_me? This is important to note that it\'s ABOVE the
menu generation part of the advanced menu setup.

additional information about ipxe boot menu creation can be found at
<http://ipxe.org/>

```{=html}
<hr>
```
