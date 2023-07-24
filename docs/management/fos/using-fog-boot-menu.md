---
title: Using the FOG Boot Menu
aliases:
    - Client Side Tasks
    - Using the FOG Boot Menu
description: Client Side Tasks triggered from the fog pxe boot menu usage, was called Client Side Tasks before
context_id: using-fog-boot-menu
tags:
    - in-progress
    - convert-Wiki2MD
    - management
    - fos
    - fos-management
    - boot-menu
    - ipxe
---


# Using the FOG Boot Menu

## Overview

-   FOG attempts to keep management centralized, but in an attempt to
    make deploying machines as easy as possible FOG has added a few
    basic client side tasks.

-   These tasks can be run from the client computer during the PXE boot
    process.

-   When the client boots and the FOG banner is displayed the pxe client
    will display a prompt like **boot:** or something similar.

-   At this point you have 3 seconds to start typing one of the
    following commands.

    > | Memtest86+
    > | Quick Registration and Inventory
    > | Perform Full Registration and Inventory

### Memtest86

> -   This command will run the memtest86+ on the client computer.
> -   fog.memtest is the command used to reference this action in pxe
>     menu settings.

### Quick Registration and Inventory

> -   This command will run the basic host registration and inventory
>     process without any user input.
>
> -   It will register any new/unregistered hosts with the FOG server
>     and pull a basic hardware inventory from them.
>
> -   
>
>     The hostname of the computer will be the same as the MAC address without the `:`
>
>     :   -   You can also customize this auto-naming in the fog
>             configuration
>
> -   If a host is already registered, then only an inventory will be
>     performed.
>
> -   fog.reg is the command used to reference this action in pxe menu
>     settings

### Perform Full Registration and Inventory

> -   This command will run the full host registration process with user
>     input, inventory and give the option to push down an image, all at
>     the same time. During this process the user registering the host
>     will be prompted for the computer host name, ip address, operating
>     system ID, image ID, Primary User of the computer, asset tag 1,
>     and asset tag 2.
> -   If a valid hostname, os id, and image id are given and the option
>     is selected to image the workstation after registration, the host
>     will reboot and an imaging send will began.
> -   If a host is already registered, then only an inventory will be
>     performed, this prevents end-users from re-registering a machine
>     with a different hostname, etc.
> -   This tasks was designed for institutions that may get shipments of
>     hundreds of computers that need to be deployed very quickly. They
>     can be unboxed, inventoried, imported into FOG and imaged very
>     quickly.
> -   fog.reginput is the command used to reference this action in pxe
>     menu settings

#### Image ID

> -   As of version 0.17, you can enter ''?'' at the Image ID prompt
>     to get a listing of all your images and their ID numbers.
>
> -   The image ID you specify will be deployed to the computer after a
>     reboot if you choose to `image now` at the end of the registartion
>     form.
>
> -   Image IDs can be found in the management console, in the
>     [[management/web/images| Image Management]] section.
>
> -   
>
>     The image id is listed after the `-` suffixed to the image name you set
>
>     :   -   
>
>             Alternatively Search for the image, and click on the edit button associated with the image,
>
>             :   -   The image id will be in the Address/url bar in the
>                     format of `&imageid=xx`.
