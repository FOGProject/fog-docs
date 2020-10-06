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

The preferred method of getting FOG is via Git.

Install Git on Debian or Ubuntu
-------------------------------
::

  sudo -i
  apt-get -y install git

Install git on CentOS 7 or RHEL 7
---------------------------------
::

  sudo -i
  yum -y install git

Install git on CentOS 8 or RHEL 8
---------------------------------
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

Installation Modes
------------------

FOG can be installed in two different modes:

First is the normal FOG server which does all of the work. Choose this option if you only want have a single FOG server in your network.

The second option is to install a FOG storage node which will serve as a second place to store images on and serve images to more clients (when doing unicast). TODO: Here you can find some more information about the two modes.

::

  FOG Server installation modes:
      * Normal Server: (Choice N) 
          This is the typical installation type and
          will install all FOG components for you on this
          machine.  Pick this option if you are unsure what to pick.

      * Storage Node: (Choice S)
          This install mode will only install the software required
          to make this server act as a node in a storage group

