Normally, to get to the FOG web interface, you have to type

    x.x.x.x/fog/management

This works fine, but if FOG is the **only** thing your Linux box is
running, you can simplify this with a redirect so that simply typing the
x.x.x.x into a web browser takes you to the FOG login page.

On your FOG server, we will create a file called index.php using vi.

    vi /var/www/html/index.php

Instructions on using Vi: [vi](vi "wikilink")

In here, you\'d write (or copy/paste) this:

    <?php
    header('Location: http://x.x.x.x/fog/management/index.php');
    exit;
    ?>

Save this file.

Permissions on this file should be set as:

    chmod 744 /var/www/html/index.php
    #If CentOS, Fedora, or RHEL:
    chown root:apache /var/www/html/index.php
    #If Debian or Ubuntu:
    chown root:www-data /var/www/html/index.php

Now, when you go to x.x.x.x you\'ll be taken to the FOG login screen!
How cool is that?!?
