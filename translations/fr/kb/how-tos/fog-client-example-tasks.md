---
title: Exemples de tâches avec le client FOG
aliases:
    - Example tasks with the FOG client
    - Fog Client Example Tasks
description: Exemples généraux d'utilisation des tâches du client FOG
context_id: fog-client-example-tasks
tags:
    - how-to
    - client
    - tasks
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/fog-client-example-tasks).


# Exemples de tâches avec le client FOG

Ce guide a pour but de vous montrer quelques exemples de tâches que vous
pouvez effectuer sur vos machines avec le client FOG.

Nous allons changer le nom de machine et créer un snapin pour installer une
application.

## Prérequis

Nous partons du principe que vous disposez d'un serveur FOG en
fonctionnement et d'une machine sur laquelle un client FOG est installé,
en fonctionnement et approuvé. Voir plus haut pour l'ensemble des
instructions.

## Changer le nom de machine

Le nom de machine peut être défini depuis l'interface web de FOG.

C'est souvent utilisé en combinaison avec le déploiement d'une image :
après le déploiement, la machine porte le nom d'ordinateur défini dans
l'image ou par sysprep.

-   Lancez un navigateur, rendez-vous sur l'interface web de FOG et
    connectez-vous
-   Allez dans « Gestion des machines » -> « List all Hosts » et cliquez
    sur la machine sur laquelle vous venez d'installer le client FOG.

-   Dans l'onglet « Général », remplacez le champ « Nom de machine » par
    le nom que vous souhaitez donner à la machine. N'oubliez pas que les
    noms de machine Windows sont limités à 15 caractères.
-   En bas, cliquez sur « Update ».

Sur votre machine, attendez la prochaine interrogation du client FOG.
Celui-ci interroge généralement le serveur toutes les 2 à 3 minutes.

Comme le changement de nom de machine sous Windows nécessite un
redémarrage, vous devriez voir une fenêtre indiquant que le client FOG va
redémarrer la machine pour changer le nom :

À l'expiration du délai, ou lorsque vous cliquez sur « Shutdown Now », la
machine redémarrera et le nouveau nom de machine sera appliqué.

------------------------------------------------------------------------

## Installer une application via un snapin

Dans FOG, les snapins sont des tâches génériques que vous pouvez exécuter.
Ces tâches comprennent l'exécution de scripts PowerShell, l'exécution de
fichiers MSI, etc.

### Créer le snapin

Dans ce tutoriel, nous allons installer l'application 7-Zip via un snapin.
Nous allons d'abord créer le snapin, puis l'exécuter sur notre machine.

-   Lancez un navigateur et téléchargez l'installeur de 7-Zip. Ne
    l'exécutez pas, contentez-vous de le télécharger. Rendez-vous sur
    <https://www.7-zip.org/download.html> et téléchargez le MSI pour
    Windows 64 bits.
-   Rendez-vous sur l'interface web de FOG et connectez-vous
-   Allez dans « Snapin » → « Create New Snapin » :

Renseignez les champs suivants :

-   Snapin Name : Install 7-Zip
-   Snapin Template : choisissez « MSI » dans la liste déroulante. Cela ne
    fait que préremplir d'autres champs de ce formulaire pour vous aider à
    obtenir les bons paramètres.
-   Snapin File : cliquez sur « Browse » et choisissez l'installeur MSI de
    7-Zip que vous venez de télécharger.
-   Reboot after Install : décochez le bouton radio, car nous n'avons pas
    besoin de redémarrer après l'installation de 7-zip.

L'écran devrait ressembler à ceci (la version de 7-zip peut bien sûr
changer) :

Il est important de noter le champ « Snapin Command read-only ». C'est la
commande qui sera réellement exécutée par le client FOG.

-   Si tout est correct, cliquez sur « Add ». Le fichier MSI sera téléversé
    vers le serveur FOG et le nouveau snapin sera enregistré dans FOG.

### Exécuter le snapin sur la machine

Il est maintenant temps d'exécuter le snapin sur la machine

-   Dans l'interface web de FOG, allez dans « Gestion des machines » →
    « List all Hosts »
-   Cliquez sur l'icône « Task list » à droite de la machine :

-   Cliquez sur « Advanced » et choisissez « Single Snapin » en dessous

-   Dans la liste déroulante, sélectionnez « Install 7-zip »
-   Laissez les autres réglages tels quels et cliquez sur « Task ».

Rendez-vous maintenant sur votre machine et attendez la prochaine
interrogation du client FOG.

Au démarrage de la tâche, vous devriez recevoir une notification vous
indiquant que la tâche a commencé.

Ensuite, vous recevrez une notification vous indiquant que la tâche est
terminée.

À ce stade, l'application 7-zip devrait être installée.

Cette façon d'exécuter un snapin convient pour un seul snapin sur une seule
machine. FOG propose des moyens d'exécuter un snapin sur un ensemble de
machines en quelques clics. Installer plusieurs snapins sur une nouvelle
machine se fait également facilement, mais cela dépasse le cadre de ce
tutoriel.
