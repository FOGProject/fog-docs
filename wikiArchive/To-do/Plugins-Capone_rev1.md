### Capone

-   `<span style="background-color:YELLOW; padding: 1px">`{=html}
    **Obsolete** `</span>`{=html} As of FOG v1.3.0-r2651 the fog user
    can now add Quick Image to the Fog iPXE Menu(For All Hosts) and then
    select the exact image desired without having to do any
    registration. BUT intervention is still required to start imaging.

#### FOG Version {#fog_version}

Applies to version 0.29 or higher.

#### Overview

Capone is a plugin for FOG that allows you to image a computer based on
DMI/Hardware information without having to register it with the FOG
server. This module was originally written for a HP computer warranty
service center in the UK. They wanted to be able to restore a
computer\'s image just by plugging it into the network and PXE booting
the machine, without any user intervention. This module is great for
repair shops and places where you don\'t need FOG to manage the computer
after it is imaged. This is our attempt at pushing FOG into the
service/repair sector.

##### Enabling Capone {#enabling_capone}

1.  You should now have a new icon in the menu bar for plugins near the
    right hand side that looks like a puzzle piece, click on it (you
    already [enabled Plugins](Plugins "wikilink"), right?)
2.  Click on **Activate Plugin**
3.  Select **Capone**
4.  Active **Capone**

You are now set to use the Capone plugin.

#### Using Capone {#using_capone}

We need to determine what DMI field we want to use for Capone. Currently
Capone only supports a single DMI field globally. To do this boot up a
client computer and from the PXE boot menu select the option **Client
System Information**. When prompted with a menu, select option **7** to
show DMI information. Press the enter key to scroll through the fields
and pick a field that can uniquely identify the computer type you are
working with. Common fields are:

-   bios-version
-   system-product-name
-   system-serial-number

Once you have determined the field you would like to use, perform the
following:

1.  In the plugins section, select **Installed Plugin**, then select
    **Capone**
2.  In the **Settings** section set your selected DMI field. This
    settings is global.
3.  Now we can create associations for return values from that DMI field
    and an Image. In **Add Image to DMI Associations** select an image
    you would like to link to a DMI field response.
4.  Select the operating system for the image
5.  Then enter the matching value for the DMI field in the text field.
    This string can be treated as a \'starts with\' query. So if you use
    the field **system-serial-number** and you have a group of computers
    that all start with **112233** then you can enter that into the text
    field and it would match a client with the system-serial-number of
    **1122334455**.

We now have our first association added to Capone. Now what we need to
do is to add the Capone menu item to the PXE boot menu.

1.  Scroll to the bottom of the capone plugin page and copy all the text
    in the **PXE Configuration** area.
2.  Now go to **Other Information**
3.  Select **PXE Boot Menu**
4.  Click **Advanced Configuration Options**
5.  Paste the text that you copied from the previous page.

Please note that this will not password protect this entry item. If you
would like to password protect this item you will need to use the
md5pass utility that is in the /opt/fog/utils directory.

It is possible to have multiple matching entries per DMI result. So for
example you could have to associations for response **112233**. In this
case, at the console on the client computer you will be prompted for
which image you would like to use.

Capone does not use additional storage nodes other then the master
within a storage group.
