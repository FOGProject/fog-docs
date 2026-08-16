---
title: API Documentation Page & OpenAPI Spec
description: The built-in Swagger UI reference, and the OpenAPI document FOG generates from its own routing and model metadata
context_id: api-openapi-reference
aliases:
    - OpenAPI
    - Swagger
    - Swagger UI
    - API Documentation Page
    - swagger.json
tags:
    - 1_6-changes
    - kb
    - integrations
    - api
---

# API Documentation Page & OpenAPI Spec

FOG 1.6 describes its own REST API. The server generates an
[OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) document from its live routing and model
metadata, and renders it in the web UI with Swagger UI, so you can read every endpoint and try
calls against your own server without leaving it.

> [!note] FOG 1.6 and newer
> The generator relies on the schema manifest introduced in 1.6. There is no equivalent on 1.5.

## Where to find it

**API Documentation** in the main menu. The page needs the API switched on — see
[[api|API]] for that — and, like the rest of the API, it is unavailable while
`FOG_API_ENABLED` is off. The page will tell you so rather than showing you an empty panel.

Use **Authorize** to enter your tokens before trying a call:

- the server-wide token is under **FOG Configuration → FOG Settings → API System**
- your personal token is on the **API** tab of your own user account, which needs API access enabled

Paste both exactly as the UI shows them. See [[api|API]] for the detail on why.

The reference follows the light/dark toggle in the header along with the rest of the UI.

## The raw document

Two paths serve the same document:

| Path | Notes |
|---|---|
| `https://your-fog-server/fog/system/openapi` | Canonical, alongside the other `system/*` endpoints |
| `https://your-fog-server/fog/swagger.json` | The filename most tooling looks for first |

Both are unauthenticated, so a client can discover the server before it has credentials. They expose
only the *shape* of the API — class names, field names and types — and no data.

Replace `/fog/` with your own web root if you changed it at install time.

### It describes *your* server

The document is generated per request rather than shipped as a file, which means it describes the
server serving it — including any classes a plugin has added. A file baked at build time would
describe the classes FOG ships with instead, which on a server running plugins is a different list.

A typical install produces around 390 paths across 50-odd classes.

## Using it with other tools

Any OpenAPI-aware tool can consume it, which is the point of publishing a machine-readable
description at all. Point the tool at the URL above, or download the document first if the tool
cannot reach your server directly.

**Generate a client** in whatever language you are working in:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://your-fog-server/fog/swagger.json \
  -g python -o fog-client
```

`openapi-generator` supports 50+ languages. Swap `-g python` for `go`, `java`, `csharp`, `rust` and
so on.

**Import into Postman or Insomnia** — both read an OpenAPI URL directly and build a request
collection from it.

**Read it offline** in [Swagger Editor](https://editor.swagger.io/) or
[Redocly](https://redocly.com/), by pasting the downloaded document in.

> [!tip] Self-signed certificates
> A default FOG install uses a self-signed certificate, so a tool fetching the URL may refuse it.
> Either trust the FOG CA on the machine running the tool, or download the document with
> `curl -k` and feed the tool the local file.

## What the document does and does not cover

Generated from three sources that FOG already reads at runtime, so they cannot drift from the
behaviour they describe:

- the router's class list and route table, for every path and method
- each model's field metadata, for property names, required fields and types
- the permission registry, for the permission each operation needs, published as `x-fog-permission`

Some things are described in prose on the operations they affect rather than as strict schema,
because no metadata backs them:

- a handful of classes gain extra fields in responses (`image` returns `os`, `osname`,
  `imagetypename` and `storagegroupname`, for instance) from hand-written code rather than from the
  model definition
- some classes accept extra fields on create and edit that are not columns — `host` takes `macs`,
  `primac`, `snapins`, `printers`, `modules` and `groups`
- a field with no type information in the schema manifest is described as a string and says so,
  rather than being given a guessed type

Fields withheld from list responses but returned on a single GET by id are marked
`x-fog-sensitive: list` and say as much in their description.

Every property is also addressable by its raw database column name, since the model layer accepts
either spelling. The document uses the property name and records the column as `x-fog-column`.

## Related

- [[api|API]] — authentication, tokens, and worked examples
- [[api-expansion-and-pagination|API Pagination, Expansion & Plugin Items]] — paging parameters and
  the response envelope, which the document describes but that page explains
