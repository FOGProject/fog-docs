.. include:: /includes.rst

----------------------------
Manually Upgrade PXE Kernel 
----------------------------
*This documentation was written in 2022 using Fog Server 1.5.9 on Ubuntu 20.04.*
*The kernel included with this version of Fog is from 2019. I was having issues imaging some desktops with newer Intel ethernet NICs.*

The kernel that the fog server uses to image clients with can be quite out of date and cause issues for some computers with newer network cards. Ideally, you can use the built in kernel update tool, but if you are experiencing issues using the tool and have not yet found a solution, you can do a manual upgrade instead. Here is the method for manually updating the kernels. 


Downloading the Kernels
#######################

To begin, ensure you have the files ``bzImage`` and ``bzImage32`` located in ``/var/www/html/fog/service/ipxe/``

With root or sudo, perform a ls to look.
::

    ls -la /var/www/html/fog/service/ipxe

*A common mistake is looking under ``/var/www/fog...``, but the bzImage files only exist under ``/var/www/html/fog...``*

After confirming the files exist, create a folder called **Backup** in the same location, and move the current bzImage files there. This will be helpful in case you quickly need to revert any changes you made.

Next, download the newer kernel files from
**https://fogproject.org/kernels**

I used a web browser on another computer as it was easier to browse. You can also use wget on the server if you know what to do. 

Be sure to choose the highest number Kernel you can find, alongside the latest date. For example at the time of writing, ``Kernel.TomElliott.5.10.71.64`` is the latest with a date of 09-Oct-2021. 
Also, ensure you download **both** the .32 option and the .64 kernels. 

Rename Files
------------

After the downloads are complete, manually rename each file (the case is important, take note there is no .filetype after the name - if using Windows be sure to check extensions for file types) 

* **Kernel.TomElliott.5.10.71.64** will be renamed to **bzImage** 
* **Kernel.TomElliott.5.10.71.32** will be renamed to **bzImage32**

Move Files
----------

Next step is to move these files to the location specified in the beginning, you may need root or sudo acces to move them there. you can use either the ``mv`` command on the server or FTP it. 
As a reminder the location is:
:: 

    /var/www/html/fog/service/ipxe

Permissions
###########

Next, with root or sudo, enter:
::

    ls -la /var/www/html/fog/service/ipxe

Take note of the owner listed in the files located in this directly. In my case the owner is **root**, so I changed the owner and matched the permissions found in the other files. 

changing owner of the new kernels:
::

    chown root /var/www/html/fog/service/ipxe/bzImage
    chown root /var/www/html/fog/service/ipxe/bzImage32

updating permissions of files:
::

    chmod -R 775 /var/www/html/fog/service/ipxe/bzImage
    chmod -R 775 /var/www/html/fog/service/ipxe/bzImage32

To confirm, rerun the list command with root/sudo and ensure all the permissions and owners looks the same:
::

    ls -la /var/www/html/fog/service/ipxe

Testing
#######

Now that you have downloaded and installed the new kernels, it is a good idea to restart your server to ensure you have a fresh start. 
After the server has been restarted and is ready to go, attempt to deploy your image again with a PXE boot.

With any luck, your client should now be using the newer kernel and it should include the latest network card drivers.
