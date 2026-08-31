---
title: "API Pagination, Expansion & Plugin Items (1.5)"
aliases:
    - "API Pagination, Expansion & Plugin Items (1.5)"
description: FOG 1.5's REST API has no pagination, relation expansion, or pluginItems envelope — what that means and what to use instead
context_id: "api-expansion-and-pagination-1.5"
tags:
    - kb
    - integrations
    - api
    - 1_5-legacy
---

# API Pagination, Expansion & Plugin Items (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/kb/integrations/api-expansion-and-pagination|1.6 version]] of this
>page for FOG 1.6.

**FOG 1.5's REST API has no equivalent to expand or paging.** Pagination
(`length`/`start`), relation expansion (`?expand=…`), the `recordsTotal` /
`recordsFiltered` / `nextUrl` response envelope, and the `pluginItems`
namespaced key for plugin-contributed associations are all FOG 1.6 additions
— see the [[1.6/kb/integrations/api-expansion-and-pagination|1.6 version]] of
this page for what they do there.

## What this means in practice

- **A list endpoint returns everything, in one response.** `GET /fog/host`
  returns every host in the database in a single JSON array, with no `length`
  or `start` query parameters honored and no way to ask for a page at a time.
  On a large fleet this means a large response — there is nothing built into
  the API to bound it.
- **No inlined related objects.** A host response contains scalar foreign
  keys only (`imageID` as a plain id, `snapins` and similar as arrays of ids)
  — never a full related object alongside them. If you need the image's name
  or a snapin's details, you make a second call to fetch that object by id
  yourself.
- **No `pluginItems` envelope.** A plugin that contributes associations to
  another entity's API output does so however it individually chooses to (for
  example its own route, or fields mixed directly into the parent object) —
  there is no reserved, namespaced key that guarantees a plugin can never
  clobber a core field.

## What to do instead

- **Paginate client-side**, if you need to: fetch the full list and page
  through it in your own code, or use `/fog/<class>/search/<term>` (see
  [[1.5/kb/integrations/api|the 1.5 API page]]) to narrow the result set
  before you fetch it.
- **Fetch related objects with a second call.** Read the scalar id (e.g.
  `imageID`) off the first response, then `GET /fog/image/<id>` for the
  details.

See [[1.5/kb/integrations/api|API (1.5)]] for authentication and the rest of
this version's API.
