---
title: Requirements
context_id: requirements
aliases:
    - Requirements
    - System Requirements
description: detail the hardware and os requirements
tags:
    - system-requirements
    - dependencies
---

# System Requirements

## Operating System

Before diving right into the installation of FOG you need to decide
which server OS you are going to use. FOG is made to install on RedHat
based distro CentOS, Fedora, RHEL amongst others as well as Debian,
Ubuntu and Arch Linux.

Choose whichever you like most and have knowledge about! FOG is known to
work with any of the above noted systems. Many installation manuals are
available.

Please choose the distribution you have the most knowledge about. This
list is by no means an absolute list to follow, though.

-   Ubuntu 16 or higher
-   Debian 8 or higher
-   CentOS 7 or higher
-   Red Hat 6 or higher (RHEL 10+ requires separate DHCP server, See [ISC-DHCP is deprecated](https://github.com/FOGProject/fogproject/issues/730) )
-   Fedora 22 or higher
-   Any version of Arch.


### Linux Packages Used

This listing is for informational purposes only, as the required
components will be automatically downloaded and installed by the FOG
installation script:

-   PHP 5/7
-   MySql 5+/MariaDB 10+,
-   Apache 2+,
-   DHCP (pretty much any!)
-   TFTP
-   FTP
-   NFS

The LAMP setup can also be easily adjusted for a "WAMP (Windows Apache
MySQL PHP) system" though will require a bit more knowledge of what
packages to use and how to integrate with the FOG system.

## Hardware Requirements

FOG is designed to run on modest hardware. The only firm requirements are
**enough disk space for your images** and a **1 Gbps network card** — everything
else can be quite minimal.

| Resource | Baseline |
| --- | --- |
| CPU | 2 cores |
| RAM | 2 GB |
| Network | 1 Gbps |

More CPU and RAM are never wasted — they help with image compression, multicast,
and running many tasks at once — but they are not required. These baselines are
enough for a working server.

### Disk space and partitioning

Disk space for `/images` is the figure that actually matters. FOG captures only
the *used* blocks of a disk (not its full size) and stores them compressed, so an
image is far smaller than the source drive — but the size varies widely with the
OS and how full the machine is.

Plan your total as:

    (images you'll keep) x (average image size) + headroom

Keep the OS and `/images` on separate partitions or disks so that a full image
store can't take down the host OS. `/images` is where every captured image lives,
and you can grow it later by mounting a larger disk there.

### Client (target machine) requirements

The computers you image have one requirement worth noting: **at least 512 MB of
RAM**. The FOS imaging environment's `init.xz` decompresses into memory on boot,
so a machine with too little RAM won't load it. This is trivial on modern
hardware but can trip up very old or low-spec machines.
