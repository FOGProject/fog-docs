## Netbooting Apple Mac {#netbooting_apple_mac}

Intel Macintoshs all use (U)EFI - where common PCs have a BIOS - to
bootstrap and to some extent talk to hardware. Several different ways
exist to make those Macs boot from network. Depending on your preference
and setup choose whichever suites you.

**Untested hint: Verbose Mac OS boot: sudo /usr/sbin/nvram
boot-args=\"-v\"**
(https://groups.google.com/forum/#!topic/macenterprise/y1RnrjpvSr4)

### Using stones (aka startup keys) {#using_stones_aka_startup_keys}

On startup (when you hear the sound, before Apple sign comes up) you can
hold down different keys to make the Mac boot from network. Apple uses a
kind of special protocol called BSDP which is partly similar to the well
known DHCP protocol. But there is more to it. Find a detailed
explanation [here](https://static.afp548.com/mactips/bootpd.html) if you
want to dig into it. This method is called \'Using stones\' as people
use stones or other similar objects to boot a whole lab of Mac clients
by putting a stone on the keyboard to hold down the \'n\' key - but
there are other ways to achieve this too!

#### ISC DHCP Server {#isc_dhcp_server}

To make a Mac client boot from network you need to extend your DHCP
server configuration. Add the following option to your subnet section:

`subnet ... {`\
`    authoritative;`\
`    ...`\
`}`

To issue special answers to Mac clients you also need to define a class:

`class "Apple-Intel-Netboot" {`\
`    match if substring (option vendor-class-identifier, 0, 14) = "AAPLBSDPC/i386";`\
`    option dhcp-parameter-request-list 1,3,17,43,60;`\
`    if (option dhcp-message-type = 1) {`\
`        option vendor-class-identifier "AAPLBSDPC/i386";`\
`        option vendor-encapsulated-options 08:04:81:00:00:67;`\
`    }`\
`    filename "ipxe.efi";`\
`    next-server x.x.x.x;`\
`}`

**Important note: This simple config might only work with older Mac OS
clients like MacBook1,1, MacBook6.2 and others. For newer models you
need the [advanced config](FOG_on_a_MAC#fancy "wikilink")**

Restart the DHCP server after saving the configuration. Then booting up
your Mac client hold down the \'n\' key and you will see a globe
spinning instead of the usual apple sign. The Mac requests an IP from
the DHCP server which advises it to load iPXE via TFTP and boot that up.

##### architecture

That was easy. So now we can go into the details of delivering different
iPXE binaries for varying Mac platforms:

`class "Apple-Intel-Netboot" {`\
`    match if substring (option vendor-class-identifier, 0, 14) = "AAPLBSDPC/i386";`\
`    option dhcp-parameter-request-list 1,3,17,43,60;`\
`    if (option dhcp-message-type = 1) {`\
`        option vendor-class-identifier "AAPLBSDPC/i386";`\
`        option vendor-encapsulated-options 08:04:81:00:00:67;`\
`    }`\
`    next-server x.x.x.x;`\
`    if (substring (option vendor-class-identifier, 15, 10) = "MacBook1,1") {`\
`        # 32 bit`\
`        filename "i386-efi/ipxe.efi";`\
`    }`\
`    elsif (substring (option vendor-class-identifier, 15, 10) = "MacBook6,1") {`\
`        # 64 bit`\
`        filename "ipxe.efi";`\
`    }`\
`    #`\
`    # add more 'elsif' here to suit your needs`\
`    #`\
`    else {`\
`        # default to ipxe.efi as new hardware is likely to be 64 bit`\
`        log(INFO, concat ("Unknown identifier '", substring (option vendor-class-identifier, 15, 64), "' you might want to add to your config."));`\
`        filename "ipxe.efi";`\
`    }`\
`}`

**Important note: This simple config might only work with older Mac OS
clients like MacBook1,1, MacBook6.2 and others. For newer models you
need the [advanced config](FOG_on_a_MAC#fancy "wikilink")**

To lookup Mac models and their architecture/CPU [this
website](http://www.everymac.com/systems/by_processor/) comes in very
handy!

##### fancy

Newer Macs also have a fancy version of network booting. Hold down the
\'alt\' key and you will see different disks and network images to boot
from. To make this work you need to modify the class definition:

`class "Apple-Intel-Netboot" {`\
`    match if substring (option vendor-class-identifier, 0, 14) = "AAPLBSDPC/i386";`\
`    option dhcp-parameter-request-list 1,3,17,43,60;`\
`    if (option dhcp-message-type = 8) {`\
`        option vendor-class-identifier "AAPLBSDPC";`\
`        if (substring(option vendor-encapsulated-options, 0, 3) = 01:01:01) {`\
`            # BSDP List`\
`            option vendor-encapsulated-options 01:01:01:04:02:80:00:07:04:81:00:05:2a:09:0D:81:00:05:2a:08:69:50:58:45:2d:46:4f:47;`\
`        }`\
`        elsif (substring(option vendor-encapsulated-options, 0, 3) = 01:01:02) {`\
`            # BSDP Select`\
`            option vendor-encapsulated-options 01:01:02:08:04:81:00:05:2a:82:0a:4e:65:74:42:6f:6f:74:30:30:31;`\
`            filename "ipxe.efi";`\
`            next-server x.x.x.x;`\
`        }`\
`    }`\
`}`

**Important note: This advanced config is proved to work with
Macmini5,2, Macmini6,2, Macbook1,1, Macbook6,1, iMac12,1 and
Macbookpro9,2**

For more information about the rows of hex numbers see this excellent
[example](http://brandon.penglase.net/index.php?title=Getting_*nix_to_Netboot_Macs).
And
[here](https://github.com/jamf/NetSUS/blob/master/NetBoot/var/appliance/conf/dhcpd.conf)
you can find a even more advanced example configuration.

##### Startup Disk {#startup_disk}

When using a proper Mac OS X server one can configure a NetBoot
device/server in System Preferences -\> Startup Disk. See here:
![](Startup_disk.png "Startup_disk.png")

Unfortunatelly our previously configured NetBoot ISC DHCP server is not
showing up in that dialog. It\'s just one simple thing preventing that.
Mac OS sends a DHCPINFORM broadcast message to enumerate NetBoot images
on the network. Usually DHCP messages are sent from UDP source port 68.
But not in this case - Startup Disk enumeration sends DHCPINFORM with a
random source port smaller 1024 (don\'t ask me why!).
[Here](https://github.com/jamf/NetSUS/blob/master/NetBoot/usr/local/sbin/dhcp-4.2.4-P1_dhcp.c.patch)
you can find a patch to make ICS DHCP server answer those messages
properly.

#### DNSmasq

As well as ISC DHCP also dnsmasq can be configured to serve as netboot
server for Mac clients:

`dhcp-vendorclass=apple-boot,"AAPLBSDPC/i386"`\
`dhcp-option-force=apple-boot,43,08:04:81:00:00:67`\
`dhcp-option-force=apple-boot,60,"AAPLBSDPC/i386"`\
`dhcp-option-force=apple-boot,67,"ipxe32.efi"`\
`dhcp-authoritative`

**Note: Only works with old Macs like Macbook1,1 and Macbook6,1\...**

Add those five lines to your configuration, save and restart the
service. Try booting one of your Macintoshs holding down the \'n\' key
while it comes up. You should see a globe - instead of the apple - on
the screen!

The more advanced config for dnsmasq looks like this:

`dhcp-match=set:intel-macos,60,AAPLBSDPC/i386`\
\
`dhcp-match=set:bsdp-list,43,01:01:01:02:02:01`\
`dhcp-option-force=`[`tag:intel-macos,tag:bsdp-list,60,AAPLBSDPC/i386`](tag:intel-macos,tag:bsdp-list,60,AAPLBSDPC/i386)\
`dhcp-option-force=`[`tag:intel-macos,tag:bsdp-list,43,01:01:01:04:02:80:00:07:04:01:00:02:0e:08:04:01:00:02:0e:09:0d:01:00:02:0e:08:69:50:58:45:2d:46:4f:47`](tag:intel-macos,tag:bsdp-list,43,01:01:01:04:02:80:00:07:04:01:00:02:0e:08:04:01:00:02:0e:09:0d:01:00:02:0e:08:69:50:58:45:2d:46:4f:47)\
\
`dhcp-match=set:bsdp-select,43,01:01:02:02:02:01`\
`dhcp-option-force=`[`tag:intel-macos,tag:bsdp-select,60,AAPLBSDPC/i386`](tag:intel-macos,tag:bsdp-select,60,AAPLBSDPC/i386)\
`dhcp-option-force=`[`tag:intel-macos,tag:bsdp-select,43,01:01:02:08:04:81:00:05:2a:82:0a:4e:65:74:42:6f:6f:74:30:30:31`](tag:intel-macos,tag:bsdp-select,43,01:01:02:08:04:81:00:05:2a:82:0a:4e:65:74:42:6f:6f:74:30:30:31)\
`dhcp-option-force=`[`tag:intel-macos,tag:bsdp-select,66,x.x.x.x`](tag:intel-macos,tag:bsdp-select,66,x.x.x.x)`        # TFTP server IP`\
`dhcp-option-force=`[`tag:intel-macos,tag:bsdp-select,67`](tag:intel-macos,tag:bsdp-select,67)`,"ipxe.efi"     # bootfile`

This still does not address the issue of selecting the correct iPXE
binary for 32 or 64 bit.

### Using bless {#using_bless}

An Apple Mac can be \'blessed\' to boot from whichever source you want
via commandline. This setting is saved in NVRAM and not changed by
cloning your Macs via FOG. I\'d suggest activating SSH on your Macs and
use clusterssh to bless all of them without having walk to and login to
each and every client.

To \'bless\' your Mac turn it on and let it boot up as usual. Login and
open the Terminal App and run the following command (use a proper IP
instead of x.x.x.x):

`sudo bless --netboot --booter `[`tftp://x.x.x.x/ipxe.efi`](tftp://x.x.x.x/ipxe.efi)

According to [this website](https://static.afp548.com/mactips/nbas.html)
the bless command is part of Mac OS X since 10.4.5. Earlier versions
probably don\'t work that way!

No special DHCP configuration is needed for this! BUT if your server ip
changes for example you\'d have to run this command on all your clients
again.

#### Culprits

Newer Mac OS X releases do not allow blessing as is. You need to allow
using the address with a tool called csrutil. See here for more details:
<https://support.apple.com/en-us/HT205054>

## iPXE for Macintosh {#ipxe_for_macintosh}

As noted earlier there is a fundamental difference between Mac-EFI and
PC-BIOS. Not just with configuring network boot but also when it comes
to the binary being loaded via TFTP and executed on the client. To make
iPXE work on Macs a lot of work has been done in 2014. Check out this
thread if you are interested in the details:
<http://forum.ipxe.org/showthread.php?tid=7323>

The mentioned DHCP class should point the client to the correct iPXE
binary (ipxe.efi). FOG includes this binary in current SVN development
tree or you can download a binary from the repository if you are still
using an older version of FOG:
<https://svn.code.sf.net/p/freeghost/code/trunk/packages/tftp/>

Depending on the hardware you have this might work for you straight
away. If not, please get in contact with us on the forums so we can work
on it to find a solution!!

## Working devices {#working_devices}

Macbook1,1 \...

Macbook6,1 (W89452MK8PX), nVidia NForce MCP79 (PCI ID 10de:0ab0) -
<http://www.everymac.com/systems/apple/macbook/specs/macbook-core-2-duo-2.26-white-13-polycarbonate-unibody-late-2009-specs.html>

Macmini5,2 (C07G3W4ADJD1), Broadcom NetXtreme BCM57765 (PCI ID
14e4:16b4) -
<http://www.everymac.com/systems/apple/mac_mini/specs/mac-mini-core-i5-2.5-mid-2011-specs.html>

Macmini6,2 (C07LR0UQDY3H), Broadcom NetXtreme BCM57766 (PCI ID
14e4:1686) -
<http://www.everymac.com/systems/apple/mac_mini/specs/mac-mini-core-i7-2.6-late-2012-specs.html>

## Notes from developers {#notes_from_developers}

Apple and its proprietary way of doing things. Simple explanation,
netboot is not pxe boot. OS X is very picky about netboot. The efi iPxe
file first must be named boot.efi as well as match the architecture of
the machine that is booting (for you thats 64 bit) secondly not all
ethernet or wifi adapters will be visible to iPxe after handoff. DHCP
must point to that file as well as the boot file also.

Basically you have a few options but I will line out what we do. When I
create an image, on the master machine I create the smallest partition
possible. In that partition I add the folders:
/System/Library/CoreServices/

After that I add the 64 or 32 bit ipxe file naming it boot.efi. Again
for you thats a 64 bit file

Now on reboot, hold down option and select that partition. If it is able
to find your nics and boot to FOG then you are in good shape!!. If it
works copy the partition you just created to a usb disk. Now use that to
boot your machines. Realize that you can simply select the usb disk in
the boot manager and once iPxe loads up pull it out, and use it on
another machine (if you are doing multiple machines). Because of
limitations in iPxe do not expect a pretty FOG Menu. No background
picture and such.

If your nics are not visible to the efi iPXE then you will need to use
the undionly.kpxe file.

**Reference**:
[<https://forums.fogproject.org/topic/7358/cannot-boot-macbook-7-1-from-pxe/9>](https://forums.fogproject.org/topic/7358/cannot-boot-macbook-7-1-from-pxe/9)

## Related articles {#related_articles}

```{=mediawiki}
{{:Related to ISC-DHCP}}
```
