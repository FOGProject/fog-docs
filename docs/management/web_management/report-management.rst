.. include:: ../includes.rst

-----------------
Report Management
-----------------

Overview
========

FOG Reports allow you to export data from FOG in CSV, and PDF formats


Snapin Log
----------

    This report will report on snapin installation history.

Imaging Log
-----------

    This report will report on images deployed to hosts.

Virus History
-------------

    This report lists any viruses that were found on locate computers. 

Inventory
---------

    This report will report on the inventory information collect for network clients. 

Equipment Loan
--------------

    This report can be used for equipment loaned to staff members.  

User Login History
------------------

    This report contains information about user logins.

Running Reports
===============

Running a report can be done from the Reports section of FOG, then by picking a report from the left-hand menu.

Importing User Created reports
==============================

- The reporting section of FOG allows for the end user to create and upload custom reports into FOG.
- A FOG report is a simple php script that is processed by the server.  
- To import a report simply 
    - click on the **Upload a Report** button in the reports section, 
    - select the report then click on the upload button.
    - The report will then show up on the left-hand menu.  

.. warning:: Please be cautious when uploading reports from an unknown source as the writer of the report has full access to the FOG system and database!  Make sure your sources are trustworthy before importing a report!

Creating Custom Reports
=======================

Custom reports are simple php scripts in FOG.  Custom reports can be created based on the following php template:

.. code-block:: php

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




