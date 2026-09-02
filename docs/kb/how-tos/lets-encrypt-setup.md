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

Install the result somewhere stable that your renewal process will keep
updating — `/etc/letsencrypt/live/fog.example.com/` for certbot, or wherever
`acme.sh --install-cert` puts it. **Do not** copy the files into FOG's own PKI
tree; the point of the next step is to tell FOG they live elsewhere and are not
FOG's to manage.

### Example of acme.sh with cloudflare dns

>[!note] This Cloudflare DNS-01 recipe works for users that have their local domain in a public `.tld`
> and that have control over the DNS in that domain with cloudflare as their provider.
> i.e. you have an external website on a domain like company.com or school.edu and your internal domain matches
> so internal only sites are also reachable like fog.company.com or fog.school.edu.
> To be clear, in 99.999999999999% of cases You should not be making your fog server publicly available.
> (Basic DNS managment and everything you need for this is available in the Free version of cloudflare DNS)

#### Install acme.sh

- RHEL based
```
#install pre-reqs to be prepared for special cases
sudo dnf -y install socat libidn
sudo dnf -y update ca-certificates
#download and install acme.sh
curl https://get.acme.sh | sh -s email=yourCloudflareAccountEmail@yourdomain.tld
#refresh bash aliases so it can be run from anywhere
source ~/.bashrc
```
  - Debian based
```
#install pre-reqs
sudo apt-get install socat
sudo update-ca-certificates
 
#download and install acme.sh
curl https://get.acme.sh | sh -s email=yourCloudflareAccountEmail@yourdomain.tld
#refresh bash aliases so it can be run from anywhere
source ~/.bashrc
```

#### Obtain clouflare api keys with dns zone edit scope

Login to your cloudflare account you want to bind your api tokens for let's encrypt to, and go to:
https://dash.cloudflare.com/profile/api-tokens (you may also be able to use account api tokens: https://dash.cloudflare.com/?to=/:account/api-tokens)

Create a token for your fog server to use that has Zone.Zone Edit and Zone.DNS Edit rights 
(scope to all zones or a specific dns zone per your environments security requirements)

Copy the token and save it somewhere secure. 

Obtain your account ID, one way to find it is in the URL when you go to edit DNS records i.e. 
`https://dash.cloudflare.com/{accountID}/{yourdomain.tld}/dns/records`

#### Obtain the certs and Configure auto renewal

- Adjust the exported CF_variable values at the top of the script
- Adjust the subjectname and aliases lies
- Adjust the reloadcmd to use httpd or nginix depending on your server's config
- Then run this (as sudo, example has you in an interactive sudo session with sudo -i) 
It will put the certs at /etc/fog/pki/web/leaf

```
sudo -i
#use the letsencrypt cloudflare user api key
#set the dns api key and email
export CF_Token="TOKEN_CREATED_ABOVE"
export CF_Account_ID="ACCOUNT_ID_CREATED_ABOVE"
export CF_Email="emailUsedForTokenAbove@yourdomain.tld"
#update acme
acme.sh --upgrade --auto-upgrade

#issue a cert, comments should be removed, put here for documentation. Install locations should match configuration of where the service in question looks for them
# the example install locations
acme.sh --issue \ #issue and or install a certificate
	-d subjectname.domain.tld \ #the main subject name of your cert i.e. fogserver.domain.tld
	--dns dns_cf \ # use dns verification
	--server letsencrypt \ #defaults to zerossl, we want letsencrypt to be the ca
 	-d alias.domain.tld \ # alias domain to include as SAN (subject alternative name), you can list additional ones with more -d lines
    --cert-file /etc/fog/pki/web/leaf/fogLE.cer \ #the location to install the cert file, you can also give it a .pem, .cer or .crt extension
    --fullchain-file /etc/fog/pki/web/leaf/fogLEfullchain.pem \ #the location to install the fullchain version of the cert that includes the ca chain, can have any name
    --key-file /etc/fog/pki/web/leaf/fogLE.key \ # the location for the private key, can have any name
    --reloadcmd "service httpd restart && service nginix restart" # the command or path to a script used to reload the service or services that use the cert. Will be run when cert is renewed
```

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

>[!important] Point the path at your file; do not write your file at the path
>Editing the path in `.fogsettings` moves nothing: FOG recomputes canonical
>paths on every run. And having your ACME client write a *real file* to
>`/opt/fog/pki/web/leaf/.webLeaf.pem` is worse than doing nothing — that file
>is inside FOG's own web zone, so FOG concludes the leaf is its and re-issues
>it. A symlink out of the zone cannot be misread that way.
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
