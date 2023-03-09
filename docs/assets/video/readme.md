# Videos

Videos are hosted on our FogProject youtube channel. 
For every video in that channel we should add a substitution label in the video index.rst at `/_static/video/index.rst` 
The format of the label is like this

```:rst
.. |videoName-vid| raw:: html

    <div style="text-align: center; margin-bottom: 2em;">
    <iframe width="100%" height="350" src="https://www.youtube-nocookie.com/embed/VIDEOID?rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
    </div>
    
```

Make sure to use the embed video link with the privacy-enhanced mode enabled.

It is also good practice to add the -vid to the label name so that we keep images and videos differentiated
