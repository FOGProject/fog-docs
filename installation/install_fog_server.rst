.. include:: /includes.rst

------------------
Install FOG server
------------------

Before rushing into installing FOG you want to make sure you check the :ref:`installation/requirements`. 
The installation instructions here assume that you have a freshly installed server available that only contains the minimal set of packages.

Prerequisite
============

The preferred method of getting FOG is via Git.

Debian based
------------
::

  sudo -i
  apt-get -y install git

RedHat based
------------
::

  sudo -i
  dnf -y install git

Now that git is installed, you should be able to clone the FOG repository. 
Generally we recommend to put the repository inside of /root but if you've done this sort of thing before, put it wherever you want. 
Here's how you clone the FOG repository/code to your local machine:

::

  sudo -i
  cd /root
  git clone https://github.com/FOGProject/fogproject.git
  cd fogproject

|gitClone|

Choosing a FOG version
----------------------

FOG has different versions available at any given time that are developed within branches of our git repository.
The dev-branch 'dev' version is typically a stable option as much testing still occurs before changes are committed, but not as much as testing is done for the longer term "stable" version in the master branch.

!!! warning
Be aware that you should **not** consider switching back to the master branch without thourough consideration. This is due to the database schema changes that might be introduced over time. For example when FOG was installed using the master branch (currently version 1.5.10) you can move forward to newer dev-branch versions like 1.5.10.53 no problem. But if you want to switch to the master branch again you need to wait until the next official release 1.5.11 is out. Doing otherwise is on your own risk!

If you want the latest and greatest, would like to contribute to testing new features, or were instructed to install the dev-branch version to troubleshoot an issue you simply need to `git checkout` the dev-branch like so (just ignore the comment lines starting with '#'):

::

  #cd into where you cloned the git repo, e.g. /root/fogproject
  cd /root/fogproject
  #update all branches
  git fetch --all
  #switch to dev-branch
  git checkout dev-branch

Then you can run the installer to perform an upgrade or new install as shown in the next section

You can switch back to the master/stable branch with 

::

  cd /root/fogproject
  git fetch --all
  git checkout master

You can see a list of current branches here https://github.com/FOGProject/fogproject/branches

Alternatives
------------

If you have issues or good reasons not to use Git you can just download the FOG installer bundle as ZIP or tar.gz archive. 

* latest stable: [ZIP](https://github.com/FOGProject/fogproject/archive/master.zip) or [tar.gz](https://github.com/FOGProject/fogproject/archive/master.tar.gz)
* latest dev: [ZIP](https://github.com/FOGProject/fogproject/archive/dev-branch.zip) or [tar.gz](https://github.com/FOGProject/fogproject/archive/dev-branch.tar.gz)
* specific version: [ZIP](https://github.com/FOGProject/fogproject/archive/1.5.10.zip) or [tar.gz](https://github.com/FOGProject/fogproject/archive/1.5.10.tar.gz)

Simply extract the archive and start the installer same as described below.

Run the installer
=================

To start the installation process, follow the below steps. Running the installer **must be done as root**.

::

  sudo -i
  cd /root/fogproject/bin
  ./installfog.sh

Before all the components are being installed you are asked several questions to make sure the setup suites your situation and is ready to use straight after the installer finsihed:

SELinux
-------
*this only applies to RedHat based installs*

If SELinux is enabled on your system, then the installer asks you to disable SELinux. 
The current version of FOG will give problems when SELinux is enabled. 
Everyone is encouraged to come up with a properly tested SELinux policy we can add to the project and apply for everyone.

Local firewall
--------------

If a local firewall (iptables or firewalld) is enabled, then the installer asks you to disable it. 
You can leave it enabled, but then you need to know how do manage the firewall and let all services pass. 
Currently best is to disable the firewall if you don't know how to setup rules yourself. 
Same as with SELinux everyone is encouraged to develop a proper set of firewall rules.

OS selection
------------

The installer tries to guess the distribution you're running.
Just confirm the selection if it's correct, otherwise choose the apropriate option.

Installation mode
-----------------

With the same installer you can install a normal FOG server (called master node) or a FOG storage node. For the explanation of a storage node and how to install a storage node see *todo: install storage node*.

As we're installing a FOG server here, choose N here.

Default network interface
-------------------------

The installer needs to know which netork interface will be used for hosting PXE booting as well as sending images via unicast and multicast.
If the installer guessed the right interface, then choose n(o) to proceed using the pre-selected network interface.

Otherwise, choose y(es) and type in the name of the network interface (like eth0, ens192).

DHCP service
------------

You have the option to run a DHCP service on the FOG server itself or, if you already have a DHCP server in your network, then you can answer n(o) to the following three questions. For more information on configuring an existing DHCP server to work with FOG, see :ref:`installation/network_setup:Other DHCP Server than FOG`. 
The questions on DHCP are in reverse order. 
First the settings and finally if you really want to enable DHCP on your FOG server. 
This order might be changed in future versions of the installer.

DHCP router address
-------------------

If you're going to run a DHCP server on this FOG server, then type y(es) and type in the router (or default gateway) address that the DHCP server will advertise. 
If you already have an existing DHCP server in your network, choose N here.
This question is kind of obselete if you choose to use or setup your own DHCP server and will be hidden in future versions when DHCP is de-selected.

DHCP handle DNS
---------------

If you're going to run a DHCP server on this FOG server, then type y(es) to advertise DNS server IPs to the clients and type in the IP address of the local DNS server. 
If you already have an existing DHCP server in your network, choose n(o) here. 
This question is also of obselete if you choose to use or setup your own DHCP server and will be hidden in future versions when DHCP is de-selected.

Activate DHCP
-------------

If want to run a DHCP server on this FOG server, then choose y(es). Otherwise choose n(o).

Internationalization
--------------------

If you want the FOG web UI to provide additional languages, choose y(es) here.

HTTPS support
-------------

You can choose to setup FOG with encrypted communication. 
With FOG providing several different services (e.g. web UI for configuration, web API, PXE booting, client management using the :ref:`fog-client`) choosing HTTPS support has consequenses. 
Not only a self signed certificate is being generated for you but also the apache webserver is setup to host the web UI through HTTPS as well as iPXE on the fly compilation happens to include that certificate into the PXE binaries provided by your new FOG server. 
Usually this works out of the box and doesn't take manual intervention. 
Though if you are unsure you still might choose n(o) to lessen possible issues. 
Even without HTTPS support, the communication between fog-client and the FOG server uses a secured encrypted channel.

Hostname
--------

Check the auto detected hostname and correct it in case it's not what you want it to be. 
This host name is used the FOG web UI. 
Choose n(o) not change and accept the suggested hostname, otherwise, choose y(es) and enter the correct hostname.

Summary
-------

The installer prints out all options chosen. 
If you are sure everything is correct, choose y(es) to proceed installing. 
Choosing n(o) will terminate the installer and you need to restart the process to answer all the questions again.

Installation questions
----------------------

If the installer detects a mysql database server with an empty 'root' password, you are required to enter one to be set. 
In case the Linux account 'fogproject' has been used on this server, the installer will complain and provide information and instructions on how to mitigate the situation.

Database setup
==============

While most of the installtions runs without intervention there is one step you need to manually take care of. 
The installer will prepare the database for you and then ask you to open your web browser and visit the FOG web UI to build the initial database schema or promote an existing database with new schema updates. 
Make sure you follow this step and only proceed with the installer (hit ENTER) after the schema update/setup has finished or the installer will fail.

Final steps
===========

The installer ends with the following information in case everything went fine:

::

  * Setup complete
  
   You can now login to the FOG Management Portal using
   the information listed below.  The login information
   is only if this is the first install.

   This can be done by opening a web browser and going to:

   https://x.x.x.x/fog/management

   Default User Information
   Username: fog
   Password: password

Now your FOG Server is ready to use! 
Go ahead, login to the web UI and start using FOG (*todo: link to docs with first steps*) and have fun.

Install errors
==============

Whenever the installer *TBD*...
