---
title: Authentification LDAP
aliases:
    - LDAP
    - LDAP Plugin
    - Active Directory Login
    - Directory Authentication
description: Comment le greffon LDAP authentifie les utilisateurs auprès d'un annuaire et quel rôle chacun reçoit
context_id: ldap
tags:
    - 1_6-changes
    - management
    - users
    - roles
    - permissions
    - plugins
    - ldap
    - web-ui
    - web-management
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/ldap).

# Authentification LDAP

## Vue d'ensemble

Le greffon **LDAP** permet aux utilisateurs de se connecter à FOG avec leur
compte d'annuaire — Active Directory, OpenLDAP, FreeIPA ou tout serveur
LDAP générique — plutôt qu'avec un mot de passe stocké dans FOG.

!!! note "Cette page décrit FOG 1.6"

    Deux choses fonctionnent différemment en 1.5, et toutes deux sont
    traitées là où elles se présentent ci-dessous : ce qu'accorde une
    connexion par annuaire
    ([rôles et groupes d'utilisateurs](#ce-quobtient-un-utilisateur-dannuaire), où la
    1.5 ne dispose que d'un groupe administrateur et d'un groupe
    utilisateur), et les [groupes imbriqués](#groupes-imbriqués).

Vous ne créez pas ces utilisateurs à la main. La première fois que
quelqu'un se connecte avec succès, FOG lui crée automatiquement un compte
utilisateur correspondant, puis le rafraîchit à chaque connexion suivante.

## Ce que FOG conserve pour un utilisateur d'annuaire

- **Le mot de passe de l'annuaire n'est jamais stocké.** Le compte est
  marqué comme authentifié par l'annuaire lui-même ; le champ du mot de
  passe est rempli d'une valeur aléatoire qu'aucun mot de passe saisi ne
  pourra jamais égaler.
- Le compte est estampillé de sa **source**, afin que FOG sache qu'il
  provient d'un annuaire plutôt que d'avoir été créé localement. C'est cet
  estampillage qui empêche la mise à niveau, l'export CSV et le chemin de
  connexion local de traiter les comptes d'annuaire comme des utilisateurs
  FOG ordinaires.

!!! note "Migration depuis une version antérieure"

    Les versions plus anciennes de ce greffon stockaient dans FOG une
    empreinte du véritable mot de passe d'annuaire de l'utilisateur. Ces
    lignes sont nettoyées automatiquement à la première connexion de chaque
    utilisateur après la mise à niveau.

## Se connecter en LDAPS

Cochez **Use LDAP SSL** sur le serveur et FOG se connecte en `ldaps://`
plutôt qu'en `ldap://`, sur le port que vous avez défini — normalement 636.
Deux champs de l'onglet **Général** du serveur déterminent ensuite avec
quelle rigueur FOG contrôle le certificat présenté par l'annuaire.

| **Certificate Verification** | Ce que fait FOG |
|---|---|
| **Inherit - use the system ldap.conf setting** | Ce que dit `TLS_REQCERT` sur le serveur FOG lui-même. La valeur par défaut. |
| **Hard - require a valid certificate** | Le certificat doit être approuvé *et* correspondre à l'adresse à laquelle FOG se connecte, sans quoi la connexion échoue. |
| **Never - do not verify (insecure)** | La connexion est chiffrée, mais le certificat n'est pas contrôlé du tout. |

**CA Certificate Path** est le chemin absolu vers un fichier PEM contenant
l'autorité de certification qui a signé le certificat de votre annuaire.
Laissez ce champ vide lorsque cette autorité figure déjà dans le magasin de
confiance du système du serveur — ce qui est le cas de tout certificat émis
publiquement, ainsi que d'une autorité privée que vous avez installée à
l'échelle du système.

Ces deux champs sont ignorés sur un serveur dont **Use LDAP SSL** est
désactivé, puisqu'il n'y a alors aucun certificat à contrôler. Il n'existe
pas d'option StartTLS : une connexion est soit en LDAPS, soit en LDAP
simple.

### « Inherit » désigne le système d'exploitation, pas FOG

**Inherit** n'hérite de rien qui vienne de FOG. Cela signifie *je n'impose
rien de mon côté*, ce qui laisse la décision à la bibliothèque cliente
OpenLDAP du serveur FOG. Cette bibliothèque la résout à partir de la
configuration, dans cet ordre :

1. la variable d'environnement `LDAPTLS_REQCERT`, si elle est définie ;
2. `TLS_REQCERT` dans `$LDAPCONF`, `/etc/openldap/ldap.conf` ou
   `/etc/ldap/ldap.conf`, selon celui qui existe ;
3. `demand` — vérifier, et refuser la connexion si la vérification échoue —
   lorsqu'aucun des précédents ne dit quoi que ce soit.

Ainsi, sur un serveur non modifié, **Inherit** vérifie. Si quelqu'un a
auparavant assoupli `TLS_REQCERT` sur ce serveur pour faire fonctionner une
autorité de certification interne, **Inherit** maintient ce dispositif en
place — et c'est précisément pour cela qu'il s'agit de la valeur par
défaut. Le greffon n'imposait aucun réglage TLS qui lui soit propre avant
l'existence de ces champs : c'était donc `ldap.conf` qui gouvernait, et
basculer par défaut sur **Hard** lors de la mise à niveau aurait cassé
toutes les installations qui en dépendaient.

### Les deux champs sont propres à chaque serveur, délibérément

Une même installation FOG peut avoir un Active Directory et un OpenLDAP
configurés en même temps, et la possibilité que la vérification aboutisse
est une propriété de l'*annuaire*, pas de FOG. Mettre un serveur sur
**Hard** avec sa propre autorité de certification laisse intact le réglage
de tous les autres serveurs.

!!! warning "Never est un outil de diagnostic, pas une solution"

    **Never** chiffre le trafic mais accepte absolument n'importe quel
    certificat, y compris celui présenté par une machine qui n'est pas
    votre serveur d'annuaire. Utilisez-le pour confirmer qu'un problème de
    connexion est bien lié au certificat, puis corrigez le certificat et
    quittez ce réglage.

### Faire fonctionner Hard avec une autorité de certification privée

Deux conditions doivent être remplies, et seule la première est évidente :

- **FOG doit faire confiance à l'autorité de certification.** Faites
  pointer **CA Certificate Path** vers le fichier PEM de cette autorité, ou
  installez-la dans le magasin de confiance du système du serveur.
- **Le certificat doit nommer l'adresse à laquelle FOG se connecte.** Un
  certificat émis avec `CN=dc1.example.local` et sans subjectAltName ne
  sera pas validé si l'adresse du serveur dans FOG est une adresse IP,
  aussi correctement l'autorité soit-elle approuvée. L'échec se lit
  *hostname does not match name in peer certificate*. Corrigez-le en
  saisissant dans **LDAP Server Address** le nom que porte le certificat,
  ou en réémettant le certificat avec l'adresse que vous utilisez
  réellement comme subjectAltName.

!!! note "Le chemin doit être absolu, et lisible par PHP"

    Un chemin relatif est résolu par rapport au répertoire de travail du
    processus PHP, qui n'est pas celui auquel vous vous attendriez —
    indiquez toujours un chemin complet commençant par `/`.

    Le fichier est ouvert par l'**utilisateur du pool PHP-FPM**, qui n'est
    pas nécessairement le compte propriétaire de votre racine web (sur
    RedHat avec nginx, PHP s'exécute sous `apache` tandis que nginx
    s'exécute sous `nginx`). Si FOG ne parvient pas à lire le fichier, il
    écrit une ligne dans le journal d'erreurs du serveur web et poursuit
    **sans** lui — une autorité de certification privée cesse donc
    discrètement d'être approuvée et **Hard** se met à échouer jusqu'à ce
    que les permissions soient corrigées.

    FOG ne refuse délibérément pas un chemin illisible au moment de
    l'enregistrement. Les administrateurs configurent couramment un
    serveur avant que son certificat ne soit en place, et refuser
    l'enregistrement rendrait cela impossible.

!!! note "Réglable également en dehors de l'interface web"

    Ces deux champs font partie de l'export et de l'import CSV des serveurs
    LDAP, et sont tous deux lisibles et modifiables sur `/fog/ldap/<id>` via
    l'[API REST](../../kb/integrations/api.md). Un niveau de vérification
    illégal, ou un chemin d'autorité relatif ou trop long, y est refusé par
    un **406** nommant la valeur rejetée — la même règle que celle
    qu'applique le formulaire.

## Ce qu'obtient un utilisateur d'annuaire

Les utilisateurs d'annuaire sont soumis aux [rôles](roles.md) exactement
comme les autres et — comme les autres — **un utilisateur d'annuaire sans
rôle n'a aucun accès**. C'est le greffon qui décide de ce que rapporte
chaque connexion.

Vous associez **chaque groupe d'annuaire à ce qu'il doit accorder**. Dans
l'onglet **Général** du serveur, cliquez sur **Create New LDAP Group**,
saisissez le nom du groupe d'annuaire et choisissez le serveur auquel il
appartient. Ouvrez ensuite ce groupe et utilisez ses onglets **Role
Association** et **User Group Association** pour indiquer quels
[rôles](roles.md) et quels groupes d'utilisateurs FOG il distribue.

L'onglet **Grants** du serveur lui-même en est un récapitulatif en lecture
seule : un tableau listant chaque groupe d'annuaire du serveur et les rôles
qu'il accorde, un autre listant les groupes d'utilisateurs. Les attributions
elles-mêmes se modifient toujours sur le groupe, pas ici.

Les associations de groupes sont **cumulatives**. Un utilisateur membre de
trois groupes associés reçoit tout ce que ces trois groupes accordent ; il
n'y a ni hiérarchie ni règle du « plus élevé l'emporte ». Les groupes
d'annuaire que vous n'avez pas associés n'accordent rien.

!!! note "En FOG 1.5, il s'agit de deux groupes et deux niveaux"

    La 1.5 dispose d'un **groupe administrateur** et d'un **groupe
    utilisateur** par serveur, et une connexion atterrit dans celui auquel
    elle correspond — administrateur, ou le niveau restreint « mobile ». Il
    n'y a pas d'association par groupe, pas de rôles et pas d'attribution
    de groupes d'utilisateurs. La mise à niveau convertit ces deux listes
    en associations ; voir la note ci-dessous sur l'utilité des deux
    réglages de rôle qui subsistent.

Un réglage de **LDAP → Global Options** couvre le cas où il n'y a aucun
groupe à examiner :

| Réglage | S'applique à |
|---|---|
| **Role when group matching is off** | Le serveur pour lequel la correspondance par groupe est désactivée |

Le laisser vide signifie qu'une telle connexion ne rapporte aucun rôle, et
donc aucun accès.

!!! warning "Correspondance par groupe désactivée signifie *tout le monde*"

    Sur un serveur dont la correspondance par groupe est désactivée, FOG
    peut authentifier le compte mais n'a aucun moyen de distinguer un
    administrateur de qui que ce soit d'autre. Le rôle « correspondance par
    groupe désactivée » est donc accordé à **tous les comptes de l'annuaire
    capables de s'authentifier** — et non à un sous-ensemble. Choisissez-le
    en conséquence, ou laissez-le vide.

!!! note "Où sont passés les anciens réglages de groupe admin/utilisateur"

    Les versions antérieures avaient un unique **groupe administrateur** et
    un unique **groupe utilisateur** par serveur, chacun associé à un rôle.
    Ils sont devenus des associations par groupe, afin que des groupes
    différents puissent accorder des rôles différents. Vos listes de
    groupes existantes sont converties automatiquement lors de la mise à
    niveau, en prenant pour cibles les réglages **Role for LDAP admin
    group** et **Role for LDAP user group** — ce à quoi se limite désormais
    l'utilité de ces deux réglages. L'accès de personne ne change du fait
    de cette conversion.

### Les attributions sont recalculées à chaque connexion

Les rôles et groupes d'utilisateurs ci-dessus sont recalculés depuis
l'annuaire à chaque connexion de l'utilisateur. Retirez quelqu'un d'un
groupe associé dans votre annuaire et sa prochaine connexion à FOG lui
retirera tout ce que ce groupe accordait.

Tout ce qu'un administrateur a attaché à cet utilisateur **à la main** est
laissé intact. Cette exception est délibérée : sans elle, la synchronisation
révoquerait silencieusement des attributions faites exprès, et vous n'auriez
aucun moyen d'accorder quoi que ce soit de plus à un utilisateur d'annuaire.

## Groupes imbriqués

Par défaut, un utilisateur doit être membre **direct** d'un groupe associé.
Si votre annuaire imbrique les groupes — un groupe associé dont les membres
comprennent d'*autres* groupes — ces utilisateurs ne correspondent à rien
tant que vous n'avez pas activé l'imbrication.

Par exemple, avec seulement `all-techs` associé :

```
all-staff ──▶ all-techs ──▶ chicago-techs ──▶ alice
```

`alice` est membre de `chicago-techs`, lui-même membre de `all-techs`. Avec
l'imbrication désactivée, elle ne correspond à rien, car elle n'est membre
direct d'aucun groupe associé. Notez que `chicago-techs` n'a **pas** besoin
d'être associé — l'imbrication consiste à atteindre les groupes associés à
travers des groupes qui ne le sont pas.

Ce réglage se fait **par serveur**, sur la page du serveur lui-même, car le
fait que l'imbrication fonctionne et ce qu'elle coûte dépendent de
l'annuaire :

| **Nested Groups** | Ce que cela fait |
|---|---|
| **Off - direct membership only** | Le comportement actuel. Membres directs uniquement. |
| **Expand - walk the chain (any directory)** | FOG remonte lui-même l'arborescence des groupes, avec une requête par niveau. Fonctionne sur **tous** les annuaires. |
| **Chain - LDAP_MATCHING_RULE_IN_CHAIN (AD only)** | L'annuaire résout toute la chaîne côté serveur, en une seule requête. |

**Dans le doute, choisissez Expand.** Cela fonctionne partout et le coût est
faible. Choisissez **Chain** sur Active Directory lorsque vous voulez le
nombre de requêtes le plus bas possible.

!!! warning "L'imbrication élargit l'accès, y compris pour ceux qui correspondaient déjà"

    Les rôles d'un groupe parent atteignent **tous ceux qui se trouvent en
    dessous de lui**. Cela inclut les personnes qui correspondaient déjà
    directement.

    Dans l'exemple ci-dessus, si `all-staff` est lui aussi associé, activer
    l'imbrication donne à `alice` les rôles de `all-techs` et de
    `all-staff` — et il en va de même pour un utilisateur qui était déjà
    membre direct de `all-techs`, puisque ce groupe reste sous `all-staff`.

    Avant de l'activer, regardez à quoi sont associés vos groupes de
    **premier niveau**. Un rôle attaché à un groupe parent large comme
    « tout le personnel » atteint chacun de ses membres imbriqués.

    Activer l'imbrication ne peut jamais qu'**ajouter** de l'accès, jamais
    en retirer : son activation est donc sûre au sens où personne ne perd
    quoi que ce soit.

### Chain est refusé sur les annuaires qui n'en sont pas capables

`LDAP_MATCHING_RULE_IN_CHAIN` est une fonctionnalité d'Active Directory.
OpenLDAP, FreeIPA et les autres annuaires ne l'implémentent pas, et un
filtre qui l'utilise chez eux ne correspond tout simplement à **rien** —
toutes les connexions imbriquées échoueraient silencieusement.

FOG interroge donc l'annuaire avant d'enregistrer. Choisissez **Chain**
face à un serveur qui n'annonce pas cette prise en charge et
l'enregistrement est **rejeté**, avec un message vous invitant à utiliser
**Expand** à la place. Cela vaut quelle que soit la façon dont le réglage
est écrit, y compris via l'API REST.

Si FOG ne parvient pas du tout à joindre l'annuaire au moment de
l'enregistrement, il ne peut pas prouver que la prise en charge est
absente : le réglage est alors conservé et une note est écrite dans le
journal d'erreurs du serveur web. Configurer un serveur avant qu'il ne soit
joignable reste donc possible.

### Limite de profondeur (Expand uniquement)

Parcourir l'arborescence coûte une requête d'annuaire par niveau :
**Expand** a donc une limite de profondeur. **Chain** n'en a aucune —
l'annuaire fait le travail — et ignore complètement ce réglage.

- **LDAP → Global Options → Default nested group depth** définit la valeur
  par défaut. Elle est livrée à **10**.
- **Nested Depth** sur un serveur particulier la remplace. Laissez ce champ
  vide pour hériter de la valeur globale.

Dix niveaux, c'est bien plus profond que ce qu'imbriquent la plupart des
annuaires. Si un parcours atteint effectivement la limite, FOG écrit une
ligne dans le journal d'erreurs du serveur web en nommant le serveur,
l'utilisateur et la profondeur — un résultat tronqué vous indique ainsi
qu'il a été tronqué, au lieu de ressembler à un utilisateur qui n'aurait
simplement rien trouvé de correspondant. Si vous voyez cette ligne,
augmentez la profondeur.

Les cycles sont gérés automatiquement. Un groupe qui contient un groupe qui
contient le premier se résout correctement et ne consomme pas la limite de
profondeur.

!!! warning "L'imbrication en FOG 1.5 n'est pas cette fonctionnalité"

    La 1.5 propose une simple case à cocher **nested group** au lieu des
    trois stratégies ci-dessus, et il s'agit uniquement de
    `LDAP_MATCHING_RULE_IN_CHAIN`. Sur OpenLDAP, FreeIPA ou tout autre
    annuaire, cette règle ne correspond à personne, et la 1.5 ne vérifie
    pas si l'annuaire la prend en charge — la case se coche donc,
    s'enregistre, et n'accorde silencieusement rien.

    Elle est également inaccessible sur la plupart des installations. Le
    réglage nécessite une colonne ajoutée à la table du greffon en février
    2026, et la 1.5 n'a aucun mécanisme pour ajouter une colonne à la table
    d'un *greffon* sur une installation déjà existante — le module de mise
    à jour du schéma du cœur ne touche jamais qu'aux tables du cœur. Si
    votre greffon LDAP a été installé avant cette date, la colonne n'existe
    tout simplement pas et le réglage n'a nulle part où aller.

    Réinstaller le greffon créerait la colonne, mais supprimerait aussi
    tous les serveurs LDAP que vous avez configurés ainsi que les comptes
    FOG créés par le greffon : ce n'est donc pas un contournement. Passer à
    la 1.6 est la solution — voir
    [issue #892](https://github.com/FOGProject/fogproject/issues/892).

!!! note "Les groupes posixGroup / memberUid ne peuvent pas s'imbriquer"

    Si vos groupes consignent leurs membres avec `memberUid` plutôt qu'avec
    `member`, l'imbrication ne peut pas fonctionner — et c'est une propriété
    du schéma, non une limitation de FOG. `memberUid` contient de simples
    **noms d'utilisateur** : il n'existe donc aucun moyen d'exprimer « ce
    groupe contient ce groupe ». L'appartenance directe fonctionne
    exactement comme avant.

### Coût par connexion

L'imbrication ajoute des requêtes d'annuaire à chaque connexion :

| Stratégie | Requêtes par connexion |
|---|---|
| Off | 1 |
| Chain | 1 |
| Expand | une par niveau, jusqu'à la limite de profondeur |

Il n'y a délibérément **aucune mise en cache** de l'appartenance aux
groupes : retirer quelqu'un d'un groupe d'annuaire prend donc effet dès sa
connexion suivante, et non à l'expiration d'un cache.

Si les requêtes supplémentaires importent pour vos automatisations, notez
qu'un [jeton d'API REST](../../kb/integrations/api.md) ne sollicite pas du
tout l'annuaire — seule la connexion interactive le fait. Les scripts qui
utilisent un jeton ne coûtent rien ici, et la révocation d'un jeton est
immédiate.

## Plusieurs serveurs LDAP

Si plusieurs serveurs LDAP sont configurés, FOG les essaie **tous** et
combine le résultat. Chaque rôle et chaque groupe d'utilisateurs obtenu sur
chaque serveur est accordé, de la même façon que se combinent plusieurs
associations de groupes sur un même serveur.

Un serveur sur lequel le compte n'existe pas n'apporte rien et ne retire
jamais une correspondance trouvée sur un autre serveur.

Les associations de groupes appartiennent au serveur sur lequel elles ont
été créées : le même nom de groupe d'annuaire sur deux serveurs différents
constitue donc deux associations distinctes, qui peuvent accorder des
choses différentes.

Le nom d'affichage et le réglage **allow API** sont repris du premier
serveur ayant accepté les identifiants, plutôt que combinés — sans quoi un
serveur n'accordant rien d'autre pourrait tout de même distribuer un accès
à l'API.

## Accès à l'API

Chaque serveur LDAP dispose de son propre réglage **allow API**, qui
détermine si les comptes authentifiés par ce serveur peuvent utiliser
l'[API REST](../../kb/integrations/api.md). Le jeton d'API d'un utilisateur
d'annuaire ne porte toujours que les permissions de son rôle — voir
[Les jetons d'API suivent les rôles](roles.md#les-jetons-dapi-suivent-les-rôles).

## Notes de mise à niveau

- **La mise à niveau n'attribue aucun rôle aux comptes d'annuaire
  existants.** Le greffon attribue leur rôle à la connexion : une migration
  ponctuelle n'a donc rien d'utile à en dire, et recopier leur ancien type
  de compte donnerait un accès administrateur à tous les comptes
  d'annuaire. Configurez les trois réglages de rôle ci-dessus **avant** de
  demander aux utilisateurs de se reconnecter.
- Avant l'existence des rôles, tout compte créé par ce greffon était de
  fait un administrateur complet. Si ce n'est pas ce que vous voulez,
  l'association de rôles est l'endroit où le corriger.
- **La vérification des certificats ne change pas lors de la mise à
  niveau.** Les serveurs existants arrivent réglés sur **Inherit**, ce qui
  correspond au comportement qu'ils avaient déjà — celui que dicte
  `TLS_REQCERT` sur le serveur FOG. Rien ne se met à échouer du simple fait
  de l'arrivée de ce réglage.
