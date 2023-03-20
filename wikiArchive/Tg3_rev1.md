This is the error I see when trying to boot a server with a Broadcom tg3
NIC:

    [ 6.637970] tg3 0000:02:02.0: PME# disabled

Very similar to the post
[here](http://lkml.indiana.edu/hypermail/linux/kernel/0903.3/00195.html)
on the LKML

Also I cannot even \'ifconfig eth0 up\' - I get \"Device or resource
busy.\" The NIC won\'t even come up at all booted into FOG debug mode)

Rolling back to kernel 2.6.28\'s bzImage (see
[here](http://sourceforge.net/projects/freeghost/files/Kernels/Kernel-2.6.28.7.PS/download))
got this working for me. -[Ericgearhart](User:Ericgearhart "wikilink")
22:48, 26 July 2009 (MST)
