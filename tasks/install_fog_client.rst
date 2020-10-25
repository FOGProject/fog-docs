.. include:: /includes.rst

----------------------
Install the FOG client
----------------------

The FOG client is an agent running on the machines you are managing with Fog. With the FOG client you can perform various tasks such as managing printers, change the host name and join Active Directory (for Windows machines) and install software via 'snapins'.

All these tasks are managed centrally from the FOG Web UI. The FOG Client 'polls' the FOG server to see if tasks need to be done and if so, executes them.

The purpose of this guide is to show you the process of installing the FOG client, register the host on the FOG server (if not already done during image deployment) and let the client perform some tasks via the FOG Web UI.

Prerequisites
=============

We're assuming that you have a running FOG server that was installed according to the instruction above in this manual

The machine that you're installing the FOG client on is a Windows 10 machine.

Install the FOG client
======================

- Log in on the client machine, open a browser and browse to the Fog Web UI.
- On the bottom of the Web UI, click on the link 'FOG Client' (you don't have to log in).
- Click on the link 'MSI -- Network Installer' and run the MSI package.

.. note:: You may get a 'Windows protected your PC' popup. In that case you have to convince windows that this installer is safe to run. Click on 'More info' and 'Run anyway'.

The installer starts.

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

This icon is not from the FOG Client itself, but handles the notifications to the end user.

The first time the FOG client service runs on a machine, it will create a set of encryption keys and then tries to register itself at the FOG server.

This may take some time, as the startup type of the FOG client service is set to 'Automatic - Delayed'. You may want to force start the FOG client directly after installation or reboot the machine.

Approve the machine
===================

- Start a browser, go to the Fog Web UI and log in
- Go to 'Host Management' -> 'List all Hosts' and click on the machine you have just installed the FOG client on.

.. Image:: /_static/img/tasks/capture_host_management_1.png

If the Windows OS was not deployed with FOG, then the FOG client is not yet registered at FOG and the client is not trusted by the FOG Server. We need to manually approve this machine:

|fog_client_approve|

- Click on 'Approve this host ?'

If the Windows OS was deployed with FOG, then the machine will already be in FOG as we registered it during image deployment. The FOG client is considered as 'trusted' by the FOG server and will be already approved.

An approved host looks like this:

|fog_client_approved|

The FOG client can now execute tasks we're assigning to it in the FOG Web UI.
