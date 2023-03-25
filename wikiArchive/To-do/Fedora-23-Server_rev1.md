# Installing Fedora 23 server {#installing_fedora_23_server}

## Configuring partitions for FOG {#configuring_partitions_for_fog}

The one thing with using Fedora (or any red-hat based distro) is that
the default partitioning isn\'t optimal for FOG. The default is that
\"root\" only gets 50 GiB and the rest goes to /home. This is not
optimal.

You should delete any existing partitions, and then select \"create
partitions automatically\". This is the easiest. Then you can manipulate
and delete unneeded partitions. The most simple partitioning setup for
FOG is below:

-   Give the `<font color="red">`{=html}swap`</font>`{=html} partition
    the same amount as the amount of RAM the system has.

```{=html}
<!-- -->
```
-   Optionally delete the
    `<font color="red">`{=html}/home`</font>`{=html} partition or limit
    it\'s size to something very small (perhaps 10GB).

```{=html}
<!-- -->
```
-   Limit `<font color="red">`{=html}/`</font>`{=html} (root) to 20GB
    instead of 50 (optional but recommended). Please keep in mind that
    this is also the partition where the snapins are stored. If you plan
    to use a lot of snapins and don\'t think that (roughly) 15GB is
    enough, then leave this at 50.

```{=html}
<!-- -->
```
-   Increase the size of
    `<font color="red">`{=html}/boot`</font>`{=html} from 500MB to 1GB
    for breathing room in the future (optional but recommended).

```{=html}
<!-- -->
```
-   Finally, create a `<font color="red">`{=html}/images`</font>`{=html}
    partition with all remaining space.

Fedora (and most Red-Hat based distributions) auto-adjust partition
sizes for you if you go over what is available\... meaning.. if you are
unsure about how much space is left on the drive to assign to
`<font color="red">`{=html}/images`</font>`{=html}, you can leave the
size field blank and hit \"update\" and the installer will auto adjust
to what is available.

Another thing to keep in mind is when you install on UEFI enabled
hardware, there will be an EFI boot partition made automatically - leave
that partition alone.

(Note: Video plays in Chrome or Firefox with html5 plugin)

External Video Link:

[Fedora 23 FOG Optimal Partitioning](https://youtu.be/_yfpGxF5vMY)

Video:

`<embedvideo service="youtube">`{=html}<https://www.youtube.com/watch?v=_yfpGxF5vMY>`</embedvideo>`{=html}

## Continue installation {#continue_installation}

-   Under network settings, set a static IP with Subnet & router info
    and set a hostname. DNS entries are comma delimited (no spaces). For
    these to take effect, you can toggle off/on the network adapter.
    It\'s a slide switch on the NIC selection page.

```{=html}
<!-- -->
```
-   Set the timezone (and any preferred NTP servers).

```{=html}
<!-- -->
```
-   Start installing.

```{=html}
<!-- -->
```
-   Set a root password.

# Fedora 23 server pre-config {#fedora_23_server_pre_config}

## Update Fedora 23 server {#update_fedora_23_server}

Update everything installed with this line:

    dnf update -y

## Continue pre-config {#continue_pre_config}

After installation is complete and reboot is done, you can work through
putty from this point forward. You can get a copy
[here](http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html).

-   Log in as root with the password you set earlier.

```{=html}
<!-- -->
```
-   Configure firewalld:

```{=html}
<!-- -->
```
    dnf install firewalld -y
    systemctl start firewalld
    systemctl enable firewalld
    for service in http https tftp ftp mysql nfs mountd rpc-bind proxy-dhcp samba; do firewall-cmd --permanent --zone=public --add-service=$service; done

    echo "Open UDP port 49152 through 65532, the possible used ports for fog multicast" 
    firewall-cmd --permanent --add-port=49152-65532/udp
    echo "Allow IGMP traffic for multicast"
    firewall-cmd --permanent --direct --add-rule ipv4 filter INPUT 0 -p igmp -j ACCEPT
    systemctl restart firewalld.service
    echo "Done."

-   Add firewalld exceptions for DHCP and DNS (if you plan to run DHCP
    on your FOG server):

```{=html}
<!-- -->
```
    for service in dhcp dns; do firewall-cmd --permanent --zone=public --add-service=$service; done
    firewall-cmd --reload
    echo Additional firewalld config done.

-   Set SELinux to permissive on boot by editing /etc/selinux/config

```{=html}
<!-- -->
```
    vi /etc/selinux/config

Instructions on using Vi: [Vi](Vi "wikilink")

Change the line

    SELINUX=enforcing

to

    SELINUX=permissive

-   Set SELinux to permissive on the fly (this is not persistent, the
    above config must be set to be persistent):

```{=html}
<!-- -->
```
    setenforce 0

# Setup FOG Trunk {#setup_fog_trunk}

This will install the latest developmental version of FOG using the Git
method found here: [Upgrade to trunk](Upgrade_to_trunk "wikilink")

We need to use FOG Trunk with Fedora 23 and later because the latest
stable release of FOG (currently 1.2.0) does not support any recent
versions of Fedora.

    dnf install git -y
    cd ~
    mkdir git
    cd git
    git clone --depth 1 https://github.com/FOGProject/fogproject.git
    cd fogproject/bin
    ./installfog.sh
    echo Now you should have fog installed.

-   Follow the on-screen instructions to setup fog for your environment.
    If you are unsure about anything, choose the default option.

# Post Config {#post_config}

## Set the FOG services to start 30 seconds after boot {#set_the_fog_services_to_start_30_seconds_after_boot}

Necessary with Fedora 23 & r6551 and above (FOG 1.3.0 is above r6551).
There can be an issue with the FOGMulticastManager after a reboot; it\'s
timing related. There are also steps included to delay NFS and RPC for
30 seconds as well, this is needed for very fast servers - doing it on
all servers won\'t hurt.

-   Disable FOG services with:

```{=html}
<!-- -->
```
    systemctl disable FOG{MulticastManager,Scheduler,SnapinReplicator,ImageReplicator}
    systemctl disable nfs-server
    systemctl disable rpcbind

Create a startup script with:

    vi /etc/rc.d/rc.local

Instructions on using Vi: [Vi](Vi "wikilink")

-   Make that file look like below, exactly. This creates a 30 second
    delay for starting these services at boot.

Note: This file may already be created. In such case, you will notice
that the line `<font color="red">`{=html}#!/bin/bash`</font>`{=html} is
already there. You may add the other lines at the bottom of the file.

    #!/bin/bash
    sleep 30
    systemctl start nfs-server
    systemctl start rpcbind
    systemctl start FOGMulticastManager
    systemctl start FOGScheduler
    systemctl start FOGSnapinReplicator
    systemctl start FOGImageReplicator
    exit 0

-   save the file

```{=html}
<!-- -->
```
-   Then Run this command to make that file executable:

```{=html}
<!-- -->
```
    chmod +x /etc/rc.d/rc.local
