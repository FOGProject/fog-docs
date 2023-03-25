[dmidecode](http://www.google.com/search?q=dmidecode) is the program
that makes [Capone](Capone "wikilink") work.

dmidecode gives a complete set of DMI information (hardware specs, make,
model, manufacturer etc)

Do visit the [dmidecode homepage](http://www.nongnu.org/dmidecode/).

The article [dmidecode - what\'s it good
for?](http://www.linux.com/archive/articles/40412) gives a good idea of
what it does.

[Another article](http://www.linux.com/archive/articles/41088) on
dmidecode scripting.

If you have access to a Linux shell prompt you can type in the following
to get an idea of all the detailed DMI/BIOS/Hardware information that
dmidecode provides.

    user@computer:~$ su
    Enter password:********

    root@computer:~$ dmidecode
    # dmidecode 2.9
    SMBIOS 2.3 present.
    36 structures occupying 1146 bytes.
    Table at 0x000F0800.

    Handle 0x0000, DMI type 0, 20 bytes
    BIOS Information
        Vendor: Phoenix Technologies, LTD
    ...

    Handle 0x0023, DMI type 127, 4 bytes
    End Of Table

    root@computer:~$ _

with Ubuntu you would use

    user@computer:~$ sudo dmidecode
    Enter password:********

It may happen that the PATH variable does not include /sbin or /usr/sbin
or some such directory which has dmidecode in it. In such a case, typing
dmidecode will result in an error saying that the program is unknown.

To avoid this, first get the location of dmidecode

    user@computer:~$ whereis dmidecode 
    dmidecode: /usr/sbin/dmidecode /usr/share/man/man8/dmidecode.8.gz

Then include that path into the \$PATH variable like this:

    user@computer:~$ PATH=$PATH:/usr/sbin
    user@computer:~$ echo $PATH

The : (colon) is a path separator in Linux just like ; (semi-colon) is
on Windows.

Dmidecode has many \"output sections\" so to speak -

    user@computer:~$ dmidecode --help
    Usage: dmidecode [OPTIONS]
    Options are:
     -d, --dev-mem FILE     Read memory from device FILE (default: /dev/mem)
     -h, --help             Display this help text and exit
     -q, --quiet            Less verbose output
     -s, --string KEYWORD   Only display the value of the given DMI string
     -t, --type TYPE        Only display the entries of given type
     -u, --dump             Do not decode the entries
     -V, --version          Display the version and exit
    user@computer:~$ _

To get just one *type* of DMI info, you must specify the type code or
name:

    user@computer:~$ dmidecode --help --type
    dmidecode: option '--type' requires an argument
    Type number or keyword expected
    Valid type keywords are:
      bios
      system
      baseboard
      chassis
      processor
      memory
      cache
      connector
      slot
    user@computer:~$ _

On Ubuntu, using sudo to get BIOS info from dmidecode, you get something
like this:

    user@computer:~$ sudo dmidecode --type bios
    [sudo] password for user: 
    # dmidecode 2.9
    SMBIOS 2.3 present.

    Handle 0x0000, DMI type 0, 20 bytes
    BIOS Information
        Vendor: Phoenix Technologies, LTD
        Version:  V5.1 
        Release Date: 08/01/2007
        Address: 0xE0000
        Runtime Size: 128 kB
        ROM Size: 512 kB
        Characteristics:
            ISA is supported
            PCI is supported
            PNP is supported
            APM is supported
            BIOS is upgradeable
            BIOS shadowing is allowed
            ESCD support is available
            Boot from CD is supported
            Selectable boot is supported
            BIOS ROM is socketed
            EDD is supported
            5.25"/360 KB floppy services are supported (int 13h)
            5.25"/1.2 MB floppy services are supported (int 13h)
            3.5"/720 KB floppy services are supported (int 13h)
            3.5"/2.88 MB floppy services are supported (int 13h)
            Print screen service is supported (int 5h)
            8042 keyboard services are supported (int 9h)
            Serial services are supported (int 14h)
            Printer services are supported (int 17h)
            CGA/mono video services are supported (int 10h)
            ACPI is supported
            USB legacy is supported
            AGP is supported
            LS-120 boot is supported
            ATAPI Zip drive boot is supported
            BIOS boot specification is supported

    Handle 0x001B, DMI type 13, 22 bytes
    BIOS Language Information
        Installable Languages: 3
            n|US|iso8859-1
            n|US|iso8859-1
            r|CA|iso8859-1
        Currently Installed Language: n|US|iso8859-1

    user@computer:~$ _
