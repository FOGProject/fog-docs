.. include:: /includes.rst

----------------------------
Change FOG Server IP Address
----------------------------

Procedural Steps
================

- Follow appropriate steps for your Linux distribution to change the OS's IP address.
- Update the ipaddress= field (and other fields if necessary) inside the /opt/fog/.fogsettings file. :ref:`More information about the fogsettings file <install_fogsettings>`.
- Rerun the installer
- Update the IP address for the storage node on the FOG system where you changed the IP address Web Interface -> Storage Management
- Update the IP address on a any master storage node that may reference this FOG server Web Interface -> Storage Management
- (For master server) Update the FOG_WEB_HOST value Web Interface -> FOG Configuration -> FOG Settings -> Web Server -> FOG_WEB_HOST
- (For master server) Update the FOG_TFTP_HOST value Web Interface -> FOG Configuration -> FOG Settings -> TFTP Server -> FOG_TFTP_HOST
