------------------
Printer Management
------------------

.. === Setting up Printers With Fog Printer Management ===

.. ==== FOG Version ====

.. Relates to FOG Version 0.12 or higher.

.. ==== Known Issues ====

.. Setting of the default printer will only work if the fog tray icon is running.

.. ==== Overview ====

.. The printers section of FOG allows you to create printer definitions that you can later associate with hosts.  The FOG service looks at these associations and during service it will attempt to install any printers listed.  This service has three settings which define how the printers are managed, printer management can be set to:

.. <ul>
.. <li>No Printer Management</li>
.. <li>Add Only</li>
.. <li>Add and Remove</li>
.. </ul>

.. All hosts default to '''No Printer Management''' which means that the FOG service does nothing to the hosts printers.  '''Add Only''' does as the name implies, and will only add printers to the host machine, it will not remove any existing printers that may be installed.  '''Add and Remove''' will take full control of the hosts printing system and only allow for the printers that are specified by the FOG management console to exist on the host.  

.. ==== Adding New Printers ====

.. [http://freeghost.sourceforge.net/videotutorials/printer.swf Video Tutorial]

.. In order for the printer to be added to the host computer, the printer drivers must be stored in a public area, or included on the host computer.  This public area can be a Novell Network share where public has read-only access, a Windows share that is public read-only to everyone, or a Samba share (possibly residing  on the FOG server) that is public read-only to everyone.  This share must be accessible via a UNC path as the service may attempt to install the printers before drive mapping occurs.  In this share the printer drives and .inf file must exist.  FOG supports install IP based (Jet-Direct) printers, public access NDS printers, Local printers, windows share based printers, (and we think, but could use a confirmation as it hasn't been tested) AD based printers.  

.. If you wish to see what printers are included with Windows XP, navigate to c:\windows\inf\ntprint.inf.  Open this file with a text editor and you will be able to install all the printers listed using the ntprint.inf file.  

.. To create a new printer definition click on the Printer icon on the system menu bar.  Then on the left hand menu, click on '''Add New Printer'''.  The form you are presented with will require you to enter:

.. <ul>
.. <li>'''Printer Model''' - This must match the name in the INF file.</li>
.. <li>'''Printer Alias''' - This can be anything you wish and it is what the end user will see.</li>
.. <li>'''Printer Port''' - This is something like '''LPT1:''', or '''IP_1.1.1.2'''.</li>
.. <li>'''Printer INF File''' - This is the path to the INF file for the printer driver.</li>
.. <li>'''Printer IP''' - (optional) This is ip address of an IP based printers only, this can take the form of '''1.2.3.4:9100''' or '''1.2.4.5'''.  If the port doesn't exist already, it will create one named ''' IP_x.x.x.x''', where x.x.x.x is the ip address.  That is what should be entered in the port field.</li>
.. </ul>

.. After all the required information is entered, click on the '''Add Printer''' button.

.. ==== Linking Printers to Hosts ====

.. [http://freeghost.sourceforge.net/videotutorials/printer.swf.html Video Tutorial]

.. Linking printers to hosts can be done from either the hosts section or the groups section.  In the hosts section find the host you would like to add a printer to, click on the edit button associated with that host.  In the host menu, click on the '''Printers''' button.  First select how you would like the host to be managemed, either '''No Printer Management''', '''Add Only''', or '''Add and Remove'''.  Then in the section below, select the printer you would like to install from the drop down list and click on the '''Update''' button.

.. ==== Creating a Samba Based Printer Store on FOG ====

.. If you do not have a public sever where you can store your printer drivers for the FOG Printer Manager, then it is very easy to set one up on the FOG server using Samba, so all your Windows Clients will be able to connect.

.. [[Creating a Samba Based Printer Store on FOG]]