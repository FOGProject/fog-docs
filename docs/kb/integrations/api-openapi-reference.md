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
[OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3) document from its live routing and model
metadata, and renders it in the web UI with Swagger UI, so you can read every endpoint and try
calls against your own server without leaving it.

> [!note] FOG 1.6 and newer
> The generator relies on the schema manifest introduced in 1.6. There is no equivalent on 1.5.

## Where to find it

**API Documentation** in the main menu. The page needs the API switched on — see
[[kb/integrations/api|API]] for that — and, like the rest of the API, it is unavailable while
`FOG_API_ENABLED` is off. The page will tell you so rather than showing you an empty panel.

Use **Authorize** to enter your tokens before trying a call:

- the server-wide token is under **FOG Configuration → FOG Settings → API System**
- your personal token is on the **API** tab of your own user account, which needs API access enabled

Paste both exactly as the UI shows them. See [[kb/integrations/api|API]] for the detail on why.

The reference follows the light/dark toggle in the header along with the rest of the UI.

## Code snippets for the call you just made

Run a call with **Try it out** → **Execute** and a **Snippets** panel appears with the same request
written several ways:

| Tab | What it uses |
|---|---|
| cURL | `curl`, the form the rest of these pages quote |
| cURL (PowerShell) | `curl.exe`, with PowerShell quoting and backtick continuations |
| cURL (CMD) | `curl`, with Windows `cmd` quoting and caret continuations |
| PowerShell | `Invoke-RestMethod`, headers in a hashtable and the body in a here-string |
| Python | the [`requests`](https://requests.readthedocs.io/) library |
| JavaScript | `fetch` |
| Ruby | `net/http` from the standard library, so nothing needs installing |
| PHP | the [cURL extension](https://www.php.net/manual/en/book.curl.php) |

Each is the *actual* request — your server's address, the path with your parameters filled in, your
headers, and the body you typed — so it can be pasted into a shell or a script and run as-is.

> [!note] This list is likely to get shorter
> Every generator that exists is on for now, so the set can be judged in use rather than in the
> abstract. Expect some tabs to go — **cURL (PowerShell)** and **PowerShell** in particular answer
> the same question in two different ways on purpose, so it is easy to see which one is worth
> keeping.

**cURL (PowerShell)** is Swagger UI's own, and despite the name it is a `curl.exe` command line
rather than PowerShell. **PowerShell** is the one that uses the cmdlets. Either runs; the second is
the one to build a script on — and for anything past a one-off,
[FogApi](https://fogapi.readthedocs.io/en/latest/) is a PowerShell module built around this API and
worth reaching for first.

> [!warning] The snippet contains your token
> Whatever you entered under **Authorize** is in the snippet, because it was in the request. Strip
> it before pasting a snippet into a ticket, a chat, or a repository.

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

A typical install produces around 510 paths and 716 operations across some 69 classes.

### Why 3.0.3 and not 3.1

The document uses no JSON Schema feature that 3.0.3 cannot express, and declaring 3.1 costs about a
second of frozen page every time you expand an operation: Swagger UI resolves a 3.1 document through
its JSON-Schema-2020-12 resolver, which re-resolves the whole document on each subtree request, so
the cost tracks the size of the document rather than the size of the thing you clicked. On a
document this size that is 1798ms per expansion against 156ms. Nullable fields are therefore spelled
3.0's `nullable: true`, and the handful of genuinely multi-type fields as `oneOf`.

The side benefit is reach: client generators still have open bugs handling 3.1's
`type: [x, "null"]`, so a 3.0.3 document generates working clients in more places than a 3.1 one
would.

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

Three things are read live at generation time, so they cannot drift from the behaviour they
describe:

- the router's class lists, for which classes appear and which of them accept tasks or expose an
  active list
- each model's field metadata, for property names, required fields and types
- the permission registry, for the permission each operation needs, published as `x-fog-permission`

Add a class to the router and its whole set of operations appears here with no further work,
including a class contributed by a plugin.

The *shape* of each operation is written by hand, though — the ten generic routes every class gets,
and the fixed `system/*` endpoints. An endpoint that follows neither pattern has to be described
deliberately, so a route added without that step is served but not documented. Two are in that
state today: `POST /snapin/createwithfile` and `POST /storagegroup/{id}/uploadsnapinfiles`, both
multipart uploads rather than the JSON bodies the rest of the API takes.

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

- [[kb/integrations/api|API]] — authentication, tokens, and worked examples
- [[kb/integrations/api-expansion-and-pagination|API Pagination, Expansion & Plugin Items]] — paging parameters and
  the response envelope, which the document describes but that page explains
