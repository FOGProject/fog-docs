---
title: Gestion des nœuds de stockage
description: La page d'accueil de la documentation FOG, avec la navigation vers les différentes sections
aliases:
    - Storage Node Management
context_id: storage-node
tags:
    - storage
    - storage-node
    - management
    - web-management
    - web-ui
    - scalability
    - networking
    - locations
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/storage-node).

# Gestion des nœuds de stockage

- Le gestionnaire de stockage introduit la notion de **groupes de stockage**. Pour l'essentiel, un groupe de stockage est un ensemble de serveurs NFS qui partagent des images et se répartissent la charge des ordinateurs à imager. Tout membre d'un groupe de stockage est appelé **nœud de stockage**. Vous pouvez avoir autant de groupes de stockage que vous le souhaitez, et autant de nœuds de stockage au sein de ces groupes que vous le souhaitez. Dans chaque groupe de stockage, un nœud de stockage est désigné comme le **maître** du groupe. Ce nœud **maître** est celui vers lequel vont toutes les captures d'image, celui qui prend en charge les tâches multicast du groupe et celui qui réplique les images pour le groupe. Autrement dit, les images stockées sur ce nœud sont celles qui sont distribuées à tout le groupe.
- Ce que ce nouveau système de gestion du stockage nous apporte, c'est un modèle distribué pour FOG permettant davantage de transferts unicast simultanés. Nous y gagnons aussi la redondance des données. Et nous soulageons le serveur FOG principal.
- Voici un bref aperçu des groupes de stockage ![[Nfsgroup.jpg]]
- Cette image montre un unique groupe de stockage et la circulation des données au sein du groupe. La taille de la file d'attente du système est la somme des tailles de file d'attente de tous les nœuds de stockage qu'il contient. Ainsi, si vous avez 4 nœuds ayant chacun une file d'attente de 10, la file d'attente du système est de 40, ce qui signifie que 40 clients peuvent être imagés (en unicast) simultanément. ![[StorageGroups.jpg]]
- Cette image montre qu'il est possible d'avoir sur votre réseau plusieurs groupes de stockage isolés les uns des autres. Elle montre également que les captures vont toujours vers le nœud maître et qu'une session multicast envoie toujours les données depuis le nœud maître. Les images sont poussées du nœud maître du groupe vers tous les autres membres du groupe.
- **Principaux avantages**
    1. Débit accru
    2. Stockage redondant
    3. Évolutivité
- Voir aussi [ Storage Nodes](Knowledge_Base#Storage_Nodes "wikilink") pour des tutoriels.

## Ajouter un nœud de stockage

- Définition : les nœuds de stockage fournissent un [espace de stockage NFS/FTP supplémentaire](http://www.fogproject.org/wiki/index.php?title=InstallationModes) qui augmente le débit disponible et la redondance au sein d'un réseau. Ils ne fournissent pas de services PXE, TFTP ou DHCP sur les sites secondaires. Pour activer des services PXE et TFTP supplémentaires sur des sites secondaires, voir cette section : [Inclure plusieurs serveurs PXE / TFTP](#inclure-plusieurs-serveurs-pxe--tftp)
- Tutoriel vidéo : <http://www.youtube.com/watch?v=X72WthDGwsw&fmt=18> (vidéo ancienne mais dont les informations restent valables)
- Pour ajouter un nœud de stockage supplémentaire au réseau, l'ordinateur doit être préparé de la même façon que le serveur FOG principal (désactiver le pare-feu, SELinux, etc.). Vous pouvez aussi sans risque mélanger les systèmes d'exploitation des nœuds de votre groupe de stockage : certains nœuds peuvent tourner sous Fedora et d'autres sous Ubuntu. Il est important de mettre à jour vos nœuds de stockage lorsque vous passez à une nouvelle version de FOG. L'installation d'un nœud de stockage se fait avec le même installeur que pour un serveur FOG normal. Elle se lance en exécutant le script d'installation ; les étapes sont détaillées ci-dessous.
- Assez étonnamment, certains utilisateurs sont réellement parvenus à faire fonctionner correctement un nœud de stockage sous Windows. Voir [Windows_Storage_Node](Windows_Storage_Node "wikilink") pour plus d'informations à ce sujet.
## Installer le nœud
- Pour installer un nœud :
    1. Exécutez le script d'installation, ./installfog.sh
    2. Sélectionnez votre système d'exploitation.
    3. Lorsque le mode d'installation du serveur vous est demandé, choisissez **S**, pour nœud de stockage.
    4. Saisissez l'adresse IP du nœud de stockage.
    5. Confirmez votre interface
    6. Vous devrez ensuite saisir l'adresse IP ou le nom d'hôte du nœud hébergeant la base de données FOG
    7. Un nom d'utilisateur vous sera ensuite demandé (généralement fogstorage)
    8. ainsi qu'un mot de passe situé sur le serveur FOG, qui permettra au nœud de stockage d'accéder à la base de données du serveur FOG principal. Par commodité, cette information figure dans le portail de gestion FOG (sur le serveur FOG principal). Elle est accessible via **Other Information** -> **Paramètres de FOG** -> section **FOG Storage Nodes**.
    9. Il vous sera ensuite demandé de confirmer vos paramètres d'installation ; s'ils sont corrects, appuyez sur **Y** puis sur **Entrée**.
    10. À la fin de l'installation, celle-ci produira un nom d'utilisateur et un mot de passe qui seront nécessaires pour ajouter le nœud de stockage au portail de gestion FOG. Le nom d'utilisateur est « fog » et le mot de passe se trouve dans /opt/fog/.fogsettings (voir aussi [[install-fogsettings]] )

## Ajouter le nœud au portail de gestion

- Pour ajouter un nœud
    1. Connectez-vous au portail de gestion FOG
    2. Rendez-vous dans la section **Storage Management**.
    3. Cliquez sur **Add Storage Nodes**.
    4. Pour le **Storage Node Name**, saisissez n'importe quelle chaîne alphanumérique représentant le nœud de stockage.
    5. Saisissez la description de votre choix
    6. Saisissez l'adresse IP du nœud de stockage que vous ajoutez. Il doit s'agir de l'adresse IP du nœud : n'utilisez SURTOUT PAS un nom d'hôte ici, sans quoi le nœud ne fonctionnera pas correctement.
    7. Saisissez le nombre maximal de clients unicast que ce nœud doit prendre en charge simultanément. La valeur que nous recommandons est 10.
    8. « Est nœud maître » est un réglage très dangereux ; pour l'instant, laissez-le décoché. Pour plus de détails, voir : [[storage-node#Statut de nœud maître]]
    9. Sélectionnez ensuite le groupe de stockage dont ce membre doit faire partie ; dans notre exemple, nous choisirons **Default**
    10. Indiquez ensuite l'emplacement des images sur le nœud de stockage, généralement **/images/** ; votre emplacement d'images doit toujours se terminer par un **/**.
    11. Vous voudrez ensuite cocher la case permettant d'activer le nœud.
    12. Les deux derniers champs reçoivent le nom d'utilisateur et le mot de passe générés lors de l'installation du nœud de stockage. Le nom d'utilisateur est « fog » et le mot de passe se trouve dans /opt/fog/.fogsettings
    13. Cliquez enfin sur **Ajouter** pour que le nœud rejoigne le groupe de stockage. #### Surveiller le nœud maître
 - Sur tous les nœuds de stockage se trouve un nouveau service (depuis la version 0.24) appelé FOGImageReplicator ; il s'agit d'un script très simple qui, si le nœud est le maître, copie toutes ses images vers tous les autres nœuds du groupe de stockage. La copie a lieu toutes les dix minutes par défaut, ce qui signifie que vos images ne sont PAS dupliquées instantanément vers tous les nœuds.
 - Si vous souhaitez consulter l'état de la réplication des images, vous pouvez le faire sur le nœud de stockage en basculant sur tty3, en tapant ctl + alt + f3. La sortie est également journalisée dans un fichier du répertoire **/opt/fog/log**.
 - Les journaux de FOGImageReplicator se trouvent aussi dans ![[Config.png]] **Configuration FOG** -> **Visionneuse de journaux** -> **FILE: \[Select Image Replicator\]**

## Statut de nœud maître

 - Le **nœud maître** (ce peut être le serveur ou un nœud particulier) d'un groupe de stockage est le nœud qui distribue les fichiers image à tous les autres nœuds du groupe.
 - Si toutes vos images sont réparties sur 3 nœuds d'un groupe de stockage, **si vous ajoutez un nouveau nœud de stockage ne contenant aucune image et que vous en faites le maître, il prendra la main et poussera son stock d'images vide vers tous les autres nœuds, effaçant ainsi toutes vos images**. Il est donc important d'être très prudent et de sauvegarder vos images lorsque vous modifiez le statut de maître d'un nœud.

>[!note]
>Vous **pouvez** avoir plusieurs nœuds de stockage dans un groupe de stockage. Vous **pouvez** avoir un nœud de stockage maître dans un groupe de stockage. Vous **ne pouvez pas** avoir plus d'un nœud de stockage maître dans un groupe de stockage. Vous **devez avoir** un nœud de stockage maître pour que la réplication vers les autres nœuds du groupe ait lieu. **Si** un nœud de stockage maître est défini, toutes les captures vont **d'abord** vers le nœud de stockage maître du groupe auquel l'image est affectée, puis sont **ensuite** répliquées vers les autres nœuds de stockage.

>[!note]
>Le statut de nœud maître détermine également quel nœud transmet une session multicast : un site dont le nœud n'est pas maître ne peut donc pas servir le multicast localement, même si l'image y est répliquée. Si vous faites du multicast sur plus d'un site, voir [Multicast sur plusieurs sites](multicast.md#multicast-sur-plusieurs-sites).

## Inclure plusieurs serveurs PXE / TFTP

-   Un nœud de stockage maître traditionnel, [tel que décrit plus haut](https://wiki.fogproject.org/wiki/index.php?title=Managing_FOG#Adding_a_Storage_Node), n'apporte qu'une redondance du stockage de fichiers. Si cela peut aider à augmenter le débit multicast sur un réseau unique, toutes les machines gérées par FOG doivent se trouver dans le même sous-réseau ou VLAN afin que les requêtes DHCP diffusées puissent être dirigées vers le serveur principal. (voir la note ci-dessous)

>[!note]
>selon le réseau, il peut être possible de configurer [http://en.wikipedia.org/wiki/UDP_Helper_Address iphelper] pour transférer les paquets vers le serveur FOG principal

-   Les instructions suivantes ont pour but d'aider à configurer des nœuds de stockage supplémentaires afin qu'ils fonctionnent de façon indépendante sur des réseaux distincts, tout en se synchronisant avec un serveur FOG principal unique et en recevant ses ordres.

-   Cliquez ici pour obtenir des instructions sur la mise en place de [plusieurs serveurs PXE / TFTP](https://wiki.fogproject.org/wiki/index.php?title=Multiple_TFTP_servers "Multiple TFTP servers")

