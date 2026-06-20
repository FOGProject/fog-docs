---
title: FOG Security
aliases:
    - FOG Security
    - Security
description: How FOG protects itself, and how to harden your FOG server and imaging network
context_id: fog-security
tags:
    - security
    - hardening
    - https
    - firewall
    - csrf
    - reference
---

# FOG Security

This page covers two things: what FOG already does to protect itself, and the
steps you can take to harden your FOG server and imaging network.

## What FOG does to protect itself

You get the following out of the box — no configuration required:

-   **Hardened web responses.** Every page is served with a strict
    Content-Security-Policy plus `X-Frame-Options`, `X-Content-Type-Options:
    nosniff`, and `X-XSS-Protection` headers. When HTTPS is enabled, FOG also
    sends HSTS.
-   **Output escaping and input sanitization.** User-supplied data is HTML-escaped
    on output, and inputs are filtered and stripped of null bytes before use, to
    guard against XSS and injection.
-   **CSRF protection.** State-changing requests in the web UI require a
    per-session CSRF token (compared with a constant-time check) and an origin
    check, so a malicious page can't act on your logged-in session.
-   **Hashed passwords.** Web UI account passwords are stored as bcrypt hashes,
    never in plain text.
-   **Encrypted client communication.** The FOG client and server exchange data
    using a per-host RSA key pair plus AES encryption, so client/server traffic
    isn't sent in the clear.
-   **API tokens.** The REST API is gated by a server-wide API token plus
    per-user tokens — see [[api|the API page]].

## Use HTTPS

The single highest-impact thing you can do is run FOG over HTTPS. You can enable
it during installation; when enabled, the web server redirects HTTP to HTTPS,
sends HSTS, and the iPXE binaries are rebuilt to trust your certificate so PXE
booting keeps working.

For setting up a trusted certificate (including free Let's Encrypt certificates),
see [[external-ca-lets-encrypt|Using an external CA / Let's Encrypt]].

## Hardening recommendations

These are not required, but they meaningfully reduce your exposure.

### Isolate the imaging network

PXE and TFTP are **unauthenticated by design** — the firmware on a booting
client has no way to verify the server, and TFTP has no authentication. This is
inherent to network booting, not specific to FOG. The practical mitigation is to
run imaging on a **trusted, segregated network** (a dedicated VLAN or an isolated
lab/provisioning network) rather than on an untrusted or public LAN. Treat any
machine that can PXE boot from your FOG server as something that network already
trusts.

### Firewall

FOG uses a number of services (HTTP/HTTPS, TFTP, NFS, FTP, MySQL, multicast). If
you run a local firewall, you need to allow the ports those services use — see
[[network-and-firewall-requirements|Network and Firewall Requirements]] for the
list. The installer offers to disable the local firewall (and SELinux on RedHat
systems) because a misconfigured ruleset is a common cause of imaging failures;
if you'd rather keep them enabled, plan to manage the rules yourself.

### Use strong credentials

Change the default `fog` web UI password immediately after install, and use a
strong, unique password for the database and FTP accounts FOG creates.

### Secure the database

Don't expose MySQL/MariaDB to the network if it only needs to serve the local
FOG server, and give the FOG database user a strong password. Run your
distribution's MySQL hardening step (for example `mysql_secure_installation`) on
a fresh server.

### Protect your images and database

Your `/images` store and the FOG database contain everything an attacker would
need to clone or tamper with your deployments. Restrict filesystem and share
access to them, and keep backups (the installer can back up the database during
upgrades — see [[install-fog-server|Install FOG Server]]).

### Keep FOG updated

Run a current release. Security and stability fixes land in the dev/stable
branches over time, and staying reasonably up to date is the easiest way to pick
them up.

## References and further reading

-   [[network-and-firewall-requirements|Network and Firewall Requirements]]
-   [[external-ca-lets-encrypt|Using an external CA / Let's Encrypt]]
-   [[api|FOG API]]
-   [Firewall configuration (FOG forums)](https://forums.fogproject.org/topic/6162/firewall-configuration)
-   [SELinux policy discussion (FOG forums)](https://forums.fogproject.org/topic/6154/selinux-policy)
