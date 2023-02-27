.. include:: /includes.rst

.. note::

It seems that greater than 90% of FOG FTP problems are caused by bad/mismatched credentials. Because of this, we recommend skipping straight to the Credentials / Passwords section first.

----------------------------------
FTP's roles in FOG
----------------------------------

The primary purpose is moving & renaming image files in the /images/dev folder to the /images folder at the end of an image capture. FTP is not used for image capture or deployment because NFS is faster. FTP is also used to download kernels and delete images. FTP is also used to report "Image Size: ON SERVER". FTP is also used to ensure the image you wish to deploy exists before starting an image deployment. FTP is also what's used for image replication in multi-server setups.

FTP should be able to read, write, and delete in /images/dev and /images.

--------------------------------
Testing FTP
--------------------------------
Try to get a file with Linux
============================
These commands are NOT done on your FOG server, they are done on another Linux machine (this example uses Fedora).
*To explain what's happening below in the code box...*
