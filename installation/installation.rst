Installation of FOG
===================

Requirements
^^^^^^^^^^^^

Before diving right into the installation of FOG you need to decide which server OS you are going to use. FOG is made to install on RedHat based distro CentOS, Fedora, RHEL amongst others as well as Debian, Ubuntu and Arch Linux.

Choose whichever you like most and have knowledge about! FOG is known to work with any of the above noted systems. Many installation manuals are available.

This listing is for informational purposes only, as the required components will be automatically downloaded and installed by the FOG installation script: 

- PHP 5/7
- MySql 5+/MariaDB 10+,
- Apache 2+,
- DHCP (pretty much any!)
- TFTP
- FTP
- NFS

The LAMP setup can also be easily adjusted for a "WAMP (Windows Apache MySQL PHP) system" though will require a bit more knowledge of what packages to use and how to integrate with the FOG system.

Please choose the distribution you have the most knowledge about. This list is by no means an absolute list to follow, though.

- Ubuntu 16 or higher
- Debian 8 or higher
- CentOS 7 or higher
- Red Hat 6 or higher
- Fedora 22 or higher
- Any version of Arch.


Install FOG server
^^^^^^^^^^^^^^^^^^

The installation instructions here assume that you have a freshly installed server available that only contains the minimal set of packages.

Install Git
-----------

The preferred method of getting FOG is via Git.

**Debian or Ubuntu**
::

  sudo -i
  apt-get -y install git

**CentOS 7 or RHEL 7**
::

  sudo -i
  yum -y install git

**CentOS 8 or RHEL 8**
::

  sudo -i
  dnf -y install git

Getting FOG
-----------

Now that git is installed, you should be able to clone the FOG repository.

Generally we recommend to put the repository inside of /root but if you've done this sort of thing before, put it wherever you want. Here's how we clone FOG:

::

  sudo -i
  cd /root
  git clone https://github.com/FOGProject/fogproject.git
  cd fogproject

Run the installer
-----------------
To start the installation process, you would follow the below steps. Running the installer must be done as root.

::

  sudo -i
  cd /root/fogproject/bin
  ./installfog.sh

**SELinux**

If SELinux is enabled on your system, then the installer asks you to disable SELinux.

The current version of FOG will give problems when SELinux is enabled.

**Local firewall**

If a local firewall (iptables or firewalld) is enabled, then the installer asks you to disable it. You can leave it enabled, but then you need to know how do manage the firewall and let all services pass. Best is to disable the firewall.

**Installer version**

The installer tries to guess the distribution you're running. Choose the apropriate option

**Installation mode**

With the same installer you can install a normal Fog server or a Fog Storage node. For the explanation of a storage node and how to install a storage node see *todo: install storage node*.

As we're install a Fog Server here, choose N

**Default Network interface**

The installer needs to know which netork interface will be used for the network connection. If the installer guessed the right interface, then choose N

Otherwise, choose y and type in the name of the network interface (like eth0, ens192)

**DHCP Server**

You have the option to run a DHCP server on the FOG server. If you alreaady have a DHCP server in your network, then you can answer N to the following questions. For more information on configuring an existing DHCP server to work with FOG, see *todo: DHCP server*

**DHCP Router address**

If you're going to run a DHCP server on this Fog server, then type Y and type in the router (or default gateway) address that the DHCP server will advertise.

If you already have an existing DHCP server in your network, choose N here.

**DHCP handle DNS**

If you're going to run a DHCP server on this Fog server, then type Y if you want the DHCP server to advertise DNS servers. Additionally type in the IP address of the DNS server.

If you already have an existing DHCP server in your network, choose N here.

**Run DHCP server**

If you're going to run a DHCP server on this Fog server, then type y. Otherwise type N.

**Internationalization support**

If you want the Fog Web UI to provide additional languages, choose Y here

**HTTPS Support**

Even without HTTPS support, the clients and the FOG server use a secured channel to communicate. Setting up HTTPS support requires some extra steps to be taken.

For a standard server install say N here.

**Hostname**

Check and correct the host name. This host name is used for configuring the Fog Web UI. Choose N to accept the suggested host name, otherwise, choose Y and enter the correct host name

**Recap**

The installer shows all options. If you are sure all is correct, choose Y. If you choose N, the installer will stop and you have to restart the installation process.

**Installation**

The installer install the necessary packages and configure services.

If the installer detects a mysql database server without a 'root' password, you are required to enter one.

At the end the installer will display the URL to the FOG Web UI.

Open a browser and paste the URL. You will be prompted to install the database.

when the database is installed, you will be redirected to the Fog Web UI Login page.

Then get back to the installer and press ENTER.

The last parts of the installation will then run.

All tasks should end without errors.

Now your FOG Server is ready to use!

Fog installation settings
^^^^^^^^^^^^^^^^^^^^^^^^^

All your choices during the installation are saved in the file /opt/fog/.fogsettings.

Then next time you start the installer, it will skip all questions and continue at the 'Recap'.

In this way you can easily re-install or update a Fog server.

For an overview of all settings in the .fogsettings file, see :ref:`fogsettings_file` 
