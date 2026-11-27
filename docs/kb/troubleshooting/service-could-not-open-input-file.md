---
title: Service Fails with "Could not open input file"
aliases:
    - Service Fails with "Could not open input file"
    - FOGPluginRunner fails to start
    - FOGRetentionRunner fails to start
    - FOGAgentReleaseSync fails to start
description: Why FOGPluginRunner, FOGRetentionRunner and FOGAgentReleaseSync restart forever on a server with a restrictive umask, and how to fix it
context_id: service-could-not-open-input-file
tags:
    - troubleshooting
    - services
    - installation
---

# Service Fails with "Could not open input file"

>[!info] FOG 1.6 and later
>The fix is in FOG 1.6 dev-branch builds after 2026-11-26. It ships in FOG 1.6.1.

## Symptom

FOGPluginRunner, FOGRetentionRunner and FOGAgentReleaseSync do not start. They restart again and again, and the system log fills with lines like these:

```
Started FOGPluginRunner.service - FOGPluginRunner.
Could not open input file: /opt/fog/service/FOGPluginRunner/FOGPluginRunner
FOGPluginRunner.service: Main process exited, code=exited, status=1/FAILURE
```

The other FOG services start. The script in the error exists. `ls -l /opt/fog/service` shows the folders as `drwxr-x--- root root`, and the scripts as `-rwxr-x--- root root`. Running the installer again does not change the result.

## Cause

These three services run as the web server user (for example `www-data` or `apache`), not as root. The other FOG services run as root.

The installer copied the service scripts with the file modes that the FOG checkout has. On a server with a restrictive umask, such as `027`, the checkout is readable only by root. So the web server user cannot open the scripts, `lib/service_lib.php`, or `etc/config.php`. Each new installer run copied the same modes again.

## Fix

Update to a FOG version that has the fix, and run the installer. The installer then gives every user read access to the service scripts, whatever modes the checkout has. It does not change the access to the other files in `/opt/fog/service/etc`.

## Workaround on FOG 1.6.0

Run these commands as root. They use the default paths:

```
chmod a+x /opt/fog /opt/fog/log /opt/fog/service/etc
chmod a+rx /opt/fog/service
cd /opt/fog/service && for d in FOG* lib; do chmod -R a+rx "$d"; done
chmod 644 /opt/fog/service/etc/config.php
systemctl restart FOGAgentReleaseSync FOGPluginRunner FOGRetentionRunner
```

Run them again after each installer run, until you update to a version with the fix.

The same umask causes other failures too. To fix all of them at once, see [[certificate-helper-not-installed|FOG Installed Under a Restrictive umask]].
