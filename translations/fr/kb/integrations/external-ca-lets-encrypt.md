---
title: CA externe & certificats Let's Encrypt
description: Décrit comment utiliser des CA externes et Let's Encrypt avec FOG
context_id: external-ca-lets-encrypt
aliases:
    - External CA & Let's Encrypt
    - External CA
    - Let's Encrypt
tags:
    - integrations
    - certificates
    - configuration
    - management
    - step-ca
    - acme
    - lets-encrypt
    - security
    - pki
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/integrations/external-ca-lets-encrypt).

# CA externe &amp; certificats Let's Encrypt

FOG génère sa propre CA racine auto-signée au moment de l'installation et
émet une intermédiaire distincte pour le serveur web et pour la
communication chiffrée de fog-client — voir
[[pki-zones|Les zones de certificats de FOG]] pour la vue d'ensemble.
Cette page couvre le remplacement du **certificat web** par votre propre CA
ou par Let's Encrypt : l'épinglage de fog-client qui rend cela non trivial,
le mécanisme `--external-ca`, et les recettes ACME/Let's Encrypt. Les
téléchargements de démarrage réseau propres à iPXE (`boot.php`, noyau,
initrd) sont un **cas séparé, sans lien avec tout ceci** — voir
[Comment iPXE valide HTTPS](#comment-ipxe-valide-https) ci-dessous.

À cause de l'épinglage de fog-client, vous ne pouvez pas simplement déposer
un certificat Let's Encrypt sur le vhost Apache et vous attendre à ce que
les **clients** continuent de fonctionner — fog-client valide la chaîne de
certificats du serveur contre la CA qu'il a épinglée lors de son
enregistrement. Cette page explique la manière prise en charge d'utiliser
votre **propre** CA pour cela (y compris une CA interne de type ACME /
Let's Encrypt), les compromis de l'utilisation du Let's Encrypt **public**
spécifiquement pour fog-client, et les mises en garde de renouvellement que
vous devez anticiper. Rien de tout cela ne s'applique aux téléchargements de
démarrage réseau propres à iPXE, qui peuvent déjà valider un certificat
Let's Encrypt public sans aucun changement côté FOG — voir ci-dessous.

> **TL;DR**
> - **Les téléchargements de démarrage réseau d'iPXE fonctionnent déjà avec
>   un certificat Let's Encrypt public sur le vhost web**, sans aucun
>   changement dans FOG. Cela n'a aucun rapport avec l'état de Secure Boot.
>   Voir [Comment iPXE valide HTTPS](#comment-ipxe-valide-https). (Cela
>   suppose que le client qui démarre puisse atteindre `ca.ipxe.org`, ce qui
>   est vrai pour la plupart des sites — les réseaux isolés sont l'exception,
>   pas la règle.)
> - **fog-client est la véritable contrainte.** Utilisez la prise en charge
>   `--external-ca` de l'installateur, ou les nouveaux drapeaux par zone
>   `--web-ca-*` (FOG 1.6), pour signer le certificat web de FOG avec
>   **votre propre** CA intermédiaire.
> - Une **CA ACME interne** (p. ex.
>   [step-ca / smallstep](https://github.com/smallstep/certificates)) est la
>   solution la mieux adaptée à fog-client — elle vous donne l'automatisation
>   ACME sans exposer FOG publiquement, et la CA que vous épinglez est
>   stable.
> - Le Let's Encrypt **public** spécifiquement pour fog-client est possible
>   mais fragile : il exige un nom résolvable publiquement (ou une
>   automatisation DNS-01), et LE fait tourner ses intermédiaires, ce qui
>   casse le modèle d'épinglage au renouvellement. Lisez les
>   [mises en garde](#lets-encrypt-public--mises-en-garde) avant de vous engager
>   dans cette voie.

---

## Table des matières

- [Comment FOG utilise les certificats](#comment-fog-utilise-les-certificats)
- [Comment iPXE valide HTTPS](#comment-ipxe-valide-https)
- [Ce que fait `--external-ca`](#ce-que-fait---external-ca)
- [Recommandé : CA ACME interne (step-ca)](#recommandé--ca-acme-interne-step-ca)
- [Let's Encrypt public : mises en garde](#lets-encrypt-public--mises-en-garde)
- [Renouvellement et rotation](#renouvellement-et-rotation)
- [Basculer un serveur existant vers une CA externe](#basculer-un-serveur-existant-vers-une-ca-externe)
- [Dépannage](#dépannage)

---

## Comment FOG utilise les certificats

| Consommateur | Ce qu'il utilise | D'où cela vient |
|----------|--------------|---------------------|
| **Serveur web (Apache/Nginx)** | le certificat feuille web, servi en HTTPS | Émis par la CA Web — voir [[pki-zones]] |
| **iPXE** | Valide le certificat feuille réel du vhost contre tout ce à quoi il peut le chaîner — la propre CA de FOG (si intégrée) **ou** n'importe quelle CA publiquement reconnue via un mécanisme de repli intégré | Voir [Comment iPXE valide HTTPS](#comment-ipxe-valide-https) |
| **fog-client** | Épingle `ca.cert.der` et exige que le certificat du serveur s'y chaîne | Téléchargé depuis `/management/other/ca.cert.der` |

Le détail critique pour **fog-client** est le **certificat épinglé**. Le
client ajoute *uniquement* `ca.cert.der` à son magasin de validation et
exige que ce certificat exact apparaisse dans la chaîne du serveur. Cela
signifie :

> `ca.cert.der` doit être le certificat qui **signe directement** le
> certificat du serveur — c'est-à-dire l'**intermédiaire**, pas la racine.

C'est pourquoi « il suffit de pointer Apache vers un certificat Let's
Encrypt » ne fonctionne pas **pour fog-client** : le client n'a jamais
épinglé l'intermédiaire de LE, donc la validation échoue. Le même
remplacement ne pose pas ce problème pour iPXE — voir la section suivante.

>[!note] Ce n'est pas le même certificat que la signature Secure Boot
>La CA Secure Boot de FOG et sa feuille de signature sont une zone
>complètement séparée — clé différente, certificat différent, générés
>séparément, stockés séparément. Rien ici (`--external-ca`, un certificat
>Let's Encrypt, ou quoi que ce soit d'autre sur cette page) ne touche la
>signature Secure Boot, et rien concernant Secure Boot ne touche le
>certificat dont traite cette page. Voir
>[[secure-boot-signing|Signature Secure Boot]] et
>[[pki-glossary|le glossaire PKI]] si les termes utilisés ici et là ne vous
>semblent pas cohérents.

---

## Comment iPXE valide HTTPS

Il est tentant de supposer qu'iPXE est dans la même situation que
fog-client — que sa confiance se limite à la CA que FOG a intégrée au moment
de la compilation. Ce n'est pas le cas :

1. **Une CA intégrée est additive, pas exclusive.** La compilation iPXE
   propre à FOG peut intégrer une CA comme racine épinglée, mais cela ne
   supprime pas l'autre mécanisme par défaut inconditionnel d'iPXE décrit
   ci-après.
2. **iPXE embarque par défaut un repli vers les CA publiques, quelle que
   soit la CA intégrée.** iPXE standard définit inconditionnellement un
   point de contre-signature (`ca.ipxe.org`). Quand iPXE rencontre une
   chaîne de certificats qu'il ne peut pas valider autrement, il récupère
   depuis `ca.ipxe.org` un certificat contre-signé se portant garant des
   CA publiques du monde réel — racine de Let's Encrypt incluse. C'est une
   fonctionnalité d'iPXE standard, pas un ajout de FOG.
3. **La compilation propre à FOG ne le désactive jamais.** La surcouche de
   configuration de FOG pour iPXE ne remplace qu'une poignée de fichiers et
   ne touche jamais la configuration cryptographique, donc le repli vers
   les CA publiques reste actif dans chaque binaire compilé par FOG.
4. **Les binaires republiés signés pour Secure Boot n'intègrent aucune CA
   du tout.** Ils sont republiés octet pour octet depuis la version signée
   du projet iPXE lui-même, qui ne définit jamais d'argument de compilation
   équivalent à `TRUST=` — ces binaires reposent donc uniquement sur le
   repli standard vers les CA publiques.

**Effet net :** un vhost web FOG avec un vrai certificat Let's Encrypt se
valide correctement pour les téléchargements de démarrage réseau d'iPXE
(`boot.php`, noyau, initrd) **sans aucun changement côté FOG**, aussi bien
avec la compilation propre à FOG qu'avec les binaires republiés signés pour
Secure Boot, et indépendamment de l'état d'enrôlement Secure Boot. Cela
suppose que le client qui démarre puisse atteindre `ca.ipxe.org`, ce qui
est vrai pour la plupart des sites — l'accès Internet sortant est le cas
courant, pas l'exception. Ce n'est que sur un réseau totalement isolé que
ce repli ne s'applique pas ; dans ce cas, c'est la CA intégrée propre à FOG
qui fait fonctionner le démarrage HTTPS —
voir [[pki-zones#HTTPS et netboot|HTTPS et démarrage réseau]].
**fog-client reste la véritable contrainte pour l'utilisation du Let's
Encrypt public** — voir le reste de cette page.

>[!note] Confirmé par des tests ad hoc
>Un vrai certificat Let's Encrypt sur le vhost se valide bien pour le
>démarrage réseau iPXE sans changement côté FOG, comme l'affirme cette
>section. Y parvenir en pratique a demandé deux réglages au-delà du simple
>dépôt du certificat : `httpproto` dans `.fogsettings` réglé sur `https`,
>et `FOG_WEB_HOST` (dans la page Paramètres de l'interface web de FOG)
>réglé sur le FQDN du serveur, pas sur son adresse IP.

---

## Ce que fait `--external-ca`

L'installateur peut signer le certificat web de FOG avec une CA que **vous**
fournissez au lieu de générer la sienne. Vous fournissez trois fichiers :

| Drapeau | Fichier | Remarques |
|------|------|-------|
| `--ca-cert` | **Certificat** de la CA intermédiaire (PEM) | Doit être un vrai certificat de CA (`basicConstraints CA:TRUE`) |
| `--ca-key`  | **Clé privée** de la CA intermédiaire (PEM) | Doit correspondre à `--ca-cert` |
| `--ca-root` | Certificat de la CA **racine** (PEM) | `--ca-cert` doit se vérifier contre celui-ci |

Activez-le avec `--external-ca`, ou répondez à l'invite interactive pendant l'installation :

```bash
./installfog.sh \
    --external-ca \
    --ca-cert /root/pki/intermediate.crt \
    --ca-key  /root/pki/intermediate.key \
    --ca-root /root/pki/root.crt
```

>[!info] FOG 1.6 ajoute un équivalent par zone
>`--web-ca-cert`/`--web-ca-key`/`--web-ca-root` font la même chose sous un
>nom qui indique clairement quelle zone ils ciblent — voir
>[[pki-zones#Apporter votre propre CA|Apporter votre propre CA]].
>`--external-ca` est antérieur à la séparation en zones et a toujours
>signifié en pratique « la zone Web ». La coexistence à long terme des deux
>formes n'est pas tranchée ; considérez `--web-ca-*` comme la forme
>actuellement recommandée si elle vous est disponible, et `--external-ca`
>comme la forme à utiliser sinon. Dans tous les cas, cela ne remplace que
>la zone **Web** — la paire de clés de communication client n'est pas
>remplaçable de cette manière ; voir
>[[pki-zones#Apporter votre propre CA|Apporter votre propre CA]] pour la raison.

Ce que l'installateur fait avec ces fichiers :

1. Vérifie que la clé correspond au certificat, que le certificat est une
   CA, et que l'intermédiaire se chaîne à la racine. Tout échec **annule**
   l'installation.
2. Importe les fichiers dans le répertoire de la CA Web de FOG
   (`/opt/fog/pki/root/ca/` sur les installations antérieures à la
   séparation en zones ; les drapeaux spécifiques à la zone Web importent
   dans `/opt/fog/pki/web/ca/` à la place) comme certificat de CA, clé et
   chaîne.
3. Signe la feuille web avec votre intermédiaire.
4. Exporte l'**intermédiaire** en tant que `ca.cert.der` — c'est ce que
   fog-client épingle. (Épingler la racine casserait la validation client,
   car la racine n'est pas ce qui signe directement le certificat du
   serveur.)
5. Transmet la chaîne complète au serveur web, et — si vous intégrez une CA
   dans iPXE pour le démarrage réseau HTTPS, voir
   [[pki-zones#HTTPS et netboot|HTTPS et démarrage réseau]] — à la
   compilation iPXE.

Les valeurs pertinentes sont persistées dans `.fogsettings` afin qu'une
réexécution de l'installateur les réutilise. Si les fichiers sources ne
sont plus lisibles lors d'une exécution ultérieure, l'installateur réutilise
la CA déjà importée sur le disque.

---

## Recommandé : CA ACME interne (step-ca)

C'est la façon la plus propre d'obtenir une automatisation « à la Let's
Encrypt » sans aucun des inconvénients du LE public. Vous exécutez une
petite CA interne qui parle ACME, vous pointez `acme.sh`/`certbot` vers
elle, et vous fournissez la CA résultante à FOG via `--external-ca` (ou les
drapeaux par zone `--web-ca-*`).

Mise en place de haut niveau :

1. **Déployez [step-ca](https://github.com/smallstep/certificates)** sur une
   machine que vous contrôlez. Elle vous émet une CA **racine** et une CA
   **intermédiaire**.
2. **Installez FOG avec `--external-ca`** (ou `--web-ca-*`), en passant le
   certificat/la clé de l'intermédiaire de step-ca et le certificat racine.
   Le certificat web de FOG est désormais signé par votre intermédiaire ;
   les clients épinglent cet intermédiaire.
3. **Émettez / renouvelez la feuille web via ACME** contre step-ca (p. ex.
   `acme.sh --server https://step-ca.internal/acme/acme/directory`).
   Comme la feuille est signée par le **même** intermédiaire que les
   clients ont déjà épinglé, renouveler la feuille ne casse **pas**
   l'authentification des clients.
4. Après chaque renouvellement, installez la feuille renouvelée là où
   Apache/Nginx la sert (un hook de renouvellement — voir
   [Renouvellement et rotation](#renouvellement-et-rotation)).

**FOG n'automatise rien de tout cela, à dessein** — exécuter un client ACME
est un problème résolu avec plusieurs bonnes implémentations, et si FOG en
enrobait un, il devrait assumer ses modes de défaillance, sa planification
de renouvellement et sa gestion des identifiants sans rien apporter que ces
outils ne fassent déjà mieux.

Pointez le hook d'installation/renouvellement de votre client ACME vers les
deux chemins que le vhost de FOG lit — `sslpubcert` et `sslprivkey` dans
`/opt/fog/.fogsettings` — et rechargez le serveur web ensuite :

```bash
acme.sh --issue --server https://step-ca.internal/acme/acme/directory \
    -d fog.example.com --webroot /var/www/html
acme.sh --install-cert -d fog.example.com \
    --key-file       /opt/fog/pki/web/leaf/.webLeaf.key \
    --cert-file      /opt/fog/pki/web/leaf/.webLeaf.pem \
    --ca-file        /opt/fog/pki/web/ca/.fogWebCAchain.pem \
    --reloadcmd      "systemctl reload httpd"     # apache2 on Ubuntu
```

`--cert-file` (feuille seule) correspond à `sslpubcert` ; `--ca-file`
(intermédiaire seul) correspond à `sslcachain` — reflétant la séparation
`SSLCertificateFile`/`SSLCertificateChainFile` d'Apache. N'utilisez pas
`--fullchain-file` pour `sslpubcert`, sinon le vhost finit par lister
l'intermédiaire deux fois.

Utilisez un greffon DNS-01 au lieu de `--webroot` si vous ne voulez pas
exposer le port 80 — ce qui est le cas habituel pour un serveur d'imagerie
interne, et la seule option praticable pour le Let's Encrypt public sur un
serveur qui n'est pas joignable publiquement.

**Dites à l'installateur d'arrêter de gérer la feuille.** Ajoutez ceci à
`/opt/fog/.fogsettings` :

```
acmeLeaf=yes
sslprivkey=/opt/fog/pki/web/leaf/.webLeaf.key
sslpubcert=/opt/fog/pki/web/leaf/.webLeaf.pem
sslcachain=/opt/fog/pki/web/ca/.fogWebCAchain.pem
```

Sans cela, la prochaine exécution de `installfog.sh` régénère la feuille à
partir d'une clé publique périmée alors que la clé privée sur le disque est
celle que votre client ACME a installée — un certificat et une clé qui ne
correspondent pas, et un serveur web qui refuse de démarrer.
`--recreate-keys` et `--recreate-CA` outrepassent délibérément ce marqueur,
puisque les deux régénèrent de toute façon la paire de clés et qu'une paire
auto-signée est le repli correct à ce stade.

>[!note] C'était autrefois un piège bien plus dangereux
>Avant la séparation des zones de certificats de FOG, la clé privée du
>serveur web était le *même fichier* que `FOGBase::certDecrypt()` utilisait
>pour déchiffrer chaque poignée de main d'autorisation de fog-client. Un
>client ACME installant une clé web renouvelée par-dessus ce fichier
>installait un certificat parfaitement valide et empêchait silencieusement
>tous les clients de s'authentifier, sans rien dans les journaux reliant
>les deux. Ce couplage a disparu — le serveur web a maintenant sa propre
>paire de clés, et écrire une clé ACME par-dessus ne touche plus du tout
>l'authentification des clients. Voir
>[[pki-zones|Les zones de certificats de FOG]] pour la séparation complète.

Pourquoi c'est mieux que le LE public : **l'intermédiaire que vous épinglez
est stable et sous votre contrôle**, donc les renouvellements de feuille
sont transparents pour les clients, et rien n'a besoin d'être résolvable
publiquement.

---

## Let's Encrypt public : mises en garde

Tout dans cette section concerne l'épinglage de **fog-client**, pas iPXE —
un certificat Let's Encrypt public sur le vhost fonctionne déjà pour les
téléchargements de démarrage réseau d'iPXE sans autre réserve que
l'accessibilité Internet (voir
[Comment iPXE valide HTTPS](#comment-ipxe-valide-https)). Pour fog-client,
vous *pouvez* utiliser le vrai Let's Encrypt public, mais comprenez à quoi
vous vous engagez avant de le faire.

1. **Vous avez besoin d'un nom résolvable publiquement.** La validation
   HTTP-01 exige que LE atteigne votre serveur sur le port 80 via
   l'Internet public. La plupart des serveurs FOG sont des machines
   d'imagerie internes et ne devraient **pas** être exposées. Utilisez la
   validation **DNS-01** (`acme.sh`/`certbot` avec l'API de votre
   fournisseur DNS) pour obtenir un certificat public sans exposer la
   machine.

2. **LE ne vous donne pas de clé de CA.** Avec le LE public vous ne recevez
   jamais que des certificats **feuilles** — vous ne détenez jamais la clé
   privée de l'intermédiaire de LE. Vous ne pouvez donc pas utiliser
   `--external-ca` pour que FOG *signe* avec LE. À la place, vous
   épingleriez l'**intermédiaire** de LE comme CA et laisseriez LE émettre
   votre feuille. Cela ne fonctionne que tant que le point suivant tient :

3. **LE fait tourner ses intermédiaires.** Let's Encrypt change
   périodiquement ses CA intermédiaires (p. ex. R10/R11/R3…), et les
   clients ACME peuvent recevoir des certificats de chaînes différentes.
   Dès que votre feuille renouvelée est signée par un intermédiaire que vos
   clients n'ont **pas** épinglé, l'authentification des clients casse
   jusqu'à ce que chaque client ré-épingle. C'est la raison centrale pour
   laquelle le LE public est fragile pour FOG et une CA ACME interne est
   préférée.

> **En résumé :** si vous voulez l'automatisation ACME, exécutez une CA ACME
> **interne**. N'utilisez le LE public que si vous avez réellement besoin de
> certificats publiquement reconnus (p. ex. un portail exposé au public) et
> que vous avez un plan pour ré-épingler les clients quand LE fait tourner
> ses intermédiaires.

---

## Renouvellement et rotation

La configuration des certificats de FOG se fait au **moment de
l'installation**. Elle ne se renouvelle **pas** automatiquement. Quand un
certificat est renouvelé, c'est à vous de le mettre en place, et — si la
**CA que vous avez épinglée change** — de redistribuer la confiance :

- **Renouvellement de feuille, même CA épinglée** (le cas normal avec
  step-ca, ou le propre `renewal-helper --zone web` de FOG si votre feuille
  n'est pas gérée par ACME — voir
  [[pki-zones#Renouvellement des feuilles|Renouvellement de feuille]]) : déposez simplement
  la nouvelle feuille là où le serveur web la lit et rechargez le serveur
  web. Les clients et iPXE ne sont pas affectés.
- **La CA épinglée (intermédiaire) change** (rotation du LE public, ou vous
  faites tourner votre intermédiaire interne) : c'est le cas perturbateur.
  Vous devez :
  1. Réexécuter l'installateur FOG pour que `ca.cert.der` et la
     configuration du serveur web soient régénérés avec la nouvelle CA.
  2. Faire **ré-épingler** le nouveau `ca.cert.der` par le fog-client de
     chaque machine (réexécutez l'installateur du client ou votre flux de
     réenregistrement, quel qu'il soit).
  3. Si vous utilisez une compilation iPXE avec CA intégrée pour le HTTPS
     de démarrage réseau, faites aussi récupérer aux clients PXE les
     **binaires iPXE recompilés**.

Il n'existe actuellement **aucun** ré-épinglage automatique des clients ni
déclencheur de recompilation d'iPXE au renouvellement. Planifiez la durée de
vie de vos CA en conséquence : des intermédiaires stables à longue durée de
vie, des feuilles à courte durée de vie.

---

## Basculer un serveur existant vers une CA externe

Si vous réexécutez l'installateur avec `--external-ca` (ou `--web-ca-*`) sur
un serveur qui a déjà émis une CA auto-signée, l'installateur détecte que le
certificat web existant ne se vérifie plus contre la nouvelle chaîne et
affiche un avertissement : le certificat web est régénéré sous la nouvelle
CA, et **toute machine dont le fog-client a déjà épinglé l'ancien certificat
ne fera plus confiance au serveur tant qu'elle n'aura pas ré-épinglé**.
Réexécutez l'installateur de fog-client après le basculement. Si vous
comptez aussi sur une compilation iPXE avec CA intégrée pour le démarrage
réseau HTTPS, redémarrez les clients PXE pour qu'ils récupèrent le binaire
recompilé.

---

## Dépannage

- **`The supplied CA private key does not match the supplied CA certificate`** —
  `--ca-key` et `--ca-cert` (ou `--web-ca-key`/`--web-ca-cert`) ne forment
  pas une paire. Confirmez avec :
  `openssl x509 -noout -modulus -in cert | openssl md5` contre
  `openssl rsa -noout -modulus -in key | openssl md5`.
- **`The supplied certificate is not a CA certificate`** — le certificat n'a
  pas `basicConstraints CA:TRUE`. Vous avez passé une feuille, pas une CA
  intermédiaire.
- **`The intermediate CA does not verify against the supplied root`** —
  l'intermédiaire ne se chaîne pas à la racine que vous avez fournie.
  Vérifiez que vous avez exporté la bonne racine.
- **Les clients cessent de faire confiance au serveur après un
  renouvellement** — la CA épinglée a changé. Voir
  [Renouvellement et rotation](#renouvellement-et-rotation) ; les clients doivent
  ré-épingler le nouveau `ca.cert.der`.

---

## Voir aussi

- [[pki-zones|Les zones de certificats de FOG]]
- [[bringing-your-own-ca|Apporter votre propre CA]]
- [[pki-glossary|Glossaire PKI & Secure Boot]]
- [[secure-boot-signing|Signature Secure Boot]]

*Connexe : ceci est la réponse prise en charge à la demande de « prise en
charge de Let's Encrypt » (ticket #633) ; la prise en charge sous-jacente
des CA externes/intermédiaires dans l'installateur a été ajoutée pour le
ticket #794.*
