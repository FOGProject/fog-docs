`<font color="red">`{=html}Note:`</font>`{=html} This article is older
(2011), and has only had it\'s terminology updated to reflect current
FOG terminology.

error occurs when trying to network boot linux in order to capture an
image: \"PCI: cannot allocate resource region 5 of device 0000:00:12.0\"
I thought this might be something to do with the WLAN card but error
persists even when WLAN card is disabled in bios. After a minute or so
the following message repeatedly appears: \"IP-config: reopening network
devices\....\" FOG works fine on other clients on the same network.
\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

I have a bunch of these laptop\'s and the fix seems to be disable
PC-Card/FireWire in the BIOS.
