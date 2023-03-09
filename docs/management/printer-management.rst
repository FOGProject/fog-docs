.. include:: ../includes.rst

------------------
Printer Management
------------------

Setting up Printers With Fog Printer Management

.. note:: **Known Issues** - Setting of the default printer will only work if the fog tray icon is running.

Overview
========

- The printers section of FOG allows you to create printer definitions that you can later associate with hosts.
- The FOG service looks at these associations and during service it will attempt to install any printers listed.  This service has three settings which define how the printers are managed
- In order for the printer to be added to the host computer, the printer drivers must be stored in a public area, or included on the host computer.
- This public area can be
    - a Novell Network share where public has read-only access, 
    - a Windows share that is public read-only to everyone,
    - or a Samba share (possibly residing  on the FOG server) that is public read-only to everyone.
    - This share must be accessible via a UNC path as the service may attempt to install the printers before drive mapping occurs.
    -  In this share the printer driver .inf file must exist.
- FOG supports installing:
    - IP based (Jet-Direct) printers, 
    - public access NDS printers, 
    - Local printers, 
    - windows share based printers,
    - (and we think, but could use a confirmation as it hasn't been tested) AD based printers.

.. note:: * If you wish to see what printers are included with Windows, open ``c:\windows\inf\ntprint.inf`` in a text editor.
    * You can also find what driver is being used by a printer in the advanced printer properties
    * ``printManagement.msc`` is also a helpful built-in windows tool that can show you all your installed printers, printer drivers, and printer ports

Printer Management Modes
------------------------

- Printer management for a host can be set to

    - **No Printer Management**
    
        This is the default setting for new hosts, it makes it so the FOG service does nothing to the hosts printers.
        This setting turns off all FOG Printer Management. Although there are multiple levels already between host and global settings, this is just another to ensure safety.

    - **Only Assigned Printers**
    
        Does as the name implies, and will only add/remove printers to the host machine if they are assigned in fog, it will not remove any existing printers that may be installed outside of the fog client.
        This setting will only allow FOG Assigned printers to be added to the host. Any printer that is not assigned will be removed including non-FOG managed printers.
        i.e. If some users have usb printers you want this option so fog doesn't remove any printers that aren't controlled by fog

    - **Fog Managed Printers**
    
        Will take full control of the hosts printing system and only allow for the printers that are specified by the FOG management console to exist on the host.
        This setting only adds and removes printers that are managed by FOG. 
        If the printer exists in printer management but is not assigned to a host, it will remove the printer if it exists on the unassigned host. 
        It will add printers to the host that are assigned.
        i.e. if you don't want users connecting their own usb printers and only having access to the printers 

Adding New Printers
===================

- To create a new printer definition click on the Printer icon |printer| on the system menu bar.
- Then on the left hand menu, click on **Add New Printer**.  
- You can copy from an existing printer and adjust settings if this printer is similar to another existing one
- You must choose a printer type and fill in the fields for that printer type (see below for details on each printer type) |add-printer|
- After all the required information is entered, click on the **Add Printer** button.

TCP/IP Printer
--------------

This is a printer connected to and directly accessible from the network. Or a printer connected directly to the computer.
It will be connected to through a windows printer port that will be created that points to the ip or hostname of the printer.
You can also create and include a printer config file to deploy custom printer preferences/properties/settings for these printers.

- **Printer Model** 

    This must match a name listed in the INF file 

- **Printer Alias**

    This can be anything you wish and it is what the end user will see when they use the printer.

- **Printer Description**

    This is a Description of the printer connection that is only visible in the FOG Gui. It has no effect on the client side connection.

- **Printer Port** 
    
    This is the name of the printer port. The ones made when you manullay add a printer in windows are usually something like ``LPT1:``, or ``IP_1.1.1.2``.
    You can give a friendlier name if you wish. You can also (theoretically) specify something like ``USB0:`` to connect to a USB printer. (needs testing)
    Each printer port name should be unique

- **Printer INF File**
    
    This is the path to the INF file for the printer driver. 
    It can either be a unc path to a public share or a file accessible to the client host locally

- **Printer IP** (optional)

     This is ip address of an IP based printers only, this can take the form of ``1.2.3.4:9100`` or ``1.2.4.5`` or ``printer-dns-hostname`` or ``printerName.domain.com``.  
     If the port doesn't exist already, it will create a printer TCP/IP port with the name given in the port field to point to this address

- **Printer Config File** (Optional)

    This is the local or remote path to a .dat file that will be imported to set the printers configurations (i.e. tray count, add-on modules, model specific settings, etc.). 
    
.. tip:: You can create the printer config file by manually by configuring an exising printer via the printer properties gui 
    and then running this command on the same computer ``RUNDLL32 PRINTUI.DLL,PrintUIEntry /Ss /n"Printer Name" /a "C:\Path\To\Save\ConfigFile.dat m f g p``
    You then just need to make sure the file is accessible to the client in a share or locally on the computer and put that path in this field just like the inf file.

iPrint Printer
--------------

A printer shared through a iPrint server

- **Printer Name/Alias**

    The path to the shared printer name/alias i.e. \\printerserver\printerName

- **Printer Description** (Optional)

    This is a Description of the printer connection that is only visible in the FOG Gui. It has no effect on the client side connection.

- **Printer Port**

    The name of the printer port

Network Printer
---------------

A printer shared through a windows computer or print server

- **Printer Name/Alias**

    The UNC share path to connect to the printer i.e. \\printServer\printerName

- **Printer Description** (Optional)

    This is a Description of the printer connection that is only visible in the FOG Gui. It has no effect on the client side connection.

CUPS Printer
------------

A printer shared through a linux CUPS setup

- **Printer Name/Alias**

    The UNC share path to connect to the printer i.e. \\printServer\printerName

- **Printer Description** (Optional)

    This is a Description of the printer connection that is only visible in the FOG Gui. It has no effect on the client side connection.

- **Printer INF File**
    
    This is the path to the INF file for the printer driver. 
    It can either be a unc path to a public share or a file accessible to the client host locally

- **Printer IP**

     This is ip address of the printer i.e ``1.2.4.5``


Linking Printers to Hosts
=========================

- Linking printers to hosts can be done from either the hosts section or the groups section.
- In the hosts section find the host you would like to add a printer to, click on the edit button associated with that host.
- In the host menu, click on the **Printers** button. 
- First select how you would like the host to be managed (see `Printer Management Modes`_)
- Then in the section below, select the printer(s) you would like to install from the drop down list and click on the **Add** button (refresh the page to see the added printers). |assign-printers|
- You can use the ``default`` radio button and the **Update** button to have fog control the default printer for the host after the printers are added
- You can remove printers by checking the boxes next to the assigned printers and hitting the **Remove** button (refresh the page to see the printers gone). |remove-printers|

Creating a Samba Based Printer Store on Fog
===========================================

If you do not have a public sever where you can store your printer drivers for the FOG Printer Manager, then it is very easy to set one up on the FOG server using Samba, so all your Windows Clients will be able to connect.
see also https://wiki.fogproject.org/wiki/index.php?title=Creating_a_Samba_Based_Printer_Store_on_FOG
