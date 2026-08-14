---
title: Configuration requise
context_id: requirements
aliases:
    - Requirements
    - System Requirements
description: détaille la configuration matérielle et système requise
tags:
    - system-requirements
    - dependencies
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/server/requirements).

# Configuration système requise

Cette page couvre les prérequis système, matériels et de stockage du serveur lui-même. Pour
les ports et les règles de pare-feu dont FOG a besoin pour communiquer avec les clients, voir
[[network-and-firewall-requirements|Prérequis réseau et pare-feu]].

## Système d'exploitation

Avant de vous lancer dans l'installation de FOG, vous devez décider quel
système d'exploitation serveur vous allez utiliser. FOG est conçu pour
s'installer sur les distributions dérivées de RedHat — CentOS, Fedora, RHEL
entre autres — ainsi que sur Debian, Ubuntu et Arch Linux.

Choisissez celle que vous préférez et que vous connaissez le mieux ! FOG est
réputé fonctionner avec n'importe lequel des systèmes cités. De nombreux
manuels d'installation sont disponibles.

Choisissez la distribution que vous maîtrisez le mieux. Cette liste n'est en
aucun cas une liste stricte à respecter.

-   Ubuntu 16 ou supérieur
-   Debian 8 ou supérieur
-   CentOS 7 ou supérieur
-   Red Hat 6 ou supérieur (RHEL 10+ nécessite un serveur DHCP distinct, voir [ISC-DHCP is deprecated](https://github.com/FOGProject/fogproject/issues/730) )
-   Fedora 22 ou supérieur
-   N'importe quelle version d'Arch.


### Paquets Linux utilisés

Cette liste est fournie à titre informatif uniquement, car les composants
requis seront automatiquement téléchargés et installés par le script
d'installation de FOG :

-   PHP 5/7
-   MySql 5+/MariaDB 10+,
-   Apache 2+,
-   DHCP (à peu près n'importe lequel !)
-   TFTP
-   FTP
-   NFS

La configuration LAMP peut aussi être facilement adaptée à un « système WAMP
(Windows Apache MySQL PHP) », mais cela demandera un peu plus de
connaissances sur les paquets à utiliser et sur la façon de les intégrer au
système FOG.

## Configuration matérielle requise

FOG est conçu pour fonctionner sur du matériel modeste. Les seules exigences
strictes sont **un espace disque suffisant pour vos images** et une **carte
réseau 1 Gbit/s** — tout le reste peut être très minimal.

| Ressource | Base |
| --- | --- |
| Processeur | 2 cœurs |
| Mémoire vive | 2 Go |
| Réseau | 1 Gbit/s |

Davantage de processeur et de mémoire ne sont jamais superflus — ils aident à
la compression des images, au multicast et à l'exécution simultanée de
nombreuses tâches — mais ils ne sont pas obligatoires. Ces valeurs de base
suffisent pour un serveur fonctionnel.

### Espace disque et partitionnement

L'espace disque pour `/images` est le chiffre qui compte vraiment. FOG ne
capture que les blocs *utilisés* d'un disque (et non sa taille totale) et les
stocke compressés ; une image est donc bien plus petite que le disque source
— mais la taille varie beaucoup selon le système d'exploitation et le taux de
remplissage de la machine.

Estimez votre total ainsi :

    (nombre d'images à conserver) x (taille moyenne d'une image) + marge

Conservez le système d'exploitation et `/images` sur des partitions ou des
disques distincts, afin qu'un stock d'images saturé ne puisse pas mettre à
terre le système hôte. `/images` est l'emplacement où réside chaque image
capturée, et vous pourrez l'agrandir plus tard en y montant un disque plus
grand.

### Prérequis des clients (machines cibles)

Les ordinateurs que vous clonez ont une exigence à retenir : **au moins 512 Mo
de mémoire vive**. Le fichier `init.xz` de l'environnement de clonage FOS est
décompressé en mémoire au démarrage ; une machine disposant de trop peu de
mémoire ne pourra donc pas le charger. C'est trivial sur du matériel moderne,
mais cela peut poser problème sur des machines très anciennes ou peu dotées.
