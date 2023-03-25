## Overview

The physical layout of this type of installation is a server (or robust
desktop), a high-speed multi-port switch, a handful of Ethernet cables,
and of course your target machines.\
\
Note: The FOG installation makes several queries to resources on the
Internet. The server must be connected to the Internet during the
initial installation. In the example below, we are removing that
connectivity after installation. This will break a few built-in features
such as ClamAV updating.\
\
== Installation ==

1.  Install the base OS
2.  Connect to the Internet and update the base OS
3.  [Install FOG](FOGUserGuide#Installing_FOG "wikilink")
    1.  `What type of installation would you like to do? [N] n`\
        Choose Normal. Read the on-screen explanation for details.

    \
4.  `What is the IP address to be used by this FOG Server? [current address]`**`192.168.1.1`**\
    Your server\'s current Internet address is displayed. When FOG is
    installed we will be disconnecting from the Internet and defining
    our own private IP address. Enter your future static IP private
    address: 192.168.1.1

\

```{=html}
<li>
```
`Would you like to setup a router address for the DHCP server? [Y/n] n`\
No. A router is not part of this simple isolated network.

```{=html}
</li>
```
\

```{=html}
<li>
```
`Would you like to setup a DNS address for the DHCP server and client boot image? [Y/n] n`\
No. Also unnecessary in this simple network

```{=html}
</li>
```
\

```{=html}
<li>
```
`Would you like to change the default network interface from eth0?`\
`: If you are not sure, select No. [y/N] n`\
This would allow us to keep one network card connected to the Internet,
and use a second network card for the internal private network. This is
beyond the scope of this simple guide.

```{=html}
</li>
```
\

```{=html}
<li>
```
`Would you like to use the FOG server for dhcp service? [Y/n] Y`\
Yes. This allows clients to get IP addresses on our private network and
connect to the FOG server.

```{=html}
</li>
```
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
             Server IP Address: 192.168.1.1
             DHCP router Address: 
             DHCP DNS Address: 
             Interface: eth0
             Using FOG DHCP: 1
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

Just press enter a couple times. We will not be setting a MySQL password
since this is your own private network.

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
    Done



      Setup complete!

      You still need to install/update your database schema.
      This can be done by opening a web browser and going to:

          http://192.168.1.1/fog/management

          Default User:
                 Username: fog
                 Password: password

    $

```{=html}
</ol>
```
## Updating config files for non-empty MySQL root password {#updating_config_files_for_non_empty_mysql_root_password}

```{=mediawiki}
{{Updating_config_files_for_non-empty_MySQL_root_password}}
```
