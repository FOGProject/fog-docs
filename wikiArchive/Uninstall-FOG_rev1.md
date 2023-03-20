## Rerun the Installer {#rerun_the_installer}

If you simply want to run the `foginstaller.sh` to update your FOG
server settings, rename the hidden `.fogsettings` file located under
`/opt/fog/`:

    sudo mv /opt/fog/.fogsettings /opt/fog/fogsettings-firstInstall

## Remove FOG Completely {#remove_fog_completely}

If you want to remove all services, blank the database, delete all
files/folders associated with FOG and remove the `fog` user account:

    #Uninstall FOG

    #remove service
    sudo rm /etc/init.d/FOGImageReplicator
    sudo rm /etc/init.d/FOGMulticastManager
    sudo rm /etc/init.d/FOGScheduler

    #delete fog database
    sudo mysql
    #(or 'sudo mysql -p' if you set a root password for mysql)
    drop database fog;
    quit

    #Remove files
    sudo rm -rf /var/www/fog
    sudo rm -rf /var/www/html/fog 
    sudo rm -rf /opt/fog
    sudo rm -rf /tftpboot
    sudo rm -rf /images #Warning, this line deletes any existing images.

    #delete fog system user
    sudo userdel fog
