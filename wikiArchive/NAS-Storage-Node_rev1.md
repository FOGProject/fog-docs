-   This is an option that has been successfully done on a few occasions
    and `<u>`{=html}**NOT ALL**`</u>`{=html} NAS devices work as a
    Storage node.
    -   This is a generic setup for NAS devices
    -   [ FreeNAS](Use_FOG_with_FreeNAS "wikilink") has been reported to
        work as a storage node.

## Basic Idea {#basic_idea}

-   Install FOG storage node script on NAS and use it as a Storage node
    for your FOG server.
-   A few basic things will need to be installed by the install script
    ssh, ftp, nfs, and mysql.

## Installation

**NOTE:** It is assumed that you already have a working FOG server at
this point in time. If you do not please ask in the
[forum](http://fogproject.org/forum) to get the server working first.

-   First you must obtain (enable) ssh on your NAS to be able to even
    work with it.
    -   On some devices such as a \"My Booklive\" you will need to login
        to the web portal and enable it from there. See your device user
        manual for this.

```{=html}
<!-- -->
```
-   Download FOG from our [download
    page](http://sourceforge.net/projects/freeghost/files/latest/download)
    or use a [ trunk version](Upgrade_to_trunk "wikilink").

```{=html}
<!-- -->
```
-   Unpack the FOG tar and navigate to fog/bin.

```{=html}
<!-- -->
```
-   Figure out what operating system your NAS is using and try to figure
    out if it is closer to Red Hat, Ubuntu, Centos, or debian.

```{=html}
<!-- -->
```
-   Run the installation script, ./installfog.sh

1.  Select your operating system.
2.  When prompted for Server Installation Mode, select S, for storage
    node.
3.  Enter the IP address of the storage node.
4.  Confirm your interface
5.  Then you will need to enter the IP address or host name of the node
    running the FOG database (FOG Server IP)
6.  Then you will be prompted for a username (typically fogstorage) and
    a password that is located on the FOG server, that will allow the
    storage node to access the main FOG server\'s database. This
    information is located in the FOG management portal for convenience
    (on the main FOG server). It can be accessed via Other Information
    -\> FOG settings -\> section FOG Storage Nodes.
7.  You will then be prompted to confirm your installation settings, if
    they are correct press Y end hit Enter.
8.  When installation completes, the install will produce a username and
    password that will be needed to add the storage node to the FOG
    management portal. Username is \"fog\", password is in
    /opt/fog/.fogsettings

-   Go to your webgui of your FOG server and Add a Storage Node with the
    information shown in the installation script on the NAS.
    -   If you lost or closed the interface before writing down the
        username and password it can be found in the install log located
        in /var/log/foginstall.log

1.  Log into the FOG Management Portal
2.  Navigate to the Storage Management section.
3.  Click on Add Storage Nodes.
4.  For the Storage Node Name, enter any alpha numeric string to
    represent the storage node.
5.  Enter any description you wish
6.  Enter the IP address of the storage node you are adding. This must
    be the IP address of the node, `<u>`{=html}**DO NOT**`</u>`{=html}
    use a hostname or the node will not function correctly.
7.  Enter the maximum number of unicast clients you would like this node
    to handle at one time. The value that we recommend is 10.
8.  Is Master Node is a very dangerous setting, but for right now leave
    it unchecked, for more details please see: [ Master Node
    Status](Managing_FOG#Master_Node_Status "wikilink").
9.  Next, select the storage group you would like this member to be a
    part of, in our example we will pick Default
10. Next, specify the image location on the storage node, typically
    /images/, your image location should always end with a /.
11. Next, you will want to check the box, to enable the node.
12. The last two fields take the username and password that are
    generated during the installation of the storage node. username is
    \"fog\", password is in /opt/fog/.fogsettings
13. Then click Add to have the node join the storage group.

-   You now should have a properly installed Storage node on a NAS
    device

## Monitoring The Master Node {#monitoring_the_master_node}

-   On all storage nodes there is a new service (as of version 0.24)
    called FOGImageReplicator which is a very basic script which, if the
    node is the master, copies all of its images to all other nodes in
    the storage group. The copying is done every ten minutes by default,
    which means your images are NOT instantly duplicated to all nodes.
-   If you would like to view the status of the image replication, you
    can do so on the storage node by switching to tty3, by typing ctl +
    alt + f3. Output is also logged to a file in the /opt/fog/log
    directory.
    -   FOGImageReplicator logs are also located in
        ![](Config.png "Config.png") Fog Configuration \--\> Log Viewer
        \--\> FILE: \[Select Image Replicator\]

## Issues and Troubleshooting {#issues_and_troubleshooting}

### Information not being displayed in Dashboard correctly {#information_not_being_displayed_in_dashboard_correctly}

-   <figure>
    <img src="Bad_Node_info.png" title="Bad_Node_info.png" />
    <figcaption>Bad_Node_info.png</figcaption>
    </figure>

-   <figure>
    <img src="Bad_Node.png" title="Bad_Node.png" />
    <figcaption>Bad_Node.png</figcaption>
    </figure>

-   Information sited from
    <http://fogproject.org/forum/threads/create-nas-and-fog-1-1-2.12597/#post-44080>

```{=html}
<!-- -->
```
-   Check to see if your NAS device can connect to your FOG server\'s
    mysql.

```{=html}
<!-- -->
```
    #mysql -h <ipoffogserver> -u fogstorage <-p password> fog

-   If this fails you will need to check a few configuration settings.

1.  Open and edit file **/etc/mysql/my.cnf**
2.  Find the line **bind-address** and change **127.0.0.1** and change
    to the FOG server IP.
    -   bind-address =127.0.0.1 \--\> bind-address
        =`<ipoffogserver>`{=html}
3.  Restart mysql

```{=html}
<!-- -->
```
    sudo service mysql restart

-   Try again to access the server mysql database. If successful please
    go back to your webgui and see if your information is displaying
    correctly.

<figure>
<img src="Good_NAS.png" title="Good_NAS.png" />
<figcaption>Good_NAS.png</figcaption>
</figure>
