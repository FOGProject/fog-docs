---
title: Import / Export CSV
description: Décrit le nouveau comportement d'import/export CSV de FOG 1.6 et pourquoi cette méthode a été choisie
context_id: csv_import_export
aliases:
    - CSV Import / Export
    - Import CSV
    - Export CSV
tags:
    - 1_6-changes
    - import
    - export
    - csv
    - configuration
    - management
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/csv_import_export).

# Import / Export CSV

FOG peut importer et exporter en masse la plupart des objets de gestion
(machines, images, snapins, groupes, imprimantes, utilisateurs, modules,
groupes de stockage et nœuds de stockage) sous forme de fichiers CSV depuis la
page **Import** / **Export** de chaque objet — voir
[[hosts|Gestion des machines]] pour savoir où trouver la page Import Hosts
dans l'interface.

> **Deux façons de mapper les colonnes :**
> 1. **Avec en-tête** — si la première ligne du fichier nomme les colonnes (ce
>    que produit désormais l'export), FOG mappe les colonnes **par nom**. Les
>    colonnes peuvent être dans n'importe quel ordre, et vous pouvez n'inclure
>    que celles qui vous intéressent.
> 2. **Positionnel (sans en-tête)** — s'il n'y a pas de ligne d'en-tête, FOG
>    mappe les colonnes **par position**, dans l'ordre exact produit par
>    l'export.
>
> Une ligne d'en-tête est **détectée automatiquement**, et une case à cocher
> *"First row is a header"* sur la page d'import permet de la forcer. Dans les
> deux cas, le flux de travail le plus simple et le plus sûr est
> **Exporter → modifier → Importer.**

---

## Table des matières

- [Exporter](#exporter)
- [Ligne d'en-tête vs positionnel](#ligne-den-tête-vs-positionnel)
- [Règles générales de format](#règles-générales-de-format)
- [La colonne associations](#la-colonne-associations)
- [Colonnes de clés étrangères](#colonnes-de-clés-étrangères)
- [Disposition des colonnes par classe](#disposition-des-colonnes-par-classe)
  - [Machine](#machine)
  - [Image](#image)
  - [Snapin](#snapin)
  - [Groupe](#groupe)
  - [Imprimante](#imprimante)
  - [Utilisateur](#utilisateur)
  - [Module](#module)
  - [Groupe de stockage](#groupe-de-stockage)
  - [Nœud de stockage](#nœud-de-stockage)
- [Extensibilité par greffon](#extensibilité-par-greffon)

---

## Exporter

Chaque type d'objet possède une page **Export** (par exemple *Machines
 → Export Hosts*) avec une rangée de boutons au-dessus du tableau :

- **CSV (All)** — la méthode recommandée pour obtenir un fichier complet, prêt
  à réimporter. Elle exporte **chaque** élément correspondant à la recherche en
  cours, côté serveur, sous forme de téléchargement CSV — pas seulement les
  lignes visibles à l'écran. Le fichier commence toujours par une ligne
  d'en-tête avec les noms de colonnes, il se réimporte donc **par nom** sans
  réorganisation.
- **Copy**, **Excel**, **Print** — ces boutons n'agissent que sur les lignes
  **actuellement chargées dans le navigateur** (la page à l'écran, ou ce que
  vous avez fait défiler). Ils sont pratiques pour des extractions rapides et
  partielles plutôt que pour un export complet.
- **Column Visibility** — affiche/masque des colonnes dans le tableau à
  l'écran. Cela ne change pas la sortie de **CSV (All)**, qui contient toujours
  le jeu de colonnes canonique complet de la classe (les dispositions par
  classe ci-dessous).

>[!tip]
>Tapez d'abord dans la **zone de recherche** du tableau pour délimiter
>l'export. **CSV (All)** respecte la recherche active, vous pouvez donc
>exporter uniquement le sous-ensemble correspondant — par exemple, chaque
>machine dont le nom contient `lab`.

Les colonnes exportées — et la colonne finale optionnelle `associations` —
sont décrites par classe ci-dessous.

---

## Ligne d'en-tête vs positionnel

**Avec en-tête (recommandé).** Si la première ligne contient les noms de
colonnes, FOG mappe chaque ligne suivante **par nom** :

- **N'importe quel ordre** — les colonnes peuvent apparaître dans n'importe
  quel ordre.
- **Partiel** — n'incluez que les colonnes que vous voulez définir ; les
  colonnes omises conservent leurs valeurs par défaut. (Les colonnes
  d'identité restent obligatoires : `name` pour chaque classe, plus `primac`
  pour les machines.)
- **Détection automatique** — une première ligne dont les cellules sont
  *toutes* des noms de colonnes reconnus est automatiquement traitée comme un
  en-tête. La case à cocher *"First row is a header"* force le mode en-tête
  (et signale comme ignoré tout nom d'en-tête non reconnu).
- **Les noms sont comparés sans tenir compte de la casse**
  (`ProductKey` == `productkey`).
- **L'export émet une ligne d'en-tête** par défaut, donc un fichier exporté se
  réimporte par nom sans modifier les positions de colonnes.

Les noms d'en-tête valides sont les noms de colonnes des tableaux par classe
ci-dessous, plus `primac` (machines) et `associations` (là où c'est pris en
charge).

Exemple (avec en-tête, partiel, réordonné) :

```csv
name,primac,associations
PC-Lab-01,00:11:22:33:44:55,groups:Lab A|Lab B;snapins:7zip
```

**Positionnel (sans en-tête).** Sans ligne d'en-tête, FOG mappe les colonnes
**par position**, dans l'ordre exact produit par l'export (les tableaux par
classe ci-dessous).

## Règles générales de format

- **Délimiteur :** virgule standard (`,`). Utilisez les guillemets CSV
  habituels (entourez un champ de guillemets doubles) si une valeur contient
  elle-même une virgule.
- **Nombre de colonnes.** En mode positionnel, une ligne peut contenir
  *jusqu'à* autant de colonnes que la classe en définit (plus la colonne
  finale optionnelle d'associations). En mode en-tête, une ligne de données ne
  doit pas avoir plus de colonnes que l'en-tête. Dans les deux cas, un excès
  de colonnes rejette l'import avec *"Invalid data being parsed."*
- **L'ordre correspond à l'export** (mode positionnel). Les tableaux par
  classe le listent.
- **Le tuyau (`|`) est le séparateur multi-valeurs** au sein d'un même champ
  (par exemple la liste des MAC d'une machine, et les valeurs d'associations).
  Cela reflète la façon dont les listes de MAC ont toujours été délimitées.
- **Les éléments existants sont ignorés.** Importer une machine dont la MAC
  existe déjà, ou un élément dont le nom unique existe déjà, fait échouer
  cette ligne (les autres continuent).

### Remarque sur les champs sensibles / spéciaux

| Champ | Classe | Comportement |
|-------|-------|-----------|
| `primac` | Machine | **Obligatoire**, première colonne. Liste de MAC séparées par des tuyaux ; la première MAC devient la principale, les autres sont ajoutées comme MAC supplémentaires. |
| `productKey` | Machine | Détection automatique : accepte le texte en clair, le base64, ou la forme chiffrée AES qu'un export produit. |
| `password` | Utilisateur | Stocké chiffré à l'import. |
| `imageID`, `osID`, `imageTypeID`, … | diverses | Clés étrangères numériques. **Résolues par nom** comme la colonne associations : l'export émet le *nom* de l'objet référencé, et l'import accepte un id **ou** un nom (insensible à la casse). Voir *[Colonnes de clés étrangères](#colonnes-de-clés-étrangères)* ci-dessous. |

---

## La colonne associations

Chaque classe qui prend en charge des relations accepte **une colonne finale
optionnelle** nommée `associations`. Elle permet à une seule ligne de porter
les objets liés (les groupes/snapins/imprimantes d'une machine, les machines
membres d'un groupe, etc.) à côté des champs propres de l'objet.

### Format de cellule

```
label:value|value|value;label:value
```

- `;` sépare les **types** d'association.
- `:` sépare l'**étiquette** d'un type de ses **valeurs**.
- `|` sépare les **valeurs** individuelles au sein d'un type.

Exemple (une machine) :

```
groups:Lab A|Lab B;snapins:7zip|Chrome;printers:FrontDesk
```

#### Échapper les délimiteurs dans les noms

Si le **nom** d'un objet contient légitimement l'un des caractères
structurels (`;`, `:`, `|`) — ou une barre oblique inverse — préfixez-le d'une
barre oblique inverse (`\`) pour qu'il soit traité comme une partie littérale
du nom plutôt que comme un séparateur. L'export le fait automatiquement ; vous
n'avez besoin d'écrire les échappements à la main que lorsque vous rédigez un
fichier d'import.

| Caractère dans un nom | À écrire |
|---------------------|-------------|
| `\` (barre oblique inverse) | `\\`        |
| `;`                 | `\;`        |
| `:`                 | `\:`        |
| `\|`                | `\\|`       |

Exemple — un groupe littéralement nommé `Lab A|Lab B` et une imprimante
nommée `Room 3: Floor 2` :

```
groups:Lab A\|Lab B;printers:Room 3\: Floor 2
```

Ceci est interprété comme le nom de groupe **unique** `Lab A|Lab B` et le nom
d'imprimante **unique** `Room 3: Floor 2`. Un `\\` est lu comme une seule
barre oblique inverse littérale, et seuls les délimiteurs **non échappés**
découpent la cellule. Les étiquettes (`groups`, `printers`, …) sont des clés
fixes et ne sont jamais échappées.

### Règles de résolution

- **Id ou nom.** Chaque valeur est résolue **d'abord par id numérique, puis
  par nom (insensible à la casse).** Les noms rendent un fichier portable
  entre des serveurs dont les ids diffèrent — ce qui est tout l'intérêt d'une
  migration export→import.
- **Tolérant (avertir et ignorer).** Si une valeur ne peut pas être résolue
  (par exemple un nom de snapin qui n'existe pas sur ce serveur), la ligne
  **s'importe quand même** ; seule cette association est ignorée et un
  avertissement est signalé. Le résultat de l'import affiche alors *"Import
  Succeeded With Warnings"*.
- **L'export émet des noms**, pas des ids, pour la portabilité.

### Étiquettes prises en charge par classe

| Classe | Étiquettes | Résolues contre |
|-------|--------|------------------|
| Machine | `groups`, `snapins`, `printers`, `modules`, `location`¹, `site`² | Groupe, Snapin, Imprimante, Module, Emplacement, Site — par nom |
| Image | `storagegroups` | Groupe de stockage — par nom |
| Snapin | `storagegroups` | Groupe de stockage — par nom |
| Groupe | `hosts` | Machine — par nom (les membres du groupe) |
| Imprimante | `hosts` | Machine — par nom (machines auxquelles l'imprimante est affectée) |
| Utilisateur, Module, Groupe de stockage, Nœud de stockage | *(aucune)* | — |

¹ `location` est fourni par le greffon **Location** et n'apparaît que lorsque
ce greffon est installé. Une machine n'a qu'un seul emplacement, seule la
première valeur est donc utilisée.

² `site` est fourni par le greffon **Site** et n'apparaît que lorsque ce
greffon est installé. Une machine n'a qu'un seul site, seule la première
valeur est donc utilisée.

> **Remarque :** comme `;`, `:` et `|` sont structurels, un **nom** d'objet
> qui contient littéralement l'un de ces caractères doit être **échappé** avec
> une barre oblique inverse (voir *Échapper les délimiteurs dans les noms*
> ci-dessus). L'export les échappe pour vous ; référencer un tel objet par
> **id** évite aussi entièrement le problème.

---

## Colonnes de clés étrangères

Quelques colonnes sont des **clés étrangères** — un id numérique qui pointe
vers un autre objet :

| Classe | Colonne(s) | Pointe vers |
|-------|-----------|-----------|
| Machine | `imageID` | Image |
| Image | `osID`, `imageTypeID`, `imagePartitionTypeID` | OS, type d'image, type de partition d'image |
| Nœud de stockage | `storagegroupID` | Groupe de stockage |

Elles se comportent désormais comme la colonne associations, si bien qu'un
fichier passe proprement entre des serveurs dont les ids diffèrent :

- **L'export émet le nom de l'objet référencé** (par exemple la colonne
  `imageID` contient `Windows 10`, pas `4`).
- **L'import résout d'abord par id, puis par nom (insensible à la casse).**
  Les exports numériques d'anciennes versions se réimportent toujours sans
  modification, car l'id est essayé en premier.
- **Vide ou `0` signifie « aucune référence »** et est conservé tel quel —
  sans avertissement.
- **Tolérant.** Si un nom ne peut pas être résolu sur ce serveur, la colonne
  garde sa valeur par défaut et un avertissement est signalé ; la ligne
  s'importe quand même (*"Import Succeeded With Warnings"*).

Contrairement à la colonne associations, une colonne de clé étrangère est un
champ CSV autonome ordinaire, donc un nom contenant `;`, `:` ou `|` n'a besoin
d'**aucun** échappement par barre oblique inverse — les guillemets CSV
habituels (entourer le champ de guillemets doubles) couvrent les virgules et
autres cas semblables.

---

## Disposition des colonnes par classe

L'ordre des colonnes ci-dessous est généré à partir du schéma réel et
correspond exactement à la sortie de l'export. `associations` est toujours la
colonne finale optionnelle là où elle est prise en charge.

### Machine

`primac` est obligatoire et en premier ; `associations` est optionnelle et en
dernier.

| # | Colonne | # | Colonne |
|---|--------|---|--------|
| 0 | `primac` (liste MAC, `\|`) | 16 | `printerLevel` |
| 1 | `name` | 17 | `kernelArgs` |
| 2 | `description` | 18 | `kernel` |
| 3 | `ip` | 19 | `kernelDevice` |
| 4 | `imageID` | 20 | `init` |
| 5 | `building` | 21 | `pending` |
| 6 | `createdTime` | 22 | `pub_key` |
| 7 | `deployed` | 23 | `sec_tok` |
| 8 | `createdBy` | 24 | `sec_time` |
| 9 | `useAD` | 25 | `pingstatus` |
| 10 | `ADDomain` | 26 | `biosexit` |
| 11 | `ADOU` | 27 | `efiexit` |
| 12 | `ADUser` | 28 | `enforce` |
| 13 | `ADPass` | 29 | `token` |
| 14 | `ADPassLegacy` | 30 | `tokenlock` |
| 15 | `productKey` | 31 | `associations` *(optionnelle)* |

Associations : `groups`, `snapins`, `printers`, `modules`, `location`¹,
`site`².

### Image

`0:name` `1:description` `2:path` `3:createdTime` `4:createdBy` `5:building`
`6:size` `7:imageTypeID` `8:imagePartitionTypeID` `9:osID` `10:deployed`
`11:format` `12:magnet` `13:protected` `14:compress` `15:isEnabled`
`16:toReplicate` `17:srvsize` `18:associations` *(optionnelle → `storagegroups`)*

### Snapin

`0:name` `1:description` `2:file` `3:args` `4:createdTime` `5:createdBy`
`6:reboot` `7:shutdown` `8:runWith` `9:runWithArgs` `10:protected`
`11:isEnabled` `12:toReplicate` `13:hide` `14:timeout` `15:packtype`
`16:hash` `17:size` `18:anon3` `19:associations` *(optionnelle → `storagegroups`)*

### Groupe

`0:name` `1:description` `2:createdBy` `3:createdTime` `4:building`
`5:kernel` `6:kernelArgs` `7:kernelDevice` `8:init`
`9:associations` *(optionnelle → `hosts`)*

### Imprimante

`0:name` `1:description` `2:port` `3:file` `4:model` `5:config`
`6:configFile` `7:ip` `8:pAnon2` `9:pAnon3` `10:pAnon4` `11:pAnon5`
`12:associations` *(optionnelle → `hosts`)*

### Utilisateur

`0:name` `1:password` (stocké chiffré) `2:createdTime` `3:createdBy`
`4:type` `5:display` `6:api` `7:token`

*(Pas de colonne associations.)*

### Module

`0:name` `1:shortName` `2:description` `3:isDefault`

*(Pas de colonne associations.)*

### Groupe de stockage

`0:name` `1:description`

*(Pas de colonne associations.)*

### Nœud de stockage

`0:name` `1:description` `2:isMaster` `3:storagegroupID` `4:isEnabled`
`5:isGraphEnabled` `6:path` `7:ftppath` `8:bitrate` `9:helloInterval`
`10:snapinpath` `11:sslpath` `12:ip` `13:maxClients` `14:user` `15:pass`
`16:key` `17:interface` `18:bandwidth` `19:webroot` `20:graphcolor`

*(Pas de colonne associations.)*

---

## Exemple complet (machine)

La même machine — affectée à deux groupes, trois snapins et une imprimante —
présentée des deux façons.

**Positionnel** (jeu de colonnes complet, sans en-tête) :

```csv
00:11:22:33:44:55|00:11:22:33:44:66,PC-Lab-01,Front lab PC,,4,,,,,0,,,,,,,5,,,,,0,,,,1,0,0,0,,,"groups:Lab A|Lab B;snapins:7zip|Chrome|VLC;printers:FrontDesk"
```

La première MAC est la principale, la seconde est une MAC supplémentaire ; le
dernier champ entre guillemets est la colonne associations.

**Avec en-tête** (seulement les colonnes nécessaires, dans n'importe quel
ordre) :

```csv
primac,name,description,associations
00:11:22:33:44:55|00:11:22:33:44:66,PC-Lab-01,Front lab PC,"groups:Lab A|Lab B;snapins:7zip|Chrome|VLC;printers:FrontDesk"
```

---

## Extensibilité par greffon

Les greffons peuvent enregistrer leurs propres types d'association afin de
participer à la fois à l'import et à l'export, sans modifier le cœur :

- **`IMPORT_ASSOCIATIONS`** — déclenché pendant la construction de la
  configuration d'associations par classe. Un hook reçoit `childClass` et un
  tableau `config` (par référence) et peut ajouter une entrée :

  ```php
  $arguments['config']['mylabel'] = [
      'class'     => 'MyClass',    // resolved by id or name
      'namefield' => 'name',
      'get'       => 'myprop',     // item property holding ids (export);
                                   //   or a callable fn($item) returning names
      'apply'     => 'addMyThing', // item method taking an array of ids (import);
                                   //   or a callable fn($item, array $ids)
  ];
  ```

- **`EXPORT_ASSOCIATIONS`** — déclenché pendant la construction de la cellule
  d'associations d'une ligne ; reçoit le tableau `parts` (par référence) pour
  les derniers ajustements. Pour garder les gros exports rapides, cet
  événement ne se déclenche que lorsqu'un écouteur est effectivement
  enregistré, ainsi une ligne sans écouteur `EXPORT_ASSOCIATIONS` n'hydrate
  jamais son objet.

- **`EXPORT_ASSOCIATIONS_PRIME`** — déclenché **une fois par export** (pas par
  ligne), avant la construction de toute cellule, avec `childClass` et la
  liste complète des `ids` de lignes. Les greffons peuvent s'en servir pour
  résoudre en masse leur étiquette pour tout le jeu de résultats en quelques
  requêtes et renvoyer le résultat via
  `FOGPage::primeAssociationLabel($childClass, $label, $byParentId)`, où
  `$byParentId` associe chaque id parent à un tableau de noms. Toute étiquette
  qui n'est pas préchargée retombe simplement sur le chemin `get` par ligne,
  écouter est donc une pure optimisation.

Le greffon Location (`addlocationimport.hook.php`) est l'implémentation de
référence : il enregistre un type `location` à valeur unique pour les machines
et écoute `EXPORT_ASSOCIATIONS_PRIME` pour traiter cette étiquette par lots.
Le greffon Site (`addsiteimport.hook.php`) suit le même schéma pour le `site`
d'une machine.

### Performances de l'export

Construire naïvement la colonne associations coûte environ cinq requêtes par
ligne (un objet neuf plus une recherche paresseuse par étiquette). Pour éviter
ce N+1, l'exportateur précharge en masse les noms d'associations de chaque
ligne **une seule fois** avant le début du formatage : les étiquettes de
machine du cœur (`groups`, `snapins`, `printers`, `modules`) sont chargées
avec une seule requête `IN()` par classe d'association, mises en cache par id
parent, et la cellule de chaque ligne est ensuite construite à partir de ce
cache sans objet ni requête par ligne. Les greffons optent pour le même
traitement par lots via `EXPORT_ASSOCIATIONS_PRIME` (ci-dessus). La sortie est
identique au chemin par ligne — seule la façon de récupérer les noms change.

Voir les tickets [#828](https://github.com/FOGProject/fogproject/issues/828)
(conception et historique) et
[#857](https://github.com/FOGProject/fogproject/issues/857) (export par lots)
pour les détails.
