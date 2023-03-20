`<font color="red">`{=html}Note:`</font>`{=html} This is an older
article that has *only* had terminology updated to reflect newer fog
versions terminology.

When I capture an image I get the error \"\...extended record
needed\...\" / \"ERROR: Extended record needed (1056 \> 1024), not yet
supported! Please try to free less space.\" How do I fix it?

First of all, \"Please try to free less space\" is a misleading message
it actually should read something like \"Please try to free up more
contiguous free space.\"

The root cause of this problem is files that are flagged as unmovable,
typically the windows swap file. Defragging the hard disk typically will
fix the problem.

This error comes from
[ntfsresize](http://en.wikipedia.org/wiki/Ntfsresize). It appears that
ntfsresize cannot move more than 1024 file fragments. This is a known
limitation to ntfsresize. This limitation seems to be triggered
particularly by partitions that are badly fragmented.

ref.
<http://forum.linux-ntfs.org/viewtopic.php?t=255&highlight=extended+record+needed>

Increasing UPLOADRESIZEPCT may increase the target size ntfsresize uses
(see the section at the bottom) may solve the problem in some cases, but
it is unlikely to solve most cases.

Possible solutions: Reduce fragmentation and compress the data on the
partition. You may run defrag a number of times, and/or delete badly
fragmented files. Some helpful tips:-

-   Turn off system restore
-   Delete the swap file
-   do a chkdsk /F
-   Then defrag the disk
-   Now turn the swap file back on and system restore.

or

-   Try Defraggler <http://www.defraggler.com/> This will help you move
    files that are flagged as unmovable in Windows.

or

-   Use non-resizeable images.
-   Use ntfsresize manually to compress the partition to a useable size.
-   Harrass NTFS-Utils to add extended record functionality, and include
    that in FOG.

In the release of 0.08 we have added a new configuration value to the
fog management portal called:

**UPLOADRESIZEPCT**

The default value for this setting is 5, which means when FOG resizes
your Windows Partition for capture it will add 5% to the size of the
data on your drive to account for files that cannot be moved. In most
cases this setting is fine, but if you get the error mention above, you
most likely will need to change this setting to 10 or 12. After changing
the setting and saving the file, you will need to cancel the current
capture task for this host, and then recreate it.

------------------------------------------------------------------------

One Users feedback:-

On user writes:- \"I booted GPARTED and manually resized the partition
down to the size reported in the error from FOG. In my case, I attempted
to upload an image, and noted the size reported as \'New volume size\'
(\~9 lines above \'ERROR: \...\'). Then in the GPARTED live CD, I
manually ran ntfsresize with decreasing sizes until I was able to get to
the size reported from FOG. Deleting fragmented files, and defragmenting
was only partially helpful.\"
