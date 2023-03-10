.. include:: ../includes.rst

-----------------
Snapin Management
-----------------

|chromeMsiSnapin-vid|

.. === Snap-ins ===

.. ==== Overview ====

.. *The FOG Service has the ability to install snapins to the clients.  Snapins can be anything from whole applications like Microsoft Office to registry keys or desktop icons.  Snapins can even be used to uninstall applications or remove unwanted files.  For the end use's point of view, they will not even noticed that a snapin is being installed until it is complete.  At this point a message will notify them that a new application has been installed on their computer.  Snapins can be in MSI (0.17) or EXE formats, and can be created with any snapin creation tool like InstallRite or already packaged MSI files (0.17).  You can also push commands to the computer that include .vbs scripts / .cmd (commands) and .bat (batch scripts).

.. *Snapin return codes are specified by the program that's being installed.


.. ==== Creating a Snapin / Overview ====

.. FOG doesn't provide a tool to create snapins, but instead allows you to push files and execute them on the remote computers.  It is highly recommended that you push the actual installer to the computer instead of using a program such as InstallRite.  

.. If you have never silently installed software to a computer, or created an answer file for a program please look at the website Appdeploy [http://www.appdeploy.com/articles/ Link] This website has an trove of information on how to push software to a computer remotely.

.. ===== Creating a Snapin for larger applications with SFX Maker =====

.. Some larger applications such as Microsoft Office and Adobe Products (Acrobat / Creative Suite) require multiple files to install properly.  If you have an application that is not a single .exe please use SFX Maker.  This tool is free for non commercial use, and most programs fall under the GPL.  [http://www.isoft-online.com/ SFX Maker's Website]

.. For instructions on how to use this software please see the youtube videos below.

.. [http://www.youtube.com/watch?v=ZSMJLnRjn94 Office 2003 Install]
.. [http://www.youtube.com/watch?v=Qzc1Q9NW_cE Office 2007 Install]

.. SFX Maker takes an entire folder and encapsulates it or "folds" it into a single .exe which then "unfolds" to its original state and launches a file or command.

.. ===== Creating a Snapin with InstallRite =====

.. If for some reason you do wish to use Installrite please be aware it comes with issues and limitations (not compatible on all windows operating systems / can cause issues with the computer it is pushed to).  Below is an example of how to build a package with that software

.. In this example we will use Epsilon Squared's InstallRite which can be downloaded from http://www.epsilonsquared.com/installrite.htm.  This application will package up your snapin as an exe file which will be uploaded to the FOG server. 

.. <ol>
.. <li>To run InstallRite navigate to c:\program files\Epsilon Squared\InstallRite\InstallRite.exe</li>
.. <li>Click on "Install new software and create an InstallKit"</li>
.. <li>On the Configure screen, click Next.</li>
.. <li>On the Snapshot screen click next to create a new system snapshot.</li>
.. <li>On the next screen,click the browse button to select the application you wish to install, then click next.</li>
.. <li>When installation is complete InstallRite will come into focus, click the next button.  InstallRite will scan your system again.</li>
.. <li>Enter a name for your snapin.</li>
.. <li>Click "Build Install Kit"</li>
.. <li>Select "Quiet Installation Mode", Never reboot, even if needed, and "Never prompt the user and only overwrite older files"</li>
.. <li>Click OK and it will build your snapin.</li>
.. </ol>

.. ==== Preparing the FOG Server ====

.. If your snapin is larger than 2MB you will need to make two changes to the FOG server to allow uploads of larger than 2MB.

.. See also: [[Troubleshoot Web Interface]]

.. ===== Fedora =====


.. #On the FOG Server click on Applications -> Accessories -> Text Editor.
.. #Select Open and navigate to "/etc/php.ini"
.. #Change UPLOAD_MAX_FILESIZE to 1900MB (On a 32Bit OS don't set this value above 2GB)
.. #Change POST_MAX_SIZE to the same value.
.. #Save and close the text editor.
.. #Click on Applications ->System Tools -> Terminal and type "service httpd restart"

.. ===== Ubuntu =====

.. #sudo gedit /etc/php5/apache2/php.ini
.. #Change 
.. ##memory_limit = 1900M
.. ##post_max_size=1900M 
.. ##upload_max_filesize=1900M 
.. #Save Changes
.. #sudo /etc/init.d/apache2 restart


.. ===== VMWare =====

.. #sudo vim /etc/php5/apache2/php.ini
.. #Edit the following lines in the document (read below for assistance with working in VIM)
.. ##memory_limit = 1900M
.. ##post_max_size=1900M 
.. ##upload_max_filesize=1900M 


.. *To edit content in vim you will need to press the '''"I"''' key on your keyboard to enter input mode.
.. *Hitting the '''Escape''' key will bring you out of input mode.
.. *Once out of input mode type ''':w''' and then '''enter''' to save the file
.. *Restart FOG once the file has been saved

.. ==== Uploading the Snapin ====

.. [http://freeghost.sourceforge.net/videotutorials/CreateSnapin.swf.html Video Tutorial]

.. <ol>
.. <li>In the FOG Management Portal click on the Snapin Icon (Puzzle Pieces).</li>
.. <li>On the left-hand menu click on the New Snapin Button.</li>
.. <li>Enter a Snapin Name and Description.</li>
.. <li>Browse to the snapin file you wish to upload.</li>
.. <li>If you want the computer to restart after the snapin is installed click on the "Reboot after install"</li>
.. <li>Click "Add"</li>
.. </ol>



.. As of version 0.17, fog supports using typical msi files as snapin files.

.. If the snapin file is a msi file you must perform these additional steps:

.. <ol>
.. <li>Set '''Snapin Run With:''' to the path of msiexec.exe (ie: c:\windows\system32\msiexec.exe)</li>
.. <li>Set '''Snapin Run With Arguments:''' to '''/i'''</li>
.. <li>Set '''Snapin Arguments:''' to '''/qn'''</li>
.. </ol>

.. If the snapin file is a .vb script you must perform these additional steps:

.. <ol>
.. <li>Set '''Snapin Run With:''' to the path of cscript.exe (ie: c:\windows\system32\cscript.exe)</li>
.. </ol>



.. '''Documentation on list of support snapin's and command line arguments''' [[http://www.fogproject.org/wiki/index.php?title=Supported_Snapin%27s_and_Command_Line_Switches]]  There are MANY more supported applications that can be installed via command line arguments.  You might have better luck installing them directly via .EXE / .MSI / or scripting them via .VBS .  For more info on this consult the forums --[[User:Ssx4life|Ssx4life]] 09:04, 8 October 2009 (MST)

.. ==== Linking the Snapin to Hosts ====

.. In order for a snapin to be deployed it must be linked with a host.  To do this perform the following:

.. <ol>
.. <li>In the FOG Management Portal, click on the Hosts Icon.</li>
.. <li>Search for and select a host and click on the edit button.</li>
.. <li>Scroll down to the snapin section.</li>
.. <li>Select the snapin you just created from the drop-down box and click the "Add Snapin" button.</li>
.. </ol>

.. The next time you image the computer the FOG Service will attempt to install that snapin.  If you have problems, please see the fog log file located at c:\fog.log on the client PC.
