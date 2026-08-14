---
title: Gestion des groupes
aliases:
    - Group Management
    - Fog Group Management
description: page d'index des groupes
context_id: groups
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - groups
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/groups).

# Gestion des groupes

## Groupes

-   Les groupes dans FOG servent à organiser vos machines en ensembles
    logiques correspondant à la réalité du terrain. L'objectif est de
    faciliter la gestion des ordinateurs. Une même machine peut appartenir à un
    nombre illimité de groupes : ainsi, un ordinateur membre du groupe
    « Troisième étage » peut également appartenir à « Département de
    mathématiques » ou à « PC Dell ». Les groupes rendent l'usage de FOG
    possible pour les organisations disposant d'un très grand nombre de PC.
    voir également [[group-shared-state|État partagé des groupes]]

## Créer des groupes

-   Les groupes se créent à deux endroits :

1.  **Gestion des groupes** \-:octicons-arrow-right-24: **Create New Group**
2.  La section des machines de FOG, à partir de recherches ; pour savoir comment
    créer des groupes, veuillez consulter [[hosts#Creating Host Groups]]

## Gérer les groupes

-   Une fois un groupe créé, il peut être géré depuis la section des groupes de
    FOG. Localiser un groupe fonctionne à peu près comme localiser une machine :
    vous pouvez lister tous les groupes ou effectuer une recherche. Lors d'une
    recherche, vos critères sont comparés au nom et à la description du groupe.
    Une fois le groupe localisé, il peut être modifié en cliquant sur le bouton
    « Edit » à droite du tableau ou sur le titre du groupe lui-même.
-   Dans la section « Modify Group \[Groupname\] », des options permettent de
    changer le nom du groupe, sa description, sa clé de produit, ou de le
    supprimer. Si vous souhaitez mettre à jour le nom ou la description du
    groupe, effectuez votre modification puis cliquez sur le bouton « Update »
    de cette section. Si vous souhaitez supprimer le groupe, cliquez simplement
    sur le bouton « Delete » de cette section.
-   Pour rappel, lors de l'enregistrement ou de la mise à jour des paramètres
    des machines, FOG retient la dernière option enregistrée. Si vous attribuez
    l'*image A* à toutes les machines de ce groupe, puis que vous changez la
    *machine A* de ce groupe pour l'*image B*, les paramètres du groupe ne
    remplaceront pas ceux de la *machine A*, sauf si vous revenez au groupe et
    réattribuez l'*image A* à toutes les machines.

## Tâches basiques de groupe

-   Cette section vous permet de lancer une tâche sur ce groupe de machines.
    Vous pouvez y démarrer n'importe quelle tâche sur toutes les machines du
    groupe. Le multicast est également disponible ici. Veuillez consulter
    \[\[FOGUserGuide#Fundamental_Concepts \| Fundamental Concepts\]\] pour
    déterminer la tâche de déploiement requise.

## Configuration de l'appartenance au groupe

-   Cette page vous permet de consulter, d'ajouter ou de supprimer des membres
    du groupe. Elle liste tous les membres du groupe et vous offre la
    possibilité d'en retirer.

## Associations d'images du groupe

-   La page des groupes vous permet également de mettre à jour l'association
    d'image de tous les membres du groupe. Cela se fait dans la section « Image
    Association for \[groupname\] ». Sélectionnez l'association d'image dans la
    liste déroulante, choisissez « Update Images », et tous les objets machine
    de ce groupe seront modifiés.

## Snapins de groupe

-   Vous pouvez ajouter ou retirer des snapins à toutes les machines d'un
    groupe mais, de par la nature des groupes, il n'est pas possible de voir
    quels snapins sont actuellement associés à un groupe. En effet, les snapins
    ne sont pas associés directement au groupe : ils le sont à la machine, et
    tous les membres du groupe peuvent avoir des snapins différents. Ce que FOG
    vous permet de faire, c'est d'ajouter en lot un snapin à toutes les machines
    d'un groupe. De la même façon, vous pouvez retirer en lot un snapin de
    toutes les machines d'un groupe. Ces fonctions s'effectuent via les boutons
    '''Add Snapins''' et '''Remove Snapins''' du menu du groupe.

## Paramètres du service pour le groupe

-   La page **Service Settings** vous permet d'activer ou de désactiver
    certains modules du service sur toutes les machines du groupe, ainsi que de
    modifier quelques paramètres du service pour le groupe, comme la résolution
    d'écran et les réglages de déconnexion automatique.

## Configuration Active Directory du groupe

-   Les paramètres d'intégration à Active Directory peuvent eux aussi être
    diffusés à tous les membres d'un groupe depuis cette page. La section
    « Modify AD information for \[groupname\] » vous le permet. Elle propose les
    mêmes options que l'écran d'une machine, mais permet de mettre à jour
    l'ensemble de vos machines en une fois.

## Imprimantes du groupe

-   La page **Printers** vous permet d'ajouter ou de retirer des associations
    d'imprimantes à toutes les machines du groupe. Elle vous permet également de
    définir le niveau de gestion pour toutes les machines du groupe.

## Informations sur l'appartenance aux groupes

-   La chose la plus importante à retenir au sujet des groupes dans FOG est
    qu'ils ne possèdent pas de propriétés propres. Lorsque vous modifiez un
    groupe, vous modifiez en réalité chaque objet machine qu'il contient. Par
    exemple, si vous changez l'association de système d'exploitation d'un
    groupe, puis que vous revenez à l'un des objets machine membres de ce
    groupe, il portera la nouvelle association sur cet objet.
