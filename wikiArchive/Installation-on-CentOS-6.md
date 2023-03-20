**USE AT YOUR OWN RISK: We are not responsible for any damage to
yourself, hardware, or co-workers. Use at your own risk. This is a set
up that was proven to work in at LEAST 3 test environments. Any misuse
or replication of this walk through in any other form is STRICTLY
PROHIBITED.**

## Setup and Installation {#setup_and_installation}

This is a quick guide to perform a full installation. This is not fully
inclusive, but should help all out as possible.

1.  Insert your CentOs 6.4 installation disc and reboot the computer.
    You will be presented with a few options, install CentOS. Select the
    Install or upgrade an existing system Option when it is presented to
    you at the Welcome screen.
2.  Proceed with a normal install of CentOS, it is a good idea to test
    your installation media but you may skip this step if you like.
    After the CentOS logo appears, click Next.
3.  Select a language that is easy to understand, click next. Choose a
    corresponding keyboard layout, click next.
4.  Choose the type of installation, Basic Storage Devices will suffice.
    Click Next.
5.  Set the host name of the computer, and set the static ip of the
    machine if you would like to.
    1.  Click Configure Network
    2.  Select Wired and click Options.
    3.  Select the IPV4 Settings tab.
    4.  Change the method from Automatic to Manual. Then Add, and supply
        the server with a proper IP address and information.
    5.  Check the automatic connection box.
    6.  Click Save.
    7.  Click Next.
6.  Set your time zone, Click Next.
7.  Set a root password, click Next.
8.  Disk partitioning, it would be a good idea to use the entire disk
    for the new linux OS, you may change the option if you have a
    previous OS and want to keep it. Click Next.
9.  Finally choose the type of Installation to be performed.
10. Click Next and CentOS will install, after installation remove the
    installation media and reboot.

## After Login {#after_login}

There are a few preliminary steps to be aware of in CentOS. We need to
update the system and disable selinux and iptables. If you need iptables
or selinux, look in the forums for assistance.

1.  Get to a terminal or console and sign in as root.
2.  In the terminal type:

```{=html}
<!-- -->
```
    sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/sysconfig/selinux
    sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config
    service iptables stop
    chkconfig iptables off
    yum -y update && reboot

These steps will first disable selinux. Then will stop the firewall, and
disable it from starting on boot. Then it will update and reboot the
system.

Now on to repository additions.

## Repositories

Once CentOS is installed, to install FOG you need a couple of third part
repositories. RPMForge will be needed for htmldoc, and it wouldn\'t hurt
to include the ELREPO and and EPEL repositories. For compatibilities
sake, we\'re going to install the remi repository as well to ensure php
gets installed at the latest version.

### 32 Bit System {#bit_system}

1.  Get to a terminal or console and sign in as root.
2.  In the terminal type:

```{=html}
<!-- -->
```
    rpm --import http://dl.fedoraproject.org/pub/epel/RPM-GPG-KEY-EPEL-6
    rpm -Uvh http://dl.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
    rpm --import http://apt.sw.be/RPM-GPG-KEY.dag.txt
    rpm -Uvh http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.3-1.el6.rf.i686.rpm
    rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
    rpm -Uvh http://www.elrepo.org/elrepo-release-6-5.el6.elrepo.noarch.rpm
    rpm --import http://rpms.famillecollet.com/RPM-GPG-KEY-remi
    rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm

### 64 Bit System {#bit_system_1}

1.  Get to a terminal or console and sign in as root.
2.  In the terminal type:

```{=html}
<!-- -->
```
    rpm --import http://dl.fedoraproject.org/pub/epel/RPM-GPG-KEY-EPEL-6
    rpm -Uvh http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
    rpm --import http://apt.sw.be/RPM-GPG-KEY.dag.txt
    rpm -Uvh http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm
    rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
    rpm -Uvh http://www.elrepo.org/elrepo-release-6-5.el6.elrepo.noarch.rpm
    rpm --import http://rpms.famillecollet.com/RPM-GPG-KEY-remi
    rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm

-   Now perform installation of some needed packages.

```{=html}
<!-- -->
```
    yum -y install htmldoc ttf2pt1 t1utils fltk subversion wget

You should now be ready for FOG installation. Though many of the things
will be automatically installed, we just helped the system ensure
they\'re available when you actually perform the install script.

## FOG Installation {#fog_installation}

Your system should now be prepared to install fog.

### Download FOG {#download_fog}

1.  Get to a terminal or console and sign in as root.
2.  In the terminal type:
    -   You will find the latest \"Stable\" release of FOG here
        **[sourceforge](http://sourceforge.net/projects/freeghost/files/latest/download?source=files)**
    -   You can also update to the latest \"Beta\". Please see
        [Upgrade_to_trunk](Upgrade_to_trunk "wikilink")

**FOR EXAMPLE:**

    cd ~
    svn co https://svn.code.sf.net/p/freeghost/code/tags/0.32 fog_0.32
    cd fog_0.32/bin

### Install FOG {#install_fog}

    ./installfog.sh

#### Options

-   It will go through the installation process now.
    -   Type 1 and press Enter for Fedora/CentOS installation.
    -   Type N and press Enter for Normal installation.
    -   Supply IP Address, it **should** be the static IP address we
        setup earlier.
    -   Type Y and press Enter to setup DHCP Server address.
    -   Enter the DHCP Server address. If it\'s going to be the FOG
        Server, set it to the same IP Address as the FOG Server.
    -   Type Y and press Enter to set up DNS.
    -   Enter the DNS Server address.
    -   Type N and press Enter to leave the default network interface.
    -   Type N and press Enter to disable the FOG Server to act as the
        DHCP Server. Type Y to enable it.
    -   Type N and press Enter to not install additional languages,
        unless you want them.
    -   Type Y and press Enter to actually begin the installation.
    -   The system will begin the installation process. Once complete,
        it\'ll ask if you want to notify FOG with the information. Make
        your choice and press enter.

You should have, now, successfully installed FOG on CentOS 6.4
