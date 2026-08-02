---
title: Firewall configuration for a FOG server
aliases:
    - Firewall configuration for a FOG server
description: Which ports a FOG server needs open and why, how the installer configures firewalld and ufw for you, and how to configure firewalld, ufw or iptables by hand
context_id: firewall
tags:
    - how-to
    - networking
    - firewall
    - security
---

# Firewall configuration for a FOG server

FOG is a network service. PXE clients, storage nodes and the FOG client all
have to reach it, so a firewall that is on and unconfigured makes a
correctly-installed server look completely broken.

Older FOG installers offered to **turn the firewall off** and did nothing at
all under `-y`. Current versions configure it instead. This page documents what
gets opened and why, and gives the manual steps for all three backends — for
sites that would rather do it themselves, that need to narrow what the
installer opened, or that run raw `iptables`, which FOG deliberately does not
touch.

## What FOG needs open

The installer opens only what your install actually uses, so your list may be
shorter than this one.

| Port | Protocol | What needs it | Only when |
|---|---|---|---|
| 80 | tcp | Web UI, FOG client check-in, iPXE boot files | always |
| 443 | tcp | The same, over TLS | HTTPS install |
| 69 | udp | TFTP — the initial PXE bootloader | TFTP installed |
| 21 | tcp | FTP control — image/snapin replication, node operations | always |
| 65000–65100 | tcp | FTP passive data | always |
| 2049 | tcp | NFS — image capture and deploy | always |
| 111 | tcp+udp | rpcbind, for NFS | always |
| 20048 | tcp+udp | NFS `mountd` | always |
| 67 | udp | DHCP | FOG is your DHCP server |
| 63100–63228 | udp | udpcast, for multicast tasks | always |

Two entries usually raise questions.

### Why NFS is always opened, even on a storage node

A storage node exists to serve images over NFS, so it needs these just as much
as the main server does. If you told the installer not to manage your exports
file, that only means FOG left `/etc/exports` alone — NFS is still running and
still needs to be reachable.

### Why 3306 is *not* opened

FOG never opens the database port, and you should not open it globally either.
Only **remote storage nodes** need to reach the master's database. If you run
them, open 3306/tcp **to those nodes specifically**:

```bash
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" \
    source address="10.0.0.50/32" port port="3306" protocol="tcp" accept'
firewall-cmd --reload
```

A single-server FOG install needs 3306 open to nothing at all.

## The two ports that are not simply "open a port"

These trip people up, so it is worth understanding them before you write rules
by hand.

### FTP passive data

FTP uses one connection for commands and a **second** for each transfer. In
passive mode the server picks the port for that second connection, and by
default `vsftpd` picks from the ephemeral range — tens of thousands of ports
you cannot sensibly open.

FOG solves this by *pinning* the range. The installer writes into
`vsftpd.conf`:

```
pasv_min_port=65000
pasv_max_port=65100
```

and opens exactly `65000-65100/tcp`. **If you change one you must change the
other.** A range pinned but not opened, or opened but not pinned, fails in a
way that looks like a network fault rather than a configuration mistake —
directory listings work, transfers hang.

### TFTP

TFTP has the same two-connection shape, but the data port **cannot** be pinned:
the server replies from a fresh ephemeral port and the client talks back to it.
A bare `--add-port=69/udp` therefore opens the initial request and drops every
packet of the actual transfer. PXE clients get as far as asking for a file and
then time out.

The fix is a connection-tracking helper, `nf_conntrack_tftp`, which teaches the
firewall to recognise the data connection as related to the request it already
allowed.

!!! warning "Helpers are no longer automatic"
    Modern kernels disable automatic helper assignment. Loading the module is
    not always enough on its own — see the per-backend sections below.

## firewalld

What the installer runs. Named services are used rather than bare ports
wherever one exists, because a firewalld service definition carries its
conntrack helper with it — `tftp.xml` declares `<helper name="tftp"/>`, which
is what makes PXE transfers work.

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https      # HTTPS installs only
firewall-cmd --permanent --add-service=tftp
firewall-cmd --permanent --add-service=ftp
firewall-cmd --permanent --add-service=nfs
firewall-cmd --permanent --add-service=mountd
firewall-cmd --permanent --add-service=rpc-bind
firewall-cmd --permanent --add-service=dhcp       # only if FOG serves DHCP

# No named service exists for these two
firewall-cmd --permanent --add-port=65000-65100/tcp
firewall-cmd --permanent --add-port=63100-63228/udp

firewall-cmd --reload
```

Check the result:

```bash
firewall-cmd --list-all
```

### Restricting to your imaging subnet

The installer opens these on the **default zone**, which covers every interface
that zone applies to. This is the only thing that works when the installer
cannot know which networks your PXE clients and storage nodes are on — but it
is wider than many sites want.

To restrict FOG to one subnet, put that subnet in its own zone and open the
services only there:

```bash
firewall-cmd --permanent --new-zone=fog
firewall-cmd --permanent --zone=fog --add-source=10.0.0.0/24
for s in http tftp ftp nfs mountd rpc-bind; do
    firewall-cmd --permanent --zone=fog --add-service=$s
done
firewall-cmd --permanent --zone=fog --add-port=65000-65100/tcp
firewall-cmd --permanent --zone=fog --add-port=63100-63228/udp

# then remove them from the default zone
for s in http tftp ftp nfs mountd rpc-bind; do
    firewall-cmd --permanent --remove-service=$s
done
firewall-cmd --permanent --remove-port=65000-65100/tcp
firewall-cmd --permanent --remove-port=63100-63228/udp
firewall-cmd --reload
```

!!! danger "Check your routing first"
    This breaks imaging for any client on a subnet you did not list, including
    PXE clients reaching you through a DHCP relay and any remote storage node.
    Those failures are silent from FOG's side — the client simply times out.

## ufw

ufw has no service definitions and no helper handling, so everything is an
explicit port and the TFTP helper must be loaded yourself.

```bash
# Load the TFTP conntrack helper, and make it survive a reboot.
echo nf_conntrack_tftp > /etc/modules-load.d/fog-conntrack.conf
modprobe nf_conntrack_tftp

ufw allow 80/tcp
ufw allow 443/tcp            # HTTPS installs only
ufw allow 69/udp
ufw allow 21/tcp
ufw allow 65000:65100/tcp
ufw allow 2049/tcp
ufw allow 111/tcp
ufw allow 111/udp
ufw allow 20048/tcp
ufw allow 20048/udp
ufw allow 67/udp             # only if FOG serves DHCP
ufw allow 63100:63228/udp
```

Note ufw writes ranges with a **colon**, not a hyphen.

ufw's stock `before.rules` already accepts `RELATED,ESTABLISHED`, so once
`nf_conntrack_tftp` is loaded the TFTP data transfer is recognised and allowed.
Without the module, PXE stalls after the first packet — and nothing in FOG's
logs will say so.

Check the result:

```bash
ufw status verbose
```

To restrict to a subnet, use ufw's `from` syntax instead:

```bash
ufw allow from 10.0.0.0/24 to any port 80 proto tcp
```

## iptables

**FOG does not configure raw iptables for you.** This is deliberate, not an
oversight. Persisting rules is distro-specific, and inserting into a ruleset
FOG did not create risks either landing *after* an existing `REJECT` — doing
nothing, silently — or breaking rules that were working. The installer detects
raw iptables, prints the commands, and leaves the decision to you.

```bash
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT      # HTTPS installs only
iptables -I INPUT -p udp --dport 69 -j ACCEPT
iptables -I INPUT -p tcp --dport 21 -j ACCEPT
iptables -I INPUT -p tcp --dport 65000:65100 -j ACCEPT
iptables -I INPUT -p tcp --dport 2049 -j ACCEPT
iptables -I INPUT -p tcp --dport 111 -j ACCEPT
iptables -I INPUT -p udp --dport 111 -j ACCEPT
iptables -I INPUT -p tcp --dport 20048 -j ACCEPT
iptables -I INPUT -p udp --dport 20048 -j ACCEPT
iptables -I INPUT -p udp --dport 67 -j ACCEPT       # only if FOG serves DHCP
iptables -I INPUT -p udp --dport 63100:63228 -j ACCEPT
```

iptables writes ranges with a **colon**.

### Rule order matters

`-I` inserts at the **top** of the chain, which is what you want — `-A` appends
to the bottom, and if your chain already ends in a `REJECT` or `DROP`, an
appended rule is never reached. Check where yours landed:

```bash
iptables -L INPUT -n --line-numbers
```

### The TFTP helper

Same requirement as ufw, plus an explicit rule, because modern kernels will not
assign the helper on their own:

```bash
echo nf_conntrack_tftp > /etc/modules-load.d/fog-conntrack.conf
modprobe nf_conntrack_tftp

iptables -A PREROUTING -t raw -p udp --dport 69 -j CT --helper tftp
iptables -I INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
```

### Persisting

Rules added with `iptables` are lost on reboot. How you keep them depends on
your distro:

**RHEL / Rocky / Alma / Fedora**

```bash
dnf install iptables-services
systemctl enable iptables
service iptables save          # writes /etc/sysconfig/iptables
```

**Debian / Ubuntu**

```bash
apt install iptables-persistent
netfilter-persistent save      # writes /etc/iptables/rules.v4
```

**Arch**

```bash
iptables-save > /etc/iptables/iptables.rules
systemctl enable iptables
```

Verify persistence by rebooting and re-running `iptables -L INPUT -n`. A rule
set that works until the next reboot is the most common way this goes wrong.

## Troubleshooting

A firewall problem almost never announces itself. FOG logs nothing, because
from FOG's point of view the client simply never arrived.

| Symptom | Likely cause |
|---|---|
| Web UI unreachable | 80/tcp or 443/tcp |
| PXE client gets an IP, then "file not found" or a timeout | 69/udp, or the TFTP conntrack helper |
| PXE menu appears, imaging fails immediately | 2049/tcp, 111, or 20048 (NFS) |
| Replication never completes; directory listing works | FTP passive range not open, or not matching `vsftpd.conf` |
| Multicast task starts but no client receives data | 63100–63228/udp |
| Storage node shows offline in the UI | 21/tcp, or 3306/tcp from the node to the master |

The fastest way to confirm a firewall is responsible is to test from a client:

```bash
# from a machine on the client network
nc -vz  <fog-server> 80
nc -vzu <fog-server> 69
```

If those succeed but imaging still fails, the firewall is not your problem. The
other control that fails just as silently is SELinux — check for denials with:

```bash
ausearch -m avc -ts recent
```

Note that a host in **permissive** mode still logs denials, so this is worth
running even if you believe SELinux is not enforcing.

!!! tip "Confirming it really is the firewall"
    Stopping the firewall briefly (`systemctl stop firewalld`) is a legitimate
    *diagnostic*. If imaging starts working, you know what to fix. Turning it
    off permanently is what this page exists to avoid.
