---
title: Tailles de secteur et imagerie
aliases:
    - Sector Sizes and Imaging
    - Logical Sector Size
    - 4Kn
    - 512e
description: Pourquoi la taille de secteur logique d'une image doit correspondre à celle du disque de destination, ce que fait FOG lorsqu'elles diffèrent, et quand une cible NVMe peut être reformatée pour correspondre
context_id: sector-size-imaging
tags:
    - imaging
    - disks
    - nvme
    - 4kn
    - reference
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/sector-size-imaging).

# Tailles de secteur et imagerie

Chaque disque annonce deux tailles de secteur : une taille de secteur
**logique** (l'unité dans laquelle le système d'exploitation lit et écrit) et
une taille de secteur **physique** (l'unité dans laquelle le disque stocke
réellement les données). Pour l'imagerie, celle qui compte est la taille de
secteur **logique**.

- **512n** — 512 octets logiques, 512 octets physiques. Les disques
  traditionnels.
- **512e** — 512 octets logiques, 4096 octets physiques. La plupart des disques
  SATA/SAS actuels. Du point de vue de FOG, ils se comportent exactement comme
  des 512n : la taille logique est de 512.
- **4Kn** — 4096 octets logiques, 4096 octets physiques. Courant sur les NVMe
  d'entreprise et certains grands disques SAS.

Vous pouvez lire la taille de secteur logique d'un disque depuis un interpréteur
FOS (ou n'importe quelle machine Linux) avec `blockdev --getss /dev/sdX`, qui
affiche `512` ou `4096`.

> [!important]
> **512n et 512e se mélangent librement.** Une image capturée sur un disque 512e
> se déploie sans problème sur un disque 512n, et inversement, car tous deux
> utilisent un secteur **logique de 512 octets**. Le problème décrit ci-dessous
> ne concerne que les disques à **logique de 512 octets** et les disques **4Kn**
> (logique de 4096 octets).

## Pourquoi une incompatibilité casse l'imagerie

FOG capture le contenu des partitions avec partclone et la table de partitions
avec sfdisk. Tous deux consignent la géométrie dans les **secteurs logiques** du
disque source :

- la table de partitions stocke le début et la longueur de chaque partition en
  unités LBA (secteurs logiques), et
- les métadonnées propres à chaque système de fichiers figent la taille de
  secteur avec laquelle il a été créé.

Au déploiement, FOG restaure cette table et ces systèmes de fichiers **tels
quels** — il ne convertit pas, et ne peut pas convertir sans risque, les nombres
d'une taille de secteur à l'autre. Ainsi, si vous capturez sur un disque 4Kn et
déployez sur un disque de 512 octets (ou l'inverse), les décalages des
partitions tombent au mauvais endroit et les systèmes de fichiers décrivent une
géométrie que le disque n'a pas. Le résultat est un disque impossible à monter
et à démarrer — souvent sans erreur visible au moment du déploiement.

Il n'existe aucun moyen fiable de convertir une image d'une taille de secteur
logique à une autre après la capture. L'image doit être déployée sur un disque
ayant **la même taille de secteur logique** que celui sur lequel elle a été
capturée.

## Ce que FOG fait à ce sujet

FOS effectue cette vérification avant de toucher au disque cible. Cela fait
partie du moteur d'imagerie FOS, et s'applique donc à toute version de serveur
FOG exécutant une version de FOS qui l'inclut. Lorsque FOS commence une
restauration de table de partitions, il compare :

- la taille de secteur de l'**image**, lue dans la ligne `sector-size:` du vidage
  sfdisk stocké, avec
- la taille de secteur logique du **disque cible**, obtenue par
  `blockdev --getss`.

Si les deux sont connues et diffèrent, FOS **arrête le déploiement** plutôt que
d'écrire un disque impossible à démarrer. Le message nomme les deux tailles, par
exemple :

```
Sector size mismatch
   Image was captured on a disk with 4096-byte logical sectors, but /dev/nvme0n1
   uses 512-byte logical sectors.
   Partition-table and filesystem geometry cannot be translated between logical
   sector sizes, so this image cannot be deployed to this disk.
   Deploy this image only to a disk with 4096-byte logical sectors, or capture a
   new image on a disk with 512-byte logical sectors.
```

Il s'agit d'un refus, pas d'une corruption — rien n'a été écrit sur le disque à
ce stade.

### Les cibles NVMe peuvent être reformatées pour correspondre

Les espaces de noms NVMe peuvent souvent être **reformatés à bas niveau** avec
une autre taille de secteur logique, car le disque expose un ou plusieurs
« formats LBA » sélectionnables. Lorsque la cible est un périphérique NVMe et
qu'elle expose un format LBA correspondant à la taille de secteur de l'image,
FOS la reformate pour la faire correspondre au lieu de simplement refuser :

```
 *** Logical sector-size mismatch on /dev/nvme0n1 ***
   This image was captured with 4096-byte logical sectors.
   /dev/nvme0n1 is an NVMe device that exposes a matching 4096-byte LBA format (lbaf 1).
   FOS will LOW-LEVEL REFORMAT this namespace to 4096-byte sectors so the image can deploy.
   This ERASES the drive (the deploy would erase it regardless) and cannot be undone.

 You have 60 seconds to power off this computer to cancel!
```

- FOS décompte pendant **60 secondes**. Pour annuler, **éteignez la machine**
  pendant le décompte — rien n'a encore été modifié.
- Si vous laissez faire, FOS reformate l'espace de noms avec `nvme format`,
  confirme la nouvelle taille logique en relisant le disque, puis poursuit le
  déploiement. Si le reformatage ne prend pas, FOS refuse au lieu de continuer.
- Le reformatage **efface l'espace de noms**. Il ne s'agit pas d'une perte de
  données supplémentaire — un déploiement écrase le disque de toute façon — mais
  cela signifie qu'il n'y a pas de retour en arrière.

> [!note]
> Cela ne s'applique qu'au **NVMe**. Certains disques NVMe sont **exclusivement
> 4Kn** et n'exposent aucun format LBA de 512 octets ; ceux-là ne peuvent
> recevoir que des images 4Kn. Aucun autre type de périphérique ne peut être
> re-sectorisé — voir le détail par type ci-dessous. Dans tous les cas où la
> géométrie ne peut pas être alignée, FOS refuse plutôt que de produire un
> disque défectueux.

## Tailles de secteur par type de périphérique

« FOG ne peut-il pas simplement le reformater comme un NVMe ? » est une question
légitime pour chaque type de disque ; voici donc le panorama complet. La réponse
courte : **le NVMe est le seul type de périphérique disposant d'un moyen sûr et
normalisé de changer sa taille de secteur logique**, c'est pourquoi c'est le
seul que FOS reformate automatiquement.

| Type de cible | Taille de secteur logique | Peut-elle être changée ? |
|---|---|---|
| **NVMe** (`/dev/nvmeXnY`) | 512 ou 4096, selon le format LBA | **Oui** — si le disque expose un format LBA à la taille voulue, FOS le reformate automatiquement (voir ci-dessus) |
| **eMMC / SD** (`/dev/mmcblkX`) | 512, toujours | Non — fixée par la spécification MMC/SD |
| **UFS** (apparaît comme `/dev/sdX`) | 4096 sur la plupart des modules | Non — définie lors du provisionnement du module en usine et non modifiable sur le terrain |
| **SATA / SAS** (`/dev/sdX`) | 512 sur la plupart des disques (512n/512e), 4096 sur les disques 4Kn | Non — un petit nombre de disques d'entreprise prennent en charge la re-sectorisation « FastFormat » du constructeur, mais elle nécessite généralement un cycle d'alimentation pour prendre effet, aussi FOG ne tente pas l'opération |
| **Connecté en USB** (`/dev/sdX`) | ce que rapporte la puce de pont du boîtier | Non — c'est le pont qui décide, ni le disque ni FOG |
| **Disque virtuel** (`/dev/vdX`, ou `sdX` dans une machine virtuelle) | définie par l'hyperviseur | Pas depuis FOS — mais vous pouvez la changer vous-même dans la configuration de disque de la machine virtuelle (par exemple la propriété de disque `logical_block_size` sous QEMU/libvirt/Proxmox) |

Deux conséquences pratiques de ce tableau :

- **Les cibles eMMC et SD** (tablettes, clients légers, certains mini-PC) ne
  peuvent recevoir que des images capturées sur du matériel à **logique de 512
  octets**. Une image 4Kn ne s'y déploiera jamais ; recapturer sur du matériel
  512 octets est la seule solution.
- **Les machines à base d'UFS** (nombreux portables et tablettes récents, fins
  et légers) produisent des images de **4096 octets**. Celles-ci se déploient
  très bien sur des disques 4Kn et sur des cibles NVMe (le reformatage
  automatique ci-dessus s'occupe du NVMe) — mais jamais sur des cibles SATA,
  eMMC ou USB de 512 octets.

Lorsque FOS refuse une incompatibilité sur l'un de ces types de périphériques,
le message de refus nomme le type de périphérique et indique si sa taille de
secteur est fixe, afin que vous sachiez de quel côté de l'incompatibilité une
correction est possible.

## Quand la vérification s'applique, et quand elle ne s'applique pas

**Elle s'applique** aux déploiements d'images de partitions classiques — disque
unique et multi-partitions, redimensionnables et non redimensionnables — dans
les deux sens (512 ↔ 4Kn).

**Elle ne s'applique pas :**

- **Aux images brutes / `dd` de disque entier.** Elles ne stockent aucune
  géométrie sfdisk : il n'y a donc rien à comparer. Une image brute est une
  copie octet par octet et ne fonctionnera de toute façon que sur un disque de
  taille et de géométrie identiques.
- **Aux restaurations d'une seule partition** (le chemin « sans table de
  partitions » / `nombr`). Elles sautent délibérément la réécriture de la table
  de partitions, et la vérification de la taille de secteur est sautée avec
  elle.
- **Aux images capturées par des versions de FOS très anciennes.** sfdisk n'a
  consigné de ligne `sector-size:` qu'à partir d'util-linux 2.35 (vers 2020).
  Une image capturée par un FOS plus ancien ne porte aucune taille source
  consignée : FOS autorise donc le déploiement plutôt que de deviner et risquer
  un refus injustifié. Toutes les images produites par un FOS actuel consignent
  cette ligne, si bien que les captures récentes sont vérifiées dans les deux
  sens.

## Que faire en cas d'incompatibilité

- **Solution recommandée :** capturez votre image de référence sur du matériel
  ayant la **même taille de secteur logique** que les machines de destination.
  Si votre parc est en disques de 512 octets, capturez sur un disque de 512
  octets ; s'il est en 4Kn, capturez sur du 4Kn.
- **Parcs NVMe :** si vos cibles sont en NVMe, laissez FOS les reformater pour
  correspondre (voir ci-dessus), ou préformatez-les vous-même au format LBA
  voulu.
- **Parcs mixtes :** si vous déployez le même système d'exploitation sur du
  matériel 512 octets et 4Kn, conservez **deux images** — une capturée sur
  chaque géométrie.

## Voir aussi

- [[sector-size-mismatch|Dépannage : déploiement refusé pour incompatibilité de taille de secteur]]
- [[capture-an-image|Capturer une image]]
- [[deploy-an-image|Déployer une image]]
- [[hardware|Matériel pris en charge]]
