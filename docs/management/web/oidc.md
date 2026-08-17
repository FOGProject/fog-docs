---
title: OpenID Connect Sign-in
aliases:
    - OIDC
    - OIDC Plugin
    - Single Sign-On
    - SSO
    - Entra ID Login
    - Keycloak Login
description: How the OpenID Connect plugin lets people sign in to FOG with an identity provider, and which role each one receives
context_id: oidc
tags:
    - 1_6-changes
    - management
    - users
    - roles
    - permissions
    - plugins
    - oidc
    - web-ui
    - web-management
---

# OpenID Connect Sign-in

## Overview

The **OIDC** plugin lets people sign in to FOG with an identity
provider — Entra ID, Keycloak, Okta, Google Workspace, or anything else
that speaks OpenID Connect — instead of a password stored in FOG.

>[!note] This page describes FOG 1.6
>The plugin needs extension points that landed during 1.6 development
>and does not exist on 1.5. Its manifest refuses to activate on anything
>older.

It differs from [[ldap|LDAP Authentication]] in one way that matters
before anything else: **nothing types a password into FOG**. The browser
is redirected to your provider, the person signs in there, and comes
back carrying a signed token. FOG never sees the credential, so there is
nothing for it to store or leak.

Local password login always keeps working. That is not a setting you can
turn off — see [[#Break-glass]].

## Adding a provider

**OpenID Connect → Create New OpenID Connect Provider.**

| Field | What to put in it |
|---|---|
| **Name** | Whatever you want on the login button, e.g. `Company SSO` |
| **Issuer** | The issuer URL from your provider, `https://` only |
| **Client ID** | From the application you registered at the provider |
| **Client Secret** | From the same place |
| **Scopes** | Defaults to `openid profile email` |
| **Username Claim** | Which claim names the FOG account. Defaults to `preferred_username` |
| **Group Claim** | Which claim carries group membership. Defaults to `groups` |
| **Enabled** | Off until you switch it on |

You do not enter the authorization, token or key endpoints. FOG reads
them from `<issuer>/.well-known/openid-configuration` on every sign-in,
so they cannot drift from what your provider currently publishes.

>[!note] A new provider is created switched off
>Adding the row is not the same act as putting a new way into your
>server, and filling in a client secret takes a few minutes. Nothing is
>reachable until you tick **Enabled**.

### The redirect URI to register at your provider

The provider needs to know where to send people back. FOG shows the
exact value on the provider's own page — copy it from there rather than
typing it, because it is built from your `FOG_WEB_HOST` and
`FOG_WEB_ROOT` settings and has to match byte for byte. It looks like:

```
https://fog.example.com/fog/ext/oidc/callback
```

>[!warning] HTTPS only
>The issuer must be `https://`, and so must every endpoint your provider
>publishes. FOG refuses anything else. A sign-in carries a token that
>proves who somebody is; over plain HTTP anybody on the path can take
>it.

### Which claim names the account

`preferred_username` is the default because Entra ID and Keycloak both
populate it, and its value looks like the username an administrator has
already typed into FOG. Some providers leave it empty — bare Google, and
some Okta configurations — which is why it is a field and not a
constant. `email` is the usual alternative.

Whatever you choose has to match the FOG **username**, not the display
name.

## What FOG stores for a provider user

The first time somebody signs in, FOG records the provider's subject
identifier (`sub`) against their FOG account and uses that identifier
from then on.

That matters because a username can be reassigned. If somebody leaves
and their username is later reissued to a new starter, the recorded
subject is what stops the new person inheriting the old one's FOG
account. If the two ever disagree, the sign-in is **refused** rather
than resolved — both readings are somebody signing into an account that
may not be theirs.

Nothing else is stored. The client secret is never shown in the edit
form after you save it, never returned by the API, and is stripped from
the CSV export.

## Who is allowed in

**By default, an account has to exist in FOG already.** Somebody your
provider is perfectly happy to authenticate, who has no FOG account, is
refused. Holding an account at your identity provider is not the same
thing as being allowed into FOG.

If you want FOG to create the account instead, tick **Create Users On
First Login** on the provider. It ships off.

>[!warning] Provisioning applies to everyone the provider will authenticate
>With it on, anybody who can sign in at your provider gets a FOG account
>— which for a company-wide directory is the whole company. What they
>can *do* is decided entirely by the group mappings below, and an
>account with no mapped group receives nothing and sees nothing. That is
>the safe combination; the unsafe one is switching provisioning on and
>then mapping a group broadly.

## What a provider user gets

Provider users are subject to [[roles|roles]] exactly like anyone else,
and — like anyone else — **a user with no role has no access**.

You map **each group value to whatever it should grant**. Go to
**OpenID Connect Groups → Create New Provider Group**, enter the value
as your provider publishes it, and pick the provider it belongs to. Then
open that group and use its **Role Association** and **User Group
Association** tabs to say which [[roles|roles]] and which FOG user
groups it hands out. Both tabs can create the role or user group without
leaving the page.

Mappings are **additive**. Somebody in three mapped groups receives
everything all three grant; there is no ranking and no "highest wins".
Group values you have not mapped grant nothing.

>[!note] Prefer mapping to a user group
>A FOG user group holds roles, so mapping a claim value to a user group
>keeps policy in one place and leaves the provider deciding only who is
>in which bucket. Mapping straight to a role works and is fine for
>simple cases.

### Getting the group values right

The value has to match what your provider actually *sends*, which is
often not what its admin UI shows you:

- **Entra ID** sends group **object IDs** by default — raw GUIDs — not
  display names. You can configure it to send names instead, and it is
  worth doing before you map anything.
- **Keycloak** sends group **paths**, e.g. `/it/fog-admins`, unless the
  mapper is configured otherwise.
- **Okta** sends whatever the groups claim expression selects.

If a mapping is not taking effect, this is almost always why. The value
is matched exactly — FOG does not split, trim to a last segment, or
guess a delimiter, because every candidate delimiter is legal inside a
group name and a wrong guess would silently match a mapping you did not
write.

### Grants are re-evaluated on every sign-in

The roles and user groups above are recomputed from the provider each
time somebody signs in. Remove them from a mapped group at the provider
and their next FOG sign-in drops whatever that group granted.

Anything an administrator attached to that user **by hand** is left
alone. That carve-out is deliberate: without it the sync would silently
revoke grants you made on purpose, and you would have no way to give a
provider user anything extra.

Deleting a mapping revokes it too, at everyone's next sign-in. FOG keeps
a record of what it granted each person precisely so that removing a
mapping does what it looks like it does.

## Break-glass

**Local password login can never be turned off.** There is no setting
for it. That is deliberate: an expired client secret, a mistyped issuer
or a provider outage must not be able to lock you out of your own
server.

Two rules back it up, and you will meet them as refusals:

- **You cannot delete the last administrator who can sign in with a
  local password**, even if other administrators exist through a
  directory.
- **You cannot convert that account to an external identity** either.

FOG refuses both with *"This would leave no account able to administer
FOG without its identity provider."* To get past it, give another
administrator account a local password first.

>[!note] Only accounts FOG created are locked to the provider
>An account an administrator made keeps its local password even after
>somebody signs into it through a provider — that password is the way
>back in. An account FOG *provisioned* has no local password to keep
>(it is created with a random token nobody has ever seen), so it can
>only be reached through the provider.

An API token is a second, weaker way in — token authentication never
touches a password or a provider — but it reaches the API and not the
web UI, and it is a secret that can be rotated or lost. Do not treat it
as your break-glass plan.

## Auditing

The login history records **how** each session was established, not just
who owns it, so a sign-in through a provider is distinguishable from a
local password one. After an incident that is usually the first question
asked.

This is separate from which provider owns an account: an account owned
by a directory can still be signed into by something else, and that is
exactly the case worth being able to see.

## API access

Tick **Allow API** on the provider to give the accounts it provisions
API access. It applies to accounts FOG creates; an account an
administrator made keeps whatever API setting it already had.

>[!warning] API basic auth needs the provider to be up
>An account owned by a provider cannot authenticate with a local
>password, and API **basic** auth is a local password. Such an account
>reaches the API by **token** only. Tokens keep working during an
>outage; basic auth does not.

## Troubleshooting

| What you see | Usually means |
|---|---|
| *No FOG account exists for `name`* | The account has not been created, and **Create Users On First Login** is off. Either create it, or turn provisioning on. |
| *The provider returned a configuration for a different issuer* | The **Issuer** field does not match what the discovery document says. Copy it from the provider exactly, with no trailing slash. |
| *The ID token was issued to someone else* | Wrong **Client ID**, or the redirect URI registered at the provider belongs to a different application. |
| *This identity is linked to a different FOG account* | The recorded subject and the username claim disagree. Somebody's username was probably reassigned; remove the stale identity link from the user. |
| *The sign-in took too long; please start again* | More than ten minutes between clicking the button and coming back. |
| *That identity provider is not enabled* | Checked on the way back as well as on the way out, so disabling a provider ends sign-ins already in progress. |
| Signs in fine but sees nothing | No mapped group, or the group value does not match what the provider sends. See [[#Getting the group values right]]. |

Anything the person in the browser should not see — a signature failure,
an unreachable endpoint, a refused subject — is written to the web
server's error log with the detail, and shown to them as a short
message. Check the log first.
