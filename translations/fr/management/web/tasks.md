---
title: Gestion des tâches
aliases:
    - Task Management
description: page d'index des tâches
context_id: tasks
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - tasks
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/tasks).

# Gestion des tâches

## Vue d'ensemble

-   Les tâches sont l'ensemble des actions que vous pouvez effectuer sur un ordinateur ; FOG en propose de nombreuses, parmi lesquelles :

	-   Deploy (Unicast)
	-   Capture (Unicast)
	-   Deploy - Multicast
	-   Debug
	-   Memory Test
	-   Test Disk
	-   Disk Surface Test
	-   Recover (File Recovery)
	-   Hardware Inventory
	-   Password Reset
	-   Deploy All Snapins
	-   Deploy Single Snapin
	-   Wake-Up
	-   Deploy - Debug (Unicast)
	-   Capture - Debug (Unicast)
	-   Deploy - Without Snapins (Unicast)
	-   Fast Wipe
	-   Normal Wipe
	-   Full Wipe
	-   Virus Scan
	-   Virus Scan - Quarantine
	-   Donate
	-   Torrent-Cast

  
Dans la section des tâches de FOG, vous pouvez lancer des tâches sur des machines isolées ou sur des groupes de machines. Cette section vous permet également de surveiller certaines tâches et d'en arrêter ou d'en annuler.

## Tâches générales

Les tâches générales et courantes de FOG comprennent la capture d'image en unicast et l'envoi d'image en unicast, ainsi que l'envoi d'image en multicast. Dans FOG, envoyer une image vers le serveur est considéré comme une capture d'image, et déployer une image sur le client est appelé un envoi. Ces deux tâches peuvent être lancées directement depuis les pages de recherche, de liste de toutes les machines et de liste de tous les groupes.

Pour effectuer une simple capture d'image, cliquez sur la flèche vers le haut à côté de la machine. Les captures ne sont possibles que sur une machine, pas sur un groupe. Capturer une image écrasera également, sans avertissement ni confirmation, tout fichier image existant déjà pour cette machine.

Notez que la capture d'images de Windows Vista et Windows 7 nécessite l'exécution d'une commande particulière sur les clients avant la capture. Voir [What do I have to do to an image before capturing?](https://wiki.fogproject.org/wiki/index.php?title=What_do_I_have_to_do_to_an_image_before_capturing%3F "What do I have to do to an image before capturing?") pour plus de détails.

Pour une démonstration vidéo d'une capture d'image, voir : [http://www.youtube.com/watch?v=jPPZr0abVfg&fmt=18](http://www.youtube.com/watch?v=jPPZr0abVfg&fmt=18)

Pour effectuer un simple envoi d'image, cliquez sur la flèche vers le bas à côté de la machine. Un envoi d'image peut être fait sur une machine ou sur un groupe. Lors de l'envoi d'une image vers plusieurs ordinateurs, FOG fonctionne en mode file d'attente, ce qui signifie qu'il n'enverra l'image qu'à 10 ordinateurs à la fois (valeur par défaut). Cela évite de surcharger le serveur. Dès qu'une machine a terminé, une autre de la file d'attente prend sa place.

Un envoi d'image en multicast transmet une seule image à de nombreuses machines simultanément. Il peut être lancé depuis un groupe de machines sur la page « Gestion des tâches », depuis la Gestion des images sous forme de session nommée que les machines rejoignent par son nom, ou depuis une machine se trouvant dans le menu de démarrage. Le multicast envoie l'image à tous les ordinateurs participants en même temps et ne commence à transmettre qu'une fois que tous les clients attendus ont rejoint la session ou que le délai d'attente configuré a expiré — le premier des deux qui survient. Une fois la transmission commencée, la session est fermée et aucune autre machine ne peut la rejoindre. Après le lancement d'une tâche multicast, l'état peut être consulté en appuyant sur [ctl]+[alt]+f2. Un journal est également conservé pour les transferts multicast, dans /opt/fog/log.

Voir [Sessions multicast](multicast.md) pour savoir comment les sessions sont créées et rejointes, et pour les réglages qui déterminent combien peuvent s'exécuter simultanément.

## Tâches avancées

Les tâches avancées de FOG comprennent tout ce qui n'est pas une simple capture, un simple déploiement ou un déploiement multicast.

### Debug

Le mode débogage démarre l'image Linux sur une invite bash et permet à l'utilisateur de saisir toutes les commandes à la main.

### Capture - Unicast (Debug)

Fait la même chose que le mode débogage, à ceci près que l'environnement est préparé pour capturer l'image. Pour lancer le processus d'imagerie, il suffit de saisir :

	fog

### Send - Unicast (Debug)

Fait la même chose que le mode débogage, à ceci près que l'environnement est préparé pour envoyer l'image. Pour lancer le processus d'imagerie, il suffit de saisir :

	fog

### Send - Unicast (Without Snapins)

Cette tâche effectue un envoi normal, à ceci près que les snapins associés à la machine, s'il y en a, ne lui sont pas déployés.

### Deploy All Snapins

Cette tâche envoie à la machine tous les snapins qui lui sont associés, sans lancer d'imagerie.

### Deploy Single Snapin

Cette tâche envoie à la machine un seul snapin qui lui est associé, sans lancer d'imagerie. (Note : le snapin doit déjà être associé à la machine)

### Memory Test

Démarre sur Memtest86, un outil de test de la mémoire. Cette tâche ne se termine pas sans intervention de l'utilisateur côté client. Elle doit également être arrêtée manuellement depuis l'interface de gestion.

### Wake Up

Réveille une machine ou un groupe de machines à l'aide du Wake-on-Lan.

### Fast Wipe

Cette tâche effectue un effacement rapide et sommaire du disque. Elle écrit des zéros sur les ~40 Mo initiaux du disque. Cette tâche ne doit PAS être utilisée si vous ne voulez pas que vos données soient récupérables.

### Normal Wipe

Cette tâche écrit des données aléatoires sur toute la surface du disque.

### Full Wipe

Cette tâche écrit des données aléatoires, plusieurs fois, sur toute la surface du disque.

### Disk Surface Test

Cette tâche recherche les blocs défectueux du disque dur et les signale à la console du client.

### File Recovery

Cette tâche charge une application permettant de récupérer les fichiers perdus du disque dur.

### Virus Scan

Cette tâche met à jour et charge ClamAV, puis analyse la partition à la recherche de virus. Elle analysera et signalera, ou analysera et mettra les fichiers en quarantaine, et transmettra également les résultats de l'analyse au portail de gestion.

### Hardware Inventory

[Tutoriel vidéo](http://freeghost.sourceforge.net/videotutorials/InventoryUpdate.swf.html)

La tâche d'inventaire matériel exécute la même chose que la tâche client fog.reginput. Comme la machine est déjà enregistrée, elle se contentera de mettre à jour l'inventaire de l'ordinateur et de le redémarrer. L'idée est que cette tâche puisse être exécutée à intervalles réguliers sur un groupe contenant tous les ordinateurs de votre réseau, ou sur un sous-groupe d'entre eux. Un inventaire serait alors effectué au redémarrage suivant de ces ordinateurs.

## Planification

Depuis la version 0.27 de FOG, certaines tâches peuvent être planifiées avec un couple date/heure fixe ou avec une planification répétitive de type cron. La planification de tâches peut porter sur des machines isolées ou sur des groupes d'ordinateurs. Un point peu intuitif à propos de la planification est qu'elle **exige qu'une image soit associée à la machine, même pour des tâches sans rapport avec l'imagerie !** La raison en est que les tâches ne s'exécutent que sur le nœud de stockage maître associé à cette machine, et que la seule façon de rattacher un nœud de stockage à une machine passe par une image. Nous avons fait ce choix pour éviter que plusieurs nœuds de stockage ne tentent d'exécuter la même tâche pour une machine donnée.

### Planification à exécution unique

Une tâche à exécution unique s'exécutera à une date et une heure précises, puis sera supprimée. Pour planifier une tâche à exécution unique, rendez-vous dans la section des tâches de FOG, sélectionnez la machine ou le groupe pour lequel vous souhaitez planifier la tâche, puis sélectionnez la tâche à planifier. L'écran ci-dessous vous sera alors présenté.

![[Sched.png]]

Pour planifier une tâche à exécution unique, cliquez sur la zone de texte blanche située sous « Schedule Single Task Execution? » : un calendrier apparaîtra et vous permettra de choisir la date et l'heure de la tâche. Cliquez sur la date pour fermer le calendrier, puis lancez votre tâche.

### Planification de tâches de type cron

L'exécution de tâches de type cron vous permet de mettre en place des planifications répétitives complexes. Après son exécution, une tâche cron n'est pas supprimée, contrairement aux tâches à exécution unique. Comme leur nom l'indique, les tâches de type cron reprennent le format du planificateur cron de Linux. Elles se créent comme les tâches à exécution unique, si ce n'est qu'au moment de choisir les options de planification, vous sélectionnez l'option « Schedule Cron Style Task Execution ». Sous cette case à cocher se trouve une série de zones de texte :

min    -> Minute [00-59]
hour   -> Heure [00-23]
dom    -> Jour du mois [01-31]
month  -> Mois [01-12]
dow    -> Jour de la semaine [01-07] (dimanche ==> 0, samedi ==> 6)

Pour donner un exemple de fonctionnement, si vous vouliez qu'une tâche de capture s'exécute **tous les jours à 22 h 00**, vous saisiriez ceci :

	0 22 * * *

Cela signifie en somme : exécuter la tâche à **0** minute de l'heure, à la **22e heure (22 h 00)**, **tous les jours du mois**, **tous les mois de l'année**, **tous les jours de la semaine**.

Pour pousser cet exemple plus loin, disons que vous ne vouliez capturer l'image qu'**un jour sur deux** : nous pourrions le faire en ajoutant :

	0 22 */2 * *

Le ***/2** indique désormais au planificateur de ne s'exécuter que les **jours pairs du mois**.

Nous pourrions même demander au planificateur de ne faire une sauvegarde que les **jours ouvrés pairs** en ajoutant :

	0 22 */2 * 1-5

Le 1-5 que nous venons d'ajouter indique de ne s'exécuter que les jours 1 à 5, qui correspondent au lundi et au vendredi.

Nous allons maintenant demander au planificateur de ne sauvegarder qu'au mois de février.

	0 22 */2 2 1-5

Autre exemple simple : si vous vouliez lancer une mise à jour d'inventaire le premier de chaque mois, vous pourriez utiliser :

	30 1 1 * *

Cette tâche s'exécuterait alors à **1 h 30** le **1er de chaque mois**.

  
Le planificateur de FOG ne prend pas en charge 100 % des opérations gérées par cron ; voici celles qui sont prises en charge :

	4       -       Listing a static number
	4,5,6,7 -       Listing a group of numbers
	4-7     -       ranges of numbers 
	4-7,10  -       ranges and lists
	*/5     -       * divided by a number
	*       -       Wildcard

Pour plus d'informations sur cron, voir [http://en.wikipedia.org/wiki/Cron](http://en.wikipedia.org/wiki/Cron)
