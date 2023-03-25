# Installing Fedora 21 server {#installing_fedora_21_server}

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

[Fedora 21 Optimal Partitioning for FOG](https://youtu.be/uS5JSQiIgTU)

Video:

`<embedvideo service="youtube">`{=html}<https://www.youtube.com/watch?v=uS5JSQiIgTU>`</embedvideo>`{=html}

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

# Fedora 21 server pre-config {#fedora_21_server_pre_config}

## Update Fedora 21 server {#update_fedora_21_server}

Update everything installed with this line:

    yum update -y

## Continue pre-config {#continue_pre_config}

After installation is complete and reboot is done, you can work through
putty from this point forward. You can get a copy
[here](http://www.chiark.greenend.org.uk/~sgtatham/putty/download.html).

-   Log in as root with the password you set earlier.

```{=html}
<!-- -->
```
-   Disable firewalld:

```{=html}
<!-- -->
```
    systemctl stop firewalld;systemctl disable firewalld

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

We need to use FOG Trunk with Fedora 21 and later because the latest
stable release of FOG (currently 1.2.0) does not support any recent
versions of Fedora.

    yum install git -y
    cd ~
    mkdir git
    cd git
    git clone --depth 1 https://github.com/FOGProject/fogproject.git
    cd fogproject/bin
    ./installfog.sh
    echo Now you should have fog installed.

-   Follow the on-screen instructions to setup fog for your environment.
    If you are unsure about anything, choose the default option.

# Post-Configurations for Fedora 21 Server and this setup (Optional) {#post_configurations_for_fedora_21_server_and_this_setup_optional}

## Set the FOG services to start 30 seconds after boot {#set_the_fog_services_to_start_30_seconds_after_boot}

Sometimes necessary with Fedora 21 & r6551 and above (FOG 1.3.0 is above
r6551). There\'s an issue with the FOGMulticastManager after a reboot;
it\'s timing related.

There are also steps included to delay NFS and RPC for 30 seconds as
well, this is needed for very fast servers - doing it on all servers
won\'t hurt.

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

```{=html}
<!-- -->
```
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

## Verify Fedora DHCP config (if using DHCP) {#verify_fedora_dhcp_config_if_using_dhcp}

You may restart and check status of the DHCP service with these
commands:

    systemctl restart dhcpd.service
    systemctl status dhcpd.service

The configuration file is located here: /etc/dhcp/dhcpd.conf

You can edit it using this command:

    vi /etc/dhcp/dhcpd.conf

Instructions on using Vi: [Vi](Vi "wikilink")

Here is an *EXAMPLE* config file that uses a 255.255.240.0 subnet mask:

    option space PXE;
    option PXE.mtftp-ip    code 1 = ip-address;
    option PXE.mtftp-cport code 2 = unsigned integer 16;
    option PXE.mtftp-sport code 3 = unsigned integer 16;
    option PXE.mtftp-tmout code 4 = unsigned integer 8;
    option PXE.mtftp-delay code 5 = unsigned integer 8;
    option arch code 93 = unsigned integer 16; # RFC4578

    use-host-decl-names on;
    ddns-update-style interim;
    ignore client-updates;
    next-server 10.12.1.11;


    subnet 10.12.0.0 netmask 255.255.240.0 {
            option subnet-mask              255.255.240.0;
            range dynamic-bootp 10.12.5.1 10.12.7.254;
            default-lease-time 21600;
            max-lease-time 43200;
            option domain-name-servers      10.51.1.6;
                    option routers      10.12.15.254;
            filename "undionly.kkpxe";
    }

Things you might want to verify in this file is:

-   The range of IPs you want to give out.

```{=html}
<!-- -->
```
-   The subnet address.

```{=html}
<!-- -->
```
-   The subnet mask.

```{=html}
<!-- -->
```
-   The bootfile you want to use. The default is set to undionly.kpxe
    and this works with most newer computers. Older computers (and
    especially Lenovos) should use undionly.kkpxe

To find your network address and subnet mask, at the CLI, you\'d type:

    route -n

```{=mediawiki}
{{:Related to ISC-DHCP}}
```
## Configuring existing Windows DHCP server (If using Windows DHCP) {#configuring_existing_windows_dhcp_server_if_using_windows_dhcp}

Inside your DHCP server, we have to set some options.

-   IPv4 -\> Scope -\> Scope Options.
-   Right click Scope Options.
-   Enable 066 Boot Server Host Name, enter the FOG servers IP.
-   Enable 067 Bootfile Name, set it as
        undionly.kkpxe

Note: You may use any of the boot files listed in /tftpboot on the FOG
server. the most common is undionly.kpxe and undionly.kkpxe

See also:
[BIOS_and_UEFI_Co-Existence](BIOS_and_UEFI_Co-Existence "wikilink")

## dnsmasq (if using ProxyDHCP) setup {#dnsmasq_if_using_proxydhcp_setup}

Install dnsmasq:

    yum install -y dnsmasq

edit the ltsp.conf file:

    vi /etc/dnsmasq.d/ltsp.conf

Instructions on using Vi: [Vi](Vi "wikilink")

    port=0
    log-dhcp
    tftp-root=/tftpboot
    dhcp-boot=undionly.0,x.x.x.x,x.x.x.x
    dhcp-option=17,/images
    dhcp-option=vendor:PXEClient,6,2b
    dhcp-no-override
    pxe-prompt="Press F8 for boot menu", 3
    pxe-service=X86PC, Boot from network, undionly
    pxe-service=X86PC, "Boot from local hard disk", 0
    dhcp-range=x.x.x.x,proxy

Where you see \"x.x.x.x\", replace this with your FOG server\'s IP
address. You may change the timeout for the menu or remove it totally.

Copy your desired undionly.xxx file to undionly.0 In this example, we
will use undionly.kkpxe

    cp /tftpboot/undionly.kkpxe /tftpboot/undionly.0

I do not advise using symbolic links, I have seen them fail. Copies will
work 100% of the time.

Restart dnsmasq:

    systemctl restart dnsmasq.service

Enable dnsmasq to start on boot:

    systemctl enable dnsmasq.service

## Updating FOG to Latest {#updating_fog_to_latest}

    cd ~
    cd git/fogproject
    git pull
    cd bin
    ./installfog.sh

## Working from the comforts of your desk (using SSH - Optional but highly recommended) {#working_from_the_comforts_of_your_desk_using_ssh___optional_but_highly_recommended}

Connect using SSH from another Linux machine

    ssh -l root x.x.x.x

restart server

    shutdown -r

or

    reboot

## Formatting & mounting a 2nd drive {#formatting_mounting_a_2nd_drive}

    ls -l /dev/sd*

(lists all scsi/sata device files to find the new extra disk device
file)

The output will look *something* like this.

    brw-rw---- 1 root disk 8,  0 Apr  6 17:49 /dev/sda
    brw-rw---- 1 root disk 8,  1 Apr  6 17:49 /dev/sda1
    brw-rw---- 1 root disk 8,  2 Apr  6 17:49 /dev/sda2
    brw-rw---- 1 root disk 8, 16 Apr  6 20:49 /dev/sdb

Normally sda is drive 1. sdb is drive 2. Note that SATA drives begin
with sd, IDE drives begin with HD, and SD cards begin with mmcblk. If
you had additional drives or even flash drives, they\'d be listed as
sdc, sdd, sde, sdf, etc. Or for IDE drives, hda, hdb, hdc. Or for SD
cards or flash drives it would be soemthing like mmcblka, mmcblkb,
mmcblkc.

Note that partitions are labeled similarly. say that /dev/sda has 3
partitions. They would be seen by the Linux kernel as /dev/sda0,
/dev/sda1, and /dev/sda2. The same numbering scheme would apply to other
types of drives.

After identifying the right **drive** (not partition, but the actual
disk itself), you\'ll want to maybe delete existing partitions on it,
and create a new partition on it. For this, we use fdisk.

Say our device was called /dev/sdb, the command would be:

    [root@localhost ~]# fdisk /dev/sdb

    Welcome to fdisk (util-linux 2.25.2).
    Changes will remain in memory only, until you decide to write them.
    Be careful before using the write command.


    Command (m for help): 

hit the \"m\" key to get the menu, to show you what you can do in
there - you should really follow the menu but: \"d\" deletes partitions.
\"g\" creates a new GPT partition, so tap \"g\" if you\'re in UEFI.
\"n\" for a new MBR type partition. After creating the partition, you
can verify it with \"p\" You must write your changes with \"w\",
otherwise nothing will be done.

We need to format that partition next (we\'re going to do it the
ultra-simple but probably \"will upset old-time Linux users\" way). if
you\'d like an ext4 filesystem, you\'d use:

    mkfs.ext4 /dev/sdb

Next, we want that partition to mount to the /images2 directory at boot.
We\'ll need to edit /etc/fstab for this, and you\'ll need to use Vi to
do it (it\'s easy).

    vi /etc/fstab

Instructions on using Vi: [Vi](Vi "wikilink")

You need to add this line to the end of the file. Make sure to use the
right partition name, and the right file system type.

    /dev/sdb    /images2    ext4    defaults    0    0

When you\'re done, you need to stop \"inserting\", to do that, hit the
escape key. Now, you need to write your changes. do that by typing :w
and then hit enter. It should tell you it wrote the changes. Next, to
quit, type :q and hit enter.

You may reboot to mount, or you can mount now using this:

    cd /
    mkdir images2
    mount /images2

Now, you\'ll need to create the necessary sub-files and sub-directory on
the new drive and set ownership and permissions. Use the path where you
mounted it, but below I\'ll be using /images2

    touch /images2/.mntcheck
    mkdir /images2/dev
    touch /images2/dev/.mntcheck
    chown -R fog:root /images2
    chmod -R 777 /images2

Now, you\'ll want to create an nfs export for the new images2 directory.
Edit the file /etc/exports to do that. If this is a pre-existing fog
server, you\'ll already have two lines in here about /images and
/images/dev/. They will look like this, `<font color="red">`{=html}note
the fsid`</font>`{=html}.

    /images *(ro,sync,no_wdelay,no_subtree_check,insecure_locks,no_root_squash,insecure,fsid=0)
    /images/dev *(rw,async,no_wdelay,no_subtree_check,no_root_squash,insecure,fsid=1)

The FSID must be unique for each entry. Basically, you\'d copy the two
lines already in there, and paste them at the bottom of the file. Change
the paths on the two new lines to /images2 and /images2/dev and them
make the FSID 2 and 3.

So, you would use Vi to edit this file. The command would be:

    vi /etc/exports

Instructions on using Vi can be found here: [Vi](Vi "wikilink")

After this file is modified correctly, you can either restart the NFS
related services or reboot the server. Restarting the services is
different depending on the OS you\'re running. Instructions on that can
be found in a subsection of the Troubleshoot NFS article here:
[Troubleshoot_NFS#NFS\_.26_RPC\_.2F_Portmap_Service](Troubleshoot_NFS#NFS_.26_RPC_.2F_Portmap_Service "wikilink")

All done with HDD installation. You may add this new directory as a
secondary storage node inside of \"Storage Management\" via the web
interface. Just fill out the correct NFS and FTP path, and use the same
credentials as the other /images node in the web interface (because they
will be the same, because it\'s the same server). I would strongly
advise creating a new storage group to put the new storage node into.
Then you should be ready to do a test image upload.

## Mounting a CIFS share at boot (for NAS, Windows, Samba) {#mounting_a_cifs_share_at_boot_for_nas_windows_samba}

This is how you would mount a windows share to Fedora 21 server for
backups or other numerous reasons.

    cd /
    mkdir backups
    sudo chmod -R 777 backups
    vi /etc/fstab

Instructions on using Vi: [Vi](Vi "wikilink")

Add this line to the bottom of /etc/fstab to permanently mount
//x.x.x.x/RemoteSharedFolder to the folder called backups:

    //x.x.x.x/RemoteSharedFolder /backups cifs username=UserNameHere,password=PasswordHere,noperm,iocharset=utf8,file_mode=0777,dir_mode=0777 0 0

Where x.x.x.x is the remote share\'s IP. Replace the username and
password. Please note that your password will be stored in plain-text.
There are other methods of mounting without storing your passwords in
such an obvious place, but this is not within the scope of this
document. We\'re doing it the quick and dirty way to get you going with
minimal difficulty.

After adding this line and before the next reboot, you may mount the
share immediately. For this example, you\'d simply tell the local folder
to mount.

    mount /backups

To unmount the folder from the share, you\'d add a u to mount.

    umount /backups

But of course, due to the entry in /etc/fstab, this will mount on every
boot automatically.

See also: [Password Protected Samba
Share](Password_Protected_Samba_Share "wikilink")

Here is another good resource on the topic:
[linux-mount-cifs-windows-share](http://www.cyberciti.biz/faq/linux-mount-cifs-windows-share/)

## Mount SMB share on the fly - not permanently {#mount_smb_share_on_the_fly___not_permanently}

To mount:

    mkdir /tempMount
    mount -t cifs //x.x.x.x/ShareNameGoesHere /tempMount -o username=YourUsernameGoesHere -o password=YourPasswordGoesHere,noexec

To unmount:

    umount /tempMount
