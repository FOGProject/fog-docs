-----------------
Client Side Tasks
-----------------

.. === Client Side Tasks ===

.. ==== FOG Version ====

.. Applies to version 0.12 or higher.

.. ==== Overview ====

.. FOG attempts to keep management centralized, but in an attempt to make deploying machines as easy as possible FOG has added a few basic client side tasks.    These tasks can be run from the client computer during the PXE boot process.  When the client boots and the FOG banner is displayed the pxe client will display a prompt like '''boot:''' or something similar.  At this point you have 3 seconds to start typing one of the following commands.  

.. <ul>
.. <li>fog.memtest</li>
.. <li>fog.reg</li>
.. <li>fog.reginput</li>
.. </ul>

.. ==== fog.memtest ====

.. This command will run the memtest86+ on the client computer.  

.. ==== fog.reg ====

.. This command will run the basic host registration and inventory process without any user input.  It will register any new/unregistered hosts with the FOG server and pull a basic hardware inventory from them.  The hostname of the computer will be the same as the MAC address without the ":".

.. If a host is already registered, then only an inventory will be performed.

.. ==== fog.reginput ====

.. [http://freeghost.sourceforge.net/videotutorials/RegImage.swf.html View Host Registration Video]

.. This command will run the full host registration process with user input, inventory and give the option to push down an image, all at the same time.  During this process the user registering the host will be prompted for the computer host name, ip address, operating system ID, image ID, Primary User of the computer, asset tag 1, and asset tag 2.  

.. If a valid hostname, os id, and image id are given and the option is selected to image the workstation after registration, the host will reboot and an imaging send will began.  

.. If a host is already registered, then only an inventory will be performed, this prevents end-users from re-registering a machine with a different hostname, etc.

.. This tasks was designed for institutions that may get shipments of hundreds of computers that need to be deployed very quickly.  They can be unboxed, inventoried, imported into FOG and imaged very quickly.  

.. ===== Operating System ID =====

.. As of Version 0.17 of fog, you can now enter '''?''' at the Operating System ID prompt to get a listing of the valid operating system id values.  

.. The following are valid values for operating system IDs:

.. <ul>
.. <li><b>1</b> - Windows 2000 / Windows XP</li>
.. <li><b>2</b> - Windows Vista</li>
.. <li><b>3</b> - Windows 98</li>
.. <li><b>4</b> - Windows (Other)</li>
.. <li><b>5</b> - Windows 7</li>
.. <li><b>50</b> - Linux</li>
.. <li><b>99</b> - Other</li>
.. </ul>

.. ===== Image ID =====

.. Image IDs can be found in the management console, in the Images section.  Search for the image, and click on the edit button associated with the image, 
.. the image id will be in the Address/url bar in the format of <b>&imageid=xx</b>.

.. As of version 0.17, you can enter '''?''' at the Image ID prompt to get a listing of all your images and their ID numbers.
