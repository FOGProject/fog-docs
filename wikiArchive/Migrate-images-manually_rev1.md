This describes how to manually migrate all images to a new server.

Related article: [Migrate FOG](Migrate_FOG "wikilink")

# Image directory {#image_directory}

Make sure your image directory on the destination server has the hidden
marker files:

    touch /images/.mntcheck /images/dev/.mntcheck

# Image files {#image_files}

Below are many options for migrating all images. This article assumes
you have FOG installed already on the new server, because the installer
would setup FTP and NFS for you. Fog doesn\'t setup Samba but an example
of how to use a Samba share is included. Where you see x.x.x.x, this is
the old storage node\'s IP address. These commands are written to be run
on the new storage node, however they can be altered to run on the old
storage node.

## using lftp {#using_lftp}

    lftp -c 'open x.x.x.x; user UserGoesHere PasswordHere; mirror -e /images/TheImagePath /images/TheImagePath; quit'

Example:

    lftp -c 'open 10.0.0.4; user fog MyAwesomePassword; mirror -e /images /images; quit'

## using NFS {#using_nfs}

    mount x.x.x.x:/<remote source> <local mount point>
    cp -R /<local mount point>/* /<local destination>
    umount <local mount point>

Example:

    mkdir /tempMount
    mount 10.0.0.4:/images /tempMount
    cp -R /tempMount/* /images
    umount /tempMount

## Using Samba {#using_samba}

    mkdir /LocalMountPointHere
    mount -t cifs //x.x.x.x/ShareNameGoesHere /LocalMountPointHere -o username=YourUsernameGoesHere -o password=YourPasswordGoesHere,noexec
    cp -r /LocalMountPointHere/* /DestinationHere
    umount /LocalMountPointHere

Example:

    mkdir /tempMount
    mount -t cifs //10.0.0.4/images /tempMount -o username=root -o password=MyAwesomePassword,noexec
    cp -r /tempMount/* /images
    umount /tempMount

## Using SCP {#using_scp}

    scp -r root@x.x.x.x:/images/* /images

Example:

    scp -r root@10.0.0.4:/images/* /images

### Enabling ssh root access on Ubuntu/Debian {#enabling_ssh_root_access_on_ubuntudebian}

Install ssh

    apt-get install openssh-server -y

Then adjust the ssh config file to allow root to log in. The
configuration file is located at
`<font color="red">`{=html}/etc/ssh/sshd_config`</font>`{=html} Change
the line \"`<font color="red">`{=html}PermitRootLogin`</font>`{=html}\"
to be yes instead of whatever the default is. The line should look like
this when you\'re done: `<font color="red">`{=html}PermitRootLogin
yes`</font>`{=html} Use the text editor of your choice to do it. I like
to use Vi.

    vi /etc/ssh/sshd_config

Instructions on using VI: [Vi](Vi "wikilink")

Then you should enable and restart sshd, follow steps below.

    systemctl enable sshd
    systemctl restart sshd

You should now be able to ssh and SCP to and from your Ubuntu/Debian
box.

## Using rsync {#using_rsync}

    rsync -a root@x.x.x.x:/images/* /images

Example:

    rsync -a root@10.0.0.4:/images* /images

# Image Definitions {#image_definitions}

Image definitions are what\'s stored in the database, and what is
displayed in the web interface. There are DB entries for each image.
Image definitions do not automatically appear just because the image
files are present on the storage node, this is a common misconception.

You may recreate these manually, but you **must** recreate them exactly
as they were on the old server. The image path **must** be exact and is
**case sensitive**, the image OS and image type **must** be set exactly
as in the old server as well.

The easiest option is to use FOG\'s export/import feature inside of
Image Management.
