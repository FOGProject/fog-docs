Related Article: [Upgrade_to_trunk](Upgrade_to_trunk "wikilink")

# Read First {#read_first}

-   If you have a multi-node setup, they all need to be on the same
    version of FOG. Start by updating the master/web server, then update
    all your nodes.
-   If updating a VM, snapshot/checkpoint it first.
-   If updating, backup your database first via:
    `<font color="red">`{=html}Web GUI -\> FOG Configuration -\>
    Configuration Save -\> Export Database -\> Export`</font>`{=html}

# FOG has branches {#fog_has_branches}

What\'s a branch? In development terms, a branch is different states of
the code. The developers of FOG keep the latest stable version in the
`<font color="red">`{=html}master`</font>`{=html} branch. Release
candidates are kept in
`<font color="red">`{=html}dev-branch`</font>`{=html} and often you will
be asked to try this branch to overcome some problem. The latest changes
to FOG are kept in the
`<font color="red">`{=html}working`</font>`{=html} branch. These latest
changes may have broken something but generally the working branch is
workable.

# Installing GIT {#installing_git}

The preferred method of getting FOG is via GIT. [Read about git
here.](https://en.wikipedia.org/wiki/Git) First you\'ll need to install
git onto your chosen Linux server. There\'s a couple ways to do this
below.

## Install GIT on Debian or Ubuntu {#install_git_on_debian_or_ubuntu}

    sudo -i
    apt-get -y install git

## Install GIT on CentOS 7 or RHEL 7 {#install_git_on_centos_7_or_rhel_7}

    sudo -i
    yum -y install git

## Install GIT on CentOS 8, RHEL 8, or Fedora {#install_git_on_centos_8_rhel_8_or_fedora}

    sudo -i
    dnf -y install git

# Getting FOG {#getting_fog}

Now that GIT is installed, you should be able to clone the FOG
repository. Generally we recommend to put the repository inside of
`<font color="red">`{=html}/root`</font>`{=html} but if you\'ve done
this sort of thing before, put it wherever you want. Here\'s how we
clone FOG:

    sudo -i
    cd /root
    git clone https://github.com/FOGProject/fogproject.git
    cd fogproject

# Using the desired FOG branch {#using_the_desired_fog_branch}

If you want to use the master branch (latest stable release), skip to
[Getting_FOG#Running_the_installer](Getting_FOG#Running_the_installer "wikilink").

If you\'d like to use the dev-branch, use this command:

    git checkout dev-branch

If you would like to use the working branch, use this command:

    git checkout working

To go back to master at a later date, always update your repository via
the `<font color="red">`{=html}git pull`</font>`{=html} command like
this:

    sudo -i
    cd /root/fogproject
    git pull
    git checkout master
    git pull

# Running the installer {#running_the_installer}

To start the installation process, you would follow the below steps.
Running the installer must be done as root.

    sudo -i
    cd /root/fogproject/bin
    ./installfog.sh

# Installation arguments {#installation_arguments}

The FOG installer has installation arguments available. You can get them
all by using this command with the installer:

    ./installfog.sh --help

If you wanted the installer to \'just go\' and use all defaults, use
this command:

    ./installfog.sh -y

If you want the installer to follow a configuration with the -y
argument, just create a .fogsettings file ahead of time and put it here:
`<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} You can
copy another server\'s file but will need to update the IP settings.
Here\'s a writeup on the fogsettings file:
[.fogsettings](.fogsettings "wikilink")
