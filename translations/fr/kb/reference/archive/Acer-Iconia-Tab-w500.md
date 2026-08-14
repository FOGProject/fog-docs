---
title: Acer Iconia Tab w500
aliases:
    - Acer Iconia Tab w500
description: page d'index de Acer-Iconia-Tab-w500_rev1
context_id: Acer-Iconia-Tab-w500
tags:
    - in-progress
    - archive
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/archive/Acer-Iconia-Tab-w500).

# Acer Iconia Tab w500

<font color="red">Note :</font> cet article est ancien
(année 2012) ; seule sa terminologie a été mise à jour pour refléter la
terminologie actuelle de FOG.

## Compiler un noyau personnalisé avec les pilotes de carte réseau USB Asix

Commencez par suivre les instructions de [Build FOG Core
Kernel](Build_FOG_Core_Kernel "wikilink").

Cet article a été rédigé à partir de la création d'un noyau 3.1.5 avec
Ubuntu 11.10 comme système de compilation. Le noyau produit par ces
instructions est utilisé sur FOG 0.29 et a permis d'imager avec succès 40
tablettes Iconia w500.

### Télécharger le code source des pilotes de carte réseau USB Asix 88772B

Avant d'effectuer l'étape \"make xconfig\", téléchargez les pilotes Asix,
extrayez-les et copiez-les dans l'arborescence des sources du noyau.

`wget `[`http://www.asix.com.tw/FrootAttach/driver/AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source.tar.bz2`](http://www.asix.com.tw/FrootAttach/driver/AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source.tar.bz2)\
\
`tar -xzvf AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source.tar.bz2`\
\
`cp AX88772B_772A_760_772_178_LINUX_Driver_v4.1.0_Source/a* (kernel-source-tree-root)/drivers/net/usb/`

(NOTE1 : vous n'avez besoin de copier que les fichiers commençant par la
lettre \"a\" depuis le dossier des sources du pilote\... le Makefile et le
Readme ne sont pas nécessaires. D'où le a\*\...)

(NOTE2 : d'après la page [Build FOG Core
Kernel](Build_FOG_Core_Kernel "wikilink"),
(kernel-source-tree-root) se trouve dans \~/Desktop/linux-3.1.5)

### make xconfig et adaptation pour la w500

`make xconfig`

`Select the Device Drivers - Network Device Support - USB Network Adapters - Multipurpose USB Networking Framework - Asix AX88xxx USB 2.0 Ethernet Adapters`

`Deselected the Device Drivers - Graphics Support - AGPGART (AGP Support)`

`Selected Device Drivers - Graphics Support - Direct Rendering Manage (XFree86 4.1.0 and Higher DRI Support) - ATI Radeon.`

`Deselected the option under ATI Radeon for: Enable modesetting on radeon by default - NEW DRIVER.`

`Save and exit`

`Continue instructions on `[`Build FOG Core Kernel`](Build_FOG_Core_Kernel "wikilink")` by issuing the make command and copying your kernel to FOG's tftpboot location listed on that page.`

### Créer tftpd-map et modifier la configuration si vous utilisez un serveur DHCP distinct

Créez un fichier nommé /etc/default/tftpd-hpa.map avec votre éditeur de
texte préféré, par exemple nano. (c'est-à-dire sudo nano
/etc/default/tftpd-hpa.map)

Voici une copie du map que j'utilise\... Vous devrez le placer dans le
fichier map que vous venez de créer ci-dessus :

`# if the requested file starts with a-f A-F or 0-9 send it`\
`# otherwise send pxelinux.0 for PXE stacks that are corrupt`\
`# This was added for the Acer Iconia W500 Tablet`\
\
`e ^[a-zA-Z0-9].*$`\
`r .* pxelinux.0`

Modifiez ensuite le fichier de configuration (/etc/default/tftpd-hpa) pour
lui indiquer d'utiliser le fichier map que vous venez de créer\...

`sudo nano /etc/default/tftpd-hpa`

Voici une copie de ma configuration\... l'important est l'ajout de l'option
-m et de l'emplacement du fichier map.

`# /etc/default/tftpd-hpa`\
`# FOG Modified version`\
`TFTP_USERNAME="root"`\
`TFTP_DIRECTORY="/tftpboot"`\
`TFTP_ADDRESS="0.0.0.0:69"`\
`TFTP_OPTIONS="-s -v -m /etc/default/tftpd-hpa.map"`

Lancez enfin la commande de redémarrage du service tftpd, ou redémarrez
votre serveur FOG.

`sudo service tftpd-hpa restart`

### Problème de clavier / PXE

Pour inventorier l'Iconia w500 et naviguer dans le menu FOG après un
démarrage PXE, il existe un document d'assistance Acer que vous devrez
suivre\... Cela vous permettra de capturer votre image initiale vers FOG,
car un clavier est nécessaire.

[`Here`](http://acer.custhelp.com/app/answers/detail/a_id/8157/~/how-do-i-perform-a-network-pxe-boot-on-the-iconia-tab-w500%3F)` is the link: `[`http://acer.custhelp.com/app/answers/detail/a_id/8157/~/how-do-i-perform-a-network-pxe-boot-on-the-iconia-tab-w500%3F`](http://acer.custhelp.com/app/answers/detail/a_id/8157/~/how-do-i-perform-a-network-pxe-boot-on-the-iconia-tab-w500%3F)

Ce contournement consiste à brancher une rallonge USB entre le dock clavier
et le port USB central de la tablette\... et l'autre port USB de la tablette
à un clavier ou à un concentrateur USB \> clavier.
