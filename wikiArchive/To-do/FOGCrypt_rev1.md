## FOGCrypt

### Method 1: {#method_1}

-   (Fog v1.x.x)

1.  Go to your fog Web GUI and find \"**FOG Project: Chuck Syperski,
    Jian Zhang, Peter Gilchrist & Tom Elliott FOG Client/Prep link:
    `<u>`{=html}FOG Client/FOG Prep`</u>`{=html}**\" at the footer of
    the page
2.  Click link for Fog Client/FOG Prep. This still leads to a section
    for downloading the FogCrypt service
3.  Download FogCrypt
4.  Unzip FogCrypt.zip

#### Windows

1.  Open command promt(cmd)
2.  To get to the downloads folder type *cd %userprofile%\\Downloads*
3.  cd FOGCrypt
4.  FOGCrypt.exe *your password \>encrypted-password.txt*
5.  Open the file you created encrypted-password.txt with any text
    editor like notepad and the encrypted password can be copied into
    FOG via the FOG web interface.

#### Linux

Although FOGCrypt is a .NET application, and can be run on Linux, the
encrypted value may not correspond to the value obtained from a Windows
machine. So do not use this method unless you have verified the
encryption against a copy running on the actual target computer.

-   If *mono* is installed on your linux box (not default of FOG
    install)

1.  Open terminal

2.  mono ./FOGCrypt.exe

    -   If it complains about mscorlib.dll, run it as:

    -    MONO_PATH=/usr/lib/mono/4.5 mono ./FOGCrypt.exe 

### Method 2: {#method_2}

-   Older versions of Fog

1.  Using [winscp](http://winscp.net/eng/index.php) or some other sftp
    tool copy the fogcrypt folder from your fog server
    (/opt/fog-setup/fog_0.32/) to a windows pc
2.  Move it to c:
3.  Goto to *Start*, *Run* and type *cmd* and hit the Enter key.
4.  To get to the c: type *cd c:\\*
5.  cd fog_0.32 (replace with name of the version you are using)
6.  cd FOGCrypt
7.  FOGCrypt.exe *your password \>encrypted-password.txt*
8.  Open the file you created encrypted-password.txt with any text
    editor like notepad and the encrypted password can be copied into
    FOG via the FOG web interface.

-   This link was helpful:
    <http://www.edugeek.net/forums/o-s-deployment/36189-fog-installations-woes-5.html>
