## Creating Custom FOG Service Modules {#creating_custom_fog_service_modules}

### Overview

Creating custom FOG Service modules are pretty easy to do if you know a
little c# and have access to Visual Studio (or Visual Studio Express).
Below we will attempt to walk someone through the process of creating a
custom fog service module. You will also need the fog installation
download package from sourceforge located at:

<http://sourceforge.net/project/showfiles.php?group_id=201099>

### Building a test module {#building_a_test_module}

In this example, I am using Visual Studio 2005, but these directions
should work for nearly any version.

1.  Start Visual Studio, then do a **File** -\> **New** -\> **Project**
2.  In the New Project dialog, select **Visual C#** -\> **Windows** -\>
    **Empty Project**
3.  Select a project name and a location to save the project, then click
    **OK**
4.  Copy **FOG
    Service\\src\\AbstractFogService\\bin\\Release\\AbstractFOGService.dll**
    from the download package to your project directory.
5.  Copy **FOG
    Service\\src\\AbstractFogService\\bin\\Release\\IniReaderObj.dll**
    from the download package to your project directory.
6.  In the Solution Explorer Window right-click on **References** and
    select **Add Reference**
7.  On the browse tab locate the two files copied to your project
    directory and add the reference.
8.  Right-click on your project and select **Add** -\> **New Item**
9.  Select Class and give your class a name, then click **Add**
10. Replace everything in that class with this template\
        using System;
        using System.Collections.Generic;
        using System.Text;
        using System.Data;
        using System.Net;
        using System.Collections;
        using System.Runtime.InteropServices;
        using Microsoft.Win32;
        using IniReaderObj;
        using System.IO;
        using FOG;

        namespace FOG 
        {

            public class MOD[yourmodulenamehere] : AbstractFOGService
            {


                private int intStatus;
                private String strFOGServerIP;

                private const String MOD_NAME = "FOG::MOD[yourmodulenamehere]";

                public MOD[yourmodulenamehere]()
                {
                    intStatus = STATUS_STOPPED;
                    log(MOD_NAME, "MODDEBUG constructed");
                }

                private Boolean readSettings()
                {
                    if (ini != null)
                    {
                        if (ini.isFileOk())
                        {
                            // Get the FOG Server IP Address or hostname
                            strFOGServerIP = ini.readSetting("fog_service", "ipaddress");
                            return true;
                        }
                    }
                    return false;
                }

                public override void mStart()
                {
                    try
                    {
                        // write something to the fog.log file
                        log(MOD_NAME, "Start Called");
                        intStatus = STATUS_RUNNING;

                        log(MOD_NAME, "Sleeping for 100 Seconds");
                        try
                        {
                            System.Threading.Thread.Sleep(100000);
                        }
                        catch { }

                        log(MOD_NAME, "Reading config settings...");
                        if (readSettings())
                        {
                            log(MOD_NAME, "Reading of config settings passed.");
                            doWork();
                        }
                        else
                        {
                            log(MOD_NAME, "Failed to read ini settings.");
                        }
                    }
                    catch ( Exception e )
                    {
                        log(MOD_NAME, e.Message);
                        log(MOD_NAME, e.StackTrace);
                    }
                }

                public override string mGetDescription()
                {
                    return "Your module name here - A short discription here.";
                }

                private void doWork()
                {
                    try
                    {
                        log(MOD_NAME, "Starting module processing...");

                    // get the mac addresses on the client box
                    String strMACAddress = "";
                        ArrayList alMACs = getMacAddress();
                        if ( alMACs != null )
                        {
                                for (int i = 0; i < alMACs.Count; i++)
                                {
                                    if (alMACs[i] != null)
                                    {
                                        // we take the first MAC address and use it
                                        strMACAddress = (String)alMACs[i];
                                        break;
                                    }
                                }
                            
                        } 
                        
                        if (strMACAddress != null )
                        {
                      // detect if a user is currently logged in
                            Boolean blLgIn = isLoggedIn();
                            if (blLgIn)
                            {
                                // get the users name
                                log(MOD_NAME, "Username: " + getUserName());
                            }
                            else
                                log(MOD_NAME, "No user is currently logged in");

                       // get the computers hostname
                             log(MOD_NAME, "Hostname: " + getHostName());
                        }
                        else
                        {
                            log(MOD_NAME, "Unable to continue, MAC is null!");
                        }

                    }
                    catch (Exception e)
                    {
                        pushMessage("FOG error:\n" + e.Message);
                        log(MOD_NAME, e.Message);
                        log(MOD_NAME, e.StackTrace);
                    }
                    finally
                    {
                    }
                    intStatus = STATUS_TASKCOMPLETE;
                    
                }

                public override Boolean mStop()
                {
                    log(MOD_NAME, "Shutdown complete");
                    return true;
                }

                public override int mGetStatus()
                {
                    return intStatus;
                }
            }
        }
11. Change the two instances of **MOD\[yourmodulenamehere\]** to
    something that makes sense like **MODMyModule** make sure both
    instances match.
12. Now we need to change a few properties of your project before it
    will compile, so right-click on your project in the Solution
    Explorer and select **properties**
13. In the application tab, change Assembly name to your module name,
    change the default namespace to **FOG**, and change Output type to
    **Class Library**
14. We can now compile the application by clicking on **Build** -\>
    **Build Solution**
15. Your dll file will now be waiting for you in \[your project
    folder\]/bin/debug directory
16. Copy only the new dll module (not the AbstractFOGService.dll, or
    IniReaderObj.dll) to a client computer running the fog service in
    the directory c:\\program files\\fog\\, then restart the fog service
    and your new module will run.

OK, we have a working module, but it really doesn\'t do anything yet, so
lets break down the code so it can be changed to fit your needs. The
first thing you will want to change when creating a new module is the
module name, and this has to be changed in two places and it they must
match. To change the module name module the line:

`...`\
`public class MOD[yourmodulenamehere] : AbstractFOGService`\
`...`

to something like:

`...`\
`public class MODMyModule : AbstractFOGService`\
`...`

You will also need to change:

`...`\
`public MOD[yourmodulenamehere]()`\
`...`

to

`...`\
`public MODMyModule()`\
`...`

When a fog module runs, the first thing that happens is that the module
is constructed, then when the FOG Service master process is ready to
start running the modules, the function **mStart()** is called. This is
basically the entry point of your module. During the course of execution
of your module there is a state variable that you should keep up to date
called, **intStatus**. This is used by the master service thread to
determine what is happening with the sub services. If they are running
or stopped. The valid states for this flag are:

-   STATUS_RUNNING
-   STATUS_STOPPED
-   STATUS_TASKCOMPLETE
-   STATUS_FAILED

One of the first things we try to do in mStart is to sleep for a fair
amount of time if the process we are doing does not need to run right at
service startup. The idea behind this is that the Windows startup
process can be very slow in the first place, so we don\'t want the fog
service to break the proverbial \"Camel\'s Back\".

After sleeping we call the function **readSettings** which pulls
settings from the fog configuration file which is local to the client
computer. If read settings returns true, then we call the function
**doWork**. This is where you should do the bulk of the processing for
your module should occur.

### AbstractFOGService.dll

There are a few functions that are build into the AbstractFOGService.dll
file that are also at your disposal. These include:

-   **log()** - This function takes two arguments, the first being the
    module identifier, which is typcially MOD_NAME, and the last
    argument being the message you want to log. The entry is written to
    a simple test file typically located at c:\\fog.log.
-   **getHostName()** - This will return the computers hostname as a
    string.
-   **getMacAddress()** - This function takes no arguments, and just
    returns an ArrayList of all the MAC addresses present on the client
    computer.
-   **getIPAddress()** - This function will return an ArrayList of IP
    addresses for the workstation.
-   **isLoggedIn()** - This function will let you know if any use is
    logged into the workstation.
-   **getUserName()** - This function will return the username of the
    current user on the workstation.
-   **getDateTime()** - A simple method that just provides a common date
    time string to all modules using the following:
    DateTime.Now.ToShortTimeString() + \" \" +
    DateTime.Now.ToShortDateString()
-   **restartComputer()** - Does as the name says and tries to restart
    the computer using the Microsoft recommended method using WMI
    (doesn\'t work on every host)
-   **shutdownComputer()** - This will shutdown the computer using the
    WMI call (doesn\'t work on every host)
-   **unmanagedExitWindows()** - This method is the unmanaged code call
    to restart/shutdown the workstation
-   **pushMessage()** - This method takes a single string as its
    argument, which is the message that should be pushed to a GUI window
    that will pop up in the upper right hand corner of the screen and
    remain active for 10 seconds. This is a good way to get information
    to the end user. This module requires the GUIWatcher module to be
    installed and active.
