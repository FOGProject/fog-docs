In order to create a translation you need:

-   a translation tool, e.g. POedit (http://www.poedit.net/)
-   the file messages.pot (/var/www/fog/management/languages)
-   create the necessary folders for your translation in
    var/www/fog/management/languages, e.g. de_DE.UTF8/LC_MESSAGES

Procedure:

-   Load the .pot file into POedit. It will create a .mo file
-   Translate.
-   Save As: messages.po
-   Copy the .mo and .po files into your translation folder
    (LC_MESSAGES)
