## The \"Dirty Bit\" {#the_dirty_bit}

If you received this message (or a very similar one) from Partclone, it
means that the Windows \"Dirty Bit\" is turned ON:

    ntfsclone-ng.c: NTFS Volume '/dev/sda4' is scheduled for a check or it was shutdown uncleanly. Please boot Windows or fix it by fsck.

<figure>
<img src="Partclone_Windows_Dirty_Bit.jpg"
title="Partclone_Windows_Dirty_Bit.jpg" />
<figcaption>Partclone_Windows_Dirty_Bit.jpg</figcaption>
</figure>

The Windows \"dirty bit\" is set **ON** when:

-   There are pending Windows updates

```{=html}
<!-- -->
```
-   There is a pending restart

```{=html}
<!-- -->
```
-   Fast Startup is enabled

```{=html}
<!-- -->
```
-   Windows is hibernated

```{=html}
<!-- -->
```
-   Windows is improperly shutdown

```{=html}
<!-- -->
```
-   There is a chkdsk scheduled

```{=html}
<!-- -->
```
-   Data corruption is detected

There are a number of ways to clear the dirty bit, but the best and
easiest ways are to simply not have updates pending, disabling fast
startup, shutting down windows properly, not having chkdsk scheduled,
and having non-damaged HDDs and non-damaged partitions. **AFTER** making
the necessary changes to clear the \"dirty bit\", windows should be
restarted at least two times for it to clear properly.

## Windows \"Fast Startup\" {#windows_fast_startup}

Windows 8.0, 8.1, and 10 (and most likely future Windows versions) have
a feature called \"Fast Startup\". This feature basically sets windows
so that a hibernation occurs whenever the system is shutting down. This
enables Windows to startup much faster than in past Windows versions.
Because this feature is on by default, the windows OS partition has a
hibernation file which prevents mounting and imaging via FOG, and also
marks the OS partition\'s \"Dirty Bit\" to ON. Even when hibernation and
fast startup is disabled, the hibernation file remains and the \"Dirty
Bit\" remains **ON** and these things causes problems. There are a few
ways to fix/get around this.

### Way 1 (clean method) {#way_1_clean_method}

Disable: \"**Turn on fast startup**\", located here: Control Panel
(Classic View) -\> Power Options -\> Choose what the power button does
-\> Change Settings that are currently unavailable -\> \"Turn On Fast
Startup & Hibernate\"

Both of those settings should be turned off for use with FOG. They may
be turned on at a later time via GPO or snapins.

Shutdown and then boot the system.

Then run this command from an **elevated command prompt** to disable
hibernation and remove the hibernation file:

    powercfg.exe /H off

Now you can shut down and reboot once or twice, and then capture your
image via FOG.

### Way 2 (A little hackish) {#way_2_a_little_hackish}

When you\'re ready to capture an image, do not shut down the computer.
Instead, tell it to restart. The middle point of the restart is when the
OS stops, and control is handed over to the system\'s firmware. When
POST is happening, do your typical procedure to network boot and the
image should capture.

This is because without changing the settings (in way 1), a shutdown is
actually a hibernate. A restart is the only real way to take the system
down fully without changing settings. The reboot causes the system to
shutdown fully, thus clearing the \"dirty bit\".

### Way 3 (Very hackish, not clean) {#way_3_very_hackish_not_clean}

This method is just as viable but not as clean or easy and requires
timing.

You would open an elevated command prompt and then run:

    chkdsk /F

Answer yes to schedule the checkdisk at the next reboot.

Now you would reboot and allow the checkdisk to run. At some point
during the check disk (which may not be at 100%), check disk will tell
the sytem to reboot.

**At this moment, you need to boot to the network** and capture your
image to fog. If you miss this moment and windows boots, you will have
to re-run chkdsk.

## Resources used {#resources_used}

Major resources:

<http://www.eightforums.com/tutorials/6320-fast-startup-turn-off-windows-8-a.html>

<http://www.pclinuxos.com/forum/index.php?topic=126158.0>

<http://www.sevenforums.com/tutorials/819-hibernate-enable-disable.html>

Minor resources:

<http://www.techsupportalert.com/freeware-forum/system/12944-method-of-shutdown-in-windows-8-1-makes-difference.html>

<http://www.sevenforums.com/performance-maintenance/304428-windows-7-always-running-chkdsk-particular-partition.html>

<http://www.techrepublic.com/blog/tr-dojo/delete-hiberfilsys-by-disabling-windows-hibernate-function/>

## UEFI and BIOS coexistence / together {#uefi_and_bios_coexistence_together}

See this article:

[BIOS_and_UEFI_Co-Existence](BIOS_and_UEFI_Co-Existence "wikilink")
