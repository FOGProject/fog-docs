---
title: Customize the FOS init
aliases:
    - Customize the FOS init
    - Modify init.xz
    - Edit the FOS init
description: How to add or change files inside the FOS init (init.xz, init_32.xz) for an initramfs init and for an older ext2 init, and how to serve the result to chosen hosts
context_id: customize-the-fos-init
tags:
    - how-to
    - fos
    - advanced
---

# Customize the FOS init

The init (`init.xz` for 64-bit clients, `init_32.xz` for 32-bit) is the file
system FOS runs from. Sometimes you need a file inside it changed: a tool, a
script, a configuration file.

> [!tip] Try a postinit script first
> A [[post-download-scripts#post-init-scripts-before-imaging|post-init script]]
> runs inside FOS on every boot, from your storage node. It needs no change to
> the init, and it survives every FOS update. Change the init only when a
> script cannot do the job.

## Step 1: find which kind of init you have

FOS inits come in two formats. The method depends on the format, so check
first:

```bash
xz -dc init.xz | file -
```

| Output | Format | Method |
|---|---|---|
| `ASCII cpio archive (SVR4 with no CRC)` | initramfs (newer inits) | [Append an overlay](#method-a-append-an-overlay-initramfs) |
| `Linux rev 1.0 ext2 filesystem data` | ext2 image (older inits) | [Loop mount](#method-b-loop-mount-ext2) |

The 64-bit and 32-bit inits move from ext2 to initramfs because Linux is
removing support for booting an ext2 init. The arm64 init
(`arm_init.cpio.gz`) has always been an initramfs.

## Method A: append an overlay (initramfs)

An initramfs is a cpio archive. Linux unpacks archives that are joined end to
end, in order, and a file in a later archive replaces the same file in an
earlier one. So you do not unpack the init at all. You put only your changed
files in a small archive and add it to the end.

1. Make a folder that holds only your files, at the paths they must have
   inside FOS. For example, to replace `/usr/share/fog/lib/myscript.sh`:

   ```bash
   mkdir -p overlay/usr/share/fog/lib
   cp myscript.sh overlay/usr/share/fog/lib/
   chmod 755 overlay/usr/share/fog/lib/myscript.sh
   ```

2. Pack the folder. `-R 0:0` makes root the owner of every file, as FOS
   expects:

   ```bash
   cd overlay
   find . | cpio -o -H newc -R 0:0 | xz -9 --check=crc32 > ../overlay.cpio.xz
   cd ..
   ```

3. Join the overlay to the end of a copy of the init:

   ```bash
   cat init.xz overlay.cpio.xz > init-custom.xz
   ```

When a new FOS release comes out, run step 3 again with the new `init.xz`.
The same `overlay.cpio.xz` works with it.

You need no root access and no unpacking. To **delete** a file from the init,
an overlay is not enough. Unpack it as root
(`mkdir root && cd root && xz -dc ../init.xz | cpio -idm`), make the change, and pack the whole tree
again with `find . | cpio -o -H newc | xz -9 --check=crc32 > ../init-custom.xz`.

## Method B: loop mount (ext2)

An ext2 init is a disk image. You open it, change it, and compress it again.
You need root.

```bash
xz -dc init.xz > init.img
mkdir -p /mnt/init
mount -o loop init.img /mnt/init
cp myscript.sh /mnt/init/usr/share/fog/lib/
umount /mnt/init
xz -9 --check=crc32 -c init.img > init-custom.xz
```

This method does not work on an initramfs init, because there is no file
system in it to mount.

## Compress with `--check=crc32`

Both methods use `xz --check=crc32`. The Linux xz decoder accepts only CRC32
or no check. xz's default is CRC64, and a client fails to boot an init
compressed with it.

## Step 2: serve the custom init

Copy `init-custom.xz` to the same folder on the FOG server as `init.xz`. That
is usually `/var/www/html/fog/service/ipxe/`.

To use it for chosen hosts only, open each host in the web UI and set
**Host Init** to `init-custom.xz`. Test it on one host before you set it on
more.

Give your file its own name. Do not overwrite `init.xz`. A FOG or FOS update
replaces `init.xz`, but it keeps a file with any other name. See
[[supported-customizations#kernels-and-inits-bzimage-initxz-|Supported customizations]].

## /tmp size on an initramfs init

On an older ext2 init, the **FOG_KERNEL_RAMDISK_SIZE** setting (FOG
Configuration → FOG Settings) sets the size of the ram disk that holds the
init. An initramfs init has no ram disk. With an initramfs init, the same
setting sets the largest size of `/tmp` in KB. FOS uses at least 64 MiB and at
most half of the client's memory. The default, 275000, gives about 268 MiB.
