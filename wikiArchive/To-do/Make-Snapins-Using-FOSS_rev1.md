**Intro**\
Snapins are a feature of FOG, however I had a really hard time figuring
out how to create them using free open source programs.

For this HOWTO I will be using Ubuntu 9.04 to create a snapin of Firefox
3.0.10 for Windows. The programs that I am using all have a Windows
version so you can replicate what I am doing in Ubuntu in Windows if you
are more comfortable with that.\
\
**Tools**

-   The 7-zip program
-   A text editor
-   The 7-zip *extra* tar ball

\
\
**Begin**\
To install 7-zip in Ubuntu type:

    sudo apt-get install p7zip-full

Or trying to install it using the Add / Remove Programs GUI

Next we have to use 7-zip to pack the file. We use the -y switch for the
self-extracting program.

    7z a -y file.7z FirefoxSetup3.0.10.exe

Now we need to create a config file that allows installation after
inflating the file. Open your favorite text editor I am using default
text editor Gedit.

I create a new text document and put this into it:

    ;!@Install@!UTF-8!
    Title="Firefox Installation"
    ExecuteFile="FirefoxSetup3.0.10.exe"
    ;!@InstallEnd@!

Make sure that you save your file as UTF-8 encoded (default in gedit)
and that it has the name 7zip.conf

Now download the 7-zip extra file from [Source
Forge](http://prdownloads.sourceforge.net/sevenzip). You need the
7zS.sfx file out of that archive.

Now put everything together:

     cat 7zS.sfx 7zip.conf file.7z > firefoxinstall.exe

or if you want in windows

    copy /b file.7z + 7zip.conf + 7zS.sfx firefoxinstall.exe

You are now ready to test and deploy your snapin.\
\
**Conclusion**\
I purposely choose a really simple example. Firefox is deployed much
easier than this just upload the Firefox executable file to your fog
server and then pass the -ms switch to make a silent install. However
this gives a great overview on how to create snapins in a Linux
environment. For more complex installs I end up having to use a Windows
box and a great program called AutoIT the procedure is basically the
same. Use 7-zip to create a self extracting archive and have it run a
AutoIT script to finish the install. In my opinion this is much easier
than trying to use install right and yields better results. Your mileage
may vary.

Please also note you can use open source software such as [SFX
Maker](http://sourceforge.net/projects/sfxmaker/) to complete the above
process automatically.
