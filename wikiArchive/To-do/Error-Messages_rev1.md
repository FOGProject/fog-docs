**Message:**\"Cannot open font file latarcyrheb-sun16 sh-3.1#\"

-   Quick format of the hard drive (did this from the advanced tasks in
    FOG) and this corrected the problem for me.

**Message:**\"Host Name Changer Error Padding is invalid\"

-   Got it! User error. I had to replace the hostnamechange.dll file.

**Message:**\"FOG::GreenFog The remote server returned an error: (407)
Proxy Authentication Required.\"

-   The above error was in my fog.log. It kept the service from working
    properly. I whitelisted the fog server on my squid proxy and that
    solved the problem.

**Debian Squeeze Error Messages:**

**Message:** insserv: warning: script \'S20FOGImageReplicator\' missing
LSB tags and overrides insserv: warning: script \'S20FOGScheduler\'
missing LSB tags and overrides insserv: warning: script
\'S20FOGMulticastManager\' missing LSB tags and overrides insserv: There
is a loop at service rmnologin if started insserv: There is a loop
between service rmnologin and udev if started insserv: loop involving
service udev at depth 1 insserv: There is a loop at service
FOGImageReplicator if started

-   I got the above error when doing aptitude upgrade. I removed the FOG
    scripts from /etc/init.d, did the upgrade and then moved them back
    again. This seemed to work.

**Message:** insserv: Starting FOGMulticastManager depends on rmnologin
and therefore on system facility \`\$all\' which can not be true!
insserv: Starting FOGImageReplicator depends on rmnologin and therefore
on system facility \`\$all\' which can not be true! insserv: Starting
FOGScheduler depends on rmnologin and therefore on system facility
\`\$all\' which can not be true!

-   I got the above error when doing aptitude upgrade. I removed the FOG
    scripts from /etc/init.d, did the upgrade and then moved them back
    again. This seemed to work.

**Resolution:** If you edit the three fog scripts with the following
information, you won\'t need to remove them and put them back in and
they will also run in the background properly. Place the nine lines
below after the #!/bin/sh line. Change SCRIPT_NAME_GOES_HERE to the name
of the script. You will need to do this for FOGImageReplicator,
FOGMulticastManager, and FOGSchedule which are all located in
/etc/init.d/

    ### BEGIN INIT INFO
    # Provides:          SCRIPT_NAME_GOES_HERE
    # Required-Start:    $local_fs $network
    # Required-Stop:     $local_fs
    # Default-Start:     2 3 4 5
    # Default-Stop:      0 1 6
    # Short-Description: SCRIPT_NAME_GOES_HERE
    # Description:       SCRIPT_NAME_GOES_HERE
    ### END INIT INFO
