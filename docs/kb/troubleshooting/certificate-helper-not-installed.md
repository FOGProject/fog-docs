---
title: FOG Installed Under a Restrictive umask
aliases:
    - FOG Installed Under a Restrictive umask
    - Certificates Page Says the Helper Is Not Installed
    - The certificate management helper is not installed on this server
    - Downloaded kernels are not signed for Secure Boot
description: Why a FOG server installed with a restrictive umask, such as 027, shows a missing certificate helper and other access failures, and how to fix it
context_id: certificate-helper-not-installed
tags:
    - troubleshooting
    - certificates
    - secure-boot
    - installation
---

# FOG Installed Under a Restrictive umask

>[!info] FOG 1.6 and later
>The fix is in FOG 1.6 dev-branch builds from 2026-11-26 ([#2169](https://github.com/FOGProject/fogproject/pull/2169) and [#2170](https://github.com/FOGProject/fogproject/pull/2170)). It will ship in the next FOG 1.6 patch release after 1.6.0.

## Symptom

The installer finishes without an error, but one or more of these occur:

- **FOG Configuration > Certificates** shows this message on a master server:

  ```
  The certificate management helper is not installed on this server, so this page can only show what it can read for itself.
  ```

  The installer output said `Installing the certificate management helper....Done`.
- If you use Secure Boot kernel signing, the server does not sign the kernels that you download in the web UI. No error shows.
- FOGPluginRunner, FOGRetentionRunner and FOGAgentReleaseSync do not start. See [[service-could-not-open-input-file|Service Fails with "Could not open input file"]].
- PXE clients cannot get `default.ipxe` over TFTP.

`ls -ld /etc/fog /opt/fog/bin` shows `drwxr-x--- root root`. Running the installer again does not change the result.

## Cause

Some parts of FOG run as accounts other than root: the web server user (for example `www-data` or `apache`), the TFTP server, and the `fogproject` user. They must read files that the installer creates.

The installer used the umask of the shell that started it. On a server with a restrictive umask, such as `027`, every folder and file that the installer created without an explicit mode was readable only by root. The installer also copied the files from the FOG checkout with the modes that the checkout has. A checkout cloned under a restrictive umask is readable only by root too.

## Fix

Update to a FOG version that has the fix, and run the installer. The installer now sets its own umask, and it repairs the modes that an earlier install under a restrictive umask left. It gives FOG's files the same modes on every server, whatever the umask of your shell. Files that hold a password or a private key keep their own restricted modes.

## Workaround on FOG 1.6.0

A umask applies only when a file or folder is created. Running the installer again under the default umask does not open the paths that the first install already made. So the workaround has two parts: run the installer again under umask 022, then open the remaining paths by hand.

The commands below use the default paths on Debian and Ubuntu: the service account `fogproject`, the web root `/var/www/html/fog`, the PKI folder `/etc/fog/pki`, and the snapin folder `/opt/fog/snapins`. If your server uses different paths, change the commands to match.

Run these commands as root. First, in the folder of your FOG checkout (for example `/root/fogproject`), run the installer again:

```
chmod -R a+rX . && chmod 0700 tmp
umask 022
cd bin && ./installfog.sh -y
```

The first line lets every user read the checkout. The `tmp` folder holds the database passwords, so it stays readable only by root.

Then open the paths that the first install closed:

```
chmod go+rx /etc/fog /etc/fog/pki/agent /etc/fog/pki/client /etc/fog/pki/root /etc/fog/pki/web
chmod go+r /etc/fog/fog.conf
find /etc/fog/pki /opt/fog/snapins/ssl/CA -type f \( -name '*.csr' -o -name '*.cnf' -o -name '*.srl' -o -name '*.sans' -o -name '.trustAnchor.pem' \) -exec chmod go+r {} +
chmod go+rx /opt/fog /opt/fog/bin /opt/fog/reporting /opt/fog/snapins/ssl /opt/fog/snapins/ssl/CA
chmod go+rx /opt/fog/log /opt/fog/log/agentreleasesync /opt/fog/log/fos /opt/fog/log/plugins /opt/fog/log/retention
chmod go+r /opt/fog/reporting/settings
chmod -R go+rX /opt/fog/service /opt/fog/customizations /var/www/html/fog/service/ipxe
chmod go+r /var/www/html/index.php /var/www/html/fog/management/other/agent-ca-bundle.pem
chmod go+rx /etc/exports.d /home/fogproject/.config /home/fogproject/.config/autostart
chmod go+r /etc/nfs.conf.d/fog-nfs.conf /home/fogproject/.bashrc /home/fogproject/.config/autostart/warnfogaccount.desktop
chmod -R go+rX /var/lib/apache2/module /var/lib/apache2/site
systemctl restart 'FOG*'
```

These commands open only public files. Private keys, `/etc/fog/ssh`, the CA folders, and `config.class.php` keep their restricted modes. On a server installed under the default umask, the commands change nothing.

On Rocky, AlmaLinux, and other Red Hat family systems, leave out the `/var/lib/apache2` line. A `chmod` on a path that does not exist prints an error and changes nothing.

The database backup folder, `/home/fogDBbackups`, stays readable only by root. Only root reads the backups, and they hold your data.

If you use Secure Boot, download your kernels again in the web UI after these commands. A kernel downloaded before the fix is not signed.
