.. include:: /includes.rst
-------------------
Troubleshooting FTP
-------------------

.. note:: It seems that greater than 90% of FOG FTP problems are caused by bad/mismatched credentials. Because of this, we recommend skipping straight to the Credentials / Passwords section first.

FTP's roles in FOG
==================

The primary purpose is moving & renaming image files in the /images/dev folder to the /images folder at the end of an image capture. FTP is not used for image capture or deployment because NFS is faster. FTP is also used to download kernels and delete images. FTP is also used to report "Image Size: ON SERVER". FTP is also used to ensure the image you wish to deploy exists before starting an image deployment. FTP is also what's used for image replication in multi-server setups.

FTP should be able to read, write, and delete in /images/dev and /images.

Testing FTP
===========

Try to get a file with Linux
----------------------------

These commands are NOT done on your FOG server, they are done on another Linux machine (this example uses Fedora).

*To explain what's happening below in the code box...*

- Create a test file with some data in it to send later.
- Start ftp (may need installed first).
- Open connection to FOG server.
- Provide username (found in Web Interface -> Storage Management -> [NodeName] -> Management Username).
- Provide password (found in Web Interface -> Storage Management -> [NodeName] -> Management Password).
- Change to /images directory.
- List directory contents.
- Upload file.
- List directory contents to verify.
- Download the file.
- Delete the file.
- Exit ftp.
::

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

Try to get a file with Windows
------------------------------

*Explanation of the code below:*

- Create a file with some data
- Start FTP
- Open connection to FOG server
- Enter username (found in Web Interface -> Storage Management -> [NodeName] -> Management Username).
- Enter password (found in Web Interface -> Storage Management -> [NodeName] -> Management Password).
- Upload file
- List directory to verify
- Download file
- Close connection
- Close FTP.
::

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
    
FTP Service
===========

Fedora 20/21/22/23
------------------

- Check the status of FTP with
::

    systemctl status vsftpd.service
(Should be on and green, no errors, and enabled)

- stop, start, disable and enable FTP service.
::

    systemctl stop vsftpd.service
    systemctl start vsftpd.service
    systemctl disable vsftpd.service
    systemctl enable vsftpd.service
- Test that it’s functioning by using the testing instructions at the top of this article additionally, if you open a web browser and go to
::
    ftp://x.x.x.x
- Use fog / your-fog-account-Password for the credentials
- You should see “Index of /”

Ubuntu
------

- Restart FTP service.
::

    service vsftpd restart
- Enable and disable are not available due to this service being in the Upstart scripts.
- Test that it’s functioning by using the testing instructions at the top of this article additionally, if you open a web browser and go to
::

    ftp://x.x.x.x
- Use fog / your-fog-account-Password for the credentials (Since v. 1.5.6, the default username is 'fogproject.')
- You should see “Index of /”

FTP Settings File
=================

Fedora 20/21/22/23
------------------

Location:
::

    /etc/vsftpd/vsftpd.conf
To display file:
::

    cat /etc/vsftpd/vsftpd.conf
It should look a lot like this:
::

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

::

    vi /etc/vsftpd/vsftpd.conf
Explanation of settings:
::

    man vsftpd.conf
    
Ubuntu
------

Location:
::
    /etc/vsftpd.conf
To display file:
::

    cat /etc/vsftpd.conf
It should look a lot like this:
::

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
::

    vi /etc/vsftpd.conf
Explanation of settings:
::

    man vsftpd

.. info:: Instructions for using VI: :ref:`vi`

Disable and Verify Firewall
===========================

Fedora 20/21/22/23
------------------

**Disable/stop Firewall**
::

    systemctl disable firewalld.service
    systemctl stop firewalld.service
Can be undone with "start" and "enable".
**Check Firewall in Fedora 20/21/22/23**
::

    systemctl status firewalld.service
Fedora 16
---------
Add /bin/bash to /etc/shells as the vsftpd yum install does not do it correctly causing tftp timeout message

Debian/Ubuntu
-------------
Check the status of the firewall:
::

    sudo iptables -L
If disabled, the output should look like this:
::

    Chain INPUT (policy ACCEPT)
    target prot opt source destination 

    Chain FORWARD (policy ACCEPT)
    target prot opt source destination 

    Chain OUTPUT (policy ACCEPT)
    target prot opt source destination
**Disable Ubuntu Firewall**
::

    sudo ufw disable
**Disable Debian Firewall**
::
    
    iptables -F
    iptables -X
    iptables -t nat -F
    iptables -t nat -X
    iptables -t mangle -F
    iptables -t mangle -X
    iptables -P INPUT ACCEPT
    iptables -P OUTPUT ACCEPT
    iptables -P FORWARD ACCEPT
Other debian settings:
::

    /etc/hosts.deny
This setting in the above file will deny traffic from any source except locally:
::

    ALL:ALL EXCEPT 127.0.0.1:DENY
    
Comment out this line like so:
::

    # ALL:ALL EXCEPT 127.0.0.1:DENY

Windows 7
---------

Start -> Control Panel -> View by "Small icons" -> Windows Firewall -> Turn Windows Firewall On or Off (Turn off all three.)

Configuring Firewall on Linux
-----------------------------

To set the firewall for Linux to only allow what is necessary, please see the :ref:`Link Text <reference:fog_security:FOG Security article>`.

-----------------------
Credentials / Passwords
-----------------------

There are a few places where all the credentials (on a standard install) should match exactly.

- There are a few places where all the credentials (on a standard install) should match exactly.
- Web Interface -> Storage Management -> [Your storage node] -> Management Username & Management Password
- Web Interface -> FOG Configuration -> FOG Settings -> TFTP Server -> FOG_TFTP_FTP_USERNAME & FOG_TFTP_FTP_PASSWORD
- The local 'fogproject' user's password on the Linux FOG server
- Server file: /opt/fog/.fogsettings -> password (For FOG Trunk versions 1.3.0 and higher)
- Server file: /opt/fog/.fogsettings -> username (For FOG Trunk versions 1.3.0 and higher)
All of those should match (again, on a standard installation).

To change the password of the local fog user:
::

    sudo passwd fog

To edit /opt/fog/.fogsettings:
::

    vi /opt/fog/.fogsettings
.. info:: Instructions for using VI: :ref:`vi`

.. note:: For FOG Trunk/FOG 1.3.0 users, if the password field inside of the /opt/fog/.fogsettings file is set incorrectly, every time you re-run the FOG installer, it will set the local fog user's password to this incorrect password. It's important to set the password correctly in all of the above listed areas.


