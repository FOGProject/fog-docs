Article under construction, Written for FOG 1.3.0

See also: [Ubuntu 16.04](Ubuntu_16.04 "wikilink")

# Settings

set a hostname, recommeded name is
`<font color="red">`{=html}fogserver`</font>`{=html}, however you can
set this as anything you want.

set a username, recommended name is YOUR first name, or \"admin\". **Do
not use \"fog\"**!

Set a password for this account.

verify password.

Encryption - optional, but strongly **not** recommended.

Set a timezone because FOG Scheduled Tasks are dependent on the system
time being correct.

# Partitioning

External Video Link:

[Ubuntu 16 04 Server - Optimal FOG
Partitioning](https://youtu.be/1i41-5FuSmI)

Video:

`<embedvideo service="youtube">`{=html}<https://youtu.be/1i41-5FuSmI>`</embedvideo>`{=html}

# Other Settings {#other_settings}

no automatic updates (optional).

set \"standard system utilities\" to not be installed (optional, but
this tutorial is aimed to be as minimal as possible).

set \"OpenSSH server\" to be installed (optional but required for remote
management. Can be installed later).

# Installing FOG {#installing_fog}

-   Access the terminal
-   Become root with `<font color="red">`{=html}sudo -i`</font>`{=html}

```{=html}
<!-- -->
```
-   Issue the below commands.

```{=html}
<!-- -->
```
        
    apt-get -y update
    apt-get -y dist-upgrade
    apt-get -y autoclean
    apt-get -y autoremove
    apt-get -y install git
    git clone https://github.com/FOGProject/fogproject.git /root/fogproject
    cd /root/fogproject/bin
    ./installfog.sh
