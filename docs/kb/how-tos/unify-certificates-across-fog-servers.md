---
title: Unifying certificates across several FOG servers
aliases:
    - Unifying certificates across several FOG servers
    - One trust anchor for several FOG servers
description: How to make several independent FOG servers share a single certificate authority, so one certificate import covers the whole fleet instead of one per server
context_id: unify-certificates-across-fog-servers
tags:
    - how-to
    - certificates
    - fog-server
    - advanced
---

# Unifying certificates across several FOG servers

You run more than one FOG server. Each generated its own Certificate Authority
when it was installed, so every browser and every machine that talks to them
needs a certificate imported **per server** — five servers, five imports, and
five things to redo whenever one is rebuilt.

This guide covers the three ways to collapse that to one, and what each costs.
It applies the Web zone options described in
[[kb/reference/bringing-your-own-ca|Bringing your own CA]] across several servers at once;
see [[kb/reference/pki-zones|FOG's Certificate Zones]] for what a "zone" is and
[[kb/reference/pki-glossary|the PKI glossary]] if a term here is unfamiliar.

---

## First: which problem do you actually have?

Two different things both show up as *"the certificate is invalid"*, and they
have opposite fixes. Sort this out before changing anything.

1. **The client does not trust the CA.** The certificate is fine — nothing told
   this machine to trust who issued it. Importing the CA fixes it.
2. **The certificate does not chain to the CA you trusted.** You trusted server
   A's CA and you are browsing to server B, which has its own unrelated one.
   Importing more CAs does not fix this; the servers have to be re-issued.

Run this against each server, using the CA you already trust:

```bash
echo | openssl s_client -connect <ip>:443 2>/dev/null | openssl x509 -out /tmp/leaf.pem
openssl verify -CAfile /path/to/the/ca/you/trusted.pem /tmp/leaf.pem
```

`OK` means case 1 — a distribution problem, and you may not need this guide at
all. A verification error means case 2, and the rest of this page applies.

>[!warning] Do not compare issuer names
>Every FOG install names its CA `CN=FOG Server CA`, so two completely unrelated
>servers look identical if you only read the name. `openssl verify` is the only
>answer that means anything.

## The three options

| | Effort | One server holds signing power over another | Best when |
| --- | --- | --- | --- |
| **A. Import each server's CA** | One import per server, forever | No | Two or three stable servers |
| **B. One FOG server issues to the others** | One-time setup per server | **Yes** | Several FOG servers and no existing PKI |
| **C. Your own PKI or ACME CA** | Depends on your PKI | No | You already run a certificate authority |

There is no option where the servers stay completely independent *and* share an
anchor. Something has to sign for everyone.

## Option A: import each server's CA

The baseline, and genuinely fine for a small number of servers. Nothing changes
on the FOG side — you just distribute several certificates instead of one. Each
server publishes its own at:

```
https://<your-fog-server>/fog/management/other/ca.cert.der
```

## Option B: one FOG server issues to the others

Pick one server as the **hub**. Its CA stays exactly where it is. Every other
server gets its *own* signing CA, issued by the hub and locked to that server's
names, and uses it to sign its own web certificate. Every server's certificate
then rolls up to the hub's CA, so one import covers all of them.

```
     hub: FOG Server CA
      ├── FOG Web CA - fog1.example.lan   → fog1's web certificate
      ├── FOG Web CA - fog2.example.lan   → fog2's web certificate
      └── FOG Web CA - fog3.example.lan   → fog3's web certificate
```

>[!info] Update every server's installer first
>This uses `--web-ca-cert`/`--web-ca-key`/`--web-ca-root`. Pull the latest
>installer on **every** server before you start, or the options will not be
>recognized. See [[installation/server/command-line-options|Fog installer command line options]].

### Step 1 — issue a CA for each server, on the hub

```bash
sudo packages/pki/fog-mint-web-ca <hostname> <ip> [extra-dns-name ...]
```

`<hostname>` must be exactly what that server's own `hostname` command reports.
If the server is installed with `--extra-server-name` or `--internal-domain`,
pass those names too. They are written into the CA as restrictions, and a CA
restricted to the wrong names cannot sign the certificate it was made for.

The script checks this for you — it test-signs a certificate carrying the names
that server will actually ask for, and refuses to produce a CA that would
reject it. A wrong hostname fails here, on the hub, instead of on the far
server as a web server that will not start.

Each run writes `/root/fog-web-cas/<name>-webca.tar.gz` holding three files:
`webca.pem` (the CA), `webca.key` (its private key) and `fog-root.pem` (the
hub's root, for the far server to verify the chain against).

Repeat this for every server before moving on — the hub's root key has to be
present to sign, so if you keep it offline this is the one sitting where it
needs to be available.

### Step 2 — copy the bundle to that server

The bundle is under `/root` on the hub, and it contains a private key, which is
why. Most sites do not permit direct root SSH, so **push** it from the hub
rather than pulling it — staging it through your own account for exactly as
long as the copy takes:

```bash
# On the hub
sudo cp /root/fog-web-cas/<name>-webca.tar.gz ~/
sudo chown $USER: ~/<name>-webca.tar.gz
scp ~/<name>-webca.tar.gz <you>@<far-server>:~/
rm -f ~/<name>-webca.tar.gz
```

>[!warning] `scp root@hub:/root/... /root/` will not work
>Neither end cooperates: `sshd` ships with `PermitRootLogin prohibit-password`
>on most distributions, and your unprivileged local account cannot write to
>`/root` either. Both failures read simply `Permission denied`, which is easy
>to misread as the file not existing.

### Step 3 — install it on that server

```bash
# On the far server
sudo mkdir -p /root/webca
sudo tar -xzf ~/<name>-webca.tar.gz -C /root/webca

cd ~/fogproject/bin
sudo ./installfog.sh --web-ca-cert /root/webca/webca.pem \
                     --web-ca-key  /root/webca/webca.key \
                     --web-ca-root /root/webca/fog-root.pem
```

Unpacking as root into `/root/webca` keeps `webca.key` out of reach of every
other account on the machine — it is a CA private key, and it stays on this
server permanently, so where it lands matters. Delete the tarball from your
home directory afterward.

You pass these three options **once**. The files are imported into the web zone
and later upgrades reuse the import without the options being given again.

### Step 4 — trust the hub's CA wherever you need it

One certificate now covers the whole fleet. On a Linux client:

```bash
curl -k -o /tmp/fogca.der https://<hub>/fog/management/other/ca.cert.der
openssl x509 -inform DER -in /tmp/fogca.der -out /tmp/fogca.crt

# RHEL / Fedora / Rocky / Alma
sudo cp /tmp/fogca.crt /etc/pki/ca-trust/source/anchors/fog-server-ca.crt
sudo update-ca-trust extract

# Debian / Ubuntu / Alpine
sudo cp /tmp/fogca.crt /usr/local/share/ca-certificates/fog-server-ca.crt
sudo update-ca-certificates
```

Browsers need their own import — see [Your browser is a separate
problem](#your-browser-is-a-separate-problem) below.

>[!warning] What this costs
>Each server ends up holding a CA private key. That is the trade, and it is why
>each server gets **its own** CA rather than a copy of a shared one: the name
>restrictions mean a stolen key from `fog2` can only produce certificates for
>`fog2`'s own names, not for your whole estate.
>
>Never copy the same CA to several servers, and never copy the hub's own CA key
>anywhere. If holding signing power on a satellite is unacceptable at your site,
>use Option C or stay on Option A.

## Option C: your own PKI or ACME CA

If you already run a certificate authority, issue each FOG server an
intermediate from it and use the same three options. FOG does not care whether
the CA came from another FOG server or from your PKI — it validates the same
things either way.

This is the better answer when it is available to you: no FOG server holds
signing authority over another, and your existing rotation and revocation
processes apply as normal. An internal ACME CA (such as step-ca) fits best of
all, because the anchor stays put while the certificates beneath it renew
automatically.

[[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]] covers
that ground in full, including the renewal model and why public Let's Encrypt
is a poor fit for fog-client specifically.

## What this does and does not change

| | Unified? | |
| --- | --- | --- |
| Web / HTTPS certificate | **Yes** | what these options target |
| fog-client communication | No | each server keeps its own; clients pin per server |
| Secure Boot signing | No | see [[secure-boot-signing\|Secure Boot: signing FOS with your own key]] |

**fog-client is deliberately left alone.** It pins the CA of the server it
registered against, and that CA is *not* replaced here — which is exactly what
makes this safe to do on a live fleet without re-registering any machines.

### Your browser is a separate problem

FOG can add its CA to a server's own system trust store, but **browsers do not
use that store.** Firefox keeps its own, and Chrome reads a per-user one. Import
the hub's CA by hand, once:

- **Firefox** — Settings → Privacy & Security → Certificates → View
  Certificates → Authorities → Import, and tick *Trust this CA to identify
  websites*.
- **Chrome / Chromium on Linux** —
  `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "FOG Server CA" -i fogca.crt`

## Checking it worked

Per server:

```bash
echo | openssl s_client -connect <ip>:443 2>/dev/null | grep -E '^ [0-9] s:| *i:'
```

The issuer should read `CN=FOG Web CA - <hostname>`. Then confirm it actually
chains to the hub:

```bash
echo | openssl s_client -connect <ip>:443 2>/dev/null | openssl x509 -out /tmp/leaf.pem
openssl verify -CAfile /tmp/fogca.crt /tmp/leaf.pem
```

You want `OK`.

>[!tip] If the issuer is still the old one, check the file before the install
>The install writing the wrong certificate and the web server *serving* the
>wrong file look identical from outside. Ask the server which file it wrote:
>
>```bash
>sudo openssl x509 -noout -issuer \
>  -in "$(grep -oP "(?<=^PKI_web_vhost_cert=').*(?=')" /opt/fog/.fogsettings)"
>```
>
>`CN = FOG Web CA - <hostname>` here means the install worked and the problem is
>on the serving side — see *"the certificate on disk is right but the server
>sends the old one"* under [Troubleshooting](#troubleshooting). Anything else
>means the install itself did not take.
>
>Note the path comes from `PKI_web_vhost_cert`. `/opt/fog/snapins/ssl/.srvpublic.crt` is
>the **client communication** certificate, a different zone, and it is *supposed*
>to stay signed by the server's own CA — reading that one instead will convince
>you a working setup is broken.

## Troubleshooting

**The certificate did not change after I installed with the new options.**
Older installers decided whether to re-sign the web certificate by looking only
at the server's *names*. Switching CA left the names identical, so the
certificate was left alone — a clean install that changed nothing. Update the
installer and run it again; the newer version notices the CA changed and
re-issues by itself.

If the installer is already current, confirm which side the problem is on before
going further — the certificate may have been reissued correctly and simply not
be the one the web server is sending. See the next entry.

**The certificate on disk is right but the server sends the old one.**
The server has two FOG virtual hosts in one file, and is using the wrong one.
Count them:

```bash
# Apache
grep -c '^<VirtualHost \*:443>' /etc/apache2/sites-available/001-fog.conf
# nginx
grep -c '^server {' /etc/nginx/conf.d/fog.conf
```

`2` confirms it. FOG owns a marked region of that file so your own additions
survive an upgrade, and for a short window the run that introduced those markers
added the new block *below* the existing one instead of replacing it — leaving
FOG's previous virtual host in place above it. Both Apache and nginx use the
first virtual host that matches, so the stale copy won, complete with the
certificate paths from before the change. Nothing logs an error, because nothing
is wrong as far as the web server is concerned.

Update the installer and run it again. It detects the stale copy and removes it,
reporting `Removed a stale FOG vhost left outside the managed block`. Only a
block claiming a name FOG's own block claims is removed, so a virtual host you
added for a different name is left alone; the installer's timestamped backup of
the file is kept regardless.

**The far server's web server will not start, or its certificate is
rejected.** Its certificate carries a name its CA does not allow. Every FOG
server's certificate includes `fogserver` and `fog-server` in addition to its
own hostname, plus anything added with `--extra-server-name`. Re-issue the CA
with the missing names passed as extra arguments.

**The installer asks me for CA paths even though I passed them on the command
line.** Older installers prompted anyway, and then ignored what you typed —
pressing Enter through it was harmless. Updating the installer removes the
prompt.

**`Refusing to continue: the root ... carries pathlen:0`.** That CA is not
allowed to have another CA beneath it, so nothing it signed would be accepted.
Use a different CA, or Option A.

## See also

- [[kb/reference/bringing-your-own-ca|Bringing your own CA]] — the per-zone mechanism this builds on
- [[kb/reference/pki-zones|FOG's Certificate Zones]]
- [[kb/reference/pki-glossary|PKI & Secure Boot Glossary]]
- [[external-ca-lets-encrypt|External CA & Let's Encrypt certificates]]
- [[installation/server/command-line-options|Fog installer command line options]]
- `docs/MULTI_SERVER_CA.md` in the `fogproject` repository — the same ground
  with the design reasoning, for anyone reading the installer source
