# Installing Fedora 25 server {#installing_fedora_25_server}

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

[Fedora 25 Optimal FOG Partitioning](https://youtu.be/JkapIh1XdjQ)

Video:

`<embedvideo service="youtube">`{=html}<https://www.youtube.com/watch?v=JkapIh1XdjQ&feature=youtu.be>`</embedvideo>`{=html}

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

# Fedora 25 server pre-config {#fedora_25_server_pre_config}

## Update Fedora 25 server {#update_fedora_25_server}

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

-   Set SELinux to permissive on boot:

```{=html}
<!-- -->
```
    sed -i.bak 's/^.*\SELINUX=enforcing\b.*$/SELINUX=permissive/' /etc/selinux/config

-   Set SELinux to permissive on the fly (this is not persistent, the
    above config must be done to be persistent):

```{=html}
<!-- -->
```
    setenforce 0

# Setup FOG {#setup_fog}

We need to use FOG 1.4.2 or later with Fedora 25 and later, as this is
currently the latest stable release and is tested working with the
latest stable release daily.

    dnf install git -y
    cd ~
    mkdir git
    cd git
    git clone https://github.com/FOGProject/fogproject.git
    cd fogproject/bin
    ./installfog.sh
    echo Now you should have fog installed.

-   Follow the on-screen instructions to setup fog for your environment.
    If you are unsure about anything, choose the default option.
