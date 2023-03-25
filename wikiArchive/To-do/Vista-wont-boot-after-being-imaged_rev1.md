Before uploading a Vista image you must run the following commands!

`bcdedit /set {bootmgr} device boot`\
`bcdedit /set {default} device boot`\
`bcdedit /set {default} osdevice boot`

This commands must be run as an administrator, and they must return
without any errors like \"access denied.\"

However if you\'ve already done this and received this message, you do
not need to recreate your image. All you need to do is insert your Vista
Install DVD, and use it to repair your previous installation. The
machine will reboot, preform a checkdisk, and reboot again.
