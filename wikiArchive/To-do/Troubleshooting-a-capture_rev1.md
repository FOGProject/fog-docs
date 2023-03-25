### Troubleshooting a capture {#troubleshooting_a_capture}

To make this process easier, we are going to use an Windows XP image.
**Note that this process has not been tested on Windows 7.** Please also
note that this process will change your partitions on the client
computer. This tutorial assumes that your disk is /dev/sda1.

1.  In the management portal, start a debug task for the client computer
    in question. Allow the client to boot and at the bash prompt type
    the following commands.
2.  mkdir /images
3.  mount -o nolock x.x.x.x:/images/dev /images (where x.x.x.x is the
    server ip)
4.  cd /images
5.  dd if=/dev/sda of=/mbr.backup count=1 bs=512
6.  /usr/local/sbin/ntfsresize -f -i -P /dev/sda1\
    Look for *You might resize* you will need this number, so write it
    down. We will call this number *NTFSSize*.
7.  Take NTFSSize and divide it by 1000
8.  Now add 300000 to that number and write down as **N**
9.  Now take NTFSSize again and multiply it by 1.1 and then round that
    to the nearest whole number and write it down as **F**
10. /usr/local/sbin/ntfsresize -f -n -s **N**k /dev/sda1\
    (where N is the value calculated above with a k after it.
11. If the test above ends successfully then run:\
    /usr/local/sbin/ntfsresize -f -s **N**k /dev/sda1
12. fdisk /dev/sda
13. Press \"d\", then Enter
14. Press \"w\", then Enter
15. fdisk /dev/sda
16. Press \"n\", then Enter
17. Press \"p\", then Enter
18. Press \"1\", then Enter
19. Press \"1\", then Enter
20. Press \"+**F**K\", then Enter (where F is the value calculated
    above; K must be capital)
21. Press \"t\", then Enter
22. Press \"7\", then Enter
23. Press \"a\", then Enter
24. Press \"1\", then Enter
25. Press \"w\", then Enter
26. partprobe
27. /usr/local/sbin/partimage save /dev/sda1 /images/dev/\[somefile\]
    \--volume=9900000000 -z1 -o -d -f3 -b
28. dd if=/mbr.backup of=/dev/sda
29. Press \"w\", then Enter
30. partprobe
31. /usr/local/sbin/ntfsresize /dev/sda1 -f -b -P
32. mv /images/dev/\[somefile\] /images/\[somefile\]
