---
title: Add & Extend a 2nd Virtual HDD
description: Describes attaching a second disk to a Fog server and making it usable to the server 
aliases:
    - Add & Extend a 2nd Virtual HDD
    - Add and Extend a 2nd Virtual HDD
tags:
  - in-progress
  - convert-Wiki2MD
  - linux
  - disks
---

# Add & Extend a 2nd Virtual HDD

[](https://wiki.fogproject.org/wiki/index.php?title=Add_%26_Extend_a_2nd_Virtual_HDD#mw-head)[](https://wiki.fogproject.org/wiki/index.php?title=Add_%26_Extend_a_2nd_Virtual_HDD#p-search)

First of all if you have your FOG server running in a virtual machine these steps will be easy since you will need to create a new (additional) virtual disk and attach it to your virtual machine. This will create two hard drives attached to your FOG server. If you have a physical FOG server you will need to had a second physical hard drive to make this work.

(the rest of this will assume you have FOG running on a virtual machine) With that second hard drive (vmdk) added to your FOG server run the following command

	lsblk
	
	NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
	sda      8:0    0 298.1G  0 disk 
	├─sda1   8:1    0 294.3G  0 part /
	├─sda2   8:2    0     1K  0 part 
	└─sda5   8:5    0   3.8G  0 part [SWAP]
	sdb      9:0    0 100.0G  0 disk 

As you can see above there are now 2 hard drives attached to this FOG server. There is /dev/sda that’s about 300G and /dev/sdb that is 100GB in size.

We are going to take that 100GB (new) vmdk file and put a partition and file system on it and then finally mount it on a temp location so we can copy the files in /images to it and off the root file system (which is currently 100% full).

We know that the new disk is /dev/sdb so use fdisk to create a new partition on the blank disk. If you have questions about fdisk google it.

	fdisk /dev/sdb
	Create a <n>ew
	<p>artition
	numbere <1>
	<default>
	<default>
	<w>rite the changes to disk
	<q>uit fdisk

Next we need to format the new partition with our linux file system.

	mkfs.ext4 /dev/sdb1

With the new disk formatted we need to connect it to our really full FOG server. If your fog server is 100% full you may have a problem with the next command you may need to find and delete an unwanted log file from somewhere to make a little room to create a new directory.

For this step we will create a mount point to connect our new hard drive to

	mkdir /mnt/test

Now we’ll attach our new disk to that mount point

	mount -t ext4 /dev/sdb1 /mnt/test

If you run the lsblk command again you should now see that sdb has a partition sdb1 (note this instruction probably should appear before the we formatted the file system just for the flow of the document).

The command df -h will show both the root file system and the new hard drive mounted on the /mnt/test mount point.

Now we need to move the host image files from the /images directory onto our new empty hard drive.

	mv /images/* /mnt/test

After a bit of churning your host image files will be moved to the new disk.

After all of your image files are safely on the new disk we need to un-mount the current mount point and remount the new disk over the /images directory.

  
We need to unmount the new hard drive from the /mnt/test mount mount point with this command

	umount /mnt/test

Run the df -h command to ensure that sdb1 has been unmounted.

Then clean up the test folder (not needed anymore) with

	rmdir /mnt/test

Now we need to mount our new hard drive over the /images folder. We can do this with the following command

	mount -t ext4 /dev/sdb1 /images

Change to the /images folder and you should see all of your host image files.

At this point we are almost done. If we were to reboot the FOG server this manual mount command would not be active after the reboot. So lets make this change permanent.

You will need to edit the fstab in /etc Insert the following line info fstab at the bottom.

Edit /etc/fstab:

	vi /etc/fstab

Instructions on using Vi: [Vi](https://wiki.fogproject.org/wiki/index.php?title=Vi "Vi")

	/dev/sdb1    /images    ext4    defaults    0    1

Now lets unmount the images folder with all of the host image files.

	umount /images

If you show the files in the /images folder it should be blank.

	ls -la /images

Now lets mount the /images folder again using the following command

	mount -a

Use the df -h command to show that we’ve mounted /dev/sdb1 on /images.

Reboot your fog server and use the df command to make sure your images are remounted over the /images folder.

I would recommend that you create this new disk on its own VMDK without any additional partitions. Because there are some Linux magic tricks we can do to grow this new disk if we ever run out of space in out /images folder again. Understand this time we will not crash the FOG server since all of our images are NOT on the root partition that the OS uses.

**These next steps should only be taken by a seasoned Linux professional**, because there is a risk that if done wrong you can **loose all of your host images**. I’m not going to give all of the steps because if you are a linux professional you will know what to do. So step one and two of this next part is make a full system backup and make a second full system backup.

The next step is to go into your Hyper-visor and expand the VMDK file we created earlier. I’m not going to give the steps to do this since each hypervisor is different.

Now you should have a larger vmdk file with all of your image at the beginning of the disk with all of the new space at the end of the disk (beyond the current extent of partition 1)

Use fdisk on the drive fdisk /dev/sdb1

press p to display the disk. You should see something like this:

Disk /dev/sdb: 320 GB (or what ever size you extended your vmdk file to)

When you are sure you are on the correct drive (note this next part is a bit nerve wracking) we are going to use fdisk to delete the partition and recreate it with the additional space. The keys to doing this right is to NOT change the starting block of the partition and to ALWAYS make the ending block larger than it is currently. If you fail to do this... well that is why you have two sets of backups. delete partition 1, write the changes to disk and exit fdisk.

Go right back into fdisk with fdisk /dev/sdb

Create a new partition 1 with the same start block that we just deleted and choose the default value for the end block. This should default to the end of the VMDK that we extended earlier. Write the changes to disk and then exit fdisk.

The next thing we need to check is to see if we broke the file system in any way. Run the following command to check the file system.

	e2fsck -f /dev/sdb1

If everything is still OK with the file system then we can extend it to the partition size with resize2fs /dev/sdb1

Now we just need to remount the expanded disk onto the /images mount point with the mount -a command.

---

The above method dealt with adding a new disk using the traditional partitions. Most linux distributions today use LVM to manage the disks. With LVM one could create a new vmdk, create a partiton on it, add it to the volume group, and then extend the logical volume to the new size, and then run the resize2fs command and be done with it.

But that really doesn’t fix the issue in that the /images and /opt/fog/snapins are still mounted on the root file system. All the above will do is delay the OS getting whacked for some period of more time. The right answer is to create a new disk/partition LVM or physical and then use the mount point method outlined below to mount the new disk over the /images directory. This way we are sure that the OS will never fill up with captured host images.
