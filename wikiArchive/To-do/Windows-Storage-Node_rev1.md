# Windows Storage Node {#windows_storage_node}

-   This is for
    `<span style="background-color:RED; color:Orange; boarder:solid thin black">`{=html}STORAGE
    NODES **ONLY**`</span>`{=html} you will still need a Linux install
    running as the main server. However, this will be part of the
    building blocks for a windows server build that yet does **not**
    exist.
-   You may have a Windows Storage Node in combination with any number
    of Linux Storage Nodes or just a single Windows Storage Node.
-   This has been put together from the forum and should be useful to
    many. [Windows Server
    NFS](http://fogproject.org/forum/threads/fatal-error-failed-to-mount-nfs-volume.10457/#post-26912)

## Requirements

1.  Windows Server 2008 (R2)/Windows Server 2012 (R2)
2.  NFS Role Installed (NFS)
3.  Filezilla Installed (FTP)

## Windows Step-by-Step {#windows_step_by_step}

### Folder Creation & Setup {#folder_creation_setup}

-   **Create folders**
    1.  **Create folder C:\\images**
    2.  \'\'\'Create folder C:\\images\\dev

```{=html}
<!-- -->
```
-   **Set Sharing** (you may not have kerberos enable do not worry about
    this)

![image](NFS_Sharing1.png)

-   **Set Permissions**: Set proper permissions for All Machines

<figure>
<img src="NFS_Permissions.png" title="NFS_Permissions.png" />
<figcaption>NFS_Permissions.png</figcaption>
</figure>

-   **Set Security**: Make sure you do this for C:\\, C:\\images, and
    C:\\images\\dev

+----------------------+----------------------+----------------------+
| <figure>             | <figure>             | <figure>             |
| <img                 | <img                 | <img                 |
| src="Security_1.png" | src="Security_2.png" | src="Security_3.png" |
| title                | title                | title                |
| ="Security_1.png" /> | ="Security_2.png" /> | ="Security_3.png" /> |
| <figcaption>Securit  | <figcaption>Securit  | <figcaption>Securit  |
| y_1.png</figcaption> | y_2.png</figcaption> | y_3.png</figcaption> |
| </figure>            | </figure>            | </figure>            |
+----------------------+----------------------+----------------------+

#### Filezilla Setup (FTP) {#filezilla_setup_ftp}

-   **Setup Filezilla Account**: Create fog account and make sure this
    is the same password for your *Management password*

<figure>
<img src="Filezilla1.png"
title="Create fog account and make sure this is the same password for your Management password" />
<figcaption>Create fog account and make sure this is the same password
for your <em>Management password</em></figcaption>
</figure>

-   **Setup Filezilla Folders**: Make sure these files \$ Directories
    all have Read, write, delete, append rights

<figure>
<img src="Filezilla_folders.png"
title="Make sure these files $ Directories all have Read, write, delete, append rights" />
<figcaption>Make sure these files $ Directories all have Read, write,
delete, append rights</figcaption>
</figure>

-   **Set Ports**:

#### Windows Firewall {#windows_firewall}

#### Windows Policies {#windows_policies}

-   **Set Local Policies**: Set this policy to **Enabled**

<figure>
<img src="Local_policy_settings.jpg"
title="Set this policy to enabled" />
<figcaption>Set this policy to enabled</figcaption>
</figure>

#### NFS

-   **Configure NFS Server**: Stop NFS Server Service, Edit Transport
    Protocol to TCP+UDP, and Start NFS Server Service

+----------------------------------+----------------------------------+
| <figure>                         | <figure>                         |
| <img                             | <img src="Nfs_tcp+udp.jpg"       |
| sr                               | title="Nfs_tcp+udp.jpg" />       |
| c="Properties_of_nfs_server.png" | <figcapt                         |
| title="                          | ion>Nfs_tcp+udp.jpg</figcaption> |
| Properties_of_nfs_server.png" /> | </figure>                        |
| <figcaption>Propertie            |                                  |
| s_of_nfs_server.png</figcaption> |                                  |
| </figure>                        |                                  |
+----------------------------------+----------------------------------+

## Fog Server {#fog_server}

-   Here is the tricky part\.....You need to copy the hidden files on
    your Linux server to your windows server. These files are located @:

```{=html}
<!-- -->
```
-   /images/.mntcheck \--\> c:\\images\\
-   /images/dev/.mntcheck \--\> c:\\images\\dev\\

```{=html}
<!-- -->
```
-   xxx.xxx.xxx.xxx ==\> ip address of the windows server

```{=html}
<!-- -->
```
-   I mounted the NFS drive and just did a cp command.

```{=html}
<!-- -->
```
-   **Using terminal or ssh remote:**

```{=html}
<!-- -->
```
    cd /
    sudo mkdir images2
    sudo chmod 777 images2
    sudo mount xxx.xxx.xxx.xxx:/images /images2
    sudo cp /images/.mntcheck /images2
    sudo cp /images/dev/.mntcheck /images2/dev/
    sudo umount /images2

## Fog Web GUI {#fog_web_gui}

-   Then continue by adding a storage node just as you would in the
    wiki.

```{=html}
<!-- -->
```
-   I Simply added a Storage Node Definition in its own Storage Group
    independent to the default storage Group, added it\'s IP
    172.19.102.6 and the path /images/ because it\'s the path
    172.19.102.6 exports also /images/dev/ like an original FOG node
    does.

![](Web_gui.png "Web_gui.png")
![](Storage_manage.png "Storage_manage.png")

## Glitches

-   At times NFS does not want to replicate (minimally after restarts)
    so need of restarting the NFS service is required.
-   Windows Nodes will not report any information in the Dashboard
    ![](Home.png "Home.png"). This means no bandwidth and no disk
    information.
    -   The only really way to know if it is working is to check the
        **Image Replicator** log. It will show something like:

```{=html}
<!-- -->
```
    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `[Image1]'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `[Image2]'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `[Image3]'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `[Image4]'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `[Image5]'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `[Image6]'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `[Image7]'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Mirroring directory `postdownloadscripts'

    [01-20-15 8:25:38 am]  * [Windows_Node_Name] - SubProcess -> Complete

-   If having issues PM Wolfbane8653 in the forum.

------------------------------------------------------------------------

-   `<span style="background-color:RED; color:Orange; boarder:solid thin black">`{=html}This
    is an interesting thread to me as it shows the flexibility of FOG.
    While cumbersome, it CAN be \"ported\" to run on nearly any OS. \~
    Tom Elliott Senior Developer`</span>`{=html}

\--[Wolfbane8653.3362](User:Wolfbane8653.3362 "wikilink")
([talk](User_talk:Wolfbane8653.3362 "wikilink")) 18:51, 16 June 2014
(CDT)
