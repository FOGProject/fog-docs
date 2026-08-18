---
title: The Local Login Page
aliases:
    - Local Login
    - login.php
    - Break-glass Login
    - Emergency Login
    - Backdoor Login
    - Bypass SSO Login
description: One URL that always shows FOG's own username and password form, whatever your identity provider is doing
context_id: local-login
tags:
    - 1_6-changes
    - management
    - users
    - security
    - oidc
    - ldap
    - web-ui
    - web-management
---

# The Local Login Page

## The URL

```
https://fog.example.com/fog/management/login.php
```

This page **always** shows FOG's own username and password form. It cannot
be redirected to an identity provider, it does not consult one, and no
plugin can change that.

>[!note] This page describes FOG 1.6
>`management/login.php` landed during 1.6 development. On 1.5 there is no
>equivalent, and no setting that would need one.

Bookmark it now, before you need it. Somebody locked out of a FOG server is
in no position to go looking for a URL, and this is not one you would guess.

## Why it exists

FOG can be configured to send everyone straight to an identity provider —
see [[oidc#Sending everyone straight to the provider|Sending everyone straight to the provider]].
On an install where every account lives at the provider, that is the right
setting: FOG's password box cannot accept those credentials, so all it does
is add a click.

It is also the setting that can lock every administrator out of a server at
once. If the provider becomes unreachable, its certificate expires, its
client secret is rotated, its discovery document breaks, or its issuer was
mistyped, then a login page that unconditionally redirects has no way back
— including for the local account that exists for exactly this situation.

`login.php` is the way back.

## What it does and does not do

| | |
|---|---|
| **Does** | Show FOG's normal login form and sign you in with a local username and password |
| **Does** | Keep working when your identity provider is down, misconfigured, or removed |
| **Does not** | Bypass any password check, permission, role, or site scope |
| **Does not** | Let an account owned by a provider sign in with a password — that account has no local password to use |
| **Does not** | Offer the provider buttons, because on a broken provider they are what you are escaping |

It is the **same** login. Same form, same session, same CSRF protection,
same audit trail, same [[roles|roles]]. The only difference is where the
page will and will not send you.

>[!warning] It is not a way around authentication
>The name "break-glass" describes when you reach for it, not what it
>relaxes. Everything still has to be a valid FOG account with a valid
>password, and everything it can do is still governed by its roles. There
>is nothing here to protect that the login form does not already protect.

## Who can actually use it

An account can sign in here if it has a **local password**. In practice:

- **Accounts an administrator created** — yes, always. Creating an account
  in FOG sets a password, and signing into it through a provider later does
  not take that password away.
- **Accounts FOG provisioned** (created on first sign-in by
  [[oidc#Who is allowed in|Create Users On First Login]], or by
  [[ldap|LDAP]]) — **no**. They are created with a random token nobody has
  ever seen, so there is no password to type. They can only be reached
  through the directory that made them.

That distinction is the whole of your break-glass plan, and it is worth
checking rather than assuming.

You can change it. On a user's **General** tab, tick **Return To Local
Login** and press **Update**, then set a password on the Password tab that
appears. See
[[users#Returning an account to a FOG password|Returning an account to a FOG password]]
— including which providers keep working afterwards and which do not.

## Make sure at least one account can use it

FOG enforces a floor, and you will meet it as a refusal:

- You **cannot delete** the last administrator who can sign in with a local
  password, even when other administrators exist through a directory.
- You **cannot convert** that account to an external identity either.

Both are refused with *"This would leave no account able to administer FOG
without its identity provider."* To get past either, give another
administrator account a local password first.

The floor preserves; it does not require. An install that has deliberately
moved every administrator to a directory has nothing left for this to
protect, and FOG will not start refusing that install's operations to
defend a property it already gave up. **If that is your install, this page
will not help you** — so decide on purpose rather than by drift.

>[!note] Check it before you need it
>Sign out, open `login.php`, and log in with a local administrator account.
>Do it once, now, and again whenever you change how people sign in. A
>break-glass plan nobody has tested is a plan you find out about during the
>outage.

## Why it is safe to leave reachable

An obvious worry: if this page ignores the redirect, is it a way around
single sign-on?

No. Removing the redirect does not remove a *check*. The redirect is a
convenience — it saves a click for people whose credentials live at the
provider. What decides whether somebody gets in is the password and the
roles, and those are identical on both pages. Somebody with no FOG account
and no FOG password gets nothing here, exactly as they get nothing on
`index.php`.

If you need people to be *unable* to sign in with a password, that is a
different control: give those accounts an external identity, which removes
their local password. Do that per account. Do not rely on the login page
being hard to reach.

## How the guarantee is built

Worth knowing, because it explains why this page keeps working when the
thing that broke is the plugin itself.

FOG's login page offers plugins one opportunity to redirect an anonymous
visitor somewhere else. `login.php` marks the request as a local login
before FOG's login page runs, and the login page only offers that
opportunity when the mark is **absent**.

So on this URL a plugin is not asked and then overruled — **it is never
asked at all**. A plugin that is misconfigured, half-installed, throwing
errors, or in the middle of failing to reach a provider cannot take this
page down with it, because nothing on this page calls into it.

It is also not a second copy of the login form. `login.php` reuses the real
one, so it cannot drift from it and a fix to one is a fix to both.

## When FOG sends you here by itself

You will also arrive here without asking, in two situations. Both are cases
where returning to the normal login page would bounce you back out to a
provider that cannot help:

- **A sign-in was refused.** The reason is shown on this page. Returning to
  a provider that just said no would be a loop.
- **You logged out on an install that redirects to a provider, with
  [[oidc#Signing out|Single Logout]] off.** Your provider session is still
  alive, so the normal login page would sign you straight back in. You are
  signed out of FOG; you are still signed in at the provider.

With Single Logout **on**, logging out does not land you here — the
provider session is genuinely ended, so FOG returns you to the normal login
page and the provider asks for credentials.

## Related

- [[oidc|OpenID Connect Sign-in]] — the redirect setting this page exists
  to survive, and where to turn it on
- [[oidc#Break-glass|OIDC break-glass rules]] — which accounts keep a local
  password
- [[ldap|LDAP Authentication]] — the other directory FOG can provision
  accounts from
- [[users|User Management]] — where to give an administrator a local
  password
