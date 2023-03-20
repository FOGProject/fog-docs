## What this tutorial teaches {#what_this_tutorial_teaches}

-   How to turn your FOG server into a Macintosh Netboot server as well

## What this tutorial does not teach {#what_this_tutorial_does_not_teach}

-   How to create images with NetRestore or Deploy Studio
-   How to use NetRestore or Deploy Studio to image Macintosh\'s

## Getting Started {#getting_started}

Netboot is Apple\'s way of booting into a network. This how-to will
teach how to change your FOG server to add support for Macintosh\'s
through Netboot.

When FOG is installed on your machine, all of the services required for
Netboot are installed. Other than creating the image, all the user has
to do is create some directories and edit a couple files.

-   First, run these commands:

` mkdir -p /disk/0/NetBoot/NetBootSP0`\
` mkdir /nbi`\
` mkdir -p /tftpboot/macnbi-ppc`\
` mkdir -p /tftpboot/macnbi-i386`\
` printf "\n/disk/0/NetBoot   *(async,ro,no_root_squash,insecure)" >> /etc/exports`\
` printf "\n/nbi              *(async,rw,no_root_squash,insecure)\n" >> /etc/exports`

-   Now, you need to move the images you\'re going to use over to your
    FOG server. Creating a Macintosh image is out of this article\'s
    scope, so it is assumed you already have the boot image and
    Macintosh image created.
-   DeployStudio settings assumes you have a working DeployStudio
    server, and have used it to create a master image and runtime
    netboot set

```{=html}
<!-- -->
```
-   Make sure you have the following files:

` booter`\
` mach.macosx`\
` mach.macosx.mkext`

If you happen to have deleted these files, probably by accident, on your
Mac, you may turn to Mac-how.net to find out [how to recover deleted
files mac](http://www.mac-how.net/)

Note - files below depend on environment.

`NetInstall-Restore.dmg `\
`OR`\
`DeployStudioRuntime.sparseimage`

-   NetInstall-Restore.dmg is the program that grabs the image from the
    FOG server and images the Macintosh.

```{=html}
<!-- -->
```
-   DeployStudioRuntime.sparseimage loads a boot environment for
    DeployStudio. This file, and the 3 files above can be found in the
    NetBootSP0/`<runtime>`{=html}.nbi folder on the DeployStudio server.
    The 3 boot files needed from above are located in the i386 folder.

```{=html}
<!-- -->
```
-   If you are using PowerPC Macintosh\'s, copy booter, mach.macosx, and
    mach.macosx.mkext to /tftpboot/macnbi-ppc.

` cp booter mach.macosx mach.macosx.mkext /tftpboot/macnbi-ppc`

-   If you are using Intel Macintosh\'s, copy booter, mach.macosx, and
    mach.macosx.mkext to /tftpboot/macnbi-i386.

` cp booter mach.macosx mach.macosx.mkext /tftpboot/macnbi-i386`

-   Copy mach.macosx and mach.macosx.mkext to /disk/0/NetBoot/NetBootSP0

` cp mach.macosx mach.macosx.mkext /disk/0/NetBoot/NetBootSP0`

-   Copy NetInstall-Restore.dmg and the OSX image to /nbi

` cp NetInstall-Restore.dmg MacOSX-3-9.dmg /nbi`

OR

-   Copy DeployStudioRuntime.sparseimage to /nbi or see dhcpd.conf for
    nfs mounting on DeployStudio Server

` cp DeployStudioRuntime.sparseimage /nbi`

-   Now add the following lines to your dhcpd.conf (located in
    /etc/dhcp3 on Ubuntu):

```{=html}
<!-- -->
```
      #Be sure to add authoritative or some G5's will not work.  All G4's will work without authoritative.
      authoritative;
      
      #For PowerPC Mac's
      class "AppleNBI-ppc" {
        match if substring (option vendor-class-identifier, 0, 13) = "AAPLBSDPC/ppc";
        option dhcp-parameter-request-list 1,3,6,12,15,17,43,53,54,60;
      
        filename "macnbi-ppc/booter";
        option vendor-class-identifier "AAPLBSDPC";
     
        if (option dhcp-message-type = 1) {
          option vendor-encapsulated-options 08:04:81:00:00:09;
        }
        elsif (option dhcp-message-type = 8) {
          option vendor-encapsulated-options 01:01:02:08:04:81:00:00:09;
        }
        else {
          option vendor-encapsulated-options 00:01:02:03:04:05:06:07;
        }
      
        #Replace 192.168.1.1 with the server's actual IP address.
        option root-path "nfs:192.168.1.1:/nbi:NetInstall-Restore.dmg";
      }
      
      #For Intel Mac's
      class "AppleNBI-i386" {
        match if substring (option vendor-class-identifier, 0, 14) = "AAPLBSDPC/i386";
        option dhcp-parameter-request-list 1,3,17,43,60;
      
        if (option dhcp-message-type = 1) { option vendor-class-identifier "AAPLBSDPC/i386"; }
        if (option dhcp-message-type = 1) { option vendor-encapsulated-options 08:04:81:00:00:67; }
      
        filename "macnbi-i386/booter";
      
        #Replace 192.168.1.1 with the server's actual IP address.
        #Need clarification if NetRestore works for both Intel and PowerPC
        #For DeployStudio, either copy DeployStudioRuntime.sparseimage to /nbi, or use nfs share to connect to deploy studio server
        #option root-path "nfs:<deploystudio_ip>:/Volumes/<volume_label>/Library/NetBoot/NetBootSP0:<runtime_folder>/DeployStudioRuntime.sparseimage";
           
           #option root-path "nfs:192.168.1.1:/nbi:DeployStudioRuntime.sparseimage";
            option root-path "nfs:192.168.1.1:/nbi:NetInstall-Restore.dmg";
      }

Restart the DHCP and NFS daemons. Hold down the N key to have your
Macintosh netboot.

## Known issues {#known_issues}

-   Please add any issues found with NetRestore or Deploy Studio.

## Software known to work {#software_known_to_work}

-   NetRestore 2.0.1
-   Deploy Studio V1.0rc20

## Additional information and links {#additional_information_and_links}

-   A more generic article on getting Linux to support
    Netboot[1](https://www.math.ohio-state.edu/oldwiki/administration/macosx/netboot/bsdp_with_isc_dhcp)
-   Information about
    Netboot[2](http://www.bombich.com/mactips/bootpd.html)
-   Deploy Studio[3](http://www.deploystudio.com/Home.html)
