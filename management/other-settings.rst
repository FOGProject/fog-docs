--------------
Other Settings
--------------

Boot Image Key Map
==================

It is possible to change the keymap or keyboard layout of the linux boot image.  In order to change the key map, go to:

 Other Settings -> FOG Settings -> General Settings -> FOG_KEYMAP

You can expand the possible values for keymaps below, if left blank it will default to **us**.

|expandStart|

.. code-block:: 

    azerty 
    be-latin1 
    fr-latin0 
    fr-latin1 
    fr-latin9 
    fr 
    fr-old 
    fr-pc 
    wangbe2 
    wangbe 
    ANSI-dvorak 
    dvorak-l 
    dvorak 
    dvorak-r 
    tr_f-latin5 
    trf 
    bg_bds-cp1251 
    bg_bds-utf8 
    bg-cp1251 
    bg-cp855 
    bg_pho-cp1251 
    bg_pho-utf8 
    br-abnt2 
    br-abnt 
    br-latin1-abnt2 
    br-latin1-us 
    by 
    cf 
    cz-cp1250 
    cz-lat2 
    cz-lat2-prog 
    cz 
    defkeymap 
    defkeymap_V1.0 
    dk-latin1 
    dk 
    emacs2 
    emacs 
    es-cp850 
    es 
    et 
    et-nodeadkeys 
    fi-latin1 
    fi-latin9 
    fi 
    fi-old 
    gr 
    gr-pc 
    hu101 
    hypermap.m4 
    il-heb 
    il 
    il-phonetic 
    is-latin1 
    is-latin1-us 
    it2 
    it-ibm 
    it 
    jp106 
    ko 
    la-latin1 
    lt.baltic 
    lt.l4 
    lt 
    mk0 
    mk-cp1251 
    mk 
    mk-utf 
    nl2 
    nl 
    no-latin1.doc 
    no-latin1 
    no 
    pc110 
    pl2 
    pl 
    pt-latin1 
    pt-latin9 
    pt 
    ro 
    ro_win 
    ru1 
    ru2 
    ru3 
    ru4 
    ru-cp1251 
    ru 
    ru-ms 
    ru_win 
    ru-yawerty 
    se-fi-ir209 
    se-fi-lat6 
    se-ir209 
    se-lat6 
    se-latin1 
    sk-prog-qwerty 
    sk-qwerty 
    sr-cy 
    sr-latin 
    sv-latin1 
    tralt 
    tr_q-latin5 
    trq 
    ua 
    ua-utf 
    ua-utf-ws 
    ua-ws 
    uk 
    us-acentos 
    us 
    croat 
    cz-us-qwertz 
    de_CH-latin1 
    de-latin1 
    de-latin1-nodeadkeys 
    de 
    fr_CH-latin1 
    fr_CH 
    hu 
    sg-latin1-lk450 
    sg-latin1 
    sg 
    sk-prog-qwertz 
    sk-qwertz 
    slovene

|expandEnd|
   

FOG Client Kernel
=================

Overview
--------
 
In FOG, there aren't really drivers you need to find and download for your clients to work, 
this is because we ship a Linux kernel that has the majority of hardware device built into it.
What this means is if you have a device that doesn't work with FOG you need to either
build a new kernel yourself or try a newer kernel that has been released via our kernel updater.


Kernel Types
------------

We currently build two "lines" of kernels, one called KS or KitchenSink.
This kernel tries to include drivers for as many devices as possible, sometimes as the cost of performance,
and this is the kernel that we ship with FOG by default.
The other "line" is the PS kernel or the Peter Sykes kernel, which is a based on a config submitted by a user.
This kernel line tries to be faster, but may not include as many drivers as the KS kernel.

Updating the Kernel
-------------------

It is possible to update your client kernel from within the UI of FOG.
To do this perform the following steps:

- Log into the FOG Management UI.
- Go to **Other Information**
- Select **Kernel Updates**
- Select the Kernel you would like to download, typically the newest kernels are on the top of the list.
- Click the download icon
- Select a file name for your kernel, to make it the default kernel leave the name as **bzImage**
    - If you set it to a different name, you can set a host to use it in the `Kernel`_ hosts field
- Click the **Next** Button
