---
title: "API (1.5)"
aliases:
    - "API (1.5)"
description: FOG 1.5 REST API usage — the token-pair and HTTP Basic authentication methods, and practical examples
context_id: "api-1.5"
tags:
    - kb
    - integrations
    - api
    - 1_5-legacy
---

# API (1.5)

>[!info] This page describes FOG 1.5.
>See the [[kb/integrations/api|1.6 version]] of this page for FOG 1.6, which
>adds a third, simpler authentication method (a single Bearer token) on top of
>everything below — both methods here keep working unchanged on 1.6 too.

In here you'll find some practical API examples. But first, let's explain how
to authenticate.

## Basics

To be able to use the API via external calls it needs to be enabled in the FOG
web UI (FOG Configuration → FOG Settings → API System) first.

## Authentication

There are two ways to authenticate on this version. Pick one — you do not
combine them.

| Method | What you send |
| --- | --- |
| Token pair (recommended) | `fog-api-token` + `fog-user-token` headers |
| HTTP Basic | `Authorization: Basic <base64 user:password>` |

Every method carries the same permissions: whatever the account can do in the
web UI, it can do through the API — an account without administrator access
gets `403 Forbidden` from an endpoint it cannot use in the UI either.

### Token pair

**API global token** — a header named `fog-api-token`. You can find yours via
FOG Configuration → FOG Settings → API System.

**API user token** — a header named `fog-user-token`. You can find yours via
Users → List All Users → *your username* → API. The user's **User API
Enable** checkbox on that tab must be ticked, or the token is rejected even
when sent.

>[!note] Copy the token values as shown
>The web UI already displays both tokens **base64-encoded**, which is exactly
>the form the server expects in the header. Copy the displayed value verbatim
>— the server base64-decodes the header before comparing it. A raw,
>un-encoded token will fail with `403 Forbidden`.

### HTTP Basic Auth

You can use HTTP Basic Authorization (with `curl -u <user>:<password>` or a
header of the form `Authorization: Basic <base64encoded username:password>`).
Although this type of authentication is allowed and will work, the token-pair
system is still recommended, as a token cannot be decoded back into a valid
username/password pair capable of managing your FOG server.

Basic auth replaces the **user** token, not the global one. The
`fog-api-token` header is still required, and a request without it is
rejected with `403 Forbidden` before the username and password are ever
looked at:

```bash
curl -H 'fog-api-token: yourapitoken' \
     -u 'youruser:yourpassword' \
     -X GET http://fogserver/fog/host
```

The account signs in exactly as it would in the web UI. Accounts from an
external directory (LDAP) can authenticate this way too, provided **Allow
API** is enabled on the LDAP server.

### Example

While many different tools can be used to make API calls, `curl` is one of
the most basic ones if you are on Linux and want to give it a try:

```bash
curl -H 'fog-api-token: yourapitoken' \
     -H 'fog-user-token: yourusertoken' \
     -X GET http://fogserver/fog/system/info
```

## Routes and Methods

To keep the information in the documentation as universal as possible, we only
show the URL for each API call.

### GET

Here are some core GET calls:

| Route | Description |
| --- | --- |
| `/fog/system/info` | Health check — confirms the API is enabled and reachable. Requires no token and returns a small JSON payload containing the server version. |
| `/fog/task/active` | Returns a list of pending and active tasks. |
| `/fog/multicastsession/current` | Returns a list of active multicast sessions. |
| `/fog/host` | Returns a list of all the registered hosts. |
| `/fog/<class>/search/<term>` | Returns the records of `<class>` that match the search term, e.g. `/fog/host/search/<term>` for hosts or `/fog/image/search/<term>` for images. |

### POST

#### Creating an image

Use the following API call to create an image: `/fog/image/create`. You need
to pass the following parameters:

| Parameter | Description |
| --- | --- |
| `name` | The name of the image. |
| `path` | The path to the image. |
| `imageTypeID` | How the image is stored (see the table below). |
| `osID` | The operating system ID for the image. |

Any other Image field (for example `description`, `imagePartitionTypeID`,
`format`, or `compress`) may also be included in the body.

**Image types** — the value to pass as `imageTypeID`:

| `imageTypeID` | Type |
| --- | --- |
| 1 | Single Disk - Resizable |
| 2 | Multiple Partition Image - Single Disk (Not Resizable) |
| 3 | Multiple Partition Image - All Disks (Not Resizable) |
| 4 | Raw Image (Sector By Sector, DD, Slow) |

A successful create returns the full JSON of the saved image object.

#### Creating a task (deploy, capture, etc.)

Put the ID of the host in the URL of the API call: `/fog/host/<id>/task` (this
also works for other tasking objects, such as groups). The body selects the
task with a `taskTypeID` key, for example:

```json
{"taskTypeID": "1"}
```

`taskTypeID` `1` deploys and `2` captures. The full list of task types
follows.

>[!warning] The body key is `taskTypeID`, not `taskType`
>The endpoint reads the JSON property `taskTypeID`. A body of
>`{"taskType": "1"}` leaves `taskTypeID` unset and results in a `404`.

**Task types** — the value to pass as `taskTypeID`:

| `taskTypeID` | Task |
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

>[!note] The IDs are not contiguous
>There is intentionally no task type `9`, and `8` is Multi-Cast — pass the ID
>from the table, not the row position.

>[!note] Assign an image first
>You must assign an image to the host (and the image must be enabled) before
>you can deploy it. Assign it with a PUT request (see below).

A successful task call returns an empty string (`""`).

### PUT

Edit a host: `/fog/host/<id>/edit`. Example body:

```json
{"imageID": "1"}
```

A successful edit returns the full JSON of the updated host object.

## Pagination and relation expansion

This version's API has no equivalent to paging (`length`/`start`), inlining
related objects (`?expand=…`), or the `pluginItems` envelope — every list
endpoint returns the full result set in one response, with only scalar
foreign keys (`imageID` and the like), and there is no self-describing API
documentation page. Those are all FOG 1.6 additions; see
[[1.5/kb/integrations/api-expansion-and-pagination|API Pagination, Expansion & Plugin Items (1.5)]]
for what that means in practice.
