OUTDATED: this information is for an old version of FOG. See
[Managing_FOG#Storage_Management](Managing_FOG#Storage_Management "wikilink")
how to change the image path.

------------------------------------------------------------------------

This is **not about a seperate NFS server** in general, but about how to
**change the local storage directory** and export it correctly.

As FOG sets the default location to /images in your / -partition you may
want to have it in your /home-directory or partition.

You have to change these values and config files:

-   **1.** Edit /var/www/fog/commons/config.php. (on centos 6 see
    /var/www/html/fog/commons/config.php)

Change the values of **STORAGE_DATADIR** and **STORAGE_DATADIR_UPLOAD**
to

**\"/home/fog/images/\"**

and

**\"/home/fog/images/dev/\"**

for example.

If you already have created images with FOG, **don\'t forget to move the
complete directory /images to the new place**. Be sure that the correct
access rights are granted.

-   **2.** Edit your **exports file** (in /etc/exports) to export the
    new location via NFS:

/home/fog/images
\*(ro,sync,no_wdelay,insecure_locks,no_root_squash,insecure)

/home/fog/images/dev \*(rw,sync,no_wdelay,no_root_squash,insecure)

After that tell the running NFS-server to read the new config:

exportfs -a

-   **3.** Edit your storage-node definition:

Go to **Storage -\> All storage nodes** and edit the entry of the
**\"Image Location:\"** to your new target for your **Storage Node
\"DefaultMember\".**

After that your \"**Disk Information**\" (Free / Used / Total) at the
dashboard may not be correct anymore. Edit the file **freespace.php** in
your web-root (/var/www/fog/status/) (on centos 6 see
/var/www/html/fog/status):

define( \"SPACE_DEFAULT_STORAGE\", \"/home/fog/images/\" );

You may also need to modify the permissions for the /home/fog directory.
It is suggested that you use:

**chmod 701 /home/fog**

-   **4.** Create .mntcheck file in your new \"images\" and \"dev\"
    folders :

touch .mntcheck

That\'s all!
