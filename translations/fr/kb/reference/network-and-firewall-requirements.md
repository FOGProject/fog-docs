---
title: Prérequis réseau et pare-feu
aliases:
    - Network and firewall requirements
description: page d'index de network-and-firewall-requirements
context_id: network-and-firewall-requirements
tags:
    - in-progress
    - firewall
    - convert-Wiki2MD
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/network-and-firewall-requirements).

# Prérequis réseau et pare-feu

FOG s'appuie sur un certain nombre de protocoles réseau, comme FTP, NFS,
DHCP et HTTPS. Dans un réseau « à plat » où tous les clients et serveurs se
trouvent dans le même sous-réseau IP, cela ne pose généralement pas beaucoup
de problèmes ; mais lorsque des composants de FOG sont sur des réseaux
différents et que des pare-feu se trouvent entre eux, il faut planifier et
configurer avec soin.

Voir [[requirements|Configuration requise]] pour les prérequis matériels et
système du serveur lui-même — cette page traite spécifiquement du volet
réseau et pare-feu.

Cette partie du manuel aborde les prérequis réseau et pare-feu.

## Communications entre le client FOG et le serveur FOG

Un client FOG installé sur une machine interroge régulièrement le serveur
FOG pour connaître les tâches en attente.

### Communications du client FOG vers le serveur

Cette interrogation se fait en HTTP ou HTTPS. Lorsqu'un pare-feu se trouve
entre le client et le serveur FOG, veillez à ouvrir le port 80/tcp (HTTP) ou
le port 443/tcp (HTTPS), selon que vous utilisez HTTP ou HTTPS pour les
communications client/serveur. Voir
[[install-fog-server|Installer le serveur FOG]] pour le choix entre HTTP et
HTTPS lors de l'installation.

Le téléchargement des snapins se fait également en HTTP/HTTPS.

Un prérequis est que le client soit capable de résoudre le nom d'hôte du
serveur FOG via le DNS.

## Démarrage réseau du client

Lors du déploiement et de la capture d'une image, le client démarre depuis
le réseau, contacte le serveur FOG pour obtenir des instructions, puis
télécharge ou téléverse une image vers le stockage FOG.

Dans une petite installation, le stockage FOG et le serveur FOG résident sur
le même serveur.

### 1. DHCP

Le client commence par demander une adresse IP en DHCP. Pour cela, il vous
faut un serveur DHCP dans le même sous-réseau que le client. Plusieurs
possibilités s'offrent à vous :

-   Exécuter le service DHCP sur le serveur FOG. C'est l'une des options
    d'installation proposées par
    [[install-fog-server|Installer le serveur FOG]]. Choisissez cette option
    si vous n'avez pas déjà un serveur DHCP en fonctionnement sur votre
    réseau.
-   Utiliser un serveur DHCP distinct. La plupart des réseaux disposent déjà
    d'un serveur DHCP, et dans les réseaux d'entreprise les services DHCP
    sont couramment gérés par des équipements réseau, tels que les pare-feu.
    Dans ce cas, veillez à configurer ce serveur DHCP pour qu'il transmette
    également les options supplémentaires 66 (next-server) et 67 (bootfile
    name) mentionnées dans [[dhcp-server-settings#Other DHCP Server than FOG]]

Si le serveur DHCP se trouve sur un autre réseau, assurez-vous qu'un
« relais DHCP » fonctionne sur le réseau. Ce relais DHCP « attrape » les
paquets de diffusion DHCPDISCOVER et les transmet en unicast au serveur DHCP
situé sur l'autre réseau.

### 2. Démarrage TFTP

Une fois que le client a obtenu son adresse IP, il télécharge l'image du
noyau depuis le serveur de stockage FOG. Dans les petites installations, le
stockage FOG et le serveur FOG résident sur le même serveur.

Pour le TFTP, ouvrez les ports suivants :

-   des clients vers le stockage sur le port 69/udp (contrôle de session
    TFTP)
-   des clients vers le stockage sur les ports 1024-65535/udp : un port
    aléatoire supérieur à 1023 est choisi pour le transfert de fichier
    proprement dit.

Quelques remarques :

-   Certains pare-feu disposent d'un « relais TFTP ». Si un tel pare-feu se
    trouve entre les clients et le stockage FOG, ce relais TFTP « regarde »
    l'échange TFTP entre les clients et le stockage et voit quel port
    aléatoire est demandé. Le pare-feu autorise alors cette connexion
    jusqu'à la fin du transfert. Avec un relais TFTP, il n'est pas
    nécessaire d'ouvrir les ports 1024-65535 vers le serveur de stockage.

### 3. Configuration du client

Une fois l'image du noyau téléchargée, elle est exécutée et le noyau demande
au serveur FOG ce qu'il doit faire : afficher le menu de démarrage ou lancer
une tâche de capture ou de déploiement d'image.

Pour cela, si ce n'est pas déjà fait, ouvrez le port 80/tcp (HTTP) ou le port
443/tcp (HTTPS), selon que vous utilisez HTTP ou HTTPS pour les
communications client/serveur (voir
[[install-fog-server|Installer le serveur FOG]]).

### 4. Capture ou déploiement d'image en unicast

Si le client a une capture ou un déploiement d'image en unicast à effectuer,
il monte un partage NFS sur le stockage FOG.

Si le stockage FOG se trouve derrière un pare-feu, ouvrez les ports
suivants :

-   des clients vers le stockage FOG, ports 111/udp et 111/tcp
-   des clients vers le stockage FOG, ports 2049/udp et 2049/tcp
