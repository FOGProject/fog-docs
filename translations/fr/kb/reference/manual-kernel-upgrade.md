---
title: Mettre à niveau manuellement le noyau FOS
aliases:
    - Manually Upgrade FOS Kernel
description: page d'index de manual-kernel-upgrade
context_id: manual-kernel-upgrade
tags:
    - in-progress
    - kernel
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/manual-kernel-upgrade).

# Mettre à niveau manuellement le noyau FOS

Le noyau que le serveur FOG utilise pour imager les clients peut être
obsolète et poser des problèmes à certains ordinateurs dotés de cartes
réseau plus récentes. Dans l'idéal, vous utilisez l'outil intégré de mise à
jour du noyau ; mais si vous rencontrez des difficultés avec cet outil, vous
pouvez procéder à une mise à niveau manuelle. Voici la méthode pour mettre à
jour manuellement les noyaux.

## Tests

Charger manuellement différentes versions de noyau peut être bien pratique
pour faire des essais avec les divers matériels dont vous disposez. Passer
directement à un nouveau noyau peut — même si c'est peu probable — poser
problème à certains appareils. Vous pouvez donc plutôt affecter un noyau
différent à une machine, voire à quelques-unes, via le paramètre de noyau
dans les réglages de la machine : [[hosts#Noyau]]

## Télécharger les noyaux

Pour commencer, assurez-vous que les fichiers `bzImage` et `bzImage32` se
trouvent bien dans `/var/www/html/fog/service/ipxe/`

En root ou avec sudo, faites un ls pour regarder. :

    ls -la /var/www/html/fog/service/ipxe

*Sur certaines distributions (surtout les plus anciennes), le chemin racine
est \`\`/var/www/fog\...\`\` ; c'est aussi un lien symbolique sur certaines
distributions (parfois créé par l'installeur de FOG). La plupart des
distributions utilisent ce chemin racine pour le site httpd/apache de FOG
\`\`/var/www/html/fog\...\`\`*

Après avoir confirmé que les fichiers existent, créez au même endroit un
dossier nommé **Backup** et déplacez-y les fichiers bzImage actuels. Cela
vous sera utile si vous devez rapidement revenir sur vos modifications.

Téléchargez ensuite les fichiers de noyau plus récents depuis
**https://github.com/FOGProject/fos/releases**

Utilisez un navigateur web sur un autre ordinateur, ou wget/curl sur le
serveur FOG si vous savez vous y prendre.

Veillez à choisir le noyau portant le numéro le plus élevé que vous
trouviez, avec la date la plus récente. Assurez-vous également de
télécharger **les deux** noyaux : le 32 bits (`bzImage32`) et le 64 bits
(`bzImage`).

### Renommer les fichiers

Si vous ne souhaitez pas écraser vos fichiers de noyau actuels, mieux vaut
renommer les nouveaux avec un nom de fichier différent. Vous pouvez ainsi
disposer de plusieurs versions. Vous avez peut-être par exemple du matériel
capricieux qui ne fonctionne pas correctement avec le dernier noyau que vous
souhaitez utiliser pour tous vos autres appareils.

### Déplacer les fichiers

L'étape suivante consiste à déplacer ces fichiers vers l'emplacement indiqué
au début ; il vous faudra peut-être un accès root ou sudo pour les y placer.
Vous pouvez utiliser la commande `mv` sur le serveur ou les transférer par
FTP. Pour rappel, l'emplacement est : :

    /var/www/html/fog/service/ipxe

## Permissions

Ensuite, en root ou avec sudo, saisissez : :

    ls -la /var/www/html/fog/service/ipxe

Notez le propriétaire indiqué pour les fichiers de ce répertoire. Dans mon
cas, le propriétaire est **root** : j'ai donc changé le propriétaire et
aligné les permissions sur celles des autres fichiers.

changer le propriétaire des nouveaux noyaux : :

    chown apache:apache /var/www/html/fog/service/ipxe/bzImage*

Pour vérifier, relancez la commande de liste en root/sudo et assurez-vous
que toutes les permissions et tous les propriétaires sont identiques : :

    ls -la /var/www/html/fog/service/ipxe

## Vérification de la version

Pour vérifier ou consulter la version de vos binaires de noyau, vous pouvez
simplement utiliser la commande `file` sur la plupart des systèmes Linux
modernes : :

    file /var/www/html/fog/service/ipxe/bzImage*
