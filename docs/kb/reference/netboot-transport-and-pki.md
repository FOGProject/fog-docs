---
title: Netboot Transport and PKI
aliases:
    - Netboot Transport and PKI
    - Install Modes
    - Netboot Transport
    - HTTPS Netboot
description: How FOG decides whether iPXE fetches its boot script over HTTP or HTTPS, what each install mode changes, and which certificate authority choices work alongside Secure Boot
context_id: netboot-transport-and-pki
tags:
    - reference
    - security
    - certificates
    - pki
    - netboot
    - ipxe
    - secure-boot
---

# Netboot transport and PKI

A booting client and a browser are not in the same position. Your browser can be
told to trust FOG's certificate authority; iPXE, running out of firmware before
any operating system exists, cannot. That single asymmetry is why FOG serves its
web interface and its netboot fetches over **separately chosen protocols**, and
why the certificate you put on the vhost decides what the netboot side can do.

This page covers that choice. For what the certificates themselves are and how
they are laid out on disk, see [[pki-zones|FOG PKI Infrastructure]]. For the
vocabulary, see [[pki-glossary|PKI Glossary]].

>[!note] Terms used on this page
>**Netboot** is the PXE/UEFI network boot: the client asks DHCP where to boot,
>loads iPXE, and iPXE fetches FOG's boot script over HTTP or HTTPS.
>
>**FQDN — fully qualified domain name.** The server's complete DNS name, such
>as `fog.example.com`, rather than a short name (`fog`) or an IP address.
>
>**MOK — Machine Owner Key.** A certificate enrolled into an individual
>machine's firmware so Secure Boot will accept binaries signed by it. **shim**
>is the Microsoft-signed loader that checks for it.
>
>**ACME** is the protocol certificate authorities like Let's Encrypt use to
>issue and renew certificates automatically. **CA** is a certificate authority;
>a **public** one is trusted out of the box by browsers and operating systems,
>a **private** one is not.

>[!info] FOG 1.6
>Everything on this page is 1.6. In 1.5.x a single `httpproto` setting decided
>the web protocol, the HTTP→HTTPS redirect and whether iPXE was recompiled, all
>at once. Those are now separate settings, and the old behaviour of inferring one
>from another is gone.

## The four install modes

`--install-mode` is a **preset**. It writes four independent settings in one go,
and it is the easiest way to pick a coherent combination:

| Mode | Web UI / API | Netboot | Rebuilds iPXE | Right for |
|---|---|---|---|---|
| `standard` *(default)* | HTTPS | HTTP | no | Almost everyone, including FOG's own CA |
| `http-only` | HTTP | HTTP | no | Plain HTTP everywhere; what FOG did before 1.6 |
| `public-cert` | HTTPS | **HTTPS** | no | A certificate from a public CA, on an FQDN |
| `embed-ca` | HTTPS | **HTTPS** | **yes** | HTTPS netboot behind a private CA |

The installer asks which one you want during an attended install. Under
`-y`/`--autoaccept` it does not ask, and you get `standard` unless you passed
something else.

>[!important] A mode is a starting point, not a mode of operation
>Nothing is locked once you pick one. Each of the four settings can be given on
>its own, and a discrete option always overrides the preset's value for that one
>field — `--install-mode public-cert --no-rebuild-ipxe-with-my-ca` means exactly
>what it reads like. FOG does not record "which mode you are in" anywhere.

## The settings underneath

Each is an independent key in [[install-fogsettings|the .fogsettings file]], and
no setting silently changes another:

| Setting | Default | What it means |
|---|---|---|
| `httpproto` | `https` | The protocol FOG uses for its own **non-netboot** URLs |
| `netbootproto` | `http` | The protocol iPXE uses to fetch `boot.php` |
| `publicWebCert` | `no` | The web certificate chains to a **public** root |
| `rebuildIpxeWithMyCA` | `no` | Recompile iPXE with your CA embedded in it |
| `httpsRedirect` | `no` | Redirect HTTP to HTTPS, and send HSTS |
| `acmeLeaf` | `no` | The leaf certificate is managed outside FOG |

Two of them are statements of fact about your certificate rather than
instructions: `publicWebCert` says **what the certificate chains to**, and
`acmeLeaf` says **who renews it**. They are different questions and all four
combinations are real — an internal ACME server such as step-ca is
`acmeLeaf=yes` with `publicWebCert=no`. Either one tells FOG the certificate was
issued somewhere else, so FOG will neither re-issue it nor lock its private key
away from whatever renews it.

### How the netboot protocol is decided

1. If you passed `--netboot-proto`, that wins — and it is **remembered**, so a
   later run without the option does not undo it.
2. Otherwise it becomes `https` if **either** `publicWebCert=yes` **or**
   `rebuildIpxeWithMyCA=yes`.
3. Otherwise it is `http`.

A value that FOG derived for you is re-derived on every run. That is deliberate:
if you later turn off the thing that put netboot on HTTPS, netboot goes back to
HTTP instead of outliving the reason it was there.

You may force `--netboot-proto https` with neither trigger set. It is allowed,
and the installer warns you, because iPXE cannot be told to trust a private CA
at runtime — every client would fail the TLS handshake with nothing logged on
the server.

## Secure Boot is prepared in every mode

**No install mode disables Secure Boot.** Every mode stages upstream's signed
shim and loaders, and signs everything that did not arrive signed.

This is worth stating plainly because FOG used to do the opposite. Until 1.6,
enabling HTTPS caused the installer to skip staging the Secure Boot binaries
altogether, on the reasoning that the two could not coexist. They can. The
feature was missing precisely on the servers whose admins had gone furthest out
of their way to configure TLS. If you have read that HTTPS and Secure Boot are
mutually exclusive in FOG — including in older versions of these docs — that is
the claim being corrected.

What is never re-signed is upstream's own material: the shim, `mmx64.efi` /
`mmaa64.efi`, and the signed loaders that shim vouches for. Adding FOG's
signature to those would buy nothing. See
[[secure-boot-technical-details|Secure Boot Technical Details]].

## `public-cert`: HTTPS netboot with no rebuild

If your web certificate chains to a **public** root, iPXE validates it with no
change to the binary at all.

Upstream iPXE unconditionally compiles in a cross-signing endpoint,
`http://ca.ipxe.org/auto`. When it meets a chain it cannot otherwise validate it
fetches a cross-signed certificate from there vouching for real-world public
CAs, Let's Encrypt included. FOG's iPXE fork changes only iPXE's general,
settings and console configuration — never its crypto configuration — so the
fallback is live in every FOG-built binary. The republished Secure-Boot-signed
binaries are upstream's own, built with no embedded CA whatsoever, so they rely
on it entirely.

That is why `public-cert` does not rebuild anything.

>[!warning] It needs an FQDN, and it needs public DNS to resolve it
>A certificate is issued to a **name**. No public CA will issue one for a private
>IP address, and iPXE fails the handshake on a name mismatch even after the chain
>itself validates. So HTTPS netboot addresses this server by hostname, and the
>booting client has to resolve that name using the DNS servers DHCP hands it —
>a prerequisite the IP-based URL never had.
>
>The installer refuses to write a boot script that would chain to an IP over
>HTTPS, rather than completing cleanly and leaving you unable to boot anything.
>The domain does not have to be reachable from the internet; a DNS-01 challenge
>is enough to get the certificate. See
>[[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]].

>[!important] The cross-certificate is fetched by the **client**, not the server
>`ca.ipxe.org` has to be reachable from the machine that is booting. On an
>air-gapped network it is not, so a public certificate does not help there no
>matter how public it is — use `embed-ca` instead.

## `embed-ca`: a private CA, at the cost of an extra enrolment

`embed-ca` recompiles iPXE with your certificate authority — FOG's own, or an
external one you configured — baked in, so it can validate a chain no public
root vouches for.

It is the right answer for an air-gapped site, or anywhere HTTPS netboot must
work behind a private CA. It is the wrong answer almost everywhere else, for
three reasons.

**It adds an enrolment step rather than removing one.** A binary carrying your
CA is not upstream's Microsoft-signed binary any more. FOG signs it with this
server's own Secure Boot signing key, and upstream's signed shim will happily
load it — *once this server's MOK is enrolled in that machine's firmware*. So on
a Secure Boot machine the MOK has to be enrolled **before** the machine can
netboot at all, which is a different and harder ordering than the usual one,
where a machine netboots first and enrols afterwards. See
[[secure-boot-mok-enrollment|Secure Boot MOK Enrollment]].

**The build takes 10–25 minutes when it runs** — it is a full compile with no
incremental path. But it does **not** run on every install. FOG stamps the TFTP
tree with the pinned iPXE version, a hash of the embedded CA and a hash of the
staged binary; if all three still match, the build is skipped. A routine upgrade
therefore costs nothing extra, and you pay the 10–25 minutes when one of these
changes:

- the **pinned iPXE version** moves, which a FOG upgrade may bring with it
- your **CA changes** — rotated, replaced, or swapped for an external one
- the **staged binaries** were replaced, e.g. by the published tarball
- there is **no stamp yet**, which is the first build on a server

**It is not needed for a public certificate.** If your certificate chains to a
public root, `public-cert` gets you the same HTTPS netboot with no rebuild and
no extra enrolment.

## If you supply your own CA, constrain it carefully

FOG gives the authority that issues its web certificate a `nameConstraints`
extension limiting which names it may issue for, and RFC 5280 requires that
extension to be marked critical. iPXE now **enforces** name constraints rather
than refusing to parse them, which is what makes HTTPS netboot work against
FOG's own CA at all.

The enforcement is deliberately strict, and it fails closed:

- Only `dNSName` and `iPAddress` permitted subtrees are implemented. A CA
  carrying any other subtree type — `directoryName`, `rfc822Name`, a URI — **will
  not parse**, and the whole chain fails.
- Any `minimum` or `maximum` on a subtree is likewise fatal at parse time.
- Constraints bind every certificate below the constraining CA, not just the one
  it signed directly, so a deep enterprise chain that used to work by accident
  may now be correctly refused.
- A separate trap: a root with `pathlen:0` cannot anchor FOG's intermediate at
  all. The installer refuses to continue rather than issuing something that
  cannot validate.

If you are handing FOG an enterprise intermediate, either leave it unconstrained
or constrain it with `dNSName`/`iPAddress` subtrees only. See
[[bringing-your-own-ca|Bringing Your Own CA]].

## Why the HTTPS redirect is off by default

`httpsRedirect` is not part of any mode, and no mode turns it on.

A redirect only helps machines that already trust the certificate they are being
redirected to. So the question is how trust got there, and **you have several
routes** — the default is off because FOG cannot know which one you have used
yet, not because there is only one.

| Route | Trust arrives when |
|---|---|
| **fog-client** | The client installs FOG's root into the machine's trusted store as part of its own setup. Many sites already have this on every managed machine, which makes it the common answer |
| **Your own deployment tooling** | You push FOG's root yourself — Group Policy, Intune, Jamf, Ansible, a package. The certificate is published at `/fog/management/other/ca.cert.der` |
| **Your own CA, pushed the same way** | You gave FOG an external CA (`--web-ca-*`), and your fleet already trusts that root because your organisation put it there |
| **A public CA** | Nothing to push. Browsers and operating systems trust it out of the box — see [[external-ca-lets-encrypt\|External CA & Let's Encrypt Certificates]] |

**Turn the redirect on once one of those is true for the machines that matter.**
Left on from the start on a fresh server with FOG's own CA, it breaks exactly the
machines that have no way to fix themselves yet — which is why it is not the
default, and why it is a deliberate step rather than an assumption.

The redirect also carries HSTS, which is the sharper half: a browser that has
seen an HSTS header refuses plain HTTP for months from its own cache, and no
server-side change reaches it. Turning the redirect on is easy to undo on the
server and hard to undo in a browser.

>[!note] Port 443 always listens
>Every install serves HTTPS whether or not the redirect is on. Turning the
>redirect on decides whether plain HTTP is *refused*, not whether HTTPS is
>*available*.

## Set FOG_WEB_HOST before relying on HTTPS netboot

The boot script the installer writes chains to this server by hostname. But once
that first request reaches `boot.php`, FOG builds every subsequent boot URL — the
kernel, the init, the background image, `MOK.der`, the MokManager binary — from
the **`FOG_WEB_HOST`** setting in the web interface, not from the boot script.

On a first install `FOG_WEB_HOST` is seeded with the server's IP address, and
upgrades leave it alone. So on `public-cert` or `embed-ca` the first hop succeeds
over HTTPS and every later fetch is attempted against `https://<IP>/`, which
fails iPXE's name check.

**Set `FOG_WEB_HOST` to the same FQDN the certificate is issued to** — FOG
Configuration → FOG Settings → Web Server → `FOG_WEB_HOST` — whenever netboot is
on HTTPS. Nothing in the installer does this for you.

## Air-gapped networks

| You have | Use |
|---|---|
| No route to `ca.ipxe.org` from the boot VLAN | `embed-ca`, and enrol the MOK first |
| A public certificate but no outbound access | `standard` — netboot over HTTP |
| No requirement for netboot TLS | `standard`. This is the default for good reason |

Netboot over HTTP is not a security failure. The boot script and kernel are
served to a machine that has no secrets yet, on a network segment you control,
and FOG's Secure Boot signing is what establishes that the kernel is genuine —
not the transport. See [[fog-security|FOG Security]].

## See also

- [[pki-zones|FOG PKI Infrastructure]] — the three certificate zones and the layout on disk
- [[bringing-your-own-ca|Bringing Your Own CA]] — replacing FOG's authorities per zone
- [[external-ca-lets-encrypt|External CA & Let's Encrypt Certificates]] — ACME, step-ca and public certificates
- [[secure-boot-signing|Secure Boot Signing]] — how the signed chain is put together
- [[secure-boot-mok-enrollment|Secure Boot MOK Enrollment]] — enrolling this server's key on a client
- [[command-line-options|Fog installer command line options]] — every option named here
- [[install-fogsettings|The .fogsettings file]] — where these settings persist
- [[compile_ipxe_binaries|Compile iPXE binaries]] — building iPXE by hand
