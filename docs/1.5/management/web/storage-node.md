---
title: "Storage Node Management (1.5)"
description: Storage groups, storage nodes, and the master node on FOG 1.5, including the pre-1.6 lack of referential-integrity checks on delete
aliases:
    - "Storage Node Management (1.5)"
context_id: "storage-node-1.5"
tags:
    - storage
    - storage-node
    - management
    - web-management
    - web-ui
    - scalability
    - networking
    - locations
    - 1_5-legacy
---

# Storage Node Management (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/management/web/storage-node|1.6 version]] of this page for FOG 1.6.

- The Storage Manager introduces the concept of **Storage Groups**. A storage
  group is a group of NFS servers that share images and share the load of
  computers being imaged. Any member of a storage group is a **Storage
  Node**. You may have as many storage groups as you wish, and as many
  storage nodes within those groups as you wish. In each storage group, one
  storage node is designated the **Master** — image captures go to it, it
  handles multicasting for the group, and it is the image replicator for the
  group. Whatever images are stored on this node are what gets distributed
  to the entire group.
- This gives FOG a distributed model that allows more unicast transfers at
  once, adds data redundancy, and takes stress off the main FOG server.
- The queue size of the system is the sum of the queue size of all the
  storage nodes within it. Four nodes each with a queue size of 10 gives a
  system queue size of 40 — 40 clients can be imaged (unicast) at one time.
- You can have multiple storage groups on your network, isolated from each
  other. Captures always go to the master node, and multicast sessions
  always send from the master node — images are pushed out from the master
  to every other member of the group.

## Adding a Storage Node

Storage nodes provide extra NFS/FTP storage space, increasing available
throughput and redundancy within a network. They do not provide PXE, TFTP,
or DHCP services at secondary sites — see
[Including multiple PXE / TFTP servers](#including-multiple-pxe--tftp-servers)
for that.

To add an additional storage node, prepare the computer the same way the
main FOG server would be prepared (disable firewall, SELinux, etc). You can
mix operating systems across nodes of the same storage group. Installation
of a storage node uses the same installer as a normal FOG server.

### Installing the Node

1. Run the installation script, `./installfog.sh`.
2. Select your operating system.
3. When prompted for Server Installation Mode, select **S**, for storage
   node.
4. Enter the IP address of the storage node.
5. Confirm your interface.
6. Enter the IP address or host name of the node running the FOG database.
7. Enter a username (typically `fogstorage`).
8. Enter the password located on the FOG server that allows the storage
   node to access the main FOG server's database — found in the FOG
   management portal under **Other Information** → **FOG settings** →
   section **FOG Storage Nodes**.
9. Confirm your installation settings.
10. When installation completes, note the username and password produced
    for adding the storage node to the management portal — username is
    `fog`, password is in `/opt/fog/.fogsettings` (see also
    [[1.5/management/server/install-fogsettings|.fogsettings]]).

### Adding the Node to the Management Portal

1. Log into the FOG Management Portal.
2. Navigate to the **Storage Management** section.
3. Click **Add Storage Nodes**.
4. **Storage Node Name** — any alphanumeric string.
5. Enter a description.
6. Enter the storage node's **IP address** — not a hostname, or the node
   will not function correctly.
7. Enter the maximum number of unicast clients this node should handle at
   once. 10 is the recommended value.
8. **Is Master Node** — leave unchecked for now; see
   [Master Node Status](#master-node-status) before ever ticking it.
9. Select the storage group this member belongs to.
10. Specify the image location on the storage node, typically `/images/`,
    ending with a `/`.
11. Check the box to enable the node.
12. Enter the username and password generated during installation —
    username `fog`, password from `/opt/fog/.fogsettings`.
13. Click **Add**.

`FOGImageReplicator`, running on all storage nodes, copies the master's
images to every other node in the group every ten minutes by default — so
images are **not** instantly duplicated. View status on the node itself
with `ctl+alt+f3`, in `/opt/fog/log`, or in the web UI under **Fog
Configuration → Log Viewer → FILE: [Select Image Replicator]**.

## Master Node Status

The **Master Node** (the server or a particular node) in a storage group is
the node that distributes image files to every other node in the group.

>[!warning] Changing master status can wipe your images
>If you have images distributed across 3 nodes in a storage group, adding a
>new storage node with no images and making that node master will cause it
>to push its store of nothing to every other node — **wiping out all of
>your images**. Be very careful and back up your images before changing a
>node's master status.

>[!note]
>You **can** have many storage nodes in a storage group. You **can** have
>one master storage node in a storage group. You **can not** have more
>than one master storage node in a storage group. You **must have** one
>master storage node for replication to take place to other nodes in the
>group. **If** a master storage node is set, all captures **first** go to
>the master storage node of the storage group the image is assigned to,
>and are **then** replicated to other storage nodes.

>[!note]
>Master node status also decides which node transmits a multicast session,
>so a site whose node is not a master cannot serve multicast locally even
>with the image replicated to it. Cross-site multicast cannot be made to
>work by configuration alone on this line — see
>[[1.5/management/web/multicast|Multicast Sessions]].

## Moving and deleting nodes

This line does **not** check for references before a delete — there is no
referential-integrity layer here at all:

- **Deleting a storage group is allowed even while nodes still belong to
  it.** The only check is that you cannot delete the very last remaining
  group. Deleting a group with member nodes silently orphans them — they
  are left belonging to nothing, invisible to replication and multicast,
  and nothing will ever assign them work again.
- **Deleting a storage node is allowed unconditionally**, with no reference
  checks of any kind. Anything pointing at that node keeps pointing at a
  row that no longer exists:
    - the Location plugin, if installed, keeps a raw reference to the node
      and does not clean it up;
    - an active multicast session tracking that node as its sender is left
      referencing a node that is gone.

There is no equivalent of the current line's refuse-while-referenced
behavior, and no hook cleans any of this up after the fact. Move nodes out
of a group yourself before deleting it, and check locations and active
sessions yourself before deleting a node.

## Including multiple PXE / TFTP servers

A traditional Master Storage Node only provides file storage redundancy.
While this can help increase multicast throughput on a single network, all
machines under FOG management must be within the same subnet/VLAN so that
DHCP broadcast requests can be directed to the main server (depending on
your network, it may be possible to configure an
[IP helper](http://en.wikipedia.org/wiki/UDP_Helper_Address) to forward
packets to the main FOG server instead).

To operate additional storage nodes independently on separate networks
while still syncing with and taking commands from a single main FOG server,
see the community wiki's
[multiple PXE / TFTP servers](https://wiki.fogproject.org/wiki/index.php?title=Multiple_TFTP_servers)
instructions.
