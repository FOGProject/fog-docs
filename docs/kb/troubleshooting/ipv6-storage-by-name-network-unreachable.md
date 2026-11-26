---
title: IPv6 Client Cannot Mount Storage by Name — Network is unreachable
aliases:
    - IPv6 Client Cannot Mount Storage by Name — Network is unreachable
    - Could not mount images folder Network is unreachable
description: An IPv6-only FOS client fails to mount a storage node given by a DNS name with A and AAAA records
context_id: ipv6-storage-by-name-network-unreachable
tags:
    - troubleshooting
    - fos
    - nfs
    - ipv6
---

# IPv6 Client Cannot Mount Storage by Name — Network is unreachable

>[!info] FOG 1.6 and later
>This affects FOS builds up to and including `EXP_20261125-194004`. The next FOS release fixes it. Get it with **FOG Configuration → Kernel Update**.

## Symptom

The client boots over IPv6 and gets a DHCPv6 lease. The storage node has a DNS name with an A record and an AAAA record. The task then stops at the mount:

```
 * Mounting File System..............................Failed
Could not mount images folder (/bin/fog.upload)
    Reason: mount: mounting storage.example.com:/images/dev/ on /images failed: Network is unreachable
```

A deploy shows the same error from `/bin/fog.download`.

A related symptom on the same clients: `nslookup` in a debug shell prints `bad address` for the DNS server.

## Cause

FOS mounts NFS with the busybox `mount` command. Busybox was built to prefer IPv4. For a name with an A record and an AAAA record, it took the A record. The IPv6-only client has no IPv4 route, so the mount failed with "Network is unreachable".

Separately, the FOS DHCPv6 script wrote each DNS server as `nameserver <address> # <interface>`. The busybox `nslookup` reads the whole rest of the line as the address, so it refused the line.

The fixed FOS takes the address order from the C library. That order puts the address family the client can reach first. The DHCPv6 script now writes plain `nameserver <address>` lines.

## Workaround for older FOS builds

Set the storage node's IP address in FOG to the IPv6 address, not the name. FOG puts it in brackets on the boot line, for example `storage=[fd00::5]:/images/`. A literal address needs no lookup.

## Related

- [[ipv6-network-boot|IPv6 Network Boot]]
