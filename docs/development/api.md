.. include:: /includes.rst

---
API
---

In here you'll find some practical api examples.
But first lets explain how to get autheticated

Basics
======

To be able to use the API via external calls it needs to be enabled in the FOG web UI (FOG Configuration -> FOG Settings -> API System) first.

Authentication
--------------

Tokens
######

#. API global token is a header required with the name ``fog-api-token``
You can find yours via FOG-Configuration->FOG Settings->API System
#. API user token is a header that can be used (*highly recommended*) being passed as a header in the form ``fog-user-token``
You can find yours via Users->List All Users->Your Username->API Settings

HTTP Basic Auth
###############

You can use HTTP Basic Authorization (with ``curl -u <user>:<password>`` or header with name ``Authorization: Basic <base64encoded username:password>``. 
Although I have allowed the ability for this type of authentication, and it will work, I would still recommend using user token system as it cannot be received and decoded to a valid username/password pair to manage your fog server.

Example
-------

While many different tools can be used to make API calls ``curl`` is just one of the very basic ones if you are on Linux and want to give it a try:

::

    curl -H 'fog-api-token: yourapitoken' -H 'fog-user-token: yourusertoken' -X GET http://fogserver/fog/system/info



Routes and Methods
==================
To keep the iformation in the documentation as universial as possible, we will only show the url for the api calls
GET
---
Here are some core GET calls:
#. ``/fog/system/info`` Simple check to see if the API is enabled and working. Returns 200 if accessible.
#. ``/fog/task/active`` Returns a list of pending and active tasks
#. ``/fog/multicastsession/current`` Returns a list of active multicast sessions
#. ``/fog/host`` Returns a list of all the registerd hosts
#. ``fog/host/search/*`` Returns images or hosts that match the search term (replace wildcard with search term)

POST
----

Creating a image:
#################

You can use the following api call for creating a image:
``/fog/image/create``
You need to pass the following parameters:
#. name -  The name of the image
#. path - The path to the image
#. imageTypeID - The way image is stored

List of all the image types:
^^^^^^^^^^^^^^^^^^^^^^^^^^^^
#. Single Disk - Resizable
#. Multipul Partition Image - Single Disk (Not Resizable)
#. Multipul Partition Image - All Disks (Not Resizable)
#. Raw Image (Sector By Sector, DD Slow)


Creating a Capture task:
~~~~~~~~~~~~~~~~~~~~~~~~
Put the ID of the host in the url of the api call
``/fog/host/id/task``

Task types:
^^^^^^^^^^^
#. Deploy
#. Capture
#. Debug
#. Memtest
#. Test Disk
#. Disk Surface Test
#. Recover
#. Hardware inventory
#. Password Reset
#. All Snapins
#. Single Snapins
#. Wake-up
#. Deploy - Debug
#. Capture - Debug
#. Deploy - No Snapin
#. Fast Wipe
#. Normal Wipe
#. Full Wipe
#. Virus Scan
#. Virus Scan - Quarantine

Example body for deploying a image:
    ``{"taskType": "1"}``

NOTE:
You need to assign the image to the host before you can deploy it.
You can assing the host with a PUT request



If the api call is correct you'll get the following response:
``""```

PUT
---

Edit a host:
``/fog/host/id/edit``
Example body:
``{"imageID": "1"}``
