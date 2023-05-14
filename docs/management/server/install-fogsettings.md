---
title: The .fogsettings file
description: Details on the special .fogsettings file that configures future installs/upgrades and contains general configuration information of fog
context-id: install-fogsettings-1
aliases:
    - .fogsettings
    - The .fogsettings file
    - Fog Server install settings
tags:
    - install
    - settings
    - security
    - automation
    - updates
    - network-settings
    - management
    - linux
    - server
    - server-management
    - in-progress
    - updating-content
---

# The .fogsettings file

The low-level settings that are used during installation and some
settings that simply cannot be stored in the database are contained in
the /opt/fog/.fogsettings file.

This file contains the setup of variables used within the installer
during upgrades and installs.

## Example .fogsettings file

An example .fogsettings file :

    ## Start of FOG Settings
    ## Created by the FOG Installer
    ## Find more information about this file in the FOG Project wiki:
    ##     https://wiki.fogproject.org/wiki/index.php?title=.fogsettings
    ## Version: 1.5.4.8
    ## Install time: Wed 01 Aug 2018 06:57:53 PM CDT
    ipaddress='10.0.0.39'
    copybackold='0'
    interface='ens3'
    submask='255.255.255.0'
    routeraddress='10.0.0.1'
    plainrouter='10.0.0.1'
    dnsaddress='208.67.222.222'
    username='fog'
    password='pgyf0wC7N1Gl7RmkNuG0uNKPnM8KYYn28phazwnrwQs='
    osid='2'
    osname='Debian'
    dodhcp='N'
    bldhcp='0'
    dhcpd=''
    blexports='1'
    installtype='N'
    snmysqluser='root'
    snmysqlpass=''
    snmysqlhost='localhost'
    installlang='0'
    storageLocation='/images'
    fogupdateloaded=1
    docroot='/var/www/'
    webroot='/fog/'
    caCreated='yes'
    httpproto='http'
    startrange=''
    endrange=''
    bootfilename='undionly.kpxe'
    packages='apache2 bc build-essential cpp curl g++ gawk gcc genisoimage gzip htmldoc isolinux lftp libapache2-mod-php7.0 libc6 libcurl3 liblzma-dev m4 mysql-client mysql-server net-tools nfs-kernel-server openssh-server php7.0 php7.0-bcmath php7.0-cli php7.0-curl php7.0-fpm php7.0-gd php7.0-json php7.0-mbstring php7.0-mcrypt php7.0-mysql php-gettext sysv-rc-conf tar tftpd-hpa tftp-hpa unzip vsftpd wget xinetd zlib1g '
    noTftpBuild=''
    notpxedefaultfile=''
    sslpath='/opt/fog/snapins/ssl/'
    backupPath='/home/'
    php_ver='7.0'
    php_verAdds='-7.0'
    sslprivkey='/opt/fog/snapins/ssl//.srvprivate.key'
    ## End of FOG Settings

## .fogsettings file options

### Header

Only gives some simplistic information to help users. Does no actions
just gives some information. :

    ## Start of FOG Settings
    ## Created by the FOG Installer
    ## Version: 7625
    ## Install time: Sat 14 May 2016 08:05:18 PM EDT

### Footer

Does no actions, just tells where FOG's default variables are setup Any
new items will go below this, and you can add your own variables. You
can add variables wherever you want. :

    ## End of FOG Settings

### IP Address

Defines the IP address of the node/server. This is also used on servers
to setup the default.ipxe file. :

    ipaddress='192.168.1.5'

### Interface

This just sets the storage nodes/server interface as it will be stored
in the Database. This used to be used for multicast setups and for the
bandwidth graph. This is now setup so it is only used on the bandwidth
graph as we already know the ip address anyway. Multicast tasks can get
their own interface instead of relying on user entry. :

    interface='eth0'

### Username

This variable is the user setup for the linux user on the server. This
allows a user to login to the server/node under this username through
linux. The purpose of this is more specifically setup for FTP usage. :

    username='fog'

### Password

This is the linux fog user password. It is randomly generated if the
value is not already defined. Every update will reset the password to
what is in this field. You should, if you predefined a fog user and the
installation is the first time, create the /opt/fog/.fogsettings file.
Only add the password field to ensure your password doesn't get changed
accidentally. :

    password='Some!random_Password\here0918358'

### OS Identifier

This is the OS identifier used during the installation. The value is
numeric.

Valid Values are: 1. Redhat based. 2. Debian based. 3. Arch :

    osid='2'

### OS Name

This is the name of the OS as it's being installed. :

    osname='Debian'

### DNS Address

Used for DHCP setup. :

    dnsaddress='192.168.1.5'

### dnsbootimage

No longer used. It's purpose was originally because the FOS (Fog
Operating System \-- init.xz/init_32.xz/init.gz) did not dynamically get
the dns address from DHCP as dhcp was not called. :

    dnsbootimage='192.168.1.5'

### Subnet Mask

This defines the subnet mask to use if the system is to be used as a
DHCP server. It will assume the subnet mask of the interface being used,
but can be changed later if you see fit. :

    submask='255.255.255.0'

### Router Address

This will setup the router address to use if the system is to be used as
a DHCP server. It currently only sets as an ip address, but in the past
contained the whole dhcp configuration string. The config string was
removed as it would only work on isc-dhcp-server, when some might be
using dnsmasq or another dhcp server. :

    routeraddress='192.168.1.1'

### Plain Router

Very similar to the Router Address elements above, but can be used to
redirect to maybe another router/switch other than the main. ::
plainrouter='192.168.1.1'

### dodhcp

Just tells if we want fog to install dhcp. :

    dodhcp='N'

### bldhcp

Same, more or less, as dodhcp :

    bldhcp='0'

### dhcpd

Defines what package to install for dhcp server. :

    dhcpd='isc-dhcp-server'

### startrange

::

:   startrange=''

### endrange

    endrange=''

### bootfilename

    bootfilename='undionly.kpxe'

### NFS

Defines if the installer should rebuild the exports every time. Setting
to 0 will ensure the exports file for nfs does not get rebuilt. Setting
to 1 will update the exports file. :

    blexports='1'

### Type of installation

Just tells the installer if this is going to be a full server, or a
node. If it's a node, the value will be S. If it's a full server, the
value will be N. :

    installtype='N'

### MySQL User

This is the username to connect to the database as. Blank will default
to connecting as user root. :

    snmysqluser=''

MySQL Password This is the password to connect to the database. :

    snmysqlpass=''

### MySQL Host

This is the host to connect to the database. Blank will default to
localhost/127.0.0.1. :

    snmysqlhost=''

### Language

Language packs for the OS can be installed. This enables more
appropriate translations of information. :

    installlang='0'

### Donate

Donate seems a bit strange a name for this. What it does, however, is
not pass money. It's a different method that tells the server if it's
going to allow mining of bitcoins during the imaging phases. Donation
can be disabled later and this value will have no more effect during
updates. It only operates to define setting during fresh installs. :

    donate='0'

### Image storage

This defines the location for image storage. This is just a string value
to the path of your images location. :

    storageLocation='/images'

### Updating

This defines if the update file is loaded. 1 is the set value after
fresh install. When the .fogsettings file is loaded this value is
checked and tells the system to perform an update. If this isn't 1 or
the variable is not found, it requests "input" from the user (unless
you're running with the -y argument). :

    fogupdateloaded=1

### docroot

This value tells httpd where the document root will be for the GUI. For
example, when you go to <http://127.0.0.1/> The document root is looking
on the server at the docroot location for files to present to the user.
:

    docroot='/var/www/html/'

### webroot

This value tells FOG where the webroot is. Webroot is the link to
actually get to the FOG GUI. If the value is just '/' you would be
accessing the FOG GUI with the link <http://127.0.0.1/>. If it's
'fog/' you are accessing the GUI as <http://127.0.0.1/fog/>. :

    webroot='fog/'

### caCreated

    caCreated='yes'

### packages

Lists all packages that need to be installed

Debian 9 example as of August 1st, 2018. This requires the Remi
repository to be installed (which the fog installer sets up for you). :

    packages='apache2 bc build-essential cpp curl g++ gawk gcc genisoimage gzip htmldoc isolinux lftp libapache2-mod-php7.0 libc6 libcurl3 liblzma-dev m4 mysql-client mysql-server net-tools nfs-kernel-server openssh-server php7.0 php7.0-bcmath php7.0-cli php7.0-curl php7.0-fpm php7.0-gd php7.0-json php7.0-mbstring php7.0-mcrypt php7.0-mysql php7.0-mysqlnd php-gettext sysv-rc-conf tar tftpd-hpa tftp-hpa unzip vsftpd wget xinetd zlib1g'

CentOS 7 example as of August 1st, 2018. These packages require the epel
repository (which the fog installer sets up for you). :

    packages='bc curl gcc gcc-c++ genisoimage gzip httpd lftp m4 make mod_ssl mtools mysql mysql-server net-tools nfs-utils php php-bcmath php-cli php-common php-fpm php-gd php-ldap php-mbstring php-mcrypt php-mysqlnd php-process syslinux tar tftp-server unzip vsftpd wget xinetd xz-devel'

### noTftpBuild

    noTftpBuild=''

### nopxedefaultfile

    notpxedefaultfile=''

### sslpath

    sslpath='/opt/fog/snapins/ssl/'

### backupPath

    backupPath='/home/'
