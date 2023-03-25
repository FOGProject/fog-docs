## Troubleshooting an image push to a client {#troubleshooting_an_image_push_to_a_client}

This process will **wipe out** whatever is currently present on the
client computer.\
This tutorial is for FOG .30 pushing Windows XP and assumes that your
primary disk is /dev/sda. **Note that this process has not been tested
on Windows 7.**

1.  In the management portal, start a debug task for the client computer
    in question. Allow the client to boot and at the bash prompt.

(Everything below is done within the bash prompt **on the client\'s
console**.)

```{=html}
<li>
```
From your client, mount the remote /images folder on your FOG server
onto a local /images folder using nfs:

-   `mkdir /images` (type this on the client\'s keyboard, as explained
    above)
-   `mount -o nolock x.x.x.x:/images /images` (where x.x.x.x is the
    server ip)\
    you may try also `mount -t nfs -o nolock x.x.x.x:/images /images`

```{=html}
<li>
```
Copy the master boot record to the first 512 bytes of the local disk.
Take a look into `/usr/local/fog/mbr/` to determine the correct MBR for
your system. This example uses XP:

-   `cd /images`
-   `dd if=/usr/share/fog/mbr/xp.mbr of=/dev/sda1 bs=512 count=1`

(For previous versions, find the `fog` directory under:/usr/local/)

```{=html}
</ul>
```
```{=html}
<li>
```
Start fdisk and remove all previous partitions:

-   `fdisk /dev/sda` (Note there is no `1` at the end of the device
    name)
-   Press \"d\", then \"Enter\" - select a partition if prompted and
    repeat pressing \"d\"
-   Press \"w\", then \"Enter\" to save and exit fdisk

```{=html}
<li>
```
Create a new partition:

-   fdisk /dev/sda
-   Press \"n\", then \"Enter\"
-   Press \"p\", then \"Enter\"
-   Press \"1\", then \"Enter\"
-   Press \"1\", then \"Enter\" or just \"Enter\" to accept the default
    starting sector

Note: Windows 7 users may want to create a 100M partition, then repeat
these steps to create the system partition and assign the rest of the
disk to the OS.

```{=html}
<li>
```
Press \"Enter\" to accept the default ending sector

```{=html}
</li>
```
```{=html}
<li>
```
Press \"t\", then \"Enter\" to change the partition type

```{=html}
</li>
```
```{=html}
<li>
```
Press \"7\", then \"Enter\" for NTFS

```{=html}
</li>
```
```{=html}
<li>
```
Press \"a\", then \"Enter\" to toggle the bootable flag

```{=html}
</li>
```
```{=html}
<li>
```
Press \"1\", then \"Enter\"

```{=html}
</li>
```
```{=html}
<li>
```
Press \"w\", then \"Enter\" to save and exit fdisk

```{=html}
</li>
```
```{=html}
</ul>
```
```{=html}
<li>
```
Update the partition info:

-   `partprobe`

```{=html}
<li>
```
Use partimage to copy image from FOG server to local partition:

-   `/usr/sbin/partimage restore /dev/sda1 /images/[imagename] `**`-f3 -b`**

```{=html}
<li>
```
Use ntfsresize to expand partition:

-   `/usr/sbin/ntfsresize /dev/sda1 `**`-f -b -P`**

(For previous versions, find sbin under: /usr/local/)

```{=html}
</ul>
```
```{=html}
</ol>
```
An alternate way to do partimage (which gives more feedback) is to load
the gui version of partimage with:\
`/usr/sbin/partimage`, then manually fill in the fields/choose options.

## Win 7 {#win_7}

This process will **wipe out** whatever is currently present on the
client computer.\
This tutorial was created using SVN 3501 pushing Windows 7 and assumes
that your primary disk is /dev/sda.

1.  In the management portal, start a debug task for the client computer
    in question. Allow the client to boot and at the bash prompt.

(Everything below is done within the bash prompt **on the client\'s
console**.)

```{=html}
<li>
```
From your client, mount the remote /images folder on your FOG server
onto a local /images folder using nfs:

-   `mkdir /images` (type this on the client\'s keyboard, as explained
    above)
-   `mount -o nolock x.x.x.x:/images /images` (where x.x.x.x is the
    server ip)\
    you may try also `mount -t nfs -o nolock x.x.x.x:/images /images`

```{=html}
<li>
```
Copy the master boot record to the first 512 bytes of the local disk.

-   `cd /images/$ImageFolder `**`$ImageFolder is the folder of the image you want to push`**
-   `dd if=d1.mbr of=/dev/sda bs=512 count=1`

```{=html}
<li>
```
Update the partition info:

-   `partprobe`

```{=html}
<li>
```
Use partclone to copy image from FOG server to local partition:

-   `cat d1p1.img | pigz -d -c | partclone.restore -O /dev/sda1 -N -f -i`

```{=html}
<!-- -->
```
-   `cat d1p2.img | pigz -d -c | partclone.restore -O /dev/sda2 -N -f -i`

```{=html}
<li>
```
Use ntfsresize to expand partition:

-   `ntfsresize /dev/sda1 `**`-f -b -P`**

```{=html}
<!-- -->
```
-   `ntfsresize /dev/sda2 `**`-f -b -P`**

```{=html}
</ol>
```
