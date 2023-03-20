If you would like to use a DD-WRT router for DHCP you will need to
perform the following steps:

`1. Log into your Router interface   `\
`2. Go to the Services tab`\
`3. Enable DNSMasq, and Local DNS`\
`4. Under Additional DNSMasq Options add the following dhcp-boot=pxelinux.0,,X.X.X.X where X.X.X.X is the IP of your FOG server`\
`5. Save/Apply settings`

<figure>
<img src="Dd-wrt_dhcp_configuration.png"
title="Dd-wrt_dhcp_configuration.png" />
<figcaption>Dd-wrt_dhcp_configuration.png</figcaption>
</figure>

If you would like to use a Tomato router for DHCP you will need to
perform the following steps:

`1. Log into your Router interface   `\
`2. Select Advanced on the side bar.`\
`3. select the DHCP/DNS sub menu.`\
`4. in the "DNSMasq" "Custom Configuration" text-box, add the following dhcp-boot=pxelinux.0,,X.X.X.X where X.X.X.X is the IP of your FOG server`\
`5. "Save" settings`

<figure>
<img src="Screenshot-1.png" title="Screenshot-1.png" />
<figcaption>Screenshot-1.png</figcaption>
</figure>

[category:dhcp](category:dhcp "wikilink")
[category:linux](category:linux "wikilink")
