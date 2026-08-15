---
title: Proxy DHCP avec dnsmasq
description: Configuration d'un service proxy DHCP comme dnsmasq pour utiliser FOG comme serveur de démarrage PXE
context_id: proxy-dhcp
aliases:
    - Proxy DHCP with dnsmasq
    - Proxy DHCP using DNSMasq
    - Using FOG with an unmodifiable DHCP server
    - Proxy DHCP
    - installation/network-setup/legacy-proxy-dhcp
tags:
    - pxe
    - ipxe
    - dhcp
    - proxy
    - proxy-dhcp
    - option-66
    - option-67
    - advanced-configuration
    - network
    - network-config
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/network-setup/proxy-dhcp).

# Proxy DHCP avec dnsmasq

> [!important] Changements de fichiers de démarrage dans FOG 1.6
> Le fonctionnement de dnsmasq en tant que serveur proxyDHCP est **inchangé** entre FOG 1.5.x et
> 1.6 — il fournit toujours au client un next-server (l'adresse IP de votre serveur FOG) et un nom
> de fichier de démarrage via TFTP. Ce qui a changé en 1.6, c'est **quel** fichier de démarrage FOG
> attend des clients UEFI. Le tableau ci-dessous liste les anciens et nouveaux noms de fichiers ;
> les exemples de cette page utilisent déjà les noms de la version 1.6.

| Type de client | Arch DHCP | Fichier de démarrage FOG 1.5.x | **Fichier de démarrage FOG 1.6** | **Secure Boot 1.6** |
| --- | --- | --- | --- | --- |
| BIOS / legacy | `00000` | `undionly.kpxe` | `undionly.kkpxe` | n/a — pas de Secure Boot en mode BIOS |
| UEFI 32 bits | `00006` | `i386-efi/ipxe.efi` | `i386-efi/snponly.efi` | **impossible** — voir ci-dessous |
| UEFI 64 bits | `00007`/`00008`/`00009` | `ipxe.efi` | `snponly.efi` | `secureboot/snponly-shimx64.efi` |
| UEFI ARM64 | `00011` | — | `arm64-efi/snponly.efi` | `secureboot/arm64-efi/snponly-shimaa64.efi` |

FOG 1.6 a standardisé les binaires `snponly.efi` à pilote SNP, qui sont bien plus
fiables sur les firmwares UEFI modernes que l'ancien `ipxe.efi` à pilote UNDI. Ce sont
exactement les noms de fichiers que l'installateur de FOG 1.6 configure pour son propre
serveur DHCP ISC/Kea, ce sont donc les bonnes valeurs à mettre aussi dans votre configuration
dnsmasq. Tous ces fichiers sont livrés dans `/tftpboot` sur un serveur 1.6.

Si certains de vos clients ont le Secure Boot activé, lisez
[Secure Boot et proxyDHCP](#secure-boot-et-proxydhcp) avant de choisir quelle
colonne utiliser — en résumé, les fichiers Secure Boot peuvent être fournis sans risque à
*tous* les clients UEFI 64 bits, que le Secure Boot soit activé ou non.

## Les rôles de dnsmasq dans FOG

**Du point de vue de FOG**, dnsmasq est utilisé lorsqu'il existe déjà un service DHCP sur le réseau qui doit continuer à être utilisé et ne peut pas être modifié pour prendre en charge FOG. dnsmasq est une forme de Proxy DHCP. Il écoute les requêtes DHCP (des machines) et les réponses (du service DHCP). Lorsqu'une requête et une réponse sont détectées, dnsmasq « complète » la réponse. Pour son rôle dans FOG, il ajoute les options next-server et nom de fichier. Elles sont connues sous Windows comme les options DHCP 066 et 067.

Les scénarios idéaux pour dnsmasq incluent :


> [!Info] 
> -   Lorsque vous ne voulez pas ou ne pouvez pas désactiver les services DHCP d'un équipement réseau grand public (comme un appareil fourni par un FAI ou un appareil d'entrée de gamme acheté en magasin)
> -   Lorsque vous ne voulez pas ou ne pouvez pas exécuter DHCP sur votre serveur FOG.
> -   Lorsque vous n'avez pas l'accès ou la permission de modifier le service DHCP sur votre lieu de travail.
> -   Lorsque les modifications du service DHCP de votre employeur seraient trop complexes à réaliser.
> -   Lorsque des erreurs dans la configuration du service DHCP de votre employeur pourraient provoquer une panne réseau indésirable, non planifiée ou inattendue.
> -   Lorsque vous voulez que votre serveur FOG soit portable.


## Fonctionnement du ProxyDHCP

1.  Lorsqu'un client PXE démarre, il envoie une diffusion DHCP Discover sur le réseau, qui inclut la liste des informations que le client souhaite obtenir du serveur DHCP, ainsi que des informations l'identifiant comme un périphérique compatible PXE.
2.  Un serveur DHCP classique répond par un DHCP Offer, qui contient des valeurs possibles pour les paramètres réseau demandés par le client. Généralement une adresse IP possible, un masque de sous-réseau, une adresse de routeur (passerelle), un nom de domaine DNS, etc.
3.  Comme le client s'est identifié en tant que PXEClient, le serveur proxyDHCP répond lui aussi par un DHCP Offer avec des informations supplémentaires, mais sans informations d'adresse IP. Il laisse l'attribution d'adresse IP au serveur DHCP classique. Le serveur proxyDHCP fournit les valeurs next-server-name et nom de fichier de démarrage, qui seront utilisées par le client lors de la transaction TFTP à venir.
4.  Le client PXE répond au DHCP Offer par un DHCP Request, dans lequel il demande officiellement les informations de configuration IP au serveur DHCP classique.
5.  Le serveur DHCP classique répond par un ACK (accusé de réception), indiquant au client qu'il peut utiliser les informations de configuration IP demandées.
6.  Le client dispose maintenant de ses informations de configuration IP, du nom du serveur TFTP et du nom du fichier de démarrage, et il lance une transaction TFTP pour télécharger le fichier de démarrage.

  

## Installer dnsmasq sur CentOS 7

Référence : [https://forums.fogproject.org/topic/6376/install-dnsmasq-on-centos-7](https://forums.fogproject.org/topic/6376/install-dnsmasq-on-centos-7)

La mise en place de DNSMasq sur CentOS 7 est assez simple et peut se faire en une dizaine de minutes.

Cas d'usage :

1.  Vous n'avez pas d'accès administrateur au serveur DHCP de votre sous-réseau/réseau (comme un routeur géré par un FAI)
2.  Votre serveur DHCP est un serveur basique, comme celui que l'on trouve dans un routeur internet grand public.

Voici les étapes nécessaires pour installer dnsmasq sur votre serveur FOG sous CentOS 7

1.  Assurez-vous que CentOS est à jour

`yum upgrade -y`

2.  Installez le service

`yum install dnsmasq -y`

3.  Créez un fichier de configuration pour votre serveur FOG

`vi /etc/dnsmasq.d/ltsp.conf` (astuce : je suis de la vieille école et j'utilise exclusivement vi, vous pouvez utiliser l'éditeur de votre choix)

4.  Collez les paramètres suivants
## Paramètres LTSP de dnsmasq

```
# Don't function as a DNS server:
port=0

# Log lots of extra information about DHCP transactions.
log-dhcp

# Set the root directory for files available via FTP.
tftp-root=/tftpboot

# The default boot filename (BIOS / legacy), Server name, Server Ip Address
dhcp-boot=undionly.kkpxe,,<fog_server_IP>

# Disable re-use of the DHCP servername and filename fields as extra
# option space. That's to avoid confusing some old or broken DHCP clients.
dhcp-no-override

# inspect the vendor class string and match the text to set the tag
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009

# Set the boot file name based on the matching tag from the vendor class (above).
# FOG 1.6 uses the snponly.efi (SNP driver) binaries for UEFI.
dhcp-boot=net:UEFI32,i386-efi/snponly.efi,,<fog_server_IP>
dhcp-boot=net:UEFI,snponly.efi,,<fog_server_IP>
dhcp-boot=net:UEFI64,snponly.efi,,<fog_server_IP>

# PXE menu.  The first part is the text displayed to the user. 
# The second is the timeout, in seconds.
pxe-prompt="Booting FOG Client", 1

# The known types, IN THE ORDER DNSMASQ NUMBERS THEM, are x86PC(0), PC98(1),
# IA64_EFI(2), Alpha(3), Arc_x86(4), Intel_Lean_Client(5), IA32_EFI(6),
# x86-64_EFI(7), Xscale_EFI(8), BC_EFI(9), ARM32_EFI(10), ARM64_EFI(11).
# NOTE: dnsmasq's names for 7 and 9 are the reverse of RFC 4578, where 7 is
# "EFI BC" and 9 is "EFI x86-64". Most 64-bit UEFI firmware reports arch 7,
# which dnsmasq calls x86-64_EFI -- NOT BC_EFI. Getting this backwards means
# your rule silently never matches. dnsmasq also accepts the bare number, which
# is unambiguous, so prefer that if you are unsure.
#
# THE TRAILING SERVER IP IS REQUIRED. Given a bare filename, dnsmasq announces
# ITSELF as the boot server and only works if it is also running a TFTP server
# (enable-tftp). This config is not -- so without the IP the client performs PXE
# boot server discovery, gets no usable answer, and dies with
# "PXEBS ... Connection timed out" while dnsmasq's log cheerfully shows the
# right filename being offered. Naming the FOG server sends it to FOG's tftpd.
# This option is first and will be the default if there is no input from the user.
pxe-service=X86PC, "Boot to FOG", undionly.kkpxe, <fog_server_IP>
pxe-service=X86-64_EFI, "Boot to FOG UEFI", snponly.efi, <fog_server_IP>
pxe-service=BC_EFI, "Boot to FOG UEFI PXE-BC", snponly.efi, <fog_server_IP>

dhcp-range=<fog_server_ip>,proxy
```

**Vous devez remplacer les valeurs <fog_server_ip> par l'adresse IP exacte de votre serveur FOG.**

> [!warning] `pxe-service` prime sur `dhcp-boot` pour les clients UEFI
> Lorsqu'exactement une ligne `pxe-service` correspond à l'architecture d'un client UEFI,
> dnsmasq lui répond à partir de cette ligne et **ignore entièrement les règles `dhcp-boot`**.
> Si vous changez un fichier de démarrage UEFI et que rien ne se passe, vous avez presque
> certainement modifié `dhcp-boot` alors que c'est la ligne `pxe-service` qui est utilisée.
> Modifiez les deux, et gardez-les cohérentes.

10.  Redémarrez le service dnsmasq

`systemctl restart dnsmasq.service`

12.  Puis assurez-vous que le service dnsmasq démarre à chaque démarrage du système.

systemctl enable dnsmasq.service

Pour les adeptes du copier-coller comme moi, voici la version condensée.

```
yum upgrade -y
yum install dnsmasq -y
vi /etc/dnsmasq.d/ltsp.conf
<insert text>
<update settings in text>

systemctl restart  dnsmasq.service
systemctl enable dnsmasq.service
```

## Le client télécharge iPXE mais n'arrive pas à joindre FOG

Le seul travail de dnsmasq est d'amener le client à télécharger via TFTP le binaire iPXE
(`undionly.kkpxe` / `snponly.efi`). Ensuite, le binaire iPXE charge en chaîne
`tftp://<fog_server_IP>/default.ipxe`, qui charge à son tour le script de démarrage de votre
serveur FOG via HTTP/HTTPS. Si le client charge iPXE mais se bloque
ou renvoie une erreur en contactant FOG, la configuration dnsmasq est généralement correcte et le
problème se situe en aval :

> [!note] FOG 1.6 + HTTPS
> Si vous avez répondu **oui** à l'activation du HTTPS pendant l'installation de FOG 1.6, le serveur
> web est configuré pour rediriger tout le trafic HTTP vers HTTPS (plus HSTS). L'installateur
> reconstruit les binaires iPXE pour qu'ils fassent confiance au certificat de votre serveur afin que
> le chargement en chaîne HTTPS fonctionne, mais cela ne concerne que les binaires servis depuis le
> `/tftpboot` de ce serveur. Assurez-vous que le `tftp-root` de dnsmasq pointe vers le `/tftpboot` du
> serveur FOG (ou que les fichiers en sont copiés), et non vers un jeu de binaires plus ancien ou
> compilé à la main — sinon le chargement en chaîne HTTPS échouera avec une
> erreur de certificat après le chargement d'iPXE.

## Servir le ProxyDHCP à plusieurs sous-réseaux

Si vous servez le ProxyDHCP à plusieurs sous-réseaux, des modifications doivent être apportées à
vos commutateurs/routeurs et à la configuration de votre serveur :

1.  Ajoutez un masque de sous-réseau à votre ligne `dhcp-range`, par exemple en changeant
    `dhcp-range=<fog_server_ip>,proxy` en
    `dhcp-range=<fog_server_ip>,proxy,255.255.0.0` pour servir tous les sous-réseaux
    `192.168.x.x`. Utilisez `255.0.0.0` (8 bits) pour l'adressage `10.x.x.x`, ou
    `255.240.0.0` (12 bits) pour `172.16.x.x`. Définissez le masque de façon à couvrir chaque
    sous-réseau auquel le ProxyDHCP doit répondre — sans cela, le serveur ProxyDHCP
    ne répondra pas aux requêtes des machines hors de son propre sous-réseau.
2.  Ajoutez un enregistrement IP Helper / relais DHCP sur votre routeur ou commutateur afin que les
    diffusions DHCP soient envoyées à la fois à votre serveur DHCP habituel et au serveur FOG.

## Secure Boot et proxyDHCP

### Non, DHCP ne peut pas détecter le Secure Boot — et il n'en a pas besoin

Un premier réflexe courant est de vouloir que dnsmasq remarque qu'un client a le Secure Boot
activé et lui fournisse un binaire signé, en envoyant à tous les autres le binaire ordinaire.
**Ce n'est pas possible.** La requête DHCP du client provient du firmware avant
qu'aucun système d'exploitation n'existe, et elle ne contient aucune indication de l'état du Secure Boot.
L'option 93 (`PXEClient:Arch:NNNNN`) ne rapporte que l'*architecture* du client —
BIOS, UEFI 32 bits, UEFI 64 bits, ARM64. Il n'existe aucune option, classe fournisseur ou
classe utilisateur qui indique si le Secure Boot est activé, et aucun serveur proxyDHCP,
quel qu'il soit, ne peut le déduire.

La raison pour laquelle cela n'a pas d'importance est que **la chaîne signée fonctionne que le Secure
Boot soit activé ou non.** `shim` est une application UEFI ordinaire qui se trouve
porter une signature Microsoft. Avec le Secure Boot activé, le firmware le vérifie et
il vérifie ce qu'il charge ensuite ; avec le Secure Boot désactivé, le firmware ne vérifie
rien et shim n'impose rien non plus. Il démarre, tout simplement.

La bonne configuration n'est donc pas conditionnelle — elle consiste à pointer **tous** les
clients UEFI 64 bits et ARM64 vers les fichiers Secure Boot, sans condition. Cet ensemble
est un surensemble : il couvre les machines en Secure Boot et ne coûte rien aux autres.

### La configuration optimale

```
# Architecture tags, as above.
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009
dhcp-vendorclass=ARM64,PXEClient:Arch:00011

# BIOS clients: Secure Boot does not exist in BIOS/CSM mode, so this is
# unchanged.
dhcp-boot=net:BIOS,undionly.kkpxe,,<fog_server_IP>

# 64-bit UEFI and ARM64: always the shim chain, Secure Boot on or off.
dhcp-boot=net:UEFI,secureboot/snponly-shimx64.efi,,<fog_server_IP>
dhcp-boot=net:UEFI64,secureboot/snponly-shimx64.efi,,<fog_server_IP>
dhcp-boot=net:ARM64,secureboot/arm64-efi/snponly-shimaa64.efi,,<fog_server_IP>

# 32-bit UEFI: unsigned, and it cannot be otherwise. See below.
dhcp-boot=net:UEFI32,i386-efi/snponly.efi,,<fog_server_IP>

# Remember that for UEFI clients these pxe-service lines, not the dhcp-boot
# rules above, are what actually decides the file. Keep them in agreement.
pxe-prompt="Booting to FOG", 1
pxe-service=X86PC, "Boot to FOG", undionly.kkpxe, <fog_server_IP>
pxe-service=IA32_EFI, "Boot to FOG", i386-efi/snponly.efi, <fog_server_IP>
pxe-service=x86-64_EFI, "Boot to FOG", secureboot/snponly-shimx64.efi, <fog_server_IP>
pxe-service=BC_EFI, "Boot to FOG", secureboot/snponly-shimx64.efi, <fog_server_IP>
pxe-service=ARM64_EFI, "Boot to FOG", secureboot/arm64-efi/snponly-shimaa64.efi, <fog_server_IP>

dhcp-range=<fog_server_ip>,proxy
```

Les architectures 7 et 9 sont toutes deux listées parce que les firmwares ne s'accordent pas sur
laquelle signifie « UEFI 64 bits » — la plupart rapportent 7, certains rapportent 9. Pointez les deux
vers le même fichier et ce désaccord cesse d'avoir de l'importance.

### Pourquoi le fichier de démarrage nomme le shim et non le chargeur

`secureboot/snponly-shimx64.efi` et `secureboot/ipxe-shimx64.efi` sont le
**même binaire signé**, mis en place sous deux noms — vous pouvez le confirmer à partir des
valeurs sha256 dans `/tftpboot/secureboot/MANIFEST`. C'est le `ipxe/shim` amont,
signé par Microsoft.

Le nom reste important, car ipxe/shim embarque un correctif qui retire l'infixe
`-shim<arch>` du chemin depuis lequel il a lui-même été récupéré et charge *ce*
fichier depuis le même répertoire. Le fichier que vous nommez dans DHCP choisit donc le
chargeur :

| Fichier de démarrage DHCP | shim charge ensuite | iPXE utilise |
| --- | --- | --- |
| `secureboot/snponly-shimx64.efi` | `secureboot/snponly.efi` | le pilote SNP UEFI du firmware |
| `secureboot/ipxe-shimx64.efi` | `secureboot/ipxe.efi` | les pilotes réseau intégrés d'iPXE |

Commencez par le nom `snponly`. **Si la chaîne se charge mais que le réseau ne monte
jamais, l'implémentation SNP du firmware est en cause — remplacez le nom de fichier DHCP
par `secureboot/ipxe-shimx64.efi`.** C'est un changement uniquement côté DHCP ; rien n'est
renommé sur le serveur.

### L'UEFI 32 bits ne peut pas faire de Secure Boot avec FOG

Il n'existe pas de shim 32 bits signé par Microsoft ni d'iPXE 32 bits signé, il n'y a donc
rien de signé vers quoi pointer un client UEFI ia32. Ces machines doivent avoir le Secure
Boot **désactivé** pour démarrer par le réseau. FOG refuse catégoriquement l'enrôlement Secure Boot
sur elles plutôt que de le faire à moitié, et la 1.6 masque l'entrée « Enroll Secure Boot
Key » du menu de démarrage pour les clients ayant démarré en mode BIOS/CSM, pour la même
raison : une option qui ne peut pas réussir ne devrait pas être proposée.

> [!warning] Secure Boot et HTTPS sont mutuellement exclusifs
> Une installation FOG en HTTPS reconstruit iPXE localement pour que le binaire fasse confiance à
> l'autorité de certification de votre serveur. Un binaire signé ne peut pas être reconstruit sans
> détruire sa signature ; les binaires Secure Boot sont donc les binaires génériques amont et ne
> peuvent pas embarquer votre CA. Utilisez l'un ou l'autre, pas les deux.

> [!important] Le fichier de démarrage n'est que la moitié du Secure Boot
> Faire charger un iPXE signé est la partie contrôlée par dnsmasq. Le noyau FOS que FOG
> démarre ensuite doit aussi être approuvé par la machine, ce qui est une étape de
> configuration distincte — voir [Signature Secure Boot](../../kb/how-tos/secure-boot-signing.md).
> Une configuration DHCP correcte avec un noyau non approuvé vous donne un iPXE signé,
> puis un échec une étape plus loin.

## Techniques dnsmasq avancées

Référence : [https://forums.fogproject.org/topic/8726/advanced-dnsmasq-techniques](https://forums.fogproject.org/topic/8726/advanced-dnsmasq-techniques)

Supposons maintenant que nous ayons un ordinateur qui ne démarre pas avec le fichier snponly.efi par défaut, mais qui nécessite le noyau de démarrage alternatif intel.efi. Nous allons ajouter un peu de dynamique à notre script ci-dessus afin que, pour tous les ordinateurs sauf notre modèle spécifique, snponly.efi soit envoyé au client, et que lorsque nous démarrons en PXE notre client spécifique, intel.efi soit envoyé uniquement à cet ordinateur.

Je dois toutefois émettre une réserve ici. Le champ uuid « devrait » représenter le type de périphérique du modèle et non le périphérique individuel et unique (nous pourrions utiliser l'adresse MAC pour cela). Je n'ai pas testé des ordinateurs de même modèle pour voir si l'uuid correspond exactement. Je vois des références indiquant que ce champ contient deux parties, les bits uuid et guid. Nous devrons peut-être les analyser si je constate que ces numéros ne sont pas spécifiques au modèle.

Dans le script ci-dessus, nous allons ajouter un nouveau test de correspondance de motif juste sous la correspondance de classe fournisseur. Modifiez le script ci-dessus pour qu'il ressemble à cet extrait.

### Inspecter la chaîne de classe fournisseur et faire correspondre le texte pour définir le tag

```
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009
```

```
# UUID for a Dell e6230 I tested (this info was gleaned from the dnsmasq log file that 
# recorded a pxe boot session of this target computer
dhcp-match=set:e6230,97,00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31
```

Ce que fait cette commande dhcp-match : elle met le drapeau e6230 à TRUE si l'option DHCP 97 {identifiant client uuid/guid} correspond à « 00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31 ». Maintenant, si nous déterminons qu'une sous-section de ce champ uuid suffit à identifier le client, nous pourrions raccourcir ce motif de correspondance à, disons, « 00:44:45:4c:4c:38:00:10:36 » si cela identifie correctement le e6230 (je ne le sais tout simplement pas pour l'instant).

Maintenant que nous avons la commande de correspondance, nous devons en faire quelque chose. C'est là qu'intervient la ligne suivante. Nous allons ajouter une autre ligne dhcp-boot. Je vais d'abord mentionner une ligne dhcp-boot que nous n'allons PAS utiliser, et pourquoi. Cette ligne est proche de ce que nous voulons dans le fichier de configuration

	dhcp-boot=tag:e6230,intel.efi,192.168.112.24 192.168.112.24

Pour décoder cette ligne, il y a un test conditionnel : si (tag:e6230 == true) alors envoyer « intel.efi » depuis le serveur tftp suivant 192.168.112.24. Donc si notre motif ci-dessus correspond et met le tag e6230 à vrai, alors intel.efi est envoyé.

La raison pour laquelle nous **ne voulons pas utiliser celle-ci** est qu'elle correspondra tant que l'uuid est le même. Cela signifie que le nom de fichier de démarrage intel.efi sera envoyé que l'ordinateur soit en mode UEFI ou en mode BIOS (legacy). Pour corriger ce comportement, nous allons ajouter un autre test conditionnel qui crée une condition ET. Ce que nous voulons, c'est envoyer le nom de fichier intel.efi si les drapeaux e6230 et UEFI sont tous deux définis. Cette ligne dhcp-boot ressemblerait à ceci :

	dhcp-boot=tag:UEFI,tag:e6230, intel.efi, 192.168.112.24, 192.168.112.24

Cette ligne correspondra donc lorsque le tag UEFI est vrai (défini par la correspondance de classe fournisseur « dhcp-vendorclass=UEFI,PXEClient:Arch:00007 ») et que le tag e6230 est vrai.

Rappelez-vous, j'ai dit plus haut que l'ordre des lignes dhcp-boot semble important. La dernière correspondance l'emporte, nous voulons donc placer cette nouvelle ligne dhcp-boot en bas de la liste. En ajoutant cette ligne, notre fichier de configuration ltsp complet ressemblera à ceci.
```
port=0

# Log lots of extra information about DHCP transactions.
log-dhcp

# Set the root directory for files available via FTP.
tftp-root=/tftpboot

# Disable re-use of the DHCP servername and filename fields as extra
# option space. That's to avoid confusing some old or broken DHCP clients.
dhcp-no-override

# inspect the vendor class string and match the text to set the tag
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009

#UUID for a Dell e6230 I tested (this info was gleaned from the dnsmasq log file that recorded
# a pxe boot session of this target computer
dhcp-match=set:e6230,97,00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31

# Set the boot file name based on the matching tag from the vendor class (above)
dhcp-boot=net:UEFI32,i386-efi/snponly.efi,,192.168.112.24
dhcp-boot=net:UEFI,snponly.efi,,192.168.112.24
dhcp-boot=net:UEFI64,snponly.efi,,192.168.112.24

# Our test to ensure both the UEFI and e6230 tags are set. 
dhcp-boot=tag:UEFI,tag:e6230, intel.efi, 192.168.112.24, 192.168.112.24

# The default boot filename (BIOS / legacy), Server name, Server Ip Address
dhcp-boot=undionly.kkpxe,,192.168.112.24

# PXE menu.  The first part is the text displayed to the user.  The second is the timeout, in seconds.
pxe-prompt="Booting FOG Client", 1

dhcp-range=192.168.112.24,proxy
```
Enregistrez le fichier et quittez l'éditeur. Puis redémarrez le service dnsmasq.

Cela fait un moment que j'ai publié ceci. Ces connaissances, ici et ci-dessus, ont été glanées au fil de recherches Google et d'essais-erreurs (la méthode du hacker) pour aboutir à ce qui précède. Je suis sûr qu'une bonne partie de ce fil est inexacte et que le reste est complètement faux. Ces informations sont le contenu que j'ai pu compiler au cours des 2 derniers jours de tests. Si vous découvrez qu'une information de ce fil est inexacte, envoyez-moi un message privé et je l'intégrerai dans ce document.

Un fait intéressant que j'ai découvert en étudiant la commande dhcp-match pour l'option DHCP 97 : pour les ordinateurs Dell, la chaîne uuid « 00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31 », si vous ignorez les 8 premiers bits [00] (c'est-à-dire en regardant simplement 44:45:4c:4c), épelle « dell » en ASCII hexadécimal.

### Problèmes de filtre de correspondance

Ce dernier billet porte sur les difficultés que j'ai rencontrées en essayant de construire le filtre de correspondance. Je savais d'expérience qu'il existait un champ uuid et que ces données étaient envoyées avec la requête DHCP initiale. J'ai vu cette information pour la première fois en démarrant en PXE un ordinateur cible en mode BIOS (legacy). Elle s'affiche à l'écran avec l'adresse du serveur DHCP, l'IP de l'ordinateur cible, le masque de réseau et les informations de passerelle. Mais elle défile généralement si vite qu'il est difficile de la noter tant elle est longue.

J'ai fait quelques recherches sur ce champ d'option DHCP (97 client-identifier) et voici ce que j'ai trouvé dans la RFQ qui décrit ces champs DHCP. Voici un extrait de la rfq (notez que ce n'est pas ma propriété intellectuelle, seulement une reproduction de la RFC-4361 originale [https://tools.ietf.org/html/rfc4361](https://tools.ietf.org/html/rfc4361))

   DHCPv4 clients that support more than one network interface SHOULD
   use the same DUID on every interface.  DHCPv4 clients that support
   more than one network interface SHOULD use a different IAID on each
   interface.

J'ai eu quelques difficultés à obtenir le motif de correspondance exact (inséré correctement ci-dessous).

	dhcp-match=set:e6230,97,00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31

Ma première tentative de texte à faire correspondre provenait de la requête DHCP dans Wireshark. Cette option DHCP 97 était présentée comme « 4c:4c:45:44:00:38:36:10:80:4e:c4:c0:4f:4a:58:31 » dans Wireshark. Je l'ai donc collée dans le dhcp-match et la correspondance a échoué, l'action ne s'est donc jamais déclenchée. (!!). En regardant maintenant les données brutes, Wireshark présentait bien la bonne information : conformément à la RFC, elle était dans le paquet DHCP, elle n'était simplement pas présentée telle quelle à l'écran.

Sachant que l'option log-dhcp était activée dans le fichier dnsmasq, j'ai vérifié le fichier /var/log/syslog et toutes les informations DHCP que je cherchais s'y trouvaient, sauf que... la ligne de l'option DHCP 97 contenait « 00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a... » ( !! ) elle est incomplète !

Alors, en bon hacker que je suis, j'ai fusionné les informations de Wireshark avec celles du journal dnsmasq pour produire le filtre de correspondance final.

```
#From wireshark
   4c:4c:45:44:00:38:36:10:80:4e:c4:c0:4f:4a:58:31
#From syslog
00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a...

#Produced
00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31
```
En y repensant, je ne suis même pas sûr de comprendre pourquoi cela a fonctionné. Je sais que l'UUID/IAD est construit en deux parties. Et d'après le nombre affiché par Wireshark, je vois qu'il y a une histoire de gros-boutisme et petit-boutisme (big endian / little endian) pour l'UUID. Mais cela n'explique pas comment la partie IAD est correcte.

Je ne sais pas non plus d'où vient le préfixe 00: du nombre. Je sais que les 4 premières lettres devraient épeler « dell » pour les ordinateurs Dell. Si vous observez l'écran de démarrage du BIOS, vous pouvez voir que le numéro UUID présenté ressemble à 44454c4c4544-0038-3610-804ec4c04f4a5831 (astuce : cela va très vite), mais vous pouvez voir qu'il s'aligne avec ce que dnsmasq a rapporté, moins le 00 initial. Il serait intéressant de savoir comment Dell décide de l'UUID pour un modèle donné. Je suis sûr qu'il y a un encodage quelconque en jeu.

### Compiler dnsmasq 2.76 si vous avez besoin du support UEFI

>[!note]
>Des versions plus récentes de dnsmasq sont peut-être désormais disponibles via les gestionnaires de paquets. Ceci est conservé à titre de référence sur la façon de compiler soi-même une version spécifique


Référence : [https://forums.fogproject.org/topic/8725/compiling-dnsmasq-2-76-if-you-need-uefi-support](https://forums.fogproject.org/topic/8725/compiling-dnsmasq-2-76-if-you-need-uefi-support)

Un brillant morceau de code a été ajouté à dnsmasq 2.76 (mai 2016) pour fournir / corriger la prise en charge de l'envoi des informations de démarrage UEFI aux systèmes UEFI. À ce jour, la plupart des distributions Linux à jour proposent cette version de dnsmasq à l'installation.

Dans ce tutoriel, je vais détailler les étapes nécessaires pour compiler et installer cette dernière version de dnsmasq pour les distributions Linux courantes. Je n'ai pas accès à toutes les versions et/ou variantes, je ne documenterai donc que ce que j'ai personnellement réalisé. J'encourage les autres, s'ils le peuvent, à documenter ici leurs expériences avec des variantes/versions de Linux que je ne couvre pas.

Avant de compiler cette version mise à jour de dnsmasq, assurez-vous d'installer la version de dnsmasq du dépôt de paquets de votre distribution Linux. Vous serez ainsi certain que tous les scripts de support et les dépendances ont été installés. Dans les étapes ci-dessous, nous remplacerons simplement le binaire dnsmasq par la dernière version compilée.

  
**Systèmes basés sur Ubuntu 16.04 LTS**

Système de compilation : Mint 18 x64 (basé sur Ubuntu 16.04 LTS) (notez que les instructions suivantes ont parfaitement fonctionné pour Raspbian Jessie, qui est basé sur Debian)

1.  Nous devons d'abord préparer notre environnement de compilation

sudo apt-get update

sudo apt-get install build-essential

sudo apt-get install -y wget libdbus-1-dev libnetfilter-conntrack-dev idn libidn11-dev nettle-dev libval-dev dnssec-tools 

3.  Ensuite, nous récupérons le code source de dnsmasq 2.76

`wget http://www.thekelleys.org.uk/dnsmasq/dnsmasq-2.76.tar.gz`

5.  Extrayez le code source du fichier tar

`tar -zxf dnsmasq-2.76.tar.gz`

7.  Placez-vous dans le répertoire de compilation de dnsmasq

`cd dnsmasq-2.76`

9.  Mettons à jour quelques paramètres dans le fichier de configuration. Je sais qu'il existe d'autres façons de procéder avec des options en ligne de commande, mais je ne l'ai pas fait

`sudo vi src/config.h`

11.  Trouvez cette section
```
/* #define HAVE_LUASCRIPT */
/* #define HAVE_DBUS */
/* #define HAVE_IDN */
/* #define HAVE_CONNTRACK */
/* #define HAVE_DNSSEC */
```

13.  Collez ces paramètres juste en dessous du texte ci-dessus

```
#define HAVE_DBUS
#define HAVE_IDN
#define HAVE_IDN_STATIC
#define HAVE_CONNTRACK
#define HAVE_DNSSEC
```

15.  Enregistrez et quittez le fichier config.h
16.  Nous devons voir où se trouve le fichier dnsmasq actuel. (REMARQUE : assurez-vous que dnsmasq a déjà été installé dans votre distribution Linux pour garantir que toutes les dépendances ont été installées avant de continuer)

`which dnsmasq`

18.  Cette commande devrait répondre quelque chose comme ceci :

```
# which dnsmasq
/usr/sbin/dnsmasq
```

21. L'information clé ici est que dnsmasq est installé dans **/usr/sbin**. Nous devons dire au script d'installation de ne pas placer les fichiers dnsmasq à l'emplacement par défaut (selon dnsmasq, /usr/local/sbin) mais de les placer là où la distribution a mis dnsmasq (/usr/sbin). Donc dans ce cas, nous voulons écraser le binaire dnsmasq dans /usr/sbin. Pour ce faire, nous devons mettre à jour la variable prefix dans le Makefile (fichier d'instructions du compilateur)
22.  Puisque nous savons maintenant où se trouve dnsmasq, allons mettre à jour le Makefile pour refléter l'emplacement où dnsmasq est installé

`sudo vi Makefile`

23.  Cherchez cette ligne et modifiez-la

```
PREFIX        = /usr/local
# To this
PREFIX        = /usr
```

25.  Enregistrez et quittez le Makefile
26.  Sauvegardons l'exécutable dnsmasq d'origine, au cas où...

`sudo cp /usr/sbin/dnsmasq /usr/sbin/dnsmasq.old`

28.  Voici maintenant l'étape où nous créons et installons la dernière version de dnsmasq

`sudo make install`

À ce stade, le compilateur va parcourir le code source et compiler le programme dnsmasq. Espérons qu'il compilera et s'installera sans erreurs.

31.  Une fois l'installation terminée, assurons-nous que la bonne version de dnsmasq est trouvée en premier dans le chemin de recherche.
32.  Saisissez ce qui suit

`dnsmasq -v` 

La sortie devrait ressembler à ceci :

```
Dnsmasq version 2.76  Copyright (c) 2000-2016 Simon Kelley
Compile time options: IPv6 GNU-getopt DBus no-i18n IDN DHCP DHCPv6 no-Lua TFTP conntrack ipset auth DNSSEC loop-detect inotify


This software comes with ABSOLUTELY NO WARRANTY.
Dnsmasq is free software, and you are welcome to redistribute it
under the terms of the GNU General Public License, version 2 or 3.
```

35.  Vérifiez que la version affichée est 2.76 ; si oui, tout est prêt
36.  La dernière et ultime étape consiste à vérifier que l'application se lance lorsque le service est appelé.

`sudo service dnsmasq restart`

38.  Si le service démarre correctement (sans erreurs), vous avez terminé.
39.  Si vous doutez que dnsmasq exécute la bonne version, vous pouvez toujours inspecter /var/log/syslog à la recherche de messages d'erreur dnsmasq.
