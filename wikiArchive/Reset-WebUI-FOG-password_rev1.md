This is an older article. See the new one here: [Password
Central](Password_Central "wikilink")

## Overview

If somehow you lose access to the FOG server web interface, you can use
the following procedure to connect to the MySQL database and reset the
password for any existing FOG user. These user accounts and passwords
are only for logging into the FOG server web interface and should not be
confused with other fog users in the operating system.

## Reset password {#reset_password}

On the FOG server where the MySQL \"fog\" database is installed, execute
the commands:

-   If the root user in MySQL does *not* have a password (or it\'s
    stored in `~/.my.cnf`):

```{=html}
<!-- -->
```
    sudo mysql -u root fog

-   If the root user in MySQL does *have* a password:

```{=html}
<!-- -->
```
    sudo mysql -u root -p fog

-   Run this query to reset the password. You can change users other
    than \"fog\" by changing the uName value in the query.

```{=html}
<!-- -->
```
    UPDATE users SET uPass = MD5('password') WHERE uName = 'fog';
    exit;

Login to the WebUI with:

-   Username: fog
-   Password: password (or whatever you used in the query above inside
    the MD5 call)
