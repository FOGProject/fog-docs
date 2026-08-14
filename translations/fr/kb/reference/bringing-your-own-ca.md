---
title: Apporter votre propre autorité de certification
aliases:
    - Bringing Your Own CA
    - Bring Your Own CA
description: Comment remplacer, zone par zone, les certificats Web ou Secure Boot de FOG par une autorité de certification ou une clé que vous fournissez
context_id: bringing-your-own-ca
tags:
    - reference
    - security
    - certificates
    - pki
    - secure-boot
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/bringing-your-own-ca).

# Apporter votre propre autorité de certification

FOG génère ses propres certificats par défaut, mais chaque zone décrite dans
[[pki-zones|Les zones de certificats de FOG]] peut être remplacée
indépendamment par une autorité de certification ou une clé que vous exploitez
déjà. Cette page est la référence pour le faire ; voir
[[pki-glossary|le glossaire PKI]] si un terme vous est inconnu.

>[!info] Versions prises en charge
>`--secureboot-ca-cert` est un ajout de FOG 1.6 ; sur les versions antérieures,
>seul l'apport de votre propre **feuille** de signature Secure Boot (et non
>d'une autorité de certification) est possible — voir
>[Zone Secure Boot](#zone-secure-boot) ci-dessous pour ce que cela signifie en
>pratique.
>
>`--web-ca-cert`/`--web-ca-key`/`--web-ca-root` sont disponibles sur **les
>deux** lignes, 1.6 et 1.5. Mettez votre installeur à jour avant de les
>utiliser ; la ligne 1.5 ne les a reçues que récemment.

## Zone Web

```bash
./installfog.sh --web-ca-cert /etc/pki/web-int.pem \
                --web-ca-key  /etc/pki/web-int.key \
                --web-ca-root /etc/pki/root.pem
```

`--external-ca`/`--ca-cert`/`--ca-key`/`--ca-root` sont antérieures et visent
spécifiquement la zone Web — c'est ce qu'elles ont toujours effectivement
signifié. La question de savoir si elles resteront un mécanisme distinct à côté
des options ci-dessus, ou si elles y seront intégrées, n'est pas tranchée ;
considérez `--web-ca-*` comme la forme actuellement recommandée. Pour les
conséquences du remplacement de l'autorité de certification de la zone Web sur
l'épinglage de certificat de fog-client, pour la recette ACME/Let's Encrypt et
pour le dépannage, voir
[[external-ca-lets-encrypt|Certificats d'autorité externe et Let's Encrypt]] —
cette page ne couvre que le mécanisme, l'autre couvre le déroulé qui l'entoure.

## Zone Secure Boot

```bash
./installfog.sh --secureboot-ca-cert /etc/pki/sb-int.pem \
                --secure-boot-key    /etc/pki/sb-leaf.key \
                --secure-boot-cert   /etc/pki/sb-leaf.pem
```

`--secureboot-ca-cert` (FOG 1.6) est ce qui fait de cette opération un véritable
remplacement autorité-plus-feuille, de la même forme que la paire
auto-générée de FOG. Sans elle, `--secure-boot-key`/`--secure-boot-cert` seules
fournissent à l'installeur une **feuille sans autorité au-dessus d'elle**, et ce
certificat devient à la fois le signataire et ce que vous enrôlez — le modèle
plat, comme avant l'existence de la séparation autorité/feuille pour la clé
propre à FOG. Renouveler ensuite une clé plate impose de réenrôler chaque
machine — voir
[[secure-boot-signing#rotating-or-removing-a-key|Renouveler ou retirer une clé]].

### Générer une feuille vous-même

Si vous disposez déjà d'une clé de signature — une autorité interne, ou une clé
partagée avec d'autres outils — transmettez-la et l'installeur n'y touchera
jamais et ne l'écrasera jamais :

```bash
mkdir -p /root/fog-secureboot && cd /root/fog-secureboot

openssl req -new -x509 -newkey rsa:2048 \
  -keyout MOK.priv -outform DER -out MOK.der \
  -days 3650 -subj "/CN=FOG imaging - $(hostname -f)/" \
  -nodes

# The same certificate in PEM. Both formats are needed -- see the note below.
openssl x509 -inform DER -in MOK.der -outform PEM -out MOK.pem

chmod 600 MOK.priv
```

```bash
cd /path/to/fogproject/bin
./installfog.sh \
  --secure-boot-key  /root/fog-secureboot/MOK.priv \
  --secure-boot-cert /root/fog-secureboot/MOK.der
```

- `MOK.priv` — la clé privée. **Elle ne quitte jamais cette machine.**
  Sauvegardez-la là où vous mettriez un mot de passe root, pas là où vous
  mettriez un fichier de configuration.
- `MOK.der` — le certificat public, encodé en DER. C'est ce que vous distribuez
  aux clients et ce que `mokutil` enrôle ; il n'est pas sensible.
- `MOK.pem` — le même certificat, encodé en PEM. C'est ce que lisent `sbsign` et
  `sbverify`.

Les deux chemins sont consignés dans `.fogsettings`, de sorte que les mises à
niveau ultérieures continuent de les utiliser sans qu'il faille repasser les
options. Ces deux options n'ont de sens qu'ensemble — l'installeur refuse une
moitié de paire plutôt que de laisser des noyaux non signés sur un serveur dont
l'administrateur les croit signés.

>[!warning] `sbsign` et `sbverify` ne savent pas lire un certificat DER
>Ils chargent les certificats avec `PEM_read_bio_X509` d'OpenSSL, qui rejette le
>DER sans détour :
>
>```
>$ sbsign --key MOK.priv --cert MOK.der --output out.efi in.efi
>Can't load certificate from file 'MOK.der'
>error:0480006C:PEM routines:get_name:no start line ... Expecting: CERTIFICATE
>```
>
>`mokutil` et MokManager veulent l'inverse. Aucun de ces outils ne vous dit quel
>format il attendait : conservez donc les deux fichiers et utilisez `MOK.der`
>pour l'enrôlement et `MOK.pem` pour la signature. L'option
>`--secure-boot-cert` de l'installeur accepte l'un comme l'autre et convertit en
>interne : cela ne vous gêne donc que lorsque vous lancez `sbsign`/`sbverify` à
>la main.

Le `-days 3650` donne dix ans. Choisissez une durée que vous penserez réellement
à renouveler — un MOK expiré empêche les machines de démarrer. L'autorité de
certification auto-générée de FOG utilise une durée de vie plus longue, selon
la logique qu'une autorité est faite pour rester en place des années tandis que
la feuille en dessous est renouvelée.

>[!tip] Utilisez un CN descriptif
>Il est affiché dans MokManager au moment de l'enrôlement, puis de nouveau des
>années plus tard lorsque quelqu'un cherche à comprendre à quoi sert cette clé.
>`FOG imaging - fog.example.edu` vaut mieux que `MOK`.

### Obtenir la séparation autorité/feuille à la main, sans `--secureboot-ca-cert`

Rien de ce qui précède n'exige que votre clé soit auto-signée. Si votre
organisation exploite déjà une autorité de certification interne (AD Certificate
Services ou équivalent) et peut émettre un certificat de signature de code,
`--secure-boot-key`/`--secure-boot-cert` (ou `--sign-key`/`--sign-cert` dans
`fos/build.sh`) acceptent ce certificat feuille et sa clé exactement de la même
façon — enrôlez cette même feuille comme MOK et rien d'autre ne change. Les
modèles standard de signature de code ne portent pas l'OID « signature de
modules uniquement » évoqué plus bas : vous ne tombez donc pas dans ce piège.

Une autorité de certification peut faire plus que remplacer la feuille, si vous
le souhaitez. shim ne se contente pas d'une correspondance exacte avec le
certificat enrôlé — il valide la chaîne de certificats de la signature PKCS#7
embarquée par rapport à ce qui est enrôlé (`sbsign --cert <leaf> --addcert
<intermediate>` est ce qui embarque cette chaîne). Cela signifie que vous pouvez
enrôler la racine ou l'intermédiaire de votre autorité **une seule fois**, puis
signer ensuite avec n'importe quelle feuille émise sous elle : réémettez ou
renouvelez la feuille et plus aucune machine n'a besoin d'être touchée — le même
bénéfice dont la clé auto-générée de FOG profite déjà automatiquement. Sans
`--secureboot-ca-cert`, faire cela avec votre propre autorité impose de signer
et de publier à la main : suivez
[[secure-boot-technical-details#Signer les noyaux FOS|la signature des noyaux FOS]]
en ajoutant `--addcert` à l'appel de `sbsign`, et enrôlez le certificat de
l'autorité plutôt qu'une feuille.

Une chose que cela ne vous apporte **pas** : un moyen d'éviter complètement
l'enrôlement en vous appuyant sur une infrastructure dont votre parc dispose
peut-être déjà. Il n'existe pas de mécanisme générique Intune ou GPO permettant
de pousser une autorité de certification quelconque dans la base `db` de l'UEFI
— ce qui existe là ne concerne que le renouvellement des certificats de
Microsoft. Si votre autorité n'est pas déjà enrôlée sur tout le parc par un
autre moyen (outillage BIOS du constructeur, ou Setup Mode manuel), la visite
unique par machine reste nécessaire — elle devient simplement définitive une
fois effectuée.

Rien de tout cela ne s'étend non plus à HTTPS. La confiance accordée au noyau et
à shim d'une part, et le magasin de racines TLS d'iPXE d'autre part, sont deux
mécanismes sans rapport — enrôler une autorité ici ne change rien aux serveurs
HTTPS depuis lesquels un client Secure Boot acceptera de télécharger. Voir
[[pki-zones#https-and-netboot|HTTPS et démarrage réseau]].

>[!warning] Générez une clé neuve — ne réutilisez pas le MOK que vous avez déjà
>Si cette machine a déjà compilé un module DKMS, elle possède déjà un MOK, et il
>est tentant de le réutiliser. Cela ne fonctionnera pas.
>
>Depuis shim 15.4 (Ubuntu 21.04 et ultérieur), les clés portant l'OID KeyUsage
>*Module-signing only* `1.3.6.1.4.1.2312.16.1.2` sont délibérément **ignorées**
>par shim comme par GRUB lors de la validation de quelque chose à démarrer —
>elles ne servent qu'à signer des modules de noyau. Le MOK DKMS généré
>automatiquement par Ubuntu et Debian porte exactement cet OID.
>
>L'échec se manifeste par un simple `Security Policy Violation` au démarrage,
>alors que la clé apparaît tout à fait normalement dans
>`mokutil --list-enrolled` : une combinaison mémorablement peu utile. La
>commande `openssl req` ci-dessus produit une clé sans cet OID ; contentez-vous
>donc de l'utiliser.
>
>La clé que génère FOG ne porte pas non plus cet OID : cela ne vous concerne
>donc que si vous fournissez la vôtre.

## Zone de communication client — non remplaçable de cette façon

La zone de communication client (`.srvprivate.key`/`.srvpublic.crt`) n'est
délibérément pas remplaçable en apportant votre propre autorité de
certification. Elle est ancrée au certificat que chaque fog-client a déjà
épinglé : la remplacer signifierait donc redéployer la confiance vers toutes les
machines enregistrées par un autre moyen (GPO, réinstallation du client) — il
n'existe pas de chemin intégré pour cela, car il n'y a aucun moyen de le faire
sans toucher à chaque poste. Voir
[[pki-glossary#Paire de clés de communication client|Paire de clés de communication client]].

## Autorités de certification `pathlen:0`

Si votre autorité porte `pathlen:0` — chose ordinaire pour une émission en
entreprise —, elle ne peut pas servir d'ancre à un intermédiaire. L'installeur
le détecte, le signale, signe le certificat web directement depuis elle, et
laisse le Secure Boot sur sa clé auto-signée. Rien n'est cassé en silence.

## Voir aussi

- [[pki-zones|Les zones de certificats de FOG]]
- [[pki-glossary|Glossaire PKI et Secure Boot]]
- [[external-ca-lets-encrypt|Certificats d'autorité externe et Let's Encrypt]]
- [[secure-boot-signing|Signature Secure Boot]]
- [[unify-certificates-across-fog-servers|Unifier les certificats sur plusieurs serveurs FOG]] — appliquer les options de la zone Web à tout un parc
