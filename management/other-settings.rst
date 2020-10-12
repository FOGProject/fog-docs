--------------
Other Settings
--------------


.. === Other Settings ===

.. ==== [[Boot Image Key Map]] ====

.. ==== FOG Client Kernel ====

.. ===== Overview =====
 
.. In FOG, there aren't really drivers you need to find and download for your clients to work, this is because we ship a Linux kernel that has the majority of hardware device built into it.  What this means is if you have a device that doesn't work with FOG you need to either build a new kernel yourself or try a newer kernel that has been released via our kernel updater.


.. ===== Kernel Types =====

.. We currently build two "lines" of kernels, one called KS or KitchenSink.  This kernel tries to include drivers for as many devices as possible, sometimes as the cost of performance, and this is the kernel that we ship with FOG by default.  The other "line" is the PS kernel or the Peter Sykes kernel, which is a based on a config submitted by a user.  This kernel line tries to be faster, but may not include as many drivers as the KS kernel.  

.. ===== Updating the Kernel =====

.. It is possible to update your client kernel from within the UI of FOG.  To do this perform the following steps:

.. #Log into the FOG Management UI.
.. #Go to '''Other Information'''
.. #Select '''Kernel Updates'''
.. #Select the Kernel you would like to download, typically the newest kernels are on the top of the list.
.. #Click the download icon
.. #Select a file name for your kernel, to make it the default kernel leave the name as '''bzImage'''
.. #Click the '''Next''' Button

