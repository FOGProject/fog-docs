# Background

As a few people have had issues with iPXE booting correctly a, seemingly
decent work around seems to work for most people.

# Configure system {#configure_system}

Obtain root access through terminal to your FOG Server. There are
multiple means to do so.

The most common methods are:

1.  Open a terminal or console window.
2.  Login as your self and sudo up to root, su to root, or login
    straight as root.

If you logged in as your regular user try the command:

    sudo su -

Enter your local user password.

If you don\'t have sudo permissions but know the root password, try:

    su -

Enter the root users password.

Of course logging in straight as root you don\'t have to do any more
work.

# Make things work {#make_things_work}

-   If you are trying undionly.kpxe and this is already configured as
    your boot file (option 67):

```{=html}
<!-- -->
```
    cd /tftpboot
    mv undionly.kpxe undionly.kpxeREAL
    ln -s pxelinux.0.old undionly.kpxe

-   If you want to keep troubleshooting for \"other\" users a little
    easier, change the boot file pointer back to pxelinux.0 (option 67)

```{=html}
<!-- -->
```
    cd /tftpboot
    mv undionly.kpxe undionly.kpxeSOMERANDOMNAME
    ln -s pxelinux.0.old pxelinux.0

-   Create the pxelinux.cfg folder as it was removed.

```{=html}
<!-- -->
```
    mkdir /tftpboot/pxelinux.cfg

-   Create the /tftpboot/pxelinux.cfg/default using whatever editor you
    desire.

```{=html}
<!-- -->
```
    vi /tftpboot/pxelinux.cfg/default

-   Code is below, change x.x.x.x to the FOG IP Address.

```{=html}
<!-- -->
```
    DEFAULT vesamenu.c32
    MENU TITLE Fog Reimage Menu
    MENU COLOR TITLE        1;36;44    #ffffffff #00000000 std
    LABEL iPXE Boot
    MENU DEFAULT
    KERNEL ipxe.krn
    APPEND dhcp && chain http://x.x.x.x/fog/service/ipxe/boot.php?mac=${net0/mac}
    PROMPT 0
    TIMEOUT 1

# Complete

Try testing this and see if all works.
