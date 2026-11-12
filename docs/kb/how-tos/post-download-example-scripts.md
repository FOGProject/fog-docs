---
title: Post Download Example Scripts
aliases:
    - Post Download Example Scripts
    - Driver Injection Example Scripts
description: Example post download scripts that inject Windows drivers and fill in unattend.xml, using $osClass
context_id: post-download-example-scripts
tags:
    - driver-injection
    - post-download
    - how-to
    - fos
---

# Post Download Example Scripts

>[!warning] Examples only
>These scripts are examples of one way to approach driver injection and
>`unattend.xml` changes. The FOG developers do not maintain them, and no FOG
>release installs or updates them. Read each script, change it to fit your
>environment, and test it on one host before you use it widely.

The scripts below are an update of the community scripts in
[Using FOG Postinstall scripts for Windows Driver injection 2017 ed.](https://forums.fogproject.org/topic/11126/using-fog-postinstall-scripts-for-windows-driver-injection-2017-ed)
on the FOG forums. They test `$osClass` instead of a list of OS IDs. See
[[post-download-scripts|Post Download Scripts]] for how FOS runs these files
and which variables it sets.

| File | What it does |
| --- | --- |
| `fog.postdownload` | Finds and mounts the Windows partition on `/ntfs`, then runs the other two scripts |
| `fog.copydrivers` | Copies the driver folder for this hardware model and Windows version into `C:\Drivers` |
| `fog.updateunattend` | Writes the computer name and, if the host joins a domain, the domain join into `unattend.xml` |

Put all three files in `/images/postdownloadscripts/` on the FOG server.
`fog.postdownload` replaces the file that the installer creates there.

## fog.postdownload

The script runs only for a Windows 7 or later image (`$osClass` is `win7` or
`winmodern`). On a FOS build older than 2026-11-10, `$osClass` is empty, so the
script sets it from `$osid`.

The call to `fog.updateunattend` is commented out. Remove the `#` to use it.

```bash
#!/bin/bash
. /usr/share/fog/lib/funcs.sh
[[ -z $postdownpath ]] && postdownpath="/images/postdownloadscripts/"
# FOS sets osClass from the image's OS (determineOS, FOS 20261110 or later).
# On an older FOS kernel osClass is empty, so derive it from the osid.
if [[ -z $osClass ]]; then
    case $osid in
        5|6|7) osClass="win7" ;;
        9|10|11) osClass="winmodern" ;;
    esac
fi
case $osClass in
    win7|winmodern)
        clear
        [[ ! -d /ntfs ]] && mkdir -p /ntfs
        getHardDisk
        if [[ -z $hd ]]; then
            handleError "Could not find hdd to use"
        fi
        getPartitions $hd
        for part in $parts; do
            umount /ntfs >/dev/null 2>&1
            fsTypeSetting "$part"
            case $fstype in
                ntfs)
                    dots "Testing partition $part"
                    ntfs-3g -o force,rw $part /ntfs
                    ntfsstatus="$?"
                    if [[ ! $ntfsstatus -eq 0 ]]; then
                        echo "Skipped"
                        continue
                    fi
                    if [[ ! -d /ntfs/windows && ! -d /ntfs/Windows && ! -d /ntfs/WINDOWS ]]; then
                        echo "Not found"
                        umount /ntfs >/dev/null 2>&1
                        continue
                    fi
                    echo "Success"
                    break
                    ;;
                *)
                    echo " * Partition $part not NTFS filesystem"
                    ;;
            esac
        done
        if [[ ! $ntfsstatus -eq 0 ]]; then
            echo "Failed"
            debugPause
            handleError "Failed to mount $part ($0)\n    Args: $*"
        fi
        echo "Done"
        debugPause
        . ${postdownpath}fog.copydrivers
        # . ${postdownpath}fog.updateunattend
        umount /ntfs
        ;;
    *)
        echo "Non-Windows Deployment"
        debugPause
        return
        ;;
esac
```

## fog.copydrivers

The script reads the hardware model from `dmidecode` and removes its spaces.
It takes the Windows version folder from `$osname`, and it checks for
`SysWOW64` to choose `x64` or `x86`. It then copies this folder from the FOG
server:

```
/images/drivers/<model>/<windows version>/<arch>
```

For example, a Dell OptiPlex 7090 with a Windows 11 image reads
`/images/drivers/OptiPlex7090/win11/x64`. The Windows version folders are:

| Image OS | Folder |
| --- | --- |
| Windows 7 | `win7` |
| Windows 8 | `win8` |
| Windows 8.1 | `win8.1` |
| Windows 10 | `win10` |
| Windows 11 | `win11` |
| Windows Server | `winserver` |

The script copies the drivers to `C:\Drivers`. Windows 10 and later install
them only if your `unattend.xml` points at that folder. Set
`Microsoft-Windows-PnpCustomizationsNonWinPE` > `DriverPaths` to
`C:\Drivers`. For Windows 7, 8 and 8.1, the script adds the folder to the
`DevicePath` registry value instead.

```bash
#!/bin/bash
ceol=`tput el`;
manu=`dmidecode -s system-manufacturer`;
dots "Identifying hardware"
case $manu in
    [Ll][Ee][Nn][Oo][Vv][Oo])
        machine=$(dmidecode -s system-version)
        ;;
    *I[Nn][Tt][Ee][Ll]*)
        # For the Intel NUC and intel mobo pick up the system type from the
        # baseboard product name
        machine=$(dmidecode -s baseboard-product-name)
        ;;
    *)
        # Dell and everything else
        machine=$(dmidecode -s system-product-name)
        ;;
esac

# if the machine isn't identified then no need to continue with this script, just return to caller
if [[ -z $machine ]]; then
    echo "Unable to identify the hardware for manufacturer ${manu}";
    debugPause;
    return;
fi
echo "${machine} Identified";

# Remove spaces from the machine name, works better with path definitions
machine="${machine//[[:space:]]/}"

dots "Verifying we've found the OS disk"
if [[ ! -d /ntfs/windows && ! -d /ntfs/Windows && ! -d /ntfs/WINDOWS ]]; then
    echo "! OS root Not found !";
    debugPause
    return;
fi
echo "Found";

dots "Verifying target Arch"
system64="/ntfs/Windows/SysWOW64/"
[[ ! -d $system64 ]] && arch="x86" || arch="x64"
echo "${arch} found";

debugPause

# Build the OS folder name from osname, which FOS sets from the image's OS.
# "Windows 10" becomes win10, "Windows 8.1" becomes win8.1, "Windows 11"
# becomes win11. So the folder names from the old osid table still match.
osn="${osname,,}"
osn="${osn//[[:space:]()]/}"
osn="${osn/windows/win}"

dots "Preparing Drivers"
clientdriverpath="/ntfs/Drivers"
remotedriverpath="/images/drivers/$machine/$osn/$arch"

debugPause

if [[ ! -d "${remotedriverpath}" ]]; then
    echo "failed";
    echo " ! Driver package not found for ${machine}/$osn/$arch ! ";
    debugPause;
    return;
fi
echo "Ready";

debugPause

[[ ! -d $clientdriverpath ]] && mkdir -p "$clientdriverpath" >/dev/null 2>&1
echo -n "In Progress"

rsync -aqz "$remotedriverpath" "$clientdriverpath" >/dev/null 2>&1

[[ ! $? -eq 0 ]] && handleError "Failed to download driver information for [$machine/$osn/$arch]"

debugPause

# Windows 7, 8 and 8.1 only. Windows 10 and later read the OEM driver path
# from the unattend.xml, so they skip the registry edit.
[[ $osClass != win7 ]] && return

regfile="/ntfs/Windows/System32/config/SOFTWARE"
key="\Microsoft\Windows\CurrentVersion\DevicePath"
devpath="%SystemRoot%\DRV;%SystemRoot%\inf;";
reged -e "$regfile" &>/dev/null <<EOFREG
ed $key
$devpath
q
y
EOFREG
```

## fog.updateunattend

The script changes the `unattend.xml` files that Windows Setup reads after
sysprep. It writes the FOG host name into `<ComputerName>`. If **Join Domain
after deploy** is on for the host, it also fills in the
`Microsoft-Windows-UnattendedJoin` section: `<JoinDomain>`,
`<MachineObjectOU>`, and the `<Username>` and `<Password>` inside
`<Credentials>`. It removes `<JoinWorkgroup>`.

A PXE boot does not give FOS the domain values, so the script asks the FOG
server for them. The server sends the join password only when
**FOG_HOSTKEY_ALLOWED_SOURCES** lists your imaging networks. See
[[post-download-scripts#Domain join password and product key|Domain join password and product key]].
When the password is empty, the script writes the computer name and skips the
domain join.

>[!note] The FOG Client is the safer choice
>This method writes the join password into the image's `unattend.xml` as
>plain text. The FOG Client joins the domain without writing the password to
>disk. Use this script only on hosts that do not run the FOG Client.

```bash
#!/bin/bash
# Sets the computer name and, for a host with "Join Domain" on, the domain
# join in the deployed image's unattend.xml. fog.postdownload sources this
# file with the Windows partition mounted on /ntfs.
#
# FOG sends these from the host record (service/hostinfo.php):
#   hostname                      the host name
#   hostusead                     1 when "Join Domain after deploy" is on
#   hostaddomain, hostadou        the domain and the OU
#   hostaduser, hostadpass        the join account and its password
# hostadpass is empty unless FOG Configuration > FOG Settings >
# FOG_HOSTKEY_ALLOWED_SOURCES lists the imaging network. The FOG Client
# joins the domain without writing the password to disk. Use this only
# where the client is not installed.

# Escape a value for XML text, then for the right side of a sed s|||.
# The quoted replacements stop bash 5.2 from reading & as "the match".
xmlEscape() {
    local s="$1"
    s="${s//&/'&amp;'}"
    s="${s//</'&lt;'}"
    s="${s//>/'&gt;'}"
    s="${s//\"/'&quot;'}"
    s="${s//\'/'&apos;'}"
    printf '%s' "$s"
}
sedEscape() {
    local s="$1"
    s="${s//\\/'\\'}"
    s="${s//|/'\|'}"
    s="${s//&/'\&'}"
    printf '%s' "$s"
}
xmlValue() {
    sedEscape "$(xmlEscape "$1")"
}

# The places Windows Setup reads an unattend.xml from after sysprep. The
# [x] in each name makes it a glob, so nocaseglob matches any case of it.
shopt -s nocaseglob nullglob
unattends=(
    /ntfs/[w]indows/[p]anther/[u]nattend.xml
    /ntfs/[w]indows/[p]anther/[u]nattend/[u]nattend.xml
    /ntfs/[w]indows/[s]ystem32/[s]ysprep/[u]nattend.xml
    /ntfs/[u]nattend.xml
)
shopt -u nocaseglob nullglob
if [[ ${#unattends[@]} -eq 0 ]]; then
    echo " * No unattend.xml found, skipping"
    debugPause
    return
fi

# A PXE boot does not carry the AD values on the kernel command line. Ask the
# server for them, the same way FOS does after a USB boot. Keep only the
# host* lines of the reply, and delete the reply because it holds the password.
if [[ -z $hostusead ]]; then
    curlcmd=(curl -Lks)
    command -v fog.curl >/dev/null 2>&1 && curlcmd=(fog.curl -Ls)
    sysuuid=$(dmidecode -s system-uuid)
    sysuuid=${sysuuid,,}
    [[ -z $mac ]] && mac=$(getMACAddresses)
    token=$("${curlcmd[@]}" --data "mac=$(echo $mac | base64)" "${web}status/hostgetkey.php")
    "${curlcmd[@]}" -o /tmp/hinfo.txt --data "sysuuid=${sysuuid}&mac=${mac}&hosttoken=${token}" "${web}service/hostinfo.php" -A ''
    if [[ -f /tmp/hinfo.txt ]]; then
        . <(grep -E '^\[\[ -z \$host[a-z]+ \]\] && export host[a-z]+=' /tmp/hinfo.txt)
        rm -f /tmp/hinfo.txt
    fi
fi

joinDomain=""
if [[ $hostusead == 1 && -n $hostaddomain ]]; then
    if [[ -z $hostadpass ]]; then
        echo " * No domain join password received, so the domain join is skipped."
        echo "   Set FOG_HOSTKEY_ALLOWED_SOURCES to the imaging network to send it."
        debugPause
    else
        joinDomain=1
        # Qualify a bare user name with the domain: DOMAIN\user.
        joinUser="$hostaduser"
        [[ $joinUser != *\\* && $joinUser != *@* ]] && joinUser="${hostaddomain}\\${joinUser}"
    fi
fi

name=$(xmlValue "$hostname")
for unattend in "${unattends[@]}"; do
    dots "Writing Computer Name to $unattend"
    sed -i "s|<ComputerName>[^<]*</ComputerName>|<ComputerName>${name}</ComputerName>|g" "$unattend"
    if [[ ! $? -eq 0 ]]; then
        echo "Failed"
        debugPause
        handleError "Failed to update $unattend"
    fi
    echo "Done"
    debugPause
    [[ -z $joinDomain ]] && continue
    dots "Setting the domain join in $unattend"
    # Username and Password change only inside <Credentials>. AutoLogon and
    # the local accounts use the same element names.
    sed -i \
        -e "/<JoinWorkgroup>/d" \
        -e "/<Credentials>/,/<\/Credentials>/s|<Password>[^<]*</Password>|<Password>$(xmlValue "$hostadpass")</Password>|" \
        -e "/<Credentials>/,/<\/Credentials>/s|<Username>[^<]*</Username>|<Username>$(xmlValue "$joinUser")</Username>|" \
        -e "s|<MachineObjectOU>[^<]*</MachineObjectOU>|<MachineObjectOU>$(xmlValue "$hostadou")</MachineObjectOU>|g" \
        -e "s|<JoinDomain>[^<]*</JoinDomain>|<JoinDomain>$(xmlValue "$hostaddomain")</JoinDomain>|g" \
        "$unattend"
    if [[ ! $? -eq 0 ]]; then
        echo "Failed"
        debugPause
        handleError "Failed to set the domain join in $unattend"
    fi
    echo "Done"
    debugPause
done
```
