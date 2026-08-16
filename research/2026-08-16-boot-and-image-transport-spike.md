# Transport modernisation spike: boot path and image path

**Status:** investigation spike — no implementation proposed
**Date:** 2026-08-16
**Prompted by:** [fogproject#1043](https://github.com/FOGProject/fogproject/pull/1043)

> **Which tree each finding was verified against matters here.** `dev-branch` (1.5.x) and
> `working-1.6` diverge substantially in this area — `functions.sh` is 5963 lines on one and 8645
> on the other, and several findings below hold on one branch and not the other. Citations are
> tagged **(1.5.x)** or **(1.6)**. Untagged ones hold on both.
>
> The largest single divergence: **`working-1.6` has already split the netboot protocol from the
> global one.** Anything below about `--force-https` forcing the whole chain onto HTTPS is a
> 1.5.x statement. See "What working-1.6 already solved".

---

## Why this exists

PR #1043 (Secure Boot signing for local ESP boot) asserted in passing that HTTP is the preferred
transport over TFTP for PXE artifacts. That raised two questions worth answering properly:

1. How much of FOG's boot chain could move to HTTP or HTTPS, and what would that cost admins?
2. Once transports are on the table — is the image data path, NFSv3 since forever, leaving
   performance or security on the table?

**These are independent workstreams.** They share only the word "transport", would ship as
separate PRs on separate schedules, and neither depends on the other. They are in one document
because they were investigated together, not because they belong together.

### One correction to #1043

The PR says "iPXE's docs favour it over TFTP." ipxe.org does not state that as a documented
recommendation — that was checked. The substance holds (HTTP is faster for bulk transfer and is a
large part of why iPXE exists), but the appeal to authority was thinner than written.

---

# Part A — Boot transport

## FOG is already almost entirely HTTP

This reframes the whole question.

| Hop | Transport |
|---|---|
| 1. DHCP → `next-server` + `filename` | TFTP |
| 2. Firmware fetches `snponly.efi` / `undionly.kkpxe` | TFTP |
| 3. iPXE embedded script → `default.ipxe` | TFTP |
| 4. `default.ipxe` → `boot.php` | **HTTP/HTTPS already** |
| 5. Boot menu → `bzImage`, `init.xz` | **HTTP/HTTPS already** |

Hop 4 is `configureDefaultiPXEfile()` — `functions.sh:824` (1.5.x), `:1525` (1.6). Hop 5 is
`bootmenu.class.php` `$_booturl` — `:392` (1.5.x), `:468` (1.6). Hop 3 lives in the iPXE scripts
(`fog-ipxe/src/ipxescript:32`, `src-efi/ipxescript:32`, the two `10sec` variants, and
`autoexec.ipxe:54`), all ending in `chain tftp://${next-server}/default.ipxe`.

**The bulk payload already moves over HTTP.** Hops 1–3 carry roughly 1 MB of network bootstrap
program plus a 700-byte script. There is **no throughput argument** for moving them, and any
proposal claiming one will be measured and found wrong.

The real arguments are different, and they are good ones:

- **Remote sites over a WAN or site-to-site VPN**, where TFTP degrades badly — see
  "Imaging across a VPN" below. This is the most concrete of the three.
- Firmware that has HTTP Boot but no working PXE ROM — the same class of machine #1043's local
  ESP boot exists for.
- Removing a UDP service from the boot path.

## What working-1.6 already solved

**`working-1.6` has already split netboot's protocol from the global one**, as part of the
three-zone PKI separation work (`docs/superpowers/specs/2026-08-07-three-zone-pki-separation-design.md`
and its plan). Verified in the tree:

| Piece | Location (1.6) |
|---|---|
| `--netboot-proto http\|https` installer flag | `installfog.sh:503`, applied `:769` |
| `_resolveNetbootProto()` | `functions.sh:4952` |
| `default.ipxe` uses `${netbootproto}` | `functions.sh:1534` |
| Persisted as a managed key | `functions.sh:4231` |
| Apache/nginx redirect exclusion when the two differ | `functions.sh:5900`, `:6100` |

The defaulting logic:

```sh
_resolveNetbootProto() {
    [[ -n $netbootproto ]] && return 0
    if [[ $httpproto == https && $externalca != yes && $caCreated != yes ]]; then
        netbootproto="http"
    else
        netbootproto="$httpproto"
    fi
}
```

So on a fresh HTTPS install using FOG's own CA, **netboot already drops to plain HTTP by
default** — because HTTPS netboot simply fails there, and HTTP is a strict improvement. An
external-CA install (Let's Encrypt) keeps `netbootproto=https`.

### The gap: three gates never got the memo

The split reached `default.ipxe` but **not** the three places that decide how iPXE binaries are
provisioned. All three still test `$httpproto` (1.6):

| Line | Function | Effect when `httpproto=https` |
|---|---|---|
| `:1630` | `downloadipxe()` | skips downloading the prebuilt release asset |
| `:1701` | `downloadipxesecureboot()` | **skips staging the Secure Boot chain** |
| `:1728` | `configureTFTPandPXE()` | compiles iPXE locally with `TRUST=` |

On the split's own default configuration — `httpproto=https`, `netbootproto=http` — all three
take the HTTPS branch even though iPXE will never open a TLS connection. Consequences:

1. Two clones and eight `make` invocations, with no warm path, for a binary whose baked-in CA is
   never used.
2. The Secure Boot chain is skipped, reporting `Skipped (not usable with HTTPS)` — a reason that
   is **no longer true**. The comment above it still explains the old rationale:
   *"A signed binary cannot be rebuilt without invalidating the signature, so Secure Boot and
   HTTPS are mutually exclusive here."* That was correct before the split. It is now stale, and
   the effect is that a default HTTPS install silently has no Secure Boot netboot chain.

Ordering compounds it: `_resolveNetbootProto()` is called at `:1533` from
`configureDefaultiPXEfile()`, which `configureTFTPandPXE()` does not invoke until `:1822` — well
after the gates at `:1720`, `:1721` and `:1728`. `$netbootproto` is not even resolved when they
run.

### Why this is not a one-line fix

**`netbootproto` does not exist in the web tier at all** — it appears nowhere under
`packages/web/`. `bootmenu.class.php:468` still builds `$_booturl` from `self::$httpproto`.

So today's boot chain works *because* the gates are wrong: iPXE is built with the CA baked in, so
when the HTTP-fetched `boot.php` hands back a menu full of `https://` URLs, iPXE can still open
them. Changing the three gates to follow `$netbootproto` **without** teaching the web tier the
same distinction would produce an iPXE with no CA being handed HTTPS URLs — trading a wasteful
build for a broken boot.

Any fix has to move both halves together. Filed as
[fogproject#1096](https://github.com/FOGProject/fogproject/issues/1096).

### On 1.5.x this is all still ahead

`dev-branch` has no `netbootproto`. `functions.sh:985` (1.5.x) triggers the local build for any
`--force-https` install, passing `TRUST=${sslpath}CA/.fogCA.pem` — hardcoded, where 1.6 passes
`$sslcachain`/`$sslcapem` (`:1736`). Per ipxe.org, iPXE's default root CA cross-signs Mozilla's
public CA list and `TRUST=` *replaces* rather than extends it, so on a Let's Encrypt 1.5.x server
this should yield a binary that trusts only the FOG CA and rejects its own web server. It
demonstrably works in production for LE users, so either `-S` was not used or `.fogCA.pem` was
absent and `buildipxe.sh` fell through to an empty `TRUST=`. **Worth determining which** — if the
second, it works by accident.

## Imaging across a VPN

Asked directly, and the answer splits by phase — which is what makes it look impossible when it
is not.

| Scenario | Boot phase | Image phase |
|---|---|---|
| Client / user VPN | **Impossible** | n/a |
| Site-to-site VPN | Works | Works |
| USB boot media | Works | Works |

**Client VPN cannot work, and not for a FOG reason.** PXE runs in firmware before any OS exists,
and DHCP is a broadcast protocol. There is nothing for a tunnel to live in.

**Site-to-site is ordinary routing.** DHCP is served at the remote site; the FOG server is reached
across the tunnel. This is the case that most justifies HTTP boot: **TFTP over a tunnel is
genuinely bad** — lockstep UDP, an acknowledgement per block, no congestion control, degrading
hard with latency and loss, which is exactly what a WAN link has. HTTP over the same link is far
more robust.

**FOS cannot bring up a tunnel itself.** Verified in the `fos` kernel configs: `CONFIG_TUN`,
`CONFIG_WIREGUARD`, `CONFIG_PPP`, `CONFIG_INET_ESP` and `CONFIG_XFRM_USER` are all unset, and
every Buildroot VPN package (`openvpn`, `strongswan`, `wireguard`, `ipsec-tools`) is off. Without
`CONFIG_TUN` even a userspace VPN is impossible. **"Boot locally, then tunnel from FOS" is
rejected** — it needs a kernel rebuild plus a credential channel into the init, and site-to-site
already solves the problem. Recorded here so it is not re-proposed.

**Predownloading kernel and init is already solved**: `fos` ships `create-usb-image.sh`, which
builds a bootable stick from released `bzImage`/`init.xz` plus iPXE and memdisk. That removes the
boot phase from the network entirely.

**WAN exposure is a separate question, and authentication is the blocker.** FOG has no
authentication on image access at all — the NFS export is a `*` wildcard with `all_squash`.
Exposing that is not an option. HTTPS deploy with a per-task token would be the *prerequisite*
that makes WAN-side imaging conceivable, which reframes HTTP(S) deploy (Part B) as a security
capability rather than a transport swap.

Out of scope but worth knowing: post-image AD domain join needs line-of-sight to a DC (Kerberos
88, LDAP 389, SMB 445), and the fog-client performs it inside Windows where a user-initiated VPN
is not yet up. Pre-logon device tunnels or Entra join are the escapes.

## Does this change boot-order options? Yes

UEFI HTTP Boot is a **separate boot-manager entry**, not a mode of the PXE entry. Vendors gate it
behind its own Network Stack toggle — on Lenovo, `Network → Network Stack Setting → IPv4 HTTP
Support` reveals the `HTTP Boot Configuration` page. A machine can carry both a PXE entry and an
HTTP Boot entry, ordered independently.

More useful: **Dell and Lenovo both support a static boot URI configured in firmware.** Dell calls
it Manual mode; a URI entered there *overrides* whatever DHCP supplies, and leaving it blank falls
back to DHCP.

That means **HTTP Boot can be piloted with zero DHCP change** — configure the URI on the handful
of machines that need it, leave the TFTP scope untouched, and the two coexist with no policies, no
classes, no option-60 conflict. For the machines this is actually aimed at, that may be the whole
answer.

## DHCP options, side by side

| | Legacy BIOS PXE | UEFI PXE (TFTP) | **UEFI HTTP Boot** |
|---|---|---|---|
| Opt 93 client arch | `0` | `6`, `7`, `8`, `9` (x86/x64), `11` (arm64) | `15` (x86), **`16` (x64)**, `18`/`19` (arm) |
| Opt 60 *sent by client* | `PXEClient:Arch:00000:…` | `PXEClient:Arch:00007:…` | `HTTPClient:Arch:00016:…` |
| Opt 60 *in server reply* | not needed¹ | not needed¹ | **`HTTPClient` — required** |
| Opt 66 next-server | FOG server IP | FOG server IP | **unused** |
| Opt 67 bootfile | `undionly.kkpxe` | `snponly.efi` | **full URL** |
| Wire transport | TFTP, UDP/69 | TFTP, UDP/69 | HTTP, TCP/80 |
| FOG today | ✅ emitted | ✅ emitted | ✗ not offered |

¹ Only needed as `PXEClient` when the DHCP server is colocated with WDS.

### What FOG emits today

From `_keaBaseClasses()` — `functions.sh:5395` (1.5.x), `:8083` (1.6); mirrored in the ISC branch.
Every one is `PXEClient` plus a bare TFTP filename:

| Kea class | Arch test | Boot file |
|---|---|---|
| `FOG-Legacy-BIOS` | `00000` | `undionly.kkpxe` |
| `FOG-UEFI-32-1` / `-32-2` | `00006` / `00002` | `i386-efi/snponly.efi` |
| `FOG-UEFI-64-1` / `-2` / `-3` | `00007` / `00008` / `00009` | `snponly.efi` |
| `FOG-UEFI-ARM64` | `00011` | `arm64-efi/snponly.efi` |
| `FOG-Surface-Pro-4` | `00007:UNDI:003016` | `snponly.efi` |
| `FOG-UEFI-64-SecureBoot` | `00007` | `secureboot/snponly-shimx64.efi` — **commented out** |

**Most installs are rows 1 and 3.** An HTTP Boot addition is a **parallel set** keyed on
`HTTPClient` with a URL-valued option 67. It displaces nothing. The commented-out pattern is
`_keaSecureBootClassCommented()` — `:5467` (1.5.x), `:8155` (1.6) — and is the precedent to follow
for emitting something inert by default.

### Three traps

- **Arch 7 vs 9.** RFC 4578 calls `7` "EFI BC" and `9` "EFI x86-64", but essentially all 64-bit
  UEFI firmware reports `7`. dnsmasq's *names* for 7 and 9 are reversed relative to the RFC —
  already documented in `docs/installation/network-setup/proxy-dhcp.md`. Prefer bare numbers.
- **Option 60 is the coexistence blocker, not architecture.** One scope cannot answer both
  `PXEClient` and `HTTPClient`. That, and only that, forces classes when both must coexist.
- **Windows has no option 60** in its standard list unless WDS is installed. Define it once at
  server level (`Add-DhcpServerv4OptionDefinition`) before anything else.

## What adopting this costs an admin

| Situation | Cost |
|---|---|
| Static URI in firmware | **zero DHCP change** |
| All clients HTTP-Boot capable | 2 scope options (+ one-time option 60 definition on Windows) |
| Already mixed BIOS/UEFI with policies | +1 policy, the simplest in the set |
| Single-option today, want HTTP *and* TFTP | 0 → policies. The only real jump. |

The HTTP rule is the *cheapest* to write: the vendor class starts with `HTTPClient` rather than
`PXEClient`, so one wildcard condition catches every architecture with no `Arch:0000N`
enumeration. The opposite of the BIOS/UEFI split, which needs a policy per architecture.

### proxyDHCP works — and here is the trick

This was the gating unknown, since proxyDHCP is a large share of FOG installs. **dnsmasq can serve
UEFI HTTP Boot in proxyDHCP mode.** Working configuration from the
[dnsmasq-discuss thread](https://www.mail-archive.com/dnsmasq-discuss@lists.thekelleys.org.uk/msg16282.html):

```
dhcp-range=192.168.1.200,proxy
dhcp-pxe-vendor=PXEClient,HTTPClient:Arch:00016
dhcp-vendorclass=set:efihttp,HTTPClient:Arch:00016
pxe-service=tag:efihttp,x86-64_EFI,"Network Boot",<url>
dhcp-boot=tag:efihttp,<url>
dhcp-option-force=tag:efihttp,60,HTTPClient
```

Three things any documentation must carry:

1. **`dhcp-pxe-vendor` is the whole trick.** In proxy mode dnsmasq only answers vendor classes it
   recognises as PXE, and `HTTPClient` is not one by default — without this line the proxy stays
   silent and the failure looks like nothing happening at all.
2. **Both `pxe-service` and `dhcp-boot` are set**, matching the existing warning in
   `proxy-dhcp.md` that for UEFI clients the `pxe-service` lines decide the file.
3. **An unexplained inconsistency.** `dhcp-pxe-vendor` was reportedly *not* needed for arches
   `00007` and `00009`, only `00016`. Nobody in the thread knows why. Document it as observed and
   tell admins to add the line regardless — it is harmless when unnecessary.

**Open:** minimum dnsmasq version for `dhcp-pxe-vendor` (2.85 mentioned in a related iPXE
discussion, unconfirmed).

## File layout: should boot files move under the web root?

**Recommendation: keep `/tftpboot` primary.** The evidence against inverting is strong and mostly
already in the tree:

1. **Symlinks are already rejected for TFTP-served content.** `configureTFTPandPXE` hard-links
   `autoexec.ipxe` into four arch subdirectories — `functions.sh:1031-1044` (1.5.x), `:1766` (1.6)
   — commenting *"Not a symlink -- some TFTP daemons refuse to follow those."* Hard links cannot
   cross filesystems.
2. **SELinux labels the two trees differently by design.**
   `setSELinuxContext "$tftpdirdst" tftpdir_t tftpdir_rw_t var_t` — `:1086` (1.5.x), `:1830` (1.6)
   — versus `httpd_sys_content_t` for the web tree, and `SELinux/fog.te` grants `tftpd_t` **no**
   access to `httpd_sys_content_t`. A hard link cannot hold two labels, and `restorecon -RF`
   (`:2481` on 1.6) walks the TFTP tree relabelling what it finds.
3. **`in.tftpd -s $tftpdirdst` chroots** (`:1852` on 1.6). Inverting changes the chroot contents.
4. **The `.prev` snapshot copies the whole tree on every install.** If that tree were the web app,
   every install would duplicate the web app.
5. **The project already answered this once.** `_publishSecureBootKit()` — `:5195-5201` (1.5.x),
   `:7437`/`:7483-7484` (1.6) — **copies** `mmx64.efi` into the web tree rather than linking,
   because *"the TFTP tree may be on a different filesystem."*

Keeping #1043's symlink is still right — a link cannot drift and it brings the whole variant
matrix (~45 `.efi` files), where the copy precedent was for two small binaries. But it should be
hardened (next section).

**A fourth option, if exposure concern grows:** publish a *dedicated minimal directory* under the
web root containing only the `.efi` files HTTP Boot needs, populated by copy.

## Security finding: PHP execution through the symlink

**This belongs in #1043, not in any later HTTP Boot work.** It holds on **both** branches.

The PHP handler is declared at **VirtualHost scope**, immediately after `<VirtualHost *:80>` and
before `DocumentRoot` — not inside a `<Directory>`:

```apache
<VirtualHost *:80>
    <FilesMatch "\.php$">
        SetHandler "proxy:fcgi://127.0.0.1:9000/"
```

`functions.sh:4169` and `:4244` (1.5.x); `:6045-6051`, `:6111` and `:6238` (1.6, three emission
sites). It matches on filename with no path component, so it **applies through symlinks**. #1043's
`signed-pxe-boot-files` link therefore makes any `.php` in `/tftpboot` *executable*, not merely
downloadable. Nothing there is PHP today, and #1043 deliberately avoided adding an `index.php` —
but the PR's documented residual ("anything an admin later drops in becomes web-reachable")
understates it for that one extension.

**Fix:** a `<LocationMatch>` on the published path with `SetHandler None`. `LocationMatch` rather
than `Directory`, for the reason already spelled out in the tree (see the `maintenance/` block at
`:6071-6077` on 1.6). Two lines, alongside the `-Indexes` emissions #1043 already adds.

Two accuracy notes:

- `Options`, `-Indexes`, `FollowSymLinks` and `autoindex` appear **nowhere** in the 1.5.x tree;
  directory-listing behaviour is inherited from the distro's stock config. #1043 introduces them.
- **nginx: branch-dependent.** 1.5.x emits no nginx vhost anywhere despite nginx-shaped comments —
  do not claim nginx parity there. **1.6 does support nginx** properly (`_emitFastcgiBody` at
  `:4468-4508`, `ssl_certificate` handling at `:5230`, vhost selection at `:5465`), so any fix on
  1.6 needs both branches written.

## Attack surface: TFTP versus HTTP

**The trust model does not change.** Neither TFTP nor plain HTTP authenticates or
integrity-protects anything. What stops a hostile NBP executing is the signature check. The
security story is Secure Boot, and it is transport-independent. Framing this as "HTTP vs TFTP
security" is the wrong frame.

**Where surface genuinely grows is client firmware.** UEFI HTTP Boot pulls a TCP stack, an HTTP
client, a URI parser and — with an FQDN — a DNS resolver into pre-boot, at the highest privilege
level, in rarely-patched code.
[PixieFail](https://blog.quarkslab.com/pixiefail-nine-vulnerabilities-in-tianocores-edk-ii-ipv6-network-stack.html)
(nine CVEs in EDK2's NetworkPkg, affecting AMI, Insyde, Phoenix, Intel, Microsoft) shows that
code's quality. Two land disproportionately here:

- **CVE-2023-45236** — predictable TCP initial sequence numbers. Only matters if the boot
  transport is TCP. TFTP is UDP.
- **CVE-2023-45237** — weak PRNG enabling DNS and DHCP poisoning. Only matters if boot involves
  DNS. TFTP takes an IP from option 66.

*Stated honestly:* Quarkslab's writeup covers PXE/TFTP and does not discuss HTTP Boot. That these
flaws become reachable when the transport changes is inference from the shared NetworkPkg stack,
not their finding.

**Server side is roughly a wash, arguably better.** Apache already serves `bzImage` and `init.xz`
unauthenticated on every boot, so no new daemon, port or code path. TFTP's UDP/69 is a known
amplification and reflection vector; TCP/80 is not. Apache access logs beat tftpd's near silence.
The genuine delta is **reach**.

## UEFI HTTPS Boot: out of scope, and Let's Encrypt does not change that

The intuition is that a publicly-trusted certificate should just work. It does not.
[Dell's HTTPs Boot guide](https://www.dell.com/support/manuals/en-us/bios-connect/https_ug/upload-the-ca-certificate)
requires uploading the CA in BIOS Setup from a USB stick: `.pem`, X.509 2048-bit, **exactly one
certificate, not a bundle**. Firmware ships no public root store; `TlsCaCertificate` starts empty.
ISRG Root X1 is as foreign to that firmware as a self-signed FOG CA.

The enrolment cost is identical either way, and it is per-machine physical presence — the same
wall as ADR-0009's MOK enrolment, with worse tooling. **Recommend against pursuing.** Plain HTTP
Boot at the firmware layer remains the interesting option.

---

# Part B — Image transport

## Field data first: transport is not the bottleneck

Production numbers from a maintainer's fleet, which reframe everything below.

**The rate FOG reports is decompressed bytes, not wire bytes.** `partclone.restore` sits
downstream of `zstdmt -dc` / `pigz -dc` in `fos` `funcs.sh:843` and `:862`, so it measures data
written to disk. 1 GbE caps wire throughput at 125 MB/s = **7.5 GB/min**.

| Population | Reported | Implied wire | Verdict |
|---|---|---|---|
| Physical clients, 1 GbE | 8–16 GB/min | 7.5 GB/min at 1.07–2.1× compression | **wire-saturated** |
| ESXi VM, same vCenter / Nimble dHCI | 20+ GB/min | ~1.3–2.7 Gbps on vmxnet3 | CPU/disk-bound |

Every implied ratio is an ordinary zstd result for a Windows image. **The 1 GbE clients are
saturating their NICs**, and the 8→16 spread is mostly image compressibility, not transport
variance. The VMs are nowhere near their virtual NIC and are bound by decompression or disk.

**Neither population is transport-limited, so no candidate below helps either one.** That is the
honest headline, and it should survive any later enthusiasm for a specific protocol.

**What would actually help:**

- Wire-bound clients: faster NICs (2.5/10 GbE), or a **higher zstd capture level** — trading
  one-time server CPU for wire bytes on every subsequent deploy, which is a good trade precisely
  when clients are wire-bound. Multicast sidesteps per-client bandwidth entirely.
- VM population: profile decompression versus disk. Note `zstdmt -dc` is often effectively
  single-threaded on decompress regardless of the `mt`, so core count may not be helping.

**Cheapest confirmation:** compare on-disk image size against logical partition size to get the
real compression ratio, then check reported-rate ÷ ratio against 7.5 GB/min. If it lands there,
the diagnosis is proven and the entire NFS-tuning branch below is moot for that population.

## The decisive structural finding: partclone constrains nothing

partclone has no network capability and never needed any. It reads a stream on stdin and writes
with `-O <target>`. FOG already isolates it behind a FIFO — `fos` `funcs.sh writeImage()`:

```sh
mkfifo /tmp/pigz1
case $mc in
    yes) udp-receiver … >/tmp/pigz1 & ;;      # multicast
    *)   cat $file >/tmp/pigz1 & ;;           # unicast — the ONLY network step
esac
zstdmt -dc </tmp/pigz1 | partclone.restore --ignore_crc -O ${target} -Nf 1
```

**The entire unicast deploy transport is `cat $file`.** Everything downstream is protocol-blind,
and multicast already proves the seam works — udpcast substitutes for `cat` and nothing else
changes. An HTTP deploy would be `curl -sf "$url" >/tmp/pigz1 &` in the same `case`.

Two constraints belong next to that:

**Do not use `dd`.** partclone is sparse-aware — it copies only used blocks. A raw `dd`-style
stream would move a 500 GB partition to transfer 50 GB of data.

**Metadata, not bulk data, binds FOG to a mounted filesystem.** Deploy reads many small files *by
path* from `$imagePath`: `d1.fixed_size_partitions`, `d1.mbr`, `d1.grub.mbr`, `d1.has_grub`, the
sfdisk dumps, `.lvm`/`.lvm.vgcfg` sidecars, swap UUID files, EBRs. Split images add a glob
(`sys.img.*`) that `cat` expands in order; an HTTP path would have to enumerate chunks explicitly.
The mitigating factor: per FOS `CLAUDE.md` the `*FileName()` helpers are already the single source
of truth for sidecar paths, which makes swapping the metadata access layer tractable rather than a
scattered rewrite.

## Candidate assessment

Reassessed against the field data above — the "role" column is what changed.

| Candidate | Role | Server cost | Client cost | Throughput benefit |
|---|---|---|---|---|
| HTTP(S) deploy | **Best long-term default — for security/reach** | none (Apache exists) | moderate | ~none vs NFS |
| Raise `rsize`/`wsize` | Worth measuring, **VM population only** | none | ~1 line | unknown, possibly nil |
| `nconnect` (v3 or v4.1+) | Opt-in, 10 GbE+ only | none | high¹ | none at 1 GbE |
| NFSv4.1/4.2 | Opt-in — **firewall/security, not speed** | none² | high¹ | ~none |
| SMB3 + multichannel | Opt-in — **strongest security** | admin's | low³ | none on single-NIC 1 GbE |
| pNFS | Niche | admin's | high¹ | none at 1 GbE |
| iSCSI | Narrow, caveated | admin's | very high | n/a — wrong shape |

¹ All share one prerequisite — see below. ² Beyond confirming `nfsd` serves v4, which it does by
default. ³ Client is already built in — but see the credential problem.

**Recommended default: keep NFSv3.** Not because it is fast, but because nothing else is faster
for these workloads and it needs no new infrastructure. HTTP(S) deploy is the better long-term
default on **security and reach** grounds, not performance.

### HTTP(S) versus NFS, concretely

Both are bulk TCP; expect within a few percent. HTTP has a mild structural edge — no per-read RPC
round trip, server-side `sendfile()` zero-copy, no `rsize` chunking ceiling. NFS at
`rsize=32768` issues an RPC every 32 KiB, roughly 10,000/sec at the VM rate, which is the one
place a measurable difference could appear.

HTTPS adds AES-GCM cost: with AES-NI, roughly 10–30% of one core at the VM throughput. Not a
throughput limiter on modern hardware; potentially visible on old thin clients.

The reasons to want it are encryption, WAN/proxy traversal, one less daemon, range-request resume
— and, per Part A, **it is the prerequisite for authenticated remote imaging**.

### SMB3 multichannel — security yes, speed no

`CONFIG_CIFS=y` and `BR2_PACKAGE_CIFS_UTILS=y` are already in FOS and entirely unused, so the
client costs nothing to enable. `mount.cifs` documents `multichannel` and `max_channels=N`.

SMB3 brings encryption (`seal`), signing and per-user authentication — **the strongest security
answer on this list**, against an NFSv3 export that currently has none of those.

But **multichannel gives nothing on a single-NIC 1 GbE client**. It scales one client across
multiple NICs, RSS queues or a faster link. Multiple TCP connections over one 1 GbE link do not
create bandwidth, and it does not improve server-side aggregate across many clients either — a
10 GbE server already serves ~10 such clients at line rate under NFSv3. With one NIC there is not
even a failover path.

**Blocking problem, and it is not multichannel's fault:** `$storage` reaches FOS via
`/proc/cmdline`, which is **world-readable**. NFS needs no credentials, so this has never
mattered. SMB does. Passing `username=`/`password=` the same way would expose them to every
process on the client and to anything that captures the kernel cmdline. Any SMB proposal needs a
credentials file fetched over HTTPS, or `sec=krb5`, **first**. This is a harder blocker than
anything else in this section.

Worth establishing whether the existing CIFS build is deliberate or vestigial.

### NFSv4 — firewall and security, not throughput

v4 gives essentially no throughput gain over v3 for large sequential reads, and compound-op
overhead can make it marginally slower. The feature people associate with it, `nconnect`, **works
on v3 too** (Linux, kernel 5.3+), so it is not a reason to migrate — and it only pays where a
single TCP connection cannot saturate the link, which is a 10 GbE-and-up problem.

The real wins are operational: collapsing to **a single port 2049** removes the rpcbind/statd/
mountd holes — `functions.sh:1894-1906` (1.5.x) / `:2682-2688` (1.6) opens `2049/tcp`,
`111/tcp+udp` and `20048/tcp+udp`, and a whole block exists purely to pin mountd's port so it can
be firewalled (`:2450-2470` on 1.5.x, `:2685` on 1.6). It also makes `sec=krb5` conceivable
against today's export — a `*` wildcard with `all_squash` and no `sec=` at all
(`functions.sh:2488` on 1.5.x, `:3344` on 1.6, which already writes `fsid=0`, the NFSv4
pseudo-root marker; the server is accidentally half-configured for v4 today).

### The one prerequisite gating every NFS improvement

Harder than "does BusyBox pass the option through."

BusyBox's `util-linux/nfsmount.c` implements its own MOUNT RPC and fills the legacy binary
`struct nfs_mount_data`. It special-cases the filesystem name `"nfs"`, so `strcmp("nfs","nfs4")`
never matches and **BusyBox cannot mount NFSv4 at all**. (Its `NFS_MOUNT_VERSION 4` is the
*struct* version, not the protocol — an easy misread.) `nconnect` is parsed only on the kernel's
text-based mount path, which the binary struct cannot express.

So `nconnect`, NFSv4.1/4.2 and pNFS **all require the same single change**: add `nfs-utils`
(`mount.nfs`) or `util-linux mount` to the Buildroot config and disable BusyBox's NFS helper.
`BR2_PACKAGE_NFS_UTILS` and `BR2_PACKAGE_UTIL_LINUX_MOUNT` are both unset today. Kernel support is
already present and unused: `CONFIG_NFS_V4_2=y`, `CONFIG_PNFS_*=y`, kernel 6.18.38 — well past
`nconnect`'s 5.3 floor.

Given the field data, **this prerequisite is now hard to justify on throughput grounds alone**. It
should be priced against the *security* case (v4 + `sec=krb5`) rather than a speed case.

### The `rsize` question

`fos` `bin/fog.mount`, verified firsthand:

```sh
up)   mount -o nolock,proto=tcp,rsize=32768,wsize=32768,intr,noatime "$storage" /images ;;
down) mount -o nolock,proto=tcp,rsize=32768,intr,noatime "$storage" /images ;;
```

This caps transfers at 32 KiB where a modern kernel would negotiate far higher. **Only relevant to
the non-wire-bound population** — it cannot help a client already saturating its NIC.

> **ADR-0013 is both precedent and warning.** That ADR documents a kernel config default, off
> since 2016, that cost a measured 5x deploy throughput on RTL8168h (1.2 → 6.5 GB/min) — found
> only because someone measured. `rsize=32768` has the same shape: an old explicit value that may
> have been right for 2010-era NFS, and the same trap in reverse — the number looks deliberate, so
> nobody questions it. **Measure before claiming.**

Also unexplained: deploy sets `rsize` only while capture sets both. Nothing documents why.

### iSCSI — admissible as a narrow opt-in, never a default

Most expensive to enable: `CONFIG_ISCSI_TCP` is not set and `open-iscsi` is absent, so it needs
kernel *and* userspace additions and a FOS rebuild.

With admin-owned infrastructure the provisioning objection disappears; the **sharing model
objection does not**. Block-level access has no concurrency control, and initiators cache blocks
without invalidation, while FOG's image store has writers — captures and replication. Admissible
only where the admin guarantees a frozen read-only LUN or SAN-side thin clones per client. CHAP is
a weak security argument next to SMB3 `seal` or NFSv4 `sec=krb5`.

## Where the optional config lives

Once transport is explicitly admin-selected, **a per-storage-node field is the right
abstraction.** Capability negotiation is the wrong tool: the question is not "what can both ends
do" but "what infrastructure does this admin have." A node backed by an SMB3 NAS and one backed by
plain NFS can coexist in one install.

`nfsGroupMembers` today has `ip`, `path`, `ftppath`, `snapinpath`, `webroot`, `user`/`pass` —
**no protocol, port or version field at all**. Transport is implied by which field a caller reads.
The addition is a transport column plus somewhere for mount options, defaulting to current
behaviour so existing nodes keep working.

The other places needing the field:
`maintenance/create_update_node.php` (`:69` on 1.5.x; the `ftppath`/`webroot` set-calls at
`:100-124` on 1.6), and the storage-node form — `storagemanagementpage.class.php:299-315`/`:523-539`
on 1.5.x, but **note this page was split on 1.6** into `storagegroupmanagement.page.php` and
`storagenodemanagement.page.php`; the node fields live in the latter (`:66`, `:78`, `:80`,
`:145-149`).

The client-side half: `$storage` reaches FOS from `/proc/cmdline` as an opaque `host:/path` with
**no scheme**. Giving it a scheme is the minimal change; ADR-0011's extended-checkin path is
tidier and already sanctioned for this class of server-known task data. Keep the
`getversion.php?caps=1` precedent (`fos funcs.sh:3488`) for what it is good at — letting an older
init *refuse* a transport it does not understand, rather than choosing one.

**Related wart:** node health is a **TCP connect to the FTP port**, so a node with FTP down is
marked offline and gets no tasks even when NFS and HTTP are healthy. Adding transports makes that
check more wrong, not less.

## Documentation blast radius

15 pages under `docs/` mention NFS. The ones that would actually change:
`kb/reference/network-and-firewall-requirements.md` and `kb/how-tos/firewall.md` (NFSv4 collapsing
to a single port is a genuine simplification), plus `management/web/storage-node.md` if a per-node
transport field is added.

---

# Open questions

1. Which Let's Encrypt install path is actually in use on 1.5.x, given the `TRUST=` analysis?
2. Is `rsize=32768` the bottleneck for the non-wire-bound population, or is it disk / partclone /
   zstd? And why is deploy `rsize`-only while capture sets both?
3. What minimum dnsmasq version does `dhcp-pxe-vendor` need, and why do arches `00007`/`00009` not
   require it while `00016` does?
4. Is `CONFIG_CIFS=y` + `cifs-utils` in FOS deliberate or vestigial?
5. Is `nfs-utils` or `util-linux mount` the smaller Buildroot addition, and what does either cost
   in init size? (Now a security-case question, not a throughput one.)

# Testing required

None of this is verifiable without hardware.

**Part A**
1. A dnsmasq proxyDHCP instance serving `HTTPClient` to a real UEFI client — a *confirmation* of
   the published config above, and where to pin the `dhcp-pxe-vendor` version floor.
2. A Windows DHCP server with and without policies, confirming the two-option case.
3. A Dell or Lenovo machine with a static firmware boot URI, confirming zero-DHCP-change
   operation.
4. `curl` against a `signed-pxe-boot-files/*.php` path before and after the `SetHandler None` fix.
5. **On 1.6:** a `--force-https` install with FOG's own CA, confirming the Secure Boot chain is
   absent from `/tftpboot/secureboot/` and that iPXE was rebuilt despite `netbootproto=http`.

**Part B**
1. **First, and gating everything else:** the compression-ratio check above. Until reported-rate ÷
   ratio is compared against 7.5 GB/min, no throughput claim in this section can be evaluated.
2. An instrumented deploy at `rsize=32768` versus raised versus unset — same hardware, same image,
   with disk and the zstd stage instrumented too, so a CPU-bound result is not misread as a
   network win. Only meaningful on the non-wire-bound population.
3. A proof-of-concept `curl -sf "$url" >/tmp/pigz1 &` substituted into `writeImage()`'s `case`.
   Cheap, and it either validates the seam or kills the idea.
4. SMB3 with `multichannel,max_channels=8` on a multi-NIC or 10 GbE client. Single 1 GbE is
   expected to show nothing — confirm cheaply so this document can cite a number.

# Explicitly out of scope

- **UEFI HTTPS Boot.** Firmware CA enrolment is impractical at fleet scale; Let's Encrypt does not
  help.
- **Removing TFTP.** Legacy BIOS PXE ROMs speak TFTP only; `in.tftpd` stays regardless. Every
  proposal here is additive and opt-in.
- **VPN support inside FOS.** Rejected on evidence — see "Imaging across a VPN".
- **Any code change.** This document is for discussion first.
