## Ubuntu Desktop 11.10 {#ubuntu_desktop_11.10}

### Ubuntu update {#ubuntu_update}

`sudo apt-get update`\
`sudo apt-get upgrade`

### install all essential package {#install_all_essential_package}

`sudo apt-get install build-essential subversion libqt4-dev bison flex gettext texinfo zlib1g-dev uuid-dev`

### Download the FOG source {#download_the_fog_source}

`cd ~/Desktop`\
`mkdir svn `\
`cd svn `\
`svn checkout `[`https://freeghost.svn.sourceforge.net/svnroot/freeghost/trunk`](https://freeghost.svn.sourceforge.net/svnroot/freeghost/trunk)` `

### Download Kernel {#download_kernel}

`cd ..`\
`wget `[`http://www.kernel.org/pub/linux/kernel/v3.0/linux-3.1.5.tar.bz2`](http://www.kernel.org/pub/linux/kernel/v3.0/linux-3.1.5.tar.bz2)\
`tar -xjvf linux-3.1.5.tar.bz2`

### Copy config to Kernel {#copy_config_to_kernel}

`cp -rf svn/trunk/kernel/core.config linux-3.1.5/.config`\
`cd linux-3.1.5`

### build FOG Core Kernel {#build_fog_core_kernel}

`make xconfig`\
`make`\
\
`Copy arch/x86/boot/bzImage to your FOG Server /tftpboot/fog/kernel/bzImage`
