**Note:** While this article and it\'s contents have technical and
historical significance, it is obsolete and does not *fully* apply to
FOG 1.2.0 and later. Inexperienced users that are new to Linux and FOG
should not use the instructions here. The FOG 1.2.0 and 1.3.0 installer
now offers a storage node installation mode.

For more up-to-date information - please see this:
[Managing_FOG#Storage_Management](Managing_FOG#Storage_Management "wikilink")

## Overview

This article will cover how to extend the functionality of FOG to host
multiple FOG \"nodes\" that are controlled by a central FOG \"master\".
Much of the credit for this can be found on the page [Including multiple
PXE / TFTP servers](Multiple_TFTP_servers "wikilink"). What I\'ve done
is refined this process a bit, and also will cover some additional
techniques for managing the nodes.

Currently I operate 4 \"nodes\" and a single master. Each node is
dedicated to it\'s own building and/or department to allow them to
perform their own imaging without the need to manage a full FOG install.
Where this differs slightly from the previously mentioned article is
that these nodes can both capture and deploy images to their own subnets
or use images from the master server.

This setup has been tested and implemented using FOG-0.30 on CentOS 5.6
both i386 and x86_64 systems.

## FOG Master Role {#fog_master_role}

The master has the following primary functions

-   Web front end to manage FOG
-   Controls all tasks for FOG nodes
-   Provides the necessary PXE boot files and menus
-   Capture and deploy images using DHCP, TFTP, and PXE

## FOG Node Role {#fog_node_role}

The nodes have the following functions

-   Capture and deploy images using DHCP, TFTP, and PXE

# Installing a FOG node {#installing_a_fog_node}

The process for installing a node is identical to the normal install
except for a few minor changes to the install scripts.

In the fog_0.30 folder where the install files were extracted, you need
to modify the **bin/installfog.sh** to add **configureDHCP;** and
**configureTFTPandPXE;** under the \"# Storage Node installation\"
section.

Here is what the resulting list should look like.

                configureUsers;
                configureMinHttpd;
                configureStorage;
                configureNFS;
                configureDHCP;
                configureFTP;
                configureTFTPandPXE;
                configureUDPCast;
                installInitScript;
                installFOGServices;
                configureFOGService;
                sendInstallationNotice;
                writeUpdateFile;

You also need to add the appropriate packages to be installed at
**lib/redhat/config.sh**. On the line **storageNodePackages** add
**tftp-server dhcp**. Adjust this for your distribution.

Here\'s the full line on my install

    storageNodePackages="httpd php php-cli mysql php-mysql nfs-utils vsftpd xinetd tar gzip make m4 gcc gcc-c++ lftp tftp-server dhcp";

# Further Details {#further_details}

This is a work in progress\...more to come.
