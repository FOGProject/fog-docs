---
title: Déployer une image multi-disques en double démarrage
aliases:
    - Deploying a Dual-Boot Multi-Disk Image
description: décrit comment déployer une image multi-disques en double démarrage sur d'autres appareils
context_id: deploy-dual-boot-multi-disk-image
tags:
    - dual-boot
    - multi-disk
    - linux
    - postinstall
    - efibootmgr
    - how-to
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/deploy-dual-boot-multi-disk-image).

# Déployer une image multi-disques en double démarrage

Si vous créez une image multi-disques avec une configuration en double
démarrage, les entrées de démarrage EFI ne seront pas conservées
automatiquement lors du déploiement sur un matériel différent.

Pour corriger cela, vous devez créer un script de post-installation qui s'en
charge.

Voir également
<https://forums.fogproject.org/topic/16703/dual-boot-2-disks-unable-to-boot-grub>

## Script post-téléchargement

Les scripts post-téléchargement se trouvent sur le serveur FOG dans `/images/postdownloadscripts/`.

Vous devez utiliser `efibootmgr` dans un script post-téléchargement pour configurer
les entrées de démarrage EFI et conserver votre configuration en double démarrage.
Voici un exemple de ligne, dans un script post-téléchargement, qui ajoute une
entrée de démarrage Debian :

```bash
efibootmgr -c -d /dev/nvme0n1 -p 1 -L "Debian" -l "\EFI\debian\shimx64.efi"
```

Pour la signification de chaque option, la façon d'inspecter et de réordonner les
entrées, et la manière de raccorder le script à `fog.postdownload`, voir
[[uefi-boot-entries|Gérer les entrées de démarrage UEFI (efibootmgr)]] et
[[post-download-scripts|Scripts post-téléchargement]].
