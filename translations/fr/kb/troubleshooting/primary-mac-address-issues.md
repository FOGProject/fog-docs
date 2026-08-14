---
title: Problèmes d'adresse MAC principale
aliases:
    - Primary Mac Address Issues
description: page d'index des problèmes d'adresse MAC principale
context_id: primary-mac-address-issues
tags:
    - in-progress
    - primary-mac
    - primary-key
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/troubleshooting/primary-mac-address-issues).

# Problèmes d'adresse MAC principale

Pour chaque machine dans FOG, une « adresse MAC principale » sert de clé primaire et d'identifiant unique dans la base de données.
Si cette clé primaire est absente, diverses opérations échoueront pour cette machine, dans l'interface graphique comme dans l'API.
L'adresse MAC principale d'une machine est définie dans la table macaddressassociation. Chaque entrée de cette table comporte un hostid auquel l'adresse MAC est rattachée ainsi qu'un champ booléen primary (1 ou 0).

Cet article donne quelques pistes pour corriger une adresse MAC principale manquante sur une machine.

>[!note]
>Cet article donne des exemples d'utilisation du module PowerShell FogAPI. Pour plus d'informations sur la mise en place de ce module, voir [[https://fogapi.readthedocs.io|Documentation du module PS FogAPI]]

## L'adresse MAC principale de la machine a été supprimée

Si vous supprimez par mégarde une adresse MAC marquée comme principale, vous devez définir l'une des adresses MAC de la machine comme principale.
Si vous utilisez FOG 1.6 ou ultérieur, vous verrez toujours la machine dans la liste, mais vous ne pourrez pas l'ouvrir.

### Corriger l'absence d'adresse MAC principale avec FOG 1.6 et l'API

Pour corriger cela, vous devez récupérer le hostID de la machine concernée et définir l'une de ses adresses MAC associées comme principale.

#### Obtenir le hostid depuis la liste

Vous pouvez utiliser le module PowerShell FogApi pour obtenir la liste des machines avec `Get-FogHosts` et la filtrer sur le nom de la machine concernée (il s'agit d'un appel GET vers `https://fog-server/fog/host`).

Dans PowerShell, vous pouvez facilement filtrer et afficher le hostID ainsi

```
$hostWithIssue = Get-FogHosts | Where-Object name -eq 'hostnameWithIssue'; 
$hostWithIssue.id
#hostid will be displayed here, i.e. 1234
```

>[!note]
>Si vous ne parvenez pas à obtenir la machine depuis la liste, vous pouvez aussi rechercher une adresse MAC dont vous savez qu'elle est associée à la machine et récupérer l'identifiant depuis
>l'association d'adresse MAC. Par exemple :
>```
>$hostmac = Get-FogMacAddresses | Where-Object mac -eq "00:01:02:03:04:05";
>$hostmac.hostid
>```

#### Obtenir les associations d'adresses MAC à partir du host id

Vous pouvez maintenant trouver toutes les associations d'adresses MAC qui utilisent ce hostid. Vous pouvez utiliser `Get-FogMacAddresses` pour effectuer un appel GET sur le chemin d'API `https://fog-server/fog/macaddressassociation`, obtenir la liste de toutes les adresses MAC et la filtrer sur celles dont le hostID correspond.

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

#### Définir une adresse MAC principale

Vous pouvez soit choisir ci-dessus un identifiant précis que vous voulez comme adresse MAC principale, soit simplement retenir la première de la liste puis modifier l'adresse MAC principale dans l'interface graphique. Cet exemple prend la première, met primary à « 1 », puis met à jour cette adresse MAC dans FOG pour en faire la principale de la machine.

```
$hostMac = (Get-FogMacAddresses | Where-Object hostID -eq $hostWIthIssue.id)[0]
$hostMac.Primary = "1";
Update-FogObject -type object -coreObject macaddressassociation -jsonData ($hostMac | ConvertTo-Json) -IDofObject $hostMac.id
```

Ce qui précède effectue un POST sur `https:\\fog-server\fog\macaddressassociation\{$hostmac.id}` avec un json de ce type

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

Vous pouvez également utiliser [[https://fogapi.readthedocs.io/en/latest/commands/Add-FogHostMac/|Add-FogHostMac]] pour forcer une adresse MAC à devenir principale même si elle existe déjà dans FOG, rattachée à une autre machine (ce qui pourrait finir par supprimer l'adresse principale d'une autre machine : à utiliser avec prudence)

```
Add-FogHostMac -hostid 123 -macaddress "12:34:56:78:90" -primary -forceupdate
```

>[!tip]
>Vous pouvez renseigner le champ description sur les machines Windows via l'API afin que cette sortie soit plus parlante dans ces situations. Voir aussi
>[[hosts#macaddress]]

### Corriger l'absence d'adresse MAC principale dans la base de données

Si vous utilisez une version plus ancienne de FOG ou si vous ne souhaitez pas passer par l'API, vous pouvez modifier directement la base de données.

>[!warning]
>Procédez avec prudence lorsque vous modifiez manuellement la base de données. Faites une sauvegarde avant de continuer.

Connectez-vous en SSH à votre serveur FOG et passez en root avec `sudo -i`

Ouvrez la base de données avec `mysql -u root fog`

#### Trouver le hostid

Vous pouvez trouver le `hostID` depuis la table hosts

```
select hostID,hostName from hosts where hostName='hostwithissue' \G
```

* Vous pouvez aussi trouver le `hostID` et le `hmID` en recherchant l'adresse MAC dans la table `hostMAC`

    ```
    select * from hostMAC where hmMac="00:00:00:00:00:01" \G
    ```

Prenez ce `hostID` et trouvez les adresses MAC associées

```
select * from hostMAC where hmHostID='1234' \G
```

Prenez le `hmID` de l'adresse MAC que vous voulez définir comme principale pour la machine qui n'en a pas, et mettez cette ligne à jour.

```
update hostMAC set primary="1" where hmID='{hmID}';
```

Vous devriez désormais pouvoir de nouveau consulter la machine dans l'interface de FOG et effectuer des opérations dessus.

## L'adresse MAC principale de la machine est marquée « en attente »

Utilisez les méthodes ci-dessus pour trouver, cette fois, l'adresse MAC rattachée à la machine qui est en attente, puis utilisez [[https://fogapi.readthedocs.io/en/latest/commands/Approve-FogPendingMac/|Approve-FogPendingMac]] pour retirer l'état « en attente » de l'adresse MAC principale.

Dans la base de données, vous mettriez à jour la ligne de la table macaddressassociation pour avoir `pending="0"` là où `primary="1"` pour ce `hmHostID`

## La machine n'a aucune adresse MAC affectée

Utilisez [[https://fogapi.readthedocs.io/en/latest/commands/Add-FogHostMac/|Add-FogHostMac]] pour ajouter une nouvelle adresse MAC à la machine, avec les options `-primary` et `-forceupdate` afin de garantir son ajout.
