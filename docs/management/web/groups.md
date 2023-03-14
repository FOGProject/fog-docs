# Group Management

## Groups

-   Groups in FOG are used to organize your hosts into real world
    logical clusters. This is intended to ease management of the
    computers. A single host can be a member of infinitely many groups,
    so if a computer happens to be a member of the group called "Third
    Floor", it could also be a member of "Math Department", or "Dell
    PCs." Groups make using FOG possible for organizations with a very
    large number of PC's.

## Creating Groups

-   Groups are created in two sections:

1.  **Group Management** \-:octicons-arrow-right-24: **Create New Group**
2.  Hosts section of FOG based on searches, for information on how to
    create groups, please see [[hosts#Creating Host Groups]]

## Managing Groups

-   After a group has been created, it can be managed from the groups
    section of FOG. Locating groups is very similar to locating hosts,
    you can either list all groups or you can search for groups. When
    searching for groups your search criteria is matched against the
    group name or the group description. Once a group is located it can
    be modified by clicking on the "Edit" button on the right hand
    side of the table or the Title of the group itself.
-   Under the section "Modify Group \[Groupname\]" there are options
    to change the group name, group description, group product key, or
    to delete the group. If you wish to update the group name or the
    group description make your change then click on the "Update"
    button within that section. If you would like to remove the group
    then simply click on the "Delete" button within this section.
-   As a reminder, when saving or updating settings for hosts Fog uses
    the last to save option. If you set all the hosts in this group to
    have *Image A* and then change *Host A* in that group to be *Image
    B*. The group settings will not override the settings for *Host A*,
    unless you go back to the group and set all hosts back to *Image A*.

## Group Basic Tasks

-   This section will allow you to start a task on this group of hosts.
    From this section you can start any task to all hosts within the
    group. Multi-Cast is also available from here. Please review
    \[\[FOGUserGuide#Fundamental_Concepts \| Fundamental Concepts\]\] to
    determine the required deploy task.

## Group Membership Setup

-   This page allows you to view/add/delete membership of the group.
    This section will list all of the members of the group and give you
    the option to remove members from the group.

## Group Image Associations

-   The groups page also allows you to update the image association for
    all the members of the group. This can be done in the "Image
    Association for \[groupname\]" section. Select the image
    association from the drop-down box and select "Update Images" and
    then all your host objects for that group will be modified.

## Group Snapins

-   You can add or remove snapins to all hosts in a group, but because
    the nature of groups, it is not possible to see what snapins are
    currently associated with a group. This is because the snapins are
    not directly associated with the group, the are associated with the
    host and it is possible for all members of the groups to have
    different snapins linked with each host. What fog does allow you to
    do is batch add a snapin to all the hosts within a group. At the
    same time you can batch remove a snapin from all the hosts within a
    group. This functions can be done via the '''Add Snapins'''
    and '''Remove Snapins''' button in the Group Menu.

## Group Service Settings

-   The **Service Settings** page allows you to enable or disable
    certain service modules on all hosts in the group, as well as change
    some service settings for group such as screen resolution, and auto
    log off settings.

## Group Active Directory Setup

-   Active Directory integration settings can also be distributed to all
    members of a group via this page. The section "Modify AD
    information for \[groupname\]" allows you to do so. This section
    provides the same options as the host screen but allows you to mass
    update all of your hosts.

## Group Printers

-   The **Printers** page allows you to add or remove printer
    associations to all hosts within the group. This page also allows
    you to set the management level all hosts within the group.

## Group Membership Information

-   The most important thing to remember about groups in FOG is that
    they do not contain their own properties. When you make changes to a
    group, you are really make changes to every host object within the
    group. For example, if you change the OS association for a group,
    then go back to the one of the host objects that is a member of that
    group, it will have the new OS association on that object.
