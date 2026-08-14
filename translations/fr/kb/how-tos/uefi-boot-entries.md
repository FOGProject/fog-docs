---
title: Gérer les entrées de démarrage UEFI (efibootmgr)
aliases:
    - Managing UEFI Boot Entries (efibootmgr)
    - UEFI Boot Entries
    - efibootmgr
description: Pourquoi certaines machines UEFI imagées ne démarrent pas, et comment recréer leurs entrées de démarrage UEFI avec efibootmgr depuis un script post-déploiement
context_id: uefi-boot-entries
tags:
    - uefi
    - efibootmgr
    - boot-entries
    - post-download
    - dual-boot
    - multi-disk
    - troubleshooting
    - how-to
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/uefi-boot-entries).

# Gérer les entrées de démarrage UEFI (efibootmgr)

## Pourquoi FOG ne s'en charge pas pour vous

Sur un système UEFI, le micrologiciel n'analyse pas les disques à la recherche de
chargeurs d'amorçage comme le faisait le BIOS hérité. Il conserve à la place une
liste ordonnée d'**entrées de démarrage** dans la NVRAM de la carte mère. Chaque
entrée consigne un libellé, le disque et la partition système EFI (ESP) à
utiliser, ainsi que le chemin d'un chargeur d'amorçage (par exemple
`\EFI\debian\shimx64.efi`).

Ces entrées résident dans le micrologiciel, **pas sur le disque**. FOG capture et
déploie le contenu des *disques* — il ne recrée pas les entrées de démarrage du
micrologiciel. Une machine UEFI fraîchement imagée peut donc avoir un système de
fichiers parfaitement intact mais **aucune entrée de démarrage fonctionnelle** :
elle ne démarre pas, tombe sur une invite de secours GRUB, ou signale « no
bootable device ».

Cela vous arrive le plus souvent lorsque :

-   vous déployez sur un **matériel différent** de celui sur lequel l'image a
    été capturée,
-   l'image s'étend sur **plusieurs disques**, ou
-   la machine est en **double amorçage** (par exemple Windows + Linux), auquel
    cas c'est l'entrée du système d'exploitation secondaire qui disparaît.

> [!note]
> Les déploiements Windows sur un seul disque et un seul système d'exploitation
> démarrent généralement sans problème, car la plupart des micrologiciels se
> rabattent sur le chemin par défaut `\EFI\BOOT\bootx64.efi`. Le problème
> apparaît pour les chargeurs *non standard* — c'est-à-dire précisément le cas
> du double amorçage ou du second disque.

## Inspecter les entrées de démarrage

Exécutez `efibootmgr` depuis un système Linux démarré (ou depuis l'environnement
FOS post-déploiement) pour voir les entrées actuelles :

```bash
efibootmgr -v
```

Cela liste chaque entrée `Boot####`, l'ordre de démarrage `BootOrder` en vigueur
et le chemin de périphérique vers lequel pointe chaque entrée. Utilisez cette
commande pour confirmer si l'entrée attendue est absente ou pointe vers le
mauvais disque ou la mauvaise partition.

## Créer une entrée de démarrage

Pour créer une nouvelle entrée, vous indiquez à `efibootmgr` le disque, le numéro
de partition de l'ESP, un libellé et le chemin du chargeur :

```bash
efibootmgr -c -d /dev/nvme0n1 -p 1 -L "Debian" -l "\EFI\debian\shimx64.efi"
```

| Option | Signification |
| --- | --- |
| `-c` | créer une nouvelle entrée de démarrage |
| `-d /dev/nvme0n1` | le **disque** contenant l'ESP |
| `-p 1` | le **numéro de partition** de l'ESP sur ce disque |
| `-L "Debian"` | le **libellé** lisible affiché dans le menu de démarrage du micrologiciel |
| `-l "\EFI\debian\shimx64.efi"` | **chemin** du chargeur d'amorçage sur l'ESP (barres obliques inverses, à la mode EFI) |

Une nouvelle entrée est ajoutée en tête de l'ordre de démarrage. Autres
opérations utiles :

```bash
efibootmgr -o 0002,0000     # set the boot order (highest priority first)
efibootmgr -b 0003 -B       # delete boot entry 0003
```

## L'exécuter automatiquement avec un script post-déploiement

Vous ne voulez pas lancer cela à la main à chaque déploiement. FOG peut exécuter
un script sur la machine **après l'écriture de l'image mais avant le
redémarrage** : un *script post-déploiement*.

Le script principal se trouve sur le serveur FOG dans :

```
/images/postdownloadscripts/fog.postdownload
```

`fog.postdownload` est le point d'entrée exécuté par FOS. Depuis celui-ci, vous
appelez vos propres scripts à l'aide de la variable `${postdownpath}`. Créez par
exemple `/images/postdownloadscripts/efi-fixup.sh` contenant votre ou vos
commandes `efibootmgr`, puis activez-le en ajoutant cette ligne à
`fog.postdownload` :

```bash
. ${postdownpath}efi-fixup.sh
```

Dans le script, les disques déployés sont accessibles comme les périphériques en
mode bloc habituels (par exemple `/dev/nvme0n1`) : la même commande
`efibootmgr -c …` présentée ci-dessus y fonctionne donc. FOS exporte des
variables telles que `$hostname` et `$img`, ce qui vous permet de conditionner
le traitement à la machine ou à l'image si une correction ne doit s'appliquer
qu'à certaines machines.

Voir [[post-download-scripts|Scripts post-déploiement]] pour le mécanisme
post-déploiement dans son ensemble, et
[[deploy-dual-boot-multi-disk-image|Déployer une image multi-disque en double amorçage]]
pour le déroulé du double amorçage dont cette page est issue.

## Références

-   [Dual boot 2 disks unable to boot grub (forums FOG)](https://forums.fogproject.org/topic/16703/dual-boot-2-disks-unable-to-boot-grub)
