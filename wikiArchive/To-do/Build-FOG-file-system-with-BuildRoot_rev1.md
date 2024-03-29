In order for the FOG Client to boot on the hosts, it requires a kernel
and a filesystem image containing its filesystem. Buildroot helps
building the toolchain (uclibc) and generate that image with busybox and
all the packages we need. This page will tell you how to build the
filesystem on your own from SVN.

## Dependencies

### Debian 7 (and Ubuntu 12.x and newer) {#debian_7_and_ubuntu_12.x_and_newer}

Install the latest partclone information to allow build to work

-   Add repositories
    -   deb http://free.nchc.org.tw/drbl-core drbl stable testing unstable dev

    -   deb-src http://free.nchc.org.tw/drbl-core drbl stable testing unstable dev
-   Add repository key
    -   wget http://drbl.nchc.org.tw/GPG-KEY-DRBL; apt-key add GPG-KEY-DRBL
-   Update repos to allow easier integration.
    -   apt-get update
-   Install the files
    -   sudo apt-get install build-essential subversion git bison bc flex gettext texinfo zlib1g-dev uuid-dev ncurses-dev unzip libpci-dev libssl-dev rsync build-dep partclone

## Download the relevant FOG source {#download_the_relevant_fog_source}

`svn checkout `[`https://svn.code.sf.net/p/freeghost/code/trunk/src`](https://svn.code.sf.net/p/freeghost/code/trunk/src)` fogsrc`

## Download Buildroot {#download_buildroot}

`wget `[`http://buildroot.uclibc.org/downloads/buildroot-2014.11.tar.bz2`](http://buildroot.uclibc.org/downloads/buildroot-2014.11.tar.bz2)\
`tar xjf buildroot-2014.11.tar.bz2`

## Copy source files inside Buildroot\'s tree {#copy_source_files_inside_buildroots_tree}

`cp -r fogsrc/buildroot/* buildroot-2014.11/`\
`cd buildroot-2014.11`\
`mv fog.buildroot.config.32 .config # or config.64 for 64 bits`

## build FOG file system {#build_fog_file_system}

`# A chance to see what's inside the buildroot, and change options in a graphical UI :`\
`make menuconfig`\
`# This will download all the required packages from their sources, it's around 300 MB`\
`make source`\
`# All packages are now in buildroot-2014.11/dl/ So we compile.`\
`# Go get some coffee, this takes a long time, depending on your config.`\
`make`\
`# Here is our init.xz`\
`cp output/images/rootfs.ext2.xz ../init.xz`\
`cd ..`

`copy init.xz to your FOG server /var/www/fog/service/ipxe/init_32.xz (or init.xz for 64 bits)`
