Instructions last updated 29/07/2015

Ive been attempting to install FOG in a Docker container. Mostly so I
can learn about Docker, but also so I can zip FOG up into a neat little
package and deploy it to some old laptops for quick imaging. My process
is outlined below. Heres some things to keep in mind:

-   I havent created a Dockerfile yet, as Im still learning about that,
    plus I dont know if you can automate installfog.sh in a Dockerfile
    friendly way

```{=html}
<!-- -->
```
-   I may have messed up some steps along the way, or not done things
    correctly. I had to learn all about TFTPD, NFS and many other
    services, while overcoming hurdles such as

```{=html}
<!-- -->
```
    various service [service name] start

calls not working and days of research about running TFTP on boot2docker
in Windows (long story short, doesnt work. Prove me wrong though!)

-   Ive been able to image one machine so far (a Dell Latitude E5500
    with a bare-bones Windows 7 image) and I havent tried anything else
    (e.g. deploying the FOG service) so you might need to do more to get
    everything else running.

```{=html}
<!-- -->
```
-   The image I was using was copied over from our old FOG server, so I
    havent tried capturing an image yet.

```{=html}
<!-- -->
```
-   I may update this as time permits, or come back to answer questions,
    but now that I can image machines, my allocated time on this task is
    up.

Lets begin!

# Prerequisites

-   A Linux machine running Ubuntu 15.04

```{=html}
<!-- -->
```
-   Should work with older versions and would probably work with other
    distros

```{=html}
<!-- -->
```
-   Might even work with boot2docker for Mac, but due to TFTP problems,
    wont work on Windows. Put simply, I cant get TFTP packets on port 69
    to LEAVE the Windows host (they arrive in Windows, arrive in the
    container and leave the container, but thats it)

```{=html}
<!-- -->
```
-   Docker installed

Run

    wget -qO- http://get.docker.com | sh

Dont install it via apt-get, as its an older version

# Installation

How to install FOG in Docker:

-   Install Docker

```{=html}
<!-- -->
```
-   boot2docker can be used, but the final container wont work on
    Windows, due to port 69 (TFTP) not being accessible, even with the
    firewall being turned off / ports added. Investigation continues.

```{=html}
<!-- -->
```
-   If youre using boot2docker on Windows (and maybe Mac), youll need to
    allow port 80 through. To do this:

```{=html}
<!-- -->
```
-   Open VirtualBox, click on boot2docker-vm, click on Settings, go to
    Network, then Port Forwarding.

```{=html}
<!-- -->
```
-   Click on the + in the top-right corner. Name will be http, protocol
    will be TCP, host IP will be blank, host port will be 80, guest IP
    will be blank, guest port will be 80. Click OK, then OK when done

```{=html}
<!-- -->
```
-   If you wish to try TFTP on boot2docker, do the same with port 69.
    You might also need to repeat these steps for every port you specify
    with the -p flag when running your Docker

```{=html}
<!-- -->
```
-   On your HOST (\* not \* inside your container), run:

```{=html}
<!-- -->
```
    modprobe nfs && modprobe nfsd

.

-   NFS depends on host kernel support, and the kernel modules dont
    start at boot. If using boot2docker, you dont need to do this, as it
    has all the NFS stuff built in, I believe.

Run:

    docker pull ubuntu:12.04

Install fails on

    ubuntu:latest

for some reason (fails around the start of TFTP), so 12.04 preferred

Run a container with

    docker run -it -p 212:212/udp -p 9098:9098 -p 21:21 -p 80:80 -p 69:69/udp -p 8099:8099 -p 2049:2049 -p 2049:2049/udp -p 111:111/udp -p 4045:4045/udp -p 4045:4045 -p 111:111 -p 34463:34463/udp -p 34463:34463 --privileged -e WEB_HOST_PORT=80 -v ~/fog/www:/transfer ubuntu:12.04

-   Replace //c/Users/graydav1/Desktop/fog/www with another folder from
    your PC. This is used to pass files between the container and your
    computer (optional, good

for importing existing FOG images, config file changes, easy editing of
files etc.)

-   111 is portmap, 80 is HTTP (Apache), 69 is TFTP, 2049 is NFS, 34463
    is mountd (part of NFS)

```{=html}
<!-- -->
```
-   I may have opened too many (or not enough) ports, but my goal was to
    getting this all working for my use at work, so if theres time, I
    might play around with port settings

```{=html}
<!-- -->
```
-   Run

```{=html}
<!-- -->
```
    apt-get update

-   Run

```{=html}
<!-- -->
```
    apt-get install wget net-tools nano

net-tools required for IP address detection during FOG setup, nano for
editing of /etc/bash.bashrc and wget to download the FOG archive

-   Run

```{=html}
<!-- -->
```
    wget -P /tmp http://liquidtelecom.dl.sourceforge.net/project/freeghost/FOG/fog_1.2.0/fog_1.2.0.tar.gz

to download the FOG archive

-   Run

```{=html}
<!-- -->
```
    tar -C /tmp/ -xzvf /tmp/fog_1.2.0.tar.gz

to untar the archive to /tmp

-   Run

```{=html}
<!-- -->
```
    cd /tmp/fog_1.2.0/bin/ && bash ./installfog.sh

to start the installation

-   Run through the installation and wait for it to finish

```{=html}
<!-- -->
```
-   Change the IP address of the FOG server line to match the host (e.g.
    if the container reports 172.17.0.1 but the computers IP address is
    10.15.0.63, set the FOG address to 10.15.0.63)

```{=html}
<!-- -->
```
-   Defaults for the rest should be fine, as Docker uses a bridge to
    contact the outside world. Chances are your organisation already has
    DHCP set up, so say no to that

```{=html}
<!-- -->
```
-   You can set a MySQL password if you like, but if youre running the
    container on-demand, you could probably get away with not having one

```{=html}
<!-- -->
```
-   You wont be able to do the schema update yet, because MySQL hasnt
    started properly, so just press Enter and finish the install

```{=html}
<!-- -->
```
-   Delete the install directory and archive if you wish

```{=html}
<!-- -->
```
-   Run

```{=html}
<!-- -->
```
    nano /etc/bash.bashrc

-   Go to the very bottom and add these lines:

```{=html}
<!-- -->
```
    service apache2 start

to start Apache

    mysqld &

To run MySQL (as it wont start via service for some reason)

    in.tftpd --listen --address 0.0.0.0:69 -s /tftpboot

(for the same reason as above)

    /usr/bin/freshclam -d --quiet

for antivirus (if you use it)

    rpcbind

(for NFS support)

    service nfs-kernel-server start

(for NFS support)

-   Press Ctrl+X to quit, then Y to save

```{=html}
<!-- -->
```
-   Run

```{=html}
<!-- -->
```
    nano /etc/services

Go to the very bottom and add these lines:

    #(use the tab key to line up the entries, same as the other entries in the file)
    mountd 34463/tcp
    mountd 34463/udp

-   We add these to make mountd use a static port. Otherwise it uses a
    dynamic port, making it hard for us to let the port through Docker

```{=html}
<!-- -->
```
-   Press Ctrl+X to quit, then Y to save

```{=html}
<!-- -->
```
-   Run

```{=html}
<!-- -->
```
    nano /tftpboot/default.ipxe

-   Change the final line (that starts with chain <http://>\...) so that
    the IP address matches your host IP

e.g.

    chain http://10.15.0.63/fog/service/ipxe/boot.php##params

-   Press Ctrl+X to quit, then Y to save

```{=html}
<!-- -->
```
-   default.ipxe is created with the reported IP address (e.g.
    172.17.0.1) and not the IP address we specified in the startup (?)

```{=html}
<!-- -->
```
-   Type

```{=html}
<!-- -->
```
    exit

to exit from the container. This will shut it down

-   Run

```{=html}
<!-- -->
```
    docker ps -l

and look for the ID of the container you just exited from. Remember,
thats a lowercase L and NOT the number one

-   Run

```{=html}
<!-- -->
```
    docker start <container ID>

-   This is like a restart. Anything in /etc/bash.bashrc will run when
    the container starts again

```{=html}
<!-- -->
```
-   Youll be sent back to the command prompt (i.e. not inside the
    container)

```{=html}
<!-- -->
```
-   Run

```{=html}
<!-- -->
```
    docker ps

to confirm that the container has started

-   Go to <http://localhost/fog/management> on the host PC and update
    the schema

```{=html}
<!-- -->
```
-   Run

```{=html}
<!-- -->
```
    docker commit <container ID> grayda/fog

(replace grayda/fog with your own image name) This saves our changes to
an image file, ready for packaging

-   (Optional). If you need to move the image to another machine (e.g.
    you created this on Windows, but want to run it on Ubuntu),
-   Run

```{=html}
<!-- -->
```
    docker save -o fog.tar.gz grayda/fog

to save your image as a file. Again, replace grayda/fog with your image
name

-   Copy the file to your destination machine, then

run

    docker load -i fog.tar.gz

on there to load the image

-   When youve loaded the image to the destination machine, log in to
    the FOG management UI, go to FOG Configuration and change the
    necessary IP addresses in there. Also change /tftpboot/default.ipxe
    accordingly

```{=html}
<!-- -->
```
-   Set your DHCP scope options (e.g. 066 and 067) as normal. Use the IP
    address of the host (e.g. 10.15.0.63), NOT the IP address that the
    container reports. Dockers bridge interface will take care of
    getting the traffic to the right spots

```{=html}
<!-- -->
```
-   When youve made significant changes (e.g. uploaded a new image,
    added a client to the list etc.), then do a docker commit
    `<container ID>`{=html} grayda/fog:vX (where X is a number, for
    example, v1, v2, v3 etc.)

```{=html}
<!-- -->
```
-   Some other neat things you can try are:

```{=html}
<!-- -->
```
-   Use the -v switch in docker run to map your /images directory to
    your host, so you can easily back up your images or effortlessly
    load them from a secondary drive

```{=html}
<!-- -->
```
-   Map the /var/fog/www/services/ipxe to a htdocs folder on your local
    machine so you can do dynamic boot menus that read from your own
    inventory system, or authenticate against your network or whatever
    you like

```{=html}
<!-- -->
```
-   Shove everything on a USB stick or Raspberry Pi to have a portable
    FOG system (which is what I plan to do, actually. Simple FOG on a
    stick!)

Resource:
[installing-fog-in-a-docker-container](https://forums.fogproject.org/topic/5546/installing-fog-in-a-docker-container)
