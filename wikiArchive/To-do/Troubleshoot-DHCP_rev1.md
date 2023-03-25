Article under construction currently. Below you will find notes that are
being collected to eventually organize into a nice article.

# Failed to get an IP via DHCP! {#failed_to_get_an_ip_via_dhcp}

`<font color="red">`{=html}Sending discover`</font>`{=html} actually
means that a network interface was found and try to get an IP for it via
DHCP. So it could be:

-   Layer 1 issue like cable (you already checked that)
-   Spanning tree issue (make sure you have RSTP or configured port
    fast)
-   Auto-negotiation issue (try configuring static speed instead of
    auto-negotiation for that port)
-   Ethernet energy saving (see if your switch has EEE/802.3az feature
    and disable if possible)

Reference:
[<https://forums.fogproject.org/topic/7159/failed-to-get-an-ip-via-dhcp?page=1>](https://forums.fogproject.org/topic/7159/failed-to-get-an-ip-via-dhcp?page=1)
