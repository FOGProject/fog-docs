# Prepare for Migration {#prepare_for_migration}

`<span style="background-color:Red;">`{=html}`<span style="color:White">`{=html}PAGE
IS OUTDATED PLEASE SEE [Upgrade_to_1.x.x](Upgrade_to_1.x.x "wikilink")
for an updated page!`</span>`{=html}`</span>`{=html}

export your host list from your old server to be imported into the new
one also, make note of the image ID numbers of the images you wish to
move to the new server

install your server of choice

[FOGUserGuide#Installing_FOG](FOGUserGuide#Installing_FOG "wikilink")

if you will not be using fog for your dhcp server (and it most likely
you won\'t be) make SURE to change your dhcp boot-filename (option 67)
to undionly.kpxe

after you have logged into the fog webgui and verified that everything
is working with the pxe boot menu system then proceed to create Image
profiles for the images you want to bring over from your old server

you will want to enable FOG_LEGACY_FLAG_IN_GUI in Fog
configuration-\>Fog Settings-\>General Settings of the webgui

# Copy over old files {#copy_over_old_files}

copy your old images to your new server\'s /images folder and make sure
the name of their files matches what is listed in the Image profiles for
those images and they are all set to \"partimage\" for Image Manager

all images made in prior versions of fog were made in partimage format,
new images made with fog as of 1.0+ are partclone

make note of the image ID number in the url for the image
\"\...edit&id=`<number>`{=html}\" in the url

The location for snapin files has not changed from fog 0.32 to 1.0, so
you may copy the snapin files to /opt/fog/snapins just like they were in
the old server

# Prepare Host list for Import {#prepare_host_list_for_import}

we will want to change the old image ID to the new Image ID (this is the
5th column of the exported host file)

if you kept track of the ID of the images from the old server, and their
corresponding ID on the new server, it\'s a simple matter of replacing
the old with the new

if you did not keep track of the image ID numbers, you will need to
associate hosts with corresponding images manually

on the Host Management page, click \"import Hosts\" i think you know
what to do here
