This article applies to the new FOG Client, version 0.10+

## The Different Installers {#the_different_installers}

The different installers are located in your FOG server\'s web
interface. The link is always at the very bottom of every page, even if
you\'re not logged into the fog server.

<figure>
<img src="Fog_client_link.png" title="Fog_client_link.png" />
<figcaption>Fog_client_link.png</figcaption>
</figure>

<figure>
<img src="New_FOGClient_download_link.png"
title="New_FOGClient_download_link.png" />
<figcaption>New_FOGClient_download_link.png</figcaption>
</figure>

**FOGService.msi** - Windows only, and is ideal for network deployment.

**SmartInstaller.exe** - This is the new default installer. It will work
on all platforms.

**Debugger.exe** - This is not listed in the web interface but is
available from github
[here](https://github.com/FOGProject/fog-client/releases). Only use this
when the above two are not working. This build has more detailed logs
that you can use for troubleshooting or a bug report.

## Installing - Windows {#installing___windows}

**Prerequisites**

-   .NET Framework version 4.0+ (Note: .NET 4 client profile will NOT
    work)

You can download the framework from here:

[Microsoft .NET Framework 4.5.1 (Offline Installer) for Windows Vista
SP2, Windows 7 SP1, Windows 8, Windows Server 2008 SP2 Windows Server
2008 R2 SP1 and Windows Server
2012](https://www.microsoft.com/en-us/download/details.aspx?id=40779)

Windows 10 comes with a version of .Net that will work.

**Installation**

-   May use SmartInstaller or msi. Simply download either one of them
    and run.
-   Reboot to complete installation.

**Windows Limitations**

-   CUPS printers are not yet supported

## Installing - Linux {#installing___linux}

**Prerequisites**

-   Mono (latest stable build)
-   xprintidle - This dependency is optional. If not installed
    AutoLogOut will not run. xprintidle basically just returns the idle
    time of an x window, therefore on a system without a GUI it is not
    needed and should not be installed. It should be available in
    standard package managers. E.G. apt-get, yum, or dnf

### Installing Mono {#installing_mono}

Many distributions come with an out of date version of mono in their
package manager. Therefore, do not attempt to install via your package
manager without the below modifications or take a look at the
instructions found on their website:
<https://www.mono-project.com/download/stable/#download-lin-centos>

**Debian:**

    sudo apt install apt-transport-https dirmngr gnupg ca-certificates
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
    echo "deb https://download.mono-project.com/repo/debian stable-buster main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
    sudo apt update
    sudo apt install mono-complete

**Ubuntu:**

    sudo apt install gnupg ca-certificates
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
    echo "deb https://download.mono-project.com/repo/ubuntu stable-bionic main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
    sudo apt update
    sudo apt install mono-complete

**CentOS**

    rpmkeys --import "http://pool.sks-keyservers.net/pks/lookup?op=get&search=0x3fa7e0328081bff6a14da29aa6a19b38d3d831ef"
    su -c 'curl https://download.mono-project.com/repo/centos8-stable.repo | tee /etc/yum.repos.d/mono-centos8-stable.repo'
    yum install mono-complete

**openSUSE and SLES**

You can install mono using SUSE One-Click files:
[<http://download.mono-project.com/repo/mono-complete.ymp>](http://download.mono-project.com/repo/mono-complete.ymp)

**others**

The FOG Client can be installed on any platform that can run the latest
stable build of mono. To install:

-   Check your package manager for
    `<font color="red">`{=html}mono-complete`</font>`{=html}. After
    installing it run `<font color="red">`{=html}mono
    \--version`</font>`{=html}. Ensure the version is at least 4.2.\_ .
    If it not, remove the package.
-   If your package manager had an old version of mono, see
    [here](http://www.mono-project.com/docs/compiling-mono/linux/) for
    how to compile mono

If your system either has systemd or initd the client will be
automatically configured to run on startup. If your system does not have
either, you will need to configure your system to run the manual start
command below on startup.

To manually start and stop the service:

    sudo /opt/fog-service/control.sh start

    sudo /opt/fog-service/control.sh stop

### Installing fog-client SmartInstaller {#installing_fog_client_smartinstaller}

-   Download SmartInstaller.exe from your FOG server and run the
    installer with mono.
    -   `<font color="red">`{=html}sudo mono
        SmartInstaller.exe`</font>`{=html}
-   The client will install to /opt/fog-service , and fog.log will be
    located at /opt/fog-service/fog.log

The service is automatically configured to run on startup. To manually
start and stop the service:

    sudo systemctl start FOGService

    sudo systemctl stop FOGService

To uninstall:

    sudo systemctl stop FOGService
    sudo mono SmartInstaller.exe uninstall

### Linux Limitations {#linux_limitations}

-   The FOG Tray is currently incompatible on linux systems. Regardless
    of what you set during installation, it will not run.
-   The following modules / features are not yet supported
    -   Active Directory joining
    -   PrinterManager

## Installing - OSX {#installing___osx}

**Prerequisites**

-   Mono (latest stable build)

**Installing Mono**

-   If you are running El Capitan, navigate to
    [<http://www.mono-project.com/download/#download-mac>](http://www.mono-project.com/download/#download-mac)
    and download `<font color=red>`{=html}Mono Universal
    Installer`</font>`{=html}
-   Otherwise, navigate to
    [<http://www.mono-project.com/download/#download-mac>](http://www.mono-project.com/download/#download-mac)
    and download `<font color=red>`{=html}Mono 32-bit`</font>`{=html}

**Installation**

-   Download SmartInstaller.exe from your FOG server and run the
    installer with mono.
    -   `<font color="red">`{=html}sudo mono
        SmartInstaller.exe`</font>`{=html}
-   The client will install to /opt/fog-service , and fog.log will be
    located at /opt/fog-service/fog.log
-   Reboot the system to complete the installation.

The service is automatically configured to run on startup. To manually
start and stop the service:

    sudo launchctl load -w /Library/LaunchDaemons/org.freeghost.daemon.plist

    sudo launchctl unload -w /Library/LaunchDaemons/org.freeghost.daemon.plist

To uninstall:

    sudo launchctl unload -w /Library/LaunchDaemons/org.freeghost.daemon.plist
    sudo mono SmartInstaller.exe uninstall

**OSX Limitations**

-   The follow modules / features are not yet supported
    -   PrinterManager

**Logging**

You can find the client log file in /opt/fog-service/fog.log

## Additional Details {#additional_details}

### Features overview {#features_overview}

The purpose of the FOG Client is multi-fold.

The client allows the host to automatically:

-   Auto logout \-- Enables auto logout of users if inactive for
    specified period of time. 5 minute\'s is the minimum time as all
    others are way too soon, sometimes people may just be on a phone, or
    had to step out for a bathroom break.

```{=html}
<!-- -->
```
-   Client Updater \-- (Only on legacy clients) Allows the client to
    update it\'s modules if you had to customize things, or found a more
    recent build was needed for your environment.

```{=html}
<!-- -->
```
-   Directory Cleaner \-- (Only on legacy clients \-- Only worked with
    Windows XP) Enables the client to remove directories on the host
    automatically. It lost operation after Windows XP due to UAC
    controls and better security mechanisms especially needed. Removed
    completely from the New client.

```{=html}
<!-- -->
```
-   Display Manager \-- Enables the client to adjust the resolution of
    the system on a per system basis, or global basis.

```{=html}
<!-- -->
```
-   Power Management \-- Allows you to specify a shutdown, WOL, or
    restart on a per-host basis. Format for the scheduling is CRON, and
    can be done on an individual host or through groups. There is no
    limit to the number of scheduled power tasks.

```{=html}
<!-- -->
```
-   Host Registration \-- Registers additional mac addresses to a
    pre-existing host if registered. The New client will also register
    the host under a pending status if the host is not already
    registered.

```{=html}
<!-- -->
```
-   Hostname Changer \-- Changes the hostname and joins the domain
    automatically.

```{=html}
<!-- -->
```
-   Printer Manager \-- Manages Printers for the host. Legacy client
    only added printer or added/removed printers. The No management for
    both new and legacy simply does nothing. Will remove all printers
    under Add/Remove type and only add back the printers as needed (Only
    Assigned Printers). Under Add Only (now FOG Managed Printers) only
    manages printers that are listed under the printer\'s GUI and those
    that are assigned to that host. In legacy client, it only added
    printers and never removed. Under the new client, it will ONLY
    manage printers assigned meaning if you remove a printer from a
    host, the new client will remove that printer.

```{=html}
<!-- -->
```
-   Snapins \-- Allows you to install programs or run scripts on the
    host similar to GPO or PDQDeploy.

```{=html}
<!-- -->
```
-   Task Reboot \-- This will just check if the client is in a tasking
    (other than a snapin tasking). If it is in a tasking, and the module
    is enabled, the host will be told to reboot. There is a third
    portion though in that if the user is logged in, and enforce is not
    enabled nothing will happen.

```{=html}
<!-- -->
```
-   User Cleanup \-- (Legacy clients only and again only on Windows XP).
    Works similar to Directory Cleanup but the entries you make are
    \"safe\" user profiles. If the user is not under this listing, it
    will be deleted. Will not work with the new client, and even legacy
    clients will not work on anything beyond Windows XP due to UAC and
    Interactive Service utilities.

```{=html}
<!-- -->
```
-   User Tracker \-- Just tracks who logs in/out of a client.

### Polling Behavior {#polling_behavior}

The new FOG Client found in FOG 1.3.0 and the Legacy FOG Client both
rely on polling to get instructions. This means the FOG Client will
regularly check with the specified FOG Server for settings and tasks.
The New FOG Client\'s polling frequency can be adjusted in the FOG Web
interface, by going to `<font color="red">`{=html}FOG Configuration -\>
FOG Settings -\> FOG Client -\> FOG_CLIENT_CHECKIN_TIME`</font>`{=html}.
The minimum value is 30 seconds, anything specified lower than this will
result in the FOG Client using 30 second polling intervals.

The checkin-time is not rigid. There is an automatic and random
staggering that is added to the checkin time. This prevents a large
number of FOG Clients checking in at once in the event that all
computers are started at the same time via WOL tasks.

The frequency of the checkin-time determines how quickly the FOG Client
will receive instructions from the FOG Server. If an image deployment is
scheduled for a computer that is turned on, with a checkin-time of 60
seconds, means the FOG Client may begin initiating the task anywhere
from 0 to 60 seconds + the random staggering time that is added. This
same concept would apply to immediate power management tasks, snapin
tasks, capture tasks, and so on. Scheduled tasks are not affected by
this behavior, and if the target system is on when the scheduled task is
to be ran, this will happen on time.

### Security Design {#security_design}

Communications between the FOG Client (0.9.9+) and the FOG Server
(1.3.0+) are secured using public key infrastructure.

A Certificate Authority and private key is generated on the FOG server
during first installation in this location:

    /opt/fog/snapins/ssl

The public certificate is generally located here:

    /var/www/html/fog/management/other/ssl

The client installs your servers certificate and the FOG Project
certificate.

The FOG Project CA (made by the FOG Project) serves two purposes:

-   SYSTEM level services need to be digitally signed otherwise windows
    will throw security errors. This can also be used to ensure no
    tampering was done with the client files

```{=html}
<!-- -->
```
-   That certificate is used to verify upgrades. Lets say we release a
    patch for the client, the client will download the MSI from your
    server and check if it was signed by us. If the MSI was somehow
    tampered, the digital signature would no longer be valid.

Using HTTP over HTTPS has no security benefit to the client. Why?
Because all traffic is already encrypted. Heres a very basic overview of
how the new client communicates

-   Each client has a security token. This is used to prove to the
    server that the client is the actual host and not an impersonator.
    This token gets cycled constantly. When the client first makes
    contact, it encrypts its token and a proposed AES 256 key using RSA
    4096 using your servers public key. This public key is verified
    against the pinned server CA certificate by checking the x509 chain
    and fingerprints.

```{=html}
<!-- -->
```
-   If the server accepts the security token and the new AES key, all
    traffic from that point on is AES 256 encrypted using that securely
    transmitted key.

The whole point of our security model is to allow for secure
communication over insecure medians. Even then, the client installation
has an HTTPS option, but it serves no real security benefit.

References:

[CA SSL security
concerns](https://forums.fogproject.org/topic/6325/invalid-security-token-without-any-security-tokens-being-set-also-ca-ssl-security-concerns/6)

[Certificate and Public Key
Pinning](https://www.owasp.org/index.php/Certificate_and_Public_Key_Pinning)

[Transport_Layer_Protection_Cheat_Sheet](https://www.owasp.org/index.php/Transport_Layer_Protection_Cheat_Sheet#Certificate_and_Public_Key_Pinning)

#### Reset encryption data {#reset_encryption_data}

This pertains to the new fog client available in FOG 1.3.0 and above,
and does not apply to the legacy fog client that was available in 1.2.0
and below.

The \"Reset encryption data\" button can be found in an individual
host\'s \"General\" area. You may also find this button in Groups
\"General\" area. The Reset encryption data is mainly doing one thing:
Clearing the security token for a host or group of hosts.

Each host has a security token used by the client. This token is
private; only the client knows it and is protected. It is used to prove
the identity of the host, ensuring no one fakes being a certain host. So
when you \'Reset Encryption Data\", you are essentially telling the
server that the first host to say that they are the host in question
gets locked in (pinned is the technical term).

In order to have encrypted traffic, the handshake must occur. During the
handshake the server proves its identity to the client, and the client
proves its identity to the server (using the security token). If the
handshake fails (due to a bad security token), encryption cannot occur.

The most common scenario where the security tokens for a client will be
incorrect is if you manually uninstall a client, and then install it.

If your Web interface is functional, you may place all computers into a
group, and use the group to reset encryption on all hosts by simply
clicking the \"Reset encryption\" button on the group\'s basic page. If
you\'re web interface isn\'t working correctly and you need to manually
reset the encryption for all hosts, you may follow the below steps.

    mysql
    use fog
    UPDATE hosts SET hostPubKey="", hostSecToken="", hostSecTime="0000-00-00 00:00:00";

### Maintain Control Of Hosts When Building New Server {#maintain_control_of_hosts_when_building_new_server}

Related Article: [Migrate FOG](Migrate_FOG "wikilink")

This section only applies if your hosts have the new FOG client
installed. The new FOG Client has been available in FOG since FOG 1.3.0.

Because of the security model of FOG 1.3.0 and the new client, without
the proper CA and ssl certificates present on a new fog server, any
currently deployed hosts with the new fog client installed will ignore
the new server and not accept commands from it. This is by design.

In order to maintain control of existing hosts with existing new fog
client deployments, you must copy this directory from the old server to
the new server:

-   `<font color="red">`{=html}/opt/fog/snapins/ssl`</font>`{=html}

Copy the directory to a temporary location first. I would suggest
`<font color="red">`{=html}/root`</font>`{=html}

    cp -R /opt/fog/snapins/ssl /root

Then you can use scp to copy the directory (or some other method) to
your new fog server. Run the below command from the **old** server,
Where x.x.x.x is the new fog server\'s address:

    scp -rp /opt/fog/snapins/ssl root@x.x.x.x:/root

Or, the reverse. Run the below command from the **new** server, where
x.x.x.x is the old fog server\'s address.

    scp -rp root@x.x.x.x:/opt/fog/snapins/ssl /root

Next, install fog. After the installation is complete, delete the ssl
folder the installer made, and place your old ssl (from /root that you
copied) in there. The ownership should be fogproject:apache on Red-Hat
variants, should be fogproject:www-data on Debian variants.
`<font color="red">`{=html}IMPORTANT:`</font>`{=html} Then **re-run the
installer.** Instructions for the folder manipulation are below,
assuming you followed the above instructions. On the **new** server:

    rm -rf /opt/fog/snapins/ssl
    cp -R /root/ssl /opt/fog/snapins/ssl
    chown -R fogproject:apache /opt/fog/snapins/ssl  #or fogproject:www-data for ubuntu and debian

If you do not care about maintaining control of existing hosts with
existing new fog client deployments (because there is only 1 or 2), you
can recreate your CA with the -C argument during installation:

    ./installfog.sh -C

`<font color="red">`{=html}Note:`</font>`{=html} Recreating the CA
(`<font color="red">`{=html}\--recreate-CA`</font>`{=html} or
`<font color="red">`{=html} -C`</font>`{=html}) is **very strongly
advised against** if you have many clients deployed already, because it
resets the identity of the FOG Server. This causes all fog clients to
distrust the server, and will require total reinstallation of all fog
clients in an environment. However, you may recreate the keys
(`<font color="red">`{=html}\--recreate-keys`</font>`{=html}) safely and
be able to still control the fog clients.

### FOG Client 0.10.0+ Installation Options {#fog_client_0.10.0_installation_options}

#### Smart Installer {#smart_installer}

SmartInstaller Switches

All switches with `<font color="red">`{=html}\--{OPTION}`</font>`{=html}
can also be used as `<font color="red">`{=html}/{OPTION}`</font>`{=html}

-   `<font color="red">`{=html}\--server=`</font>`{=html} Specify the
    server address. Default is fogserver
-   `<font color="red">`{=html}\--webroot=`</font>`{=html} Specify the
    webroot. Default is /fog
-   `<font color="red">`{=html}-h`</font>`{=html} or
    `<font color="red">`{=html}-https`</font>`{=html} Use https for
    server communication
-   `<font color="red">`{=html}-r`</font>`{=html} or
    `<font color="red">`{=html}-rootlog`</font>`{=html} Put fog.log in
    the root of the filesystem
-   `<font color="red">`{=html}-s`</font>`{=html} or
    `<font color="red">`{=html}\--start`</font>`{=html} Automatically
    start the service after installation. Linux only
-   `<font color="red">`{=html}-t`</font>`{=html} or
    `<font color="red">`{=html}\--tray`</font>`{=html} Enabled the FOG
    Tray and notifications - Windows and OSX only.
-   `<font color="red">`{=html}-u`</font>`{=html} or
    `<font color="red">`{=html}\--uninstall`</font>`{=html} Uninstall
    the client
-   `<font color="red">`{=html}\--upgrade`</font>`{=html} Upgrade the
    client
-   `<font color="red">`{=html}-l=`</font>`{=html} or
    `<font color="red">`{=html}\--log=`</font>`{=html} Specify where to
    put the SmartInstaller log

Reference:
[<https://news.fogproject.org/fog-client-v0-11-0-released-2/>](https://news.fogproject.org/fog-client-v0-11-0-released-2/)

#### MSI Switches {#msi_switches}

`<font color="red">`{=html}msiexec /i FOGService.msi /quiet
USETRAY=\"0\" HTTPS=\"0\" WEBADDRESS=\"192.168.1.X\" WEBROOT=\"/fog\"
ROOTLOG=\"0\"`</font>`{=html}

Firstly, all options are optional. Heres what they all do:

-   `<font color="red">`{=html}USETRAY=`</font>`{=html} defaults to
    `<font color="red">`{=html}\"1\"`</font>`{=html}, if
    `<font color="red">`{=html}\"0\"`</font>`{=html} the tray will be
    hidden

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}HTTPS=`</font>`{=html} defaults to
    `<font color="red">`{=html}\"0\"`</font>`{=html}, if
    `<font color="red">`{=html}\"1\"`</font>`{=html} the client will use
    HTTPS (not recommended)

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}WEBADDRESS=`</font>`{=html} defaults to
    `<font color="red">`{=html}\"fogserver\"`</font>`{=html}, this is
    the ip/dns name of your server

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}WEBROOT=`</font>`{=html} defaults to
    `<font color="red">`{=html}\"/fog\"`</font>`{=html}

```{=html}
<!-- -->
```
-   `<font color="red">`{=html}ROOTLOG=`</font>`{=html} defaults to
    `<font color="red">`{=html}\"0\"`</font>`{=html}, if
    `<font color="red">`{=html}\"1\"`</font>`{=html} the fog.log will be
    at C:\\fog.log, otherwise %PROGRAMFILES%\\FOG\\fog.log

Reference:
[<https://forums.fogproject.org/topic/6222/msi-silent-install-without-tray-icon/2>](https://forums.fogproject.org/topic/6222/msi-silent-install-without-tray-icon/2)

### FOG Client with Sysprep {#fog_client_with_sysprep}

If you plan to use Sysprep before image capture and are also planning to
use the FOG Client, You **must** disable the
`<font color="red">`{=html}FOGService`</font>`{=html} service from
running at boot before you Sysprep to take your image, and then
re-enable it within your
`<font color="red">`{=html}SetupComplete.cmd`</font>`{=html} file so
that it is re-enabled **after** the image deployment is complete.

Failing to do so will break the Sysprep post-deployment process with an
error message that says \"Windows Setup could not configure Windows to
run on this computers hardware.

-   Disable FOGService: `<font color="red">`{=html}Windows Control
    Pannel -\> View by Small Icons -\> Administrative Tools -\> Services
    -\> Right click FOGService -\> Properties -\> Startup Type -\>
    Disabled`</font>`{=html}

```{=html}
<!-- -->
```
-   Re-enable FOGService post-imaging:

Create the below file.

`<font color="red">`{=html}C:\\Windows\\Setup\\scripts\\SetupComplete.cmd`</font>`{=html}

Place these lines within the file, and then save.

    sc config FOGService start= delayed-auto
    shutdown -t 0 -r

As the filename indicates, the script is called by windows after an
image is deployed and post-sysprep operations are complete. It will
re-enable the FOGService and then reboot the computer gracefully. After
the computer reboots, the FOGService will start automatically and rename
the computer if necessary, reboot if necessary, join the domain and
reboot if necessary, and then perform any associated snapins.

`<font color="red">`{=html}Note:`</font>`{=html} SetupComplete.cmd will
not automatically run on OEM versions of windows, but will automatically
run on Non-OEM versions of Windows. If you\'re using an OEM copy, you
can use firstlogoncommands in unattend.xml to call SetupComplete.cmd

An example of the firstlogincommands might be:

    <component name=Microsoft-Windows-Shell-Setup processorArchitecture=amd64 publicKeyToken=31bf3856ad364e35 language=neutral versionScope=nonSxS xmlns:wcm=http://schemas.microsoft.com/WMIConfig/2002/State xmlns:xsi=http://www.w3.org/2001/XMLSchema-instance>
    <FirstLogonCommands>
    <SynchronousCommand wcm:action=add>
    <Description>SetupComplete</Description>
    <Order>1</Order>
    <CommandLine>C:\Windows\Setup\Scripts\SetupComplete.cmd</CommandLine>
    <RequiresUserInput>false</RequiresUserInput>
    </SynchronousCommand>
    </FirstLogonCommands>

### More Information {#more_information}

More information about the fog client can be found here:
[<https://github.com/FOGProject/fog-client>](https://github.com/FOGProject/fog-client)
