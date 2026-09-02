---
title: TPM, BitLocker and Windows Hello after imaging
aliases:
    - TPM, BitLocker and Windows Hello after imaging
    - BitLocker recovery after deploy
    - Windows Hello PIN lost after imaging
    - Clearing the TPM
description: Why a deployed Windows image asks for a BitLocker recovery key or drops the Windows Hello PIN, what to do on the reference machine before capture, how to repair each after deploy, and when clearing the TPM is the right fix
context_id: tpm-bitlocker-windows-hello
tags:
    - how-to
    - windows
    - bitlocker
    - windows-hello
    - tpm
    - capture
    - deploy
    - post-download
---

# TPM, BitLocker and Windows Hello after imaging

Two things in a Windows image stop working the moment the image lands on a
different machine: **BitLocker**, which asks for a recovery key at boot, and
**Windows Hello**, which tells the user their PIN is no longer available. Both
are working as designed, both are avoidable, and both are repairable. This
page covers all three angles.

>[!note] Terms used on this page
>The **TPM** (Trusted Platform Module) is a small chip, or a firmware
>equivalent, that holds secrets *for one machine* and never hands them out
>as files. **PCRs** are the TPM's tally of what booted: firmware, Secure Boot
>keys, boot loader. A BitLocker **protector** is one way of unlocking a
>volume; the usual one is the TPM releasing the key only when the PCRs match
>what they were when the protector was made. The **recovery key** is the
>48-digit fallback protector. **Windows Hello** is the PIN, face or
>fingerprint sign-in; the PIN is not a password, it unlocks a key the TPM
>made, and that key lives only in that TPM.

## Why imaging breaks them

An image is a copy of the disk. The TPM is not on the disk. Everything Windows
sealed to the reference machine's TPM is therefore on the new machine's disk
with nothing that can open it:

| | On the reference machine | After deploy on another machine |
|---|---|---|
| BitLocker TPM protector | TPM releases the key when the PCRs match | This TPM never held the key. Windows falls back to the **recovery key** prompt |
| Windows Hello PIN | PIN unlocks a key inside the TPM | The key does not exist here. Windows reports **the PIN is no longer available** |
| A clean, unencrypted disk with no PIN enrolled | Nothing sealed | Nothing to break. Windows provisions the new TPM by itself on first boot |

The same thing happens on the *same* machine when the TPM is cleared, or when
a firmware change alters the PCRs. Enrolling Secure Boot keys changes PCR 7,
which is why [[local-esp-boot|the ESP boot page]] and
[[secure-boot-setup-mode-enrollment|Setup Mode enrollment]] tell you to
suspend BitLocker first.

## What FOG does, and does not do

- **FOS refuses to capture an encrypted partition.** It reads the partition
  header and stops with `Found bitlocker signature in partition ... Please
  disable BITLOCKER before capturing an image`. Suspending BitLocker is not
  enough; the volume is still encrypted and the signature is still there.
  Decrypt it fully.
- **FOG never touches the TPM.** Nothing in a deploy task reads, clears or
  provisions it. The FOS kernel is built without the TPM driver, so a
  post-download script cannot reach it either.
- **A post-download script can edit files on the deployed disk**, which is
  enough to fix the Windows Hello side. See [Fix it during the deploy](#fix-it-during-the-deploy)
  below.

## Before you capture

Do this on the reference machine, before the Sysprep step in
[[capture-an-image|Capture an Image]].

**Decrypt BitLocker fully.** From an elevated command prompt:

```
manage-bde -off C:
manage-bde -status C:
```

Wait until `-status` shows `Conversion Status: Fully Decrypted` and
`Protection Status: Protection Off`. Decryption of a large disk takes a while;
the capture will fail if you start it early. Do the same for any data
volume the image carries.

**Do not enroll a Windows Hello PIN on the reference machine.** Build it as a
local administrator signing in with a password. A PIN enrolled here is
useless on every machine the image lands on, and it leaves behind the
container that produces the error instead of a clean set-up prompt.

**Keep Windows from re-encrypting behind your back.** Recent Windows 11
builds turn on device encryption automatically during first sign-in on
hardware that supports it, and store the recovery key in the Microsoft or
Entra account that signed in. If you would rather turn BitLocker on
deliberately after deploy, set this in the image before Sysprep:

```
reg add HKLM\SYSTEM\CurrentControlSet\Control\BitLocker /v PreventDeviceEncryption /t REG_DWORD /d 1 /f
```

Then Sysprep and capture as usual. An image prepared this way deploys with
nothing to repair.

## After deploy: BitLocker

### Turning it on, on the new machine

The right time to enable BitLocker is after deploy, on the machine that will
keep the disk, so the protector is made by that machine's TPM. Any of these
work; pick the one your site already manages keys with:

- Group Policy or Intune/MDM encryption policy, which also escrows the
  recovery key to Active Directory or Entra.
- The FOG client running a snapin, or a script at first logon, that runs:

  ```
  manage-bde -on C: -RecoveryPassword -SkipHardwareTest
  ```

  Capture the recovery password it prints. Add `-UsedSpaceOnly` on a freshly
  deployed disk to make it fast.

>[!warning]
>Store recovery keys somewhere other than the machine. A machine you cannot
>unlock after a firmware update, a TPM clear or a motherboard swap is a
>machine you reimage, and reimaging it is what put you on this page.

### The recovery key prompt

If a machine boots to the blue BitLocker recovery screen after a deploy, a
firmware change or a TPM clear, the TPM protector no longer opens the volume.
Enter the recovery key to get in, then make a fresh TPM protector from an
elevated command prompt:

```
manage-bde -protectors -delete C: -type TPM
manage-bde -protectors -add C: -tpm
manage-bde -protectors -get C:
```

The last line should list a TPM protector alongside the numerical password.
Reboot: the volume unlocks without a prompt.

>[!tip]
>If you know a PCR change is coming, suspend first and resume afterward, and
>there is no prompt at all. `manage-bde -protectors -disable C:` before the
>change, `manage-bde -protectors -enable C:` after it. Resuming re-seals the
>key to the PCRs as they are now.

## After deploy: Windows Hello

### What the user sees

After signing in with a password, Windows shows one of:

- *Your PIN is no longer available due to a change to the security settings
  on this device. Click to set up your PIN again.*
- *Something went wrong* with a code such as `0x80090016` (keyset does not
  exist) or `0x80090010` when trying to set a new PIN.

The first is Windows noticing the mismatch and offering the fix. Clicking
through and setting a new PIN is the whole repair; the same applies to
fingerprint and face enrollment. The second means the old container is in
the way.

### Clearing the old container

Windows keeps the Hello enrollment in one folder. Removing it makes the next
sign-in behave like a machine that never had a PIN. From an elevated command
prompt:

```
sc stop NgcSvc
sc stop NgcCtnrSvc
takeown /F "%WINDIR%\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc" /R /A /D Y
icacls "%WINDIR%\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc" /grant Administrators:F /T
rd /S /Q "%WINDIR%\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc"
```

Reboot, sign in with the password, and set up the PIN from
**Settings :octicons-arrow-right-24: Accounts :octicons-arrow-right-24: Sign-in
options**. On Entra-joined machines Windows Hello for Business re-registers
the new key with Entra on its own; nothing needs deleting on the identity side.

### Fix it during the deploy

The folder above is just files on the deployed disk, so FOS can remove it
before the machine ever boots Windows. That turns the error into the clean
first-time prompt on every deployed machine, with no visit and no user
confusion. Save this as `/images/postdownloadscripts/clear-hello.sh`:

```bash
#!/bin/bash
# /images/postdownloadscripts/clear-hello.sh
# Remove the Windows Hello container captured with the image. The keys it
# points at live in the reference machine's TPM, so on any other machine
# the container can only produce an error. Without it, Windows offers a
# clean "set up your PIN" on first sign-in.
getPartitions "$hd"
for part in $parts; do
    ntfs-3g -o rw "$part" /mnt >/dev/null 2>&1 || continue
    ngc=/mnt/Windows/ServiceProfiles/LocalService/AppData/Local/Microsoft/Ngc
    if [[ -d $ngc ]]; then
        echo " * Clearing Windows Hello container on $part"
        rm -rf "$ngc"
    fi
    umount /mnt
done
```

Then call it from `fog.postdownload`:

```bash
. ${postdownpath}clear-hello.sh
```

`getPartitions` and `$hd` come from the imaging environment, which the script
inherits because `fog.postdownload` is sourced. See
[[post-download-scripts|Post Download Scripts]] for the mechanism and the
other variables you can branch on if you only want this on some images.

## Clearing the TPM

Clearing wipes every key the TPM holds and puts it back to factory state.
Windows 10 and 11 provision a cleared TPM automatically on the next boot, so
for **imaging alone it is never required**: the deployed machine's TPM is
already its own, and the two repairs above do not need it. Clear it when:

- Hello still fails with `0x80090016` or *the device that is required by this
  cryptographic provider is not ready for use* after the container has been
  removed.
- The TPM is in lockout from too many failed attempts and the timeout is not
  clearing.
- The machine came from another organization's management and you want no
  trace of their keys.

>[!danger]
>Clearing the TPM destroys every BitLocker TPM protector on the machine.
>Have the recovery keys for every encrypted volume in hand, or decrypt first.
>Virtual smart cards and any other TPM-backed certificate are gone too.

It has to be done from the machine, signed in to Windows or at the firmware
setup screen. There is no way to do it from FOS, and no way to do it without
someone confirming at the keyboard on the next boot: the firmware asks
before it honors the request, precisely so that software cannot wipe a TPM
on its own.

- **From Windows:** elevated PowerShell, `Clear-Tpm`, then reboot. Or
  `tpm.msc` :octicons-arrow-right-24: **Clear TPM**. On reboot the firmware
  prompts to confirm; the key to press is on screen and differs by vendor.
- **From firmware setup:** the option sits under the security section. On
  Dell machines it is **Security :octicons-arrow-right-24: TPM 2.0 Security
  :octicons-arrow-right-24: Clear**.

After the clear, boot Windows once so it provisions the TPM, then set up
BitLocker and Hello as above.

## Quick reference

| You see | Cause | Do |
|---|---|---|
| FOS: `Found bitlocker signature in partition` at capture | Volume still encrypted, even if suspended | `manage-bde -off C:`, wait for *Fully Decrypted*, capture again |
| BitLocker recovery screen after deploy | TPM protector was made by another TPM | Enter recovery key, delete and re-add the TPM protector |
| BitLocker recovery screen after a firmware or Secure Boot change | PCRs changed | Enter recovery key, re-add the protector; next time suspend first |
| *Your PIN is no longer available* | Hello key is in another TPM | Set up the PIN again when prompted |
| *Something went wrong* `0x80090016` setting a PIN | Old container in the way | Remove the `Ngc` folder, reboot, re-enroll; add the post-download script so it never recurs |
| Hello fails even after that, or TPM lockout | TPM state itself | Clear the TPM from Windows or firmware, with recovery keys in hand |
