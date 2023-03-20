Hopefully this bug will be fixed before anyone else experiences it, but
just in case I\'m creating this page so it may come up in searches.\
\
When installing FOG server the option to notify the developers is
presented:

      Would you like to notify the FOG group about this installation?
        * This information is only used to help the FOG group determine
          if FOG is being used.  This information helps to let us know
          if we should keep improving this product.

      Send notification? (Y/N)y
      * Thank you, sending notification.....

Since the developers coded this feature in, we might assume they
appreciate knowing how many people are using FOG. In one person\'s
experience, this step freezes more often than not. If you choose Yes and
it takes longer than a few seconds, it is likely frozen. If the script
never finishes, the completion message is never printed. Final
configurations may or may not have been completed.

### Solution

1.  Log into another terminal to the same server:\
    :Either open a second SSH connection, or press
    [CTRL-ALT-F1](http://linux.about.com/od/linux101/l/blnewbie5_1.htm)
    to open a new terminal on the local machine.\
    ::NOTE: Pressing CTRL-ALT-**F7** will take you back to the graphical
    screen. You might want to write that down.
2.  Use `ps` to list all processes that are currently using the `wget`
    command (this is how the notification is sent)
        $ ps -ef | grep wget
        root     21794 11185  0 20:16 pts/0    00:00:00 wget -q -O - http://freeghost.no-ip.org/notify/index.php?version=0.29
        myuser   22005 21962  0 21:01 pts/1    00:00:00 grep --color=auto wget
3.  Kill the hung thread: (substitute the process ID from your `ps`
    result)
        $ sudo kill 21794
4.  Return to the original terminal to see the installation process
    complete:
          Send notification? (Y/N)y
          * Thank you, sending notification...../lib/common/functions.sh: line 250: 21794 Terminated              wget -q -O - "http://freeghost.no-ip.org/notify/index.php?version=$version" > /dev/null 2>&1
        Done



          Setup complete!

          You still need to install/update your database schema.
          This can be done by opening a web browser and going to:

              http://192.168.1.1/fog/management

              Default User:
                     Username: fog
                     Password: password

        $
