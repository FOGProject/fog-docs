Multicasting in FOG uses UDPcast to send a single image to multiple
computers using only slightly more bandwidth than sending the image to a
single computer or unicast. Multicasting in FOG may require special
switch configuration. A multicast will not begin until all members are
ready to begin by default.

See also: [Troubleshoot Downloading -
Multicast](Troubleshoot_Downloading_-_Multicast "wikilink")

## Queuing

-   FOG uses a simple queuing system to prevent its storage servers from
    being overworked. If you have a single FOG storage node in FOG with
    a queue size of 10, then this means that if you unicast an image to
    30 computers, only the first 10 computers will be imaged. The other
    20 computers will be waiting \"in queue\" for an open slot. What
    will be seen on the client side is the following:

```{=html}
<!-- -->
```
-   <figure>
    <img src="Queue.jpg" title="Queue.jpg" />
    <figcaption>Queue.jpg</figcaption>
    </figure>

```{=html}
<!-- -->
```
-   This queue system allows for the IT staff to start tasks for
    hundreds or thousands of computers and let FOG manage the clients so
    the servers don\'t get overwhelmed with client requests.

## Test Multicasting {#test_multicasting}

-   Environment:
    -   FOG server
    -   Two or more `<u>`{=html}identical`</u>`{=html} computers
    -   Ethernet hub or FastEthernet switch in same VLAN.

```{=html}
<!-- -->
```
-   View Multicast status on server use tty2 or
    /opt/fog/log/multicast.log

```{=html}
<!-- -->
```
-   Overall image time will be slower than unicast on same hardware and
    same image because unicast is gunzip(unzip) at client level,
    multicast in gunzip at server level.

```{=html}
<!-- -->
```
-   If errors persist in test environment post log in forum.

## Device Configurations {#device_configurations}

-   [Cisco Multicast - Layer 3](Cisco_Multi_Cast "wikilink")
-   [HP Multicast - Layer 2&3](HPMulticast "wikilink")
-   `<span style="background-color:Yellow; color:Black;">`{=html}Check
    your network settings, as of Fog v1.0.0, Fog is now using
    [iPXE](iPXE "wikilink") which is a different animal.`</span>`{=html}
    (includes 1.x.x)

## Fog Settings {#fog_settings}

-   Fog has a few features built directly for multicasting. (r2903)
-   ![](config.png "config.png") **Fog Configuration** \--\> **Fog
    Settings** \--\> **Multicast Settings**
    -   FOG_UDPCAST_INTERFACE \-- Network connection for multicast
        broadcasting \[**Default: eth0**\]
    -   FOG_UDPCAST_STARTINGPORT \-- PORT for multicast broadcasting
        \[**Default: 63100**\]
    -   FOG_MULTICAST_MAX_SESSIONS \-- Max number of sessions
        \[**Default: 64**\]
    -   FOG_UDPCAST_MAXWAIT \-- Max wait time(minutes) to wait for
        clients until starting (If client does not start it will be
        \"left behind\") \[**Default: 10**\]
    -   FOG_MULTICAST_ADDRESS \-- Sets an alternate IP address if
        required (Proper format: XXX.XXX.XXX.XXX) \[**Default: 0**\]
    -   FOG_MULTICAST_PORT_OVERRIDE \-- Sets a Port override if required
        \[**Default: 0**\]
    -   FOG_MULTICAST_DUPLEX \-- Sets the desired duplex mode for your
        network \[**Default: Full Duplex**\]

## Troubleshooting

### General Troubleshooting {#general_troubleshooting}

### Upgrade FOG {#upgrade_fog}

-   As a general rule, Fog is constantly in development and constantly
    growing. The least you can do to help fix your Multi-Cast issues is
    to upgrade FOG to the latest release.
-   At times the developers will ask a user to upgrade to the
    **\"trunk\"** release and run a test. If you are one of these people
    you must keep in line with the upgrades and keep upgrading until the
    next release is issued.
    -   **\"trunk\"** updates come at least once a day and quite
        possible a dozen a day.
    -   To upgrade to trunk please see
        [Upgrade_to_trunk](Upgrade_to_trunk "wikilink")

### Stop Multicasting {#stop_multicasting}

-   Stop all multitasks currently running

1.  On your server open up terminal and kill any running udpcasts by
    typing
    -   sudo killall udp-sender

### Test Small Groups {#test_small_groups}

-   Break it down to 1 or 2 clients to help limit the possible issues
    that you are experiencing
-   It is usually found that issues stem from network switch settings
    and rogue DHCP servers. (i.e. **Environmental Issues**)

#### Testing 1 Client {#testing_1_client}

1.  Now start a multicasting session using theses arguments. This will
    dump the logs into this file and allow a 1 minute start time for the
    session
    -   sudo udp-sender --file /opt/fog/.fogsettings --log /opt/fog/log/multicast.log  --ttl 1 --nopointopoint
2.  Looking at the output you should see:
    -   Udp-sender xxxxxxxx
    -   Using \[full duplex mode\]
3.  Your server is now waiting for your clients to boot
    -   If you receive a **\"Extra argument
        \"/opt/fog/log/multicast.log\" ignored\"** you missed a dash or
        something is miss spelled.
    -   Do a ctrl+c to stop and double check your command for syntax
        errors
    -   See [https://www.udpcast.linux.lu/cmd.html
        UDPCast](https://www.udpcast.linux.lu/cmd.html_UDPCast "wikilink")
        for other arguments available
4.  Now boot up 1 client go to your *FOG Menu* and select debug mode.
    -   If debug is **not** located on your *FOG Menu* then you will
        need to add it. See [FOG Menu](FOG_Menu "wikilink") (v1.3.0)
    -   You can also accomplish this by creating a Debug task in the Fog
        Web GUI and then network boot the client
    -   Do this on the same subnet if possible.
5.  Type in to the client running multicast debug:
    -   udp-receiver
6.  On your server you should see that 1 client connected
    -   Then you can press any key on the client (Start client first)
7.  On your client you should see the contents of your .fogsettings file
    scrolling by the screen.
    -   You may also see the output log in your FOG GUI under **Log
        Viewer**
8.  Results:
    -   **Success:** Continue to section [ Testing 2
        Clients](Multicasting#Testing_2_Clients "wikilink")
    -   **Failed** If it doesn\'t work then you need to check your
        switch/router/firewall settings. See [IPXE](IPXE "wikilink") and
        the settings suggested there.

#### Testing 2 Clients {#testing_2_clients}

-   Hopefully you succeeded in testing [ 1
    client](Multicasting#Testing_1_Client "wikilink") above. Now we need
    to test **2 clients**.

1.  Start another multicast session again but this time run
    -   sudo udp-sender --file /opt/fog/.fogsettings --log /opt/fog/log/multicast.log  --ttl 32 --nopointopoint
2.  Boot both clients in debug mode and run
    -   udp-receiver
3.  On your server you should see now that both clients are connected
    -   Then you can press any key on the client(s) (Start client(s)
        first)
    -   Then press any key on the server to start the transfer (Start
        server last)
4.  Results:
    -   **Success:** If the clients display the contents of your
        .fogsettings file then your network and multicast settings are
        correct. The problem may lie within FOG configuration/settings
    -   **Failed** If it doesn\'t work then you need to check your
        switch/router/firewall settings. See [IPXE](IPXE "wikilink") and
        the settings suggested there.

#### Something else to try {#something_else_to_try}

OK so you should have tried testing [ 1
client](Troubleshooting_a_multicast#Testing_1_Client "wikilink") and [ 2
clients](Troubleshooting_a_multicast#Testing_2_Clients "wikilink") above
`<u>`{=html}**BUT**`</u>`{=html} multicasting still doesn\'t work. Lets
try one more thing. On your server run this:

    gunzip -S ".img" -c "/images/anyimagename/file" | udp-sender --min-receivers 2 --portbase 9000 \
    --interface $interface --half-duplex --ttl 32

Now boot up 2 clients in debug mode and type into the clients

**If your image is partimage**

    udp-receiver --portbase 9000 --mcast-rdv-address $fogserverip | partimage -f3 -b restore /dev/sda stdin

**If your image is partclone**

    udp-receiver --nokbd --portbase 9000 --ttl 32 --mcast-rdv-address $fogserverip | \
    partclone.restore --ignore_crc -O /dev/sda<filenumber> -N -f 1

Hint: You might need to change /dev/sda to your correct harddrive if
it\'s different use fdisk -l to find out.

Results:\
**Success:** If the clients start imaging then your network and
multicast settings an are correct. The problem may lie within FOG
configuration/settings.\
**Failed** If it doesn\'t work then you need to check your
switch/router/firewall settings. See [IPXE](IPXE "wikilink") and the
settings suggested there.

### Power cycle and Ethernet {#power_cycle_and_ethernet}

-   Setup task as normal.
-   Shutdown the hosts.
-   Unplug **both** power and ethernet cables for 10 seconds.
-   Plug them back in.
-   Boot.
-   Multicast starts running.

```{=html}
<!-- -->
```
-   At times on particular hardware, multicast will not work due to
    network card not initializing properly. It\'s previous state will
    not completely clear on shutdown, but removing power forces it to
    clear.
-   Proof [Forum
    Post](http://fogproject.org/forum/threads/i-am-getting-dchp-bootp-reply-not-for-us-or-pxe-e51-no-dhcp-or-proxydhcp-offers-were-recieved.10635/#post-42294)

### Please Wait {#please_wait}

-   Hang at the \"Please Wait\" screen:
-   Verify the host name (without DNS suffix) is listed in the
    /etc/hosts file to the actual IP address (not 127.0.0.1) - example:
    \"192.168.0.77 myfogserver\"
-   Check the MySQL details in \"/opt/fog/service/etc/config.php\" are
    correct.
-   If not, correct them (they should be the same as in
    /var/www/fog/commons/config.php) and restart the service

```{=html}
<!-- -->
```
    sudo /etc/init.d/FOGMulticastManager restart

### Kill Multitasking {#kill_multitasking}

-   If you wish to force kill all the multicasting sessions please do
    **BOTH** the following

```{=html}
<!-- -->
```
-   Remove any sessions running in the sql database

```{=html}
<!-- -->
```
    mysql -u root <-p password> fog
    truncate table multicastSessions;
    truncate table multicastSessionsAssoc;
    exit;

-   Stop any udp senders that may be running on the server

```{=html}
<!-- -->
```
    sudo service FOGMulticastManager stop
    sudo killall udp-sender
    sudo killall udp-sender
    sudo killall udp-sender
    sudo service FOGMulticastManager start

## STP/Portfast/RSTP/MSTP

-   Sometimes unicast will work and multicast fails. You may need to
    check your managed switch settings.

```{=mediawiki}
{{:STP/Portfast/RSTP/FMSTP}}
```
### External Site Info {#external_site_info}

[ Gravity
Computing](http://www.gravitycomputing.co.nz/fog-multicast-server-032/ "wikilink")
(0.32 only)

[ digriz](http://www.digriz.org.uk/debian/freeghost "wikilink") (0.32
only)
