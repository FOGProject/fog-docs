`<font color="red">`{=html}Note:`</font>`{=html} This article is older
(year 2012), but still has really good content. It has only had it\'s
terminology updated to reflect current FOG terminology.

`<b>`{=html}A guide to deployment, management, And concept overview For
FOG.`</b>`{=html}

Based on a document by: Thomas J. Munn CISSP

## Introduction

### Preface to this Document {#preface_to_this_document}

This document is intended to be modified by FOG users, in fact it is
based on a document created by a FOG user. If you feel something could
be said better or put more clearly, it is encouraged that you make
changes to this document. We just ask that you keep it constructive and
in good taste. In order to edit the wiki you are now required to create
an account, as spamming of the forum has gotten pretty bad recently.

### What is FOG? {#what_is_fog}

FOG is a Linux-based, free and open source computer imaging solution for
Windows XP, Vista, 7, and Linux (limited) that ties together a few
open-source tools with a php-based web interface. FOG doesn\'t use any
boot disks, or CDs; everything is done via TFTP and PXE. Also with FOG
many network drivers are built into the kernel, so you don\'t really
need to worry about nic drivers (unless there isn\'t kernel support for
it yet). FOG also supports putting an image that came from a computer
with a 80GB partition onto a machine with a 40GB hard drive as long as
the data is less than 40GB. FOG supports multi-casting, meaning that you
can image many PCs from the same stream. So it is about as fast whether
you are imaging 1 PC or 20.\<BR\>

### Why FOG? {#why_fog}

Working in an educational environment, our organization\'s techs very
often re-imaged computers in their day to day activities. For a long
time we used a commercial product that in many ways didn\'t meet our
needs. It wasn\'t web based, and you needed to create driver disks,
floppys or USB drives. Other things were very difficult, such as
searching for a host by MAC address and the product was expensive, even
with an educational discount. So we started to investigate ways in which
we could do things better, and as our organization struggled to make a
commercial product work better by trying to pxe boot dos, and testing it
in Windows PE, we, the FOG Team, started to build a linux based solution
on our own time. We finally got a working version and decided to release
it as open source, since we use many other open source products, and
figured we should give back to the community.

### What features are included with FOG? {#what_features_are_included_with_fog}

FOG is more than just an imaging solution. FOG has grown into a
imaging/cloning and network management solution. FOG now performs tasks
like installing and managing printers, tracking user access to
computers, installing applications remotely via snapins, and automatic
user log offs. If a computer is badly infected with a virus or malware,
you can boot FOG in AV mode and have it remove the viruses. You can wipe
your disks, destroying all information that was on them, you can restore
deleted files, or scan the disk for bad blocks.\<BR\>

### Fundamental Concepts {#fundamental_concepts}

This section provides some basic concepts that the FOG Project uses.
\<UL\>\<LI\>**Unicasting**\<BR\> Unicasting in FOG means sending a
single image to a single host. This can mean a capture or a deployment,
and is independent of the image type.\<BR\> See this section for more on
[Unicasting](Unicasting "wikilink")\</li\> \<LI\>**Multicasting**\<BR\>
Multicasting in FOG uses UDPcast to send a single image to multiple
computers using only slightly more bandwidth then sending the image to a
single computer or unicast.\<BR\> See this section for more on
[Multicasting](Multicasting "wikilink")\</li\>\</UL\>

### FOG Benchmarks {#fog_benchmarks}

**[Internal Benchmarks](Internal_Benchmarks "wikilink")**

### Requirements

#### Hardware

FOG is best implemented on a dedicated server, any spare machine you
have. We recommend that you have **sufficient** hard drive space as each
image you make is usually between 5 and 10 GB and it\'s best to have a
**gigabit NIC** with as much processor and RAM you can throw at
it.\<BR\>

#### Software

The FOG server runs on various flavors of Linux, which can be downloaded
for free. The FOG installer script will verify or download and
automatically install many open-source packages such as: MySQL, PHP,
Apache, and more software from the open source community.

FOG is primarily geared toward helping school administrators manage
mostly Windows environments, but more support for Linux clients is
included in the latest version. \<BR\>

#### Network

FOG can be installed in a small lab on isolated network with just a
single inexpensive switch and a handful of Ethernet cables; it can be
added to your home network; or can be integrated with your existing
enterprise network infrastructure with multiple subnets or VLANS
(advanced configuration necessary.) The more robust your network, the
better FOG can perform. Some adjustments are required on existing DHCP
server(s) to integrate FOG into a network, as discussed later in the
documentation.\<BR\>

#### How much does FOG cost? {#how_much_does_fog_cost}

FOG is an Open Source project and licensed under the GPL which means
that you are free to use FOG on as many computers as you like for free.
This also means that if you want to make any changes to the source code
you are free to do so.

The creators of FOG make no profits from this project with the exception
of donations. FOG comes with absolutely **NO WARRANTY** and the creators
of FOG are in **NO WAY RESPONSIBLE FOR ANY DAMAGE OR LOSS CAUSED BY
FOG!** Please see the license file included with the FOG release for
more information. With that being said, we attempt to do a very good job
of supporting our users; in fact it is one of the goals of FOG to have
better support than most commercial products. All support requests
should be placed through the FOG\'s sourceforge forum which is located
at:

<https://sourceforge.net/projects/freeghost/forums>

Thanks for supporting open source software and enjoy!\<BR\>

-   [Office Depot Store
    Locator](http://www.office-coupons.net/office-depot-store-locator/)

## Installing FOG {#installing_fog}

FOG is a typical
*[LAMP](http://en.wikipedia.org/wiki/LAMP_%28software_bundle%29)*
software bundle, so the main server is a **L**inux box. The rest of the
components: **A**pache, **M**ySQL, **P**HP, and several other services,
are automatically downloaded and installed by the FOG installation
script.\
FOG can be installed by an experienced administrator in about 30
minutes. A new user with some familiarity with Linux can expect results
in a few hours by following the guides below.\
\
===**Full Step-By-Step [Installation](Installation "wikilink")
Guides**===

#### [Ubuntu](Installation#Ubuntu_.28Recommended.29 "wikilink") (Recommended) {#ubuntu_recommended}

#### [Fedora](Installation#Fedora_.28Recommended.29 "wikilink") (Recommended) {#fedora_recommended}

#### [Debian](Installation#Debian "wikilink")

#### [CentOS](Installation#CentOS "wikilink")

#### [VMware](Installation#VMWare "wikilink")

### Network Integration {#network_integration}

#### Basic Network Setup {#basic_network_setup}

The FOG setup script asks several questions which might not be obvious.
These sections describe only the most generic settings.

-   **Isolated Network**\
    The easiest method to image machines and get started using FOG is on
    a small, isolated network. The FOG setup program will configure all
    the necessary services for you completely automatically. This
    section covers only those basic steps.\
    **See [FOG on an Isolated
    Network](FOG_on_an_Isolated_Network "wikilink")**

\

```{=html}
<li>
```
**Integrating FOG Server with Existing Network Systems**\
Slightly more complicated is the task of integrating FOG into your
existing network infrastructure. This section attempts to describe the
steps to link FOG with a fairly generic enterprise system.\
**See [Integrating FOG into an Existing
Network](Integrating_FOG_into_an_Existing_Network "wikilink")**

```{=html}
</li>
```
```{=html}
</ul>
```

------------------------------------------------------------------------

#### Advanced Network Setup {#advanced_network_setup}

##### Modifications on your DHCP Server(s) {#modifications_on_your_dhcp_servers}

If you are installing FOG on an existing network, adjustments are
necessary to forward DHCP clients to the FOG server after they receive
their IP addresses:\
[Modifying existing DHCP server to work with
FOG](Modifying_existing_DHCP_server_to_work_with_FOG "wikilink")

##### Wake On Lan (WOL) {#wake_on_lan_wol}

-   [Cisco WOL - Layer 3](Cisco_Wake_on_lan "wikilink")
-   [ProCurve WOL](ProCurve_Wake_on_lan "wikilink")

##### Multicast/UDPCast

-   [Cisco Multicast - Layer 3](Cisco_Multi_Cast "wikilink")

### FOG Server Maintenance {#fog_server_maintenance}

#### [Backing up FOG](Backing_up_FOG "wikilink") {#backing_up_fog}

#### [Restoring FOG from Backup](Restoring_FOG_from_Backup "wikilink") {#restoring_fog_from_backup}

#### [Upgrading the FOG Server](Upgrading_the_FOG_Server "wikilink") {#upgrading_the_fog_server}

## Using FOG {#using_fog}

### Quick Start - Basic Tasks {#quick_start___basic_tasks}

So you have a FOG server installed and setup, now what do you do? Below
are a few common \"Getting Started\" items.

1.  [Booting into FOG and Capturing your first
    Image](Booting_into_FOG_and_Capturing_your_first_Image "wikilink")
2.  [Deploying your Image a single
    client](Deploying_your_Image_a_single_client "wikilink")
3.  [Deploying your Image a group of
    clients](Deploying_your_Image_a_group_of_clients "wikilink")

#### Tips

1.  FOG requires that all hosts be entered in the FOG Database for
    imaging. The most important part is getting the MAC address of the
    host right. FOG uses the MAC for targeting image installs and
    acquires. Using the wrong MAC could result in unpredictable results,
    including the complete erasure of the wrong pc! The IP address isnt
    that important, and the name field is more for the user. Mac address
    format is 00:12:3F:C4:57:0C . Using dashes, spaces, or no items at
    all will result in the GUI not accepting the host.
2.  At least one image must be defined using the FOG web interface under
    the Images section. After the image is defined, it must be
    associated with the hosts. This can be done through the web
    interface or on the client.
3.  After hosts are entered, it is wise to group them together by
    function, hardware, or common image. The image will be shared among
    all members of a particular group. This occurs within the hosts
    screen, and NOT on the groups screen. This is a little confusing, so
    it helps to think of the groups screen as a task generator, rather
    than controlling group memberships.
4.  For importing hosts in a .csv file follow the format below: 1 line
    per host:
        "00:c0:4f:18:62:63","Hostname","1.1.1.1","Your description","XP/Vista","Image filename to use"
5.  Hosts are then configured to boot via PXE boot by going into the
    BIOS. Make sure PXE boot is the FIRST option, NOT the hard disk, or
    things wont work.
6.  Configure your master pc for the first image. Probably a good idea
    to run [sysprep](http://support.microsoft.com/kb/302577) prior to
    imaging, but not necessary. Sysprep will make your imaging life
    easier, if hardware is different, etc. See Microsoft.com for more
    details on using sysprep.

### Mastering the FOG Web Interface {#mastering_the_fog_web_interface}

#### The Main [Managing FOG](Managing_FOG "wikilink") Page {#the_main_managing_fog_page}

The FOG web interface is your primary management console. It is very
well-documented in the pages linked below:\
The Main [Managing FOG](Managing_FOG "wikilink") document and has a
Table of Contents of its own.\
Subcategories within the Managing Fog section include the following
sections:

-   **Understanding the FOG
    [Dashboard](Managing_FOG#Dashboard "wikilink")**\
    Provides an overview of the GUI and explains the symbols used on the
    [Menu Bar](Managing_FOG#Menu_Bar "wikilink").
-   **Managing [Hosts](Managing_FOG#Hosts "wikilink")**\
    This section covers management tasks such as: [Adding a new
    host](Managing_FOG#Adding_a_new_host "wikilink"), [Managing
    Hosts](Managing_FOG#Managing_Hosts "wikilink"), [Host
    Status](Managing_FOG#Host_Status "wikilink"), and [Creating Host
    Groups](Managing_FOG#Creating_Host_Groups "wikilink").
-   **Managing [Groups of Hosts](Managing_FOG#Groups "wikilink")**\
    This section provides an
    [Overview](Managing_FOG#Overview_4 "wikilink") of sorting hosts into
    useful Groups, and provides instruction on [Managing
    Groups](Managing_FOG#Managing_Groups "wikilink").
-   **Defining and Managing [Images](Managing_FOG#Images "wikilink")**\
    Defines types of images: Single Partition \| Multiple Partition -
    Single Disk \| Multiple Partition - All Disks \| Raw Image\
    Also describes
    [Creating](Managing_FOG#Creating_Images_Objects "wikilink"),
    [Modifying Image
    Objects](Managing_FOG#Modifying_Image_Objects "wikilink"), and
    [Adding Images to Existing
    Objects](Managing_FOG#Adding_Existing_Image_Objects "wikilink").
-   **[Storage Management](Managing_FOG#Storage_Management "wikilink") -
    adding additional Storage Nodes**\
    This section introduces the [concept of Storage
    Nodes](Managing_FOG#Overview_6 "wikilink"), which provide
    scalability to FOG with the ability to \"share the load of computers
    being imaged.\"\
    Also covered are [Adding Storage
    Nodes](Managing_FOG#Adding_a_Storage_Node "wikilink"), Monitoring
    [Image
    Replication](Managing_FOG#Monitoring_The_Master_Node "wikilink")
    between nodes, and Understanding the [role of the \"Master
    Node\"](Managing_FOG#Master_Node_Status "wikilink") in a group.\
    In addition, this section details the necessary steps to [include
    PXE and TFTP
    Services](Managing_FOG#Including_multiple_PXE_.2F_TFTP_servers "wikilink")
    for a node located on a remote network segment.
-   **Defining types of [Administrative FOG
    Users](Managing_FOG#Users "wikilink")**\
    The difference between a regular FOG user and a [Mobile
    user](Managing_FOG#Overview_7 "wikilink")\
    Also covered are
    [Creating](Managing_FOG#Creating_Accounts "wikilink") and
    [Modifying](Managing_FOG#Modifying_Users "wikilink") FOG user
    accounts

#### FOG [Tasks](Managing_FOG#Tasks "wikilink") {#fog_tasks}

This is a major section of FOG Management because all day-to-day client
management is initiated within the FOG Tasks section.\
The [Overview Section](Managing_FOG#Overview_8 "wikilink") provides a
quick list of tasks available within FOG.\
[General Tasks](Managing_FOG#General_Tasks "wikilink") - Basic Imaging
Tasks:

:   

    :   Capturing an image (includes video tutorial)\
        Deploying an image\
        Multicasting\

[Advanced Tasks](Managing_FOG#Advanced_Tasks "wikilink") - Describes
tasks other than imaging:

:   

    :   Debug\
        Capture - Unicast (Debug)\
        Send - Unicast (Debug)\
        Send - Unicast (Without Snapins)\
        Deploy All Snapins\
        Deploy Single Snapin\
        Memory Test\
        Wake Up\
        Fast Wipe\
        Normal Wipe\
        Full Wipe\
        Disk Surface Test\
        File Recovery\
        Virus Scan\
        Hardware Inventory

#### Delayed Tasks, or [Scheduling Tasks](Managing_FOG#Scheduling "wikilink") in the future {#delayed_tasks_or_scheduling_tasks_in_the_future}

Describes advanced settings available for scheduling tasks including
Shutdown after Execution, [Single
Task](Managing_FOG#Single_Execution_Scheduling "wikilink") scheduling,
and [setting a CRON-Style
Task](Managing_FOG#Cron_Style_Task_Scheduling "wikilink").

#### [Adding Printers](Managing_FOG#Printers "wikilink") to FOG {#adding_printers_to_fog}

How to add printers to FOG. This allows the [FOG Service to manage
printers](Managing_FOG#Printer_Manager "wikilink") on FOG Clients

### FOG Plugins {#fog_plugins}

Plugins enhance FOG\'s functionality.

-   The Capone plugin allows FOG to recognize similar hardware platforms
    and push your specified image to them with minimal (or no)
    interaction.

See [Plugins](Plugins "wikilink") to activate and manage plugins.

### The [FOG Client Service](Managing_FOG#The_FOG_Client_Service "wikilink") {#the_fog_client_service}

A service that runs on client computers allowing FOG to better manage
them. Provides AD Integration, the ability to change a Hostname, Green
Power management, Snap-in installation, User tracking, Printer
Management, and more. See the
[Overview](Managing_FOG#Overview_10 "wikilink") for a more complete
list.\
The FOG client can be partially or fully-enabled by [modifying the ini
file.](Managing_FOG#Module_specific_configuration_settings "wikilink")\

### [Installing](Managing_FOG#Installation "wikilink") the FOG Client {#installing_the_fog_client}

A typical client installation, Silent installation, and a video
tutorial.

### Advanced Description of [FOG Services](Managing_FOG#Functions_and_Operation "wikilink") {#advanced_description_of_fog_services}

More detail on:\
::Auto Log Out\
Hostname Changer\
Host Register\
Task Reboot\
Directory Cleaner\
Display Manager\
Green FOG\
Snapin Client\
User Tracker\
User Cleanup\
Printer Manager\
Client Updater

### [Updating](Managing_FOG#Keeping_Clients_up_to_date "wikilink") the FOG Client {#updating_the_fog_client}

How to update the FOG client.

### The [FOG Tray](Managing_FOG#FOG_Tray "wikilink") {#the_fog_tray}

Describes the Windows application that runs in the taskbar

### [Troubleshooting](Managing_FOG#Troubleshooting "wikilink") the FOG Client {#troubleshooting_the_fog_client}

Log file location

### Snap-ins {#snap_ins}

A FOG [Snap-in](Managing_FOG#Snap-ins "wikilink") is anything that can
be run on a Windows client. This can be *just about anything*,
including: installing applications like Firefox or Microsoft Office,
adding an icon or shortcut to the desktop, or tweaking a registry key.
This section covers [Creating a
Snap-in](Managing_FOG#Creating_a_Snapin_.2F_Overview "wikilink"),
adjusting the FOG server to handle snap-ins [larger than
2MB](Managing_FOG#Preparing_the_FOG_Server "wikilink"), [Uploading the
Snap-in](Managing_FOG#Uploading_the_Snapin "wikilink") into the FOG
system, and
[Linking](Managing_FOG#Linking_the_Snapin_to_Hosts "wikilink") the
Snap-in to hosts.

## Troubleshooting / Advanced Installations {#troubleshooting_advanced_installations}

### Troubleshooting

This section is intended to bring together the most common issues from
the [Installation
Problems](https://sourceforge.net/projects/freeghost/forums/forum/730843)
forums. The wiki format allows formatting and revision that isn\'t
currently available in the SourceForge forums.

#### [Knowledge Base](Knowledge_Base "wikilink") {#knowledge_base}

Many pages and tips on diagnosing network, installation, and general
troubleshooting steps.

#### [Password Central](Password_Central "wikilink") {#password_central}

A single resource to explain all passwords necessary for FOG in all its
various configurations

#### [Troubleshooting an image push to a client](Troubleshooting_an_image_push_to_a_client "wikilink") {#troubleshooting_an_image_push_to_a_client}

#### [Troubleshooting a capture](Troubleshooting_a_capture "wikilink") {#troubleshooting_a_capture}

#### [Troubleshooting Driver Issues](Troubleshooting_Driver_Issues "wikilink") {#troubleshooting_driver_issues}

#### [Speeding up the Graphical User Interface](Speeding_up_the_Graphical_User_Interface "wikilink") {#speeding_up_the_graphical_user_interface}

#### [Bottleneck](Bottleneck "wikilink") / Imaging Speed Issues {#bottleneck_imaging_speed_issues}

### Advanced Installations {#advanced_installations}

#### Separate TFTP and DHCP Server {#separate_tftp_and_dhcp_server}

In this setup, the TFTP server and the DHCP server are hosted on a
separate server. The TFTP server holds the PXE boot files including the
Linux Kernel, boot file system image, and pxe config files. The DHCP
server is the server that assigns the clients with IP addresses and
network connection information.

Click here for detailed steps:\
[Separate TFTP and DHCP
Server](Separate_TFTP_and_DHCP_Server "wikilink")

#### Additional TFTP / DHCP Server on separate subnet {#additional_tftp_dhcp_server_on_separate_subnet}

This setup allows FOG to manage systems at a remote network location by
installing the necessary services to allow clients to PXE boot to a
Storage Node:\
[Including multiple PXE / TFTP
servers](Multiple_TFTP_servers "wikilink")

#### Separate NFS Server {#separate_nfs_server}

No Content yet.

#### Change NFS location {#change_nfs_location}

This is **not about a seperate NFS server** in general, but about how to
**change the local storage directory** and export it correctly.

See [Change NFS location](Change_NFS_location "wikilink") for more.

#### Other Advanced Topics {#other_advanced_topics}

-   [Building a Custom Kernel](Building_a_Custom_Kernel "wikilink")
-   [Creating Custom FOG Service
    Modules](Creating_Custom_FOG_Service_Modules "wikilink")
-   [Editing the ramdisk/init
    file](Editing_the_ramdisk/init_file "wikilink")

## Appendix

### Preparing a Client for Cloning {#preparing_a_client_for_cloning}

FOG\'s strength can be better harnessed if some time and work is put
into preparing a master image that fits the needs of your environment.\
This section covers client preparation steps that will save you time and
headaches like:

:   

    :   Setting a [Default User
        Profile](Client_Setup#Set_up_Default_Profile "wikilink")\
        Installing Windows Updates\
        Pre-Installing the [FOG
        service](Client_Setup#Final_Steps_Before_Imaging_.2F_Before_Sysprep "wikilink"),
        etc.\

It also covers more advanced ideas that are guaranteed to *cause*
headaches, like:

:   

    :   Sysprep, [Hardware-Independent Images
        (HAL)](Client_Setup#Hardware-Independent_Images_-_Understand_HAL "wikilink"),
        and Driver integration.\

Read more about *[Client Setup](Client_Setup "wikilink")*

For Microsoft sysprep information, see this page:
<http://vernalex.com/guides/sysprep/video.shtml>

### Other Resources {#other_resources}

FOG install HOWTO:
<http://www.howtoforge.com/installing-fog-computer-imaging-solution-on-fedora8>

FOG sourceforge page: <http://freeghost.sf.net/>

Deployment Forum at Edugeek contains many Fog related threads
<http://www.edugeek.net/forums/o-s-deployment/>

## About the Developers {#about_the_developers}

### Chuck Syperski {#chuck_syperski}

Chuck Syperski is the lead software developer for FOG computer imaging
solution. He is a software developer and network integration specialist
for a public school district outside of Chicago, IL. Chuck Syperski has
a Bachelor of Science in Computer Science from the University of
Illinois. He specializes in Java, jsp, jsf, objective C, C, C++, C#,
perl and php. You can contact Chuck Syperski directly via sourceforge as
the following link:

<http://sourceforge.net/users/microleaks/>

### Jian Zhang {#jian_zhang}

No content
