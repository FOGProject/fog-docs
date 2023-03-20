## Including multiple TFTP servers {#including_multiple_tftp_servers}

This section was added based on [this forum
thread](https://sourceforge.net/projects/freeghost/forums/forum/730844/topic/3622667)
with credit going to [Jordan
Hoff](https://sourceforge.net/users/jhoff484/) who describes how to
provide the necessary services to allow FOG to span across isolated
network segments. A traditional \'Master Storage Node\' as described
[here](Managing_FOG#Storage_Manangement "wikilink") only provides File
Storage services to increase unicast throughput within a single network.
The steps below describe how to modify a Storage Node to also provide
PXE and TFTP services for a separate network segment.

## 0.32?? and earlier {#and_earlier}

#### Ubuntu Server LTS 10.04 using fog_0.29 {#ubuntu_server_lts_10.04_using_fog_0.29}

[`sudo`](http://en.wikipedia.org/wiki/Sudo) is assumed unless
specified.\
===== Changes on the Master Server ===== On the master server, edit the
`/etc/exports` file, and append the following line:

    /tftpboot/pxelinux.cfg *(ro,sync,no_wdelay,no_root_squash,insecure,no_subtree_check)

While you\'re in there, append `no_subtree_check` to the other entries
to prevent warnings in the next step.\
Then, enable the newly configured exports by executing the following
command:

    exportfs -a

Now, we need to setup
[rsyncd](https://help.ubuntu.com/community/rsync#Rsync%20Daemon):\
Edit /etc/default/rsync to change `RSYNC_ENABLE=false` to:

    RSYNC_ENABLE=inetd

Install xinetd:

    sudo apt-get -y install xinetd

Create or edit `/etc/xinetd.d/rsync` file to launch rsync (if it already
exists just change `RSYNC_ENABLE=false` to:`RSYNC_ENABLE=true`):

    service rsync
    {
        disable = no
        socket_type = stream
        wait = no
        user = root
        server = /usr/bin/rsync
        server_args = --daemon
        log_on_failure += USERID
        flags = IPv6
    }

Now create or edit a /etc/rsyncd.conf file with the following:

    max connections = 2
    motd file = /etc/rsyncd.motd
    log file = /var/log/rsyncd.log
    pid file = /var/run/rsyncd.pid
    lock file = /var/run/rsync.lock
    timeout = 300

    [tftpboot]
        path = /tftpboot
        comment = Fog tftpboot share
        read only = true
        exclude = *pxelinux.cfg/*

\
And start the rsyncd daemon:

    rsync --daemon

Restart xinetd:

    service xinetd restart

Now, our master server is ready to share everything it needs for another
PXE server to operate. Lets go and setup a new server!\
\-\-\--

##### Setting up the remote Storage Node {#setting_up_the_remote_storage_node}

Setup your secondary server as you normally would, before installing
fog. (In this example, I use Ubuntu, so you will have to modify this
process if you are using anything else)\
After the network is configured and updates are applied, download and
extract fog_0.29 following the basic
[instructions](http://www.fogproject.org/wiki/index.php?title=Ubuntu_10.04#Setting_up_FOG_on_Ubuntu).\
Before executing the setup script, there are two files to modify:\
Edit the main `/opt/fog-setup/fog_0.29/bin/installfog.sh` script. Locate
the section titled:`# Storage Node installation` Insert the following
line after `configureFTP;` and save the script:

    configureTFTPandPXE;

Edit the `/opt/fog-setup/fog_0.29/lib/ubuntu/config.sh` script: Locate
the line beginning with `storageNodePackages` (on line #24) and add
these two packages within the quotes:

    tftpd-hpa tftp-hpa

\
\
Then, just install the fog storage node as usual. The modifications
above will install and configure TFTP / PXE services for us. Then, all
we have to do is tie it back to the main server.\
\
First, remove everything in the /tftpboot folder on the secondary node:

    rm -rf /tftpboot/*

Now initiate rsync for the `/tftpboot` folder:

    rsync -rv mainserver.yourcompany.com::tftpboot/ /tftpboot

Now, we setup the crontab to run every hour(at the 15 minute mark of
each, or modify to your liking)

    crontab -e (you may be asked to select an editor)
    15 * * * * rsync -rv mainserver.yourcompany.com::tftpboot /tftpboot

Then, all that is left is to setup our NFS share for the pxelinux.cfg
folder. Modify `/etc/fstab` and add the following:

    mainserver.yourcompany.com:/tftpboot/pxelinux.cfg /tftpboot/pxelinux.cfg nfs nolock 0 0

Save and close, then we mount this folder one time (the fstab entry
above ensures that it will re-mount automatically at reboot):

    mount /tftpboot/pxelinux.cfg

##### Add the Storage Node to your main server {#add_the_storage_node_to_your_main_server}

See: [Adding the Node to the Management
Portal](#Adding_the_Node_to_the_Management_Portal "wikilink")\
And that\'s it! Go ahead and test out your fancy new PXE server.\
===Exceptions===

-   Note that in testing the above solution did NOT automatically sync
    the /images folder. I manually run the following command for each
    image I want *from the Storage Node*:
        sudo scp -r root@mainFOGserver:/images/nameOfImage /images/
-   Another very useful addition is [this
    patch](https://sourceforge.net/projects/freeghost/forums/forum/716419/topic/4006688)
    which provides clients the intelligence to use the closest node.
-   This also does NOT provide WOL packets to be sent via the local
    Storage Nodes.

## 1.x.x

##### Setting up the remote Storage Node {#setting_up_the_remote_storage_node_1}

Setup your secondary server as you normally would, before installing
fog.

###### Ubuntu

After the network is configured and updates are applied, download and
extract fog as you normally would\
Before executing the setup script, there are two files to modify:\
Edit the main `/opt/fog-setup/fog_version/bin/installfog.sh` script.
Locate the section titled:`# Storage Node installation` Insert the
following line after `configureFTP;` and save the script:

    configureTFTPandPXE;

Edit the `/opt/fog-setup/fog_version/lib/ubuntu/config.sh` script:
Locate the line beginning with `storageNodePackages` (on line #25) and
add these two packages within the quotes:

    tftpd-hpa tftp-hpa

\
\
Then, just install the fog storage node as usual. The modifications
above will install and configure TFTP / PXE services for us.

###### Redhat

After the network is configured and updates are applied, download and
extract fog as you normally would\
Before executing the setup script, there are two files to modify:\
Edit the main `/opt/fog-setup/fog_version/bin/.install.sh` script.
Location the section titled: \<`# Storage Node installation` Insert the
following line after `configureFTP;` and save the script:

    configureTFTPandPXE;

Edit the `/opt/fog-setup/fog_version/lib/redhat/config.sh` script:
Location the line beginning with `storageNodePackages` (on lines 27, 34,
and 39 and add this package within the quotes:

    tftp-server

\
\
Then, just install the fog storage node as usual. The modifications
above will install and configure TFTP / PXE services for us.
