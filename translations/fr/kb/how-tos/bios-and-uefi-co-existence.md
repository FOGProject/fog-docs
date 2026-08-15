---
title: Coexistence BIOS et UEFI
description: Décrit comment configurer un serveur DHCP pour fournir différents fichiers de démarrage PXE selon le matériel
context_id: bios-and-uefi-co-existence
aliases:
    - Bios and UEFI Co-Existence
tags:
    - bios
    - uefi
    - pxe
    - ipxe
    - netboot
    - dhcp
    - window-server
    - how-to
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/bios-and-uefi-co-existence).

# Coexistence BIOS et UEFI

Pour rendre possible le démarrage réseau de plusieurs plateformes clientes différentes, vous devez proposer des images de démarrage adaptées à ces clients. Pour pouvoir distinguer les différentes plateformes, le serveur DHCP doit exploiter les informations envoyées par les clients. Selon la [RFC 4578](http://tools.ietf.org/html/rfc4578), les types d'architecture de pré-démarrage suivants ont été demandés (par la RFC) :

`           Type   Architecture Name`\
`           ----   -----------------`\
`             0    Intel x86PC`\
`             1    NEC/PC98`\
`             2    EFI Itanium`\
`             3    DEC Alpha`\
`             4    Arc x86`\
`             5    Intel Lean Client`\
`             6    EFI IA32`\
`             7    EFI BC (EFI Byte Code)`\
`             8    EFI Xscale`\
`             9    EFI x86-64`

Différents fichiers fournis avec FOG sont pré-configurés pour
fonctionner avec ces divers types d'architecture. Ils se trouvent
habituellement dans le répertoire /tftpboot. Plus d'informations à leur sujet ici : [Informations sur les noms de fichiers](Filename_Information "wikilink")

## Utiliser un DHCP Linux

Selon ce message, il existe (au moins) trois façons différentes de
configurer le serveur ISC DHCP de cette manière :
<http://www.syslinux.org/archives/2014-October/022683.html>

Modifiez /etc/dhcp/dhcpd.conf et ajoutez l'option 'authoritative' à votre
définition de sous-réseau ainsi que les classes suivantes n'importe où dans la configuration :

`subnet ... {`\
`    authoritative;`\
`    ...`\
`}`\
`...`\
\
`class "pxeclient" {`\
`    match if substring (option vendor-class-identifier, 0, 9) = "PXEClient";`\
\
`    if substring (option vendor-class-identifier, 15, 5) = "00000" {`\
`        # BIOS client `\
`        filename "undionly.kpxe";`\
`    }`\
`    elsif substring (option vendor-class-identifier, 15, 5) = "00006" {`\
`        # EFI client 32 bit`\
`        filename   "ipxe32.efi";`\
`    }`\
`    else {`\
`        # default to EFI 64 bit`\
`        filename   "ipxe.efi";`\
`    }`\
`}`

### Exemple 1

Voici un exemple de configuration complet où TFTP et DNS se trouvent sur le
même serveur. Aucun routeur n'est défini dans cette configuration, mais il peut facilement
être ajouté en modifiant X.X.X.X et en décommentant la ligne.

    option space PXE;
    option PXE.mtftp-ip    code 1 = ip-address;
    option PXE.mtftp-cport code 2 = unsigned integer 16;
    option PXE.mtftp-sport code 3 = unsigned integer 16;
    option PXE.mtftp-tmout code 4 = unsigned integer 8;
    option PXE.mtftp-delay code 5 = unsigned integer 8;
    option arch code 93 = unsigned integer 16; # RFC4578

    use-host-decl-names on;
    ddns-update-style interim;
    ignore client-updates;
    next-server 192.168.1.1;
    authoritative;

    subnet 192.168.1.0 netmask 255.255.255.0 {
        option subnet-mask 255.255.255.0;
        range dynamic-bootp 192.168.1.10 192.168.1.254;
        default-lease-time 21600;
        max-lease-time 43200;
        option domain-name-servers 192.168.1.1;
        #option routers x.x.x.x;
     
        class "UEFI-32-1" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00006";
        filename "i386-efi/ipxe.efi";
        }

        class "UEFI-32-2" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00002";
         filename "i386-efi/ipxe.efi";
        }

        class "UEFI-64-1" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00007";
         filename "ipxe.efi";
        }

        class "UEFI-64-2" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00008";
        filename "ipxe.efi";
        }

        class "UEFI-64-3" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00009";
         filename "ipxe.efi";
        }

        class "Legacy" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00000";
        filename "undionly.kkpxe";
        }

    }

### Exemple 2

Voici un autre exemple complet de configuration pour un réseau 10.0.0.0/24 où
10.0.0.3 est le serveur TFTP, 10.0.0.1 est le routeur et 10.0.0.1 est le
serveur DNS. La plage pour cette configuration est définie de 10.0.0.20 à
10.0.0.254.

    option space PXE;
    option PXE.mtftp-ip    code 1 = ip-address;
    option PXE.mtftp-cport code 2 = unsigned integer 16;
    option PXE.mtftp-sport code 3 = unsigned integer 16;
    option PXE.mtftp-tmout code 4 = unsigned integer 8;
    option PXE.mtftp-delay code 5 = unsigned integer 8;
    option arch code 93 = unsigned integer 16; # RFC4578

    use-host-decl-names on;
    ddns-update-style interim;
    ignore client-updates;
    next-server 10.0.0.3;
    authoritative;


    subnet 10.0.0.0 netmask 255.255.255.0 {
        option subnet-mask 255.255.255.0;
        range dynamic-bootp 10.0.0.20 10.0.0.254;
        default-lease-time 21600;
        max-lease-time 43200;
        option domain-name-servers 10.0.0.1;
        option routers 10.0.0.1;
     
        class "UEFI-32-1" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00006";
        filename "i386-efi/ipxe.efi";
        }

        class "UEFI-32-2" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00002";
         filename "i386-efi/ipxe.efi";
        }

        class "UEFI-64-1" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00007";
         filename "ipxe.efi";
        }

        class "UEFI-64-2" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00008";
        filename "ipxe.efi";
        }

        class "UEFI-64-3" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00009";
         filename "ipxe.efi";
        }

        class "Legacy" {
        match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00000";
        filename "undionly.kkpxe";
        }

    }

Si vous avez également des clients Mac OS, vous voudrez peut-être consulter ceci :
[FOG_on_a_MAC#architecture](FOG_on_a_MAC#architecture "wikilink")

Redémarrez le service DHCP et c'est prêt !

### Adresse IP statique avec ISC-DHCP et autres cas

Voici quelques exemples d'options définies exclusivement selon des adresses
MAC. Elles se placent tout à la **fin** de votre fichier dhcpd.conf.
Vous pouvez utiliser la correspondance par MAC pour attribuer une adresse IP statique ou des
options de démarrage spécifiques.


    #Just set a static IP based on MAC address. The "Optiplex380" is what is suggested as a hostname
    # To my knowledge, only Linux respects this and offers it to the user for confirmation.

    host Optiplex380 {
                            hardware ethernet F0:4D:A2:22:6E:2C;
                            fixed-address 10.0.0.6;
                    }


    #Define a static IP and a specific boot file for this computer.

    host FOG {
                            hardware ethernet 00:13:72:AB:FD:7C;
                            fixed-address 10.0.0.3;
                            filename "My_Custom_Boot_File.kkpxe";
                    }


    #Make this access point use Google's DNS.

    host TP-Link-Access-point {
                            hardware ethernet C4:E9:84:7D:F0:2E;
                            option domain-name-servers 8.8.8.8;
                    }

## Utiliser ProxyDHCP (dnsmasq)

Article associé : [ProxyDHCP avec dnsmasq](ProxyDHCP_with_dnsmasq "wikilink")

La syntaxe de configuration de dnsmasq offre des règles de correspondance puissantes.
Voici un exemple de la façon dont on peut les utiliser pour distinguer BIOS
et UEFI. **Remarque : ceci ne fonctionnera PAS en mode proxy !!**

`dhcp-match=set:bios,60,PXEClient:Arch:00000`\
`dhcp-boot=`[`tag:bios,undionly.kpxe,x.x.x.x,x.x.x.x`](tag:bios,undionly.kpxe,x.x.x.x,x.x.x.x)`        # x.x.x.x = TFTP/FOG server IP`\
\
`dhcp-match=set:efi32,60,PXEClient:Arch:00006`\
`dhcp-boot=`[`tag:efi32,i386-efi/ipxe.efi,x.x.x.x,x.x.x.x`](tag:efi32,i386-efi/ipxe.efi,x.x.x.x,x.x.x.x)`   # x.x.x.x = TFTP/FOG server IP`\
\
`dhcp-match=set:efibc,60,PXEClient:Arch:00007`\
`dhcp-boot=`[`tag:efibc,ipxe.efi,x.x.x.x,x.x.x.x`](tag:efibc,ipxe.efi,x.x.x.x,x.x.x.x)`            # x.x.x.x = TFTP/FOG server IP`\
\
`dhcp-match=set:efi64,60,PXEClient:Arch:00009`\
`dhcp-boot=`[`tag:efi64,ipxe.efi,x.x.x.x,x.x.x.x`](tag:efi64,ipxe.efi,x.x.x.x,x.x.x.x)`            # x.x.x.x = TFTP/FOG server IP`

## Utiliser une stratégie DHCP de Windows Server 2012 (R1 et ultérieur)

La méthode ci-dessous suppose que vos options d'étendue habituelles 066 et 067 sont
déjà configurées pour le démarrage réseau en mode BIOS (sans elles,
les étapes ci-dessous n'aboutiront pas). La stratégie DHCP ci-dessous ne
s'appliquera qu'au démarrage réseau en mode UEFI. Le démarrage réseau
classique en mode BIOS continuera d'utiliser les options d'étendue par défaut définies dans l'étendue.

Vous pouvez substituer le Vendor Class Identifier dont vous avez besoin dans le
champ ASCII à l'étape 3.

### Étape 1

Faites un clic droit sur IPv4 et choisissez "Define vendor class".
![[bios-uefi-Step_1.png]]

### Étape 2

![[bios-uefi-Step_2.png]]

### Étape 3

Ici, le nom d'affichage et la description n'ont pas vraiment d'importance, mais
ils devraient décrire ce que cela fait.

Ce qui est important, c'est le champ "ASCII". Dans ce champ, vous devez taper
ceci, exactement, car la casse est prise en compte :

    PXEClient:Arch:00007

À mesure que vous le tapez, les champs ID et Binary se mettent à jour automatiquement. Une fois
terminé, cliquez sur Ok, ok, ok pour finir cette partie de la procédure.

<font color="red">**REMARQUE :**</font> Il existe de nombreuses
autres architectures UEFI en plus de "PXEClient:Arch:00007".

"PXEClient:Arch:00002" et "PXEClient:Arch:00006" devraient tous deux recevoir
"i386-efi/ipxe.efi" comme fichier de démarrage de l'option 067.

"PXEClient:Arch:00008", "PXEClient:Arch:00009" et
"PXEClient:Arch:00007" devraient recevoir "ipxe.efi" comme fichier de démarrage de
l'option 067.

"PXEClient:Arch:00007:UNDI:003016" devrait recevoir "ipxe7156.efi" ; ce
fichier est spécifique à la Surface Pro 4.

Pour prendre en charge ces autres architectures, répétez simplement les étapes
Server 2012 pour chacune d'elles, définissez la correspondance (étape 3) et le fichier de
démarrage de chacune en conséquence, et changez les noms pour refléter ce qu'elles
sont.

![[bios-uefi-Step_3.png]]


### Étape 4

Sous IPv4 -\> Scope -\> Policies, faites un clic droit sur "Policies" et
choisissez "New Policy\..."

![[bios-uefi-Step_4.png]]

### Étape 5

![[bios-uefi-Step_5.png]]

### Étape 6

![[bios-uefi-Step_6.png]]
### Étape 7

![[bios-uefi-Step_7.png]]
### Étape 8

![[bios-uefi-Step_8.png]]

### Étape 9

![[bios-uefi-Step_9.png]]

### Étape 10

![[bios-uefi-Step_10.png]]


## Utiliser Windows Server 2008 (et antérieur) avec les options prédéfinies de fournisseur DHCP

Cela a été tenté **sans succès**. La configuration pour Server 2008 est
très similaire à Windows Server 2012. Vous créeriez une Vendor Class et
utiliseriez les mêmes identifiants de fournisseur que ceux utilisés pour Server 2012 et ISC-DHCP
ci-dessus, puis vous définiriez des options prédéfinies de fournisseur pour cette classe. L'idée
*supposée* est de coder en dur les options 066 et 067 dans votre
Vendor Class personnalisée, de pouvoir ensuite les configurer une fois créées
pour la classe, puis de les activer plus tard dans vos options de serveur ou
options d'étendue.

Cependant — **personne dans la communauté FOG n'a encore réussi avec cette
méthode.** Si vous l'avez fait fonctionner, **faites-le nous savoir** sur les forums.

Voici quelques images des étapes tentées sans succès, elles pourront peut-être
aider.

Faites un clic droit pour créer la vendor class. Configurez la classe avec le
vendor class identifier ciblé. Configurez des options prédéfinies pour la nouvelle
classe. Sélectionnez la bonne classe dans la liste déroulante et cliquez sur add.
Configurez une option 66 et 67. Une fois les options créées pour la classe,
vous pouvez définir leurs valeurs dans la fenêtre Predefined options and values.
Activez ces deux options sous l'onglet advanced des options d'étendue
ou des options de serveur.


![[bios-uefi-A._Create_DHCP_Vendor_Class.png]]

![[bios-uefi-B._Edit_Class.png]]

![[bios-uefi-C._Select_predefined_options.png]]

![[bios-uefi-D._Predefined_options_and_values.png]]

![[bios-uefi-E._Option_66.png]]

![[bios-uefi-F._Option_67.png]]

![[bios-uefi-G._Apply_Scope_Options.png]]

# Utiliser le DHCP d'OS X

> [!note]
> Le service DHCP de macOS Server (bootpd) a été rendu obsolète par Apple et n'est pas
> disponible sur les versions actuelles de macOS. Cette section est conservée pour référence.

Le DHCP de macOS Server peut fournir un next-server (option 66) et un unique nom de
fichier de démarrage (option 67), mais il ne prend **pas** en charge la logique conditionnelle
basée sur l'architecture dont FOG a besoin pour servir des fichiers de démarrage différents aux
clients BIOS et UEFI (comme le font ISC dhcpd, dnsmasq et le DHCP de Windows).

Si vous devez utiliser macOS comme DHCP dans un environnement mixte BIOS/UEFI, exécutez un
assistant proxyDHCP tel que dnsmasq à ses côtés pour fournir le fichier de démarrage — voir
[[proxy-dhcp|Proxy DHCP avec dnsmasq]]. Sinon, utilisez l'un des autres serveurs DHCP
couverts sur cette page.

## Construire des classes DHCP personnalisées pour la coexistence avec FOG

Il est possible et facile de configurer ISC-DHCP et Windows Server 2012 pour
prendre en charge en même temps, sur le même réseau, le démarrage réseau avec FOG et
les configurations d'autres appareils (comme des téléphones IP ou des produits
Apple). Il suffit d'utiliser Wireshark pour examiner la diffusion DHCP Request de
l'appareil et d'examiner son option 060. Ce sera une chaîne de caractères. Vous
créez ensuite une Vendor Class pour cet appareil et lui fournissez la
bonne option : sous Windows 066 et 067, sous ISC-DHCP next-server et
filename.

Dans les exemples ISC-DHCP pour les architectures IPXEClient, vous voyez **0, 20** ;
cela signifie commencer la comparaison de chaîne au caractère zéro et la terminer 20
caractères après le point de départ. Vous pouvez commencer à 15 ou même 20, mais
le chiffre suivant définit jusqu'où comparer.

Par exemple, les clients Legacy envoient ceci dans l'option 060 de leur DHCP Request :

    PXEClient:Arch:00000

Pour faire correspondre cette chaîne avec une classe, n'importe laquelle de ces lignes fonctionne :

    match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00000";

    match if substring(option vendor-class-identifier, 15, 5) = "00000";

    match if substring(option vendor-class-identifier, 19, 1) = "0";

Évidemment, moins vous utilisez d'éléments pour comparer, plus vous risquez que le
DHCP distribue des options incorrectes aux divers appareils de votre
réseau à cause de fausses correspondances.

Par exemple, cette ligne correspondrait (à tort) à l'option 060 du téléphone
IP ci-dessous :

match if substring(option vendor-class-identifier, 19, 1) =
"<font color="red">**0**</font>";

"Cisco VOIP phone
00<font color="red">**0**</font>562"

Elle correspondrait aussi à cette chaîne :

"PXEClient:Arch:0000<font color="red">**0**</font>"

Parce que le 20e caractère est un zéro, ce téléphone IP serait, avec la
configuration ci-dessus, mis en correspondance et recevrait les options définies au lieu
des options correctes. J'ai inventé cet exemple juste pour montrer la possibilité
d'une fausse correspondance de classe si la correspondance est trop limitée.

Dans le DHCP de Windows Server, on ne peut pas faire de correspondance comme dans ISC-DHCP,
mais on peut définir une valeur de chaîne de son choix lors de la création d'une
Vendor Class.
