.. include:: /includes.rst

-----------
FOG Release
-----------

tbd

Updating dependencies
=====================

The FOG project relies of several other open source projects (Linux kernel, Buildroot, iPXE) to provide the PXE boot environment (a.k.a FOS) including all the drivers to run on pretty much any hardware out there. **It's usually a good idea to update those components a week or two before doing a FOG release to get those current versions tested by people using FOG dev-branch.**

FOS Kernel
----------

Check current versions on https://kernel.org/ and use the latest marked "longterm" in most cases. When switching from one longterm branch to the next (e.g. 5.15.x to 5.19.x) some more time for testing should be allowed.

The following steps are used to update the kernel configuration and make sure the new kernel version compiles correctly.

::

    $ git clone https://github.com/FOGProject/fos
    $ cd fos
    $ sed -ri 's/KERNEL_VERSION='\''[0-9]\.[0-9]+\.[0-9]+'\''/KERNEL_VERSION='\''5.15.68'\''/' build.sh
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

So when asked if you want to edit the kernel config you want to say no. It will make use of the config stored in ``fos/configs/kernelx64.config`` as a base and ask questions about new features that were added between the old kernel version and the new one you want to build. When the version gap is small only a few questions will be asked but surely more questions will come up if you switch to the next loneterm kernel branch. In most cases the default answer is fine and so hitting ENTER to confirm is ok. Though it's still important to read every question and try to understand if adding/leaving out a new feature can cause trouble.

::

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

The first kernel build is done - Intel/AMD 64 bit - and the updated config file is saved. Two more kernels are waiting.

::

    $ ./build.sh -k -a x86
    ...
    $ cp kernelsourcex86/.config configs/kernelx86.config
    $ rm -rf kernelsourcex86/
    
    $ ./build.sh -k -a arm64
    ...
    $ cp kernelsourcearm64/.config configs/kernelarm64.config
    $ rm -rf kernelsourcearm64/

Now make sure all the changes are correct and commit to github.

::

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

FOS init
--------

tbd

Testing
=======

Default installation test are done several times a week for many distributions and versions thanks to Wayne Workman! Current results are found on: https://fogtesting.fogproject.us/
