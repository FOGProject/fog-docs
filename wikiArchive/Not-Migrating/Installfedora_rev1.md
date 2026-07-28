## Overview

This tutorial will show how to install FOG on Fedora 8.

Before you begin, you will need at least two computers, one that will
act as the FOG server and a second, which will at as our client. Please
understand that will tutorial will have you destroy all data on the hard
disks of both computers.

## Installing Fedora 8 {#installing_fedora_8}

The first thing to do is download and burn an ISO image of Fedora 8 from
<http://fedoraproject.org/>.

Next boot off the CD / DVD you just created to start the Fedora
installation process.

You should see a screen similar to the pictured below, select: Install
or Upgrade an existing System and press enter.

<figure>
<img src="1.jpg" title="1.jpg" />
<figcaption>1.jpg</figcaption>
</figure>

You will then be prompted if you would like to test the installation
media, choose: Skip and press enter.

<figure>
<img src="2.jpg" title="2.jpg" />
<figcaption>2.jpg</figcaption>
</figure>

Now the graphical portion of the installation will begin. At the welcome
screen, press: Next.

Next you will be prompted for the installation language, choose you
appropiate language and press: Next.

You will now be asked about disk partitioning. Select Remove all
partition on the selected drives and create default layout, then click:
Next.

<figure>
<img src="5.jpg" title="5.jpg" />
<figcaption>5.jpg</figcaption>
</figure>

You will now be asked about network addressing, select the network
device you would like to use by putting an check in the box next to the
device name then, click on the edit button. Assign the network device a
IPv4 address with subnet mask and disable IPv6 support, then click OK.
Enter a DNS server and gateway address along with a hostname, then
click: Next.

<figure>
<img src="6.jpg" title="6.jpg" />
<figcaption>6.jpg</figcaption>
</figure>

Next you will be prompted about you timezone information, select your
timezone and click: Next.

The next screen will prompt you to create a root password, enter a
password in the textbox and confirm, then press: Next.

The next screen will prompt you to select the software groups you would
like to install, uncheck Office and Productivity and then click: Next.

<figure>
<img src="9.jpg" title="9.jpg" />
<figcaption>9.jpg</figcaption>
</figure>

Then on the next screen click Next to start the installation. This step
will take some time, so please be patient. When installation is
complete, remove all disks from the CD/DVD drive and click reboot to
restart the computer.

## Selecting First Boot Settings {#selecting_first_boot_settings}

The first time Fedora boots it will load a setup wizard, which allows
you select how you would like Fedora to operate.

At the first boot welcome screen, click: Forward.

<figure>
<img src="11.jpg" title="11.jpg" />
<figcaption>11.jpg</figcaption>
</figure>

The next screen will ask you to accept the license agreement, do so and
click: Forward.

The next screen is about the firewall, change the firewall to: Disabled
and click: Forward.

<figure>
<img src="12.jpg" title="12.jpg" />
<figcaption>12.jpg</figcaption>
</figure>

The next screen will ask you about SELinux, set SELinux Setting
to:Disabled and click: Forward.

<figure>
<img src="13.jpg" title="13.jpg" />
<figcaption>13.jpg</figcaption>
</figure>

The next screen will prompt you for the date and time settings, click:
Forward.

The next screen will ask if you would like to send your hardware profile
to Fedora select an option and click: Forward.

You will now be prompted to create a user, you may skip this step and
just use the root user we created during installation by clicking:
Forward.

The first boot wizard is now complete and you will be prompted to
restart your computer.

## Setting up FOG {#setting_up_fog}

You system is now ready to login to and install the FOG Suite.

Log into Fedora using the root username and password you created during
installation.

Now we must download the FOG package from sourceforge. To do this click
on Applications -\> Internet -\> Firefox Web Browser and enter the URL
<http://www.sf.net/projects/freeghost>. Then click on the Download link.
Then click on the latest release to start the download and save the
package to the /opt directory. It should be named something like
fog_x.xx.fc.tar.gz

Open a terminal (Applications -\> System Tools -\> Terminal) and type:

cd /opt\
tar -xvzf fog\*\
cd fog\*\
cd bin\
./installfog.sh\

The installer will ask you for the IP address of the server, then press
enter and the installer does the rest.

<figure>
<img src="17.jpg" title="17.jpg" />
<figcaption>17.jpg</figcaption>
</figure>

After the installation has completed open Firefox again and enter the
URL: <http://%5Byouripaddress%5D/fog/management>. You will then be
prompted to install the database schema.

<figure>
<img src="18.jpg" title="18.jpg" />
<figcaption>18.jpg</figcaption>
</figure>

When the schema is up to date, attempt to go to the URL:
<http://%5Byouripaddress%5D/fog/management> again. This time you should
be prompted to login, enter the username: fog and password: password.

<figure>
<img src="20.jpg" title="20.jpg" />
<figcaption>20.jpg</figcaption>
</figure>

## Testing your installation {#testing_your_installation}

After login, click on the Hosts button (single computer monitor).

Then click on the Add New Host button. Enter at least a MAC address
(seperated by :) and a hostname and click the Add button.

Now click on the Tasks button (the star).

Then click on List All Hosts and find the host you just created and
click on the Advanced button.

Now under Advanced Actions click on Memtest86+ and confirm that you
would like to start the task.

Now click on Active Tasks and you should see the task that you just
created listed.

Lastly, start the client computer that you created a task for and ensure
that in BIOS, PXE boot has the highest boot priority. If everything
worked correctly, you should see memtest86+ load.

Note: If setting a static IP does not seem to work on your Fedora 8/9
install, it might have to do with the known problem with the
NetworkManager service. To remedy this, see the solution given [on the
Sourceforge.net help forums for
FOG](http://sourceforge.net/forum/message.php?msg_id=7473903) and [How
to for OS X users](http://www.mac-how.net/)
