---
title: Active Directory Settings
description: Instructions for the installation of the fog server on an existing linux server
aliases:
 - Active Directory Settings
 - FOG Server Installation
tags:
    - install
    - fogserver
    - git
    - prerequisites
    - install-script
    - configuration
    - database
    - cli-switches
    - in-progress
    - convert-Wiki2MD
    - how-to
---

# Active Directory Settings

## Overview

FOG can automatically join computers to an Active Directory domain.

## Requirements

-   FOG client application installed on hosts (usually as part of the
    image)
-   FOG server configured to join computer computers to the domain
-   FOG HostNameChanger module active on server, client, and in host
    configuration
-   FOG 0.31 and earlier may require netdom.exe on hosts

## Where to Configure

### Turn on HostNameChanger module 

This module determines if a host will join the domain. It must be
enabled in several locations for it to work properly.

-   When installing or reconfiguring the FOG client application on the
    host, this module must be made active for the computer to auto-join
    the domain.
-   On the host record in the fog WebUI, Active Directory menu option
    must be checked to enable \"Join domain after image task\".
-   In the server webUI, FOG configuration menu option, HostNameChanger
    menu option on the left, service must be enabled.

### FOG Defaults 

Set the default domain, username, password, and organization unit (OU)
for joining computer accounts to the domain. See
[#Syntax](#Syntax "wikilink") details about the values for each field.

-   Web UI: Other Information -\> FOG Settings

### Groups

Set the domain, username, password, and organization unit (OU) for
joining hosts to the domain for all hosts currently in this group. See
[#Syntax](#Syntax "wikilink") details about the values for each field.

-   Web UI: Group Management
-   Search for Group name or click \"List Groups\"
-   Click on the name of the group in the list
-   Active Directory option in the menu on the left

**Note:** This is a applied in a batch for each host in the group when
saved. These settings are not stored in the group settings permanently,
nor applied to future hosts automatically when added to the group.

### Individual Hosts {#individual_hosts}

Set the domain, username, password, and organization unit (OU) for
joining the host to the domain. See [#Syntax](#Syntax "wikilink")
details about the values for each field.

-   Web UI: Host Management
-   Search for host name or click \"List All Hosts\"
-   Select the host computer
-   Active Directory option in the menu on the left

## Syntax

### Join Domain after image task {#join_domain_after_image_task}

Ticking this checkbox in FOG 1.3.0+ will cause the Active Directory
global defaults to populate the below text boxes if the below text boxes
are blank. This checkbox will also cause hosts to attempt to join the
domain immediately after imaging and renaming.

### Domain Name {#domain_name}

The fully qualified domain name.

Examples:

-   company
-   company.ad
-   company.com
-   company.local

### Organizational Unit {#organizational_unit}

The organizational unit, in LDAP format.

Examples:

-   OU=PCs,DC=company,DC=com
-   OU=Lab Computers,OU=PCs,DC=company,DC=com
-   \[Blank\] Leaving this blank will join the default OU for new PCs,
    usually \"Computers\". Comment FOG 1.5.7: when leaving this field
    blank, I was getting \"HostnameChanger The parameter is incorrect,
    code = 87\" in the log. Entering the following seemed to resolve the
    problem
    \"OU=Computers,DC=MYCOMPANYSUBDOMAIN,DC=MYCOMPANYDOMAIN,DC=COM\" for
    me. The computer immediately joined the domain and rebooted.

### Domain Username {#domain_username}

The user in your domain you wish to use to add the computers to Active
Directory.

\[domain\]\\\[account\]

In Fog versions 1.0+ you do not need to specify the domain in the
username field, it adds it automatically. you only need to have
\[account\]

Example:

-   company\\FOGServiceAccount

For Fog 1.0+ **Caveat is that do NOT Add the domain or it will not
work.**

-   FOGServiceAccount

**Note: Domain does not need to be fully qualified for Domain Username**

### Domain Password {#domain_password}

For FOG 1.3.0+ The password should be typed plain-text, and will
auto-encrypt on it\'s own when saved.

For the Legacy client (not recommended), the domain password must be
encrypted using [FOGCrypt](FOGCrypt "wikilink").

### Reboot host on hostname changes and AD changes even if users are logged in? {#reboot_host_on_hostname_changes_and_ad_changes_even_if_users_are_logged_in}

This setting will configure the client to enforce the hostname / AD
setting regardless of if a user is logged in. So if enabled, the client
will restart the computer to update the hostname even when a user is
logged in. If disabled, the client will wait until no one is using the
computer before restarting to apply the hostname / AD.

## Testing with Netdom to troubleshoot

Windows Command Line(cmd)

**FOGPassword is NOT encrypted for the command line test.**

### Join Domain

netdom JOIN mypcHostname /Domain:SyperiorSoft /OU:FOGou /UserD:FOGUser
/passwordd:FOGPassword /reboot:35

### Remove from Domain

netdom REMOVE mypcHostname /domain:SyperiorSoft /UserD:FOGUser
/passwordd:FOGPassword

[category:Windows](category:Windows "wikilink") [category:Active
Directory](category:Active_Directory "wikilink")
