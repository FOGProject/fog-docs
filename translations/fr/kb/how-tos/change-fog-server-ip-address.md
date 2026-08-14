---
title: Changer l'adresse IP du serveur FOG
aliases:
    - Change FOG Server IP Address
description: décrit comment changer l'adresse IP du serveur FOG
context_id: change-fog-server-ip-address
tags:
    - in-progress
    - convert-Wiki2MD
    - how-to
    - kb
    - ip-address
    - web-management
    - server-management
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/change-fog-server-ip-address).


# Changer l'adresse IP du serveur FOG

## Étapes à suivre

-   Suivez la procédure propre à votre distribution Linux pour changer
    l'adresse IP du système d'exploitation.
-   Mettez à jour le champ ipaddress= (et les autres champs si nécessaire)
    dans le fichier /opt/fog/.fogsettings [[install-fogsettings|.fogsettings]]
-   Relancez l'installeur ; vous devrez utiliser **\--recreate-CA** et
    **\--recreate-keys keys**, car l'installeur fournit un certificat dont
    le nom commun (Common Name) repose sur l'adresse IP, certificat qui
    sera embarqué dans le noyau iPXE et ne parviendra plus à charger la
    moindre ressource https puisqu'il n'est plus valide.
-   Mettez à jour l'adresse IP dans `/tftpboot/default.ipxe` (cherchez la
    ligne chain, par exemple
    `chain https://x.x.x.x/fog/service/ipxe/boot.php##params`)
-   Mettez à jour l'adresse IP du nœud de stockage sur le système FOG dont
    vous avez changé l'adresse IP : Interface web → Storage Management
-   Mettez à jour l'adresse IP sur tout nœud de stockage maître susceptible
    de référencer ce serveur FOG : Interface web → Storage Management
-   (Pour le serveur maître) Mettez à jour la valeur FOG_WEB_HOST :
    Interface web → Configuration FOG → Paramètres de FOG → Web Server →
    FOG_WEB_HOST
-   (Pour le serveur maître) Mettez à jour la valeur FOG_TFTP_HOST :
    Interface web → Configuration FOG → Paramètres de FOG → TFTP Server →
    FOG_TFTP_HOST

Facultativement, si vous avez configuré un dhcpd :

-   Mettez à jour les adresses IP (fog et passerelle) dans
    `/etc/dhcp/dhcpd.conf`.
-   N'oubliez pas de vérifier votre `/etc/export` pour le serveur NFS ainsi
    que votre configuration apache2, car l'installeur l'écrase.
