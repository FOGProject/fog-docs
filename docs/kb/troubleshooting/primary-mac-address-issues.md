---
title: Primary Mac Address Issues
aliases:
    - Primary Mac Address Issues
description: index page for Primary Mac Address Issues
context_id: primary-mac-address-issues
tags:
    - in-progress
    - primary-mac
    - primary-key
---

# Primary Mac Address Issues

For each Host in Fog, a 'primary mac' is used as the primary key/unique identifier within the database.
If this primary key is missing, then various operations will fail in the GUI and the API for that Host.
The primary mac for a host is set in the macaddressassociation table. Each entry in that table has a hostid the mac is linked to and a boolean primary field (1 or 0). 

This article gives some insight on how you might fix a missing primary mac on a host.

>[!note]
>This article gives examples of using the FogAPI powershell module. For more information on the setup of this module see [[https://fogapi.readthedocs.io|FogAPI PS Module Documentation]]

## Host Primary Mac was removed

If you accidentally remove a mac that was marked as primary then you need to set one of the macs of a host to primary.
If you are using Fog 1.6+ then you will still see the Host in the list view, but won't be able to open it.

### Fix no Primary Mac with Fog 1.6 and the API

To fix this, you need to get the hostID of the host with the issue and set one of its associated macs as primary. 

#### Obtain the hostid from the list view

You can use the FogApi powershell module to get the list of hosts with `Get-FogHosts` and filter that to the hostname of the host with the issue (This is a GET call to `https://fog-server/fog/host`).

In Powershell you can easily filter this and display the hostID like so 

```
$hostWithIssue = Get-FogHosts | Where-Object name -eq 'hostnameWithIssue'; 
$hostWithIssue.id
#hostid will be displayed here, i.e. 1234
```

>[!note]
>If you can't get the host from the list view, you can also search for a mac you know is associated with the host and get the id from 
>the mac address association instead. i.e. 
>```
>$hostmac = Get-FogMacAddresses | Where-Object mac -eq "00:01:02:03:04:05";
>$hostmac.hostid
>```

#### Obtain the mac address associations with the host id

Now you can find all the mac addresss associations that use that hostid. You can use `Get-FogMacAddresses` to do a get call on the `https://fog-server/fog/macaddressassociation` api path and get a list of all macaddresses and filter to the ones with a matching hostID.

```
Get-FogMacAddresses | Where-Object hostID -eq $hostWIthIssue.id
```

```
#the above command will display the mac entries associated with the host i.e.:
id           : 5115
DT_RowId     : row_5115
hostID       : 1234
hostLink     : <a href="../management/index.php?node=host&sub=edit&id=1234">hostWithIssue</a>
mac          : 00:00:00:00:00:01
description  : 
pending      : 0
primary      : 0
clientIgnore : 0
imageIgnore  : 0

id           : 6275
DT_RowId     : row_6275
hostID       : 1234
hostLink     : <a href="../management/index.php?node=host&sub=edit&id=1234">hostWithIssue</a>
mac          : 00:00:00:00:00:02
description  : 
pending      : 0
primary      : 0
clientIgnore : 0
imageIgnore  : 0

id           : 6942
DT_RowId     : row_6942
hostID       : 1234
hostLink     : <a href="../management/index.php?node=host&sub=edit&id=1234">hostWithIssue</a>
mac          : 00:00:00:00:00:03
description  : 
pending      : 0
primary      : 0
clientIgnore : 0
imageIgnore  : 0
```

#### Set a primary mac

You can either select a specific id from above that you want to be the primary mac, or simply set it to the first in the list and then edit the primary mac in the gui. This example is grabbing the first one, setting primary to '1' and then updating that mac in fog to be the primary for the host.

```
$hostMac = (Get-FogMacAddresses | Where-Object hostID -eq $hostWIthIssue.id)[0]
$hostMac.Primary = "1";
Update-FogObject -type object -coreObject macaddressassociation -jsonData ($hostMac | ConvertTo-Json) -IDofObject $hostMac.id
```

The above will do a POST on `https:\\fog-server\fog\macaddressassociation\{$hostmac.id}` with json like this

```
{
  "pending": "0",
  "mac": "00:00:00:00:00:01",
  "imageIgnore": "0",
  "clientIgnore": "0",
  "hostID": "1234",
  "primary": "1"
}
```

You could also use Use [[https://fogapi.readthedocs.io/en/latest/commands/Add-FogHostMac/|Add-FogHostMac]] to force a mac to be primary even if it already exists in fog attached to a different host (which could end up removing the primary for another host, so use caution)

```
Add-FogHostMac -hostid 123 -macaddress "12:34:56:78:90" -primary -forceupdate
```

>[!tip]
>You can set the description field on Windows hosts with the API so that this output is more helpful in these scenarios. See also
>[[hosts#macaddress]]

### Fix no Primary Mac in the database

If you are using an older version of FOG or don't want to use the API for this, you can edit the database directly.

>[!warning]
>Proceed with caution when manually editing the database. Take a backup before proceeding.

SSH into your fog server, and switch to sudo `sudo -i`

Open the database with `mysql -u root fog`

#### Find the hostid

You can find the `hostID` from the hosts field 

```
select hostID,hostName from hosts where hostName='hostwithissue' \G
```

* You could also find the `hostID` and the `hmID` by searching for the mac address in the `hostMAC` table

    ```
    select * from hostMAC where hmMac="00:00:00:00:00:01" \G
    ```

Take that `hostID` and find the macs associated

```
select * from hostMAC where hmHostID='1234' \G
```

Take the `hmID` of the mac you want to set as the primary for the host with no primary and update that row.

```
update hostMAC set primary="1" where hmID='{hmID}';
```

You should now be able to view the host in the fog UI again and perform operations against it.

## Host Primary Mac marked as Pending

Use the methods above to instead find the mac attached to the host that is pending and use [[https://fogapi.readthedocs.io/en/latest/commands/Approve-FogPendingMac/|Approve-FogPendingMac]] to remove the pending mac from the primary mac.

In the database you would update the row in the macaddressassociation table to have `pending="0"` where `primary="1"` for that `hmHostID`

## Host has no macs assigned

Use [[https://fogapi.readthedocs.io/en/latest/commands/Add-FogHostMac/|Add-FogHostMac]] to add a new mac to the host using the `-primary` and `-forceupdate` switches to ensure it gets added.
