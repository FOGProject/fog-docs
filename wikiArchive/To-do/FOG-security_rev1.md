# FOG Security {#fog_security}

Below are some of the most basics steps you can take to increase the
security of your FOG server(s)

## Firewall Settings {#firewall_settings}

Below are instructions on how to make FOG work with your firewall left
on. If you encounter any scenario where this configuration does not
work, please let us know
[here](https://forums.fogproject.org/topic/6162/firewall-configuration).

### FIREWALLD VS IPTABLES {#firewalld_vs_iptables}

Firewalld is an IPTables wrapper. It comes installed on Centos 7 and
newer fedora installs. If you do not have firewalld then you most likely
will have IPTables. To check if you have firewalld run firewall-cmd. If
the command runs fine (no command not found error) then you have
firewalld.

### FIREWALLD

    yum install firewalld -y
    systemctl start firewalld
    systemctl enable firewalld
    for service in http https tftp ftp mysql nfs mountd rpc-bind proxy-dhcp; do firewall-cmd --permanent --zone=public --add-service=$service; 
    done

    echo "Open UDP port 49152 through 65532, the possible used ports for fog multicast" 
    firewall-cmd --permanent --add-port=49152-65532/udp
    echo "Allow IGMP traffic for multicast"
    firewall-cmd --permanent --direct --add-rule ipv4 filter INPUT 0 -p igmp -j ACCEPT
    systemctl restart firewalld.service
    echo "Done."

### IPTABLES

Does not include multicast, if you know how to do it please let us know
in the [forums](https://forums.fogproject.org/).

    echo "IPTABLES_MODULES=\"nf_conntract_tftp nf_conntrack_ftp nf_conntrack_netbios_ns\"" >> /etc/sysconfig/iptables-config
    for port in 80 443 21 3306 2049 20048 111 138 139 445; do iptables -I INPUT 1 -p tcp --dport $port -j ACCEPT; done
    for port in 69 111 4011 137; do iptables -I INPUT 1 -p udp --dport $port -j ACCEPT; done
    service iptables save

### DHCP & DNS {#dhcp_dns}

If you use your FOG Server for DHCP or DNS run these commands as well.

**Firewalld Additions**

    for service in dhcp dns; do firewall-cmd --permanent --zone=public --add-service=$service; done
    firewall-cmd --reload

**IPTables Additions**

    iptables -I INPUT 1 -p tcp --dport 53 -j ACCEPT;
    for port in 53 67; do iptables -I INPUT 1 -p udp --dport $port -j ACCEPT; done
    service iptables save

------------------------------------------------------------------------

`<font color="red">`{=html}The below settings have been tested on FOG
0.29 and 0.30 only. Alot of this stuff still applies to 1.2.0 and 1.3.0,
but only generally and needs adapted.`</font>`{=html}

### Reference

[firewall-configuration](https://forums.fogproject.org/topic/6162/firewall-configuration)

## Secure MySQL {#secure_mysql}

If you have not secure your MySQL Database since installation, whether
it was installed by FOG or via other methods, you need to take a few
steps to secure it.

MySQL comes with a little script that enables you to implement some
basic security to your database, you only have to run the script but
MAKE SURE to take note of the passwords you will set since you will need
to provide them to FOG.

-   Run the MySQL secure installation script, to run it do this

`sudo mysql_secure_installation`

*Read what the script states since it\'s important that you understand
what you are doing.*

The script will allow you to set a root password for your database since
it was **blank!** now set your password and make sure to take note of
it. FOG will need it.

When you are done run

`/etc/init.d/mysqld reload`

[More
info:](http://dev.mysql.com/doc/refman/5.0/en/mysql-secure-installation.html)

If your interested in further secure your MySQL you can go to the link
below, however bear in mind that I have not tested those changes.
[Securing MySQL:
step-by-step](http://www.symantec.com/connect/articles/securing-mysql-step-step)

## Securing your Images {#securing_your_images}

When FOG captures an image, it creates one or more image files for that
computer. Depending on how your using FOG you may wanna secure your
images directory. Since it\'s not necessary for other users to access
this files we will restrict the access to root and to FOG.

To fix Images folder ownership run (assuming /images/ is where you have
your FOG images)

`chown -R fog:root /images/`

Then do to set up permissions

`chmod -R 770 /images/`

In theory you could(should?) go with a more restrictive set of
permissions however, in reality FOG usually complains if we do.

## Securing NFS {#securing_nfs}

NFS Shares are harder to secure cause of its nature. They constantly
change ports, and give how FOG access them is not so easy to secure them
and at the same time keep FOG working.

*More to come on how to secure NFS soon!*

## Other issues {#other_issues}

Unfortunately FOG design doesn\'t leave much room for security. It\'s
hard to tighten the server and keep FOG working, however this doesn\'t
mean we should ignore this security holes, in contrary we must keep
watching them to avoid intrusions.

Here\'s a list of some of FOG security problems still to be addressed.

-   **No SSL Support on Web UI:** (Tested on FOG 0.29 and 0.30) Tests
    performed in Apache and the use of *RequireSSL* option with FOG,
    showed that it cannot deal with the use of SSL, when server enforce
    SSL connections FOG fails to connect properly.*(Seems like next FOG
    version 0.33 will support SSL on its Web UI)*
-   **NFS Shares**. FOG design allows it to capture(write) images via
    nfs, this requires access to the nfs share from any computer you
    want to capture images from. An attacker could fill your disk and/or
    erase all files in /images/dev since is mounted as read and write
    for any client.*(nfs share /images/ is read only)*
-   **Public availability of files:** Since FOG files are served via
    TFTP and PXE, this means any computer on your network can access
    those files (as longs as they can network boot). This includes the
    Linux kernel that FOG uses. So any password you set up in the FOG
    menu is not really relevant for a technical user or an attacker.
-   **Installation advices:** During installation FOG recommends to turn
    off SELinux because it can get in the way of the installation and
    the way FOG works. Although this certainly allows FOG to work, is
    not good practice to turn SELinux off. Is better to set SELinux in
    permissive mode, and then run a few test with FOG so we can allow
    only the things it needs, and then put it back on, this can take
    some time to configure properly but it\'s the safest way to work.

Experimental SELinux instructions (dec 2015) can be found here: [SELinux
Policy](https://forums.fogproject.org/topic/6154/selinux-policy)

## Informing FOG of Changes {#informing_fog_of_changes}

**Note:** Below settings are from 2012 and pre-FOG 1.0.0, Fog 1.3.0 uses
the MySQL Credentials found in the /opt/fog/.fogsettings file. More
information can be found at: [.fogsettings](.fogsettings "wikilink")

*This assumes you ONLY performed the steps mentioned in this wiki, if
you made any other changes this guide might be incomplete for you.*

FOG will start to complain it cannot access the MySQL Database case we
set up a root password. Lets give FOG the password

-   Go to

`/opt/fog/service/etc/config.php`

Make sure the fields **MYSQL_USERNAME** reads **root** (or whatever user
you wanna use) and for **MYSQL_PASSWORD** write down the password.
Example

`define( "MYSQL_PASSWORD", "thisISmySUPERpass0*$98!" );`

*If your running FOG and MySQL in the same host, you need to check the
line **MYSQL_HOST** so it reads **localhost***

`define( "MYSQL_HOST", "localhost" );`

-   Now go to

`/var/www/html/fog/commons/config.php`

and check the same 3 fields that we did before.

`define( "MYSQL_HOST", "localhost" );`\
`define( "MYSQL_DATABASE", "fog" );`\
`define( "MYSQL_USERNAME", "root" );`\
`define( "MYSQL_PASSWORD", "thisISmySUPERpass0*$98!" );`

Save everything and try to access FOG again and your done =)

## Related articles {#related_articles}

[FOG_Client#Security_design](FOG_Client#Security_design "wikilink")
