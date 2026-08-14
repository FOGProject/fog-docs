---
title: Installer le serveur FOG
description: Instructions pour l'installation du serveur FOG sur un serveur Linux existant
context_id: install-fog-server
aliases:
    - Install FOG Server
    - FOG Server Installation
tags:
    - install
    - fogserver
    - git
    - prerequisites
    - install-script
    - configuration
    - database
    - cli-switches
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/server/install-fog-server).

# Installer le serveur FOG

Avant de vous précipiter dans l'installation de FOG, vérifiez la [[requirements]]
Les instructions d'installation données ici supposent que vous disposez d'un serveur fraîchement installé ne contenant que l'ensemble minimal de paquets.
La mise à jour de FOG suit essentiellement le même processus : au lieu de créer un nouveau clone du dépôt, vous faites un `git pull` et relancez l'installateur — ou vous laissez [`bin/updatefog.sh`](#mettre-à-jour-une-installation-existante) réaliser les deux étapes pour vous.

## Prérequis

La méthode recommandée pour obtenir FOG est Git.

### Distributions dérivées de Debian

    sudo -i
    apt-get -y install git

### Distributions dérivées de RedHat

    sudo -i
    dnf -y install git

Maintenant que git est installé, vous devriez pouvoir cloner le dépôt FOG.
Nous recommandons généralement de placer le dépôt dans /root, mais si vous
avez l'habitude de ce genre de manipulation, placez-le où vous voulez.
Voici comment cloner le dépôt (le code) de FOG sur votre machine locale :

    sudo -i
    cd /root
    git clone https://github.com/FOGProject/fogproject.git
    cd fogproject

![[git-clone.png]]

### Choisir une version de FOG

FOG propose à tout moment plusieurs versions, développées dans des branches de
notre dépôt git. La version « dev » de la dev-branch est généralement une
option stable, car de nombreux tests sont encore effectués avant que les
modifications ne soient validées, mais pas autant que pour la version
« stable » à plus long terme de la branche stable.

> [!warning]
> Sachez que vous ne devriez **pas** envisager de revenir à la branche stable sans y avoir mûrement réfléchi.
> Cela tient aux modifications du schéma de base de données introduites au fil du temps.
> Par exemple, si FOG a été installé depuis la branche stable, vous pouvez passer sans problème à des versions plus récentes de la dev-branch comme la 1.5.10.53.
> Mais si vous souhaitez ensuite revenir à la branche stable, il est possible que les modifications de schéma posent problème lors du retour en arrière, et vous devrez peut-être attendre la prochaine version officielle, par exemple la 1.6.0, pour revenir à la version de la branche stable.
> Faire autrement se fait à vos risques et périls ! (Pour être honnête, ce type de problème est rare ; il s'agit simplement d'une mise en garde. Il existe aussi une modification de base de données permettant de forcer le retour du schéma, mais un certain risque subsiste : nous n'avons pas constaté de tels problèmes, mais le risque demeure.)

> [!note]
> Si vous choisissez de passer à la branche working-1.6 pour tester la bêta (MERCI, au passage ! Nous espérons que vous l'apprécierez), consultez [[tags#1_6-changes]] pour les pages relatives aux changements de configuration qui peuvent s'avérer nécessaires dans certains cas. Nous nous efforçons de tout prendre en charge de façon universelle dans l'installateur mais, à mesure que nous découvrons des pièges, même corrigés, nous essayons de les signaler à tous.

Si vous voulez ce qui se fait de plus récent, contribuer aux tests de nouvelles
fonctionnalités, ou si l'on vous a demandé d'installer la version de la
dev-branch pour diagnostiquer un problème, il vous suffit de faire un
`git checkout` de la dev-branch comme ceci (ignorez simplement les lignes de
commentaire commençant par « # ») :

    #placez-vous là où vous avez cloné le dépôt git, par ex. /root/fogproject
    cd /root/fogproject
    #mettre à jour toutes les branches
    git fetch --all
    #basculer sur la dev-branch
    git checkout dev-branch
    #ou basculer sur la branche working pour les dernières fonctionnalités
    #git checkout working-1.6
    #en cas de mise à jour, veillez à récupérer les derniers changements
    git pull

Vous pouvez ensuite exécuter l'installateur pour effectuer une mise à jour ou
une nouvelle installation, comme indiqué dans la section suivante.

Vous pouvez revenir à la branche stable avec :

    cd /root/fogproject
    git fetch --all
    git checkout stable

Vous pouvez consulter la liste des branches actuelles ici :
<https://github.com/FOGProject/fogproject/branches>

> [!tip]
> Si `git pull` vous signale des modifications en attente, utilisez
> `git reset --hard origin/{branchName}`
>  pour annuler les modifications de fichiers dans votre dossier de dépôt qui surviennent parfois pendant l'installation, puis relancez `git pull` pour vous assurer d'être à jour.

### Mettre à jour une installation existante

Les étapes manuelles `git fetch`/`git checkout`/`git pull` ci-dessus
fonctionnent toujours exactement comme décrit et vous donnent le plus de
contrôle — utile si vous voulez inspecter les changements avant de les
récupérer, passer à un commit ou à une étiquette précise, ou personnaliser le
processus d'une autre manière.

Si vous préférez ne pas le faire à la main à chaque fois, `bin/updatefog.sh`
regroupe ces mêmes étapes en une seule commande :

    cd /root/fogproject/bin
    ./updatefog.sh

Il récupère et bascule sur la branche correspondant au canal de mise à jour que
ce serveur est configuré pour suivre (`stable`, `dev` ou `beta` — correspondant
respectivement aux branches `stable`, `dev-branch` et `working-1.6`), sauvegarde
l'arrière-plan PXE, le jeu de noyaux et les fichiers rEFInd que la
synchronisation des ressources de l'installateur peut écraser, relance
`installfog.sh` à votre place, et annule automatiquement le changement de
branche git ainsi que ces fichiers sauvegardés (puis réinstalle) si quelque
chose échoue en cours de route.

Options :

    ./updatefog.sh --help
    Usage: ./updatefog.sh [-h?y] [--channel stable|dev|beta] [--git-path </path>] [--no-revert]
        -h -? --help       Display this info
              --channel    Update channel to track: stable, dev, or beta
                            defaults to whatever this server already tracks
              --git-path   Override the git checkout path this server records
              --no-revert  On failure, leave the system as-is instead of
                            automatically reverting to the previous commit
        -y    --yes        Skip the confirmation prompt (for cron/GUI use)

Le canal que vous choisissez est mémorisé pour la fois suivante, de la même
façon que `.fogsettings` mémorise déjà vos autres choix d'installation — voir
[[install-fogsettings|Le fichier .fogsettings]]. Il est également recopié dans
la base de données sous `FOG_GIT_PATH`/`FOG_UPDATE_CHANNEL`, dans la catégorie
**FOG Update** de la page Paramètres de l'interface web, afin que vous puissiez
voir quel dépôt et quel canal un serveur suit sans vous y connecter en SSH.
Cette copie est purement informative — la modifier à cet endroit n'a aucun effet
sur la prochaine mise à jour ; changez plutôt le canal avec `--channel`.

### Alternatives

Si vous rencontrez des problèmes ou avez de bonnes raisons de ne pas utiliser
Git, vous pouvez simplement télécharger l'archive d'installation de FOG au
format ZIP ou tar.gz.

-   dernière version stable :
    [ZIP](<https://github.com/FOGProject/fogproject/archive/stable.zip>)
    ou
    [tar.gz](<https://github.com/FOGProject/fogproject/archive/stable.tar.gz>)
-   dernière version dev :
    [ZIP](<https://github.com/FOGProject/fogproject/archive/dev-branch.zip>)
    ou
    [tar.gz](<https://github.com/FOGProject/fogproject/archive/dev-branch.tar.gz>)
-   version précise :
    [ZIP](<https://github.com/FOGProject/fogproject/archive/1.5.10.zip>)
    ou
    [tar.gz](<https://github.com/FOGProject/fogproject/archive/1.5.10.tar.gz>)

Extrayez simplement l'archive et lancez l'installateur comme décrit ci-dessous.

## Lancer l'installateur

Pour démarrer le processus d'installation, suivez les étapes ci-dessous.
L'installateur **doit être exécuté en tant que root**.

```
  sudo -i
  cd /root/fogproject/bin
  ./installfog.sh
```

>[!tip]
>L'installateur dispose également de diverses options pour une exécution silencieuse et plus encore, voir  [[command-line-options#Fog installer command line options|Options en ligne de commande de l'installateur FOG]]

Avant l'installation de tous les composants, plusieurs questions vous sont
posées afin que la configuration corresponde à votre situation et soit prête à
l'emploi dès la fin de l'installateur :

### Questions de l'installateur

Question  | Description
--      |   --
**SELinux** | *ceci ne concerne que les installations dérivées de RedHat* **FOG prend en charge SELinux en mode enforcing, et le laisser activé est désormais le comportement par défaut.** L'installateur étiquette ses propres répertoires, fournit un petit module de politique pour les ports dont la couche web a besoin, et a été testé en capture, déploiement et réplication sous enforcing. La question vous est toujours posée et vous pouvez toujours choisir permissive, mais ce n'est plus nécessaire. Les anciennes versions de FOG recommandaient permissive et y basculaient automatiquement avec `-y` ; ce n'est plus le cas.
**Pare-feu local** | **L'installateur configure désormais votre pare-feu au lieu de vous demander de le désactiver.** Il n'ouvre que les ports réellement utilisés par votre installation, sur firewalld et ufw, et affiche les commandes exactes pour `iptables` brut (qu'il ne modifie délibérément pas — voir plus bas). Vous pouvez toujours choisir de désactiver le pare-feu, ou de le laisser tel quel et de le configurer vous-même. Notez que les anciennes versions ne faisaient rien du tout ici avec `-y`, laissant le pare-feu dans l'état où se trouvait la machine. Pour la liste des ports, les étapes manuelles pour les trois implémentations et la manière de restreindre FOG à un seul sous-réseau, voir [[firewall\|Configuration du pare-feu d'un serveur FOG]].
**Choix du système d'exploitation** | L'installateur tente de deviner la distribution que vous utilisez. Confirmez simplement la sélection si elle est correcte, sinon choisissez l'option appropriée.
**Mode d'installation** | Avec le même installateur, vous pouvez installer un serveur FOG normal (appelé nœud maître) ou un nœud de stockage FOG. Un nœud de stockage utilise ce même installateur — vous répondriez O ici pour en installer un plutôt qu'un serveur complet. Pour savoir ce qu'est un nœud de stockage et comment le gérer, voir [[storage-node\|Gestion des nœuds de stockage]]. Comme nous installons ici un serveur FOG complet, choisissez N.
**Interface réseau par défaut** | L'installateur a besoin de savoir quelle interface réseau servira à héberger le démarrage PXE ainsi qu'à envoyer les images en unicast et en multicast. Si l'installateur a deviné la bonne interface, choisissez n(on) pour continuer avec l'interface présélectionnée. Sinon, choisissez o(ui) et saisissez le nom de l'interface réseau (comme eth0, ens192).
**Service DHCP** | Vous avez la possibilité d'exécuter un service DHCP sur le serveur FOG lui-même ou, si vous disposez déjà d'un serveur DHCP sur votre réseau, de répondre n(on) aux trois questions suivantes. Pour plus d'informations sur la configuration d'un serveur DHCP existant afin qu'il fonctionne avec FOG, voir [[dhcp-server-settings\|Paramètres du serveur DHCP]]. Les questions sur le DHCP sont posées dans l'ordre inverse : d'abord les paramètres, et enfin la question de savoir si vous voulez réellement activer le DHCP sur votre serveur FOG. Cet ordre pourra être modifié dans de futures versions de l'installateur.
**Adresse du routeur DHCP** | Si vous comptez exécuter un serveur DHCP sur ce serveur FOG, répondez o(ui) et saisissez l'adresse du routeur (ou passerelle par défaut) que le serveur DHCP annoncera. Si vous disposez déjà d'un serveur DHCP sur votre réseau, choisissez N ici. (Cette question est sans objet si vous choisissez d'utiliser ou de configurer votre propre serveur DHCP et sera masquée dans les futures versions lorsque le DHCP est désélectionné.)
**DHCP gère le DNS** | Si vous comptez exécuter un serveur DHCP sur ce serveur FOG, répondez o(ui) pour annoncer les adresses IP des serveurs DNS aux clients et saisissez l'adresse IP du serveur DNS local. Si vous disposez déjà d'un serveur DHCP sur votre réseau, choisissez n(on) ici. (Cette question est également sans objet si vous choisissez d'utiliser ou de configurer votre propre serveur DHCP et sera masquée dans les futures versions lorsque le DHCP est désélectionné.)
**Activer le DHCP** | Si vous voulez exécuter un serveur DHCP sur ce serveur FOG, choisissez o(ui). Sinon, choisissez n(on).
**Prise en charge de l'internationalisation** | Si vous voulez que l'interface web de FOG propose des langues supplémentaires, choisissez o(ui) ici.
**Prise en charge du HTTPS** | Vous pouvez choisir de configurer FOG avec des communications chiffrées. FOG fournissant plusieurs services différents (par ex. l'interface web de configuration, l'API web, le démarrage PXE, la gestion des clients via les [[network-and-firewall-requirements#FOG Client to FOG Server communications]] ), le choix du HTTPS a des conséquences : 1. Un certificat auto-signé est généré pour vous. 2. Le serveur web Apache est également configuré pour héberger l'interface web en HTTPS. 3. La compilation iPXE à la volée inclut ce certificat dans les binaires PXE fournis par votre nouveau serveur FOG. Cela fonctionne généralement d'emblée et ne demande pas d'intervention manuelle. Mais si vous avez un doute, vous pouvez tout de même choisir n(on) pour réduire le risque de problèmes. Même sans prise en charge du HTTPS, la communication entre fog-client et le serveur FOG emprunte un canal chiffré sécurisé.
**Nom d'hôte** | Ce nom d'hôte est utilisé dans l'interface web de FOG. Vérifiez le nom d'hôte détecté automatiquement ; choisissez n(on) pour accepter le nom proposé, ou o(ui) pour saisir le nom d'hôte correct.
**Récapitulatif** | L'installateur affiche toutes les options telles qu'elles ont été choisies. Si vous êtes certain que tout est correct, choisissez o(ui) pour lancer l'installation. Choisir n(on) met fin à l'installateur et vous devrez recommencer la procédure en répondant de nouveau à toutes les questions.

### Questions d'installation

Si l'installateur détecte un serveur de base de données MySQL dont le mot de
passe « root » est vide, vous devrez en saisir un à définir. Si le compte Linux
« fogproject » a déjà été utilisé sur ce serveur, l'installateur le signalera et
fournira des informations et des instructions pour remédier à la situation.

## Configuration de la base de données

Si l'essentiel de l'installation se déroule sans intervention, une étape doit
être réalisée manuellement. L'installateur prépare la base de données pour vous,
puis vous demande d'ouvrir votre navigateur web et de vous rendre sur
l'interface web de FOG pour construire le schéma initial de la base de données
ou mettre à jour une base existante avec les nouvelles évolutions du schéma.
Veillez à suivre cette étape et ne poursuivez l'installateur (touche ENTRÉE)
qu'une fois la création ou la mise à jour du schéma terminée, sans quoi
l'installateur échouera.

## Dernières étapes

Si tout s'est déroulé comme prévu, l'installateur se termine par les
informations suivantes :

    * Setup complete

     You can now login to the FOG Management Portal using
     the information listed below.  The login information
     is only if this is the first install.

     This can be done by opening a web browser and going to:

     https://x.x.x.x/fog/management

     Default User Information
     Username: fog
     Password: password

Votre serveur FOG est maintenant prêt à l'emploi ! Allez-y, connectez-vous à
l'interface web, commencez à utiliser FOG et amusez-vous. Une bonne première
étape consiste à [[capture-an-image|capturer une image]] depuis une machine
modèle, puis à [[deploy-an-image|la déployer]] sur vos autres ordinateurs.


## Paramètres d'installation de FOG

Tous vos choix effectués pendant l'installation sont enregistrés dans le fichier
`/opt/fog/.fogsettings`.

Au prochain démarrage de l'installateur, celui-ci passera toutes les questions
(sauf une invite à vérifier les mises à jour de schéma dans l'interface web, à
moins que vous ne précisiez -Y) et reprendra à l'étape « Récapitulatif ».

Vous pouvez ainsi réinstaller ou mettre à jour facilement un serveur FOG.

Pour un aperçu de tous les paramètres du fichier .fogsettings, voir
[[install-fogsettings|Le fichier .fogsettings]]

## Erreurs d'installation

Si l'installateur échoue ou si quelque chose ne semble pas normal, la sortie
complète de l'exécution est enregistrée dans `error_logs/foginstall.log`, et des
erreurs plus détaillées sont écrites dans
`error_logs/fog_error_<version>.log`. Les deux se trouvent dans le répertoire
depuis lequel vous avez lancé l'installateur (le répertoire `bin/` du dépôt
cloné).

Lorsque vous demandez de l'aide sur les [forums FOG](https://forums.fogproject.org/),
joignez la partie pertinente de ces journaux — c'est le moyen le plus rapide
d'obtenir une réponse utile.
