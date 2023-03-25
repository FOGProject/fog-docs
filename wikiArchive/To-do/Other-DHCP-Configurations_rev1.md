# Other DHCP Congfigs {#other_dhcp_congfigs}

## pfSense

In pfSense enable network booting as follows (192.168.1.1 should be
replaced by the ip address of your fog server):

<figure>
<img src="PfSense_dhcp_network_boot_settings.png"
title="PfSense_dhcp_network_boot_settings.png" />
<figcaption>PfSense_dhcp_network_boot_settings.png</figcaption>
</figure>

### 0.32 and below {#and_below}

If your pfSense device is acting as the DHCP server, you will need to
perform the following steps:

1.  Login to your pfSense web admin interface
2.  Go to **Services** \> **DHCP Server**
3.  Scroll Down to \"Enable Network booting\" Click the button labeled
    **Advanced** to \"Show Network booting\" options
    1.  Check the box to \"Enables network booting\"
    2.  Enter the IP address from the network boot server: **X.X.X.X**
        where X.X.X.X is the IP of your FOG server
    3.  Enter the filename used for network booting: **pxelinux.0**
4.  Click the **Save** button

### 0.33 and up {#and_up}

If your pfSense device is acting as the DHCP server, you will need to
perform the following steps:

1.  Login to your pfSense web admin interface
2.  Go to **Services** \> **DHCP Server**
3.  Scroll Down to \"Enable Network booting\" Click the button labeled
    **Advanced** to \"Show Network booting\" options
    1.  Check the box to \"Enables network booting\"
    2.  Enter the IP address from the network boot server: **X.X.X.X**
        where X.X.X.X is the IP of your FOG server
    3.  Enter the filename used for network booting: **undionly.kpxe**
4.  Click the **Save** button

Note: You need both a filename and a boot server configured for this to
work!

## Cisco

If you would like to use a DHCP-enabled Cisco router you will need to
perform the following steps:

### 0.32 and below {#and_below_1}

1.  Enter priveleged mode (**enable**).
2.  If you don\'t know your DHCP pool name, enter **show
    running-config** and look for *ip dhcp pool* in the output.
3.  Enter global configuration mode (**configure terminal**).
4.  Enter DHCP scope configuration mode (**ip dhcp pool
    *`<pool name>`{=html}***).
5.  Configure the following options:
    1.  **next-server *`<ip address to fog server>`{=html}***
    2.  **bootfile pxelinux.0**
6.  Exit configuration mode by entering **exit** twice.
7.  Save your configuration (**copy running-config startup-config**).

### 0.33 and up {#and_up_1}

1.  Enter priveleged mode (**enable**).
2.  If you don\'t know your DHCP pool name, enter **show
    running-config** and look for *ip dhcp pool* in the output.
3.  Enter global configuration mode (**configure terminal**).
4.  Enter DHCP scope configuration mode (**ip dhcp pool
    *`<pool name>`{=html}***).
5.  Configure the following options:
    1.  **next-server *`<ip address to fog server>`{=html}***
    2.  **bootfile undionly.kpxe**
6.  Exit configuration mode by entering **exit** twice.
7.  Save your configuration (**copy running-config startup-config**).

## DD-WRT & Tomato {#dd_wrt_tomato}

### 0.32 and below {#and_below_2}

If you would like to use a DD-WRT or Tomato router for DHCP you will
need to perform the following steps:

1.  Go to the Services tab
2.  Enable DNSMasq, and Local DNS
3.  Under Additional DNSMasq Options add the following
    **dhcp-boot=pxelinux.0,,X.X.X.X** where X.X.X.X is the IP of your
    FOG server
4.  Save/Apply settings

Please see our knowledge base article [Can I use my existing DD-WRT
enabled routers DHCP Server?](FOG_with_DD-WRT_firmware "wikilink") for
more information on this.

### 0.33 and up {#and_up_2}

If you would like to use a DD-WRT or Tomato router for DHCP you will
need to perform the following steps:

1.  Go to the Services tab
2.  Enable DNSMasq, and Local DNS
3.  Under Additional DNSMasq Options add the following
    **dhcp-boot=undionly.kpxe,,X.X.X.X** where X.X.X.X is the IP of your
    FOG server
4.  Save/Apply settings

Please see our knowledge base article [Can I use my existing DD-WRT
enabled routers DHCP Server?](FOG_with_DD-WRT_firmware "wikilink") for
more information on this.

#### Extra Information {#extra_information}

The dhcp-boot information from Tomato and DD-WRT is exactly the same
information dnsmasq uses. This is because dnsmasq is the default dhcp
server for these routers.

## OpenWRT

### 0.32 and below {#and_below_3}

If you would like to use an OpenWRT router for DHCP you will need to
perform the following steps:

1.  Edit **etc/config/dhcp**
2.  In chapter **config \'dnsmasq\'** add this line: **option
    \'dhcp_boot\' \'pxelinux.0,fog,X.X.X.X\'** where X.X.X.X is the IP
    of your FOG server
3.  Save the dhcp file
4.  Restart dnsmasq: **/etc/init.d/dnsmasq restart**

This config has been tested on OpenWRT Attitude Adjustment (r28247).

### 0.33 and up {#and_up_3}

If you would like to use an OpenWRT router for DHCP you will need to
perform the following steps:

1.  Edit **etc/config/dhcp**
2.  In chapter **config \'dnsmasq\'** add this line: **option
    \'dhcp_boot\' \'undionly.kpxe,fog,X.X.X.X\'** where X.X.X.X is the
    IP of your FOG server
3.  Save the dhcp file
4.  Restart dnsmasq: **/etc/init.d/dnsmasq restart**

This config has been tested on OpenWRT Attitude Adjustment (r28247).

## Sonicwall

### 0.32 and below {#and_below_4}

If your Sonicwall device is acting as the DHCP server, you will need to
perform the following steps:

1.  Login to your Sonicwall web admin interface
2.  Go to **Network** \> **DHCP Server**
3.  Edit the DHCP Range where your client(s) reside
4.  Click the tab labeled **Advanced**
5.  Under \"Network Boot Settings,\" configure the following options:
    1.  Next Server: **X.X.X.X** where X.X.X.X is the IP of your FOG
        server
    2.  Boot File: **pxelinux.0**
6.  Click **OK** to save

### 0.33 and up {#and_up_4}

If your Sonicwall device is acting as the DHCP server, you will need to
perform the following steps:

1.  Login to your Sonicwall web admin interface
2.  Go to **Network** \> **DHCP Server**
3.  Edit the DHCP Range where your client(s) reside
4.  Click the tab labeled **Advanced**
5.  Under \"Network Boot Settings,\" configure the following options:
    1.  Next Server: **X.X.X.X** where X.X.X.X is the IP of your FOG
        server
    2.  Boot File: **undionly.kpxe**
6.  Click **OK** to save

Note that the \"Windows\" DHCP Options 66 and 67 do not work in
Sonicwall DHCP Server. You must use the fields provided by Sonicwall -
Next Server and Boot
File.[Brachytherapy](http://www.arizona-breast-cancer-specialists.com/brachytherapy/all-about-what-is-brachytherapy.html)

## M0N0wall

```{=mediawiki}
{{:FOG_with_M0n0wall}}
```
## Smoothwall School Guardian {#smoothwall_school_guardian}

```{=mediawiki}
{{:Smoothwall_School_Guardian}}
```
## ipcop

```{=mediawiki}
{{:FOG with ipcop|}}
```
