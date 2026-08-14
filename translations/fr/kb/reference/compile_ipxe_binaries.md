---
title: Compiler les binaires iPXE
aliases:
    - Compile iPXE binaries
description: page d'index de compile_ipxe_binaries
context_id: compile_ipxe_binaries
tags:
    - in-progress
    - ipxe
    - how-to
    - linux
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/compile_ipxe_binaries).

# Compiler les binaires iPXE

FOG utilise le code source iPXE le plus récent pour compiler de nombreux
binaires PXE différents, certains de type undionly et d'autres spécifiques aux
cartes réseau Intel ou Realtek — compatibles BIOS et UEFI. Vous pouvez malgré
tout vouloir compiler votre propre binaire pour répondre à vos besoins (script
personnalisé, débogage activé, etc.). Vous trouverez ici quelques indications
sur la façon de compiler vos propres binaires iPXE.

## Prérequis

Pour pouvoir compiler iPXE depuis les sources, il vous faut les outils
permettant de récupérer et de compiler du code source.

    debian/ubuntu# sudo apt-get install git build-essential zlib1g-dev binutils-dev
    fedora/centos# sudo yum install git gcc gcc-c++ make zlib-devel binutils-devel genisoimage isomd5sum syslinux xz xz-devel

## Script de compilation

-   Démarrez n'importe quel ordinateur en PXE et notez le code de build affiché
    sur la bannière iPXE. Ce code de build est un nombre hexadécimal entre
    parenthèses (par exemple `iPXE 1.21.1+ (gc64d) ...`). Nous comparerons ce
    code de build à une étape ultérieure pour nous assurer que vos fichiers de
    chargeur d'amorçage iPXE ont bien été mis à jour.
-   Rendez-vous à l'endroit où vous avez téléchargé l'installeur de FOG avec
    git. Selon les instructions que vous avez suivies, ces fichiers se trouvent
    soit dans /opt, soit dans /root. Le répertoire parent que nous cherchons
    s'appelle fogproject. Pour la suite de ce tutoriel, je supposerai que le
    répertoire fogproject se trouve dans /root ; vous devrez adapter les chemins
    selon l'emplacement de votre répertoire fogproject.
-   Rendez-vous dans le répertoire `/root/fogproject/utils/FOGiPXE`
-   Exécutez le script de compilation avec cette commande `./buildipxe.sh`
    (**Note :** votre serveur FOG aura besoin d'un accès à Internet pour
    recompiler iPXE. La recompilation prend environ 10 minutes — cela dépend du
    processeur et de la mémoire de votre machine.)
-   Une fois la compilation terminée, vous retrouvez une invite de commande.
    Notez bien que le script buildipxe.sh ne fait que compiler les binaires
    iPXE. Il ne les installe pas dans votre environnement de production.
-   La bonne façon de mettre à jour votre environnement de production consiste à
    relancer l'installeur de FOG avec toutes les options déjà sélectionnées.
    Réinstaller FOG avec l'installeur n'est pas destructeur : l'installeur se
    souvient de vos réglages précédents et se contente d'ajouter les nouveaux
    fichiers à votre environnement de production.
-   La méthode « bidouille » pour mettre à jour votre environnement de
    production consiste à copier les fichiers mis à jour dans le répertoire
    /tftpboot avec cette commande
    `cp -R /root/fogproject/packages/tftp/* /tftpboot` (**Note :** attention au
    chemin source si votre répertoire git fogproject ne se trouve pas dans
    `/root/fogproject`)
-   Exécutez la commande suivante pour vérifier que vos fichiers iPXE portent
    bien une date récente : `ls -la /tftpboot/*.efi`
-   Démarrez maintenant le client en PXE et confirmez que le code de build
    (entre parenthèses) a changé par rapport à l'étape précédente. **Note :** le
    code de build ne change pas à chaque recompilation, mais seulement si une
    version plus récente est disponible.

## Compilation manuelle

Récupérez le code et téléchargez nos fichiers d'en-tête de configuration depuis
GitHub. Ces fichiers d'en-tête doivent être un peu différents pour le BIOS et
pour l'UEFI ; je récupère donc habituellement les sources deux fois, afin d'en
avoir un exemplaire prêt pour chaque plateforme.

    mkdir ~/projects/ipxe
    cd ~/projects/ipxe
    git clone git://git.ipxe.org/ipxe.git ipxe-bios
    cd ipxe-bios/src/config
    rm console.h general.h settings.h
    wget -O console.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/config/console.h"
    wget -O general.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/config/general.h"
    wget -O settings.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/config/settings.h"
    cd ..
    wget -O ipxescript "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src/ipxescript"

    cd ~/projects/ipxe
    git clone git://git.ipxe.org/ipxe.git ipxe-efi
    cd ipxe-efi/src/config
    rm console.h general.h settings.h
    wget -O console.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/config/console.h"
    wget -O general.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/config/general.h"
    wget -O settings.h "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/config/settings.h"
    cd ..
    wget -O ipxescript "https://github.com/FOGProject/fogproject/raw/master/src/ipxe/src-efi/ipxescript"

## Passons à la cuisson

Vous voilà prêt à compiler vos binaires iPXE depuis les sources. Mais comment
s'y prendre ? Un seul appel, qui peut toutefois être largement personnalisé à
l'aide de paramètres.

    # Build a simple BIOS binaries including an embedded script (executed right when iPXE comes up)
    cd ~/projects/ipxe/ipxe-bios/src
    make bin/undionly.kpxe EMBED=ipxescript
    make bin/ipxe.pxe EMBED=ipxescript
    make bin/undionly.kkpxe EMBED=ipxescript
    make bin/intel.pxe EMBED=ipxescript
    ...


    # simple 32 bit EFI binaries with embedded script
    cd ~/projects/ipxe/ipxe-efi/src
    make bin-i386-efi/ipxe.efi EMBED=ipxescript
    make bin-i386-efi/snponly.efi EMBED=ipxescript
    make bin-i386-efi/intel.efi EMBED=ipxescript
    ...

    # simple 64 bit EFI binaries
    cd ~/projects/ipxe/ipxe-efi/src
    make bin-x86_64-efi/ipxe.efi EMBED=ipxescript
    make bin-x86_64-efi/snponly.efi EMBED=ipxescript
    make bin-x86_64-efi/intel.efi EMBED=ipxescript
    ...

## Débogage

Nous arrivons maintenant à la partie intéressante : ajouter des sorties de
débogage à iPXE afin de mieux cerner les problèmes. Chaque fichier c des sources
d'iPXE peut être compilé avec le débogage activé. Voici un exemple :

    make bin/realtek.kpxe EMBED=ipxescript DEBUG=realtek

La plupart des pilotes natifs ne comportent qu'un seul fichier source.
Regardez src/drivers/net pour les voir — 3c509, bnx2, forcedeth, intel, pcnet32,
realtek, rhine et bien d'autres.

Les binaires les plus couramment utilisés, ipxe.pxe et ipxe.efi, comprennent
l'interface UNDI ainsi que tous les pilotes natifs. Vous pouvez ajouter le
débogage de manière sélective. Consultez le code source. Voici quelques exemples
supplémentaires :

    make ... DEBUG=dhcp
    make ... DEBUG=device,efi_driver,efi_init,efi_pci,efi_snp
    make ... DEBUG=snp,snponly,snpnet,netdevice
    make ... DEBUG=intel:4
    make ... DEBUG=undi
    ...
