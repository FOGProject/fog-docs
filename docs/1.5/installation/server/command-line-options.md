---
title: "Fog installer command line options (1.5)"
aliases:
    - "Fog installer command line options (1.5)"
    - "installfog.sh options (1.5)"
    - "Installer flags (1.5)"
description: Every option the FOG 1.5 installer accepts and what it changes
context_id: "command-line-options-1.5"
tags:
    - installation
    - fog-server
    - configuration
    - certificates
    - secure-boot
    - 1_5-legacy
---

# Fog installer command line options (1.5)

>[!info] This page describes FOG 1.5.
>See the [[1.6/installation/server/command-line-options|1.6 version]] of this page for FOG 1.6.

The FOG 1.5 installer takes a much shorter list of options than 1.6's. There's
no `--install-mode`, no `--netboot-proto`, no `--boot-delay`, and `-S`/
`--force-https` still carries its pre-1.6 meaning: the web UI protocol, the
netboot protocol, and whether iPXE gets recompiled all switch together,
rather than being controlled separately. Most installs still need none of
these — the defaults are chosen for the common case, and anything you do pass
is recorded in [[1.5/management/server/install-fogsettings|the .fogsettings file]] so an upgrade
keeps it without you passing it again.

## The full option list

```
Usage: ./installfog.sh [-h?dEUuHSCKYXTFA] [-f <filename>] [-N <databasename>]
                [-D </directory/to/document/root/>] [-c <ssl-path>]
                [-W <webroot/to/fog/after/docroot/>] [-B </backup/path/>]
                [-s <192.168.1.10>] [-e <192.168.1.254>] [-b <undionly.kpxe>]
        -h -? --help                    Display this info
        -o    --oldcopy                 Copy back old data
        -d    --no-defaults             Don't guess defaults
        -U    --no-upgrade              Don't attempt to upgrade
        -H    --no-htmldoc              No htmldoc, means no PDFs
        -S    --force-https             Force HTTPS for all communication
                                                (web UI, netboot, AND a local
                                                 iPXE rebuild — see below)
              --no-force-https          Undo --force-https: serve both HTTP
                                                and HTTPS without redirecting
        -C    --recreate-CA             Recreate the CA Keys
                                                Implies --recreate-keys below, and
                                                re-anchors what fog-client pins
        -K    --recreate-keys           Recreate the SSL Keys
                                                Replaces the client communication
                                                keypair. EVERY registered fog-client
                                                must then be reinstalled or re-pinned
        -Y -y --autoaccept              Auto accept defaults and install
        -f    --file                    Use different update file
        -c    --ssl-path                Specify the ssl path
                                                defaults to /opt/fog/snapins/ssl
        -D    --docroot                 Specify the Apache Docroot for fog
                                                defaults to OS DocumentRoot
        -W    --webroot                 Specify the web root url want fog to use
                                                (E.G. http://127.0.0.1/fog,
                                                      http://127.0.0.1/)
                                                Defaults to /fog/
        -B    --backuppath              Specify the backup path
              --uninstall               Uninstall FOG
        -s    --startrange              DHCP Start range
        -e    --endrange                DHCP End range
        -b    --bootfile                DHCP Boot file
        -E    --no-exportbuild          Skip building nfs file
        -X    --exitFail                Do not exit if item fails
        -T    --no-tftpbuild            Do not rebuild the tftpd config file
        -F    --no-vhost                Do not overwrite vhost file
              --secure-boot-key         Private key used to re-sign the FOS
                                                kernels for UEFI Secure Boot
              --secure-boot-cert        Certificate matching --secure-boot-key
                                                (both are required together)
              --no-secure-boot          Do not generate a Secure Boot signing
                                                key, and leave the FOS kernels
                                                unsigned
              --no-ca-trust             Do not add this server's CA to this
                                                server's own system trust store
              --web-ca-cert/-key/-root  Bring your own CA for the WEB zone: the
                                                intermediate that signs this server's
                                                vhost certificate, its key, and the
                                                root it chains to. All three are
                                                required together
              --internal-domain         Permit this domain in the Web AND Secure
                                                Boot CAs' name constraints (repeatable).
                                                The server's own domain is always permitted
              --internal-subnet         Restrict those CAs to this subnet, e.g.
                                                10.20.30.0/24 (repeatable). REPLACES
                                                the default of all RFC1918 ranges
              --no-sb-name-constraints  Do not constrain the Secure Boot CA's
                                                permitted names (the Web CA stays
                                                constrained)
              --extra-server-name       Add an extra vhost/cert name (repeatable)
                                                alongside the primary hostname and
                                                detected IPs
```

>[!note] `-N`, `-l`, `--hostname`, `--fogprogramdir`, `--boot-delay` and the `--purge-*`/`--dry-run` uninstall options aren't here
>1.5's installer doesn't accept a database name, a package list, an override
>hostname, or a custom FOG base directory on the command line; it has no
>switch-delay handling at all (no `--boot-delay`, and nothing corresponding
>to `10secdelay/`); and its `--uninstall` has no dry-run/force/purge flags —
>all of those arrived with 1.6. See
>[[1.6/installation/server/command-line-options#The full option list|the 1.6 version of this page]]
>for what they do there.

## HTTPS and the -S flag

Before FOG 1.6, `-S`/`--force-https` (and the interactive "Would you like to
enable secure HTTPS" prompt behind it) decided three unrelated things at
once, and 1.5 still works this way:

| What `-S` does on 1.5 | |
|---|---|
| Web UI protocol | Switches to HTTPS |
| HTTP → HTTPS redirect | Turned on |
| iPXE | Recompiled locally, with this server's CA embedded (10–25 minutes) |

There's no way to pick just one of these on 1.5 — no `--install-mode`, no
`--netboot-proto`, no `--rebuild-ipxe-with-my-ca`, no `--public-web-cert`. If
you want HTTPS for the web UI without touching netboot, or without paying for
a local iPXE rebuild, that's a 1.6-only capability; see
[[1.6/installation/server/command-line-options#The four install modes|the 1.6 version of this page]].

>[!warning] HTTPS and the signed Secure Boot chain are mutually exclusive on 1.5
>The Secure Boot chain (`secureboot/snponly-shimx64.efi` and friends) is a
>generic binary signed by Microsoft — FOG cannot recompile it without breaking
>that signature. So whenever `httpproto` is `https` (`-S` was passed, or you
>answered yes to the installer's HTTPS prompt), the installer **skips staging
>the Secure Boot binaries entirely** rather than serve ones that will fail a
>client's TLS check. Choosing HTTPS on 1.5 means choosing FOG's own
>(unsigned) netboot binaries over the pre-signed shim chain — there is no
>third option.

`--no-force-https` undoes `-S` and goes back to serving both HTTP and HTTPS
without a redirect — this is also the default for a fresh install.

## Certificate options

FOG generates its own Certificate Authority at install time and uses it to
sign this server's HTTPS certificate. `--web-ca-cert`/`--web-ca-key`/
`--web-ca-root` (all three required together) replace it with a CA you
supply instead — your enterprise PKI, an internal ACME CA, or one issued by
another FOG server. 1.5 has no `--external-ca` alias for this; `--web-ca-*`
is the only spelling.

>[!info] This does not affect fog-client
>`--web-ca-*` replaces the CA that signs the **web** certificate and nothing
>else. The root that fog-client pinned at registration is untouched, which is
>what makes this safe to do on a running fleet without re-registering a
>single machine.

For the per-zone mechanism in full see [[1.5/kb/reference/bringing-your-own-ca|Bringing your own CA]].

### Name constraints

FOG restricts the Web CA (and, on 1.5, the Secure Boot CA too — see below) to
a set of permitted names, so a compromised CA cannot issue for the whole
internet.

| Option | What it does |
| --- | --- |
| `--internal-domain <domain>` | Permit this domain in the constrained CAs' name constraints, and add it to the certificate and the vhost `ServerAlias`. Repeatable. The server's own domain is always permitted |
| `--internal-subnet <cidr>` | Restrict the constrained CAs to this subnet. Repeatable, and it **replaces** the default of all private ranges rather than adding to it |
| `--no-sb-name-constraints` | Leave the **Secure Boot** CA unconstrained. The Web CA is unaffected and stays constrained |

>[!important] Constraints are fixed when a CA is first created
>FOG never re-mints an existing authority, so changing these on a server that
>already has one does nothing until you remove the intermediate as well.

>[!warning] A CA you supply must constrain only by DNS name or IP address
>iPXE enforces name constraints, and only understands `dNSName` and
>`iPAddress` permitted subtrees. A CA carrying any other subtree type — or any
>`minimum`/`maximum` — **fails to parse**, and the whole chain with it. Leave
>your intermediate unconstrained or constrain it with those two only. This
>matters only when netboot is on HTTPS.

### The local trust store

The installer can add this server's own CA to this server's system trust
store, so `curl`, `wget` and PHP's stream wrapper on the FOG server can
verify the FOG server without being handed a CA file each time. The store is
detected from the host — `/etc/pki/ca-trust/source/anchors` on the RHEL
family, `/usr/local/share/ca-certificates` on Debian/Ubuntu/Alpine,
`/etc/ca-certificates/trust-source/anchors` on Arch.

`--no-ca-trust` skips it, and is still available on 1.5 (it was removed in
1.6, where the trust-store add became unconditional).

>[!warning] This does not make your browser stop warning
>Firefox keeps its own certificate store and Chrome reads a per-user one, so
>neither consults what this writes — and your browser is usually on a
>different machine entirely. Import the CA into the browser yourself; it is
>published at
>`https://<your-fog-server>/fog/management/other/ca.cert.der`.

### Recreating certificates

| Option | What it does |
|---|---|
| `-C`, `--recreate-CA` | Recreate the CA keys. Implies `--recreate-keys`, and re-anchors what fog-client pins |
| `-K`, `--recreate-keys` | Recreate the SSL keys. Replaces the client communication keypair, so **every registered fog-client must then be reinstalled or re-pinned** |

## Secure Boot options

1.5's installer **generates Secure Boot signing material by default** and
signs the FOS kernels with it, the same as 1.6 — a stock server always has a
certificate fingerprint to check and an enrollment kit to hand out, unless
you decline it.

| Option | Use it when |
|---|---|
| *(none)* | The default. The material is generated on first install and reused, never regenerated, on every later upgrade. |
| `--secure-boot-key` + `--secure-boot-cert` | You already have a signing key you want FOG to use. Both are required together; the certificate may be PEM or DER. |
| `--no-secure-boot` | You do not want a Secure Boot signing key generated at all — the FOS kernels are left **unsigned**. |

>[!note] 1.5 has no `--secureboot-ca-cert`
>1.6 lets you bring your own Secure Boot **intermediate** separately from the
>signing leaf. 1.5 only takes the key/certificate pair above; there's no way
>to supply a separate intermediate on the command line.

>[!note] `--no-secure-boot` means something stronger on 1.5 than on 1.6
>On 1.6, declining Secure Boot only stops FOG from publishing enrollment
>material (`MOK.der`, `PK`/`KEK`/`db.auth`) — the FOS kernels are still
>signed, since a signature costs nothing on a machine with Secure Boot off.
>On 1.5, `--no-secure-boot` stops the key from being generated at all, and
>the kernels ship unsigned.

>[!warning] The signing key is never regenerated on its own, and that is deliberate
>A new signing key silently invalidates enrollment on **every machine that
>already trusted the old one**, and nothing reports that until a client fails
>to boot — long after the install that caused it. So re-running the installer
>reuses what is already there.
>
>**`--recreate-CA` does remove it**, along with the root CA and every other
>intermediate beneath it — an intermediate orphaned by a new root would chain
>to nothing — so the Secure Boot authority comes back as a *different*
>certificate and every enrolled machine has to enroll again. Do not reach for
>that flag to fix an unrelated web-certificate problem on a server with
>Secure Boot clients.

The material lives under `/opt/fog/pki/secureboot/`: the enrolled authority
in `ca/` and the signing certificate in `leaf/sign.{key,pem}`, private keys
`0600` inside a directory owned by root. See
[[1.5/kb/how-tos/secure-boot-signing|Secure Boot: signing FOS with your own key]] for the
full procedure and for what to do on each client, and
[[1.5/kb/reference/pki-zones|FOG PKI Infrastructure]] for the layout.

## See also

- [[1.5/installation/server/install-fog-server|Install FOG Server (1.5)]]
- [[1.5/management/server/install-fogsettings|The .fogsettings file]] — where these options are remembered
- [[1.5/installation/network-setup/dhcp-server-settings|DHCP server settings (1.5)]]
- [[1.6/installation/server/command-line-options|The 1.6 version of this page]] — the fuller option set, including `--install-mode`, `--netboot-proto`, `--boot-delay` and the `--purge-*` uninstall flags
