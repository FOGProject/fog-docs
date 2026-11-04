---
title: Storage Node Management
description: Storage groups, storage nodes and the master node, including the referential-integrity checks that run when you delete one
aliases:
    - Storage Node Management
context_id: storage-node
tags:
    - storage
    - storage-node
    - management
    - web-management
    - web-ui
    - scalability
    - networking
    - locations
---

# Storage Node Management

- The Storage Manager introduces the concept of **Storage Groups.** Basically, a storage group is a group of NFS servers that share images and share the load of computers being imaged. Any member of a storage group is referred to as a **Storage Node.** You may have as many storage groups as you wish and as many storage nodes within those groups as you wish. In each storage group, there is one storage node which is designated as the **Master** of that group. Basically, this **Master** node is the node where all image captures go, this node handles multicasting tasks for the group, and is the image replicator the for the group. This means that whatever images are stored on this node are what gets distributed to the entire group.
- What this new system of storage management gives us is a distributed model for FOG which allows for more unicast transfers at a single time. We also gain data redundancy. We also take stress off of the main FOG server.
- Below is a brief overview of Storage Groups ![[Nfsgroup.jpg]]
- This image shows a single Storage Group and the flow of data within the group. The queue size of the system is the sum of the queue size of all the storage nodes within the system. So if you have 4 nodes each with a queue size of 10, then the queue size of the system is 40, which means 40 clients can be imaged (unicast) at one time. ![[StorageGroups.jpg]]
- This image shows that it is possible to have multiple storage groups on your network, which are isolated from each other. This image also demonstrates, that captures always go to the master node and multicast session always send data from the master node. Images are pushed out from the master node of the group to all other members of the group. 
- **Key Benefits** 
    1. Increased throughput 
    2. Redundant Storage 
    3. Scalability 
- Also see the [[kb/index|Knowledge Base]] for tutorials.
 
## Adding a Storage Node

- Definition: Storage Nodes provide extra [NFS/FTP storage space](http://www.fogproject.org/wiki/index.php?title=InstallationModes) which increases available throughput and redundancy within a network. They do not provide PXE, TFTP, or DHCP services at secondary sites. To enable additional PXE and TFTP services at secondary sites see this section: [Including multiple PXE / TFTP servers](#including-multiple-pxe--tftp-servers) 
- Video Tutorial: <http://www.youtube.com/watch?v=X72WthDGwsw&fmt=18> (old video but still valid infomation)
- To add an additional storage node to the network, the computer should be prepared in the same way the main FOG server would be prepared (disable firewall, SELinux, etc). You can also safely mix operating systems for the nodes of you storage group, some nodes can be running fedora, and some can be running Ubuntu. It is important to update your storage nodes when you upgrade to a new version of FOG. Installation of a storage node is done with the same installer for a normal FOG server. Installation can be started by running the installer script, the steps are detailed below. 
- Surprisingly enough some users have actually gotten a Windows Storage node to work properly. See [Windows_Storage_Node](Windows_Storage_Node "wikilink") for more information on this. 
## Installing the Node
- To Install a node: 
    1. Run the installation script, ./installfog.sh 
    2. Select your operating system. 
    3. When prompted for Server Installation Mode, select **S**, for storage node. 
    4. Enter the IP address of the storage node. 
    5. Confirm you interface 
    6. Then you will need to enter the IP address or host name of the node running the FOG database 
    7. Then you will be prompted for a username (typically fogstorage) 
    8. and a password that is located on the FOG server, that will allow the storage node to access the main FOG server's database. This information is located in the FOG management portal for convenience (on the main for server). It can be accessed via **Other Information** -> **FOG settings** -> section **FOG Storage Nodes**. 
    9. You will then be prompted to confirm your installation settings, if they are correct press **Y** end hit **Enter**. 
    10. When installation completes, the install will produce a username and password that will be needed to add the storage node to the FOG management portal. Username is "fog", password is in /opt/fog/.fogsettings (see also [[1.6/management/server/install-fogsettings|.fogsettings]] )

## Adding the Node to the Management Portal

- To Add a Node 
    1. Log into the FOG Management Portal 
    2. Navigate to the **Storage Management** section. 
    3. Click on **Add Storage Nodes**. 
    4. For the **Storage Node Name**, enter any alpha numeric string to represent the storage node. 
    5. Enter any description you wish 
    6. Enter the IP address of the storage node you are adding. This must be the IP address of the node, DO NOT use a hostname here or the node will not function correctly.
    7. Enter the maximum number of unicast clients you would like this node to handle at one time. The value that we recommend is 10. 
    8. Is Master Node is a very dangerous settings, but for right now leave it unchecked, for more details please see: [[1.6/management/web/storage-node#Master Node Status|Master Node Status]] 
    9. Next, select the storage group you would like this member to be a part of, in our example we will pick **Default**
    10. Next, specify the image location on the storage node, typically **/images/**, your image location should always end with a **/**. 
    11. Next, you will want to check the box, to enable the node.
    12. The last two fields take the username and password that are generated during the installation of the storage node. username is "fog", password is in /opt/fog/.fogsettings 
    13. Then click **Add** to have the node join the storage group. #### Monitoring The Master Node     
 - On all storage nodes there is a new service (as of version 0.24) called FOGImageReplicator which is a very basic script which, if the node is the master, copies all of its images to all other nodes in the storage group. The coping is done every ten minutes by default, which means your images are NOT instantly duplicated to all nodes. 
 - If you would like to view the status of the image replication, you can do so on the storage node by switching to tty3, by typing ctl + alt + f3. Output is also logged to a file in the **/opt/fog/log** directory. 
 - FOGImageReplicator logs are also located in ![[Config.png]] **Fog Configuration** -> **Log Viewer** -> **FILE: \[Select Image Replicator\]** 

## SSH access to storage nodes (1.6)

>[!info] FOG 1.5
>1.5 moves a finished capture with FTP. 1.6 moves it with SSH. The 1.5 page
>does not have this section.

>[!note] Available in the next 1.6 update (dev-branch now)
>The SSH key, the SSH port setting, the per-node ports and the installer
>warning in this section are on dev-branch. No tagged release has them yet.

The FOG web tier and the FOG services open an SSH connection from the master
to each storage node. They sign in as the storage user. The storage user is
the **Node Service Account** of the node, normally `fogproject`. FOG uses
SSH for these jobs:

- The move of a finished capture from `/images/dev` to the image folder.
  When this connection fails, the capture ends with the error
  `Unable to connect to ssh during move upload`.
- The node reachability check.
- Snapin uploads and the log file listing.

The storage user must be able to sign in over SSH from the master. This applies
to the master itself, because the master is a storage node of itself.

### The SSH port

FOG connects to the port in the setting `FOG_SSH_PORT`. The default is 22.
Change it in **FOG Configuration → FOG Settings** when your sshd listens on
another port. The setting is global. A node uses it unless the node has its
own port. See [[#Ports for one node]].

When you upgrade from 1.5, the upgrade adds `FOG_SSH_PORT` if the setting is
missing. The value is 22. A 1.5 server can lack this setting, because some 1.5
releases never added it.

FTP replication with `lftp` uses the port in `FOG_FTP_PORT`. If the setting is
empty or not a valid port, `lftp` uses port 21.

### The FOG SSH key

FOG signs in with an SSH key first. When the node refuses the key, FOG signs in
with the storage user password. With the key, you do not need to allow
password logins in sshd for the storage user.

The installer on the master makes the key pair. The files are in
`/etc/fog/ssh`:

| File | Owner and mode | Content |
|---|---|---|
| `/etc/fog/ssh` | `root`, web server group, `0750` | The folder |
| `/etc/fog/ssh/fog_ssh_key` | `root`, web server group, `0640` | The private key (RSA, 4096 bits, PEM format) |
| `/etc/fog/ssh/fog_ssh_key.pub` | `root`, web server group, `0644` | The public key |

The installer applies these modes at each install. The installer never makes a
new key when one exists, because every node that trusts the key would lose
access. Keep `/etc/fog/ssh` in your backups. If the installer cannot make the
key, it prints `Failed`, and FOG uses the password.

The master authorizes its own key for its own storage user. The installer adds
the public key to `~/.ssh/authorized_keys` of that user. It adds the line only
when the line is not there yet.

### How a storage node gets the key

A storage node installer fetches the public key from the master. It does this
after the node is registered, as the last step of the node install.

1. The node sends a random value and a signature to
   `service/nodesshkey.php` on the master. The node makes the signature with
   the storage node database password (the `fogstorage` password).
2. The master checks the signature. It refuses the request when the signature
   is wrong.
3. The master checks that a storage node is registered with the IP address
   of the caller. It refuses the request when no node is registered at that
   address.
4. The master answers with the public key and a signature over the key.
5. The node checks the signature of the answer. Then the node adds the key to
   `~/.ssh/authorized_keys` of its storage user.

The node never trusts a key with a wrong signature. The private key stays on
the master.

The master answers only a registered node. So add the node in **Storage
Management** before you finish the node install, or re-run the installer on the
node after you add it.

### The check when you save a node

When you add a node, FOG tries one SSH login. If it fails, the page shows
`Unable to connect using ip, user, and/or password provided!` and still creates
the node.

When you update a node, FOG checks the node over SSH in two steps. FOG checks
the password first, with the key switched off. Then it checks the key alone.
The page saves the node and shows one of these messages as a warning:

| Message | Meaning |
|---|---|
| `The node did not answer on the network: <ip>` | The node does not answer. Check the IP address and the network. |
| `The node refused the SSH login for: <user>@<ip>` | sshd is reachable, but the user name or password is wrong. |
| `Could not open an SSH connection to: <ip>.` followed by `This is a transport failure -- no credentials were sent -- so check sshd on the node.` | The SSH handshake failed. Check that sshd runs, and check the SSH port. |
| `The node accepted the password but not the FOG SSH key: <ip>.` followed by `Re-run the installer on that node to install the key. After that, you can disable password logins.` | The password works. The node does not have the key. |

The key message does not appear when the master has no key pair.

### Disable password logins for the storage user

Do this only after the save check shows no key warning for every node. Do this
on each node, including the master.

1. In `sshd_config`, add a block for the storage user:

        Match User fogproject
            PasswordAuthentication no

2. Reload sshd.
3. Save the node again in **Storage Management**. The password check then
   reports a refused login. This is expected, because the node does not
   accept a password. Open a capture task to confirm that the move works.

>[!note]
>This setting stops only the SSH password login. FOG still uses the storage
>user password for FTP replication and for the node credentials. Keep the
>password correct.

### Troubleshooting SSH access

**The key is missing on the master.** The node install prints `The master
declined to send its SSH key` and the message `this server has no FOG SSH key;
re-run the installer on it`. Run the installer on the master again. The
installer makes the key pair. Then run the installer on the node.

**The node cannot reach the master during the install.** The install does not
stop. It prints `Skipped` or `Failed` and keeps the password login. The node
installer then prints:

    FOG keeps using the password for this node. Update the master
    and re-run the installer here to switch to the SSH key.

Fix the network path from the node to the master web server. Then re-run the
installer on the node. The installer also skips the key for a node that has no
database host in its settings, and for a node that lacks `curl`, `jq`,
`openssl` or `php`.

**The master says that no storage node is registered at the address.** The
master matches the caller by IP address. Add the node in **Storage
Management** with its IP address. Do not use a host name. Then re-run the
installer on the node.

**The installer warns that sshd does not allow password login.** The
installer checks this at the end of the node or master setup, after the SSH
key step. The warning appears only when sshd refuses password login for the
storage user (`PasswordAuthentication no`). The installer stays silent when
FOG's key is authorized for the storage user and sshd will read it. Password
login is then only the fallback. When the warning appears, it names one reason:

| Reason in the warning | Cause and fix |
|---|---|
| `FOG's SSH key is not authorized for <user>` | The key step printed `Skipped` or `Failed`. The error log has the details. Fix that and run the installer again. A node must reach its master, and the master must have this update. |
| `public key login is off for <user>` | The key is authorized, but sshd has `PubkeyAuthentication no` for the storage user. Turn it on in `sshd_config`, or allow password login for the user. |
| `AuthorizedKeysFile does not include ~/.ssh/authorized_keys` | The key is authorized, but sshd reads other files. Add `.ssh/authorized_keys` to `AuthorizedKeysFile`, or allow password login for the user. |

In each case, without a working login every capture ends with
`Unable to connect to ssh during move upload`. The installer does not change
`sshd_config`. The password fallback is this block, followed by an sshd reload:

    Match User fogproject
        PasswordAuthentication yes

**sshd ignores the key.** sshd refuses an `authorized_keys` file when the
`.ssh` folder or the file is writable by another user. The installer sets
the modes `0700` for the folder and `0600` for the file. It also sets the owner
to the storage user. On a system with SELinux, the installer runs `restorecon`
on the folder.

### Ports for one node

A node can have its own SSH port and FTP port. Use this when the nodes of a
site listen on different ports. The **Add Storage Node** form and the
**General** tab of a node have these fields:

- **SSH Port** (blank uses the global `FOG_SSH_PORT`)
- **FTP Port** (blank uses the global `FOG_FTP_PORT`)

The rules for each field:

- Blank or 0 means "use the global setting". If the global setting is empty
  or not a valid port, FOG uses 22 for SSH and 21 for FTP.
- A port must be a whole number from 1 to 65535. FOG refuses any other value
  with `Port must be a whole number from 1 to 65535`.
- An existing node keeps the value 0. It keeps using the global settings.

Every SSH or FTP connection to that node uses its port:

- the move of a finished capture
- replication: the FTP connection, `lftp`, and the file existence and hash
  checks
- snapin uploads and snapin downloads by the client
- the file deleter
- the log viewer
- the check when you save the node
- the online check of the node
- the dashboard probe of the node

The TFTP host is not a storage node. It keeps the global `FOG_SSH_PORT`.

FTP stays in passive mode. The node setting changes only the FTP control port.
The passive data ports do not change. See
[[firewall|Firewall configuration for a FOG server]].

## A node that is its own FOG server (1.6)

>[!info] FOG 1.5
>1.5.10.2482 and later have the same key and the same steps. See
>[[1.5/management/web/storage-node#A node that is its own FOG server|the 1.5 page]].

FOG servers sign the requests they send to each other with a shared key,
`FOG_NODE_API_KEY`. A true storage node, installed with mode **S**, reads the
master's database. It already has the same key, so it needs no setup. Leave
**Node API Signing Key** empty for it.

A node that is a full FOG server has its own database. It makes its own key,
and that key does not match the master's. So it rejects every request the
master signs. On the master you see these symptoms:

- The dashboard shows **Access Denied** or **Unauthorized** for the node's
  disk usage and server information.
- The node's image, snapin, and log file listings fail.

To fix this, give the master and the node the same key:

1. Make a random key of 32 characters or more, for example with
   `openssl rand -hex 32`.
2. On the master, go to **Storage Management**, and open the node's entry.
3. Put the key in **Node API Signing Key**, and click **Update**.
4. On the node, open a shell in the FOG source directory that you installed
   from.
5. Run `sudo php bin/fog-node-key.php --set <key>` with the same key. If the
   web root is not `/var/www/html/fog`, add `--web <web root>`.
6. Run `sudo php bin/fog-node-key.php --show` to check the key on the node.

FOG services cache settings for up to five minutes. A running service on the
node can reject requests for that time after the change.

>[!note]
>Nothing copies this key between the two servers. It is the same as the
>**Node Service Account** and **Node Service Account Password** fields: if
>you change the key on one server, change it on the other.

>[!note]
>In 1.6.0-RC-14 and earlier, the dashboard disk usage and server information
>check only the IP address of the caller, not the key. A node that is its own
>FOG server shows **Access Denied** there even with the key set. The image,
>snapin, and log file listings use the key in those releases.
 
## Master Node Status 
 
 - The **Master Node** (could be the server or a particular node) in a storage group is the node that distributes images files to all other nodes in the storage group. 
 - If you have all your images distributed across 3 nodes in a storage group, **if you add a new storage node that has no images stored on it, making that node master will cause it to take over and push it's image store of nothing to all other nodes, wiping out all of your images**. So it is important to be very careful and backup your images when you change a node's master status. 
   
>[!note]
>You **can** have many storage nodes in a storage group. You **can** have one master storage node in a storage group. You **can not** have more than one master storage node in a storage group. You **must have** one master storage node for replication to take place to other nodes in the group. **If** a master storage node is set, all captures **first** go to the master storage node of the storage group the image is assigned to; and are **then** replicated to other storage nodes.

>[!note]
>Master node status also decides which node transmits a multicast session, so a site whose node is not a master cannot serve multicast locally even with the image replicated to it. If you multicast to more than one site, see [[1.6/management/web/multicast#Multicast across multiple sites|Multicast across multiple sites]].

## Moving and deleting nodes (1.6)

>[!info] FOG 1.6
>1.5 has none of this referential-integrity checking — deleting a group or a
>node there is unconditional and silently orphans anything pointing at it.
>See the [[1.5/management/web/storage-node|1.5 version]] of this page.

A storage node **must** belong to a storage group. A group with no nodes is
fine; a node in no group is not — it is invisible to replication and to
multicast, and nothing will ever assign it work.

- **To move a node, assign it to the group you want it in.** That moves it in
  one step. There is no separate "remove from group" operation, because a
  node with no group is not a state FOG has.
- **Deleting a storage group is refused while nodes still belong to it**, and
  likewise while a location names it or file deletions are queued against it.
  Move the nodes out first. Before 1.6 this delete was allowed and silently
  left those nodes belonging to nothing.
- **Deleting a storage node is not refused.** Anything referring to it loses
  the reference and carries on — a running multicast session drops its sender
  node, and a location that named that specific node falls back to choosing
  the best node in its group.

For the full set of rules and what a refused delete looks like, see [[1.6/kb/reference/referential-integrity|Referential Integrity]].

## Including multiple PXE / TFTP servers

-   A traditional Master Storage Node, [as described above](https://wiki.fogproject.org/wiki/index.php?title=Managing_FOG#Adding_a_Storage_Node) only provides File Storage redundancy. While this can help increase multicast throughput on a single network, all the machines under FOG management must be within the same subnet/VLAN so that DHCP broadcast requests can be directed to the Main server. (see note below)

>[!note]
>depending on the network, it may be possible to configure [http://en.wikipedia.org/wiki/UDP_Helper_Address iphelper] to forward packets to the Main FOG server

-   The following instructions are intended to help configure additional Storage Nodes to operate independently on separate networks, while still syncing with and taking commands from a single Main FOG server.

-   Click here for instructions on setting up [multiple PXE / TFTP servers](https://wiki.fogproject.org/wiki/index.php?title=Multiple_TFTP_servers "Multiple TFTP servers")


