## Overview

If you do not have a public sever where you can store your printer
drivers for the FOG Printer Manager, then it is very easy to set one up
on the FOG server using Samba, so all your Windows Clients will be able
to connect.

## Ubuntu (10.04+) {#ubuntu_10.04}

The first thing you must do is to install samba:

`sudo apt-get install samba system-config-samba`

Create a new Linux user:

`System -> Administration -> Users and Groups`

Click **Add User**

Username: **printerdrivers**

Fullname: **Printer Drivers**

Password: somepassword

Create a directory to store the drivers:

`sudo mkdir /opt/fog/printerdrivers`\
`sudo chown printerdrivers /opt/fog/printerdrivers -R`

System -\> Administration -\> Samba

`Preferences -> Server Settings... -> Security -> Guest Account `

Set guest account to **printerdrivers**

Change Authentication Mode to **Share**

Click **Add Share**

Click **browse** and navigate to **/opt/fog/printerdrivers**

`Share name: `**`printerdrivers`**

Place a check mark next to **visible** and leave **writable** unchecked.

Click on the **Access** tab.

Select **Allow access to everyone**.

Click **OK**.

You should now be able to access the share (read-only) from a windows
computer using the following path:

**\\\\x.x.x.x\\printerdrivers**

Where x.x.x.x is the ip address of the FOG server.

## Fedora

If you do not have a public sever where you can store your printer
drivers for the FOG Printer Manager, then it is very easy to set one up
on the FOG server using Samba, so all your Windows Clients will be able
to connect.

The first thing you must do is to install samba:

`yum install samba system-config-samba`

Then make samba startup by default:

`chkconfig smb on`

Create a new Linux user:

`System -> Administration -> Users and Groups`

Click **Add User**

Username: **printerdrivers**

Fullname: **Printer Drivers**

Password: somepassword

Create a directory to store the drivers:

`mkdir /opt/fog/printerdrivers`

`System -> Administration -> Samba`\
`Preferences -> Server Settings... -> Security -> Guest Account `

Set guest account to **printerdrivers**

Change Authentication Mode to **Share**

Click **Add Share**

Click **browse** and navigate to **/opt/fog/printerdrivers**

`Share name: `**`printerdrivers`**

Place a check mark next to **visible** and leave **writable** unchecked.

Click on the **Access** tab.

Select **Allow access to everyone**.

Click **OK**.

You should now be able to access the share (read-only) from a windows
computer using the following path:

**\\\\x.x.x.x\\printerdrivers**

Where x.x.x.x is the ip address of the FOG server.
