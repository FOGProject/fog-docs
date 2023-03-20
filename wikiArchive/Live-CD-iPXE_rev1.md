# Thanks to Andy Abplanalp {#thanks_to_andy_abplanalp}

Maybe we can have live cd\'s without the need to extract and find
special parameters.

This example is specific to the Parted live cd, but maybe it\'ll apply
to other live cd\'s as well.

    :parted
    initrd ${boot-url}/iso/pmagic.iso
    chain memdisk ||
    echo failed to boot
    prompt
    goto MENU

Notice that the chain memdisk command is missing the iso and iso raw
statements.

Please give this a shot and let us know.

Thank you,
