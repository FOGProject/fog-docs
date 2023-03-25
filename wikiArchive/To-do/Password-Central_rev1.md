This article reflects settings in the 1.3.0 release.

# Web Interface {#web_interface}

Default username is `<font color="red">`{=html}fog`</font>`{=html}

Default password is `<font color="red">`{=html}password`</font>`{=html}

If you lose this password, and you have root access to the main fog
server, you can reset it to the default via CLI.

## 1.2.0 and lower {#and_lower}

NOTE: Can still be used for 1.3.0

    mysql -D fog
    UPDATE `users` SET `uPass` = MD5('password') WHERE `uName` = 'fog';
    quit

## 1.3.0 series

    mysql -D fog
    UPDATE `users` SET `uPass` = '$2y$11$g0Hu8OaOStuPk7WWYGh6Wu4PLlZDZGOkzMwEEAk.rZMrI9IdDwno.' WHERE `uName` = 'fog';
    quit

Alternatively, if the `<font color="red">`{=html}fog`</font>`{=html}
user does not exist, you may create it with the default password via
CLI.

    mysql -D fog
    INSERT INTO `users` (`uName`,`uPass`,`uCreateBy`,`uType`) VALUES ('fog','$2y$11$g0Hu8OaOStuPk7WWYGh6Wu4PLlZDZGOkzMwEEAk.rZMrI9IdDwno.','localAdmin','0');
    quit

## 1.4.0 and 1.5.0 series {#and_1.5.0_series}

For 1.4 and 1.5, there are some other fields needed when recreating a
new user. Here\'s how to do that:

    mysql -D fog
    INSERT INTO users (uName,uPass,uCreateDate,uCreateBy,uType,uDisplay,uAllowAPI,uAPIToken) VALUES('fog','$2y$11$A2D/RijXM.qL7KYrMVo7f.Gfomq6vO6NpL6pEHQIY1OzUci7wBOjC','2017-11-23 9:48:00','localAdmin',0,'fog',1,'');
    quit

# Storage Management Credentials {#storage_management_credentials}

Accessed via the web interface, and then clicking on \"Storage
Management\" in the ribbon. In here, you can view the storage nodes
connected to your fog server.

By clicking on one of the storage nodes, you enter into that storage
node\'s settings area. In here are the FTP credentials labeled
\'username\' and \'password\' used for managing this storage node.
Please see [Troubleshoot FTP](Troubleshoot_FTP "wikilink") for **further
troubleshooting**.

# Active Directory {#active_directory}

There are three places where you can set Active Directory joining
credentials. Two are persistent.

## Global Defaults {#global_defaults}

`<font color="red">`{=html}Web Interface -\> FOG Configuration -\> FOG
Settings -\> Active Directory Defaults -\>
FOG_AD_DEFAULT_USER`</font>`{=html}

`<font color="red">`{=html}Web Interface -\> FOG Configuration -\> FOG
Settings -\> Active Directory Defaults -\>
FOG_AD_DEFAULT_PASSWORD`</font>`{=html}

`<font color="red">`{=html}Web Interface -\> FOG Configuration -\> FOG
Settings -\> Active Directory Defaults -\>
FOG_AD_DEFAULT_PASSWORD_LEGACY`</font>`{=html}

These three areas are just place-holders. When ticking the checkbox to
join a host to Active Directory (explained below), these global settings
are what is used to populate the fields. These fields are also what is
used when saying \"Y\" to joining Active Directory via network booting
and doing a \"Full Host Registration\".

The FOG_AD_DEFAULT_PASSWORD field is used only for the new fog client.
This field is typed in as plain-text, and upon saving, is encrypted
using an industry-standard encryption technique. Please read through
[FOG_Client#Security_Design](FOG_Client#Security_Design "wikilink") for
more details on this.

The FOG_AD_DEFAULT_PASSWORD_LEGACY field is only used with the legacy
fog client. This value must be encrypted first by \"fogcrypt.exe\". This
program runs on windows via command prompt only, and is available for
download at the bottom of every page in the fog web interface, including
the login page. After running your password through this program, you
would copy/paste the encrypted string it produces into the
FOG_AD_DEFAULT_PASSWORD field. This field **should not be set** if you
do not intend to use the legacy client. It\'s also **strongly advised
not use the legacy client**, and instead use the new fog client due to
security concerns.

## Host Settings {#host_settings}

You may individually set unique user/pass and domain information on a
per-host basis if you wish. You can get to this area like this:

`<font color="red">`{=html}Web Interface -\> Host Management -\> \[list
all hosts or search\] -\> Click on the desired host -\> Click \"Active
Directory\"`</font>`{=html}

In this area, there are a few fields. When checking the \"Join Domain
after image task\" checkbox, if global defaults are set, they are
auto-populated into these fields. You may manually enter these fields
with whatever domain/user/password you wish.

The two password fields \"Domain Password\" and \"Domain Password
Legacy\" are explained above in the \"Global Defaults\" area.

## Group Settings {#group_settings}

You may set Active Directory credentials on many hosts at once via
groups. After setting AD Credentials here and then coming back to check
this area in groups, you will see that the field is always blank. The
settings are not applied to the group, but instead to each individual
host within the group. If you check the individual hosts (explained
above), you will see that your settings have applied. Hosts later added
to the group will not receive the previously applied settings, because
the settings do not apply to the group, but instead to each individual
host in the group and only at the time of applying the settings.

You can go to this area like this:

`<font color="red">`{=html}Web Interface -\> Group Management -\> \[list
all groups or search\] -\> Click the desired group -\> Click \"Active
Directory\"`</font>`{=html}

The two password fields \"Domain Password\" and \"Domain Password
Legacy\" are explained above in the \"Global Defaults\" area.

# MySQL

Related article: [Troubleshoot_MySQL](Troubleshoot_MySQL "wikilink")

## For Storage Nodes {#for_storage_nodes}

FOG 1.3.0 storage nodes communicate with the main server\'s database to
get various work done. During installation, the installer will prompt
you for a
`<font color="red">`{=html}FOG_STORAGENODE_MYSQLUSER`</font>`{=html} and
a `<font color="red">`{=html}FOG_STORAGENODE_MYSQLPASS`</font>`{=html}.

The default username is
`<font color="red">`{=html}fogstorage`</font>`{=html}

The password is always unique, and can be retrieved via the web
interface here:

`<font color="red">`{=html}Web Interface -\> FOG Configuration -\> FOG
Settings -\> FOG Storage Nodes -\>
FOG_STORAGENODE_MYSQLPASS`</font>`{=html}

You would copy/paste this password value into the installer during
installation.

If you need to change this password or username or server address later
on a storage node, you may edit the
`<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} on that
particular node to update the password and then re-run the installer to
complete changes. You may edit the file with Vi like this:

`<font color="red">`{=html}vi /opt/fog/.fogsettings`</font>`{=html}

Instructions on using Vi: [vi](vi "wikilink")

In this file, look for the fields
`<font color="red">`{=html}snmysqluser=`</font>`{=html} and
`<font color="red">`{=html}snmysqlpass=`</font>`{=html} and
`<font color="red">`{=html}snmysqlhost=`</font>`{=html}. That\'s where
you\'d change the values, and then after saving and closing, re-run the
installer to complete changes.

To change the password in MySQL, you would run one of the below commands
on **the main fog server**.

Newer versions of MySQL and Ubuntu 16+:

    mysql
    ALTER USER 'fogstorage'@'%' IDENTIFIED WITH mysql_native_password BY 'NewPassGoesHere';

Older versions of MySQL:

    mysql
    ALTER USER 'fogstorage'@'%' IDENTIFIED BY 'NewPassGoesHere';

## For Main Server {#for_main_server}

Typically, the user, password, and host is normally blank for the main
server. The installer, unless told otherwise when it prompts, will
assume a blank password.

To change the password in MySQL, it would be something like one of
these:

Newer versions of MySQL and Ubuntu 16+:

    mysql
    ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';

Older versions of MySQL:

    mysql
    ALTER USER 'root'@'localhost' IDENTIFIED BY '';

After having changed the password, it may be necessary to update the
value inside of
`<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} on the
main server. You may edit the file with Vi like this:

`<font color="red">`{=html}vi /opt/fog/.fogsettings`</font>`{=html}

Instructions on using Vi: [vi](vi "wikilink")

In this file, look for the fields
`<font color="red">`{=html}snmysqluser=`</font>`{=html} and
`<font color="red">`{=html}snmysqlpass=`</font>`{=html} and
`<font color="red">`{=html}snmysqlhost=`</font>`{=html}. That\'s where
you\'d change the values, and then after saving and closing, re-run the
installer to complete changes.

# Proxy Settings {#proxy_settings}

If your organization uses a Proxy Server to access the web, you may set
credentials and other settings for this **if needed** here:

`<font color="red">`{=html}Web Interface -\> FOG Configuration -\> FOG
Settings -\> Proxy Settings`</font>`{=html}

# Kernel Updates {#kernel_updates}

The username and password for FOG 1.3.0 kernel updates is oddly named,
as you will see below. These credentials are the ones used when placing
newly downloaded kernels and inits onto the server. They are used via
FTP. See [Kernel Update](Kernel_Update "wikilink") for more information
on the process.

The username and password is located here:

`<font color="red">`{=html}Web Interface -\> FOG Configuration -\> FOG
Settings -\> TFTP Server -\> FOG_TFTP_FTP_PASSWORD`</font>`{=html} and
`<font color="red">`{=html}FOG_TFTP_FTP_USERNAME`</font>`{=html}

# Local \"fog\" user {#local_fog_user}

Please do not use the local \"fog\" user account on the server to do
back-end work. Create another account and use that. When building a new
server, create a work account and do not create a \"fog\" user. This is
absolutely not needed as the installer will create and maintain this
user account.

The \"fog\" user is a local linux account on your fog server or fog
storage node. It\'s also the account used by default for FTP access to
any storage nodes (see Storage Management Credentials above).

To reset this password, you need to be this user, or root.

On any Linux system, you can elevate an administrative account to root
like this:

    sudo -i

And then provide your password.

You may change the fog password like this:

    passwd fog

You\'ll be prompted for the new password, and then to re-enter it again.

Please see [Troubleshoot FTP](Troubleshoot_FTP "wikilink") for a more
complete article on this topic.

# .fogsettings

Located here:
`<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html}

You may edit it with Vi like this:

    vi /opt/fog/.fogsettings

Instructions on using Vi: [vi](vi "wikilink")

In this file, there are a whole lot of settings, passwords, addresses,
etc. You should re-run the fog installer after changing any settings in
this file. The important settings in here in relation to the scope of
this article are:

-   `<font color="red">`{=html}password=`</font>`{=html} This is what
    the installer uses to reset the local account,
    `<font color="red">`{=html}username`</font>`{=html}
    -   Make sure this is set correctly or you\'ll find that every time
        you update or re-run the installer, you will have FTP failure,
        or have locked yourself out of your server!

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}username=`</font>`{=html} This is the
    local account to be managed by the installer, and used by fog for
    many things, to include FTP.

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}snmysqluser=`</font>`{=html} This is the
    username to access the MySQL server.

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}snmysqlpass=`</font>`{=html} This is the
    password to access the MySQL server.

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}snmysqlhost=`</font>`{=html} This is the
    MySQL server address.

Please see [.fogsettings](.fogsettings "wikilink") for a complete
listing and details.

# config.class.php

Typically located here:
`<font color="red">`{=html}/var/www/html/fog/lib/fog/config.class.php`</font>`{=html}

You may view the file like this:

    cat /var/www/html/fog/lib/fog/config.class.php

Used to be in **older versions** of FOG, this is where passwords and
such would be set. It\'s no longer necessary to edit this file to set
passwords, as the installer completely rebuilds this file every time
it\'s ran. You simply need to make sure that the settings inside of
`<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} are
correct and then re-run the installer to update this file.

That said, you can view this file if you wish to see if passwords are
being set correctly in it. Note that any changes manually made here but
not reflected inside of .fogsettings will **simply be overwritten** upon
the next fog update or re-run of the installer.
