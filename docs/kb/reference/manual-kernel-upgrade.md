# Manually Upgrade FOS Kernel

The kernel that the fog server uses to image clients with can be out of
date and cause issues for some computers with newer network cards.
Ideally, you can use the built in kernel update tool, but if you are
experiencing issues using the tool you can do a manual upgrade instead.
Here is the method for manually updating the kernels.

## Testing

Manually loading different kernel versions can be pretty handy to test
with the different hardware you have. Going straight to a new kernel -
while not very likely - can cause an issue with some devices. So instead
you might assign a different kernel to one or maybe a few machines
through the kernel parameter in the hosts' settings: [[hosts#Kernel]]

## Downloading the Kernels

To begin, ensure you have the files `bzImage` and `bzImage32` located in
`/var/www/html/fog/service/ipxe/`

With root or sudo, perform a ls to look. :

    ls -la /var/www/html/fog/service/ipxe

*On some distros (mainly older ones) the root path is
\`\`/var/www/fog\...\`\`, this is also a symlink on some distros
(sometimes created by the fog installer). Most distros use this root
path for the fog httpd/apache site \`\`/var/www/html/fog\...\`\`*

After confirming the files exist, create a folder called **Backup** in
the same location, and move the current bzImage files there. This will
be helpful in case you quickly need to revert any changes you made.

Next, download the newer kernel files from
**https://github.com/FOGProject/fos/releases**

Use a web browser on another computer or wget/curl on the FOG server if
you know what to do.

Be sure to choose the highest number kernel you can find, alongside the
latest date. Also, ensure you download **both** the 32 bit (`bzImage32`)
and 64 bit (`bzImage`) kernel.

### Rename Files

In case you don't want to overwrite your current kernel files you
better rename the new ones to use a different filename. That way you can
have several versions available. For example you might have some flacky
hardware that doesn't properly run the latest kernel you want to use
for all your other devices.

### Move Files

Next step is to move these files to the location specified in the
beginning, you may need root or sudo acces to move them there. you can
use either the `mv` command on the server or FTP it. As a reminder the
location is: :

    /var/www/html/fog/service/ipxe

## Permissions

Next, with root or sudo, enter: :

    ls -la /var/www/html/fog/service/ipxe

Take note of the owner listed in the files located in this directly. In
my case the owner is **root**, so I changed the owner and matched the
permissions found in the other files.

changing owner of the new kernels: :

    chown apache:apache /var/www/html/fog/service/ipxe/bzImage*

To confirm, rerun the list command with root/sudo and ensure all the
permissions and owners looks the same: :

    ls -la /var/www/html/fog/service/ipxe

## Version Check

To verify or check the version of your kernel binaries you ca simply use
the `file` command on most modern Liux systems: :

    file /var/www/html/fog/service/ipxe/bzImage*
