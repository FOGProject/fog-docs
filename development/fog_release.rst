.. include:: /includes.rst

-----------
FOG Release
-----------

tbd

Updating dependencies
#####################

The FOG project relies of several other open source projects (Linux kernel, Buildroot, iPXE) to provide the PXE boot environment including all the drivers to run on pretty much any hardware out there. **It's usually a good idea to update those components a week or two before doing a FOG release to get those current versions tested by people using FOG dev-branch.**

Kernel:

Check current versions on https://kernel.org/ and use the latest marked "longterm" in most cases. When switching from one longterm branch to the next (e.g. 5.15.x to 5.19.x) some more time for testing should be allowed.

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

So when asked if you want to edit the kernel config you want to say no. It will make use of the config stored in ``fos/configs/kernelx64.conf`` as a base and ask questions about new features that were added between the old kernel version and the new one you want to build. When the version gap is small only a few questions will be asked but surely more questions will come up if you switch to the next loneterm kernel branch. In most cases the default answer is fine and so hitting ENTER to confirm is ok. Though it's still important to read every question and try to understand if adding/leaving out a new feature can cause trouble.



Testing
#######

Default installation test are done several times a week for many distributions and versions thanks to Wayne Workman! Current results are found on: https://fogtesting.fogproject.us/
