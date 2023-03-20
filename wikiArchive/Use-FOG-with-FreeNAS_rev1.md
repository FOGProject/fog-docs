## How to: Use FOG (1.1.2) with FreeNAS (Storage node - 9.1.1) {#how_to_use_fog_1.1.2_with_freenas_storage_node___9.1.1}

-   I have often seen people want to use Fog Server with a Storage Node
    FreeNAS. At my office, it works so i describe you step by step how
    to do.

There are probably several solutions i think, but i propose you a simple
solution that works with me.

I\* consider that your FreeNAS is ok for the installation and NIC.

### Pre-Configuration {#pre_configuration}

-   IP Addresses (These are not required but set as example)
    -   Fog Server: 192.168.56.102
    -   FreeNAS: 192.168.56.240

### **FOG Server** {#fog_server}

1.  **Storage Management**
    -   Add the Storage node.
    -   Storage Node Name: FNAS
    -   IP Address: 192.168.56.240
    -   Is Master Node: As you want.
    -   Group: As you want.
    -   Image Path: /mnt/Volume1/data/images
    -   User/Pass: Free/Free (Not very secure ;) )
2.  **Image Management**
    -   For your image, choose the storage group witch contains the new
        storage node.

### **FreeNAS**

1.  **Add Volume1**
    -   Storage -\> ZFS Volume Manager:
    -   Volume Name: Volume1
    -   Volume layout: All the disk (in my case)
2.  **Create the path**
    -   Clic on Volume1 -\> Create ZFS Dataset:

    -   Dataset Name: data

    -   Compression level: inherit

    -   Enable atime: inherit

    -   ZFS Deduplication: inherit

    -   Clic on data -\> Create ZFS Dataset:

    -   Dataset Name: images

    -   Compression level: inherit

    -   Enable atime: inherit

    -   ZFS Deduplication: inherit

    -   Clic on images -\> Create ZFS Dataset:

    -   Dataset Name: dev

    -   Compression level: inherit

    -   Enable atime: inherit

    -   ZFS Deduplication: inherit

    -   <figure>
        <img src="FreeNAS_DirectoryStructure.png"
        title="FreeNAS_DirectoryStructure.png" />
        <figcaption>FreeNAS_DirectoryStructure.png</figcaption>
        </figure>
3.  **Create .mntcheck**
    -   On the folder \"/images\" and \"/dev\", create the file
        \".mntcheck\"
    -   CMD: touch .mntcheck
4.  **Create new user**
    -   Account -\> Users -\> Add User

    -   Username: Free

    -   Primary Group ID: Free

    -   Home Directory: /mnt/Volume1/data/images

    -   Home Directory Mode: 777

    -   <figure>
        <img src="FreeNAS_User.png" title="FreeNAS_User.png" />
        <figcaption>FreeNAS_User.png</figcaption>
        </figure>
5.  **Permission for the path**
    -   Storage -\> clic on data/images -\> Change Permissions
    -   User: Free
    -   group: Free
    -   Mode: 777
    -   Type of ACL: Unix
    -   Set Permission recursively: YES
    -   Verification: cmd: ls -laR /mnt/Volume1/data/images
6.  **NFS**
    -   Don\'t edit \"/etc/exports\". In my case, when i restart the
        service, the file faded. I had to WEBGui.

    -   On the left.

    -   Sharing -\> Inux (NFS) Shares -\> Add Unix (NFS) Share.

    -   Comment:\...

    -   Authorized networks: 192.168.56.0/24

    -   All directories: OK

    -   Maproot User: Free

    -   Maproot Group: Free

    -   Path: /mnt/Volume1/data/images

    -   OK.

    -   <figure>
        <img src="FreeNAS_NFS.png" title="FreeNAS_NFS.png" />
        <figcaption>FreeNAS_NFS.png</figcaption>
        </figure>

    -   

    -   Idem for the folder \"/dev\"

    -   

    -   <figure>
        <img src="FreeNAS_dev.png" title="FreeNAS_dev.png" />
        <figcaption>FreeNAS_dev.png</figcaption>
        </figure>

    -   Verification:

    -   cmd: cat /etc/exports

    -   <figure>
        <img src="FreeNAS_Exports.png" title="FreeNAS_Exports.png" />
        <figcaption>FreeNAS_Exports.png</figcaption>
        </figure>
7.  **FTP (I don\'t know if it\'s really necessary)**
    -   Services -\> FTP -\> Advenced Mode
    -   Path: /mnt/Volume1/data/images
    -   File Permission: 666
    -   Directory Permission: 777

### Capturing Image {#capturing_image}

-   Now: you can capture your client
-   Problem, you may also get an error message at the end: FOGFTP:
    failed to rename file.
    -   <http://www.fogproject.org/wiki/index.php/Images_Directory_Permissions>

```{=html}
<!-- -->
```
-   Method 1 doesn\'t works with me, so i use method 2.
    [\*](Use_FOG_with_FreeNAS#Notes: "wikilink")

-   <figure>
    <img src="FreeNAS_FTP_Will_Not_Rename_And_Move.png"
    title="FreeNAS_FTP_Will_Not_Rename_And_Move.png" />
    <figcaption>FreeNAS_FTP_Will_Not_Rename_And_Move.png</figcaption>
    </figure>

-   CMD: cp -a /mnt/Volume1/data/image/dev/@MAC
    /mnt/Volume1/data/images/NameOfYourImage

-   cp -a to keep the same permission.

```{=html}
<!-- -->
```
-   **That\'s it.**

## Notes:

-   This tutorial was created using content from this thread: [How to:
    Use FOG (1.1.2) with FreeNAS (Storage node -
    9.1.1)](http://fogproject.org/forum/threads/how-to-use-fog-1-1-2-with-freenas-storage-node-9-1-1.12821/)

```{=html}
<!-- -->
```
-   **\*** Further investigation into the \"FOGFTP: failed to rename
    file\". This is most likely a permissions issue that needs to be
    corrected. (FOG Dev Team)
