Plugins add more functionality to FOG.

## Enabling Plugins {#enabling_plugins}

See:
<https://docs.fogproject.org/en/latest/management/plugins/plugin-management.html>

## LDAP Plugin {#ldap_plugin}

-   FOG v1.3.0+
-   Allows you to link with a LDAP server to add an user validation
-   You can add mulitple LDAP servers
-   You can config the DN base and the port of the LDAP Server
-   If FOG can not connect with the LDAP Server, FOG tries to do a local
    validation
-   If the user does not exist, FOG create one with the mobile profile

```{=html}
<!-- -->
```
-   <figure>
    <img src="Add_new_LDAP-Server.jpeg" title="Add_new_LDAP-Server.jpeg" />
    <figcaption>Add_new_LDAP-Server.jpeg</figcaption>
    </figure>

-   <figure>
    <img src="ListAllLDAP_Servers.jpeg" title="ListAllLDAP_Servers.jpeg" />
    <figcaption>ListAllLDAP_Servers.jpeg</figcaption>
    </figure>

-   <figure>
    <img src="LDAP_Plugin_HomePage.jpeg"
    title="LDAP_Plugin_HomePage.jpeg" />
    <figcaption>LDAP_Plugin_HomePage.jpeg</figcaption>
    </figure>

## Location Plugin {#location_plugin}

-   Allows you to direct hosts at separate locations and manage through
    a centralized server
-   Hosts will be imaged from their location setup, rather than trying
    to pull from a random node/server across, potentially, WAN links
-   Same works for \"Tftp\" in that it will direct the host to get it\'s
    kernel and init from it\'s related location
-   Can also be used to direct the host to download it\'s snapins from
    the relevant location
-   See also [Location Plugin](Location_Plugin "wikilink")

## Access Control Plugin {#access_control_plugin}

NOTE: While initially implemented, this plugin has been deprecated and
removed from the core plugins list due to many complexities in
implementation.

-   `<span style="background-color:RED; padding: 1px">`{=html} **NOT
    Currently ready** `</span>`{=html}
-   To give a layer of security and control over the task and imaging
    processes as well as limit the GUI items from \"designated\"
    controls
-   For Example: IT vs. Regular User

## Capone Plugin {#capone_plugin}

-   Capone is a plugin for FOG that allows you to image a computer based
    on DMI/Hardware information without having to register it with the
    FOG server. This module was originally written for a HP computer
    warranty service center in the UK. They wanted to be able to restore
    a computer\'s image just by plugging it into the network and PXE
    booting the machine, without any user intervention. This module is
    great for repair shops and places where you don\'t need FOG to
    manage the computer after it is imaged. This is our attempt at
    pushing FOG into the service/repair sector.
-   In FOG terms a \"Quick Image\" without any registration
-   `<span style="background-color:YELLOW; padding: 1px">`{=html}
    **Obsolete** `</span>`{=html} As of FOG v1.3.0-r2651 the fog user
    can now add Quick Image to the Fog iPXE Menu(For All Hosts) and then
    select the exact image desired without having to do any
    registration. BUT intervention is still required to start imaging.
-   [Plugins: Capone](Plugins:_Capone "wikilink")

## WOL Broadcast Plugin {#wol_broadcast_plugin}

-   Allowing the Fog user to specify different broadcast address on your
    network
-   WOL will use those set values to send the WOL Packets to the
    broadcast addresses, rather than staying only on layer 2

## Example Plugin {#example_plugin}

-   If you would like to create your own plugins here is a template to
    follow.
