## As of July, 2016 in 1.3.0 {#as_of_july_2016_in_1.3.0}

Local server time is displayed on the fog dashboard.

## As of 1.3.0-r3119 {#as_of_1.3.0_r3119}

1.  The option to change your time zone from the web gui has been added.
    This only changes FOG components.
    -   ![](Config.png "Config.png") Fog Configuration \--\> Fog
        Settings \--\> General Settings \--\> FOG_TZ_INFO
        -   Select your appropriate timezone.
2.  You will still need to check your time on the server hardware,
    apache, and nodes to confirm they are correct.

## Check Timezones {#check_timezones}

-   If your time is off please check your timezone located in these two
    files:
-   Ubuntu:
    -   /etc/php5/apache2/php.ini & /etc/php5/cli/php.ini

```{=html}
<!-- -->
```
-   Debian:
    -   /usr/share/zoneinfo

```{=html}
<!-- -->
```
-   Redhat
    -    /etc/php.ini 
-   Other:
    -   [TheGeekStuff.com](http://www.thegeekstuff.com/2010/09/change-timezone-in-linux/)

## Restart Fog Services {#restart_fog_services}

-   Then restart apache2 and Fog Services (or reboot entire server):

```{=html}
<!-- -->
```
    sudo service apache2 restart    
    sudo service FOGMulticastManager restart
    sudo service FOGTaskScheduler restart
    sudo service FOGImageReplicator restart
    sudo service FOGSnapinReplicator restart

Restart Apache on CentOS/Fedora/Redhat:

    service httpd restart

## Check BIOS {#check_bios}

-   Check the BIOS and verify that the time is correct.

## Check on Server {#check_on_server}

-   Possibly your server\'s time could have been reset. Check it by
    running

```{=html}
<!-- -->
```
     date 

## Extra Info {#extra_info}

=

-   A question was brought up about the nodes needing to have the same
    time. The only ones that truly matter would be the Master nodes and
    Windows Nodes. Try to get them to the right time and everything
    should work.
