## Hook System Overview {#hook_system_overview}

From SVN version 741 (yet to be released as an official version) FOG has
the ability to be \"hooked\" and extended using an Object Orientated
approach.

Events are called throughout FOG, allowing developers to hook into FOG
at certain code points without editing FOG\'s base code.

Right now the Event list gives you the ability modify Data and Styling
on all Management Search & List pages.

Keep in mind that this code is still experimental and may change at any
time.

## Critical Files {#critical_files}

    lib/fog/Hook.class.php
    lib/fog/HookManager.class.php
    lib/hooks/*.hook.php

## Hook Class Variables & Methods {#hook_class_variables_methods}

**Variables**

    class ExampleHook extends Hook
    {
        // Required
        var $name = 'string';
        var $description = 'string';
        var $author = 'string';


        // Optional with defaults
        var $active = true;
        var $logLevel = 0;
        var $logToFile = false;
        var $logToBrowser = true;
    }

**Inherited Methods**

Methods that are available within your Hook Class

    Function: void log( string $txt [, int $level = 1] )
    Example: $this->log('Debug alert !! Run for the hills !!');

    Function: bool isAJAXRequest()
    Example: if (!$this->isAJAXRequest()) print_r($debug);

## Enabling / Disabling Hooks {#enabling_disabling_hooks}

Hooks can be enabled and disabled by changing the variable \$active
inside of the class you wish to enable / disable;\
\
**To Enable**:

    var $active = true;

**To Disable**:

    var $active = false;

## How to Hook Events {#how_to_hook_events}

Hook Events are called in various parts of the FOG code. Hooking these
Events is very simple.

**Example for Event: HostData**

    $ExampleHook = new ExampleHook();
    $HookManager->register('HostData', array($ExampleHook, 'HostData'));  // This will call the function HostData( array $arguments ) in $ExampleHook

*A full list of Events can be found here:
<http://www.fogproject.org/wiki/index.php?title=Hook_System#Events>*

## Function Arguments {#function_arguments}

When an Event Hook is fired, various arguments are passed to the
function specified. These arguments may vary.

**Returned argument indexes**

\'event\' : Always returned. Returns the name of the event fired to get
here

\'data\' : Contains data variables used to replace %name% strings in
\'templates\'

\'templates\' : Each index will become a new column. Using %name%
variables will be converted to the matching key index in \'data\'

\'attributes\' : Array of attributes to apply to each column wrapper.
i.e. class, width, height, style

**Example**

Here is an example showing the data passed from the HostData Event

*Code*

    function run($arguments)
    {
        $this->log(print_r($arguments, 1));
    }

*Output*

    Array
    (
        [event] => 'HostData'
        [data] => Array
        (
            [0] => Array
            (
                [id] => '968'
                [hostname] => '12583-M780'
                [mac] => '00:23:18:ef:b4:8d'
            )
            [1] => Array
            (
                [id] => '966'
                [hostname] => '12700-M780'
                [mac] => '00:23:18:72:50:8d'
            ) 
            [2] => Array
            (
                [id] => '1011'
                [hostname] => '12703-M780'
                [mac] => '00:23:18:97:a8:8d'
            )
            [3] => Array
            (
                [id] => '1251'
                [hostname] => '12705-M780'
                [mac] => '00:23:18:60:26:96'
            )
        )
        [templates] => Array
        (
            [0] => '<input type="checkbox" name="HID%id%" checked="checked" />'
            [1] => '<span class="icon ping"></span>'
            [2] => '<a href="?node=host&sub=edit&id=%id%" title="Edit">%hostname%</a>'
            [3] => '%mac%'
            [4] => '%ip%'
            [5] => '<a href="?node=host&sub=edit&id=%id%"><span class="icon icon-edit" title="Edit: %hostname%"></span></a>'
        )
        [attributes] => Array
        (
            [0] => Array ( )
            [1] => Array ( )
            [2] => Array ( )
            [3] => Array ( )
            [4] => Array ( )
            [5] => Array ( ['class'] => 'c' )
        )
    )

## Hook Template {#hook_template}

This is the most basic hook template\
Your hook MUST extend the FOG Hook Class \'Hook\' otherwise HookManager
will fail to Hook the Event\
\
Location: **lib/hooks/Template.hook.php**\

    <?php
    /****************************************************
     * FOG Hook: Template
     *  Author:     Blackout
     *  Created:    8:57 AM 31/08/2011
     *  Revision:   $Revision: 743 $
     *  Last Update:    $LastChangedDate: 2011-09-04 11:50:55 +1000 (Sun, 04 Sep 2011) $
     ***/

    // Hook Template
    class HookTemplate extends Hook
    {
        var $name = 'Hook Name';
        var $description = 'Hook Description';
        var $author = 'Hook Author';
        
        var $active = false;
        
        function HostData($arguments)
        {
            $this->log(print_r($arguments, 1));
        }
    }

    // Init class
    $HookTemplate = new HookTemplate();

    // Hook Event
    $HookManager->register('HostData', array($HookTemplate, 'HostData'));

## Events

Hook Events allow you to jump into the FOG code at a certain point. When
an event is fired, data and styling information related to that event
can be made available to the Hook Developer for modification.\
\
Adding hooking points can be a time consuming process as the HTML, Data
and Styling needs to be (re-)written in a particular way to allow
hooking.\
\
More events will be added. If you require a particular hooking point,
please contact Blackout with where the Hook needs to be made and any
code you have developed :)

    // Global
    CSS
    JavaScript
    MainMenuData                // data => array
    SubMenuData             // FOGSubMenu => FOGSubMenu Object
    MessageBox              // data => string

    // Host Management
    // List / Search
    HostTableHeader
    HostData
    HostAfterTable
    // Edit
    HostEditUpdate              // host => Host Object
    HostEditUpdateSuccess           // host => Host Object
    HostEditUpdateFail          // host => Host Object
    HostEditConfirmMACUpdate        // host => Host Object
    HostEditConfirmMACUpdateSuccess     // host => Host Object, mac = MACAddress Object
    HostEditConfirmMACUpdateFail        // host => Host Object, mac = MACAddress Object
    HostEditADUpdate
    HostEditADUpdateSuccess
    HostEditADUpdateFail
    HostEditAddSnapinUpdate
    HostEditAddSnapinUpdateSuccess
    HostEditAddSnapinUpdateFail
    HostEditRemoveSnapinUpdate
    HostEditRemoveSnapinUpdateSuccess
    HostEditRemoveSnapinUpdateFail

    // Group Management
    GroupTableHeader
    GroupData
    GroupAfterTable

    // Image Management
    ImageTableHeader
    ImageData
    ImageAfterTable

    // Storage Node Management
    // All Storage Nodes
    StorageGroupTableHeader
    StorageGroupData
    StorageGroupAfterTable
    // All Storage Groups
    StorageNodeTableHeader
    StorageNodeData
    StorageNodeAfterTable

    // Snapin Management
    SnapinTableHeader
    SnapinData
    SnapinAfterTable

    // Printer Management
    PrinterTableHeader
    PrinterData
    PrinterAfterTable

    // Task Management
    // Active Tasks
    TasksActiveTableHeader
    TasksActiveData
    TasksActiveAfterTable
    TasksActiveRemove
    TasksActiveRemoveSuccess
    TasksActiveRemoveFail
    TasksActiveForce
    TasksActiveForceSuccess
    TasksActiveForceFail
    // Search
    TaskData
    TasksSearchTableHeader
    // List Hosts
    TasksListHostTableHeader
    TasksListHostData
    TasksListHostAfterTable
    // List Group
    TasksListGroupTableHeader
    TasksListGroupData
    TasksListGroupAfterTable
    // Scheduled Tasks
    TasksScheduledTableHeader
    TasksScheduledData
    TasksScheduledAfterTable
    TasksScheduledRemove
    TasksScheduledRemoveSuccess
    TasksScheduledRemoveFail
    // Active Multicast Tasks
    TasksActiveMulticastTableHeader
    TasksActiveMulticastData
    TasksActiveMulticastAfterTable
    // Active Snapins
    TasksActiveSnapinsTableHeader
    TasksActiveSnapinsData
    TasksActiveSnapinsAfterTable
    TasksActiveSnapinsRemove            // id => snapinID, hostID => hostID
    TasksActiveSnapinsRemoveSuccess         // id => snapinID, hostID => hostID
    TasksActiveSnapinsRemoveFail            // id => snapinID, hostID => hostID

    // Login
    Login                       // username => string, password => string
    LoginSuccess                    // username => string, password => string, user => User Object
    LoginFail                   // username => string, password => string

    // Logout
    Logout

*Up to date as of SVN r759*

## Examples

**HostVNCLink**

Adds a \"VNC\" link to the Host Lists

Location: **lib/hooks/HostVNCLink.hook.php**

    <?php
    /****************************************************
     * FOG Hook: HostVNCLink
     *  Author:     Blackout
     *  Created:    9:26 AM 3/09/2011
     *  Revision:   $Revision: 743 $
     *  Last Update:    $LastChangedDate: 2011-09-04 11:50:55 +1000 (Sun, 04 Sep 2011) $
     ***/

    // HostVNCLink - custom hook class
    class HostVNCLink extends Hook
    {
        // Class variables
        var $name = 'HostVNCLink';
        var $description = 'Adds a "VNC" link to the Host Lists';
        var $author = 'Blackout';
        
        var $active = false;
        
        // Custom variable
        var $port = 5800;
        
        function HostData($arguments)
        {
            // Add column template into 'templates' array
            $arguments['templates'][] = sprintf('<a href="http://%s:%d" target="_blank">VNC</a>', '%hostname%', $this->port);
            // Add these HTML attributes to that column
            $arguments['attributes'][] = array('class' => 'c');
        }
        
        function HostTableHeader($arguments)
        {
            // Add new Header column with the content 'VNC'
            $arguments['templates'][] = 'VNC';
            // Add these HTML attributes to that column
            $arguments['attributes'][] = array('width' => '40', 'class' => 'c');
        }
    }

    // Init
    $HostVNCLink = new HostVNCLink();

    // Register hooks with HookManager on desired events
    $HookManager->register('HostData', array($HostVNCLink, 'HostData'));
    $HookManager->register('HostTableHeader', array($HostVNCLink, 'HostTableHeader'));

**RemoveIPAddressColumn**

Removes the \"IP Address\" column from Host Lists

Location: **lib/hooks/RemoveIPAddressColumn.hook.php**

    <?php
    /****************************************************
     * FOG Hook: Remove 'IP Address' column
     *  Author:     Blackout
     *  Created:    1:52 PM 3/09/2011
     *  Revision:   $Revision: 743 $
     *  Last Update:    $LastChangedDate: 2011-09-04 11:50:55 +1000 (Sun, 04 Sep 2011) $
     ***/

    // RemoveIPAddressColumn class
    class RemoveIPAddressColumn extends Hook
    {
        var $name = 'RemoveIPAddressColumn';
        var $description = 'Removes the "IP Address" column from Host Lists';
        var $author = 'Blackout';
        
        var $active = false;
        
        function HostTableHeader($arguments)
        {
            // Remove IP Address column by removing its column template
            unset($arguments['templates'][4]);
        }
        
        function HostData($arguments)
        {
            // Remove IP Address column by removing its column template
            unset($arguments['templates'][4]);
        }
    }

    // Init
    $RemoveIPAddressColumn = new RemoveIPAddressColumn();

    // Register hooks
    $HookManager->register('HostTableHeader', array($RemoveIPAddressColumn, 'HostTableHeader'));
    $HookManager->register('HostData', array($RemoveIPAddressColumn, 'HostData'));

**Example.ChangeTableHeader**

Remove & add table header columns

Location: **lib/hooks/Example.ChangeTableHeader.hook.php**

    <?php
    /****************************************************
     * FOG Hook: Example Change Table Header
     *  Author:     Blackout
     *  Created:    8:57 AM 31/08/2011
     *  Revision:   $Revision: 743 $
     *  Last Update:    $LastChangedDate: 2011-09-04 11:50:55 +1000 (Sun, 04 Sep 2011) $
     ***/

    // Example class
    class TestHookChangeTableHeader extends Hook
    {
        var $name = 'ChangeTableHeader';
        var $description = 'Remove & add table header columns';
        var $author = 'Blackout';
        
        var $active = false;
        
        function HostTableHeader($arguments)
        {
            // DEBUG output
            foreach ($arguments['templates'] AS $i => $data)
            {
                $this->log(sprintf('Table Rows: i: %s Data: %s', $i, print_r($data, 1)));
            }
            
            // Rename column 'Host Name' -> 'Chicken Sandwiches'
            $arguments['templates'][2] = 'Chicken Sandwiches';
            
            // Override column values & attributes
            $arguments['templates'][5] = 'Edit Me !!';
            $arguments['attributes'][5] = array('width' => '40', 'class' => 'c');
        }
    }

    // Example: Change Table Header and Data
    $HookManager->register('HostTableHeader', array(new TestHookChangeTableHeader(), 'HostTableHeader'));

**Example.ChangeData**

Appends \"Chicken-\" to all hostnames

Location: **lib/hooks/Example.ChangeData.hook.php**

    <?php
    /****************************************************
     * FOG Hook: Example Change Hostname
     *  Author:     Blackout
     *  Created:    8:57 AM 31/08/2011
     *  Revision:   $Revision: 743 $
     *  Last Update:    $LastChangedDate: 2011-09-04 11:50:55 +1000 (Sun, 04 Sep 2011) $
     ***/

    // Example class
    class TestHookChangeHostname extends Hook
    {
        var $name = 'ChangeHostname';
        var $description = 'Appends "Chicken-" to all hostnames ';
        var $author = 'Blackout';
        
        var $active = false;
        
        function HostData($arguments)
        {
            foreach ($arguments['data'] AS $i => $data)
            {
                // DEBUG
                //$this->log(sprintf('Renaming Host: i: %s Data: %s', $i, print_r($data, 1)));
                
                // Rename host
                $arguments['data'][$i]['hostname'] = 'Chicken-' . $data['hostname'];
            }
        }
    }

    // Example: Test by changing all hostnames in Host Management
    $HookManager->register('HostData', array(new TestHookChangeHostname(), 'HostData'));

**Example.SideMenuChange**

Example showing how to manipulate SubMenu Data. Adds Menu items under
\"Host Management\"

Location: **lib/hooks/Example.SideMenuChange.hook.php**

    <?php
    /****************************************************
     * FOG Hook: Example.SideMenuChange
     *  Author:     Blackout
     *  Created:    12:10 PM 4/09/2011
     *  Revision:   $Revision: 743 $
     *  Last Update:    $LastChangedDate: 2011-09-04 11:50:55 +1000 (Sun, 04 Sep 2011) $
     ***/

    // Hook Template
    class HookSubMenuData extends Hook
    {
        var $name = 'SubMenuData';
        var $description = 'Example showing how to manipulate SubMenu Data. Adds Menu items under "Host Management"';
        var $author = 'Blackout';
        
        var $active = false;
        
        function SubMenuData($arguments)
        {
            if ($GLOBALS['node'] == 'host')
            {
                // Add a new item under 'Host Management'
                $arguments['FOGSubMenu']->addItems('host', array(_('New Hook Item') => 'http://www.google.com', _('New Hook Item 2') => "newhookitem2"));
                
                if ($GLOBALS['id'])
                {
                    // Add a new item under 'Host Management' per Host
                    $arguments['FOGSubMenu']->addItems('host', array(_('New Hook Item') => "http://www.google.com", _('New Hook Item 2') => "newhookitem2"), 'id', $GLOBALS['hostname']);
                }
            }
        }
    }

    // Init class
    $HookSubMenuData = new HookSubMenuData();

    // Hook Event
    $HookManager->register('SubMenuData', array($HookSubMenuData, 'SubMenuData'));

## Debugging

Using the \'Hook Debugger\' hook, you can debug all hook events to
browser and/or log file

Location: **lib/hooks/HookDebugger.hook.php**

**You must enable this hook** *See:
<http://www.fogproject.org/wiki/index.php?title=Hook_System#Enabling_.2F_Disabling_Hooks>*

    <?php
    /****************************************************
     * FOG Hook: HookDebugger
     *  Author:     Blackout
     *  Created:    8:57 AM 31/08/2011
     *  Revision:   $Revision: 744 $
     *  Last Update:    $LastChangedDate: 2011-09-04 12:02:48 +1000 (Sun, 04 Sep 2011) $
     ***/

    // HookDebugger class
    class HookDebugger extends Hook
    {
        var $name = 'HookDebugger';
        var $description = 'Prints all Hook data to the web page and/or file when a hook is encountered';
        var $author = 'Blackout';
        
        var $active = false;
        
        var $logLevel = 9;
        var $logToFile = false;     // Logs to: lib/hooks/HookDebugger.log
        var $logToBrowser = true;
        
        function run($arguments)
        {
            $this->log(print_r($arguments, 1));
        }
    }

    // Debug all events
    $HookDebugger = new HookDebugger();
    foreach ($HookManager->events AS $event)
    {
        $HookManager->register($event, array($HookDebugger, 'run'));
    }

[Category:Development](Category:Development "wikilink")
