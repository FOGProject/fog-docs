See also: [SnapinPacks](SnapinPacks "wikilink")

All below examples utilize the new FOG Client, version 0.9.11+ and FOG
1.3.0

# Chrome MSI deployment {#chrome_msi_deployment}

Google Chrome MSI:

[<https://www.google.com/work/chrome/browser/>](https://www.google.com/work/chrome/browser/)

Snapin name:

`<font color="red">`{=html}Google Chrome`</font>`{=html}

Snapin Storage Group:

`<font color="red">`{=html}Your storage group`</font>`{=html}

Snapin Run With:

`<font color="red">`{=html}msiexec`</font>`{=html}

Snapin Run With Argument:

`<font color="red">`{=html}/i`</font>`{=html}

Snapin File:

`<font color="red">`{=html}googlechromestandaloneenterprise.msi`</font>`{=html}

Snapin Arguments:

`<font color="red">`{=html}/quiet`</font>`{=html}

Video Example (plays in Chrome or Firefox with html5 plugin):

`<embedvideo service="youtube">`{=html}<https://youtu.be/SmM2V1KARB0>`</embedvideo>`{=html}

# 7zip MSI example {#zip_msi_example}

7-zip MSI:

[<http://www.7-zip.org/download.html>](http://www.7-zip.org/download.html)

Snapin Name:

`<font color="red">`{=html}7-zip-x64`</font>`{=html}

Snapin Storage Group:

`<font color="red">`{=html}Your storage group`</font>`{=html}

Snapin Run With:

`<font color="red">`{=html}msiexec.exe`</font>`{=html}

Snapin Run With Argument:

`<font color="red">`{=html}/i`</font>`{=html}

Snapin File:

`<font color="red">`{=html}7z1514-x64.msi`</font>`{=html}

Snapin Arguments:

`<font color="red">`{=html}/quiet`</font>`{=html}

Video Example (plays in Chrome or Firefox with html5 plugin):

`<embedvideo service="youtube">`{=html}<https://youtu.be/7WnZjccar5c>`</embedvideo>`{=html}

# EXE example deployment {#exe_example_deployment}

You can run EXEs with FOG snapins. The arguments would be whatever
arguments the EXE itself accepts - this is different for every EXE.

For example an exe called
`<font color="red">`{=html}writeAnimals.exe`</font>`{=html} might accept
arguments such as `<font color="red">`{=html}-mammals`</font>`{=html} or
`<font color="red">`{=html}-continent`</font>`{=html} and might also
accept `<font color="red">`{=html}-habitat`</font>`{=html} or
`<font color="red">`{=html}-outputFile`</font>`{=html}

If we create a snapin for this EXE using these arguments, it would look
something like this:

Snapin Name:

`<font color="red">`{=html}Run the writeAnimals
executable`</font>`{=html}

Snapin Storage Group:

`<font color="red">`{=html}Your storage group`</font>`{=html}

Snapin Run With:

Leave Blank

Snapin Run With Argument:

Leave Blank

Snapin File:

`<font color="red">`{=html}writeAnimals.exe`</font>`{=html}

Snapin Arguments:

`<font color="red">`{=html}-mammals -continent \'asia\' -habitat
\'rainforest\' -outputFile C:\\mammal_list.txt`</font>`{=html}

<figure>
<img src="EXE_snapin_example.png" title="EXE_snapin_example.png" />
<figcaption>EXE_snapin_example.png</figcaption>
</figure>
