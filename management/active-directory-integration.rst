.. include:: /includes.rst

----------------------------
Active Directory Integration
----------------------------

FOG has the ability to register a host with Active Directory, in a limited sense. 

Requirements
============

In order for Active Directory integration to function, you need the following:

* The image will need to have the FOG service installed.
* Before capturing your image, the computer is NOT a member of any domain
* In order to add a computer to a domain, FOG requires a username and password of an account that has rights to the OU where the computer objects are stored in the domain tree.  This user account should have rights to join computers to the Domain, as well as sufficient rights to create/manage computer objects.

.. note:: 

  FOG attempts to keep your password secure by encrypting it, but since FOG is open source, it is possible for someone to decrypt your password if you don't change the FOG "Passkey."  It is highly recommended that you change this Passkey before implementing the AD integration in a production environment.  Changing the Passkey requires you to recompile the FOG Service's Hostname change module, but don't panic this isn't hard and only need to be done one time.  Please see the documentation below.

Set up
======

To set up a host to use AD, do the following:

- Navigate to the hosts section of the FOG management portal and select the host you want to join AD
- In the top menu, select 'Active Directory' section.
  
You get the following options:

- **Join Domain after deploy**

  When this checkbox is set, FOG will apply the Active Directory global default to populate the fields of this section. 

- **Domain name**

  The fully qualified domain name. Examples are:

  - company
  - company.ad
  - company.com
  - company.local

- **Organizational Unit**

  The Organizational Unit, in LDAP format, where the computer object shall be created. Examples are:

  - OU=PCs,DC=company,DC=com
  - OU=Lab Computers,OU=PCs,DC=company,DC=com

  If you leave this fiels blank, the computer object will be created in the default OU for new PC's, normally 'Computers'.

- **Domain Username**

  The user name that will create the computer object. This user needs to have sufficient credentials to create the computer object in the OU. Usually this will be an account that is member of the 'Domain Administrators' group.

  Only enter the username in this field, for example: FOGServiceAccount. Do not add the domain name.

- **Domain Password**

  The password of the user name above. The password should be typed plain-text, and will auto-encrypt on it's own when saved.

- **Name Change/AD Join Forced Reboot?**

  Setting this check box will configure the client to enforce the hostname / AD setting regardless of if a user is logged in.

  So if enabled, the client will restart the computer to update the hostname even when a user is logged in. If unchecked, the client will wait until no one is using the computer before restarting to apply the hostname / AD.

- **Update**

  After changing fields of this section, click on 'Update'.

  The 'Hostname Changer', a module of the FOG client, checks with each poll if the client machine is part of Active Directory as configured. If not, it will do either of the following tasks:

  - If users are logged in and the 'Name Change/AD Join Forced Reboot' box is selected, then the client will join the domain and reboot immediately
  - If no users are logged, then the client will join the domain and reboot.
