---
title: FOG 1.6 Differences
aliases:
    - FOG 1.6 Differences
    - 1.6 Docs
description: The pages where FOG 1.6 behaves differently from 1.5, gathered in one place
context_id: fog-1-6-differences-home
tags:
    - 1_6-changes
    - home
---

# FOG 1.6 Differences

Most of this documentation applies to **both** FOG 1.5 and 1.6 without
changes — the web UI, the imaging workflow, snapins, printers, and most of
the knowledge base work the same way on either version. This section exists
only for the places where they genuinely don't: a feature that's core in 1.6
but a separate plugin on 1.5, a config file that changed shape, an installer
flag that means something different.

If you're running 1.6 and a page you need isn't listed here, the main docs
apply to you as written — [[index|start there]].

>[!info] Which version am I on?
>Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
>web UI, or the version string printed at the top of `installfog.sh`.

## Installation

- [[1.6/installation/server/install-fog-server|Install Fog Server]]
- [[1.6/installation/server/command-line-options|Fog installer command line options]]
- [[1.6/installation/server/migrating-fog-server|Migrating FOG Server]]
- [[1.6/installation/network-setup/dhcp-server-settings|DHCP Server Settings]]
- [[1.6/installation/network-setup/proxy-dhcp|ProxyDHCP]]

## Management

- [[1.6/management/web/plugins|Plugins]]
- [[1.6/management/web/ldap|LDAP Authentication]]
- [[1.6/management/web/site-scoping|Site Scoping]]
- [[1.6/management/web/hosts|Host Management]]
- [[1.6/management/web/reports|Report Management]]
- [[1.6/management/web/storage-node|Storage Node Management]]
- [[1.6/management/web/config|Fog Configuration]]
- [[1.6/management/web/images|Image Management]]
- [[1.6/management/web/multicast|Multicast Sessions]]
- [[1.6/management/server/install-fogsettings|.fogsettings]]
- [[1.6/management/fos/using-fog-boot-menu|Using the FOG Boot Menu]]

## Knowledge Base

- [[1.6/kb/reference/ping-hosts-service|The Ping Hosts Service]]
- [[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]]
- [[1.6/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]]
- [[1.6/kb/reference/csv_import_export|CSV Import / Export]]
- [[1.6/kb/reference/referential-integrity|Referential Integrity]]
- [[1.6/kb/reference/bringing-your-own-ca|Bringing Your Own CA]]
- [[1.6/kb/reference/secure-boot-trust-stores|Secure Boot: The Two Trust Stores]]
- [[1.6/kb/reference/secure-boot-technical-details|Secure Boot Technical Details]]
- [[1.6/kb/reference/pki-glossary|PKI Glossary]]
- [[1.6/kb/how-tos/secure-boot-mok-enrollment|Secure Boot: MOK Enrollment]]
- [[1.6/kb/how-tos/secure-boot-signing|Secure Boot Signing]]
- [[1.6/kb/integrations/api|The REST API]]
- [[1.6/kb/integrations/api-expansion-and-pagination|API Expansion and Pagination]]
- [[1.6/kb/troubleshooting/database-schema-update|Database Schema Update]]
- [[1.6/kb/troubleshooting/primary-mac-address-issues|Primary MAC Address Issues]]

## Features with no 1.5 equivalent at all

A handful of pages describe things that don't exist on 1.5 in any form, so
there's no 1.5 counterpart to fork from and these stay in the unversioned
docs tree rather than moving here: [[oidc|OpenID Connect Sign-in]],
[[local-login|The Local Login Page]], [[local-esp-boot|Local ESP Boot]],
[[secure-boot-setup-mode-enrollment|Secure Boot: Setup Mode Enrollment]],
[[api-openapi-reference|OpenAPI Reference]],
[[group-shared-state|Group Shared State]],
[[storage-node-selection-hooks|Storage Node Selection Hooks]],
[[plugin-schema-migrations|Plugin Schema Migrations]], and
[[roles|Roles & Permissions]] (1.5's equivalent is the accesscontrol plugin,
covered in [[1.5/management/web/plugins|the 1.5 Plugins page]]).
