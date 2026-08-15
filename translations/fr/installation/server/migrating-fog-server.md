---
title: Migration du serveur FOG
description: Comment déplacer les paramètres FOG, la base de données, les images et la confiance des certificats d'un ancien serveur vers un nouveau
aliases:
    - Migrating FOG Server
    - FOG Server Migration
    - Moving FOG To A New Server
context_id: migrating-fog-server
tags:
    - install
    - migrating
    - new-server
    - fogserver
    - git
    - prerequisites
    - install-script
    - configuration
    - database
    - cli-switches
    - ssl
    - pki
    - certificates
    - secure-boot
    - storage-node
    - dhcp
---
>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/server/migrating-fog-server).

# Vue d'ensemble

Cet article explique comment déplacer les paramètres, la base de données et
les images d'un serveur FOG d'une ancienne machine vers une nouvelle. C'est
plus sûr et plus prévisible que de tenter une mise à niveau du système
d'exploitation sur place : vous savez exactement ce qui est déplacé et
comment, et votre ancien serveur reste intact comme solution de repli pendant
toute l'opération. Une mise à niveau de l'OS, en revanche, peut laisser FOG
dans un état cassé sans chemin de retour clair si quelque chose tourne mal en
cours de route.

Nous aborderons :

-   Décider si le nouveau serveur conserve l'IP/le nom d'hôte de l'ancien ou
    reçoit les siens propres (cette décision affecte presque tout le reste
    ci-dessous).
-   Construire le nouveau serveur.
-   Migrer les images et la base de données de l'ancien serveur vers le
    nouveau.
-   Migrer l'autorité de certification pour que les clients FOG existants et
    les images avec PXE intégré continuent de fonctionner — y compris
    déterminer si l'ancien serveur est sur la disposition pré-PKI ou
    post-PKI, car ce que vous copiez diffère.
-   Migrer le matériel de signature Secure Boot, si vous signez les noyaux
    FOS pour UEFI Secure Boot, afin que les clients déjà enrôlés n'aient pas
    besoin d'un nouvel enrôlement.
-   Automatiser tout ce qui précède avec un script d'exemple, si vous
    préférez ne pas procéder étape par étape.
-   Réconcilier les paramètres dépendants de l'IP, si le nouveau serveur ne
    réutilise pas l'IP/le nom d'hôte de l'ancien.
-   Ajuster le DHCP si vous n'exécutez pas DHCP sur le nouveau serveur.
-   Basculer et retirer l'ancien serveur.

# Décider : même IP/nom d'hôte, ou un nouveau ?

Avant de commencer, décidez comment le nouveau serveur sera identifié sur le
réseau, car c'est le plus grand embranchement dans la quantité de travail que
le reste de cette migration demandera.

-   **Réutiliser l'IP et/ou le nom d'hôte de l'ancien serveur (recommandé
    quand c'est possible).** Préparez le nouveau serveur sur une IP
    temporaire, faites la migration, puis au moment de la bascule pointez le
    DNS (et l'ancienne IP, si quelque chose démarre par IP plutôt que par
    nom) vers la nouvelle machine et retirez l'ancienne. Si vous transférez
    aussi le répertoire SSL/CA (voir ci-dessous), les clients FOG existants
    et les machines déjà imagées n'ont besoin d'**aucun changement** — ils
    continuent de parler au « même » serveur.
-   **Donner au nouveau serveur sa propre IP/son propre nom d'hôte
    permanents.** Plus simple à préparer puisque les deux serveurs peuvent
    fonctionner côte à côte indéfiniment, mais comme l'import de la base de
    données apporte avec lui l'IP et les mots de passe de l'*ancien*
    serveur, vous devrez suivre
    [[change-fog-server-ip-address|la réconciliation des paramètres dépendants de l'IP]]
    ensuite, et mettre à jour toute configuration DHCP/DNS qui pointait vers
    l'ancienne adresse.

Dans les deux cas, l'ancien et le nouveau serveur FOG n'ont pas besoin d'être
à la même version — vous pouvez aller d'une version plus ancienne vers une
plus récente, mais pas l'inverse, donc n'installez pas sur la nouvelle
machine une version de FOG plus ancienne que celle que l'ancienne exécute.

# Construire le nouveau serveur

Construisez le nouveau serveur avec la dernière version de la distribution
Linux de votre choix — elle n'a pas besoin de correspondre à la distribution
de l'ancien serveur (Ubuntu vers Rocky, Debian vers Fedora, etc. conviennent
tous).

Ne créez pas d'utilisateur Linux appelé `fog` — FOG crée son propre compte de
service `fog`/`fogproject`, et un utilisateur préexistant de ce nom entrera
en conflit avec lui.

Définissez une IP statique ou une réservation DHCP pour le serveur (cela peut
être une adresse de préparation temporaire selon la décision ci-dessus), et
créez un enregistrement DNS pour lui une fois l'adresse fixée.

Pour installer FOG lui-même, suivez [[install-fog-server|Installer le serveur FOG]] —
consultez d'abord [[requirements|Configuration requise]]. Installer FOG ici
n'est pas différent de n'importe quelle autre installation fraîche ; rien n'y
change parce que vous migrez.

# Migrer les images

L'installateur de FOG met déjà en place un export NFS que vous pouvez
utiliser pour déplacer les images entre serveurs : `/images` (lecture seule)
et `/images/dev` (lecture-écriture). La façon la plus simple et la plus
uniforme de migrer est de monter l'export en lecture seule de l'**ancien**
serveur sur le **nouveau** serveur et d'en faire un `rsync` — cela fonctionne
que l'interface web de l'ancien serveur soit actuellement fonctionnelle ou
non.

Sur le **nouveau** serveur :

```bash
mkdir /mnt/oldfog
mount OLD_SERVER_IP:/images /mnt/oldfog
rsync -av /mnt/oldfog/ /images/
```

`rsync` est préféré à un simple `cp -R` : il est reprenable, et vous pouvez
relancer exactement la même commande en toute sécurité près de la bascule
pour récupérer tout ce qui a été capturé sur l'ancien serveur entre-temps
(seuls les fichiers modifiés/nouveaux sont transférés). Comme les pilotes et
les scripts postdownload vivent déjà sous `/images` sur l'ancien serveur, ils
viennent automatiquement — il n'y a rien de plus à copier pour eux.

Une fois la copie terminée, démontez le partage :

```bash
umount /mnt/oldfog
```

> [!note]
> Plus votre dépôt d'images est volumineux, plus le premier `rsync` prend de
> temps — prévoyez-le, surtout si vous préparez la migration à travers un
> lien WAN. Un lien gigabit sur le même sous-réseau est bien plus agréable
> pour une première synchronisation de plus de 100 Go d'images.

# Migrer la base de données

L'intérêt principal d'une migration est généralement de préserver vos
enregistrements de machines, vos configurations de groupes, vos affectations
d'images et vos liens de snapins, en plus de vos images — tout cela vit dans
la base de données.

**Recommandé : laisser l'installateur produire la sauvegarde.**
L'installateur de FOG sauvegarde automatiquement la base de données à chaque
mise à jour, en déposant un dump horodaté dans `$backupPath/fogDBbackups/`
(`$backupPath` vaut `/home/` par défaut, et est enregistré dans
[[install-fogsettings|.fogsettings]]). Sur l'**ancien** serveur, relancez
l'installateur (ou répondez simplement aux questions d'une mise à jour) pour
produire un dump frais, puis copiez le fichier `fog_sql_*.sql` résultant vers
le **nouveau** serveur (via le même montage NFS utilisé pour les images, ou
avec `scp`), et importez-le :

```bash
mysql -u root -p fog < fog_sql_<version>_<timestamp>.sql
```

**Solution de repli : `mysqldump` manuel.** Si l'interface web de l'ancien
serveur elle-même ne fonctionne pas (donc l'installateur ne peut pas produire
sa propre sauvegarde), videz la base de données directement à la place :

```bash
# on the OLD server
mysqldump -u root -p -B fog > fogdb.sql

# on the NEW server
mysql -u root -p fog < fogdb.sql
```

Ajustez les options `-u`/`-p`/`-h` pour correspondre à la façon dont votre
installation MySQL/MariaDB est réellement sécurisée (pas de mot de passe
root, un hôte différent, etc.).

> [!note]
> Comme cet import apporte avec lui l'adresse IP et les mots de passe générés
> de l'ancien serveur, l'identifiant de connexion de l'interface web du
> nouveau serveur sera celui de l'ancien. Si vous ne le connaissez pas, voyez
> [[install-fogsettings|.fogsettings]] pour savoir où FOG le stocke, ou
> réinitialisez-le depuis un shell sur le nouveau serveur.

# Migrer l'autorité de certification

FOG génère sa propre autorité de certification au moment de l'installation,
et trois choses différentes en dépendent : le certificat HTTPS du serveur
web, les binaires iPXE (qui sont compilés pour faire confiance à cette CA),
et le **fog-client**, qui épingle la CA et valide le serveur contre elle
avant d'agir sur toute tâche. Voir [[pki-zones|Infrastructure PKI de FOG]]
pour le modèle complet et
[[external-ca-lets-encrypt|CA externe et certificats Let's Encrypt]] pour
l'épinglage du fog-client en particulier.

À cause de cet épinglage, si le nouveau serveur génère une **nouvelle** CA
(le comportement par défaut de toute installation fraîche), chaque fog-client
déjà déployé — et toute image avec le client intégré — ne fera pas confiance
au nouveau serveur tant qu'il ne se ré-épingle pas (réinstallation du client,
ou reconstruction des images affectées).

La CA doit donc être en place sur le nouveau serveur **avant** d'y lancer
l'installateur. *Où* elle vit dépend de la disposition sur laquelle se trouve
l'ancien serveur, et les deux ne sont pas interchangeables.

## D'abord : l'ancien serveur est-il pré-PKI ou post-PKI ?

FOG 1.6 a séparé ses certificats en *zones* par usage sous `/opt/fog/pki/`.
Tout ce qui précède gardait une CA unique — clé et certificat ensemble — dans
le répertoire SSL. Demandez à l'**ancien** serveur de quelle disposition il
s'agit :

```bash
test -d /opt/fog/pki && echo "post-PKI layout" || echo "pre-PKI layout"
```

| | Pré-PKI (FOG 1.5.x, et 1.6 avant la séparation en zones) | Post-PKI (1.6 actuel et dev-branch) |
|---|---|---|
| Certificat de la CA racine | `/opt/fog/snapins/ssl/CA/.fogCA.pem` | `/opt/fog/snapins/ssl/CA/.fogCA.pem` — inchangé |
| **Clé privée** de la CA racine | `/opt/fog/snapins/ssl/CA/.fogCA.key` | `/opt/fog/pki/root/ca/.fogCA.key` |
| Paire de clés de communication client | `/opt/fog/snapins/ssl/.srvprivate.key` + `.srvpublic.crt` | identique |
| Certificat web | signé directement par la racine | sa propre zone, `/opt/fog/pki/web/` |
| Matériel Secure Boot | `/opt/fog/secureboot/` là où il existe | `/opt/fog/pki/secureboot/` |
| **Ce que vous copiez** | `/opt/fog/snapins/ssl` (plus `/opt/fog/secureboot` s'il est présent) | `/opt/fog/snapins/ssl` **et** `/opt/fog/pki` |

Le certificat est resté en place à dessein — c'est le fichier que le
fog-client a épinglé, et déplacer un certificat *public* n'apporte rien.
C'est la clé privée qui a été sortie du répertoire SSL lisible par le web, et
ce déplacement est la raison entière pour laquelle un serveur post-PKI a
besoin qu'un second chemin soit copié.

Seule la disposition de l'**ancien** serveur décide de ce que vous copiez. Le
nouveau serveur se retrouve sur la disposition qu'utilise la version que vous
y installez ; pré-PKI → post-PKI est le cas normal, et l'installateur déplace
la clé dans l'arborescence de zones de lui-même à sa première exécution.
L'inverse ne peut pas se produire, puisque vous ne pouvez pas installer sur
la nouvelle machine un FOG plus ancien que celui de l'ancienne.

## Copier le tout

Exécutez ceci sur le **nouveau** serveur, avant d'y installer FOG :

```bash
rsync -az -e ssh root@OLD_SERVER:/opt/fog/snapins/ssl/ /opt/fog/snapins/ssl/

# post-PKI old servers only — skip if /opt/fog/pki doesn't exist there
rsync -az -e ssh root@OLD_SERVER:/opt/fog/pki/ /opt/fog/pki/

# pre-PKI old servers that had Secure Boot configured
rsync -az -e ssh root@OLD_SERVER:/opt/fog/secureboot/ /opt/fog/secureboot/
```

`rsync -a` compte ici : il préserve la propriété et les modes avec lesquels
ces fichiers sont installés, et les clés privées de la CA sont délibérément
réservées à root.

>[!warning] Ne faites pas transiter les clés privées par l'export d'images
>Le partage NFS `/images` utilisé plus tôt pour la copie des images est
>exporté vers tout le réseau, et ces répertoires contiennent la clé privée à
>laquelle chaque machine de votre parc fait confiance. Copiez-les via SSH
>comme ci-dessus, ou sur un support amovible — pas à travers `/mnt/oldfog`.

Une fois le matériel en place, une exécution normale de l'installateur le
laisse tranquille : FOG ne génère une CA que lorsqu'il n'y en a pas déjà une,
ou lorsque vous passez explicitement `-C`/`--recreate-CA` (voir
[[command-line-options]]). Chaque client existant continue de faire confiance
au serveur sans aucun changement côté client.

>[!warning] Post-PKI : copier seulement `snapins/ssl` laisse un serveur qui ne peut rien émettre
>Un installateur post-PKI décide qu'« une CA existe déjà ici » à partir de la
>présence du **certificat** racine, pas de sa clé — délibérément, car une
>racine dont la clé est conservée hors ligne est une configuration prise en
>charge. Apportez le certificat sans `/opt/fog/pki`, et le nouveau serveur
>interprète cela comme une racine hors ligne : il ne fabriquera pas de
>remplacement (rien n'est orphelin en silence, ce qui est le but de la
>vérification) mais il ne peut pas non plus émettre la Web CA en dessous, et
>le dit :
>
>```
>Cannot issue 'FOG Web CA': the Root CA private key is not on this
>server (only /opt/fog/snapins/ssl/CA/.fogCA.pem is present).
>... Restore it to:
>  /opt/fog/pki/root/ca/.fogCA.key
>```
>
>Copiez `/opt/fog/pki` et relancez l'installateur.

>[!note] Les nouveaux serveurs pré-PKI fonctionnent dans l'autre sens
>En migrant de 1.5.x vers 1.5.x, l'installateur teste la **clé** de la CA,
>pas le certificat. Là, `snapins/ssl` est vraiment le seul chemin à copier —
>mais il doit inclure `CA/.fogCA.key`, sinon le nouveau serveur construit
>discrètement une toute nouvelle CA et chaque fog-client cesse de lui faire
>confiance.

Si vous préférez exploiter votre propre CA à l'avenir — par exemple pour vous
intégrer à la PKI de votre organisation — fournissez-la au moment de
l'installation avec `--web-ca-cert`/`--web-ca-key`/`--web-ca-root` au lieu
d'utiliser celle générée par FOG ; voir
[[bringing-your-own-ca|Apporter votre propre CA]]. Cela remplace uniquement
le certificat **web** et laisse délibérément intacte la CA épinglée du
fog-client, ce qui rend l'opération sûre sur un parc en production. Sur
working-1.6, `--external-ca` avec `--ca-cert`/`--ca-key`/`--ca-root` est une
écriture plus ancienne des trois mêmes options. Si le but est d'arrêter
d'importer une CA par serveur à travers plusieurs serveurs FOG,
[[unify-certificates-across-fog-servers|Unifier les certificats entre plusieurs serveurs FOG]]
couvre ce cas en particulier.

# Migrer le matériel de signature Secure Boot

Sautez entièrement cette section si vous ne signez pas les noyaux FOS pour
UEFI Secure Boot — vérifiez si la page **Configuration FOG → Secure Boot** de
l'ancien serveur affiche une empreinte de certificat, ou si
`/opt/fog/pki/secureboot/` (post-PKI) ou `/opt/fog/secureboot/` (pré-PKI) y
existe.

S'il est configuré, les copies de la section précédente **le couvrent déjà** :
en post-PKI c'est une zone à l'intérieur de `/opt/fog/pki`, en pré-PKI c'est
le répertoire plat `/opt/fog/secureboot` du troisième `rsync`. Ce qui suit
décrit ce qui est en jeu, et comment confirmer que le transfert a bien eu
lieu.

>[!danger] Sauter ceci ré-enrôle silencieusement tout votre parc
>L'installateur ne génère des clés Secure Boot que lorsqu'aucune n'est
>présente. Si vous ne transférez pas les anciennes, une installation fraîche
>sur le nouveau serveur en génère automatiquement de nouvelles, signe les
>noyaux FOS avec elles, et rien ne vous signale ce qui s'est passé jusqu'à ce
>qu'un client Secure Boot échoue à démarrer. Chaque client déjà enrôlé
>nécessite alors une visite physique pour enrôler le nouveau certificat —
>exactement le travail répété que cette section existe pour éviter. Voir
>[[secure-boot-signing#Renouveler ou retirer une clé|Rotation ou suppression d'une clé]]
>pour ce que cela implique si cela arrive quand même.

**Post-PKI : ce que contient `/opt/fog/pki/secureboot/`.**

| Chemin | Ce que c'est | Pourquoi il doit être transféré |
|---|---|---|
| `ca/.fogSBCA.{key,pem,der}` | La CA Secure Boot — publiée sous le nom `MOK.der` et enrôlée dans le firmware | Une CA différente signifie un ré-enrôlement physique sur chaque machine |
| `leaf/sign.{key,pem}` | La feuille de signature de code avec laquelle les noyaux FOS sont réellement signés | Rotative librement, mais seulement tant que la CA ci-dessus est celle qui est enrôlée |
| `PK.{key,pem}`, `KEK.{key,pem}` | Les clés de plateforme UEFI de ce serveur, utilisées par [l'enrôlement en Setup Mode](../../kb/how-tos/secure-boot-setup-mode-enrollment.md) | Elles ne se régénèrent jamais ; une machine enrôlée avec l'ancienne `PK` ne pourra jamais être mise à jour par un serveur détenant une `PK` différente |
| `mscerts/` | Les certificats de CA de Microsoft, préparés pour le constructeur de `.auth` | Reconstruits à partir des copies embarquées, donc rien n'est perdu s'il manque |

Une exécution normale de l'installateur sur le nouveau serveur trouve alors
tout cela déjà présent, signe les noyaux FOS avec la même feuille, et
republie le même certificat — et la même empreinte — dans le kit
d'enrôlement. Rien n'a besoin d'être ré-enrôlé.

>[!warning] Pré-PKI → post-PKI nécessite de toute façon une tournée de ré-enrôlement
>Un ancien serveur avec la paire plate `MOK.key`/`MOK.pem` est antérieur à la
>séparation CA/feuille. Transférer cette paire vaut quand même la peine —
>l'installateur du nouveau serveur la déplace dans l'arborescence de zones et
>laisse les anciens fichiers lisibles — mais le certificat qui finit enrôlé
>passe de ce MOK auto-signé à la nouvelle CA Secure Boot, donc chaque machine
>qui avait enrôlé l'ancien doit enrôler une fois de plus. Il n'y a aucun
>moyen d'y échapper quand le certificat enrôlé lui-même change ; cela vous
>achète une hiérarchie où aucun futur changement de clé de signature ne
>nécessite un passage par le firmware. Voir
>[[secure-boot-signing#L'ancien MOK plat|L'ancien MOK plat]].
>Cela n'a jamais affecté que les tout premiers testeurs de 1.6 — un serveur
>1.5.x n'a aucun matériel de signature Secure Boot, et rien à ré-enrôler.

**Utiliser votre propre clé** (installée à l'origine avec
`--secure-boot-key`/`--secure-boot-cert`) : rendez ces mêmes fichiers
disponibles au nouveau serveur — copiés au même chemin, ou n'importe où
ailleurs — et passez les mêmes options en l'installant. En post-PKI ces deux
options nomment la **feuille** de signature de code, et `--secureboot-ca-cert`
(working-1.6) nomme l'intermédiaire qui est réellement enrôlé dans le
firmware :

```bash
cd /path/to/fogproject/bin
./installfog.sh \
  --secureboot-ca-cert /path/to/your/sbca.pem \
  --secure-boot-key    /path/to/your/sign.key \
  --secure-boot-cert   /path/to/your/sign.pem
```

Voir
[[secure-boot-signing#Passer à une clé que vous fournissez|Passer à une clé que vous fournissez]]
pour ce que fait cette exécution, et
[[bringing-your-own-ca|Apporter votre propre CA]] pour construire la paire
CA/feuille à la main.

Après l'un ou l'autre chemin, confirmez que l'empreinte sur la page
**Secure Boot** du nouveau serveur correspond à ce que l'ancien serveur
affichait, avant de le mettre hors service — cette comparaison est la
vérification complète que le matériel a réellement été transféré.

# Migrer les autres fichiers de snapins

Le répertoire SSL ci-dessus vit sous `/opt/fog/snapins`, à côté de tous les
fichiers de snapins que vous avez réellement téléversés (installateurs,
scripts, etc. — voir [[snapins|Gestion des Snapins]]). Copiez le reste de ce
répertoire de la même manière si vous voulez que les affectations de snapins
existantes continuent de fonctionner sans les téléverser à nouveau :

```bash
# on the OLD server
cp -R /opt/fog/snapins/* /mnt/oldfog/snapins-backup/   # excluding ssl/, already handled above
```

# Automatiser avec un script

Tout ce qui précède — les images, le matériel de certificats, les snapins, la
base de données, et l'installation de FOG lui-même — peut être scripté en une
seule passe une fois le nouveau serveur démarré et joignable. Le script
ci-dessous **tire** tout depuis l'ancien serveur via SSH plutôt que de
pousser depuis celui-ci, donc l'ancien serveur (toujours en production) n'a
besoin d'aucune préparation au-delà d'autoriser la connexion SSH — rien n'y
est installé ni modifié. Tirer via SSH est aussi ce qui garde les clés
privées hors de l'export NFS `/images`.

### Configurer d'abord l'accès SSH

Sur le **nouveau** serveur, générez une clé (sautez cette étape si vous en
avez déjà une) et copiez-la vers l'ancien serveur pour que le script puisse
l'atteindre sans invite de mot de passe à chaque commande :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
ssh-copy-id root@OLD_FOG_HOST

# confirm it works before running the script:
ssh root@OLD_FOG_HOST true && echo OK
```

> [!note]
> Si la connexion SSH root est désactivée sur l'ancien serveur
> (`PermitRootLogin no`), soit activez-la temporairement pour la migration
> (et désactivez-la ensuite), soit utilisez un compte capable de sudo à la
> place et ajustez les appels `ssh` du script ci-dessous pour passer leurs
> commandes distantes par `sudo`.

### Le script

Exécutez ceci **sur le nouveau serveur**, en tant que root, une fois qu'il a
une IP/un nom d'hôte statiques et peut atteindre les ports SSH, HTTP et MySQL
de l'ancien serveur. Il prend le nom d'hôte de l'ancien serveur comme
argument obligatoire et celui du nouveau serveur comme argument optionnel
(utilisé seulement pour étiqueter l'invite de confirmation ci-dessous — le
script agit toujours sur la machine où il est exécuté) :

```bash
#!/usr/bin/env bash
# migrate-fog.sh — pulls images, certificate trust, snapins, and the database
# from an existing FOG server onto this one, then installs FOG here.
#
# Usage: ./migrate-fog.sh <old-fog-host> [new-fog-host]
set -euo pipefail

OLD_HOST="${1:?Usage: $0 <old-fog-host> [new-fog-host]}"
NEW_HOST="${2:-$(hostname -f 2>/dev/null || hostname)}"

FOG_REPO_DIR="/root/fogproject"
FOG_BRANCH="stable"   # match or exceed the old server's branch/version — never go older
IMAGES_DIR="/images"
SNAPINS_DIR="/opt/fog/snapins"
PKI_DIR="/opt/fog/pki"                 # post-PKI: root CA key + the web/Secure Boot zones
SECUREBOOT_DIR="/opt/fog/secureboot"   # pre-PKI flat Secure Boot layout, if the old server has one
DB_DUMP="/root/fog_migrate_$(date +%Y%m%d_%H%M%S).sql"

ssh_old() { ssh -o BatchMode=yes "root@${OLD_HOST}" "$@"; }

echo "This will pull images, SSL/snapins, and the database from:"
echo "  OLD server: ${OLD_HOST}"
echo "and install/overwrite FOG on this machine:"
echo "  NEW server: ${NEW_HOST}"
echo
read -r -p "Continue? [y/N] " confirm
[[ "${confirm}" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }

echo "==> Checking SSH access to ${OLD_HOST}"
ssh_old true

echo "==> Syncing images from ${OLD_HOST}:${IMAGES_DIR} (this can take a while)"
rsync -az --info=progress2 -e ssh "root@${OLD_HOST}:${IMAGES_DIR}/" "${IMAGES_DIR}/"

echo "==> Copying the CA certificate, client-communication keypair and snapins"
echo "    from ${OLD_HOST}:${SNAPINS_DIR}"
mkdir -p "${SNAPINS_DIR}"
rsync -az -e ssh "root@${OLD_HOST}:${SNAPINS_DIR}/" "${SNAPINS_DIR}/"

# Post-PKI servers keep the root CA's PRIVATE KEY, the web zone and the Secure
# Boot zone here instead — the snapins copy above carries only the certificate.
# Missing this leaves a server that reads its own root as offline and cannot
# issue the Web CA beneath it.
if ssh_old "[[ -d '${PKI_DIR}' ]]"; then
    echo "==> post-PKI layout on ${OLD_HOST}, copying ${PKI_DIR} forward"
    mkdir -p "${PKI_DIR}"
    rsync -az -e ssh "root@${OLD_HOST}:${PKI_DIR}/" "${PKI_DIR}/"
else
    echo "==> pre-PKI layout on ${OLD_HOST} (no ${PKI_DIR}); the CA key travels"
    echo "    inside ${SNAPINS_DIR}/ssl/CA and this installer will relocate it"
fi

# Pre-PKI flat Secure Boot layout. The installer moves it into the zone tree,
# which changes the enrolled certificate — every machine that enrolled the old
# flat MOK has to enroll once more. Copy it regardless: without it the new
# server generates fresh keys and nothing signed before can be re-signed.
if ssh_old "[[ -d '${SECUREBOOT_DIR}' ]]"; then
    echo "==> Flat Secure Boot material found on ${OLD_HOST}, copying it forward"
    mkdir -p "${SECUREBOOT_DIR}"
    rsync -az -e ssh "root@${OLD_HOST}:${SECUREBOOT_DIR}/" "${SECUREBOOT_DIR}/"
    chown -R root:root "${SECUREBOOT_DIR}"
    chmod 0700 "${SECUREBOOT_DIR}"
fi

echo "==> Fetching FOG source (${FOG_BRANCH})"
if [[ -d "${FOG_REPO_DIR}" ]]; then
    git -C "${FOG_REPO_DIR}" fetch --all
    git -C "${FOG_REPO_DIR}" checkout "${FOG_BRANCH}"
    git -C "${FOG_REPO_DIR}" pull
else
    git clone --branch "${FOG_BRANCH}" https://github.com/FOGProject/fogproject.git "${FOG_REPO_DIR}"
fi

echo "==> Installing FOG (the material copied above means the existing CA and"
echo "    Secure Boot keys, if any, are kept rather than regenerated)"
( cd "${FOG_REPO_DIR}/bin" && ./installfog.sh -Y )

echo "==> Dumping the fog database on ${OLD_HOST} (enter ITS MySQL root password if prompted)"
ssh -t "root@${OLD_HOST}" "mysqldump -u root -p -B fog" > "${DB_DUMP}"

echo "==> Importing it here (enter THIS server's MySQL root password if prompted)"
mysql -u root -p fog < "${DB_DUMP}"

cat <<EOF

==> Done.

Remaining manual steps:
  - If this server didn't inherit the old one's IP/hostname, work through
    "Reconciling IP-dependent settings" below.
  - Update DHCP/DNS to point at this server — see "If FOG isn't doing DHCP".
  - If Secure Boot material was copied above, confirm the fingerprint on this
    server's FOG Configuration -> Secure Boot page matches what the old
    server showed. A pre-PKI flat MOK is the exception: it is expected to
    change, and every enrolled machine needs enrolling once more.
  - Test a PXE boot and a live capture/deploy before retiring ${OLD_HOST}.
EOF
```

> [!warning]
> Traitez ceci comme un point de départ, pas comme un outil clé en main.
> Relisez-le par rapport à votre propre environnement avant de l'exécuter :
> `-Y` accepte automatiquement les valeurs par défaut *devinées* par
> l'installateur (interface réseau, DHCP, HTTPS, nom d'hôte), ce qui convient
> généralement mais mérite d'être confirmé par rapport aux invites
> documentées dans
> [[install-fog-server#Questions de l'installateur|Installer le serveur FOG]] ; les
> étapes `mysqldump`/`mysql` supposent une authentification MySQL
> interactive par mot de passe et devront être ajustées si vos serveurs
> utilisent une authentification sans mot de passe/par socket ou une base de
> données externe ; et `-B fog` supprime et recrée fidèlement chaque table
> que FOG a installée par défaut sur le nouveau serveur, en la remplaçant par
> les données de l'ancien serveur — attendu ici, mais bon à savoir avant de
> le relancer une seconde fois par accident.

# Réconcilier les paramètres dépendants de l'IP

Sautez entièrement cette section si le nouveau serveur a fini avec la
**même** IP et le même nom d'hôte que l'ancien — il n'y a rien à réconcilier.

Si le nouveau serveur a une IP différente, l'import de la base de données
ci-dessus a apporté avec lui l'adresse IP et les mots de passe de
l'**ancien** serveur, qui vont maintenant entrer en conflit avec le nouveau.
Suivez [[change-fog-server-ip-address|Changer l'adresse IP du serveur FOG]]
pour mettre à jour l'IP du nœud de stockage, `FOG_WEB_HOST`,
`FOG_TFTP_HOST`, et le fichier default iPXE pour qu'ils pointent vers le
nouveau serveur.

Vous voudrez aussi confirmer que les identifiants FTP/TFTP concordent entre
les endroits où FOG s'attend à ce qu'ils correspondent — voir
[[troubleshoot-ftp#Identifiants / mots de passe|Dépannage FTP : identifiants / mots de passe]].

# Si FOG ne fait pas le DHCP

Si vous avez un serveur DHCP dédié existant (plutôt que de laisser FOG servir
le DHCP lui-même), pointez-le vers le nouveau serveur :

-   Mettez à jour l'option DHCP 66 vers l'IP ou le nom DNS du nouveau
    serveur — voir [[dhcp-server-settings|Paramètres du serveur DHCP]] pour
    les exemples de configuration actuels (Kea, ISC, Windows Server).
-   Si vous ne contrôlez pas le serveur DHCP, ou s'il ne peut pas définir les
    options 66/67, utilisez [[proxy-dhcp|Proxy DHCP avec dnsmasq]] à la
    place.
-   Si vous prenez en charge à la fois les clients BIOS hérités et UEFI,
    voyez [[bios-and-uefi-co-existence|Coexistence BIOS et UEFI]].

Si le nouveau serveur a réutilisé l'IP et le nom DNS de l'ancien, il n'y a
généralement rien du tout à changer ici.

# Basculer et nettoyer

Une fois les images, la base de données et la confiance des certificats
migrées :

1.  Faites une dernière passe de `rsync` pour toutes les images capturées sur
    l'ancien serveur depuis votre première synchronisation.
2.  Si vous aviez préparé le nouveau serveur sur une IP temporaire, basculez
    le DNS (et l'IP elle-même, si quelque chose démarre par adresse) vers le
    nouveau serveur maintenant.
3.  Testez un démarrage PXE et une capture/un déploiement d'image réels
    contre le nouveau serveur avant de retirer l'ancien.
4.  Gardez l'ancien serveur éteint (plutôt que détruit immédiatement) pendant
    un moment comme option de retour arrière, puis mettez-le hors service à
    votre propre rythme une fois que vous êtes sûr que le nouveau serveur est
    stable.

# Articles liés

-   [[install-fog-server|Installer le serveur FOG]]
-   [[requirements|Configuration requise]]
-   [[command-line-options|Options de ligne de commande de l'installateur FOG]]
-   [[change-fog-server-ip-address|Changer l'adresse IP du serveur FOG]]
-   [[install-fogsettings|Le fichier .fogsettings]]
-   [[storage-node|Gestion des nœuds de stockage]]
-   [[snapins|Gestion des Snapins]]
-   [[pki-zones|Infrastructure PKI de FOG]]
-   [[bringing-your-own-ca|Apporter votre propre CA]]
-   [[unify-certificates-across-fog-servers|Unifier les certificats entre plusieurs serveurs FOG]]
-   [[external-ca-lets-encrypt|CA externe et certificats Let's Encrypt]]
-   [[secure-boot-signing|Secure Boot : signer FOS avec votre propre clé]]
-   [[secure-boot-setup-mode-enrollment|Secure Boot : enrôlement en Setup Mode]]
-   [[fog-security|Sécurité de FOG]]
-   [[troubleshoot-ftp|Dépannage FTP]]
-   [[dhcp-server-settings|Paramètres du serveur DHCP]]
-   [[proxy-dhcp|Proxy DHCP avec dnsmasq]]
-   [[bios-and-uefi-co-existence|Coexistence BIOS et UEFI]]
