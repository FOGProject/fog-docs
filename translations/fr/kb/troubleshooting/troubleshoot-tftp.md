---
title: Dépannage de TFTP
aliases:
    - Troubleshooting TFTP
description: page d'index pour troubleshoot-tftp
context_id: troubleshoot-tftp
tags:
    - in-progress
    - troubleshooting
    - tftp
    - kb
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/troubleshooting/troubleshoot-tftp).

# Dépannage de TFTP

## Les rôles de TFTP dans FOG

TFTP sert à télécharger le fichier de démarrage spécifié par DHCP ou ProxyDHCP. TFTP est très simple et intègre très peu de protections ; en général, la lecture seule est préférable pour les fichiers offerts par TFTP, mais des permissions complètes fonctionnent aussi. Normalement, les fichiers de démarrage de FOG se trouvent dans /tftpboot. En général, TFTP offre [ces fichiers de démarrage](http://fogproject.org/wiki/index.php/Filename_Information).

## Tester TFTP

### Essayer de récupérer un fichier avec Linux

Ceci s'exécute depuis une machine Linux distincte, PAS depuis votre serveur FOG.

Normalement, vous pouvez utiliser votre support d'installation Linux pour démarrer en mode live sur un autre ordinateur.

tftp -v x.x.x.x -m binary -c get undionly.kpxe
Connected to x.x.x.x (x.x.x.x), port 69
getting from x.x.x.x:undionly.kpxe to undionly.kpxe [octet]
Received 89509 bytes in 0.0 seconds [84047115 bit/s]

### Essayer de récupérer un fichier avec Windows

tftp -i x.x.x.x get undionly.kpxe

#### Tester en utilisant Windows

Pour tester depuis Windows, le client TFTP doit être installé et le pare-feu doit autoriser le trafic TFTP. La meilleure façon de garantir que votre pare-feu Windows ne bloque pas TFTP est de le désactiver pendant votre dépannage.

  
**Avec Windows 7 Pro :**

Control Panel -> Programs and Features -> Turn Windows Features on or off -> TFTP Client

[![TFTP Client in Windows.png](https://wiki.fogproject.org/wiki/images/f/f1/TFTP_Client_in_Windows.png)](https://wiki.fogproject.org/wiki/index.php?title=File:TFTP_Client_in_Windows.png)

### FOG 0.32 et versions antérieures

Pour tester TFTP sur 0.32 et les versions antérieures, vous devez essayer de récupérer le fichier pxelinux.0 au lieu de undionly.kpxe. Vous pouvez utiliser les méthodes Linux et Windows ci-dessus, en remplaçant simplement le nom du fichier par pxelinux.0

Par exemple :

**Windows**

tftp –i x.x.x.x get pxelinux.0

**Linux**

tftp -v x.x.x.x -c get pxelinux.0

## Service TFTP

### Fedora 20/21/22/23

status/enable/restart

systemctl status xinetd.service
systemctl enable xinetd.service
systemctl restart xinetd.service

### Ubuntu

systèmes récents :

status/enable/restart

service tftpd-hpa status
service tftpd-hpa restart
service tftpd-hpa enable

systèmes plus anciens :

status/enable/restart

sudo /etc/init.d/xinetd status
sudo /etc/init.d/xinetd restart
sudo /etc/init.d/xinetd enable

## Fichier de configuration TFTP

### Fedora :

Emplacement :

/etc/xinetd.d/tftp

Pour afficher /etc/xinetd.d/tftp :

cat /etc/xinetd.d/tftp

Il devrait ressembler fortement à ceci :

# default: off
# description: The tftp server serves files using the trivial file transfer #   protocol.  
#The tftp protocol is often used to boot diskless workstations, download configuration files to network-aware printers, 
# and to start the installation process for some operating systems.
service tftp
{
        socket_type             = dgram
        protocol                = udp
        wait                    = yes
        user                    = root
        server                  = /usr/sbin/in.tftpd
        server_args             = -s /tftpboot
        disable                 = no
        per_source              = 11
        cps                     = 100 2
        flags                   = IPv4
}

Pour modifier /etc/xinetd.d/tftp :

sudo vi /etc/xinetd.d/tftp

Instructions sur l'utilisation de Vi : [Vi](https://wiki.fogproject.org/wiki/index.php?title=Vi "Vi")

Explication des paramètres de /etc/xinetd.d/tftp :

man xinetd.conf

### Ubuntu :

Emplacement :

/etc/default/tftpd-hpa

Pour afficher /etc/default/tftpd-hpa :

cat /etc/default/tftpd-hpa

Il devrait ressembler fortement à ceci :

# /etc/default/tftpd-hpa
# FOG Modified version
TFTP_USERNAME="root"
TFTP_DIRECTORY="/tfptboot"
TFTP_ADDRESS="0.0.0.0:69"
TFTP_OPTIONS="-s"
#
# Note: TFTP_ADDRESS=":69" is also valid.
# "0.0.0.0:69" means to use any interface while ":69" means to use anything.
# If you are experiencing issues on Ubuntu or Debian with the default configuration,
# Remove the 0.0.0.0 part of this line above in the config.
#

Pour modifier /etc/default/tftpd-hpa :

sudo vi /etc/default/tftpd-hpa

Instructions sur l'utilisation de Vi : [Vi](https://wiki.fogproject.org/wiki/index.php?title=Vi "Vi")

Explication des paramètres de /etc/default/tftpd-hpa :

man tftpd-hpa

## Configuration FOG (interface web)

x.x.x.x/fog/management -> Configuration FOG -> Paramètres de FOG -> TFTP Server ->

Assurez-vous que les paramètres ci-dessous pointent vers un utilisateur Linux local de FOG qui existe réellement. Assurez-vous que le bon mot de passe est fourni. Assurez-vous que l'utilisateur fourni a les permissions sur le répertoire /tftpboot (voir la section permissions).

FOG_TFTP_FTP_USERNAME

FOG_TFTP_FTP_PASSWORD

## Désactiver et vérifier le pare-feu

### Fedora 20/21/22/23

**Désactiver/arrêter le pare-feu**

systemctl disable firewalld.service

systemctl stop firewalld.service

Peut être annulé avec « start » et « enable ».

**Vérifier le pare-feu sous Fedora 20/21/22/23**

systemctl status firewalld.service

### Fedora 16

Ajoutez /bin/bash à /etc/shells, car l'installation de vsftpd via yum ne le fait pas correctement, ce qui provoque le message « tftp timeout »

  

### Debian/Ubuntu

sudo iptables -L

S'il est désactivé, la sortie devrait ressembler à ceci :

Chain INPUT (policy ACCEPT)
target prot opt source destination 

Chain FORWARD (policy ACCEPT)
target prot opt source destination 

Chain OUTPUT (policy ACCEPT)
target prot opt source destination

**Désactiver le pare-feu Ubuntu**

sudo ufw disable

**Désactiver le pare-feu Debian**

iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X
iptables -P INPUT ACCEPT
iptables -P OUTPUT ACCEPT
iptables -P FORWARD ACCEPT

Autres paramètres Debian :

/etc/hosts.deny

Ce paramètre dans le fichier ci-dessus refusera le trafic de toute source sauf locale :

ALL:ALL EXCEPT 127.0.0.1:DENY

Commentez cette ligne comme ceci :

#ALL:ALL EXCEPT 127.0.0.1:DENY

### Windows 7

Start -> Control Panel -> View by "Small icons" -> Windows Firewall -> Turn Windows Firewall On or Off -> désactivez les trois.

### Configurer le pare-feu sous Linux

Pour configurer le pare-feu sous Linux afin de n'autoriser que le nécessaire, veuillez consulter l'article [FOG security](https://wiki.fogproject.org/wiki/index.php?title=FOG_security "FOG security").

  
Il est nécessaire de désactiver le pare-feu Windows lorsque vous utilisez Windows pour les tests. L'image ci-dessous montre la désactivation du pare-feu, ce qui permet au trafic TFTP de passer.

[![TFTP Windows Firewall.png](https://wiki.fogproject.org/wiki/images/3/36/TFTP_Windows_Firewall.png)](https://wiki.fogproject.org/wiki/index.php?title=File:TFTP_Windows_Firewall.png)

## Permissions

Vérifiez les permissions sur le répertoire /tftpboot en utilisant :

ls -laR /tftpboot

Définissez les permissions pour donner à tout le monde un accès complet à /tftpboot et à tout son contenu :

chmod -R 777 /tftpboot

Voir un exemple de permissions ci-dessous :

/tftpboot:
total 3960
drwxr-xr-x   4 fog  root   4096 Apr 29 18:37 .
dr-xr-xr-x. 23 root root   4096 Apr 29 18:37 ..
-rw-r--r--   1 fog  root    840 Apr 29 18:37 boot.txt
-rw-r--r--   1 root root    397 Apr 29 18:37 default.ipxe
drwxr-xr-x   2 fog  root   4096 Apr 29 18:37 i386-efi
-rw-r--r--   1 fog  root 171232 Apr 29 18:37 intel.efi
-rw-r--r--   1 fog  root  89120 Apr 29 18:37 intel.kkpxe
-rw-r--r--   1 fog  root  89168 Apr 29 18:37 intel.kpxe
-rw-r--r--   1 fog  root  89153 Apr 29 18:37 intel.pxe
-rw-r--r--   1 fog  root 890208 Apr 29 18:37 ipxe.efi
-rw-r--r--   1 fog  root 329014 Apr 29 18:37 ipxe.kkpxe
-rw-r--r--   1 fog  root 329062 Apr 29 18:37 ipxe.kpxe
-rw-r--r--   1 fog  root 328438 Apr 29 18:37 ipxe.krn
-rw-r--r--   1 fog  root 329115 Apr 29 18:37 ipxe.pxe
-rw-r--r--   1 fog  root 123448 Apr 29 18:37 ldlinux.c32
-rw-r--r--   1 fog  root  26140 Apr 29 18:37 memdisk
-rw-r--r--   1 fog  root  29208 Apr 29 18:37 menu.c32
-rw-r--r--   1 fog  root  43210 Apr 29 18:37 pxelinux.0
-rw-r--r--   1 fog  root  43210 Apr 29 18:37 pxelinux.0.old
drwxr-xr-x   2 fog  root   4096 Apr 29 18:37 pxelinux.cfg
-rw-r--r--   1 fog  root 170912 Apr 29 18:37 realtek.efi
-rw-r--r--   1 fog  root  90028 Apr 29 18:37 realtek.kkpxe
-rw-r--r--   1 fog  root  90076 Apr 29 18:37 realtek.kpxe
-rw-r--r--   1 fog  root  90105 Apr 29 18:37 realtek.pxe
-rw-r--r--   1 fog  root 170112 Apr 29 18:37 snp.efi
-rw-r--r--   1 fog  root 170272 Apr 29 18:37 snponly.efi
-rw-r--r--   1 fog  root  88763 Apr 29 18:37 undionly.kkpxe
-rw-r--r--   1 fog  root  88811 Apr 29 18:37 undionly.kpxe
-rw-r--r--   1 fog  root  88856 Apr 29 18:37 undionly.pxe
-rw-r--r--   1 fog  root  29728 Apr 29 18:37 vesamenu.c32

/tftpboot/i386-efi:
total 1348
drwxr-xr-x 2 fog root   4096 Apr 29 18:37 .
drwxr-xr-x 4 fog root   4096 Apr 29 18:37 ..
-rw-r--r-- 1 fog root 137280 Apr 29 18:37 intel.efi
-rw-r--r-- 1 fog root 812864 Apr 29 18:37 ipxe.efi
-rw-r--r-- 1 fog root 137664 Apr 29 18:37 realtek.efi
-rw-r--r-- 1 fog root 137088 Apr 29 18:37 snp.efi
-rw-r--r-- 1 fog root 137216 Apr 29 18:37 snponly.efi

/tftpboot/pxelinux.cfg:
total 12
drwxr-xr-x 2 fog root 4096 Apr 29 18:37 .
drwxr-xr-x 4 fog root 4096 Apr 29 18:37 ..
-rw-r--r-- 1 fog root  160 Apr 29 18:37 default

## Vérifier les paramètres du commutateur réseau

Voir [IPXE](https://wiki.fogproject.org/wiki/index.php?title=IPXE "IPXE") pour les paramètres du commutateur réseau concernant STP/portfast/etc.

## Paramètres DHCP

-   Il est important de savoir que les versions 0.32 et antérieures utilisent **pxelinux.0** pour l'option 67 de DHCP
-   Pour toutes les versions de 0.33 à la version actuelle (1.3.0beta), l'utilisation de **undionly.kpxe** est généralement recommandée pour l'option 67.
    -   Les autres fichiers utilisables sont listés dans votre répertoire « /tftpboot »

### Basé sur Linux (ISC-DHCP)

**Articles liés à ISC-DHCP**

[BIOS and UEFI Co-Existence](https://wiki.fogproject.org/wiki/index.php?title=BIOS_and_UEFI_Co-Existence "BIOS and UEFI Co-Existence")

[ProxyDHCP with dnsmasq](https://wiki.fogproject.org/wiki/index.php?title=ProxyDHCP_with_dnsmasq "ProxyDHCP with dnsmasq")

[FOG on a MAC](https://wiki.fogproject.org/wiki/index.php?title=FOG_on_a_MAC "FOG on a MAC")

[Fedora 21 Server#Verify Fedora DHCP config (if_using_DHCP)](https://wiki.fogproject.org/wiki/index.php?title=Fedora_21_Server#Verify_Fedora_DHCP_config_.28if_using_DHCP.29 "Fedora 21 Server")

[Start/stop/enable/disable](http://docs.fedoraproject.org/en-US/Fedora/15/html/Deployment_Guide/sect-dhcp-starting_and_stopping.html)

[Configure DHCP](https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/6/html/Deployment_Guide/s1-dhcp-configuring-server.html)

### FOG dnsmasq (ProxyDHCP)

-   Vous utiliseriez ProxyDHCP si vous n'avez pas accès à votre serveur DHCP, ou si vous utilisez un équipement incapable de spécifier les options 066 et 067 (next server et file name). La méthode ProxyDHCP la plus populaire avec FOG est dnsmasq. Cet article vous guidera :

-   Non requis sauf si vous avez un serveur DHCP non modifiable/

[Using_FOG_with_an_unmodifiable_DHCP_server/_Using_FOG_with_no_DHCP_server](https://wiki.fogproject.org/wiki/index.php?title=Using_FOG_with_an_unmodifiable_DHCP_server/_Using_FOG_with_no_DHCP_server "Using FOG with an unmodifiable DHCP server/ Using FOG with no DHCP server")

## DHCP non-Linux

Si vous n'utilisez pas FOG pour fournir les services DHCP, les sections suivantes donnent quelques indications sur les paramètres des serveurs DHCP sur diverses plateformes.

### DHCP de Windows Server

-   Option 66
    -   [![Windows 66.png](https://wiki.fogproject.org/wiki/images/5/54/Windows_66.png)](https://wiki.fogproject.org/wiki/index.php?title=File:Windows_66.png)
-   Option 67
    -   [![Windows 67.png](https://wiki.fogproject.org/wiki/images/8/8b/Windows_67.png)](https://wiki.fogproject.org/wiki/index.php?title=File:Windows_67.png)

  

### DHCP de serveur Novell (Linux)

-   Vue d'ensemble DHCP depuis la console DNS/DHCP (Netware 6.5)
    -   [![Novelldhcp.gif](https://wiki.fogproject.org/wiki/images/8/8d/Novelldhcp.gif)](https://wiki.fogproject.org/wiki/index.php?title=File:Novelldhcp.gif)
-   Option 66
    -   [![Novelloption66.gif](https://wiki.fogproject.org/wiki/images/8/8c/Novelloption66.gif)](https://wiki.fogproject.org/wiki/index.php?title=File:Novelloption66.gif)
-   Option 67
    -   [![Novelloption67.gif](https://wiki.fogproject.org/wiki/images/3/3c/Novelloption67.gif)](https://wiki.fogproject.org/wiki/index.php?title=File:Novelloption67.gif)

Voici un lien du site web de Novell sur la configuration de leur serveur DHCP : [http://www.novell.com/coolsolutions/feature/17719.html](http://www.novell.com/coolsolutions/feature/17719.html)

### DHCP de serveur MAC

Utilisez l'application OS X Server pour installer et utiliser DHCP.  
  
Utilisez DHCP Option Code Utility pour générer le code nécessaire.  
[https://docs.google.com/uc?id=0BwD4il5Z1G6fTmFFYU91bDNuRmc&export=download](https://docs.google.com/uc?id=0BwD4il5Z1G6fTmFFYU91bDNuRmc&export=download)  
  
Il FAUT générer les codes pour que le démarrage PXE fonctionne !  
bootpd.plist se trouve dans /etc/bootpd.plist  
  

-   Option 66
    -   [![MACOption66.png](https://wiki.fogproject.org/wiki/images/4/41/MACOption66.png)](https://wiki.fogproject.org/wiki/index.php?title=File:MACOption66.png)  
        
-   Option 67
    -   [![MACOption67.png](https://wiki.fogproject.org/wiki/images/6/61/MACOption67.png)](https://wiki.fogproject.org/wiki/index.php?title=File:MACOption67.png)  
        

  

-   Exemple de [bootpd.plist](https://wiki.fogproject.org/wiki/index.php?title=Bootpd.plist "Bootpd.plist")  
    -   Ceci est un fichier d'exemple, NE L'UTILISEZ PAS DANS VOTRE ENVIRONNEMENT !!!! L'application OS X Server générera la majeure partie de ce code pour vous ; ce fichier d'exemple sert à vous montrer l'endroit où le code généré doit être placé.  
        
    -   Pour référence, votre code généré doit être placé entre « dhcp_domain_search » et « dhcp_router »  
        

  

-   Bootpd.plist complété  
    -   [![MACbootpd.png](https://wiki.fogproject.org/wiki/images/b/b7/MACbootpd.png)](https://wiki.fogproject.org/wiki/index.php?title=File:MACbootpd.png)  
        

## Autres configurations DHCP

[Other DHCP Configurations](https://wiki.fogproject.org/wiki/index.php?title=Other_DHCP_Configurations "Other DHCP Configurations")

## Dépannage

En utilisant DHCP ou ProxyDHCP, vous pouvez capturer les paquets envoyés vers et depuis une machine donnée en utilisant TCPDump.

**Examiner les paquets.**

  
Utiliser TCPDump pour capturer tout le trafic entrant et sortant d'une interface sous Linux :

sudo tcpdump -w issue.pcap -i eth0

  
Vous devrez peut-être changer le nom de l'interface dans la commande ci-dessus si votre interface porte un nom différent. Cette commande liste toutes les interfaces disponibles ; choisissez la bonne (pas l'interface de bouclage) :

ip link show

  
Exécutez la commande tcpdump ci-dessus sur la machine FOG, puis démarrez la machine cible distante. Attendez que la machine cible distante échoue, puis arrêtez tcpdump avec **ctrl+c**. Transférez ensuite le fichier PCAP sur votre PC et examinez-le avec [Wireshark](https://www.wireshark.org/).

Vous pouvez récupérer le fichier issue.pcap de plusieurs façons. La plus basique consiste à placer le fichier pcap dans le répertoire /tftpboot (ou à l'y enregistrer), puis à utiliser TFTP pour transférer le fichier vers une machine Windows.

Ceci enregistrerait le fichier dans votre répertoire /tftpboot, mais vous devez toujours spécifier la bonne interface :

sudo tcpdump -w /tftpboot/issue.pcap -i eth0

Puis, sur une machine Windows, vous exécuteriez cette commande pour récupérer le fichier via TFTP :

tftp –i x.x.x.x get issue.pcap

  
Évidemment, le composant Windows TFTP doit être installé, et vous devriez désactiver votre pare-feu Windows. Les détails à ce sujet se trouvent ici :

Troubleshoot_TFTP

Si l'ordinateur de bureau sur lequel vous voulez récupérer le fichier est sous Linux, la récupération du fichier de capture est bien plus simple. Vous pouvez simplement utiliser SCP comme ceci depuis votre poste :

scp username@x.x.x.x:/tftpboot/issue.pcap /home/YourUserName/Documents/issue.pcap

  
Une fois la capture terminée et le fichier PCAP ouvert avec Wireshark, utilisez l'adresse MAC de la machine cible comme filtre pour l'émetteur et le récepteur. Le filtre d'exemple ci-dessous fait essentiellement ceci : ( Afficher le paquet si la MAC émettrice égale xxxxxxx OU si la MAC réceptrice égale xxxxxx )

  
Filtre d'exemple (changez les adresses MAC) :

eth.dst == 00:0C:CC:76:4E:07 || eth.src == 00:0C:CC:76:4E:07

D'autres filtres d'affichage utiles sont bootp (DHCP), tftp et http, par exemple :

bootp || tftp

  
Avec la méthode et le filtre ci-dessus, voici à quoi une conversation avec une option 067 (ou ProxyDHCP) **CASSÉE** **pourrait** ressembler :

[![Broken dnsmasq.png](https://wiki.fogproject.org/wiki/images/8/8b/Broken_dnsmasq.png)](https://wiki.fogproject.org/wiki/index.php?title=File:Broken_dnsmasq.png)

Dans ce cas, le nom du fichier de démarrage de DHCP (ou dnsmasq) n'est pas configuré correctement, le fichier de démarrage n'existe pas, ou TFTP n'est pas configuré correctement.

## Problèmes courants et solutions

### Mon problème n'est pas dans le WiKi !

Si vous avez un problème avec FOG, ou une solution à un problème avec FOG, veuillez visiter les forums pour obtenir de l'aide ou partager votre solution. Nous essayons de garder le WiKi à jour avec ce qui est trouvé sur le forum. Vous pouvez visiter le forum ici : [FOG Forums](http://fogproject.org/forum/)

### Please enter tftp server:

#### Description

En essayant de démarrer par le réseau vers FOG, une invite similaire à l'image ci-dessous s'affiche :

[![Please enter tftp server.png](https://wiki.fogproject.org/wiki/images/3/35/Please_enter_tftp_server.png)](https://wiki.fogproject.org/wiki/index.php?title=File:Please_enter_tftp_server.png)

#### Solution

Généralement, cela est causé par deux services DHCP ou plus fonctionnant sur un même réseau, dont un ou plusieurs sont mal configurés pour FOG. L'administrateur peut connaître ou non ces services DHCP ; l'un d'eux (ou plusieurs) pourrait être un service DHCP indésirable. Vous pouvez trouver un service DHCP indésirable en exécutant Wireshark sur un ordinateur avec le filtre bootp pour ne voir que le trafic DHCP, puis en faisant plusieurs libérations et renouvellements d'IP. Tout service DHCP indésirable devrait apparaître dans les réponses.

Une autre cause de ce problème, bien que moins courante, est que l'option 066/next-server n'est pas configurée sur le seul serveur DHCP de l'environnement. Vous trouverez les instructions pour corriger cela ici : [Modifying existing DHCP server to work with FOG](https://wiki.fogproject.org/wiki/index.php?title=Modifying_existing_DHCP_server_to_work_with_FOG "Modifying existing DHCP server to work with FOG")

### Failed to load libcom32.c32 / Failed to load COM32 file vesamenu.c32

#### Description

Vous voyez défiler une erreur qui dit :

Failed to load libcom32.c32
Failed to load COM32 file vesamenu.c32

Et la machine ne démarre pas sur le réseau.

#### Solution

Cette erreur a été observée dans FOG Trunk (r3500s) et pourrait aussi se produire en 1.2.0.

Elle est causée par l'option DHCP 067 définie sur pxelinux.0

Certaines personnes ont de grandes étendues DHCP configurées. Parfois, une étendue/un paramètre global de niveau supérieur peut écraser les paramètres d'étendue locaux d'un site particulier.

Quoi qu'il en soit, DHCP distribue bel et bien pxelinux.0, ce qui n'est généralement pas conseillé.

Pour les utilisateurs de ProxyDHCP (dnsmasq), vous devriez vérifier quel fichier de démarrage est distribué.

Pour ceux qui ont hérité d'un serveur FOG ou l'ont mis à niveau et essaient d'utiliser le DHCP standard pour 066 et 067, il est possible que ProxyDHCP tourne sur votre serveur FOG et qu'il redéfinisse l'option 067 sur vos machines du réseau vers la valeur incorrecte pxelinux.0, ce qui provoquerait cette erreur.

Vous devriez utiliser undionly.kpxe ou undionly.kkpxe pour le démarrage BIOS avec l'option 067, ou n'importe lequel des fichiers .efi présents dans /tftpboot pour le démarrage UEFI.

Veuillez consulter cet article pour plus de détails sur les différents fichiers de démarrage disponibles dans FOG : [Filename Information](https://wiki.fogproject.org/wiki/index.php?title=Filename_Information "Filename Information")

### Could not boot: Connection timed out ([http://ipxe.org/4c0a6035](http://ipxe.org/4c0a6035))

#### Description

Vous obtenez une erreur de délai d'attente, soit après l'installation ou la mise à jour du serveur FOG, soit après un changement d'adresse IP du serveur FOG.

L'erreur ressemble à l'image ci-dessous :

[![WrongIP for iPXE.png](https://wiki.fogproject.org/wiki/images/7/7e/WrongIP_for_iPXE.png)](https://wiki.fogproject.org/wiki/index.php?title=File:WrongIP_for_iPXE.png)

#### Solution

Modifiez le fichier /tftpboot/default.ipxe (c'est un fichier texte)

Vers le bas du fichier, vous verrez une ligne qui ressemble à celle ci-dessous, où x.x.x.x doit être l'adresse IP actuelle de votre serveur FOG. Si l'IP est incorrecte, corrigez-la et enregistrez le fichier.

chain http://x.x.x.x/fog/service/ipxe/boot.php##params

Modifiez aussi le fichier /opt/fog/.fogsettings pour vous assurer que la bonne adresse IP y est renseignée, afin que cela ne se reproduise pas lors d'une future mise à jour.

  

### Unable to connect to tftp server

#### Pour les versions antérieures à 0.24

Cela semble être causé par un problème de mot de passe,

1. From the fog management interface, go to users.
2. Reset the fog user password.
3. Click the "I" icon - "Other Information"
4. Click "Fog Settings" in the menu on the left
5. Replace the FOG_TFTP_FTP_PASSWORD and the FOG_NFS_FTP_PASSWORD fields under FOG settings with 
   your Linux fog user password. (Seems like FOG_NFS_FTP_PASSWORD is gone for ver .24).

#### Pour les versions .24-.32

-   Réinitialisez le mot de passe local de l'utilisateur fog avec : [sudo] passwd fog
-   Dans l'interface de gestion, allez dans **Gestion du stockage** -> **Tous les nœuds de stockage**
-   Cliquez sur **DefaultMember**
-   Changez le **Management Password** pour qu'il corresponde au mot de passe que vous venez de changer.
-   Puis allez dans **Other Information** et changez aussi **FOG_TFTP_FTP_PASSWORD**.

  

-   Allez à l'emplacement web de votre FOG ; sur Red Hat et CentOS c'est dans :

/var/www/html/fog/

Puis ouvrez le fichier :

/commons/config.php

et vérifiez les valeurs de : **TFTP_FTP_PASSWORD** et **STORAGE_FTP_PASSWORD**

Elles **DOIVENT** correspondre au mot de passe défini ci-dessus ; sinon, écrivez-les correctement ici

Enfin, rechargez le service

/etc/init.d/vsftpd reload

---

#### Vérifier les paramètres du serveur

Si vous avez modifié la configuration de votre serveur depuis la première installation, les nouveaux changements doivent être mis à jour et vérifiés dans le menu **Fog Settings**. Il peut ne pas suffire de relancer simplement l'installateur. Par exemple, un nouveau bail IP fera afficher au serveur le message d'erreur **Unable to connect to tftp server**.

-   Allez sur l'icône « I », qui est le menu **About** en 0.29
-   Sélectionnez **Fog Settings**, descendez jusqu'à **TFTP Settings** et vérifiez que toutes les options sont correctes pour votre configuration.

#### S'assurer que rien d'autre sur le réseau n'entre en conflit avec le serveur DHCP

J'ai eu cette erreur pendant deux jours et j'ai essayé toutes les suggestions habituelles. Finalement, Wireshark est venu à la rescousse. J'ai découvert un second serveur DHCP sauvage sur le réseau qui ne distribuait pas d'adresses IP mais devait faire de l'interférence d'une manière ou d'une autre. Quand je l'ai déconnecté du réseau, le démarrage PXE a fonctionné comme prévu.
