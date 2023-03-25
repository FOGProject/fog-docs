# Tweaks

-   The following sections are devoted to strictly performance. If there
    are always pros and cons when tweaking to read carefully. All
    Pros/Cons should be added.
-   ALL these Settings must be changed by the **FOG User**. If tested
    continuously and fully approved then these may make it into the
    Default Setup of fog.
-   `<span style="background-color:RED; color:Orange;">`{=html}**DO AT
    YOUR OWN RISK**`</span>`{=html}
-   **Pros** description of the good
-   **Cons** description of the bad
-   **PvC** A rating scale of 1 to 10, 1 being the ALL **Con** and 10
    being ALL **Pro**
-   **Dev. Approved** One or multiple developers of Fog has approved
    this setting to be used in **most if not all** installations of FOG.
    ✔ Approved or ✖ Denied

------------------------------------------------------------------------

### Persistent DB Connection {#persistent_db_connection}

-   Use a **Persistent DB Connection**. This uses the already
    established connection to get the data, rather than reopening the
    socket or TCP link
    1.  Open this file **/var/www/fog/lib/fog/Config.class.php**
    2.  Go to line:
            define('DATABASE_HOST',         'localhost');
    3.  Change to:
            define('DATABASE_HOST',         'p:127.0.0.1');
    4.  Restart mysql:
            service mysql restart
    5.  Open this file **/opt/fog/.fogsettings** (so updates/upgrades to
        overwrite the settings above)
    6.  Go to line:
            snmysqlhost="";
    7.  Change to:
            snmysqlhost="p:127.0.0.1";
-   If your DB is on another server, use p:\[ipaddress of DB server\].

------------------------------------------------------------------------

### PHP Session Purging {#php_session_purging}

-   Known bug in Ubuntu\'s config. It\'s running fuser for each PHP
    session file easily racking up thousands of processes.
-   Look for and purge old sessions better
    1.  Open this file **/etc/cron.d/php5**
    2.  Go to line:
            09,39 *    * * *    root  [ -x /usr/lib/php5/maxlifetime ] && [ -d /var/lib/php5 ] && find /var/lib/php5/ -depth -mindepth 1 -maxdepth 1 -type f -cmin +$(/usr/lib/php5/maxlifetime) ! -execdir fuser -s {} 2>/dev/null \; -delete
    3.  Change to:
            09,39 *    * * *    root  [ -x /usr/lib/php5/maxlifetime ] && [ -d /var/lib/php5 ] && find /var/lib/php5/ -depth -mindepth 1 -maxdepth 1 -type f -cmin +$(/usr/lib/php5/maxlifetime) -delete
    4.  Restart apache
            service apache2 restart

------------------------------------------------------------------------

### Updating Script {#updating_script}

-   `<span style="background-color:RED; color:white;">`{=html}For Beta
    and frequent updaters ONLY!`</span>`{=html}
-   ✖ Denied due to this only applying to a small select group.
-   In Fog v1.3.0-r2759+ the init\'s and kernels are downloaded at
    install thus \"slowing\" the install process.
-   When doing constant updates a quicker means to update would be to
    copy the files you need.

\*#Step one make a backup of the original:

\*#Run this script:

-   Ubuntu/Debian installs

` sudo cp /var/www/fog/lib/fog/Config.class.php ~/Config.class.php #backup  current config file.`\
` sudo rm -rf /var/www/fog.prev #removes the original previous folder if it exists.`\
` sudo mv /var/www/fog /var/www/fog.prev #moves the current into fog.prev for backup`\
` cd /loc/of/svn/folder/trunk; svn up #update the trunk to the latest`\
` sudo cp /loc/of/svn/folder/trunk/packages/web /var/www/fog #copy the new svn gui to the system.`\
` sudo chown -R www-data:www-data /var/www/fog; sudo chown -R fog:www-data /var/www/fog/service/ipxe; #change permissions to appropriate values.`\
` sudo cp ~/Config.class.php /var/www/fog/lib/fog/Config.class.php #copy back config`

-   RedHat installs

` cp /var/www/html/fog/lib/fog/Config.class.php ~/Config.class.php #backup  current config file.`\
` rm -rf /var/www/html/fog.prev #removes the original previous folder if it exists.`\
` mv /var/www/html/fog /var/www/html/fog.prev #moves the current into fog.prev for backup`\
` cd /loc/of/svn/folder/trunk; svn up #update the trunk to the latest`\
` cp /loc/of/svn/folder/trunk/packages/web /var/www/html/fog #copy the new svn gui to the system.`\
` chown -R apache:apache /var/www/html/fog; sudo -R fog:apache /var/www/html/fog/service/ipxe; #change permissions to appropriate values.`\
` cp ~/Config.class /var/www/html/fog/lib/fog/Config.class.php #copy back config`

------------------------------------------------------------------------

## [Bonding Multiple NICs](Bonding_Multiple_NICs "wikilink") {#bonding_multiple_nics}

-   Setup a bond where multiple network cards are combined to look like
    a single NIC for increased throughput and redundancy.
-   [Bonding Multiple NICs](Bonding_Multiple_NICs "wikilink")
-   ✖ Denied due to only working with some hardware
-   Constant bug complains in Ubuntu for this setting

------------------------------------------------------------------------

# Results

  Option                     Pros                                             Cons                                            PvC   Dev. Approved
  -------------------------- ------------------------------------------------ ----------------------------------------------- ----- ---------------
  Persistent DB Connection   Speed in Web GUI response time                   Connection is always open                       9     ✔
  PHP Session Purging        Purges Old sessions Better                       None                                            10    ✔
  Updating Script            Updates FOG without Kernels and init downloads   May not have most up-to-date Kernels and init   9     ✖
  Bonding Multiple NICs      Increases Redundancy or Throughput               Only works with some hardware                   5     ✖
