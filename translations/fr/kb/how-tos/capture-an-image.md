---
title: Capturer une image
aliases:
    - Capture an image
description: Décrit le déroulement de base de la capture d'une image
context_id: capture-an-image
tags:
    - how-to
    - capture
    - tasks
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/capture-an-image).

# Capturer une image

Après avoir installé un serveur FOG, l'une des premières tâches que vous
effectuerez sera de capturer une image.

Par « capturer une image », nous entendons réaliser une copie du contenu du
disque dur d'une machine que vous souhaitez dupliquer sur d'autres machines.

Ce guide a pour but de vous montrer comment capturer une image et la déployer
sur un autre matériel à l'aide de FOG. Dans ce guide, nous allons capturer et
déployer l'image d'une machine Windows 10 sur un matériel ancien doté d'un
BIOS (et non d'un firmware UEFI), mais la procédure est presque identique pour
une machine UEFI.

## Prérequis

Avant de capturer l'image, vous devez vous assurer que la machine est « prête
à être clonée ». Pour une machine Windows, cela signifie généralement que vous
avez effectué les opérations suivantes :

-   Téléchargé une image ISO d'installation de Windows, copiée sur un DVD ou
    une clé USB
-   Démarré la machine sur le DVD ou la clé USB et installé Windows avec les
    options souhaitées
-   Installé les programmes et pilotes supplémentaires que vous voulez inclure
    dans l'image
-   Configuré les paramètres Windows spécifiques, comme les paramètres
    régionaux
-   Installé le client FOG dessus : après le déploiement, le client FOG prend
    en charge des tâches supplémentaires, comme le changement du nom de
    machine, l'installation d'applications supplémentaires, l'installation
    d'imprimantes, etc.
-   Exécuté Sysprep sur la machine et l'avoir éteinte

Nous partons du principe que vous disposez d'un serveur FOG en fonctionnement
et que vous pouvez vous connecter à l'interface web de FOG.

## Enregistrer la machine dans FOG

Maintenant que la machine est prête pour la capture de l'image, il est temps de
la démarrer depuis le réseau.

Branchez une connexion Ethernet filaire et, dans le BIOS, assurez-vous que la
machine démarre depuis le réseau.

Sur la capture d'écran ci-dessus, vous voyez un démarrage réseau réussi :

1.  Le client PXE de la machine active le lien réseau et demande une adresse IP
    via DHCP. Le serveur DHCP (sur la capture d'écran, le serveur DHCP est à
    l'adresse 192.168.178.1) fournit à la fois une adresse IP
    (192.168.178.16/255.255.255.0) et les options « next server »
    (192.168.178.14) et « file name » (ipxe.kpxe).
2.  Le client PXE de la machine récupère ensuite l'image ipxe.pxe via TFTP
3.  iPXE est exécuté et se configure lui-même

Le menu de démarrage de FOG s'affiche alors :

Utilisez les touches fléchées pour déplacer la sélection vers le haut ou vers
le bas. L'option par défaut, « boot from hard disk » (démarrer depuis le disque
dur), est choisie au bout de 3 secondes : soyez rapide.

En rouge s'affiche l'indication que la machine n'est PAS enregistrée. Cela
signifie que FOG ne la connaît pas.

Pour capturer une image, la machine doit être enregistrée : choisissez donc
« Quick registration and inventory » (enregistrement et inventaire rapides).

Du texte défile alors à l'écran pendant que FOG enregistre la machine :

![[capture_fog_registration.png]]

Le client redémarre ensuite. Éteignez l'ordinateur.

## Enregistrer l'image dans FOG

Connectez-vous à l'interface web de FOG et allez dans « Gestion des images » :octicons-arrow-right-24: « Create New
Image » (créer une nouvelle image) :

![[capture_image_management.png]]

Donnez un nom à la nouvelle image, laissez les options telles quelles et
cliquez sur « Ajouter ».

L'objectif de cette étape est d'enregistrer une nouvelle image dans FOG (vous
pouvez gérer plusieurs images). L'image sera une copie du disque dur complet et
toutes les partitions du disque seront capturées puis déployées.

## Associer l'image à la machine

Allez maintenant dans « Gestion des machines » :octicons-arrow-right-24: « List All Hosts » (lister toutes
les machines) et cliquez sur la machine que vous venez d'enregistrer :

![[capture_host_management_1.png]]

Pour l'instant, le nom de la machine est son adresse MAC. Ne vous en souciez
pas pour le moment, car nous n'utiliserons cette machine que pour capturer une
image.

![[capture_host_management_2.png]]

Dans la liste déroulante « Image machine », choisissez l'image que vous venez
de créer. Cliquez ensuite sur « Mettre à jour » en bas de l'écran.

Vous avez maintenant associé l'image Windows 10 à cette machine.

## Créer une tâche de capture

Nous allons maintenant créer une « tâche de capture » pour cette machine. Cette
tâche indique à FOG que, lorsque cette machine démarre depuis le réseau, le
contenu du disque dur doit être capturé et enregistré sur le serveur FOG en
tant qu'image « Windows 10 ».

Toujours dans la gestion de cette machine, allez dans « Tâches basiques » et
choisissez « Capture » :

![[capture_host_capture_1.png]]

Vous pouvez y modifier les paramètres de la tâche de clonage.

Laissez les options telles quelles et cliquez sur « Task » (tâche) :

![[capture_host_capture_2.png]]

Une tâche de capture est maintenant créée.

## Capturer l'image

Démarrez à présent votre machine en veillant à ce qu'elle démarre depuis le
réseau.

Comme une tâche de capture d'image est affectée à cette machine, le menu de
démarrage de FOG ne s'affichera pas : Partclone sera lancé directement et
l'image sera capturée.

Sur la console de votre machine, vous verrez d'abord FOG effectuer certaines
opérations, comme le redimensionnement des partitions, puis Partclone sera
exécuté :

![[capture_partclone.png]]

Le contenu du disque dur sera lu puis écrit via le réseau sous forme de fichier
image compressé sur le serveur FOG. Selon la vitesse de votre réseau et de vos
ordinateurs, cela peut prendre un certain temps.

Partclone peut être invoqué plusieurs fois, selon le nombre de partitions à
cloner.

Une fois la capture terminée, FOG met à jour la base de données et la machine
redémarre.

Vous avez maintenant capturé une image que vous pouvez déployer facilement sur
d'autres machines avec FOG.
