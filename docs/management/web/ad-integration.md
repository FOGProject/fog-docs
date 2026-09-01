---
title: Active Directory Integration
description: Overview of the Active Directory settings management
context_id: ad-integration
aliases:
    - Active Directory Integration
    - kb/how-tos/active-directory-fog-setting
tags:
    - management
    - active-directory
    - ou
    - microsoft
---
# Active Directory Integration
FOG has the ability to register a host with Active Directory, in a
limited sense.

## Requirements

In order for Active Directory integration to function, you need the
following:

-   The image will need to have the FOG service installed.
-   The FOG client's **HostNameChanger** module must be enabled — during
    install or reconfiguration of the FOG client on the host, make sure
    this module is set active or the host will never attempt to join the
    domain, regardless of what's configured below.
-   Before capturing your image, the computer is NOT a member of any
    domain
-   In order to add a computer to a domain, FOG requires a username and
    password of an account that has rights to the OU where the computer
    objects are stored in the domain tree. This user account should have
    rights to join computers to the Domain, as well as sufficient rights
    to create/manage computer objects.

>[!note]
>FOG attempts to keep your password secure by encrypting it, but since
>FOG is open source, it is possible for someone to decrypt your password
>if you don't change the FOG "Passkey." It is highly recommended that
>you change this Passkey before implementing the AD integration in a
>production environment. Changing the Passkey requires you to recompile
>the FOG Service's Hostname change module, but don't panic this isn't
>hard and only need to be done one time. Please see the documentation below.
   

## Configuring at different levels

The same set of fields (domain, username, password, OU) below can be set at
three different levels, applied in order of most to least specific:

-   **Global defaults** — Web UI: FOG Configuration → HostNameChanger. Sets
    the domain-wide default used to populate the fields below when a host
    or group doesn't override them.
-   **Group** — Web UI: Group Management → select a group → Active
    Directory. Applies the settings in a batch to every host currently in
    the group when saved. This is a one-time batch apply — it is **not**
    stored on the group permanently, and isn't applied automatically to
    hosts added to the group later.
-   **Individual host** — Web UI: Host Management → select a host →
    Active Directory. See below for the field-by-field walkthrough.

>[!warning] FOG 1.6: use the Hosts list, not the group page
>The group-level batch apply above is **deprecated in FOG 1.6** and is
>removed in a later release. It still works and still behaves exactly as
>described — one-time, to current members only — but the supported way to set
>AD across many hosts is now **Hosts → tick the hosts → Edit selected
>hosts**, where each field carries an explicit *No change* / *Set on all* /
>*Clear on all*. That works on any selection, not only on a group, and can be
>repeated whenever you like.
>
>Nothing changes on FOG 1.5, where the group page is the only way to do this.
>See [[1.6/management/web/groups#Settings that are no longer on the group page|Group Management]].

To set up a single host to use AD:

-   Navigate to the hosts section of the FOG management portal and
    select the host you want to join AD
-   In the top menu, select 'Active Directory' section.

You get the following options:

-   **Join Domain after deploy**

    When this checkbox is set, FOG will apply the Active Directory
    global default to populate the fields of this section.

-   **Domain name**

    The fully qualified domain name. Examples are:

    -   company
    -   company.ad
    -   company.com
    -   company.local

-   **Organizational Unit**

    The Organizational Unit, in LDAP format, where the computer object
    shall be created. Examples are:

    -   OU=PCs,DC=company,DC=com
    -   OU=Lab Computers,OU=PCs,DC=company,DC=com

    If you leave this fiels blank, the computer object will be created
    in the default OU for new PC's, normally 'Computers'.

    > [!note]
    > Some users have reported a blank OU field producing
    > `HostnameChanger The parameter is incorrect, code = 87` in the
    > client log. If you hit this, try setting an explicit OU (e.g.
    > `OU=Computers,DC=yourdomain,DC=com`) instead of leaving it blank.

-   **Domain Username**

    The user name that will create the computer object. This user needs
    to have sufficient credentials to create the computer object in the
    OU. Usually this will be an account that is member of the 'Domain
    Administrators' group.

    Only enter the username in this field, for example:
    FOGServiceAccount. Do not add the domain name.

-   **Domain Password**

    The password of the user name above. The password should be typed
    plain-text, and will auto-encrypt on it's own when saved.

-   **Name Change/AD Join Forced Reboot?**

    Setting this check box will configure the client to enforce the
    hostname / AD setting regardless of if a user is logged in.

    So if enabled, the client will restart the computer to update the
    hostname even when a user is logged in. If unchecked, the client
    will wait until no one is using the computer before restarting to
    apply the hostname / AD.

-   **Update**

    After changing fields of this section, click on 'Update'.

    The 'Hostname Changer', a module of the FOG client, checks with
    each poll if the client machine is part of Active Directory as
    configured. If not, it will do either of the following tasks:

    -   If users are logged in and the 'Name Change/AD Join Forced
        Reboot' box is selected, then the client will join the domain
        and reboot immediately
    -   If no users are logged, then the client will join the domain and
        reboot.

## Troubleshooting with netdom

If a host won't join the domain, you can test the same domain
join/removal directly from a Windows command line, bypassing FOG
entirely, to narrow down whether the problem is FOG's configuration or
the domain credentials/permissions themselves. The password is **not**
encrypted for this command-line test — run it, don't paste it into
scripts or share the output.

Join a domain:

```
netdom JOIN mypcHostname /Domain:yourdomain /OU:yourOU /UserD:FOGUser /PasswordD:FOGPassword /reboot:35
```

Remove from a domain:

```
netdom REMOVE mypcHostname /domain:yourdomain /UserD:FOGUser /PasswordD:FOGPassword
```

If these succeed but FOG's own AD join still fails, the issue is more likely
in FOG's configuration (HostNameChanger module not active, wrong OU syntax,
stale encrypted password) than in the domain account's permissions.
