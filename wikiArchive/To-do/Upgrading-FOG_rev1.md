# Upgrade from 0.1 through 0.32 {#upgrade_from_0.1_through_0.32}

-   You can upgrade FOG by simply running the new install script. It
    will keep all the information in the database intact like your users
    and passwords, host, images, tasks, etc. It WILL overwrite DHCP
    settings, TFTP setttings, NFS Settings, etc. So any customizations
    done to these files will have to be duplicated.

# Upgrade from 0.32 to 1.x.x {#upgrade_from_0.32_to_1.x.x}

-   See [Upgrade_to_1.x.x](Upgrade_to_1.x.x "wikilink")

# Upgrade from 1.x.x to another 1.x.x {#upgrade_from_1.x.x_to_another_1.x.x}

-   You can upgrade FOG by simply running the new install script. It
    will keep all the information in the database intact like your users
    and passwords, host, images, tasks, etc. It WILL overwrite DHCP
    settings, TFTP setttings, NFS Settings, etc. So any customizations
    done to these files will have to be duplicated.

# Upgrade from ANY version of FOG to 1.3.0 {#upgrade_from_any_version_of_fog_to_1.3.0}

FOG 1.3.0 is not yet released as of February 2016.

FOG 1.3.0 can successfully upgrade from **any** prior version of FOG.
Efforts have been made to preserve some web related customizations, but
other services are re-configured. It\'s strongly suggested to try the
settings that FOG sets, and then integrate any necessary customizations
into what FOG sets up.
