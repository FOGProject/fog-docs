---
title: Cloisonnement par site
aliases:
    - Sites
    - Site Scoping
    - Site Plugin
    - Object Scoping
    - Multi-Site
description: Comment le greffon Site restreint l'accès d'un utilisateur aux seules machines, aux seuls utilisateurs et aux seuls groupes appartenant à son site
context_id: site-scoping
tags:
    - 1_6-changes
    - management
    - users
    - roles
    - permissions
    - plugins
    - sites
    - web-ui
    - web-management
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/site-scoping).

# Cloisonnement par site

## Vue d'ensemble

Les [rôles et permissions](roles.md) déterminent **quelles actions** un
utilisateur peut effectuer — consulter des machines, modifier des images,
lancer des tâches, etc. Ils ne déterminent pas **quels objets** cet
utilisateur voit : un rôle accordant la modification des machines permet à
cet utilisateur de modifier *toutes* les machines du serveur.

Le greffon **Site** ajoute cette seconde dimension. Il permet de regrouper
des machines, des utilisateurs, des groupes et des groupes d'utilisateurs
dans des **sites**, et de restreindre un utilisateur pour qu'il ne voie et
ne manipule que les objets de son ou ses propres sites. Un administrateur
de service d'assistance cloisonné sur le site « Chicago » ne voit que les
machines de Chicago, aussi bien dans l'interface web qu'au travers de
l'[API REST](../../kb/integrations/api.md).

Le cloisonnement par site se superpose **aux** rôles, il ne les remplace
pas. Le rôle d'un utilisateur décide toujours de ce qu'il peut faire ; son
appartenance à un site décide des objets auxquels ces actions s'appliquent.

## Activer le greffon

1. Rendez-vous dans **Configuration FOG → Plugin System** et activez le
   système de greffons si ce n'est pas déjà fait.
2. Dans l'onglet **Greffons**, installez et activez **Site**.
3. Une section **Sites** (icône de globe) apparaît dans le menu principal.

Voir [Greffons](plugins.md) pour le fonctionnement général des greffons.

## Créer des sites

1. Rendez-vous dans **Sites → Créer un site**.
2. Donnez au site un nom unique (et éventuellement une description), puis
   cliquez sur **Créer**.

Répétez l'opération pour chaque emplacement physique ou chaque équipe que
vous souhaitez cloisonner.

## Affecter des objets à un site

Un site peut contenir quatre types d'objets : des **machines**, des
**utilisateurs**, des **groupes** et des **groupes d'utilisateurs**.
L'affectation est toujours explicite — le site d'un groupe est un réglage
qui lui est *propre*, il n'est pas déduit des sites des machines qui en
sont membres.

Vous pouvez affecter des objets dans les deux sens :

- **Depuis le site.** Ouvrez un site et utilisez son onglet
  **Associations** (Host Association / User Association) pour ajouter ou
  retirer des membres en masse.
- **Depuis l'objet.** Ouvrez une machine, un utilisateur, un groupe ou un
  groupe d'utilisateurs et utilisez son onglet **Association de site**
  pour choisir le site auquel il appartient, puis cliquez sur **Mettre à
  jour**.

## Restreindre un utilisateur à son site

Deux conditions rendent un utilisateur cloisonné à un site :

1. **Il détient un rôle qui n'est pas en accès complet.** Un rôle
   accordant **Administrator (full access)** contourne entièrement le
   cloisonnement par site. Un utilisateur *sans* rôle n'a aucun accès et
   n'est donc jamais cloisonné non plus — voir
   [Utilisateurs sans rôle](roles.md#utilisateurs-sans-rôle).
2. **Il est affecté à un ou plusieurs sites**, via son onglet
   **Association de site**.

Dès que ces deux conditions sont remplies, cet utilisateur ne voit plus que
les machines, les utilisateurs, les groupes et les groupes d'utilisateurs
appartenant à son ou ses sites — dans les listes, dans la recherche, sur
les pages d'édition et via l'API. Toute tentative d'ouvrir directement un
objet hors périmètre le renvoie au tableau de bord avec une erreur de
permission.

## Tout refuser : un rôle mais aucun site

!!! warning "Un utilisateur restreint sans site ne voit rien"
    Dès lors que le greffon Site est actif, tout utilisateur détenant un
    rôle (autre qu'un rôle en accès complet) et **sans affectation de
    site** voit une liste **vide** de machines, d'utilisateurs, de groupes
    et de groupes d'utilisateurs. C'est délibéré : le cloisonnement échoue
    en mode fermé, de sorte qu'un utilisateur ne se voit jamais présenter
    des objets que vous ne lui avez pas explicitement accordés.

    Si un utilisateur doit tout voir, donnez-lui un rôle avec
    **Administrator (full access)** coché. Sinon, assurez-vous que chaque
    utilisateur cloisonné est affecté à au moins un site.

## Qui n'est jamais cloisonné

- **Les rôles en accès complet** — tout rôle avec **Administrator (full
  access)** coché contourne entièrement le cloisonnement par site.

Les utilisateurs sans rôle ne sont pas « non cloisonnés » : ils n'ont aucun
accès à cloisonner en premier lieu.

Le cloisonnement par site ne fait jamais que *restreindre* un utilisateur
qui détient déjà un rôle limitatif. Il ne peut pas accorder un accès qu'un
rôle n'autorise pas déjà.

## L'API REST respecte les sites

Le cloisonnement s'applique aux [jetons d'API](roles.md#les-jetons-dapi-suivent-les-rôles)
de la même façon qu'à l'interface web. Le jeton d'un utilisateur cloisonné
ne renvoie que les machines, utilisateurs, groupes et groupes
d'utilisateurs de son périmètre depuis les points d'accès de liste et de
recherche, et se voit refuser les objets hors périmètre lors des requêtes
portant sur un objet unique. Les scripts et les intégrations qui ont besoin
de tout voir doivent s'authentifier avec un utilisateur détenant un rôle en
accès complet.

## Supprimer le cloisonnement

- **Retirez l'utilisateur** de son ou ses sites pour changer ce qu'il voit,
  ou donnez-lui un rôle en accès complet pour en refaire un administrateur.
- **Désinstaller le greffon Site** supprime entièrement la frontière entre
  objets ; les permissions de rôle de chaque utilisateur
  ([Rôles et permissions](roles.md)) restent inchangées, et tous les
  utilisateurs peuvent de nouveau voir tous les objets que leur rôle
  autorise.
