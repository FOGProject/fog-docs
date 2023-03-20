On School Guardian, you\'d implement as follows:

### 0.32 and below {#and_below}

1.  in Services \> DHCP \> DHCP Server, select your subnet and click the
    advanced button
2.  under \"TFTP server\" enter the IP of your FOG server (\"TFTP
    Server\" field = DHCP \"nextserver\" field)
3.  under \"Network boot filename\" enter the filename on the TFTP
    server, which AFAICT is pxelinux.0
4.  Click save at the bottom of the page. You\'ll need to restart the
    DHCP services via Services \> DHCP \> Global

### 0.33 and up {#and_up}

1.  in Services \> DHCP \> DHCP Server, select your subnet and click the
    advanced button
2.  under \"TFTP server\" enter the IP of your FOG server (\"TFTP
    Server\" field = DHCP \"nextserver\" field)
3.  under \"Network boot filename\" enter the filename on the TFTP
    server, which AFAICT is undionly.kpxe
4.  Click save at the bottom of the page. You\'ll need to restart the
    DHCP services via Services \> DHCP \> Global

Thanks: Jerry (techobi)

[category:dhcp](category:dhcp "wikilink")
[category:linux](category:linux "wikilink")
