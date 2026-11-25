---
title: Secure Boot Client Stops on the Wrong NIC or Waits for DHCP
aliases:
    - Secure Boot Client Stops on the Wrong NIC or Waits for DHCP
    - Please enter tftp server on a Secure Boot client
description: Secure Boot clients on a network with IPv6 router advertisements wait for DHCP, or stop on a NIC with no FOG server
context_id: secure-boot-dhcp-ipv6-router-advertisement
tags:
    - troubleshooting
    - pxe
    - secure-boot
    - ipxe
    - ipv6
---

# Secure Boot Client Stops on the Wrong NIC or Waits for DHCP

>[!info] FOG 1.6 and later
>This affects clients that boot the upstream-signed iPXE binaries in `/tftpboot/secureboot/`. FOG 1.6 dev-branch builds after 2026-11-25 fix it (iPXE `v2.0.0-fog.10`). The fix ships in the next FOG 1.6 patch release after 1.6.0.

## Symptom

The network sends IPv6 router advertisements. A Secure Boot client shows one of these:

- The `Configuring (net0 ...)` line takes about 16 seconds before `ok`, where other clients take about 4 seconds. This happens when the router advertisement asks for DHCPv6 and no DHCPv6 server answers.
- The client prints this, and then asks for a server:

```
Received DHCP answer on interface net0
...
Please enter tftp server:
```

This happens when net0 sees only a router advertisement, and the FOG network is on another NIC. The client never tries the other NIC.

Clients that boot FOG's own binaries do not show this.

## Cause

The upstream-signed iPXE binaries have IPv6 built in. FOG's boot script, `autoexec.ipxe`, used the `dhcp` command. In iPXE 2.x, `dhcp` is the same as `ifconf`, which runs every configurator, IPv6 included. So:

- An IPv6 router advertisement on its own counts as a DHCP answer.
- The command waits for DHCPv6 to finish before it continues.

The fixed script uses `ifconf -c dhcp` for each IPv4 step. That runs IPv4 DHCP only, which is what `dhcp` did before IPv6 was built in.

## What to do

Update to a FOG 1.6 build with the fix. The installer then installs iPXE `v2.0.0-fog.10` and its `autoexec.ipxe`.

On an older build, change the script by hand:

1. Make a backup of the script:

    ```
    sudo cp /tftpboot/autoexec.ipxe /root/autoexec.ipxe.bak
    ```

2. Change each `dhcp` command to `ifconf -c dhcp`. The installer hard-links one copy of `autoexec.ipxe` into each EFI directory, `secureboot/` included. So write the result back through the same file, with `cat`. Do not use `sed -i`. It replaces the file and breaks the links.

    ```
    sed -E 's/(&& )dhcp (net[0-9])/\1ifconf -c dhcp \2/; s/^dhcp &&/ifconf -c dhcp \&\&/' /tftpboot/autoexec.ipxe > /tmp/autoexec.ipxe
    sudo sh -c 'cat /tmp/autoexec.ipxe > /tftpboot/autoexec.ipxe'
    ```

3. Make sure that the linked copies show the change:

    ```
    find /tftpboot -name autoexec.ipxe -printf '%i %p\n'
    grep -rc 'ifconf -c dhcp' --include=autoexec.ipxe /tftpboot
    ```

    Each copy with the same inode number as `/tftpboot/autoexec.ipxe` shows 4. The copies under `/tftpboot/stock/` are separate files, and they still show 0.

The next FOG install replaces the script with the release copy.
