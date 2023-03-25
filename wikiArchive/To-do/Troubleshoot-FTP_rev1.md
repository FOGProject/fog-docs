**Note:** It seems that greater than 90% of FOG FTP problems are caused
by bad/mismatched credentials. Because of this, we recommend skipping
straight to the **Credentials / Passwords** section first.

## FTP\'s roles in FOG {#ftps_roles_in_fog}

The primary purpose is moving & renaming image files in the /images/dev
folder to the /images folder at the end of an image capture. FTP is not
used for image capture or deployment because NFS is faster. FTP is also
used to download kernels and delete images. FTP is also used to report
\"Image Size: ON SERVER\". FTP is also used to ensure the image you wish
to deploy exists before starting an image deployment. FTP is also
what\'s used for image replication in multi-server setups.

FTP should be able to read, write, and delete in /images/dev and
/images.

## Testing FTP {#testing_ftp}

### Try to get a file with Linux: {#try_to_get_a_file_with_linux}

These commands are NOT done on your FOG server, they are done on another
Linux machine (this example uses Fedora).

*To explain what\'s happening below in the code box,*

-   Create a test file with some data in it to send later.

```{=html}
<!-- -->
```
-   Start ftp (may need installed first).

```{=html}
<!-- -->
```
-   Open connection to FOG server.

```{=html}
<!-- -->
```
-   Provide username (found in Web Interface -\> Storage Management -\>
    \[NodeName\] -\> Management Username).

```{=html}
<!-- -->
```
-   Provide password (found in Web Interface -\> Storage Management -\>
    \[NodeName\] -\> Management Password).

```{=html}
<!-- -->
```
-   Change to /images directory.

```{=html}
<!-- -->
```
-   List directory contents.

```{=html}
<!-- -->
```
-   Upload file.

```{=html}
<!-- -->
```
-   List directory contents to verify.

```{=html}
<!-- -->
```
-   Download the file.

```{=html}
<!-- -->
```
-   Delete the file.

```{=html}
<!-- -->
```
-   Exit ftp.

```{=html}
<!-- -->
```
    [administrator@D620 ~]$ echo 'some text here to send later' > test.txt
    [administrator@D620 ~]$ ftp
    ftp> open 10.0.0.3
    Connected to 10.0.0.3 (10.0.0.3).
    220 (vsFTPd 3.0.2)
    Name (10.0.0.3:administrator): fog
    331 Please specify the password.
    Password:
    230 Login successful.
    Remote system type is UNIX.
    Using binary mode to transfer files.
    ftp> cd /images
    250 Directory successfully changed.
    ftp> ls
    227 Entering Passive Mode (10,0,0,3,204,176).
    150 Here comes the directory listing.
    drwxrwxrwx    2 0        0            4096 Apr 10 03:38 Optiplex745WinXPconfiguredApril2015
    drwxrwxrwx    2 0        0            4096 Apr 10 03:39 dev
    drwxrwxrwx    2 0        0           16384 Apr 07 01:58 lost+found
    drwxrwxrwx    2 0        0            4096 Apr 08 00:59 postdownloadscripts
    226 Directory send OK.
    ftp> put test.txt
    local: test.txt remote: test.txt
    227 Entering Passive Mode (10,0,0,3,132,59).
    150 Ok to send data.
    226 Transfer complete.
    29 bytes sent in 0.000114 secs (254.39 Kbytes/sec)
    ftp> ls
    227 Entering Passive Mode (10,0,0,3,118,48).
    150 Here comes the directory listing.
    drwxrwxrwx    2 0        0            4096 Apr 10 03:38 Optiplex745WinXPconfiguredApril2015
    drwxrwxrwx    2 0        0            4096 Apr 10 03:39 dev
    drwxrwxrwx    2 0        0           16384 Apr 07 01:58 lost+found
    drwxrwxrwx    2 0        0            4096 Apr 08 00:59 postdownloadscripts
    -rw-r--r--    1 1000     1000           29 Apr 30 00:29 test.txt
    226 Directory send OK.
    ftp> get test.txt
    local: test.txt remote: test.txt
    227 Entering Passive Mode (10,0,0,3,190,81).
    150 Opening BINARY mode data connection for test.txt (29 bytes).
    226 Transfer complete.
    29 bytes received in 0.000529 secs (54.82 Kbytes/sec)
    ftp> delete test.txt
    250 Delete operation successful.
    ftp> exit
    421 Timeout.
    [administrator@D620 ~]$ 

### Try to get a file with Windows: {#try_to_get_a_file_with_windows}

Explanation of the code below:

-   Create a file with some data

```{=html}
<!-- -->
```
-   Start FTP

```{=html}
<!-- -->
```
-   Open connection to FOG server

```{=html}
<!-- -->
```
-   Enter username (found in Web Interface -\> Storage Management -\>
    \[NodeName\] -\> Management Username).

```{=html}
<!-- -->
```
-   Enter password (found in Web Interface -\> Storage Management -\>
    \[NodeName\] -\> Management Password).

```{=html}
<!-- -->
```
-   Upload file

```{=html}
<!-- -->
```
-   List directory to verify

```{=html}
<!-- -->
```
-   Download file

```{=html}
<!-- -->
```
-   Close connection

```{=html}
<!-- -->
```
-   Close FTP.

```{=html}
<!-- -->
```
    c:\SomeFolder>echo This is a bit of text to throw into a file > text.txt

    c:\SomeFolder>ftp
    ftp> open 10.0.0.3
    Connected to 10.0.0.3.
    220 (vsFTPd 3.0.2)
    User (10.0.0.3:(none)): fog
    331 Please specify the password.
    Password:
    230 Login successful.
    ftp> put text.txt
    200 PORT command successful. Consider using PASV.
    150 Ok to send data.
    226 Transfer complete.
    ftp: 45 bytes sent in 0.00Seconds 22.50Kbytes/sec.
    ftp> ls
    200 PORT command successful. Consider using PASV.
    150 Here comes the directory listing.
    text.txt
    226 Directory send OK.
    ftp: 10 bytes received in 0.00Seconds 10.00Kbytes/sec.
    ftp> get text.txt
    200 PORT command successful. Consider using PASV.
    150 Opening BINARY mode data connection for text.txt (45 bytes).
    226 Transfer complete.
    ftp: 45 bytes received in 0.00Seconds 45000.00Kbytes/sec.
    ftp> close
    221 Goodbye.
    ftp> quit

    c:\SomeFolder>

## FTP Service {#ftp_service}

### Fedora 20/21/22/23 {#fedora_20212223}

-   Check the status of FTP with

```{=html}
<!-- -->
```
    systemctl status vsftpd.service

(should be on and green, no errors, and enabled)

-   stop, start, disable and enable FTP service.

```{=html}
<!-- -->
```
    systemctl stop vsftpd.service
    systemctl start vsftpd.service
    systemctl disable vsftpd.service
    systemctl enable vsftpd.service

-   Test that its functioning by using the testing instructions at the
    top of this article additionally, if you open a web browser and go
    to

```{=html}
<!-- -->
```
    ftp://x.x.x.x

-   Use fog / your-fog-account-Password for the credentials
-   You should see Index of /

### Ubuntu

-   Restart FTP service.

```{=html}
<!-- -->
```
    service vsftpd restart

-   Enable and disable are not available due to this service being in
    the Upstart scripts.

```{=html}
<!-- -->
```
-   Test that its functioning by using the testing instructions at the
    top of this article additionally, if you open a web browser and go
    to

```{=html}
<!-- -->
```
    ftp://x.x.x.x

-   Use fog / your-fog-account-Password for the credentials
-   You should see Index of /

## FTP Settings File {#ftp_settings_file}

### Fedora 20/21/22/23: {#fedora_20212223_1}

Location:

    /etc/vsftpd/vsftpd.conf

To display file:

    cat /etc/vsftpd/vsftpd.conf

It should look a lot like this:

    anonymous_enable=NO
    local_enable=YES
    write_enable=YES
    local_umask=022
    dirmessage_enable=YES
    xferlog_enable=YES
    connect_from_port_20=YES
    xferlog_std_format=YES
    listen=YES
    pam_service_name=vsftpd
    userlist_enable=NO
    tcp_wrappers=YES
    seccomp_sandbox=NO

To edit:

    vi /etc/vsftpd/vsftpd.conf

Explanation of settings:

    man vsftpd.conf

### Ubuntu {#ubuntu_1}

Location:

    /etc/vsftpd.conf

To display file:

    cat /etc/vsftpd.conf

It should look a lot like this:

    anonymous_enable=NO
    local_enable=YES
    write_enable=YES
    local_umask=022
    dirmessage_enable=YES
    xferlog_enable=YES
    connect_from_port_20=YES
    xferlog_std_format=YES
    listen=YES
    pam_service_name=vsftpd
    userlist_enable=NO
    tcp_wrappers=YES
    seccomp_sandbox=NO

To edit:

    vi /etc/vsftpd.conf

Explanation of settings:

    man vsftpd

------------------------------------------------------------------------

**Instructions on using Vi: [Vi](Vi "wikilink")**

------------------------------------------------------------------------

## Disable & Verify Firewall {#disable_verify_firewall}

```{=mediawiki}
{{:Disable & Verify Firewall}}
```
## Credentials / Passwords {#credentials_passwords}

There are a few places where all the credentials (on a standard install)
should match exactly.

-   `<font color="red">`{=html}Web Interface -\> Storage Management -\>
    \[Your storage node\] -\> Management Username`</font>`{=html} &
    `<font color="red">`{=html}Management Password`</font>`{=html}

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}Web Interface -\> FOG Configuration -\>
    FOG Settings -\> TFTP Server -\>
    FOG_TFTP_FTP_USERNAME`</font>`{=html} &
    `<font color="red">`{=html}FOG_TFTP_FTP_PASSWORD`</font>`{=html}

```{=html}
<!-- -->
```
-   The local \'`<font color="red">`{=html}fog`</font>`{=html}\' user\'s
    password on the Linux FOG server

```{=html}
<!-- -->
```
-   Server file:
    `<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} -\>
    password (For recent FOG Trunk versions only. 1.2.0 does not have
    this setting. 1.3.0 will though.)

```{=html}
<!-- -->
```
-   Server file:
    `<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} -\>
    username (For recent FOG Trunk versions only. 1.2.0 does not have
    this setting. 1.3.0 will though.)

All of those should match (again, on a standard installation).

To change the password of the local fog user:

    sudo passwd fog

To edit /opt/fog/.fogsettings:

    vi /opt/fog/.fogsettings

Instructions on using Vi: [Vi](Vi "wikilink")

`<font color="red">`{=html}Note:`</font>`{=html} For FOG Trunk/FOG 1.3.0
users, if the password field inside of the
`<font color="red">`{=html}/opt/fog/.fogsettings`</font>`{=html} file is
set incorrectly, every time you re-run the FOG installer, it will set
the local fog user\'s password to this incorrect password. It\'s
important to set the password correctly in **all** of the above listed
areas.

## Beware, your browser\'s auto-fill! {#beware_your_browsers_auto_fill}

Often times, when people change a setting in storage management besides
the username and password for a node, most web browsers will
\"auto-fill\" the username and password in without you knowing. So if
all you\'ve changed is the interface name or replication bandwith or
some other setting, it\'s possible your browser has auto-filled the
username and password and when you click \"Save\", this incorrect
auto-filled username and password is stored.

The reason for your browser doing this is because of how it\'s designed.
It assumes one set of credentials per site. However, FOG has many sets
of credentials, and typically very few of them are the same.

There are some ways to avoid this. First is to be careful, don\'t
needlessly click the save button if you haven\'t changed anything.
Second, watch the username. In most cases, it should be
`<font color="red">`{=html}fog`</font>`{=html}. Watch the password
length too. Another way to guarantee (mostly) that auto-fill doesn\'t
fill in these fields is to use your browsers incognito or privacy mode.
In incognito or privacy mode, all of your normal browser settings are
not used, instead you have a blank slate so auto-fill does not happen.

## Interface

The interface defined within storage management for the storage node you
are using must be correct for image moving at the end of a capture (from
dev to images).

At CLI, you can find the correct interface name by typing
`<font color="red">`{=html}ip addr show`</font>`{=html} In the output
will be the correct interface name. This is pictured below. In a
multi-interface system, there will be multiple interfaces listed.
You\'ll just need to pick the right one. Looking at the IP address
assigned to the interface is the first way to determine the correct
interface.

<figure>
<img src="Ip_addr_show.png" title="Ip_addr_show.png" />
<figcaption>Ip_addr_show.png</figcaption>
</figure>

You must set this interface name inside storage management if it\'s not
already set correctly. This problem is probably specific to FOG 1.2.0
and older because the default storage node used the default value of
`<font color="red">`{=html}eth0`</font>`{=html}. This is fixed in 1.3.0.
Setting the proper interface name in storage management is pictured
below.

<figure>
<img src="Storage_Management_Interface_Name.png"
title="Storage_Management_Interface_Name.png" />
<figcaption>Storage_Management_Interface_Name.png</figcaption>
</figure>

## FTP Path {#ftp_path}

The FTP Path is the exact path used to interact with the image files via
FTP. This must be set correctly. You can find the the settings here:

-   Web Interface -\> Storage Management -\> \[Your storage node\] -\>
    FTP Path

Most of the time, the FTP Path will be the same as the Image Path.
Synology NAS devices will have a different FTP Path than the Image path,
typically the root directory in the Image Path is excluded from the FTP
Path on Synology NAS devices.

## Permissions

The credentials used for this:

Storage Management -\> Storage Node -\> Management Username / Management
Password

Should exactly match the ownership of the /images directory and all of
it\'s contents. The path should also match the actual path to your
images directory.

You can check the permissions on all your image files with this:

    ls -laR /images

You can enable all permissions (just for troubleshooting) on the /images
directory recursively like this:

    sudo chmod -R 777 /images

Normally, /images and all of it\'s contents should be owned by the local
fog user. Whoever the owner is, that\'s the credentials you should use
in you\'re storage node username / password fields.

You can set ownership like this:

    sudo chown -R fog:root /images

## Common problems and fixes {#common_problems_and_fixes}

### My problem isn\'t in the WiKi! {#my_problem_isnt_in_the_wiki}

```{=mediawiki}
{{:My problem isn't in the WiKi!}}
```
### Image Size on server: 0 {#image_size_on_server_0}

This is a common problem, and is *almost* always due to FTP credentials
being incorrect. Please see the \"Credentials\" section above.

### You must first upload an image to create a download task {#you_must_first_upload_an_image_to_create_a_download_task}

You may get this message when you try to deploy an image to computers.

<figure>
<img src="YouMustFirstuploadAnImageToCreateDownloadTask.png"
title="YouMustFirstuploadAnImageToCreateDownloadTask.png" />
<figcaption>YouMustFirstuploadAnImageToCreateDownloadTask.png</figcaption>
</figure>

FTP is used to validate that an image exists before creating an image
task. When an image does exist, but can\'t be verified as existing, you
will receive the above error. This can be caused by incorrect
credentials, permissions, or when the storage node\'s FTP Path field is
blank or incorrect. It\'s possible that Firewall or SELinux could be
blocking FTP as well.

From what the FOG Community has seen in the forums, most people who
receive this error have mismatched credentials.

Please see these to correct the problem:

[Troubleshoot_FTP#Credentials\_.2F_Passwords](Troubleshoot_FTP#Credentials_.2F_Passwords "wikilink")

[Troubleshoot_FTP#FTP_Path](Troubleshoot_FTP#FTP_Path "wikilink")

Source: [Deployment/FTP not
working](https://forums.fogproject.org/topic/4949/deployment-ftp-not-working)

### FTP_Put(): Could not create file {#ftp_put_could_not_create_file}

When attempting to update kernels or in other activities that utilize
FTP, you encounter an \"FTP put\" related error, as pictured below.

<figure>
<img src="Good_FTP_User_who_does_not_have_permissions_over_files.png"
title="Good_FTP_User_who_does_not_have_permissions_over_files.png" />
<figcaption>Good_FTP_User_who_does_not_have_permissions_over_files.png</figcaption>
</figure>

**Solutions:**

This error happens when the FTP credentials that are set for a specific
function are valid for connecting via FTP, but the credentials supplied
have no permission on the files/directories that are to be manipulated.
This is not necessarily a credentials issue but can be resolved by
supplying credentials that have permissions over the files/directories
in question. Otherwise, the user-name that is being used can be given
permissions over the files/directories in question in whatever way that
is appropriate. This error can also occur if the file its downloading
could not be moved to another location or could not be deleted. Please
see above for examples on how to set permissions, and how to change FTP
credentials for the different areas.

### Images stuck in /images/dev {#images_stuck_in_imagesdev}

Images captures and are stored in /images/dev/\[mac address of host\]
and they\'re never moved to /images

Error messages on client at end of capture, being close to completed:

-   FTP move failed
-   FTP error
-   Can\'t rename/move Permission Denied
-   FOGFTP failed to rename file

**Solutions:**

-   Please see
    [Troubleshoot_FTP#Credentials\_.2F_Passwords](Troubleshoot_FTP#Credentials_.2F_Passwords "wikilink")
    above to correct the problem.
-   Ensure the permissions on /images and /images/dev are correct. See
    [Troubleshoot_FTP#Permissions](Troubleshoot_FTP#Permissions "wikilink")
    above.
-   Check you \"interface\" setting in \"Storage management\"!
-   For older versions of Ubuntu that have been upgraded to newer
    versions, this error could be caused by an older FTP setting that
    may be grandfather\'ed in during the upgrade process.

This setting may be commented out or set to NO inside the settings file
(see above), un-comment this, and set it to YES like this:

`write_enable=YES`

**NOTE:** Moving images from /images/dev to /images happens during image
capture. After attempting to correct the issue, try to re-capture and
see if your image gets moved.

### Updating Database\...Failed {#updating_database...failed}

An image capture goes to 100% and states that the Task is complete, but
then says:

    Updating Database.....Failed
    An error has been detected!
    Could not complete tasking (/bin/fog.upload)
    Computer will reboot in 1 minute

This error is only seen in FOG 1.3.0 and up due to the complete re-write
of the capture & deploy scripts.

Pictured below:

<figure>
<img src="Could_not_complete_tasking_fog.upload_Smaller.jpg"
title="Could_not_complete_tasking_fog.upload_Smaller.jpg" />
<figcaption>Could_not_complete_tasking_fog.upload_Smaller.jpg</figcaption>
</figure>

**Solutions:**

This can be FTP Credentials and Permissions related, please look to the
Credentials and Permissions section above.

### Large Image - Connection time out during Delete, Capture, and Replication {#large_image___connection_time_out_during_delete_capture_and_replication}

At first glance, this problem looks a lot like the above problem,
because it will cause images to be \"stuck in /images/dev\", however
this specific probelm is not credentials related. It\'s file-system
related.

If your /images directory is **formated with the ext3** filesystem you
probably run into an issue where deleting the old image in
/images/\[image name\] takes a very long time (minutes with 100GB+
images) and therefore the FTP connection times out and does not
rename/move the newly captured image from /images/dev/\[mac address\] to
/images/\[image name\], or may not delete the image from /images.

**Solution:**

The solution is to have your images on a different filesystem like ext4
or LVM. The issue is defragmentation/reallocation in ext3. For a
detailed explanation see here: [HOW TO REMOVE
BACKUPS?](http://www.depesz.com/2010/04/04/how-to-remove-backups/)

### Images won\'t finish capturing, won\'t go past \"Clearing ntfs flag\" {#images_wont_finish_capturing_wont_go_past_clearing_ntfs_flag}

<figure>
<img src="Clearing.ntfs.flag.png" title="Clearing.ntfs.flag.png" />
<figcaption>Clearing.ntfs.flag.png</figcaption>
</figure>

This is permissions related. See forum threads for more details:

[stuck-after-clearning-ntfs-flag](https://forums.fogproject.org/topic/4804/stuck-after-clearning-ntfs-flag)

[imaging-stuck-on-upload-after-finished](https://forums.fogproject.org/topic/3072/imaging-stuck-on-upload-after-finished)

List permissions:

    ls -laR /images

Fix permissions: Use the correct OS user, and correct storage node
password to change ownership and give read/write/execute to everyone.
Assumes user is \"fog\".

    chown fog -R /images
    chmod -R 777 /images

Changing ownership with user AND group (replace \"user\" and \"group\"
with actual values):

    chown user:group -R /images
