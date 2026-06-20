---
title: Fog Release
description: How to create a new release of fog
context_id: fog-release
aliases:
    - Fog Release
tags:
    - development
    - release
---
# FOG Release

A FOG release is built on top of the PXE boot environment known as FOS. The
parts that make up FOS — the Linux kernel, the Buildroot-based init filesystem,
and the iPXE binaries — each live in their own repository and are updated
independently. Because these are the components most likely to affect hardware
compatibility, the usual practice is to update them and let them bake on the
`dev-branch` for a week or two so the community can test them before a release
is cut.

The sections below cover updating each of those components and the testing that
validates a release.

## Updating dependencies

The FOG project relies of several other open source projects (Linux
kernel, Buildroot, iPXE) to provide the PXE boot environment (a.k.a FOS)
including all the drivers to run on pretty much any hardware out there.
**It's usually a good idea to update those components a week or two
before doing a FOG release to get those current versions tested by
people using FOG dev-branch.**

### FOS kernel

Check current versions on <https://kernel.org/> and use the latest
marked "longterm" in most cases. When switching from one longterm
branch to the next (e.g. 5.15.x to 5.19.x) some more time for testing
should be allowed.

The following steps are used to update the kernel configuration and make
sure the new kernel version compiles correctly.

    $ git clone https://github.com/FOGProject/fos
    $ cd fos
    $ sed -ri "s/KERNEL_VERSION='[0-9]\.[0-9]+\.[0-9]+'/KERNEL_VERSION='5.15.68'/" build.sh
    $ ./build.sh -k -a x64

    Checking packages needed for building
    Preparing kernel 5.15.68 on x64 build:
     * Downloading kernel source...................................Done
     * Extracting kernel source....................................Done
     * Preparing kernel source.....................................Done
     * WARNING: Did not find a patch file building vanilla kernel without patches!
     * Cloning Linux firmware repository...........................Done
    We are ready to build. Would you like to edit the config file [y|n]?n
    Ok, running make oldconfig instead to ensure the config is clean.
    ....

So when asked if you want to edit the kernel config you say 'no'. It
will make use of the existing last kernel config
(`fos/configs/kernelx64.config`) as a base and ask questions about new
features that were added between that last kernel version and the new
one. When the version gap is small none or only a few questions will be
asked but surely more questions will come up if you switch to the next
loneterm kernel branch. In most cases the default answer is fine and so
hitting ENTER to confirm is ok. Though it's still important to read
every question and try to understand if adding/leaving out a new feature
can cause trouble.

    ...
    #
    # configuration written to .config
    #
    We are ready to build are you [y|n]?y
    This make take a long time. Get some coffee, you'll be here a while!
    ...
    BUILD   arch/x86/boot/bzImage
    Kernel: arch/x86/boot/bzImage is ready  (#1)

    $ cp kernelsourcex64/.config configs/kernelx64.config
    $ rm -rf kernelsourcex64/

The first kernel build is done - Intel/AMD 64 bit - and the updated
config file is saved. Two more kernels are waiting.

    $ ./build.sh -k -a x86
    ...
    $ cp kernelsourcex86/.config configs/kernelx86.config
    $ rm -rf kernelsourcex86/

    $ ./build.sh -k -a arm64
    ...
    $ cp kernelsourcearm64/.config configs/kernelarm64.config
    $ rm -rf kernelsourcearm64/

Now make sure all the changes are correct and commit to github.

    $ git status
    On branch master
    Your branch is up-to-date with 'origin/master'.
    Changes not staged for commit:
      (use "git add <file>..." to update what will be committed)
      (use "git checkout -- <file>..." to discard changes in working directory)

            modified:   build.sh
            modified:   configs/kernelarm64.config
            modified:   configs/kernelx64.config
            modified:   configs/kernelx86.config

    no changes added to commit (use "git add" and/or "git commit -a")

    $ git diff
    ....

    $ git commit -a -m "Update Linux kernel to v5.15.68"
    $ git push origin master

### FOS init

The init is the Buildroot-based root filesystem — the "world" of tools
(partclone and friends) that runs on the client alongside the kernel. It is
built from the same `fos` repository, using the `-f` (filesystem-only) flag so
the kernel is not rebuilt.

The Buildroot version is pinned near the top of `build.sh`; bump it the same way
the kernel version is bumped above, then build each architecture:

    $ git clone https://github.com/FOGProject/fos
    $ cd fos
    $ sed -ri "s/BUILDROOT_VERSION='[0-9.]+'/BUILDROOT_VERSION='2026.02.1'/" build.sh
    $ ./build.sh -f -a x64
    $ ./build.sh -f -a x86
    $ ./build.sh -f -a arm64

Each run downloads and builds Buildroot, applies the FOG overlay, and copies the
resulting root filesystem into the matching init file — `init.xz` (x64),
`init_32.xz` (x86), and `arm_init.cpio.gz` (arm64) — alongside a `.sha256`
checksum. The init version is stamped automatically with the build date.

Review the changes and commit, mirroring the kernel update above:

    $ git status
    $ git diff
    $ git commit -a -m "Update Buildroot/init to 2026.02.1"
    $ git push origin master

### iPXE

    $ git clone https://github.com/FOGProject/fogproject
    $ cd fogproject
    $ git checkout dev-branch
    $ cd utils/FOGiPXE
    $ armsupport=1 ./buildipxe.sh
    ...

Compilation will take a few minutes. When it's done it's wise to check
if surely all iPXE binaries have been updated. If not something
obviously went wrong. Compare the number of iPXE files with the output
of `git status`:

    $ cd ../..
    $ find packages/tftp -type f | grep -v memdisk | wc -l
    68
    $ git status | grep "modified" | wc -l
    68
    $ diff -Nur <(find packages/tftp -type f | grep -v memdisk | sort) <(git status | grep "modified" | awk '{print $2}' | sort)

Numbers must be equal and the output of diff ought to be empty. If
that's the case system.class.php needs to be updated and then changes
can be commited and pushed to the official repo on github.com.

    $ sed -i "s/define('FOG_VERSION'.*);/define('FOG_VERSION', '$(git describe --tags $(git rev-list --tags --no-walk --max-count=1)).$(git rev-list master..HEAD --count)');/g" packages/web/lib/fog/system.class.php
    $ git commit -a -m "Update iPXE to the latest pull ipxe/ipxe@$(head -c 8 ../ipxe/.git/refs/heads/master)"
    $ git push origin dev-branch

## Testing

Default installation tests are done several times a week for many
distributions and versions thanks to Wayne Workman! Current results are
found on: <https://fogtesting.fogproject.us/>
