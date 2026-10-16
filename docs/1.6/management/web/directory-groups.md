---
title: Directory Groups
aliases:
    - Directory Groups
    - Directory Domains
    - Directory Groups plugin
description: Connect FOG to one or more Active Directory domains, browse their OUs, and group hosts by OU
context_id: directory-groups
tags:
    - 1_6-changes
    - management
    - web-management
    - plugins
    - active-directory
---

# Directory Groups

The **Directory Groups** plugin connects FOG to your Active Directory
domains. It keeps a list of domains, shows the OUs of each domain as a tree,
and groups hosts by OU. FOG uses the connection of a domain to move the computer
account of a host into the OU set on that host.

Directory Groups replaces the **ou** plugin. The **ou** plugin supports one
domain. Directory Groups supports many.

>[!info] FOG 1.6
>Directory Groups exists in FOG 1.6 only. For how placement works and how to
>set the AD fields on a host, see [[ad-integration|Active Directory Integration]].

## Turning it on

Directory Groups is a bundled plugin. Turn the plugin system on first. See
[[1.6/management/web/plugins|Plugins]].

1. Go to **Plugins**.
2. Tick **directorygroups** in the list.
3. Click **Install selected**. Install also activates the plugin.

Two entries appear in the main menu: **Directory Domains** and
**Directory Groups**.

## Directory Domains

A directory domain holds the connection details for one Active Directory
domain. Go to **Directory Domains → Create New Domain** to add one.

| Field | What to enter |
|---|---|
| **Domain Name** | The DNS name of the domain, for example `example.com` |
| **Description** | A note for your own use |
| **Server URI** | The directory server, for example `ldaps://dc1.example.com:636` |
| **Bind DN** | The account FOG uses to read the directory and to move computer accounts, for example `CN=fog-placement,CN=Users,DC=example,DC=com`. See [What the bind account needs](#what-the-bind-account-needs) |
| **Bind Password** | The password of the bind account |
| **CA Certificate Path** | The path on the FOG server to the CA certificate file, for example `/etc/ssl/certs/example-ca.pem` |
| **Computer Search Base** | The base DN where FOG looks for computer accounts, for example `DC=example,DC=com` |
| **OU Browse Base** | The DN where the OU tree starts. If you leave it blank, the tree starts at the domain root |

FOG never shows the **Bind Password** again after you save it. When you edit
a domain, leave the field blank to keep the stored password. The password is
not part of any export.

### What the bind account needs

The bind account does two jobs. Each job needs different rights.

| Job | When it runs | Rights it needs |
|---|---|---|
| Browse OUs | **Organizational Units** tab, **Browse Directory** button | Read access to the OUs under the **OU Browse Base** |
| Placement | Each agent check-in, when `FOG_DIRECTORY_PLACEMENT_ENABLED` is on | Read access to computer accounts under the **Computer Search Base**, and the right to move them |

Placement moves a computer account from one OU to another. A move is a
write to Active Directory. In each OU that a host can leave, delegate
**Delete Computer objects** to the bind account. In each OU that a host can
go to, delegate **Create Computer objects**. Delegate both on a parent OU to
cover all the OUs below it.

>[!warning] A read-only account can browse but cannot place
>With a read-only bind account, the OU tree and **Browse Directory** work.
>You can pick an OU and save it on the host. Placement then fails, and the
>computer account stays in its old OU. The **Directory Membership** report
>shows the error for each host, for example "Insufficient access". FOG tries
>again later, and fails the same way until the account gets the rights.

If you use FOG only to browse OUs, and `FOG_DIRECTORY_PLACEMENT_ENABLED` is
off, a read-only account is enough.

The bind account is not the domain join account. The agent joins a host with
the **Domain Username** on the host's **Active Directory** tab. That account
needs its own rights to create and rename computer accounts.

### How FOG picks the domain for a host

FOG matches the **Domain Name** of the directory domain to the DNS name in the
**Domain Name** field on the **Active Directory** tab of the host. The match
ignores case. If the host domain is not in the list, FOG finds no connection
and does not place the host.

>[!note] FOG Settings
>While Directory Groups is installed, the **FOG Settings** page hides these
>five settings: `FOG_DIRECTORY_LDAP_URI`, `FOG_DIRECTORY_BIND_DN`,
>`FOG_DIRECTORY_BIND_PASSWORD`, `FOG_DIRECTORY_CA_CERT`, and
>`FOG_DIRECTORY_BASE_DN`. Each directory domain holds these values now.
>`FOG_DIRECTORY_PLACEMENT_ENABLED` stays visible. Uninstalling the plugin
>shows the five settings again.

## Adding OUs as groups

Open a directory domain and click the **Organizational Units** tab. The tab
shows the OUs under the **OU Browse Base** as a tree.

1. Type in the search box to find an OU.
2. Tick the OUs you want.
3. Click **Add selected as groups**.

Each OU becomes a directory group. The group name is the domain name followed
by the OU path, for example `example.com/Sales/Staging`. An OU that already has
a group shows its group ID and has no tick box.

## Grouping hosts by OU

Go to **Directory Groups** to see the groups and the hosts in each group.
A host also gets a **Directory Group** tab. Use the tab to set the group of
that host.

### Browse Directory on the host page

The **Active Directory** tab of a host has a **Browse Directory** button.

1. Click **Browse Directory**.
2. Pick a domain in the list.
3. Click an OU in the table.

FOG fills **Domain Name** and **Organizational Unit** on the tab. FOG saves
nothing until you click **Update**. The button shows only to users who hold
the `directorydomain.view` permission.

## Moving from the ou plugin

When you install Directory Groups, FOG migrates your existing setup:

- FOG creates the first directory domain from the `FOG_DIRECTORY_*`
  connection settings. FOG takes the domain name from the `DC=` parts of the
  base DN.
- If the **ou** plugin is installed, FOG copies its OUs and host links into
  Directory Groups. FOG keeps the IDs. A second install run copies nothing
  twice.

The **ou** plugin stays installed. Uninstall it when you are ready.

>[!warning] Install Directory Groups before you uninstall ou
>Uninstalling **ou** drops its database tables. Install Directory Groups
>first so the migration can copy the data.

## Permissions

Directory Groups adds two permission areas. See [[roles|Roles & Permissions]].

| Area | Controls |
|---|---|
| `directorygroups` | Directory groups: **View**, **Create**, **Edit**, **Delete** |
| `directorydomain` | Directory domains and their bind accounts: **View**, **Create**, **Edit**, **Delete** |

The areas are separate. A role that groups hosts does not get access to the
bind accounts. To add OUs as groups, a role needs `directorygroups` **Create**,
`directorydomain` **View**, and `directorydomain` **Edit**.

## Uninstalling

**Uninstall selected** on the **Plugins** page drops the three tables of the
plugin. These tables hold the directory domains, the directory groups, and the
host links. The **ou** plugin is not changed. The five `FOG_DIRECTORY_*`
connection settings show again on the **FOG Settings** page.
