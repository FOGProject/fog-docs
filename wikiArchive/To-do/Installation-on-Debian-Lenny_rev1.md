<figure>
<img src="debian_logo.png" title="5|link=http://www.debian.org/" />
<figcaption>5|link=<a
href="http://www.debian.org/">http://www.debian.org/</a></figcaption>
</figure>

## 4-24-2012: These instructions have been updated to work with Debian Squeeze 6.0.4 {#these_instructions_have_been_updated_to_work_with_debian_squeeze_6.0.4}

Basically use the Ubuntu instructions except for:

1.  Do not install the additional languages as the required packages
    aren\'t available in Lenny, at least by default.
2.  If you want clamav to work you need to do the following:
    [Clamav](Clamav "wikilink").

## Download and Running of Installation Script {#download_and_running_of_installation_script}

-   You will find the latest \"Stable\" release of FOG here
    **[sourceforge](http://sourceforge.net/projects/freeghost/files/latest/download?source=files)**
-   You can also update to the latest \"Beta\". Please see
    [Upgrade_to_trunk](Upgrade_to_trunk "wikilink")

**FOR EXAMPLE:**

      cd /opt/
      http://downloads.sourceforge.net/project/freeghost/FOG/fog_0.32/fog_0.32.tar.gz
      tar -xvzf fog_0.32.tar.gz
      cd fog_0.32/bin/
      ./installfog.sh 
      nano /etc/php5/apache2/php.ini

You will be prompted for the Linux distro you are installing, enter
**2** and press **enter**.

You will be prompted for the installation mode, either N (Normal Server)
or S(Storage Server). If you are not sure which option to select, use N
for Normal Installation. (Version 0.24 and up)

The installer will ask you for the IP address of the server, then press
**enter**.

The installer will ask if you would like to enter a router address for
DHCP, if you would like to press **y** and press **enter**, then enter
the address, then press **enter**.

The installer will ask if you would like to enter a DNS address for DHCP
and the boot image, if you would like to press **y** and press
**enter**, then enter the address, then press **enter**.

You would then be prompted if you would like to change the default
interface from eth0, if you would like press **y**, press **enter** and
add the interface (if you are unsure, select **n**).

`Would you like to use the FOG server for dhcp service? [Y/n]`\
\
`DHCP will not be setup but you must setup your`\
\
`current DHCP server to use FOG for pxe services.`\
\
`On a Linux DHCP server you must set:`\
\
`next-server`\
\
`On a Windows DHCP server you must set:`\
\
`option 066 & 067`\
\
`FOG now has everything it needs to setup your server, but please`\
`understand that this script will overwrite any setting you may`\
`have setup for services like DHCP, apache, pxe, tftp, and NFS.`\
\
`It is not recommended that you install this on a production system`\
`as this script modifies many of your system settings.`\
\
`This script should be run by the root user on Fedora, or with sudo on Ubuntu.`\
\
`Here are the settings FOG will use:`\
`        Distro: Ubuntu`\
`        Server IP Address: 192.168.0.150`\
`        DHCP router Address: 192.168.0.1`\
`        DHCP DNS Address: 192.168.0.150`\
`        Interface: eth0`\
`        Using FOG DHCP: 0`

Are you sure you wish to continue (Y/N) Y

<figure>
<img src="Installf9.jpg" title="Installf9.jpg" />
<figcaption>Installf9.jpg</figcaption>
</figure>

During the installation you may be prompted to set a MySQL root
password, leave this blank unless you wish to edit the FOG config.php
files before the next step (by using sudo vi in the terminal, see file
locations below).

/opt/fog/service/etc/config.php **and** /var/www/fog/commons/config.php

Both of these have to be edited with the MySQL password if you set one,
for Fog to function properly. Also, add **root** under MYSQL_USERNAME if
it is missing.

Look for the message: **Setup complete!** If this message is not
displayed, the script has failed before all configurations were written.
Fix any problems and re-run the script until it completes successfully.

After the installation has completed open Firefox again and enter the
URL: <http://%5Byouripaddress%5D/fog/management>. You will then be
prompted to install the database schema. Click on the **Install/Update
Now** button.

I had to run \*\*chown -R fog:root /images\*\*

**Update:** In recent versions of Debian Squeeze (tested on 6.0.4) you
must change the TFTP_DIRECTORY path located in /etc/default/tftpd-hpa
from \"/srv/tftp\" to \"/tftpboot\", or you can just symlink /tftpboot
to /srv/tftp. *If you don\'t your client computers will fail to PXE boot
because they will not be able to find pxelinux.0!*

## Debian Squeeze 6.0 Modifications TO-DO {#debian_squeeze_6.0_modifications_to_do}

*pardon my english cuz i\'m froggy-frenchy \| Kenny432*

If you want a fresh installation of FOG-Project 0.30 on your fresh
Debian Squeeze 6.0 you\'d better do this

-   Do not install the \"additional languages pack\" because it\'s not
    in Squeeze, so to that question, **answer N**
-   The DHCP Server on Debian Squeeze is no more **dhcp3-server** but
    **isc-dhcp-server**. It changes the following things :
    -   the config file for isc-dhcp-server is now /etc/dhcp/dhcpd.conf
    -   the install script has to be modified like so :

For : **/opt/fog/lib/ubuntu/functions.sh**

-   l.353 & l.354 replace with the following
    -   /etc/init.d/isc-dhcp-server stop \>/dev/null 2\>&1;
    -   /etc/init.d/isc-dhcp-server start \>/dev/null 2\>&1;

For : **/opt/fog/lib/ubuntu/config.sh**

-   -   l.24 : replace **dhcp3-server** by **isc-dhcp-server**
    -   l.27 : replace the line with : dhcpname=\"isc-dhcp-server\";
    -   l.46 : replace the line with :
        dhcpconfig=\"/etc/dhcp/dhcpd.conf\";

#### DHCPD Config File {#dhcpd_config_file}

This is a short example for a simple dhcpd.conf created by FOG

` # DHCP Server Configuration file.`\
` # see /usr/share/doc/dhcp*/dhcpd.conf.sample`\
` # This file was created by FOG`\
` use-host-decl-names on;`\
` ddns-update-style interim;`\
` ignore client-updates;`\
` next-server 192.168.1.42;`\
` `\
` subnet 192.168.1.0 netmask 255.255.255.0 {`\
`         option subnet-mask              255.255.255.0;`\
`         range dynamic-bootp 192.168.1.70 192.168.1.79;`\
`         default-lease-time 21600;`\
`         max-lease-time 43200;`\
`         option domain-name-servers      192.168.1.100;`\
`         option routers      192.168.1.1;`\
`         filename "pxelinux.0";`\
` }`

Now it should install fine. I\'ll complete it if I have other troubles
with the installation. Enjoy !

#### Tweak for Wheezy {#tweak_for_wheezy}

Wheezy ships with a new version of php. The tweaks may or may not help.

<http://community.spiceworks.com/topic/286962-can-t-get-fog-to-create-a-task>

nano /var/www/fog/management/includes/tasks.confirm.include.php

Search for: &\$tmp

Replace with: \$tmp

Replace All

Also see <http://fogproject.org/forum/threads/php-5-4-fog-0-32.3921/>

nano /var/www/fog/management/lib/Group.class.php

if ( \$host-\>startTask(\$conn, \$tasktype, \$blShutdown, \$port,
\$mcId, null, null, null, &\$ireason) )

should be replaced by

if ( \$host-\>startTask(\$conn, \$tasktype, \$blShutdown, \$port,
\$mcId, null, null, null, \$ireason) )

Here is another potential solution:
<http://www.debian-fr.org/fog-0-32-wheezy-ou-debian-7-t43401.html>
