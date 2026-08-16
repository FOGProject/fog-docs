---
title: Unifier les certificats entre plusieurs serveurs FOG
aliases:
    - Unifying certificates across several FOG servers
    - One trust anchor for several FOG servers
description: Comment faire partager une seule autorité de certification à plusieurs serveurs FOG indépendants, afin qu'un seul import de certificat couvre toute la flotte au lieu d'un par serveur
context_id: unify-certificates-across-fog-servers
tags:
    - how-to
    - certificates
    - fog-server
    - advanced
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/unify-certificates-across-fog-servers).

# Unifier les certificats entre plusieurs serveurs FOG

Vous exploitez plusieurs serveurs FOG. Chacun a généré sa propre autorité de
certification (CA) lors de son installation, si bien que chaque navigateur et
chaque machine qui leur parle doit importer un certificat **par serveur** —
cinq serveurs, cinq imports, et cinq choses à refaire chaque fois que l'un
d'eux est reconstruit.

Ce guide présente les trois façons de ramener cela à un seul import, et ce que
chacune coûte. Il applique les options de la zone Web décrites dans
[[bringing-your-own-ca|Apporter votre propre CA]] à plusieurs serveurs à la fois ;
voir [[pki-zones|Les zones de certificats de FOG]] pour ce qu'est une « zone » et
[[pki-glossary|le glossaire PKI]] si un terme employé ici ne vous est pas familier.

---

## D'abord : quel problème avez-vous réellement ?

Deux choses différentes se manifestent toutes deux par *« le certificat est
invalide »*, et elles ont des correctifs opposés. Tirez cela au clair avant de
changer quoi que ce soit.

1. **Le client ne fait pas confiance à la CA.** Le certificat est bon — rien
   n'a indiqué à cette machine de faire confiance à celui qui l'a émis.
   Importer la CA corrige le problème.
2. **Le certificat ne se rattache pas à la CA en laquelle vous avez confiance.**
   Vous avez fait confiance à la CA du serveur A et vous naviguez vers le
   serveur B, qui possède la sienne, sans aucun lien. Importer davantage de CA
   ne corrige rien ; les serveurs doivent être ré-émis.

Exécutez ceci contre chaque serveur, avec la CA en laquelle vous avez déjà
confiance :

```bash
echo | openssl s_client -connect <ip>:443 2>/dev/null | openssl x509 -out /tmp/leaf.pem
openssl verify -CAfile /path/to/the/ca/you/trusted.pem /tmp/leaf.pem
```

`OK` signifie le cas 1 — un problème de distribution, et vous n'avez peut-être
pas besoin de ce guide du tout. Une erreur de vérification signifie le cas 2,
et le reste de cette page s'applique.

>[!warning] Ne comparez pas les noms d'émetteur
>Chaque installation de FOG nomme sa CA `CN=FOG Server CA`, si bien que deux
>serveurs sans aucun lien paraissent identiques si vous ne lisez que le nom.
>`openssl verify` est la seule réponse qui ait un sens.

## Les trois options

| | Effort | Un serveur détient un pouvoir de signature sur un autre | Idéal quand |
| --- | --- | --- | --- |
| **A. Importer la CA de chaque serveur** | Un import par serveur, pour toujours | Non | Deux ou trois serveurs stables |
| **B. Un serveur FOG émet pour les autres** | Mise en place unique par serveur | **Oui** | Plusieurs serveurs FOG et aucune PKI existante |
| **C. Votre propre PKI ou CA ACME** | Dépend de votre PKI | Non | Vous exploitez déjà une autorité de certification |

Il n'existe aucune option où les serveurs restent complètement indépendants
*et* partagent une ancre. Quelque chose doit signer pour tout le monde.

## Option A : importer la CA de chaque serveur

La solution de base, et vraiment satisfaisante pour un petit nombre de
serveurs. Rien ne change côté FOG — vous distribuez simplement plusieurs
certificats au lieu d'un. Chaque serveur publie le sien à :

```
https://<your-fog-server>/fog/management/other/ca.cert.der
```

## Option B : un serveur FOG émet pour les autres

Choisissez un serveur comme **hub**. Sa CA reste exactement là où elle est.
Chaque autre serveur reçoit sa *propre* CA de signature, émise par le hub et
verrouillée sur les noms de ce serveur, et l'utilise pour signer son propre
certificat web. Le certificat de chaque serveur remonte alors jusqu'à la CA du
hub, si bien qu'un seul import les couvre tous.

```
     hub: FOG Server CA
      ├── FOG Web CA - fog1.example.lan   → fog1's web certificate
      ├── FOG Web CA - fog2.example.lan   → fog2's web certificate
      └── FOG Web CA - fog3.example.lan   → fog3's web certificate
```

>[!info] Mettez d'abord à jour l'installateur de chaque serveur
>Ceci utilise `--web-ca-cert`/`--web-ca-key`/`--web-ca-root`. Récupérez le
>dernier installateur sur **chaque** serveur avant de commencer, sinon les
>options ne seront pas reconnues. Voir
>[[command-line-options|Options de ligne de commande de l'installateur FOG]].

### Étape 1 — émettre une CA pour chaque serveur, sur le hub

```bash
sudo packages/pki/fog-mint-web-ca <hostname> <ip> [extra-dns-name ...]
```

`<hostname>` doit être exactement ce que rapporte la commande `hostname` de ce
serveur. Si le serveur est installé avec `--extra-server-name` ou
`--internal-domain`, passez aussi ces noms. Ils sont inscrits dans la CA comme
restrictions, et une CA restreinte aux mauvais noms ne peut pas signer le
certificat pour lequel elle a été créée.

Le script le vérifie pour vous — il signe à titre d'essai un certificat portant
les noms que ce serveur demandera réellement, et refuse de produire une CA qui
le rejetterait. Un mauvais nom d'hôte échoue ici, sur le hub, plutôt que sur le
serveur distant sous la forme d'un serveur web qui refuse de démarrer.

Chaque exécution écrit `/root/fog-web-cas/<name>-webca.tar.gz` contenant trois
fichiers : `webca.pem` (la CA), `webca.key` (sa clé privée) et `fog-root.pem`
(la racine du hub, pour que le serveur distant vérifie la chaîne).

Répétez cela pour chaque serveur avant de continuer — la clé racine du hub doit
être présente pour signer, donc si vous la conservez hors ligne, c'est le seul
moment où elle doit être disponible.

### Étape 2 — copier l'archive vers ce serveur

L'archive se trouve sous `/root` sur le hub, et elle contient une clé privée,
c'est la raison. La plupart des sites n'autorisent pas le SSH root direct,
alors **poussez**-la depuis le hub plutôt que de la tirer — en la faisant
transiter par votre propre compte exactement le temps de la copie :

```bash
# On the hub
sudo cp /root/fog-web-cas/<name>-webca.tar.gz ~/
sudo chown $USER: ~/<name>-webca.tar.gz
scp ~/<name>-webca.tar.gz <you>@<far-server>:~/
rm -f ~/<name>-webca.tar.gz
```

>[!warning] `scp root@hub:/root/... /root/` ne fonctionnera pas
>Aucune des deux extrémités ne coopère : `sshd` est livré avec
>`PermitRootLogin prohibit-password` sur la plupart des distributions, et votre
>compte local non privilégié ne peut pas non plus écrire dans `/root`. Les deux
>échecs affichent simplement `Permission denied`, ce qui se lit facilement,
>à tort, comme un fichier inexistant.

### Étape 3 — l'installer sur ce serveur

```bash
# On the far server
sudo mkdir -p /root/webca
sudo tar -xzf ~/<name>-webca.tar.gz -C /root/webca

cd ~/fogproject/bin
sudo ./installfog.sh --web-ca-cert /root/webca/webca.pem \
                     --web-ca-key  /root/webca/webca.key \
                     --web-ca-root /root/webca/fog-root.pem
```

Décompresser en root dans `/root/webca` garde `webca.key` hors de portée de
tout autre compte de la machine — c'est une clé privée de CA, et elle reste sur
ce serveur en permanence, donc l'endroit où elle atterrit compte. Supprimez
ensuite l'archive de votre répertoire personnel.

Vous passez ces trois options **une seule fois**. Les fichiers sont importés
dans la zone web et les mises à niveau ultérieures réutilisent l'import sans
que les options soient redonnées.

### Étape 4 — faire confiance à la CA du hub partout où c'est nécessaire

Un seul certificat couvre désormais toute la flotte. Sur un client Linux :

```bash
curl -k -o /tmp/fogca.der https://<hub>/fog/management/other/ca.cert.der
openssl x509 -inform DER -in /tmp/fogca.der -out /tmp/fogca.crt

# RHEL / Fedora / Rocky / Alma
sudo cp /tmp/fogca.crt /etc/pki/ca-trust/source/anchors/fog-server-ca.crt
sudo update-ca-trust extract

# Debian / Ubuntu / Alpine
sudo cp /tmp/fogca.crt /usr/local/share/ca-certificates/fog-server-ca.crt
sudo update-ca-certificates
```

Les navigateurs nécessitent leur propre import — voir [Votre navigateur est un
problème à part](#votre-navigateur-est-un-problème-à-part) ci-dessous.

>[!warning] Ce que cela coûte
>Chaque serveur finit par détenir une clé privée de CA. C'est le compromis, et
>c'est pourquoi chaque serveur reçoit **sa propre** CA plutôt qu'une copie
>d'une CA partagée : les restrictions de noms font qu'une clé volée sur `fog2`
>ne peut produire des certificats que pour les noms de `fog2`, pas pour tout
>votre parc.
>
>Ne copiez jamais la même CA sur plusieurs serveurs, et ne copiez jamais la clé
>de la CA du hub où que ce soit. Si détenir un pouvoir de signature sur un
>serveur satellite est inacceptable sur votre site, utilisez l'option C ou
>restez sur l'option A.

## Option C : votre propre PKI ou CA ACME

Si vous exploitez déjà une autorité de certification, émettez pour chaque
serveur FOG une CA intermédiaire à partir d'elle et utilisez les trois mêmes
options. FOG ne se soucie pas de savoir si la CA vient d'un autre serveur FOG
ou de votre PKI — il valide les mêmes choses dans les deux cas.

C'est la meilleure réponse quand elle vous est accessible : aucun serveur FOG
ne détient d'autorité de signature sur un autre, et vos processus existants de
rotation et de révocation s'appliquent normalement. Une CA ACME interne (comme
step-ca) convient le mieux, parce que l'ancre reste en place pendant que les
certificats en dessous se renouvellent automatiquement.

[[external-ca-lets-encrypt|CA externe et certificats Let's Encrypt]] couvre ce
sujet en détail, y compris le modèle de renouvellement et pourquoi le Let's
Encrypt public convient mal à fog-client en particulier.

## Ce que cela change et ne change pas

| | Unifié ? | |
| --- | --- | --- |
| Certificat web / HTTPS | **Oui** | ce que ces options visent |
| Communication fog-client | Non | chaque serveur garde la sienne ; les clients épinglent par serveur |
| Signature Secure Boot | Non | voir [[secure-boot-signing\|Secure Boot : signer FOS avec votre propre clé]] |

**fog-client est délibérément laissé de côté.** Il épingle la CA du serveur
auprès duquel il s'est enregistré, et cette CA n'est *pas* remplacée ici — ce
qui est exactement ce qui rend l'opération sûre sur une flotte en production
sans ré-enregistrer aucune machine.

### Votre navigateur est un problème à part

FOG peut ajouter sa CA au magasin de confiance système d'un serveur, mais **les
navigateurs n'utilisent pas ce magasin.** Firefox tient le sien, et Chrome lit
un magasin par utilisateur. Importez la CA du hub à la main, une seule fois :

- **Firefox** — Settings → Privacy & Security → Certificates → View
  Certificates → Authorities → Import, et cochez *Trust this CA to identify
  websites*.
- **Chrome / Chromium sous Linux** —
  `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "FOG Server CA" -i fogca.crt`

## Vérifier que cela a fonctionné

Par serveur :

```bash
echo | openssl s_client -connect <ip>:443 2>/dev/null | grep -E '^ [0-9] s:| *i:'
```

L'émetteur doit indiquer `CN=FOG Web CA - <hostname>`. Confirmez ensuite qu'il
se rattache réellement au hub :

```bash
echo | openssl s_client -connect <ip>:443 2>/dev/null | openssl x509 -out /tmp/leaf.pem
openssl verify -CAfile /tmp/fogca.crt /tmp/leaf.pem
```

Vous voulez `OK`.

>[!tip] Si l'émetteur est toujours l'ancien, vérifiez le fichier avant d'incriminer l'installation
>L'installation qui écrit le mauvais certificat et le serveur web qui *sert* le
>mauvais fichier sont indiscernables de l'extérieur. Demandez au serveur quel
>fichier il a écrit :
>
>```bash
>sudo openssl x509 -noout -issuer \
>  -in "$(grep -oP "(?<=^sslpubcert=').*(?=')" /opt/fog/.fogsettings)"
>```
>
>`CN = FOG Web CA - <hostname>` ici signifie que l'installation a fonctionné et
>que le problème est du côté du service — voir *« le certificat sur le disque
>est bon mais le serveur envoie l'ancien »* sous
>[Dépannage](#dépannage). Toute autre réponse signifie que
>l'installation elle-même n'a pas pris.
>
>Notez que le chemin vient de `sslpubcert`.
>`/opt/fog/snapins/ssl/.srvpublic.crt` est le certificat de **communication
>client**, une zone différente, et il est *censé* rester signé par la propre CA
>du serveur — lire celui-là à la place vous convaincra qu'une configuration
>fonctionnelle est cassée.

## Dépannage

**Le certificat n'a pas changé après l'installation avec les nouvelles
options.** Les installateurs plus anciens décidaient de re-signer ou non le
certificat web en ne regardant que les *noms* du serveur. Changer de CA
laissait les noms identiques, donc le certificat était laissé tel quel — une
installation propre qui n'a rien changé. Mettez à jour l'installateur et
relancez-le ; la version plus récente remarque que la CA a changé et ré-émet
d'elle-même.

Si l'installateur est déjà à jour, confirmez de quel côté se trouve le problème
avant d'aller plus loin — le certificat a peut-être été ré-émis correctement
sans être celui que le serveur web envoie. Voir l'entrée suivante.

**Le certificat sur le disque est bon mais le serveur envoie l'ancien.**
Le serveur a deux hôtes virtuels FOG dans un même fichier, et utilise le
mauvais. Comptez-les :

```bash
# Apache
grep -c '^<VirtualHost \*:443>' /etc/apache2/sites-available/001-fog.conf
# nginx
grep -c '^server {' /etc/nginx/conf.d/fog.conf
```

`2` le confirme. FOG possède une région balisée de ce fichier afin que vos
propres ajouts survivent à une mise à niveau, et pendant une courte période,
l'exécution qui a introduit ces balises ajoutait le nouveau bloc *sous*
l'existant au lieu de le remplacer — laissant en place, au-dessus, l'ancien
hôte virtuel de FOG. Apache comme nginx utilisent le premier hôte virtuel qui
correspond, donc la copie périmée l'emportait, avec les chemins de certificats
d'avant le changement. Rien ne journalise d'erreur, parce que rien n'est
anormal du point de vue du serveur web.

Mettez à jour l'installateur et relancez-le. Il détecte la copie périmée et la
supprime, en rapportant `Removed a stale FOG vhost left outside the managed
block`. Seul un bloc revendiquant un nom que le propre bloc de FOG revendique
est supprimé, donc un hôte virtuel que vous avez ajouté pour un autre nom est
laissé tranquille ; la sauvegarde horodatée du fichier faite par l'installateur
est conservée dans tous les cas.

**Le serveur web du serveur distant ne démarre pas, ou son certificat est
rejeté.** Son certificat porte un nom que sa CA n'autorise pas. Le certificat
de chaque serveur FOG inclut `fogserver` et `fog-server` en plus de son propre
nom d'hôte, plus tout ce qui a été ajouté avec `--extra-server-name`.
Ré-émettez la CA en passant les noms manquants comme arguments supplémentaires.

**L'installateur me demande les chemins de CA alors que je les ai passés sur la
ligne de commande.** Les installateurs plus anciens demandaient quand même,
puis ignoraient ce que vous tapiez — traverser l'invite avec Entrée était sans
danger. Mettre à jour l'installateur supprime l'invite.

**`Refusing to continue: the root ... carries pathlen:0`.** Cette CA n'est pas
autorisée à avoir une autre CA en dessous d'elle, donc rien de ce qu'elle
signerait ne serait accepté. Utilisez une autre CA, ou l'option A.

## Voir aussi

- [[bringing-your-own-ca|Apporter votre propre CA]] — le mécanisme par zone sur lequel ceci s'appuie
- [[pki-zones|Les zones de certificats de FOG]]
- [[pki-glossary|Glossaire PKI et Secure Boot]]
- [[external-ca-lets-encrypt|CA externe et certificats Let's Encrypt]]
- [[command-line-options|Options de ligne de commande de l'installateur FOG]]
- `docs/MULTI_SERVER_CA.md` dans le dépôt `fogproject` — le même sujet
  avec le raisonnement de conception, pour qui lit le source de l'installateur
