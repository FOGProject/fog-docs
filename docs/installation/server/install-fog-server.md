---
title: Install FOG Server
description: Instructions for the installation of the fog server on an existing linux server
context_id: install-fog-server
aliases:
    - Install FOG Server
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
---
# Install FOG server

Before rushing into installing FOG you want to make sure you check the [[requirements]] 
The installation instructions here assume that you have a freshly installed server available that only contains the minimal set of packages.

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

FOG has different versions available at any given time that are
developed within branches of our git repository. The dev-branch 'dev'
version is typically a stable option since much testing still occurs
before changes are committed, but not as much testing as is done for the
longer-term "stable" version in the stable branch.

> [!warning]
> Be aware that you should **not** consider switching back to the stable branch without thorough consideration.
> This is due to the database schema changes that are introduced over time.
> For example when FOG was installed using the stable branch you can move forward to newer dev-branch versions like 1.5.10.53 with no problem.
> But if you want to switch back to the stable branch, it's possible that the schema changes will cause issues when you revert and you may need to wait until the next official release, i.e. 1.6.0, to revert to the stable branch version.
> Doing otherwise is at your own risk! (Though to be fair, these types of issues have been rare, this is just a disclaimer, there's also a database change that can be made to force a revert of the schema, though there's still some potential risk, we haven't seen such issues, but there's still risk)

> [!note]
> If you choose to upgrade to the working-1.6 branch to test out the beta (THANK YOU by the way! We hope you love it!), see [[tags#1_6-changes]] for pages related to config changes that may be required in some instances. We are striving to catch everything in the installer universally, but as we find gotchas, even if they get fixed, we're trying to notate those for all.

If you want the latest and greatest, would like to contribute to testing
new features, or were instructed to install the dev-branch version to
troubleshoot an issue you simply need to `git checkout` the
dev-branch like so (just ignore the comment lines starting with '#'):

    #cd into where you cloned the git repo, e.g. /root/fogproject
    cd /root/fogproject
    #update all branches
    git fetch --all
    #switch to dev-branch
    git checkout dev-branch

Then you can run the installer to perform an upgrade or new install as
shown in the next section.

You can switch back to the master/stable branch with:

    cd /root/fogproject
    git fetch --all
    git checkout stable

You can see a list of current branches here:
<https://github.com/FOGProject/fogproject/branches>

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
>The installer also has various switches for running silently and more, see  [[command-line-options#Fog installer command line options|Fog installer command line options]]

Before all the components are installed, you are asked several questions
to make sure the setup suits your situation and is ready to use right
after the installer finishes:

### Installer Prompts

Prompt  | Description
--      |   --
**SELinux** | *this only applies to RedHat based installs* If SELinux is enabled on your system, then the installer asks you to disable SELinux. The current version of FOG will give problems when SELinux is enabled. Everyone is encouraged to come up with a properly tested SELinux policy we can add to the project and apply for everyone.
**Local Firewall** | If a local firewall (iptables or firewalld) is enabled, then the installer asks you to disable it. You can leave it  enabled, but then you need to know how to manage the firewall and let all services pass. Currently, the best practice is to disable the firewall if you don't know how to set up rules yourself. As with SELinux, everyone is encouraged to develop a proper set of firewall rules.
**OS Selection** | The installer tries to guess the distribution you're running. Just confirm the selection if it's correct, otherwise choose the apropriate option.
**Installation mode** | With the same installer you can install a normal FOG server (called master node) or a FOG storage node. For the explanation of a storage node and how to install a storage node see *todo: install storage node*. As we're installing a FOG server here, choose N here.
**Default Network interface** | The installer needs to know which network interface will be used for hosting PXE booting as well as sending images via unicast and multicast. If the installer guessed the right interface, then choose n(o) to proceed, using the pre-selected network interface. Otherwise, choose y(es) and type in the name of the network interface (like eth0, ens192).
**DHCP Service** | You have the option to run a DHCP service on the FOG server itself or, if you already have a DHCP server in your network, then you can answer n(o) to the following three questions. For more information on configuring an existing DHCP server to work with FOG, see [[dhcp-server-settings|DHCP Server Settings]]. The questions on DHCP are in reverse order; the settings first, and finally if you really want to enable DHCP on your FOG server. This order might be changed in future versions of the installer.
**DHCP Router address** | If you're going to run a DHCP server on this FOG server, then type y(es) and type in the router (or default gateway) address that the DHCP server will advertise. If you have an existing DHCP server on your network, choose N here. (This question is irrelevant if you choose to use or set up your own DHCP server and will be hidden in future versions when DHCP is de-selected.)
**DHCP handle DNS** | If you're going to run a DHCP server on this FOG server, then type y(es) to advertise DNS server IPs to the clients and type in the IP address of the local DNS server. If you have an existing DHCP server on your network, choose n(o) here. (This question is also irrelevant if you choose to use or set up your own DHCP server and will be hidden in future versions when DHCP is de-selected.)
**Activate DHCP** | If you want to run a DHCP server on this FOG server, then choose y(es). Otherwise choose n(o).
**Internationalization support** | If you want the FOG web UI to provide additional languages, choose y(es) here.
**HTTPS Support** | You can choose to set up FOG with encrypted communication. With FOG providing several different services (e.g. web UI for configuration, web API, PXE booting, client management using the [[network-and-firewall-requirements#FOG Client to FOG Server communications]] ) choosing HTTPS support has consequences: 1. A self-signed certificate is being generated for you. 2. The Apache webserver is also set up to host the web UI through HTTPS. 3. iPXE on-the-fly compilation happens to include that certificate into the PXE binaries provided by your new FOG server Usually this works out of the box and doesn't take manual intervention. But if you are unsure, you might still choose n(o) to reduce the risk of issues. Even without HTTPS support, the communication between fog-client and the FOG server uses a secured encrypted channel.
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
start using FOG (*todo: link to docs with first steps*) and have fun.


## Fog installation settings

All your choices during the installation are saved in the file
`/opt/fog/.fogsettings`.

The next time you start the installer, it will skip all questions (except for a prompt to check for schema updates in the web ui, unless you specify -Y) and continue at the 'Summary' step.

In this way you can easily re-install or update a Fog server.

For an overview of all settings in the .fogsettings file, see [[install-fogsettings|The .fogsettings file]]

## Install errors

Whenever the installer *TBD*\...
