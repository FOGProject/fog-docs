---
title: Paramètres du serveur DHCP
context_id: dhcp-server-settings
description: Les paramètres requis pour que votre serveur DHCP pointe vers fog lors du démarrage réseau
aliases:
    - DHCP Server Settings
    - Configuring DHCP Options 66 and 67
    - Other DHCP server than Fog
tags:
    - pxe
    - ipxe
    - dhcp
    - proxy
    - option-66
    - option-67
    - network
    - network-config
    - kea
    - isc-dhcp
    - linux
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/network-setup/dhcp-server-settings).

# Paramètres du serveur DHCP

Si vous n'utilisez pas FOG pour fournir les services DHCP de votre réseau (ce qui est une configuration très courante et entièrement prise en charge), vous devez alors configurer le serveur DHCP existant pour qu'il utilise fog comme serveur tftp d'où récupérer les fichiers de démarrage pxe, et vous devez configurer le fichier de démarrage à utiliser.

> [!info]
> Si vous n'avez pas accès à votre serveur DHCP, ou si vous utilisez un équipement incapable de spécifier les options 066 et 067 (next server et file name), vous pouvez utiliser ProxyDHCP à la place
> La méthode ProxyDHCP la plus populaire avec fog est dnsmasq. Cet article vous guidera dans cette démarche : [[proxy-dhcp|Proxy DHCP avec DNSMasq]]

> [!tip]
> Lorsque vous utilisez des pare-feu Palo Alto Networks comme serveur DHCP pour le démarrage PXE/iPXE, vous devrez peut-être configurer l'option DHCP 150 avec l'adresse IP du serveur FOG comme adresse TFTP/next-server. Dans certaines configurations Palo Alto, l'option 66 est traitée comme un nom/FQDN de serveur TFTP et peut ne pas suffire pour les clients PXE. Conservez l'option 67 définie sur le fichier de démarrage, par exemple `snponly.efi` pour les clients UEFI.

Ces deux options DHCP doivent être définies :

## Option 66

Définissez l'option 66, aussi appelée « Boot Server », « Next server » ou « TFTP Server », sur l'adresse IP ou le nom d'hôte du serveur FOG.

## Option 67

Définissez l'option 67, aussi appelée « Bootfile Name », sur le fichier de démarrage ipxe qui fonctionne le mieux dans votre environnement.
Pour les environnements UEFI modernes, l'un ou l'autre de ces fichiers offre la meilleure compatibilité (il suffit de saisir ce nom de fichier dans le paramètre dhcp)

* snponly.efi
* ipxe.efi

La plupart des clients récents pourront démarrer avec l'un des fichiers de démarrage efi ci-dessus, mais les modèles de matériel plus anciens qui n'ont pas de prise en charge UEFI et ne prennent en charge que le micrologiciel legacy BIOS ne démarreront pas. 

> [!tip]
> Si vous avez un environnement mixte, consultez [[bios-and-uefi-co-existence|Coexistence BIOS et UEFI]]

Pour les anciens modèles legacy, voici les fichiers de démarrage à définir

* undionly.kpxe
* undionly.kkpxe
* ipxe.kpxe
* ipxe.kkpxe

Vous pouvez trouver d'autres fichiers de démarrage pxe dans le répertoire `/tftpboot` de votre serveur fog.

### Les fichiers de démarrage `autoexec/` (UEFI uniquement)

En plus des fichiers ci-dessus, FOG fournit un second jeu de binaires UEFI dans
`/tftpboot/autoexec/`. Ils sont compilés à partir de sources identiques, avec une
différence : le script de démarrage iPXE n'est **pas** compilé dans le binaire. Au lieu
de cela, ils téléchargent un script en texte brut — `autoexec.ipxe` — via TFTP depuis le même
dossier d'où ils ont été chargés, et l'exécutent.

L'avantage pratique est que la logique de démarrage devient un fichier que vous pouvez modifier sur le
serveur. Changer quelque chose comme le délai d'attente du menu revient à modifier
`/tftpboot/autoexec/autoexec.ipxe`, pas à recompiler des binaires.

Pour les utiliser, préfixez le nom de fichier dans l'option 67 avec `autoexec/` :

* `autoexec/snponly.efi`
* `autoexec/ipxe.efi`
* `autoexec/i386-efi/snponly.efi`
* `autoexec/arm64-efi/snponly.efi`

L'option 66 ne change pas.

> [!warning]
> **Cela fonctionne uniquement pour les clients UEFI.** Les fichiers de démarrage legacy BIOS
> (`undionly.kpxe`, `undionly.kkpxe`, `ipxe.kpxe`, `ipxe.kkpxe`) ne peuvent pas l'utiliser.
> Le mécanisme qui récupère `autoexec.ipxe` n'existe que dans le chemin de démarrage EFI
> d'iPXE ; il n'y a pas d'équivalent BIOS, donc un binaire BIOS ignorerait simplement le
> fichier. C'est pourquoi aucun fichier de démarrage BIOS n'est fourni dans `autoexec/` — une copie à cet endroit
> démarrerait, mais uniquement parce qu'elle contient toujours le script compilé, ce qui donne
> l'impression que le mécanisme fonctionne pour le BIOS alors que ce n'est pas le cas.
>
> Dans un environnement mixte, gardez les clients BIOS pointés vers la racine
> (`undionly.kpxe`) et utilisez `autoexec/` uniquement pour les classes UEFI.

Les deux jeux sont installés et maintenus en phase l'un avec l'autre. Les fichiers à la racine
de `/tftpboot` restent la valeur par défaut et sont ce qu'utilise toute installation FOG existante ;
`autoexec/` est optionnel et se comporte de manière identique par ailleurs. Si vous n'êtes pas sûr
de ce que vous voulez, utilisez les fichiers de la racine.

## Exemples de configurations de serveurs DHCP

Voici quelques exemples avec captures d'écran sur la façon de configurer ces paramètres sur certains serveurs.
Les captures d'écran sont un peu anciennes mais l'idée générale reste la même sur les versions modernes

### Serveur DHCP Linux dédié (Kea)

Si vous exécutez un **serveur [Kea DHCP](https://kea.readthedocs.io/) dédié** (distinct de votre serveur FOG), vous pouvez servir le bon fichier de démarrage à chaque architecture cliente (legacy BIOS vs UEFI vs ARM64) en classifiant les clients selon la chaîne vendor-class PXE. C'est la même approche que FOG utilise lorsqu'il héberge lui-même le DHCP, c'est donc la configuration la plus éprouvée.

> [!tip]
> Lorsque vous exécutez l'installateur FOG et répondez **No** à « Would you like to use the FOG server for DHCP service », FOG écrit désormais un exemple prêt à copier dans `kea-dhcp4.conf.fog-sample` à la racine web de FOG (par exemple `/var/www/html/fog/kea-dhcp4.conf.fog-sample`) avec `next-server` déjà défini sur votre serveur FOG. Copiez ce fichier sur votre serveur Kea en tant que `/etc/kea/kea-dhcp4.conf` et modifiez les valeurs spécifiques au réseau ci-dessous.

Un `kea-dhcp4.conf` complet pour un serveur Kea dédié :

```json
{
    "Dhcp4": {
        "interfaces-config": { "interfaces": [ "eth0" ] },
        "lease-database": { "type": "memfile", "lfc-interval": 3600 },
        "valid-lifetime": 21600,
        "max-valid-lifetime": 43200,

        "next-server": "10.0.0.10",
        "option-data": [
            { "name": "tftp-server-name", "data": "10.0.0.10" }
        ],

        "subnet4": [
            {
                "id": 1,
                "subnet": "10.0.0.0/24",
                "pools": [ { "pool": "10.0.0.100 - 10.0.0.250" } ],
                "option-data": [
                    { "name": "subnet-mask", "data": "255.255.255.0" },
                    { "name": "routers", "data": "10.0.0.1" },
                    { "name": "domain-name-servers", "data": "10.0.0.2" }
                ]
            }
        ],

        "client-classes": [
            {
                "name": "FOG-Legacy-BIOS",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00000'",
                "boot-file-name": "undionly.kkpxe"
            },
            {
                "name": "FOG-UEFI-32-2",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00002'",
                "boot-file-name": "i386-efi/snponly.efi"
            },
            {
                "name": "FOG-UEFI-32-1",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00006'",
                "boot-file-name": "i386-efi/snponly.efi"
            },
            {
                "name": "FOG-UEFI-64-1",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00007'",
                "boot-file-name": "snponly.efi"
            },
            {
                "name": "FOG-UEFI-64-2",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00008'",
                "boot-file-name": "snponly.efi"
            },
            {
                "name": "FOG-UEFI-64-3",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00009'",
                "boot-file-name": "snponly.efi"
            },
            {
                "name": "FOG-UEFI-ARM64",
                "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00011'",
                "boot-file-name": "arm64-efi/snponly.efi"
            },
            {
                "name": "FOG-Surface-Pro-4",
                "test": "substring(option[60].hex,0,32) == 'PXEClient:Arch:00007:UNDI:003016'",
                "boot-file-name": "snponly.efi"
            }
        ]
    }
}
```

**Ce qu'il faut changer pour votre réseau** (tout le reste peut rester tel quel) :

| Valeur | À définir sur |
| --- | --- |
| `interfaces` (`eth0`) | La carte réseau sur laquelle votre serveur Kea écoute (ou `"*"` pour toutes) |
| `next-server` et `tftp-server-name` (`10.0.0.10`) | L'adresse IP de votre **serveur FOG** |
| `subnet` / `pools` (`10.0.0.0/24`, plage du pool) | Le réseau et la plage de baux que vous servez |
| `routers` (`10.0.0.1`) | La passerelle de votre réseau |
| `domain-name-servers` (`10.0.0.2`) | Votre ou vos serveurs DNS |

Les valeurs de `boot-file-name` (`undionly.kkpxe`, `snponly.efi`, `i386-efi/snponly.efi`, `arm64-efi/snponly.efi`) sont les binaires iPXE standard que FOG fournit dans `/tftpboot` — laissez-les tels quels. Les `client-classes` s'appuient sur l'option DHCP 60 (la chaîne vendor-class PXE `PXEClient:Arch:NNNNN`) afin que chaque architecture reçoive automatiquement le bon binaire.

> [!note]
> Le netboot Apple Intel (BSDP) n'est **pas** pris en charge par Kea. Si vous devez démarrer en réseau des Mac Intel, gardez-les sur un serveur ISC-DHCP (la configuration ISC de FOG inclut toujours la classe BSDP).

Après modification, validez le fichier avant de démarrer le service :

```bash
kea-dhcp4 -t /etc/kea/kea-dhcp4.conf
```

> [!tip]
> Vous préférez ISC-DHCP ou l'utilisez déjà ? Un `dhcpd.conf` ISC dédié utilise la même idée avec des blocs `class`/`filename` (`match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00007"`). La référence la plus simple est le `/etc/dhcp/dhcpd.conf` que FOG génère lorsqu'il héberge le DHCP — copiez ses blocs `subnet` et `class` sur votre serveur dédié et changez `next-server` en l'IP de votre serveur FOG.

### DHCP de Windows Server

#### Définir les options avec powershell

Ce petit extrait powershell récupérera toutes les étendues de votre serveur dhcp et définira l'option 66 et l'option 67 sur les valeurs que vous saisissez dans le script.
> [!note]
> Cela nécessite le module dhcp qui est installé sur un serveur lorsque le rôle dhcp est ajouté. Vous pouvez aussi l'ajouter à votre poste de travail windows en installant les outils rsat, et bien sûr cela nécessite également des privilèges administrateur pour gérer les options du serveur dhcp.
> Ce script définira les options au niveau des étendues/sous-réseaux plutôt qu'au niveau global du serveur

```powershell
#define your dhcp server hostname or ip
$dhcpSvr = 'dhcp.yourDomain.tld'
#define your fog server fqdn, hostname, or ip
$fogAddr = 'fogserver.yourDomain.tld'
#define you pxe boot file
$pxeBootFile = 'snponly.efi'

#get all the scopes from the main dhcp server and expand to the nested ipAddressToString property of the scopeIDs to get a string array of scope ids`

$scopes = (Get-DhcpServerv4Scope -ComputerName $dhcpSvr).scopeID.ipaddresstostring

#loop through all dhcp scopes and add the options
$scopes | Foreach-object {
	$dhcpOptions = @{
        ComputerName = $dhcpSvr;
        ScopeId = $_
	}
	Set-DhcpServerv4OptionValue @dhcpOptions -OptionID 66 -value $fogAddr;
    Set-DhcpServerv4OptionValue @dhcpOptions -OptionID 67 -value $pxeBootFile;
}

```



#### Définir les options dans la console dhcp

Vous pouvez accéder aux options de serveur ou d'étendue de votre serveur dhcp dans `dhcpmgmt.msc` et les définir comme suit

- Option 66
> [!tip]
> Cela peut être l'adresse IP, le nom d'hôte ou le nom de domaine pleinement qualifié (fqdn) de votre serveur fog.


![[windows-66.png]]

-   Option 67
![[Windows_67.png]]

### DHCP de serveur Novell (Linux)

-   Vue d'ensemble DHCP depuis la console DNS/DHCP (Netware 6.5)
  ![[Novelldhcp.gif]]
-   Option 66
  ![[Novelloption66.gif]]
-   Option 67
  ![[Novelloption67.gif]]
Voici un lien du site web de Novell sur la façon de configurer leur serveur DHCP :
<http://www.novell.com/coolsolutions/feature/17719.html>

<!-- ### MAC Server DHCP

Use OS X Server app to install and utilize DHCP.

Use DHCP Option Code Utility to generate the code necessary.
<https://docs.google.com/uc?id=0BwD4il5Z1G6fTmFFYU91bDNuRmc&export=download>\
\
One MUST generate the codes in order for PXE booting to work!\
bootpd.plist is located in /etc/bootpd.plist\
\
\*Option 66

-   -   ![[MACOption66.png]]

-   Option 67
    -   ![[MACOption67.png]]

\
\*Sample [bootpd.plist](bootpd.plist "wikilink")\
\*\* This is a sample file DO NOT USE THIS IN YOUR ENVIRONMENT!!!! OS X
Server app will generate most of this code for you, this example file is
to show you the place where the generated code needs to be placed.\
\*\*For Reference, your generated code should be placed between
\"dhcp_domain_search\" and \"dhcp_router\"\
\
Completed Bootpd.plist\
![[MACbootpd.png]] -->
