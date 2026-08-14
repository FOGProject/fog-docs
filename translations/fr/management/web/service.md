---
title: Gestion du service FOG (alias client)
aliases:
    - Fog Service (aka Client) Management
description: page d'index du service
context_id: service
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - fog-service
    - fog-client
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/service).

# Gestion du service FOG (alias client)

Note : la plupart des informations données ici sur le service client FOG concernent l'ancien client FOG livré avec les versions 1.2.0 et antérieures. FOG 1.3.0 est désormais accompagné d'un nouveau client FOG. Vous trouverez des détails à ce sujet ici : [FOG Client](https://wiki.fogproject.org/wiki/index.php?title=FOG_Client "FOG Client")

## Vue d'ensemble

Le service client FOG est un service Windows destiné à être installé sur les ordinateurs clients pendant la création de l'image. Le service FOG communique avec le serveur FOG afin de fournir certaines prestations aux ordinateurs clients, notamment :

  

-   Déconnexion automatique (0.16)
-   Changement de nom de machine
-   Intégration Active Directory
-   Nettoyeur de répertoire (0.16)
-   Gestionnaire d'affichage (0.16)
-   Green FOG (0.16)
-   Enregistrement des machines
-   Relance des tâches
-   Installation de snapins
-   Suivi des utilisateurs
-   Gestionnaire d'imprimantes
-   Nettoyage des utilisateurs (0.16)
-   Mise à jour du client
-   Suivi des utilisateurs

## Paramètres de configuration propres à chaque module

Le service client FOG est de nature très modulaire, ce qui signifie que vous pouvez installer une partie des prestations proposées et laisser les autres de côté. Cela signifie aussi qu'il est très facile de créer de nouveaux sous-services si vous connaissez un peu le C#. Toutes les données de configuration sont conservées dans un fichier INI local, généralement stocké dans

c:\program files\fog\etc\config.ini

Ce fichier contient, dans sa section générale :

-   l'adresse IP du serveur FOG
-   la racine d'installation du service FOG
-   le répertoire de travail du service FOG
-   le chemin du fichier journal de FOG
-   un indicateur précisant si les messages graphiques doivent être affichés
-   la taille maximale du fichier journal

## Installation

[Tutoriel vidéo](http://freeghost.sourceforge.net/videotutorials/FogServiceInstall.swf.html)

Le service FOG doit être installé sur l'ordinateur à imager avant la capture de l'image vers le serveur FOG.

Le service FOG se trouve dans le répertoire **FOG Service/bin** ou, si le serveur FOG est déjà installé, il peut être téléchargé depuis :

http://[serverip]/fog/client/

Double-cliquez sur **setup.exe** pour lancer l'assistant d'installation. À la fin de l'assistant, vous devrez saisir l'adresse IP ou le nom d'hôte de votre serveur FOG.

[![Fogservice.jpg](https://wiki.fogproject.org/wiki/images/a/ad/Fogservice.jpg)](https://wiki.fogproject.org/wiki/index.php?title=File:Fogservice.jpg)

Redémarrez ensuite l'ordinateur ; si vous ne le faites pas, vous rencontrerez des problèmes d'affichage de l'interface du service.

### Installation silencieuse

Depuis la version 0.29, le client FOG prend en charge un mode d'installation silencieuse. Cela peut aider à automatiser les déploiements, en permettant d'exécuter la commande depuis des fichiers de traitement par lots sans interaction de l'utilisateur. Pour cela, le fichier setup.exe doit être exécuté en ligne de commande avec les arguments **fog-defaults=true /qb**.

La commande complète serait donc :

setup.exe fog-defaults=true /qb

## Fonctions et fonctionnement

### Déconnexion automatique

Ajouté en version 0.16

Ce module du service FOG déconnecte un utilisateur d'un PC client après X minutes d'inactivité. Il affiche une interface façon économiseur d'écran une fois écoulés les 3/4 du délai d'inactivité. Ainsi, si le délai est de 40 minutes, l'interface apparaîtra après 30 minutes d'inactivité. Une fois le délai écoulé, l'ordinateur client redémarre. Ce module de service se configure depuis le portail de gestion via :

FOG Service Configuration -> Auto Log Out

Pour activer le module globalement, cochez la case **Auto Log Out Enabled?**. Le délai avant déconnexion automatique se modifie globalement via **Default log out time:**. La valeur minimale recommandée pour ce réglage est de 4 minutes.

L'image de fond du module de déconnexion automatique peut être modifiée via :

Other Information -> Paramètres de FOG

Les réglages se modifient en changeant la valeur de **FOG_SERVICE_AUTOLOGOFF_BGIMAGE**. Ce réglage accepte un fichier jpg local à l'ordinateur client, comme :

c:\images\image.jpg

Il accepte également des fichiers situés sur un serveur web, tels que :

[http://www.somedomain.com/image.jpg](http://www.somedomain.com/image.jpg)

FOG fournit un script php simple qui affiche une image aléatoire située sur le serveur FOG. Pour utiliser cette option, réglez **FOG_SERVICE_AUTOLOGOFF_BGIMAGE** sur

[http://x.x.x.x/fog/public/randomimage.php](http://x.x.x.x/fog/public/randomimage.php)

Placez ensuite simplement les images que vous souhaitez utiliser dans le répertoire suivant du serveur FOG :

/var/www/html/fog/public/imagepool

Les images utilisées par le module de déconnexion automatique doivent être au format jpg et mesurer 300 px sur 300 px.

### Renommage machine

Ce module du service FOG sert à changer le nom de la machine cliente et à permettre au client de rejoindre (facultativement) un domaine Active Directory après l'imagerie. Ce processus ne s'exécute que peu après le démarrage du service, c'est-à-dire généralement au démarrage de l'ordinateur. Le service communique avec le serveur FOG sur le port 80 et détermine le nom de machine présent dans la base de données FOG pour cette machine. Les machines sont mises en correspondance avec la base de données FOG par leur adresse MAC. Si les noms de machine diffèrent, le client change le nom de l'ordinateur et le redémarre.

Le fichier config.ini contient des options de configuration pour ce module.

netdompath=

Permet d'indiquer le chemin du fichier netdom.exe. Dans certains cas, ce fichier n'existe pas sur le système. Il peut être téléchargé depuis : [Microsoft Download Center](http://www.microsoft.com/downloads/details.aspx?FamilyId=49AE8576-9BB9-4126-9761-BA8011FABF38&displaylang=de)

### Enregistrement des machines

Depuis la version 0.29, ce module se contente d'ajouter des adresses MAC supplémentaires à une machine déjà enregistrée et de les placer dans la table des adresses MAC en attente, où elles doivent être approuvées dans l'interface FOG.

### Relance des tâches

Ce module vérifie régulièrement auprès du serveur FOG si une tâche d'imagerie est affectée au client. Si une tâche est trouvée ET que personne n'est connecté au poste de travail, le client redémarre et rejoint la tâche.

Le fichier config.ini contient des options de configuration pour ce module. Depuis la version 0.13 de FOG, vous pouvez remplacer :

forcerestart=0

par

forcerestart=1

Cela fera redémarrer l'ordinateur si une tâche est trouvée, qu'un utilisateur soit connecté ou non.

Vous pouvez modifier la fréquence à laquelle le service interroge le serveur en changeant :

checkintime=xxx

où xxx est le nombre de secondes que le service attend entre deux interrogations.

### Nettoyeur de répertoire

Ajouté en version 0.16

Ce module vide (supprime) le contenu d'un répertoire à la déconnexion de l'utilisateur. C'est utile lorsque vous ne voulez conserver aucun réglage en cache d'un utilisateur à l'autre. Ce module ne supprime que le contenu du répertoire et non le répertoire lui-même : si vous indiquez **c:\trash**, le service supprimera tous les fichiers et dossiers situés dans c:\trash mais conservera le dossier c:\trash.

### Gestionnaire d'affichage

Ajouté en version 0.16

Ce module sert à restaurer la résolution d'écran d'un utilisateur à l'autre. Il rétablit une résolution et une fréquence de rafraîchissement fixes lorsqu'un utilisateur se connecte à un ordinateur.

### Green FOG

Ajouté en version 0.16

Ce module se contente d'éteindre ou de redémarrer l'ordinateur client selon un calendrier fixe si aucun utilisateur n'est connecté. Le calendrier se définit depuis le portail de gestion.

### Client Snapin

Ce module vérifie régulièrement auprès du serveur FOG si un snapin doit être déployé sur le client. Si un snapin est trouvé ET qu'aucune tâche d'imagerie n'est associée au client, le client télécharge le snapin et l'installe en arrière-plan.

Le fichier de configuration contient des réglages pour ce module, notamment :

checkintime=xxx

où xxx est le nombre de secondes que le service attend entre deux interrogations. Il est important de noter qu'actuellement le client FOG attend 5 minutes après sa première connexion avant de commencer à rechercher et à installer des snapins depuis le serveur.

### Suivi des utilisateurs

Ce module tente de suivre les accès à l'ordinateur par nom d'utilisateur Windows. Il tente de suivre les connexions et déconnexions ainsi que l'état de l'ordinateur au démarrage du service. Le service tente même de suivre les utilisateurs lorsqu'ils ne sont pas sur le réseau, en écrivant toutes les entrées dans un fichier de journal, puis en rejouant ce journal la prochaine fois que le client est sur le réseau.

Ce module n'a aucun paramètre de configuration.

### Nettoyage des utilisateurs

Ce module supprime, à la déconnexion, tous les utilisateurs ne figurant pas sur la liste blanche du portail de gestion. Il est utile lorsque vous utilisez des services de type utilisateur local dynamique. Toutes les entrées de la liste blanche de gestion sont traitées comme des préfixes de noms d'utilisateur : elles mettent donc sur liste blanche tous les utilisateurs dont le nom commence par ce qui a été saisi dans l'interface de gestion. Par exemple, si vous saisissez **admin** dans la liste blanche, les utilisateurs **admin** et **administrator** ne seront PAS supprimés de l'ordinateur.

### Gestionnaire d'imprimantes

Ce module vérifie, au démarrage du service, quelles imprimantes doivent être installées ou retirées du PC client.

Ce module n'a aucun paramètre de configuration.

### Mise à jour du client

Ce module attend (aléatoirement) entre 60 et 500 secondes après le démarrage du service, puis interroge le serveur FOG local à la recherche de mises à jour du client ; s'il en trouve, le service les télécharge et les installe. Les mises à jour ne prendront effet qu'après un redémarrage du service.

Ce module n'a aucun paramètre de configuration.

## Maintenir les clients à jour

### Vue d'ensemble

Depuis la version 0.12 de FOG, nous fournissons un module de mise à jour du client. Ce module ne diffère en rien des autres modules de sous-service. Ce service attend entre 60 et 500 secondes après le démarrage du service FOG, puis tente d'interroger le serveur à la recherche de modules de service FOG plus récents. Si de nouveaux modules sont trouvés, le client les télécharge et ils seront actifs au PROCHAIN démarrage du service. Ces modules se pilotent depuis la console de gestion FOG.

Seuls certains modules peuvent être mis à jour : uniquement ceux qui sont des sous-classes d'AbstractFOGService. Cela signifie que vous ne devez **JAMAIS** tenter de mettre à jour l'exécutable FOGService (fichier FOGService.exe) ni le fichier AbstractFOGService.dll. Il est recommandé de ne pas mettre à jour ClientUpdater.dll : si ce fichier devient corrompu ou non fonctionnel, vos clients ne pourront plus se mettre à jour à partir de là. Voici la liste des fichiers .dll qui peuvent être mis à jour.

-   UserTracker.dll
-   TaskReboot.dll
-   SnapinClient.dll
-   PrinterManager.dll
-   HostRegister.dll
-   HostnameChange.dll
-   GUIWatcher.dll
-   ClientUpdater.dll
-   config.ini

Il faut également être prudent lors de la mise à jour du fichier config.ini : si l'adresse IP est incorrecte ou si la syntaxe du fichier est erronée, cela peut laisser le service FOG hors d'état de fonctionner sur les ordinateurs clients.

### Publier des mises à jour

Pour ajouter de nouveaux modules pouvant être poussés vers les clients, installez d'abord un client avec le nouveau service ou le nouveau module et vérifiez qu'il fonctionne comme vous le souhaitez. Connectez-vous à la console de gestion FOG, puis rendez-vous dans la section Information/Divers (la petite icône « i »). Cliquez sur **Mise à jour du client** dans le menu de gauche. Cliquez maintenant sur le bouton Parcourir pour sélectionner le fichier de module (.dll) que vous souhaitez publier, puis cliquez sur le bouton de capture. Après la capture, le fichier devrait apparaître dans le tableau ci-dessus. Si vous ajoutez un nouveau module, vous voudrez probablement capturer aussi un nouveau fichier config.ini afin d'y inclure les nouveaux paramètres de configuration requis par ce module.

## FOG Tray

FOG Tray est une application Windows qui s'exécute à la connexion de l'utilisateur et se loge dans la zone de notification. Comme le service FOG, FOG Tray est de nature très modulaire. De nouveaux modules peuvent être déposés dans le répertoire de FOG Tray et seront chargés au démarrage suivant. Cette icône de la zone de notification est capable de communiquer avec le service FOG, ce qui permet à FOG davantage d'interactivité avec l'utilisateur final.

Concrètement, lorsque le module gestionnaire d'imprimantes du service FOG reçoit une demande de définition d'imprimante par défaut, le service tente de contacter FOG Tray. Si la communication est établie, le service demande à FOG Tray de définir l'imprimante par défaut. Dans l'autre sens, l'utilisateur final peut faire un clic droit sur l'icône « F » de la zone de notification, sélectionner les imprimantes, puis demander la mise à jour de ses imprimantes. Cela tentera d'envoyer une demande de FOG Tray vers le service FOG afin que celui-ci recherche des mises à jour d'imprimantes (nouvelles imprimantes ou imprimantes à retirer). S'il en trouve, le service installera toute nouvelle imprimante affectée dans le portail de gestion FOG.

Cette application en est à ses tout débuts et ne dispose actuellement pas de beaucoup de fonctionnalités. Elle sert pour l'instant uniquement à permettre aux utilisateurs finaux de mettre à jour leurs imprimantes et à autoriser la définition d'imprimantes par défaut (depuis le service FOG). Notre vision pour FOG Tray est d'ajouter des modules qui permettraient aux utilisateurs d'installer des imprimantes publiées comme publiques (via le portail de gestion) sans que l'imprimante soit directement affectée à leur machine. Nous aimerions faire de même pour les snapins, dont certains pourraient être définis comme publics et installables par n'importe qui sur son ordinateur.

## Dépannage

Si vous rencontrez des problèmes avec le service FOG, reportez-vous au fichier journal situé dans :

c:\fog.log

Si le démarrage PXE ne fonctionne pas

Si le démarrage depuis le serveur FOG par PXE aboutit à une erreur de fichier introuvable, modifiez /etc/default/tftpd-hpa

Remplacez TFTP_DIRECTORY par

TFTP_DIRECTORY="/tftpboot" Puis

/etc/init.d/tftpd-hpa restart
