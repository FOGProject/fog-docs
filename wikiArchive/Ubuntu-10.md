## Overview

This guide uses a live installer cd version of Ubuntu, and then covers
the installation of FOG.

## Known issues {#known_issues}

### Language issue {#language_issue}

This tutorial will probably only work with the English Installation of
Ubuntu.

### FOG version issues {#fog_version_issues}

With Ubuntu 10.04, FOG versions 0.30 and 0.31 will not install cleanly.
So it is recommended to only use versions 0.29 or 0.32 or greater, or
carefully follow the guidance below.

#### Libmd5-perl installation issue (FOG versions \< 0.29) {#libmd5_perl_installation_issue_fog_versions_0.29}

If you get an error during installfog.sh regarding libmd5-perl (FOG 0.28
and earlier \-- dependency removed in FOG 0.29), you need to manually
download and apply the package:

`wget `[`http://ftp.us.debian.org/debian/pool/main/libm/libmd5-perl/libmd5-perl_2.03-1_all.deb`](http://ftp.us.debian.org/debian/pool/main/libm/libmd5-perl/libmd5-perl_2.03-1_all.deb)\
`sudo dpkg -i libmd5-perl_2.03-1_all.deb`

#### PXE Error - Boot file not found (FOG versions \< 0.29) {#pxe_error___boot_file_not_found_fog_versions_0.29}

If PXE can\'t locate your boot file, Ubuntu and FOG may be expecting it
to be in different places. Creating a symbolic link may resolve the
issue:

     sudo rmdir /var/lib/tftpboot
     sudo ln -s /tftpboot /var/lib/tftpboot

## Installing Ubuntu {#installing_ubuntu}

An Ubuntu cd/dvd can be obtained from:

<http://www.ubuntu.com/>

After burning a cd/dvd of the ISO image, we must boot the live cd.

During boot select **Install Ubuntu 10.04 LTS** menu item.

<figure>
<img src="10.04.install.png" title="10.04.install.png" />
<figcaption>10.04.install.png</figcaption>
</figure>

The next screen(Step 2 of 7) will ask you about your time zone settings,
in our example we will select **Chicago** and click **forward**.

<figure>
<img src="10.04.tz.png" title="10.04.tz.png" />
<figcaption>10.04.tz.png</figcaption>
</figure>

The following screen(Step 3 of 7) will ask you for your keyboard layout,
in our example we will select **USA** and click **forward**.

<figure>
<img src="10.04.keyboard.png" title="10.04.keyboard.png" />
<figcaption>10.04.keyboard.png</figcaption>
</figure>

The next screen(Step 4 of 7) will prompt you for partitioning
information, we will select to **Erase and use entire disk**, and click
**forward**.

<figure>
<img src="10.04.part.png" title="10.04.part.png" />
<figcaption>10.04.part.png</figcaption>
</figure>

Now(Step 5 of 7) you will need to enter some user account information,
enter the required information and click, **forward**. In this example,
we used the username **administrator**, please **do not** use **fog**,
this account will be created for use by the FOG system.

<figure>
<img src="10.04.user.png" title="10.04.user.png" />
<figcaption>10.04.user.png</figcaption>
</figure>

On the final screen(Step 7 of 7), click **install** to start the
installation process.

At this point the installer will take over, this process may take a long
time, so please be patient.

When you are prompted, restart the server.

## Setting a static IP address {#setting_a_static_ip_address}

After the server restarts, log in with the account your created during
installation.

![](10.04.nm.png "10.04.nm.png") or ![](Othernm.png "Othernm.png")

Right-click on the Network-Manager icon, and select **edit
connections\...**

<figure>
<img src="10.04.ec.png" title="10.04.ec.png" />
<figcaption>10.04.ec.png</figcaption>
</figure>

In the Network Connections window select profile **Auto eth0** and click
**Edit**

<figure>
<img src="10.04.ip.png" title="10.04.ip.png" />
<figcaption>10.04.ip.png</figcaption>
</figure>

Go to the IPv4 Settings tab:

-   Change Method to Manual
-   Make sure **Connect Automatically** is checked
-   Add your static IP address with netmask and gateway.
-   Add a DNS Server address
-   Add a DNS suffic/Search domain
-   Ensure that **Available to all users** is checked.

Hit **Apply**

At this point you may need to click on the Network Manager icon and
select **Auto eth0** for the profile to be applied.

Confirm your new settings are active by right-clicking on
Network-Manager again and selecting **Connection Information**.

## Updating Ubuntu {#updating_ubuntu}

This step is optional, but highly recommended especially if you are
running this server in a production environment.

1.  Click the **System Menu -\> Administration -\> Update Manager**
2.  Click the **Check** button.
3.  Enter your password
4.  Click **Install Updates**

If a restart is required, then do so at this time.

## Setting up FOG {#setting_up_fog}

Now we must download the FOG package from sourceforge.

Option 1: To do this click on Applications -\> Internet -\> Firefox Web
Browser and enter the URL:
<http://sourceforge.net/projects/freeghost/files/>

:   Then click on the Download link.
:   Then click on the latest release (version 0.29 or later) to start
    the download. It should be named something like fog_x.xx.tar.gz

Option 2: At the Ubuntu Server console, type the following to download
the .32 version. Search for the latest version at link above:

:   sudo wget http://sourceforge.net/projects/freeghost/files/FOG/fog_0.32/fog_0.32.tar.gz

Open a terminal (Applications -\> Accessories -\> Terminal)

Now let\'s create a directory to store the downloaded FOG installers:

    sudo mkdir -p /opt/fog-setup

:   **Note:** don\'t use /opt/fog for this directory because the
    installer script will create that directory for application files
    later.

Now let\'s copy that file into the fog-setup directory with:

    sudo cp ~/Downloads/fog_*.tar.gz /opt/fog-setup/

Now we can extract the file, and perform the installation with the
following commands.

     cd /opt/fog-setup
     sudo tar -xvzf fog*
     cd fog*

**Note:** If you run FOG inside an OpenVZ container, you now want to
[make sure to enable NFS module within the
container](Installation#OpenVZ "wikilink") before continuing.

Now run the installer script with:

     cd bin
     sudo ./installfog.sh

**Your answers to the setup questions will depend on whether you are
installing FOG in an [isolated
network](FOG_on_an_Isolated_Network "wikilink") or an [existing
network](Integrating_FOG_into_an_Existing_Network "wikilink") that
already has a functioning DHCP server. Please read the appropriate guide
and adjust your answers accordingly.**

You will be prompted for the Linux distro you are installing, enter
**2** and press **enter**.

You will be prompted for the installation mode, either **N** (Normal
Server) or **S** (Storage Server). If you are not sure which option to
select, use **N** for Normal Installation.

The installer will ask you for the IP address of the server, then press
**enter**.

The installer will ask if you would like to enter a router address for
DHCP, if you would like to press **y** and press **enter**, then enter
the address, then press **enter**.

The installer will ask if you would like to enter a DNS address for DHCP
and the boot image, if you would like to press **y** and press
**enter**, then enter the address, then press **enter**.

You would then be prompted if you would like to change the default
interface from eth0, if you would like press **y**, press **enter** and
add the interface (if you are unsure, select **n**).

You will be prompted to select if you would like to install the packages
required for translations, if you would like to, press **y**\'.

Acknowledge and follow the on screen instructions for \"MySQL\". **DO
NOT SET A PASSWORD** for the root account.

After the installation has completed open Firefox again and enter the
URL: <http://localhost/fog/management>. You will then be prompted to
install the database schema. Click on the **Install/Update Now** button.
![](0.29.schema.png "0.29.schema.png")

When the schema is up to date, attempt to go to the URL:
<http://localhost/fog/management> again. This time you should be
prompted to login:

     username: '''fog''' 
     password: '''password'''

<figure>
<img src="0.29.login.png" title="0.29.login.png" />
<figcaption>0.29.login.png</figcaption>
</figure>

## Final preparation of the FOG server {#final_preparation_of_the_fog_server}

### Making FOG accessible at the root of the server (optional) {#making_fog_accessible_at_the_root_of_the_server_optional}

Edit the apache index.html via nano or your chosen editor:

    sudo nano -w /var/www/index.html

Change the content to look like:

    <html>
     <head>
      <meta http-equiv="Refresh" content="0; URL=fog/index.php">
     </head>
    </html>

Save (ctrl+o), quit (ctrl+x) and you should now be able to access FOG at
<http://server-name-or-ip/>.

### Increasing the PHP file size upload {#increasing_the_php_file_size_upload}

After Ubuntu is installed, we need to modify the server to allow
Snapin\'s of larger sizes.

Modifying PHP for FOG Snapin use -
<http://www.fogproject.org/wiki/index.php/Managing_FOG#Ubuntu>

### MySQL configuration {#mysql_configuration}

```{=mediawiki}
{{MySQL Configuration}}
```
## Testing your installation {#testing_your_installation}

```{=mediawiki}
{{Testing your installation}}
```
