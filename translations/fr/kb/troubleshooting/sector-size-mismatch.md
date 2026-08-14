---
title: Déploiement refusé — taille de secteur incompatible
aliases:
    - Sector Size Mismatch
    - Deploy Refused Sector Size
description: Que faire lorsqu'un déploiement s'arrête sur un message « Sector size mismatch »
context_id: sector-size-mismatch
tags:
    - troubleshooting
    - imaging
    - deploy
    - nvme
    - 4kn
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/troubleshooting/sector-size-mismatch).

# Déploiement refusé — taille de secteur incompatible

## Symptôme

Une tâche de déploiement s'arrête tôt — avant l'écriture sur le disque — avec un
message de ce genre :

```
Sector size mismatch
   Image was captured on a disk with 4096-byte logical sectors, but /dev/sda
   uses 512-byte logical sectors.
   Partition-table and filesystem geometry cannot be translated between logical
   sector sizes, so this image cannot be deployed to this disk.
   Deploy this image only to a disk with 4096-byte logical sectors, or capture a
   new image on a disk with 512-byte logical sectors.
```

## Ce que cela signifie

L'image a été capturée sur un disque dont la **taille de secteur logique** (512
ou 4096 octets) diffère de celle du disque sur lequel vous déployez. FOG ne peut
pas convertir la géométrie de la table de partitions et du système de fichiers
entre les deux : il refuse donc plutôt que d'écrire un disque qui ne démarrerait
pas. **Rien n'a été écrit** — le disque cible est intact.

Sur les versions plus récentes de FOS, le message comporte également une ligne
sur le type de périphérique cible, par exemple :

```
   /dev/mmcblk0 is an eMMC/SD device; its 512-byte logical sector size is fixed
   by the MMC/SD specification and cannot be changed. Only an image captured on
   512-byte-sector hardware can deploy to it.
```

Cette ligne vous indique quel côté de l'incompatibilité peut être corrigé : si la
taille de secteur de la cible est **fixe** (eMMC/SD, UFS), recapturer sur du
matériel correspondant est le seul remède ; si la cible est un **disque
virtuel**, vous pouvez à la place changer sa taille de secteur dans la
configuration de disque de la machine virtuelle.

Pour l'explication complète des causes de ce phénomène — et de ce que chaque type
de périphérique peut ou ne peut pas faire — voir
[[sector-size-imaging|Tailles de secteur et imagerie]].

## Comment y remédier

Choisissez ce qui correspond à votre situation :

1. **Déployer sur du matériel correspondant.** Envoyez cette image vers un disque
   ayant la même taille de secteur logique que celui sur lequel elle a été
   capturée (le message vous indique laquelle). Les disques 512n et 512e sont
   interchangeables ; les disques 4Kn ne sont interchangeables avec aucun des
   deux.

2. **Recapturer avec la géométrie cible.** S'il vous faut cette image sur le
   matériel actuel, capturez une nouvelle image depuis une machine dont le disque
   correspond, puis déployez cette image-là.

3. **Laisser FOS reformater une cible NVMe.** Si la cible est un disque **NVMe**
   qui prend en charge la taille de secteur de l'image, FOS propose de le
   reformater à bas niveau pour la faire correspondre, après une fenêtre
   d'annulation de 60 secondes. Voir
   [[sector-size-imaging#Les cibles NVMe peuvent être reformatées pour correspondre|Les cibles NVMe peuvent être reformatées pour correspondre]].
   NVMe est le seul type de périphérique pour lequel cela fonctionne — pas les
   cibles SATA/SAS, eMMC/SD, UFS ou USB, ni les disques NVMe exclusivement 4Kn.
   Voir
   [[sector-size-imaging#Tailles de secteur par type de périphérique|Tailles de secteur par type de périphérique]]
   pour le détail par type.

4. **Cible sur machine virtuelle ?** La taille de secteur logique du disque est
   fixée par l'hyperviseur, non par le disque virtuel lui-même. Modifiez le
   `logical_block_size` du disque (QEMU/libvirt/Proxmox) pour qu'il corresponde à
   l'image, puis redéployez.

## Vérifier la taille de secteur d'un disque

Depuis un interpréteur FOS (une tâche de débogage) ou n'importe quelle machine
Linux :

```
blockdev --getss /dev/sdX     # logical sector size: 512 or 4096
blockdev --getpbsz /dev/sdX   # physical sector size
```

Faites correspondre la taille **logique** (`--getss`) entre le disque source de
l'image et la cible du déploiement.

## Voir aussi

- [[sector-size-imaging|Tailles de secteur et imagerie]] — la référence complète
- [[deploy-an-image|Déployer une image]]
