.. include:: /includes.rst

---------------------
Compile iPXE binaires
---------------------

Procedural Steps
================

- PXE boot any computer and record the build code listed on the iPXE banner. The build code is a hex number inside the brackets (e.g. ``iPXE 1.21.1+ (gc64d) ...``). We will compare this build code in a later step to ensure your iPXE boot loader files have been updated.
- Navigate to where you downloaded the FOG installer using git. Depending on which directions you followed these files will be in either /opt or /root. The parent directory we are looking for is called fogproject. For the remainder of this tutorial I’ll assume the fogproject directory is in the /root directory, you will need to adjust the file paths based on your fogproject path.
- Navigate to ``/root/fogproject/utils/FOGiPXE`` directory
- Run the compile script using this command ``./buildipxe.sh`` (**Note:** your fog server will need internet access to recompile iPXE. It should take about 10 minutes to recompile iPXE - depends on the CPU/RAM in your machine.)
- When the compile is done you will be presented with a command prompt once again. Understand the buildipxe.sh script only compiles the iPXE binaries. It does not install them in your production environment.
- The proper way to update your production environment is to re-run the fog installer using all of the preselected options. Reinstalling fog using the fog installer is not destructive, the installer remembers your previous settings and just updates any new files into your production environment.
- The hacker way to update your production environment is to copy over the updates files to the /tftpboot directory with this command ``cp -R /root/fogproject/packages/tftp/* /tftpboot`` (**Note:** watch the source path if your git fogproject directory is not in the ``/root/fogproject`` directory)
- Run the following command to ensure your iPXE files have a current date on them: ``ls -la /tftpboot/*.efi``
- Now PXE boot the client and confirm that the build code (in the brackets) has changed from the previous step. **Note:** The build code does not change on every re-compile you do but only if there is a newer version available.
