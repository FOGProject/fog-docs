### Troubleshooting Driver Issues {#troubleshooting_driver_issues}

#### Method 1 {#method_1}

The first step to troubleshooting driver related issues with FOG clients
is to download a live CD such as Fedora, or Ubuntu. Boot up the CD and
see if the device that wasn\'t functional under FOG is working with the
live CD.

If it is we just need to know the kernel driver name. This can be listed
by issuing the following command:

`lspci -k`

The output will look something like this:

`...`\
`03:00.0 Ethernet controller: Broadcom Corporation NetXtreme BCM5754 Gigabit Ethernet PCI Express (rev 02)`\
`       Kernel driver in use: tg3`\
`       Kernel modules: tg3`\
`...`

In this case we know the driver required in the **tg3** driver for
network. You can either submit a request to the forum/feature requests
section of sourceforge for this driver to be included, or see the
section on building a kernel.

#### Method 2 {#method_2}

[Video
Tutorial](http://freeghost.sourceforge.net/videotutorials/kernel.swf.html)

The first step to troubleshooting driver related issues with FOG clients
is to download a live CD such as Fedora, or Ubuntu. Boot up the CD and
see if the device that wasn\'t functional under FOG is working with the
live CD. If it is then:

1.  Go to <http://cateee.net/sources/lkddb/>
2.  Download the latest version of lkddb.list.bz2
3.  Go to <http://cateee.net/sources/autokernconf/>
4.  Download the latest version of autokernconf
5.  Copy both files to a directory and extract them
6.  Copy lkddb.list, kdetect.sh, and autokernconf.sh to a common
    directory
7.  cd to the common directory where the three files listed above are
    located.
8.  run ./kdetect.sh
9.  run ./autokernconf.sh
10. Then post the contents of the auto.config to the [FOG
    Forum](http://sourceforge.net/forum/?group_id=201099), along with
    the model of computer or the device you are having issues with. It
    would also be helpful to post a link to the manufactures spec page
    for that device.
11. If a driver exists for this device we will attempt to post an
    updated kernel to the **kernel updates** section of the FOG
    Management portal.
