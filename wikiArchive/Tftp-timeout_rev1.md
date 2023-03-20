If you get this issue its usually due to a firewall issue, do the
following:

# Disable firwall {#disable_firwall}

## Fedora 9 {#fedora_9}

    service iptables stop 
    service ip6tables stop 
     
    chkconfig iptables off 
    chkconfig ip6tables off

## Fedora 16 {#fedora_16}

    Add /bin/bash to /etc/shells as the vsftpd yum install does not do it correctly causing tftp timeout message

## Ubuntu

    sudo ufw disable

## Debian

    iptables -F
    iptables -X
    iptables -t nat -F
    iptables -t nat -X
    iptables -t mangle -F
    iptables -t mangle -X
    iptables -P INPUT ACCEPT
    iptables -P OUTPUT ACCEPT
    iptables -P FORWARD ACCEPT

# Other Troubleshooting {#other_troubleshooting}

### 0.32 and below {#and_below}

-   From your FOG server test out tftp

```{=html}
<!-- -->
```
    tftp -v X.X.X.X -c get pxelinux.0

-   From a Windows PC run at the cmd prompt: ([Windows
    TFTP](Windows_TFTP "wikilink") Service must be Installed first)

```{=html}
<!-- -->
```
     tftp x.x.x.x get pxelinux.0

### 0.33 and 1.x.x {#and_1.x.x}

-   From your FOG server test out tftp

```{=html}
<!-- -->
```
    tftp -v X.X.X.X -c get undionly.kpxe

-   From a Windows PC run at the cmd prompt: ([Windows
    TFTP](Windows_TFTP "wikilink") Service must be Installed first)

```{=html}
<!-- -->
```
     tftp x.x.x.x get undionly.kpxe

#### Expected Results {#expected_results}

-   If tftp & xinetd are running your should get:

```{=html}
<!-- -->
```
    Received XXXX bytes in X.X seconds....

```{=html}
<hr>
```
# Restart TFTP Service {#restart_tftp_service}

-   Restart the TFTP service.

```{=html}
<!-- -->
```
    service tftpd-hpa restart

```{=html}
<hr>
```
# Rights to tftpboot folder {#rights_to_tftpboot_folder}

-   Are the rights to your tftpboot folder correct?
    -   If you tried the above [Section-1.5.2](Section-1.5.2 "wikilink")
        and you get the \"Expected results\" then the rights are
        correct.

```{=html}
<hr>
```
# Check DHCP Option 67 {#check_dhcp_option_67}

-   Go to your DHCP and confirm that option 67 is set to undionly.kpxe.
    -   ```{=mediawiki}
        {{:DHCP_Settings}}
        ```
