---
title: Secure Boot Technical Details (1.5)
aliases:
    - Secure Boot Technical Details (1.5)
description: Deeper technical detail on FOG 1.5's Secure Boot chain -- serving the signed shim, signing FOS kernels, and signing your own FOS builds
context_id: secure-boot-technical-details-1.5
tags:
    - reference
    - secure-boot
    - uefi
    - advanced
    - pki
    - 1_5-legacy
---

>[!info] This page describes FOG 1.5.
>See the [[kb/reference/secure-boot-technical-details|1.6 version]] of this page for FOG 1.6.

# Secure Boot: technical details (1.5)

This page covers the mechanics behind Secure Boot signing on FOG 1.5: how the
signed shim chain is served, how FOS kernels actually get signed, and how to
sign your own FOS builds. For the concepts, start at
[[1.5/kb/how-tos/secure-boot-signing|Secure Boot signing (1.5)]]. For
enrolling a certificate on a client, see
[[1.5/kb/how-tos/secure-boot-mok-enrollment|MOK enrollment (1.5)]] — the only
enrollment route on this line.

>[!danger] None of this is staged at all if `httpproto` is `https`
>On FOG 1.5, turning on HTTPS (`-S`/`--force-https`) means the installer does
>not download or stage the signed Secure Boot chain described below —
>upstream's binaries can't carry the locally-rebuilt iPXE that HTTPS on 1.5
>always requires. Everything on this page assumes `httpproto=http` (the
>default). See
>[[1.5/kb/reference/netboot-transport-and-pki|Netboot Transport and PKI (1.5)]].

## Serve the signed chain

Set the DHCP boot file for Secure Boot clients to
**`secureboot/snponly-shimx64.efi`**. Nothing in this step needs signing by you —
both binaries already carry signatures the firmware and shim trust.

>[!tip] This is the same driver model FOG already uses
>`snponly` binds only the firmware's own UEFI network protocol instead of
>replacing the NIC driver, which is exactly why FOG serves `snponly.efi` to
>every other client. So a Secure Boot machine now behaves like the rest of your
>estate rather than being a special case — the only difference is the shim in
>front and the signature on the kernel.

Because upstream's `snponly.efi` has no boot script compiled in, it fetches one
over TFTP, and **where it looks is not a single fixed path** — iPXE asks for the
bare name `autoexec.ipxe` and resolves it against its own *current working
URI*, i.e. the TFTP directory the running `.efi` was itself downloaded from.

The installer satisfies that for every directory an EMBED-less binary can be
booted from. On 1.5, FOG's own EMBED-less builds are staged under
`autoexec/` (not at the literal TFTP root), so the script is hard-linked into:

```
/tftpboot/autoexec/autoexec.ipxe            (the original)
/tftpboot/autoexec/i386-efi/autoexec.ipxe
/tftpboot/autoexec/arm64-efi/autoexec.ipxe
/tftpboot/secureboot/autoexec.ipxe
/tftpboot/secureboot/arm64-efi/autoexec.ipxe
```

All five are one file (hard link, not symlink or copy — some TFTP daemons
refuse to follow symlinks, and a hard link keeps the paths from drifting
apart), so editing any of them changes all of them.

>[!note] Nothing is published at the literal TFTP root any more
>Earlier releases linked a copy of `autoexec.ipxe` at the bare root of the
>TFTP directory. That copy is actively removed on every run: the root holds
>only `EMBED`-marked binaries (the ones with their boot script compiled in),
>and an unused `autoexec.ipxe` sitting there caused `initrd_load_all()` to
>concatenate it into the ramdisk ahead of the real initrd on some firmware,
>producing a kernel panic (`VFS: Unable to mount root fs`). If you find one
>at the root of your TFTP tree, it's stale — re-run the installer.

You can watch fetch attempts on the client console:

```
autoexec.ipxe...  Not found
/autoexec.ipxe... Not found
```

If a link has been broken — the file was replaced by an editor that
writes-and-renames — re-running the installer restores it, or:

```bash
sudo ln -f /tftpboot/autoexec/autoexec.ipxe /tftpboot/secureboot/autoexec.ipxe
```

You can check they really are one file: every copy should report the same
inode.

```bash
find /tftpboot -name autoexec.ipxe -printf '%i  links=%n  %p\n'
```

>[!tip] If nothing seems to happen
>Watch the TFTP server's log during a boot — it tells you exactly which
>filenames the client asked for and whether they were served, which beats
>guessing every time.

Your existing clients are unaffected — FOG's own unsigned `snponly.efi` stays
where it already was, and non-Secure-Boot machines keep booting it. The signed
copy lives under `secureboot/` and is reached only by machines you point there.

>[!note] Both files are called `snponly.efi`, and that is fine
>FOG's own build is unsigned. `/tftpboot/secureboot/snponly.efi`
>is upstream's, signed by the iPXE project. Both read their script from
>`autoexec.ipxe`; what differs is who vouches for the binary — upstream's is
>trusted through shim and Microsoft's key, FOG's through the MOK this server
>publishes. That is why the signed one gets its own directory rather than
>replacing the other, and which you point DHCP at decides which trust root the
>client has to have enrolled.

### If the chain loads but the network never comes up

Shim runs, iPXE starts, and then there is no link or no DHCP. That points at
the firmware's own UEFI network stack, not at anything you signed. Set the DHCP
boot file to **`secureboot/ipxe-shimx64.efi`** instead — on arm64,
`secureboot/arm64-efi/ipxe-shimaa64.efi`, if your install stages the arm64
Secure Boot set.

That chain runs the all-drivers `ipxe.efi`, which replaces the firmware's NIC
driver with iPXE's own rather than binding the firmware's UEFI network
protocol. It recovers machines whose firmware SNP is broken or absent, and it
is the more invasive option — on hardware where the takeover fails, it hangs
instead. So try `snponly` first and move to this only on the symptom above.

Everything about the rest of this step is unchanged: both binaries are staged
for you, both are already signed, and `autoexec.ipxe` is hard-linked into
`secureboot/` for either one. **Nothing needs renaming server-side** — the shim
picks its second stage from its own filename, so the two chains sit side by
side in one directory and DHCP alone decides which runs.

## Signing the FOS kernels

This is the part that is genuinely yours to sign, and **the installer has
already done it** — there is no step here unless you supplied your own key,
in which case
[[1.5/kb/how-tos/secure-boot-signing#bringing-your-own-key|bringing your own key (1.5)]]
covers passing it.

Every install and upgrade re-signs the kernels (when Secure Boot is staged at
all — see the callout at the top of this page), and it has to: the FOS
binaries are re-copied into place unsigned on every run, so the signature is
removed and immediately re-applied in the same pass.

Verify — and note the certificate must be the **PEM**, because `sbverify` will
not read DER:

```bash
sbverify --cert /opt/fog/pki/secureboot/leaf/sign.pem \
  /var/www/fog/service/ipxe/bzImage
# Signature verification OK
```

The full chain, including the intermediate:

```bash
$ sbverify --list /var/www/fog/service/ipxe/bzImage
 - subject: /CN=FOG Project Secure Boot Signing
   issuer:  /CN=FOG Secure Boot CA
 - subject: /CN=FOG Secure Boot CA
   issuer:  /CN=FOG Server CA
```

The signer shown should match the fingerprint on the **FOG Configuration →
Secure Boot** page; that page's fingerprint is the digest of the certificate
your clients enroll — the CA, not the leaf.

The installer keeps a `.unsigned` copy of each kernel beside the signed one,
because `sbsign` will not cleanly re-sign an already-signed image. Leave them
alone; they are refreshed on every download.

>[!note] The web Kernel Update page is covered too
>Downloading a kernel from **FOG Configuration → Kernel Update** signs it
>before it is sent to the TFTP server, so that route cannot leave you with an
>unsigned kernel either. It signs through a small root-only helper
>(`fog-sign-kernel`) rather than in the web server itself, so the web server
>never gets read access to your private key. If signing fails the update is
>refused outright rather than quietly installing a kernel your clients will
>not boot.
>
>Be aware of the limit of that protection: anyone who can already run code as
>your web server can ask the helper to sign a kernel of their choosing. What
>they cannot do is walk off with the key.

>[!warning] If `sbsigntool` could not be installed
>The installer adds `sbsigntool` (`sbsigntools` on RHEL/Arch) to its baseline
>package set, but if neither name exists in your distribution's repositories
>it skips the package, then warns and carries on **unsigned** rather than
>aborting the whole install. Read the installer output — an unsigned kernel
>only announces itself at a client, as a `Security Policy Violation`.

## Signing your own FOS builds

If you build FOS yourself rather than using the released kernels, `build.sh`
can sign as part of the build, so the published `.sha256` covers the signed
image:

```bash
./build.sh -nka x64 \
  --sign-key  /root/fog-secureboot/MOK.priv \
  --sign-cert /root/fog-secureboot/MOK.pem
```

If you are using FOG's own auto-generated key, that is
`--sign-key /opt/fog/pki/secureboot/leaf/sign.key --sign-cert /opt/fog/pki/secureboot/leaf/sign.pem`.

`--sign-cert` must be the **PEM** here — `build.sh` hands it straight to
`sbsign`, which cannot read DER.

`FOS_SIGN_KEY` and `FOS_SIGN_CERT` work too, which is easier in CI. With
neither set the build is byte-for-byte what it always was.

## Verify end to end

Take one enrolled machine and PXE boot it with Secure Boot **on**:

- iPXE loads and shows its banner — the shim accepted `snponly.efi`, so the
  upstream signed binaries are working.
- The FOG menu appears — `autoexec.ipxe` is being served and read.
- Selecting a task boots FOS rather than failing — your signature is accepted.

If it stops at the third step with a security violation, the kernel signature
is not being accepted. In order of likelihood:

| Symptom | Cause |
| --- | --- |
| `Security Policy Violation` | Certificate not enrolled on *this* machine, or the leaf was signed under a different CA than what's enrolled |
| `Security Policy Violation`, but the certificate *is* listed by `mokutil --list-enrolled` | The key carries the Module-signing only OID — see [[1.5/kb/how-tos/secure-boot-signing#bringing-your-own-key\|Bringing your own key (1.5)]] |
| Fails on every machine, including enrolled ones | Shim is not in the boot chain — see [[1.5/kb/how-tos/secure-boot-signing#the-chain-you-are-building\|the chain (1.5)]] |
| Worked yesterday, fails today | Something replaced the kernels without re-signing them, or `httpproto` was switched to `https`, which stops staging the Secure Boot chain — check with `sbverify` and re-run the installer |
| Every machine stops working after a change | Either the CA was regenerated, or you switched to a different admin-supplied flat key. Enrollment is per-CA (or per-flat-key), so all clients need re-enrolling — see [[1.5/kb/how-tos/secure-boot-signing#rotating-or-removing-a-key\|Rotating or removing a key (1.5)]] |
| Complains about format, not signature | Kernel lacks `CONFIG_EFI_STUB` |

## See also

- [[1.5/kb/reference/secure-boot-trust-stores|The two trust stores (1.5)]] — `db` vs `MokList`, and which one your boot path consults
- [[1.5/kb/how-tos/secure-boot-signing|Secure Boot signing (1.5)]]
- [[1.5/kb/how-tos/secure-boot-mok-enrollment|MOK enrollment (1.5)]]
- [[1.5/kb/reference/pki-zones|FOG's Certificate Zones (1.5)]]
- [[1.5/kb/reference/netboot-transport-and-pki|Netboot transport and PKI (1.5)]] — why HTTPS and Secure Boot can't be combined on this line
