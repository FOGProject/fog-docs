---
title: Publication de FOG
description: Comment créer une nouvelle version de FOG
context_id: fog-release
aliases:
    - Fog Release
tags:
    - development
    - release
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/development/fog-release).

# Publication de FOG

Une version de FOG repose sur l'environnement de démarrage PXE appelé FOS. Les
éléments qui composent FOS — le noyau Linux, le système de fichiers init fondé
sur Buildroot et les binaires iPXE — résident chacun dans leur propre dépôt et
sont mis à jour indépendamment. Comme ce sont les composants les plus
susceptibles d'affecter la compatibilité matérielle, l'usage est de les mettre à
jour puis de les laisser mûrir une ou deux semaines sur `dev-branch` afin que la
communauté puisse les tester avant qu'une version ne soit publiée.

Les sections ci-dessous couvrent la mise à jour de chacun de ces composants
ainsi que les tests qui valident une version. Voir
[Automatisation de la synchronisation de version](version-sync-automation.md)
pour savoir comment `FOG_VERSION`/`FOG_CHANNEL` est maintenu à jour
indépendamment de ce processus manuel de publication, et
[Processus de publication stable](stable-release-workflow.md) pour savoir
comment une version de `dev-branch` est effectivement étiquetée et publiée vers
`stable`.

## Mettre à jour les dépendances

Le projet FOG s'appuie sur plusieurs autres projets open source (noyau Linux,
Buildroot, iPXE) pour fournir l'environnement de démarrage PXE (alias FOS), y
compris tous les pilotes permettant de fonctionner sur à peu près n'importe quel
matériel existant. **C'est généralement une bonne idée de mettre à jour ces
composants une ou deux semaines avant de publier une version de FOG, afin que
ces versions récentes soient testées par les utilisateurs de la dev-branch.**

### Noyau FOS

Consultez les versions actuelles sur <https://kernel.org/> et utilisez, dans la
plupart des cas, la plus récente marquée « longterm ». Lors du passage d'une
branche longterm à la suivante (par exemple de 5.15.x à 5.19.x), il convient de
prévoir davantage de temps de test.

Les étapes suivantes servent à mettre à jour la configuration du noyau et à
s'assurer que la nouvelle version compile correctement.

    $ git clone https://github.com/FOGProject/fos
    $ cd fos
    $ sed -ri "s/KERNEL_VERSION='[0-9]\.[0-9]+\.[0-9]+'/KERNEL_VERSION='5.15.68'/" build.sh
    $ ./build.sh -k -a x64

    Checking packages needed for building
    Preparing kernel 5.15.68 on x64 build:
     * Downloading kernel source...................................Done
     * Extracting kernel source....................................Done
     * Preparing kernel source.....................................Done
     * WARNING: Did not find a patch file building vanilla kernel without patches!
     * Cloning Linux firmware repository...........................Done
    We are ready to build. Would you like to edit the config file [y|n]?n
    Ok, running make oldconfig instead to ensure the config is clean.
    ....

Ainsi, lorsqu'il vous est demandé si vous souhaitez modifier la configuration du
noyau, vous répondez « non ». Le script utilisera comme base la configuration du
dernier noyau existante (`fos/configs/kernelx64.config`) et posera des questions
sur les nouvelles fonctionnalités ajoutées entre cette dernière version du noyau
et la nouvelle. Lorsque l'écart de versions est faible, aucune ou seulement
quelques questions seront posées, mais il y en aura certainement davantage si
vous passez à la branche longterm suivante. Dans la plupart des cas, la réponse
par défaut convient et il suffit d'appuyer sur ENTRÉE pour confirmer. Il reste
néanmoins important de lire chaque question et d'essayer de comprendre si
l'ajout ou l'omission d'une nouvelle fonctionnalité peut poser problème.

    ...
    #
    # configuration written to .config
    #
    We are ready to build are you [y|n]?y
    This make take a long time. Get some coffee, you'll be here a while!
    ...
    BUILD   arch/x86/boot/bzImage
    Kernel: arch/x86/boot/bzImage is ready  (#1)

    $ cp kernelsourcex64/.config configs/kernelx64.config
    $ rm -rf kernelsourcex64/

La première compilation de noyau est terminée — Intel/AMD 64 bits — et le
fichier de configuration mis à jour est enregistré. Deux autres noyaux
attendent.

    $ ./build.sh -k -a x86
    ...
    $ cp kernelsourcex86/.config configs/kernelx86.config
    $ rm -rf kernelsourcex86/

    $ ./build.sh -k -a arm64
    ...
    $ cp kernelsourcearm64/.config configs/kernelarm64.config
    $ rm -rf kernelsourcearm64/

Assurez-vous maintenant que toutes les modifications sont correctes, puis
publiez-les sur GitHub.

    $ git status
    On branch master
    Your branch is up-to-date with 'origin/master'.
    Changes not staged for commit:
      (use "git add <file>..." to update what will be committed)
      (use "git checkout -- <file>..." to discard changes in working directory)

            modified:   build.sh
            modified:   configs/kernelarm64.config
            modified:   configs/kernelx64.config
            modified:   configs/kernelx86.config

    no changes added to commit (use "git add" and/or "git commit -a")

    $ git diff
    ....

    $ git commit -a -m "Update Linux kernel to v5.15.68"
    $ git push origin master

### Init de FOS

L'init est le système de fichiers racine fondé sur Buildroot — le « monde »
d'outils (partclone et consorts) qui s'exécute sur le client aux côtés du noyau.
Il est construit depuis le même dépôt `fos`, avec l'option `-f` (système de
fichiers uniquement) afin que le noyau ne soit pas recompilé.

La version de Buildroot est figée près du début de `build.sh` ; incrémentez-la
de la même façon que la version du noyau ci-dessus, puis compilez chaque
architecture :

    $ git clone https://github.com/FOGProject/fos
    $ cd fos
    $ sed -ri "s/BUILDROOT_VERSION='[0-9.]+'/BUILDROOT_VERSION='2026.02.1'/" build.sh
    $ ./build.sh -f -a x64
    $ ./build.sh -f -a x86
    $ ./build.sh -f -a arm64

Chaque exécution télécharge et compile Buildroot, applique la surcouche FOG et
copie le système de fichiers racine obtenu dans le fichier init correspondant —
`init.xz` (x64), `init_32.xz` (x86) et `arm_init.cpio.gz` (arm64) — accompagné
d'une somme de contrôle `.sha256`. La version de l'init est estampillée
automatiquement avec la date de compilation.

Passez les modifications en revue et publiez-les, comme pour la mise à jour du
noyau ci-dessus :

    $ git status
    $ git diff
    $ git commit -a -m "Update Buildroot/init to 2026.02.1"
    $ git push origin master

### iPXE

    $ git clone https://github.com/FOGProject/fogproject
    $ cd fogproject
    $ git checkout dev-branch
    $ cd utils/FOGiPXE
    $ armsupport=1 ./buildipxe.sh
    ...

La compilation prend quelques minutes. Une fois terminée, il est prudent de
vérifier que tous les binaires iPXE ont bien été mis à jour. Si ce n'est pas le
cas, quelque chose s'est manifestement mal passé. Comparez le nombre de fichiers
iPXE avec la sortie de `git status` :

    $ cd ../..
    $ find packages/tftp -type f | grep -v memdisk | wc -l
    68
    $ git status | grep "modified" | wc -l
    68
    $ diff -Nur <(find packages/tftp -type f | grep -v memdisk | sort) <(git status | grep "modified" | awk '{print $2}' | sort)

Les nombres doivent être égaux et la sortie de diff doit être vide. Si c'est le
cas, system.class.php doit être mis à jour, puis les modifications peuvent être
publiées et poussées vers le dépôt officiel sur github.com.

    $ sed -i "s/define('FOG_VERSION'.*);/define('FOG_VERSION', '$(git describe --tags $(git rev-list --tags --no-walk --max-count=1)).$(git rev-list master..HEAD --count)');/g" packages/web/lib/fog/system.class.php
    $ git commit -a -m "Update iPXE to the latest pull ipxe/ipxe@$(head -c 8 ../ipxe/.git/refs/heads/master)"
    $ git push origin dev-branch

## Tests

Des tests d'installation par défaut sont effectués plusieurs fois par semaine
pour de nombreuses distributions et versions, grâce à Wayne Workman ! Les
résultats actuels se trouvent sur : <https://fogtesting.fogproject.us/>
