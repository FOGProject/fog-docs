---
title: Tableau de bord
description: Décrit les différentes sections de la page d'accueil / du tableau de bord de FOG
context_id: dashboard
aliases:
  - Web UI Dashboard
  - Dashboard
tags:
  - dashboard
  - management
  - web-management
  - web-ui
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/dashboard).

# Tableau de bord

## Vue d'ensemble

![[Dashboard.png]]

-   Le tableau de bord de FOG est la première page qui s'affiche après la
    connexion.
-   Cette page vous donne simplement un aperçu de ce qui se passe sur votre
    serveur FOG.

## Vue d'ensemble du système

-   L'encadré de vue d'ensemble du système est celui situé en haut à gauche de
    cette page.

-   Les informations présentées dans cet encadré sont

    > -   l'utilisateur courant
    > -   les adresses IP ou noms d'hôte de votre serveur web
    > -   les adresses IP ou noms d'hôte de votre serveur TFTP
    > -   les adresses IP ou noms d'hôte de votre serveur de stockage
    > -   Cette section indique également la durée de fonctionnement du
    >     système, c'est-à-dire depuis combien de temps il fonctionne sans
    >     redémarrage
    > -   La charge du système

## Activité du système

-   L'encadré d'activité du système se trouve sur la rangée du haut, au centre.
- Cette section affiche la file d'attente unicast, c'est-à-dire le nombre de déploiements unicast en cours.
	- La taille de la file d'attente peut varier et dépend du ou des groupes de stockage.
        -  Chaque nœud de stockage possède un paramètre **Max Clients**, qui correspond au nombre maximal de machines que ce nœud peut cloner simultanément.
	        - S'il y a 2 nœuds avec un maximum de 10 chacun, votre file d'attente maximale est de 20.
                - Cependant, n'oubliez pas que plus vous augmentez **Max Clients**, plus le déploiement de l'image sera lent pour chaque machine.
-   Autrement dit, une fois que 20 machines reçoivent des images (simultanément),
    la 21e attendra qu'une des machines en cours ait terminé avant de démarrer.
-   Ce mécanisme a été créé pour que vous puissiez mettre en file d'attente 100
    machines avec des images différentes (toutes en unicast) tout en gardant le
    système fonctionnel.
-   On nous a rapporté l'utilisation de cette file d'attente pour recloner en
    une nuit tout un bâtiment d'ordinateurs (environ 1000 ou plus).
-   Cette section se met à jour en temps réel.
-   Elle affiche toutes les tâches en attente, en cours, etc\... et se met à
    jour au même intervalle que le graphique de bande passante.
-   Vous pouvez également modifier quels types de tâches sont comptabilisés dans la « file d'attente ».
      -   Cette modification s'effectue dans
        **FOGConfiguration** ![[Config.png]]\-:octicons-arrow-right-24: **FOG Settings**\-:octicons-arrow-right-24: **General Settings** \-:octicons-arrow-right-24:**FOG_USED_TASKS**.
        -   Le champ texte contient des valeurs numériques (vous devrez donc savoir quels identifiants de tâche correspondent à quels types).
        -   Ce champ texte est au format CSV. Si vous saisissez (1,2,3,4,5), toutes les tâches de type Déploiement, Capture, Débogage, Memtest et Testdisk seront affichées comme en attente ou actives selon leur état courant.
        -   L'exception à cette règle est le type de tâche 8 (multicast), auquel
            cas ce sont les travaux, et non chaque tâche machine individuelle,
            qui occupent une place dans la file d'attente.

## Informations sur les disques

-   L'encadré d'informations sur les disques se trouve en haut à droite de la
    page du tableau de bord.
-   Il s'agit d'un affichage quasi temps réel de l'espace de stockage restant
    sur le serveur de stockage.
-   Une liste déroulante permet aussi de sélectionner vos nœuds de stockage
    afin de surveiller leurs informations de disque.
-   Si vous obtenez une erreur dans cet encadré, veuillez consulter \[\[Dashboard Error:
    Permission denied\...\]\] #page doesn't exist in rst yet

## Historique de clonage sur 30 jours

-   Cette image montre vos tendances de clonage sur les 30 derniers jours

## Barre de menu

![[MenuBar.png]]

Ce menu apparaît en haut de chaque page de l'interface web de FOG. Les icônes
sont, de gauche à droite :

Logo du menu | Nom | Description
---       | --                   | ---
![[dashboard-ico.png]] | **Accueil / Tableau de bord** | Il s'agit de l'écran d'accueil du portail de gestion de FOG.
 ![[users-ico.png]] | **[Gestion des utilisateurs](users.md)** |  Les administrateurs individuels des ressources FOG.
![[hosts-ico.png]] | **[machines](hosts.md)** |  Cette section regroupe les machines, c'est-à-dire les PC à cloner ou dont extraire des images.
![[groups.ico.png]] | **[groupes](groups.md)** | Cette section regroupe les groupes, c'est-à-dire des PC similaires sur lesquels effectuer des tâches en masse.
![[images-ico.png]] | **[[management/web/images| Gestion des images]]** | Cette section vous permet de gérer les fichiers image stockés sur le serveur FOG.
![[Storage-ico.png]] | **[nœud de stockage](storage-node.md)** | Cette section vous permet d'ajouter ou de retirer des nœuds de stockage du système FOG.
![[snapin-ico.png]] | **[Gestion des snapins](snapins.md)** | Cette section propose des moyens d'automatiser diverses tâches post-clonage, comme l'installation silencieuse de programmes.
![[printer-ico.png]] | **[imprimantes](printers.md)** | Cette section permet de gérer les imprimantes, en créant des objets imprimante qui pourront ensuite être affectés à des machines ou à des groupes.
![[service-ico.png]] | **[Gestion du service](service.md)** | Cette section vous permet de contrôler le fonctionnement du service *client*.
![[tasks-ico.png]] | **[Gestion des tâches](tasks.md)** | Cette section vous permet d'effectuer des tâches de clonage, comme acquérir ou déployer des images.
![[reports-ico.png]] | **[Gestion des rapports](reports.md)** | Les rapports permettent d'extraire des informations de la base de données FOG au format HTML, PDF ou CSV.
![[Config.png]] | **[Configuration de FOG](config.md)** | Cette section regroupe les autres paramètres qui ne trouvent pas leur place ailleurs : mise à jour du noyau, mise à jour du service client, modifications iPXE, liste des adresses MAC, visionneuse de journaux.
![[plugins-ico.png]] | **[Gestion des plugins](plugins.md)** | Les plugins ajoutent des fonctionnalités à FOG. Ils doivent être activés dans *Configuration de FOG*.
![[logout-ico.png]] | **Déconnexion** | Cliquez ici pour vous déconnecter de l'interface web de FOG.
