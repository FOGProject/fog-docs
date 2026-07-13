---
title: API Pagination, Expansion & Plugin Items
description: How to paginate list results, inline related objects with ?expand, and read the pluginItems envelope in the FOG REST API
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

# API Pagination, Expansion & Plugin Items

FOG 1.6 adds three **additive, opt-in** capabilities to the REST API described
in the main [API](api.md) article:

* **Pagination** — page through large list endpoints with `start`/`length`.
* **Relation expansion** — inline full related objects with `?expand=…`.
* **The `pluginItems` envelope** — a namespaced place where plugins inject their
  associations without ever clobbering core fields.

!!! info "Nothing changes unless you ask for it"
    These features are strictly additive. If you don't send `?expand=…` and
    don't page, every existing response keeps exactly the same shape it had
    before. Scalar foreign keys (for example `imageID`) are always preserved —
    expansion **adds** an object alongside the key, it never replaces the key.

All examples assume the API is enabled and you are sending the
`fog-api-token` and `fog-user-token` headers (see
[Authentication](api.md#authentication)).

---

## Pagination

List endpoints (`/fog/host`, `/fog/image`, `/fog/snapin`, `/fog/user`, …) are
backed by FOG's DataTables server-side processor. They accept the standard
DataTables parameters and return a DataTables-shaped envelope.

!!! warning "List parameters go in the request BODY, not the query string"
    Because of the internal web-server rewrite that fronts the API, list
    endpoints read their parameters (`start`, `length`, `search`, `order`,
    `draw`) from the **request body**, not from the URL query string. With
    `curl` you pass them with `--data`. The request is still a `GET`.

### Parameters

| Parameter | Meaning                                                        | Default |
|-----------|----------------------------------------------------------------|---------|
| `start`   | Zero-based offset of the first row to return.                  | `0`     |
| `length`  | Maximum number of rows to return.                              | all     |
| `search`  | Free-text filter (DataTables global search value).             | none    |
| `order`   | DataTables ordering array.                                     | by name |
| `draw`    | Echoed back verbatim; useful for correlating async responses.  | `0`     |

### Response envelope

```json
{
  "draw": 0,
  "recordsTotal": 85,
  "recordsFiltered": 85,
  "data": [ { "id": 1, "name": "..." }, ... ],
  "_lang": "host"
}
```

* `recordsTotal` — total rows in the table before filtering.
* `recordsFiltered` — rows matching the current `search` (equals
  `recordsTotal` when no search is applied).
* `data` — the current page of rows.

### Examples

First three hosts:

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     -X GET --data 'start=0&length=3' \
     http://fogserver/fog/host
```

The next page (rows 4–5):

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     -X GET --data 'start=3&length=2' \
     http://fogserver/fog/host
```

---

## Relation expansion (`?expand`)

By default a list row or a single entity contains scalar foreign keys
(`imageID`, `snapins` as an array of IDs, and so on). Add `?expand=…` to inline
the **full related objects** instead of having to make a second round of calls.

### Requesting expansion

`expand` is a comma-separated list of relation tokens on the URL query string.
Tokens are **case-insensitive**.

| Form                              | Effect                                             |
|-----------------------------------|----------------------------------------------------|
| `?expand=image`                   | Inline the single `image` relation.                |
| `?expand=snapins,printers`        | Inline several relations.                          |
| `?expand=all`                     | Inline every relation the entity supports.         |

Expansion works on **both** a single-entity GET (`/fog/host/48?expand=all`) and
a list endpoint (`/fog/host?expand=snapins`) — in the list case every row on the
page is enriched.

### Supported relations

The set of expandable relations depends on the entity (and on which plugins are
installed). For a **host** the built-in relations are:

| Token      | Kind        | Inlines                                  |
|------------|-------------|------------------------------------------|
| `image`    | one         | The assigned image object.               |
| `snapins`  | many        | The host's snapin objects.               |
| `printers` | many        | The host's printer objects.              |
| `groups`   | many        | The groups the host belongs to.          |
| `modules`  | many        | The host's client modules.               |

The **Location** plugin adds two more tokens, delivered through the
[`pluginItems`](#the-pluginitems-envelope) envelope: `location` (on a host) and
`hosts` (on a location).

### One-to-one relations

A one-to-one relation is inlined as an object under its token, **next to** the
untouched scalar key:

```json
{
  "id": 48,
  "imageID": 5,
  "image": { "id": 5, "name": "Win11", "path": "/images/win11", ... }
}
```

### One-to-many relations

A one-to-many relation becomes an **array** under its token, accompanied by two
companion keys so you can detect truncation:

```json
{
  "modules": [ { "id": 1, "name": "..." }, ... ],
  "modules_total": 13,
  "modules_truncated": false
}
```

* `<token>_total` — the true number of related items (before any cap).
* `<token>_truncated` — `true` when the array was capped and therefore does
  **not** contain every item.

!!! note "Expansion is capped at 2500 items per relation"
    To bound memory, each one-to-many relation inlines at most **2500** items.
    When more exist, the array holds the first 2500, `<token>_total` reports the
    real count, and `<token>_truncated` is `true`. Fetch the remainder from that
    relation's own list endpoint.

### Depth is one level

Expansion goes **exactly one level deep**. Inlined related objects are *not*
themselves expanded and do not carry a `pluginItems` envelope, so responses can
never recurse or contain back-references to their parent.

### Pagination + expansion together

Because expansion materializes a full object for every row, an expanded **list**
request bounds its own page size:

* If you send an explicit `length` of **2500 or fewer**, it is honored.
* If `length` is omitted, `0`, or greater than **2500**, it is clamped to
  2500 (and `start` defaults to `0`).

So to page through an expanded list, always send an explicit
`length` ≤ 2500:

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     -X GET --data 'start=0&length=100' \
     'http://fogserver/fog/host?expand=snapins'
```

### Sensitive fields are never exposed by expansion

Decrypted secrets (Active Directory password, product key, client security
tokens, and the like) are returned **only** on a direct single-entity GET of the
owning object (for example `GET /fog/host/48`). They are always stripped from:

* every row of a **list** response, including expanded list rows, and
* any object inlined as a **related** object or through `pluginItems`.

In other words, `GET /fog/host/48` may return the host's decrypted `ADPass`, but
that host appearing inside `GET /fog/location/1?expand=hosts`, or as a row of
`GET /fog/host?expand=all`, will not.

---

## The `pluginItems` envelope

Plugins can contribute their associations to another entity's API output. To
guarantee a plugin can never overwrite (or be confused with) a core field, all
plugin-contributed data lives under a single namespaced key: `pluginItems`.

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

Like the core expansion, `pluginItems` is only ever attached at the **top
level** — on a single-entity GET or on each row of a list — never on a nested
related object. That is what keeps plugin data free of back-references.

### Example: the Location plugin

The Location plugin is bidirectional and demonstrates the pattern.

**On a host** — `pluginItems.location` is a lightweight link by default:

```json
"pluginItems": {
  "location": {
    "id": 1,
    "name": "Main Office",
    "link": "../management/index.php?node=location&sub=edit&id=1"
  }
}
```

Add `?expand=location` to inline the **full** location object instead:

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

**On a location** — `pluginItems.hostCount` is always present; add
`?expand=hosts` to also inline the member hosts:

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

The inlined `hosts` array follows the same rules as any expanded one-to-many
relation: capped at 2500, `hosts_truncated` signals a cap, and each host has its
sensitive fields stripped.

---

## Quick reference

| Goal                                   | How                                                            |
|----------------------------------------|---------------------------------------------------------------|
| Page a list                            | Send `start` / `length` in the request **body**.              |
| Inline one relation                    | `?expand=<token>`                                             |
| Inline several relations               | `?expand=a,b,c`                                               |
| Inline everything                      | `?expand=all`                                                |
| Detect a capped one-to-many relation   | Check `<token>_truncated` / `<token>_total`.                 |
| Page an expanded list                  | Send an explicit `length` ≤ 2500.                            |
| Read plugin associations               | Look under `pluginItems`.                                    |
| Get decrypted secrets                  | Direct single-entity GET only (never lists/expansions).      |
