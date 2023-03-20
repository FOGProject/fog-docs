Under construction.

See also: [Snapin Examples](Snapin_Examples "wikilink")

# SnapinPacks Brief Overview {#snapinpacks_brief_overview}

SnapinPacks are a new feature specific to FOG 1.3.0 and the new FOG
Client (version 0.11.3+). The key ability that SnapinPacks allow is to
deploy many files to hosts, and execute one of those files with any
needed arguments.

For example, you may deploy driver files to a host with a single
SnapinPack. With those files, you can include a script which would run
and place the drivers where they need to be. Another example would be
bundling a dozen different MSI files, and include a script that runs
each MSI with it\'s individual needed arguments if any. Another example
would be larger silent installations such as Adobe Creative Cloud or
Microsoft Office; both of these have silent installations with many
files and would be well suited for SnapinPacks.

# Snapins Are Silent {#snapins_are_silent}

SnapinPacks must be silent, this requirement has not changed. What is a
silent snapin? A silent snapin requires zero interaction to run. If at
any point the snapin asks for input from a user, it will simply wait for
input that will never come, and indefinitely hang.

# Snapins Run as SYSTEM or root {#snapins_run_as_system_or_root}

All Snapins including SnapinPacks run as the
`<font color="red">`{=html}SYSTEM`</font>`{=html} or
`<font color="red">`{=html}root`</font>`{=html} user\'s security
context. If a snapin or SnapinPack runs successfully by manual execution
but not via the FOG Client - this is typically related to the security
context. For example, say you have a shared directory that is granted
read access for all `<font color="red">`{=html}Domain
Users`</font>`{=html}. Well, an individual host\'s local
`<font color="red">`{=html}SYSTEM`</font>`{=html} or
`<font color="red">`{=html}root`</font>`{=html} account is not a member
of `<font color="red">`{=html}Domain Users`</font>`{=html}. Therefore,
unless alternative credentials are supplied to access the share, any
script executed that tries to read this share will not work. There are a
few solutions to this. Granting the share read access for anonymous
users is the most simple. Specifying credentials within scripts or as
arguments are viable options.

# SnapinPacks are Compressed {#snapinpacks_are_compressed}

Unlike a normal Snapin where a single file is uploaded to the Fog
server, SnapinPacks are a collection of files that are compressed with
the .zip format. The organization of files inside the .zip file is up to
you, but you must supply FOG with the path to the executable inside the
.zip file. This can be confusing to newcomers, so below are two generic
examples of how it works.

The new FOG Client extracts the .zip file to a directory with the name
of the SnapinPack, On Windows it is in this location:
`<font color="red">`{=html}C:\\Program Files
(x86)\\FOG\\tmp\\Snapin-Pack-Name`</font>`{=html}

If the .zip file extracts a folder with files, this internal folder\'s
name does not change, but it is still all placed within a parent
directory named with the SnapinPack\'s name. For instance, if I had a
SnapinPack called \"`<font color="red">`{=html}abc`</font>`{=html}\",
and I uploaded a .zip file to the FOG server for it called
\"`<font color="red">`{=html}def.zip`</font>`{=html}\", and within that
.zip file there was a folder called
\"`<font color="red">`{=html}ghi`</font>`{=html} and within that folder,
a file called \"`<font color="red">`{=html}jkl.bat`</font>`{=html}\".

-   The FOG Client would create a directory called \"C:\\Program Files
    (x86)\\FOG\\tmp`<font color="red">`{=html}\\abc`</font>`{=html}\"
-   The FOG Client would extract everything in the .zip file into the
    above path.
-   The folder inside the .zip file is now at \"C:\\Program Files
    (x86)\\FOG\\tmp`<font color="red">`{=html}\\abc\\ghi`</font>`{=html}\"
-   The executable\'s path would be \"C:\\Program Files
    (x86)\\FOG\\tmp`<font color="red">`{=html}\\abc\\ghi\\jkl.bat`</font>`{=html}\"
-   The FOG Client\'s variable
    `<font color="red">`{=html}\[FOG_SNAPIN_PATH\]`</font>`{=html} for
    this SnapinPack expands to \"C:\\Program Files
    (x86)\\FOG\\tmp`<font color="red">`{=html}\\abc`</font>`{=html}\" at
    runtime.
-   To path further past the
    `<font color="red">`{=html}\[FOG_SNAPIN_PATH\]`</font>`{=html}
    variable, just append after it as in the provided example, include
    any folder paths, and the desired executable.

So for example, you have created in FOG a snapin called
\"`<font color="red">`{=html}common-things`</font>`{=html}\". For this
snapin, you upload a .zip file called
\"`<font color="red">`{=html}All-common-things`</font>`{=html}\". The
FOG Client will create a directory called:
`<font color="red">`{=html}C:\\Program Files
(x86)\\FOG\\tmp\\common-things`</font>`{=html} and everything inside of
the .zip file will be extracted into this new directory. The FOG Client
will then attempt to execute the specified executable in this new
directory.

Let\'s say the SnapinPack had two files. A batch file and an msi file,
`<font color="red">`{=html}run.bat`</font>`{=html} and
`<font color="red">`{=html}install.msi`</font>`{=html}. These files
would be extracted to a directory named with the SnapinPack\'s name -
not the .zip file\'s name. Continuing with the above example, their
locations would be:

`<font color="red">`{=html}C:\\Program Files
(x86)\\FOG\\tmp\\common-things\\run.bat`</font>`{=html}

and

`<font color="red">`{=html}C:\\Program Files
(x86)\\FOG\\tmp\\common-things\\install.msi`</font>`{=html}

The file we wish to run is
`<font color="red">`{=html}run.bat`</font>`{=html}. In the SnapinPack
configuration, we see the field \"Snapin Pack Arguments\". If you have
used the template for SnapinPacks, and then chosen an appropriate
template for what type of executable, this field will be filled in for
you mostly, but you must still edit it.

In this case, we want to run a batch file, so after selecting the Snapin
Type\'s SnapinPack choice and then picking the Snapin Pack Template\'s
Batch File choice, we find that the Snapin Pack Arguments is filled in
with `<font color="red">`{=html}/c
\"\[FOG_SNAPIN_PATH\]\\MyScript.bat\"`</font>`{=html}.

In this argument,
`<font color="red">`{=html}\[FOG_SNAPIN_PATH\]`</font>`{=html} is a
variable within the FOG Client that is expanded during run-time of the
snapin pack. This means you do not need to change this. The
`<font color="red">`{=html}\[FOG_SNAPIN_PATH\]`</font>`{=html} portion,
continuing the above example, would be expanded to:
\"`<font color="red">`{=html}C:\\Program Files
(x86)\\FOG\\tmp\\common-things`</font>`{=html}\" and then the rest of
the argument would add on the other piece
\"`<font color="red">`{=html}\\MyScript.bat`</font>`{=html}\". So
putting these together, you get \"`<font color="red">`{=html}C:\\Program
Files (x86)\\FOG\\tmp\\common-things\\MyScript.bat`</font>`{=html}\"

Of course, in this example, we don\'t want to run \"MyScript.bat\"
because it doesn\'t exist. We want to execute
`<font color="red">`{=html}run.bat`</font>`{=html}. So, we simply edit
the Snapin Pack Arguments, remove the generic executable name, and place
our desired executable name.

You may also get the working directory of the script at runtime instead
of hard-coding the absolute path to the SnapinPack directory as below.

-   PowerShell 2 and above: `<font color="red">`{=html}\$scriptDir =
    split-path -parent
    \$MyInvocation.MyCommand.Definition`</font>`{=html}
-   PowerShell 3 and above:
    `<font color="red">`{=html}\$PSScriptRoot`</font>`{=html}
-   Batch Scripts: `<font color="red">`{=html}%\~dp0`</font>`{=html}
-   BASH script: `<font color="red">`{=html}cwd=\"\$(cd \"\$(dirname
    \"\${BASH_SOURCE\[0\]}\")\" && pwd)\"`</font>`{=html}

# Creating a SnapinPack {#creating_a_snapinpack}

## Create New SnapinPack in FOG {#create_new_snapinpack_in_fog}

-   **1.** Place all needed files in a folder. Right click the folder,
    choose to compress it. There are different menus for compressing
    depending on the OS you\'re using. Linux, Windows, and OSX
    SnapinPacks must use the .zip format.

```{=html}
<!-- -->
```
-   **2.** Access your FOG server\'s web interface via
    `<font color="red">`{=html}x.x.x.x/fog/management`</font>`{=html}
    and log in.

```{=html}
<!-- -->
```
-   **3.** Click the Snapin Management icon on the FOG Ribbon, it\'s at
    the top, here:

<figure>
<img src="Snapin_Management.png" title="Snapin_Management.png" />
<figcaption>Snapin_Management.png</figcaption>
</figure>

-   **4.** On the *left* of the Snapin Management page, click \"Create
    New Snapin.\"

<figure>
<img src="Create_New_Snapin.png" title="Create_New_Snapin.png" />
<figcaption>Create_New_Snapin.png</figcaption>
</figure>

-   **5.** Give the SnapinPack a name, Choose the correct Snapin Storage
    Group, and then click the arrow for Snapin Type and select Snapin
    Pack.

<figure>
<img src="SelectSnapinPack.png" title="SelectSnapinPack.png" />
<figcaption>SelectSnapinPack.png</figcaption>
</figure>

-   **6.** Choose the appropriate SnapinPack template. There are several
    templates available. For example, if the SnapinPack only runs an
    EXE, choose EXE. If it only runs an MSI, choose MSI. If it only runs
    a BASH script, choose Bash Script. If it only runs a batch file
    (`<font color="red">`{=html}.bat`</font>`{=html}), choose Batch
    Script. SnapinPacks are **not** limited to the templates available.

<figure>
<img src="SnapinPack_Templates.png" title="SnapinPack_Templates.png" />
<figcaption>SnapinPack_Templates.png</figcaption>
</figure>

-   **7.** Edit the Snapin Pack Arguments as appropriate. If your .zip
    file has within it a folder, you would need to include the folder\'s
    name between
    \"`<font color="red">`{=html}\[FOG_SNAPIN_PATH\]`</font>`{=html}\"
    and the path to the executable. For example, let\'s say the .zip
    file contains a folder called
    \"`<font color="red">`{=html}test-pack`</font>`{=html}\", and within
    this folder we desire to execute a Batch Script called
    \"`<font color="red">`{=html}install-common-things.bat`</font>`{=html}\"
    We would make our Snapin Pack Arguments as follows:
    -   `<font color="red">`{=html}\"\[FOG_SNAPIN_PATH\]\\test-pack\\install-common-things.bat\"`</font>`{=html}

```{=html}
<!-- -->
```
-   **8.** Choose the .zip file you prepared in step **1.** by clicking
    the \"Browse\" button, and browsing to the .zip file and select it.

```{=html}
<!-- -->
```
-   **9.** (optional) Check the \"Snapin Arguments Hidden?\" checkbox to
    hide the arguments of the Snapin. This is helpful if you send
    passwords to the Snapin via arguments. It\'s un-helpful when trying
    to troubleshoot.

```{=html}
<!-- -->
```
-   **10.** (optional) Check or uncheck the \"Replicate?\" checkbox as
    you see appropriate. The default is checked, which means the
    SnapinPack will replicate to all storage nodes that are enabled
    members of the selected Snapin Storage Group from Step **5.**
    Disabling this option means the SnapinPack may only be
    \"downloaded\" by hosts from the master of the selected Snapin
    Storage Group.

```{=html}
<!-- -->
```
-   **11.** (optional) Select if you would want hosts that this
    SnapinPack is deployed to - to reboot after completion, or shutdown
    after completion. If a shutdown or reboot is required, you
    **`<font color="red">`{=html}must use this option`</font>`{=html}**
    to reboot or shutdown instead of scripting it. Scripting a shutdown
    or reboot means the FOG Client cannot report success or failure of
    the SnapinPack\'s completion, the Snapin task will remain in queue,
    and the host will re-attempt to install the SnapinPack the next time
    it boots, resulting in a **reboot loop**.

```{=html}
<!-- -->
```
-   **12.** Examine the \"Snapin Command\" at the bottom of the options.
    Does it look right? For troubleshooting, you may place the
    non-zipped SnapinPack on a host, and replace \[FOG_SNAPIN_PATH\]
    with the full path to the un-zipped SnapinPack files, and run the
    command with the OS\'s appropriate run dialog (run, terminal,
    powershell, etc).

```{=html}
<!-- -->
```
-   **13.** Click the \"ADD\" button at the bottom when you are
    satisfied with your SnapinPack.

## Deploying a SnapinPack {#deploying_a_snapinpack}

# Examples

## Very thorough example {#very_thorough_example}

External Video Link:

[Chrome SnapinPack FOG 1.3.0 Example and
Explanation](https://www.youtube.com/watch?v=vIGbm5wvMC4)

Video:
`<embedvideo service="youtube">`{=html}<https://www.youtube.com/watch?v=vIGbm5wvMC4>`</embedvideo>`{=html}

## Batch Script - deploy wireless profile {#batch_script___deploy_wireless_profile}

External Video Link:

[Deploy Wireless Profile SnapinPack FOG 1.3.0
Example](https://www.youtube.com/watch?v=M-HXtqeukks)

Video:
`<embedvideo service="youtube">`{=html}<https://www.youtube.com/watch?v=M-HXtqeukks>`</embedvideo>`{=html}

Reference file seen in video:

    To export a wireless profile:
    netsh wlan export profile "1480" folder=%USERPROFILE%\Desktop

    To import a wireless profile:
    netsh wlan add profile filename="c:\The\Path\Goes\Here\1480.xml" user=all


    Delay script by 30 seconds:
    PING 127.0.0.1 -n 30 >NUL 2>&1 || PING ::1 -n 30 >NUL 2>&1

    Set order of prefered SSIDs:
    netsh wlan set profileorder name="1480" interface="Wi-Fi" priority=1
    netsh wlan set profileorder name="1337" interface="Wi-Fi" priority=2


    FOG SnapinPack Path + snapin pack name (NOT .zip file name).
    C:\Program Files (x86)\FOG\tmp

## BASH Script {#bash_script}

## VB Script {#vb_script}

## PowerShell Script {#powershell_script}

## EXE

## Mono
