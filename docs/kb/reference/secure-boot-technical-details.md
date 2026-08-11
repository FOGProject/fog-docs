---
title: Secure Boot Technical Details
aliases:
    - Secure Boot Technical Details
description: Deeper technical detail on FOG's Secure Boot chain -- serving the signed shim, signing FOS kernels, and signing your own FOS builds
context_id: secure-boot-technical-details
tags:
    - reference
    - secure-boot
    - uefi
    - advanced
    - pki
---

# Secure Boot: technical details

This page covers the mechanics behind Secure Boot signing that aren't
specific to any one enrollment route: how the signed shim chain is served,
how FOS kernels actually get signed, and how to sign your own FOS builds.
For the concepts, start at [[secure-boot-signing|Secure Boot signing]]. For
enrolling a certificate on a client, see
[[secure-boot-mok-enrollment|MOK enrollment]] or
[[secure-boot-setup-mode-enrollment|Setup Mode enrollment]].

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
over TFTP, and **where it looks is not a single fixed path**. iPXE asks for the
bare name `autoexec.ipxe` and tries two locations in order:

1. relative to its *current working URI* — the TFTP directory the running
   `.efi` was itself downloaded from, i.e. `secureboot/autoexec.ipxe`
2. absolute at the TFTP root — `/autoexec.ipxe`

You can watch both attempts on the client console:

```
autoexec.ipxe...  Not found
/autoexec.ipxe... Not found
```

The installer satisfies both. It hard-links `autoexec.ipxe` into every
directory an EMBED-less binary can be booted from — the TFTP root,
`autoexec/`, `autoexec/i386-efi/`, `autoexec/arm64-efi/`, `secureboot/` and
`secureboot/arm64-efi/`. All six are one file, so editing any of them changes
all of them and there is no copy left quietly running the old script.

A hard link rather than a symlink because some TFTP daemons refuse to follow
symlinks, while a hard link is indistinguishable from a regular file to all of
them. A hard link rather than a copy so the paths cannot drift apart.

If a link has been broken — an older install, or the file was replaced by an
editor that writes-and-renames — re-running the installer restores it, or:

```bash
sudo ln -f /tftpboot/autoexec/autoexec.ipxe /tftpboot/secureboot/autoexec.ipxe
```

You can check they really are one file: every copy should report the same
inode and a link count of 6.

```bash
find /tftpboot -name autoexec.ipxe -printf '%i  links=%n  %p\n'
```

>[!tip] If nothing seems to happen
>Watch the TFTP server's log during a boot — it tells you exactly which
>filenames the client asked for and whether they were served, which beats
>guessing every time.

Your existing clients are unaffected — FOG's own unsigned `snponly.efi` stays
at the TFTP root, and non-Secure-Boot machines keep booting it. The signed copy
lives under `secureboot/` and is reached only by machines you point there.

>[!note] Both files are called `snponly.efi`, and that is fine
>`/tftpboot/snponly.efi` is FOG's own build — the boot script compiled in, no
>signature. `/tftpboot/secureboot/snponly.efi` is upstream's signed build,
>which reads its script from `autoexec.ipxe` instead. They are different
>binaries doing the same job by different means, which is why the signed one
>gets its own directory rather than replacing the other.

### If the chain loads but the network never comes up

Shim runs, iPXE starts, and then there is no link or no DHCP. That points at
the firmware's own UEFI network stack, not at anything you signed. Set the DHCP
boot file to **`secureboot/ipxe-shimx64.efi`** instead — on arm64,
`secureboot/arm64-efi/ipxe-shimaa64.efi`.

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
in which case [[secure-boot-signing#bringing-your-own-key|bringing your own
key]] covers passing it.

Every install and upgrade re-signs the kernels, and it has to: the FOS
binaries are re-copied into place unsigned on every run, so the signature is
removed and immediately re-applied in the same pass. That is what stops an
upgrade silently leaving you with kernels your clients will not boot — which
is the single most common way this setup breaks.

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
your clients enrol — the CA, not the leaf.

The installer keeps a `.unsigned` copy of each kernel beside the signed one,
because `sbsign` will not cleanly re-sign an already-signed image. Leave them
alone; they are refreshed on every download.

>[!note] The web Kernel Update page is covered too
>Downloading a kernel from **FOG Configuration → Kernel Update** signs it
>before it is sent to the TFTP server, so that route cannot leave you with an
>unsigned kernel either. It signs through a small root-only helper
>(`$fogprogramdir/bin/fog-sign-kernel`, `/opt/fog/bin/…` by default) rather
>than in the web server itself, so the
>web server never gets read access to your private key. If signing fails the
>update is refused outright rather than quietly installing a kernel your
>clients will not boot.
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
| `Security Policy Violation`, but the certificate *is* listed by `mokutil --list-enrolled` | The key carries the Module-signing only OID — see [[secure-boot-signing#bringing-your-own-key|Bringing your own key]] |
| Fails on every machine, including enrolled ones | Shim is not in the boot chain — see [[secure-boot-signing#the-chain-you-are-building|the chain]] |
| Worked yesterday, fails today | Something replaced the kernels without re-signing them. The installer always re-signs on install/upgrade — suspect anything that copies into `service/ipxe/` outside it — check with `sbverify` and re-run the installer |
| Every machine stops working after a change | Either the CA was regenerated, or you switched to a different admin-supplied flat key. Enrolment is per-CA (or per-flat-key), so all clients need re-enrolling — see [[secure-boot-signing#rotating-or-removing-a-key|Rotating or removing a key]] |
| Complains about format, not signature | Kernel lacks `CONFIG_EFI_STUB` |

## See also

- [[secure-boot-signing|Secure Boot signing]]
- [[secure-boot-mok-enrollment|MOK enrollment]]
- [[secure-boot-setup-mode-enrollment|Setup Mode enrollment]]
- [[pki-zones|FOG's Certificate Zones]]
