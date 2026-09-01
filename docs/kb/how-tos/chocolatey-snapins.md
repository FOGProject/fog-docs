---
title: Install software with Chocolatey snapins
aliases:
    - Install software with Chocolatey snapins
    - Chocolatey Snapins
    - Chocolatey
description: "Use the Chocolatey snapin templates to install packages on Windows hosts, either from the public repository or from an offline package set you ship with the snapin"
context_id: chocolatey-snapins
tags:
    - how-to
    - snapins
    - 1_6-changes
---

# Install software with Chocolatey snapins

>[!info] FOG 1.6
>The two Chocolatey templates described here are new in FOG 1.6. The
>technique works on 1.5 as well — a snapin is still just a command — but you
>have to type the fields in yourself, and the placeholder-file workaround
>described under [Why you no longer need a placeholder .bat](#why-you-no-longer-need-a-placeholder-bat)
>still applies there.

[Chocolatey](https://chocolatey.org/) is a package manager for Windows. If
your hosts already have it, you can let it do the fetching and installing and
keep FOG doing what it is good at — deciding *which* machines get *what*, and
when.

FOG ships two templates for this, and they solve two different problems:

| Template | Snapin type | Where the packages come from |
|---|---|---|
| **Chocolatey (packages.config)** | Normal | Downloaded by the client, from whatever sources Chocolatey is configured with |
| **Chocolatey (offline source)** | Snapin Pack | `.nupkg` files you ship inside the snapin itself |

Pick the first when your hosts can reach a package repository. Pick the second
when they cannot, or when you need every machine to get a byte-identical
package regardless of what the repository is serving today.

## Before you start

**Chocolatey must already be installed on the host.** Neither template
installs it — they call `choco.exe`, and if it is not there the snapin fails.
Install it as part of your image, or as a separate snapin that runs the
official bootstrap script, and only then use these templates.

>[!note] Why the templates use a full path to `choco.exe`
>Both templates set **Snapin Run With** to
>`%ProgramData%\chocolatey\bin\choco.exe` rather than a bare `choco`.
>
>The FOG client runs as a Windows service. It expands environment variables
>in that field, but it inherits the `PATH` it was **started** with — and on
>any machine where Chocolatey was installed after the FOG client, that `PATH`
>predates Chocolatey's entry in it. A bare `choco` works fine when you try it
>by hand in a console and then fails as a snapin, which is a miserable thing
>to debug. The full path sidesteps it.

## Chocolatey (packages.config)

This is the everyday one. You upload a Chocolatey **packages.config** — an XML
file listing the packages you want — and the client hands it to
`choco install`.

### 1. Write the packages.config

```xml
<?xml version="1.0" encoding="utf-8"?>
<packages>
  <package id="googlechrome" />
  <package id="7zip" />
  <package id="skypeforbusiness" version="12130.20272" />
</packages>
```

Omit `version` to take whatever is current; pin it when you need every machine
on the same build.

>[!important] The file must be named with a `.config` extension
>`choco install` decides how to read its argument by looking at the name: an
>argument ending in `.config` is treated as a package list, and anything else
>is treated as the name of a single package. FOG stores your snapin under the
>filename you uploaded it with and the client writes it out under that same
>name, so the extension survives — but only if it was there to begin with.
>
>Upload `office.config`, not `office.xml` or `office.txt`. A file named
>`office.xml` produces `choco install "…\office.xml"`, and Chocolatey will go
>looking for a package literally called `office.xml`.

### 2. Create the snapin

1. **Snapin Management → Create New Snapin.**
2. Give it a name and description.
3. Leave **Snapin Type** as **Normal**.
4. Browse to your `.config` file.
5. In **Template**, choose **Chocolatey (packages.config)**.

The template fills in three fields:

| Field | Value |
|---|---|
| Snapin Run With | `%ProgramData%\chocolatey\bin\choco.exe` |
| Snapin Run With Arguments | `install` |
| Snapin Arguments | `-y -r --no-progress` |

You can edit them afterward — the template only seeds the fields, it does not
constrain them.

### 3. What the client actually runs

The client builds the command by joining those fields **around the file it
downloaded**:

```
%ProgramData%\chocolatey\bin\choco.exe install "C:\Program Files (x86)\FOG\tmp\office.config" -y -r --no-progress
```

That injected path in the middle is the piece worth understanding, because it
explains the whole shape of this template. The client always inserts the
downloaded file there, in every Normal snapin — you cannot turn it off. For
most snapins that is exactly right (it is the installer you want to run), and
for Chocolatey it works because `choco install` accepts an absolute path to a
`.config` in precisely that position.

The three flags mean:

- `-y` — answer yes to prompts, since nobody is at the keyboard.
- `-r` — machine-readable output, which keeps the snapin log terse.
- `--no-progress` — drop the download progress bar, which otherwise fills the
  log with thousands of redraw lines.

## Chocolatey (offline source)

Use this when the hosts have no route to a package repository, or when you
want the exact package bytes fixed.

Here you ship the `.nupkg` files yourself, inside a Snapin Pack. A pack is a
zip that the client unzips on the machine before running the command, and
`[FOG_SNAPIN_PATH]` is replaced with the folder it unzipped into. Chocolatey
is happy to treat a plain folder of `.nupkg` files as a `--source`.

### 1. Build the archive

Download the packages you need on a machine that *can* reach the repository:

```
choco download googlechrome --internalize --output-directory=C:\pkgs
```

Then zip the `.nupkg` files — the files themselves at the top level of the
zip, not a folder containing them.

### 2. Create the snapin

1. **Snapin Management → Create New Snapin.**
2. Set **Snapin Type** to **Snapin Pack**.
3. Browse to your zip.
4. In **Template**, choose **Chocolatey (offline source)**.

That fills in:

| Field | Value |
|---|---|
| Snapin Run With | `%ProgramData%\chocolatey\bin\choco.exe` |
| Snapin Run With Arguments | `install MyPackage --source="[FOG_SNAPIN_PATH]" -y -r --no-progress` |

**Replace `MyPackage`** with the package id you actually want — the template
cannot guess it. Name several separated by spaces to install more than one.

### 3. What the client actually runs

```
%ProgramData%\chocolatey\bin\choco.exe install googlechrome --source="C:\Program Files (x86)\FOG\tmp\ChromeOffline" -y -r --no-progress
```

No file is injected here. That is the difference between the two templates: a
pack has already been unzipped, so there is no single file to point at, and
the command is whatever you wrote. It is why this template names the package
directly and the other one cannot.

## Why there is no `choco upgrade` template

Because it would not work with the shape above. `choco upgrade` rejects a
packages.config outright:

```
A packages.config file is only used with installs.
```

Since a Normal snapin always has the downloaded file injected into the
command, and that file is the packages.config, there is no way to build a
working upgrade command from this template. If you want upgrades, use `install`
— Chocolatey will upgrade a package to the pinned or current version — or
write a snapin that calls `choco upgrade` with package names and a throwaway
uploaded file.

>[!note] Installing straight from a `.nupkg` path is deliberately not offered
>It works today but is deprecated upstream, so a template built on it would
>break on some future Chocolatey release. The offline `--source` folder above
>does the same job and is the supported route.

## Why you no longer need a placeholder .bat

A long-standing workaround for this was to write a one-line batch file whose
only job was to call `choco install`, and upload *that*, because the snapin
form insists on a file and there was nothing else to give it.

That workaround was never working around a missing feature — it was working
around the injected-file rule. FOG requires a file because the client refuses
to run a snapin with no file to verify, and it puts that file into the command
whether or not the command wants it. The packages.config template turns that
requirement into the useful part: the file you are forced to upload *is* the
list of what to install, so the batch file has nothing left to do.

If you have existing `.bat` snapins built this way, they keep working. There is
no need to convert them unless you want the package list to be something you
can read and edit on the FOG server rather than buried in a script.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Snapin fails immediately, no Chocolatey output | `choco.exe` is not at `%ProgramData%\chocolatey\bin\` — Chocolatey is not installed on that host |
| "The package … was not found" naming your own file | The uploaded file does not end in `.config`, so it was read as a package name |
| Works by hand, fails as a snapin | Usually the `PATH` problem described above — check **Snapin Run With** is the full path, not bare `choco` |
| Offline source finds nothing | The zip has a folder inside it; `[FOG_SNAPIN_PATH]` points at the unzip root, so the `.nupkg` files must be at the top level |
| Log is enormous | `--no-progress` was removed from the arguments |

Snapin exit codes come from Chocolatey, not from FOG — a non-zero result in
the snapin log is Chocolatey's own return code, and its meaning is
[documented upstream](https://docs.chocolatey.org/en-us/choco/commands/install).

## See also

- [[snapins|Snapin Management]] — creating snapins generally, and the
  Normal vs Snapin Pack distinction
- [[1.6/management/web/groups|Group Management]] — granting a snapin to every
  host in a group, including hosts added later
- [[fog-client-example-tasks|Example tasks with the FOG client]]
