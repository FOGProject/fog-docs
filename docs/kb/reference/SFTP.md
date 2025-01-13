---
title: SFTP
aliases:
  - SFTP
  - SSH
description: Describes the use and configuration of SFTP in fog 1.6+
context_id: SFTP
tags:
  - in-progress
  - 1_6-changes
---

# SFTP in FOG

FOG 1.6 uses SFTP/SSH for image capture instead of FTP as was used in the past. This hardens the security landscape of FOG and provides other functionality enhancements in the front end and backend. We are able to use the faster and more secure SFTP/SSH methods in a unified manner in many other aspects of FOG such as uploading new Kernels and Inits.

## SFTP Configuration

A by-product of this change from ftp to SSH/SFTP is that we need the SSH daemon configured to use internal-sftp for the sftp module in the OS.

During install/update of 1.6 the [[install-fog-server|Installer]] uses a sed command to attempt to update the `/etc/ssh/sshd_config` to have this line

```
# override default of no subsystems
Subsystem       sftp    internal-sftp
```

The original content is different in RHEL and Debian based distros 

- For RHEL it is changed from
```
# override default of no subsystems
Subsystem	sftp	/usr/libexec/openssh/sftp-server
```
- For Debian it is changed from 
```
# override default of no subsystems
Subsystem	sftp	/usr/lib/openssh/sftp-server
```

### Alternate Config approach

You could also create a file at `/etc/ssh/sshd_config.d` named `00-fog-internal-sftp` and then restart the sshd service

i.e. 

```
echo "Subsystem       sftp    internal-sftp" > /etc/ssh/sshd_config.d/00-fog-internal-sftp
systemctl restart sshd
```


## Troubleshooting SFTP capture errors

### SFTP Subsystem failed to start error

If you get an error when capturing an image or updating your kernel in the web ui that contains something like:

```
Message: ssh2_sftp(): Unable to startup SFTP subsystem: Timeout waiting for response from SFTP subsystem
```

Then you may need to adjust `/etc/ssh/sshd_config` manually to have this line towards the end of the file, replacing any existing `Subsystem sftp` lines

```
# override default of no subsystems
Subsystem       sftp    internal-sftp
```

Then restart the ssh/sftp services and try the capture again 

```
systemctl restart sshd
```
or 
```
service sshd restart
```
