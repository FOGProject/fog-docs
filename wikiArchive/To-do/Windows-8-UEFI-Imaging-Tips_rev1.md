The below steps work with Windows 8, 8.1, and Windows 10.

# Steps for imaging Windows 8 with UEFI install. {#steps_for_imaging_windows_8_with_uefi_install.}

## Important

1.  Disable Secure Boot **NOT ALL BIOSes \"TRULY\" ALLOW THIS CURRENTLY.
    Motherboard ASUS H81M-A, from personal experience falsely tells you
    it\'s disabled, but it doesn\'t ever actually happen.**
2.  Enable the Legacy Boot Option (You may have an option in Advanced
    Boot Options to Enable Legacy ROMS. You want to check this, as well
    to allow the legacy PXE to appear)
3.  Restart and register the machine in Fog. **Registration can happen
    anytime before if you can do it.**\'
4.  Create the capture task in the Web GUI.
5.  Restart and capture your image.
6.  On the machines to be imaged, repeat steps 1-3.
7.  Create the download task in the Web GUI, if you aren\'t using
    Capone.
8.  Restart the machines and download the image.
9.  (optional) Re-enable Secure Boot. (You will probably have to disable
    legacy boot option and legacy ROMS in order to do this.)
10. Reboot

# Windows 8, 8.1, and 10 Imaging Problems {#windows_8_8.1_and_10_imaging_problems}

```{=mediawiki}
{{:Windows Dirty Bit}}
```
