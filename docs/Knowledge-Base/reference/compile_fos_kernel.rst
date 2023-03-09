.. include:: ../includes.rst

------------------
Compile FOS kernel
------------------

FOS kernels (Linux kernel used by the FOG OS - a minimal Linux OS doing all the imaging work) are updated regularly to provide drivers for newer hardware and fix issues. The vanilla Linux kernel is used and very few (currently none) patches are added to keep it as close to the official source as possible. In case you want to compile your own binaries for whatever reason you might want to follow the below instructions.

Prerequisites
=============

To be able to build the kernel from source you need tools to checkout and compile source code:

::

    debian/ubuntu# sudo apt install git build-essential flex bison libelf-dev
    fedora/centos# sudo yum install git gcc gcc-c++ make flex bison elfutils-libelf-devel 


Build script
============

Within the fos repository a build script is provided:

::

    git clone https://github.com/FOGProject/fos
    cd fos
    ./build.sh --kernel-only --arch x64


Manual compilation
==================

Checkout the code and download our config header files from github. The header files need to be a little different for BIOS and UEFI and therefore I usually checkout the source twice to have one ready for each platform.

::

    mkdir fos
    cd fos
    wget https://www.kernel.org/pub/linux/kernel/v5.x/linux-5.10.83.tar.gz
    tar xzf linux-5.10.83.tar.gz
    cd linux-5.10.83/
    git clone git://git.kernel.org/pub/scm/linux/kernel/git/firmware/linux-firmware.git

Up to this point your kernel source is prepared and ready. Now you need to choose which architecture you want to compile for: Intel/AMD 64 bit or 32 bit or ARM 64 bit.

Intel/AMD 64 bit
################

::

    make mrproper
    wget -O .config https://github.com/FOGProject/fos/raw/master/configs/kernelx64.config
    make oldconfig
    make -j $(nproc) bzImage
    cp arch/x86/boot/bzImage /var/www/html/fog/service/ipxe/bzImage

Intel/AMD 32 bit
################

::

    make mrproper
    wget -O .config https://github.com/FOGProject/fos/raw/master/configs/kernelx86.config
    make ARCH=i386 oldconfig
    make ARCH=i386 -j $(nproc) bzImage
    cp arch/x86/boot/bzImage /var/www/html/fog/service/ipxe/bzImage32

ARM 64 bit
##########

::

    make mrproper
    wget -O .config https://raw.githubusercontent.com/FOGProject/fos/master/configs/kernelarm64.config
    make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- oldconfig
    make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j $(nproc) Image
    cp arch/arm64/boot/Image /var/www/html/fog/service/ipxe/arm_Image


Additional patches
==================

As mentioned above the number of additional patches is kept low. For quite some time in the 4.x kernel series we added the following patches which are not need for 5.x kernels anymore.

drivers/net/usb/r8152.c
#######################

See https://forums.fogproject.org/topic/12465/microsoft-surface-go-usb-c-to-ethernet-adapter-compatibility

Search for

::

    REALTEK_USB_DEVICE(VENDOR_ID_REALTEK

and add this line

::

        {REALTEK_USB_DEVICE(VENDOR_ID_MICROSOFT, 0x0927)}

drivers/scsi/storvsc_drv.c
##########################

This is an important patch to help prevent from major performance issues in HyperV: https://forums.fogproject.org/topic/6695/performance-decrease-using-hyper-v-win10-clients

Search for

::

    blk_queue_virt_boundary

Delete the line and add this instead

::

        if (PAGE_SIZE - 1 < 4096) {
            blk_queue_virt_boundary(sdevice->request_queue, 4096);
        } else {
            blk_queue_virt_boundary(sdevice->request_queue, PAGE_SIZE - 1);
        }

