`<font color="red">`{=html}Note:`</font>`{=html} This article is older
(year 2012), and has only had it\'s terminology updated to reflect
current FOG terminology.

## Build a Custom Kernel with Asix USB NIC Drivers {#build_a_custom_kernel_with_asix_usb_nic_drivers}

Start by following the instructions for [Build FOG Core
Kernel](Build_FOG_Core_Kernel "wikilink").

This entry was written based on creating a 3.1.5 kernel using Ubuntu
11.10 as the compiling system. The kernel generated from these
instructions is being used on FOG 0.29 and has successfully imaged 40
Iconia w500 Tablets.

### Download Asix 88772B USB NIC Drivers Source Code {#download_asix_88772b_usb_nic_drivers_source_code}

Before completing the \"make xconfig\" step, download the Asix drivers,
extract them, and copy them into the kernel source tree.

`wget `[`http://www.asix.com.tw/FrootAttach/driver/AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source.tar.bz2`](http://www.asix.com.tw/FrootAttach/driver/AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source.tar.bz2)\
\
`tar -xzvf AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source.tar.bz2`\
\
`cp AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source/a* (kernel-source-tree-root)/drivers/net/usb/`

(NOTE1: you only need to copy the files starting with the letter \"a\"
from the driver source folder\... the Makefile and Readme are not
needed. Thus the a\*\...)

(NOTE2: Based on the [Build FOG Core
Kernel](Build_FOG_Core_Kernel "wikilink") page,
(kernel-source-tree-root) is located in \~/Desktop/linux-3.1.5)

### make xconfig and modify it for w500 {#make_xconfig_and_modify_it_for_w500}

`make xconfig`

`Select the Device Drivers - Network Device Support - USB Network Adapters - Multipurpose USB Networking Framework - Asix AX88xxx USB 2.0 Ethernet Adapters`

`Deselected the Device Drivers - Graphics Support - AGPGART (AGP Support)`

`Selected Device Drivers - Graphics Support - Direct Rendering Manage (XFree86 4.1.0 and Higher DRI Support) - ATI Radeon.`

`Deselected the option under ATI Radeon for: Enable modesetting on radeon by default - NEW DRIVER.`

`Save and exit`

`Continue instructions on `[`Build FOG Core Kernel`](Build_FOG_Core_Kernel "wikilink")` by issuing the make command and copying your kernel to FOG's tftpboot location listed on that page.`

### Create tftpd-map and alter configuration if using a separate DHCP server {#create_tftpd_map_and_alter_configuration_if_using_a_separate_dhcp_server}

Create file named /etc/default/tftpd-hpa.map using your favorite text
editor such as nano. (i.e. sudo nano /etc/default/tftpd-hpa.map)

Here is a copy of the map I am using\... You\'ll need to put this into
the map file you just created above:

`# if the requested file starts with a-f A-F or 0-9 send it`\
`# otherwise send pxelinux.0 for PXE stacks that are corrupt`\
`# This was added for the Acer Iconia W500 Tablet`\
\
`e ^[a-zA-Z0-9].*$`\
`r .* pxelinux.0`

Next edit the configuration file (/etc/default/tftpd-hpa) to tell it to
use the map file you just created\...

`sudo nano /etc/default/tftpd-hpa`

Here is a copy of my configuration\... the important thing is the
addition of the option -m and the map file location.

`# /etc/default/tftpd-hpa`\
`# FOG Modified version`\
`TFTP_USERNAME="root"`\
`TFTP_DIRECTORY="/tftpboot"`\
`TFTP_ADDRESS="0.0.0.0:69"`\
`TFTP_OPTIONS="-s -v -m /etc/default/tftpd-hpa.map"`

Finally issue the restart command for the tftpd service or restart your
FOG server.

`sudo service tftpd-hpa restart`

### Keyboard / PXE issue {#keyboard_pxe_issue}

To inventory the Iconia w500 and navigate the FOG Menu after PXE booting
there is an Acer Support document that you\'ll need to follow\... This
will allow you to capture your initial image to FOG as a keyboard is
required.

[`Here`](http://acer.custhelp.com/app/answers/detail/a_id/8157/~/how-do-i-perform-a-network-pxe-boot-on-the-iconia-tab-w500%3F)` is the link: `[`http://acer.custhelp.com/app/answers/detail/a_id/8157/~/how-do-i-perform-a-network-pxe-boot-on-the-iconia-tab-w500%3F`](http://acer.custhelp.com/app/answers/detail/a_id/8157/~/how-do-i-perform-a-network-pxe-boot-on-the-iconia-tab-w500%3F)

This work around involves hooking a USB extension cable to the keyboard
dock and the center USB port on the tablet\... and the other USB port on
the tablet to a keyboard or USB Hub \> keyboard.
