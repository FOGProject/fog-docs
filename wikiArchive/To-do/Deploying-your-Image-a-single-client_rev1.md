Below is a brief overview of how to send an image to a single client

## Set client to PXE boot in BIOS {#set_client_to_pxe_boot_in_bios}

First of all make sure you are connected to the network in which your
FOG server resides. Then boot up the client computer, and go into BIOS,
this step may be a little different for every computer. In most cases
this involves pressing either **F2**, **F10**, or **DEL**. Then you may
need to enable PXE/Network booting if the option exists.

<figure>
<img src="Bios.png" title="Bios.png" />
<figcaption>Bios.png</figcaption>
</figure>

After that you want to change your boot order, so the first boot device
is PXE boot. After making those changes, save your changes and restart
the client.

Start the client up again and you should see a menu that looks like the
image below:

<figure>
<img src="Bootmenu.png" title="Bootmenu.png" />
<figcaption>Bootmenu.png</figcaption>
</figure>

This is the FOG boot menu.

## Register the Client with the FOG Server {#register_the_client_with_the_fog_server}

Now that the client is pxe booting, we can register it with the FOG
server. To do so, select \"Perform Full Host Registration and
Inventory.\" During this process you will be asked to answer a few
questions like the client\'s hostname etc. After filling out all
questions, the client will go through a quick hardware inventory and
restart, at which point the client will be registered with the FOG
server.

## Associate the Image and OS with the new client {#associate_the_image_and_os_with_the_new_client}

1.  Login to the web UI.
2.  Click on the **Image Management Section** (picture icon).
3.  Click on **List All Images** and locate the image object you wish to
    associate with the client. For more information on how to create an
    image object see [Booting into FOG and Uploading your first
    Image](Booting_into_FOG_and_Uploading_your_first_Image "wikilink").
4.  Click the **Edit** button next to the image.
5.  Select the appropriate operating system from the drop-down menu, if
    you have not done so already.
6.  Click **Update**
7.  Click on **Host** from the left hand column.
8.  From the menu in the center, select the client you are working with
    and click **Add Image to Host(s)**

<figure>
<img src="AddHostsImage.png" title="AddHostsImage.png" />
<figcaption>AddHostsImage.png</figcaption>
</figure>

## Start the Task {#start_the_task}

1.  Navigate to the Host Management area by clicking on **Host
    Management** from the top of the screen (the icon looks like a
    computer monitor) and then **List All Hosts** from the left hand
    menu.
2.  Find the entry for the client you are working with and click on its
    name to view the host object
3.  Click on **Basic Tasks** from the left hand menu
4.  Select **Deploy**
5.  Select **Create Deploy Task for Host**
6.  Reboot the machine client PC.
