An issue with the MTU size of the ethernet driver following PXE boot
stops devices with this NIC from being imaged.

The default setting is 1500, which is causing this known problem with
the driver. It is possible to use ifconfig from a debug shell to change
the MTU to 1000.

-   1\) Register the host, select the image, OS etc on Fog server as
    usual
-   2\) Rather than Deploy, choose \"Deploy-Debug\" under advanced tasks
    (Not just deploy, Not just debug)
-   3\) Boot device to PXE and wait for command prompt
-   4\) type: \"/sbin/ifconfig eth0 mtu 1000\"
-   5\) type: \"fog\" to begin imaging

Credit to [mattmole](http://sourceforge.net/users/mattmole/) on
[sourceforge.net](http://sourceforge.net/tracker/index.php?func=detail&aid=2999316&group_id=201099&atid=976199)
for putting in the time to diagnose this isue and provide the workaround
