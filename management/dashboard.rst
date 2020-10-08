Dashboard
===========

Overview
===========

.. Image:: img/Dashboard.png


- The FOG dashboard is the first page you are presented with after
login. This page just gives you an overview of what is happening on your
FOG server.

System overview
===============

- The system overview box is the the top left hand box on this page. Thekv
information presented in this box is the current user, the server IP
addresse or hostnames for your web server, tftp server and storage
server (which can all be different). This section also gives you the
system uptime or how long the system has been running without restart,
the number of users logged into the Linux box, and lastly the system
load.

System Activity
===============

The system activity box is in the top row, the middle box.
This section shows the unicast queue, or the number of
unicast deploys that are currently in progress. The queue size can
change and is based on the the Storage Group(s). Each storage node has a
setting ''Max Clients'' making this the maximum number of hosts that
this node can image to. If there are 2 nodes with a max of 10 each then
your maximum queue amount is 20. However, remember the more you increase
the ''Max Clients'' the slower each particular host will be to deploy
the image. *\ This means that after 20 hosts are receiving images (at
once) the 21st will wait for one of the hosts in progress to complete
before starting. The reason this was created was so that you could queue
up 100 machines with different images (all unicast) and still keep the
system functional. We have heard of this queue being used to re-image an
entire building of computers ( ~ 1000+ ) overnight. This section updates
in real time. *It will display all the queued, running, etc... tasks and
updates at the same interval as the Bandwidth graph. Also, SVN
installations (and later future releases) are able to edit which type of
tasks get counted towards the "queue".
*\ This edit can be performed by going to '''FOG
Configuration'''.. Image:: img/Config.png
--> '''FOG Settings'''--> '''General
Settings''' --> '''FOG\_USED\_TASKS'''. \*The text field is numeric
values (so you'll need to know which task id's are which type. This text
field is a CSV setup. If you type (1,2,3,4,5) it will display all tasks
of Deploy, Capture, Debug, Memtest, and Testdisk as queued/active
depending on their current state. The exception to this rule, is Task
Type ID 8 (multicast) in which case it takes the Jobs, not each
individual host task, as a queued slot.

Disk Information
================

*The disk information box is the top, right hand section of the
dashboard page. This is a semi-realtime display of the storage remaining
on the storage server. *\ There is also a drop-down box that can be
changed to your storage nodes to monitor their Disk Information. \*If
you get an error in this box, please see [[Dashboard Error: Permission
denied...]]

30 Day Imaging History
======================

\*This image shows your imaging trends for the past 30 days

Menu Bar
========

.. Image:: img/FogMenu.jpeg


This menu appears at the top of every page on Fog's web UI. The icons
are, from left to right:

.. Image:: img/Home.png
'''Home/Dashboard''' - This is the home screen of the
FOG management portal.

.. Image:: img/Users.png
'''[[Managing\_FOG#Users \| User Management]]''' -
Individual administrators of the FOG resources.

.. Image:: img/Hosts.png
'''[[Managing\_FOG#Hosts \| Host Management]]''' -
This section houses the hosts, which are the pcs to be imaged or to
extract images from.

.. Image:: img/Groups.png
'''[[Managing\_FOG#Groups \| Group Management]]''' -
This section houses groups, which are similar PCS’ that need tasks done
en-masse.

.. Image:: img/Images.png
'''[[Managing\_FOG#Images \| Image Management]]''' -
This section allows you to manage the image files stored on the FOG
server.

.. Image:: img/Storage.png
'''[[Managing\_FOG#Storage\_Management \| Storage
Management]]''' - This section allows you to add/remove storage nodes
from the FOG system.

.. Image:: img/snapins.png
'''[[Managing\_FOG#Snap-ins \| Snap-in
Management]]''' - This section provides ways to automate various
post-imaging tasks, not covered in this document

.. Image:: img/Printers.png
'''[[Managing\_FOG#Printers \| Printer
Management]]'''' - This section allows for management of printers,
allowing you create printer objects that can later be assigned to hosts
or groups.

.. Image:: img/Services.png
'''Service Configuration'''' - This section allows
you to control how the ''client'' service functions.

.. Image:: img/Tasks.png
'''[[Managing\_FOG#Tasks \| Task Management]]''' -
This section allow you to perform imaging tasks such as acquiring or
deploying images.

.. Image:: img/Reports.png
'''[[Managing\_FOG#FOG\_Reports \| Report
Management]]''' - Reports let you pull information from the FOG database
either as HTML, pdf, or csv.

.. Image:: img/config.png
'''Fog Configuration''' - The section has the rest
of the settings that don't fit anywhere else like the kernel updater,
client service updater, iPXE edits, MAC address list, Log viewer, '''FOG
Settings'''.

.. Image:: img/Plugins.png
'''[[Managing\_FOG#Plugins \| Plugins]]''' -
Plugins add more functionality to FOG. Must be enabled in ''Fog
Configuration''

.. Image:: img/Logoff.png
'''Logoff''' - Click this to log off of the Fog web
UI.
