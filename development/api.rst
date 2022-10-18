.. include:: /includes.rst

---
API
---

General description

Basics
======

To be able to use the API via external calls it needs to be enabled in the FOG web UI (FOG Configuration -> FOG Settings -> API System) first.

Authentication
--------------

Tokens
######

#. API global token is a header required with the name ``fog-api-token``
#. API user token is a header that can be used (*highly recommended*) being passed as a header in the form ``fog-user-token``
#. ...

HTTP Basic Auth
###############

You can use HTTP Basic Authorization (with ``curl -u <user>:<password>`` or header with name ``Authorization: Basic <base64encoded username:password>``. Although I have allowed the ability for this type of authentication, and it will work, I would still recommend using user token system as it cannot be received and decoded to a valid username/password pair to manage your fog server.

Example
-------

While many different tools can be used to make API calls ``curl`` is just one of the very basic ones if you are on Linux and want to give it a try:

::

    curl -H 'fog-api-token: abcde...' -H 'fog-user-token: fghij...' -X GET http://fogserver/fog/task/current

Routes and Methods
==================

GET
---

#. ``/fog/system/info`` Simple check to see if the API is enabled and working. Returns 200 if accessible.
#. ...

