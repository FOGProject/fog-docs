Try to manually start MySQL server.

MySQL server will refuse to start if it cannot resolve its hostname.
Verify that your DNS or /etc/hosts file will properly resolve your FOG
server.

Fedora 21 and older uses mysql and mysql-server while Fedora 22 and
newer uses mariadb and mariadb-server. CentOS7 and newer will also use
mariadb and mariadb-server while older uses mysql and mysql-server.
