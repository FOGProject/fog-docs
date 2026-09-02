---
title: Plugins
aliases:
    - Plugins
    - Plugin Management
description: Turning the plugin system on, what the bundled plugins are, and how to install a third-party plugin
context_id: plugins
tags:
    - 1_6-changes
    - management
    - web-management
    - plugins
---

# Plugins

Plugins add functionality that some FOG sites want and others do not — LDAP
and OpenID Connect sign-in, Slack notifications, Windows product keys.
Each one is a directory of PHP that FOG discovers, activates on request, and
gives its own entry in the sidebar.

FOG ships a set of bundled plugins, and from FOG 1.6 you can also install
plugins written by other people.

>[!info] FOG 1.6
>This page describes FOG 1.6. The plugin system exists on 1.5.x too, but the
>screens and what you can do with them are different enough that 1.5 has its
>own page: [[1.5/management/web/plugins|1.5 version]]. Enabling it is the
>same on both.

## Turning the plugin system on

Plugins are off until you enable them.

1. Log in to the FOG web UI.
2. Go to **FOG Configuration → FOG Settings**.
3. Find the **Plugin System** section.
4. Tick **FOG_PLUGINSYS_ENABLED**.
5. Click **Save Changes**.

Reload the UI and a **Plugins** entry appears in the main menu, taking you to
**Plugin Management** — a single list of every plugin FOG can see. (On 1.5
this is a gear wheel leading to a three-page workflow instead — see the
[[1.5/management/web/plugins|1.5 version]] of this page.)

## The Plugin Management list

| Column | What it tells you |
|---|---|
| **Plugin Name** | The plugin's machine name, and any status badge |
| **Description** | From the plugin's own manifest |
| **Version** | The plugin's version, or an em dash if it never declared one |
| **Location** | The directory the code was found in — this is how you tell a bundled plugin from one you installed yourself |
| **Activated** | Whether its hooks, pages and menu entry are live |
| **Installed** | Whether its database tables have been set up |

Tick the plugins you want to act on and use the buttons below the list:
**Activate selected**, **Deactivate selected**, **Install selected**,
**Uninstall selected**, **Update selected**, **Forget selected**.

### Activated and Installed are two different things

This trips people up, so it is worth being explicit:

- **Install** sets up the plugin's database tables. It is safe to re-run and
  never destroys data.
- **Activate** makes the plugin's code actually run — its hooks register, its
  pages route, its menu entry appears.

A plugin normally wants both. Deactivating a plugin stops it running but leaves
its tables and its data alone, so you can turn it back on and pick up where you
were.

### Badges

- **Update available** (amber, on the plugin name) — the plugin's code contains
  database steps this server has not applied yet, typically after a FOG
  upgrade. Click it, or use **Update selected**. This is the only badge that is
  also a button.
- **Incompatible** — the plugin says it does not support this FOG version.
  Hover it for the reason. FOG refuses to activate or install it.
- **Missing** — there is a row for the plugin but its directory is gone. See
  below.

## Compatibility

From 1.6 a plugin declares the range of FOG versions it supports, and FOG
enforces it:

- **Activating or installing outside the range is refused**, with the reason in
  the error message. If you ticked several plugins and one of them is out of
  range, the whole batch is refused — a half-applied change reported as success
  is worse than a clean failure.
- **If a FOG upgrade moves the server out of a plugin's range**, the next page
  load deactivates that plugin and logs why. Its tables and its applied
  migrations are left alone, so once a compatible version of the plugin is
  available, re-activating is one click and nothing has been lost.

A plugin that declares no range is treated as compatible with everything, which
is what keeps older plugins working.

## When a plugin's code disappears

Deleting a plugin's directory does not delete its row, and that is deliberate:
absence is not reliably permanent. An unmounted volume, or a web tree caught
mid-upgrade, makes every plugin vanish at once, and a system that reacted by
dropping their rows would throw away real state over a temporary condition.

So the row stays, badged **Missing**. It cannot be activated or installed. Put
the code back and it resumes exactly where it left off, applied migrations and
all.

If the plugin is gone for good, tick it and use **Forget selected** to delete
the row. Forget only works on rows whose code really is absent — if the plugin
is still on disk, FOG tells you to uninstall it instead.

>[!warning] Forget does not drop the plugin's tables
>What to drop is described by the plugin's own code, which is exactly what is
>no longer there. Its tables stay behind, and removing them is a manual job. If
>you still have the code, **Uninstall** first and Forget afterward.

## Where plugins live

There are two directories FOG looks in, and which one a plugin sits in decides
whether it survives an upgrade:

| Directory | Holds | Survives a FOG upgrade? |
|---|---|---|
| `<webroot>/lib/plugins/` | the plugins bundled with FOG | **No** — the installer re-lays this tree |
| `/opt/fog/plugins/` | everything third-party | **Yes** |

The installer deletes and rewrites the web root on every run, so a plugin
placed in `lib/plugins/` is silently removed by your next upgrade.
`/opt/fog/plugins/` sits outside the web root precisely so that cannot happen.
**Install third-party plugins there.**

You do not need to do anything to make an external plugin's JavaScript, CSS and
images load — FOG maintains a symlink for it automatically.

### Where the bundled plugins come from

As of 1.6 the bundled plugins are no longer part of the `fogproject`
repository. They live in
[FOGProject/fog-plugins](https://github.com/FOGProject/fog-plugins), and each
FOG release pins a specific plugins release. `installfog.sh` downloads and
verifies that release during installation — there is nothing extra for you to
run.

Two consequences worth knowing:

- **The installer needs to reach GitHub** for plugins, just as it already does
  for iPXE binaries.
- **For an offline install**, unpack the matching `fog-plugins` release into
  `packages/web/lib/plugins/` before running the installer. The fetcher leaves
  a hand-placed tree alone rather than overwriting it.

## Installing a plugin from an archive

FOG 1.6 can install a third-party plugin from a `.tar.gz` through the web UI.
There is always the alternative of doing it yourself as root — `git clone` or
untar into `/opt/fog/plugins/` — which needs nothing switched on and is a
perfectly good answer.

### Switching uploads on

Two independent switches, both required:

1. **`FOG_PLUGIN_UI_INSTALL_ENABLED`** in **FOG Configuration → FOG Settings →
   Plugin System**.
2. **`sudo bin/fog-plugin-uploads.sh enable`** on the server, which makes
   `/opt/fog/plugins` writable by the web server and relabels it for SELinux.
   The same script takes `disable` and `status`.

>[!warning] Understand what you are turning on
>A plugin is PHP that FOG loads and runs as the web server user. Making its
>directory web-writable means any file-write bug anywhere in FOG becomes a way
>to put executable code on your server.
>
>That is why the second switch is a root command rather than something the
>settings page can do for itself: granting this authority is deliberately not
>something the application can grant to itself. Turn it on when you need it,
>and `disable` it again afterward if you prefer.

Uploading also needs the **`plugin.install`** permission, which is not part of
`plugin.edit`. Activating code that is already on the server and adding new
code to it are different authorities — see [[roles|Roles & Permissions]].

### Doing the upload

**Plugin Management → Upload plugin**, choose the archive, and FOG unpacks it
somewhere it cannot run from, reads the manifest, and shows you what it found
*before* anything is installed: the plugin's name, version, author, homepage,
the FOG versions and other plugins it requires, its description, how many files
it contains, and the archive's SHA-256. Compare that checksum against the one
the author published, then confirm.

FOG refuses the archive outright if:

- it is not a readable `.tar.gz`;
- it does not contain exactly one top-level directory named for the plugin;
- any path in it is absolute or contains `..`;
- there is no `<name>/config/plugin.config.php` manifest inside it;
- the manifest's name does not match the directory;
- the plugin does not support this FOG version;
- a bundled plugin already has that name;
- it is larger than 64 MB.

Uploading a plugin that is already installed is an upgrade: you are warned that
files will be replaced, and the old copy is only removed once the new one is in
place.

**Putting the files on the server does not activate the plugin.** You still
install and activate it from the list, so "the code is here" and "the code is
running" stay separate decisions.

## The bundled plugins

This is the 1.6 set. See the [[1.5/management/web/plugins|1.5 version]] of
this page for how it differs on the older line.

| Plugin | What it does |
|---|---|
| **capone** | Match a machine's DMI value against a key you define and deploy the associated image, without registering the host first |
| **helloworld** | A skeleton example plugin — the reference for people writing their own |
| **ldap** | Authenticate FOG users against an LDAP or Active Directory server. Needs your distribution's `php-ldap` package. See [[1.6/management/web/ldap\|LDAP Authentication]] |
| **location** | Point hosts at the storage node local to their site, for sites with more than one place to fetch an image from |
| **ntfy** | Notifications via ntfy.sh or your own ntfy server |
| **oidc** | Sign in to FOG with an OpenID Connect identity provider (Entra ID, Keycloak, Okta, ...). See [[oidc\|OpenID Connect Sign-in]] |
| **ou** | Predefine Active Directory OUs and associate them with hosts |
| **pushbullet** | Pushbullet notifications |
| **slack** | Slack notifications |
| **subnetgroup** | Assign hosts to groups automatically based on their IP subnet |
| **taskstateedit** | Create and edit FOG's task states |
| **tasktypeedit** | Create and edit FOG's task types |
| **windowskey** | Associate Windows product keys with images, applied to hosts on deploy. Keys stay with the host if the plugin is removed |
| **wolbroadcast** | Wake-on-LAN across separate broadcast addresses, for when you cannot configure your switches to forward it |

>[!note] Access Control is gone
>The Access Control plugin was replaced by native roles and permissions in
>1.6. For what happens to plugin-era roles on upgrade, see
>[[management/web/roles#Upgrading from the Access Control plugin|Roles & Permissions]].

>[!note] persistentgroups is gone, because the defect it worked around is fixed
>The plugin copied settings from a template host onto every machine that
>joined a group, because on 1.5 a group could not hand anything to a machine
>by itself. In 1.6 a group **grants** its snapins and printers to every
>member, including hosts added later, so there is nothing left to work around
>— and the template-host naming convention goes with it.
>
>**Upgrading removes it for you, trigger included.** The plugin installed a
>database trigger, and deleting the plugin's files never removed that: it
>would have kept copying settings onto every new group member, silently, long
>after the plugin that created it was gone. The upgrade drops the trigger and
>retires the plugin's row, and 1.6 refuses to install or activate the plugin
>again — including a copy kept in the external plugin root, which the upgrade
>does not touch. See
>[[1.6/management/web/groups#persistentgroups is retired|Group Management]].

>[!warning] If you ran persistentgroups: it copied Active Directory join passwords between hosts
>The plugin's trigger copied a fixed list of columns from a group's template
>host onto each host that joined the group, and that list included
>`hostADPass` — the AD join password. So adding a host to a group could copy
>the template's domain join credential onto it, in the database, below the web
>application, with no entry in the history log, for as long as the plugin
>existed.
>
>The credential never left your FOG server's own database and was already
>readable there to anything that could read the `hosts` table, so this is a
>notification, not a security advisory. It is here because if you rotate a
>domain join account you need to know the old one may be sitting on hosts you
>never edited by hand, and nothing in the interface would have shown you that.
>The copy happened only on "clean" adds — hosts sharing no printer or module
>setting with the template — so the affected set is not "every host in the
>group" and cannot be worked out after the fact.
>
>**What to do:** if you used the plugin and have rotated, or intend to rotate,
>an AD join account, treat every host that was ever in a
>persistentgroups-managed group as possibly carrying the template's old
>credential and reset it. **Hosts → select them → Edit selected hosts →
>Active Directory** does this across a selection in one action.

>[!note] Site is gone too, and for the same reason
>Sites and per-site host visibility moved into 1.6 core, so there is no
>longer a Site plugin to activate — the feature is simply there. See
>[[1.6/management/web/site-scoping|Site Scoping]].

>[!info] Looking for FOG 1.5's plugin screens?
>1.5's plugin system is the same idea with a different, older interface — a
>three-page activate/install/installed workflow instead of one list, no
>upload, no version/compatibility manifest, and a different bundled plugin
>set (it still has `accesscontrol` and `site`, since 1.6's roles and core
>Sites replace them). See the [[1.5/management/web/plugins|1.5 version]] of
>this page.

## Writing your own

The full guide is
[[plugin-development|Building a FOG Plugin — Start to Finish]], which walks
from an empty directory to a working, installable plugin using the bundled
`helloworld` example. Database changes have their own page:
[[plugin-schema-migrations|Plugin Schema Migrations]].
