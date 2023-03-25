I setup dsl linux which is only 50mb to boot of the fog pxe menu. Here
is the link where I got the instructions
<http://wl500g.info/showthread.php?t=17156>. This distro has Firefox and
it boots pretty fast from pxe. DSL is based on knoppix linux. So, this
could be used as a work around to access the fog console to send images
if you do not have a working computer near by. This might be useful
until there is a way to image through the pxe menu. Actually you might
not need this feature now with this work around. Here is how I did it.

I downloaded dsl version dsl-4.4.10-initrd.iso and expanded the iso into
a dsl folder on my desktop

(note: downloading the iso to your own server and then mounting it works
too)

    mkdir dslmount
    mount -o loop -t iso9660 dsl-4.4.10-initrd.iso dslmount

On the fog server I created under the /tftpboot/fog folder dsl folder.
Then I copied linux24 and minirt24.gz files to /tftpboot/fog/dsl folder.
Make sure to check rights on the files so the rights are set to 777.

Then in my pxelinux menu settings (in the file
/tftpboot/pxelinux.cfg/default) I added the following:

    LABEL DSL
        kernel fog/dsl/linux24
        append ramdisk_size=100000 init=/etc/init lang=us apm=power-off vga=791 initrd=fog/dsl/minirt24.gz nomce noapic quiet
        BOOT_IMAGE=fog/dsl/knoppix
        MENU LABEL Damn Small Linux
        TEXT HELP
        Damn Small Linux provides a minimal Linux environment,
        with Firefox and other bare-bones utilities.
        This can be used to browse back to FOG from a
        PXE booted client, for example.
        WARNING: It may be advisable to password protect
        this menu option for security reasons
        ENDTEXT

I hope this helps.

------------------------------------------------------------------------

It might be interesting to try to get Damn Small Linux - Not! (DSL-N)
working from a PXE boot as well, because it includes more hardware
support and a 2.6 kernel. I will try to get this working when I have
some time at work\... please add notes here if you get this working! One
of the biggest problems I have with DSL PXE boot is that the USB drivers
for the systems I\'ve tried DSL with aren\'t recognized, so I can\'t
type or use the mouse [Ericgearhart](User:Ericgearhart "wikilink")
13:04, 16 July 2009 (MST)

P.S. see <http://www.damnsmalllinux.org/dsl-n/download.html> for details

------------------------------------------------------------------------

It is also possible to netboot
[SystemRescueCD](SystemRescueCD "wikilink") in a very similar way. This
allows in-depth examination of the client machines.

[Category:pxe](Category:pxe "wikilink")
[Category:Customization](Category:Customization "wikilink")
