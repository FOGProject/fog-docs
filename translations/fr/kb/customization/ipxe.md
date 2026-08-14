---
title: Personnaliser les paramètres iPXE de FOG
aliases:
    - Customizing FOG iPXE Settings
description: page d'index pour ipxe
context_id: ipxe
tags:
    - in-progress
    - convert-Wiki2MD
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/customization/ipxe).

# Personnaliser les paramètres iPXE de FOG

Voir [[using-fog-boot-menu|Utiliser le menu de démarrage FOG]] pour les commandes
intégrées disponibles à l'invite de démarrage sans aucune personnalisation ; cette
page traite de l'ajout de vos propres entrées et de votre propre arrière-plan.

## Arrière-plan personnalisé

Vous pouvez ajouter une image d'arrière-plan personnalisée.

Placez le fichier dans le répertoire suivant : `/var/www/fog/service/ipxe`

Et utilisez une résolution de 800x600.

## Préambule à l'ajout d'entrées de démarrage iPXE

Si vous avez beaucoup de fichiers pour des entrées de démarrage personnalisées,
je recommande vivement de placer ces fichiers sur un autre serveur web. En effet,
l'utilisation du processeur sera très élevée à cause de PHP FPM.

## Ajouter une image basée sur WindowsPE

Vous avez tout d'abord besoin de WIMBOOT. C'est un outil qui permet de démarrer
WindowsPE via iPXE et de charger les fichiers en mémoire vive. Vous pouvez le
télécharger ici :
`https://github.com/ipxe/wimboot/releases/latest/download/wimboot`

Placez ces fichiers sur un serveur web, dans un dossier dédié.

Vous pouvez ensuite ajouter votre ISO décompressée sur le serveur web.

Il vous faut maintenant créer une entrée de démarrage personnalisée.

    #ajout du serveur web comme variable
    set URL http://yourwebserver/
    #import de wimboot
    kernel ${URL}wimboot/wimboot
    #import de l'exécutable de votre processus de démarrage
    initrd ${URL}ISOfolder/Boot/BCD BCD
    #import de boot.sdi
    initrd ${URL}ISOfolder/Boot/boot.sdi boot.sdi
    #import de boot.wim
    initrd ${URL}ISOfolder/Boot/boot.wim boot.wim
    #indique à iPXE de démarrer les fichiers chargés en mémoire vive
    boot
