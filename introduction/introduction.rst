-----------
What is FOG
-----------

FOG is a Linux-based, free and open source computer imaging solution for various versions of Windows (XP, Vista, 7, 8/8.1, 10), Linux and Mac OS X. It ties together a few open source tools with a PHP-based web interface. 

FOG doesn't use any boot disks, or CDs; everything is done via TFTP and PXE. Your PCs boot via PXE and automatically downloads a small linux client doing all the hard work of imaging your machine.

Also with FOG many network drivers are built into the client's kernel (vanilla linux), so you don't really need to worry about network drivers (unless there isn't kernel support for it yet).

FOG also supports putting an image that came from a computer with a 80GB partition onto a machine with a 40GB hard drive as long as the data is less than 40GB.

FOG supports multi-casting, meaning that you can image many PCs from the same stream. So it should be as fast whether you are imaging 1 PC or 20 PCs.


Features
========

FOG is more than just an imaging solution, FOG has grown into an imaging/cloning and network management solution.

- PXE boot environment (DHCP, iPXE, TFTP, fast HTTP download of big boot files like kernel and initrd)
- Imaging of Windows (XP, Vista, 7, 8/8.1, 10), Linux and Mac OS X
- Partitions, full disk, multiple disks, resizable, raw
- Snapins to install software and run jobs/scripts on the clients
- Printer management
- Change hostname and join domain
- Track user access on computers, automatic log off and shutdown on idle timeouts
- Anti-Virus
- Disk wiping
- Restore deleted files
- Bad blocks scan

How to run FOG
==============

FOG is best implemented on a dedicated server, any spare machine you have. We recommend that you have sufficient hard drive space. Using a RAID array allows imaging multiple computers simultaneously without much performance degradation.

A gigabit network card is recommended. For faster image compression and decompression, provide as much processor and RAM as you can make available.

How much does FOG cost?
=======================

FOG is an Open Source project and licensed under the GPL which means that you are free to use FOG on as many computers as you like for free. This also means that if you want to make any changes to the source code you are free to do so.

The creators of FOG make no profits from this project with the exception of donations. FOG comes with absolutely NO WARRANTY and the creators of FOG are in NO WAY RESPONSIBLE FOR ANY DAMAGE OR LOSS CAUSED BY FOG! Please see the license file included with the FOG release for more information. With that being said we attempt to do a very good job of supporting our users, in fact it is one of the goals of FOG to have better support than most commercial products. All support requests should be placed through the FOG's forum which is located at: https://forums.fogproject.org/

Thanks for supporting open source software and enjoy!

Background
==========
Working in an educational environment our organization's techs very often re-imaged computers in their day to day activities. For a long time we used a commercial product that in many ways didn't meet our needs. It wasn't web based, and you needed to create driver disks, floppys or USB drives. Other things were very difficult, such as searching for a host by MAC address; and the product was expensive, even with an educational discount.

So we started to investigate ways in which we could do things better, and as our organization struggled to make a commercial product work better by trying to pxe boot dos, and testing it in Windows PE, we, the FOG Team started to build linux based solution on our own time.

We finally got a working version and decided to release it as open source since we use many other open source products, and figured we should give back to the community.
