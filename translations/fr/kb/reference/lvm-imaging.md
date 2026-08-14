---
title: LVM et imagerie
aliases:
    - LVM and Imaging
    - LVM
    - Logical Volume Manager
    - Imaging LVM Volumes
description: Comment FOG capture et déploie les volumes LVM Linux volume logique par volume logique, quelles dispositions sont prises en charge, et comment revenir à l'ancien comportement de capture brute
context_id: lvm-imaging
tags:
    - imaging
    - linux
    - lvm
    - reference
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/lvm-imaging).

# LVM et imagerie

La plupart des installeurs Linux modernes (Ubuntu, RHEL/Rocky/Alma, Fedora,
openSUSE) utilisent **LVM** par défaut : au lieu de placer les systèmes de
fichiers directement sur des partitions, ils créent une partition en tant que
**volume physique** LVM (PV), la regroupent dans un **groupe de volumes** (VG)
et y découpent les véritables systèmes de fichiers sous forme de **volumes
logiques** (LV) — généralement un LV racine et un LV d'échange.

FOG image ces installations **volume logique par volume logique**. Cela fait
partie du moteur d'imagerie FOS, et s'applique donc à toute version de serveur
FOG exécutant une version de FOS qui l'inclut.

> [!note]
> **Comportement des anciennes versions de FOS.** Les versions de FOS dépourvues
> de la prise en charge par LV capturent toute la partition du PV octet par
> octet avec `partclone.imager`, qui ne dispose d'aucune carte des blocs
> utilisés pour LVM — un PV de 500 Go contenant 20 Go de données produisait une
> lecture d'environ 500 Go à la capture. Ce chemin existe toujours et c'est
> celui vers lequel se rabattent les dispositions non prises en charge (voir
> ci-dessous).

## Ce que fait la capture

Lorsque la capture trouve une partition contenant un volume physique LVM
(détecté par son contenu, ce qui fonctionne quel que soit l'identifiant de type
de la partition), elle :

1. Active le groupe de volumes et vérifie que la disposition est prise en
   charge (voir ci-dessous).
2. Avec un type d'image redimensionnable, réduit le système de fichiers de
   chaque volume logique ext avant la capture — la même étape « Resizing
   filesystem » que subissent les partitions simples — puis le rétablit ensuite
   sur la machine source. C'est ce qui permet de déployer l'image sur des
   disques plus petits (voir
   [Dimensionnement](#dimensionnement--déployer-sur-des-disques-de-tailles-différentes) ci-dessous).
3. Consigne la disposition PV/VG/LV — noms, UUID, tailles et taille minimale de
   chaque volume — dans deux petits fichiers de métadonnées stockés avec l'image
   (`dNpM.lvm` et `dNpM.lvm.vgcfg`).
4. Capture **chaque volume logique individuellement** avec le type de partclone
   correspondant à son système de fichiers, en ne prenant que les blocs utilisés
   — exactement comme une partition ordinaire est capturée. Chaque LV devient
   son propre fichier dans l'image (`dNpM.<lvname>.img`).
5. Les LV d'échange ne sont pas imagés du tout ; seul leur UUID est consigné,
   exactement comme pour les partitions d'échange.

La taille de l'image et la durée de capture deviennent proportionnelles aux
**données contenues dans les volumes logiques**, et non à la taille de la
partition du PV.

## Ce que fait le déploiement

Le déploiement recrée la partition, reconstruit le PV et le VG à partir des
métadonnées consignées, restaure le système de fichiers de chaque volume logique
et régénère les LV d'échange. Sur une cible de taille identique (ou supérieure)
à l'originale, **tous les UUID sont préservés** — volume physique, groupe de
volumes, volumes logiques, systèmes de fichiers et échange — de sorte que
`/etc/fstab`, les configurations GRUB et les références de l'initramfs du
système déployé continuent de fonctionner sans modification. Ce qui se passe sur
des cibles d'autres tailles est traité dans
[Dimensionnement](#dimensionnement--déployer-sur-des-disques-de-tailles-différentes) ci-dessous.

Les échecs de déploiement sont traités comme fatals : la tâche s'arrête avec un
message plutôt que de laisser un groupe de volumes à moitié restauré qui
pourrait sembler démarrer.

## Dispositions prises en charge

L'imagerie par LV prend en charge la disposition que créent par défaut les
installeurs de bureau et de serveur :

- **un seul groupe de volumes** sur le PV,
- le VG réside **entièrement sur ce seul PV**, et
- tous les volumes logiques sont **linéaires** (des LV simples — le
  comportement par défaut).

Tout le reste se rabat sur l'ancienne capture brute de toute la partition du PV
— le comportement préexistant, et non un échec. Le journal de capture vous
indique quand cela se produit et pourquoi :

```
 * LVM layout is not supported for per-LV capture: volume group vg0 spans 2 physical volumes
 * Falling back to raw capture of the whole physical volume
```

Dispositions qui provoquent ce repli :

- **Groupes de volumes multi-PV** — un VG s'étendant sur deux disques ou
  partitions ou plus.
- **Pools fins, LV RAID/miroir, LV de cache, instantanés** — tout LV non
  linéaire dans le VG.
- **Un PV sans groupe de volumes** dessus.

Un PV capturé en brut se déploie comme avant : octet par octet, et uniquement
sur une partition de taille identique (en pratique, cela signifie le type
d'image *Multiple Partition Image - All Disks*).

Deux autres cas à connaître :

- **LUKS à l'intérieur d'un LV** (par exemple l'option « chiffrer avec LVM »
  d'Ubuntu) ne pose pas de problème — le LV chiffré est capturé en brut, mais
  seulement à la taille du LV, et se restaure correctement.
- **Les PV sur disque entier** (un PV créé directement sur `/dev/sdb` sans table
  de partitions) ne sont ni détectés ni capturés. C'est inchangé par rapport à
  avant.

## Dimensionnement : déployer sur des disques de tailles différentes

Avec le type d'image *Single Disk - Resizable*, les images LVM se
redimensionnent pour s'adapter au disque cible, comme le font les partitions
simples. Ce qui se passe dépend de la taille de la cible par rapport à la
source :

- **Taille identique** — le groupe de volumes est restauré exactement tel
  qu'il était, tous les UUID préservés.
- **Plus grande** — le groupe de volumes est restauré depuis ses métadonnées
  d'origine, puis la partition du PV et le volume physique s'étendent dans
  l'espace supplémentaire, lequel est réparti entre les volumes logiques hors
  échange **proportionnellement à leurs tailles d'origine**. Les LV d'échange
  conservent leur taille d'origine. Tous les UUID sont également préservés ici.
- **Plus petite** — le groupe de volumes est reconstruit avec les outils LVM
  standard, à la taille minimale consignée pour chaque volume, plus une part
  proportionnelle de l'espace dont dispose la cible au-delà. Les **noms** du VG
  et des LV, l'UUID du PV, les UUID des systèmes de fichiers et ceux de
  l'échange sont tous préservés, de sorte que `/etc/fstab`, GRUB et les
  références de l'initramfs continuent de fonctionner ; les UUID du VG et des LV
  eux-mêmes sont régénérés (rien, dans une installation standard, ne les
  référence).
- **Plus petite que le minimum consigné** — le déploiement est refusé avec un
  message indiquant ce minimum, avant que quoi que ce soit ne soit écrit sur le
  disque.

Comme un PV capturé par LV est lui-même redimensionnable, *Single Disk -
Resizable* n'a plus besoin d'une partition non-LVM redimensionnable distincte
sur le disque — un disque composé uniquement d'un EFI et d'un PV fonctionne.

Deux réserves :

- **Les images capturées avant la prise en charge du redimensionnement** (ou
  avec une version de FOS qui en est dépourvue) ne consignent aucune taille
  minimale : elles ne se déploient donc que sur des disques de taille identique
  ou supérieure ; une cible plus petite est refusée avec un message invitant à
  recapturer. Recapturer avec un FOS à jour rend l'image réductible.
- **Avec les types d'image *Multiple Partition***, rien n'est redimensionné :
  le groupe de volumes est restauré à sa taille d'origine et, sur un disque plus
  grand, l'espace supplémentaire reste non alloué après la partition du PV —
  vous pouvez vous y étendre manuellement
  (`growpart`/`pvresize`/`lvextend`) après le déploiement.

## Multicast

Le déploiement multicast d'images LVM fonctionne, mais il exige que **les deux**
côtés soient à jour : une version de FOS prenant en charge le multicast LVM *et*
un serveur FOG (1.6 ou ultérieur) dont l'émetteur multicast connaît les fichiers
d'image par LV. Le multicast synchronise les flux uniquement par ordre — chaque
récepteur rejoint le fichier suivant envoyé par le serveur — de sorte que le
client vérifie le serveur avant de toucher au disque et refuse de fonctionner
avec un serveur qui enverrait les mauvais fichiers :

```
The FOG server does not support multicast deploy of LVM images; update the server or deploy unicast
```

Si vous voyez ce message, mettez à jour le serveur FOG, ou déployez avec des
tâches **unicast** (les déploiements de groupe sont en unicast, machine par
machine). Une machine qui refuse laisse son disque intact, mais notez que la
session multicast elle-même continue d'attendre ce récepteur jusqu'à
l'expiration de son délai d'attente maximal — comme pour tout abandon côté
client dans une tâche multicast.

Les images en fichiers fractionnés (une option de capture non activée par
défaut) ne sont compatibles avec le multicast pour aucun type d'image ; cette
limitation est inchangée.

## Revenir à l'ancien comportement : `skiplvm=1`

Si la capture par LV se comporte mal sur une machine donnée, ajoutez
`skiplvm=1` aux **arguments de noyau** de la machine (Gestion des machines → la
machine → *Host Kernel Arguments*) et relancez la capture. FOS traite alors la
partition du PV exactement comme le faisaient les versions plus anciennes : une
seule image brute de toute la partition. Retirez l'argument pour retrouver le
comportement par LV.

## Compatibilité des images

- **Les anciennes images se déploient sans changement.** Une image capturée
  avant la prise en charge par LV comporte un fichier d'image brut du PV et
  aucun fichier de métadonnées LVM : le déploiement emprunte donc le chemin brut
  qu'il a toujours emprunté.
- **Les nouvelles images nécessitent un FOS à jour.** Une image LVM capturée
  avec la prise en charge par LV ne peut pas être déployée par un client FOS
  plus ancien — faites évoluer ensemble le client (noyau + init) et les images,
  comme pour toute fonctionnalité de FOS. Un déploiement refusera également,
  plutôt que de deviner, s'il rencontre des métadonnées écrites par un FOS **plus
  récent** que celui qui déploie :

```
Image was captured with a newer LVM format (LVMFORMAT 3), update FOS
```

## Voir aussi

- [[images|Gestion des images]] — les types d'image et leurs contraintes
- [[capture-an-image|Capturer une image]]
- [[deploy-an-image|Déployer une image]]
- [[sector-size-imaging|Tailles de secteur et imagerie]] — l'autre contrainte
  de géométrie sur les déploiements
