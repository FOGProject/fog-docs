# Snapin Management

## Overview

-   The FOG Service has the ability to install snapins to the clients. Snapins can be anything from whole applications like Microsoft Office to registry keys or desktop icons. Snapins can even be used to uninstall applications or remove unwanted files. For the end use's point of view, they will not even noticed that a snapin is being installed until it is complete. At this point a message will notify them that a new application has been installed on their computer. Snapins can be in MSI (0.17) or EXE formats, and can be created with any snapin creation tool like InstallRite or already packaged MSI files (0.17). You can also push commands to the computer that include .vbs scripts / .cmd (commands) and .bat (batch scripts).

-   Snapin return codes are specified by the program that's being installed.

  

## Creating a Snapin / Overview

FOG doesn't provide a tool to create snapins, but instead allows you to push files and execute them on the remote computers. It is highly recommended that you push the actual installer to the computer instead of using a program such as InstallRite.

If you have never silently installed software to a computer, or created an answer file for a program please look at the website Appdeploy [Link](http://www.appdeploy.com/articles/) This website has an trove of information on how to push software to a computer remotely.

### Creating a Snapin for larger applications with SFX Maker

Some larger applications such as Microsoft Office and Adobe Products (Acrobat / Creative Suite) require multiple files to install properly. If you have an application that is not a single .exe please use SFX Maker. This tool is free for non commercial use, and most programs fall under the GPL. [SFX Maker's Website](http://www.isoft-online.com/)

For instructions on how to use this software please see the youtube videos below.

[Office 2003 Install](http://www.youtube.com/watch?v=ZSMJLnRjn94) [Office 2007 Install](http://www.youtube.com/watch?v=Qzc1Q9NW_cE)

SFX Maker takes an entire folder and encapsulates it or "folds" it into a single .exe which then "unfolds" to its original state and launches a file or command.

### Creating a Snapin with InstallRite

If for some reason you do wish to use Installrite please be aware it comes with issues and limitations (not compatible on all windows operating systems / can cause issues with the computer it is pushed to). Below is an example of how to build a package with that software

In this example we will use Epsilon Squared's InstallRite which can be downloaded from [http://www.epsilonsquared.com/installrite.htm](http://www.epsilonsquared.com/installrite.htm). This application will package up your snapin as an exe file which will be uploaded to the FOG server.

1.  To run InstallRite navigate to c:\program files\Epsilon Squared\InstallRite\InstallRite.exe
2.  Click on "Install new software and create an InstallKit"
3.  On the Configure screen, click Next.
4.  On the Snapshot screen click next to create a new system snapshot.
5.  On the next screen,click the browse button to select the application you wish to install, then click next.
6.  When installation is complete InstallRite will come into focus, click the next button. InstallRite will scan your system again.
7.  Enter a name for your snapin.
8.  Click "Build Install Kit"
9.  Select "Quiet Installation Mode", Never reboot, even if needed, and "Never prompt the user and only overwrite older files"
10.  Click OK and it will build your snapin.

## Preparing the FOG Server

If your snapin is larger than 2MB you will need to make two changes to the FOG server to allow uploads of larger than 2MB.

See also: [Troubleshoot Web Interface](https://wiki.fogproject.org/wiki/index.php?title=Troubleshoot_Web_Interface "Troubleshoot Web Interface")

### Fedora

1.  On the FOG Server click on Applications -> Accessories -> Text Editor.
2.  Select Open and navigate to "/etc/php.ini"
3.  Change UPLOAD_MAX_FILESIZE to 1900MB (On a 32Bit OS don't set this value above 2GB)
4.  Change POST_MAX_SIZE to the same value.
5.  Save and close the text editor.
6.  Click on Applications ->System Tools -> Terminal and type "service httpd restart"

### Ubuntu

1.  sudo gedit /etc/php5/apache2/php.ini
2.  Change
    1.  memory_limit = 1900M
    2.  post_max_size=1900M
    3.  upload_max_filesize=1900M
3.  Save Changes
4.  sudo /etc/init.d/apache2 restart

  

### VMWare

1.  sudo vim /etc/php5/apache2/php.ini
2.  Edit the following lines in the document (read below for assistance with working in VIM)
    1.  memory_limit = 1900M
    2.  post_max_size=1900M
    3.  upload_max_filesize=1900M

  

-   To edit content in vim you will need to press the **"I"** key on your keyboard to enter input mode.
-   Hitting the **Escape** key will bring you out of input mode.
-   Once out of input mode type **:w** and then **enter** to save the file
-   Restart FOG once the file has been saved

## Uploading the Snapin

[Video Tutorial](http://freeghost.sourceforge.net/videotutorials/CreateSnapin.swf.html)

1.  In the FOG Management Portal click on the Snapin Icon (Puzzle Pieces).
2.  On the left-hand menu click on the New Snapin Button.
3.  Enter a Snapin Name and Description.
4.  Browse to the snapin file you wish to upload.
5.  If you want the computer to restart after the snapin is installed click on the "Reboot after install"
6.  Click "Add"

  

As of version 0.17, fog supports using typical msi files as snapin files.

If the snapin file is a msi file you must perform these additional steps:

1.  Set **Snapin Run With:** to the path of msiexec.exe (ie: c:\windows\system32\msiexec.exe)
2.  Set **Snapin Run With Arguments:** to **/i**
3.  Set **Snapin Arguments:** to **/qn**

If the snapin file is a .vb script you must perform these additional steps:

1.  Set **Snapin Run With:** to the path of cscript.exe (ie: c:\windows\system32\cscript.exe)

  

**Documentation on list of support snapin's and command line arguments** 
<!-- (http://www.fogproject.org/wiki/index.php?title=Supported_Snapin%27s_and_Command_Line_Switches)]  -->
There are MANY more supported applications that can be installed via command line arguments. You might have better luck installing them directly via .EXE / .MSI / or scripting them via .VBS . For more info on this consult the forums --[Ssx4life](https://wiki.fogproject.org/wiki/index.php?title=User:Ssx4life&action=edit&redlink=1 "User:Ssx4life (page does not exist)") 09:04, 8 October 2009 (MST)

## Linking the Snapin to Hosts

In order for a snapin to be deployed it must be linked with a host. To do this perform the following:

1.  In the FOG Management Portal, click on the Hosts Icon.
2.  Search for and select a host and click on the edit button.
3.  Scroll down to the snapin section.
4.  Select the snapin you just created from the drop-down box and click the "Add Snapin" button.

The next time you image the computer the FOG Service will attempt to install that snapin. If you have problems, please see the fog log file located at c:\fog.log on the client PC.