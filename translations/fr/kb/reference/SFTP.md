---
title: SFTP
aliases:
  - SFTP
  - SSH
description: Décrit l'utilisation et la configuration de SFTP dans FOG 1.6+
context_id: SFTP
tags:
  - in-progress
  - 1_6-changes
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/SFTP).

# SFTP dans FOG

FOG 1.6 utilise SFTP/SSH pour la capture d'images au lieu du FTP employé auparavant. Cela renforce la sécurité de FOG et apporte d'autres améliorations fonctionnelles côté interface comme côté serveur. Nous pouvons ainsi utiliser les méthodes SFTP/SSH, plus rapides et plus sûres, de manière unifiée dans bien d'autres aspects de FOG, comme le téléversement de nouveaux noyaux et fichiers init.

## Configuration de SFTP

Ce passage du FTP au SSH/SFTP a pour corollaire que le démon SSH doit être configuré pour utiliser internal-sftp comme module sftp du système d'exploitation.

Pendant l'installation ou la mise à jour de la 1.6, l'[[install-fog-server|installeur]] utilise une commande sed pour tenter de modifier `/etc/ssh/sshd_config` afin d'y placer cette ligne

```
# override default of no subsystems
Subsystem       sftp    internal-sftp
```

Le contenu d'origine diffère entre les distributions RHEL et celles fondées sur Debian

- Pour RHEL, il est remplacé depuis
```
# override default of no subsystems
Subsystem	sftp	/usr/libexec/openssh/sftp-server
```
- Pour Debian, il est remplacé depuis
```
# override default of no subsystems
Subsystem	sftp	/usr/lib/openssh/sftp-server
```

### Autre approche de configuration

Vous pouvez aussi créer, dans `/etc/ssh/sshd_config.d`, un fichier nommé `00-fog-internal-sftp`, puis redémarrer le service sshd

par exemple

```
echo "Subsystem       sftp    internal-sftp" > /etc/ssh/sshd_config.d/00-fog-internal-sftp
systemctl restart sshd
```


## Résoudre les erreurs de capture SFTP

### Erreur « SFTP Subsystem failed to start »

Si vous obtenez, lors de la capture d'une image ou de la mise à jour de votre noyau dans l'interface web, une erreur contenant quelque chose comme :

```
Message: ssh2_sftp(): Unable to startup SFTP subsystem: Timeout waiting for response from SFTP subsystem
```

il vous faudra peut-être ajuster manuellement `/etc/ssh/sshd_config` pour y placer cette ligne vers la fin du fichier, en remplaçant toute ligne `Subsystem sftp` existante

```
# override default of no subsystems
Subsystem       sftp    internal-sftp
```

Redémarrez ensuite les services ssh/sftp et réessayez la capture

```
systemctl restart sshd
```
ou
```
service sshd restart
```
