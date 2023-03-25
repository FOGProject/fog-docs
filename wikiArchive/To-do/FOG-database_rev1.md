You may access the data base on FOG locally by using:

    mysql -u root fog

Or you may allow remote access by issuing this command locally (after
connecting using the above command):

    GRANT ALL ON fog.* TO 'UsernameHere'@'%' IDENTIFIED BY 'PasswordHere';
