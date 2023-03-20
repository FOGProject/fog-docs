Yes, you can use VMWare or VirtualBox for a FOG client or a FOG server!
=)

It is recommend that you use the i386 desktop version of Linux when
installing the Fog server on VMWare. When installing on a virtual system
please make sure to set the NIC on the virtual graphics card to bridged,
or have a dedicated 3rd party NIC for booting to PXE.

You can also use ESXi 5.0 to host VM\'s imaged by FOG. Please note that
you will need to set the hard drive on the VM to use an IDE drive
instead of SCSI. When using FOG to image to a SCSI drive it will give an
error stating it cannot find the drive. When you set the drive to IDE it
will recognize the drive and work. For the FOG VM you can use a SCSI
drive and there will be no issues. (Tested by Eric M. Beaverton, OR)

**Update**

As stated above you will need to set the hard drive on the VM to use an
IDE drive instead of SCSI when using the default boot kernel that is
supplied when installing FOG

To build a custom kernel that will support VMWare SCSI drives see the
below links for the build process of creating a custom kernel:

[Building a custom
kernel](http://www.fogproject.org/wiki/index.php?title=Building_a_Custom_Kernel)

when at the \'kernel configuration tool\' on the left hand side, Under
**Device Drivers** then **SCSI Device Support** select **SCSI low-level
drivers** then tick **VMware PCSCSI device support** from the right
side.

<figure>
<img src="add_scsi_support.png" title="add_scsi_support.png" />
<figcaption>add_scsi_support.png</figcaption>
</figure>

Once you have selected this you can save your changes and continue the
Building a custom kernel guide
