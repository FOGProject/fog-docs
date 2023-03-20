`<font color="red">`{=html}NOTE:`</font>`{=html}The material in this
article is very dated. It\'s still good for reference, but it\'s advised
to instead follow one of these Fedora articles instead, these server
articles will work fine on Fedora Workstation as well.

-   [Fedora_21_Server](Fedora_21_Server "wikilink")

```{=html}
<!-- -->
```
-   [Fedora_23_Server](Fedora_23_Server "wikilink")

\'\'\'

## FOG (r2922) Configuration on Fedora 21 Workstation inside Windows Server 2012 Hyper-V using Windows Server DHCP {#fog_r2922_configuration_on_fedora_21_workstation_inside_windows_server_2012_hyper_v_using_windows_server_dhcp}

\'\'\'

**Notes:** These instructions are intended to be followed *IN ORDER*.

Although these instructions were specifically written for r2922 & Fedora
21 (non-updated) inside Hyper-V using Windows Server DHCP, they might
help a lot with other newer versions of Fedora; although these other
versions have not been tested. These instructions should work fine if
you\'re not using Hyper-V; maintaining that everything else remains the
same.

Also, these instructions should be good for any SVN above r2922. If you
want to check out a newer revision (which I would recommend), simply
change the SVN command below to a different number. Keep in mind, you
can upgrade but not downgrade (unless using snapshots).

### **Hyper-V machine settings** {#hyper_v_machine_settings}

-   4 cores (or higher)
-   4086 MB of non-dynamic ram.
-   512GB HDD (large size for storing the images on the v-machine)
-   Ensure v-machine is connected to a working virtual switch (a working
    internet connection is required during the FOG software
    installation).
-   set Fedora 21 workstation ISO into the virtual optical drive.
-   Everything else is default

For further details about network setup of Hyper-V:
<https://forums.fogproject.org/topic/4706/hyper-v-server-2012-configuration-for-fog-overview>

### **Installing Fedora 21** {#installing_fedora_21}

-   Boot the V-Machine
-   Install to Hard drive
-   english & english -\> next
-   Automatic partitioning selected is not optimal. Say you want to
    configure them on your own, and then click the Make partitions
    automatically on the left. From there, you can customize the mount
    points and their sizes.

#### **Configuring your own partitions** {#configuring_your_own_partitions}

The one thing with using Fedora (or any red-hat based distro) is that
the default partitioning isn\'t optimal for FOG.

Basically, you\'d give \"swap\" the same to double the amount of RAM.
Give \"home\" just a little for working space.. like 5 gigs. I\'d bump
the \"boot\" partition up to 2 gigs to be future proof. Finally, give
the rest to \"/\" (root).

Fedora (and most red-hat installers) auto-adjust partition sizes for you
if you go over what is available\... meaning.. if you are unsure about
how much space is left on the drive to assign to \"/\", and you have a
500GB drive, you can just type something absurd in like 999 GiB and hit
\"update\" and the installer will auto adjust that amount to what is
available.

#### **Continuing installation** {#continuing_installation}

-   Network & Hostname: FOG (or whatever you like)
-   Click Begin Installation
-   Set root password to the Password, MAKE NOTE OF THIS (It must be
    longer than 8 characters and not a dictionary word, otherwise youll
    run into problems later).
-   Make user & Password (I made one called Administrator with a
    lowercase a for the username.)
-   Check Make this user administrator
-   Wait for Fedora to install.
-   When install is complete, click Quit.
-   Shutdown Fedora gracefully via the in-system power button. Then
    remove the ISO in the settings via Hyper-V.

#### **Pre-Configuration of Fedora 21 for FOG** {#pre_configuration_of_fedora_21_for_fog}

-   boot, if given options, choose the non-emergency one.
-   Log in as the user you created. (Administrator)
-   On first login, choose english & then NEXT
-   Standard English keyboard and NEXT
-   Skip online accounts, SKIP
-   click Start using Fedora
-   Close Getting Started because were already started.
-   OPEN THIS DOCUMENT on the FOG Machine! Lots of copy/pasting!

#### **Disable Firewall and SELinux** {#disable_firewall_and_selinux}

-   Click Activities in top left.
-   Type Terminal (this is a lot like windows metro on a desktop, just
    type what you want)
-   Switch to root with
        su root
-   Enter password set during install
-   Disable the firewall

```{=html}
<!-- -->
```
    systemctl disable firewalld.service

-   Disable SELinux by editing /etc/selinux/config
        gedit /etc/selinux/config

Change the line

    SELINUX=enforcing

to

    SELINUX=disabled

-   save and close.
-   Reboot the machine.

#### **CHECK SETTINGS SO FAR** {#check_settings_so_far}

-   After reboot, verify that the firewall is off, and SELinux is off.
-   log into your Administrator account, open terminal.
-   Switch to root.
        su root
-   Enter your password.

```{=html}
<!-- -->
```
    sestatus

should return disabled

    systemctl status firewalld.service

should return disabled and dead.

-   Dont close terminal window, dont exit root.

#### **Set up a static IP address** {#set_up_a_static_ip_address}

-   Click Activities
-   type settings, the Settings icon should appear. Click it.
-   Click Network
-   Under the wired adapter, click the gear to set up custom settings.
-   Click IPv4
-   Enter in the IP you want to use, netmask, gateway, and DNS server
    information.
-   Click Apply
-   For settings to update, turn off the adapter and then turn it back
    on. (click the slide)
-   Test by trying to visit Google with firefox. Confirm and close.

#### **Configuring existing DHCP server (Windows Server 2012)** {#configuring_existing_dhcp_server_windows_server_2012}

Inside your DHCP server, we have to set some options.

-   IPv4 -\> Scope -\> Scope Options.
-   Right click Scope Options.
-   Enable 066 Boot Server Host Name, enter the FOG servers IP.
-   Enable 067 Bootfile Name, set it as
        undionly.kpxe

### **Setting Up Fog** {#setting_up_fog}

-   install svn

```{=html}
<!-- -->
```
    yum install svn

-   Yes, you want to install (this will install \"beta\" Please download
    from
    [sourceforge](http://sourceforge.net/projects/freeghost/files/latest/download?source=files)
    for \"Stable\")

```{=html}
<!-- -->
```
    svn co -r 2922 https://svn.code.sf.net/p/freeghost/code/trunk /opt/fog_trunk

(for newer revisions, change the number to what you want. See more info
about updating to revisions here: [Upgrade to
trunk](Upgrade_to_trunk "wikilink"))

    cd /opt/fog_trunk

    cd bin

    ./installfog.sh

-   Choose option 1 (because we are using Fedora)
-   Choose the normal server because we want it to do everything (but
    dhcp)
-   Hit enter to accept the currently assigned IP address.
-   Router Address for the DHCP server -\> optional. I said no. Youd
    need this if you were using the FOG server as a DHCP server.
-   DNS address for the dhcp server -\>optional. I said no. Youd need
    this if you were using the FOG server as a DHCP server.
-   Change default network interface, NO!
-   Use FOG server for DHCP service? NO!
-   Install internationalization support? NO! (yes will break FOG
    running on Fedora)
-   Donate computer resources? NO! (Unless you want to. See wiki
    information on how that works)
-   Do you wish to continue? Yes!
-   Fog installs. wait
-   Make notes of ANY failed package installs
-   When it asks, the installer directory should be /images (we pre-made
    this during the Fedora install)
-   Yes, you left the mysql password blank (its blank out of the box).
-   Update the database schema by navigating to the provided link.
-   Use a web browser. Address is: x.x.x.x/fog/management You dont have
    to use Linux for this, use any computers web browser (any computer
    within your LAN).
-   If it only works in Fedora, check Firewall and SELinux status.
-   click install/Upgrade Now.
-   wait for that to get done.
-   Press enter in installer.

### **Necessary post install configuration** {#necessary_post_install_configuration}

-   Some required file manipulation and permission changes:
-   Change the fog users password using
        passwd fog
-   enter the Password
-   Create blank file to make Fog check directories

```{=html}
<!-- -->
```
    cd /

    touch /images/.mntcheck

    touch /images/dev/.mntcheck

-   Edit the FTP settings file with
        gedit /etc/vsftpd/vsftpd.conf
-   add this line to the bottom of the file:
        seccomp_sandbox=NO
-   Save the file.Reboot server

### **Set the FOG services to start 30 seconds after boot** {#set_the_fog_services_to_start_30_seconds_after_boot}

(necessary with Fedora 21 & r2922. There\'s an issue with the
FOGMulticastManager after a reboot; it\'s timing related.)

-   Disable FOG services with:

```{=html}
<!-- -->
```
    systemctl disable FOG{MulticastManager,Scheduler,SnapinReplicator,ImageReplicator}

Create a startup script with

    gedit /etc/rc.d/rc.local

-   Make that file look like below, exactly.

```{=html}
<!-- -->
```
    #!/bin/bash
    sleep 30
    systemctl start FOGMulticastManager
    systemctl start FOGScheduler
    systemctl start FOGSnapinReplicator
    systemctl start FOGImageReplicator
    exit 0

-   save the file
-   Then Run this command to make that file executable:
        chmod +x /etc/rc.d/rc.local

### **FOG Configuration.** {#fog_configuration.}

-   go to the web interface using
        x.x.x.x/fog/management
-   login (default is fog:password)
-   Click Storage Management (network folder looking thing at top).
-   Click Default Member in the list.
-   Change management password to the linux fog users Password and then
    click Update.
-   Click Fog Configuration (blue question mark at top).
-   Click Fog Settings on left.
-   Click TFTP Server
-   Change Password to the right one.
-   Click Save Changes
-   If you have custom Multicast Settings (like address and port), click
    Multicast settings and put them in there, and then save the changes.

### **At this point, you should be done with major configuration.** {#at_this_point_you_should_be_done_with_major_configuration.}

\'\'\'

## FOG Server Troubleshooting Help (Fedora 21, r2922 & up) {#fog_server_troubleshooting_help_fedora_21_r2922_up}

\'\'\'

### **TFTP Services** {#tftp_services}

-   Check TFTP status with
        systemctl status xinetd.service

    (should be on and green, no errors, and enabled)
-   stop, start, disable and enable TFTP service.

```{=html}
<!-- -->
```
    systemctl stop xinetd.service

    systemctl start xinetd.service

    systemctl enable xinetd.service

    systemctl disable xinetd.service

### **RPC Services** {#rpc_services}

-   Check the status of RPC with
        systemctl status rpcbind

    (should be on and green, no errors, and enabled)
-   Stop, start, disable and enable RPC Service

```{=html}
<!-- -->
```
    systemctl stop rpcbind

    systemctl start rpcbind

    systemctl enable rpcbind

    systemctl disable rpcbind

### **NFS Services** {#nfs_services}

-   Check the status of NFS with
        systemctl status nfs-server

    (should be on and green, no errors, and enabled)
-   stop, start, disable and enable NFS service

```{=html}
<!-- -->
```
    systemctl stop nfs-server

    systemctl start nfs-server

    systemctl enable nfs-server

    systemctl disable nfs-server

### **FTP Services** {#ftp_services}

-   Check the status of FTP with
        systemctl status vsftpd.service

    (should be on and green, no errors, and enabled)
-   stop, start, disable and enable FTP service.

```{=html}
<!-- -->
```
    systemctl stop vsftpd.service

    systemctl start vsftpd.service

    systemctl disable vsftpd.service

    systemctl enable vsftpd.service

-   Test that its functioning by using a web browser and going to
        ftp://x.x.x.x
-   Use fog / your-fog-account-Password for the credentials
-   You should see Index of /

### **Firewall Service** {#firewall_service}

-   Check the status of the firewall with
        systemctl status firewalld.service

    (should be OFF, no errors, and disabled)
-   stop, start, disable and enable FTP service.

```{=html}
<!-- -->
```
    systemctl stop firewalld.service

    systemctl start firewalld.service

    systemctl disable firewalld.service

    systemctl enable firewalld.service

### **SELinux Service** {#selinux_service}

-   Check the status of SELinux with
        sestatus

    (should be disabled)
-   Disable/enable by editing using
        gedit /etc/selinux/config

    followed by a reboot.

### **FOGMulticastManager**

-   Check status with
        systemctl status FOGMulticastManager.service

    (Should be active, green lit, with no errors)
-   Start, stop, disable, enable, restart by changing the status portion
    of that command to what you need.

### **FOGImageReplicator**

-   Check status with
        systemctl status FOGImageReplicator.service

    (Should be active, green lit, with no errors)
-   Start, stop, disable, enable, restart by changing the status portion
    of that command to what you need.

### **FOGSnapinReplicator**

-   Check status with
        systemctl status FOGSnapinReplicator.service

    (Should be active, green lit, with no errors)
-   Start, stop, disable, enable, restart by changing the status portion
    of that command to what you need.

### **FOGScheduler**

-   Check status with
        systemctl status FOGScheduler.service

    (Should be active, green lit, with no errors)
-   Start, stop, disable, enable, restart by changing the status portion
    of that command to what you need.

## Client BIOS Settings for auto-boot to network {#client_bios_settings_for_auto_boot_to_network}

### **Dell Optiplex 7010 BIOS configuration** {#dell_optiplex_7010_bios_configuration}

-   F12 while system is powered on.
-   select BIOS setup
-   General -\> Boot Sequence
-   Onboard NIC should be the first.
-   System Configuration -\> Integrated NIC
-   Enabled w/PXE should be selected.
