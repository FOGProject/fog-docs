.. include:: ../includes.rst

-------------------------------
FOG Client installation options
-------------------------------

Windows Client
==============

Prerequisites
-------------

For running the FOG client on Windows you need the .NET Framework version 4.0+ 

  
  - Windows 10 comes with a version of .Net that will work.
  - The .NET 4 client profile will NOT work
  - You can download the framework from here: `Microsoft .NET Framework 4.5.1 (Offline Installer) for Windows Vista SP2, Windows 7 SP1, Windows 8, Windows Server 2008 SP2 Windows Server 2008 R2 SP1 and Windows Server 2012 <https://www.microsoft.com/en-us/download/details.aspx?id=40779>`_

Each FOG server version comes with it's own FOG client. You can download the client from the FOG Web UI:

- Log in on the client machine, open a browser and browse to the Fog Web UI.
- On the bottom of the Web UI, click on the link 'FOG Client' (you don't have to log in).
- Select Your installer
  
MSI Installer
-------------

  - Click on the link 'MSI -- Network Installer' to run the MSI package (can also be used with gpo software deployment and other silent installs).
  - The url to download this is http://fogserver/fog/client/download.php?newclient

Smart Installer
---------------

  - Click on the Smart Installer link to download and run the smart installer. This is a cross-platform installation that detects your operating system
  - The url to download this is http://fogserver/fog/client/download.php?smartinstaller


Run The Installer
-----------------

.. admonition:: info

  The following steps follow the msi installer wizard. The Smart Installer wizard is similar

.. note::
  
  You may get a 'Windows protected your PC' popup. In that case you have to convince windows that this installer is safe to run. Click on 'More info' and 'Run anyway'.

- At the Welcome screen, click on 'Next'
- Accept the terms in the License Agreement (it's the GPL license, so why not) and click on 'Next'

|fog_client_installer_options|

* Fill in required fields:

  * Server Address: type in the hostname or IP address of the FOG Server.
  * Web Root: leave this to /fog
  * Leave the other options as they are
  * Click 'Next'

  * Leave the destination folder as it is and click 'Next'
* Click on 'Install' and say 'Yes' at the UAC prompt.
* Once the wizard has been installed, click on 'Finish'.

Now the FOG client has been installed. In the Task bar there should be a new icon:

|fog_client_icon|

This icon tells you the version of the FOG Client and helps handle the notifications to the end user.

FOG client silent installation
------------------------------

If you would like to create a silent installation to deploy the fog client here is an example of a powershell script that would do that for you

.. note::

  This script assumes that you can access your fogserver by the default name of `fogserver` which can be a hostname or a dns alias

.. code-block:: powershell

  #download the client installer to C:\fogtemp\fog.msi
  Invoke-WebRequest -URI "http://fogserver/fog/client/download.php?newclient" -UseBasicParsing -OutFile 'C:\fogtemp\fog.msi'
  #run the installer with msiexec and pass the command line args of /quiet /qn /norestart
  Start-Process -FilePath msiexec -ArgumentList @('/i','C:\fogtemp\fog.msi','/quiet','/qn','/norestart') -NoNewWindow -Wait;

MSI Switches
------------

-  USETRAY= defaults to "1", if "0" the tray will be hidden
-  HTTPS= defaults to "0", if "1" the client will use HTTPS (not recommended)
-  WEBADDRESS= defaults to "fogserver", this is the ip/dns name of your server
-  WEBROOT= defaults to "/fog"
-  ROOTLOG= defaults to "0", if "1" the fog.log will be at C:\fog.log, otherwise %PROGRAMFILES%\FOG\fog.log

Example of a silent MSI installation:

::

  msiexec /i FOGService.msi /quiet USETRAY="0" WEBADDRESS="XX.XX.XX.XX"

Smart Installer Switches
------------------------

.. note::

  All switches with --{OPTION} can also be used as /{OPTION}

- --server= Specify the server address. Default is fogserver
- --webroot= Specify the webroot. Default is /fog
- -h or -https Use https for server communication
- -r or -rootlog Put fog.log in the root of the filesystem
- -s or --start Automatically start the service after installation. Linux only
- -t or --tray Enabled the FOG Tray and notifications
- -u or --uninstall Uninstall the client
- --upgrade Upgrade the client
- -l= or --log= Specify where to put the SmartInstaller log

Windows Services
----------------

An installed client consist of two services: the FOGService and the FogUserService.

- FOGService: Runs under the LocalSystem account and performs all tasks like running snapins, change hostname, etc..
- FogUserService. The user service is run in a user's context and helps with notification popups and user level tasks.

Logging
-------

You can find the fog log at ``C:\Fog.log`` and the user service log at ``C:\users\username\.fog_user.log``

Uninstall
---------

There are various ways to uninstall the client:

- Uninstall via 'Programs and Features' or 'Apps & Features'
- Uninstall via MSI. Example:

::

  msiexec /i FOGService.msi /quiet

- Uninstall using the SmartInstaller. Example:

::

  SmartInstaller.exe uninstall 
  

Linux client
============

Linux Client Pre-requisites
---------------------------

- Mono: latest stable build
- xprintidle: This dependency is optional. If not installed AutoLogOut will not run. xprintidle basically just returns the idle time of an x window, therefore on a system without a GUI it is not needed and should not be installed. It should be available in standard package managers. E.G. apt-get, yum, or dnf

Install Mono
------------

Many distributions come with an out of date version of mono in their package manager. Therefore, do not attempt to install via your package manager without the below modifications or take a look at the instructions found on their website: https://www.mono-project.com/download/stable/#download-lin-centos

Debian
######

::

  sudo apt install apt-transport-https dirmngr gnupg ca-certificates
  sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
  echo "deb https://download.mono-project.com/repo/debian stable-buster main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
  sudo apt update
  sudo apt install mono-complete

Ubuntu
######

::

  sudo apt install gnupg ca-certificates
  sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
  echo "deb https://download.mono-project.com/repo/ubuntu stable-bionic main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
  sudo apt update
  sudo apt install mono-complete

CentOS
######

::

  rpmkeys --import "http://pool.sks-keyservers.net/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"
  su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'
  yum install mono-complete

OpenSUSE and SLES
#################

You can install mono using SUSE One-Click files: http://download.mono-project.com/repo/mono-complete.ymp

Others
######

The FOG Client can be installed on any platform that can run the latest stable build of mono. To install:

- Check your package manager for mono-complete. After installing it run mono --version. Ensure the version is at least 4.2. If not, remove the package.
- If your package manager had an old version of mono, see here for how to compile mono

If your system either has systemd or initd the client will be automatically configured to run on startup. If your system does not have either, you will need to configure your system to run the manual start command below on startup.

To manually start and stop the service:

::

  sudo /opt/fog-service/control.sh start
  sudo /opt/fog-service/control.sh stop

Installing fog-client SmartInstaller
------------------------------------

Each FOG server version comes with it's own FOG client. You can download the client from the FOG Web UI:

- Log in on the client machine, open a browser and browse to the Fog Web UI.
- On the bottom of the Web UI, click on the link 'FOG Client' (you don't have to log in).
- Select the SmartInstaller and download it
- Run the installer with mono:

::

  sudo mono SmartInstaller.exe

The client will install to /opt/fog-service.

The service is automatically configured to run on startup. To manually start and stop the service:

::

  sudo systemctl start FOGService
  sudo systemctl stop FOGService

Limitations
-----------

- The FOG Tray is currently incompatible on linux systems. Regardless of what you set during installation, it will not run.
- The following modules / features are not yet supported:

  - Active Directory joining
  - PrinterManager

Linux Client Logging
--------------------

The log is located at /opt/fog-service/fog.log.


Uninstall Linux Client
----------------------

To uninstall:

::

  sudo systemctl stop FOGService
  sudo mono SmartInstaller.exe uninstall


OS X Client
===========

OS X Client Pre-requisites
--------------------------

- Mono: use the latest stable build.

Installing Mono
---------------

- If you are running El Capitan, navigate to http://www.mono-project.com/download/#download-mac and download Mono Universal Installer
- Otherwise, navigate to http://www.mono-project.com/download/#download-mac and download Mono 32-bit

Installation
------------

Each FOG server version comes with it's own FOG client. You can download the client from the FOG Web UI:

- Log in on the client machine, open a browser and browse to the Fog Web UI.
- On the bottom of the Web UI, click on the link 'FOG Client' (you don't have to log in).
- Select the SmartInstaller.
- Install the SmartInstaller with mono:

::

  sudo mono SmartInstaller.exe

- Reboot the system to complete the installation.

The service is automatically configured to run on startup. To manually start and stop the service:

::

  sudo launchctl load -w /Library/LaunchDaemons/org.freeghost.daemon.plist
  sudo launchctl unload -w /Library/LaunchDaemons/org.freeghost.daemon.plist

OS X Client Limitations
------------------------

The follow modules / features are not yet supported
- PrinterManager

OS X Logging
------------

You can find the client log file in /opt/fog-service/fog.log 

Uninstall OS X Client
----------------------
To uninstall:

::

  sudo launchctl unload -w /Library/LaunchDaemons/org.freeghost.daemon.plist
  sudo mono SmartInstaller.exe uninstall
