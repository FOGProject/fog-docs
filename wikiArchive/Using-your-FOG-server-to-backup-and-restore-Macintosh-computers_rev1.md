## The goal {#the_goal}

The goal of this article is to outline how to use your FOG server to
backup and restore Macintosh computers. I utilize Clonezilla for the
actual backup/restore process, but it is easily incorporated into an
existing FOG server. The basic outline for the process is that we modify
the FOG server\'s DHCP settings to allow it to talk to Macs, send over a
GRUB2 boot.efi file with

Please consider this a work in progress. While the procedure here works
for the hardware I have been working with, I do not have the ability to
test it out for different types of Macs.

I have done my best to recreate, from scratch, the method necessary to
accomplish this from start to finish. I spent nearly three weeks
straight at work trying a variety of options and ideas, so there may be
rough spots. Also, note that there is almost definitely a few
unnecessary variables and such here and there. I am not fully
experienced with everything I cover; I simply know that what I currently
have works. If there is anything you notice that is unneeded and can be
removed, or if there are any part of this that can be improved, please
feel free to provide assistance. Thanks. :)

## My setup {#my_setup}

The setup I used for this experiment is as follows-

Lenovo x61 Notebook Laptop - My FOG server. Installed on Ubuntu 11.10.

Macbook(13-inch, mid-2009) - The target computer for this operation.

A crossover cable was used to provide the connection between the two
computers.

## Modifying your DHCP server to be able to communicate with a Mac {#modifying_your_dhcp_server_to_be_able_to_communicate_with_a_mac}

I started with the idea of getting a Macbook to try to load the FOG boot
files, to see if it could be done. But first, we need our DHCP server to
be able to talk to a Mac in the first place. This wiki article provided
a good base to work with:
<http://www.fogproject.org/wiki/index.php?title=How_to_get_Macintosh%27s_Netboot_working_with_your_FOG_server>

This webpage also provides further info on the subject-
<https://docs.math.osu.edu/linux/how-tos/bsdp_with_isc_dhcp/>

We need to add this code to our *dhcpd.conf* file.

Using the terminal, type- sudo nano /etc/dhcp/dhcpd.conf

And append the following text to the end of the file-

`{`\
`ddns-update-style none;`\
`ddns-updates off;`\
`ignore client-updates;`\
`allow booting;`\
`authoritative;`\
`class "AppleNBI-i386" {`\
` match if substring (option vendor-class-identifier, 0, 14) = "AAPLBSDPC/i386";`\
` option dhcp-parameter-request-list 1,3,17,43,60;`\
` if (option dhcp-message-type = 1) { option vendor-class-identifier "AAPLBSDPC/i386"; }`\
` if (option dhcp-message-type = 1) { option vendor-encapsulated-options 08:04:81:00:00:67; }`\
` filename "boot.efi";`\
`}`\
`class "AppleNBI-ppc" {`\
` match if substring (option vendor-class-identifier, 0, 13) = "AAPLBSDPC/ppc";`\
` option dhcp-parameter-request-list 1,3,6,12,15,17,43,53,54,60;`\
` #filename "macnbi-ppc/booter";`\
` option vendor-class-identifier "AAPLBSDPC";`\
` if (option dhcp-message-type = 1) {`\
`   option vendor-encapsulated-options 08:04:81:00:00:09;`\
` }`\
` elsif (option dhcp-message-type = 8) {`\
`   option vendor-encapsulated-options 01:01:02:08:04:81:00:00:09;`\
` }`\
` else {`\
`   option vendor-encapsulated-options 00:01:02:03:04:05:06:07;`\
` }`\
`}`\
`subnet 192.168.7.0 netmask 255.255.255.0 {`\
` pool {`\
`   range 192.168.7.100 192.168.7.199;`\
` }`\
` default-lease-time 7200; # 2 hours`\
` max-lease-time 86400; # 1 day`\
` option domain-name "alpha.secure.lan";`\
` option routers 192.168.7.1;`\
` option subnet-mask 255.255.255.0;`\
` option broadcast-address 192.168.7.255;`\
` option domain-name-servers 192.168.7.1;`\
` option time-offset -18000; # EST`\
` allow unknown-clients;`\
`}`

Now that the Mac can talk to our DHCP server, we need to create the
files necessary to boot it.

## Constructing your boot file {#constructing_your_boot_file}

## The GRUB2 Bootloader {#the_grub2_bootloader}

GRUB2 will be the bootloader used to load Clonezilla onto the system. In
my case, I needed the amd64 efi version. In terminal, type-

`sudo apt-get install grub-efi-amd64`

This will allow us to create the boot.efi file we will be sending to our
Mac.

## Ubuntu Minimal CD {#ubuntu_minimal_cd}

At the onset, I simply wanted to find something I could use to boot the
Macbook. The Ubuntu minimal cd was the first to work. I still use some
of the files from the .iso for the GRUB bootloader.

<http://archive.ubuntu.com/ubuntu/dists/oneiric/main/installer-amd64/current/images/netboot/mini.iso>

Extract the files from the .iso to a folder, my folder is \"minicd\" in
my Home directory.

## Clonezilla

I used Clonezilla Live as the base for the backup and recovery
operations. You will need to obtain the .iso file to get all the files
we need. For this project I used the
*clonezilla-live-1.2.12-37-amd64.iso file.*

<http://sourceforge.net/projects/clonezilla/files/clonezilla_live_stable/1.2.12-37/clonezilla-live-1.2.12-37-amd64.iso/download>

After downloading the file, use Archive Manager to extract the files
into the folder of your choice. For my project, I created a folder
\"Clonezilla Live\" in my home folder.

Our boot file is going to contain a cd image embedded into it that hold
all the files we need to load GRUB2, and have that boot Clonezilla Live.
I used Brasero Disc Burner to create our image. Open up Brasero and
create a data project. Here\'s what we want on our .iso-

From Clonezilla Live - The files *vmlinuz* and *initrd.img*, located in
the \"live\" folder.

From the mini.iso - The \"boot\" folder, and all of its contents. Edit
the *grub.cfg* by replacing its contents with this:

`if loadfont /boot/grub/font.pf2 ; then`\
`   set gfxmode=auto`\
`   insmod efi_gop`\
`   insmod efi_uga`\
`   insmod gfxterm`\
`   terminal_output gfxterm`\
`fi`\
\
`set menu_color_normal=white/black`\
`set menu_color_highlight=black/light-gray`\
\
`menuentry "Clonezilla" {`\
\
`   linux   /vmlinuz. root=/dev/nfs nfsroot=192.168.1.2:/tftpboot/clonezilla ip=dhcp boot=live live-config nomodeset noswap nolocale edd=on vga=788 fetch=`[`http://192.168.1.2/filesystem.squashfs`](http://192.168.1.2/filesystem.squashfs)\
`   initrd  /initrd.img`\
`}`

And that\'s everything. Burn your cd image into an .iso file, for
example, *macboot.iso*.

As you may have noticed, the Clonezilla entry has a parameter to fetch a
file from our FOG server. Copy *filesystem.squashfs* into /var/www/.

To create your GRUB2 efi file in terminal, run the following(Note: this
all has to be on one line. I added breaks for readability)-

`sudo grub-mkimage --format=x86_64-efi --output=boot.efi --memdisk=/location/of/iso/macboot.iso ntfs hfs appleldr boot cat efi_gop efi_uga elf  `\
`fat hfsplus iso9660 linux keylayouts memdisk minicmd part_apple ext2 extcmd xfs xnu part_bsd part_gpt search search_fs_file chain btrfs`\
`loadbios loadenv lvm minix minix2 reiserfs memrw mmap msdospart scsi loopback`

I don\'t know if we need every last parameter; I added these based on
research and by what I thought could be necessary.

When that\'s done, copy the boot.efi file into your /tftpboot directory.

You are now ready to try to netboot your Mac. Select the Clonezilla
entry when the menu appears. If all goes well, Clonezilla will load
itself and you can begin cloning your Mac.
