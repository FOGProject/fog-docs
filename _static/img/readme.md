# Images

Images are stored and organized by relatable sections at `/_static/img`
For every image you add you should add substitution label for it in the `_static/img/index.rst`

These should look like this referencing the full path

```:rst
.. Comment saying what image folder the file is in (keep things alphabetical)

.. |AllHosts| Image:: /_static/img/management/All_Hosts.png
```

The label name and the image path are case sensitive.
