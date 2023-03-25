`<font color="red">`{=html}Note:`</font>`{=html} This article is older,
and has only had it\'s terminology updated to reflect current FOG
terminology. Also, FOG 1.3.0 and later will allow for \"Quick
Deployment\" from the boot menu, and will make this article obsolete.

[link title](http://www.example.com)Imported from
[this](https://sourceforge.net/projects/freeghost/forums/forum/730844/topic/4529097)
forum thread, topic created by
[jdd49](https://sourceforge.net/users/jdd49/).

# BYPASS.GZ and NOREG.GZ {#bypass.gz_and_noreg.gz}

**NEVER NEEDED THE INIT TO BE CHANGED TO BYPASS REGISTRATION IF CAPONE
WAS A PART OF THE VERSION YOU NEEDED**\
\'\'\' Only thing you needed was to add capone=1 to the default menu
options. ==

```{=html}
<h1>
```
Single Host Deployment

```{=html}
</h1>
```
== ===

```{=html}
<h2>
```
About

```{=html}
</h2>
```
=== **UPDATED 9-6-11 FOR BOTH UNICAST AND MULTICAST(most of the changes
were for multicasting). ALL FILES HAVE CHANGED AND BOOT MENU\'S HAVE NEW
OPTIONS. NONE OF THE OLD FILES WILL WORK WITH THESE INSTRUCTIONS. READ
THROUGH EVERYTHING EVEN IF IT LOOKS LIKE IT DIDN\'T CHANGE**\
\
This is a simple modification that I created to add another level of
flexibility to Fog. This enables you to boot to a PXE menu and select
any image you would like to deploy to that client. You can do this
regardless of what image is assigned to it in the Fog database. You can
also use this if you would like to bypass host registration all
together. I currently use this in conjunction with the way that Fog
functions and I still keep my hosts in the database. A nice feature to
this is that is does not alter the way Fog is intended to work in any
way. It only adds to it.\
\
*How it works:*\
I modified the Fog .29 Boot image init.gz and removed the code that
requires the host to check in with the Fog database. I renamed it
noreg.gz and placed it with the original init.gz. If you wish to image a
PC from the PXE boot menu then noreg.gz gets called and if you use fog
from the WebGUI then init.gz gets called, therefore leaving the normal
functionality of FOG intact.\
\
**Update**\
A password can now be specified for individual images, use the
*sessionPwd=* option in the boot menu.\
===

```{=html}
<h2>
```
Compatibility

```{=html}
</h2>
```
=== *Confirmed Working On:*\
**Fog Versions:** .29 .30 .31 .32\
**Ubuntu Versions:** 10.04 11.04 12.04LTS\
**Windows Versions:** XP 7\
**Image Type:** Single Partition Resizable, Multiple Partition Single
Disk\
\
*Confirmed Not Working On:*\
**Nothing Yet**\
===

```{=html}
<h2>
```
Download Required File

```{=html}
</h2>
```
=== Download noreg.gz and place it in /tftpboot/fog/images\
[noreg.gz](http://www.mediafire.com/?c1kasma5ctntwah)\
\
You should also see that init.gz is in that folder. You will now have
your two different boot images. You may change the name of noreg.gz if
you wish as long as you also change it in your boot menu(coming up in
the next section).\
\
Below is the bypass for .32. Like the older file, place in
/tftpboot/fog/images and switch the \"default\" file to point to the new
name.\
[bypass.gz](https://app.box.com/s/q3iprmm03ue3s3292k46)\
A \"how-to\" for installing and using the bypass can be found
[Here](http://www.fogproject.org/wiki/index.php/Installing_the_FOG_Bypass_Host_Registration)

===

```{=html}
<h2>
```
Modify Boot Menu

```{=html}
</h2>
```
=== Next we need to modify the boot menu. Navigate to
/tftpboot/pxelinux.cfg and there will be a file in there called default,
this is your boot menu. Open it with gedit. Typically when a host boots
up it checks to see if it has any jobs waiting for it and if so it gets
the options from the Fog server. We are basically just skipping the
check and telling the server these are the options we want to use. You
will need to create a Label for every image that you have. Here is an
example.\
\
LABEL MYIMAGE\
menu passwd xxx (if you want to password protect your menu item)\
kernel fog/kernel/bzImage\
append initrd=fog/images/noreg.gz root=/dev/ram0 rw ramdisk_size=127000
ip=dhcp dns=10.1.1.1 type=down img=MYIMAGE ftp=10.1.1.1
storage=10.1.1.1:/images/ web=10.1.1.1/fog/ osid=1 imgType=n loglevel=4
sessionPwd= consoleblank=0\
\
*Change the options as necessary:*\
I displayed this in list view only for readability.\
\
**menu passwd xxx** Where xxx is your password. Although it\'s not
encrypted, this will password protect your menu icon against
unauthorized use.\
**kernel fog/kernel/bzImage** If you use a custom kernel then change
this accordingly, otherwise leave it alone.\
**append initrd=fog/images/noreg.gz** If you changed the name of
noreg.gz then change it here also, otherwise leave it alone.\
**root=/dev/ram0 rw** You should be able to leave this alone.\
**ramdisk_size=127000** You should be able to leave this alone.\
**ip=dhcp** Change to your settings.\
**dns=10.1.1.1** Change to your settings.\
**type=down** Leave this alone. Other option is Up for capture but will
not work as I did not modify the code for captures.\
**img=MYIMAGE** Your image name. Case sensitive.\
**ftp=10.1.1.1** Change to your settings.\
**storage=10.1.1.1:/images/** Change to your settings.\
**web=10.1.1.1/fog/** Change to your settings.\
**osid=1** Operating system 1 = XP, 5 = Windows 7.\
**imgType=n** n = Single Partition Resizable, mps = Multiple Partitions
Single Disk.\
**loglevel=4** Change to any log level you would like.\
**sessionPwd=** If you would like a password for the image, enter it
here\
**consoleblank=0** Used to keep the screen from going black while
imaging\
\
There is a long list of options that can be set, I have only included
what is needed for most people. If you wish to add a complete list of
all options feel free.\
\
**\*Important note 1\***\
The line that begins with *append initrd* and ends with *consoleblank=0*
must be on one continuous line. Do not press enter to seperate the
options. The kernel and menu labels can be on separate lines.\
**\*Important note 2\***\
If you modify the default boot menu in any way with the Fog WebGUI such
as adding a password to the menu, it will overwrite your default file
and you will lose the images you just added to it. Make all your changes
in the WebGUI first and then add your images. It\'s also a good idea to
keep a backup copy of your default file in another folder.\
\
If you want an easy way to get this info, deploy an image to a single
workstation but do not turn on or start the image on that workstation.
Go to /tftpboot/pxelinux.cfg and you will see a file in there with the
name as the mac address of the machine you just deployed to. Open that
in gedit and you will see the same info I have posted here but with your
settings.\
===

```{=html}
<h2>
```
Conclusion

```{=html}
</h2>
```
=== There you have it. You can now boot any machine and directly from
your boot menu select the image you would like to deploy to it. This
method is very crude and removes some core functionality of fog but it
works. It bypasses fogs database so you will have no active tasks or
reporting options. It will not use any available slots. Here is a pic of
my boot menu:

1.  ![Boot menu](BootMenuRegistrationBypass.jpg "Boot menu")\

==

```{=html}
<h1>
```
Multicast Deployment

```{=html}
</h1>
```
== ===

```{=html}
<h2>
```
About

```{=html}
</h2>
```
=== **Update**\
Now uses fog ports instead of always using port 9000\
Now allows multiple sessions at the same time with different session
names\
Now allows the use of password protected sessions\
Now allows the use of udpcast maxwait\
This new version only works with .31 and .32, I have stopped working on
anything earlier as the new WebGUI is much better.\
\
I have added the ability to Muliticast hosts without the need to
register them or create groups. I recommend reading through the single
host process first because it explains some things in greater detail.
The process includes starting a multicast session in the WebGUI and then
selecting a multicast session boot option from the PXE Menu. This is
similar to the way older versions of Ghost worked. While the
functionality of FOG works great this is something that I like having
for two reasons:\
1. It\'s easier than always making new groups if i\'m only doing a few
computers. I always ended up with a ton of groups with only 2 or 3
hosts.\
2. If you know you won\'t use FOG to manage a group of computers then
there is no reason to register them all.\
\
*How it works:*\
A fake host is created with the name of the session that is specified.
It uses a negative id in the database so that it does not get included
with all of the other hosts in the database. The host is then assigned
the correct image and operating system. The host is placed into the
active tasks the amount of times that is specified by client quantity.
Those tasks are then assigned to a multicast session. Once Fog sees
these tasks, it takes care of the rest.\
===

```{=html}
<h2>
```
Compatibility

```{=html}
</h2>
```
=== *Confirmed Working On:*\
**Fog Versions:** .31 .32\
**Ubuntu Versions:** 10.04 11.04\
**Windows Versions:** XP 7\
**Image Type:** **XP** - Single Partition Resizable, Multiple Partition
Single Disk **7** - Single Partition Resizable(but with 2 partitions)\
\
*Confirmed Not Working On:*\
**Nothing Yet**\
===

```{=html}
<h2>
```
Download Required Files

```{=html}
</h2>
```
=== Download noreg.gz and place it in /tftpboot/fog/images\
[noreg.gz](http://www.mediafire.com/?c1kasma5ctntwah)\
This is the same file that is listed earlier on this page. It is used
for both single host imaging and multicast deployment.\
\

```{=html}
<h3>
```
For Fog .31 or .32

```{=html}
</h3>
```
Download ArchiveNoReg. Extract this file and inside are 6 files:\
[ArchiveNoReg](http://www.mediafire.com/?bzj83m86285phdg)\
You should back up the files that will be overwritten in case things
don\'t work out. I also included the lines that were changed in case you
would rather paste them into your existing files instead of overwriting
them.\
\
**tasks.include.php**\
Place in /var/www/fog/management/includes \--\>Overwrite existing file.\
Lines 44-47\
**tasks.noregmc.include.php**\
Place in /var/www/fog/management/includes \--\>This is a new file.\
**noregsessionmc.php**\
Place in /var/www/fog/service \--\> This is a new file.\
**noregactivemc.php**\
Place in /var/www/fog/service \--\> This is a new file.\
**submenu.include.php**\
Place in /var/www/fog/management/includes \--\>Overwrite existing file.\
Line 320\
**MulticastTask.class.php**\
Place in /opt/fog/service/common/lib \--\>Overwrite existing file.\
Lines 64-67, 83, 97, 108, 111, 133-136\
FOGMulticastManager service needs to be restarted after copying this
one.\
sudo /etc/init.d/FOGMulticastManager restart\
sudo killall udp-sender

===

```{=html}
<h2>
```
Modify Boot Menu

```{=html}
</h2>
```
=== Place this into your PXE Boot Menu. You will only need one menu
unlike the single host deployment. Change you IP settings as necessary.
DO NOT change the order of the commands. Notice that img= , port=,
imgType=, and osid= are missing. DO NOT put them in the menu.\
LABEL Multicast\
kernel fog/kernel/bzImage\
append initrd=fog/images/noreg.gz root=/dev/ram0 rw ramdisk_size=127000
ip=dhcp dns=10.1.1.1 type=down mc=yes storageip=10.1.1.1
storage=10.1.1.1:/images/ ftp=10.1.1.1 web=10.1.1.1/fog/ shutdown=
loglevel=4 mSession= consoleblank=0\
\
**mSession=** This is a new setting to specify the session name to join.
Use this if you don\'t want to be prompted to join a session.\
===

```{=html}
<h2>
```
How To Use

```{=html}
</h2>
```
=== Login to the FOG WebGUI and select Task Management. On the left side
you will see a new option called start multicast. Once there you will
set all the options. The info button next to each option explains them
in greater detail. Then click the Start Multicast button below.\
\# ![Multicast Session](Multimanual32.jpg "Multicast Session")\
\
Now PXE boot your clients and select Multicast. When the bootimage is
done loading you will be prompted to select the name of the session you
want to join. If you specified a password you will then be prompted to
enter the password. I realize that some people may not want to pick a
session to join because that takes away from some of the automation.
Alternatively you can specify the session name in the boot menu where it
says *mSession=*. This way you can select Multicast from your pxe menu
and move on to the next pc without having to enter in anymore info.\
\
\

```{=html}
<center>
```
1.  ![Boot menu](Multiboot.jpg "Boot menu")\
    ```{=html}
    </center>
    ```

===

```{=html}
<h2>
```
Multicast Limitations

```{=html}
</h2>
```
=== 1.) If the maxwait option is used it also changes the maxwait of
multicasting with fog in the traditional way. You can change the value
at anytime by going to Other Settings, Fog Settings, Multicast Settings
in the WebGUI\
\
\
\
Please use this thread for questions/bugs.\
[<https://sourceforge.net/projects/freeghost/forums/forum/730844/topic/4563039>](https://sourceforge.net/projects/freeghost/forums/forum/730844/topic/4563039)
