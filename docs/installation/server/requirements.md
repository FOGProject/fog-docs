---
title: Requirements
context_id: requirements
aliases:
    - Requirements
    - System Requirements
description: detail the hardware and os requirements
tags:
    - in-progress
    - updating-content
    - system-requirements
    - dependencies
---

# System Requirements

<!-- Ideally this page will be a simple table of requirements and then more info for reference like the packages installed by the installer -->


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
-   Red Hat 6 or higher
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

More info needed here, but the server is designed to be able to run on minimal resources. The only firm requirement is enough space for your images and at least a 1Gbps network card.
<!-- There are no strict requirements for the hardware of your fog server. It's designed to run very well on minimal resources, but it can certainly still benefit from more power if you have it.
Generally you need

* 2+ core cpu (more cores)
* 2+ GB of Ram -->
