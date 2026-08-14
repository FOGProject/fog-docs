---
title: Gestion des imprimantes
aliases:
    - Printer Management
description: page d'index des imprimantes
context_id: printers
tags:
    - in-progress
    - management
    - web-management
    - web-ui
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/printers).

# Gestion des imprimantes

Configurer des imprimantes avec la gestion des imprimantes de FOG

!!! note

    **Problèmes connus** — La définition de l'imprimante par défaut ne
    fonctionne que si l'icône FOG de la zone de notification est en cours
    d'exécution.

## Vue d'ensemble

-   La section des imprimantes de FOG vous permet de créer des définitions
    d'imprimante que vous pourrez ensuite associer à des machines.

-   Le service FOG examine ces associations et, pendant son fonctionnement,
    tente d'installer toutes les imprimantes répertoriées. Ce service
    dispose de trois réglages qui définissent la façon dont les imprimantes
    sont gérées

-   Pour que l'imprimante puisse être ajoutée à l'ordinateur, les pilotes
    d'imprimante doivent être stockés dans un emplacement public ou inclus
    sur la machine elle-même.

-   

    Cet emplacement public peut être

    :   -   un partage réseau Novell où le public dispose d'un accès en lecture seule,
        -   un partage Windows accessible en lecture seule à tout le monde,
        -   ou un partage Samba (éventuellement hébergé sur le serveur FOG)
            accessible en lecture seule à tout le monde.
        -   Ce partage doit être accessible par un chemin UNC, car le
            service peut tenter d'installer les imprimantes avant que le
            montage des lecteurs n'ait lieu.
        -   Le fichier .inf du pilote d'imprimante doit se trouver dans ce
            partage.

-   

    FOG prend en charge l'installation :

    :   -   des imprimantes IP (Jet-Direct),
        -   des imprimantes NDS en accès public,
        -   des imprimantes locales,
        -   des imprimantes partagées via Windows,
        -   (et, croyons-nous, mais une confirmation serait utile car cela
            n'a pas été testé) des imprimantes gérées par AD.

!!! note

    -   Si vous souhaitez voir quelles imprimantes sont fournies avec
        Windows, ouvrez `c:\windows\inf\ntprint.inf` dans un éditeur de
        texte.
    -   Vous pouvez également découvrir quel pilote est utilisé par une
        imprimante dans les propriétés avancées de celle-ci
    -   `printManagement.msc` est aussi un outil Windows intégré très utile
        qui peut vous montrer toutes vos imprimantes, tous vos pilotes
        d'imprimante et tous vos ports d'imprimante installés

### Modes de gestion des imprimantes

-   La gestion des imprimantes pour une machine peut être réglée sur

    > -   **No Printer Management**
    >
    >     > C'est le réglage par défaut des nouvelles machines : il fait
    >     > en sorte que le service FOG ne touche pas aux imprimantes de
    >     > la machine. Ce réglage désactive toute la gestion des
    >     > imprimantes de FOG. Bien qu'il existe déjà plusieurs niveaux
    >     > entre les paramètres de la machine et les paramètres globaux,
    >     > celui-ci en est un de plus pour davantage de sécurité.
    >
    > -   **Only Assigned Printers**
    >
    >     > Fait ce que son nom indique : n'ajoute et ne supprime des
    >     > imprimantes sur la machine que si elles sont affectées dans
    >     > FOG, et ne supprime aucune imprimante existante qui aurait pu
    >     > être installée en dehors du client FOG. Ce réglage n'autorise
    >     > l'ajout sur la machine que des imprimantes affectées dans FOG.
    >     > Toute imprimante non affectée sera supprimée, y compris les
    >     > imprimantes non gérées par FOG. Autrement dit, si certains
    >     > utilisateurs ont des imprimantes USB, c'est l'option qu'il
    >     > vous faut pour que FOG ne supprime aucune imprimante qui n'est
    >     > pas contrôlée par FOG
    >
    > -   **Fog Managed Printers**
    >
    >     > Prend le contrôle complet du système d'impression de la
    >     > machine et n'autorise l'existence sur celle-ci que des
    >     > imprimantes indiquées par la console de gestion FOG. Ce
    >     > réglage n'ajoute et ne supprime que les imprimantes gérées par
    >     > FOG. Si l'imprimante existe dans la gestion des imprimantes
    >     > mais n'est pas affectée à une machine, elle sera supprimée de
    >     > la machine non affectée si elle y est présente. Les
    >     > imprimantes affectées seront ajoutées à la machine. Autrement
    >     > dit, si vous ne voulez pas que les utilisateurs branchent leurs
    >     > propres imprimantes USB et n'aient accès qu'aux imprimantes

## Ajouter de nouvelles imprimantes

-   Pour créer une nouvelle définition d'imprimante, cliquez sur l'icône
    Imprimante de la barre de menu du système.
-   Puis, dans le menu de gauche, cliquez sur **Add New Printer**.
-   Vous pouvez copier une imprimante existante et en ajuster les réglages
    si cette imprimante ressemble à une autre déjà présente
-   Vous devez choisir un type d'imprimante et renseigner les champs
    correspondant à ce type (voir ci-dessous le détail de chaque type
    d'imprimante)
-   Une fois toutes les informations requises saisies, cliquez sur le
    bouton **Add Printer**.

### Imprimante TCP/IP

Il s'agit d'une imprimante connectée au réseau et directement accessible
depuis celui-ci, ou d'une imprimante connectée directement à l'ordinateur.
La connexion se fera par un port d'imprimante Windows créé pour l'occasion
et pointant vers l'adresse IP ou le nom d'hôte de l'imprimante. Vous pouvez
également créer et inclure un fichier de configuration d'imprimante afin de
déployer des préférences, propriétés et réglages personnalisés pour ces
imprimantes.

-   **Printer Model**

    > Doit correspondre à un nom figurant dans le fichier INF

-   **Printer Alias**

    > Peut être ce que vous voulez ; c'est ce que verra l'utilisateur final
    > lorsqu'il utilisera l'imprimante.

-   **Printer Description**

    > Il s'agit d'une description de la connexion à l'imprimante, visible
    > uniquement dans l'interface FOG. Elle n'a aucun effet sur la
    > connexion côté client.

-   **Printer Port**

    > Il s'agit du nom du port d'imprimante. Ceux créés lorsque vous
    > ajoutez manuellement une imprimante sous Windows ressemblent
    > généralement à `LPT1:` ou `IP_1.1.1.2`. Vous pouvez lui donner un nom
    > plus parlant si vous le souhaitez. Vous pouvez aussi (en théorie)
    > indiquer quelque chose comme `USB0:` pour vous connecter à une
    > imprimante USB. (à tester) Chaque nom de port d'imprimante doit être
    > unique

-   **Printer INF File**

    > Il s'agit du chemin vers le fichier INF du pilote d'imprimante. Ce
    > peut être un chemin UNC vers un partage public ou un fichier
    > accessible localement sur la machine cliente

-   **Printer IP** (facultatif)

    > Il s'agit de l'adresse IP, pour les imprimantes IP uniquement ; elle
    > peut prendre la forme `1.2.3.4:9100`, `1.2.4.5`,
    > `printer-dns-hostname` ou `printerName.domain.com`. Si le port
    > n'existe pas déjà, un port TCP/IP d'imprimante portant le nom indiqué
    > dans le champ du port sera créé pour pointer vers cette adresse

-   **Printer Config File** (facultatif)

    > Il s'agit du chemin local ou distant vers un fichier .dat qui sera
    > importé pour définir la configuration de l'imprimante (nombre de
    > bacs, modules complémentaires, réglages propres au modèle, etc.).

!!! tip

    Vous pouvez créer le fichier de configuration d'imprimante manuellement
    en configurant une imprimante existante via l'interface des propriétés
    d'imprimante, puis en exécutant cette commande sur le même ordinateur
    `RUNDLL32 PRINTUI.DLL,PrintUIEntry /Ss /n"Printer Name" /a "C:\Path\To\Save\ConfigFile.dat m f g p`
    Il vous suffit ensuite de vous assurer que le fichier est accessible au
    client, dans un partage ou localement sur l'ordinateur, et d'indiquer ce
    chemin dans ce champ, exactement comme pour le fichier inf.


### Imprimante iPrint

Une imprimante partagée via un serveur iPrint

-   **Printer Name/Alias**

    > Le chemin vers le nom ou l'alias de l'imprimante partagée, par
    > exemple \\printerserverprinterName

-   **Printer Description** (facultatif)

    > Il s'agit d'une description de la connexion à l'imprimante, visible
    > uniquement dans l'interface FOG. Elle n'a aucun effet sur la
    > connexion côté client.

-   **Printer Port**

    > Le nom du port d'imprimante

### Imprimante réseau

Une imprimante partagée via un ordinateur Windows ou un serveur
d'impression

-   **Printer Name/Alias**

    > Le chemin de partage UNC permettant de se connecter à l'imprimante,
    > par exemple \\printServerprinterName

-   **Printer Description** (facultatif)

    > Il s'agit d'une description de la connexion à l'imprimante, visible
    > uniquement dans l'interface FOG. Elle n'a aucun effet sur la
    > connexion côté client.

### Imprimante CUPS

Une imprimante partagée via une installation CUPS sous Linux

-   **Printer Name/Alias**

    > Le chemin de partage UNC permettant de se connecter à l'imprimante,
    > par exemple \\printServerprinterName

-   **Printer Description** (facultatif)

    > Il s'agit d'une description de la connexion à l'imprimante, visible
    > uniquement dans l'interface FOG. Elle n'a aucun effet sur la
    > connexion côté client.

-   **Printer INF File**

    > Il s'agit du chemin vers le fichier INF du pilote d'imprimante. Ce
    > peut être un chemin UNC vers un partage public ou un fichier
    > accessible localement sur la machine cliente

-   **Printer IP**

    > Il s'agit de l'adresse IP de l'imprimante, par exemple `1.2.4.5`

## Associer des imprimantes à des machines

-   L'association d'imprimantes à des machines peut se faire depuis la
    section des machines ou depuis celle des groupes.
-   Dans la section des machines, trouvez la machine à laquelle vous
    souhaitez ajouter une imprimante et cliquez sur le bouton d'édition
    correspondant.
-   Dans le menu de la machine, cliquez sur le bouton **Imprimantes**.
-   Choisissez d'abord la façon dont la machine doit être gérée (voir [Modes
    de gestion des imprimantes](#modes-de-gestion-des-imprimantes))
-   Puis, dans la section située en dessous, sélectionnez dans la liste
    déroulante la ou les imprimantes que vous souhaitez installer et
    cliquez sur le bouton **Ajouter** (actualisez la page pour voir les
    imprimantes ajoutées).
-   Vous pouvez utiliser le bouton radio `default` et le bouton **Mettre à
    jour** pour que FOG contrôle l'imprimante par défaut de la machine une
    fois les imprimantes ajoutées
-   Vous pouvez retirer des imprimantes en cochant les cases situées à côté
    des imprimantes affectées et en cliquant sur le bouton **Retirer**
    (actualisez la page pour constater leur disparition).

## Créer un dépôt d'imprimantes basé sur Samba sur FOG

Si vous ne disposez pas d'un serveur public où stocker les pilotes
d'imprimante destinés au gestionnaire d'imprimantes de FOG, il est très
facile d'en mettre un en place sur le serveur FOG à l'aide de Samba, afin
que tous vos clients Windows puissent s'y connecter. Voir aussi
<https://wiki.fogproject.org/wiki/index.php?title=Creating_a_Samba_Based_Printer_Store_on_FOG>
