---
title: Scripts post-déploiement
aliases:
    - Post Download Scripts
    - Post Install Scripts
description: Comment utiliser les scripts post-déploiement de FOG pour exécuter votre propre automatisation sur une machine après le déploiement d'une image
context_id: post-download-scripts
tags:
    - driver-injection
    - post-download
    - how-to
    - fos
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/post-download-scripts).

# Scripts post-déploiement

FOG peut exécuter vos propres scripts bash sur une machine **une fois le
déploiement de l'image terminé mais avant le redémarrage de celle-ci**, depuis
l'environnement d'imagerie FOS. C'est le point d'accroche à utiliser pour tout
ce que FOG ne fait pas lui-même : injection de pilotes, recréation des entrées
de démarrage UEFI, renommage de partitions, écriture d'une configuration propre
à la machine, et ainsi de suite.

> [!note]
> Ces scripts s'exécutent **après un déploiement (download)**. Si vous devez
> lancer quelque chose *avant* l'imagerie (par exemple un partitionnement
> personnalisé), utilisez plutôt un script post-init — voir
> [Scripts post-init (avant l'imagerie)](#scripts-post-init-avant-limagerie)
> ci-dessous.

## Fonctionnement

L'installeur crée un répertoire de scripts et un script principal sur votre
serveur FOG :

```
/images/postdownloadscripts/fog.postdownload
```

`fog.postdownload` est le point d'entrée exécuté par FOS. Il est **sourcé**
(avec la primitive `.` / `source`) : tout script que vous appelez depuis lui
s'exécute donc dans le même interpréteur et hérite de toutes les variables de
l'environnement d'imagerie. Le fichier est livré avec la syntaxe d'appel dans
ses commentaires :

```bash
#!/bin/bash
## This file serves as a starting point to call your custom postimaging scripts.
## <SCRIPTNAME> should be changed to the script you're planning to use.
## Syntax of post download scripts are
#. ${postdownpath}<SCRIPTNAME>
```

Pour ajouter votre propre script :

1.  Déposez-le dans `/images/postdownloadscripts/`, par exemple
    `/images/postdownloadscripts/myscript.sh`.
2.  Ajoutez à `fog.postdownload` une ligne qui le source (notez le `.` en tête
    et le fait que `${postdownpath}` pointe déjà vers le répertoire des
    scripts) :

    ```bash
    . ${postdownpath}myscript.sh
    ```

3.  C'est tout — le script s'exécute à chaque déploiement. Utilisez les
    variables décrites ci-dessous pour le limiter à certaines machines ou à
    certaines images.

> [!tip]
> Comme `fog.postdownload` est sourcé, vous n'avez généralement pas besoin de
> faire `chmod +x` sur votre script — mais le garder exécutable ne nuit pas.
> Assurez-vous que les fichiers sont lisibles par l'utilisateur FOG/apache afin
> que FOS puisse les récupérer par NFS.

## Variables disponibles dans votre script

FOS exporte un certain nombre de variables sur lesquelles vous pouvez
conditionner votre traitement. Les plus couramment utilisées sont :

| Variable | Signification |
| --- | --- |
| `$hd` | le disque qui a été imagé (par exemple `/dev/sda` ou `/dev/nvme0n1`) |
| `$disks` | la liste, séparée par des espaces, de tous les disques cibles, pour les images multi-disques |
| `$hostname` | le nom de la machine tel qu'enregistré dans FOG |
| `$mac` | l'adresse MAC principale de la machine |
| `$img` | le nom de l'image qui a été déployée |
| `$osid` | l'identifiant numérique du système d'exploitation défini sur l'image |
| `${postdownpath}` | le chemin du répertoire des scripts post-déploiement |

Les partitions déployées sont présentes en tant que périphériques en mode bloc
habituels, mais FOS ne les laisse pas nécessairement montées — si votre script
doit lire ou écrire des fichiers sur le système d'exploitation déployé, montez
la partition vous-même (par exemple `mount /dev/sda2 /mnt`) et démontez-la
lorsque vous avez terminé.

> [!tip]
> L'ensemble exact des variables peut varier d'une version de FOS à l'autre.
> Pour voir tout ce qui est disponible dans votre environnement, ajoutez
> temporairement `printenv | sort` à votre script et observez l'écran de la
> machine (ou son journal d'imagerie) pendant un déploiement.

## Exemples concrets

-   **Recréer les entrées de démarrage UEFI** après un déploiement multi-disque
    ou en double amorçage —
    [[uefi-boot-entries|Gérer les entrées de démarrage UEFI (efibootmgr)]] et
    [[deploy-dual-boot-multi-disk-image|Déployer une image multi-disque en double amorçage]].
-   **Injection de pilotes Windows** — voir le fil de forum lié ci-dessous.

Un squelette minimal n'agissant que sur une seule image ressemble à ceci :

```bash
#!/bin/bash
# /images/postdownloadscripts/example.sh
case "$img" in
    win11-lab)
        # mount the deployed Windows partition and do something
        mount /dev/${hd#/dev/}2 /mnt 2>/dev/null
        # ... your changes here ...
        umount /mnt 2>/dev/null
        ;;
esac
```

## Scripts post-init (avant l'imagerie)

Il existe un point d'accroche équivalent qui s'exécute **avant** le début de
l'imagerie (juste après le chargement de FOS), utile pour un partitionnement
personnalisé ou une préparation des disques. Il reprend la même organisation que
le post-déploiement :

```
/images/dev/postinitscripts/fog.postinit
```

Appelez vos scripts depuis `fog.postinit` avec :

```bash
. ${postinitpath}<SCRIPTNAME>
```

## Autres exemples et discussions

-   [The magical, mystical FOG post download script (forums FOG)](https://forums.fogproject.org/topic/7740/the-magical-mystical-fog-post-download-script)
-   [FOG post install script for Windows driver injection (forums FOG)](https://forums.fogproject.org/topic/8889/fog-post-install-script-for-win-driver-injection)
