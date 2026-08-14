---
title: Compiler le noyau FOS
aliases:
    - Compile FOS kernel
description: page d'index de compile-fos-kernel
context_id: compile-fos-kernel
tags:
    - in-progress
    - how-to
    - kernel
    - fos
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/compile-fos-kernel).

# Compiler le noyau FOS

Les noyaux FOS (le noyau Linux utilisé par le système d'exploitation FOG —
un système Linux minimal qui effectue tout le travail d'imagerie) sont mis à
jour régulièrement afin de fournir des pilotes pour du matériel plus récent
et de corriger des problèmes. Le noyau Linux vanilla est utilisé et très peu
de correctifs (actuellement aucun) y sont ajoutés, afin de rester au plus
près des sources officielles. Si vous souhaitez compiler vos propres
binaires, pour quelque raison que ce soit, vous pouvez suivre les
instructions ci-dessous.

## Prérequis

Pour pouvoir compiler le noyau depuis les sources, il vous faut les outils
permettant de récupérer et de compiler du code source :

    debian/ubuntu# sudo apt install git build-essential flex bison libelf-dev
    fedora/centos# sudo yum install git gcc gcc-c++ make flex bison elfutils-libelf-devel 

## Script de compilation

Le dépôt fos fournit un script de compilation :

    git clone https://github.com/FOGProject/fos
    cd fos
    ./build.sh --kernel-only --arch x64

## Compilation manuelle

Récupérez le code et téléchargez nos fichiers d'en-tête de configuration
depuis GitHub. Ces fichiers d'en-tête doivent être un peu différents pour le
BIOS et pour l'UEFI ; je récupère donc habituellement les sources deux fois,
afin d'en avoir un exemplaire prêt pour chaque plateforme.

    mkdir fos
    cd fos
    wget https://www.kernel.org/pub/linux/kernel/v5.x/linux-5.10.83.tar.gz
    tar xzf linux-5.10.83.tar.gz
    cd linux-5.10.83/
    git clone git://git.kernel.org/pub/scm/linux/kernel/git/firmware/linux-firmware.git

À ce stade, vos sources de noyau sont préparées et prêtes. Vous devez
maintenant choisir l'architecture pour laquelle compiler : Intel/AMD 64 bits,
32 bits, ou ARM 64 bits.

### Intel/AMD 64 bits

    make mrproper
    wget -O .config https://github.com/FOGProject/fos/raw/master/configs/kernelx64.config
    make oldconfig
    #if you wish to customize the config further with different drivers or options uncomment this line and use the menu to adjust config options
    #make menuconfig
    make -j $(nproc) bzImage
    #to not overwrite the default kernel, change the name of the destination file in the cp command
    cp arch/x86/boot/bzImage /var/www/html/fog/service/ipxe/bzImage

### Intel/AMD 32 bits

    make mrproper
    wget -O .config https://github.com/FOGProject/fos/raw/master/configs/kernelx86.config
    make ARCH=i386 oldconfig
    #if you wish to customize the config further with different drivers or options uncomment this line and use the menu to adjust config options
    #make menuconfig
    make ARCH=i386 -j $(nproc) bzImage
    #to not overwrite the default kernel, change the name of the destination file in the cp command
    cp arch/x86/boot/bzImage /var/www/html/fog/service/ipxe/bzImage32

### ARM 64 bits

    make mrproper
    wget -O .config https://raw.githubusercontent.com/FOGProject/fos/master/configs/kernelarm64.config
    make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- oldconfig
    #if you wish to customize the config further with different drivers or options uncomment this line and use the menu to adjust config options
    #make menuconfig
    make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- -j $(nproc) Image
    #to not overwrite the default kernel, change the name of the destination file in the cp command
    cp arch/arm64/boot/Image /var/www/html/fog/service/ipxe/arm_Image

## Correctifs supplémentaires

Comme indiqué plus haut, le nombre de correctifs supplémentaires est réduit
au minimum. Pendant un certain temps, dans la série des noyaux 4.x, nous
ajoutions les correctifs suivants, qui ne sont plus nécessaires pour les
noyaux 5.x.

### drivers/net/usb/r8152.c

Voir
<https://forums.fogproject.org/topic/12465/microsoft-surface-go-usb-c-to-ethernet-adapter-compatibility>

Cherchez

    REALTEK_USB_DEVICE(VENDOR_ID_REALTEK

et ajoutez cette ligne

    {REALTEK_USB_DEVICE(VENDOR_ID_MICROSOFT, 0x0927)}

### drivers/scsi/storvsc_drv.c

Il s'agit d'un correctif important qui aide à éviter des problèmes majeurs
de performances sous HyperV :
<https://forums.fogproject.org/topic/6695/performance-decrease-using-hyper-v-win10-clients>

Cherchez

    blk_queue_virt_boundary

Supprimez la ligne et ajoutez ceci à la place

    if (PAGE_SIZE - 1 < 4096) {
        blk_queue_virt_boundary(sdevice->request_queue, 4096);
    } else {
        blk_queue_virt_boundary(sdevice->request_queue, PAGE_SIZE - 1);
    }
