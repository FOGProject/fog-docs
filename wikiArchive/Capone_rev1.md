:   Please ensure you read about [PXE](PXE "wikilink") before attempting
    to understand Capone if this is the first time.
:   Also, be sure to visit this page to [ENABLE
    CAPONE](Plugins:_Capone "wikilink")

Capone is a plugin used for automated deployment of images to a large
number of PCs, but taking into account the fact that different machine
models have different drivers and so an image for a machine of one make
/ model is not good for a machine of another make / model.

Capone solves this problem by keeping an association of crucial hardware
information of the model of a machine with the appropriate image stored
on the FOG server that has drivers for that model.

This crucial hardware information is formally known as
[DMI](http://en.wikipedia.org/wiki/Desktop_Management_Interface) or
\"Desktop Management Interface\".

The native Linux program [dmidecode](dmidecode "wikilink") is used by
the Capone plugin\'s shell script component to get all the hardware
information from the computer on which it is run.

## How it works {#how_it_works}

What Capone does is that it uses dmidecode present in the init.gz to be
uncompressed and loaded into the client via [PXE](PXE "wikilink") boot,
and the capone shell script selects the needed information like SKU
number (Stock Keeping Unit) to identify the model of the client and send
it to the FOG server in real-time.

In the Capone web interface, the user is expected to enter DMI SKU code
association with a particular image for a particular model. For example,
all machines that have an SKU code of \"ABCD-1234-X/PQR\" will be for
PCs from ABCD corp, 1234 series, PQR variant sub-model.

Now in the past, at least once, the standard image for this machine has
been made and stored in the FOG server\'s /images directory. This image
is known to the FOG web management console via the Images screen.

This image is now associated with the SKU code of \"ABCD-1234-X/PQR\"
via the DMI/RegEx field in the Capone web interface screen.

This tells Capone that if the machine model has a SKU code of
\"ABCD-1234-X/PQR\", it must be loaded with the particular image named
\"ABCD1234X\" (or any comfortable name for your IT staff / operators to
remember)

This being known, the image corresponding to the SKU is the one sent to
the client.

Thus automated model recognition is achieved and there is no need for
manual intervention as far as selection of the appropriate image goes.

Note that this is possible only because of the very useful dmidecode
program and a custom script named fog.capone in the init.gz.

The way Fog uses init.gz and PXE to achieve a variety of tasks is as
follows:\
Let us assume that we have a HP desktop whose system needs to be imaged
or wiped and reinstalled.\
Then the setup would be as shown below:

      HP client ---(PXE request)--->  Fog Server
      .......

      HP client <---(TFTP response init.gz)----  Fog Server
      .......

      HP client loads `init`, linux kernel and runs selected Fog option (PXE menu)
      .......

      HP client ---(TFTP upload/download request)--->  Fog Server
      .......

      HP client ---(NFS Capture)--->  Fog Server
           OR
      HP client <---(NFS Deployment)---  Fog Server

For all this to happen, several settings need to be right:

`* PXE setup of client is correct`\
`* IP addresses for DHCP for signals before TFTP stage.`\
`* TFTP/NFS/DHCP configured and running properly`\
`* Web interface and Fog server processes running properly`\
`* init.gz must be right for the specific client`

The init.gz is a gzipped version of the initial part of Linux kernel
which is loaded first.

The init image is binary and is not a gzip stream. It is mounted using a
special utility script located at /utils/Boot Image
Editor/FOGMountBootImage.sh

All you have to do is to go to that path and run the script:

    user@computer:~$ cd /utils/Boot\ Image\ Editor/

    user@computer:~$ pwd
    /utils/Boot Image Editor/

    user@computer:~$ ./FOGMountBootImage.sh

This does many things - it uncompresses the init.gz and mounts the
resulting init to a temporary directory /tmp/tmpMnt\
In that mounted file system (within your ordinary Fog server file
system) is a bunch of binary programs that might be useful to run on the
client after being transferred over TFTP from Fog server to client as
shown above. Also included are the following scripts:

    fog           fog.man.reg   fog.statusreporter fog.wipe
    fog.auto.reg  fog.chntpw    fog.photorec       fog.surfacetest
    fog.av        fog.chpass    fog.quickimage     fog.testdisk
    fog.capone    fog.debug     

Depending on what you chose in the PXE menu, one of these is run.\
Let us see a few interesting lines in the fog.capone script:

      dmivalue=`dmidecode -t 1 | grep SKU | cut -d' ' -f3`
      echo "";
      echo " * Using Key Value: ${dmivalue}";
      echo "";
      sleep 1;

What this does is explained below.

    user@computer:~$ sudo dmidecode -t 1

    # dmidecode 2.9
    SMBIOS 2.3 present.

    Handle 0x0001, DMI type 1, 25 bytes
    System Information
        Manufacturer: MICRO-STAR INTERNATIONAL CO., LTD
        Product Name: MS-7104
        Version: 3.0
        Serial Number:  
        UUID: 00000000-0000-0000-0000-001D92092567
        Wake-up Type: Power Switch

\"-t 1\" is the Type of DMI info - \"1\" stands for System Information.\
Note this phrase in the output: \"Handle 0x0001, DMI type 1, 25
bytes\".\
(\"Product\" is used instead of \"SKU\" because not all systems not have
SKU Numbers, and to illustrate how to modify the command to your setup)\
This text is sent to grep, looking for \"Product\".\
The output of that command is a single line:

    user@computer:~$ sudo dmidecode -t 1 | grep Product

        Product Name: MS-7104

Now that output is \"cut\" using \"cut -d\' \' -f3\".\
The command means this: take input, split by delimiting using single
space as delimiter(-d\' \') and return field number 3.

    user@computer:~$ sudo dmidecode -t 1 | grep Product | cut -d' ' -f3

    MS-7104

This is your product identification string.\
If you want to catch a different field than SKU number or Product
Number, you simply have to change that parameter to something that you
know is the crucial identification parameter from the DMI information of
your systems.

Now to the really smart part - this **DMI value is sent over HTTP to the
Fog server** via the following lines, to check and see whether such a
record exists in the Capone DMI association tables in the MySQL
database.

      dmi64=`echo $dmivalue | base64`
      echo -n " * Looking for images..........................";    
      img="";
      while [ "$img" = "" ]; do
        img=`wget -O - "http://${web}service/capone.php?action=imagelookup&key=${dmi64}" 2>/dev/null`
        sleep 2;
      done  
      echo "Done";

      dmi64=`echo $dmivalue | base64`

dmi64 just holds the same dmi value in base64 encoding. This is ensure
that there are no special characters in the transmitted data that might
cause something in the web appliaction part to fail or behave
unexpectedly. If an image matching this DMI value exists, then download
of that image begins soon. This is how automated imaging based on DMI
information is achieved.\
Now if you **generalise the situation to allow for any DMI field to be
used** to identify dmi values, you also need to supply the dmi field
name you are looking for. This is the DMIField value in the web screen
for Capone plugin where you are asked to associate **DMIField** (SKU
Number / Product Number / UUID / Product Serial / Model / etc \... )
with the desired **DMIRegex**.\
The code that would be executed then would be:

      dmivalue=`dmidecode -t 1 | grep ${dmifield} | cut -d' ' -f3`

The fog.\* scripts are very informative if you have nominal
understanding of Linux bash shell scripting.\
It also shows the wide range of tasks that can be performed by editing
the desired one among the fog.\* scripts in the init image.
