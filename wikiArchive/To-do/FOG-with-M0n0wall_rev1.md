Courtesy of Flemming Munk

disable DHCP on FOG service dhcpd stop chkconfig \--level 345 dhcpd off

M0n0wall Configuration

### 0.32 and below {#and_below}

`- ``<dhcpd>`{=html}` `\
`- ``<opt1>`{=html}` `\
`- ``<range>`{=html}` `\
`<from>`{=html}`XXX.XXX.XXX.XXX``</from>`{=html}`  `\
`<to>`{=html}`XXX.XXX.XXX.XXX``</to>`{=html}`  `\
`</range>`{=html}` `\
`<defaultleasetime />`{=html}`  `\
`<maxleasetime>`{=html}`XXXXXX``</maxleasetime>`{=html}`  `\
`<enable />`{=html}`  `\
`<next-server>`{=html}`XXX.XXX.XXX.XXX``</next-server>`{=html}`  `\
`<filename>`{=html}`pxelinux.0``</filename>`{=html}` `

`<next-server>`{=html} is the FOG box and `<filename>`{=html} is the
tftp boot file.

Be aware that these configuration options is not included in the
m0n0wall webgui at this time. You can find some information on how to
edit the \"hidden parts\" of m0n0wall\'s config.xml here :
<http://doc.m0n0.ch/handbook/faq-hiddenopts.html>

### 0.33 and up {#and_up}

`- ``<dhcpd>`{=html}` `\
`- ``<opt1>`{=html}` `\
`- ``<range>`{=html}` `\
`<from>`{=html}`XXX.XXX.XXX.XXX``</from>`{=html}`  `\
`<to>`{=html}`XXX.XXX.XXX.XXX``</to>`{=html}`  `\
`</range>`{=html}` `\
`<defaultleasetime />`{=html}`  `\
`<maxleasetime>`{=html}`XXXXXX``</maxleasetime>`{=html}`  `\
`<enable />`{=html}`  `\
`<next-server>`{=html}`XXX.XXX.XXX.XXX``</next-server>`{=html}`  `\
`<filename>`{=html}`undionly.kpxe``</filename>`{=html}` `

`<next-server>`{=html} is the FOG box and `<filename>`{=html} is the
tftp boot file.

Be aware that these configuration options is not included in the
m0n0wall webgui at this time. You can find some information on how to
edit the \"hidden parts\" of m0n0wall\'s config.xml here :
<http://doc.m0n0.ch/handbook/faq-hiddenopts.html>
[category:dhcp](category:dhcp "wikilink")
[category:linux](category:linux "wikilink")
