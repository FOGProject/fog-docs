In this example we will be using the Fog manual (Full Host Registration)
process as a template, but slightly customizing it so that it only
prompts for PC name Image ID and also automatically assigns the PC to
the Windows 7 OS ID.

Firstly we will need to edit the Init.gz image
([Modifying_the_Init_Image](Modifying_the_Init_Image "wikilink"))

open a terminal and enter the following

`cd /tftpboot/fog/images`\
`gunzip init.gz`\
`mkdir initmountdir`\
`mount -o loop init initmountdir`

Navigate to /tftboot/fog/images/initmountdir/bin

Make a copy fog.man.reg

Rename the copy to fog.custom.reg

Open fog.custom.reg

Make the following changes (`<span style="color:red">`{=html}Red =
Remove code`</span>`{=html}, `<span style="color:blue">`{=html}Blue =
Add code`</span>`{=html})

*Lines 73-81*

`host="";`\
`<span style="color:red">`{=html}`ip="";``</span>`{=html}\
`imageid="";`\
`osid="``<span style="color:blue">`{=html}`NQ==``</span>`{=html}`";   `\
`<span style="color:red">`{=html}`primaryuser="";``</span>`{=html}\
`<span style="color:red">`{=html}`other1="";``</span>`{=html}\
`<span style="color:red">`{=html}`other2="";``</span>`{=html}\
`blImage="";`\
`<span style="color:red">`{=html}`blDoAD="";``</span>`{=html}

(note \"NQ==\" is the number 5 \'Windows 7\' encoded in base64)

Delete the following code to remove the prompt for IP address

*Lines 88-91*

     echo
     echo -n "    Enter the ip for this computer: ";
     read ip;
     ip=`echo $ip | base64`;

Delete the following code to remove the prompt for OS ID

*Lines 109-123*

     while [ "$osid" = "" ] 
     do
     echo
     echo -n "    Enter the OS ID for this computer (? for listing): ";
     ....
     ....
     osid=`echo $osid | base64`;        
     fi
     done

Delete the following code to remove the prompt for adding to Active
directory

*Lines 125-140*

     if [ "$blDoAD" = "" ] 
     then
     echo
     ....
     ....
     esac
     fi

Delete the following code to remove the prompts for Primary User, Tag 1
and Tag 2

*Lines 142-155*

     echo
     echo -n "    Enter the primary user for this computer: ";
     read primaryuser;      
     primaryuser=`echo $primaryuser | base64`;      
            
     echo
     echo -n "    Enter the other tag #1 for this computer: ";
     read other1;   
     other1=`echo $other1 | base64`;
            
     echo
     echo -n "    Enter the other tag #2 for this computer: ";
     read other2;       
     other2=`echo $other2 | base64`;

Make the following changes to so only the fields we have data for is
sent back to the fog server

*Lines 202-204*

`` res=`wget -O - --post-data="mac=${mac}&advanced=1&host=${host} ```<span style="color:red">`{=html}`&ip=${ip}``</span>`{=html}`&imageid=${imageid}&osid=${osid}``<span style="color:red">`{=html}\
`&primaryuser=${primaryuser}&other1=${other1}&other2=${other2}``</span>`{=html}`&doimage=${realdoimage}``<span style="color:red">`{=html}`&doad=${blDoAD}``</span>`{=html}`"`

Now save this document as fog.custom.reg

Navigate to /tftboot/fog/images/initmountdir/etc/init.d

Open S99Fog and add the following lines

`elif [ "$mode" == "clamav" ]; then`\
`run="/bin/fog.av";`\
`after=$afterActionTerm;`\
`<span style="color:blue">`{=html}`elif [ "$mode" == "customreg" ]; then`\
`run="/bin/fog.custom.reg";`\
`after=$afterActionTerm;``</span>`{=html}\
`elif [ "$mode" == "autoreg" ]; then`\
`run="/bin/fog.auto.reg";`\
`after=$afterActionTerm;`

Save this document

We now need to recreate the init.gz file with these new settings open a
terminal window and type

`cd /tftpboot/fog/images`\
`umount initmountdir/`\
`rmdir initmountdir`\
`gzip init`

Finally we can add another menu option in the PXE boot menu so we can
boot into our custom Registration process

navigate to /tftpboot/pxelinux.cfg

Open the file named default and add the following code (where you add
this will depend on where in the menu you would like it to appear)

     LABEL fog.customreg
     kernel fog/kernel/bzImage
     append initrd=fog/images/init.gz  root=/dev/ram0 rw ramdisk_size=127000 ip=dhcp dns=*.*.*.* mode=customreg web=*.*.*.*/fog/ quiet
     MENU LABEL Custom Host Registration and Inventory

NOTE the \* should be replaced with your DNS and Fog Server IP addresses
(check what the fog.reg and fog.reginput entries are and use the same)

Thats it. Now when you boot your PC your PXE menu should have a new menu
option called \"Custom Host Registration\" If you select this option you
will go through the Fog registration and you will only be prompted for
the PC name, The Image ID and whether or not you want to image the PC
Now, by default the PC will have the Windows 7 OS ID
