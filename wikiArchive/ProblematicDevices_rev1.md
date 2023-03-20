# Devices that are known to have problems with FOG Imaging solution. {#devices_that_are_known_to_have_problems_with_fog_imaging_solution.}

## Computers

### Desktops

-   [Dell Dimension 2400 with Broadcom 4401 Onboard NIC/Cisco Catalyst
    2950
    Switch](Dell_Dimension_2400_with_Broadcom_4401_Onboard_NIC/Cisco_Catalyst_2950_Switch "wikilink")
-   [Dell Dimension 2400 with Broadcom Onboard NIC - TFTP filename
    issue](Dell_Dimension_2400_with_Broadcom_Onboard_NIC_-_TFTP_filename_issue "wikilink")
-   [Dell Optiplex 740](Dell_Optiplex_740 "wikilink") (don\'t use Kernel
    2.6.27, try 2.6.27 RC9 or the one by Peter Sykes, also make sure you
    fully format the drive to remove the Dell Utility partition or it
    will cause issues, if you didn\'t try using a Multiple Partition
    image type) - Use Peter Sykes Kernel plus Dell BIOS version 1.1.8
    and image using Multiple Partition.
-   [Dell Optiplex 980](Dell_Optiplex_980 "wikilink") Does not work with
    the .30 kernel. Must extract the .28 kernel from the tar, rename it,
    and set these hosts to use it and they will work when running the
    .30 release of fog.
-   [Dell Vostro 1510](Dell_Vostro_1510 "wikilink")
    `<span style="background-color:RED; padding: 1px">`{=html} **NOT
    WORKING** `</span>`{=html} - Does not work with Latest A15 Dell
    BIOS, or A13. A14 unknown but presumably not working.
    -   actually, with A13, if you set \"irqpoll\" into the Host Kernel
        Arguments field for the host, it works!!!
-   [HP Compaq DC7900](HP_Compaq_DC7900 "wikilink") Update the BIOS to
    lastest version and change the exit type to GRUB
    `<span style="background-color:Yellow; padding: 1px">`{=html}
    **Checking In to this** `</span>`{=html} \~2014-10-29
-   [HP Compaq DX7500](HP_Compaq_DX7500 "wikilink") unable to create
    image (SATA emulation set to AHCI mode or IDE mode) FOG ver
    0.27\\Works fine set to IDE on FOG ver 0.26
-   [Dell Vostro 230](Dell_Vostro_230 "wikilink") Boots up, but cannot
    even perform host registration since can\'t find Hard Drive.
-   [Fujitsu Siemens Esprimo
    P2550](Fujitsu_Siemens_Esprimo_P2550 "wikilink") works, but you
    probably have to edit your default file (tftpd) because the
    graphical modus causes trouble.
-   [Fujitsu Siemens Scenic Pentium 4 (model name
    unknown)](Fujitsu_Siemens_Scenic_Pentium_4_(model_name_unknown) "wikilink")
    `<span style="background-color:RED; padding: 1px">`{=html} **NOT
    WORKING** `</span>`{=html} Tried several kernels FOG 0.27, 0.28,
    2.6.35-KS 2.6.37-core with or without acpi=off hpet=disable irqpoll
    arguments. computer freezes right after downloading init.gz
-   [Fujitsu P2510](Fujitsu_P2510 "wikilink") (Fog 1.x.x) Freezes at
    loading before Fog menu
-   [Fujitsu P2520](Fujitsu_P2520 "wikilink") (Fog 1.x.x) Loads Fog menu
    but cannot run quick registration
-   [Dell Optiplex 980](Dell_Optiplex_980 "wikilink") Does not work with
    (FOG 0.32) Kernel 3.8.8. Use kernel 3.13.1 (1/2014)

### Laptops

-   [ACER aspire one P531h](ACER_aspire_one_P531h "wikilink") FOG will
    not find HD with SATA drive set to IDE mode, and will throw errors
    with native SATA mode. Confirmed, 0.29 will not find hard drive even
    with the latest firmware from acer installed.
-   [Compaq 6910p](Compaq_6910p "wikilink")
    `<span style="background-color:Red; padding: 1px">`{=html} **NOT
    WORKING** `</span>`{=html} FOG boot only with a Kitchen Sink kernel
    but locks up laptop after 2 seconds when trying to deploy image.
    Finally made it work by changing MTU to 500 (1000 did NOT work).
-   [Compaq Presario CQ60](Compaq_Presario_CQ60 "wikilink") Will
    register and pull images fine, and pushing an image seems to work,
    but once it\'s done, Windows will not boot due to missing/corrupt
    files.
-   [Dell Latitude E4310](Dell_Latitude_E4310 "wikilink") intel 825xx
    network card \[Major Corruption Bug in e1000e Driver in Linux Kernel
    2.6.27\]. fail to load kernel. newer kernels dont seem to work.
    Kernel 2.6.32.4 PS works but without gigabit network support.
-   [Dell Inspiron 1721 laptop w/
    Vista32Ult](Dell_Inspiron_1721_laptop_w/_Vista32Ult "wikilink")
    `<span style="background-color:RED; padding: 1px">`{=html} **NOT
    WORKING** `</span>`{=html}
-   [Dell Vostro 5470](Dell_Vostro_5470 "wikilink") (FOG 0.32) Will not
    work properly with kernel 2.6.39 (default for FOG 0.32), returns
    error: \"nvidiafb: unable to setup MTRR\". After some tests, I got
    it to work fine with kernel 2.6.35.7 PS (1/2014)
-   [Fujitsu LifeBook
    T731/T732:](Fujitsu_LifeBook_T731/T732: "wikilink") (FOG 0.32) T731
    requires BIOS update so it doesn\'t hang on pxe boot to hd0,0. T732
    have to disable pxe boot after imaging because it hangs on boot to
    hd0,0 and there is no BIOS update yet (1/2014)
-   [Fujitsu-Siemens Esprimo Mobile
    V5535](Fujitsu-Siemens_Esprimo_Mobile_V5535 "wikilink") Needs kernel
    arguments vga=788 nomodeset. Additionally, refer to article [SiS-191
    based NIC](SiS-191_based_NIC "wikilink") to get it working.
-   [HiGrade VA250D/VA250P](HiGrade_VA250D/VA250P "wikilink") Errors out
    stating \"BIOS Bug #81\" and \"no disks detected\"
-   [HP Mini 110](HP_Mini_110 "wikilink")
    `<span style="background-color:RED; padding: 1px">`{=html} **NOT
    WORKING** `</span>`{=html} FOG boots fine off NIC but looses NIC
    location when attempting to register with server. No options in Mini
    Bios to edit for a possible work around.
-   [Lenove ThinkPad E325](Lenove_ThinkPad_E325 "wikilink")
    `<span style="background-color:RED; padding: 1px">`{=html} **NOT
    WORKING** `</span>`{=html} Tried several different kernels up to and
    including Kernel-3.1-rc8.core, tried FOG versions 0.29 and 0.32,
    with and without kernel args acpi=off hpet=disable irqpoll. Doesn\'t
    like the LAN card or BIOS, and then fills the screen with an image
    similar to static on a TV.
-   [HP EliteBook 8730w](HP_EliteBook_8730w "wikilink") Using
    undionly.kpxe Images fine, but when you\'re at the FOG boot menu and
    choose \"boot from hard drive\" it fails, it thinks it\'s a SAN
    disk.

### Servers

-   [Dell PowerEdge R200](Dell_PowerEdge_R200 "wikilink") Don\'t use the
    latest kernel (2.6.29), roll back to 2.6.28 and the NIC (uses module
    tg3) works beautifully
-   [Dell PowerEdge R515](Dell_PowerEdge_R515 "wikilink")
    `<span style="background-color:RED; padding: 1px">`{=html} **NOT
    WORKING** `</span>`{=html} 3.8.8 Boots, fails to recognize most
    hardware. 3.13.1 Begins to boot, hangs during kernel loading,
    reports no hard disk found, then crashes and reboots.

### Tablets

-   [Acer Iconia Tab w500](Acer_Iconia_Tab_w500 "wikilink") - Requires
    custom kernel which disables agpgart and includes newer Asix
    AX88772B drivers\... Also requires adding a tftpd map file and
    configuration option in order to get PXE to boot properly when using
    a separate DHCP server from FOG.

## Hardware

-   [SiS-191 based NIC](SiS-191_based_NIC "wikilink") Issue only with
    deploying an image, driver MTU size must be set to 1000
-   [SiS-900 based NIC](SiS-900_based_NIC "wikilink") Issue with
    pxelinux menu
-   [tg3](tg3 "wikilink") module NICs (Broadcom?) - Issue with loading
    firmware in kernel 2.6.29 (roll back to 2.6.28)

\_\_NOTOC\_\_
