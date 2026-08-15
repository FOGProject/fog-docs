---
title: Pagination, expansion et éléments de greffons de l'API
description: Comment paginer les résultats de liste, incorporer les objets liés avec ?expand et lire l'enveloppe pluginItems dans l'API REST de FOG
context_id: api-expansion-and-pagination
aliases:
    - API Expansion
    - API Pagination
    - API Expand
    - Plugin Items
tags:
    - 1_6-changes
    - kb
    - integrations
    - api
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/integrations/api-expansion-and-pagination).

# Pagination, expansion et éléments de greffons de l'API

FOG 1.6 ajoute trois capacités **additives et optionnelles** à l'API REST décrite
dans l'article principal [API](api.md) :

* **Pagination** — parcourez page par page les grands points de terminaison de liste avec `start`/`length`.
* **Expansion de relations** — incorporez les objets liés complets avec `?expand=…`.
* **L'enveloppe `pluginItems`** — un espace de noms dédié où les greffons injectent leurs
  associations sans jamais écraser les champs de base.

!!! info "Rien ne change tant que vous ne le demandez pas"
    Ces fonctionnalités sont strictement additives. Si vous n'envoyez pas `?expand=…` et
    ne paginez pas, chaque réponse existante conserve exactement la même forme qu'avant.
    Les clés étrangères scalaires (par exemple `imageID`) sont toujours préservées —
    l'expansion **ajoute** un objet à côté de la clé, elle ne remplace jamais la clé.

Tous les exemples supposent que l'API est activée et que vous envoyez les
en-têtes `fog-api-token` et `fog-user-token` (voir
[Authentification](api.md#authentification)).

---

## Pagination

Les points de terminaison de liste (`/fog/host`, `/fog/image`, `/fog/snapin`, `/fog/user`, …) sont
adossés au processeur côté serveur DataTables de FOG. Demandez une page avec `length`
(et éventuellement `start`) et la réponse vous indique à la fois la taille de l'ensemble
de résultats complet et comment atteindre la page suivante.

### Paramètres

| Paramètre | Signification                                                  | Défaut  | Où |
|-----------|----------------------------------------------------------------|---------|-------|
| `length`  | Nombre maximum de lignes à retourner.                          | toutes  | chaîne de requête **ou** corps |
| `start`   | Décalage (à partir de zéro) de la première ligne à retourner.  | `0`     | chaîne de requête **ou** corps |
| `search`  | Filtre en texte libre (valeur de recherche globale DataTables). | aucun   | corps uniquement |
| `order`   | Tableau d'ordonnancement DataTables.                           | par nom | corps uniquement |
| `draw`    | Renvoyé tel quel ; utile pour corréler des réponses asynchrones. | `0`   | corps uniquement |

!!! tip "La méthode simple : `?length` dans l'URL"
    `length` et `start` fonctionnent directement comme paramètres de chaîne de requête, donc un simple
    `GET .../fog/host?length=3` retourne les trois premières machines. C'est la
    façon la plus simple de paginer et c'est ce qu'utilisent les exemples ci-dessous. (Si vous omettez
    `start`, il vaut `0` par défaut.)

!!! note "search / order / draw passent toujours par le corps de la requête"
    Les paramètres DataTables complets (`search`, `order`, `draw`) sont lus depuis le
    **corps de la requête** à cause de la réécriture interne du serveur web qui se trouve devant
    l'API. Passez-les avec `curl --data` ; la requête reste un `GET`. Seuls
    `length` et `start` peuvent être envoyés des deux façons.

### Enveloppe de réponse

```json
{
  "draw": 0,
  "recordsTotal": 85,
  "recordsFiltered": 85,
  "recordsReturned": 3,
  "data": [ { "id": 1, "name": "..." }, ... ],
  "firstUrl": "/fog/host?length=3&start=0",
  "prevUrl": null,
  "nextUrl": "/fog/host?length=3&start=3",
  "lastUrl": "/fog/host?length=3&start=84",
  "_lang": "host"
}
```

* `recordsTotal` — nombre total de lignes dans la table avant filtrage.
* `recordsFiltered` — lignes correspondant au `search` courant (égal à
  `recordsTotal` quand aucune recherche n'est appliquée).
* `recordsReturned` — combien de lignes se trouvent dans **cette** réponse (la taille de
  `data`). Toujours présent dans une réponse de liste.
* `data` — la page de lignes courante.
* `firstUrl` / `prevUrl` / `nextUrl` / `lastUrl` — URL relatives à la requête pour les
  première, précédente, suivante et dernière pages. Présentes uniquement quand vous avez demandé une
  page bornée (`length`) sur un ensemble de résultats non vide ; chacune vaut `null` quand elle
  ne s'applique pas (`prevUrl` sur la première page, `nextUrl` sur la dernière). Elles
  reprennent le chemin que vous avez demandé et préservent tous les autres paramètres de requête,
  y compris `?expand=…`.

!!! info "Les décomptes complets ne se réduisent jamais à la page"
    `recordsTotal` et `recordsFiltered` décrivent toujours l'ensemble de résultats
    **entier**, pas la page courante — l'interface web en dépend. Utilisez
    `recordsReturned` pour connaître la taille réelle de la page reçue.

### L'en-tête `Link`

Les mêmes pointeurs première/précédente/suivante/dernière sont aussi émis sous forme d'en-tête de réponse
`Link` standard [RFC 5988](https://www.rfc-editor.org/rfc/rfc5988), afin qu'un
client puisse paginer sans lire le corps :

```
Link: </fog/host?length=3&start=0>; rel="first",
      </fog/host?length=3&start=3>; rel="next",
      </fog/host?length=3&start=84>; rel="last"
```

`rel="prev"` est omis sur la première page et `rel="next"` sur la dernière, vous
pouvez donc vous arrêter dès qu'il n'y a plus de `next`.

### Exemples

Les trois premières machines :

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     'http://fogserver/fog/host?length=3'
```

La page suivante (lignes 4–5) :

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     'http://fogserver/fog/host?length=2&start=3'
```

### Parcourir automatiquement toutes les pages

Comme chaque réponse renvoie `nextUrl` (et le même pointeur dans l'en-tête `Link`),
un client peut boucler jusqu'à épuisement — vous n'avez jamais à suivre
les décalages vous-même. Partez de n'importe quelle URL `?length=…` et suivez `nextUrl` jusqu'à ce
qu'il vaille `null`.

**Bash (`curl` + `jq`) :**

```bash
#!/usr/bin/env bash
base='http://fogserver'
next='/fog/host?length=50'
while [ -n "$next" ] && [ "$next" != "null" ]; do
  page="$(curl -s \
    -H 'fog-api-token: yourapitoken' \
    -H 'fog-user-token: yourusertoken' \
    "${base}${next}")"
  echo "$page" | jq -c '.data[] | {id, name}'
  next="$(echo "$page" | jq -r '.nextUrl')"   # "null" when done
done
```

**Python (`requests`) :**

```python
import requests

base = "http://fogserver"
headers = {
    "fog-api-token": "yourapitoken",
    "fog-user-token": "yourusertoken",
}

url = "/fog/host?length=50"
hosts = []
while url:
    body = requests.get(base + url, headers=headers).json()
    hosts.extend(body["data"])
    print(f"got {body['recordsReturned']} of {body['recordsFiltered']}")
    url = body.get("nextUrl")   # None on the last page -> loop ends

print(f"total collected: {len(hosts)}")
```

**Ruby (`net/http`) :**

```ruby
require "net/http"
require "json"

base = "http://fogserver"
headers = {
  "fog-api-token"  => "yourapitoken",
  "fog-user-token" => "yourusertoken",
}

url = "/fog/host?length=50"
hosts = []
until url.nil?
  res  = Net::HTTP.get_response(URI(base + url), headers)
  body = JSON.parse(res.body)
  hosts.concat(body["data"])
  puts "got #{body['recordsReturned']} of #{body['recordsFiltered']}"
  url = body["nextUrl"]   # nil on the last page -> loop ends
end

puts "total collected: #{hosts.length}"
```

---

## Expansion de relations (`?expand`)

Par défaut, une ligne de liste ou une entité seule contient des clés étrangères scalaires
(`imageID`, `snapins` sous forme de tableau d'identifiants, etc.). Ajoutez `?expand=…` pour incorporer
les **objets liés complets** au lieu de devoir faire une seconde série d'appels.

### Demander l'expansion

`expand` est une liste de jetons de relation séparés par des virgules dans la chaîne de requête de l'URL.
Les jetons sont **insensibles à la casse**.

| Forme                             | Effet                                              |
|-----------------------------------|----------------------------------------------------|
| `?expand=image`                   | Incorpore la relation simple `image`.              |
| `?expand=snapins,printers`        | Incorpore plusieurs relations.                     |
| `?expand=all`                     | Incorpore toutes les relations prises en charge par l'entité. |

L'expansion fonctionne **à la fois** sur un GET d'entité seule (`/fog/host/48?expand=all`) et
sur un point de terminaison de liste (`/fog/host?expand=snapins`) — dans le cas d'une liste, chaque ligne de la
page est enrichie.

### Relations prises en charge

L'ensemble des relations expansibles dépend de l'entité (et des greffons
installés). Pour une **machine**, les relations intégrées sont :

| Jeton      | Type        | Incorpore                                 |
|------------|-------------|------------------------------------------|
| `image`    | une         | L'objet image assigné.                    |
| `snapins`  | plusieurs   | Les objets snapin de la machine.          |
| `printers` | plusieurs   | Les objets imprimante de la machine.      |
| `groups`   | plusieurs   | Les groupes auxquels la machine appartient. |
| `modules`  | plusieurs   | Les modules client de la machine.         |

Le greffon **Location** ajoute deux jetons supplémentaires, livrés via
l'enveloppe [`pluginItems`](#lenveloppe-pluginitems) : `location` (sur une machine) et
`hosts` (sur un emplacement).

### Relations un-à-un

Une relation un-à-un est incorporée comme objet sous son jeton, **à côté** de la
clé scalaire intacte :

```json
{
  "id": 48,
  "imageID": 5,
  "image": { "id": 5, "name": "Win11", "path": "/images/win11", ... }
}
```

### Relations un-à-plusieurs

Une relation un-à-plusieurs devient un **tableau** sous son jeton, accompagné de deux
clés compagnes vous permettant de détecter une troncature :

```json
{
  "modules": [ { "id": 1, "name": "..." }, ... ],
  "modules_total": 13,
  "modules_truncated": false
}
```

* `<token>_total` — le vrai nombre d'éléments liés (avant tout plafonnement).
* `<token>_truncated` — `true` quand le tableau a été plafonné et ne contient donc
  **pas** tous les éléments.

!!! note "L'expansion est plafonnée à 2500 éléments par relation"
    Pour borner la mémoire, chaque relation un-à-plusieurs incorpore au plus **2500** éléments.
    Quand il en existe davantage, le tableau contient les 2500 premiers, `<token>_total` indique le
    compte réel, et `<token>_truncated` vaut `true`. Récupérez le reste depuis le
    point de terminaison de liste propre à cette relation.

### La profondeur est d'un niveau

L'expansion va **exactement un niveau en profondeur**. Les objets liés incorporés ne sont *pas*
eux-mêmes expansés et ne portent pas d'enveloppe `pluginItems`, donc les réponses ne peuvent
jamais devenir récursives ni contenir de références arrière vers leur parent.

### Pagination et expansion ensemble

Comme l'expansion matérialise un objet complet pour chaque ligne, une requête de **liste**
expansée borne sa propre taille de page :

* Si vous envoyez un `length` explicite de **2500 ou moins**, il est honoré.
* Si `length` est omis, vaut `0` ou dépasse **2500**, il est ramené à
  2500 (et `start` vaut `0` par défaut).

Donc pour paginer une liste expansée, envoyez toujours un
`length` explicite ≤ 2500 :

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     'http://fogserver/fog/host?expand=snapins&length=100'
```

Les pointeurs `nextUrl`/`Link` retournés par une liste expansée conservent le jeton `?expand=…`,
donc les boucles de parcours de pages ci-dessus fonctionnent sans changement sur les listes expansées.

### Les champs sensibles ne sont jamais exposés par l'expansion

Les secrets déchiffrés (mot de passe Active Directory, clé de produit, jetons de sécurité
du client, etc.) ne sont retournés **que** lors d'un GET direct d'entité seule sur
l'objet propriétaire (par exemple `GET /fog/host/48`). Ils sont toujours retirés de :

* chaque ligne d'une réponse de **liste**, y compris les lignes de liste expansées, et
* tout objet incorporé comme objet **lié** ou via `pluginItems`.

Autrement dit, `GET /fog/host/48` peut retourner l'`ADPass` déchiffré de la machine, mais
cette même machine apparaissant dans `GET /fog/location/1?expand=hosts`, ou comme ligne de
`GET /fog/host?expand=all`, ne le fera pas.

---

## L'enveloppe `pluginItems`

Les greffons peuvent contribuer leurs associations à la sortie API d'une autre entité. Pour
garantir qu'un greffon ne puisse jamais écraser (ou être confondu avec) un champ de base, toutes
les données issues des greffons vivent sous une seule clé à espace de noms : `pluginItems`.

```json
{
  "id": 48,
  "name": "lab-pc-01",
  "imageID": 5,
  "pluginItems": {
    "location": { "id": 1, "name": "Main Office", "link": "..." }
  }
}
```

Comme l'expansion de base, `pluginItems` n'est attachée qu'au **niveau
supérieur** — sur un GET d'entité seule ou sur chaque ligne d'une liste — jamais sur un objet
lié imbriqué. C'est ce qui garde les données de greffon exemptes de références arrière.

### Exemple : le greffon Location

Le greffon Location est bidirectionnel et illustre le motif.

**Sur une machine** — `pluginItems.location` est par défaut un lien léger :

```json
"pluginItems": {
  "location": {
    "id": 1,
    "name": "Main Office",
    "link": "../management/index.php?node=location&sub=edit&id=1"
  }
}
```

Ajoutez `?expand=location` pour incorporer l'objet emplacement **complet** à la place :

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     -X GET 'http://fogserver/fog/host/48?expand=location'
```

```json
"pluginItems": {
  "location": { "id": 1, "name": "Main Office", "storagegroup": {...}, ... }
}
```

**Sur un emplacement** — `pluginItems.hostCount` est toujours présent ; ajoutez
`?expand=hosts` pour incorporer aussi les machines membres :

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     -X GET 'http://fogserver/fog/location/1?expand=hosts'
```

```json
"pluginItems": {
  "hostCount": 42,
  "hosts": [ { "id": 9, "name": "..." }, ... ],
  "hosts_truncated": false
}
```

Le tableau `hosts` incorporé suit les mêmes règles que toute relation un-à-plusieurs
expansée : plafonné à 2500, `hosts_truncated` signale un plafonnement, et chaque machine a ses
champs sensibles retirés.

---

## Référence rapide

| Objectif                               | Comment                                                        |
|----------------------------------------|---------------------------------------------------------------|
| Paginer une liste                      | `?length=<n>` (et `?start=<n>` optionnel) dans l'URL.         |
| Suivre les pages automatiquement       | Bouclez sur `nextUrl` (ou l'en-tête `Link`) jusqu'à `null`.   |
| Voir combien de lignes une page a retourné | Lisez `recordsReturned`.                                  |
| Incorporer une relation                | `?expand=<token>`                                             |
| Incorporer plusieurs relations         | `?expand=a,b,c`                                               |
| Tout incorporer                        | `?expand=all`                                                |
| Détecter une relation un-à-plusieurs plafonnée | Vérifiez `<token>_truncated` / `<token>_total`.       |
| Paginer une liste expansée             | Envoyez un `length` explicite ≤ 2500.                        |
| Lire les associations de greffons      | Regardez sous `pluginItems`.                                 |
| Obtenir les secrets déchiffrés         | GET direct d'entité seule uniquement (jamais listes/expansions). |
