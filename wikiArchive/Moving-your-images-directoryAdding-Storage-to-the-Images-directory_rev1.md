```{=mediawiki}
{{Merge|target=Adding Storage to a FOG Server|discuss=Talk:Adding Storage to a FOG Server}}
```
## Overview

If you need to add storage capacity to your images directory or you
would like to replace your /images directory with a larger capacity
array/hard drive here are the basic steps. We are going through the
steps on Ubuntu, but they should be very similar on Fedora.

## Prepping the new disk {#prepping_the_new_disk}

-   Determine the device node by running

`sudo fdisk -l`

-   Locate the entry the matches your device you are adding for
    something like /dev/sdX where X is a letter.

```{=html}
<!-- -->
```
-   Make sure the device is formatted with ext3/4. Your should see a
    partion listed like this:

`   Device Boot      Start         End      Blocks   Id  System`\
`/dev/sdX1               1      121601   976760001   83  Linux`

-   If you have a partition that isn\'t either ext3/4, you will need to
    delete them with the following commands. **Note: This WILL make the
    data on the partition unreadable!**

`sudo fdisk /dev/sdX`\
`p`

-   Take note the number of partitions you need to delete and for each
    of them do:

`d`\
`[parition number]`

-   When you are done removing the partitions type:

`w`\
`q`

-   At this point if you don\'t have any partitions on the disk we can
    create it with the following commands:

`sudo fdisk /dev/sdX`\
`n`\
`1`\
`p`\
`1`\
`[enter]`\
`[enter]`\
`t`\
`83`\
`w`

-   Now we can format our partition with:

`mkfs.ext3  /dev/sdX1`

Please note the 1 at the end.

-   Now we are going to get the UUID of the device using:

`sudo blkid /dev/sdX1`

record the UUID value

## Moving images folder to new storage {#moving_images_folder_to_new_storage}

-   Move and recreate the image directory with:

`sudo mv /images /images1`\
`sudo mkdir /images`

-   Now we want to setup /etc/fstab to make sure the device gets mount
    during boot up.

`sudo nano /etc/fstab`

or

`sudo gedit /etc/fstab`

-   Add the following line to the bottom

`UUID=XXXXXXXXXXXXXXXXXXXXXX    /images      ext3 defaults 0 0`

-   Mount it with:

`sudo mount -a`

-   Check that is mounted with:

`mount`

-   Copy your images back to your new directory

`sudo cp -Rf /images1/* /images/`

-   Change permissions with:

`suco chown -R fog /images`\
`sudo chmod -R 755 /images`\
`sudo chmod -R 777 /images/dev`

If you want to just add capacity to your images directory, you could
instead mount your new device as a subfolder of the /images directory.
In this case your wouldn\'t need to move the original directory to
/images1, and your fstab line would look like:

`UUID=XXXXXXXXXXXXXXXXXXXXXX    /images/newdisk      ext3 defaults 0 0`
