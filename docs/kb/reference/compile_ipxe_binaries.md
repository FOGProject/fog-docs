---
title: Compile iPXE binaries
aliases:
    - Compile iPXE binaries
    - Build iPXE
    - buildipxe.sh
description: How FOG builds its iPXE binaries, how to build your own, and what embedding a CA costs you under Secure Boot
context_id: compile_ipxe_binaries
tags:
    - reference
    - ipxe
    - netboot
    - secure-boot
    - linux
---

# Compile iPXE binaries

FOG builds a set of iPXE binaries — `undionly.kkpxe` for BIOS, and `snponly`,
`ipxe`, `snp`, `intel` and `realtek` variants for each UEFI architecture. You
might want to build your own to embed a custom script, add a driver, or turn on
debug output. This page covers how FOG does it and how to do it yourself.

>[!important] You almost certainly do not need to do this
>A normal install **downloads** prebuilt binaries from the `fog-ipxe` release
>matching this FOG version. The installer only compiles iPXE when you ask it to
>with `--rebuild-ipxe-with-my-ca` or `--install-mode embed-ca`, which is needed
>solely to embed a **private** CA for HTTPS netboot. A certificate from a public
>CA needs no rebuild at all — see
>[[1.6/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]].

## Where the source lives

FOG's iPXE is its own repository, **[FOGProject/fog-ipxe](https://github.com/FOGProject/fog-ipxe)**,
pinned to an exact release tag by `FOG_IPXE_VERSION` in
`packages/web/lib/fog/system.class.php`. The installer clones it to
`/opt/fog/ipxe` and checks out that tag.

It is not a fork that tracks upstream loosely. It is upstream iPXE at a fixed
tag, plus three things:

| Component | What it is |
|---|---|
| `src/config/` and `src-efi/config/` | Replacements for `console.h`, `general.h` and `settings.h` only |
| `patches/` | C changes applied after a `git reset --hard`, against the pinned tag |
| `buildipxe.sh` | The build driver FOG's installer calls |

The config overlay deliberately **does not** touch `crypto.h`. That matters:
upstream unconditionally defines a cross-signing endpoint there
(`CROSSCERT "http://ca.ipxe.org/auto"`), which is what lets any iPXE binary —
FOG's or upstream's — validate a publicly-issued certificate with nothing baked
in. Replacing `crypto.h` would silently remove that.

`patches/` currently carries `0001-x509-enforce-name-constraints.patch`, which
teaches iPXE to *enforce* X.509 name constraints instead of refusing to parse
them. Without it, FOG's own name-constrained Web CA cannot be read by iPXE at
all and HTTPS netboot fails with `Operation not supported`. The build fails
loudly if a patch stops applying, rather than quietly producing a binary
without it.

## Building with FOG's script

```bash
git clone https://github.com/FOGProject/fog-ipxe /opt/fog/ipxe
cd /opt/fog/ipxe
git checkout v2.0.0-fog.8          # match FOG_IPXE_VERSION for your install
./buildipxe.sh <ca-certificate.pem> <output-directory>
```

The first argument is the CA certificate to embed; the second is where the
binaries are written. The FOG installer passes its own trust anchor and its TFTP
staging directory. Expect **10–25 minutes**; there is no incremental path.

To then put the result into production, re-run the FOG installer with your
existing options. That is non-destructive — it reuses your saved settings — and
it also re-signs the binaries, which copying them by hand does not.

## Embedding a CA, and what it costs

Embedding is done with iPXE's `TRUST=` and `CERT=` build arguments. Two
properties are worth knowing:

- **`TRUST=` is additive, not exclusive.** Baking in your CA pins it as an extra
  root; it does not remove the `ca.ipxe.org` fallback described above.
- **A rebuilt binary is no longer Microsoft-signed.** Upstream's signed release
  binaries are signed as-built; changing a byte voids that.

>[!warning] A rebuild moves a Secure Boot machine's enrolment earlier
>FOG signs every EFI binary in its TFTP tree with this server's own Secure Boot
>signing key, so a rebuilt binary is not unsigned — upstream's signed shim will
>load it once that key is enrolled as a MOK. But it has to be enrolled
>**first**, before the machine can netboot at all, which reverses the usual
>order. See [[1.6/kb/how-tos/secure-boot-mok-enrollment|Secure Boot MOK Enrollment]].

If you build binaries yourself and copy them into `/tftpboot` by hand, they
carry **no** FOG signature and Secure Boot clients will refuse them. Re-run the
installer instead, or sign them yourself — see
[[1.6/kb/reference/secure-boot-technical-details|Secure Boot Technical Details]].

## Prerequisites for a manual build

```bash
# debian/ubuntu
sudo apt-get install git build-essential zlib1g-dev binutils-dev liblzma-dev mtools
# fedora/rhel
sudo dnf install git gcc gcc-c++ make zlib-devel binutils-devel xz-devel mtools
```

Add `genisoimage`/`isomd5sum`/`syslinux` if you want the `.iso` targets, and
`sbsigntools` if you intend to sign what you build.

## Manual compilation

`buildipxe.sh` is the supported path. If you want to drive `make` directly, work
inside a `fog-ipxe` checkout so you get the config overlay and the patches
rather than assembling them yourself:

```bash
git clone https://github.com/FOGProject/fog-ipxe ~/projects/fog-ipxe
cd ~/projects/fog-ipxe
git checkout v2.0.0-fog.8
```

BIOS targets are built from `src/` **with** the boot script compiled in:

```bash
cd ~/projects/fog-ipxe/src
make bin/undionly.kkpxe EMBED=ipxescript
make bin/ipxe.pxe       EMBED=ipxescript
make bin/intel.pxe      EMBED=ipxescript
```

UEFI targets are built from `src-efi/` **without** `EMBED=`:

```bash
cd ~/projects/fog-ipxe/src-efi
make bin-x86_64-efi/snponly.efi
make bin-x86_64-efi/ipxe.efi
make bin-x86_64-efi/snp.efi
make bin-i386-efi/snponly.efi
make bin-arm64-efi/snponly.efi
```

>[!important] Do not add `EMBED=` to a UEFI target
>Since `v2.0.0-fog.8` no EFI binary carries its script internally — they read
>`autoexec.ipxe` from the directory they were loaded from. An `EMBED=`-marked
>EFI binary still *downloads* `autoexec.ipxe` and then never runs it, and the
>orphaned script gets concatenated ahead of `init.xz`, so the kernel panics with
>`VFS: Unable to mount root fs on "/dev/ram0"`. BIOS builds have no such path
>and still embed. See
>[[1.6/installation/network-setup/dhcp-server-settings#How UEFI clients get their boot script|How UEFI clients get their boot script]].

To embed a CA by hand, add it to either command:

```bash
make bin-x86_64-efi/snponly.efi TRUST=/opt/fog/pki/root/ca/.fogCA.pem
```

## Debugging

Every C file in the iPXE source can be compiled with debug output enabled:

```bash
make bin/realtek.kpxe EMBED=ipxescript DEBUG=realtek
```

Most native drivers are a single source file — see `src/drivers/net` for the
list: 3c509, bnx2, forcedeth, intel, pcnet32, realtek, rhine and many more.

`ipxe.pxe` and `ipxe.efi` include the UNDI interface as well as all native
drivers, so you can enable debugging selectively:

```bash
make ... DEBUG=dhcp
make ... DEBUG=device,efi_driver,efi_init,efi_pci,efi_snp
make ... DEBUG=snp,snponly,snpnet,netdevice
make ... DEBUG=intel:4
make ... DEBUG=undi
```

To confirm a client actually picked up a new build, note the build code in the
iPXE banner before and after — the hex string in brackets, e.g.
`iPXE 1.21.1+ (gc64d) ...`. It only changes when the source does, not on every
recompile.

## See also

- [[1.6/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]] — when a rebuild is and is not needed
- [[1.6/kb/reference/secure-boot-technical-details|Secure Boot Technical Details]] — how FOG signs what it builds
- [[1.6/kb/reference/pki-zones|FOG PKI Infrastructure]] — the CA you would be embedding
- [[1.6/installation/network-setup/dhcp-server-settings|DHCP server settings]] — which binary to point clients at
