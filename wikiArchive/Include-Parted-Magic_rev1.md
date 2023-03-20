There are two methods of including the PartedMagic distro in the FOG PXE
menu

PartedMagic is a great little ISO to have at hand, includes Firefox ,
Gparted, Clonezilla and much more

**Method 1** - **Classic Way**

Download the pmagic-pxe-X.X.zip file and extract it.

[1](http://partedmagic.com/doku.php?id=downloads) its half way down the
page

Copy the pmagic folder from the extracted archive to /tftpboot/fog/
browse to /tftpboot/pxelinux.cfg/

-   as \'root\' edit the \'default\' file in the above directory and
    add:

```{=html}
<!-- -->
```
    LABEL pmagic
    LINUX pmagic/bzImage
    INITRD pmagic/initramfs
    APPEND edd=off load_ramdisk=1 prompt_ramdisk=0 rw vga=normal loglevel=9 max_loop=256

now it should appear on the pxe menu and you can boot into it

cited from [2](http://partedmagic.com/doku.php?id=pxe)

**Method 1** - **Alternate Way**

If the *Classic Way* does not work, here is an alternate for Method 1
consists of the following changes to the above:

Follow instructions for *Classic Way* until you come to the part of
editing the \'default\' file.

When editing the \'default\' file (as root), use this menu entry
instead:

    LABEL pmagic

            kernel fog/pmagic/bzImage
            append initrd=fog/pmagic/initramfs edd=off load_ramdisk=1 prompt_ramdisk=0 rw vga=normal loglevel=9 max_loop=256
            MENU LABEL Parted Magic
            TEXT HELP
            Parted Magic is a live disk operations tool
            that can be booted over PXE!
            ENDTEXT

There are variables that you can change to whatever you like:

-   LABEL
-   MENU LABEL
-   TEXT HELP

can all be changed as-is without affecting the functionality of the
example entry.

You can also modify the other lines to allow for multiple PartedMagic
entries, as in the following (tested/working) example:

    LABEL pmagic-i686

            kernel fog/pmagic/bzImage
            append initrd=fog/pmagic/initramfs edd=off load_ramdisk=1 prompt_ramdisk=0 rw vga=normal loglevel=9 max_loop=256
            MENU LABEL Parted Magic v6.6 [i686]
            TEXT HELP
            32-bit
            ENDTEXT

    LABEL pmagic-x64

            kernel fog/pmagic-64/bzImage
            append initrd=fog/pmagic-64/initramfs edd=off load_ramdisk=1 prompt_ramdisk=0 rw vga=normal loglevel=9 max_loop=256
            MENU LABEL Parted Magic v6.6 [x86_64]
            TEXT HELP
            64-bit
            ENDTEXT

That example uses \'pmagic/\' and \'pmagic-64/\' folders in the \'fog/\'
directory for a 32-bit and 64-bit copy of PartedMagic, respectively.

**Method 2** - **PXE: the \"memdisk - boot the standard PM ISO\" way**

this boots the entire ISO over PXE.

-   download the latest ISO from
    [3](http://partedmagic.com/doku.php?id=downloads)
-   create a folder in /tftpboot/fog/ called pmagic
-   copy the ISO to this newly created pmagic folder
-   copy and paste the memdisk file found in /tftpboot/fog/ to the
    pmagic folder
-   as \'root\' edit the \'default\' file in the above directory and
    add:

```{=html}
<!-- -->
```
    LABEL pmagic
    LINUX /fog/pmagic/memdisk
    INITRD /fog/pmagic/pmagic-X.X.iso
    APPEND iso vmalloc=256M
