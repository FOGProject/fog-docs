## Normal Server {#normal_server}

This type of install will install everything on the server including:

-   Web Server
-   Database Server
-   NFS/Storage Server
-   DHCP Server
-   PXE Server
-   FTP Server

You need one (only one) of these servers on your network in order for
FOG to function.

If you are just getting started with FOG, this includes everything you
need to test FOG out.

## Storage Node {#storage_node}

This type of install will only install the basics needed for the machine
to act as a storage node including:

-   NFS/Storage Server
-   FTP Server

You may have as many of these servers on your network as you like. The
more servers you have the more clients will be able to unicast at one
time. This mode adds performance as well as fault tolerance to FOG.
