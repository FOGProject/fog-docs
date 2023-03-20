# New Instructions {#new_instructions}

The following instructions are to build and use pre-built binaries for
Clamav. We\'ve switched to this method over providing them for you as
Clamav is constantly changing. Building clamav into the inits didn\'t
allow a simple method to upgrade Clamav so you\'re more in sync with the
current information. Building a static binary is slightly better, but
still requires frequent updating to stay with their current code set.

Because of this, the FOG developers have decided to, still keep the
tasking present, but not provide the Clamav files for you. You will have
to build your own clamav, or install them for your system. As Clamav is
now a mounted share of NFS, it\'s actually much simpler to maintain as
all your clients will be on the same build of Clamav and you will not
need to download the virus definitions on every client.

## Needed Files {#needed_files}

Below is a list of the files that fog was providing for Clamav support:

    To be filled out soon

## Build Instructions {#build_instructions}

To be filled out soon

# Old Instructions {#old_instructions}

## Clamav on Debian Lenny {#clamav_on_debian_lenny}

The current version of clam with Debian stable aka Lenny does not seem
to work with FOG. I did the following to get clam working.

1.  First remove stable version of clam: **aptitude purge
    clamav-freshclam clamav clamav-daemon**
2.  Now add the source for the newer version of clam: **nano
    /etc/apt/sources.list**
3.  I added:

#clam

deb http://volatile.debian.org/debian-volatile stable/volatile main
contrib non-free

1.  **aptitude update**
2.  Now proceed with the fog installation script

**Note:** The above must be done before you install fog. For testing
download the [Eicar Test
Virus](http://en.wikipedia.org/wiki/EICAR_test_file) to a test
workstation and run the clam task on that system. Once the scan has
finished the result can be found in the reports section of the FOG web
interface.

## ClamAV on Ubuntu {#clamav_on_ubuntu}

### Ubuntu 10.04 LTS {#ubuntu_10.04_lts}

1.  \*Optional Steps\*
    1.  Remove ClamAV installed with Fog because it\'s out of date and
        generates too many warnings when trying to update, if it updates
        at all
    2.  Add the PPA to your sources list: ppa:ubuntu-clamav/ppa
    3.  Get the newest clamav installed on your Fog Server
    4.  Update your definitions by running freshclam
2.  Disable scripted updates and let ClamAV download definitions to the
    root of the web server. Add \"ScriptedUpdates off\" to the
    freshclam.conf file on the Fog Server.
3.  Expand the Fog init file. (from
    [Modifying_the_Init_Image](Modifying_the_Init_Image "wikilink"))
    -   cd /tftpboot/fog/images
    -   gunzip init.gz
    -   mkdir initmountdir
    -   mount -o loop init initmountdir
4.  Modify the freshclam.conf file inside the init. Add \"DatabaseMirror
    MyFogServerNameOrIP\" and \"ScriptedUpdates off\" to this file.
5.  Compress the init file.
    -   cd /tftpboot/fog/images
    -   umount initmountdir/
    -   rmdir initmountdir
    -   gzip init
6.  Make symbolic links to the ClamAV files in the root of the web
    server
    -   cd /var/www
    -   ln -s /var/lib/clamav/bytecode.cvd
    -   ln -s /var/lib/clamav/daily.cvd
    -   ln -s /var/lib/clamav/main.cvd
7.  Setup a virus scan task for a host and watch your client download
    the definitions from your Fog server and run the scan
