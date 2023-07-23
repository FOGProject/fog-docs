---
title: Customizing FOG iPXE Settings
aliases:
    - Customizing FOG iPXE Settings
description: index page for ipxe
context_id: ipxe
tags:
    - in-progress
    - convert-Wiki2MD
---


# Customizing FOG iPXE Settings

## Custom Background

You can add a custom picture background.

Place the file in the following directory: `/var/www/fog/service/ipxe`

And use a resolution of 800x600.

## Prelude for adding IPXE boot entries

If you have a lot of files for customboot entries i highly reccomend you
put those files on a different webserver. This because CPU usage will be
very high due to PHP FPM.

## Adding a WindowsPE based image

First of all you need to need WIMBOOT. This is a tool that allows you to
boot WindowsPE over IPXE and load the files into ram. You can download
it here:
`https://github.com/ipxe/wimboot/releases/latest/download/wimboot`

place those files on a webserver in a standalone folder.

After that you can add you unpacked iso the the webserver.

Now you need to create a customboot entry.

    #adding webserver as variable
    set URL http://yourwebserver/
    #importing wimboot
    kernel ${URL}wimboot/wimboot
    #importing your startup proccess executable
    initrd ${URL}ISOfolder/Boot/BCD BCD
    #importing boot.sdi
    initrd ${URL}ISOfolder/Boot/boot.sdi boot.sdi
    #importing boot.wim
    initrd ${URL}ISOfolder/Boot/boot.wim boot.wim
    #tell IPXE to boot files loaded in ram
    boot
