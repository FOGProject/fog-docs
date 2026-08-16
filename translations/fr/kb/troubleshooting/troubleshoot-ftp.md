---
title: Dépannage du FTP
aliases:
    - Troubleshooting FTP
description: Informations pour diagnostiquer les problèmes de FTP dans FOG
context_id: troubleshoot-ftp
tags:
    - troubleshooting
    - kb
    - ftp
    - in-progress
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/troubleshooting/troubleshoot-ftp).


# Dépannage du FTP

>[!note]
>Il semble que plus de 90 % des problèmes de FTP dans FOG soient causés par des
>identifiants incorrects ou discordants. Pour cette raison, nous vous
>recommandons de passer directement à la section
>[[#Identifiants / mots de passe]] en premier.


## Les rôles du FTP dans FOG

Son rôle principal est de déplacer et de renommer les fichiers image du dossier
/images/dev vers le dossier /images à la fin d'une capture d'image. Le FTP n'est
pas utilisé pour la capture ni le déploiement d'images, car NFS est plus rapide.
Le FTP sert également à télécharger des noyaux et à supprimer des images. Il sert
aussi à rapporter « Image Size: ON SERVER ». Il sert encore à s'assurer que
l'image que vous souhaitez déployer existe bien avant de lancer un déploiement.
C'est enfin le FTP qui est utilisé pour la réplication des images dans les
installations multi-serveurs.

Le FTP doit pouvoir lire, écrire et supprimer dans /images/dev et /images.

## Tester le FTP

### Essayer de récupérer un fichier sous Linux

Ces commandes ne sont PAS exécutées sur votre serveur FOG, mais sur une autre
machine Linux (cet exemple utilise Fedora).

*Pour expliquer ce qui se passe ci-dessous dans le bloc de code\...*

-   Créer un fichier de test contenant des données, à envoyer plus tard.
-   Démarrer ftp (il faudra peut-être l'installer d'abord).
-   Ouvrir une connexion vers le serveur FOG.
-   Fournir le nom d'utilisateur (dans Interface web → Storage Management →
    \[NomDuNœud\] → Management Username).
-   Fournir le mot de passe (dans Interface web → Storage Management →
    \[NomDuNœud\] → Management Password).
-   Se placer dans le répertoire /images.
-   Lister le contenu du répertoire.
-   Téléverser le fichier.
-   Lister le contenu du répertoire pour vérifier.
-   Télécharger le fichier.
-   Supprimer le fichier.
-   Quitter ftp.

<!-- -->
    [administrator@D620 ~]$ echo 'some text here to send later' > test.txt
    [administrator@D620 ~]$ ftp
    ftp> open 10.0.0.3
    Connected to 10.0.0.3 (10.0.0.3).
    220 (vsFTPd 3.0.2)
    Name (10.0.0.3:administrator): fog
    331 Please specify the password.
    Password:
    230 Login successful.
    Remote system type is UNIX.
    Using binary mode to transfer files.
    ftp> cd /images
    250 Directory successfully changed.
    ftp> ls
    227 Entering Passive Mode (10,0,0,3,204,176).
    150 Here comes the directory listing.
    drwxrwxrwx    2 0        0            4096 Apr 10 03:38 Optiplex745WinXPconfiguredApril2015
    drwxrwxrwx    2 0        0            4096 Apr 10 03:39 dev
    drwxrwxrwx    2 0        0           16384 Apr 07 01:58 lost+found
    drwxrwxrwx    2 0        0            4096 Apr 08 00:59 postdownloadscripts
    226 Directory send OK.
    ftp> put test.txt
    local: test.txt remote: test.txt
    227 Entering Passive Mode (10,0,0,3,132,59).
    150 Ok to send data.
    226 Transfer complete.
    29 bytes sent in 0.000114 secs (254.39 Kbytes/sec)
    ftp> ls
    227 Entering Passive Mode (10,0,0,3,118,48).
    150 Here comes the directory listing.
    drwxrwxrwx    2 0        0            4096 Apr 10 03:38 Optiplex745WinXPconfiguredApril2015
    drwxrwxrwx    2 0        0            4096 Apr 10 03:39 dev
    drwxrwxrwx    2 0        0           16384 Apr 07 01:58 lost+found
    drwxrwxrwx    2 0        0            4096 Apr 08 00:59 postdownloadscripts
    -rw-r--r--    1 1000     1000           29 Apr 30 00:29 test.txt
    226 Directory send OK.
    ftp> get test.txt
    local: test.txt remote: test.txt
    227 Entering Passive Mode (10,0,0,3,190,81).
    150 Opening BINARY mode data connection for test.txt (29 bytes).
    226 Transfer complete.
    29 bytes received in 0.000529 secs (54.82 Kbytes/sec)
    ftp> delete test.txt
    250 Delete operation successful.
    ftp> exit
    421 Timeout.
    [administrator@D620 ~]$

### Essayer de récupérer un fichier sous Windows

*Explication du code ci-dessous :*

-   Créer un fichier contenant des données
-   Démarrer FTP
-   Ouvrir une connexion vers le serveur FOG
-   Saisir le nom d'utilisateur (dans Interface web → Storage Management →
    \[NomDuNœud\] → Management Username).
-   Saisir le mot de passe (dans Interface web → Storage Management →
    \[NomDuNœud\] → Management Password).
-   Téléverser le fichier
-   Lister le répertoire pour vérifier
-   Télécharger le fichier
-   Fermer la connexion
-   Quitter FTP.

<!-- -->
    c:\SomeFolder>echo This is a bit of text to throw into a file > text.txt

    c:\SomeFolder>ftp
    ftp> open 10.0.0.3
    Connected to 10.0.0.3.
    220 (vsFTPd 3.0.2)
    User (10.0.0.3:(none)): fog
    331 Please specify the password.
    Password:
    230 Login successful.
    ftp> put text.txt
    200 PORT command successful. Consider using PASV.
    150 Ok to send data.
    226 Transfer complete.
    ftp: 45 bytes sent in 0.00Seconds 22.50Kbytes/sec.
    ftp> ls
    200 PORT command successful. Consider using PASV.
    150 Here comes the directory listing.
    text.txt
    226 Directory send OK.
    ftp: 10 bytes received in 0.00Seconds 10.00Kbytes/sec.
    ftp> get text.txt
    200 PORT command successful. Consider using PASV.
    150 Opening BINARY mode data connection for text.txt (45 bytes).
    226 Transfer complete.
    ftp: 45 bytes received in 0.00Seconds 45000.00Kbytes/sec.
    ftp> close
    221 Goodbye.
    ftp> quit

    c:\SomeFolder>

## Service FTP

### Fedora 20/21/22/23

-   Vérifiez l'état du FTP avec

<!-- -->
    systemctl status vsftpd.service

(Il doit être actif et en vert, sans erreur, et activé)

-   Arrêter, démarrer, désactiver et activer le service FTP.

<!-- -->
    systemctl stop vsftpd.service
    systemctl start vsftpd.service
    systemctl disable vsftpd.service
    systemctl enable vsftpd.service

-   Vérifiez son bon fonctionnement à l'aide des instructions de test situées en
    haut de cet article ; par ailleurs, si vous ouvrez un navigateur web et allez
    sur

<!-- -->
    ftp://x.x.x.x

-   Utilisez fog / votre-mot-de-passe-du-compte-fog comme identifiants
-   Vous devriez voir « Index of / »

### Ubuntu

-   Redémarrer le service FTP.

<!-- -->
    service vsftpd restart

-   L'activation et la désactivation ne sont pas disponibles, ce service faisant
    partie des scripts Upstart.
-   Vérifiez son bon fonctionnement à l'aide des instructions de test situées en
    haut de cet article ; par ailleurs, si vous ouvrez un navigateur web et allez
    sur

<!-- -->
    ftp://x.x.x.x

-   Utilisez fog / votre-mot-de-passe-du-compte-fog comme identifiants (depuis
    la version 1.5.6, le nom d'utilisateur par défaut est « fogproject »)
-   Vous devriez voir « Index of / »

## Fichier de configuration du FTP

### Sous Fedora 20/21/22/23

Emplacement :

    /etc/vsftpd/vsftpd.conf

Pour afficher le fichier :

    cat /etc/vsftpd/vsftpd.conf

Il devrait beaucoup ressembler à ceci :

    anonymous_enable=NO
    local_enable=YES
    write_enable=YES
    local_umask=022
    dirmessage_enable=YES
    xferlog_enable=YES
    connect_from_port_20=YES
    xferlog_std_format=YES
    listen=YES
    pam_service_name=vsftpd
    userlist_enable=NO
    tcp_wrappers=YES
    seccomp_sandbox=NO

Pour le modifier :

    vi /etc/vsftpd/vsftpd.conf

Explication des réglages :

    man vsftpd.conf

### Sous Ubuntu

Emplacement :

    /etc/vsftpd.conf

Pour afficher le fichier :

    cat /etc/vsftpd.conf

Il devrait beaucoup ressembler à ceci :

    anonymous_enable=NO
    local_enable=YES
    write_enable=YES
    local_umask=022
    dirmessage_enable=YES
    xferlog_enable=YES
    connect_from_port_20=YES
    xferlog_std_format=YES
    listen=YES
    pam_service_name=vsftpd
    userlist_enable=NO
    tcp_wrappers=YES
    seccomp_sandbox=NO

Pour le modifier :

    vi /etc/vsftpd.conf

Explication des réglages :

    man vsftpd

[[vi|Instructions d'utilisation de l'éditeur de texte vi]]

## Désactiver et vérifier le pare-feu

### Pour Fedora 20/21/22/23

**Désactiver/arrêter le pare-feu**

    systemctl disable firewalld.service
    systemctl stop firewalld.service

Réversible avec « start » et « enable ». **Vérifier le pare-feu sous Fedora
20/21/22/23**

    systemctl status firewalld.service

### Fedora 16

Ajoutez /bin/bash à /etc/shells, car l'installation de vsftpd par yum ne le fait
pas correctement, ce qui provoque un message d'expiration du tftp

### Debian/Ubuntu

Vérifiez l'état du pare-feu :

    sudo iptables -L

S'il est désactivé, la sortie devrait ressembler à ceci :

    Chain INPUT (policy ACCEPT)
    target prot opt source destination

    Chain FORWARD (policy ACCEPT)
    target prot opt source destination

    Chain OUTPUT (policy ACCEPT)
    target prot opt source destination

**Désactiver le pare-feu d'Ubuntu**

    sudo ufw disable

**Désactiver le pare-feu de Debian**

    iptables -F
    iptables -X
    iptables -t nat -F
    iptables -t nat -X
    iptables -t mangle -F
    iptables -t mangle -X
    iptables -P INPUT ACCEPT
    iptables -P OUTPUT ACCEPT
    iptables -P FORWARD ACCEPT

Autres réglages Debian :

    /etc/hosts.deny

Le réglage suivant, dans le fichier ci-dessus, refusera le trafic de toute source
autre que locale :

    ALL:ALL EXCEPT 127.0.0.1:DENY

Commentez cette ligne ainsi :

    # ALL:ALL EXCEPT 127.0.0.1:DENY

### Windows 7

Démarrer → Panneau de configuration → Affichage par « Petites icônes » →
Pare-feu Windows → Activer ou désactiver le Pare-feu Windows (désactivez les
trois.)

### Configurer le pare-feu sous Linux

Pour régler le pare-feu de Linux afin qu'il n'autorise que le strict nécessaire,
voir l'[article sur la sécurité de FOG](fog_security#FOG Security)

## Identifiants / mots de passe

Il existe plusieurs endroits où tous les identifiants (sur une installation
standard) doivent correspondre exactement.

-   Il existe plusieurs endroits où tous les identifiants (sur une installation
    standard) doivent correspondre exactement.
-   Interface web → Storage Management → \[Votre nœud de stockage\] →
    Management Username et Management Password
-   Interface web → Configuration FOG → Paramètres de FOG → TFTP Server
 → FOG_TFTP_FTP_USERNAME et FOG_TFTP_FTP_PASSWORD
-   Le mot de passe de l'utilisateur local « fogproject » sur le serveur FOG
    Linux
-   Fichier serveur : /opt/fog/.fogsettings → password (pour les versions FOG
    Trunk 1.3.0 et supérieures)
-   Fichier serveur : /opt/fog/.fogsettings → username (pour les versions FOG
    Trunk 1.3.0 et supérieures)

Tous doivent correspondre (là encore, sur une installation standard).

Pour changer le mot de passe de l'utilisateur local fog : :

    sudo passwd fog

Pour modifier /opt/fog/.fogsettings : :

    vi /opt/fog/.fogsettings

[[vi|Instructions d'utilisation de l'éditeur de texte vi]]

!!! note

    Pour les utilisateurs de FOG Trunk / FOG 1.3.0, si le champ password du
    fichier /opt/fog/.fogsettings est mal renseigné, chaque nouvelle exécution
    de l'installeur FOG définira le mot de passe de l'utilisateur local fog sur
    ce mot de passe incorrect. Il est important de renseigner correctement le
    mot de passe dans tous les emplacements listés ci-dessus.
