---
title: Déployer une image
aliases:
    - Deploy an image
description: les bases du déploiement d'une image dans FOG
context_id: deploy-an-image
tags:
    - tasks
    - deploy
    - how-to
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/deploy-an-image).

# Déployer une image

L'une des principales fonctions de FOG est de déployer rapidement des images
sur des machines. Il peut s'agir de nouvelles machines que vous introduisez
dans votre environnement ou du reclonage de machines existantes.

## Prérequis

Nous partons du principe que vous avez capturé une image Windows 10 comme
décrit plus haut dans ce manuel. Vous disposez également d'une nouvelle machine
qui n'est pas enregistrée dans FOG et sur laquelle vous souhaitez déployer
l'image.

## Démarrer la machine

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

Choisissez « Perform Full Host Registration and Inventory » (enregistrement
complet et inventaire de la machine).

En mode texte, plusieurs questions vous seront posées :

### Nom de machine

Saisissez le nom que portera cette machine après le clonage. La machine sera
également enregistrée sous ce nom dans l'interface web de FOG.

Saisissez un nom, par exemple « testpc ».

### Identifiant de l'image

Il vous est maintenant demandé quelle image vous souhaitez déployer.
Choisissez « ? » pour obtenir la liste, puis saisissez l'identifiant (numéro)
de l'image à déployer sur cette machine.

### Groupes de machines

Il vous est demandé si vous souhaitez associer cette machine à des groupes de
machines dans FOG. Dans FOG, vous pouvez regrouper des machines et attribuer
certains paramètres et snapins à un groupe. L'appartenance aux groupes pourra
être gérée ultérieurement dans l'interface web.

Pour l'instant, répondez « N ».

### Snapins

Il vous est demandé si vous souhaitez associer des snapins à cette machine. Les
snapins sont des tâches exécutées par le client FOG, principalement utilisées
pour installer des applications par la suite. Les snapins de cette machine
pourront être gérés ultérieurement dans l'interface web.

Pour l'instant, répondez « N ».

### Clé de produit

Pour les machines Windows, vous pouvez ajouter une clé de produit qui sera
appliquée ensuite au système d'exploitation Windows.

Pour l'instant, répondez « N ».

### Intégration au domaine

Pour les machines Windows, le client FOG installé sur la machine peut la faire
rejoindre un domaine Windows. L'appartenance au domaine pourra être gérée
ultérieurement dans l'interface web de FOG.

Pour l'instant, répondez « N ».

### Utilisateur principal

Le nom de l'utilisateur principal de cette machine vous est demandé. Il ne
s'agit pas nécessairement d'un compte connu : ce peut être n'importe quel nom,
et il n'est stocké que dans l'inventaire de FOG.

Pour l'instant, laissez ce champ vide. Appuyez simplement sur Entrée.

### Étiquettes n° 1 et n° 2

Les étiquettes n° 1 et n° 2 vous sont demandées. Ce sont des champs libres dans
lesquels vous pouvez stocker le numéro de série de votre matériel ou un
identifiant issu de votre propre système de gestion de parc. Les étiquettes
sont stockées dans l'inventaire de FOG.

Pour l'instant, laissez ces champs vides. Appuyez deux fois sur Entrée.

### Déployer l'image maintenant

Il vous est ensuite demandé si vous souhaitez déployer l'image immédiatement.
Si vous répondez « Y », alors, en plus d'enregistrer cette machine dans FOG,
une tâche de déploiement sera créée. Au prochain démarrage réseau de cette
machine, l'image lui sera déployée.

Répondez « Y » ici.

### Nom d'utilisateur et mot de passe FOG

Pour enregistrer la machine et la tâche de déploiement, FOG a besoin de vos
identifiants FOG. Ce sont les mêmes que ceux que vous utilisez pour l'interface
web de FOG.

Saisissez votre nom d'utilisateur et votre mot de passe FOG.

Après ces questions, cette machine et son inventaire seront enregistrés dans
FOG et une tâche de déploiement sera créée pour cette machine.

Votre machine redémarrera.

### Déployer l'image

Assurez-vous que votre machine démarre depuis le réseau.

Après le démarrage, partclone sera lancé et l'image présente sur le serveur FOG
sera copiée et décompressée sur votre machine :

### Après le clonage

Une fois le déploiement terminé, votre machine redémarre et, si tout se passe
bien, Windows devrait démarrer.
