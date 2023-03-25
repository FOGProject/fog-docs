Yes, you just need to set the Operating System to \"Windows XP\" in the
OS dropdown and Image Type is \"Multi Partition Image-All Disks
(Not-Resizable)\" selection must required while creating a new image
from taking a image of a server. I have been tested on Dell PowerEdge
1950 with 3 drives (SAS, SCSI, with RAID-0, RAID-1 and RAID-5, OS-
Windows 2008 R2 of Standard and Enterprise versions. (Tested by Suresh.
K, Toronto, ON)

I ran some tests with Windows 2008 R2 SP1 created on an Optiplex 755.
After patching the image and installing the FOG client I sysprepped the
machine and uploaded the image 3 different times to the FOG server with
3 different configurations, 2 of which I have verified work. The 3
configurations are as follows:

2k8R2 setup with no system partition, Windows 7 Host OS setup with
multiple partition in FOG - verified working

2k8R2 setup with a 100MB system partition on install setup in FOG as
Windows 7 host OS with a single partition (resizeable) - verified
working

2k8R2 setup with a 100MB system partition on install, setup in FOG as
Windows XP host OS with multiple partition - error cannot have partition
outside disk (will test again w/o system partition)

2k8R2 setup w/no 100MB system partition on install, setup in FOG as
Windows XP host OS w/multiple partition - verified working

These were all tested on a ESXi 5.0 server. To make these work I had to
setup each VM to use an IDE drive, not SCSI. I noticed that when using
SCSI, FOG could not find the hard drive. (Tested by Eric M., Beaverton,
OR)
