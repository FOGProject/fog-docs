    http://www.progtutor.com/blog/7-tips-tuts/751-static-ip-configuration-in-ubuntu-1204-lts


    Static IP configuration in Ubuntu 12.04 LTS
    Friday, 27 April 2012 11:05 David Tran

    There are tons of changes in Ubuntu 12.04 LTS and The most notable difference for the user is that any change manually done to /etc/resolv.conf will be lost as it gets overwritten each time something triggers resolvconf. Instead,Networking38resolvconf uses DHCP client hooks, and /etc/network/interfaces to generate a list of nameservers and domains to put in /etc/resolv.conf, which is now a symlink: /etc/resolv.conf -> ../run/resolvconf/resolv.conf

    To configure the resolver, add the IP addresses of the nameservers that are appropriate for your
    network in the file /etc/network/interfaces. You can also add an optional DNS suffix search-lists
    to match your network domain names. For each other valid resolv.conf configuration option, you can
    include, in the stanza, one line beginning with that option name with a dns- prefix. The resulting file
    might look like the following:

    # The primary network interface
    auto eth0
    iface eth0 inet static
    address 192.168.9.100
    netmask 255.255.255.0
    network 192.168.9.0
    broadcast 192.168.9.255
    gateway 192.168.9.254
    dns-search example.com
    dns-nameservers 8.8.8.8
