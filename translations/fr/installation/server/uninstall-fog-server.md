---
title: Désinstaller le serveur FOG
aliases:
    - Uninstalling the Fog server
    - Uninstall Fog
description: Comment retirer FOG d'un serveur, et ce que cela supprime ou non
context_id: uninstall-fog-server
tags:
    - installation
    - fog-server
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/server/uninstall-fog-server).

# Désinstaller le serveur FOG

L'installateur de FOG sait se retirer lui-même :

    cd fogproject/bin
    ./installfog.sh --uninstall

La règle directrice est : **retirer ce que FOG a installé, conserver ce que FOG
a stocké**. Tout ce que FOG a déposé sur le serveur — ses propres fichiers, ses
services, sa configuration — est supprimé. Vos données ne le sont pas, sauf
demande explicite de votre part.

Autrement dit, une désinstallation est normalement réversible : réinstallez
par-dessus ce qui reste et FOG retrouve vos machines, vos images et vos
snapins. C'est aussi une façon raisonnable de reconstruire un serveur devenu
instable sans rien perdre.

!!! warning "La désinstallation n'est pas réversible dans tous les cas"
    Les options `--purge-*` ci-dessous *sont* destructrices et il n'existe
    aucun moyen d'annuler. Lisez [Ce que les options de purge suppriment](#ce-que-les-options-de-purge-suppriment)
    avant de les utiliser, en particulier `--purge-ssl`.

## Voir d'abord ce qui serait fait

`--dry-run` affiche le plan complet et se termine sans rien modifier :

    ./installfog.sh --uninstall --dry-run

Lancez d'abord cette commande. La sortie liste chaque chemin qui serait
supprimé, chaque fichier de configuration qui serait restauré et le sort de
chaque partie de vos données.

## Ce qui est toujours supprimé

| | |
|---|---|
| Services | Les huit démons FOG — arrêtés, désactivés, et leurs fichiers d'unité supprimés |
| Fichiers du programme | `/opt/fog/service`, `/opt/fog/log`, `/opt/fog/cache`, `/opt/fog/reporting`, `/opt/fog/php.loc`, `/opt/fog/.fogsettings` |
| Fichiers web | Le répertoire web de FOG sous votre racine de documents, et le lien symbolique `fog` à côté |
| Entrées système | `/etc/fog`, le lien symbolique `/var/log/fog`, `/etc/cron.d/fog_reporting`, `/etc/nfs.conf.d/fog-nfs.conf` |
| Serveur web | L'hôte virtuel propre à FOG (`fog.conf` ou `001-fog.conf`) |
| TFTP | Le contenu de la racine TFTP — binaires PXE et menus de démarrage |

Si votre installation de FOG se trouve ailleurs que dans `/opt/fog`, le
désinstallateur la localise de la même façon que l'installateur, via
`/etc/fog/fog.conf`. Vous pouvez aussi la lui indiquer explicitement avec
`--fogprogramdir`.

## Ce qui est toujours conservé

**Les paquets ne sont jamais supprimés.** Le serveur web, le serveur de base de
données, le serveur NFS et PHP sont couramment partagés avec d'autres services
sur la même machine, et l'installateur ne consigne pas lesquels il a installés
plutôt que trouvés déjà présents. Leur suppression vous est laissée.

Vos données sont conservées par défaut :

- la base de données FOG
- vos images
- vos snapins
- l'autorité de certification SSL
- le compte Linux `fogproject`

## Fichiers de configuration remplacés par FOG

FOG n'ajoute pas de lignes à `/etc/exports`, `vsftpd.conf`, `dhcpd.conf` ni (sur
certaines distributions) à la configuration du serveur web. Il déplace le
fichier existant sous le nom `<fichier>.<horodatage>` et écrit sa propre
version.

À la désinstallation, ces fichiers sont restaurés depuis la sauvegarde la plus
**ancienne**, qui est le véritable original antérieur à FOG — les plus récentes
ne sont que les versions précédentes de FOG lui-même. La version utilisée par
FOG est conservée sous le nom `<fichier>.fog-uninstall.<horodatage>` plutôt que
supprimée : rien n'est perdu.

!!! note "À vérifier ensuite"
    Si vous avez modifié vous-même l'un de ces fichiers après avoir installé
    FOG, vos modifications se trouvent dans la copie `.fog-uninstall.`, pas dans
    le fichier restauré. Vérifiez-les avant de redémarrer le service concerné.

## Ce que les options de purge suppriment

Elles sont facultatives et définitives.

| Option | Supprime |
|---|---|
| `--purge-db` | Supprime la base de données FOG — machines, images, snapins, utilisateurs, historique des tâches |
| `--purge-images` | Supprime votre stockage d'images, normalement `/images` |
| `--purge-snapins` | Supprime vos snapins |
| `--purge-ssl` | Supprime l'autorité de certification SSL — **voir ci-dessous** |
| `--purge-user` | Supprime le compte Linux `fogproject` et son répertoire personnel |
| `--purge-all` | Tout ce qui précède |

!!! danger "`--purge-ssl` casse définitivement tous les fog-client"
    La clé privée de l'autorité de certification signe le certificat que chaque
    fog-client valide, et les binaires iPXE sont construits en lui faisant
    confiance. Supprimez-la et tous les clients que vous avez déployés cessent
    de communiquer avec le serveur, et chaque binaire PXE doit être reconstruit.
    Il n'existe aucune récupération : chaque client doit être réinstallé à la
    main.

    Ne l'utilisez pas, sauf si vous mettez définitivement le serveur hors
    service.

L'autorité de certification se trouve dans le répertoire des snapins
(`/opt/fog/snapins/ssl` par défaut), ce qui explique pourquoi le
désinstallateur supprime les répertoires de FOG un par un plutôt que
d'effacer `/opt/fog` en bloc.

La base de données est exportée vers votre chemin de sauvegarde avant toute
opération, quelles que soient les options passées, car c'est la seule partie
qui ne peut pas être reconstruite depuis les sources de FOG.

## Confirmation

Le désinstallateur vous montre le plan complet et vous demande de saisir le nom
d'hôte du serveur pour continuer. Toute autre saisie interrompt l'opération sans
rien modifier.

`-Y`/`--autoaccept` ne suffit **pas** à répondre à cette demande. Cette option
est déjà présente dans beaucoup de scripts d'installation, et elle ne doit
jamais suffire à effacer un serveur par accident. Pour une automatisation
réellement voulue, utilisez `--force` :

    ./installfog.sh --uninstall --force

## Exemples

Retirer FOG en conservant tout ce à quoi vous tenez :

    ./installfog.sh --uninstall

Prévisualiser une mise hors service complète sans rien toucher :

    ./installfog.sh --uninstall --purge-all --dry-run

Reconstruire un serveur défaillant — désinstaller, puis réinstaller par-dessus
les données conservées :

    ./installfog.sh --uninstall
    ./installfog.sh

Mettre la machine complètement hors service, sans intervention :

    ./installfog.sh --uninstall --purge-all --force

## Dépannage

**« No FOG installation found »**

Le désinstallateur lit `.fogsettings` pour savoir ce que votre installation a
créé : quelle racine de documents, quel emplacement de stockage, quelle base de
données. Sans ce fichier, il n'a rien qu'il puisse supprimer en toute sécurité,
et il s'arrête plutôt que de deviner des chemins qui pourraient appartenir à
autre chose.

Si FOG est installé ailleurs que dans `/opt/fog`, indiquez-le-lui :

    ./installfog.sh --uninstall --fogprogramdir /srv/fog

**Des services encore listés après la désinstallation**

Les fichiers d'unité sont supprimés et systemd est rechargé, mais un shell
ouvert auparavant peut encore afficher des complétions mises en cache. Ouvrez-en
un nouveau.

**Le serveur web sert encore quelque chose sur /fog**

L'hôte virtuel de FOG est supprimé mais le serveur web n'est pas redémarré, au
cas où la machine hébergerait d'autres sites. Rechargez-le vous-même lorsque
vous êtes prêt.
