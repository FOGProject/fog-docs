The GParted application enables you to change the partition organization
on a disk device while preserving the contents of the partitions. (taken
from [GParted\'s Homepage](http://gparted.sourceforge.net/))

With GParted you can accomplish the following tasks:

-   Create a partition table on a disk device.
-   Enable and disable partition flags such as boot and hidden.
-   Perform actions with partitions such as:
    -   create or delete
    -   resize or move
    -   check
    -   label
    -   copy and paste

## Steps to integrate GParted into FOG as a PXE boot option {#steps_to_integrate_gparted_into_fog_as_a_pxe_boot_option}

1.) Be sure you are logged in to your server as root. Switch to the tmp
directory:

    cd /tmp

2.) Get the latest version of GParted from
[here](http://sourceforge.net/projects/gparted/files/) (make sure you
download \"gparted-live-`<version>`{=html}.zip\" - substitute
`<version>`{=html} with the latest version of GParted)

3.) After that we unzip the parts of GParted we need:

    mkdir -p /tmp/gparted; unzip gparted-live-*.zip -d /tmp/gparted/

(Replace gparted-live-\*.zip with the file name you just downloaded).

4.) Create the directories in the appropriate places:

    mkdir /tftpboot/fog/gparted

Now copy the relevant PXE boot files to the directory just created:

    cp /tmp/gparted/live/{vmlinuz1,initrd1.img} /tftpboot/fog/gparted/

5.) Copy /tmp/gparted/live/filesystem.squashfs to your http server\'s
DocumentRoot (usually located at /var/www):

    cp /tmp/gparted/live/filesystem.squashfs /var/www/fog/

6.) Open FOG\'s PXE menu config file:

    nano /tftpboot/pxelinux.cfg/default

7.) Copy these lines to the end of that file:

     LABEL GParted
            kernel fog/gparted/vmlinuz1
            append initrd=fog/gparted/initrd1.img boot=live union=aufs noswap noprompt vga=788 fetch=http://<My HTTP server IP>/fog/filesystem.squashfs
            MENU LABEL GParted Live
            TEXT HELP
            The GParted application is the GNOME partition editor for creating, reorganizing, and deleting disk partitions.
            ENDTEXT

**NOTE:** Replace `<My HTTP server IP>`{=html} with the IP address of
your http server (usually your FOG server), e.g. your \"append\" line
might look like this when you\'ve inserted your server\'s IP address if
your server\'s IP is 192.168.1.1:

    append initrd=fog/gparted/initrd1.img boot=live union=aufs noswap noprompt vga=788 fetch=http://192.168.1.1/fog/filesystem.squashfs

**NOTE:** In FOG\'s PXE menu config file,
(/tftpboot/pxelinux.cfg/default) the word **config** may be required on
the append line. [Dukeokanabec](Dukeokanabec "wikilink") reported that
**config** was required for him while installing GParted version
0.7.0-4. [Spellerr](Spellerr "wikilink") also reported that **config**
was required for him while installing GParted version 0.8.0-1, and
excluding **config** resulted in GParted prompting for a password. Per
GParted instructions linked below they added the word config to the PXE
menu entry and it worked fine, like this:

`      LABEL GParted`\
`       kernel fog/gparted/vmlinuz1`\
`       append initrd=fog/gparted/initrd1.img boot=live `**`config`**` union=aufs noswap noprompt vga=788 fetch=<fog I.P>/fog/filesystem.squashfs`\
`      MENU LABEL GParted Live`\
`       TEXT HELP`\
`       The GParted application is the GNOME partition editor for creating,...`\
`       ENDTEXT`

For more information (GParted\'s PXE instructions) see
[here](http://gparted.sourceforge.net/livepxe.php)

# Additional warning {#additional_warning}

If you manually edit the default file under pxelinux.cfg as mentioned
above all your changes will be lost when you rebuild the PXE Boot Menu
from the Web-Gui. To avoid this, the changes from above also need to be
added to the generatePXEMenu() function in commons/functions.include.php
file in the \$strMenu variable.
