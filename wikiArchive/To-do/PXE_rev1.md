In basic terms PXE allows a computer to boot from a network server
instead of the local hard disk. With FOG, we use PXE to boot a small
linux image and kernel which is responsible for doing the actual imaging
process.

Excellent explanations are available at Wikipedia:

[Network booting](http://en.wikipedia.org/wiki/Network_booting)

[Preboot Execution
Environment](http://en.wikipedia.org/wiki/Preboot_Execution_Environment)

The way that PXE boot is used in FOG is as follows:

The client computer (also called \"Host\") is the one whose data needs
to be backed up to an image, or wiped and restored with a pre-existing
image made from an earlier backup process. And there are other tasks
that can be performed on it like memory testing, inventory of its
hardware and so on.

The computer that controls all this is the FOG server. The FOG server,
alongwith a web interface to manage the whole FOG setup, has a
**customisable and installable Linux \"init\" image**. It also has
excellent programs or scripts to edit this image.

Init is the thing that runs on the client and does the actual work of
imaging, deploying, backing up, memory testing, hardware inventory, etc.
*PXE is merely the mechanism of transferring the init image with correct
command line options to the client* computer. The exact protocol used to
transfer the binary file is [TFTP](TFTP "wikilink") (**Trivial File
Transfer Protocol**).

To **edit the init image to make it do custom things** after the
transferred (FOG server to PXE-booted OS-less client) kernel and init
load into the client active RAM, a **Boot Image Editor** utility is
provided in the **utils directory** in the standard FOG download
package.

If you are interested in knowing how FOG actually does the imaging, and
you have any basic working knowledge of the linux shell / bash, it is
***strongly advised*** that you run the Boot Image Editor on the FOG
server which is located at **/utils/Boot Image
Editor/FOGMountBootImage.sh**.

A file manager program (most likely Nautilus) will open and take you to
**/tmp/tmpMnt** inside which there is a **/bin** directory.

Do not make any changes, just go through the whole lot of things that
are present in it. In there, look for some of the following shell script
files :

    fog           fog.man.reg   fog.statusreporter fog.wipe
    fog.auto.reg  fog.chntpw    fog.photorec       fog.surfacetest
    fog.av        fog.chpass    fog.quickimage     fog.testdisk
    fog.capone    fog.debug     

Each of these is responsible for one of the actions that you issue
commands for, from the web interface under the Tasks menu, including
Advanced Tasks.

Opening these files using any simple text editor reveals that these are
**scripts that will run on the *client machine* after the entire init
binary gets loaded into the client RAM** and begin execution.

Thus, by editing the files in the tmpMnt mounted boot image of init, you
can make those commands/scripts run on the client when the client boots
into PXE.

So for example, if you want to change the words or phrases on the PXE
menu, you have to follow these steps:

-   open up the Boot Image Editor on the FOG server
-   go to /bin in /tmpMnt on the FOG server
-   locate the fog.whatever file
-   edit it
-   save it (Ctrl+S, if you use most GUI editors)
-   close the editor and file manager windows, upon doing which you will
    be take back to the command screen that you used to start the Boot
    Image Editor script.
-   press Enter when prompted, which takes the scripts you modified and
    merges them to produce a modified init binary.
-   Henceforth, when imaging/testing/deploying, once init is loaded into
    any client machine using PXE boot, your modifications to the code
    will reflect in the menu display and perform any other actions you
    added to the scripts.
-   In this way you can make the PXE booted client **do practically
    anything you want**.

By default, FOG uses only basic backup, restore, multicast, memtest and
similar diagnosic activities out of this vast scope of possibilities. If
you know a **decent bit of shell scripting**, you can make any client do
anything you want it to.

-   The **standard way** to do this is to include your modifications
    **as a plugin with some scripts** and some addition to the web UI
    interface simply to make it convenient to manage the functionality
    of your plugin.
-   **[Capone](Capone "wikilink")** is one such plugin which does a
    remarkable job of **automatically identifying which PC make** the
    client is and **auto-imaging it using a prearranged association** of
    its hardware identification and a standard pre-configured OS image.
