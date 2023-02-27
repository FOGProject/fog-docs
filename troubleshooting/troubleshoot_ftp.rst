.. include:: /includes.rst
--------------------------------
Troubleshooting FTP
--------------------------------

.. note::
  It seems that greater than 90% of FOG FTP problems are caused by bad/mismatched credentials. Because of this, we recommend skipping straight to the Credentials / Passwords section first.

FTP's roles in FOG
==================

The primary purpose is moving & renaming image files in the /images/dev folder to the /images folder at the end of an image capture. FTP is not used for image capture or deployment because NFS is faster. FTP is also used to download kernels and delete images. FTP is also used to report "Image Size: ON SERVER". FTP is also used to ensure the image you wish to deploy exists before starting an image deployment. FTP is also what's used for image replication in multi-server setups.

FTP should be able to read, write, and delete in /images/dev and /images.

Testing FTP
=============

**Try to get a file with Linux**
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
