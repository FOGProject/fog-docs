---
title: Set up Let's Encrypt on a FOG server
aliases:
    - Set up Let's Encrypt on a FOG server
    - Let's Encrypt walkthrough
    - ACME setup
    - Public certificate setup
description: End-to-end walkthrough for putting a publicly-issued certificate on a FOG server, including HTTPS netboot and automatic renewal
context_id: lets-encrypt-setup
tags:
    - how-to
    - certificates
    - pki
    - acme
    - lets-encrypt
    - netboot
---

# Set up Let's Encrypt on a FOG server

A certificate from a public certificate authority buys a FOG server two things
FOG's own authority cannot: browsers trust it with no import, and **iPXE can
validate it during netboot with no rebuilt binary**. This walks through it end
to end.

>[!note] Terms used on this page
>**ACME** is the protocol Let's Encrypt uses to issue and renew certificates
>automatically. **DNS-01** is one of its challenge types: you prove you control
>a domain by putting a record in its DNS, rather than by serving a file over
>port 80. **FQDN** is the server's full DNS name, like `fog.example.com`.
>**Leaf** is the server's own certificate, as opposed to the authority that
>signed it.

## What this gets you, and what it does not

| | With a public certificate |
|---|---|
| Browsers and the API | Trusted with no CA import |
| iPXE netboot over HTTPS | Works with **no** iPXE rebuild |
| Secure Boot | Unaffected — staged and signed either way |
| fog-client | **Read the caveat at the end before rolling this out** |

## Before you start

**You need an FQDN, and the booting clients need to resolve it.** A certificate
is issued to a name; no public authority will issue one for a private IP, and
iPXE fails the TLS handshake on a name mismatch even after the chain itself
validates. The DNS servers your DHCP hands out have to answer for that name.

**The server does not need to be reachable from the internet.** Use a **DNS-01**
challenge and the only thing that has to be public is the DNS record, not the
FOG server. That is the normal shape for an imaging server on a private network.

You will need an ACME client — `acme.sh` and `certbot` are both fine — and API
credentials for whoever hosts your DNS.

## Step 1 — issue the certificate

Get a certificate for the FQDN using a DNS-01 challenge. With `acme.sh` and a
generic DNS provider:

```bash
acme.sh --issue --dns dns_yourprovider -d fog.example.com
```

Or with `certbot`:

```bash
certbot certonly --preferred-challenges dns \
    --manual -d fog.example.com
```

Install the result into FOG's customizations tree —
**`/etc/fog/customizations/pki/`** — or leave it wherever your renewal process
already keeps it, such as `/etc/letsencrypt/live/fog.example.com/` for certbot.
Either works, and Step 2 is where you tell FOG which you chose.

What must **not** happen is the files landing inside FOG's *own* PKI tree at
`/etc/fog/pki/`. Anything under there is read as a certificate FOG issued and
manages, so FOG would regenerate over it.

>[!tip] `/etc/fog/customizations/` is the blessed place for files you bring
>It is the `/etc` counterpart of `/opt/fog/customizations/`, and it sits
>*beside* `/etc/fog/pki/` rather than inside it — which is precisely what makes
>FOG treat what you put there as yours rather than its own. Certificates and
>keys belong on the `/etc` side because they are small, secret, irreplaceable
>configuration that a backup policy ought to capture.

### Worked example — acme.sh with Cloudflare DNS

>[!note] When this recipe applies
>You need a domain you manage in **public** DNS with Cloudflare as its
>provider, and a name for the FOG server under it — `fog.company.com`,
>`fog.school.edu`. Basic DNS management, and everything else this needs, is in
>Cloudflare's free tier.
>
>The FOG server itself does **not** have to be publicly reachable, and its
>address does not have to be public either: DNS-01 is proved entirely by a TXT
>record on your authoritative nameservers, which the CA reads without ever
>contacting your server. Split-horizon DNS works, and so does a public record
>pointing at an RFC1918 address. In almost every case a FOG server should not be
>exposed to the internet at all.

#### Install acme.sh

Run this whole section as **root** — `sudo -i` first, and stay there.

acme.sh installs into the invoking user's home directory and puts its renewal
cron in that user's crontab. Install it as yourself and then issue as root and
you get `acme.sh: command not found`; install it as yourself and leave it there
and the renewal cron cannot write root-owned certificates or reload the web
server. Either way the certificate expires silently at around 60 days, which is
the single most common way this setup fails.

##### RHEL based — Rocky, Alma, RHEL

```bash
dnf -y update ca-certificates
curl https://get.acme.sh | sh -s email=you@example.com
source ~/.bashrc
```

##### Debian based — Debian, Ubuntu

```bash
apt-get update
apt-get -y install ca-certificates
update-ca-certificates
curl https://get.acme.sh | sh -s email=you@example.com
source ~/.bashrc
```

>[!note] Two things worth knowing about that snippet
>The `email=` is your **Let's Encrypt account** address — where expiry warnings
>are sent. It is not your Cloudflare login, and the two do not have to match.
>
>`socat` and `libidn` are often listed as acme.sh prerequisites. Neither is
>needed here: `socat` is only for acme.sh's standalone HTTP-01 listener, which a
>DNS-01 recipe never starts, and `libidn` only for internationalised domain
>names. On EL9 there is no `libidn` package at all — it is `libidn2` — so
>`dnf install libidn` fails outright and stops the paste on its first line.

#### Create a Cloudflare API token

Log in to the Cloudflare account holding the DNS zone and go to
<https://dash.cloudflare.com/profile/api-tokens>. Account-scoped tokens at
<https://dash.cloudflare.com/?to=/:account/api-tokens> work as well.

The token needs exactly two permissions:

| Permission | Why acme.sh needs it |
|---|---|
| **Zone → Zone → Read** | to list your zones and resolve the zone id |
| **Zone → DNS → Edit** | to write, then remove, the `_acme-challenge` TXT record |

Scope it to all zones or to one specific zone, per your own security
requirements. Note it is Zone **Read**, not Zone *Edit* — nothing here changes
the zone itself, so granting that is more than the recipe uses.

Copy the token somewhere secure; Cloudflare will not show it to you again.

You also need your account ID. One way to find it is in the dashboard URL while
editing DNS records:

```
https://dash.cloudflare.com/{accountID}/{yourdomain.tld}/dns/records
```

#### Issue the certificate and configure renewal

Adjust the five values in the first block. Everything after it can be pasted
unchanged.

```bash
# ---- adjust these five, then paste the rest as-is ----
FOG_FQDN='fog.example.com'        # the name the certificate is issued to
FOG_ALIAS=''                      # one extra SAN, or leave empty for none
CF_Token='TOKEN_CREATED_ABOVE'
CF_Account_ID='ACCOUNT_ID_FROM_ABOVE'
WEB_SVC='httpd'                   # apache2 on Debian/Ubuntu; nginx if you run nginx
# ------------------------------------------------------

CUSTOM_PKI='/etc/fog/customizations/pki'
export CF_Token CF_Account_ID

install -d -m 0700 "$CUSTOM_PKI"

acme.sh --upgrade --auto-upgrade

# Main name first, then the optional alias. Add more -d pairs for more SANs.
domains=(-d "$FOG_FQDN")
[ -n "$FOG_ALIAS" ] && domains+=(-d "$FOG_ALIAS")

# --server letsencrypt because acme.sh otherwise defaults to ZeroSSL.
acme.sh --issue --dns dns_cf --server letsencrypt "${domains[@]}"

# --cert-file is the leaf alone and --ca-file the intermediate alone. That split
# is what FOG's vhost expects. Do NOT use --fullchain-file for the leaf, or the
# vhost ends up listing the intermediate twice.
acme.sh --install-cert -d "$FOG_FQDN" \
    --cert-file "$CUSTOM_PKI/web-leaf.pem" \
    --key-file  "$CUSTOM_PKI/web-leaf.key" \
    --ca-file   "$CUSTOM_PKI/web-chain.pem" \
    --reloadcmd "chmod 0600 $CUSTOM_PKI/web-leaf.key && systemctl reload $WEB_SVC"

chmod 0600 "$CUSTOM_PKI/web-leaf.key"
```

Issuance and installation are two separate acme.sh commands on purpose: you can
re-run the install half, or change where the files land, without going back to
the CA for a new certificate.

Now point FOG's canonical paths at those three files. The keys already exist in
`.fogsettings`, so replacing the values in place is enough:

```bash
sed -i \
    -e "s|^PKI_web_vhost_cert=.*|PKI_web_vhost_cert='$CUSTOM_PKI/web-leaf.pem'|" \
    -e "s|^PKI_web_vhost_key=.*|PKI_web_vhost_key='$CUSTOM_PKI/web-leaf.key'|" \
    -e "s|^PKI_web_trust_chain=.*|PKI_web_trust_chain='$CUSTOM_PKI/web-chain.pem'|" \
    /opt/fog/.fogsettings
```

The vhost is generated from those three keys, so the change takes effect on the
next installer run — [Step 4](#step-4--run-the-installer) below. You can skip
this `sed` entirely if you would rather use the symlink form in Step 2; the two
are alternatives, not both required.

>[!warning] The Cloudflare token is stored in cleartext
>acme.sh writes `CF_Token` and `CF_Account_ID` into `~/.acme.sh/account.conf`,
>because unattended renewal has to be able to read them back. Since you ran the
>above as root, that is root's home. Treat the file as a secret, and scope the
>token narrowly enough that its disclosure would not matter much.

**Renewal** is acme.sh's own cron entry, installed for root by the steps above.
The `--reloadcmd` is what picks each renewed certificate up. Use a single
`systemctl reload` of the one web server you actually run — chaining a reload of
both Apache and nginx with `&&` makes the whole command fail on every renewal,
and a `restart` rather than a `reload` drops in-flight imaging and API requests.

## Step 2 — tell FOG the certificate is not its to manage

There are two separate things to say, and FOG learns them in two different
ways.

**"Something other than FOG renews this leaf" is not a setting.** FOG works it
out from the filesystem. It always refers to the vhost certificate by a
*canonical* path, and asks where that path resolves: if the answer is outside
its own web zone directory, the leaf belongs to something else. So you point
the canonical paths at your ACME files and FOG reads the target and leaves it
alone:

```bash
ln -sf /etc/letsencrypt/live/fog.example.com/fullchain.pem \
       /opt/fog/pki/web/leaf/.webLeaf.pem
ln -sf /etc/letsencrypt/live/fog.example.com/privkey.pem \
       /opt/fog/pki/web/leaf/.webLeaf.key
```

That is what stops the installer regenerating the certificate from its original
signing request while your ACME client owns the key — a certificate/key
mismatch that stops the web server — and what stops FOG locking the private key
to `root:root 0600`, which would break a renewal hook running as anyone else.

>[!important] Two ways to say it; one way to get it wrong
>Either of these works, and you need only one:
>
>- **Symlink**, as above — leave `PKI_web_vhost_cert` at its default and make
>  that path resolve to your file.
>- **Record the path** — set `PKI_web_vhost_cert` in `.fogsettings` to your
>  file's real location, as the Cloudflare example above does. FOG only resets
>  that key when it holds one of its own known defaults, so a path of your own
>  survives every later run.
>
>What does not work is having your ACME client write a *real file* to
>`/opt/fog/pki/web/leaf/.webLeaf.pem`. That is inside FOG's own web zone, so FOG
>concludes the leaf is its, re-issues it, and overwrites yours. Neither a
>symlink out of the zone nor a recorded path outside it can be misread that way.
>
>This replaces FOG 1.5's `acmeLeaf='yes'`, which had to be typed in by hand and
>failed in exactly this manner when it was forgotten — silently, under `-y`.

**"This certificate chains to a public root" is a setting**, because nothing on
disk can tell FOG that. Edit [[1.6/management/server/install-fogsettings|/opt/fog/.fogsettings]]:

```bash
PKI_web_cert_publicly_trusted='yes'
```

This is what moves netboot to HTTPS, because it tells FOG that iPXE will be
able to validate the chain on its own. FOG never measures it: it anchors its
own CA in this server's trust store, so probing that store would report FOG's
own leaf as trusted — exactly the case that *does* need an iPXE rebuild.

The two answers are independent, and all four combinations are real. An
**internal** ACME server such as step-ca is a symlinked leaf with
`PKI_web_cert_publicly_trusted='no'`.

## Step 3 — make FOG address itself by name

Two places have to agree with the name on the certificate.

**The installer's idea of the hostname**, if `hostname -f` does not already
return the FQDN:

```bash
./installfog.sh --hostname fog.example.com
```

**`FOG_WEB_HOST`**, in the web interface under
FOG Configuration → FOG Settings → Web Server. This one is easy to miss and
breaks netboot in a way that looks like a certificate problem:

>[!warning] Set FOG_WEB_HOST or HTTPS netboot fails after the first hop
>The boot script the installer writes chains to the server by hostname, so the
>first request succeeds. But `boot.php` then rebuilds every later URL — the
>kernel, the init, `MOK.der`, the background image — from `FOG_WEB_HOST`, which
>holds the server's **IP address** on a fresh install and is not updated by
>upgrades. Every one of those fetches then fails iPXE's name check.
>
>Set it to the same FQDN the certificate is issued to. Nothing in the installer
>does this for you.

## Step 4 — run the installer

```bash
cd /path/to/fogproject/bin
./installfog.sh --install-mode public-cert
```

`public-cert` sets `WEB_url_proto=https`, `BOOT_url_proto=https` and
`PKI_web_cert_publicly_trusted=yes`, and leaves
`BOOT_rebuild_ipxe_with_my_ca=no` — which is the whole point, since a public
certificate needs no rebuild. See
[[1.6/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]].

The installer will not re-issue your leaf, will not touch its key permissions,
and will refuse to write a boot script that chains to an IP over HTTPS rather
than completing and leaving you unable to boot.

## Step 5 — verify

**The served chain**, from another machine:

```bash
openssl s_client -connect fog.example.com:443 -servername fog.example.com </dev/null 2>/dev/null \
    | openssl x509 -noout -subject -issuer -dates
```

The issuer should be your public CA, and the subject should be the FQDN.

**The boot script** actually names the FQDN:

```bash
grep chain /tftpboot/default.ipxe
```

It should read `https://fog.example.com/fog/service/ipxe/boot.php`, not an IP.

**A real client.** Netboot one machine and watch it get past `boot.php` to the
menu. Getting to the menu and then failing on a later fetch is the
`FOG_WEB_HOST` symptom from step 3.

## Renewal

Renewal is your ACME client's job, not FOG's. FOG follows the symlinks to
whatever is there now, so a renewal that writes to the same paths needs nothing
from FOG — only a web server reload:

```bash
systemctl reload nginx     # or: systemctl reload httpd / apache2
```

Wire that into your client's post-renewal hook.

>[!note] Nothing re-runs the installer for you
>A renewed **leaf** needs no installer run. A changed **issuing intermediate**
>is different, and Let's Encrypt does rotate intermediates — see the caveat
>below and [[external-ca-lets-encrypt#renewal-and-rotation|Renewal and rotation]].

## The fog-client caveat — check this before a fleet rollout

The certificate zones were separated in 1.6: the **Web TLS** certificate this
page swaps out, and the **Client Communication** certificate fog-client uses,
are no longer the same material.
[[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]] records the cost of changing the Web TLS
zone as *"None. Browsers just need the issuer trusted."*

But [[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]] also
documents fog-client as pinning `ca.cert.der` and requiring that exact
certificate in the served chain — which a Let's Encrypt chain does not contain,
and which LE's intermediate rotation would break even if it did. That passage
predates the zone split and has not been re-verified against it.

**The two pages disagree, and this one is not going to guess.** Before rolling a
public certificate out to a fleet running fog-client, swap it on the server and
confirm that **one** already-registered client still checks in. If it does, the
zone split has done its job. If it does not, the pinning caveat still applies
and an internal ACME CA is the better fit — see
[[external-ca-lets-encrypt#recommended-internal-acme-ca-step-ca|the step-ca recommendation]],
which gives you ACME automation with a stable pinned CA.

Netboot and browser trust are unaffected either way.

## See also

- [[1.6/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]] — why a public certificate needs no iPXE rebuild
- [[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]] — the reference behind this walkthrough
- [[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]] — the three certificate zones
- [[1.6/management/server/install-fogsettings|The .fogsettings file]] — `PKI_web_cert_publicly_trusted` and the canonical certificate paths
- [[1.6/installation/server/command-line-options|Fog installer command line options]] — `--install-mode`, `--hostname`
