----------------
Image Management
----------------

.. === Images ===

.. *Image objects in FOG are the representation of the physical files that contain the disk or partition images that are saved on the FOG server.

.. ==== Creating Images Objects ====

.. *Image objects in FOG are created in the Images section of the FOG management portal.  To create a new image click on the "New Image" button on the left hand menu.  An image object requires a name and a image file path.  

.. *When creating images you have a few choices in how you want that image to 'act'.  The possible partition types include:
..  Single Disk - Resizable
..  Multiple Partition Image - Single Disk (Not Resizable)
..  Multiple Partition Image - All Disks (Not Resizable)
..  Raw Image (Sector By Sector, DD, Slow)

.. *'''Single Disk - Resizable'''

.. This is the detault choice used by FOG as it works in most cases and allows for deployment to smaller size disks as well. It takes a copy of every partition on the disk, and resizes partitions that has excessive free space to a smaller size where possible. Each resizable partition will go through a "Resizing filesystem" process for each partition that is to be resized. This process can take some time depending on how severe disk fragmentation is. The partitions that are shrank will be shrunk down to only 2GB of free space on their partition. This allows an image taken from a 6TB drive with only 20GB of used space to be deployable to a drive with a total capacity of 25GB roughly. When the partitions are laid onto the destination drive, all resized partitions are intelligently expanded to utilize the entire drive.

.. *'''Multiple Partition Image - Single Disk (Not Resizable)'''

.. If you don't need to deploy to a smaller size disk you might consider using this image type as it's less likely to cause an issue and image size on the server is still as small as with resizable image type. Single Disk will back up all the supported partitions on the first disk drive detected by FOG, but the partitions are NOT resized by FOG. This means that the image must be restored to a disk of the same or larger capacity. It is possible to backup NTFS drives with vendor specific 'restore' partitions with this type of image. As well it is possible to capture Linux systems with this type of image given the following criteria:
..  1.) There is a Grub boot loader present.
..  2.) LVM is not used.
..  3.) The partitions include '''ext2''', '''ext3''', '''ext4''', '''reiserfs''', and/or '''swap'''.
..  4.) The swap partition should be moved out of the extended partition

.. *'''Multiple Partition Image - All Disks (Not Resizable)'''

.. This is what you should pick when you want all partitions from multiple disks to be captured. The partitions are NOT resizable by FOG. If you only wanted a particular partition captured or drive captured in a multi-drive system, you can define the disk or partition you want within a "Single Disk - Resizable" or "Multiple Partition Image - Single Disk (Not Resizable)" type image. This is done through the host's "General" area, in the "Host Primary Disk" field.

.. *'''Raw Image (Sector By Sector, DD, Slow)'''

.. This should always be the last resort. This takes an absolute exact copy of an entire disk and does not compress the data. If you take an image from a 6TB disk, the resultant image will be 6TB in size. This image type also takes a '''significant''' amount of time to capture and deploy.

.. '''All of these images can be deployed using multi-cast or unicast to clients.'''

.. ==== Adding Existing Image Objects ====

.. *To restore an image to the FOG database:
.. *# Create a new Image definition through the management browser
.. *# Specify image name (SampleXPImage)
.. *# Specify storage group (default)
.. *# Specify image file path (SampleXPImage)
.. *# Specify image type
.. *# Log into the box hosting FOG, and move/rename your image to match browser input
.. *# Create hierarchy if necessary. FOG, by default, puts images in /images/, so for the above example, you would need to create a folder  structure like so: /images/SampleXPImage
.. *# Drop your image file into the folder (be sure it's named the same as image name above)

.. ----