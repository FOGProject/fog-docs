## NFS\'s roles in FOG {#nfss_roles_in_fog}

NFS is used to transfer images to and from hosts in FOG, and is used on
both the host and server. The server\'s setting file controls what files
& directories are exported, and their options. NFS allows writing to the
/images/dev directory and allows reading from the /images directory.
During imaging, the host mounts either /images/dev (for capturing an
image) or /images (for deploying an image).

During capture, FOS (fog operating system) captures images to:
/images/dev/`<MAC Address Of Client>`{=html}

During download/deployment, NFS downloads images from:
/images/`<Image Path>`{=html}

Please note that FTP is used to move images from /images/dev to /images.
Also note that an imported directory can not be re-exported. For
example, if you have a remote share mounted to your FOG server, you
cannot export this directory via /etc/exports for imaging purposes. If
you\'d like your storage to be remote, an additional storage node or an
FTP & NFS capable NAS device must be used.

## Testing NFS {#testing_nfs}

### Using a FOG debug deployment for testing (easy & quick way) {#using_a_fog_debug_deployment_for_testing_easy_quick_way}

The first thing we must do is create a test file that we use to test
with. On your FOG server:

    echo 'This is the text I use to test with.' > /images/test.txt

Select the problematic client from your Hosts list in the web UI, Choose
\"Basic Tasks\", then pick download. Create an immediate debug task. See
picture below:

<figure>
<img src="Debug_Download_Task.png" title="Debug_Download_Task.png" />
<figcaption>Debug_Download_Task.png</figcaption>
</figure>

At the client, if it did not WOL, turn it on. After the client shows
options on the screen, you can press \[enter\] twice to be given a
command prompt.

You first need to create two directories to mount to:

    mkdir /images
    mkdir /images/dev

Next, we will mount to FOG\'s remote image directories like this:

    mount -o nolock,proto=tcp,rsize=32768,intr,noatime x.x.x.x:/images /images
    mount -o nolock,proto=tcp,rsize=32768,intr,noatime x.x.x.x:/images/dev/ /images/dev

Next, we will execute a command that will test the NFS aspects of deploy
and capture at the same time. We will attempt to read /images/test.txt
and write that file to /images/dev/test.txt

    cp /images/test.txt /images/dev/test.txt

If you recieved no errors, you\'re probably good to go. You can confirm
all went well by looking at the contents of the moved file:

    cat /images/dev/test.txt

### Using a separate Linux machine for testing (hard & long way) {#using_a_separate_linux_machine_for_testing_hard_long_way}

#### below r3472 (1.2.0 is below r3472, if you\'re above this, proceed to 2.2.2) {#below_r3472_1.2.0_is_below_r3472_if_youre_above_this_proceed_to_2.2.2}

inside /etc/exports on the FOG server, Set the fsid for /images to 0 and
/images/dev to 1

    sudo vi /etc/exports

instructions on using Vi: [Vi](Vi "wikilink")

Save that, exit that, then run this:

    exportfs -a

**Restart NFS and RPC** (see services below)

After restarting NFS and RPC, **proceed to the steps just below**:

#### r3473 and above {#r3473_and_above}

The first thing we must do is create a test file that we use to test
with. On your FOG server:

    echo 'This is the text I use to test with.' > /images/test.txt

At the CLI of the **separate Linux machine**:

Create local directories

    mkdir /images
    mkdir /images/dev

You can configure the mounts for the /images and the /images/dev
directories of your FOG server on your separate Linux machine by
executing these two commands:

    mount x.x.x.x:/images /images
    mount x.x.x.x:/images/dev /images/dev

Next, we will execute a command that will test the NFS aspects of deploy
and capture at the same time. We will attempt to read /images/test.txt
and write that file to /images/dev/test.txt

    cp /images/test.txt /images/dev/test.txt

If you recieved no errors, you\'re probably good to go. You can confirm
all went well by looking at the contents of the moved file:

    cat /images/dev/test.txt

## NFS & RPC / Portmap Service {#nfs_rpc_portmap_service}

### Fedora 20/21/22/23/24 & CentOS 7 {#fedora_2021222324_centos_7}

NFS Status:

    systemctl status nfs-server

(should be on and green, no errors, and enabled)

The restart command is most useful, if any errors are encountered during
manual start/restart, they are displayed.

    systemctl restart nfs-server

Enable NFS on boot:

    systemctl enable nfs-server

RPC Status:

    systemctl status rpcbind

Restart RPC:

    systemctl restart rpcbind

Enable RPC on boot:

    systemctl enable rpcbind

### Ubuntu

NFS status:

    sudo service nfs-kernel-server status

The restart command is most useful, if any errors are encountered during
manual start/restart, they are displayed.

    sudo service nfs-kernel-server restart

Enable on boot:

    update-rc.d nfs-kernel-server defaults

RPC status:

    sudo service rpcbind status

Restart RPC:

    sudo service rpcbind restart

Enable RPC on boot:

    update-rc.d rpcbind defaults

## FOG\'s web console NFS settings {#fogs_web_console_nfs_settings}

Applies to FOG 1.2.0 and up.

Inside of here:

Storage Management -\> \[YourStorageNode\] -\> Image Path

This is the actual path of the images directory on the storage node. In
a basic installation, the storage node is hosted on the FOG server
itself. The image path should be reflected inside of the /etc/exports
file (See NFS Settings below).

Most commonly, the image path is simply:

    /images

## NFS Settings File {#nfs_settings_file}

The primary NFS settings file is located here:

    /etc/exports

To view the contents of the file:

    cat /etc/exports

On a standard FOG install where everything is self-contained on one
system, it should look like this:

    /images *(ro,sync,no_wdelay,no_subtree_check,insecure_locks,no_root_squash,insecure,fsid=0)
    /images/dev *(rw,async,no_wdelay,no_subtree_check,no_root_squash,insecure,fsid=1)

To edit the file:

    sudo vi /etc/exports

Instructions on using Vi: [Vi](Vi "wikilink")

## Creating & verifying .mntcheck files {#creating_verifying_.mntcheck_files}

.mntcheck is a hidden and empty file that a FOG client uses during image
capture and image download/deployment to verify an NFS share is mounted
correctly.

To create these files, on the FOG server:

    touch /images/.mntcheck
    touch /images/dev/.mntcheck

Verify these files with:

    ls -laR /images | grep .mntcheck

This should return two results. One for /images and one for /images/dev

Permissions should also be set appropriately for these files. See the
permissions section.

## Disable & Verify Firewall {#disable_verify_firewall}

```{=mediawiki}
{{:Disable & Verify Firewall}}
```
## Permissions

For the purposes of this article (troubleshooting), the /images
directory should have 777 permissions set recursively.

You can do that like this:

    chmod -R 777 /images

## Common problems and fixes {#common_problems_and_fixes}

### My problem isn\'t in the WiKi! {#my_problem_isnt_in_the_wiki}

```{=mediawiki}
{{:My problem isn't in the WiKi!}}
```
### Image Capture: Error Checking Mount {#image_capture_error_checking_mount}

The Client mounts the NFS share successfully but throws an error while
checking the mounted Share.

    * Preparing to send image file to server 
    * Mounting File System......................................mount:ser.ver.ipa.ddr:/data/images/dev/ failed, reason given by server: Permission denied 
    Done 

    * Checking Mounted File System ........................ 
    ########################################################################################### 
    #                                                                                         # 
    # An error has been detected                                                              # 
    #                                                                                         # 
    ########################################################################################### 
     
    Fatal Error: Failed to mount NFS Volume. 
     
    ########################################################################################### 
    #                                                                                         # 
    # Computer will reboot in 1 minute.                                                       # 
    #                                                                                         # 
    ########################################################################################### 

The error in FOG 1.3.0 is \"Could not mount images folder
(/bin./fog.download)\" as pictured below.

<figure>
<img src="Could_not_mount_images_folder.png"
title="Could_not_mount_images_folder.png" />
<figcaption>Could_not_mount_images_folder.png</figcaption>
</figure>

In the folder on your server, check for the **.mntcheck files**. If
these are not there then perform the following commands \[Linux Systems
Only\]

**touch /images/dev/.mntcheck**

**touch /images/.mntcheck**

If still receiving the same error message after perfroming the above
commands, you may need to edit /etc/exports to include your new mount
point, i.e. /data/images and /data/images/dev with corresponding
permissions.

See following examples of /etc/exports:

Example 1

    /images *(ro,sync,no_wdelay,no_subtree_check,insecure_locks,no_root_squash,insecure,fsid=0)
    /images/dev *(rw,async,no_wdelay,no_subtree_check,no_root_squash,insecure,fsid=1)

Example 2

    /data/images *(ro,sync,no_wdelay,no_subtree_check,insecure_locks,no_root_squash,insecure,fsid=0)
    /data/images/dev *(rw,async,no_wdelay,no_subtree_check,no_root_squash,insecure,fsid=1)

------------------------------------------------------------------------
