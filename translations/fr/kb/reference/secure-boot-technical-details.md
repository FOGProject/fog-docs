---
title: Secure Boot : détails techniques
aliases:
    - Secure Boot Technical Details
description: Détails techniques plus poussés sur la chaîne Secure Boot de FOG -- servir le shim signé, signer les noyaux FOS, et signer vos propres compilations de FOS
context_id: secure-boot-technical-details
tags:
    - reference
    - secure-boot
    - uefi
    - advanced
    - pki
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/secure-boot-technical-details).

# Secure Boot : détails techniques

Cette page couvre les mécanismes de la signature Secure Boot qui ne sont propres
à aucune voie d'enrôlement particulière : comment la chaîne shim signée est
servie, comment les noyaux FOS sont réellement signés, et comment signer vos
propres compilations de FOS. Pour les concepts, commencez par
[[secure-boot-signing|Signature Secure Boot]]. Pour enrôler un certificat sur un
client, voir [[secure-boot-mok-enrollment|l'enrôlement MOK]] ou
[[secure-boot-setup-mode-enrollment|l'enrôlement en Setup Mode]].

## Servir la chaîne signée

Réglez le fichier de démarrage DHCP des clients Secure Boot sur
**`secureboot/snponly-shimx64.efi`**. Rien dans cette étape n'a besoin d'être
signé par vous — les deux binaires portent déjà des signatures auxquelles le
micrologiciel et shim font confiance.

>[!tip] C'est le même modèle de pilote que celui déjà utilisé par FOG
>`snponly` ne se lie qu'au protocole réseau UEFI du micrologiciel au lieu de
>remplacer le pilote de la carte réseau, ce qui est précisément la raison pour
>laquelle FOG sert `snponly.efi` à tous ses autres clients. Une machine Secure
>Boot se comporte donc désormais comme le reste de votre parc plutôt que comme
>un cas particulier — la seule différence étant le shim en amont et la signature
>sur le noyau.

Comme le `snponly.efi` amont n'embarque aucun script de démarrage compilé, il en
récupère un par TFTP, et **l'endroit où il le cherche n'est pas un chemin fixe
unique**. iPXE demande le nom nu `autoexec.ipxe` et essaie deux emplacements
dans l'ordre :

1. relativement à son *URI de travail courant* — le répertoire TFTP depuis lequel
   le `.efi` en cours d'exécution a lui-même été téléchargé, soit
   `secureboot/autoexec.ipxe`
2. en absolu à la racine TFTP — `/autoexec.ipxe`

Vous pouvez observer les deux tentatives sur la console du client :

```
autoexec.ipxe...  Not found
/autoexec.ipxe... Not found
```

L'installeur satisfait les deux. Il crée un lien physique d'`autoexec.ipxe` dans
chaque répertoire depuis lequel un binaire sans EMBED peut être démarré — la
racine TFTP, `autoexec/`, `autoexec/i386-efi/`, `autoexec/arm64-efi/`,
`secureboot/` et `secureboot/arm64-efi/`. Tous les six ne sont qu'un seul
fichier : modifier l'un d'eux les modifie donc tous, et aucune copie ne continue
discrètement d'exécuter l'ancien script.

Un lien physique plutôt qu'un lien symbolique, parce que certains démons TFTP
refusent de suivre les liens symboliques, alors qu'un lien physique est pour eux
tous indiscernable d'un fichier ordinaire. Un lien physique plutôt qu'une copie,
pour que les chemins ne puissent pas diverger.

Si un lien a été rompu — installation plus ancienne, ou fichier remplacé par un
éditeur qui écrit-puis-renomme — relancer l'installeur le rétablit, ou bien :

```bash
sudo ln -f /tftpboot/autoexec/autoexec.ipxe /tftpboot/secureboot/autoexec.ipxe
```

Vous pouvez vérifier qu'il s'agit bien d'un seul et même fichier : chaque
exemplaire doit indiquer le même inœud et un nombre de liens de 6.

```bash
find /tftpboot -name autoexec.ipxe -printf '%i  links=%n  %p\n'
```

>[!tip] Si rien ne semble se produire
>Observez le journal du serveur TFTP pendant un démarrage — il vous indique
>exactement quels noms de fichiers le client a demandés et s'ils ont été servis,
>ce qui vaut mieux que de deviner à chaque fois.

Vos clients existants ne sont pas affectés — le `snponly.efi` propre à FOG, non
signé, reste à la racine TFTP, et les machines sans Secure Boot continuent de le
démarrer. L'exemplaire signé réside sous `secureboot/` et n'est atteint que par
les machines que vous y dirigez.

>[!note] Les deux fichiers s'appellent `snponly.efi`, et c'est normal
>`/tftpboot/snponly.efi` est la compilation propre à FOG — script de démarrage
>embarqué, aucune signature. `/tftpboot/secureboot/snponly.efi` est la
>compilation signée d'amont, qui lit son script depuis `autoexec.ipxe`. Ce sont
>deux binaires différents faisant le même travail par des moyens différents,
>raison pour laquelle celui qui est signé dispose de son propre répertoire
>plutôt que de remplacer l'autre.

### Si la chaîne se charge mais que le réseau ne monte jamais

shim s'exécute, iPXE démarre, puis il n'y a ni lien ni DHCP. Cela met en cause
la pile réseau UEFI du micrologiciel lui-même, et non quoi que ce soit que vous
ayez signé. Réglez plutôt le fichier de démarrage DHCP sur
**`secureboot/ipxe-shimx64.efi`** — sur arm64,
`secureboot/arm64-efi/ipxe-shimaa64.efi`.

Cette chaîne exécute le `ipxe.efi` contenant tous les pilotes, lequel remplace le
pilote de carte réseau du micrologiciel par celui d'iPXE au lieu de se lier au
protocole réseau UEFI du micrologiciel. Elle récupère les machines dont le SNP
du micrologiciel est cassé ou absent, et c'est l'option la plus intrusive — sur
un matériel où la prise de contrôle échoue, elle se bloque à la place. Essayez
donc `snponly` d'abord et ne passez à celle-ci que sur le symptôme ci-dessus.

Tout le reste de cette étape est inchangé : les deux binaires sont préparés pour
vous, tous deux sont déjà signés, et `autoexec.ipxe` fait l'objet d'un lien
physique dans `secureboot/` pour l'un comme pour l'autre. **Rien n'a besoin
d'être renommé côté serveur** — le shim choisit son second étage d'après son
propre nom de fichier, de sorte que les deux chaînes cohabitent dans un même
répertoire et que le DHCP seul décide laquelle s'exécute.

## Signer les noyaux FOS

C'est la partie qu'il vous revient réellement de signer, et **l'installeur l'a
déjà fait** — il n'y a aucune étape ici, sauf si vous avez fourni votre propre
clé, auquel cas
[[secure-boot-signing#bringing-your-own-key|apporter votre propre clé]] traite de
sa transmission.

Chaque installation et chaque mise à niveau resigne les noyaux, et c'est
indispensable : les binaires FOS sont recopiés en place non signés à chaque
exécution, de sorte que la signature est retirée puis immédiatement réappliquée
dans la même passe. C'est ce qui évite qu'une mise à niveau vous laisse
discrètement des noyaux que vos clients refuseront de démarrer — la façon la plus
courante dont cette configuration se casse.

Vérifiez — et notez que le certificat doit être le **PEM**, car `sbverify` ne
sait pas lire le DER :

```bash
sbverify --cert /opt/fog/pki/secureboot/leaf/sign.pem \
  /var/www/fog/service/ipxe/bzImage
# Signature verification OK
```

La chaîne complète, intermédiaire compris :

```bash
$ sbverify --list /var/www/fog/service/ipxe/bzImage
 - subject: /CN=FOG Project Secure Boot Signing
   issuer:  /CN=FOG Secure Boot CA
 - subject: /CN=FOG Secure Boot CA
   issuer:  /CN=FOG Server CA
```

Le signataire affiché doit correspondre à l'empreinte figurant sur la page
**Configuration FOG → Secure Boot** ; l'empreinte de cette page est le condensat
du certificat qu'enrôlent vos clients — l'autorité de certification, pas la
feuille.

L'installeur conserve une copie `.unsigned` de chaque noyau à côté de la version
signée, car `sbsign` ne resigne pas proprement une image déjà signée. Laissez-les
tranquilles ; elles sont rafraîchies à chaque téléchargement.

>[!note] La page web de mise à jour du noyau est couverte elle aussi
>Télécharger un noyau depuis **Configuration FOG → Kernel Update** le signe avant
>son envoi vers le serveur TFTP : cette voie non plus ne peut donc pas vous
>laisser avec un noyau non signé. La signature passe par un petit assistant
>réservé à root (`$fogprogramdir/bin/fog-sign-kernel`, `/opt/fog/bin/…` par
>défaut) plutôt que par le serveur web lui-même, de sorte que le serveur web
>n'obtient jamais l'accès en lecture à votre clé privée. Si la signature échoue,
>la mise à jour est refusée d'emblée plutôt que d'installer discrètement un noyau
>que vos clients ne démarreront pas.
>
>Ayez conscience de la limite de cette protection : quiconque peut déjà exécuter
>du code sous l'identité de votre serveur web peut demander à l'assistant de
>signer un noyau de son choix. Ce qu'il ne peut pas faire, c'est repartir avec la
>clé.

>[!warning] Si `sbsigntool` n'a pas pu être installé
>L'installeur ajoute `sbsigntool` (`sbsigntools` sur RHEL/Arch) à son jeu de
>paquets de base, mais si aucun de ces deux noms n'existe dans les dépôts de
>votre distribution, il saute le paquet, avertit, puis poursuit **sans
>signature** plutôt que d'interrompre toute l'installation. Lisez la sortie de
>l'installeur — un noyau non signé ne se manifeste que sur un client, sous la
>forme d'un `Security Policy Violation`.

## Signer vos propres compilations de FOS

Si vous compilez FOS vous-même plutôt que d'utiliser les noyaux publiés,
`build.sh` peut signer dans le cadre de la compilation, de sorte que le `.sha256`
publié couvre l'image signée :

```bash
./build.sh -nka x64 \
  --sign-key  /root/fog-secureboot/MOK.priv \
  --sign-cert /root/fog-secureboot/MOK.pem
```

Si vous utilisez la clé auto-générée de FOG, cela donne
`--sign-key /opt/fog/pki/secureboot/leaf/sign.key --sign-cert /opt/fog/pki/secureboot/leaf/sign.pem`.

`--sign-cert` doit être le **PEM** ici — `build.sh` le transmet directement à
`sbsign`, qui ne sait pas lire le DER.

`FOS_SIGN_KEY` et `FOS_SIGN_CERT` fonctionnent également, ce qui est plus commode
en intégration continue. Si aucun des deux n'est défini, la compilation est
octet pour octet ce qu'elle a toujours été.

## Vérifier de bout en bout

Prenez une machine enrôlée et démarrez-la en PXE avec le Secure Boot **activé** :

- iPXE se charge et affiche sa bannière — le shim a accepté `snponly.efi`, les
  binaires signés d'amont fonctionnent donc.
- Le menu FOG apparaît — `autoexec.ipxe` est bien servi et lu.
- Sélectionner une tâche démarre FOS au lieu d'échouer — votre signature est
  acceptée.

Si cela s'arrête à la troisième étape avec une violation de sécurité, la
signature du noyau n'est pas acceptée. Par ordre de probabilité :

| Symptôme | Cause |
| --- | --- |
| `Security Policy Violation` | Certificat non enrôlé sur *cette* machine, ou feuille signée sous une autorité différente de celle qui est enrôlée |
| `Security Policy Violation`, alors que le certificat *figure* bien dans `mokutil --list-enrolled` | La clé porte l'OID « signature de modules uniquement » — voir [[secure-boot-signing#bringing-your-own-key\|Apporter votre propre clé]] |
| Échoue sur toutes les machines, y compris celles qui sont enrôlées | shim n'est pas dans la chaîne de démarrage — voir [[secure-boot-signing#the-chain-you-are-building\|la chaîne]] |
| Fonctionnait hier, échoue aujourd'hui | Quelque chose a remplacé les noyaux sans les resigner. L'installeur resigne toujours à l'installation et à la mise à niveau — suspectez tout ce qui copie dans `service/ipxe/` en dehors de lui — vérifiez avec `sbverify` et relancez l'installeur |
| Toutes les machines cessent de fonctionner après un changement | Soit l'autorité de certification a été régénérée, soit vous êtes passé à une autre clé plate fournie par l'administrateur. L'enrôlement se fait par autorité (ou par clé plate) : tous les clients doivent donc être réenrôlés — voir [[secure-boot-signing#rotating-or-removing-a-key\|Renouveler ou retirer une clé]] |
| Se plaint du format, pas de la signature | Le noyau n'a pas `CONFIG_EFI_STUB` |

## Voir aussi

- [[secure-boot-signing|Signature Secure Boot]]
- [[secure-boot-mok-enrollment|Enrôlement MOK]]
- [[secure-boot-setup-mode-enrollment|Enrôlement en Setup Mode]]
- [[pki-zones|Les zones de certificats de FOG]]
