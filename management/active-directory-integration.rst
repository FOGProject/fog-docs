.. include:: /includes.rst

----------------------------
Active Directory Integration
----------------------------


.. === Active Directory Integration ===

.. ==== Setup ====

.. ===== Overview =====

.. FOG has the ability to register a host with Active Directory, in a limited sense.  Versions of FOG up to and including 0.28 rely on the netdom.exe executable that is provided as part the support tools on the Windows installation media.  In order for Active Directory integration to function, your image will need to have the FOG service installed, along with the Windows Support Tools.

.. Versions of FOG from (and including) 0.29 have this functionality built in and do NOT require netdom.exe or the support tools to be installed.

.. It is also very important that before capturing your image that the computer is NOT a member of any domain.

.. ===== Security =====

.. <font color="red">Note: The below statement applies to older FOG versions (1.2.0 and below). When using FOG 1.3.0 and above in conjunction with the NEW fog client, this step is not needed. See [https://wiki.fogproject.org/wiki/index.php?title=FOG_Client here] for more information.</font>


.. '''Important - Please read!'''

.. In order to add a computer to a domain, FOG requires a username and password of an account that has rights to the OU where the computer objects are stored in the domain tree.  This user account should have rights to join computers to the Domain, as well as sufficient rights to create/manage computer objects.  FOG attempts to keep your password secure by encrypting it, but since FOG is open source, it is possible for someone to decrypt your password if you don't change the FOG "Passkey."  It is highly recommended that you change this Passkey before implementing the AD integration in a production environment.  Changing the Passkey requires you to recompile the FOG Service's Hostname change module, but don't panic this isn't hard and only need to be done one time.  Please see the documentation below.

.. ===== Preparing the Image =====

.. Before capturing an image to FOG that you would like to use with Active Directory, please ensure that the image:

.. <ul>
.. <li>is NOT a member of the domain, change the computer membership to workgroup instead.</li>
.. <li>has  support tools installed (Not required for FOG versions from 0.29).</li>
.. <li>has the FOG service installed.</li>
.. </ul>

.. ===== FOG Setup =====

.. To setup a host to use AD, navigate to the hosts section of the FOG management portal.  

.. <ol>
.. <li>Search for, and select a host. </li>
.. <li>Click on the Edit button</li>
.. <li>Scroll down to the Active Directory section.</li>
.. <li>Check the box next to Join Domain after image task</li>
.. <li>Enter the domain NETBIOS name (i.e. MYDOMAIN, not mydomain.com).</li>
.. <li>Enter the Organizational Unit where you would like to have the computer stored in AD.  Leave if blank for the default. (Must be in LDAP format).</li>
.. <li>Enter the user name that has access to the computer objects. Do not include the domain name if you are running version 1.2 (your mileage may vary with earlier versions). Development version of FOG will accept a name with or without domain ('''username ''OR'' mydomain/username''').</li>
.. <li>Enter the encrypted password.  This password must be encrypted with the [[FOGCrypt]] utility.  This utility is located in the FOGCrypt folder of the FOG download package.  It is a Windows (.NET) command line application.</li>
.. <li>Click Update.</li>
.. </ol>

.. The next time you image that computer the service will attempt to register the host with the domain information provided.  If you have problems please refer to the FOG Service log file located in c:\fog.log

.. ===== Making AD Integration Easier =====

.. As of version 0.20 of FOG, we have made it a bit easier to manage AD settings in FOG, by allowing for default settings for AD.  This will allow the easy population of the domain, OU, username, and password.  To set this feature up perform the following:

.. # Go to '''Other Information''' -> '''FOG Settings'''
.. # Set your default values for the following:
.. ## FOG_AD_DEFAULT_DOMAINNAME
.. ## FOG_AD_DEFAULT_OU
.. ## FOG_AD_DEFAULT_USER
.. ## FOG_AD_DEFAULT_PASSWORD (MUST BE ENCRYPTED!)

.. To test everything out, go to a host that doesn't have anything setup for AD, and click on the edit button for that host.  Go to the host menu, and select Active Directory.  Click on the '''Join Domain after image task:''' button and all your default values should be populated.

.. ==== Securing Active Directory Integration ====

.. ===== Overview =====

.. In order to add a computer to a domain, FOG requires a username and password that has rights to the OU where the computer objects are stored in the domain tree.  FOG attempts to keep your password secure by encrypting it, but since FOG is open source and the methods used to encrypt the password are open for all to see, it is possible for someone to decrypt your password if you don't change the FOG "Passkey."  It is highly recommended that you change this Passkey before implementing the AD integration in a production environment.  Changing the Passkey requires you to recompile the FOG Service's Hostname change module, but don't panic this isn't hard and it only needs to be done one time. 

.. ===== The Development Environment =====

.. The hostname change module is written in c#, so in order to recompile it you will need to download Microsoft's Visual Studio Express Edition for C#.  This can be downloaded from: 

.. http://www.microsoft.com/express/vcsharp/

.. Install Visual Studio with the standard options.

.. ===== Getting the Source =====

.. After Visual Studio Express is installed now we need to get the source code for the hostname change module.  This is part of FOG download/installation package. This package can be downloaded from:

.. http://sourceforge.net/project/showfiles.php?group_id=201099 

.. Extract this package, then navigate to  "FOG Service\src\FOG_HostNameChanger\"

.. Double-click on HostNameChange.sln to open the project. 

.. If you are asked to convert the project to the latest version, click the Finish button.

.. If you are using Visual Studion 2010, you need to change the target .NET framework to .NET 2.0. Do this by going to Project > hostnamechanger properties. On the Application tab, change the Target Framework to .NET 2.0 

.. Once the project has opened, on the right-hand panel, in the "Solution Explorer", double-click on MOD_HostNameChanger.cs.

.. After do so, you should get the source code to display in the main panel, scroll down to the line:

..  private const String PASSKEY = "FOG-OpenSource-Imaging"; 

.. Change  '''FOG-OpenSource-Imaging''' to anything you like, just remember what you change it to, as you will need it later.

.. Then click File  -> Save All.

.. Then click Build -> Build Solution.

.. This will recompile the hostname change module with your unique key.

.. Now navigate to  "FOG Service\src\FOG_HostNameChanger\bin\Release"

.. Copy only the file HostnameChange.dll to "FOG Service\src\FOG Service\bin\Release" (overwrite existing file).

.. Navigate to  "FOG Service\src\FOG Service\"

.. Open the solution by double-clicking "FogService.sln"

.. If you are asked to convert the project to the latest version, click the Finish button.

.. If you are using Visual Studion 2010, you need to change the target .NET framework to .NET 2.0. Do this by going to Project > FOGService properties. On the Application tab, change the Target Framework to .NET 2.0 

.. Change the build configuration from debug to release

.. Right click on "FOG Service Install" and click "Build"

.. Navigate to "FOG Service\src\FOG Service Installer\Release"

.. Select the 2 files, right-click -> Send To -> Compressed Folder

.. Copy the .zip file to your FOG Server "/var/www/html/fog/client". Overwrite the existing file.

.. ===== Encrypting Your Password =====

.. Now that we have changed the passkey, we need you update the FOGCrypt ini file to use this new passkey.  

.. Navigate to the FOGCrypt\etc directory from the FOG download package.

.. Open the config.ini file and change the passkey value to your new passkey, then save the file.

.. Now open a command window and  navigate using the cd command to the FOGCrypt directory.

.. Type:

..  FOGCrypt [password]

.. Where [password] is the AD user's password that has rights to the Computers section of the AD tree.

.. The output from this command is what you will enter in the FOG management portal.



