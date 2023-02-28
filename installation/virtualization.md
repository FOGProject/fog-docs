# Virtualization
FOG can be used on bare metal as well as in most virtual server and client setups. Some of the virtualization techniques are really great when used with FOG, e.g. snapshots. Some people use virtualization to prepare and capture their "golden (master / reference) images" all on one central location/server. Again like with the server OS we don't prefer any of the following or others that are out there. This is only a collection of hints and tricks plus maybe issues we know about.

## === Hyper-V ===

'''Using the New VM Wizard:'''

Ensure the virtual switch your VM is connected to has a route to FOG!

Create VM Wizard > Installation Options: Select "Install an operating system from network-based installation server"


### '''Existing VM:'''

Ensure the virtual switch your VM is connected to has a route to FOG!

Right click VM > Settings > BIOS

Move "Network Adapter" (sometimes labeled "Legacy Network Adapter") to the top of the boot order.


### '''UEFI:'''

UEFI/Secure Boot is an option with Hyper-V on Server 2012 on Generation 2 VMs. It is enabled by default, and can be disabled in VM Settings -> Firmware: Uncheck secure boot.

Thanks to [https://forums.fogproject.org/user/moses moses]

## === KVM/QEMU ===
Can be used as kind of a lightweight desktop virtual environment to test FOG and master your images.
Using this on the laptop as local test environment. Search forums and wiki but there is no valuable information about anyone using FOG on a KVM server. Asked user mxc as he seams to use it. Otherwise this will be a brief description on how to use this as I do it.

 ### setup network tap device as kind of a local software switch to connect it all
 sudo tunctl -t tap0 -u <username>
 sudo ifconfig tap0 x.x.x.x netmask 255.255.255.0 up
 
 ### generate disk image file
 qemu-img create -f qcow2 hd.qcow2 10G
 
 ### start VM using QEMU emulator (BIOS mode)
 qemu -m 512 -boot n -net nic,vlan=1 -net tap,vlan=1,ifname=tap0,script=/bin/true -hda hd.qcow2
 
 ### start VM using real KVM virtualization (BIOS mode)
 kvm -m 512 -boot n -net nic,vlan=1,macaddr=00:00:00:00:00:05 -net tap,vlan=1,ifname=tap0,script=/bin/true -hda hd.qcow2
 
 ### start VM as UEFI machine - as well using the more modern '-netdev' parameter
 kvm -m 512 -boot n -bios /usr/share/ovmf/OVMF.fd -device virtio-net-pci,netdev=hn0 -netdev tap,id=hn0,ifname=tap0,script=/bin/true -hda hd.qcow2

## === OpenVZ ===
OpenVZ (possibly within Proxmox) is mostly used to run the FOG server in a light weight kind of virtual environment. As OpenVZ is in nature similar to a chrooted environment you cannot actually PXE boot such a container. To install FOG as a server in OpenVZ you need to have NFS support on the host machine first and then add it to the container as well:

 $ lsmod | grep nfsd
 nfsd                  312315  14
 $ grep nfsd /proc/filesystems
 nodev   nfsd

If you don't see the kernel module ''nfsd'' loaded you might need to install the nfs-kernel-server package and load the module (usually done by the nfs-kernel-server init script). As mentioned before you need to enable access to ''nfsd'' from within the container you want to install FOG to:

 $ vzctl stop $CONTAINER_ID
 $ vzctl set $CONTAINER_ID --feature  nfsd:on --save
 $ vzctl start $CONTAINER_ID

After that the installer should run through like it would installing on bare metal or any other virtual environment!

### '''Wake on LAN:'''

To be able to send WOL and multicast packages the container needs a proper MAC address. This is only the case if you configure the container to use a network bridge (veth instead of venet!).

## === LXC ===
One of the main things is to get NFS to work within LXC containers. While it used to be easy in Proxmox newer versions make it more complicated.

Proxmox 6.x: https://forums.fogproject.org/topic/15176/fog-server-in-lxc-container-under-proxmox-6

Proxmox 5.x: An update (around 23th of October 2018) broke NFS in LXC containers. Find a fix here: https://forum.proxmox.com/threads/mounting-nfs-in-lxc-not-working-since-latest-update.47815/

Proxmox 4.x: https://forums.fogproject.org/topic/7978/fog-in-lxc-container-how-to-configure-nfs-server

## === VirtualBox ===
Bridged network or host only.

Most versions seem to suffer from a bug where iPXE would only be able to get an IP from the DHCP if started cold (vs. reboot).

This can be fixed by changing the iPXE binary from <code>undionly.kkpxe</code> to <code>ipxe.pxe</code> in the DHCP server config.

## === VMWare ESXi ===
Running a FOG client within an ESXi server is pretty close to what you would do on a bare metal machine:

* Create VM as normal.
* Choose network adapter other than VMX3 (e.g. e1000) as we have seen [https://forums.fogproject.org/topic/7108/fog-bzimage-failing-to-load-after-pxe-boot loading issues] with those virtual adapters.
* Open VM Console, start up the VM. Press F2 on Boot Logo to enter BIOS.
* Scroll over to boot tab, use + key to move Network boot to the top of the boot order.

You can also do an on-demand network boot by hitting F9 on startup, if you don’t want to change the boot order permanently.

### '''UEFI:'''

UEFI is disabled by default for VMs in ESXI 6.0+. To enable it for a VM, go to VM Settings > Options Tab > Advanced: Boot Options and change the boot firmware from BIOS to EFI.

Thanks to [https://forums.fogproject.org/user/moses moses]

## === VMWare Player ===
Is this still in use?? Don't care if there is nothing about it in wiki or forums!

## === Xen/XenServer ===
See forums

* [[Running pre-built virtual machines in Virtualbox|FOG 0.30 VM - Virtualbox]]
* [[Installation on VMWare 0.27|FOG 0.27 VM - VMWare]]