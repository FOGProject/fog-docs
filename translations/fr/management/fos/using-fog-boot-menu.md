---
title: Utiliser le menu de démarrage FOG
aliases:
    - Client Side Tasks
    - Using the FOG Boot Menu
description: Utilisation des tâches côté client déclenchées depuis le menu de démarrage PXE de FOG, auparavant appelées « Client Side Tasks »
context_id: using-fog-boot-menu
tags:
    - in-progress
    - convert-Wiki2MD
    - management
    - fos
    - fos-management
    - boot-menu
    - ipxe
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/fos/using-fog-boot-menu).


# Utiliser le menu de démarrage FOG

Voir [[ipxe|Personnaliser les réglages iPXE de FOG]] pour ajouter vos propres
entrées de démarrage et un arrière-plan personnalisé, en complément des
commandes intégrées ci-dessous.

## Vue d'ensemble

-   FOG s'efforce de centraliser la gestion, mais pour rendre le déploiement
    des machines aussi simple que possible, il a ajouté quelques tâches
    basiques côté client.

-   Ces tâches peuvent être lancées depuis l'ordinateur client pendant le
    démarrage PXE.

-   Lorsque le client démarre et que la bannière FOG s'affiche, le client PXE
    affiche une invite du type **boot:** ou similaire.

-   Vous disposez alors de 3 secondes pour commencer à saisir l'une des
    commandes suivantes.

    > | Memtest86+
    > | Quick Registration and Inventory
    > | Perform Full Registration and Inventory

### Memtest86

> -   Cette commande exécute memtest86+ sur l'ordinateur client.
> -   fog.memtest est la commande servant à désigner cette action dans les
>     réglages du menu PXE.

### Quick Registration and Inventory

> -   Cette commande exécute l'enregistrement basique de la machine et
>     l'inventaire, sans aucune saisie de l'utilisateur.
>
> -   Elle enregistre auprès du serveur FOG toute machine nouvelle ou non
>     enregistrée et en récupère un inventaire matériel sommaire.
>
> -   
>
>     Le nom de la machine sera identique à l'adresse MAC, sans les `:`
>
>     :   -   Vous pouvez aussi personnaliser cette attribution automatique
>             de nom dans la configuration de FOG
>
> -   Si une machine est déjà enregistrée, seul un inventaire est effectué.
>
> -   fog.reg est la commande servant à désigner cette action dans les
>     réglages du menu PXE

### Perform Full Registration and Inventory

> -   Cette commande exécute le processus complet d'enregistrement de la
>     machine avec saisie de l'utilisateur, l'inventaire, et propose de
>     déployer une image, le tout en même temps. Pendant ce processus, il
>     sera demandé à la personne qui enregistre la machine le nom de
>     l'ordinateur, l'adresse IP, l'identifiant du système d'exploitation,
>     l'identifiant de l'image, l'utilisateur principal de l'ordinateur, ainsi
>     que les numéros d'inventaire 1 et 2.
> -   Si un nom de machine, un identifiant de système d'exploitation et un
>     identifiant d'image valides sont fournis et que l'option d'imager le
>     poste après l'enregistrement est retenue, la machine redémarrera et un
>     envoi d'image commencera.
> -   Si une machine est déjà enregistrée, seul un inventaire est effectué ;
>     cela empêche les utilisateurs finaux de réenregistrer une machine sous
>     un autre nom, etc.
> -   Cette tâche a été conçue pour les organisations susceptibles de
>     recevoir des livraisons de centaines d'ordinateurs à déployer très
>     rapidement. Ceux-ci peuvent être déballés, inventoriés, importés dans
>     FOG et imagés très vite.
> -   fog.reginput est la commande servant à désigner cette action dans les
>     réglages du menu PXE

#### Identifiant d'image

> -   Depuis la version 0.17, vous pouvez saisir ''?'' à l'invite
>     de l'identifiant d'image pour obtenir la liste de toutes vos images et
>     de leurs numéros d'identifiant.
>
> -   L'identifiant d'image que vous indiquez sera déployé sur l'ordinateur
>     après un redémarrage si vous choisissez `image now` à la fin du
>     formulaire d'enregistrement.
>
> -   Les identifiants d'image se trouvent dans la console de gestion, dans
>     la section [[management/web/images| Gestion des images]].
>
> -   
>
>     L'identifiant d'image est indiqué après le `-` suffixé au nom d'image que vous avez défini
>
>     :   -   
>
>             Vous pouvez aussi rechercher l'image et cliquer sur le bouton d'édition associé à celle-ci,
>
>             :   -   L'identifiant de l'image figurera dans la barre
>                     d'adresse, sous la forme `&imageid=xx`.

### Enroll Secure Boot Key

> -   Ajouté dans FOG 1.6.0, et pertinent uniquement pour les clients
>     démarrant avec l'UEFI Secure Boot activé.
>
> -   Cette commande enrôle sur le client le certificat de signature de FOG,
>     ce qui permet à la machine de démarrer le noyau FOS avec le Secure Boot
>     laissé actif.
>
> -   **Aucune clé USB n'est nécessaire.** `MOK.der` est distribué par le
>     réseau : le certificat n'a donc plus besoin d'être préparé sur un
>     support local avant de commencer. Vous pouvez toujours récupérer le
>     fichier depuis **Configuration FOG → Secure Boot** si vous le voulez à
>     la main.
>
> -   Elle n'a pas non plus besoin d'être lancée depuis ce menu. **Enroll
>     Secure Boot Key** est un type de tâche, planifiable depuis **Task
>     Scheduling** pour une machine ou pour tout un groupe — une machine
>     ayant cette tâche en attente saute le menu et l'exécute au prochain
>     démarrage PXE.
>
> -   La suite dépend de l'état du micrologiciel du client, et FOS en décide
>     seul :
>
>     :   -   **Setup Mode** — FOS écrit directement les véritables bases
>             Secure Boot (`db`, `KEK`, `PK`) et termine **sans
>             intervention**. Ajouté dans FOG 1.6 ; nécessite la version FOS
>             `20260804` ou plus récente.
>
>         -   **Tout autre cas** — FOS prépare une demande MOK et passe la
>             main à MokManager, qui exige que quelqu'un la confirme depuis
>             la console. L'enrôlement MOK est conçu pour exiger une présence
>             physique et il n'existe aucun moyen de le contourner.
>
> -   fog.enrollsecureboot est la commande servant à désigner cette action
>     dans les réglages du menu PXE.
>
> -   La procédure complète, y compris ce qu'il faut faire si vous préférez
>     signer avec votre propre clé, se trouve dans
>     [[kb/how-tos/secure-boot-signing| Secure Boot : signer FOS avec votre propre clé]].
