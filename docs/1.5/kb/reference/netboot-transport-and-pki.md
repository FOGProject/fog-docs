---
title: Netboot Transport and PKI (1.5)
aliases:
    - Netboot Transport and PKI (1.5)
description: How FOG 1.5's single httpproto setting decides both the web protocol and the netboot protocol, and why it cannot be split the way FOG 1.6 splits it
context_id: netboot-transport-and-pki-1.5
tags:
    - reference
    - security
    - certificates
    - pki
    - netboot
    - ipxe
    - secure-boot
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[kb/reference/netboot-transport-and-pki|1.6 version]] of this page for FOG 1.6.

# Netboot transport and PKI (1.5)

A booting client and a browser are not in the same position. Your browser can be
told to trust FOG's certificate authority; iPXE, running out of firmware before
any operating system exists, cannot. On FOG 1.6 that asymmetry is handled by
letting the web UI and netboot use separately chosen protocols. **FOG 1.5 does
not make that split** — one setting, `httpproto`, decides the protocol for both
at once, along with whether iPXE gets rebuilt and whether Secure Boot is staged
at all.

This page covers what that one setting actually does. For what the
certificates themselves are and how they are laid out on disk, see
[[1.5/kb/reference/pki-zones|FOG PKI Infrastructure (1.5)]]. For the
vocabulary, see [[1.5/kb/reference/pki-glossary|PKI Glossary (1.5)]].

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

## One setting, three consequences

`httpproto` lives in [[1.5/management/server/install-fogsettings|.fogsettings]]
and is set with `-S`/`--force-https` (or left at its default, `http`, with
`--no-force-https`). There is no separate flag for the web UI, the HTTP→HTTPS
redirect, or netboot — all three come from this one value:

| `httpproto` | Web UI / API | HTTP→HTTPS redirect | Netboot | iPXE rebuild | Secure Boot staged |
|---|---|---|---|---|---|
| `http` *(default)* | HTTP | off | HTTP | no | **yes** |
| `https` | HTTPS | **on**, with HSTS | **HTTPS** | **yes, every install/upgrade** | **no — skipped entirely** |

Compare that to 1.6's four independent settings
(`WEB_url_proto`, `BOOT_url_proto`, `BOOT_rebuild_ipxe_with_my_ca`,
`WEB_https_redirect`) in
[[kb/reference/netboot-transport-and-pki#the-settings-underneath|the 1.6 version of this page]] —
on 1.5 none of those exist as separate knobs. Setting `httpproto=https` turns
all of them on together, with nothing in between.

## Turning on HTTPS always rebuilds iPXE

There is no `public-cert` shortcut on 1.5, and no `ca.ipxe.org` public-CA
detection path that skips the rebuild for a certificate from a public CA.
**Any time `httpproto` is `https`, the installer compiles iPXE locally**,
embedding this server's own CA (`pki/root/ca/.fogCA.pem`) so iPXE can validate
the vhost's certificate — whether that certificate came from FOG's own PKI or
from a public CA like Let's Encrypt makes no difference; the rebuild happens
either way, on every install and every upgrade.

That is meaningfully more expensive than 1.6's `standard` default: on 1.5,
choosing HTTPS at all means paying the local-compile cost every time, not just
when you specifically opted into embedding a private CA.

## Turning on HTTPS disables Secure Boot staging

>[!danger] HTTPS and Secure Boot are mutually exclusive on FOG 1.5
>When `httpproto` is `https`, the installer does not download or stage the
>signed Secure Boot chain (`secureboot/snponly-shimx64.efi`,
>`secureboot/snponly.efi`, MokManager, and so on) at all. The installer's own
>output says why: the staged binaries are upstream's generic, Microsoft-signed
>copies, and a locally rebuilt iPXE binary (which HTTPS on 1.5 always
>requires) cannot carry that signature — rebuilding it would invalidate a
>signature that only applies to the untouched upstream file. Rather than leave
>you a directory that looks usable and fails at the client with a TLS error,
>the installer skips it and says so.
>
>Secure Boot signing of the FOS kernels themselves still works — that part is
>independent of transport — but there is nothing signed for the client to
>chain through if you also want HTTPS netboot. If your site needs both, stay
>on HTTP for netboot (leave `httpproto` at `http`) and rely on FOG's own
>Secure Boot signing for kernel integrity instead of on HTTPS.

This is the exact limitation FOG 1.6 removed. See
[[kb/reference/netboot-transport-and-pki#secure-boot-is-prepared-in-every-mode|the 1.6 version of this page]]
for how: 1.6 stages the Secure Boot chain in every mode, because it stopped
tying the decision to whether the netboot binary needed a local rebuild at
all — 1.6 gets HTTPS netboot with no rebuild whenever the certificate chains
to a public root (`public-cert`), and reserves the rebuild for private CAs
only (`embed-ca`), neither of which exists on 1.5.

## The HTTPS redirect is not independently controllable

On 1.6, `WEB_https_redirect` is off by default even when the web UI is on
HTTPS, specifically so a fresh server with no clients that have inherited
trust yet doesn't lock plain HTTP visitors out. On 1.5, `-S`/`--force-https`
turns the redirect (and HSTS) on unconditionally, in the same step as
switching the web UI to HTTPS — there is no way to have HTTPS without the
redirect, or the redirect without HTTPS, on this line.

>[!note] Port 443 always listens
>As on 1.6, every install serves HTTPS whether or not `httpproto` is `https`
>— the vhost exists either way. What `httpproto` decides is whether plain
>HTTP is *redirected away from*, and whether netboot uses HTTPS at all.

## Air-gapped networks

| You have | Use |
|---|---|
| No requirement for netboot TLS | `httpproto=http` (the default). This also keeps Secure Boot available. |
| A hard requirement for HTTPS netboot | `httpproto=https` — accept the rebuild cost on every install/upgrade, and that Secure Boot cannot be staged alongside it |

Netboot over HTTP is not a security failure. The boot script and kernel are
served to a machine that has no secrets yet, on a network segment you
control, and FOG's Secure Boot signing (where you can have it — i.e. while
staying on HTTP) is what establishes that the kernel is genuine, not the
transport.

## See also

- [[1.5/kb/reference/pki-zones|FOG PKI Infrastructure (1.5)]] — the three certificate zones and the layout on disk
- [[1.5/kb/reference/bringing-your-own-ca|Bringing Your Own CA (1.5)]] — replacing FOG's authorities per zone
- [[1.5/kb/how-tos/secure-boot-signing|Secure Boot Signing (1.5)]] — how the signed chain is put together
- [[1.5/kb/how-tos/secure-boot-mok-enrollment|Secure Boot MOK Enrollment (1.5)]] — enrolling this server's key on a client
- [[installation/server/command-line-options|Fog installer command line options]] — every option named here (not yet forked for 1.5; check flags against `installfog.sh --help` on your branch)
- [[1.5/management/server/install-fogsettings|The .fogsettings file (1.5)]] — where `httpproto` persists
