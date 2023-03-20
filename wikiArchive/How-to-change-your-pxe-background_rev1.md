It is very easy to customize your FOG server to match / reflect your
place of work or taste.

#### Software and config needed {#software_and_config_needed}

-   FTP Software -
    [1](http://filezilla-project.org/download.php?type=client) (I
    recommend that you use the .zip version of Filezilla so it is stand
    alone and portable)
-   TFTP password set / reset -
    <http://www.fogproject.org/wiki/index.php?title=Unable_to_connect_to_TFTP>

You should be able to connect to your servers IP address (a.k.a. the fog
server ip) and enter the default username + password. If you can not
connect please verify that you have the correct username + password set
on your fog server.

By default the correct user name and password are

Username - **fog**

Password - **password**

#### Steps for editing and modifying the PXE background {#steps_for_editing_and_modifying_the_pxe_background}

-   Connect to the ftp with your username and password and navigate to
    /tftpboot/fog directory

<figure>
<img src="10-10-2009_12-54-28_PM.png"
title="10-10-2009_12-54-28_PM.png" />
<figcaption>10-10-2009_12-54-28_PM.png</figcaption>
</figure>

-   Download the bg.png file to your desktop

<figure>
<img src="10-10-2009_9-38-45_AM.png"
title="10-10-2009_9-38-45_AM.png" />
<figcaption>10-10-2009_9-38-45_AM.png</figcaption>
</figure>

-   Modify the bg.png file the way you want

<figure>
<img src="10-10-2009_9-39-05_AM.png"
title="10-10-2009_9-39-05_AM.png" />
<figcaption>10-10-2009_9-39-05_AM.png</figcaption>
</figure>

In this example I\'m using mspaint to add TUX to the boot menu. However
you can add / remove / modify it how ever you want **as long as you stay
within the 640x480 paramaters**

<figure>
<img src="10-10-2009_9-42-35_AM.png"
title="10-10-2009_9-42-35_AM.png" />
<figcaption>10-10-2009_9-42-35_AM.png</figcaption>
</figure>

(please note that I am not trying to take credit away from Chuck
Syperski or Jian Zhang. I am just trying to show you that it is possible
to tweak the PXE boot menu so it can reflect your usage)

-   Upload the modified file to the same directory you downloaded it
    from */tftpboot/fog*

<figure>
<img src="10-10-2009_9-43-56_AM.png"
title="10-10-2009_9-43-56_AM.png" />
<figcaption>10-10-2009_9-43-56_AM.png</figcaption>
</figure>

-   PXE boot a computer and test it out! =)

Below are some examples!

<figure>
<img src="10-10-2009_9-46-07_AM.png"
title="10-10-2009_9-46-07_AM.png" />
<figcaption>10-10-2009_9-46-07_AM.png</figcaption>
</figure>

<figure>
<img src="10-10-2009_12-47-38_PM.png"
title="10-10-2009_12-47-38_PM.png" />
<figcaption>10-10-2009_12-47-38_PM.png</figcaption>
</figure>
