## Overview

An existing network is assumed to have DHCP and DNS services already
functioning on separate server(s), as well as full Internet
connectivity. Changes will have to be made on the DHCP server to forward
PXE traffic to the FOG server. See [Modifying existing DHCP server to
work with
FOG](Modifying_existing_DHCP_server_to_work_with_FOG "wikilink") for
assistance with this setting.

**Note:** The FOG installation makes several queries to resources on the
Internet. The server must be connected to the Internet during the
initial installation.

## Installation

1.  Install the base OS and set a static IP address for this server
2.  Connect to the Internet and update the base OS
3.  [Install FOG](FOGUserGuide#Installing_FOG "wikilink")
    1.  `What type of installation would you like to do? [N] n`\
        Choose Normal. Read the on-screen explanation for details.

    \
4.  `What is the IP address to be used by this FOG Server? [current address]`\
    Your server\'s current Internet address is pre-filled. Just press
    enter to accept it.

\

```{=html}
<li>
```
`Would you like to setup a router address for the DHCP server? [Y/n] Y`\
We assumed there is already exists a DHCP server, so choose yes.

```{=html}
</li>
```
\

```{=html}
<LI>
```
`What is the IP address to be used for the router on the DHCP server? [preFilled?] type.your.DHCP.address`\
Enter the IP address of your network\'s DHCP server. FOG may have filled
this in automatically.

```{=html}
</li>
```
\

```{=html}
<li>
```
`Would you like to setup a DNS address for the DHCP server and client boot image? [Y/n] y`\
Enter the IP address of your network\'s DNS server. FOG may have filled
this in automatically.

```{=html}
</li>
```
\

```{=html}
<li>
```
`What is the IP address to be used for DNS on the DHCP server and client boot image? [preFilled?] type.your.DNS.address`\
Enter the IP address of your network\'s DHCP server. FOG may have filled
this in automatically.

```{=html}
</li>
```
\

```{=html}
<li>
```
`Would you like to change the default network interface from eth0?`\
`: If you are not sure, select No. [y/N] n` This would allow us to have
multiple network cards. This is beyond the scope of this simple guide.

```{=html}
</li>
```
\

```{=html}
<li>
```
`Would you like to use the FOG server for dhcp service? [Y/n] n`\
No. DHCP addresses will be provided by the infrastructure\'s DHCP
server. Having multiple DHCP servers on a single network causes a race
condition for the clients, and potentially conflicting IP addresses if
they are issuing out addresses within the same range.

```{=html}
</li>
```
\

      DHCP will not be setup but you must setup your
      current DHCP server to use FOG for pxe services.

      On a Linux DHCP server you must set:
          next-server

      On a Windows DHCP server you must set:
          option 066 & 067

Noted. Be sure to work with the DHCP admins to get PXE services
forwarding to your FOG server. See [Modifying existing DHCP server to
work with
FOG](FOGUserGuide#Modifying_existing_DHCP_server_to_work_with_FOG "wikilink")
for assistance with this.

```{=html}
</li>
```
\
\

```{=html}
<li>
```
`This version of FOG has internationalization support, would you like to install the additional language packs? [Y/n]`\
Choose Yes if you\'d like to install additional languages

```{=html}
</li>
```
\

```{=html}
<li>
```
      #####################################################################

      FOG now has everything it needs to setup your server, but please
      understand that this script will overwrite any setting you may
      have setup for services like DHCP, apache, pxe, tftp, and NFS.
      
      It is not recommended that you install this on a production system
      as this script modifies many of your system settings.

      This script should be run by the root user on Fedora, or with sudo on Ubuntu.

      Here are the settings FOG will use:
             Distro: Ubuntu
             Installation Type: Normal Server
             Server IP Address: your.FOG.server.address
             DHCP router Address: your.DHCP.address
             DHCP DNS Address: your.DNS.address
             Interface: eth0
             Using FOG DHCP: 0
             Internationalization: 1

      Are you sure you wish to continue (Y/N) y

If it all looks good, enter Y

```{=html}
</li>
```
\

```{=html}
<li>
```
      Installation Started...

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

```{=html}
</li>
```
```{=html}
<li>
```
Choose a root password for your MySQL service. Take note of the file
name above as it will have to be edited post-install.

```{=html}
</li>
```
\

```{=html}
<li>
```
`Send notification? (Y/N)y`\

:   

    :   `* Thank you, sending notification...`\

In one person\'s experience, this step freezes more often than not. If
you choose Yes and it takes longer than a few seconds, it is likely
frozen. Here is a solution:
[Thank_you,\_sending_notification](Thank_you,_sending_notification "wikilink")

```{=html}
</li>
```
\

```{=html}
</ol>
```
The Installation script is complete:

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
</li>
```
```{=html}
</ol>
```
## Updating config files for non-empty MySQL root password {#updating_config_files_for_non_empty_mysql_root_password}

```{=mediawiki}
{{Updating config files for non-empty MySQL root password}}
```
