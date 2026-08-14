---
title: API
aliases:
    - API
    - Fog API
description: Informations sur l'utilisation générale de l'API de FOG
context_id: api
tags:
    - in-progress
    - kb
    - updating-content
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/integrations/api).


# API

Vous trouverez ici quelques exemples pratiques d'utilisation de l'API. Mais
commençons par expliquer comment s'authentifier.

## Principes de base

Pour pouvoir utiliser l'API depuis des appels externes, il faut d'abord
l'activer dans l'interface web de FOG (Configuration FOG → Paramètres de FOG
 → API System).

## Authentification

### Jetons

**Jeton d'API global** &mdash; un en-tête nommé `fog-api-token`. Vous trouverez
le vôtre dans Configuration FOG → Paramètres de FOG
 → API System.

**Jeton d'API utilisateur** (*vivement recommandé*) &mdash; un en-tête nommé
`fog-user-token`. Vous trouverez le vôtre dans Utilisateurs → List
All Users → *votre nom d'utilisateur* →
API. La case **User API Enable** de l'utilisateur, dans cet onglet, doit être
cochée, sans quoi le jeton est rejeté même s'il est envoyé.

!!! note "Copiez la valeur du jeton telle qu'elle est affichée"
    L'interface web affiche déjà les deux jetons **encodés en base64**, ce qui
    est précisément la forme attendue par le serveur dans l'en-tête. Copiez la
    valeur affichée telle quelle &mdash; le serveur décode l'en-tête depuis le
    base64 avant de le comparer. Un jeton brut, non encodé, échouera avec un
    `403 Forbidden`.

### Authentification HTTP Basic

Vous pouvez utiliser l'autorisation HTTP Basic (avec
`curl -u <user>:<password>` ou un en-tête de la forme
`Authorization: Basic <base64encoded username:password>`). Bien que ce type
d'authentification soit autorisé et fonctionne, le système de jeton utilisateur
reste recommandé, car un jeton ne peut pas être décodé pour retrouver un couple
nom d'utilisateur/mot de passe valide capable d'administrer votre serveur FOG.

L'authentification Basic remplace le jeton **utilisateur**, pas le jeton global.
L'en-tête `fog-api-token` reste obligatoire, et une requête qui en est dépourvue
est rejetée avec un `403 Forbidden` avant même que le nom d'utilisateur et le
mot de passe ne soient examinés :

```bash
curl -H 'fog-api-token: yourapitoken' \
     -u 'youruser:yourpassword' \
     -X GET http://fogserver/fog/host
```

Le compte se connecte exactement comme il le ferait dans l'interface web : ses
rôles s'appliquent donc de la même façon. Un utilisateur dont les rôles ne
comprennent pas `user.view` obtient un `403 Forbidden` depuis `/fog/user`, qu'il
se soit authentifié par jeton ou par mot de passe. Les comptes issus d'un
annuaire externe (LDAP) peuvent également s'authentifier ainsi, à condition que
**Allow API** soit activé sur le serveur LDAP.

!!! warning "Mise à niveau d'un serveur existant : relancez l'installeur"
    L'authentification Basic dépend de l'arrivée de l'en-tête `Authorization`
    jusqu'à PHP, et sous FastCGI il n'arrive pas de lui-même &mdash; nginx ne
    transmet qu'une liste fixe de paramètres, et Apache le supprime avant
    `proxy_fcgi`. L'installeur de FOG produit la configuration de serveur web
    nécessaire, mais un serveur installé avant cette correction conserve
    l'ancienne configuration sur le disque. Si l'authentification Basic renvoie
    un `401 Unauthorized` avec des identifiants dont vous savez qu'ils sont
    corrects, relancez l'installeur pour rafraîchir la configuration du serveur
    web. L'authentification par jeton n'est pas concernée et ne nécessite
    aucune réinstallation.

### Exemple

Bien que de nombreux outils permettent de faire des appels d'API, `curl` est
l'un des plus élémentaires si vous êtes sous Linux et souhaitez essayer :

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     -X GET http://fogserver/fog/system/info
```

## Routes et méthodes

Afin que les informations de la documentation restent aussi universelles que
possible, nous n'indiquons que l'URL de chaque appel d'API.

### GET

Voici quelques appels GET essentiels :

| Route | Description |
| --- | --- |
| `/fog/system/info` | Contrôle de santé &mdash; confirme que l'API est activée et joignable. Ne nécessite aucun jeton et renvoie une petite charge utile JSON contenant la version du serveur. |
| `/fog/task/active` | Renvoie la liste des tâches en attente et actives. |
| `/fog/multicastsession/current` | Renvoie la liste des sessions multicast actives. |
| `/fog/host` | Renvoie la liste de toutes les machines enregistrées. |
| `/fog/<class>/search/<term>` | Renvoie les enregistrements de `<class>` correspondant au terme recherché, par exemple `/fog/host/search/<term>` pour les machines ou `/fog/image/search/<term>` pour les images. |

### POST

#### Créer une image

Utilisez l'appel d'API suivant pour créer une image : `/fog/image/create`. Vous
devez transmettre les paramètres suivants :

| Paramètre | Description |
| --- | --- |
| `name` | Le nom de l'image. |
| `path` | Le chemin de l'image. |
| `imageTypeID` | La façon dont l'image est stockée (voir le tableau ci-dessous). |
| `osID` | L'identifiant du système d'exploitation de l'image. |

Tout autre champ d'image (par exemple `description`, `imagePartitionTypeID`,
`format` ou `compress`) peut également figurer dans le corps de la requête.

**Types d'image** &mdash; la valeur à transmettre comme `imageTypeID` :

| `imageTypeID` | Type |
| --- | --- |
| 1 | Single Disk - Resizable |
| 2 | Multiple Partition Image - Single Disk (Not Resizable) |
| 3 | Multiple Partition Image - All Disks (Not Resizable) |
| 4 | Raw Image (Sector By Sector, DD, Slow) |

Une création réussie renvoie le JSON complet de l'objet image enregistré.

#### Créer une tâche (déploiement, capture, etc.)

Placez l'identifiant de la machine dans l'URL de l'appel d'API :
`/fog/host/<id>/task` (cela fonctionne aussi pour d'autres objets pouvant faire
l'objet de tâches, comme les groupes). Le corps de la requête sélectionne la
tâche avec une clé `taskTypeID`, par exemple :

```json
{"taskTypeID": "1"}
```

Le `taskTypeID` `1` déploie et le `2` capture. La liste complète des types de
tâche suit.

!!! warning "La clé du corps est `taskTypeID`, pas `taskType`"
    Le point d'accès lit la propriété JSON `taskTypeID`. Un corps
    `{"taskType": "1"}` laisse `taskTypeID` non défini et aboutit à un `404`.

**Types de tâche** &mdash; la valeur à transmettre comme `taskTypeID` :

| `taskTypeID` | Tâche |
| --- | --- |
| 1 | Deploy |
| 2 | Capture |
| 3 | Debug |
| 4 | Memtest86+ |
| 5 | Test Disk |
| 6 | Disk Surface Test |
| 7 | Recover |
| 8 | Multi-Cast |
| 10 | Hardware Inventory |
| 11 | Password Reset |
| 12 | All Snapins |
| 13 | Single Snapin |
| 14 | Wake-Up |
| 15 | Deploy - Debug |
| 16 | Capture - Debug |
| 17 | Deploy - No Snapins |
| 18 | Fast Wipe |
| 19 | Normal Wipe |
| 20 | Full Wipe |
| 21 | Virus Scan |
| 22 | Virus Scan - Quarantine |

!!! note "Les identifiants ne se suivent pas"
    Il n'existe volontairement pas de type de tâche `9`, et le `8` correspond à
    Multi-Cast &mdash; transmettez l'identifiant du tableau, et non la position
    de la ligne.

!!! note "Affectez d'abord une image"
    Vous devez affecter une image à la machine (et l'image doit être activée)
    avant de pouvoir la déployer. Affectez-la avec une requête PUT (voir
    ci-dessous).

Un appel de tâche réussi renvoie une chaîne vide (`""`).

### PUT

Modifier une machine : `/fog/host/<id>/edit`. Exemple de corps :

```json
{"imageID": "1"}
```

Une modification réussie renvoie le JSON complet de l'objet machine mis à jour.

## Pagination, expansion et éléments de greffons

FOG 1.6 ajoute des fonctionnalités de requête optionnelles pour travailler avec
l'API : pagination des grandes listes de résultats, insertion des objets liés
avec `?expand=…`, et lecture des associations injectées par les greffons depuis
l'enveloppe `pluginItems`. Voir
[Pagination, expansion et éléments de greffons de l'API](api-expansion-and-pagination.md).
