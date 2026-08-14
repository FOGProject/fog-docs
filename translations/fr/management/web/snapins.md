---
title: Gestion des Snapins
aliases:
    - Snapin Management
description: page d'index des snapins
context_id: snapins
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - snapins
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/snapins).

# Gestion des Snapins

## Vue d'ensemble

-   Le service FOG est capable d'installer des snapins sur les clients. Un snapin peut être n'importe quoi, d'une application complète comme Microsoft Office à des clés de registre ou des icônes de bureau. Les snapins peuvent même servir à désinstaller des applications ou à supprimer des fichiers indésirables. Du point de vue de l'utilisateur final, il ne remarquera même pas qu'un snapin est en cours d'installation avant qu'elle ne soit terminée. À ce moment-là, un message l'informera qu'une nouvelle application a été installée sur son ordinateur. Les snapins peuvent être au format MSI (0.17) ou EXE, et peuvent être créés avec n'importe quel outil de création de snapin comme InstallRite, ou à partir de fichiers MSI déjà packagés (0.17). Vous pouvez également envoyer à l'ordinateur des commandes comprenant des scripts .vbs, des .cmd (commandes) et des .bat (scripts de traitement par lots).

-   Les codes de retour d'un snapin sont définis par le programme installé.

  

## Créer un snapin / Vue d'ensemble

FOG ne fournit pas d'outil de création de snapins, mais vous permet à la place d'envoyer des fichiers et de les exécuter sur les ordinateurs distants. Il est fortement recommandé d'envoyer l'installeur d'origine sur l'ordinateur plutôt que d'utiliser un programme tel qu'InstallRite.

Si vous n'avez jamais installé de logiciel en mode silencieux sur un ordinateur, ni créé de fichier de réponses pour un programme, consultez le site Appdeploy [Lien](http://www.appdeploy.com/articles/) Ce site regorge d'informations sur la façon d'installer un logiciel à distance sur un ordinateur.

### Créer un snapin pour les applications volumineuses avec SFX Maker

Certaines applications volumineuses telles que Microsoft Office et les produits Adobe (Acrobat / Creative Suite) nécessitent plusieurs fichiers pour s'installer correctement. Si vous avez une application qui n'est pas un simple .exe, utilisez SFX Maker. Cet outil est gratuit pour un usage non commercial, et la plupart des programmes relèvent de la GPL. [Site web de SFX Maker](http://www.isoft-online.com/)

Pour savoir comment utiliser ce logiciel, reportez-vous aux vidéos YouTube ci-dessous.

[Installation d'Office 2003](http://www.youtube.com/watch?v=ZSMJLnRjn94) [Installation d'Office 2007](http://www.youtube.com/watch?v=Qzc1Q9NW_cE)

SFX Maker prend un dossier entier et l'encapsule, ou le « replie », en un unique .exe qui se « déplie » ensuite dans son état d'origine et lance un fichier ou une commande.

### Créer un snapin avec InstallRite

Si, pour une raison quelconque, vous souhaitez utiliser InstallRite, sachez qu'il comporte des problèmes et des limitations (il n'est pas compatible avec tous les systèmes d'exploitation Windows et peut causer des problèmes sur l'ordinateur vers lequel il est envoyé). Voici un exemple de construction d'un paquet avec ce logiciel

Dans cet exemple, nous utiliserons InstallRite d'Epsilon Squared, téléchargeable depuis [http://www.epsilonsquared.com/installrite.htm](http://www.epsilonsquared.com/installrite.htm). Cette application empaquettera votre snapin sous forme de fichier exe qui sera téléversé sur le serveur FOG.

1.  Pour exécuter InstallRite, rendez-vous dans c:\program files\Epsilon Squared\InstallRite\InstallRite.exe
2.  Cliquez sur « Install new software and create an InstallKit »
3.  Sur l'écran Configure, cliquez sur Next.
4.  Sur l'écran Snapshot, cliquez sur Next pour créer un nouvel instantané du système.
5.  Sur l'écran suivant, cliquez sur le bouton Browse pour sélectionner l'application que vous souhaitez installer, puis cliquez sur Next.
6.  Une fois l'installation terminée, InstallRite revient au premier plan : cliquez sur le bouton Next. InstallRite analysera de nouveau votre système.
7.  Saisissez un nom pour votre snapin.
8.  Cliquez sur « Build Install Kit »
9.  Sélectionnez « Quiet Installation Mode », Never reboot, even if needed, et « Never prompt the user and only overwrite older files »
10.  Cliquez sur OK et votre snapin sera construit.

## Préparer le serveur FOG

Si votre snapin dépasse 2 Mo, vous devrez apporter deux modifications au serveur FOG pour autoriser les téléversements de plus de 2 Mo.

Voir aussi : [Troubleshoot Web Interface](https://wiki.fogproject.org/wiki/index.php?title=Troubleshoot_Web_Interface "Troubleshoot Web Interface")

### Fedora

1.  Sur le serveur FOG, cliquez sur Applications -> Accessoires -> Éditeur de texte.
2.  Choisissez Ouvrir et rendez-vous dans « /etc/php.ini »
3.  Remplacez UPLOAD_MAX_FILESIZE par 1900MB (sur un système d'exploitation 32 bits, ne dépassez pas 2 Go)
4.  Remplacez POST_MAX_SIZE par la même valeur.
5.  Enregistrez et fermez l'éditeur de texte.
6.  Cliquez sur Applications -> Outils système -> Terminal et saisissez « service httpd restart »

### Ubuntu

1.  sudo gedit /etc/php5/apache2/php.ini
2.  Modifiez
    1.  memory_limit = 1900M
    2.  post_max_size=1900M
    3.  upload_max_filesize=1900M
3.  Enregistrez les modifications
4.  sudo /etc/init.d/apache2 restart

  

### VMWare

1.  sudo vim /etc/php5/apache2/php.ini
2.  Modifiez les lignes suivantes dans le document (voir ci-dessous pour de l'aide sur l'utilisation de VIM)
    1.  memory_limit = 1900M
    2.  post_max_size=1900M
    3.  upload_max_filesize=1900M

  

-   Pour modifier du contenu dans vim, vous devez appuyer sur la touche **« I »** de votre clavier afin de passer en mode insertion.
-   Appuyer sur la touche **Échap** vous fait sortir du mode insertion.
-   Une fois sorti du mode insertion, saisissez **:w** puis **Entrée** pour enregistrer le fichier
-   Redémarrez FOG une fois le fichier enregistré

## Téléverser le snapin

[Tutoriel vidéo](http://freeghost.sourceforge.net/videotutorials/CreateSnapin.swf.html)

1.  Dans le portail de gestion FOG, cliquez sur l'icône Snapin (les pièces de puzzle).
2.  Dans le menu de gauche, cliquez sur le bouton New Snapin.
3.  Saisissez un nom et une description de snapin.
4.  Parcourez vos fichiers jusqu'au fichier de snapin que vous souhaitez téléverser.
5.  Si vous voulez que l'ordinateur redémarre après l'installation du snapin, cochez « Reboot after install »
6.  Cliquez sur « Add »

  

Depuis la version 0.17, FOG prend en charge l'utilisation de fichiers msi classiques comme fichiers de snapin.

Si le fichier de snapin est un fichier msi, vous devez effectuer ces étapes supplémentaires :

1.  Définissez **Snapin Run With:** sur le chemin de msiexec.exe (par exemple : c:\windows\system32\msiexec.exe)
2.  Définissez **Snapin Run With Arguments:** sur **/i**
3.  Définissez **Snapin Arguments:** sur **/qn**

Si le fichier de snapin est un script .vb, vous devez effectuer ces étapes supplémentaires :

1.  Définissez **Snapin Run With:** sur le chemin de cscript.exe (par exemple : c:\windows\system32\cscript.exe)

  

**Documentation sur la liste des snapins pris en charge et les arguments de ligne de commande** 
<!-- (http://www.fogproject.org/wiki/index.php?title=Supported_Snapin%27s_and_Command_Line_Switches)]  -->
Il existe BEAUCOUP d'autres applications prises en charge qui peuvent être installées via des arguments de ligne de commande. Vous aurez peut-être plus de succès en les installant directement via .EXE / .MSI, ou en les scriptant via .VBS. Pour en savoir plus, consultez les forums --[Ssx4life](https://wiki.fogproject.org/wiki/index.php?title=User:Ssx4life&action=edit&redlink=1 "User:Ssx4life (page does not exist)") 09:04, 8 octobre 2009 (MST)

## Types de snapins : Normal ou Paquet Snapin

Lorsque vous créez un snapin, le champ **Snapin Type** propose deux choix :

-   **Normal** exécute un unique fichier téléversé (un installeur, un script ou une commande).
-   **Paquet Snapin** décompresse sur le client une archive téléversée, puis exécute un fichier situé *à l'intérieur* de celle-ci. Utilisez cette option lorsque votre installation nécessite plus d'un fichier (par exemple un exécutable d'installation accompagné de sa configuration ou de fichiers MST).

Pour un Paquet Snapin, utilisez le jeton `[FOG_SNAPIN_PATH]` dans les champs d'arguments afin de désigner le dossier où l'archive est décompressée sur le client. FOG remplace ce jeton par le véritable chemin d'extraction au moment de l'exécution, de sorte que votre commande peut référencer les fichiers décompressés quel que soit l'endroit où ils atterrissent.

La liste déroulante facultative **Template** du formulaire de création n'est qu'une commodité : choisissez un type (MSI, PowerShell, etc.) pour préremplir les champs de commande avec un point de départ pertinent, puis modifiez-les selon vos besoins. Cela ne change rien à ce qui est enregistré — uniquement aux valeurs initiales des champs.

## Associer le snapin à des machines

Pour qu'un snapin soit déployé, il doit être associé à une machine. Pour cela, procédez ainsi :

1.  Dans le portail de gestion FOG, cliquez sur l'icône Machines.
2.  Recherchez et sélectionnez une machine, puis cliquez sur le bouton d'édition.
3.  Faites défiler jusqu'à la section des snapins.
4.  Sélectionnez dans la liste déroulante le snapin que vous venez de créer et cliquez sur le bouton « Add Snapin ».

Lors de la prochaine imagerie de l'ordinateur, le service FOG tentera d'installer ce snapin. En cas de problème, consultez le fichier journal de FOG situé dans c:\fog.log sur le PC client.
