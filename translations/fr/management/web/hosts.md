---
title: Gestion des machines
aliases:
    - Host Management
description: page d'index des machines
context_id: hosts
tags:
    - in-progress
    - management
    - hosts
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/hosts).

# Gestion des machines

## Machines

[Présentation vidéo des
machines](http://freeghost.sourceforge.net/videotutorials/hostinfo.html)

-   Dans FOG, une machine est généralement un ordinateur, mais ce peut
    être n'importe quel équipement réseau.
-   Les machines servent à identifier un ordinateur sur le réseau et à
    gérer l'équipement.

## Ajouter une nouvelle machine

[[storage-node#Ajouter un nœud de stockage]]

### Méthode 1 : ajouter une nouvelle machine par enregistrement complet

-

    C'est la méthode recommandée, et peut-être la plus simple pour faire entrer une machine dans la base de données FOG, mais elle exige de vous rendre auprès de la machine.

    :   -   Sur l'ordinateur client, pendant le démarrage, lorsque le menu
            de démarrage PXE/iPXE apparaît, sélectionnez **Perform Full
            Host Registration and Inventory**.
        -   Durant cette phase, des informations sur la machine vous seront
            demandées : nom de machine, système d'exploitation, image,
            groupes, clé de produit et autres renseignements.
        -   Si vous saisissez un système d'exploitation et un identifiant
            d'image valides, il vous sera proposé d'imager immédiatement.
        -   Si vous le souhaitez, vous pouvez créer la tâche et l'image
            sera déployée au prochain démarrage réseau.

-   Une fois les informations demandées saisies, FOG effectuera un rapide
    inventaire matériel du client.

-   Cette méthode d'enregistrement enregistrera auprès du serveur FOG
    l'adresse MAC (filaire principale uniquement), le numéro de série (s'il
    est disponible dans le BIOS), la marque et le modèle, ainsi que
    d'autres informations matérielles.

-   Pour plus d'informations sur ces commandes, voir : [[using-fog-boot-menu#Client Side Tasks]]

### Méthode 2 : ajouter une nouvelle machine par enregistrement rapide

-   L'enregistrement rapide ressemble beaucoup à l'enregistrement complet,
    à ceci près qu'il ne vous demande aucune saisie et ne vous propose pas
    d'imager l'ordinateur directement depuis l'écran d'enregistrement.
    Lorsque la machine est ajoutée au serveur FOG, elle est nommée d'après
    son adresse MAC principale. Cette méthode est idéale pour ajouter
    rapidement et simplement une salle de 30 ordinateurs à FOG.
-   Cette fonctionnalité est désactivée par défaut ; pour l'activer :

1.  Rendez-vous dans **Configuration FOG**

2.  Sélectionnez **Paramètres de FOG**

3.  Trouvez la section **FOG Quick Registration**

4.  Activez **FOG_QUICKREG_AUTOPOP** en le passant à &#10004;

5.  Réglez **FOG_QUICKREG_IMG_ID** sur l'identifiant de l'image que vous
    souhaitez utiliser pour toutes les machines nouvellement créées.

6.  **FOG_QUICKREG_OS_ID** sera renseigné automatiquement lorsque vous
    sélectionnerez « Save Changes ». (Le système d'exploitation est
    désormais associé à l'image, il est donc inutile d'en choisir un)

7.

    Modifiez **FOG_QUICKREG_SYS_NAME** pour indiquer comment vous souhaitez nommer vos nouvelles machines, où `*` sera remplacé par un nombre.

    :   -   Si vous souhaitez compléter les nombres par des zéros, vous
            pouvez utiliser **LAB300-**\*\*, ce qui donnerait
            **LAB300-03** ou **LAB300-09**.

8.

    Réglez **FOG_QUICKREG_SYS_NUMBER** sur le premier nombre que vous souhaitez utiliser.

    :   -   Après chaque enregistrement, l'ordinateur sera imagé
            automatiquement et **FOG_QUICKREG_SYS_NUMBER** sera incrémenté
            de 1.

### Méthode 3 : ajout manuel

[Tutoriel vidéo d'ajout de
machine](http://freeghost.sourceforge.net/videotutorials/addimghost.html)

-   L'ajout d'une nouvelle machine se fait dans la section des machines de
    FOG.
-   Puis en cliquant sur le bouton « Add New Host » du menu de gauche.
-   Un nom de machine et une adresse MAC au minimum doivent être saisis
    pour ajouter la machine à la base de données FOG.

------------------------------------------------------------------------

#### Champs __obligatoires__{ .red }

Une machine comporte les champs __obligatoires__{ .red } suivants :

##### Nom de machine

> Une chaîne utilisée comme nom d'hôte Windows du client ; elle doit faire
> moins de 15 caractères.

##### Adresse MAC

> Ce champ sert d'identifiant unique pour la machine. La chaîne doit être
> séparée par des `:` (deux-points), au format `00:11:22:33:44:55`.

> [!NOTE]
> L'adresse MAC dispose d'un champ de description. Celui-ci ne peut actuellement être renseigné que via l'API et peut contenir ce que vous voulez.
> Vous pourriez par exemple utiliser le [module PowerShell FOGApi](https://github.com/darksidemilk/FogApi) pour donner aux descriptions de MAC la marque et le modèle de la carte, ainsi :

```
$fogHost = Get-FogHost
$fogHostMacs = Get-FogHostMacs -hostid $foghost.id;
$fogHostMacs | ForEach-Object {
    $fogmac = $_;
    $netAdapter = Get-NetAdapter -IncludeHidden | Where-Object macaddress -eq $fogmac.mac.replace(":","-");
    if ($Null -ne $netAdapter) {
        $fogMac.description = "$($netAdapter.name) - $($netAdapter.InterfaceDescription)"
        Update-FogObject -type object -coreObject macaddressassociation -jsonData ($fogMac | convertto-json) -IDofObject $fogmac.id -vb
    }
}
```

Cela effectue un POST vers `{fogurl}/fog/macaddressassociation/{macID}/edit` avec un json de la forme suivante, pour chaque adresse MAC d'une machine Windows déjà présente dans FOG.

```
{
  "id": 6355,
  "hostID": 1847,
  "mac": "f4:a4:75:ab:93:d4",
  "description": "Wi-Fi - Intel(R) Wi-Fi 6E AX210 160MHz",
  "pending": "0",
  "primary": "0",
  "clientIgnore": "0",
  "imageIgnore": "0"
}
```

------------------------------------------------------------------------

#### Champs facultatifs

Une machine peut également comporter, sans que ce soit obligatoire :

##### Description

> Une information pour votre propre usage.

##### Association d'image

> Ce champ est une liste déroulante qui vous permet de sélectionner un
> objet image créé dans la section **Images**.

##### Système d'exploitation

> Liste déroulante qui vous permet de sélectionner le type principal de
> système d'exploitation utilisé sur cette machine.

##### Noyau

> Ce champ ne sert que si vous souhaitez remplacer le noyau utilisé par
> défaut par FOG. Il doit être indiqué sous la forme fog/kernel/mybzImage

##### Arguments du noyau

> Ce champ vous permet d'ajouter des arguments de noyau supplémentaires
> pour le démarrage de la machine (par exemple : vga=6 ou irqpoll).

##### Disque principal

> Cette option vous permet de forcer l'utilisation d'un périphérique
> pendant l'imagerie si FOG ne parvient pas à détecter le bon nœud de
> périphérique.

------------------------------------------------------------------------

!!! note

    Cette page permet également de configurer l'intégration à Active
    Directory, mais ce sujet sera traité plus loin.


**Une fois tous les réglages renseignés, cliquez sur le bouton « Add ».**

### Méthode 4 : importer les informations de machines

-   Lorsque vous démarrez avec FOG, vous devez saisir les informations des
    machines correspondant aux équipements de votre réseau. Nous
    comprenons que cela puisse être un processus long et difficile ; pour
    le simplifier, nous avons donc créé une page qui vous permet
    d'importer l'essentiel des informations de machines depuis un fichier
    CSV.

>[!note]
>Le format CSV a beaucoup changé dans FOG 1.6 (colonnes avec en-têtes **ou**
>positionnelles, colonne `associations` pour les groupes, snapins et
>imprimantes, et clés étrangères résolues par nom). Voir [[csv_import_export|Import / export CSV]]
>pour la disposition des colonnes actuelle et complète ainsi que les règles de
>format — la démarche la plus sûre est **Exporter → modifier → Importer**, afin
>de toujours partir d'un fichier que FOG considère déjà comme valide.

#### Importer le fichier

1.  Une fois le fichier préparé et enregistré, vous devrez vous connecter
    au portail de gestion FOG.
2.  Cliquez ensuite sur l'icône Machines.
3.  Dans le menu de gauche, cliquez sur **Import Hosts**.
4.  Recherchez votre fichier, puis cliquez sur « **Upload CSV** ».

#### Créer un CSV à partir d'un balayage réseau

D'après un membre de la communauté sur les forums, vous pouvez aussi
utiliser PowerShell pour balayer le réseau et créer un csv. Voir [Creating a
csv host import from a network
scan](https://forums.fogproject.org/topic/9560/creating-a-csv-host-import-from-a-network-scan?_=1602530061175)

``` {.powershell emphasize-lines="3,12"}
# examples, just gotta put subnets minus the final .x in a string array
# Could also be params if this was a function
$subnets = @("192.168.1", "192.168.2", "10.2.114", "192.168.0");
$subnets | ForEach-Object { # loop through each subnet
    for ($i=0; $i -lt 255; $i++) { # loop through 0 to 255 of the subnet
        $hn = nslookup "$_.$i"; # run nslookup on the current ip in the loop
        if ($hn[3] -ne $null -AND $hn[3] -ne "") { # does the ip have a dns entry
            $hostN = $hn[3].Replace("Name:","").Trim(); # parse the nslookup output into a fqdn host name
            $mac = getMac /S $hostN; # does the hostname have a mac addr. Can also add /U and /P for user and password if not running from a administrative account
            if ($mac -ne $null) { # was there a mac for the host?
                $macAddr = $mac[3].Split(' ')[0]; # use the first found mac address and parse it
                "$hostN,$macAddr" | Out-File C:\hosts.csv -Append -Encoding UTF8; # add the hostname,macaddress to the csv
            }
        }
    }
}
```

## Gérer les machines

### Généralités

-   Une fois des machines ajoutées à la base de données FOG, vous pouvez
    les modifier ou les supprimer. Trouver une machine à modifier peut se
    faire de deux façons : la première consiste à lister toutes les
    machines existantes, en cliquant sur le bouton « List All Hosts ». La
    seconde consiste à utiliser la fonction de recherche. Pour rechercher
    des machines, cliquez sur le bouton « New Search » ; si vous souhaitez
    rechercher toutes les machines, vous pouvez saisir « \* » ou « % ». La
    recherche portera sur le nom, la description, l'adresse IP et
    l'adresse MAC de la machine.
-   Une fois une machine trouvée, elle peut être modifiée en cliquant sur
    le bouton d'édition ou sur le nom de machine lui-même. Cliquer sur le
    bouton d'édition affichera toutes les propriétés présentées lors de la
    création de la machine, auxquelles s'ajoutent les snapins, les
    imprimantes, Active Directory, les paramètres du service, le matériel,
    l'historique des virus et les informations de connexion.
-   L'objet machine tout entier peut être retiré du système FOG en
    cliquant sur l'option de suppression au bas du menu de la machine.

### Prise en charge de plusieurs adresses MAC

-   Lorsque FOG enregistre pour la première fois votre MACHINE, il utilise
    le premier câble Ethernet connecté et en fait par défaut l'adresse MAC
    principale. Une fois le client FOG installé et remontant des données
    au serveur FOG, celui-ci peut enregistrer d'autres adresses MAC
    supplémentaires, comme celles du sans-fil et d'autres connexions
    filaires. Une adresse MAC supplémentaire peut également être ajoutée
    directement dans la définition de la machine.

-

    Ces nouvelles adresses MAC devront être approuvées avant que FOG n'en tire parti.

    :   1.  **Gestion des machines** → **\[Machine sélectionnée\]**
 → *Additional MAC*
        2.  **Configuration FOG** → **MAC Address List**
 → *Approve Pending Addresses*

-   **Configuration FOG** → **MAC Address List** À cet endroit,
    vous pouvez également *« Update Current Listings »*, ce qui met à jour
    les informations sur les adresses MAC et leurs fabricants, en les
    répertoriant sous la machine.

### État des machines

-   L'état des machines affiche une icône indicatrice à côté de la machine
    dans l'interface FOG, indiquant l'état de celle-ci. Cette fonction
    exécute un ping fondé sur le nom de la machine. Pour qu'elle
    fonctionne, vous devez donc disposer d'un serveur DNS interne relié à
    votre serveur DHCP, de sorte que, lorsqu'une adresse DHCP est
    attribuée, le serveur DNS soit informé de la nouvelle adresse IP. Si
    tout cela est correctement configuré, vous devez vous assurer que
    votre serveur FOG est capable de faire un ping vers une machine depuis
    la ligne de commande, avec :

        ping somehostname

-   Si le serveur n'arrive pas à faire un ping vers le client, l'état de
    la machine dans l'interface s'affichera toujours comme injoignable. Si
    vous pouvez faire un ping vers le client en utilisant le FQDN, comme
    ceci :

        #Replace forproject.org with your domain suffix
        ping somehostname.fogproject.org

-   Il vous faudra alors ajuster le réglage DNS **Search domains:** de
    votre serveur. Après cette modification, vous devrez redémarrer le
    serveur Apache pour qu'elle prenne effet.

-   Si, après cela, vous n'arrivez toujours pas à faire un ping vers vos
    clients, le problème peut venir d'un pare-feu sur les clients. Dans ce
    cas, des modifications de configuration propres au client peuvent être
    nécessaires.

-

    Avec un nombre croissant de machines (250 et plus), ce « ping » ralentira le chargement de la page *List All Hosts*. Désactiver cette fonctionnalité aidera au chargement de cette page.

    :   1.  **Configuration FOG** → **Paramètres de FOG** → **General
            Settings** → décochez *FOG_HOST_LOOKUP*

### Créer des groupes de machines

-   FOG vous permet de créer des groupes de machines, ce qui vous permet
    ensuite d'agir sur tout un ensemble de machines.
-   Les groupes peuvent être créés depuis la section « List All Hosts » ou
    en effectuant une recherche de machines.
-   Pour créer un groupe, sélectionnez l'ordinateur que vous souhaitez
    voir membre du groupe en cochant la case située à côté de son nom de
    machine, ou en cliquant sur le bouton « tout cocher » de la ligne de
    titre. Une fois les machines sélectionnées, faites défiler jusqu'au bas
    de l'écran, puis saisissez un nom dans la zone de création de groupe ou
    sélectionnez un groupe auquel ajouter les machines. Cliquez ensuite sur
    le bouton « Process Group Changes ».
