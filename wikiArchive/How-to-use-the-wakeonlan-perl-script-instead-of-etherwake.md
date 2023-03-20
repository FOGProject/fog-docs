I had a problem with etherwake.exe when crossing multiple subnets and
could not get Wake On Lan to work so I tried the wakeonlan perl script
located here /usr/bin/, with some minor edits to the wol.php file
located here /var/www/fog/wol/. Wakeonlan perl script allows you to add
subnet masks using the -i switch and that is what I had to do for each
subnet I needed to reach.

Below is a sample copy of my wol.php file\...

    <?php
    require_once( "../commons/config.php" );

    $conn = mysql_connect( MYSQL_HOST, MYSQL_USERNAME, MYSQL_PASSWORD);
    if ( $conn )
    {
        @mysql_select_db( MYSQL_DATABASE );
    }

    require_once( "../commons/functions.include.php" );

    $mac = $_GET["wakeonlan"];
    if ( isValidMACAddress( $mac ) )
    {

        $wol = "/usr/bin/wakeonlan";

        exec ( "$wol -i 10.1.1.255 $mac" );
            exec ( "$wol -i 10.2.2.255 $mac" );
        exec ( "$wol -i 10.3.3.255 $mac" );
        exec ( "$wol -i 10.4.4.255 $mac" );
    }
    ?>
