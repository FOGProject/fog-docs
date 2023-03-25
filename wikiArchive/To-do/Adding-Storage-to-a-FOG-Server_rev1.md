```{=mediawiki}
{{Merge|target=Moving your images directory/Adding Storage to the Images directory|discuss=Talk:Adding Storage to a FOG Server}}
```
## Overview

This tutorial will cover how to add an additional hard disk to a server
and mount it as /images. For example if you installed the host operating
system on a drive that was 80GB, now you wish to add a new 1TB hard disk
to mount as /images keeping the rest of the OS on the 80GB disk.

In this tutorial we are assuming you are using Ubuntu and that the disk
you are installing is not formatted. If the drive is formatted, it may
mount automatically, if you does, right click on it and select dismount.

### Preparing new disk {#preparing_new_disk}

-   Connect the new drive to the host system.
-   Determine device name by typing

`sudo fdisk -l`

It should look something like /dev/sdb (without a number after it), we
will refer to this as \[yourdevice\].

**Make sure this is correct because we will be destroying everything on
this device, so make sure the disk capacity matches, etc.**

-   Lets wipe out the MBR and then some, type

`sudo dd if=/dev/zero of=[yourdevice] count=20 bs=512`

### Partitioning

-   Now lets partition it

`sudo fdisk [yourdevice]`\
`n`\
`p`\
`1`\
`1`\
`[press enter]`\
`t`\
`83`\
`a`\
`1`\
`w`

### Formating and Mounting {#formating_and_mounting}

-   Put a filesystem on it

`sudo mkfs.ext3 [yourdevice]1 (add a 1 to the end of your device name!)`

-   Your device is setup! Lets move your old images directory.

`sudo mv /images /images.old`

-   Create the new mountpoint

`sudo mkdir /images`

-   Now lets mount your new driver as /images

`sudo mount -t ext3 /dev/sdb1 /images`

-   Make sure the new driver is mounted

`mount`

You are looking for **\[yourdevice\] on /images**

-   Copy your old images and data to the new device

`sudo cp -av /images.old/* /images/`

-   Create the .mntcheck file in the new images folder

`sudo touch /images/.mntcheck`

-   Now make sure your new device gets mounted at system startup

`sudo gedit /etc/fstab`

-   Add the following line:

` [yourdevice]1 /images     ext3   defaults   0   0`

\[yourdevice\] should have the number 1 at the end of it.

-   Change permissions on the device

`sudo chmod 777 -R /images`

-   Now restart and make sure the new image volume mounts.

[Category:Storage](Category:Storage "wikilink")
[AddStorage](Category:HowTo "wikilink")
