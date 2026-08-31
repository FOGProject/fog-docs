---
title: Moving to Secure Boot
aliases:
    - Moving to Secure Boot
    - Secure Boot Netboot
description: The two changes that let a FOG install netboot clients with UEFI Secure Boot enabled -- the DHCP boot file, and enrolling FOG's certificate on the clients
context_id: secure-boot-netboot
tags:
    - secure-boot
    - uefi
    - dhcp
    - pxe
    - network-config
---

# Moving to Secure Boot

FOG 1.6 can netboot clients with UEFI Secure Boot left **on**. Getting there
takes two changes, and this page is the short version of both:

1. **Point your DHCP boot file at the signed chain** — one string, in one place.
2. **Enroll FOG's certificate on each client** — once per machine.

Everything else is already done for you.

>[!tip] Setting up a new server? Do this from the start
>There is no reason to configure the other boot file first and migrate later. The
>signed chain boots machines whether Secure Boot is on or off, so it is a fine
>default for a fleet that has not enabled Secure Boot yet — and Step 2 can be
>run across that fleet *before* enforcement ever begins.

## What the installer already did

The server side needs no configuration. On first install FOG:

- generated a Secure Boot CA and a signing leaf under `/opt/fog/pki/secureboot/`,
- signed the FOS kernels with it, and keeps them signed across upgrades,
- staged upstream's Microsoft-signed shim and signed iPXE at
  `/tftpboot/secureboot/`.

Nothing in that directory is served to anyone until you point DHCP at it, which
is Step 1. To see the certificate your clients will need to trust, open
**FOG Configuration → Secure Boot** in the web UI — it shows the fingerprint and
offers a small enrollment kit.

>[!note] If `/tftpboot/secureboot/` is missing
>The download is deliberately non-fatal, so a failed fetch is skipped with a
>warning rather than aborting the install. Re-run the installer. See
>[[kb/how-tos/secure-boot-signing#before-you-start|Before you start]] for what the directory should contain.

## Step 1 — Point DHCP at the signed chain

Set the boot file (DHCP option 67 / `filename` / `boot-file-name`) per client
architecture:

| Client | DHCP arch | Boot file |
| --- | --- | --- |
| BIOS / legacy | `00000` | `undionly.kkpxe` — unchanged, Secure Boot does not exist in CSM mode |
| 32-bit UEFI | `00002`, `00006` | `i386-efi/snponly.efi` — unchanged, see [below](#where-this-does-not-apply) |
| **64-bit UEFI** | `00007`, `00008`, `00009` | **`secureboot/snponly-shimx64.efi`** |
| **ARM64 UEFI** | `00011` | **`secureboot/arm64-efi/snponly-shimaa64.efi`** |

Option 66 (`next-server` / TFTP server) does not change — it is still your FOG
server.

>[!important] Point *every* 64-bit UEFI client there, not just the Secure Boot ones
>A DHCP request comes from firmware before any OS exists and carries no
>indication of Secure Boot state — option 93 reports the client architecture and
>nothing else. No DHCP server of any kind can tell the difference, and it does
>not need to: `shim` is an ordinary UEFI application that happens to carry a
>Microsoft signature, so with Secure Boot off the firmware verifies nothing and
>shim enforces nothing. It simply boots.
>
>So this is not a conditional. The signed chain is a **superset** — it covers
>the Secure Boot machines and costs the others nothing. The full reasoning is in
>[[installation/network-setup/proxy-dhcp#secure-boot-and-proxydhcp|Secure Boot and proxyDHCP]].

### Windows Server DHCP

For an estate that is entirely 64-bit UEFI, set both options across every scope:

```powershell
#define your dhcp server hostname or ip
$dhcpSvr = 'dhcp.yourDomain.tld'
#define your fog server fqdn, hostname, or ip
$fogAddr = 'fogserver.yourDomain.tld'
#the signed chain -- boots with Secure Boot on or off
$pxeBootFile = 'secureboot/snponly-shimx64.efi'

$scopes = (Get-DhcpServerv4Scope -ComputerName $dhcpSvr).scopeID.ipaddresstostring

$scopes | ForEach-Object {
    $dhcpOptions = @{
        ComputerName = $dhcpSvr
        ScopeId      = $_
    }
    Set-DhcpServerv4OptionValue @dhcpOptions -OptionID 66 -Value $fogAddr
    Set-DhcpServerv4OptionValue @dhcpOptions -OptionID 67 -Value $pxeBootFile
}
```

>[!note]
>This needs the `DhcpServer` module — present on a server once the DHCP role is
>added, or on a workstation via RSAT — and rights to manage the DHCP server. It
>sets the options at scope level rather than server level.

If you have a **mixed BIOS/UEFI estate**, a single scope-wide option 67 cannot
serve both. Use DHCP policies, which match on the PXE vendor class the client
sends:

```powershell
$dhcpSvr = 'dhcp.yourDomain.tld'
$scopes  = (Get-DhcpServerv4Scope -ComputerName $dhcpSvr).scopeID.ipaddresstostring

# arch -> boot file. 00007/00008/00009 are all "64-bit UEFI" as far as
# firmware vendors are concerned, so all three get the same file.
$archMap = [ordered]@{
    'FOG-BIOS'     = @{ Arch = '00000'; File = 'undionly.kkpxe' }
    'FOG-UEFI32'   = @{ Arch = '00006'; File = 'i386-efi/snponly.efi' }
    'FOG-UEFI64-7' = @{ Arch = '00007'; File = 'secureboot/snponly-shimx64.efi' }
    'FOG-UEFI64-8' = @{ Arch = '00008'; File = 'secureboot/snponly-shimx64.efi' }
    'FOG-UEFI64-9' = @{ Arch = '00009'; File = 'secureboot/snponly-shimx64.efi' }
    'FOG-ARM64'    = @{ Arch = '00011'; File = 'secureboot/arm64-efi/snponly-shimaa64.efi' }
}

foreach ($scope in $scopes) {
    $order = 1
    foreach ($name in $archMap.Keys) {
        $arch = $archMap[$name].Arch
        $file = $archMap[$name].File

        Add-DhcpServerv4Policy -ComputerName $dhcpSvr -ScopeId $scope -Name $name -Condition OR -VendorClass EQ,"PXEClient:Arch:$arch*" -ProcessingOrder $order

        Set-DhcpServerv4OptionValue -ComputerName $dhcpSvr -ScopeId $scope -PolicyName $name -OptionID 67 -Value $file

        $order++
    }
}
```

Option 66 can stay a plain scope option — every architecture uses the same TFTP
server. To review what a policy is handing out, use
`Get-DhcpServerv4OptionValue -ScopeId <id> -Policy <name>` (note it is `-Policy`
here and `-PolicyName` on `Set-`). For the broader mixed-mode picture see
[[bios-and-uefi-co-existence|Bios and UEFI Co-Existence]].

### ISC DHCP (`dhcpd.conf`)

```
class "UEFI-64-1" {
    match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00007";
    filename "secureboot/snponly-shimx64.efi";
}
class "UEFI-64-2" {
    match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00008";
    filename "secureboot/snponly-shimx64.efi";
}
class "UEFI-64-3" {
    match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00009";
    filename "secureboot/snponly-shimx64.efi";
}
class "UEFI-ARM64" {
    match if substring(option vendor-class-identifier, 0, 20) = "PXEClient:Arch:00011";
    filename "secureboot/arm64-efi/snponly-shimaa64.efi";
}
```

When FOG hosts DHCP itself it writes these classes for you. If you run a
dedicated ISC server, the `/etc/dhcp/dhcpd.conf` FOG generates is the easiest
reference to copy from — see [[installation/network-setup/dhcp-server-settings|DHCP Server Settings]].

### Kea

```json
{
    "name": "FOG-UEFI-64-1",
    "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00007'",
    "boot-file-name": "secureboot/snponly-shimx64.efi"
},
{
    "name": "FOG-UEFI-ARM64",
    "test": "substring(option[60].hex,0,20) == 'PXEClient:Arch:00011'",
    "boot-file-name": "secureboot/arm64-efi/snponly-shimaa64.efi"
}
```

A complete `kea-dhcp4.conf`, including the BIOS and 32-bit classes, is in
[[installation/network-setup/dhcp-server-settings#dedicated-linux-dhcp-server-kea|DHCP Server Settings]].
Validate with `kea-dhcp4 -t /etc/kea/kea-dhcp4.conf` before restarting.

### dnsmasq / proxyDHCP

```
dhcp-boot=net:UEFI,secureboot/snponly-shimx64.efi,,<fog_server_IP>
dhcp-boot=net:UEFI64,secureboot/snponly-shimx64.efi,,<fog_server_IP>
dhcp-boot=net:ARM64,secureboot/arm64-efi/snponly-shimaa64.efi,,<fog_server_IP>

pxe-service=x86-64_EFI, "Boot to FOG", secureboot/snponly-shimx64.efi, <fog_server_IP>
pxe-service=BC_EFI, "Boot to FOG", secureboot/snponly-shimx64.efi, <fog_server_IP>
pxe-service=ARM64_EFI, "Boot to FOG", secureboot/arm64-efi/snponly-shimaa64.efi, <fog_server_IP>
```

>[!warning] `pxe-service` overrides `dhcp-boot` for UEFI clients
>When exactly one `pxe-service` line matches a UEFI client's architecture,
>dnsmasq answers from that line and skips the `dhcp-boot` rules entirely. If you
>change the boot file and nothing happens, you almost certainly edited only one
>of the two. Change both and keep them in agreement.

The complete file, with the architecture tags and the trailing-server-IP gotcha,
is at [[installation/network-setup/proxy-dhcp#the-optimal-configuration|The optimal configuration]].

### Confirming it took

Watch the TFTP server's log during a client boot. It tells you exactly which
filenames were requested and whether they were served, which beats guessing:

```
secureboot/snponly-shimx64.efi     <- what DHCP told the client to fetch
secureboot/snponly.efi             <- shim found its own second stage
secureboot/autoexec.ipxe           <- iPXE picked up FOG's boot script
```

Seeing the second line means the shim ran and the chain is working. The shim
picks its second stage by stripping `-shimx64` out of its own filename, so the
name you set in DHCP is what chooses the loader — nothing is renamed on the
server.

## Step 2 — Enroll FOG's certificate on each client

The signed shim and iPXE are trusted by the firmware already. The **FOS kernel**
is signed by *your* server's key, which no machine trusts yet. Enrolling that
certificate is a per-machine step, and it needs a human at the console — that is
Secure Boot's security property, not a limitation.

The quickest route needs no USB stick and no live image:

1. PXE-boot the client. Secure Boot on or off makes no difference to this step.
2. Choose **Enroll Secure Boot Key** from the FOG boot menu. FOG fetches
   `MOK.der` into iPXE's memory and hands off to MokManager.
3. `Enroll key from disk`.
4. Pick `MOK.der` — it is already in the list.
5. `Continue` → `Yes`. **Compare the fingerprint MokManager shows against the
   one on FOG Configuration → Secure Boot before confirming.** That manual
   comparison is the actual security check.
6. `Reboot`.

>[!warning] MokManager gives up after about 10 seconds
>If nothing is pressed shortly after the blue screen appears, MokManager
>continues booting normally and silently skips enrollment. Be at the console
>*before* you select the menu item, not after.

>[!tip] Push it as a task instead of walking to each menu
>**Enroll Secure Boot Key** is also a task type, schedulable from **Task
>Scheduling** against a host or a whole group. A host with the task pending
>chains straight into the flow above on its next PXE boot. The final
>`Enroll key from disk` → `Yes` still happens at the console.

Enrollment does **not** require Secure Boot to be currently enabled, so you can
stage a whole fleet while it is still off and switch enforcement on afterward.

Where to go for more:

- [[kb/how-tos/secure-boot-mok-enrollment|MOK enrollment]] — the route above (Route B) in
  full, plus Route A, a stock Ubuntu/Debian live USB, which is the fallback when
  `Enroll key from disk` hangs on stubborn firmware.
- [[secure-boot-setup-mode-enrollment|Setup Mode enrollment]] — Route C, the
  only route with **nobody at the console**, if your firmware can be put into
  Setup Mode. This is the one that scales.
- [[kb/how-tos/secure-boot-signing|Secure Boot signing]] — the concepts: why FOG cannot
  ship signed kernels, the CA/leaf split, bringing your own key, and rotation.

## Step 3 — Turn Secure Boot on in firmware

Always manual, and never something FOG can do for you. Worth stating so it is
not a surprise at the end: if you enrolled with Secure Boot off, someone still
has to enable it in each machine's firmware settings.

## Where this does not apply

- **32-bit UEFI** (`i386-efi/`) — there is no Microsoft-signed 32-bit shim, so
  there is no chain an ia32 client can start from a signature its firmware
  already trusts, and no 32-bit MokManager to enroll one with either. These
  machines must have Secure Boot **disabled** to network boot. FOG refuses
  Secure Boot enrollment on them outright, and hides the enrollment menu entry,
  rather than offering something that cannot succeed.
- **BIOS / CSM** — Secure Boot does not exist in legacy mode. Leave
  `undionly.kkpxe` alone.
- **HTTPS netboot with a private CA** — a signed binary cannot be rebuilt to
  embed your CA without voiding the signature. A publicly-issued certificate on
  an FQDN needs no rebuild and keeps the signed shim; a private CA means either
  keeping netboot on HTTP or enrolling into `db` via Setup Mode. See
  [[kb/reference/netboot-transport-and-pki|Netboot Transport and PKI]] and
  [[kb/reference/pki-zones#https-and-netboot|HTTPS and netboot]].

## If something goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| Client never fetches anything | DHCP still handing out the old name, or `pxe-service` overriding `dhcp-boot` | Check the TFTP log for the filename actually requested |
| Shim loads, iPXE starts, then no link or no DHCP | The firmware's own UEFI SNP driver | Change the DHCP boot file to `secureboot/ipxe-shimx64.efi` (arm64: `secureboot/arm64-efi/ipxe-shimaa64.efi`). DHCP-only change, nothing renamed server-side |
| Signed iPXE loads, then the kernel is refused | Certificate not enrolled on that machine | Step 2 |
| `secureboot/...` not found over TFTP | The binaries were never staged | Re-run the installer; see the note at the top of this page |
| Boot worked before this change, fails now | The old name was FOG's own build, which your clients' firmware trusted via an enrolled MOK; the `secureboot/` chain starts from Microsoft's signature instead | Nothing to undo — this is the chain that needs *no* enrollment to load. If it still fails, the failure is at the kernel, which is Step 2 |

Deeper detail — how `autoexec.ipxe` is resolved, how the kernels are signed, and
how to verify a signature end to end — is in
[[kb/reference/secure-boot-technical-details|Secure Boot technical details]].

## See also

- [[installation/network-setup/dhcp-server-settings|DHCP Server Settings]] — options 66 and 67 in full, with per-server examples
- [[installation/network-setup/proxy-dhcp|Proxy DHCP with dnsmasq]] — the complete dnsmasq configuration
- [[kb/how-tos/secure-boot-signing|Secure Boot signing]] — start here for the concepts
- [[kb/how-tos/secure-boot-mok-enrollment|MOK enrollment]] — Routes A and B, in full
- [[secure-boot-setup-mode-enrollment|Setup Mode enrollment]] — the unattended route
- [[kb/reference/secure-boot-technical-details|Secure Boot technical details]]
- [[kb/reference/pki-glossary|PKI & Secure Boot Glossary]]
