This article describes how to create a basic password protected Samba
share on Linux, accessible by only one user. This share can be accessed
via Windows, OSX, or Linux.

We\'ll be making a share called
`<font color="red">`{=html}fogshare`</font>`{=html}. It will be
accessible via UNC paths in windows as
`<font color="red">`{=html}\\\\x.x.x.x\\fogshare`</font>`{=html} where
x.x.x.x is the server\'s IP address. The share will reside on disk at
`<font color="red">`{=html}/images/fogshare`</font>`{=html} The user
defined with permissions and access is called
`<font color="red">`{=html}smalluser`</font>`{=html}

I\'ve chosen to place the share in the /images directory because in an
optimal fog partition layout, this directory typically has it\'s own
partition and thus ample space. You may place the share wherever you
like, simply by choosing another place to create the directory. Be sure
to set permissions on the alternate directory and change the
`<font color="red">`{=html}path`</font>`{=html} setting in the Samba
configuration file.

On CentOS 7, Fedora, RHEL, Ubuntu, and probably Debian, the process is
almost identical.

# Install Samba {#install_samba}

For CentOS 7 and older, RHEL 7 and older, and Fedora 21 and older,
install Samba:

    yum install samba samba-client -y

For Fedora 22 and newer, and probably CentOS 8 and RHEL 8 and newer,
install Samba:

    dnf install samba samba-client -y

For Ubuntu and Debian, install Samba:

    apt-get install samba samba-client -y

# Start Samba {#start_samba}

Start Samba on Fedora/CentOS/RHEL:

    systemctl start smb

Start Samba on Ubuntu/Debian:

    service smb start

# Make the directory {#make_the_directory}

Make the directory you want to share:

    mkdir /images/fogshare

# Create user and set password {#create_user_and_set_password}

Make a user specifically for it:

    useradd smalluser

Set the user\'s password:

    passwd smalluser

Add the user to Samba and set a password for the user, this should match
the previous password:

    smbpasswd -a smalluser

# Set permissions {#set_permissions}

Set permissions on the local directory:

    chown smalluser:smalluser /images/fogshare
    chmod 770 /images/fogshare

# Configure Samba {#configure_samba}

Setup the samba configuration script:

    vi /etc/samba/smb.conf

Instructions on using Vi: [vi](vi "wikilink")

Below is the Samba configuration file. Things above \[fogshare\] are
global and apply to all shares. Then below each bracket name, is
settings specific to the share with the text inside the bracket being
the share name itself. Feel free to copy/paste.

    security = user
    passdb backend = tdbsam
    unix charset = utf-8
    dos charset = cp932

    [fogshare]
    path = /images/fogshare
    read only = no
    create mode = 0777
    directory mode = 0777
    writable = yes
    valid users = smalluser

# Restart Samba {#restart_samba}

Then restart Samba in Fedora/CentOS/RHEL:

    systemctl restart smb

Restart Samba on Ubuntu/Debian:

    service smb restart

# Access from Windows {#access_from_windows}

Open File Explorer. In the address bar, type
`<font color="red">`{=html}\\\\x.x.x.x\\fogshare`</font>`{=html} You
will be prompted for a user and pass, give the smalluser as username,
and the password you setup. You should now have read/write to this
share.

# Access from Linux {#access_from_linux}

## Mount SMB share on the fly - **not** permanently {#mount_smb_share_on_the_fly___not_permanently}

This is a fast and easy way to get work done that you don\'t do very
often, and is perfectly acceptable as long as it\'s done manually and
not scripted.

To mount:

    mkdir /tempMount
    mount -t cifs //x.x.x.x/fogshare /tempMount -o username=smalluser -o password=YourPasswordGoesHere,noexec

To work with the share, just go into /tempMount and do your thing.

    cd /tempMount

To unmount:

    umount /tempMount

## Mount SMB share permanently {#mount_smb_share_permanently}

### Fewer steps, less secure {#fewer_steps_less_secure}

This method isn\'t as secure, because the password is contained in the
fstab entry.

    mkdir /tempMount
    vi /etc/fstab

Instructions on using Vi: [vi](vi "wikilink")

Add this line to the bottom of /etc/fstab:

    //x.x.x.x/fogshare /tempMount cifs username=smalluser,password=YourPasswordGoesHere,iocharset=utf8,sec=ntlm 0 0

Then, mount:

    sudo mount -a

### More steps, more secure {#more_steps_more_secure}

This method is more secure, because we separate out the credentials from
the fstab entry.

Create the mount directory:

    mkdir /tempMount

Create a credentials file, readable by only the person who should be
managing it (root).

    vi ~/.smbcredentials

Instructions on using Vi: [vi](vi "wikilink")

Place these fields into the file.

    username=foguser
    password=YourPasswordGoesHere

Save and quit.

Set strict permissions on the file.

    chmod 600 ~/.smbcredentials

Modify /etc/fstab file:

    vi /etc/fstab

Instructions on using Vi: [vi](vi "wikilink")

Note: If you did the above steps, you can delete the above line from
those steps now.

    //x.x.x.x/fogshare /tempMount cifs credentials=/home/username/.smbcredentials,iocharset=utf8,sec=ntlm 0 0

Save and close.

Mount the share:

    sudo mount -a
