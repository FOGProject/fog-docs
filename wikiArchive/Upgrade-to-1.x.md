# Overview

\'\'\'NOTE: 1.x.x is a, nearly, complete rewrite from previous versions
of FOG. There may be issues when upgrading from past revisions of FOG so
please backup your installation before upgrading!

-   Migration for v0.32 to version v1.x.x will cause you to loose the
    operation system information that was associated with your hosts.
    This information has been moved to the image item now, so you will
    need to update all your images to set the appropriate operating
    system! Please see the Migration Instructions section below for more
    information.

```{=html}
<!-- -->
```
-   Many successful upgrades from v0.32 have occurred. It is possible to
    upgrade from v0.1 all the way to v1.x.x.

------------------------------------------------------------------------

-   All commands are assumed to be run as root. If you don\'t have
    access to root, prepend the installation with sudo (ex.

```{=html}
<!-- -->
```
    sudo svn co https://svn.code.sf.net/p/freeghost/code/tags/1.2.0 /opt/fog_1.2.0

    sudo ./installfog.sh

## Download

-   Three Download Methods currently exist:

1.  To get the Source from [SVN](SVN "wikilink")
    -   svn co https://svn.code.sf.net/p/freeghost/code/tags/1.2.0 /opt/fog_1.2.0
2.  To get tarball file.
    -   wget http://sourceforge.net/projects/freeghost/files/latest/download
3.  Click to get tarball file
    -   <http://sourceforge.net/projects/freeghost/files/FOG/fog_1.2.0/fog_1.2.0.tar.gz/download>

# Check your network switches {#check_your_network_switches}

Please check your network switches so that they will handle
**[IPXE](IPXE "wikilink")** correctly.

# Upgrade Methods {#upgrade_methods}

-   For
    `<span style="background-color:Green;">`{=html}`<span style="color:White">`{=html}**Direct**`</span>`{=html}`</span>`{=html}
    upgrade from 0.32 to 1.x.x \--\> **[ Direct
    Upgrade](Upgrade_to_1.x.x#Direct_Upgrade "wikilink")**

```{=html}
<!-- -->
```
-   For
    `<span style="background-color:Yellow;">`{=html}`<span style="color:Black">`{=html}**Migration**`</span>`{=html}`</span>`{=html}
    from Old Server 0.32 to a New Server 1.x.x \--\> **[ Migration
    Upgrade](Upgrade_to_1.x.x#Migration_Upgrade "wikilink")** (Requires
    2 separate Servers)

## Direct Upgrade {#direct_upgrade}

-   **Requirements:**

1.  Current server that has 0.32
2.  The new download from the
    [Download](Upgrade_to_1.x.x#Download "wikilink") section above

#### Prepare for install {#prepare_for_install}

1.  Change to the downloaded source installation folder.
    -   cd /opt/fog_1.2.0/bin

### Install

1.  Confirm your settings in .fogsettings
    `<span style="background-color:Yellow;">`{=html}`<span style="color:Black">`{=html}**UNLESS
    YOU HAVE TO MAKE CHANGES**`</span>`{=html}`</span>`{=html}
    -   Example: If you added a password to mysql you will need to
        confirm the settings there. Also, if you changed the default
        user.
2.  Begin installing.
    -   ./installfog.sh

### Post Install {#post_install}

1.  Go to the link you normally go to and you should notice the
    upgrade/install database screen.
    (http://`<ip-address-of-FOG-Server/fog/management>`{=html}/)
    -   Click the **Submit** button and it should move on to say, Click
        here to login, once complete.
2.  **Finish** the install in the **terminal window**.

-   Continue to [ Operating_System_Information
    ](Upgrade_to_1.x.x#Operating_System_Information "wikilink")

## Migration Upgrade {#migration_upgrade}

-   **Requirements:**

1.  Old Server with 0.32 installed
2.  New Server with your choice flavor of Linux

-   If using a VM please create a second VM to serve as the *second*
    server

### Prepare for install {#prepare_for_install_1}

-   On the Old Server

1.  Backup old database
    -   mysqldump --opt -u'root' [-p'passwordhere' #only if password set] fog > fog_backup.sql

    -   **NOTE:** *There is no space between -u and root also -p and
        password, also the name and password are wrapped with quotes. In
        the case a single quote is used in your password, replace the
        current single quotes with double quotes. If there is both a
        double and single quote (for whatever reason) in the password,
        you will need to escape the appropriate quote \[ the one
        matching the quotes wrapping the entire field \] with a
        backslash (e.g. \\ )*

    -   `<span style="background-color:RED;">`{=html}`<span style="color:White">`{=html}DO
        NOT tar ball or gz`</span>`{=html}`</span>`{=html}
2.  Save file to an easily up-loadable location

-   Keep this server on and operational we will be getting back to this.

### Install {#install_1}

-   On the New Server
-   Click below for step-by-step guides written for your favorite flavor
    of Linux:

```{=mediawiki}
{{Installation}}
```
1.  Change to the downloaded source installation folder.
    -   cd /opt/fog_1.2.0/bin

### Post Install {#post_install_1}

1.  Go to the link you normally go to and you should notice the
    upgrade/install database screen.
    (http://`<ip-address-of-FOG-Server/fog/management>`{=html}/)
    -   Click the **Submit** button and it should move on to say, Click
        here to login, once complete.
2.  **Finish** the install in the **terminal window**.
3.  **Sign in** into the FOG GUI with your normal user and password.
4.  Record
    `<span style="background-color:Green;">`{=html}`<span style="color:White">`{=html}ALL`</span>`{=html}`</span>`{=html}
    information on ![](Config.png "Config.png")**Fog Confiuration**
    \--\> **Fog Settings** and ![](Storage.png "Storage.png")**Storage
    management** pages
5.  Import old database backup **fog_backup.sql** on
    ![](Config.png "Config.png") **Fog Configuration** \--\>
    **Configuration Save**
    -   `<span style="background-color:RED; color:white;">`{=html}Warning!
        Doing this will wipe out all other hosts/images/groups on your
        current server. This is assumed to be a fresh install of Fog
        v1.x.x server.`</span>`{=html}
6.  **Click** ![](Home.png "Home.png") HOME.
    -   The upgrade/install database screen will reappear.
7.  Click the **Submit** button and it should move on to say, Click here
    to login, once complete.
8.  Edit any settings in the ![](Config.png "Config.png") **Fog
    Configuration** \--\> **Fog Settings** page that may have changed
    from the server move (ip, paths, etc) that you recorded from the
    ![](Config.png "Config.png") **Fog Configuration** \--\> **Fog
    Settings** page and ![](Storage.png "Storage.png")**Storage
    Management** pages
9.  **Finish** the install in the **terminal window**.

### Migrate Old Images {#migrate_old_images}

See also: [Migrate images manually](Migrate_images_manually "wikilink")

-   Now that you have a operational v1.x.x server you will notice that
    you have not transferred your images yet. They may be listed in the
    Web GUI but the sizes read zero. On the old server you will mount
    /images directory(of new server) to a new directory /images2 and
    copy all contents.
-   Login to old server and run:

```{=html}
<!-- -->
```
    cd /
    sudo mkdir images2
    sudo chmod 777 images2
    sudo mount <ip_of_new_server>:/images /images2
    sudo cp /images /images2
    sudo umount /images2

-   Once this is complete match the file sizes in the ternmal windows to
    confirm that both of them are exactly the same
    -   ls -l
-   Please then refer to **[ Old
    Images](Upgrade_to_1.x.x#Old_Images "wikilink")** for Web GUI and
    partImage changes.
-   Dispose of **Old Server** properly

# Operating System Information {#operating_system_information}

-   As the hostOS column has been moved to the images table rather than
    the hosts table, you need to specify the Operating system of the
    images currently on your system.
-   To do so, login to the FOG GUI and navigate to the
    ![](Images.png "Images.png")Image Management Page. Click on each of
    your images and set the OSID accordingly.

# Change your DHCP Option 67 {#change_your_dhcp_option_67}

1.  Go to your DHCP server and change your Option 67 from *pxelinux.0*
    to **undionly.kpxe** (or other iPXE file)
    -   **Default undionly.kpxe** (Other boot files include ipxe.kkpxe,
        ipxe.pxe, default.ipxe, ipxe.kpxe, undionly.pxe, pxelinux.0.old,
        undionly.kkpxe and even custom ones if you wish to create them)

## Old Images {#old_images}

-   Fog 1.x.x uses PartClone instead of PartImage. Meaning that your old
    Images will not deploy correctly, unless you do the following steps.
-   If you do a straight upgrade, existing Image definitions should
    automatically be set to partimage type but please verify these
    settings

1.  Confirm that **FOG_FORMAT_FLAG_IN_GUI** is enable in your Fog
    settings
    -   ![](Config.png "Config.png") **Fog Configurations** \--\> **Fog
        Settings** \--\> \'\'\'General Settings \--\>
        FOG_FORMAT_FLAG_IN_GUI
2.  Go to your image and Change the **Image Type** to **partImage**
    -   ![](Images.png "Images.png") **Image Management** \--\>
        **\[Select the *OLD* Image\]** \--\> **Image Type:**

-   **Best practices:** You should download these to your hardware and
    re-capture `<u>`{=html}***BEFORE***`</u>`{=html} deploying on to
    multiple machines. If **Image Type** is set to **partImage** on next
    capture it will automatically change **Image Type** to
    **partClone**. NO need to go back and change that setting. Once all
    your images are re-captured you can then go and disable
    **FOG_FORMAT_FLAG_IN_GUI** in **Fog Settings**

# Congratulations

-   You should now have an UPGRADED FOG server that will be able to
    perform all the tasks we\'ve all come to know and love.
