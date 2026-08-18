---
title: User Management
aliases:
    - User Management
description: Details how to manage users in the ui
context_id: users
tags:
    - in-progress
    - management
    - users
    - web-ui
    - web-management
---


# User Management

## Overview

Users in fog can log into the web gui and can run password protected
tasks from the pxe menu (i.e. deploy/capture)

## Creating Accounts

All accounts are created under the **Users** section of the FOG Web UI.

-   

    To create a new account click on the "New User" button on the left hand side of the page.

    :   -   

            All accounts must have a unique username, and a password.

            :   -   You can also give API access or a friendly display
                    name

-   After filling in the required information click on the "Create
    User" button.

## Modifying users

FOG accounts can be modified from within the users section.

-   First you must locate the account you wish to modify by clicking on
    the "List all Users" button on the left hand side of the page.

-   When a user is located, click on the username to get to the edit
    page

-   

    Make Changes to the General (name), password, or api settings.

    :   -   Hit **Update** to save changes
        -   Use the tabbed navigation to find the general, password, and
            api settings

## Accounts that sign in through a directory

An account created by — or handed to — an identity provider does not have
a **Password** tab. FOG refuses a local password for those accounts by
design, so a password typed there could only ever be one that nothing
would accept, and being told *"User updated!"* about it is worse than not
being offered the box.

Instead, the **General** tab shows a read-only **Signs In With** field
naming the source, so you can tell at a glance which accounts these are.

### Returning an account to a FOG password

On that same tab, tick **Return To Local Login** and press **Update**. The
Password tab appears on the next page load, and you can set a password.

>[!warning] Set the password straight afterwards
>Whether the account can still sign in through its provider once you do
>this depends on the provider:
>
>- **[[ldap|LDAP]]** sign-in **stops working**. FOG only accepts LDAP's
>  word for an account that carries the source stamp — that restriction is
>  what stops a plugin authenticating a local account — so removing the
>  stamp removes the LDAP login too.
>- **[[oidc|OpenID Connect]]** sign-in is **unaffected**. It never goes
>  through FOG's password check at all.
>
>Either way, an account with no auth source and no password set cannot
>sign in with a password. Do both steps in one sitting.

There is no way to go the other direction from this page. Handing an
account *to* a directory takes its local password away, which is how an
install locks itself out, and that is not something a general-details form
should do as a side effect. See [[local-login|The Local Login Page]].

## Restricting what a user can do

Starting with FOG 1.6, each user account has a **Roles** tab where you
can assign one or more roles to limit what the account can see and do.
A user with no role has no access at all, so every account needs at
least one. See [Roles & Permissions](roles.md) for details.
