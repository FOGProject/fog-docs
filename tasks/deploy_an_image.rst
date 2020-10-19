.. include:: /includes.rst

---------------
Deploy an image
---------------

One of the main tasks of FOG is to quickly deploy images to machines. This can be new machines that you will introduce to your environment or the re-imaging of existing machines.

Prerequisites
=============

We're assuming here that you have captured a Windows 10 image like described above in this manual. Also, you have a new machine that is not registered at FOG and you would like to deploy the image onto this machine.

Booting up the machine
======================

Plug in a cabled ethernet connection and in the BIOS, make sure the machine boots from the network.

.. Image:: /_static/img/tasks/capture_pxe_boot.png

In the screenshot above you see a successful network boot:

#. The PXE client on the machine brings up the network link and via DHCP an IP address is requested. The DHCP server (in the screenshot, the DHCP server is at 192.168.178.1) hands out  together an IP address (192.168.178.16/255.255.255.0), also the 'next server' (192.168.178.14) and 'file name' (ipxe.kpxe) options are handed over.
#. The PXE client on the machine then gets the ipxe.pxe image via TFTP
#. iPXE is executed and configures itself

Then you will be presented with the Fog boot menu:

.. Image:: /_static/img/tasks/deploy_fog_menu.png

Use your arrow keys to move the selection up and down. The default, 'boot from hard disk' is chosen in 3 seconds, so be quick.

In red you see the the statement that the host is NOT registered. It means that the host is not known by Fog.

Choose 'Perform Full Host Registration and Inventory'.

In the text modus, you will be asked several questions:

.. Image:: /_static/img/tasks/deploy_fog_questions.png

Hostname
--------

Enter the hostname that this machine will get after imaging. The machine will also be registered under this hostname in the FOG Web UI.

Type in a name, for example 'testpc'.

Image ID
--------

You are now asked which image you would like to deploy. Choose '?' for a listing and type in the ID (number) of the image you want to deploy on this machine.

Host Groups
-----------

You are asked if you would like to associate this machine with host Groups in FOG. In FOG you can group hosts and you can assign certain settings and snapins to a group. Group membership can later be managed in the Web UI.

For now we will say 'N' here.

Snapins
-------

You are asked if you would like to associate snapins with this host. Snapins are tasks that are executed by the FOG Client and are mostly used to install applications afterwards. Snapins for this machine can later be managed in the Web UI.

For now we will say 'N' here.

Product key
-----------

For Windows machines you can add a product key that is applied to the Windows OS later.

For now we will say 'N' here.

Join Domain
-----------

For Windows machines, the FOG Client on the machine can make the machine join a Windows domain. Domain membership can later be managed in the FOG Web UI.

For now we will say 'N' here.

Primary User
------------

You are asked the name of the primary user of this machine. This does not need to be a known accout, but can any name and is only stored in the inventory in FOG.

For now we will leave this empty. Just press Enter.

Tag #1 and #2
-------------

You are asked for Tag #1 and #2. These are free fields where you can store the serial number of your hardware or an ID of your own asset management system. The tags are stored in the inventory in FOG.

For now we will leave these fields empty. Press Enter both times.

Deploy image now
----------------

You are then asked to deploy the image now. If you say 'Y' here, besided restering this machine in Fog, also, a deployment task will be created. Upon next network boot of this machine, the image will be deployed to this machine.

Say 'Y' here.

FOG Username and password
-------------------------

For registering the machine and the deployment task, FOG needs your FOG credentials. These are the same credentials you use for the FOG Web UI.

Type in your FOG username and password.

After the questions this machine and it's inventory, like will be registered in FOG and a deployment task is created for this machine.

Your machine will be rebooted.

Deploy image
------------

Make sure your machine boots from the network.

After booting, partclone will be started and the image on the FOG server will be copied and unpacked on your machine:

.. Image:: /_static/img/tasks/deploy_partclone.png

After imaging
-------------

When the deployment has been completed, your machine will reboot now and if all goes well, Windows should start.
