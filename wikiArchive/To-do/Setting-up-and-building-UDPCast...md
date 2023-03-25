The UDPCast repository that FOG depends on is out of date. It needs to
be updated before installation can continue.\
\
From this forum thread:
<http://fogproject.org/forum/threads/setting-up-and-starting-mysql-failed-fog_0-32-on-ubuntu-13-10-32bit.9936/>\
\
\-\-\--\
\
\
To fix udpcast. Go to the location on the extracted fog folder:\
\
ex /home/server/Desktop/fog_0.32/\
\
Open command prompt and issue the following commands:\
\

       cd packages
       wget https://svn.code.sf.net/p/freeghost/code/trunk/packages/udpcast-20120424.tar.gz
       rm -f udpcast-20071228.tar.gz
       sed -i 's/udpcastout="udpcast-20071228"/udpcastout="udpcast-20120424"/' ../lib/common/config.sh
       sed -i 's/udpcastsrc="../packages/udpcast-20071228.tar.gz"/udpcastsrc="../packages/udpcast-20120424.tar.gz"/' ../lib/common/config.sh
       cd ../bin

\
Now issue the build command\

       ./installfog.sh

\
\-\-\--\
Alternative Installation\
\-\-\--\
If the above sed commands fail to execute, you can manually edit the
config.sh file located in the fog_0.32/lib/common folder.\
\

        sudo gedit <path to file>/home/server/Desktop/fog_0.32/lib/common/config.sh

\
edit the following lines to reflect the new file:\
udpcastsrc=\"../packages/udpcast-20071228.tar.gz\"\
udpcastout=\"udpcast-20071228\"\
\
to\
\
udpcastsrc=\"../packages/udpcast-20120424.tar.gz\"\
udpcastout=\"udpcast-20120424\"\
save and close.\
\
Now issue the build command\

       ./installfog.sh
