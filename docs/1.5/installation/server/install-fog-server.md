---
title: "Install FOG Server (1.5)"
aliases:
    - "Install FOG Server (1.5)"
    - "FOG Server Installation (1.5)"
description: Instructions for installing FOG 1.5 on an existing Linux server — the stable/dev-branch choice, the installer prompts, and the manual update process
context_id: "install-fog-server-1.5"
tags:
    - install
    - fogserver
    - git
    - prerequisites
    - install-script
    - configuration
    - database
    - cli-switches
    - 1_5-legacy
---
# Install FOG server (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/installation/server/install-fog-server|1.6 version]] of this page for FOG 1.6.

Before rushing into installing FOG you want to make sure you check the [[requirements]]
The installation instructions here assume that you have a freshly installed server available that only contains the minimal set of packages.
Updating fog is essentially the same process, just instead of creating a fresh clone of the repo, you do a `git pull` and run the installer again.

## Prerequisite

The preferred method of getting FOG is via Git.

### Debian based

    sudo -i
    apt-get -y install git

### RedHat based

    sudo -i
    dnf -y install git

Now that git is installed, you should be able to clone the FOG
repository. Generally we recommend to put the repository inside of /root
but if you've done this sort of thing before, put it wherever you want.
Here's how you clone the FOG repository/code to your local machine:

    sudo -i
    cd /root
    git clone https://github.com/FOGProject/fogproject.git
    cd fogproject

![[git-clone.png]]

### Choosing a FOG version

A plain clone gets you the `stable` branch — this is the default branch, and
it's FOG's longer-term-tested line. FOG 1.5.x is also developed in
`dev-branch`, where active patches and testing happen before they make it
into a `stable` release — `dev-branch` can be well ahead of `stable`, for
example already on 1.5.10.53 while `stable` is still on an older 1.5.x point
release.

> [!warning]
> Be aware that you should **not** consider switching back to the stable branch without thorough consideration.
> This is due to the database schema changes that are introduced over time.
> For example when FOG was installed using the stable branch you can move forward to newer dev-branch versions like 1.5.10.53 with no problem.
> But if you want to switch back to the stable branch, it's possible that the schema changes will cause issues when you revert and you may need to wait until the next official stable release to revert to the stable branch version.
> Doing otherwise is at your own risk! (Though to be fair, these types of issues have been rare, this is just a disclaimer, there's also a database change that can be made to force a revert of the schema, though there's still some potential risk, we haven't seen such issues, but there's still risk)

> [!note]
> FOG also has a newer major version, 1.6, developed in the `working-1.6`
> branch. It's a bigger jump than stable → dev-branch — a restructured PKI
> layout, Secure Boot support by default, and more — and like dev-branch it's
> a one-way move: once a server's database has the 1.6 schema applied it
> cannot go back to 1.5. See [[1.6/installation/server/install-fog-server|the 1.6 install page]] if that's what you're after.

If you want the latest and greatest for 1.5.x, would like to contribute to
testing new features, or were instructed to install the dev-branch version to
troubleshoot an issue you simply need to `git checkout` the
dev-branch like so (just ignore the comment lines starting with '#'):

    #cd into where you cloned the git repo, e.g. /root/fogproject
    cd /root/fogproject
    #update all branches
    git fetch --all
    #switch to dev-branch
    git checkout dev-branch
    #if updating run make sure to pull the latest changes
    git pull

Then you can run the installer to perform an upgrade or new install as
shown in the next section.

You can switch back to the stable branch with:

    cd /root/fogproject
    git fetch --all
    git checkout stable

You can see a list of current branches here:
<https://github.com/FOGProject/fogproject/branches>

> [!tip]
> If you have issues with `git pull` saying you have pending changes, use
> `git reset --hard origin/{branchName}`
>  to undo file changes within your repo folder that sometimes occur during the install then run `git pull` again to ensure your on the latest.

### Updating an existing install

The manual steps above (`git fetch`/`git checkout`/`git pull`) always work:
pick the branch you're tracking, pull it, then re-run the installer from
`bin/`:

    cd /root/fogproject/bin
    ./installfog.sh

There is also a `bin/updatefog.sh` on 1.5 now, which does the same thing in one
command:

    cd /root/fogproject/bin
    ./updatefog.sh --channel patches

It exists mainly for one job: **moving a 1.5 server onto 1.6.**

    ./updatefog.sh --channel rc      # the current 1.6 release candidate
    ./updatefog.sh --channel beta    # the 1.6 development line

It runs the installer **interactively**, which matters here more than for an
ordinary update: the 1.6 installer asks about settings your 1.5
`.fogsettings` has never held, and running it unattended would take a default
for every one of them without telling you. Pass `-y` only if you genuinely
want that.

> [!warning]
> Going from 1.5 to 1.6 is a **major upgrade**, not a patch. The database
> schema is migrated forward and the web tree is replaced.
>
> The 1.6 installer takes a database dump before it starts, and the 1.6 tree
> carries `bin/revertfog.sh`, which uses that dump to put the server back.
> **That dump is the only supported way back** — there is no down-migration
> and there will not be one, because the migration steps are lossy by design.
> Take your own backup as well.

If your server is not a git checkout — you installed from a tarball or a copied
directory — there is no branch to move, so use the bootstrap installer instead.
It clones a checkout and runs the installer over your existing install, which
it finds through `/etc/fog/fog.conf`:

    curl -fsSL https://raw.githubusercontent.com/FOGProject/fogproject/working-1.6/bin/bootstrap.sh | sudo bash -s -- --channel rc

`sudo` goes before `bash`, not before `curl`. It is safe to run on a server
that already has FOG: the script finds the existing install through
`/etc/fog/fog.conf` and upgrades it in place rather than installing beside it.

> [!note]
> `utils/FOGUpdater/fogupdater.sh` is **retired** and no longer updates
> anything. It could not reach 1.6 at all — it resolved the version of a 1.6
> branch from a file path that only exists on 1.5, so every attempt failed on a
> missing file — and it ran the installer unattended, which is the wrong
> default for this upgrade. The script is still present, and running it now
> prints the alternatives above. If you have it in a cron entry, replace it.

### Alternatives

If you have issues or good reasons for not using Git, you can just
download the FOG installer bundle as ZIP or tar.gz archive.

-   latest stable:
    [ZIP](<https://github.com/FOGProject/fogproject/archive/stable.zip>)
    or
    [tar.gz](<https://github.com/FOGProject/fogproject/archive/stable.tar.gz>)
-   latest dev:
    [ZIP](<https://github.com/FOGProject/fogproject/archive/dev-branch.zip>)
    or
    [tar.gz](<https://github.com/FOGProject/fogproject/archive/dev-branch.tar.gz>)
-   specific version:
    [ZIP](<https://github.com/FOGProject/fogproject/archive/1.5.10.zip>)
    or
    [tar.gz](<https://github.com/FOGProject/fogproject/archive/1.5.10.tar.gz>)

Simply extract the archive and start the installer as described below.

## Run the installer

To start the installation process, follow the steps below. Running the
installer **must be done as root**.

```
  sudo -i
  cd /root/fogproject/bin
  ./installfog.sh
```

>[!tip]
>The installer also has various switches for running silently and more, see [[1.5/installation/server/command-line-options#Fog installer command line options (1.5)|Fog installer command line options (1.5)]]

Before all the components are installed, you are asked several questions
to make sure the setup suits your situation and is ready to use right
after the installer finishes:

### Installer Prompts

Prompt  | Description
--      |   --
**SELinux** | *this only applies to RedHat based installs* **FOG supports SELinux enforcing, and leaving it on is the default.** The installer labels its own directories, ships a small policy module for the ports the web tier needs, and has been tested capturing, deploying and replicating under enforcing. You are still asked, and can still choose permissive.
**Local Firewall** | **The installer configures your firewall rather than asking you to switch it off.** It opens only the ports your install actually uses, on firewalld and ufw, and prints the exact commands for raw `iptables` (which it deliberately does not modify — see below). You can still choose to disable the firewall, or to leave it alone and configure it yourself. For the port list, the manual steps for all three backends, and how to restrict FOG to one subnet, see [[firewall\|Firewall configuration for a FOG server]].
**OS Selection** | The installer tries to guess the distribution you're running. Just confirm the selection if it's correct, otherwise choose the apropriate option.
**Installation mode** | With the same installer you can install a normal FOG server (called master node) or a FOG storage node — answer `s` here to install a storage node instead of a full server. For what a storage node is and how to manage one, see [[1.5/management/web/storage-node\|Storage Node Management]]. As we're installing a full FOG server here, choose `N` here.
**Default Network interface** | The installer needs to know which network interface will be used for hosting PXE booting as well as sending images via unicast and multicast. If the installer guessed the right interface, then choose n(o) to proceed, using the pre-selected network interface. Otherwise, choose y(es) and type in the name of the network interface (like eth0, ens192).
**DHCP Service** | You have the option to run a DHCP service on the FOG server itself or, if you already have a DHCP server in your network, then you can answer n(o) to the following three questions. For more information on configuring an existing DHCP server to work with FOG, see [[1.5/installation/network-setup/dhcp-server-settings\|DHCP Server Settings]]. The questions on DHCP are in reverse order; the settings first, and finally if you really want to enable DHCP on your FOG server.
**DHCP Router address** | If you're going to run a DHCP server on this FOG server, then type y(es) and type in the router (or default gateway) address that the DHCP server will advertise. If you have an existing DHCP server on your network, choose N here.
**DHCP handle DNS** | If you're going to run a DHCP server on this FOG server, then type y(es) to advertise DNS server IPs to the clients and type in the IP address of the local DNS server. If you have an existing DHCP server on your network, choose n(o) here.
**Activate DHCP** | If you want to run a DHCP server on this FOG server, then choose y(es). Otherwise choose n(o).
**Internationalization support** | If you want the FOG web UI to provide additional languages, choose y(es) here.
**HTTPS Support** | A single question: *"Would you like to enable secure HTTPS on your FOG server?"* — the default is **no**, and the installer tells you to read <https://wiki.fogproject.org/HTTPS> before answering yes. Unlike 1.6, 1.5 has no separate controls for the web UI protocol, the netboot protocol, and whether iPXE gets rebuilt — one **yes** here turns on all three at once: the web UI moves to HTTPS, HTTP is redirected to HTTPS, and iPXE is recompiled locally with this server's CA embedded (a 10–25 minute build). It also means the **signed Secure Boot chain is skipped** for this install — FOG cannot recompile a binary that's already signed by Microsoft, so choosing HTTPS trades the pre-signed shim for a locally-built, unsigned one. See [[1.5/installation/server/command-line-options#HTTPS and the -S flag\|HTTPS and the -S flag]] for the full detail and how to reach it non-interactively.
**Hostname** | This host name is used in the FOG web UI. Review the auto-detected hostname; choose n(o) to accept the suggested hostname, or y(es) to enter the correct hostname.
**Summary** | The installer prints out all options as chosen. If you are sure everything is correct, choose y(es) to proceed installing. Choosing n(o) will terminate the installer, and you will need to restart the process, answering all the questions again.

### Installation questions

If the installer detects a mysql database server with an empty 'root'
password, you are required to enter one to be set. In case the Linux
account 'fogproject' has been used on this server, the installer will
complain and provide information and instructions on how to mitigate the
situation.

## Database setup

While most of the installation runs without intervention, there is one
step you need to do manually. The installer will prepare the database
for you and then ask you to open your web browser and visit the FOG web
UI to build the initial database schema or promote an existing database
with new schema updates. Make sure you follow this step and only proceed
with the installer (hit ENTER) after the schema update/setup has
finished, or the installer will fail.

## Final steps

If everything worked as expected, the installer end will with the
following information:

    * Setup complete

     You can now login to the FOG Management Portal using
     the information listed below.  The login information
     is only if this is the first install.

     This can be done by opening a web browser and going to:

     https://x.x.x.x/fog/management

     Default User Information
     Username: fog
     Password: password

Now your FOG Server is ready to use! Go ahead, login to the web UI and
start using FOG and have fun. A good first step is to
[[capture-an-image|capture an image]] from a model machine, then
[[deploy-an-image|deploy it]] to your other computers.

## Fog installation settings

All your choices during the installation are saved in the file
`/opt/fog/.fogsettings`.

The next time you start the installer, it will skip all questions (except for a prompt to check for schema updates in the web ui, unless you specify -Y) and continue at the 'Summary' step.

In this way you can easily re-install or update a Fog server.

For an overview of all settings in the .fogsettings file, see [[1.5/management/server/install-fogsettings|The .fogsettings file]]

## Install errors

If the installer fails or something doesn't look right, the full output of the
run is captured in `error_logs/foginstall.log`, and more detailed errors are
written to `error_logs/fog_error_<version>.log`. Both live in the directory you
ran the installer from (the `bin/` directory of the cloned repo).

When asking for help on the [FOG forums](https://forums.fogproject.org/), include
the relevant portion of those logs — it's the fastest way to get a useful answer.
