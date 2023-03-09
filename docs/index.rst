.. include:: /includes.rst

=========================================
Welcome to the Fog Project documentation!
=========================================

| Fog Project is really cool
| This documentation is under construction
| We are slowly moving from wiki.fogproject.org to here
| Once all existing docs are moved over we'll start updating the docs

..    This comment block is a guide on the syntax the title panels
..    .. Section Name (put the name of the section in a title heading, this won't be visible)

..    ============
..    Installation
..    ============

..    .. Link to main page for section. Follow this example to create a link with the text of the section name but it goes to specific page and heading 
..    .. that you might consider the main starting page of the section. We aren't maintaining a homepage for each section as it creates circular toc issues

..    :ref:`Installation <installation/install_fog_server:Install FOG server>`
   
..    .. Create a bulleted list summary of what is found in the section

..    - Documentation on the installation of fogserver
      
..    .. Hidden Table of contents for section (displayed in left sidebar under given caption)
..    .. Using the glob makes it so we can use the wildcard. However this also makes it alphabetical, you have to manually put in each file path if you
..    .. want to specify a specific display order. Make sure to set the 'Caption' to the name of the section then list the folder name appended with '/*'
..    .. to get all the top level files into that toc

.. .. toctree::
..    :maxdepth: 6
..    :hidden:
..    :glob:
..    :caption: Installation
      
.. installation/*

..   .. The '---' signifies the end of a panel 

..   ---

.. panels::

   :ref:`Introduction <introduction/introduction:What is FOG>`

   - An introduction to what fog is

   ---

   :ref:`Installation <installation/install_fog_server:Install FOG server>`
   
   - Documentation on the installation of fogserver

   ---

   :ref:`Getting Started <getting_started/capture_an_image:Capture an Image>`
      
   - Get started with common tasks/how-tos and concepts of using fog
   - Includes things like how to capture and deploy images

   ---

   :ref:`Management <management/dashboard:Dashboard>`
   
   - Documentation related to using the management tools available in the fog web UI
   - These sections explain what can be done in each of the fog ui menus and some of the basic how-tos

   ---

   :ref:`Customization <customization/ipxe/ipxe:Customizing FOG iPXE Settings>`

   - Docs related to customizing various parts of fog

   ---

   :ref:`hardware/hardware:Supported Hardware`

   - Docs relating to what hardware is known to work

   ---

   :ref:`integrations/integrations:integrations`

   - Documentation related to fog plugins and other Integrations
   - This includes articles on how to do common setup for some services fog can utilize from other windows or linux servers (or can be added to the same server) 

   ---

   :ref:`troubleshooting/troubleshooting:Troubleshooting`

   - Docs related to Troubleshooting common issues

   ---

   :ref:`Reference <reference/install_fogsettings:The .fogsettings file>`

   - Other reference material related to fog
   - Includes things such as command line args or settings file definitions
   - Also contains docs that don't fit anywhere else

   ---

   :ref:`FAQ/faq:FAQs`

   - Common questions with detailed answers

   ---

   `Fog Forums <https://forums.fogproject.org>`_

   - Search for solutions to your problems or ask the community for help

   ---

   `Fog Project Github repos <https://github.com/FOGProject>`_

   - Browse the opensource code for FOGProject

   ---

   `Fog Home Page <https://fogproject.org>`_

   - The homepage of the FOG Project
   
.. toctree::
   :maxdepth: 0
   :glob:
   :titlesonly:

   /introduction/introduction
   /installation/installation
   /tasks/tasks
   /management/management
   /customization/customization
   /hardware/hardware
   /integrations/integrations
   /troubleshooting/troubleshooting
   /FAQ/FAQ
   /reference/reference

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

