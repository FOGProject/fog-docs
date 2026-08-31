---
title: OpenID Connect Sign-in
aliases:
    - OIDC
    - OIDC Plugin
    - Single Sign-On
    - SSO
    - Entra ID Login
    - Keycloak Login
    - Google Workspace Login
    - Single Logout
    - Forced SSO
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

It differs from [[management/web/ldap|LDAP Authentication]] in one way that matters
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
| **Single Logout** | Signing out of FOG also ends the session at the provider. Off by default — see [[#Signing out]] |
| **Redirect Login To This Provider** | Send everyone straight to the provider instead of showing FOG's login form. Off by default — read [[#Sending everyone straight to the provider]] before ticking it |

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

## Setting up your provider

Three worked examples. The FOG half is the same every time — name,
issuer, client ID, client secret, tick **Enabled** — so what follows is
mostly what to do at the provider, and the one trap each of them has.

Before you start, copy the redirect URI from the FOG provider page. You
need it in all three.

### Keycloak

The example this section was written against, and the easiest one to
stand up if you want to try the plugin before committing to a company
directory.

1. **Clients → Create client.** Client type *OpenID Connect*, Client ID
   `fog-web`.
2. On the next step turn **Client authentication** *on* — that makes it
   a confidential client, which is what issues a secret. Leave *Standard
   flow* ticked and turn the rest off.
3. **Valid redirect URIs**: paste the value from FOG. A wildcard such as
   `https://fog.example.com/fog/*` also works while you are testing.
4. **Credentials** tab → copy the **Client secret**.
5. **Client scopes → `fog-web-dedicated` → Add mapper → By configuration
   → Group Membership.** Name it `groups`, set **Token Claim Name** to
   `groups`, and turn **Full group path** *off* unless you intend to map
   full paths.

>[!warning] Full group path is on by default
>Left on, Keycloak sends `/fog-admins`, not `fog-admins`, and a mapping
>written as the bare name silently matches nothing. Either turn it off,
>or write your FOG mappings with the leading slash — but be consistent.

In FOG:

| Field | Value |
|---|---|
| Issuer | `https://keycloak.example.com/realms/<realm>` |
| Client ID | `fog-web` |
| Client Secret | from the Credentials tab |
| Username Claim | `preferred_username` |
| Group Claim | `groups` |

### Microsoft Entra ID (Microsoft 365)

1. **Entra admin centre → App registrations → New registration.**
2. **Redirect URI**: platform **Web**, and paste the value from FOG. It
   must be the *Web* platform — not *Single-page application*, which
   issues no client secret.
3. Copy the **Application (client) ID** and the **Directory (tenant)
   ID** from the Overview page.
4. **Certificates & secrets → New client secret.** Copy the *Value*, not
   the Secret ID, and note the expiry — an expired secret is an outage.
5. **Token configuration → Add groups claim** if you want group
   mapping. Pick which groups to emit, and open **ID** →
   *Customize token properties by type* to choose what identifies them.

>[!warning] Use the tenant issuer, never `common`
>`https://login.microsoftonline.com/common/v2.0` publishes its issuer as
>the literal string `https://login.microsoftonline.com/{tenantid}/v2.0`
>— a template, not a URL. FOG checks that the token's `iss` matches the
>issuer you configured, so every sign-in through `common` fails. Use
>your tenant's own GUID:
>
>```
>https://login.microsoftonline.com/<tenant-guid>/v2.0
>```
>
>You can confirm what any tenant publishes by fetching
>`https://login.microsoftonline.com/<your-domain>/v2.0/.well-known/openid-configuration`
>and reading the `issuer` value back out.

| Field | Value |
|---|---|
| Issuer | `https://login.microsoftonline.com/<tenant-guid>/v2.0` |
| Client ID | Application (client) ID |
| Client Secret | the secret *Value* |
| Username Claim | `preferred_username` |
| Group Claim | `groups` |

Entra's `groups` claim carries group **object IDs** — GUIDs — unless you
configure it otherwise, so that GUID is what goes in the FOG provider
group. See [[#Getting the group values right]].

>[!note] Large group memberships
>Entra omits the `groups` claim entirely for a user in more than about
>200 groups, substituting a pointer to the Graph API that FOG does not
>follow. Such a user signs in and receives nothing. Emit only the groups
>you need rather than all of them.

### Google Workspace

1. **Google Cloud console → APIs & Services → OAuth consent screen.**
   Configure it as *Internal* for a Workspace domain.
2. **Credentials → Create credentials → OAuth client ID.** Application
   type **Web application**.
3. **Authorised redirect URIs**: paste the value from FOG.
4. Copy the **Client ID** and **Client secret**.

| Field | Value |
|---|---|
| Issuer | `https://accounts.google.com` |
| Client ID | ends in `.apps.googleusercontent.com` |
| Client Secret | from the same page |
| Username Claim | `email` |
| Group Claim | leave as is; nothing will match it |

>[!warning] Google sends no groups, so group mapping does not work
>A Google ID token carries `email`, `name` and the rest of the profile —
>it has no groups claim of any kind, and Workspace group membership is
>only readable through the Admin SDK, which is a separate API call FOG
>does not make. Nothing in the plugin can map a Google group to a role.
>
>Use Google for **authentication only**: leave **Create Users On First
>Login** off, create each FOG account yourself, and assign its role by
>hand. If you turn provisioning on, every account it creates will have
>no role and see nothing until somebody assigns one.

>[!note] `preferred_username` is empty on Google
>Set the Username Claim to `email`, or every sign-in fails to resolve an
>account. The FOG username then has to be the full email address.

### GitHub is not an option

GitHub is not an OpenID Connect provider. GitHub OAuth Apps speak plain
OAuth 2.0: there is no discovery document at
`https://github.com/.well-known/openid-configuration`, no ID token, and
no key set to verify one against. FOG has nothing to check, so there is
nothing this plugin could do with it.

(GitHub does publish an OIDC issuer at
`token.actions.githubusercontent.com`, but that exists so a GitHub
Actions workflow can prove what it is to a cloud provider. It does not
authenticate people.)

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

## Signing out

By default, **Log out** ends FOG's session and nothing else. Your provider's
own session is untouched, so clicking the provider button again signs the
same person straight back in with no prompt. That is the standard behaviour
of single sign-on and is often what people expect.

It is a problem in one case: an account owned by a provider cannot sign in
with a local password, so on a shared computer there is no way to hand over
to somebody else short of clearing cookies.

Tick **Single Logout** on the provider to end the provider's session too.
It ships **off**, deliberately: it is only the right answer where FOG is
the only application behind that provider. If you share an identity
provider with your mail, your ticket system and your VPN, then signing out
of FOG signing people out of all of them is a surprise reaching
applications FOG has nothing to do with.

### Register the post-logout redirect URI

The provider needs to know where to send people after it ends their
session, and — like the sign-in redirect URI — it will only accept a value
you have registered in advance. Most providers refuse an unregistered one
and show their own error page instead of coming back, which looks exactly
like FOG being broken.

FOG shows the exact value on the provider's page, next to the setting.
Copy it from there. It looks like:

```
https://fog.example.com/fog/management/index.php
```

Where to put it: **Keycloak** — the client's *Valid post logout redirect
URIs*. **Entra ID** — the app registration's *Front-channel logout URL*.
**Okta** — the application's *Sign-out redirect URIs*.

>[!tip] Keycloak may already accept it
>Leave *Valid post logout redirect URIs* **empty** and Keycloak treats it
>as `+`, meaning "the same list as the sign-in redirect URIs". So a client
>registered with `https://fog.example.com/fog/*` already accepts this
>value, and there is nothing to add. Fill the field in and that
>inheritance stops — from then on the list is exactly what you typed, and
>the sign-out value has to be in it. Check before you go looking for a
>problem you do not have.

>[!warning] This value changed in plugin v1.6.10
>On v1.6.9 it was `…/management/login.php`. If you turned Single Logout on
>at that version, re-register the new value — providers that follow the
>spec refuse an unregistered one and show their own error page instead of
>coming back to FOG.

That is FOG's ordinary login page, and on an install that also has the
redirect below turned on it sends you back to the provider. That is the
point: the provider session was just ended, so it asks who you are instead
of waving you through. Signing out and signing in as somebody else is one
journey.

If the provider publishes no `end_session_endpoint`, FOG cannot do this at
all. It logs that to the web server's error log and signs you out of FOG
only, which is otherwise indistinguishable from the setting being off.

## Sending everyone straight to the provider

On an install where every account lives at your provider, FOG's username
and password box is a dead end — it cannot accept those credentials, so all
it does is add a click. Tick **Redirect Login To This Provider** and an
anonymous visitor goes straight to the provider instead.

>[!warning] Read this before you tick it
>This setting can lock every administrator out of your server. If the
>provider becomes unreachable, its certificate expires, its client secret
>is rotated, or its issuer was mistyped, a login page that unconditionally
>redirects has no way back through a browser.
>
>**The way back is [[local-login|The Local Login Page]]:**
>`https://fog.example.com/fog/management/login.php`, which always shows
>FOG's own form and can never be redirected. FOG prints that URL next to
>the checkbox. Bookmark it, and confirm a local administrator can sign in
>there, before you turn this on.

It ships **off**, and a newly created provider always has it off.

Three things it deliberately does not do:

- **It does not affect anyone already signed in.** The redirect happens
  only when an anonymous visitor is about to be shown the login form.
- **It does not interfere with the sign-in coming back.** The callback is a
  different route and is never redirected.
- **It does not trap you in a loop when the provider refuses.** A failed
  sign-in lands on the local login page with the reason attached, rather
  than bouncing straight back out to the provider that just said no.

### Two providers cannot both do it

If more than one enabled provider has this ticked, FOG **refuses to
redirect at all** and shows its normal login form, naming the providers
involved in the web server's error log.

That is on purpose. The login page cannot redirect to two places, and
silently picking one would send everybody to a provider that was never
chosen — on the one page you are least able to debug. Showing the form is a
working login for everybody and visibly not what you asked for.

If you want this behaviour, pick one provider and untick the others.

### Logging out with this on

**Turn [[#Signing out|Single Logout]] on as well.** With both on, signing
out ends the provider session and returns you here, which sends you back to
the provider — and because its session is genuinely gone, it asks for
credentials. That is the behaviour people expect from "log out".

If Single Logout is **off**, that same journey would sign you straight back
in: your provider session is untouched, so the redirect is answered
silently. FOG avoids that by sending you to
[[local-login|the local login page]] instead. You are signed out of FOG,
still signed in at the provider, and looking at a form rather than back
where you started — correct, but a little surprising, and the reason to
turn Single Logout on.

A **failed** sign-in always lands on the local login page too, whatever
these settings say. Bouncing back to a provider that just refused you is a
loop.

## Break-glass

**Local password login can never be turned off.** There is no setting
for it. That is deliberate: an expired client secret, a mistyped issuer
or a provider outage must not be able to lock you out of your own
server.

It has its own page, because it is the thing to reach for when everything
here has gone wrong: [[local-login|The Local Login Page]], at
`https://fog.example.com/fog/management/login.php`. That URL always shows
FOG's own form and can never be redirected to a provider.

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
| *Unknown identity provider*, on a provider that is configured and enabled | The provider row failed validation, or the sign-in URL arrived without its `?provider=` parameter. Both were fixed during 1.6 development; update the server and the bundled plugins. |
| *That identity provider is not enabled* | Checked on the way back as well as on the way out, so disabling a provider ends sign-ins already in progress. |
| Signs in fine but sees nothing | No mapped group, or the group value does not match what the provider sends. See [[#Getting the group values right]]. |
| The login page never appears — it always goes to the provider | **Redirect Login To This Provider** is on. Use [[local-login\|the local login page]] to get in and untick it. |
| The login page still appears although the redirect is ticked | More than one enabled provider has it ticked, so FOG refused to choose. Check the web server's error log; untick all but one. |
| Logging out leaves you signed in — the provider button lets you straight back | **Single Logout** is off. That is the default. |
| Log out ends at the provider's error page instead of returning to FOG | The post-logout redirect URI is not registered at the provider. See [[#Register the post-logout redirect URI]]. |
| Log out signs you out but does not end the provider session, with **Single Logout** on | The provider publishes no `end_session_endpoint`. FOG logs this to the web server's error log. |

Anything the person in the browser should not see — a signature failure,
an unreachable endpoint, a refused subject — is written to the web
server's error log with the detail, and shown to them as a short
message. Check the log first.
