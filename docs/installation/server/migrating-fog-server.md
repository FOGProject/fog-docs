---
title: Migrating FOG Server
description: Instructions for migrating 
aliases:
    - Migrating FOG Server
    - FOG Server Migration
    - Moving FOG To A New Server
tags:
    - install
    - migrating
    - new-server
    - fogserver
    - git
    - prerequisites
    - install-script
    - configuration
    - database
    - cli-switches
---
# Overview

>[!note]
>Under Construction, doc is being migrated from the wiki and updated with new content

This article explains how to move FOG Settings & images from an old box to a new box. This is more safe and sure than attempting an OS upgrade, which is risky and might leave you with a broken server. It's more safe and more sure because we know exactly what to move over and how to do it. An OS upgrade is risky because if you upgrade and it doesn't work or leaves fog in an unusable state, we have no idea what broke or how to fix it without exhaustive troubleshooting that may or may not lead to a solution. Migrating from an old box to a new box also leaves your old box intact, which is another safety net in this method.

We are going to address the key spots:

-   Building a new server - general guidelines.
-   Migrating the database from the old server to the new one.
-   Migrating the images from the old server to the new one.
-   Migrating SSL information from the old server to the new one.
-   Adjusting a few places in the new web interface after migration to use the new IP.
-   Adjusting your DHCP settings if you aren't running DHCP on the new server.

# Building the new server

The first step in this process is building a new FOG server using the latest version of your chosen Linux distribution. The chosen distribution does not need to be the same as the old server. For example you can go from Ubuntu to CentOS, or from CentOS to Debian, or any other combination. I would recommend the latest Debian release. Go through the normal steps of setting up the OS.

Do not create a user called fog - it will cause you nothing but pain later on. If you're installing Debian or Ubuntu, name the user "tech" or "Administrator" or whatever your first name is, like "Bob". If you're using CentOS or Fedora or RHEL, no extra user is necessary, just set a good root password.

Name the server fogserver if possible. You can name the server during OS installation for most distributions. Ubuntu & Debian explicitly ask you what to name the server. In the installer for CentOS 7, RHEL, and Fedora you would set the server name in the network area, bottom left.

Set a static IP or create a DHCP reservation for the server. You can set a static IP in the installer for Fedora, RHEL, and CentOS in the network area. Ubuntu & Debian only ask for a manual configuration if DHCP fails.

After an IP is set, use your DNS server and create an 'A' record for the server's name and IP, [Google search DNS A record](http://lmgtfy.com/?q=DNS+A+record) if you're unsure how to do that.

To install FOG, follow an appropriate [installation manual](https://wiki.fogproject.org/wiki/index.php?title=Installation#Installation_manuals) or the [Upgrade to trunk](https://wiki.fogproject.org/wiki/index.php?title=Upgrade_to_trunk "Upgrade to trunk") article. The old and new fog servers do not need to be the same version of fog. The only restriction here is that you cannot downgrade. You can go from older to newer, but not from newer to older.

  
CentOS and Fedora have security related settings that need set before installation. For Ubuntu Server or Debian, it would be worth your time to see how to setup your server's partitions optimally via the example configuration videos in their installation manuals, the same applies for RHEL, CentOS, and Fedora. How the partitions are laid out for FOG can make the difference between a healthy server and a crashed server a year from now.

# Migrating images & database

The entire point of migrating is usually saving your host registrations, group configurations, image assignments, and your images. There are a great number of ways to move these, but for inexperienced or beginner Linux users I would recommend leveraging NFS on the new FOG Server.

Related articles:

-   [Migrate images manually](https://wiki.fogproject.org/wiki/index.php?title=Migrate_images_manually "Migrate images manually")

-   [Troubleshoot_MySQL#Manually_export_.2F_import_Fog_database](https://wiki.fogproject.org/wiki/index.php?title=Troubleshoot_MySQL#Manually_export_.2F_import_Fog_database "Troubleshoot MySQL")

Because the new FOG Server provides an NFS share, this is the easiest approach. This method is also uniform across the different distributions. This approach also works whether the old FOG Server's web interface is functional or not.

### Mounting

Via Terminal or SSH on the **old** FOG server, mount the new fog server's /images/dev directory to a local directory on the old server called /new. Where x.x.x.x is the new fog server's IP address.

mkdir /new 
mount x.x.x.x:/images/dev /new

### Export DB

We will export the database and move the export to the new server. This is performed on the **old** FOG Server. There are a few different examples of how to do this below, depending on if you're using a password or not, and how MySQL is configured. One of them will work for you.

#No password.
mysqldump -B fog > /new/fogdb.sql

#Password with root user.
mysqldump -B fog -u root -p > /new/fogdb.sql

#No password, localhost.
mysqldump -B fog -h localhost > /new/fogdb.sql

#No password, local loopback.
mysqldump -B fog -h 127.0.0.1 > /new/fogdb.sql

#Password with localhost.
mysqldump -B fog -h localhost -u root -p > /new/fogdb.sql

#Password with local loopback.
mysqldump -B fog -h 127.0.0.1 -u root -p > /new/fogdb.sql

### Export Images

Now to move over the images. Again, this is performed on the **old** FOG server. The more images you have, the longer the below command will take to execute.

cp -R /images/* /new

### Importing DB

Via Terminal or SSH on the **new** FOG server, we now need to import the database. Assuming you followed the above steps for exporting exactly, one of the below methods will work for you.

#No password.
mysql -D fog < /images/dev/fogdb.sql

#Password with root user.
mysql -D fog -u root -p < /images/dev/fogdb.sql

#No password, localhost.
mysql -D fog -h localhost < /images/dev/fogdb.sql

#No password, local loopback.
mysql -D fog -h 127.0.0.1 < /images/dev/fogdb.sql

#Password with localhost.
mysql -D fog -h localhost -u root -p < /images/dev/fogdb.sql

#Password with local loopback.
mysql -D fog -h 127.0.0.1 -u root -p < /images/dev/fogdb.sql

After the database is successfully imported, you should delete the old file or move it. This is done on the **new** server. Here's the command to delete it:

rm -f /images/dev/fogdb.sql

It's important to note that this step will make the new server's web interface credentials the same as whatever the old server's was. If you don't know what the password is, you can follow steps here to reset the default web interface password: [Password_Central#Web_Interface](https://wiki.fogproject.org/wiki/index.php?title=Password_Central#Web_Interface "Password Central")

### Arranging Images

This step is performed on the **new** FOG server. In this step we're simply moving the images to where they are supposed to be and setting the correct permissions. We are getting rid of the "dev" directory we brought over before the move happens. Also eliminating the new server's "postdownloadscripts" directory before the move. This step assumes that your new server's images directory is in the default location and you followed the above steps for moving them over exactly.

rm -f /images/dev/.mntcheck
rm -rf /images/dev/dev > /dev/null 2>&1
rm -rf /images/postdownloadscripts > /dev/null 2>&1
mv /images/dev/* /images
touch /images/dev/.mntcheck
chown -R fogproject:root /images
chmod -R 777 /images

## If old server was FOG 1.3.0+

Related article: [FOG_Client#Maintain_Control_Of_Hosts_When_Building_New_Server](https://wiki.fogproject.org/wiki/index.php?title=FOG_Client#Maintain_Control_Of_Hosts_When_Building_New_Server "FOG Client")

Because of the security model of FOG 1.3.0+ and the new FOG Client, without the proper CA and ssl certificates present on the new fog server, any currently deployed hosts with the new FOG Client installed will ignore the new server and not accept commands from it. This is by design.

In order to maintain control of existing hosts that have existing new FOG Clients installed or existing images that have the new FOG Client built into them, you must copy this directory from the old server to the new server: /opt/fog/snapins/ssl

  
On the **old** FOG server, copy the ssl directory to the new server.

cp -R /opt/fog/snapins/ssl /new

On the **new** FOG Server, delete the existing ssl directory and then move the old ssl directory to the proper location, and then set permissions.

rm -rf /opt/fog/snapins/ssl
mv /images/dev/ssl /opt/fog/snapins

#Fedora, CentOS, and RHEL users should use this command to set permissions:
chown -R fogproject:apache /opt/fog/snapins/ssl

#Debian, Ubuntu, and Ubuntu variant users should use this command to set permissions:
chown -R fogproject:www-data /opt/fog/snapins/ssl

IMPORTANT: To complete the ssl migration, on the **new** FOG Server, re-run the fog installer that you used for installing fog.

# Fix IP Addresses, Passwords, and Interface on new server

Related articles:

-   [Change FOG Server IP Address](https://wiki.fogproject.org/wiki/index.php?title=Change_FOG_Server_IP_Address "Change FOG Server IP Address")

-   [.fogsettings](https://wiki.fogproject.org/wiki/index.php?title=.fogsettings ".fogsettings")

-   [Password Central](https://wiki.fogproject.org/wiki/index.php?title=Password_Central "Password Central")

-   [Troubleshoot FTP](https://wiki.fogproject.org/wiki/index.php?title=Troubleshoot_FTP "Troubleshoot FTP")

Related tool: [https://github.com/FOGProject/fog-community-scripts/tree/master/updateIP](https://github.com/FOGProject/fog-community-scripts/tree/master/updateIP)

  
Because we have imported the old database into the new server in order to preserve all of the host data, image definitions, group definitions, image assignments, and so on, we also imported all of the old server's IP Addresses and passwords along with it. This can't be helped using the approach we took - which is the approach to take if your web interface on the old server was just completely not working. Because of this, we need to change just a few places in the FOG Web GUI, and change the old FOG Server's IP address to the new FOG Server's IP Address, and update a few passwords.

First, we must find out what the new FOG Password and new interface is. On the **new** FOG Server, run this command and note the outputted lines that begin with password= and interface=

cat /opt/fog/.fogsettings

You'll want to copy/paste the password because of it's length.

Paste the password into the below fields in the **new** FOG Server's web interface:

-   Web Interface -> Storage Management -> [click node name] -> Password and update the Interface field with the new interface name also.
-   Web Interface -> FOG Configuration -> FOG Settings -> TFTP Server -> FOG_TFTP_FTP_PASSWORD

Update the IP Address in the below fields in the **new** FOG Server's web interface:

-   Web Interface -> Storage Management -> [click node name] -> IP Address
-   Web Interface -> FOG Configuration -> FOG Settings -> Web Server -> FOG_WEB_HOST
-   Web Interface -> FOG Configuration -> FOG Settings -> TFTP Server -> FOG_TFTP_HOST

# If FOG isn't doing DHCP

Related articles:

-   [Modifying existing DHCP server to work with FOG](https://wiki.fogproject.org/wiki/index.php?title=Modifying_existing_DHCP_server_to_work_with_FOG "Modifying existing DHCP server to work with FOG")

-   [BIOS and UEFI Co-Existence](https://wiki.fogproject.org/wiki/index.php?title=BIOS_and_UEFI_Co-Existence "BIOS and UEFI Co-Existence")

-   [ProxyDHCP with dnsmasq](https://wiki.fogproject.org/wiki/index.php?title=ProxyDHCP_with_dnsmasq "ProxyDHCP with dnsmasq")

If you have an existing dedicated DHCP server, you'll need to update it. Completing this step will make the new FOG Server "live". You can make the old FOG Server "live" again by rolling back this step.

## Windows Server DHCP

Use Remote Desktop to connect to the DHCP Server. Open the Run Dialog with the hotkeys Windows+R and type dhcpmgmt.msc and press enter or click run. The DHCP Management GUI should open.

Navigate through the left-most menus to IPv4 -> subnet -> Scope Options. Look for options 066 and 067, they should be plainly visible.

Change option 066 from the old FOG Server's IP address to the new FOG Server's IP Address.

Check option 067, if it's set to anything besides undionly.kpxe or undionly.kkpxe then you should change it to one of the previously mentioned values in red.

## Linux / ISC-DHCP

Open Terminal on your DHCP Server, or SSH to the server.

If you're not already root, become root with sudo -i

Use your favorite editor to edit this file: /etc/dhcp/dhcpd.conf

I like to use [Vi](https://wiki.fogproject.org/wiki/index.php?title=Vi "Vi"). Using Vi as your editor:

vi /etc/dhcp/dhcpd.conf

Look for these two lines throughout the document:

-   next-server

-   filename

Change the value of next-server to the new FOG Server's IP Address. If you have just a simple DHCP configuration and filename only appears one time in the configuration, you will likely want this to be set to undionly.kpxe or undionly.kkpxe

After making changes and saving them, restart the DHCP service. On new Linux distributions this can typically be accomplished with:

systemctl restart dhcpd

If you have issues with restarting DHCP, get the full status of it with:

systemctl status dhcpd -l