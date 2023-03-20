`<font color="red">`{=html}Note:`</font>`{=html} This article is older
(year 2011), and has only had it\'s terminology updated to reflect
current FOG terminology.

<figure>
<img src="Vista_winload.png" title="Vista_winload.png" />
<figcaption>Vista_winload.png</figcaption>
</figure>

This is typically caused when the following commands are not run on the
client computer right before it is shutdown, and then rebooted for an
image capture:

`bcdedit /set {bootmgr} device boot`\
`bcdedit /set {default} device boot`\
`bcdedit /set {default} osdevice boot`

However if you\'ve already done this and received this message, you do
not need to recreate your image. All you need to do is insert your Vista
Install DVD, and use it to repair your previous installation. The
machine will reboot, preform a checkdisk, and reboot again.

------------------------------------------------------------------------

If it still isn\'t working, try
[this](http://social.technet.microsoft.com/forums/en-US/itprovistadeployment/thread/096ec0c8-8f41-4824-873a-781315fc914e):

> \"Before you sysprep, open RegEdit and export the Mounted Devices key
> (`HKLM/SYSTEM/MountedDevices`). **Do not close RegEdit.** Open a
> command prompt and run sysprep:

    c:\windows\system32\sysprep>sysprep -oobe -generalize -quit

> Go back to the RegEdit window and import the Mounted Devices key that
> you exported earlier.\"

Now shutdown the PC and capture the image.
