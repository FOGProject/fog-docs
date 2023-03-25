`<font color="red">`{=html}Note:`</font>`{=html} This article is older
(year 2009), and has only had it\'s terminology updated to reflect
current FOG terminology.

For this server several things have to be done to FOG for image capture
and image deploy to work

-   Kernel 2.6.29 (included in FOG .26) apparently has a bug in its tg3
    driver. See [tg3](tg3 "wikilink") for details on the kernel to
    downgrade back to

```{=html}
<!-- -->
```
-   On image deploy, I had to edit FOG\'s init.gz (see [Modifying the
    Init Image](Modifying_the_Init_Image "wikilink") for details) and
    add a \"-m\" option to the deploy section where partimage is called
    (edit bin/fog and scroll down towards the end of the script).\
    For some reason, when the R200 PXE boots, it mounts the PXE
    filsystem root (init.gz) on /dev/sdb3, but also the drives to image
    to appear as /dev/sdb and /dev/sdc. Partimage thinks that the
    filesystem it\'s about to drop an image on is already mounted.
    Adding \'-m\' tells Partimage to not care if the filesystem is
    already mounted.

After these two tweaks I am able to image and deploy to about 20 R200
servers (running CentOS and RHEL version 5.3)
