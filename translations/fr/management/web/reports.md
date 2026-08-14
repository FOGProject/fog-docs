---
title: Gestion des rapports
aliases:
    - Report Management
description: page d'index des rapports
context_id: reports
tags:
    - in-progress
    - reports
    - management
    - web-management
    - web-ui
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/reports).

# Gestion des rapports

## Vue d'ensemble

Les rapports FOG vous permettent d'exporter des données de FOG aux formats CSV
et PDF.

### Journal des snapins

> Ce rapport présente l'historique d'installation des snapins.

### Journal de clonage

> Ce rapport présente les images déployées sur les machines.

### Historique des virus

> Ce rapport liste les virus détectés sur les ordinateurs concernés.

### Inventaire

> Ce rapport présente les informations d'inventaire collectées pour les clients
> du réseau.

### Prêt de matériel

> Ce rapport peut servir à suivre le matériel prêté aux membres du personnel.

### Historique des connexions utilisateurs

> Ce rapport contient des informations sur les connexions des utilisateurs.

## Exécuter des rapports

Un rapport s'exécute depuis la section Rapports de FOG, en choisissant un
rapport dans le menu de gauche.

## Importer des rapports créés par les utilisateurs

-   La section des rapports de FOG permet à l'utilisateur final de créer et de
    téléverser des rapports personnalisés dans FOG.

-   Un rapport FOG est un simple script PHP traité par le serveur.

-   

    Pour importer un rapport, il suffit de

    :   -   cliquer sur le bouton **Upload a Report** dans la section des
            rapports,
        -   sélectionner le rapport puis cliquer sur le bouton de téléversement.
        -   Le rapport apparaîtra alors dans le menu de gauche.

!!! warning

    Soyez prudent lorsque vous téléversez des rapports provenant d'une source
    inconnue : l'auteur du rapport dispose d'un accès complet au système FOG et à
    sa base de données ! Assurez-vous que vos sources sont dignes de confiance
    avant d'importer un rapport !


## Créer des rapports personnalisés

Les rapports personnalisés sont de simples scripts PHP dans FOG. Ils peuvent
être créés à partir du modèle PHP suivant :

``` php
<?php
/*
*  FOG is a computer imaging solution.
*  Copyright (C) 2007  Chuck Syperski & Jian Zhang
*
*   This program is free software: you can redistribute it and/or modify
*   it under the terms of the GNU General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.
*
*   This program is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU General Public License for more details.
*
*   You should have received a copy of the GNU General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
*
*/
if ( IS_INCLUDED !== true ) die( "Unable to load system configuration information." );
require_once( "./lib/ReportMaker.class.php" );
?>

<div class="scroll">
<p class="title">Report Template <a href="export.php?type=csv" target="_blank"><img class="noBorder" src="images/csv.png" /></a> <a href="export.php?type=pdf" target="_blank"><img class="noBorder" src="images/pdf.png" /></a></p>

<?php

// create report object
$report = new ReportMaker();

// write some html to the report
// No CSS for pdf files
$report->appendHTML("Sample Output");

// write some html to the csv file          
$report->addCSVCell("Sample Line 1 - cell 1");
$report->addCSVCell("Sample Line 1 - cell 2");
$report->endCSVLine();              

$report->addCSVCell("Sample Line 2 - cell 1");
$report->endCSVLine();                                              

$sql = "SELECT 
        *
    FROM
        hosts";

$res = mysql_query( $sql, $conn ) or die( mysql_error() );
if ( mysql_num_rows( $res ) > 0 )
{
    while ( $ar = mysql_fetch_array( $res ) )
    {

        // This would output the hostname to the pdf/html
        // $report->appendHTML( $ar["hostName"] . "<br />" );

        // This would output the hostname to the csv file
        // $report->addCSVCell($ar["hostName"]);
        // $report->endCSVLine();                       
    }
}
else
{
    // write html output
    $report->appendHTML("No Information Reported." );

    // write csv output
    $report->addCSVCell("No Information Reported.");
    $report->endCSVLine();                      
}

// leave this as is
$report->outputReport(ReportMaker::FOG_REPORT_HTML);
$_SESSION["foglastreport"] = serialize( $report );  
?>
</div>
```
