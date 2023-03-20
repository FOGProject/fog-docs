## Unable to connect to tftp server {#unable_to_connect_to_tftp_server}

This seems to be caused by a password issue,

1.  reset fog password on system using the command **passwd fog** as
    root.
2.  update the **FOG_NFS_FTP_PASSWORD**, **FOG_TFTP_FTP_PASSWORD**
    fields under FOG settings in the FOG management portal.
