## DHCP Settings {#dhcp_settings}

-   It is important to know that versions 0.32 and below use
    **pxelinux.0** for option 67 in DHCP
-   For all versions 0.33 to current() use **undionly.kpxe** is
    generally recommended for option 67.
    -   Other files that can be used are listed in your directory
        \"/tftpboot\"

### Linux Based (ISC-DHCP) {#linux_based_isc_dhcp}

```{=mediawiki}
{{:Related to ISC-DHCP}}
```
### FOG dnsmasq (ProxyDHCP) {#fog_dnsmasq_proxydhcp}

-   You would use ProxyDHCP if you do not have access to your DHCP
    server, or are using a device that isn\'t capable of specifying
    option 066 and 067 (next server and file name). The most popular
    ProxyDHCP method with fog is dnsmasq. This article will walk you
    through that:

```{=html}
<!-- -->
```
-   Not required unless you have an unmodifiable DHCP server/

[Using_FOG_with_an_unmodifiable_DHCP_server/\_Using_FOG_with_no_DHCP_server](Using_FOG_with_an_unmodifiable_DHCP_server/_Using_FOG_with_no_DHCP_server "wikilink")

## Non-Linux DHCP {#non_linux_dhcp}

If you do not use FOG to provide DHCP services, the following sections
will give some indication of settings for DHCP servers on various
platforms.

### Windows Server DHCP {#windows_server_dhcp}

-   Option 66
    -   <figure>
        <img src="Windows_66.png" title="Windows_66.png" />
        <figcaption>Windows_66.png</figcaption>
        </figure>
-   Option 67
    -   <figure>
        <img src="Windows_67.png" title="Windows_67.png" />
        <figcaption>Windows_67.png</figcaption>
        </figure>

### Novell (Linux) Server DHCP {#novell_linux_server_dhcp}

-   DHCP Overview from DNS/DHCP Console (Netware 6.5)
    -   <figure>
        <img src="Novelldhcp.gif" title="Novelldhcp.gif" />
        <figcaption>Novelldhcp.gif</figcaption>
        </figure>
-   Option 66
    -   <figure>
        <img src="Novelloption66.gif" title="Novelloption66.gif" />
        <figcaption>Novelloption66.gif</figcaption>
        </figure>
-   Option 67
    -   <figure>
        <img src="Novelloption67.gif" title="Novelloption67.gif" />
        <figcaption>Novelloption67.gif</figcaption>
        </figure>

Here is a link from Novell\'s website on how to setup their DHCP server:
<http://www.novell.com/coolsolutions/feature/17719.html>

### MAC Server DHCP {#mac_server_dhcp}

Use OS X Server app to install and utilize DHCP.\
\
Use DHCP Option Code Utility to generate the code necessary.\
<https://docs.google.com/uc?id=0BwD4il5Z1G6fTmFFYU91bDNuRmc&export=download>\
\
One MUST generate the codes in order for PXE booting to work!\
bootpd.plist is located in /etc/bootpd.plist\
\
\*Option 66

-   -   ![](MACOption66.png "MACOption66.png")\

-   Option 67
    -   ![](MACOption67.png "MACOption67.png")\

\
\*Sample [bootpd.plist](bootpd.plist "wikilink")\
\*\* This is a sample file DO NOT USE THIS IN YOUR ENVIRONMENT!!!! OS X
Server app will generate most of this code for you, this example file is
to show you the place where the generated code needs to be placed.\
\*\*For Reference, your generated code should be placed between
\"dhcp_domain_search\" and \"dhcp_router\"\
\
\*Completed Bootpd.plist\
\*\*![](MACbootpd.png "MACbootpd.png")\

## Other DHCP Configurations {#other_dhcp_configurations}

[Other DHCP Configurations](Other_DHCP_Configurations "wikilink")
