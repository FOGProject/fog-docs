# MySQL\'s role in FOG {#mysqls_role_in_fog}

MySQL is used to hold information and metadata about hosts, images,
groups, snapins, various web-level fog settings, and other things. It
does not house the actual image data. In newer Linux, it\'s being phased
out in favor of MariaDB. All commands for MySQL will work for MariaDB.

# Easy & quick MySQL test {#easy_quick_mysql_test}

For the main server and all storage nodes, you may test to see if there
is a proper database connection happening or not by visiting the below
URL. Replace the x.x.x.x with the IP address of the system you wish to
test, and test each system one by one.

`<font color="red">`{=html}<http://x.x.x.x/fog/service/getversion.php>`</font>`{=html}

If everything is working, the output will **only** report the server\'s
FOG version and nothing else. All servers in a distributed FOG system
should always be kept on the same version.

# Manually Testing MySQL {#manually_testing_mysql}

On your FOG server, you can check passwords and the existence of the FOG
database by issuing these commands:

No Password:

    mysql -D fog
    exit

Test with a username and password (note **no space** between -p and the
password):

    mysql -u UserNameHere -pPasswordHere -D fog
    exit

For a remote server or from a storage node, use:

    mysql -u UserNameHere -pPasswordHere -h X.X.X.X -D fog
    exit

-   X.X.X.X represents where you\'d put the remote host\'s IP address.
-   **-u** is username
-   **-p** is password
-   **-h** is host
-   **-d** is database

# MySQL Service {#mysql_service}

## CentOS / RHEL / Fedora {#centos_rhel_fedora}

Check status:

    systemctl status mysql

Restart service:

    systemctl restart mysql

## Debian / Ubuntu {#debian_ubuntu}

Check status:

    service mysql status

Restart service:

    service mysql restart

# MySQL Config File {#mysql_config_file}

The location of this file varies based on the distribution of Linux
you\'re using. Usually it\'s called my.cnf and it\'s probably best to
just issue a search command for the file and then figure out which one
of the results it is, generally you can pick it out quickly based on the
path that the file is in. Here\'s how to search:

    find / -type f -name my.cnf

Here is a sample output from Fedora 23:

    /etc/my.cnf
    /etc/my.cnf.d
    /etc/my.cnf.d/mysql-clients.cnf
    /etc/my.cnf.d/client.cnf
    /etc/my.cnf.d/mariadb-server.cnf
    /etc/my.cnf.d/tokudb.cnf

In this case, the first result is the right file,
`<font color="red">`{=html}/etc/my.cnf`</font>`{=html} Looking into this
particular file (on Fedora 23), there is a line that says
`<font color="red">`{=html}!includedir /etc/my.cnf.d`</font>`{=html}
This means any files in that directory,
`<font color="red">`{=html}/etc/my.cnf.d`</font>`{=html} are included in
MySQL\'s configuration.

# MySQL credentials for FOG Main and Storage Nodes {#mysql_credentials_for_fog_main_and_storage_nodes}

The installer sets up FOG with the MySQL Credentials given during
installation. These credentials are then stored inside of
`<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} for use
with the next installation/update. Fog builds a particular web file,
`<font color="red">`{=html}/var/www/html/fog/lib/fog/config.class.php`</font>`{=html}
this file\'s settings are what the FOG web front end uses to access
MySQL and other things as well.

If those files have incorrect credentials, then there will be mysql
permission and access errors in the Apache error logs, and maybe
computers will not be able to boot from the FOG Main server or storage
nodes either. `<font color="red">`{=html}bind-address`</font>`{=html}
defined inside of the my.cnf file can also cause this.

By default, FOG does not set any MySQL password for the main fog server,
but FOG Storage nodes MUST use the fogstorage mysql user (or some
remote-enabled user that has permissions to the fog db). Storage Nodes
communicate with the main FOG server\'s MySQL database directly in order
to update tasking and to present proper boot.php iPXE scripts to
clients. This Username/password is auto-generated during installation
and can be found here:

`<font color="red">`{=html}Web Interface -\> FOG Configuration -\> FOG
Settings -\> FOG Storage Nodes -\> FOG_STORAGENODE_MYSQLPASS and
FOG_STORAGENODE_MYSQLUSER`</font>`{=html}

From a FOG Storage node, you may try this username & password
combination using the example above in the testing section.

See also: [Password Central](Password_Central "wikilink")

# Reset MySQL fog user and password {#reset_mysql_fog_user_and_password}

    mysql
    DROP USER 'fog'@'localhost';

    #Create the user using a password:
    CREATE USER 'fog'@'localhost' IDENTIFIED BY 'YourPasswordGoesHere';

    #Create the user without a password:
    CREATE USER 'fog'@'localhost';

    GRANT ALL ON fog.* TO 'fog'@'localhost';
    exit

Newer MySql and Ubuntu 16+ method:

    ALTER USER 'fog'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourPasswordGoesHere';
    #Or:
    ALTER USER 'fog'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'YourPasswordGoesHere';
    #Or no password:
    ALTER USER 'fog'@'localhost' IDENTIFIED WITH mysql_native_password BY '';

# Change MySQL user\'s password {#change_mysql_users_password}

You can change a user\'s password and where they are able to connect
from with this command:

    #Enable only local access:
    SET PASSWORD FOR 'fogstorage'@'localhost' = PASSWORD('PasswordHere');

    #Enable access from remotely:
    SET PASSWORD FOR 'fogstorage'@'%' = PASSWORD('PasswordHere');

# Manually export / import Fog database {#manually_export_import_fog_database}

Related article: [Migrate FOG](Migrate_FOG "wikilink")

Export:

    mysqldump -u USERNAME -pPASSWORD -h HOSTNAME fog > fogDB.sql

Import:

    mysql -u USERNAME -pPASSWORD -h HOSTNAME fog < fogDB.sql

Example using root and 13375p3@k as the password on the local host.

    #Exporting my DB locally on my FOG server...
    mysql -u root -p13375p3@k fog > fog_backup.sql

    #Here is an import example...
    mysql -u root -p13375p3@k fog < fog_backup.sql

    #Here is an example of exporting a remote DB to your current directory, 
    #where x.x.x.x would be replaced by the IP of the remote system...

    mysql -u root -p13375p3@k -h x.x.x.x fog > fog_backup.sql

# Enable remote mysql access {#enable_remote_mysql_access}

Generally this isn\'t needed, as a \"fogstorage\" user is already setup
with remote access for storage node purposes by the FOG Installer (In
1.3.0). However if you wanted ease of interaction to do testing or
development on the FOG database via remote access with a third party
tool (such as [HeidiSQL](http://www.heidisql.com/)), then you\'d need to
enable remote access on an account, or make a new account and enable
remote access for it.

    mysql
    SET PASSWORD FOR 'fogstorage'@'%' = PASSWORD('PasswordHere');
    GRANT ALL PRIVILEGES ON fog.* TO 'fogstorage'@'%' IDENTIFIED BY 'PasswordHere' WITH GRANT OPTION;
    FLUSH PRIVILEGES;

If you want to restrict access to a specific IP, replace the percent
symbol (%) with an IP.

Some systems have a bind address set. You can disable that in the my.cnf
file. Search for that file with this:

    find / | grep /my.cnf

Comment out these lines with a hash tag \#

    #skip-networking
    #bind-address = 127.0.0.1

# Increase maximum simultaneous MySQL connections {#increase_maximum_simultaneous_mysql_connections}

If you\'re imaging 50 to 200 computers simultaneously, or simply have a
very large amount of hosts, you\'ll find the below settings helpful.

    mysql
    SET GLOBAL max_connections = 200;
    flush hosts;

Open the my.cnf file and make the below change.

**Fedora 20,21,22:**

/etc/my.cnf

**Ubuntu 14:**

/etc/mysql/my.cnf

    max_connections = 200

then restart mysql

# Repair broken database {#repair_broken_database}

If you\'ve filled the partition that contains the MySQL Database file
completely full, it\'s highly likely that your MySQL database is now
corrupted (and probably several other things too if your really
unlucky). You can check for issues and attempt to repair them like this:

    mysqlcheck -r fog

If you\'re able to successfully repair the database, promptly do a DB
export via the Web interface or manually via the steps in this article,
and then start thinking about migrating/fixing your FOG server so the
partition table layout is optimal and safe so this doesn\'t happen
again.

You really should try to avoid housing your images and snapins on
important partitions, and should instead place images and snapins on
their own partition. Setting up a partition for images and snapins is
most easily done during OS installation - but can be done afterwards
albeit there are many more steps and many more chances to make mistakes.

There are numerous tutorials in the Forums and some bits of information
about it in the Wiki, but generally you would create a mount point
called `<font color="red">`{=html}/images`</font>`{=html} and give that
partition as much space as you can. You should still allow the
`<font color="red">`{=html}/`</font>`{=html} , possibly
`<font color="red">`{=html}/home`</font>`{=html} , and a swap partition
the size it needs. For minimal installs, the
`<font color="red">`{=html}/`</font>`{=html} partition at minimum can
operate on 6GB but I would recommend 20GB. The swap partition should be
equal to the amount of RAM, or double. The
`<font color="red">`{=html}/home`</font>`{=html} partition should be
sizable if you are using a GUI, something like 20GB. If not using a GUI,
probably 10GB would be fine. Optionally, you can also create a partition
for `<font color="red">`{=html}/opt`</font>`{=html} and give it 20 or so
GB.

For Linux newcomers, it\'s important to note that if your using a GUI to
install the OS, setting these partitions is usually intuitive and very
easy now-a-days.

# Ubuntu 13.04 14.04 15.04 and higher with FOG 1.2.0 {#ubuntu_13.04_14.04_15.04_and_higher_with_fog_1.2.0}

Ubuntu has issues with mysql. Particularly anything 13 and greater seems
to be hugely a problem from my experience.

When this happens, fog will run normally after the server boots for 10
or 15 minutes and then mysql crashes, which forces a \"Update the
Database Schema\" message when trying to use fog, and the schema updater
does not fix the problem.

To test if this is the issue, simply try to restart MySQL (please note
this is only temporary) and see if the problem goes away:

    sudo service mysql restart

A fix has been reported with this issue. Here are the instructions to
fix it:

Open this file:

    sudo vi /var/www/fog/lib/fog/Config.class.php

Notate both the host, username & password and then close the above file.
Open this file:

    sudo vi /opt/fog/.fogsettings

Fill in the following portions:

-   snmysqluser=\"{root}\"

```{=html}
<!-- -->
```
-   snmysqlpass=\"{PasswordIfYouHaveOne}\"

```{=html}
<!-- -->
```
-   snmysqlhost=\"{localhost}\"

Reset the mySQL database password to be what is in the config files.

Then run this:

    sudo dpkg-reconfigure mysql-server-5.5

Enter in the new password when prompted.

If you still have issues re-run the installer.

# The DB and Multicast {#the_db_and_multicast}

For issues with Multicast, the DB tables associated with that could be
dirty. You\'ll know this is the case if clients just sit at the
partclone screen doing nothing.

    TRUNCATE TABLE multicastSessions; 
    TRUNCATE TABLE multicastSessionsAssoc; 
    DELETE FROM tasks WHERE taskTypeId=8;

Via MySQL cli or phpmyadmin (easy to install)

Please also see: [Troubleshoot Downloading -
Multicast](Troubleshoot_Downloading_-_Multicast "wikilink") and
[Multicast](Multicast "wikilink")

# Database Maintenance Commands {#database_maintenance_commands}

Sometimes, a host will be created with an ID of 0 (zero). Sometimes,
there are MAC addresses that loose their association with a host, and in
a sense become orphaned. Sometimes there are tasks that just need
cleared out. Sometimes there are hosts without MACs. Sometimes groups of
ID 0 get made, sometimes snapins of ID 0 get made. Sometimes snapins are
associated with hosts that don\'t exist anymore. Other things go wrong
sometimes. These things cause problems with FOG\'s operation and need
cleared out in order to have a clean & healthy database. The below
commands are intended to run on FOG 1.3, 1.4, and 1.5 series, they will
clear these problems for you. This also fixes problems with multicast
occasionally, where the partclone screen just sits there doing nothing.

    # No password:
    mysql -D fog

    # Password:
    mysql --user=UsernameHere --password=PasswordHere -D fog


    # The following chunk of commands will clean out most problems and are safe:
    DELETE FROM `hosts` WHERE `hostID` = '0';
    DELETE FROM `hostMAC` WHERE hmID = '0' OR `hmHostID` = '0';
    DELETE FROM `groupMembers` WHERE `gmID` = '0' OR `gmHostID` = '0' OR `gmGroupID` = '0';
    DELETE FROM `snapinGroupAssoc` WHERE `sgaID` = '0' OR `sgaSnapinID` = '0' OR `sgaStorageGroupID` = '0';
    DELETE from `snapinAssoc` WHERE `saID` = '0' OR `saHostID` = '0' OR `saSnapinID` = '0';
    DELETE FROM `hosts` WHERE `hostID` NOT IN (SELECT `hmHostID` FROM `hostMAC` WHERE `hmPrimary` = '1');
    DELETE FROM `hosts` WHERE `hostID` NOT IN (SELECT `hmHostID` FROM `hostMAC`);
    DELETE FROM `hostMAC` WHERE `hmhostID` NOT IN (SELECT `hostID` FROM `hosts`);
    DELETE FROM `snapinAssoc` WHERE `saHostID` NOT IN (SELECT `hostID` FROM `hosts`);
    DELETE FROM `groupMembers` WHERE `gmHostID` NOT IN (SELECT `hostID` FROM `hosts`);
    DELETE FROM `tasks` WHERE `taskStateID` IN ("1","2","3");
    DELETE FROM `snapinTasks` WHERE `stState` in ("1","2","3");
    TRUNCATE TABLE multicastSessions; 
    TRUNCATE TABLE multicastSessionsAssoc; 
    DELETE FROM tasks WHERE taskTypeId=8;


    # This one clears the history table which can get pretty large:
    TRUNCATE TABLE history;


    # This one will clear the userTracking table, This table is where user login/logout (for host computers, not the fog server) is stored. This table can also get pretty large.
    TRUNCATE TABLE userTracking;

    quit
