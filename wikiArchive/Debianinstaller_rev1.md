## Question

Does FOG work on Debian?

## Answer

-   On Debian squeeze, with FogProject 0.32 select the \'Ubuntu\' option
    in the installer. You must also edit
    -   /etc/default/tftpd-hpa:
-   TFTP_DIRECTORY=/tftpboot \--[Milantha](User:Milantha "wikilink")
    08:49, 2 February 2012 (MST)

```{=html}
<!-- -->
```
-   We have not tested on Debian however it has been reported that
    selecting the \'Ubuntu\' option in the installer works on Debian.
    -   I installed using ubuntu instructions and FOG .28 and it is
        working fine on Debian Lenny. I then upgraded to .29 with no
        issues. \--[Hillie](User:Hillie "wikilink") 14:03, 28 May 2010
        (UTC)

```{=html}
<!-- -->
```
-   I\'m testing FOG on Xen Server with Debian Lenny on virtual machine,
    choosing Ubuntu install, there are some minor issues:
    -   error during isntallator about missing file /etc/\*release (it
        just fails to detect the suggested distribution scheme)
    -   mysql root password is strongly advised, rember to edit fog
        config.php in /var/www
-   the rest looks like is working properly (so far, well ubuntu comes
    from debian anyway), later I will try to set it up on standalone
    machine (non virtual). \--[KaszpiR](User:KaszpiR "wikilink") 16:01,
    26 March 2009 (MST)
