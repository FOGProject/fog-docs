At this time there is only one easy method to accomplish this and it is
SVN. Git provides a method to upgrade to a specific revision, but it\'s
not as user friendly.

## SVN

-   Install as seen in **[SVN](SVN "wikilink")**

```{=html}
<!-- -->
```
    svn co https://svn.code.sf.net/p/freeghost/code/trunk /some/local/folder

-   Then navigate to the folder you specified and run:

```{=html}
<!-- -->
```
    sudo /some/local/folder/bin/./installfog.sh

#### Update to Revision {#update_to_revision}

    cd  /some/local/folder/
    svn up -r <revision>
    cd bin
    ./installfog.sh

-   *NOTE:* You must run **svn up -r `<revision>`{=html}** in the
    \"/some/local/folder/\" and not in \"\.../fog/bin\" nor in
    \"\.../fog\"
-   `<span style="background-color:RED; color:yellow;">`{=html}WARNING:
    DO NOT DOWN GRADE! If you do, the mysql database will be messed up
    and a `<u>`{=html}possible`</u>`{=html} re-installation will be your
    only hope.`</span>`{=html}

------------------------------------------------------------------------
