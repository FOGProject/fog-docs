---
title: Options d'installation du client FOG
aliases:
    - FOG Client installation options
description: page d'index de fog-client-installation-options
context_id: fog-client-installation-options
tags:
    - in-progress
    - silent-install
    - fog-client
    - convert-Wiki2MD
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/fog-client-installation-options).

# Options d'installation du client FOG

## Client Windows

### Prérequis

Pour exécuter le client FOG sous Windows, vous avez besoin du .NET Framework en
version 4.0 ou supérieure

> -   Windows 10 est livré avec une version de .NET qui conviendra.
> -   Le profil client .NET 4 NE fonctionnera PAS
> -   Vous pouvez télécharger le framework ici : [Microsoft .NET
>     Framework 4.5.1 (Offline Installer) for Windows Vista SP2, Windows
>     7 SP1, Windows 8, Windows Server 2008 SP2 Windows Server 2008 R2
>     SP1 and Windows Server
>     2012](https://www.microsoft.com/en-us/download/details.aspx?id=40779)

Chaque version de serveur FOG est livrée avec son propre client FOG. Vous pouvez
télécharger le client depuis l'interface web de FOG :

-   Connectez-vous sur la machine cliente, ouvrez un navigateur et rendez-vous
    sur l'interface web de FOG.
-   En bas de l'interface web, cliquez sur le lien « FOG Client » (il n'est pas
    nécessaire de vous authentifier).
-   Sélectionnez votre installeur

### Installeur MSI

> -   Cliquez sur le lien « MSI \-- Network Installer » pour exécuter le paquet
>     MSI (utilisable également avec le déploiement de logiciels par GPO et
>     d'autres installations silencieuses).
> -   L'URL de téléchargement est (où `fogserver` est le nom d'hôte de votre serveur FOG)
>     `http://fogserver/fog/client/download.php?newclient`

### Smart Installer

> -   Cliquez sur le lien Smart Installer pour télécharger et exécuter le smart
>     installer. Il s'agit d'une installation multiplateforme qui détecte votre
>     système d'exploitation
> -   L'URL de téléchargement est (où `fogserver` est le nom de votre serveur FOG local)
>     `http://fogserver/fog/client/download.php?smartinstaller`

### Exécuter l'installeur


> [!info]
> Les étapes suivantes suivent l'assistant de l'installeur msi.
> L'assistant du Smart Installer est similaire



> [!NOTE]
>  Vous pouvez obtenir une fenêtre « Windows a protégé votre ordinateur ». Dans
>  ce cas, vous devez convaincre Windows que cet installeur peut être exécuté
>  sans risque. Cliquez sur « Informations complémentaires » puis « Exécuter
>  quand même ».



-   Sur l'écran d'accueil, cliquez sur « Next »
-   Acceptez les termes du contrat de licence (c'est la licence GPL, alors
    pourquoi pas) et cliquez sur « Next »

-   Renseignez les champs obligatoires :
    -   Server Address : saisissez le nom d'hôte ou l'adresse IP du serveur FOG.
    -   Web Root : laissez /fog
    -   Laissez les autres options telles quelles
    -   Cliquez sur « Next »
    -   Laissez le dossier de destination tel quel et cliquez sur « Next »
-   Cliquez sur « Install » et répondez « Oui » à l'invite du contrôle de compte
    d'utilisateur.
-   Une fois l'assistant terminé, cliquez sur « Finish ».

Le client FOG est désormais installé. Une nouvelle icône doit apparaître dans la
barre des tâches :

Cette icône vous indique la version du client FOG et sert à gérer les
notifications destinées à l'utilisateur final.

### Installation silencieuse du client FOG

Si vous souhaitez créer une installation silencieuse pour déployer le client
FOG, voici un exemple de script PowerShell qui le ferait pour vous

!!! note

    Ce script suppose que vous pouvez joindre votre serveur FOG sous le nom par défaut fogserver, qui peut être un nom d'hôte ou un alias DNS


``` powershell
#download the client installer to C:\fogtemp\fog.msi
Invoke-WebRequest -URI "http://fogserver/fog/client/download.php?newclient" -UseBasicParsing -OutFile 'C:\fogtemp\fog.msi'
#run the installer with msiexec and pass the command line args of /quiet /qn /norestart
Start-Process -FilePath msiexec -ArgumentList @('/i','C:\fogtemp\fog.msi','/quiet','/qn','/norestart') -NoNewWindow -Wait;
```

### Options du MSI

-   USETRAY= vaut « 1 » par défaut ; si « 0 », l'icône de la zone de
    notification est masquée
-   HTTPS= vaut « 0 » par défaut ; si « 1 », le client utilisera HTTPS (non
    recommandé)
-   WEBADDRESS= vaut « fogserver » par défaut, c'est l'adresse IP ou le nom DNS
    de votre serveur
-   WEBROOT= vaut « /fog » par défaut
-   ROOTLOG= vaut « 0 » par défaut ; si « 1 », le fichier fog.log se trouvera
    dans C:fog.log, sinon dans %PROGRAMFILES%FOGfog.log

Exemple d'installation MSI silencieuse :

    msiexec /i FOGService.msi /quiet USETRAY="0" WEBADDRESS="XX.XX.XX.XX"

### Options du Smart Installer

!!! note

    Toutes les options en \--{OPTION} peuvent également s'écrire /{OPTION}


-   \--server= Indique l'adresse du serveur. Par défaut : fogserver
-   \--webroot= Indique la racine web. Par défaut : /fog
-   -h ou -https Utiliser https pour la communication avec le serveur
-   -r ou -rootlog Placer fog.log à la racine du système de fichiers
-   -s ou \--start Démarrer automatiquement le service après l'installation.
    Linux uniquement
-   -t ou \--tray Activer l'icône FOG Tray et les notifications
-   -u ou \--uninstall Désinstaller le client
-   \--upgrade Mettre à niveau le client
-   -l= ou \--log= Indiquer où placer le journal du SmartInstaller

### Services Windows

Un client installé se compose de deux services : FOGService et FogUserService.

-   FOGService : s'exécute sous le compte LocalSystem et effectue toutes les
    tâches comme l'exécution des snapins, le changement de nom de machine, etc.
-   FogUserService : le service utilisateur s'exécute dans le contexte d'un
    utilisateur et prend en charge les fenêtres de notification et les tâches au
    niveau de l'utilisateur.

### Journalisation

Vous trouverez le journal de FOG dans `C:\Fog.log` et celui du service
utilisateur dans `C:\users\username\.fog_user.log`

### Désinstallation

Il existe plusieurs façons de désinstaller le client :

-   Désinstaller via « Programmes et fonctionnalités » ou « Applications et
    fonctionnalités »
-   Désinstaller via le MSI. Exemple :

<!-- -->
    msiexec /i FOGService.msi /quiet

-   Désinstaller à l'aide du SmartInstaller. Exemple :

<!-- -->
    SmartInstaller.exe uninstall 

## Client Linux

### Prérequis du client Linux

-   Mono : dernière version stable
-   xprintidle : cette dépendance est facultative. S'il n'est pas installé,
    AutoLogOut ne fonctionnera pas. xprintidle se contente de renvoyer le temps
    d'inactivité d'une fenêtre X ; sur un système sans interface graphique, il
    n'est donc pas nécessaire et ne doit pas être installé. Il devrait être
    disponible dans les gestionnaires de paquets standard, par exemple apt-get,
    yum ou dnf

### Installer Mono

De nombreuses distributions proposent une version obsolète de mono dans leur
gestionnaire de paquets. N'essayez donc pas de l'installer par ce biais sans les
modifications ci-dessous, ou consultez les instructions figurant sur leur site :
<https://www.mono-project.com/download/stable/#download-lin-centos>

#### Debian

    sudo apt install apt-transport-https dirmngr gnupg ca-certificates
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
    echo "deb https://download.mono-project.com/repo/debian stable-buster main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
    sudo apt update
    sudo apt install mono-complete

#### Ubuntu

    sudo apt install gnupg ca-certificates
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
    echo "deb https://download.mono-project.com/repo/ubuntu stable-bionic main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
    sudo apt update
    sudo apt install mono-complete

#### CentOS

    rpmkeys --import "http://pool.sks-keyservers.net/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"
    su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'
    yum install mono-complete

#### OpenSUSE et SLES

Vous pouvez installer mono à l'aide des fichiers SUSE One-Click :
<http://download.mono-project.com/repo/mono-complete.ymp>

#### Autres

Le client FOG peut être installé sur toute plateforme capable d'exécuter la
dernière version stable de mono. Pour l'installer :

-   Cherchez mono-complete dans votre gestionnaire de paquets. Après
    l'installation, lancez mono \--version. Assurez-vous que la version est au
    moins 4.2. Sinon, supprimez le paquet.
-   Si votre gestionnaire de paquets ne proposait qu'une ancienne version de
    mono, voir ici comment compiler mono

Si votre système dispose de systemd ou d'initd, le client sera automatiquement
configuré pour démarrer au lancement du système. Si votre système n'a ni l'un ni
l'autre, vous devrez le configurer pour exécuter au démarrage la commande de
lancement manuel ci-dessous.

Pour démarrer et arrêter le service manuellement :

    sudo /opt/fog-service/control.sh start
    sudo /opt/fog-service/control.sh stop

### Installer fog-client avec le SmartInstaller

Chaque version de serveur FOG est livrée avec son propre client FOG. Vous pouvez
télécharger le client depuis l'interface web de FOG :

-   Connectez-vous sur la machine cliente, ouvrez un navigateur et rendez-vous
    sur l'interface web de FOG.
-   En bas de l'interface web, cliquez sur le lien « FOG Client » (il n'est pas
    nécessaire de vous authentifier).
-   Sélectionnez le SmartInstaller et téléchargez-le
-   Exécutez l'installeur avec mono :

<!-- -->
    sudo mono SmartInstaller.exe

Le client s'installera dans /opt/fog-service.

Le service est automatiquement configuré pour démarrer au lancement du système.
Pour le démarrer et l'arrêter manuellement :

    sudo systemctl start FOGService
    sudo systemctl stop FOGService

### Limitations

-   FOG Tray est actuellement incompatible avec les systèmes Linux. Quel que
    soit votre choix pendant l'installation, il ne s'exécutera pas.
-   Les modules et fonctionnalités suivants ne sont pas encore pris en charge :
    -   Jonction à Active Directory
    -   PrinterManager

### Journalisation du client Linux

Le journal se trouve dans /opt/fog-service/fog.log.

### Désinstaller le client Linux

Pour désinstaller :

    sudo systemctl stop FOGService
    sudo mono SmartInstaller.exe uninstall

## Client OS X

### Prérequis du client OS X

-   Mono : utilisez la dernière version stable.

### Installer Mono

-   Si vous utilisez El Capitan, rendez-vous sur
    <http://www.mono-project.com/download/#download-mac> et téléchargez
    Mono Universal Installer
-   Sinon, rendez-vous sur
    <http://www.mono-project.com/download/#download-mac> et téléchargez
    Mono 32 bits

### Installation

Chaque version de serveur FOG est livrée avec son propre client FOG. Vous pouvez
télécharger le client depuis l'interface web de FOG :

-   Connectez-vous sur la machine cliente, ouvrez un navigateur et rendez-vous
    sur l'interface web de FOG.
-   En bas de l'interface web, cliquez sur le lien « FOG Client » (il n'est pas
    nécessaire de vous authentifier).
-   Sélectionnez le SmartInstaller.
-   Installez le SmartInstaller avec mono :

<!-- -->
    sudo mono SmartInstaller.exe

-   Redémarrez le système pour terminer l'installation.

Le service est automatiquement configuré pour démarrer au lancement du système.
Pour le démarrer et l'arrêter manuellement :

    sudo launchctl load -w /Library/LaunchDaemons/org.freeghost.daemon.plist
    sudo launchctl unload -w /Library/LaunchDaemons/org.freeghost.daemon.plist

### Limitations du client OS X

Les modules et fonctionnalités suivants ne sont pas encore pris en charge -
PrinterManager

### Journalisation sous OS X

Vous trouverez le fichier journal du client dans /opt/fog-service/fog.log

### Désinstaller le client OS X

Pour désinstaller :

    sudo launchctl unload -w /Library/LaunchDaemons/org.freeghost.daemon.plist
    sudo mono SmartInstaller.exe uninstall
