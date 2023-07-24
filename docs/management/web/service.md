---
title: Fog Service (aka Client) Management
aliases:
    - Fog Service (aka Client) Management
description: index page for service
context_id: service
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - fog-service
    - fog-client
---

# Fog Service (aka Client) Management

Note: Most of the things here about the FOG Client service apply to the legacy FOG client that came with FOG versions 1.2.0 and older. FOG 1.3.0 now comes with a new FOG Client. Details on this can be found here: [FOG Client](https://wiki.fogproject.org/wiki/index.php?title=FOG_Client "FOG Client")

## Overview

The FOG Client Service is a Windows Service that is intended to be installed on the client computers during the image creation process. The FOG service communicates with the FOG server to provide certain service to the client computers including:

  

-   Auto Log Off (0.16)
-   Hostname Changes
-   Active Directory Integration
-   Directory Cleaner (0.16)
-   Display Manager (0.16)
-   Green FOG (0.16)
-   Host registration
-   Task Restarting
-   Snapin Installation
-   User Tracker
-   Printer Manager
-   User Cleanup (0.16)
-   Client Updater
-   User Tracker

## Module specific configuration settings

The FOG Client Service is very modular in nature, which means you can install portions of the services provided, and leave off others. This also means that it is very easy to create new sub services if you know a little C#. All configuration data is held in a local INI file. Which is typically stored in

c:\program files\fog\etc\config.ini

This file holds, in the general section:

-   FOG Server IP address
-   FOG Service installation root
-   FOG Service working directory
-   FOG Log file path
-   Flag indicating if GUI messages should be displayed
-   The max log file size

## Installation

[Video Tutorial](http://freeghost.sourceforge.net/videotutorials/FogServiceInstall.swf.html)

The FOG service should be installed on the computer to be imaged before capturing the image to the FOG Server.

The FOG service is located in the **FOG Service/bin** directory or if the FOG server is already installed it can be downloaded from:

http://[serverip]/fog/client/

Double-click on the **setup.exe** to start the installation wizard. At the end of the wizard you will need to enter the IP address or hostname of your FOG server.

[![Fogservice.jpg](https://wiki.fogproject.org/wiki/images/a/ad/Fogservice.jpg)](https://wiki.fogproject.org/wiki/index.php?title=File:Fogservice.jpg)

Then restart the computer, if you don't restart the computer you will have issues with the service GUI appearing correctly.

### Quiet Installation

As of version 0.29 and higher, the FOG client now supports a quiet installation mode. This can help automate deployments, by allowing the command to be run without user interaction from batch files. To do this the setup.exe file must be run from the command line with the arguments **fog-defaults=true /qb**.

So the full command would be:

setup.exe fog-defaults=true /qb

## Functions and Operation

### Auto Log Out

Added in Version 0.16

This module of the FOG Service will log a user off of a client pc after X minutes of inactivity. This module will display a screen saver-like GUI after 3/4 of the inactive time is up. So if the time out value is 40 minutes, the GUI will be displayed at 30 minutes of inactivity. When the time is up, the client computer will reboot. This service module can be configured via the management portal via:

FOG Service Configuration -> Auto Log Out

To enable the module globally, place a check in the box next to **Auto Log Out Enabled?**. The time to auto log off can changed globally via **Default log out time:** The minimum recommended value for this setting is 4 minutes.

The background image for the auto log off module can be modified via:

Other Information -> FOG Settings

The settings can be changed by modifying the value for **FOG_SERVICE_AUTOLOGOFF_BGIMAGE**. This settings will accept a jpg file that is local to the client computer like:

c:\images\image.jpg

This setting will also accept files located on a web server such as:

[http://www.somedomain.com/image.jpg](http://www.somedomain.com/image.jpg)

Provided with FOG is a simple php script that will display a random images that is located on the FOG server. To use this option set **FOG_SERVICE_AUTOLOGOFF_BGIMAGE** to

[http://x.x.x.x/fog/public/randomimage.php](http://x.x.x.x/fog/public/randomimage.php)

Then simply put the images you would like to use in the following directory on the fog server:

/var/www/html/fog/public/imagepool

Images used for the auto log off module must be in jpg format, and must be 300px by 300px.

### Hostname Changer

This module of the FOG Service is used to change the hostname of the client computer and to allow the client to (optionally) join a Active Directory Domain after imaging. This process only runs shortly after service startup, which means typically only when you start your computer. The service communicates with the FOG server over port 80 and determines the hostname that is present in the FOG database for the host. The hosts are matched to the FOG database by their MAC addresses. If the hostnames are found to be different, the client changes the computers hostname and restart the computer.

The config.ini file contains configuration options for this module.

netdompath=

Allows you to set the path to the netdom.exe file. In some cases the file does not exist on the system. It can be downloaded from: [Microsoft Download Center](http://www.microsoft.com/downloads/details.aspx?FamilyId=49AE8576-9BB9-4126-9761-BA8011FABF38&displaylang=de)

### Host Register

As of version 0.29, this module will only add additional mac address to a host that is already registered, and add them to the pending mac address table, where they need to be approved in the FOG UI.

### Task Reboot

This module periodically checks in with the FOG server to see if the client has an imaging task assigned to it. If a task is found AND no one is logged into the workstation, then the client will restart and join the task.

The config.ini file contains configuration options for this module. As of version 0.13 of FOG you can change:

forcerestart=0

to

forcerestart=1

This will make the computer restart if a task is found, regardless of whether a user is logged into the computer.

You can change how often the service will check in with the server by changing:

checkintime=xxx

where xxx is the number of seconds the service will wait between check-ins.

### Directory Cleaner

Added in version 0.16

This module will clean out (delete) the contents of a directory on user log off. This useful when you don't want any settings cached between users. This module will only delete the contents of a directory and not the root directory itself, so if you specify **c:\trash**, the service will remove all files and folders located within c:\trash but leave the folder c:\trash.

### Display Manager

Added in version 0.16

This module is used to restore screen resolution between clients. This will restore a fixed resolution and refresh rate when a user logs into a computer.

### Green FOG

Added in version 0.16

This module will simply shutdown/restart the client computer at a fixed schedule if no user is logged in. The schedule can be defined via the management portal.

### Snapin Client

This module periodically checks in with the FOG server to see is the client has an snapin set to be deployed to it. If a snapin is found AND no imaging task is associated with the client, then the client will download the snapin and install it in the background.

The configuration file contains settings for this module including:

checkintime=xxx

where xxx is the number of seconds the service will wait between check-ins. It is important to note that currently the fog client will wait 5 minutes when first connected / established before it starts checking and installing any snapins from the server.

### User Tracker

This module attempts to track user access to the host computer by the Windows user name. It attempts to track logins and logoffs as well as well as the state of the computer at service startup. The service will even attempt to track users when they are not on the network by writing all entries to a journal file, then replying the journal the next time the client is on the network.

There are no configuration settings for this module.

### User Cleanup

This module will remove all users not white listed in management portal on log off. This module is useful when using services like dynamic local user. All entries in the management white list are treated as prefixes to usernames, which means that they will white list all users that start with whatever was entered in the management front end. For example, if you enter **admin** in the management white list, then users **admin**, and **administrator** will NOT be removed from the computer.

### Printer Manager

This module checks on service startup to see what printers should be installed/removed from the client PC.

There are no configuration settings for this module.

### Client Updater

This module waits (randomly) between 60 and 500 seconds after service startup to check the local fog server for client updates, and if any are found the service will download and install them. Updates will NOT take effect until after the service is restarted.

There are no configuration settings for this module.

## Keeping Clients up to date

### Overview

As of version 0.12 of FOG, we have included a client updater module. This module is no different from any of the other sub service modules. This service waits anywhere between 60 and 500 seconds after the FOG service starts up, and then attempts to check with the server for newer FOG service modules. If new modules are found the client will download them, and they will be active on the NEXT service startup. These modules are controlled from the FOG Management Console.

Only certain modules can be updated, only those that are a sub class of AbstractFOGService. This means you should **NEVER** attempt to update the FOGService executable (FOGService.exe file), or the AbstractFOGService.dll file. It is recommended that you not update the ClientUpdater.dll, because if the ClientUpdater.dll file becomes corrupt or not functional, your clients will not be able to update from that point on. Below are a list of the .dll files that can be updated.

-   UserTracker.dll
-   TaskReboot.dll
-   SnapinClient.dll
-   PrinterManager.dll
-   HostRegister.dll
-   HostnameChange.dll
-   GUIWatcher.dll
-   ClientUpdater.dll
-   config.ini

Care must also be taken when updating the config.ini file, if the IP address is incorrect or the syntax of the file is incorrect, it could leave the FOG service crippled on the client computers.

### Posting Updates

To add new modules that can be pushed down to clients, first install a client with the new service or new module and confirm that it works as you would like. Log into the FOG management console, then go to the Infomation/Misc section (the little "i" icon). Click on **Client Updater** on the left-hand menu. Now click on the browse button to select the module (.dll) file you would like to post, then click on the capture button. After capturing the file should appear in the table above. If you are adding a new module, you will probably want to capture a new config.ini file to include new configuration settings required by that new module.

## FOG Tray

The FOG Tray is a Windows application that runs on user login that docks in the system tray. The FOG Tray, like the FOG service, is very modular in nature. New modules can be dropped in the FOG tray directory and on next load they will be loaded. This tray icon has the ability to communicate with the FOG service, this allows FOG more interactivity with the end-user.

What happens is that when the FOG service's printer manager module gets a request to set a default printer, the service attempts to contact the FOG Tray. If communication is established, then the service will ask the tray to set the default printer. On the other hand the end user can right click on the "F" icon in the system tray, then select printers, then update my printers. What this will do is attempt to send a request from the FOG Tray to the FOG Service and have the service check for printer updates (new printers or printers to be removed). If one is found the service will install any new printers assigned in the FOG Management portal.

This application is in its very early stages and currently doesn't have a lot of functionality. It is currently only used to allow end users to update their printers and to allow the setting of default printers (from the FOG service). Our vision for the FOG Tray is to add modules that would allow users to install printers that are published as public (via the management portal) without the printer being directly assigned to their host. We would also like to do the same thing for snapins where some of your snapins could be defined as public where anyone could install them on their computer.

## Troubleshooting

If you have problems with the FOG Service, please refer to the log file that is located at:

c:\fog.log

If the PXE boot does not work

If booting from the fog server through pxe comes up with an error file not found, edit /etc/default/tftpd-hpa

Change TFTP_DIRECTORY to

TFTP_DIRECTORY="/tftpboot" Then

/etc/init.d/tftpd-hpa restart