### Fedora 20/21/22/23 {#fedora_20212223}

**Disable/stop Firewall**

    systemctl disable firewalld.service

    systemctl stop firewalld.service

Can be undone with \"start\" and \"enable\".

**Check Firewall in Fedora 20/21/22/23**

    systemctl status firewalld.service

### Fedora 16 {#fedora_16}

    Add /bin/bash to /etc/shells as the vsftpd yum install does not do it correctly causing tftp timeout message

### Debian/Ubuntu

    sudo iptables -L

If disabled, the output should look like this:

    Chain INPUT (policy ACCEPT)
    target prot opt source destination 

    Chain FORWARD (policy ACCEPT)
    target prot opt source destination 

    Chain OUTPUT (policy ACCEPT)
    target prot opt source destination

**Disable Ubuntu Firewall**

    sudo ufw disable

**Disable Debian Firewall**

    iptables -F
    iptables -X
    iptables -t nat -F
    iptables -t nat -X
    iptables -t mangle -F
    iptables -t mangle -X
    iptables -P INPUT ACCEPT
    iptables -P OUTPUT ACCEPT
    iptables -P FORWARD ACCEPT

Other debian settings:

    /etc/hosts.deny

This setting in the above file will deny traffic from any source except
locally:

    ALL:ALL EXCEPT 127.0.0.1:DENY

Comment out this line like so:

    #ALL:ALL EXCEPT 127.0.0.1:DENY

### Windows 7 {#windows_7}

Start -\> Control Panel -\> View by \"Small icons\" -\> Windows Firewall
-\> Turn Windows Firewall On or Off -\> Turn off all three.

### Configuring firewall on Linux {#configuring_firewall_on_linux}

To set the firewall for Linux to only allow what is necessary, please
see the [FOG security](FOG_security "wikilink") article.
