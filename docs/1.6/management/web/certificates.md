---
title: The Certificates Page
aliases:
    - The Certificates Page
    - Certificate Management
    - FOG Configuration Certificates
description: Reading FOG's certificate chain from the web UI, importing a corporate root CA, and setting the PKI preferences the next installer run acts on
context_id: certificates-page
tags:
    - 1_6-changes
    - management
    - web-management
    - certificates
    - pki
    - https
    - security
---

# The Certificates Page

**FOG Configuration → Certificates.** New in 1.6.

FOG uses certificates for three unrelated jobs — the web server, the encrypted
fog-client check-in, and the signature on the FOS kernels. They are issued by
separate CAs beneath one anchor, so replacing any one of them leaves the other
two alone. [[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]] explains the
split; this page is about the screen.

## What it is for

Three questions, answerable without an SSH session:

- **What does this server actually present, and when does it expire?**
- **Can the web application read a CA private key?** It should not be able to.
- **What will the next installer run do?**

And two things it can change: importing a root CA into the server's trust, and
setting the three PKI preferences.

>[!important] Changes here need the `system.pki` permission
>It is **deny-by-default and not seeded**, so immediately after an upgrade
>nobody holds it except users with the `*` wildcard. A role-scoped
>administrator sees the page read-only until you grant `system.pki` — see
>[[roles|Roles & Permissions]]. Viewing the page needs only
>`settings.view`, which is unchanged.
>
>It is a separate permission on purpose. `settings.edit` is shared by six page
>nodes, and "may edit the OUI table" should not also mean "may change what this
>server trusts".

## The cards

### Certificates

The **trust anchor** — its subject and its SHA-256 fingerprint. This is the
certificate published as `ca.cert.der` and pinned by every fog-client.

The fingerprint is the useful part. When a client stops authenticating, compare
this value against what is in that client's trust store: if they differ, the
server's root was replaced and the client never re-pinned.

### Private keys are readable by the web server

**This card is only shown when there is a problem.** Not seeing it is the
correct outcome.

FOG's CA private keys live `0400 root:root` inside `0700` directories,
specifically so that a compromise of the web application cannot reach them.
This card tests that assumption from inside PHP and names any key it can
actually open.

Two keys are excluded because the web tier is *supposed* to read them: the
client-communication key, which `certDecrypt()` opens on every fog-client
handshake, and the web server's own key when the certificate is managed outside
FOG (an ACME client, a corporate issuance process).

>[!warning] If this card appears, the separation is not holding
>Something has widened the permissions on a key directory. Re-running
>`installfog.sh` re-asserts them. Until it does, treat any compromise of the
>web application as a compromise of the CA.

### The certificate chain

Every certificate this server holds, with subject, expiry, and a **Download**
link for each:

| Row | What it is |
|---|---|
| Trust anchor | The root. Published as `ca.cert.der`, pinned by fog-client |
| Web CA | Signs the web server certificate and every storage node certificate |
| Web trust chain | Web CA plus the root that anchors it — what a client needs to verify this server |
| Trust anchor bundle | What this server itself trusts: FOG's root, plus any root imported below |
| Web server certificate | What the browser is shown. Replaced by an ACME renewal where one is configured |
| Client communication certificate | The public half of the keypair fog-client encrypts its check-in to |
| Secure Boot CA | Signs the FOS kernel signing certificate. Not a web certificate |
| Imported root | A root CA uploaded on this page. Absent unless one was imported |

Downloads are **public certificates only**. There is no path through this page
that emits a private key — the helper behind it has a fixed list of eight
downloadable slots and no way to name a file.

A row reading "N certificates in this file" is a bundle rather than a single
certificate; the download gives you the whole bundle.

### External root CA

Upload a root CA in PEM and FOG installs it into the server's OS trust store,
the same way the installer's own `--ca-root` import does.

What it accepts is deliberately narrow. Of everything in the file you upload it
keeps **only certificates that are self-signed, are marked as a CA, and have not
expired**. An intermediate in the bundle is discarded rather than anchored, and
so is an expired root — silently trusting either is how a "why does this verify
on my laptop but not here" afternoon starts.

**Remove imported root** takes it back out and rebuilds the anchor bundle.

>[!note] This is separate from the root fog-client pins
>An imported root is fed to the **web** zone's trust path only. It is recorded
>under its own setting and never conflated with FOG's own root, which is the
>whole reason the zones are split. Importing your corporate root does not make
>fog-client trust it.

### Install preferences

Three switches. **Nothing here takes effect until the installer runs again** —
the page records the preference, it does not rewrite the web server
configuration or reissue anything.

| Switch | What it means |
|---|---|
| The web certificate chains to a public CA | A statement you make, never a measurement. FOG adds its own CA to the host trust store, so a probe would answer "trusted" for FOG's own certificate — exactly the case that needs the iPXE rebuild |
| Redirect HTTP to HTTPS | **Off by default on purpose.** Trust in FOG's CA reaches a client when fog-client installs it there, so on a server whose clients are not enrolled yet a forced redirect breaks exactly the machines that cannot fix themselves. Turn it on once trust is in place |
| Rebuild iPXE with this server's CA | Compiles the CA into the iPXE binaries so HTTPS netboot verifies. A long build — unnecessary when the certificate is publicly trusted |

The card links out to [[lets-encrypt-setup|Let's Encrypt with FOG]] for a worked
example of the first one.

### Using your own PKI

Prose plus the exact `installfog.sh --external-ca …` command for this server,
composed with its real paths, ready to copy.

>[!danger] Rotating the root CA is not a button, and that is deliberate
>The root is what every registered fog-client pins. Replacing it un-trusts the
>entire estate until each client re-pins, so it is a planned migration with a
>rollback, not a click. The page hands you the command; running it is a decision
>you make deliberately at a shell.

## How the page reaches the PKI

Worth understanding, because it explains why the page can do some things and not
others.

The web application **cannot** read the key material, and that is the point —
PHP is the threat model. `.fogsettings` is `0600 root:root`, and the CA
directories are `0700 root:root`, so the page cannot read even the *public* Web
CA certificate on its own.

So it does not try. It calls a small root helper, `fog-pki-admin`, through a
narrow `sudo` rule. The helper takes **no path arguments** — every path it
touches comes from a root-only configuration file written at install time — and
it offers exactly five operations: report status, export one of eight named
certificate slots, import a root, clear the imported root, and set one of three
named preferences to `yes` or `no`.

That last one is the load-bearing part. `.fogsettings` is **sourced as shell, by
root**, on the next installer run — so an unvalidated value written into it is a
root shell with extra steps. The list of writable keys and the `yes|no` value
check live inside the helper, on the far side of `sudo`, where a compromised web
tier cannot remove them.

>[!info] "The certificate management helper is not installed on this server"
>The page says this rather than silently showing less. Two causes:
>
>- **The installer has not run since upgrading.** Re-run it.
>- **You are on a storage node.** Expected — a node has no CA of its own.

## Where the files live

As of 1.6 the PKI tree is at **`/etc/fog/pki`**. Keys and certificates are
configuration, and `/etc` is what a backup policy and a config-management run
already capture; `/opt` is for a package's own static files.

`/opt/fog/pki` still works — it is a symlink to the new location, so existing
documentation, renewal cron entries and recorded certificate paths need no
changes. The move happens once, automatically, on the next installer run.

See [[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]] for the layout beneath
it.

## See also

- [[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]] — the zones, and what lives where
- [[1.6/kb/reference/bringing-your-own-ca|Bringing your own CA]]
- [[lets-encrypt-setup|Let's Encrypt with FOG]]
- [[external-ca-lets-encrypt|External CA & Let's Encrypt certificates]]
- [[roles|Roles & Permissions]] — granting `system.pki`
- [[1.6/management/server/install-fogsettings|.fogsettings reference]]
