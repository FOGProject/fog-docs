## Bootpd File {#bootpd_file}

### WARNING

This is a sample file DO NOT USE THIS IN YOUR ENVIRONMENT!!!! OS X
Server app will generate most of this code for you, this example file is
to show you the place where the generated code needs to be placed.

For Reference, your generated code should be placed between
\"dhcp_domain_search\" and \"dhcp_router\"

### bootpd.plist Example {#bootpd.plist_example}

```{=html}
<?xml version="1.0" encoding="UTF-8"?>
```
\
\<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\"
\"<http://www.apple.com/DTDs/PropertyList-1.0.dtd>\"\>\
`<plist version="1.0">`{=html}\
`<dict>`{=html}\
`<key>`{=html}NetBoot`</key>`{=html}\
`<dict>`{=html}\
`<key>`{=html}startTime`</key>`{=html}\
`<string>`{=html}2014-12-12 15:30:07 +0000`</string>`{=html}\
`</dict>`{=html}\
`<key>`{=html}Subnets`</key>`{=html}\
`<array>`{=html}\
`<dict>`{=html}\
`<key>`{=html}allocate`</key>`{=html}\
`<true/>`{=html}\
`<key>`{=html}dhcp_domain_name`</key>`{=html}\
`<string>`{=html}`</string>`{=html}\
`<key>`{=html}dhcp_domain_name_server`</key>`{=html}\
`<array>`{=html}\
`<string>`{=html}172.16.98.100`</string>`{=html}\
`<string>`{=html}172.16.98.200`</string>`{=html}\
`</array>`{=html}\
**`<key>`{=html}dhcp_domain_search`</key>`{=html}\
`<array/>`{=html}\
`<key>`{=html}dhcp_option_66`</key>`{=html}\
`<data>`{=html}\
PUT GENERATED CODE HERE!!!\
`</data>`{=html}\
`<key>`{=html}dhcp_option_67`</key>`{=html}\
`<data>`{=html}\
PUT GENERATED CODE HERE!!!\
`</data>`{=html}**\
`<key>`{=html}dhcp_router`</key>`{=html}\
`<string>`{=html}10.8.1.1`</string>`{=html}\
`<key>`{=html}lease_max`</key>`{=html}\
`<integer>`{=html}3600`</integer>`{=html}\
`<key>`{=html}name`</key>`{=html}\
`<string>`{=html}Test`</string>`{=html}\
`<key>`{=html}net_address`</key>`{=html}\
`<string>`{=html}10.8.0.0`</string>`{=html}\
`<key>`{=html}net_mask`</key>`{=html}\
`<string>`{=html}255.255.0.0`</string>`{=html}\
`<key>`{=html}net_range`</key>`{=html}\
`<array>`{=html}\
`<string>`{=html}10.8.1.1`</string>`{=html}\
`<string>`{=html}10.8.255.254`</string>`{=html}\
`</array>`{=html}\
`<key>`{=html}selected_port_name`</key>`{=html}\
`<string>`{=html}en0`</string>`{=html}\
`<key>`{=html}uuid`</key>`{=html}\
`<string>`{=html}4285D339-ABD1-4430-B68D-F5401BFDA253`</string>`{=html}\
`</dict>`{=html}\
`</array>`{=html}\
`<key>`{=html}netboot_enabled`</key>`{=html}\
`<array>`{=html}\
`<string>`{=html}en0`</string>`{=html}\
`</array>`{=html}\
`</dict>`{=html}\
`</plist>`{=html}\
