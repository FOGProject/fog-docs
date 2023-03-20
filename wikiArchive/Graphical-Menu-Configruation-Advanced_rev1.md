## How to change the font size / color of the PXE boot menu {#how_to_change_the_font_size_color_of_the_pxe_boot_menu}

It\'s very easy to edit the graphical pxe menu of the FOG server. You
can change everything from the background color [Link
title](Link_title "wikilink") to the font color / size, and even add
additional pieces of software you can boot from.

### Modify your default file from your server {#modify_your_default_file_from_your_server}

You can also edit and modify the default menu file directly on your FOG
server. This file is located in the **/tftpboot/pxelinux.cfg** folder.\
::*Note that this file, along with your customized edits, will be
overwritten by FOG if the PXE boot menu is updated through the web
interface.*

Open the default file in your favorite text editor. You are going to
want to modify the file to adjust the menu color title and the default
font color. Please note that font color and menu color are controlled
similar to what you would see in HTML based coding.

       DEFAULT vesamenu.c32
       MENU TITLE FOG Computer Cloning Solution
       MENU BACKGROUND fog/bg.png
       MENU MASTER PASSWD $1$K8Vl0MRF$IeRczmyo1X3EH3Zf5aEcH0
       
       menu color title 1;36;44    #ffffffff #00000000 std

By default #ffffffff = white

By default #00000000 = black

If you feel inclined, you can also change what is displayed at the top
of the menu as well. Even though FOG is registered under GPL 3, I am
going to suggest that you include some credit for Chuck Syperski / etc.

Here is a list of other color elements you may wish to change

`screen          Rest of the screen`\
`border          Border area`\
`title           Title bar`\
`unsel           Unselected menu item`\
`hotkey          Unselected hotkey`\
`sel             Selection bar`\
`hotsel          Selected hotkey`\
`disabled    Disabled menu item`\
`scrollbar       Scroll bar`\
`tabmsg          Press [Tab] message`\
`cmdmark         Command line marker`\
`cmdline         Command line`\
`pwdborder       Password box border`\
`pwdheader       Password box header`\
`pwdentry        Password box contents`\
`timeout_msg     Timeout message`\
`timeout         Timeout counter`\
`help        Help text`\
`msgXX       Message (F-key) file attribute XX`

e.g

`menu color unsel 1;36;44    #fc0000 #00000000 std`

will change the color of your menu items to red

(These and more PXE menu settings can be found
[<http://syslinux.zytor.com/wiki/index.php/Comboot/menu.c32>](http://syslinux.zytor.com/wiki/index.php/Comboot/menu.c32)

### Sample Background Images {#sample_background_images}

-   White background with FOG logo in Black:
    [Media:Bg1.png](Media:Bg1.png "wikilink")
-   Transparent FOG logo in Black: [Bg2.png](Media:Bg2.png "wikilink")

[Category:Customization](Category:Customization "wikilink")
