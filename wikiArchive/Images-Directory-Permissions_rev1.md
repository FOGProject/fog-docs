See also: [Troubleshoot FTP](Troubleshoot_FTP "wikilink")

## \* unable to move /images/dev/macaddress to /images/name-of-image {#unable_to_move_imagesdevmacaddress_to_imagesname_of_image}

### Problem

You receive the following error after an image has been created:

*\* unable to move /images/dev/macaddress to /images/name-of-image*

The error will repeat indefinitely.

### Cause

The FOG user does not have permission to write to the images directory
on the FOG server (usually /images). This often occurs when the /images
directory has been recreated or has had its permissions changed.

Another cause is the Image Type is not correct (i.e. You\'re trying to
image multiple partitions as a single partition.)

There is a third cause, that involves your FTP passwords being incorrect
making FOG unable to handle files via FTP

### Resolution

#### Method 1 {#method_1}

1.  Turn off the computer being imaged.(you don\'t have to turn off the
    PC just run the command on your server)
2.  Ensure the FOG user has write permissions on the images directory.
3.  Run command as root *chown -R fog:root /images*

Example: Use:

`chown -R fog.root /images  `

Finally attempt to create the image again.

#### Method 2 {#method_2}

1.  Switch off the computer being imaged.
2.  On the FOG server go to your /images/dev directory and move the
    temporary image (macaddress.000) to /images
3.  Rename the temporary image (macaddress.000) to the name you have set
    up in the FOG WebUI
