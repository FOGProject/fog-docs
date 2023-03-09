.. include:: ../includes.rst

---------------------
Compile iPXE binaries
---------------------

FOG is using the most current iPXE source code to build many different PXE binaries, some being undionly and others specific for NICs made by intel or realtek - BIOS and UEFI compatible. But still you might want to build your own binary to suit your needs (be it a custom script or debugging enabled). Here you'll find some hints on how to build your own iPXE binaries.

Prerequisites
=============

To be able to build iPXE from source you need tools to checkout and compile source code.

::

    debian/ubuntu# sudo apt-get install git build-essential zlib1g-dev binutils-dev
    fedora/centos# sudo yum install git gcc gcc-c++ make zlib-devel binutils-devel


Build script
============

- PXE boot any computer and record the build code listed on the iPXE banner. The build code is a hex number inside the brackets (e.g. ``iPXE 1.21.1+ (gc64d) ...``). We will compare this build code in a later step to ensure your iPXE boot loader files have been updated.
- Navigate to where you downloaded the FOG installer using git. Depending on which directions you followed these files will be in either /opt or /root. The parent directory we are looking for is called fogproject. For the remainder of this tutorial I’ll assume the fogproject directory is in the /root directory, you will need to adjust the file paths based on your fogproject path.
- Navigate to ``/root/fogproject/utils/FOGiPXE`` directory
- Run the compile script using this command ``./buildipxe.sh`` (**Note:** your fog server will need internet access to recompile iPXE. It should take about 10 minutes to recompile iPXE - depends on the CPU/RAM in your machine.)
- When the compile is done you will be presented with a command prompt once again. Understand the buildipxe.sh script only compiles the iPXE binaries. It does not install them in your production environment.
- The proper way to update your production environment is to re-run the fog installer using all of the preselected options. Reinstalling fog using the fog installer is not destructive, the installer remembers your previous settings and just updates any new files into your production environment.
- The hacker way to update your production environment is to copy over the updates files to the /tftpboot directory with this command ``cp -R /root/fogproject/packages/tftp/* /tftpboot`` (**Note:** watch the source path if your git fogproject directory is not in the ``/root/fogproject`` directory)
- Run the following command to ensure your iPXE files have a current date on them: ``ls -la /tftpboot/*.efi``
- Now PXE boot the client and confirm that the build code (in the brackets) has changed from the previous step. **Note:** The build code does not change on every re-compile you do but only if there is a newer version available.


Manual compilation
==================

Checkout the code and download our config header files from github. The header files need to be a little different for BIOS and UEFI and therefore I usually checkout the source twice to have one ready for each platform.

::

    mkdir ~/projects/ipxe
    cd ~/projects/ipxe
    git clone git://git.ipxe.org/ipxe.git ipxe-bios
    cd ipxe-bios/src/config
    rm console.h general.h settings.h
    wget -O console.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/config/console.h"
    wget -O general.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/config/general.h"
    wget -O settings.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/config/settings.h"
    cd ..
    wget -O ipxescript "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/ipxescript"
    
    cd ~/projects/ipxe
    git clone git://git.ipxe.org/ipxe.git ipxe-efi
    cd ipxe-efi/src/config
    rm console.h general.h settings.h
    wget -O console.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/config/console.h"
    wget -O general.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/config/general.h"
    wget -O settings.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/config/settings.h"
    cd ..
    wget -O ipxescript "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/ipxescript"

Bake the cake
=============

Now you are ready to build your iPXE binaries from source. But how do you do that? One simple call but it can be heavily customized with parameters.

::

    # Build a simple BIOS binaries including an embedded script (executed right when iPXE comes up)
    cd ~/projects/ipxe/ipxe-bios/src
    make bin/undionly.kpxe EMBED=ipxescript
    make bin/ipxe.pxe EMBED=ipxescript
    make bin/undionly.kkpxe EMBED=ipxescript
    make bin/intel.pxe EMBED=ipxescript
    ...

    
    # simple 32 bit EFI binaries with embedded script
    cd ~/projects/ipxe/ipxe-efi/src
    make bin-i386-efi/ipxe.efi EMBED=ipxescript
    make bin-i386-efi/snponly.efi EMBED=ipxescript
    make bin-i386-efi/intel.efi EMBED=ipxescript
    ...
    
    # simple 64 bit EFI binaries
    cd ~/projects/ipxe/ipxe-efi/src
    make bin-x86_64-efi/ipxe.efi EMBED=ipxescript
    make bin-x86_64-efi/snponly.efi EMBED=ipxescript
    make bin-x86_64-efi/intel.efi EMBED=ipxescript
    ...


Debugging
=========

Now we are getting to the interesting part of adding debug output to iPXE to be able to better find issues. Each and every c-file in the iPXE source can be compiled with debug enabled. Here is an example:

::

    make bin/realtek.kpxe EMBED=ipxescript DEBUG=realtek

Most of the native drivers consist of just one source file. Have a look at src/drivers/net to see them - 3c509, bnx2, forcedeth, intel, pcnet32, realtek, rhine and many more.

The most commonly used binaries ipxe.pxe and ipxe.efi include UNDI interface as well as all the native drivers. You can add debugging selectively. Check out the source code. Here are some more examples:

::

    make ... DEBUG=dhcp
    make ... DEBUG=device,efi_driver,efi_init,efi_pci,efi_snp
    make ... DEBUG=snp,snponly,snpnet,netdevice
    make ... DEBUG=intel:4
    make ... DEBUG=undi
    ...
