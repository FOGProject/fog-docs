---
title: Installer le client FOG
aliases:
    - Install Fog Client
description: Décrit l'installation du client FOG
context_id: install-fog-client
tags:
    - install
    - client
    - service
    - fog-service
    - setup
    - silent-install
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/client/install-fog-client).

# Installer le client FOG

Le client FOG est un agent qui s'exécute sur les machines que vous gérez avec
FOG. Il permet d'effectuer diverses tâches : gérer les imprimantes, changer le
nom de machine et rejoindre Active Directory (pour les machines Windows), ou
installer des logiciels via les « snapins ».

Toutes ces tâches sont pilotées de façon centralisée depuis l'interface web de
FOG. Le client FOG interroge périodiquement le serveur FOG pour savoir si des
tâches doivent être effectuées et, le cas échéant, les exécute.

Ce guide a pour but de vous montrer comment installer le client FOG, enregistrer
la machine sur le serveur FOG (si ce n'est pas déjà fait lors du déploiement de
l'image) et faire exécuter au client quelques tâches depuis l'interface web de
FOG.

## Prérequis

Nous partons du principe que vous disposez d'un serveur FOG en fonctionnement,
installé conformément aux instructions données plus haut dans ce manuel.

La machine sur laquelle vous installez le client FOG est une machine Windows 10.


> [!Info]
> -   .NET Framework version 4.0 ou supérieure (remarque : le profil client de .NET 4 ne fonctionnera PAS)
> -   Vous pouvez télécharger le framework ici :
>    [Microsoft .NET Framework 4.5.1 (Offline Installer) for Windows Vista SP2, Windows 7 SP1, Windows 8, Windows Server 2008 SP2 Windows Server 2008 R2 SP1 and Windows Server 2012](https://www.microsoft.com/en-us/download/details.aspx?id=40779)
>  -   Windows 10 est livré avec une version de .NET qui fonctionnera.

## Installation du client FOG

Voici les étapes pour installer le client sur une machine.

### Télécharger le client FOG

-   Connectez-vous à la machine cliente, ouvrez un navigateur et rendez-vous
    sur l'interface web de FOG.
-   En bas de l'interface web, cliquez sur le lien « FOG Client » (il n'est pas
    nécessaire de se connecter).
-   Choisissez votre installateur.

#### Installateur MSI

> -   Cliquez sur le lien « MSI \-- Network Installer » pour exécuter le paquet
>     MSI (utilisable également avec le déploiement de logiciels par GPO et
>     d'autres installations silencieuses).
> -   L'URL de téléchargement est (où `fogserver` est le nom d'hôte de votre serveur FOG)
>     `http://fogserver/fog/client/download.php?newclient`

#### Smart Installer

> -   Cliquez sur le lien Smart Installer pour télécharger et exécuter le smart
>     installer. Il s'agit d'une installation multiplateforme qui détecte votre
>     système d'exploitation.
> -   L'URL de téléchargement est (où `fogserver` est le nom de votre serveur FOG local)
>     `http://fogserver/fog/client/download.php?smartinstaller`

### Lancer l'installateur

> [!info]
> Les étapes suivantes correspondent à l'assistant de l'installateur MSI. L'assistant du Smart Installer est similaire.


> [!note]
> Une fenêtre « Windows a protégé votre ordinateur » peut apparaître. Dans ce cas, vous devez convaincre Windows que cet installateur peut être exécuté sans risque. Cliquez sur « Informations complémentaires » puis sur « Exécuter quand même ».

-   Sur l'écran d'accueil, cliquez sur « Suivant ».
-   Acceptez les termes du contrat de licence (il s'agit de la licence GPL,
    alors pourquoi pas) et cliquez sur « Suivant ».

-   Renseignez les champs obligatoires :
    -   Server Address : saisissez le nom d'hôte ou l'adresse IP du serveur
        FOG.
    -   Web Root : laissez la valeur /fog.
    -   Laissez les autres options telles quelles.
    -   Cliquez sur « Suivant ».
    -   Laissez le dossier de destination tel quel et cliquez sur « Suivant ».
-   Cliquez sur « Installer » et répondez « Oui » à l'invite du contrôle de
    compte d'utilisateur.
-   Une fois l'assistant terminé, cliquez sur « Terminer ».

Le client FOG est maintenant installé. Une nouvelle icône devrait apparaître
dans la barre des tâches :

Cette icône indique la version du client FOG et sert à gérer les notifications
destinées à l'utilisateur final.

Au premier démarrage du service client FOG sur une machine, celui-ci crée un
jeu de clés de chiffrement puis tente de s'enregistrer auprès du serveur FOG.

Cela peut prendre un certain temps, car le type de démarrage du service client
FOG est réglé sur « Automatique (début différé) ». Vous pouvez démarrer le
client FOG manuellement juste après l'installation ou redémarrer la machine.

### Problème d'installation

Si les choses tournent mal et que le programme d'installation n'arrive pas à
installer le logiciel fog-client sur votre ordinateur, consultez le fichier
journal `C:\Windows\Temp\FOGService.install.log` pour en savoir plus sur la
cause de l'échec.

## Approuver la machine

-   Lancez un navigateur, allez sur l'interface web de FOG et connectez-vous.
-   Allez dans « Gestion des machines » → « List all Hosts » et cliquez sur la
    machine sur laquelle vous venez d'installer le client FOG.

Si le système Windows n'a pas été déployé avec FOG, le client FOG n'est pas
encore enregistré auprès de FOG et n'est pas approuvé par le serveur FOG. Nous
devons approuver cette machine manuellement :

-   Cliquez sur « Approve this host ? » (approuver cette machine ?).

Si le système Windows a été déployé avec FOG, la machine est déjà présente dans
FOG puisque nous l'avons enregistrée lors du déploiement de l'image. Le client
FOG est alors considéré comme « de confiance » par le serveur FOG et sera déjà
approuvé.

Une machine approuvée se présente ainsi :

Le client FOG peut désormais exécuter les tâches que nous lui attribuons dans
l'interface web de FOG.

## Installation silencieuse du client FOG

Si vous souhaitez mettre en place une installation silencieuse pour déployer le
client FOG, voici un exemple de script PowerShell qui le fait pour vous.

>[!note]
>Ce script suppose que votre serveur FOG est accessible sous le nom par défaut `fogserver`, qui peut être un nom d'hôte ou un alias DNS.

``` powershell
#download the client installer to C:\fogtemp\fog.msi
$webclient = New-Object System.Net.WebClient
$webClient.downloadfile("http://fogserver/fog/client/download.php?newclient","C:\fogtemp\fog.msi")
#run the installer with msiexec and pass the command line args of /quiet /qn /norestart
Start-Process -FilePath msiexec -ArgumentList @('/i','C:\fogtemp\fog,msi','/quiet','/qn','/norestart') -NoNewWindow -Wait;
```

### Options du MSI

| Option     | Valeurs                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------- |
| USETRAY    | vaut « 1 » par défaut ; si « 0 », l'icône de la zone de notification est masquée                     |
| HTTPS      | vaut « 0 » par défaut ; si « 1 », le client utilise HTTPS (non recommandé)                           |
| WEBADDRESS | vaut « fogserver » par défaut, c'est l'IP ou le nom DNS de votre serveur                             |
| WEBROOT    | vaut « /fog » par défaut                                                                             |
| ROOTLOG    | vaut « 1 » par défaut ; si « 0 », fog.log se trouvera dans `%PROGRAMFILES%\FOG\fog.log`, sinon `C:\fog.log` |

Référence :
<https://forums.fogproject.org/topic/6222/msi-silent-install-without-tray-icon/2>

### Options du Smart Installer

> [!tip]
> Toutes les options en \--{OPTION} peuvent aussi s'écrire /{OPTION}.

#### Options universelles

| Option         | Description                                         |
| -------------- |:--------------------------------------------------- |
| --server      | Indique l'adresse du serveur. Par défaut : fogserver |
| --webroot     | Indique la racine web. Par défaut : /fog            |
| -h ou -https   | Utiliser https pour les communications avec le serveur |
| -r ou -rootlog | Placer fog.log à la racine du système de fichiers    |
| -s ou --start | Démarrer automatiquement le service après l'installation. |

#### Options propres à Linux

| Option             | Valeur                                      |
| ------------------ |:------------------------------------------- |
| -t ou --tray      | Active l'icône FOG et les notifications     |
| -u ou --uninstall | Désinstalle le client                       |
| --upgrade         | Met à jour le client                        |
| -l= ou --log=     | Indique où placer le journal du SmartInstaller |

Voir également <https://news.fogproject.org/fog-client-v0-11-0-released-2/>

## Informations complémentaires

Deux services et deux fichiers journaux s'exécutent sous Windows.

### Services Windows

FogService et FogUserService. Le service utilisateur s'exécute dans le contexte
d'un utilisateur et prend en charge les fenêtres de notification et les tâches
au niveau utilisateur. La plupart des opérations sont réalisées par FogService,
qui s'exécute sous le compte système.

### Journaux

Vous trouverez le journal de FOG dans `C:\Fog.log` et celui du service
utilisateur dans `C:\users\username\.fog_user.log`.
