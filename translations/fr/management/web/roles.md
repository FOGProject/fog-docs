---
title: Rôles et permissions
aliases:
    - Roles
    - Permissions
    - Role Management
    - RBAC
description: Fonctionnement des permissions par rôle de FOG 1.6 et façon de les gérer
context_id: roles
tags:
    - 1_6-changes
    - management
    - users
    - roles
    - permissions
    - web-ui
    - web-management
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/roles).

# Rôles et permissions

## Vue d'ensemble

À partir de FOG 1.6, le contrôle d'accès par rôle est intégré à FOG
lui-même. Un **rôle** est un ensemble nommé de permissions que vous
attribuez à un ou plusieurs comptes utilisateur. Dès qu'un utilisateur
détient un rôle, il ne peut voir et faire que ce que les permissions de ce
rôle autorisent — aussi bien dans l'interface web qu'au travers de
l'[API REST](../../kb/integrations/api.md).

Cela remplace l'ancien **greffon Access Control**, qui pouvait définir des
rôles mais n'a jamais rien appliqué réellement. Voir
[Migration depuis le greffon Access Control](#migration-depuis-le-greffon-access-control)
ci-dessous pour savoir ce qu'il advient des rôles issus du greffon lors de
la mise à niveau.

## Fonctionnement des permissions

Chaque permission est constituée d'un **domaine** et d'une **action** :

- Les **domaines** sont les sections de FOG : Machines, Groupes, Images,
  Snapins, Imprimantes, Tâches, Utilisateurs, Rôles, Nœuds de stockage,
  Groupes de stockage, Paramètres du client, Paramètres FOG, Rapports,
  Greffons, etc.
- Les **actions** sont ce que l'on peut y faire : **View**, **Create**,
  **Edit**, **Delete** et **Task** (démarrer des tâches d'imagerie ou de
  Snapin).

Tous les domaines ne proposent pas toutes les actions, et quelques-uns en
proposent qui leur sont propres. L'exemple le plus net est celui des
**Greffons**, qui disposent de **View**, **Edit** et **Install** :

- **Edit** active, désactive, installe et désinstalle les greffons déjà
  présents sur le serveur.
- **Install** téléverse une *nouvelle* archive de greffon.

Ils sont distincts à dessein. Activer du code qu'un administrateur a déjà
choisi de placer sur le serveur, et ajouter du nouveau code à celui-ci,
sont deux prérogatives différentes — un rôle qui gère les greffons n'a
donc pas pour autant le droit d'en ajouter un. Voir
[[plugins#Installer un greffon depuis une archive|Greffons]].

Par exemple, un rôle de service d'assistance pourrait disposer d'un accès
complet aux Machines et aux Imprimantes, ainsi que de la possibilité de
consulter les Images et de lancer des tâches d'imagerie, mais d'aucun
accès aux Utilisateurs, aux Rôles ou aux Paramètres FOG.

Un utilisateur peut détenir **plusieurs rôles** ; ses permissions
effectives sont la combinaison de tout ce que ses rôles accordent.

## Gérer les rôles

Les rôles se gèrent dans la section **Rôles** (icône de clé) du menu
principal.

### Créer un rôle

1. Rendez-vous dans **Rôles → Create New Role**.
2. Donnez au rôle un nom unique (et éventuellement une description), puis
   cliquez sur **Créer**.
3. Ouvrez le nouveau rôle et utilisez ses onglets :
    - **Général** — nom et description.
    - **Permissions** — une grille de domaines et d'actions. Cochez les
      cases que le rôle doit accorder, ou cochez **Administrator (full
      access)** pour tout accorder, puis cliquez sur **Mettre à jour**.
    - **Utilisateurs** — ajoutez ou retirez les comptes utilisateur qui
      détiennent ce rôle.

### Attribuer des rôles aux utilisateurs

Vous pouvez attribuer des rôles dans les deux sens :

- Dans l'onglet **Utilisateurs** du rôle, ajoutez les utilisateurs qui
  doivent le détenir.
- Dans l'onglet **Rôles** d'un utilisateur (sous **Utilisateurs**),
  ajoutez les rôles que cet utilisateur doit détenir.

## Utilisateurs sans rôle

Un utilisateur **sans aucun rôle n'a aucun accès**. Dans FOG, l'accès est
accordé, jamais présumé : un compte ne peut faire que ce qu'un rôle qu'il
détient l'autorise à faire, et un compte qui ne détient rien ne peut rien
faire.

Un tel utilisateur peut toujours se connecter et voit une bannière
d'avertissement lui expliquant que le compte n'a aucun rôle et donc aucun
accès à la moindre page de gestion, ainsi qu'une invitation à demander à
un administrateur de lui en attribuer un. Il conserve malgré tout la
poignée de pages qui reviennent à tout utilisateur connecté : son tableau
de bord, les pages destinées au client et la déconnexion.

!!! warning "Ce comportement a changé pendant la bêta 1.6"

    Les premières versions 1.6 faisaient l'inverse : un compte sans rôle
    était traité comme un administrateur complet, afin que l'adoption des
    rôles ne puisse pas verrouiller l'accès à un serveur existant avant
    que quiconque ne s'en soit vu attribuer un.

    C'était un piège. Retirer son dernier rôle à un utilisateur devenait
    une **promotion** plutôt qu'une restriction, et tout compte créé par
    un greffon d'authentification arrivait avec un accès illimité du
    simple fait d'arriver sans rôle.

    La mise à niveau convertit en rôle explicite chaque compte qui
    s'appuyait sur l'ancien comportement, afin que l'accès de personne ne
    change silencieusement — voir
    [Ce que la mise à niveau fait aux utilisateurs existants](#ce-que-la-mise-à-niveau-fait-aux-utilisateurs-existants).

## Ce que voient les utilisateurs restreints

- Les sections du menu que l'utilisateur ne peut pas consulter sont
  masquées dans la barre latérale.
- Naviguer directement vers une page refusée affiche « You do not have
  permission to access this page » et renvoie l'utilisateur au tableau de
  bord.
- Le nom d'un utilisateur restreint dans la barre latérale n'est plus un
  lien vers sa fiche utilisateur (modifier des utilisateurs exige la
  permission **Edit** sur les Utilisateurs — et permettrait sinon à un
  utilisateur de modifier ses propres rôles).

## Restreindre un rôle à certains sites

Les rôles décident **ce que** peut faire un utilisateur ; ils ne décident
pas **sur quels** objets ces actions s'appliquent. Un rôle accordant la
modification des machines permet à cet utilisateur de modifier toutes les
machines du serveur.

Si vous devez restreindre un utilisateur aux seules machines, seuls
utilisateurs et seuls groupes de son propre emplacement ou de sa propre
équipe, installez le greffon **Site**. Il superpose une frontière entre
objets par-dessus le rôle : un utilisateur cloisonné à un site conserve
les actions de son rôle mais ne voit jamais que les objets de son ou ses
sites, dans l'interface web comme dans l'API. Les utilisateurs détenant un
rôle en accès complet ne sont jamais cloisonnés.

Voir [Cloisonnement par site](site-scoping.md) pour le déroulé complet.

## Les jetons d'API suivent les rôles

Un jeton d'API utilisateur hérite des permissions de rôle de cet
utilisateur : les requêtes d'API faites avec ce jeton ne peuvent faire que
ce que l'utilisateur pouvait faire dans l'interface web. Les scripts et
les intégrations qui ont besoin d'un accès sans restriction doivent
s'authentifier avec un utilisateur détenant un rôle en accès complet — un
jeton appartenant à un compte sans rôle ne peut rien faire du tout.

## Protection contre le verrouillage

FOG refuse toute modification qui laisserait le système **sans
administrateur effectif** — supprimer le dernier rôle d'administrateur,
en retirer le dernier membre, décocher son accès complet ou supprimer le
dernier compte utilisateur administrateur. Vous ne pouvez pas verrouiller
accidentellement l'accès de tout le monde.

## Ce que la mise à niveau fait aux utilisateurs existants

Puisqu'un compte sans rôle n'a désormais aucun accès, la mise à niveau
doit attribuer à chaque compte existant un rôle décrivant ce qu'il
pouvait déjà faire. La mise à niveau de la base de données s'en charge
pour vous, en une seule passe, pour les **comptes locaux ne détenant
aucun rôle** :

| Compte existant | Rôle qu'il reçoit |
|---|---|
| Un administrateur FOG normal | **Administrator** — accès complet, exactement comme avant |
| Un compte « mobile » (le niveau restreint dont l'interface distincte a été retirée en 2017) | **Legacy Restricted** — un nouveau rôle créé par la mise à niveau |

**Legacy Restricted** accorde ce que cet ancien niveau pouvait
réellement faire : consulter les machines et les images, lancer des
tâches d'imagerie, suivre les tâches et lire les rapports. Il n'accorde
rien qui modifie ou supprime. Il ne s'agit délibérément *pas* du rôle
**Technician** préconfiguré, qui est plus large.

Les comptes qui **détiennent déjà un rôle** ne sont pas touchés. Ils ont
été restreints intentionnellement, et les élargir en silence annulerait
votre travail.

**Les comptes issus d'un annuaire externe ne sont pas touchés non plus** —
voir [Authentification LDAP](ldap.md). Leur rôle est décidé par le greffon
LDAP à chaque connexion, la mise à niveau n'a donc rien d'utile à en dire,
et recopier leur ancien type de compte donnerait le rôle d'administrateur
à tous les comptes d'annuaire.

!!! tip "Après la mise à niveau"

    Passez en revue **Rôles → Administrator → Utilisateurs**. Tout compte
    qui n'était administrateur que parce que personne ne l'avait jamais
    restreint est désormais administrateur explicitement, et c'est le bon
    moment pour le basculer vers quelque chose de plus étroit.

## Migration depuis le greffon Access Control

Si vous utilisiez le greffon Access Control sur une version antérieure de
FOG :

- **Vos rôles et vos affectations d'utilisateurs sont repris
  automatiquement.** La fonctionnalité native adopte telles quelles les
  tables du greffon — mêmes noms de rôles, mêmes membres.
- **Les « règles » par clé de menu ne sont pas reprises.** Le greffon ne
  les a jamais appliquées : tout rôle préexistant sans permission réelle
  se voit donc accorder l'**accès complet** — ce qui préserve l'accès
  dont ces utilisateurs disposaient effectivement, plutôt que d'inventer
  des restrictions que vous n'avez jamais choisies. Passez en revue
  l'onglet **Permissions** de chaque rôle migré et restreignez-le selon
  vos besoins.
- Le greffon lui-même est supprimé automatiquement ; il n'y a rien à
  désinstaller.
