---
title: Host Key Refused — Could not get this host's key
aliases:
    - Could not get this host's key
    - Invalid Tasking hostgetkey
    - Deploy now reboots first after Full Registration
description: What to do when FOS cannot get the host key, or a Full Registration with deploy image now reboots before it deploys
context_id: hostgetkey-refused-invalid-tasking
tags:
    - troubleshooting
    - imaging
    - registration
    - fos
---

# Host Key Refused — Could not get this host's key

>[!info] FOG 1.6 and later
>This page applies to FOG 1.6. The fault described under "Cause 1" is in FOG 1.6.0 and is fixed in FOG 1.6.1.

## Symptom

You see one of two things.

On a FOS that you boot from USB, FOS prints this message. After it, the task settings are missing:

```
 * Could not get this host's key: ...
```

The server answer to the host-key request is `Invalid Tasking`.

After a Full Registration with **deploy image now** (FOS 1.6.1 or later), the host registers. It then reboots and deploys on the next PXE boot. It does not deploy in the same boot.

## Cause 1: the server refuses the key request (FOG 1.6.0)

`status/hostgetkey.php` did not declare itself as a machine request. Site scope then hid the host's task from the lookup. Every host-key request got the answer "Invalid Tasking", even for a host with a queued task. FOS got no host key, so it could not read the task settings.

FOG 1.6.1 fixes this.

## Cause 2: the reboot is by design

If the host-key request works, the reboot after Full Registration can still happen. These two reasons are by design:

- **FOG_HOSTKEY_ALLOWED_SOURCES is set, and the imaging network is not in it.** `hostgetkey.php` refuses a caller outside the listed networks. FOS then falls back to a reboot.
- **A plugin hooks the boot settings.** The Location plugin is one example. The server answers "reboot first", because the plugin can change the kernel or the storage node. FOS must boot again to use the new values.

## What to do

On FOG 1.6.0, pick one:

- Upgrade to FOG 1.6.1.
- Add this line before the `require` in `status/hostgetkey.php`:

```php
define('FOG_MACHINE_REQUEST', true);
```

On FOG 1.6.1 or later, if the host still reboots first:

1.  In the web UI, open **FOG Configuration → FOG Settings**, and find **FOG_HOSTKEY_ALLOWED_SOURCES** in the **Security** section.
2.  If the setting has a value, add the imaging network to it. Use a comma-separated list of CIDR ranges or single addresses, for example `10.0.0.0/8,192.168.5.20`.
3.  Save, and register a host again with **deploy image now** to check.

If a plugin that hooks the boot settings is active, the reboot is expected. No setting turns it off.

## See also

- [[kb/how-tos/post-download-scripts#Domain join password and product key|Domain join password and product key]]
