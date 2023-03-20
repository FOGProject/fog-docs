## Modifying the Boot Image {#modifying_the_boot_image}

If you wish to modify the way that the pxe/tftp works init files can be
edited - run **as root** to be able to loop mount:

    cd ~
    cp /var/www/html/fog/service/ipxe/init.xz .
    xz -d init.xz
    mkdir -p initmountdir
    mount -o loop init initmountdir

Now you find the uncompressed content of the initrd in `~/initmountdir`
and can make adjustments as needed. After you\'re done making changes,
you have to unmount, re-compress and copy back the init image:

    cd ~
    umount initmountdir
    xz -C crc32 -9 init
    cp init.xz /var/www/html/fog/service/ipxe/

You want to apply the same changes to the 32-bit init file as well!
Follow the same steps outlined above but using the filename `init_32.xz`
instead.

## Examples

### Adding sfdisk to the /sbin directory {#adding_sfdisk_to_the_sbin_directory}

This will add the `sfdisk` program into the boot environment:

    cd /tftpboot/fog/images
    gunzip init.gz
    mkdir initmountdir
    mount -o loop init initmountdir

init is now ready for modification. Make your changes:

    cp /sbin/sfdisk /tftpboot/fog/images/initmountdir/sbin

Modifications Complete. Unmount and re-gzip it:

    umount initmountdir
    rmdir initmountdir
    gzip init

Now you can use the sfdisk program from the PXE environment.

### Remove Authentication from Quick Image {#remove_authentication_from_quick_image}

This example will show how to automatically authenticate users when they
select Quick Image. If you are happy to allow anybody to deploy an image
to a hardrive this is for you.

    cd /tftpboot/fog/images
    gunzip init.gz
    mkdir initmountdir
    mount -o loop init initmountdir
    cd /tftpboot/fog/images/initmountdir/bin/

Edit fog.quickimage\
Comment out the followig lines by putting a \# in front

     #echo "  Enter a valid FOG username and password.";
     #echo "";
     #echo -n "      Username: ";
     #read username;
     #echo ""
     #echo -n "      Password: ";
     #stty -echo
     #read password;
     #stty echo;
     #echo "";
     #echo ""

Replace with:

     username="a valid username"
     password="a valid password";

Save the modification

    cd ../..
    umount initmountdir/
    rmdir initmountdir
    gzip init

You are done and now users can image without the need for a username and
a password.
