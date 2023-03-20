    Boot up PC in debug mode

    to view hard drive partition
    #fdisk -l
     
    Disk /dev/sda: 160.0 GB, 160041885696 bytes
    255 heads, 63 sectors/track, 19457 cylinders
    Units = cylinders of 16065 * 512 = 8225280 bytes

       Device  Boot    Start        End          Blocks     Id       System
    /dev/sda1    *         1       20349      156280288+     7       HPFS/NTFS

    Partition table entries are not disk order
     

    to view NIC settings
    #ifconfig
    eth0    Link encap:Ethernet   HWaddr 00:11:22:33:44:55
            inet addr:192.168.1.252  Bcast:192.168.1.255   Mask:255.255.255.0
            UP BROADCAST MULTICAST  MTU:1500  Metric:1
            ....

    lo      Link encap:Local Loopback
            int addr:127.0.0.1  Mask:255.0.0.0
            ....


    If you do not see any /dev/??? or eth0 then you can try FOG Kernel Updates(require internet access).
    WebUI > Other Information > Kernel Updates >Published Kernels
    or
    Building your own Custom Kernel 
    http://www.fogproject.org/wiki/index.php?title=FOGUserGuide&Itemid=51#Building_a_Custom_Kernel
