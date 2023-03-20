# Build Requirements {#build_requirements}

You will need root access: (example:)

    sudo su -

Enter the Password of the current user. **OR**

    su -

Enter the Password for the root user.

## Packages Needed {#packages_needed}

### Redhat Based Linux {#redhat_based_linux}

    yum -y groupinstall "Development Tools"
    yum -y install git wget

### Debian Based Linux {#debian_based_linux}

    apt-get install build-essential git wget

# Get the Source {#get_the_source}

1.  Open a terminal or console on your linux box.
2.  Obtain root privileges (e.g. sudo su -,su - root)
3.  Download the source to the home directory (e.g. /root or \~/)
    -   git clone http://git.ipxe.org/ipxe.git
4.  Change to the src directory
    -   cd /root/ipxe/src

# Create iPXE Script based on your needs. {#create_ipxe_script_based_on_your_needs.}

**NOTE: All paths assumed as /root/ipxe/src when editing files or
creating the ipxescript. This is because you can only build the files
from within the src folder of the ipxe source.**

## Default ipxe script (/tftpboot/default.ipxe) {#default_ipxe_script_tftpbootdefault.ipxe}

-   wget https://svn.code.sf.net/p/freeghost/code/trunk/src/ipxe/src/ipxescript

## Custom ipxe script {#custom_ipxe_script}

-   vi ipxescript

Make the file so it contains your \"custom\" code.

Example code base: (Embedding the default.ipxe script into undionly.)

**NOTE: CHANGE x.x.x.x to the IP of your FOG Server**

    #!ipxe
    dhcp || reboot
    cpuid --ext 29 && set arch x86_64 || set arch i386
    params
    param mac ${net0/mac}
    param arch ${arch}
    chain http://x.x.x.x/fog/service/ipxe/boot.php##params

## Edit the files to make things work {#edit_the_files_to_make_things_work}

### config/general.h

Edit the config/general.h file to contain:

    #ifndef CONFIG_GENERAL_H
    #define CONFIG_GENERAL_H

    /** @file
     *
     * General configuration
     *
     */

    FILE_LICENCE ( GPL2_OR_LATER );

    #include <config/defaults.h>

    /*
     * Branding
     *
     * Vendors may use these strings to add their own branding to iPXE.
     * PRODUCT_NAME is displayed prior to any iPXE branding in startup
     * messages, and PRODUCT_SHORT_NAME is used where a brief product
     * label is required (e.g. in BIOS boot selection menus).
     *
     * To minimise end-user confusion, it's probably a good idea to either
     * make PRODUCT_SHORT_NAME a substring of PRODUCT_NAME or leave it as
     * "iPXE".
     *
     */
    #define PRODUCT_NAME ""
    #define PRODUCT_SHORT_NAME "iPXE"

    /*
     * Banner timeout configuration
     *
     * This controls the timeout for the "Press Ctrl-B for the iPXE
     * command line" banner displayed when iPXE starts up.  The value is
     * specified in tenths of a second for which the banner should appear.
     * A value of 0 disables the banner.
     *
     * ROM_BANNER_TIMEOUT controls the "Press Ctrl-B to configure iPXE"
     * banner displayed only by ROM builds of iPXE during POST.  This
     * defaults to being twice the length of BANNER_TIMEOUT, to allow for
     * BIOSes that switch video modes immediately before calling the
     * initialisation vector, thus rendering the banner almost invisible
     * to the user.
     */
    #define BANNER_TIMEOUT      20
    #define ROM_BANNER_TIMEOUT  ( 2 * BANNER_TIMEOUT )

    /*
     * Network protocols
     *
     */

    #define NET_PROTO_IPV4      /* IPv4 protocol */
    #undef  NET_PROTO_IPV6      /* IPv6 protocol */
    #undef  NET_PROTO_FCOE      /* Fibre Channel over Ethernet protocol */

    /*
     * PXE support
     *
     */
    //#undef    PXE_STACK       /* PXE stack in iPXE - you want this! */
    //#undef    PXE_MENU        /* PXE menu booting */

    /*
     * Download protocols
     *
     */

    #define DOWNLOAD_PROTO_TFTP /* Trivial File Transfer Protocol */
    #define DOWNLOAD_PROTO_HTTP /* Hypertext Transfer Protocol */
    #define DOWNLOAD_PROTO_HTTPS    /* Secure Hypertext Transfer Protocol */
    #define DOWNLOAD_PROTO_FTP  /* File Transfer Protocol */
    #undef  DOWNLOAD_PROTO_SLAM /* Scalable Local Area Multicast */
    #define DOWNLOAD_PROTO_NFS  /* Network File System Protocol */

    /*
     * SAN boot protocols
     *
     */

    //#undef    SANBOOT_PROTO_ISCSI /* iSCSI protocol */
    //#undef    SANBOOT_PROTO_AOE   /* AoE protocol */
    //#undef    SANBOOT_PROTO_IB_SRP    /* Infiniband SCSI RDMA protocol */
    //#undef    SANBOOT_PROTO_FCP   /* Fibre Channel protocol */

    /*
     * 802.11 cryptosystems and handshaking protocols
     *
     */
    //#define   CRYPTO_80211_WEP    /* WEP encryption (deprecated and insecure!) */
    //#define   CRYPTO_80211_WPA    /* WPA Personal, authenticating with passphrase */
    //#define   CRYPTO_80211_WPA2   /* Add support for stronger WPA cryptography */

    /*
     * Name resolution modules
     *
     */

    #define DNS_RESOLVER        /* DNS resolver */

    /*
     * Image types
     *
     * Etherboot supports various image formats.  Select whichever ones
     * you want to use.
     *
     */
    //#define   IMAGE_NBI       /* NBI image support */
    //#define   IMAGE_ELF       /* ELF image support */
    //#define   IMAGE_MULTIBOOT     /* MultiBoot image support */
    #define IMAGE_PXE       /* PXE image support */
    //#define   IMAGE_SCRIPT        /* iPXE script image support */
    #define IMAGE_BZIMAGE       /* Linux bzImage image support */
    //#define   IMAGE_COMBOOT       /* SYSLINUX COMBOOT image support */
    //#define   IMAGE_EFI       /* EFI image support */
    //#define   IMAGE_SDI       /* SDI image support */
    //#define   IMAGE_PNM       /* PNM image support */
    #define IMAGE_PNG       /* PNG image support */

    /*
     * Command-line commands to include
     *
     */
    #define AUTOBOOT_CMD        /* Automatic booting */
    #define NVO_CMD         /* Non-volatile option storage commands */
    #define CONFIG_CMD      /* Option configuration console */
    #define   IFMGMT_CMD      /* Interface management commands */
    //#define   IWMGMT_CMD      /* Wireless interface management commands */
    //#define FCMGMT_CMD      /* Fibre Channel management commands */
    #define ROUTE_CMD       /* Routing table management commands */
    #define IMAGE_CMD       /* Image management commands */
    #define DHCP_CMD        /* DHCP management commands */
    #define SANBOOT_CMD     /* SAN boot commands */
    #define MENU_CMD        /* Menu commands */
    #define LOGIN_CMD       /* Login command */
    #define SYNC_CMD        /* Sync command */
    #define NSLOOKUP_CMD        /* DNS resolving command */
    #define TIME_CMD        /* Time commands */
    #define DIGEST_CMD      /* Image crypto digest commands */
    #define LOTEST_CMD      /* Loopback testing commands */
    #define VLAN_CMD        /* VLAN commands */
    #define PXE_CMD     /* PXE commands */
    #define REBOOT_CMD      /* Reboot command */
    #define POWEROFF_CMD        /* Power off command */
    #define IMAGE_TRUST_CMD /* Image trust management commands */
    #define PCI_CMD     /* PCI commands */
    #define PARAM_CMD       /* Form parameter commands */
    #define NEIGHBOUR_CMD       /* Neighbour management commands */
    #define PING_CMD        /* Ping command */
    #define CONSOLE_CMD     /* Console command */
    #define IPSTAT_CMD      /* IP statistics commands */
    //#define PROFSTAT_CMD      /* Profiling commands */

    /*
     * ROM-specific options
     *
     */
    #undef  NONPNP_HOOK_INT19   /* Hook INT19 on non-PnP BIOSes */

    /*
     * Error message tables to include
     *
     */
    #undef  ERRMSG_80211        /* All 802.11 error descriptions (~3.3kb) */

    /*
     * Obscure configuration options
     *
     * You probably don't need to touch these.
     *
     */

    #define NETDEV_DISCARD_RATE 0   /* Drop every N packets (0=>no drop) */
    #undef  BUILD_SERIAL        /* Include an automatic build serial
                     * number.  Add "bs" to the list of
                     * make targets.  For example:
                     * "make bin/rtl8139.dsk bs" */
    #undef  BUILD_ID        /* Include a custom build ID string,
                     * e.g "test-foo" */
    #undef  NULL_TRAP       /* Attempt to catch NULL function calls */
    #undef  GDBSERIAL       /* Remote GDB debugging over serial */
    #undef  GDBUDP          /* Remote GDB debugging over UDP
                     * (both may be set) */

    #include <config/local/general.h>

    #endif /* CONFIG_GENERAL_H */

### config/console.h

Edit the config/general.h file to contain:

    #ifndef CONFIG_CONSOLE_H
    #define CONFIG_CONSOLE_H

    /** @file
     *
     * Console configuration
     *
     * These options specify the console types that Etherboot will use for
     * interaction with the user.
     *
     */

    FILE_LICENCE ( GPL2_OR_LATER );

    #include <config/defaults.h>

    //#define   CONSOLE_PCBIOS      /* Default BIOS console */
    //#define   CONSOLE_SERIAL      /* Serial port */
    //#define   CONSOLE_DIRECT_VGA  /* Direct access to VGA card */
    //#define   CONSOLE_PC_KBD      /* Direct access to PC keyboard */
    //#define   CONSOLE_SYSLOG      /* Syslog console */
    //#define   CONSOLE_SYSLOGS     /* Encrypted syslog console */
    //#define   CONSOLE_VMWARE      /* VMware logfile console */
    //#define   CONSOLE_DEBUGCON    /* Debug port console */
    #define CONSOLE_VESAFB      /* VESA framebuffer console */

    #define KEYBOARD_MAP    us

    #define LOG_LEVEL   LOG_NONE

    #include <config/local/console.h>

    #endif /* CONFIG_CONSOLE_H */

### config/settings.h

Edit the config/settings.h file to contain:

    #ifndef CONFIG_SETTINGS_H
    #define CONFIG_SETTINGS_H

    /** @file
     *
     * Configuration settings sources
     *
     */

    FILE_LICENCE ( GPL2_OR_LATER );

    #define PCI_SETTINGS    /* PCI device settings */
    //#define   CPUID_SETTINGS  /* CPUID settings */
    //#define   MEMMAP_SETTINGS /* Memory map settings */
    #define VMWARE_SETTINGS /* VMware GuestInfo settings */

    #include <config/local/settings.h>

    #endif /* CONFIG_SETTINGS_H */

## Build the undionly/ipxe files. {#build_the_undionlyipxe_files.}

**I USE THE FOLLOWING COMMAND TO BUILD ALL FILES AT ONCE.** **Remove the
{}\'s and only apply the file you wish to build if you want only a
specific file.**

    make bin/{undionly,ipxe}.{,k,kk}pxe EMBED=ipxescript

## Copy and/or Use your files {#copy_andor_use_your_files}

**I USE THE FOLLOWING COMMAND TO COPY ALL FILES AT ONCE. Remove the
{}\'s and only copy the file you wish to use if you want only a specific
file.**

    cp bin/{undionly,ipxe}.{,k,kk}pxe /tftpboot/ 

## Use other undionly or ipxe files {#use_other_undionly_or_ipxe_files}

There are two ways you can accomplish this, the easiest is the first
method: **CHANGE `<filename>`{=html} with the filename you wish to try**

-   Copy the file you wish to use as undionly.kpxe

```{=html}
<!-- -->
```
    cd /tftpboot
    mv undionly.kpxe undionly.kpxeTEST1; cp <filename> undionly.kpxe

**You can also just make a symbolic link to the file you wish to use,
though the first time you do this you will have to, at the very least,
rename the \"real\" undionly.kpxe file to something else.** To do the
same but as a symbolic link use:

    cd /tftpboot
    mv undionly.kpxe undionly.kpxeREAL
    ln -s <filename> undionly.kpxe

Don\'t forget to remove the link if you want to use other files.

# Debugging

In some cases it\'s necessary to enable debugging output to be able to
find errors. So follow the above steps to build iPXE and add the
following parameter:

    make bin/{undionly,ipxe}.{,k,kk}pxe EMBED=ipxescript DEBUG=undi,dhcp

This will enable debugging in the UNDI part of the source code. Other
important parameters are efi_init, efi_snp, realtek, 3c5x9 or any other
iPXE driver you need debugging for!

# Information

If you want to know more information about the files: Click [
Here](Filename_Information "wikilink")

# Complete

Hopefully the above information helps you out.

## Fedora 21 {#fedora_21}

Requires\...

    yum install binutils-devel

## Debian/Ubuntu

Requires\...

    sudo apt-get install binutils-dev
