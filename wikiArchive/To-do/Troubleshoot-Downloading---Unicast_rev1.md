Article under construction. Below, you will find notes / jibberish that
I\'m collecting to make into an article.

# Common Problems {#common_problems}

## Task is completed, computer will now restart {#task_is_completed_computer_will_now_restart}

The task completes but did not image, did not actually complete the
task, did not really deploy the image. You receive the below (pictured)
error when deploying an image.

<figure>
<img src="Image_Too_Big_For_Destination_Drive.jpg"
title="Image_Too_Big_For_Destination_Drive.jpg" />
<figcaption>Image_Too_Big_For_Destination_Drive.jpg</figcaption>
</figure>

### Image is too large for destination drive {#image_is_too_large_for_destination_drive}

This is *normally* caused by a non-resizable image that has been
deployed to a host with a hard drive that is too small to hold the
image.

In order to deploy a non-resizable image, the destination HDD **must**
be the same size or larger than the HDD the image was taken from. If the
source HDD was 80GB and destination HDD is 80GB but the HDDs are
different brands, it is possible that the image deployment can fail.
This is because the destination HDD **MUST** be at least as large as the
source. Even 4 sectors less, or even 16KB smaller and the image
deployment **will** fail.

Generally, to fix this you would use the resizeable image type.

### Destination drive is blank {#destination_drive_is_blank}

Another time you might recieve this error is if you\'re trying to deploy
to an HDD that is **absolutely blank** - with no pre-existing
partitions. In such case, you might try the fix in this thread: [svn
image doesnt
push](https://forums.fogproject.org/topic/6117/svn-image-doesnt-push).
The user in this thread followed this:
[Modifying_the_Init](https://wiki.fogproject.org/wiki/index.php/Modifying_the_Init_Image)
and added this code:

Just before the image check types:

    # Generates the partitions.  If singledisk resizeable, it generates
    # based on default normal values.
    # Otherwise it uses MBR/GPT to generate the partition table(s).

Add this code:

    #fix for possible dodgy partitions on the disk
    testdisk="";
    testdisk=`fogpartinfo --list-devices 2>/dev/null`;
    #this will either give us something or nothing
    if [ -z "$testdisk" ]; then
      echo;
      read -r -p "Partition error. Do you want to murder the partition table for $hd? [y/N] " response
      if [[ $response =~ ^([yY][eE][sS]|[yY])$ ]]
      then
        #murder the partition table - this shouldnt need a restart
        dd if=/dev/zero of=$hd bs=512 count=1 conv=notrunc;
        #label the emptiness - should be enough to get the system to continue
        parted $hd --script -- mklabel msdos;
      fi
    else
     echo "checked $testdisk for partitions (no need to kill partition table yet)";
    fi
