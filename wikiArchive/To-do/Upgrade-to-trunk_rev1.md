Related Article: [Getting_FOG](Getting_FOG "wikilink")

`<noinclude>`{=html}= Methods =`</noinclude>`{=html}

-   To get the very latest version of FOG you need to follow the below
    instructions.

```{=html}
<!-- -->
```
-   Remember these are mostly betas so there are bound to be bugs, but
    with bugs also comes fixes of the issues found in the \"Stable
    Release\"
-   If you have nodes they will also need to be upgraded! (Excluding
    Beta [ Windows Nodes](Windows_Storage_Node "wikilink"))

# Git

-   Update and then Install git (or \'yum\' instead of \'apt-get\' if
    you are running a RedHat based OS)

```{=html}
<!-- -->
```
    sudo apt-get update && apt-get install git

-   Initial checkout and installation

```{=html}
<!-- -->
```
    sudo -i
    git clone https://github.com/FOGProject/fogproject.git /root/fogproject
    cd /root/fogproject
    git checkout dev-branch
    cd bin
    ./installfog.sh

## Update to latest {#update_to_latest}

As the development tree of FOG changes quiet often (pretty much daily!)
you might want to update to the very latest version from time to time.
To do this use the following commands:

    cd /root/fogproject
    git checkout dev-branch
    git pull
    cd bin
    ./installfog.sh

## Check your git version {#check_your_git_version}

    cd /root/fogproject
    git log -1<noinclude>

# Congratulations

-   Congrats! You have now upgraded to the \"bleeding edge\" of FOG
    deployment. It is your responsibility to keep upgraded until the
    next \"Stable Release\". Until then you will see in the *cloud* of
    your *Web Gui* **rXXXX**. This indicates the revision you are now
    on.
-   You can check for updates to the revisions under
    ![](1.3.0_fog_configuration.png "1.3.0_fog_configuration.png") **Fog
    Configuration**. This will state the version you are on and what the
    lastest revision is.

# Additional information on SVN and git & FOG Trunk {#additional_information_on_svn_and_git_fog_trunk}

FOG developmental versions are called \"revisions.\" Revisions are
normally stable for the PRIMARY functions of FOG: **IMAGE \> NAME \>
JOIN TO DOMAIN using UNICAST and MULTICAST**

Other features in FOG revisions (not directly related to the imaging
process) **are sometimes broken**. The developers are pretty good about
fixing issues when someone finds and reports it. These other features
usually do not impact imaging. Additionally, if you encounter an issue,
let us know about it in the [forums](https://forums.fogproject.org/) and
someone is likely to help and/or fix it quickly, making a new
\"revision\" that you can download and install very quickly using the
above methods.

However, with the current revisions, you\'ll benefit from a **plethora
of bug fixes**, a much **wider range of supported host hardware**, and
**new features**!

Updating FOG from one revision to a newer one usually takes less than a
minute or two. Fog uses your settings from previous installations so you
don\'t have to answer questions about the installation or set additional
configurations. **FOG supports upgrading, but not downgrading**. If you
would like to roll-back to a previous version, generally, this can only
be done by reverting to a previous snap-shot taken from a virtualized
machine that FOG is installed on.

It\'s advised to backup your database and export your hosts (and label
the files) prior to upgrading. You can do that like this on 1.2.0 and
higher:

-   FOG Configuration -\> Configuration Save -\> Export
-   Host Management -\> Export Hosts -\> Export

You may install FOG Trunk on a server that does not have FOG installed
already.

# Check what version you\'re running {#check_what_version_youre_running}

On your FOG\'s web GUI login page, you can quickly check what revision
you\'re running:

<figure>
<img src="FOG_Revision_in_cloud.png"
title="FOG_Revision_in_cloud.png" />
<figcaption>FOG_Revision_in_cloud.png</figcaption>
</figure>

# Video Tutorials {#video_tutorials}

`</noinclude>`{=html} `<includeonly>`{=html}==== Video Tutorials
====`</includeonly>`{=html}

`<font color="red">`{=html}Note:`</font>`{=html} Video plays in Chrome
or Firefox with html5 plugin

External video link: [FOG upgrade to trunk - Git
method](https://youtu.be/4XtY70nCg_A)

`<embedvideo service="youtube">`{=html}<https://youtu.be/4XtY70nCg_A>`</embedvideo>`{=html}

External video link: [FOG upgrade existing Git
repo](https://youtu.be/nlYWhjkjPR8)

`<embedvideo service="youtube">`{=html}<https://youtu.be/nlYWhjkjPR8>`</embedvideo>`{=html}
