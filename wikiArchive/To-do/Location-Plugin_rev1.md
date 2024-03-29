See also: [Replication](Replication "wikilink")

# What does FOG 1.3.0 do without the location plugin? {#what_does_fog_1.3.0_do_without_the_location_plugin}

Without the location plugin, fog is able to replicate images from a
master node to all other nodes in the same storage group. You can limit
the amount of bandwidth that this process uses (Storage Management), and
you can also limit how often the FOGImageReplicator checks for changes
(Fog Settings). You may also associate a single image with many storage
groups. When an image is associated with more than one storage group,
replication always happens from the original storage group to the others
and never the other way around (meaning changes on a non-original group
would be overwritten by the original group). In a multi-storage-node fog
setup, if all servers are free, a host that is told to image might use
any of the available storage nodes. If there is adequate bandwidth
between the host and the chosen storage node, then this is not a
problem. If one of the storage nodes in the needed storage group is at
capacity and busy, the host is usually told to use another storage node
that is not busy.

# What does the location plugin do? {#what_does_the_location_plugin_do}

The location plugin is for use in multi-node fog setups that have a
large distance or limited amount of bandwidth between each node\'s
network. The location plugin allows you to restrict a host\'s storage
node selection when imaging or other tasks occur.

For instance, say you have three physical sites. Site A, B, and C.
Let\'s also say that all of these sites are interconnected by a 6Mbps
link. If all storage nodes are not busy when a host at location C is
told to image, it\'s possible that this host may select the storage
nodes at locations A or B to pull it\'s image from. And on a 6Mbps link,
this is not good. What the location plugin enables you to do is to
assign a location to each of these sites, and then assign each site\'s
storage nodes to the correct location, and then to assign each sites
hosts to the correct location. Then when a host is told to image, it
will be restricted to the correct location and not attempt to image over
the slow WAN.

# Bullet Points {#bullet_points}

## Capture tasks {#capture_tasks}

**Without Location Plugin**

-   Find the images primary group if associated to other groups
-   Find the groups master node
-   Use the master node to perform the capture.

**With Location Plugin**

-   Find the locations group master
-   Use the master node to perform the capture.

## Non-capture tasks {#non_capture_tasks}

**Without Location Plugin**

-   Find the images storage groups. If multiple use the primary group.
-   Find all nodes that have the image
-   Test the nodes to get which are not being used as much as another.
-   Use the optimal node to perform the image tasking.

**With Location Plugin  Only group defined**

-   Find all nodes that have the image within the group thats associated
    with the host.
-   Test the nodes to get which are not being used as much as another.
-   Use the optimal node to perform the image tasking

**With Location Plugin  Node defined**

-   Make sure the node has the image
-   Perform the image tasking using that node.

External Video Link:

[FOG 1.3.0 Location Plugin Tutorial](https://youtu.be/aZkGwQztITg)

Video:

`<embedvideo service="youtube">`{=html}<https://youtu.be/aZkGwQztITg>`</embedvideo>`{=html}
