## Overview

An existing network is assumed to have DHCP and DNS services already
functioning on separate server(s), as well as full Internet
connectivity. No changes will be required on existing infrastructure.
Also network operation will not be affected. The only inconvenience is
that in order to image computer one had to know it\'s MAC address.

**Note:** The FOG installation makes several queries to resources on the
Internet. The server must be connected to the Internet during the
initial installation.

## Installation

1.  Install the base OS
2.  Connect to the Internet and update the base OS
3.  [Install FOG](FOGUserGuide#Installing_FOG "wikilink")
    1.  `What type of installation would you like to do? [N] n`\
        Choose Normal. Read the on-screen explanation for details.

    2.  `What is the IP address to be used by this FOG Server? [current address]`**`192.168.1.1`**\
        Your server\'s current Internet address is displayed. It is
        better to use static IP address

    3.  `Would you like to setup a router address for the DHCP server? [Y/n] n`\
        No.

    4.  `Would you like to setup a DNS address for the DHCP server and client boot image? [Y/n] n`\
        No.

    5.  `Would you like to change the default network interface from eth0?`\
        `: If you are not sure, select No. [y/N] n`\
        This would allow us to keep one network card connected to the
        Internet, and use a second network card for the internal private
        network. This is beyond the scope of this guide.

    6.  `Would you like to use the FOG server for dhcp service? [Y/n] Y`\
        Yes. This allows clients to get IP addresses on the network and
        connect to the FOG server.

    7.  `This version of FOG has internationalization support, would you like to install the additional language packs? [Y/n]`\
        Choose Yes if you\'d like to install additional languages

    8.    #####################################################################

              FOG now has everything it needs to setup your server, but please
              understand that this script will overwrite any setting you may
              have setup for services like DHCP, apache, pxe, tftp, and NFS.
              
              It is not recommended that you install this on a production system
              as this script modifies many of your system settings.

              This script should be run by the root user on Fedora, or with sudo on Ubuntu.

              Here are the settings FOG will use:
                     Distro: Ubuntu
                     Installation Type: Normal Server
                     Server IP Address: X.X.X.X (your IP address)
                     DHCP router Address: 
                     DHCP DNS Address: 
                     Interface: eth0
                     Using FOG DHCP: 1
                     Internationalization: 1

              Are you sure you wish to continue (Y/N) y

        If it all looks good, enter Y

    9.    Installation Started...

              Installing required packages, if this fails
              make sure you have an active internet connection.

              * Preparing apt-get
              * Installing package: apache2
            ...
            ...
            ...

        The install continues\...\
        The following message is displayed:

              * Installing package: mysql-server

                 We are about to install MySQL Server on 
                 this server, if MySQL isn't installed already
                 you will be prompted for a root password.  If
                 you don't leave it blank you will need to change
                 it in the config.php file located at:
                 
                 /var/www/fog/commons/config.php

                 Press enter to acknowledge this message.

        Just press enter a couple times.

    10. `Send notification? (Y/N)y`\

        :   

            :   `* Thank you, sending notification...`\

        In one person\'s experience, this step freezes more often than
        not. If you choose Yes and it takes longer than a few seconds,
        it is likely frozen. Here is a solution:
        [Thank_you,\_sending_notification](Thank_you,_sending_notification "wikilink")

    ```{=html}
    <!-- -->
    ```
        Done



          Setup complete!

          You still need to install/update your database schema.
          This can be done by opening a web browser and going to:

              http://192.168.1.5/fog/management

              Default User:
                     Username: fog
                     Password: password

        $

```{=html}
<li>
```
Immediately stop Fog\'s DHCP server not to affect the network

```{=html}
</li>
```
```{=html}
<li>
```
Edit Fog\'s dhcpd.conf the following way:

    # DHCP Server Configuration file.
    # see /usr/share/doc/dhcp*/dhcpd.conf.sample
    # This file was created by FOG
    use-host-decl-names on;
    ddns-update-style interim;
    ignore client-updates;
    # Fog's IP address:
    next-server 172.16.23.195; 

    # Subnet where you are going to use Fog
    subnet 172.16.23.0 netmask 255.255.255.0 {
            option subnet-mask              255.255.255.0;
            default-lease-time 21600;
            max-lease-time 43200;
    }

    # This machine will receive DHCP offer from Fog's DHCP
    host optiplex990_1 {
            hardware ethernet 78:2B:CB:CC:CC:CC;
            fixed-address 172.16.23.251;
            option host-name "test1";
            filename "pxelinux.0";
            #Default router (if needed)
            option routers      172.16.23.1;
    }

```{=html}
<li>
```
Start Fog\'s dhcpd server

```{=html}
</li>
```
```{=html}
<li>
```
Ensure that only machine which MAC address were entered to dhcpd.conf
can receive DHCP offer from Fog server

```{=html}
</li>
```
```{=html}
<li>
```
If you want to add another machine edit dhcpd.conf and add the new host
section:\

    host NewHost {
            hardware ethernet 78:2B:CB:CC:CC:1F;
            fixed-address 172.16.23.252;
            option host-name "test2";
            filename "pxelinux.0";
            #Default router (if needed)
            option routers      172.16.23.1;
    }

```{=html}
</li>
```
```{=html}
</ol>
```
## Updating config files for non-empty MySQL root password {#updating_config_files_for_non_empty_mysql_root_password}

```{=mediawiki}
{{Updating config files for non-empty MySQL root password}}
```
