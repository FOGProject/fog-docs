---
title: Proxy DHCP with dnsmasq
description: Configuration of a proxy dhcp service like dnsmasq to use fog as a pxeboot server
context_id: proxy-dhcp
aliases:
    - Proxy DHCP with dnsmasq
    - Proxy DHCP using DNSMasq
    - Using FOG with an unmodifiable DHCP server
    - Proxy DHCP
    - installation/network-setup/legacy-proxy-dhcp
tags:
    - pxe
    - ipxe
    - dhcp
    - proxy
    - proxy-dhcp
    - option-66
    - option-67
    - advanced-configuration
    - network
    - network-config
---

# Proxy DHCP with dnsmasq

> [!important] FOG 1.6 boot file changes
> The way dnsmasq works as a proxyDHCP server is **unchanged** between FOG 1.5.x and
> 1.6 — it still hands the client a next-server (your FOG server's IP) and a boot
> file name over TFTP. What changed in 1.6 is **which** boot file FOG expects UEFI
> clients to load. The table below lists the old and new file names; the examples
> on this page already use the 1.6 names.

| Client type | DHCP arch | FOG 1.5.x boot file | **FOG 1.6 boot file** | **1.6 Secure Boot** |
| --- | --- | --- | --- | --- |
| BIOS / legacy | `00000` | `undionly.kpxe` | `undionly.kkpxe` | n/a — no Secure Boot in BIOS mode |
| 32-bit UEFI | `00006` | `i386-efi/ipxe.efi` | `i386-efi/snponly.efi` | **not possible** — see below |
| 64-bit UEFI | `00007`/`00008`/`00009` | `ipxe.efi` | `snponly.efi` | `secureboot/snponly-shimx64.efi` |
| ARM64 UEFI | `00011` | — | `arm64-efi/snponly.efi` | `secureboot/arm64-efi/snponly-shimaa64.efi` |

FOG 1.6 standardized on the SNP-driver `snponly.efi` binaries, which are far more
reliable on modern UEFI firmware than the older UNDI-driver `ipxe.efi`. These are
the exact file names the FOG 1.6 installer configures for its own ISC/Kea DHCP
server, so they are the correct values to put in your dnsmasq config too. All of
these files ship in `/tftpboot` on a 1.6 server.

If any of your clients have Secure Boot enabled, read
[Secure Boot and proxyDHCP](#secure-boot-and-proxydhcp) before choosing which
column to use — the short version is that the Secure Boot files are safe to hand
to *every* 64-bit UEFI client, whether Secure Boot is on or off.

## dnsmasq's Roles in FOG

**From the perspective of FOG**, dnsmasq is used when there is an existing DHCP service on the network that must continue to be used and cannot be altered to support FOG. dnsmasq is a form of Proxy DHCP. It listens for DHCP requests (from hosts) and responses (from dhcp service). When a request and response is heard, dnsmasq "adds to" the response. For it's role in fog, it adds the next-server and file name options. These are known in Windows as DHCP Options 066 and 067.

Ideal scenarios for dnsmasq include:


> [!Info] 
> -   When you are unwilling or unable to turn off DHCP services on a consumer-grade piece of network equipment (such as an ISP-provided device or low-end store purchased device)
> -   When you are unwilling or unable to run DHCP on your FOG Server.
> -   When you do not have access or permission to change the DHCP service at your place of employment.
> -   When changes to your employer's DHCP service may be overly complex to perform.
> -   When errors made in the configuration of your employer's DHCP service could cause an unwanted, unplanned, or unexpected network outage.
> -   When you intend your FOG server to be portable.


## How ProxyDHCP works

1.  When a PXE client boots up, it sends a DHCP Discover broadcast on the network, which includes a list of information the client would like from the DHCP server, and some information identifying itself as a PXE capable device.
2.  A regular DHCP server responds with a DHCP Offer, which contains possible values for network settings requested by the client. Usually a possible IP address, subnet mask, router (gateway) address, dns domain name, etc.
3.  Because the client identified itself as a PXEClient, the proxyDHCP server also responds with a DHCP Offer with additional information, but not IP address info. It leaves the IP address assigning to the regular DHCP server. The proxyDHCP server provides the next-server-name and boot file name values, which is used by the client during the upcoming TFTP transaction.
4.  The PXE Client responds to the DHCP Offer with a DHCP Request, where it officially requests the IP configuration information from the regular DHCP server.
5.  The regular DHCP server responds back with an ACK (acknowledgment), letting the client know it can use the IP configuration information it requested.
6.  The client now has its IP configuration information, TFTP Server name, and boot file name and it initiate a TFTP transaction to download the boot file.

  

## Install dnsmasq on CentOS 7

Reference: [https://forums.fogproject.org/topic/6376/install-dnsmasq-on-centos-7](https://forums.fogproject.org/topic/6376/install-dnsmasq-on-centos-7)

Setting up DNSMasq on Centos 7 is pretty straight forward and can be done in about 10 minutes.

Use case(s):

1.  You don't have administrative access to the dhcp server for your subnet/network (such as an ISP run router)
2.  Your dhcp server is a basic one like what you might find if you use a home class internet router.

Here are the steps needed to setup dnsmasq on your FOG server running under Centos 7

1.  Ensure that Centos is up to date

`yum upgrade -y`

2.  Install the service

`yum install dnsmasq -y`

3.  Create a config file for your FOG server

`vi /etc/dnsmasq.d/ltsp.conf` (hint: I'm old school and use vi exclusively, you may use what ever editor you choose)

4.  Paste in the following settings
## Dns Masq LTSP settings

```
# Don't function as a DNS server:
port=0

# Log lots of extra information about DHCP transactions.
log-dhcp

# Set the root directory for files available via FTP.
tftp-root=/tftpboot

# The default boot filename (BIOS / legacy), Server name, Server Ip Address
dhcp-boot=undionly.kkpxe,,<fog_server_IP>

# Disable re-use of the DHCP servername and filename fields as extra
# option space. That's to avoid confusing some old or broken DHCP clients.
dhcp-no-override

# inspect the vendor class string and match the text to set the tag
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009

# Set the boot file name based on the matching tag from the vendor class (above).
# FOG 1.6 uses the snponly.efi (SNP driver) binaries for UEFI.
dhcp-boot=net:UEFI32,i386-efi/snponly.efi,,<fog_server_IP>
dhcp-boot=net:UEFI,snponly.efi,,<fog_server_IP>
dhcp-boot=net:UEFI64,snponly.efi,,<fog_server_IP>

# PXE menu.  The first part is the text displayed to the user. 
# The second is the timeout, in seconds.
pxe-prompt="Booting FOG Client", 1

# The known types, IN THE ORDER DNSMASQ NUMBERS THEM, are x86PC(0), PC98(1),
# IA64_EFI(2), Alpha(3), Arc_x86(4), Intel_Lean_Client(5), IA32_EFI(6),
# x86-64_EFI(7), Xscale_EFI(8), BC_EFI(9), ARM32_EFI(10), ARM64_EFI(11).
# NOTE: dnsmasq's names for 7 and 9 are the reverse of RFC 4578, where 7 is
# "EFI BC" and 9 is "EFI x86-64". Most 64-bit UEFI firmware reports arch 7,
# which dnsmasq calls x86-64_EFI -- NOT BC_EFI. Getting this backwards means
# your rule silently never matches. dnsmasq also accepts the bare number, which
# is unambiguous, so prefer that if you are unsure.
#
# THE TRAILING SERVER IP IS REQUIRED. Given a bare filename, dnsmasq announces
# ITSELF as the boot server and only works if it is also running a TFTP server
# (enable-tftp). This config is not -- so without the IP the client performs PXE
# boot server discovery, gets no usable answer, and dies with
# "PXEBS ... Connection timed out" while dnsmasq's log cheerfully shows the
# right filename being offered. Naming the FOG server sends it to FOG's tftpd.
# This option is first and will be the default if there is no input from the user.
pxe-service=X86PC, "Boot to FOG", undionly.kkpxe, <fog_server_IP>
pxe-service=X86-64_EFI, "Boot to FOG UEFI", snponly.efi, <fog_server_IP>
pxe-service=BC_EFI, "Boot to FOG UEFI PXE-BC", snponly.efi, <fog_server_IP>

dhcp-range=<fog_server_ip>,proxy
```

**You must update the <fog_server_ip> values with the exact IP address of your FOG server.**

> [!warning] `pxe-service` overrides `dhcp-boot` for UEFI clients
> When exactly one `pxe-service` line matches a UEFI client's architecture,
> dnsmasq answers it from that line and **skips the `dhcp-boot` rules entirely**.
> If you change a UEFI boot file and nothing happens, you almost certainly edited
> `dhcp-boot` when the `pxe-service` line is what is being used. Change both, and
> keep them in agreement.

10.  Restart the dnsmasq service

`systemctl restart dnsmasq.service`

12.  Then ensure dnsmasq service starts on each boot.

systemctl enable dnsmasq.service

For the copy and paste people like me here is the concise version.

```
yum upgrade -y
yum install dnsmasq -y
vi /etc/dnsmasq.d/ltsp.conf
<insert text>
<update settings in text>

systemctl restart  dnsmasq.service
systemctl enable dnsmasq.service
```

## The client downloads iPXE but then fails to reach FOG

dnsmasq's only job is to get the client to TFTP-download the iPXE binary
(`undionly.kkpxe` / `snponly.efi`). What happens next depends on the firmware
mode. Every UEFI binary FOG ships is built **without** its boot script compiled
in, so iPXE fetches `autoexec.ipxe` from the TFTP root and runs that; the BIOS
builds carry their script internally and ignore the file — see
[[installation/network-setup/dhcp-server-settings#How UEFI clients get their boot script|How UEFI clients get their boot script]].
Either way the script chainloads `tftp://<fog_server_IP>/default.ipxe`, which in
turn chainloads your FOG server's boot script over HTTP or HTTPS. Which of those
two it is depends on `BOOT_url_proto`, not on how you reach the web interface —
see [[netboot-transport-and-pki|Netboot Transport and PKI]].

If the client loads iPXE but then hangs or errors when contacting FOG, the
dnsmasq config is usually fine and the problem is downstream:

> [!note] FOG 1.6 + HTTPS
> A 1.6 install serves the web interface over HTTPS by default, but **netboot
> stays on HTTP** unless you asked for otherwise — they are separate settings.
> The HTTP→HTTPS redirect is off by default as well, and the installer only
> recompiles the iPXE binaries if you chose `--install-mode embed-ca` or passed
> `--rebuild-ipxe-with-my-ca`. See
> [[netboot-transport-and-pki|Netboot Transport and PKI]] for which combination
> you want.
>
> If netboot *is* on HTTPS, make sure dnsmasq's `tftp-root` points at the FOG
> server's own `/tftpboot` (or that the files are copied from it), not an older
> or hand-built set of binaries — otherwise the chainload will fail with a
> certificate error after iPXE loads.

## Serving ProxyDHCP to multiple subnets

If you're serving ProxyDHCP to multiple subnets, some changes must be made to
your switches/routers and your server config:

1.  Add a subnet mask to your `dhcp-range` line, e.g. changing
    `dhcp-range=<fog_server_ip>,proxy` to
    `dhcp-range=<fog_server_ip>,proxy,255.255.0.0` to serve all `192.168.x.x`
    subnets. Use `255.0.0.0` (8-bit) for `10.x.x.x` addressing, or
    `255.240.0.0` (12-bit) for `172.16.x.x`. Set the mask so every subnet
    ProxyDHCP should answer on is covered — without this, the ProxyDHCP
    server won't respond to requests from hosts outside its own subnet.
2.  Add an IP Helper / DHCP Relay record to your router or switch so DHCP
    broadcasts are sent to both your normal DHCP server and the FOG server.

## Secure Boot and proxyDHCP

### No, DHCP cannot detect Secure Boot — and it does not need to

A common first instinct is to make dnsmasq notice that a client has Secure Boot
enabled and hand it a signed binary, sending everyone else the ordinary one.
**That is not possible.** The client's DHCP request comes from firmware before
any operating system exists, and it carries no indication of Secure Boot state.
Option 93 (`PXEClient:Arch:NNNNN`) reports only the client *architecture* —
BIOS, 32-bit UEFI, 64-bit UEFI, ARM64. There is no option, vendor class, or
user class that reports whether Secure Boot is on, and no proxyDHCP server of
any kind can infer it.

The reason this does not matter is that **the signed chain works whether Secure
Boot is enabled or not.** `shim` is an ordinary UEFI application that happens to
carry a Microsoft signature. With Secure Boot on, the firmware verifies it and
it verifies what it loads next; with Secure Boot off, the firmware verifies
nothing and shim does not enforce anything either. It simply boots.

So the correct configuration is not a conditional — it is to point **every**
64-bit UEFI and ARM64 client at the Secure Boot files unconditionally. That set
is a superset: it covers the Secure Boot machines and costs the others nothing.

### The optimal configuration

```
# Architecture tags, as above.
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009
dhcp-vendorclass=ARM64,PXEClient:Arch:00011

# BIOS clients: Secure Boot does not exist in BIOS/CSM mode, so this is
# unchanged.
dhcp-boot=net:BIOS,undionly.kkpxe,,<fog_server_IP>

# 64-bit UEFI and ARM64: always the shim chain, Secure Boot on or off.
dhcp-boot=net:UEFI,secureboot/snponly-shimx64.efi,,<fog_server_IP>
dhcp-boot=net:UEFI64,secureboot/snponly-shimx64.efi,,<fog_server_IP>
dhcp-boot=net:ARM64,secureboot/arm64-efi/snponly-shimaa64.efi,,<fog_server_IP>

# 32-bit UEFI: unsigned, and it cannot be otherwise. See below.
dhcp-boot=net:UEFI32,i386-efi/snponly.efi,,<fog_server_IP>

# Remember that for UEFI clients these pxe-service lines, not the dhcp-boot
# rules above, are what actually decides the file. Keep them in agreement.
pxe-prompt="Booting to FOG", 1
pxe-service=X86PC, "Boot to FOG", undionly.kkpxe, <fog_server_IP>
pxe-service=IA32_EFI, "Boot to FOG", i386-efi/snponly.efi, <fog_server_IP>
pxe-service=x86-64_EFI, "Boot to FOG", secureboot/snponly-shimx64.efi, <fog_server_IP>
pxe-service=BC_EFI, "Boot to FOG", secureboot/snponly-shimx64.efi, <fog_server_IP>
pxe-service=ARM64_EFI, "Boot to FOG", secureboot/arm64-efi/snponly-shimaa64.efi, <fog_server_IP>

dhcp-range=<fog_server_ip>,proxy
```

Both arch 7 and arch 9 are listed because firmware disagrees about which one
means "64-bit UEFI" — most reports 7, some reports 9. Point both at the same
file and the disagreement stops mattering.

### Why the boot file names the shim and not the loader

`secureboot/snponly-shimx64.efi` and `secureboot/ipxe-shimx64.efi` are the
**same signed binary**, staged under two names — you can confirm it from the
sha256 values in `/tftpboot/secureboot/MANIFEST`. It is upstream `ipxe/shim`,
signed by Microsoft.

The name still matters, because ipxe/shim carries a patch that strips the
`-shim<arch>` infix from the path it was itself fetched from and loads *that*
file out of the same directory. So the file you name in DHCP chooses the
loader:

| DHCP boot file | shim then loads | iPXE uses |
| --- | --- | --- |
| `secureboot/snponly-shimx64.efi` | `secureboot/snponly.efi` | the firmware's UEFI SNP driver |
| `secureboot/ipxe-shimx64.efi` | `secureboot/ipxe.efi` | iPXE's own built-in NIC drivers |

Start with the `snponly` name. **If the chain loads but the network never comes
up, the firmware's own SNP implementation is at fault — switch the DHCP file
name to `secureboot/ipxe-shimx64.efi`.** That is a DHCP-only change; nothing is
renamed on the server.

### 32-bit UEFI cannot do Secure Boot with FOG

There is no Microsoft-signed 32-bit shim and no signed 32-bit iPXE, so there is
nothing signed to point an ia32 UEFI client at. Such machines must have Secure
Boot **disabled** to network boot. FOG refuses Secure Boot enrollment on them
outright rather than half-completing it, and 1.6 hides the "Enroll Secure Boot
Key" boot-menu entry from clients that booted in BIOS/CSM mode for the same
reason: an option that cannot succeed should not be offered.

> [!note] Secure Boot and HTTPS are not mutually exclusive
> Earlier versions of this page said they were. They are not, and FOG 1.6 stages
> the Secure Boot binaries in **every** install mode, HTTPS included.
>
> An HTTPS *web interface* has no bearing on netboot at all — netboot has its own
> protocol setting. And HTTPS *netboot* only needs a rebuilt iPXE when your
> certificate comes from a private CA: iPXE cross-certifies public roots on its
> own, so a publicly-issued certificate on an FQDN needs no rebuild and keeps the
> signed shim. Where a rebuild genuinely is required, FOG signs the result with
> this server's own Secure Boot key and shim loads it once that key is enrolled.
> See [[netboot-transport-and-pki|Netboot Transport and PKI]].

> [!important] The boot file is only half of Secure Boot
> Getting a signed iPXE to load is the part dnsmasq controls. The FOS kernel FOG
> boots afterward must also be trusted by the machine, which is a separate
> setup step — see [Secure Boot signing](../../kb/how-tos/secure-boot-signing.md).
> A correct DHCP configuration with an untrusted kernel gets you a signed iPXE
> and then a failure one step later.

## Advanced dnsmasq techniques

Reference: [https://forums.fogproject.org/topic/8726/advanced-dnsmasq-techniques](https://forums.fogproject.org/topic/8726/advanced-dnsmasq-techniques)

Now lets say we have a computer that will not boot with the default snponly.efi file, but instead we need the alternate intel.efi boot kernel. We'll add some dynamics to our above script so that for all computers except for our specific model snponly.efi is sent to the client and when we pxe boot our specific client intel.efi is sent to just that computer.

I do have to post a caveat here. The uuid field "should" represent the device type for the model and not the unique and individual device (we could use the mac address for that). I have not tested like model computers to see if the uuid is an exact match. I do see references to that this field contains two parts the uuid and guid bits. We may need to parse those if I find that these numbers are not model specific.

In the script above we're going to add a new pattern match test just under the vendor class match. Modify the above script to look similar to this snippet.

### inspect the vendor class string and match the text to set the tag

```
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009
```

```
# UUID for a Dell e6230 I tested (this info was gleaned from the dnsmasq log file that 
# recorded a pxe boot session of this target computer
dhcp-match=set:e6230,97,00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31
```

What this dhcp-match command does is set the flag e6230 to TRUE if dhcp option 97 {uuid/guid client identifier} if the data matches "00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31" now if we determine a sub section of this uuid field is sufficient to identifiy the client we could shorten this pattern match to let say "00:44:45:4c:4c:38:00:10:36" if this properly identifies the e6230 (I simply don't know as of now).

Now that we have the match command we need to do something with that match. That is where the next line comes in. We'll add another dncp-boot line. First I'll mention a dhcp-boot line that we are NOT going to use and why. This line is close to what we want in the file config file

	dhcp-boot=tag:e6230,intel.efi,192.168.112.24 192.168.112.24

To decode this line there is a conditional test (if (tag:e6230 == true) then Send "intel.efi" from the following tftp server 192.168.112.24. So if our pattern matches above and set the tag e6230 true then send intel.efi.

The reason why we **don't want to use this one** is because it will match as long as the uuid is the same. This means that the intel.efi boot file name will be sent if the computer is in uefi mode as well as bios (legacy) mode. To correct this behavior we'll add another conditional test which creates an AND condition. What we want is to send the intel.efi file name if e6230 and UEFI flags are set. This dhcp-boot line would look like this:

	dhcp-boot=tag:UEFI,tag:e6230, intel.efi, 192.168.112.24, 192.168.112.24

So this line will match when the UEFI tag is true (set by the vendor class match of "dhcp-vendorclass=UEFI,PXEClient:Arch:00007") and the e6230 tage is true.

Remember I said above the order of the dhcp-boot lines appear to be important. The last match will win so we want to place this new dhcp-boot line at the bottom of the list. Adding this line in will make our total ltsp config file look like this.
```
port=0

# Log lots of extra information about DHCP transactions.
log-dhcp

# Set the root directory for files available via FTP.
tftp-root=/tftpboot

# Disable re-use of the DHCP servername and filename fields as extra
# option space. That's to avoid confusing some old or broken DHCP clients.
dhcp-no-override

# inspect the vendor class string and match the text to set the tag
dhcp-vendorclass=BIOS,PXEClient:Arch:00000
dhcp-vendorclass=UEFI32,PXEClient:Arch:00006
dhcp-vendorclass=UEFI,PXEClient:Arch:00007
dhcp-vendorclass=UEFI64,PXEClient:Arch:00009

#UUID for a Dell e6230 I tested (this info was gleaned from the dnsmasq log file that recorded
# a pxe boot session of this target computer
dhcp-match=set:e6230,97,00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31

# Set the boot file name based on the matching tag from the vendor class (above)
dhcp-boot=net:UEFI32,i386-efi/snponly.efi,,192.168.112.24
dhcp-boot=net:UEFI,snponly.efi,,192.168.112.24
dhcp-boot=net:UEFI64,snponly.efi,,192.168.112.24

# Our test to ensure both the UEFI and e6230 tags are set. 
dhcp-boot=tag:UEFI,tag:e6230, intel.efi, 192.168.112.24, 192.168.112.24

# The default boot filename (BIOS / legacy), Server name, Server Ip Address
dhcp-boot=undionly.kkpxe,,192.168.112.24

# PXE menu.  The first part is the text displayed to the user.  The second is the timeout, in seconds.
pxe-prompt="Booting FOG Client", 1

dhcp-range=192.168.112.24,proxy
```
Save the file and exit out of the editor. Then restart the dnsmasq service.

Its been a while since I posted this. This knowledge here and above has been gleaned from some google-fu searches and trial and error (the hacker's way) to come up with the above. I'm sure much of this thread is inaccurate and the rest is completely wrong. This information is content that I've been able to compile of the past 2 days of testing. If you discover any information is inaccurate in this thread, please DM me and I'll integrate it into this document.

An interesting fact I found while researching the dhcp-match command for dhcp option 97. For the dell computers the uuid string of '00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31" If you discount the first 8 bits [00] (i.e just look at. 44:45:4c:4c) that spells dell in hex ascii.

### Match filter troubles

This last post is about the troubles I had when trying to build the match filter. I knew from past experieences that there was a uuid field and that data was sent with the initial dhcp request. I first saw this information when you pxe boot a target computer in bios (legacy) mode. It is displayed on the screen with the dhcp server's address, target computer's IP, netmask and gateway information. But usually it flies off the screen so quick its hard to document since its so long.

I did a little research on this dhcp option ( 97 client-identifier ) field and this is what I found in the RFQ that describes these dhcp fields. Here is a snippet of the rfq (note this is not my intellectual property only a reprint from the original RFC-4361 [https://tools.ietf.org/html/rfc4361](https://tools.ietf.org/html/rfc4361))

   DHCPv4 clients that support more than one network interface SHOULD
   use the same DUID on every interface.  DHCPv4 clients that support
   more than one network interface SHOULD use a different IAID on each
   interface.

I did have some trouble getting the pattern match just right (inserted correctly below).

	dhcp-match=set:e6230,97,00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31

My first attempt at the text to match came from the dhcp request in wireshark. This dhcp option 97 was presented as "4c:4c:45:44:00:38:36:10:80:4e:c4:c0:4f:4a:58:31" in wireshark. So I pasted that into the dhcp-match and the match failed so the action never fired. (!!). Looking now at the raw data wireshark presented the proper information, according to the RFC, was in the dhcp packet it was not just presented on the screen.

SO I knew the log-dhcp option was set in the dnsmasq file, I checked the /var/log/syslog file and there was all of the dhcp information I was searching for, except... the dhcp option 97 line contained "00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a..." ( !! ) its incomplete!

So being the hacker I am I merged the information from wireshark with the information from the dnsmasq log to produce the final match filter.

```
#From wireshark
   4c:4c:45:44:00:38:36:10:80:4e:c4:c0:4f:4a:58:31
#From syslog
00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a...

#Produced
00:44:45:4c:4c:38:00:10:36:80:4e:c4:c0:4f:4a:58:31
```
Looking at it now I'm not even sure why it worked. I know the UUID/IAD is constructed with two parts. And based on the number from wireshark I can see there is a big endian little endian thing going on for the UUID. but that doesn't explain how the IAD part is correct.

I'm not sure where the 00: prefix comes from the number too. I know the first 4 letters should spell dell for dell computers. If you watch the bios boot screen you can see the UUID number presented there is something like 44454c4c4544-0038-3610-804ec4c04f4a5831 (hint it goes very fast), but you can see lines up with what dnsmasq reported minus the leading 00. It would be interesting to know how dell decides on the UUID for a specific model. I'm sure there is some encoding going on.

### Compiling dnsmasq 2.76 if you need uefi support

>[!note]
>There are newer versions of dnsmasq that may be available through package managers now. This is still provided for reference on how to compile a specific version yourself


Reference: [https://forums.fogproject.org/topic/8725/compiling-dnsmasq-2-76-if-you-need-uefi-support](https://forums.fogproject.org/topic/8725/compiling-dnsmasq-2-76-if-you-need-uefi-support)

There has been a brilliant bit of code added to dnsmasq 2.76 (May 2016) to provide / fix support for sending uefi boot information to uefi systems. As of now most up to date Linux Distros have this version of dnsmasq available for install.

In this tutorial I'll outline the steps required to compile and install this latest version of dnsmasq for common distributions of linux. I don't have access to every version and/or flavor so I'll only document what I've personally perform. I would encourage other, that can, document their experiences here with flavors/versions of linux that I don't cover.

Before you compile this updated version of dnsmasq be sure that you install the version of dnsmasq from your linux distributions, package repository. This way you will be sure that all of the supporting scripts and dependences have been installed. In the steps below we will just replace the dnsmasq binary with the latest compiled version.

  
**Ubuntu 16.04 LTS based systems**

Build system: Mint 18 x64 (Based on Ubuntu 16.04 LTS) (note the following instructions worked perfectly for Raspbian Jessie which is Debian based)

1.  First we need to setup our build environment

sudo apt-get update

sudo apt-get install build-essential

sudo apt-get install -y wget libdbus-1-dev libnetfilter-conntrack-dev idn libidn11-dev nettle-dev libval-dev dnssec-tools 

3.  Next we'll get the source code for dnsmasq 2.76

`wget http://www.thekelleys.org.uk/dnsmasq/dnsmasq-2.76.tar.gz`

5.  Extract the source code from the tar file

`tar -zxf dnsmasq-2.76.tar.gz`

7.  Change into the dnsmasq build directory

`cd dnsmasq-2.76`

9.  Lets update a few settings in the config file. I know there are other ways to go about this with command line switches, but I didn't

`sudo vi src/config.h`

11.  Find this section
```
/* #define HAVE_LUASCRIPT */
/* #define HAVE_DBUS */
/* #define HAVE_IDN */
/* #define HAVE_CONNTRACK */
/* #define HAVE_DNSSEC */
```

13.  Paste in these settings just below the above text

```
#define HAVE_DBUS
#define HAVE_IDN
#define HAVE_IDN_STATIC
#define HAVE_CONNTRACK
#define HAVE_DNSSEC
```

15.  Save and exit the config.h file
16.  We need to see where the current dnsmasq file is located. (NOTE: Please be sure that dnsmasq has already been installed in your linux distribution to ensure all of the dependences have been installed before we proceed)

`which dnsmasq`

18.  This command should respond with something like this:

```
# which dnsmasq
/usr/sbin/dnsmasq
```

21. The key bit of info here is that dnsmasq is installed in **/usr/sbin**. What we need to do is tell the install script to not place the dnsmasq files in the default location (according to dnsmasq of /usr/local/sbin) but to place the files where the distribution dnsmasq put them (/usr/sbin). SO in this case we want to overwrite the dnsmasq binary in /usr/sbin. To do this we need to update the prefix variable in the Makefile (compiler instruction file)
22.  Since we know where dnsmasq is now, lets go and update the Makefile to reflect the location where we dnsmasq installed

`sudo vi Makefile`

23.  Search for this line and change

```
PREFIX        = /usr/local
# To this
PREFIX        = /usr
```

25.  Save and exit out of the Makefile
26.  Lets backup the original dnsmasq executable just in case...

`sudo cp /usr/sbin/dnsmasq /usr/sbin/dnsmasq.old`

28.  Ok here's where we create and install the latest version of dnsmasq

`sudo make install`

At this point the compiler will dig through the source code and compile the dnsmasq program. Hopefully it will compile and install without errors.

31.  Once the install is done lets ensure that the right version of dnsmasq is found first in the search path.
32.  Key in the following

`dnsmasq -v` 

The output should look like this:

```
Dnsmasq version 2.76  Copyright (c) 2000-2016 Simon Kelley
Compile time options: IPv6 GNU-getopt DBus no-i18n IDN DHCP DHCPv6 no-Lua TFTP conntrack ipset auth DNSSEC loop-detect inotify


This software comes with ABSOLUTELY NO WARRANTY.
Dnsmasq is free software, and you are welcome to redistribute it
under the terms of the GNU General Public License, version 2 or 3.
```

35.  Ensure the version displays 2.76 if so you are all set
36.  The last and final step is to ensure that the application runs when the service is called.

`sudo service dnsmasq restart`

38.  If the service starts correctly (no errors) then you're done.
39.  If you question if dnsmasq is running the proper version you can always inspect /var/log/syslog for any dnsmasq error messages.