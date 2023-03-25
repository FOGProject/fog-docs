### Building a Custom Kernel {#building_a_custom_kernel}

## Overview

In FOG the kernel and the boot file system are separate and
interchangeable, this makes it easier to upgrade a kernel without
modifying the boot file system. This also means that all drivers in the
kernel are build into the kernel instead of being compiled as modules.
In our example we will be compiling the kernel on Fedora 9.

## Build Process {#build_process}

1.  Install the required packages to build the kernel with:
    -   RHEL/Fedora/CentOS/.rpm other: (need confirmation that this is
        all the packages required?!?, may also need qt-devel and a few
        others)

    :   `yum groupinstall "Development Tools"`

    -   Ubuntu/Debian/.deb other:

    :   `sudo apt-get install qt3-dev-tools libqt3-mt-dev`
2.  Download the latest kernel source (which in this case is version
    2.6.35.3):

    :   `cd /usr/src`
    :   `wget `[`http://www.kernel.org/pub/linux/kernel/v2.6/linux-2.6.35.3.tar.gz`](http://www.kernel.org/pub/linux/kernel/v2.6/linux-2.6.35.3.tar.gz)
3.  Extract the tar file:

    :   `tar -zxvf linux-2.6.35.3.tar.gz`
4.  Copy the .config file from the fog release package which is located
    in the Fog Setup ./kernel directory:

    :   `cp /opt/fog-setup/fog_0.29/kernel/kitchensink.config /usr/src/linux-2.6.35.3/.config`
5.  Start configuring the kernel:
    -   RedHat forks:

    :   `make menuconfig`

    -   Ubuntu/Debian, etc:

    :   `make xconfig`

    -   This will run the kernel configuration tool, you will need to
        navigate around it a little to get a feel for it as there are
        many options. Placing a check mark in a box will include it in
        the kernel, and unchecking an item will remove it from the
        kernel.
    -   To add or remove drivers from the kernel you will need to go to
        **Device Drivers**, and network drivers are in **Network Device
        Support.**
    -   **Important:** All settings required by fog are already in the
        kernel, when you are done making changes click **save** and
        close the application.
6.  Now you need to build the kernel:

    :   `make bzImage`

    -   or possibly just:

    :   `make`

    -   *This could take 10 minutes, depending on the speed of your
        machine and how many options you checked.*
7.  Backup your FOG kernel, and copy the new kernel image to your TFTP
    kernel folder, probably under /tftpboot:

    :   `sudo cp /tftpboot/fog/kernel/bzImage /tftpboot/fog/kernel/backup/bzImage_`**YYYYMMDDHHMMSS**
        -   \'\'Of course, you can name your backup anything you want,
            that is simply the name convention used by FOG
    :   `sudo cp /usr/src/linux-2.6.35.3/arch/x86/boot/bzImage /tftpboot/fog/kernel/bzImage`
8.  And, you\'re done! Try booting a client with your new kernel to test
    it. Repeat steps 5-7 above if you need to make any changes. If you
    are happy with your configuration, you can save the configuration by
    backing up the .config file located in the boot of the kernel source
    directory.

## Note

When building on x86_64 systems you may need to specify that you are
building for an x86 target architecture.

`make ARCH=i386 menuconfig`

`make ARCH=i386 bzImage`

Test
