.. include:: /includes.rst

---------------------------------
Network and firewall requirements
---------------------------------

FOG depends on quite some network protocols, like FTP, NFS, DHCP and HTTPS. In a 'flat' network where all clients and servers are in the same IP subnet, this usually does not give much problems, but when components of FOG are in different networks and when firewalls are in between them, you have to plan and configure carefully.

This part of the manual discusses the network and firewall requirements.

FOG Client to FOG Server communications
=======================================

An installed FOG Client on a machine regularly polls the FOG Server for outstanding tasks.

Fog client to server communications
-----------------------------------

This polling is done via HTTP or HTTPS. When there is a firewall in between the FOG Client and Server, make sure you open port 80/tcp (HTTP) or port 443/tcp (HTTPS), depending if you use HTTP or HTTPS for client/server communications. For more information see TODO: create link.

Downloading of snapins also is done via HTTP/HTTPS.

A prerequisite is that the client is able to resolve the hostname of the FOG server via DNS.

Client Network boot
===================

During the deployment of an image and capture of an image, the client will boot from the network, contact the FOG Server for instructions and downloads/uploads an image to the FOG Storage.

In a small setup, the FOG Storage and FOG Server reside on the same server.

1. DHCP
-------

The client first will request an IP address via DHCP. For that you need a DHCP server in the same subnet as the client. There are different possibilities:

- Run the DHCP service on the FOG Server. This is one of the installation options mentioned in TODO: Create link. Choose this option if you do not already have a running DHCP server in your network.

- Run a separate DHCP server. Most networks already have a DHCP server running and in enterprise networks dhcp services are commonly managed by network equipment, such as firewalls. In this case, make sure you configure this DHCP Server to also pass the extra options 66 (next-server) and 67 (bootfile name) mentioned in :ref:` Other DHCP Server than FOG<installation/install_fog_server:Other DHCP Server than FOG>`.

If the DCHP server is in another network, make sure you have a 'DHCP helper' running in the network. This DHCP helper 'catches' the DHCPDISCOVER broadcast packets and forwards them via unicast to the DHCP server in another network.

2. TFTP boot
------------

Once the client has gotten it's IP address, it will download the kernel image from the Fog Storage server. In small setups the FOG Storage and FOG Server reside on the same server.

For TFTP open the following ports:

- from clients to storage on port 69/udp (TFTP session control)
- from clients to storage on ports 1024-65535/udp: a random port higher than 1023 is chosen for the actual file transfer.

Some notes:

- Some firewalls have a 'TFTP helper'. If there is such a firewall between the clients and the FOG Storage, then this TFTP helper 'looks' into the TFT chat between clients and storage and sees which random port is requested. The firewall then allows this connection until the transfer is complete. With an TFT helper, it is not necessary to open up port 1024-65535 to the storage server.

3. Client configuration
-----------------------

Once the kernel image has been downloaded it will be executed and the kernel will request the FOG Server what it has to do: show the boot menu or start a image capture/deployment task. 

For this, if not already done, open port 80/tcp (HTTP) or port 443/tcp (HTTPS), depending if you use HTTP or HTTPS for client/server communication
s. For more information see TODO: create link.

4. Image capture or deployment via unicast
------------------------------------------

If the client has a unicast image capture or deployment to do, the client mounts an NFS share on the FOG Storage.

If the FOG Storage is behind a firewall, open up the following ports:

- Clients to FOG Storage ports 111/udp and 111/tcp
- Clients to FOG Storage ports 2049/udp and 2049/tcp


