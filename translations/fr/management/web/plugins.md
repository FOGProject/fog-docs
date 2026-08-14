---
title: Greffons
aliases:
    - Plugins
    - Plugin Management
description: Activer le système de greffons, quels sont les greffons fournis, et comment installer un greffon tiers
context_id: plugins
tags:
    - 1_6-changes
    - management
    - web-management
    - plugins
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/plugins).

# Greffons

Les greffons ajoutent des fonctionnalités que certaines installations FOG
souhaitent et d'autres non — connexion LDAP, visibilité des machines par site,
notifications Slack, clés de produit Windows. Chacun est un répertoire de PHP que
FOG découvre, active à la demande, et auquel il donne sa propre entrée dans la
barre latérale.

FOG est livré avec un ensemble de greffons, et depuis FOG 1.6 vous pouvez aussi
installer des greffons écrits par d'autres.

>[!info] FOG 1.6
>L'essentiel de cette page décrit la version 1.6. Le système de greffons existe
>aussi en 1.5.x, mais les écrans et ce que l'on peut en faire diffèrent
>suffisamment pour que la 1.5 ait sa propre section :
>[[plugins#Sur FOG 1.5.x|Sur FOG 1.5.x]]. L'activation est identique dans les deux
>cas.

## Activer le système de greffons

Les greffons sont désactivés tant que vous ne les avez pas activés.

1. Connectez-vous à l'interface web de FOG.
2. Rendez-vous dans **Configuration FOG → Paramètres de FOG**.
3. Trouvez la section **Plugin System**.
4. Cochez **FOG_PLUGINSYS_ENABLED**.
5. Cliquez sur **Save Changes**.

Rechargez l'interface : une entrée **Greffons** apparaît dans le menu principal —
une pièce de puzzle en 1.6, une roue dentée en 1.5. En 1.6, elle vous mène à
**Plugin Management**, une liste unique de tous les greffons que FOG peut voir ;
en 1.5, elle ouvre la première de trois pages, décrites
[[plugins#Sur FOG 1.5.x|plus bas]].

## La liste Plugin Management

| Colonne | Ce qu'elle vous indique |
|---|---|
| **Plugin Name** | Le nom technique du greffon, ainsi que tout badge d'état |
| **Description** | Issue du manifeste du greffon lui-même |
| **Version** | La version du greffon, ou un tiret cadratin s'il n'en a jamais déclaré |
| **Location** | Le répertoire où le code a été trouvé — c'est ainsi que vous distinguez un greffon fourni d'un greffon que vous avez installé vous-même |
| **Activated** | Si ses hooks, ses pages et son entrée de menu sont actifs |
| **Installed** | Si ses tables de base de données ont été mises en place |

Cochez les greffons sur lesquels vous souhaitez agir et utilisez les boutons
situés sous la liste : **Activate selected**, **Deactivate selected**,
**Install selected**, **Uninstall selected**, **Update selected**,
**Forget selected**.

### Activated et Installed sont deux choses différentes

C'est une source fréquente de confusion, il vaut donc la peine d'être explicite :

- **Install** met en place les tables de base de données du greffon. L'opération
  peut être relancée sans risque et ne détruit jamais de données.
- **Activate** fait réellement s'exécuter le code du greffon — ses hooks
  s'enregistrent, ses pages deviennent accessibles, son entrée de menu apparaît.

Un greffon a normalement besoin des deux. Désactiver un greffon l'empêche de
s'exécuter mais laisse ses tables et ses données intactes : vous pouvez donc le
réactiver et reprendre là où vous en étiez.

### Badges

- **Update available** (ambre, sur le nom du greffon) — le code du greffon
  contient des étapes de base de données que ce serveur n'a pas encore
  appliquées, typiquement après une mise à niveau de FOG. Cliquez dessus, ou
  utilisez **Update selected**. C'est le seul badge qui soit aussi un bouton.
- **Incompatible** — le greffon indique qu'il ne prend pas en charge cette
  version de FOG. Survolez-le pour en connaître la raison. FOG refuse de
  l'activer ou de l'installer.
- **Missing** — il existe une ligne pour ce greffon mais son répertoire a
  disparu. Voir ci-dessous.

## Compatibilité

Depuis la 1.6, un greffon déclare la plage de versions de FOG qu'il prend en
charge, et FOG la fait respecter :

- **Activer ou installer en dehors de la plage est refusé**, avec la raison dans
  le message d'erreur. Si vous avez coché plusieurs greffons et que l'un d'eux
  est hors plage, tout le lot est refusé — un changement appliqué à moitié mais
  annoncé comme réussi est pire qu'un échec net.
- **Si une mise à niveau de FOG fait sortir le serveur de la plage d'un
  greffon**, le chargement de page suivant désactive ce greffon et journalise la
  raison. Ses tables et les migrations déjà appliquées restent intactes : dès
  qu'une version compatible du greffon est disponible, la réactivation ne demande
  qu'un clic et rien n'a été perdu.

Un greffon qui ne déclare aucune plage est considéré comme compatible avec tout,
ce qui permet aux greffons plus anciens de continuer à fonctionner.

## Quand le code d'un greffon disparaît

Supprimer le répertoire d'un greffon ne supprime pas sa ligne, et c'est
délibéré : une absence n'est pas forcément définitive. Un volume démonté, ou une
arborescence web prise en pleine mise à niveau, fait disparaître tous les
greffons d'un coup, et un système qui réagirait en supprimant leurs lignes
jetterait un état réel à cause d'une situation temporaire.

La ligne reste donc, avec le badge **Missing**. Elle ne peut être ni activée ni
installée. Remettez le code en place et tout reprend exactement où cela s'était
arrêté, migrations appliquées comprises.

Si le greffon a disparu pour de bon, cochez-le et utilisez **Forget selected**
pour supprimer la ligne. Forget ne fonctionne que sur les lignes dont le code est
réellement absent — si le greffon est encore sur le disque, FOG vous demande de
le désinstaller à la place.

>[!warning] Forget ne supprime pas les tables du greffon
>Ce qu'il faut supprimer est décrit par le code du greffon lui-même, c'est-à-dire
>précisément ce qui n'est plus là. Ses tables subsistent, et leur suppression est
>une opération manuelle. Si vous avez encore le code, faites d'abord
>**Uninstall**, puis Forget.

## Où vivent les greffons

FOG examine deux répertoires, et celui dans lequel se trouve un greffon détermine
s'il survit à une mise à niveau :

| Répertoire | Contient | Survit à une mise à niveau de FOG ? |
|---|---|---|
| `<webroot>/lib/plugins/` | les greffons fournis avec FOG | **Non** — l'installeur réécrit cette arborescence |
| `/opt/fog/plugins/` | tout ce qui vient de tiers | **Oui** |

L'installeur supprime et réécrit la racine web à chaque exécution : un greffon
placé dans `lib/plugins/` est donc silencieusement supprimé par votre prochaine
mise à niveau. `/opt/fog/plugins/` se situe hors de la racine web précisément
pour que cela ne puisse pas arriver. **Installez-y les greffons tiers.**

Vous n'avez rien à faire pour que le JavaScript, le CSS et les images d'un
greffon externe se chargent — FOG maintient un lien symbolique automatiquement.

### D'où viennent les greffons fournis

Depuis la 1.6, les greffons fournis ne font plus partie du dépôt `fogproject`.
Ils vivent dans
[FOGProject/fog-plugins](https://github.com/FOGProject/fog-plugins), et chaque
version de FOG épingle une version précise des greffons. `installfog.sh`
télécharge et vérifie cette version pendant l'installation — vous n'avez rien de
plus à exécuter.

Deux conséquences à connaître :

- **L'installeur doit pouvoir joindre GitHub** pour les greffons, comme il le
  fait déjà pour les binaires iPXE.
- **Pour une installation hors ligne**, décompressez la version de
  `fog-plugins` correspondante dans `packages/web/lib/plugins/` avant de lancer
  l'installeur. Le mécanisme de récupération laisse intacte une arborescence
  placée à la main plutôt que de l'écraser.

## Installer un greffon depuis une archive

FOG 1.6 sait installer un greffon tiers depuis un `.tar.gz` via l'interface web.
Il reste toujours possible de le faire soi-même en root — `git clone` ou
décompression dans `/opt/fog/plugins/` — ce qui ne nécessite d'activer quoi que
ce soit et constitue une réponse parfaitement valable.

### Activer les téléversements

Deux interrupteurs indépendants, tous deux nécessaires :

1. **`FOG_PLUGIN_UI_INSTALL_ENABLED`** dans **Configuration FOG → Paramètres de
   FOG → Plugin System**.
2. **`sudo bin/fog-plugin-uploads.sh enable`** sur le serveur, qui rend
   `/opt/fog/plugins` accessible en écriture au serveur web et le réétiquette
   pour SELinux. Le même script accepte `disable` et `status`.

>[!warning] Comprenez ce que vous activez
>Un greffon est du PHP que FOG charge et exécute sous l'identité du serveur web.
>Rendre son répertoire accessible en écriture au serveur web signifie que
>n'importe quelle faille d'écriture de fichier, où que ce soit dans FOG, devient
>un moyen de déposer du code exécutable sur votre serveur.
>
>C'est pourquoi le second interrupteur est une commande root plutôt que quelque
>chose que la page des paramètres pourrait faire d'elle-même : accorder cette
>autorité n'est délibérément pas quelque chose que l'application peut s'accorder
>à elle-même. Activez-le quand vous en avez besoin, et refaites `disable`
>ensuite si vous préférez.

Le téléversement exige également la permission **`plugin.install`**, qui ne fait
pas partie de `plugin.edit`. Activer du code déjà présent sur le serveur et lui
en ajouter de nouveau sont deux prérogatives différentes — voir
[[roles|Rôles et permissions]].

### Effectuer le téléversement

**Plugin Management → Upload plugin** : choisissez l'archive, et FOG la
décompresse dans un endroit d'où elle ne peut pas s'exécuter, lit le manifeste et
vous montre ce qu'il a trouvé *avant* toute installation : nom, version, auteur,
page d'accueil du greffon, versions de FOG et autres greffons requis, sa
description, le nombre de fichiers qu'il contient et le SHA-256 de l'archive.
Comparez cette empreinte à celle publiée par l'auteur, puis confirmez.

FOG refuse l'archive d'emblée si :

- ce n'est pas un `.tar.gz` lisible ;
- elle ne contient pas exactement un répertoire de premier niveau portant le nom
  du greffon ;
- l'un de ses chemins est absolu ou contient `..` ;
- elle ne contient pas de manifeste `<name>/config/plugin.config.php` ;
- le nom du manifeste ne correspond pas au répertoire ;
- le greffon ne prend pas en charge cette version de FOG ;
- un greffon fourni porte déjà ce nom ;
- elle dépasse 64 Mo.

Téléverser un greffon déjà installé constitue une mise à niveau : vous êtes
averti que des fichiers seront remplacés, et l'ancienne copie n'est supprimée
qu'une fois la nouvelle en place.

**Déposer les fichiers sur le serveur n'active pas le greffon.** Vous devez
toujours l'installer et l'activer depuis la liste, de sorte que « le code est
là » et « le code s'exécute » restent deux décisions distinctes.

## Les greffons fournis

Voici l'ensemble de la version 1.6. Voir
[[plugins#L'ensemble de greffons de la 1.5|L'ensemble de greffons de la 1.5]] pour les
différences sur la ligne plus ancienne.

| Greffon | Ce qu'il fait |
|---|---|
| **capone** | Compare une valeur DMI de la machine à une clé que vous définissez et déploie l'image associée, sans enregistrer la machine au préalable |
| **helloworld** | Un greffon d'exemple squelette — la référence pour qui écrit le sien |
| **ldap** | Authentifie les utilisateurs FOG auprès d'un serveur LDAP ou Active Directory. Nécessite le paquet `php-ldap` de votre distribution. Voir [[ldap\|Authentification LDAP]] |
| **location** | Dirige les machines vers le nœud de stockage local à leur site, pour les sites disposant de plus d'un endroit d'où récupérer une image |
| **ntfy** | Notifications via ntfy.sh ou votre propre serveur ntfy |
| **ou** | Prédéfinit des unités organisationnelles Active Directory et les associe à des machines |
| **persistentgroups** | Lorsqu'une machine rejoint un groupe, y recopie les réglages d'image, d'AD, d'imprimante, de snapin et d'emplacement depuis une machine modèle portant le nom de ce groupe |
| **pushbullet** | Notifications Pushbullet |
| **site** | Regroupe les machines en sites et limite les machines que voit chaque utilisateur. Voir [[site-scoping\|Cloisonnement par site]] |
| **slack** | Notifications Slack |
| **subnetgroup** | Affecte automatiquement les machines à des groupes selon leur sous-réseau IP |
| **taskstateedit** | Crée et modifie les états de tâche de FOG |
| **tasktypeedit** | Crée et modifie les types de tâche de FOG |
| **windowskey** | Associe des clés de produit Windows à des images, appliquées aux machines lors du déploiement. Les clés restent attachées à la machine si le greffon est supprimé |
| **wolbroadcast** | Wake-on-LAN vers des adresses de diffusion distinctes, lorsque vous ne pouvez pas configurer vos commutateurs pour le relayer |

>[!note] Access Control a disparu
>Le greffon Access Control a été remplacé par les rôles et permissions natifs en
>1.6. Pour savoir ce qu'il advient des rôles issus du greffon lors de la mise à
>niveau, voir
>[[roles#Migration depuis le greffon Access Control|Rôles et permissions]].

## Sur FOG 1.5.x

Le système de greffons de la 1.5.x repose sur la même idée avec une interface
différente et plus ancienne, et il vaut la peine de savoir ce dont il ne dispose
*pas* avant de bâtir des plans autour.

Son activation est identique — `FOG_PLUGINSYS_ENABLED` dans **Configuration FOG →
Paramètres de FOG** — mais l'entrée de menu est une **roue dentée**, et au lieu
d'une seule liste il vous propose trois pages. La page où apparaît un greffon
dépend entièrement de son état : un greffon passe donc de l'une à l'autre à
mesure que vous travaillez dessus.

| Page | Affiche | Ce que vous y faites |
|---|---|---|
| **Activation des greffons** (par défaut) | les greffons qui ne sont ni activés ni installés | Cliquez sur l'un d'eux pour l'activer. Il disparaît alors de cette page |
| **Installation greffons** | les greffons que vous avez activés dont la base de données n'est pas encore en place | Lancez l'installation |
| **Greffons installés** | les greffons à la fois activés *et* installés | Rien — c'est la liste de ce qui est en service |

>[!note] La page du milieu se lit facilement de travers
>**Installation greffons** ne liste pas les greffons en attente d'activation.
>Elle liste ceux que vous avez *déjà* activés et dont la base de données reste à
>créer. Des versions plus anciennes de cette page présentaient les choses à
>l'envers.

### Ce dont la 1.5 ne dispose pas

- **Pas de second répertoire de greffons.** La découverte lit `../lib/plugins/`
  et rien d'autre. Il existe bien un réglage `FOG_PLUGINSYS_DIR`, mais FOG le
  réécrit vers ce chemin chaque fois qu'il le consulte : le pointer vers un
  endroit plus sûr ne fonctionne donc pas. Comme l'installeur réécrit la racine
  web à chaque exécution, **tout greffon que vous ajoutez à la main en 1.5 est
  supprimé par votre prochaine mise à niveau**, et il n'existe aucun moyen
  officiel de contourner cela. C'est récupérable — l'installeur copie l'ancienne
  arborescence dans `/home/fog_web_<version>.BACKUP` avant de la supprimer — mais
  le greffon ne sera pas en service, et rien ne vous en avertit. C'est le
  problème que la disposition à deux racines de la 1.6 vient résoudre.
- **Pas de manifeste au-delà du nom, de la description et de l'icône.** Pas de
  version, pas de plage de versions de FOG prises en charge, pas de liste de
  dépendances — rien ne vous empêche donc d'activer un greffon qui ne peut pas
  fonctionner sur votre serveur, et une mise à niveau qui casse un greffon ne
  vous donne aucun avertissement.
- **Pas de téléversement.** Les greffons arrivent sur le disque ou pas du tout.
- **Pas de suivi des migrations.** La table `plugins` n'a pas de colonne
  `pSchema` : il n'existe donc aucune trace des étapes de base de données déjà
  exécutées pour un greffon. Les greffons qui doivent modifier leurs tables par
  la suite sont obligés de le faire de façon destructive. Le contrat `schema()`
  qui rend les mises à niveau non destructives n'existe qu'en 1.6.

### L'ensemble de greffons de la 1.5

La 1.5.x livre quatre greffons absents de la 1.6 :

| Greffon | Ce qu'il fait |
|---|---|
| **accesscontrol** | Restreint ce que les utilisateurs peuvent voir et faire. **Remplacé en 1.6** par les rôles et permissions natifs — voir [[roles|Rôles et permissions]] |
| **example** | Le greffon d'exemple squelette, équivalent du `helloworld` de la 1.6 |
| **fileintegrity** | Enregistre les empreintes, dates de modification et emplacements des fichiers sur les nœuds de stockage |
| **hoststatus** | Ajoute une entrée d'état d'alimentation et de système d'exploitation en direct sur la page d'édition de la machine. Nécessite le port TCP 445 ouvert sur le client |

Trois greffons de la 1.6 sont absents de la 1.5 : **helloworld** (son `example`
en est l'équivalent), **ntfy** et **ou**. Le reste du tableau ci-dessus est
commun aux deux lignes.

## Écrire le vôtre

Le guide complet est
[[plugin-development|Construire un greffon FOG — de bout en bout]], qui va d'un
répertoire vide à un greffon fonctionnel et installable en s'appuyant sur
l'exemple `helloworld` fourni. Les modifications de base de données ont leur
propre page : [[plugin-schema-migrations|Migrations de schéma des greffons]].
