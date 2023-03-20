## Translating FOG {#translating_fog}

### Overview

For internationalization support FOG relies on gettext. In this tutorial
we will show you how to do translations of FOG on Ubuntu using a tool
called poedit.

### Installing POEdit {#installing_poedit}

1.  Open a terminal windows via **Applications -\> Accessories -\>
    Terminal**
2.  Type: **sudo apt-get update; sudo apt-get install poedit**

### Getting the Translation Template {#getting_the_translation_template}

1.  Create a working directory with **mkdir -p
    \~/Desktop/fog-translation**
2.  Type: **cd \~/Desktop/fog-translation**
3.  Type: **wget
    <http://freeghost.svn.sourceforge.net/viewvc/freeghost/trunk/packages/web/management/languages/messages.pot>**

### Creating the translation PO file {#creating_the_translation_po_file}

The .pot file is the template file. Now we are going to create a
translation based on this file.

1.  Open POEdit (**Applications -\> Programming -\> Poedit**)
2.  If this is the first run, you will need to enter your name and an
    email address
3.  **File -\> New Catalog from pot file\...**
4.  open **\~/Desktop/fog-translation/messages.pot**
5.  In the Project Info tab, select a **Language** and **Country**, then
    select **OK**
6.  Then save you po file in the \~/Desktop/fog-translation/ directory
    as messages.po

After that you are ready to translate, on the English strings will
appear on the left hand size and the translation then goes on the right
hand side. When your translation is complete, click **Save** and send
the FOG Project team your messages.po and message.mo file so they can be
added to the project. You can send this information to us via the
patches section of SF at:

<http://sourceforge.net/tracker/?group_id=201099&atid=976201>

## Updating a PO File with an updated POT {#updating_a_po_file_with_an_updated_pot}

As FOG progresses, we will keep adding to strings to the POT file, so
every so often you will want to update your translation file. To do
this, follow these steps to get the latest template:

[#Getting_the_Translation_Template](#Getting_the_Translation_Template "wikilink")

1.  Open POEdit and open your po file.
2.  Then select **Catalog -\> Update from POT File**
3.  Select your new POT file.

## Advanced Translation Tools {#advanced_translation_tools}

PO Edit can actually look at other translated files and see if any
string are in common and if so, automatically add them to your
translation file.

To do this you need to have a catalog open in POEdit, then

1.  Go to **Edit -\> Preferences**
2.  Select the **Translation Memory** tab.
3.  Click the **Add** button, and select your translation language.
4.  Click **Generate database**
5.  When the wizard pops up, remove your home directory and click the
    **next** button (This may take a while, as it generates a database
    of all translations on your system).
6.  Click **Finish**
7.  In the configuration section set both **Max. \# of missing words:**
    and **Max. difference in sentence length:** to **0**. You will get
    less strings translated, but they will be more accurate.
8.  Click **OK** to exit the preferences window.
9.  select **Catalog** -\> **Automatically translate using TM**
