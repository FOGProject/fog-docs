Note: I am just beginning this page\... 17 June 2010. This will be
mostly a copy of the [Installation on Fedora
8](Installation_on_Fedora_8 "wikilink") page, updated to match FEDORA
13.

## Fedora 13 {#fedora_13}

### Overview

-   Note \* Please understand that this tutorial will have you destroy
    all data on your hard disk.

**Fedora** is a Free Linux based operating system. This installation
guide assumes that you have a basic understanding of the Linux command
line environment, with using commands like ls, cp, mkdir.

If you wish to use a large storage device to store your images, like a
raid array or separate hard disk, it should be mounted during
installation as /images.

### Known Issues {#known_issues}

After you are done installing FOG you are going to need to update / edit
a few settings in Fedora before the server is fully working and usable.
Please see the links below for configuration changes that will need to
take place.

-   TFTP password issues
    [1](http://www.fogproject.org/wiki/images/c/cc/TFTP_password_issues.png)
-   Storage group password issues
    [2](http://www.fogproject.org/wiki/images/8/83/Storage_node_password_issues.png)
-   PXE boot menu password issues
    [3](http://www.fogproject.org/wiki/images/2/2c/PXE_boot_menu_password_issues.png)

### Installing Fedora {#installing_fedora}

The first thing to do is download and burn an ISO image of Fedora 8 or
later from <http://fedoraproject.org/>. You may use either the 32 or 64
bit versions, both have been reported to work without issue.

Next boot off the CD / DVD you just created to start the Fedora
installation process. (We do not recommend that you attempt to install
the OS that will be running FOG in a VM environment, as many users have
reported performance related issues!)

Note: I am just beginning this page\... 17 June 2010. This will be
mostly a copy of the [Installation on Fedora
8](Installation_on_Fedora_8 "wikilink") page, updated to match FEDORA
13.
