When running into trouble (re-)installing the FOG Service running on
WinXP clients, I have figured out that it helps to remove the entire
service:

-   click start\|run and type: **services.msc** - stop the FOG service
-   open a terminal: click start\|run and type **cmd**
-   in the terminal: type **sc delete \"Fog Service\"**

The service should now be uninstalled. This means you can reattempt to
install the FOG Service.
