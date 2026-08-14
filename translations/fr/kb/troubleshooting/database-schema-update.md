---
title: Mises à jour du schéma de base de données
aliases:
    - Database Schema Updates
    - Schema Updater
description: Qui est autorisé à exécuter l'installeur/module de mise à jour du schéma de base de données de FOG, et que faire lorsqu'il ne s'exécute pas
context_id: database-schema-update
tags:
    - troubleshooting
    - kb
    - installation
    - database
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/troubleshooting/database-schema-update).

# Mises à jour du schéma de base de données

Chaque version de FOG est livrée avec une version de schéma. Lorsque la version
de schéma de votre base de données est inférieure à celle qu'attend le code web,
FOG vous redirige vers la page **Database Schema Installer / Updater** et refuse
de faire quoi que ce soit d'autre tant que le schéma n'a pas été appliqué.

L'installeur l'applique normalement pour vous. Cette page explique qui est
autorisé à l'exécuter, à quoi sert le jeton d'installation, et que faire lorsque
la page ne se charge pas ou vous refuse l'accès.

## Qui est autorisé à l'exécuter

Le module de mise à jour du schéma doit fonctionner dans deux situations très
différentes : un serveur tout neuf sur lequel aucun utilisateur FOG n'existe
encore, et un serveur existant en cours de mise à niveau. Il accepte trois
identifiants différents, et celui qui s'applique dépend de votre situation.

| Situation | Ce qui autorise la mise à jour |
|---|---|
| L'installeur s'exécutant en mode non interactif | Le jeton d'installation, envoyé comme en-tête de requête |
| Mise à niveau à la main d'un serveur existant | La connexion en tant qu'administrateur FOG |
| Serveur tout neuf, à la main | Le jeton d'installation, dans l'URL |

Vous n'avez normalement pas à vous préoccuper de tout cela. Exécuter
`installfog.sh` et répondre **Y** à l'invite relative au schéma emprunte le
premier chemin et termine le travail sans aucune URL à visiter.

### Le jeton d'installation

Lorsque l'installeur déploie les fichiers web, il génère un jeton aléatoire et
l'écrit dans `lib/fog/config.class.php` sous le nom `FOG_SCHEMA_INSTALL_TOKEN`.
Ce jeton existe pour qu'un serveur tout neuf — qui n'a aucun utilisateur, et
donc aucun moyen de se connecter — puisse tout de même appliquer son premier
schéma sans laisser ce point d'accès ouvert à quiconque sur le réseau.

Le jeton n'est accepté dans une URL **que tant que le serveur n'a aucun
utilisateur FOG**. Dès que le premier déploiement de schéma s'achève, il crée
l'utilisateur `fog` par défaut, et à partir de là la forme « jeton dans l'URL »
est refusée. C'est délibéré : cet exemplaire du jeton est affiché dans votre
terminal, enregistré dans le journal de l'installeur et se retrouve dans
l'historique de votre navigateur ; il doit donc cesser d'être utilisable dès
qu'il n'est plus nécessaire.

La forme « en-tête » du jeton n'est pas restreinte de la sorte, car un en-tête
de requête ne peut pas être déclenché par un lien, par un formulaire sur un
autre site ou par une balise d'image. C'est cette forme qu'utilise l'installeur
lui-même, aussi bien pour les installations neuves que pour les mises à niveau.

!!! note
    `config.class.php` est généré par l'installeur. Si vous déployez les
    fichiers web par d'autres moyens (par exemple un script de synchronisation
    de développement), le fichier n'est pas régénéré et peut ne contenir aucun
    jeton. Relancez l'installeur si vous avez besoin que le chemin par jeton
    fonctionne.

### Mettre à niveau un serveur existant

Lors d'une mise à niveau, vous n'avez pas besoin de jeton et aucun ne vous sera
présenté. Ouvrez :

```
http(s)://<your-fog-server>/fog/management/index.php?node=schema
```

Connectez-vous en tant qu'administrateur FOG, puis cliquez sur
**Install/Update**. Vous connecter n'importe où dans l'interface web vous
ramènera à cette page tant que le schéma sera obsolète.

Seul un **administrateur complet** peut appliquer une mise à jour de schéma —
plus précisément, un compte détenant un rôle avec **Administrator (full
access)** coché. Un rôle qui accorde beaucoup de choses mais pas tout ne suffit
toujours pas : une mise à jour de schéma réécrit toute la base de données, aucun
rôle plus étroit ne convient donc. Voir
[Rôles et permissions](../../management/web/roles.md).

Les administrateurs issus d'un annuaire fonctionnent normalement. Un compte LDAP
qui aboutit à un rôle en accès complet est également administrateur ici.

!!! note "Mise à niveau depuis une version antérieure aux rôles"

    Les rôles sont arrivés avec FOG 1.6, et c'est la mise à jour du schéma
    elle-même qui les crée. Sur un serveur exécutant encore un schéma plus
    ancien, il n'y a pas encore de rôles à vérifier : FOG se rabat donc sur
    l'ancien type de compte — ce qui signifie que votre administrateur existant
    peut se connecter et appliquer la mise à jour exactement comme avant. Une
    fois cette mise à jour terminée, les rôles sont en place et ce repli
    disparaît définitivement.

    La mise à niveau attribue à chaque compte administrateur existant un rôle
    accordant l'accès complet, de sorte que personne ne perde la possibilité
    d'exécuter les futures mises à jour.

### Si vous ne parvenez pas à vous connecter

Si vous avez perdu le mot de passe administrateur, le chemin par le navigateur
ne vous est pas accessible. Relancez l'installeur depuis un interpréteur de
commandes sur le serveur FOG :

```bash
cd /path/to/fogproject/bin
./installfog.sh
```

Répondez **Y** lorsqu'il demande s'il faut installer ou mettre à jour le schéma
de la base de données. L'installeur s'autorise lui-même avec la forme
« en-tête » du jeton et n'a pas besoin de connexion.

## Dépannage

### La page du schéma est blanche, ou renvoie une erreur HTTP 500

Une page entièrement blanche — sans logo FOG, sans texte, sans rien — est
presque toujours une erreur fatale de PHP plutôt qu'un problème de base de
données. Lorsque PHP s'arrête avant d'avoir écrit la moindre sortie, le serveur
renvoie une réponse vide avec un statut 500, que la plupart des navigateurs
affichent comme une page blanche.

Vérifiez, dans cet ordre :

1. **Votre version de PHP.** Exécutez `php -v` sur le serveur FOG. FOG exige PHP
   7.4 ou plus récent.
2. **Le journal d'erreurs du serveur web.** Sur Debian/Ubuntu, il s'agit
   généralement de `/var/log/apache2/error.log` ou `/var/log/nginx/error.log` ;
   sur les systèmes de la famille RHEL, de `/var/log/httpd/error_log`. Une ligne
   commençant par `PHP Fatal error:` vous donne la réponse.
3. **Le journal de l'installeur FOG**, dans `error_logs/foginstall.log`, à
   l'intérieur du répertoire depuis lequel vous avez lancé l'installeur.

Les installeurs récents sondent l'interface web avant de vous fournir une URL :
un serveur dans cet état fera donc échouer l'installation avec une erreur
nommée, au lieu d'annoncer un succès. Si votre installeur a affiché
`Setup complete` alors que le site est hors service, vous utilisez un installeur
ancien et devriez relancer l'installeur actuel.

### La page du schéma affiche « Unauthorized »

Vous avez atteint la page mais la mise à jour a été refusée. Le plus souvent,
cela signifie que vous avez utilisé une URL contenant un jeton sur un serveur
qui possède déjà des utilisateurs — cette forme n'est acceptée que sur un
serveur sans aucun utilisateur. Connectez-vous plutôt en tant qu'administrateur,
comme décrit plus haut.

Cela peut aussi signifier que vous êtes connecté avec un compte qui n'est pas
administrateur complet. Ouvrez le compte sous **Utilisateurs → Rôles** et
vérifiez qu'il détient bien un rôle avec **Administrator (full access)** coché.

### La page du schéma indique que la base de données n'est pas disponible

La page s'est chargée mais ne parvient pas à joindre MySQL. Vérifiez les
identifiants dans `lib/fog/config.class.php` par rapport à votre base de
données, confirmez que le service de base de données fonctionne, et confirmez
que le système de fichiers dispose d'espace libre.

### L'installeur indique que le schéma est encore dans une version ancienne

L'installeur vérifie le schéma déployé par rapport à la version attendue par le
code, et s'arrête plutôt que d'annoncer un succès si les deux ne correspondent
pas. Cela signifie que la mise à jour ne s'est pas réellement exécutée. Reprenez
les vérifications de la page blanche ci-dessus — la cause la plus fréquente est
que l'interface web n'a jamais pu servir la page du schéma en premier lieu.
