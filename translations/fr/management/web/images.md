---
title: Gestion des images
aliases:
    - Image Management
description: page d'index des images
context_id: images
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - images
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/images).

# Gestion des images

-   Les objets image dans FOG représentent les fichiers physiques contenant
    les images de disque ou de partition enregistrées sur le serveur FOG.


## Créer des objets image

-   Les objets image se créent dans la section Images du portail de gestion de
    FOG. Pour créer une nouvelle image, cliquez sur le bouton « New Image » du
    menu de gauche. Un objet image nécessite un nom et un chemin de fichier
    image.

### Nom et chemin de l'image

-   **Image Name** est le nom convivial servant à identifier l'image dans toute
    l'interface de FOG — lors de son affectation à des machines, de la
    planification de tâches et dans les rapports. Utilisez quelque chose de
    descriptif (par exemple `win11-lab` ou `ubuntu-2404-base`).

-   **Image Path** est le nom du dossier, sous le répertoire des images du nœud
    de stockage (`/images` par défaut), où les fichiers de l'image sont
    enregistrés. Il doit être unique. Par convention, il correspond au nom de
    l'image, ne contient pas d'espaces et est en minuscules.

### Système d'exploitation

-   Le champ **Operating System** indique à FOG quel système d'exploitation
    l'image contient. Sélectionnez celui de la machine source.

-   FOG utilise ce paramètre pour appliquer le traitement approprié lors de la
    capture et du déploiement (corrections de système de fichiers et de
    chargeur d'amorçage adaptées à ce système). Un réglage incorrect peut rendre
    une image déployée incapable de démarrer : veillez donc à ce qu'il
    corresponde au système réellement contenu dans l'image.

### Type d'image

-   Lors de la création d'images, plusieurs choix s'offrent à vous quant à la
    manière dont l'image doit se « comporter ». Les types de partitionnement
    possibles sont :

>[!info]
>
>- Single Disk - Resizable
  >  - Multiple Partition Image - Single Disk (Not Resizable)
  >  - Multiple Partition Image - All Disks (Not Resizable)
   > - Raw Image (Sector By Sector, DD, Slow)

#### Single Disk - Resizable

-   C'est le choix par défaut de FOG, car il fonctionne dans la plupart des cas
    et permet également le déploiement sur des disques de plus petite taille.

-   Il copie chaque partition du disque et réduit, lorsque c'est possible, la
    taille des partitions disposant d'un espace libre excessif.

-   

    Chaque partition redimensionnable passe par une étape de « redimensionnement du système de fichiers ».

    :   -   Cette opération peut prendre du temps selon l'importance de la
            fragmentation du disque.
        -   Les partitions réduites le sont jusqu'à ne laisser que 2 Go
            d'espace libre.
        -   Cela permet de déployer une image prise sur un disque de 6 To
            n'utilisant que 20 Go sur un disque d'une capacité totale
            d'environ 25 Go.
        -   Lorsque les partitions sont écrites sur le disque de destination,
            toutes les partitions redimensionnées sont intelligemment étendues
            pour occuper la totalité du disque.
        -   Sur les versions de FOS prenant en charge le
            [[lvm-imaging|redimensionnement LVM]], les configurations LVM sous
            Linux sont également redimensionnées — les volumes logiques du
            groupe de volumes sont réduits et étendus pour s'adapter au disque
            cible, si bien qu'un disque entièrement LVM (EFI + volume physique
            LVM) fonctionne avec ce type d'image.

#### Multiple Partition Image - Single Disk (Not Resizable)

-   Si vous n'avez pas besoin de déployer sur un disque plus petit, vous pouvez
    envisager ce type d'image : il risque moins de poser problème et la taille
    de l'image sur le serveur reste aussi réduite qu'avec le type
    redimensionnable.

-   Single Disk sauvegarde toutes les partitions prises en charge du premier
    disque détecté par FOG, mais les partitions ne sont PAS redimensionnées par
    FOG.

-   Cela signifie que l'image doit être restaurée sur un disque de capacité
    identique ou supérieure.

-   Il est possible de sauvegarder des disques NTFS comportant des partitions
    de « restauration » propres au fabricant avec ce type d'image.

-   

    Il est possible de capturer des systèmes Linux avec ce type d'image aux conditions suivantes

    :   -   Un chargeur d'amorçage Grub est présent.
        -   Les configurations LVM sont prises en charge sur les versions de
            FOS incluant le [[lvm-imaging|clonage LVM par volume logique]] ;
            sur les versions plus anciennes de FOS, LVM ne doit pas être
            utilisé.
        -   Les partitions sont de type **ext2**, **ext3**, **ext4**,
            **reiserfs** et/ou **swap**.
        -   La partition d'échange doit être déplacée hors de la partition
            étendue

#### Multiple Partition Image - All Disks (Not Resizable)

-   C'est ce que vous devez choisir lorsque vous voulez capturer toutes les
    partitions de plusieurs disques.

-   Les partitions ne sont PAS redimensionnables par FOG.

-   

    Si vous ne vouliez capturer qu'une partition ou qu'un disque précis dans un système à plusieurs disques, vous pouvez définir le disque ou la partition souhaités dans une image de type « Single Disk - Resizable » ou « Multiple Partition Image - Single Disk (Not Resizable) ».

    :   -   Cela se fait dans la zone « General » de la machine, dans le champ
            « Host Primary Disk ».

#### Raw Image (Sector By Sector, DD, Slow)

!!! warning WARNING

	Cela doit toujours rester le dernier recours.


-   

    Ce type effectue une copie absolument exacte d'un disque entier et ne compresse pas les données.

    :   -   Autrement dit, si vous prenez une image d'un disque de 6 To,
            l'image obtenue fera 6 To.

-   Ce type d'image demande également un temps **considérable** de capture et
    de déploiement.

!!! note

    Tous ces types d'image peuvent être déployés vers les clients en multicast
    ou en unicast.


### Partition

-   Le paramètre **Partition** détermine quelle part du disque cette image
    capture et déploie :
    -   **Everything** (valeur par défaut) — toutes les partitions du disque.
    -   **Partition Table and MBR only** — uniquement la table de partitions et
        le secteur d'amorçage principal, sans le contenu des partitions.
    -   **Partition _N_ only** — une seule partition précise (de 1 à 10).

-   La plupart des images utilisent **Everything** ; les autres options servent
    aux cas particuliers où vous n'avez besoin que d'une partie d'un disque.

### Gestionnaire d'image

FOG est livré avec deux outils différents (les « gestionnaires ») pour créer
une image de vos disques ou partitions : partclone et partimage. Dans les
premières versions, partimage était le seul outil. Pour des raisons
historiques, partimage reste disponible, mais presque plus personne ne
l'utilise, partclone étant le projet le plus actif et prenant en charge des
systèmes de fichiers plus récents comme APFS.

FOG 1.3.6 a ajouté la possibilité de compresser (Gzip et Zstd) et de découper
les fichiers image. Cela peut être utile si les images sont stockées sur un
support incapable de gérer de très gros fichiers. La compression réduit la
taille des fichiers image mais allonge la durée du clonage. Elle s'effectue sur
la machine cliente : selon le processeur, il est donc judicieux ou non de
l'utiliser. Les générations récentes de processeurs gèrent la compression plus
efficacement, ce qui en fait une excellente option pour économiser de l'espace
d'images et du volume de transfert réseau.

## Ajouter des objets image existants

-   

    Pour restaurer une image dans la base de données de FOG :

    :   -   Créez une nouvelle définition d'image depuis le navigateur de
            gestion
        -   Indiquez le nom de l'image (SampleXPImage)
        -   Indiquez le groupe de stockage (default)
        -   Indiquez le chemin du fichier image (SampleXPImage)
        -   Indiquez le type d'image
        -   Connectez-vous à la machine hébergeant FOG et déplacez ou renommez
            votre image pour qu'elle corresponde à la saisie faite dans le
            navigateur
        -   Créez l'arborescence si nécessaire. Par défaut, FOG place les
            images dans /images/ ; pour l'exemple ci-dessus, vous devriez donc
            créer une arborescence de dossiers ainsi : /images/SampleXPImage
        -   Déposez votre fichier image dans le dossier (assurez-vous qu'il
            porte le même nom que celui de l'image ci-dessus)
