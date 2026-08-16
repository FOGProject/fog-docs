---
title: Le fichier .fogsettings
description: Détails sur le fichier spécial .fogsettings, qui configure les installations et mises à niveau futures et contient des informations générales de configuration de FOG
context_id: install-fogsettings
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

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/server/install-fogsettings).

# Le fichier .fogsettings

Les réglages de bas niveau utilisés pendant l'installation, ainsi que certains
réglages qui ne peuvent tout simplement pas être stockés en base de données,
figurent dans le fichier /opt/fog/.fogsettings.

Ce fichier contient la définition des variables utilisées par l'installeur lors
des mises à niveau et des installations.

## Exemple de fichier .fogsettings

Un exemple de fichier .fogsettings :

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

## Options du fichier .fogsettings

### En-tête

Ne fournit que quelques informations simples destinées aux utilisateurs.
N'effectue aucune action, se contente de renseigner. :

    ## Start of FOG Settings
    ## Created by the FOG Installer
    ## Version: 7625
    ## Install time: Sat 14 May 2016 08:05:18 PM EDT

### Pied de fichier

N'effectue aucune action, indique simplement où s'arrêtent les variables par
défaut de FOG. Tout nouvel élément se place en dessous, et vous pouvez y ajouter
vos propres variables. Vous pouvez d'ailleurs ajouter des variables où vous le
souhaitez. :

    ## End of FOG Settings

### Adresse IP

Définit l'adresse IP du nœud ou du serveur. Elle sert également, sur les
serveurs, à construire le fichier default.ipxe. :

    ipaddress='192.168.1.5'

### Interface

Définit simplement l'interface du nœud de stockage ou du serveur telle qu'elle
sera enregistrée en base de données. Elle servait autrefois aux configurations
multicast et au graphique de bande passante. Elle n'est désormais utilisée que
pour le graphique de bande passante, puisque l'adresse IP est de toute façon
déjà connue. Les tâches multicast peuvent déterminer leur propre interface au
lieu de dépendre d'une saisie de l'utilisateur. :

    interface='eth0'

### Nom d'utilisateur

Cette variable est l'utilisateur Linux configuré sur le serveur. Elle permet à
un utilisateur de se connecter au serveur ou au nœud sous ce nom via Linux. Son
objectif concerne plus spécifiquement l'usage du FTP. :

    username='fog'

### Mot de passe

Il s'agit du mot de passe de l'utilisateur Linux fog. Il est généré aléatoirement
si la valeur n'est pas déjà définie. Chaque mise à jour réinitialise le mot de
passe à ce qui figure dans ce champ. Si vous avez prédéfini un utilisateur fog et
qu'il s'agit d'une première installation, vous devriez créer le fichier
/opt/fog/.fogsettings. N'y ajoutez que le champ du mot de passe, afin de garantir
qu'il ne soit pas modifié par accident. :

    password='Some!random_Password\here0918358'

### Identifiant de système d'exploitation

Il s'agit de l'identifiant du système d'exploitation utilisé pendant
l'installation. La valeur est numérique.

Les valeurs valides sont : 1. Basé sur Redhat. 2. Basé sur Debian. 3. Arch :

    osid='2'

### Nom du système d'exploitation

Il s'agit du nom du système d'exploitation tel qu'il est installé. :

    osname='Debian'

### Adresse DNS

Utilisée pour la configuration DHCP. :

    dnsaddress='192.168.1.5'

### dnsbootimage

Plus utilisée. Son rôle initial venait de ce que FOS (Fog Operating System \--
init.xz/init_32.xz/init.gz) n'obtenait pas dynamiquement l'adresse DNS par DHCP,
le DHCP n'étant pas appelé. :

    dnsbootimage='192.168.1.5'

### Masque de sous-réseau

Définit le masque de sous-réseau à utiliser si le système doit servir de serveur
DHCP. Il reprend par défaut le masque de sous-réseau de l'interface utilisée,
mais peut être modifié ensuite si vous le jugez utile. :

    submask='255.255.255.0'

### Adresse du routeur

Définit l'adresse du routeur à utiliser si le système doit servir de serveur
DHCP. Elle ne contient actuellement qu'une adresse IP, mais contenait autrefois
toute la chaîne de configuration DHCP. Cette chaîne a été supprimée car elle ne
fonctionnait qu'avec isc-dhcp-server, alors que certains utilisent dnsmasq ou un
autre serveur DHCP. :

    routeraddress='192.168.1.1'

### Routeur simple

Très proche des éléments d'adresse de routeur ci-dessus, mais peut servir à
rediriger vers un autre routeur ou commutateur que le principal. ::
plainrouter='192.168.1.1'

### dodhcp

Indique simplement si nous voulons que FOG installe le DHCP. :

    dodhcp='N'

### bldhcp

Plus ou moins la même chose que dodhcp :

    bldhcp='0'

### dhcpd

Définit le paquet à installer comme serveur DHCP. :

    dhcpd='isc-dhcp-server'

### startrange

::

:   startrange=''

### endrange

    endrange=''

### bootfilename

    bootfilename='undionly.kpxe'

### NFS

Définit si l'installeur doit reconstruire les exports à chaque fois. La valeur 0
garantit que le fichier exports de NFS n'est pas reconstruit. La valeur 1 met le
fichier exports à jour. :

    blexports='1'

### Type d'installation

Indique simplement à l'installeur s'il s'agit d'un serveur complet ou d'un nœud.
Pour un nœud, la valeur est S. Pour un serveur complet, la valeur est N. :

    installtype='N'

### Utilisateur MySQL

Il s'agit du nom d'utilisateur employé pour se connecter à la base de données.
Une valeur vide revient par défaut à se connecter en tant que root. :

    snmysqluser=''

Mot de passe MySQL : il s'agit du mot de passe employé pour se connecter à la
base de données. :

    snmysqlpass=''

### Hôte MySQL

Il s'agit de l'hôte auquel se connecter pour la base de données. Une valeur vide
revient par défaut à localhost/127.0.0.1. :

    snmysqlhost=''

### Langue

Des paquets de langue peuvent être installés pour le système d'exploitation. Cela
permet des traductions plus adaptées des informations. :

    installlang='0'

### Donate

« Donate » est un nom un peu étrange pour ce réglage. Il ne transfère pas
d'argent : c'est un autre mécanisme, qui indique au serveur s'il doit autoriser
le minage de bitcoins pendant les phases d'imagerie. Le don peut être désactivé
plus tard, et cette valeur n'a alors plus d'effet lors des mises à jour. Elle ne
sert qu'à définir le réglage lors d'une installation neuve. :

    donate='0'

### Stockage des images

Définit l'emplacement de stockage des images. Il s'agit simplement d'une chaîne
indiquant le chemin de vos images. :

    storageLocation='/images'

### Mise à jour

Définit si le fichier de mise à jour est chargé. La valeur 1 est celle définie
après une installation neuve. Lors du chargement du fichier .fogsettings, cette
valeur est contrôlée et indique au système d'effectuer une mise à jour. Si elle
ne vaut pas 1 ou si la variable est absente, une saisie est demandée à
l'utilisateur (sauf si vous utilisez l'argument -y). :

    fogupdateloaded=1

### docroot

Cette valeur indique à httpd où se trouve la racine des documents de l'interface
graphique. Par exemple, lorsque vous allez sur <http://127.0.0.1/>, la racine des
documents désigne l'emplacement, sur le serveur, où sont cherchés les fichiers à
présenter à l'utilisateur. :

    docroot='/var/www/html/'

### webroot

Cette valeur indique à FOG où se trouve la racine web. La racine web est le
chemin permettant d'atteindre l'interface graphique de FOG. Si la valeur est
simplement « / », vous accédez à l'interface de FOG par le lien
<http://127.0.0.1/>. Si c'est « fog/ », vous y accédez par
<http://127.0.0.1/fog/>. :

    webroot='fog/'

### caCreated

    caCreated='yes'

### packages

Liste tous les paquets à installer.

Exemple pour Debian 9 au 1er août 2018. Cela nécessite l'installation du dépôt
Remi (que l'installeur de FOG met en place pour vous). :

    packages='apache2 bc build-essential cpp curl g++ gawk gcc genisoimage gzip htmldoc isolinux lftp libapache2-mod-php7.0 libc6 libcurl3 liblzma-dev m4 mysql-client mysql-server net-tools nfs-kernel-server openssh-server php7.0 php7.0-bcmath php7.0-cli php7.0-curl php7.0-fpm php7.0-gd php7.0-json php7.0-mbstring php7.0-mcrypt php7.0-mysql php7.0-mysqlnd php-gettext sysv-rc-conf tar tftpd-hpa tftp-hpa unzip vsftpd wget xinetd zlib1g'

Exemple pour CentOS 7 au 1er août 2018. Ces paquets nécessitent le dépôt EPEL
(que l'installeur de FOG met en place pour vous). :

    packages='bc curl gcc gcc-c++ genisoimage gzip httpd lftp m4 make mod_ssl mtools mysql mysql-server net-tools nfs-utils php php-bcmath php-cli php-common php-fpm php-gd php-ldap php-mbstring php-mcrypt php-mysqlnd php-process syslinux tar tftp-server unzip vsftpd wget xinetd xz-devel'

### noTftpBuild

    noTftpBuild=''

### nopxedefaultfile

    notpxedefaultfile=''

### sslpath

    sslpath='/opt/fog/snapins/ssl/'

### backupPath

    backupPath='/home/'
