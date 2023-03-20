Page under construction. Below you\'ll find notes that are being
collected to make into an article.

# Apache Error Logs {#apache_error_logs}

You can manually view the apache error logs by either using vim, cat, or
tail. The most popular way is with tail so we will demonstrate that way.
Often times, problems with the web interface will have associated errors
in apache\'s log file. Researching this error normally leads you to the
corrective action necessary - or at least provides you with an error you
can post on the forums with your issue.

RHEL/CentOS/Fedora: `<font color="red">`{=html}tail -n 100
/var/log/httpd/error_log`</font>`{=html}

Debian/Ubuntu: `<font color="red">`{=html}tail -n 100
/var/log/apache2/error.log`</font>`{=html}

# Fatal error: Allowed memory size of xxxxxxxx bytes exhausted {#fatal_error_allowed_memory_size_of_xxxxxxxx_bytes_exhausted}

Reference: [Fog Version 5507 Cannot Access Host
Management](https://forums.fogproject.org/topic/6234/fog-version-5507-cannot-access-host-management)

**Solution:** Raise the web interface\'s memory limit:
`<font color="red">`{=html}FOG Configuration -\> FOG Settings -\>
General Settings -\> FOG_MEMORY_LIMIT`</font>`{=html}

Its done in megs, so 128 = 128M, 256 = 256M etc

After changing this, a reboot is recommended.

# Manually test WOL {#manually_test_wol}

This is the web address to manually test FOG\'s WOL functionality:

    http://x.x.x.x/fog/management/index.php?sub=wakeEmUp&mac=aa:bb:cc:dd:ee:ff

Where x.x.x.x is your FOG server\'s IP address, and aa:bb:cc:dd:ee:ff is
the MAC address of the host you wish to wake up.

For instance, if my FOG server\'s IP is 10.0.0.7 and the target host\'s
MAC is 14:fe:b5:df:fc:7e I would then put the below web address into the
address bar of a web browser and then press enter / click go.

[<http://10.0.0.7/fog/management/index.php?sub=wakeEmUp&mac=14:fe:b5:df:fc:7e>](http://10.0.0.7/fog/management/index.php?sub=wakeEmUp&mac=14:fe:b5:df:fc:7e)

After doing this, the target host will be sent a WOL packet from the FOG
server.

# Manually check a host\'s iPXE script {#manually_check_a_hosts_ipxe_script}

Below is the web address used to check a particular host\'s iPXE script
that the fog server gives it when it\'s network booting. You would
replace x.x.x.x with your fog server\'s IP address, and replace the MAC
address with the host\'s actual mac address.

    x.x.x.x/fog/service/ipxe/boot.php?mac=aa:bb:cc:dd:ee:ff

# High CPU load from web interface {#high_cpu_load_from_web_interface}

There is a tool called apachetop that will list the amount of requests
every file served by Apache receives, along with the total amount of
data sent via that file. This tool will prove invaluable in solving web
load issues.

To install apachetop on Fedora 23:

    dnf install apachetop -y

Then to run it, simply type:

    apachetop

apachetop is available for other distributions too.

Other tools to look into are
`<font color="red">`{=html}iftop`</font>`{=html} ran with this command:
`<font color="red">`{=html}iftop -n`</font>`{=html} and just plain-old
`<font color="red">`{=html}top`</font>`{=html}

See also DB Maintenance commands:
[Troubleshoot_MySQL#Database_Maintenance_Commands](Troubleshoot_MySQL#Database_Maintenance_Commands "wikilink")

# High CPU load from apache {#high_cpu_load_from_apache}

Here are threads about high CPU load:

[fog-svn-5020-and-above-cpu-hammered-thread](https://forums.fogproject.org/topic/6020/fog-svn-5020-and-above-cpu-hammered-thread/20?page=2)

[tons-of-httpd-processes](https://forums.fogproject.org/topic/6469/tons-of-httpd-processes)

[not-sure-if-its-a-bug-or-a-feature-high-fog-server-cpu-on-dashboard](https://forums.fogproject.org/topic/6277/not-sure-if-its-a-bug-or-a-feature-high-fog-server-cpu-on-dashboard/22)

[high-cpu-usage-from-multiple-httpd-processes-version-5800](https://forums.fogproject.org/topic/6901/high-cpu-usage-from-multiple-httpd-processes-version-5800?page=1)

[high-cpu-fog-services-after-update-r5029-v6759](https://forums.fogproject.org/topic/6940/high-cpu-fog-services-after-update-r5029-v6759)

[after-update-of-fog-trunk-php-errors](https://forums.fogproject.org/topic/7234/after-update-of-fog-trunk-php-errors)

[high-cpu-php-errors-after-update-to-trunk-github-7234](https://forums.fogproject.org/topic/7215/high-cpu-php-errors-after-update-to-trunk-github-7234)

[fog-3396-high-cpu-utilization-when-auto-update-is-running-on-the-active-tasks-page](https://forums.fogproject.org/topic/4929/fog-3396-high-cpu-utilization-when-auto-update-is-running-on-the-active-tasks-page)
