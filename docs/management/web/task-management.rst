.. include:: ../includes.rst

---------------
Task Management
---------------

.. === Tasks ===

.. ==== Overview ====

.. *Tasks are all the actions that you can take on a computer, and in FOG there a numerous tasks that can be done including:

.. *Deploy (Unicast)
.. *Capture (Unicast) 
.. *Deploy - Multicast 
.. *Debug
.. *Memory Test
.. *Test Disk
.. *Disk Surface Test
.. *Recover (File Recovery)
.. *Hardware Inventory
.. *Password Reset
.. *Deploy All Snapins
.. *Deploy Single Snapin
.. *Wake-Up
.. *Deploy - Debug (Unicast)
.. *Capture - Debug (Unicast)
.. *Deploy - Without Snapins (Unicast)
.. *Fast Wipe
.. *Normal Wipe
.. *Full Wipe
.. *Virus Scan
.. *Virus Scan - Quarantine
.. *Donate
.. *Torrent-Cast


.. In the tasks section of FOG you can perform tasks on single hosts or groups of hosts.  This section also allows you to monitor selective tasks, and stop/cancel tasks.

.. ==== General Tasks ====

.. The general/common Tasks in FOG include unicast image capture, and unicast image send, as well as a multicast image send.  In FOG, sending an image to the server is considered an image capture, and deploying an image to the client is called a send.  Both of these tasks can be started directly from the search, list all hosts, and list all groups pages.  

.. To perform a simple image capture, click on the upward facing arrow next to the host. Captures are only possible on a host, not a group. Capturing an image will also overwrite any image file that may already exist for that host without any notification or confirmation.

.. Please note that capturing images of Windows Vista and Windows 7 requires special command to be run on the clients prior to image capture.  Please see [[What do I have to do to an image before capturing?]] for more details.

.. For a video demonstration of an image capture, please see: http://www.youtube.com/watch?v=jPPZr0abVfg&fmt=18

.. To perform a simple image send, click on the downward facing arrow next to the host.  An image send can be done on a host or a group.  When sending an image to multiple computers FOG works in queue mode, which means that it will only send to 10 (by default) computers at one time.  This is done to keep the server from being overworked.  As soon as the a machine finishes, another from the queue joins.

.. To perform a multicast image send you must search for a group of hosts on the "Task Management" page.  Multicast tasks can only be performed on a group of hosts.  Multicast tasks will send to all the computers in the group at once, and the task will not start sending until all members of the group have connected with the server.    After starting a multicast task, status can be view by clicking on [ctl]+[alt]+f2.  A log is also kept for multicast transfers which is stored at /opt/fog/log.

.. ==== Advanced Tasks ====

.. The advanced Tasks in FOG include everything that is not a simple capture, simple deploy or mutlicast deploy.  

.. =====Debug=====

.. Debug mode boots the linux image to a bash prompt and allows the user to issue all commands by hand. 

.. =====Capture - Unicast (Debug)=====

.. Does the same thing that debug mode does, with the exception that the environment is setup to capture the image.  To start the imaging process just type:

..  fog

.. =====Send - Unicast (Debug)=====

.. Does the same thing that debug mode does, with the exception that the environment is setup to send the image.  To start the imaging process just type:

..  fog

.. =====Send - Unicast (Without Snapins)=====

.. This task does a normal send task with the exception that if any snapins are associated with the host, they are not deployed to the host.  

.. =====Deploy All Snapins=====

.. This task will send all the snapins associated with a host to the host without imaging it.

.. =====Deploy Single Snapin=====

.. This task will send a single snapin that is associated with the host to the host without imaging it. (Note: The snapin must be associated with the host already)

.. =====Memory Test=====

.. Boots to Memtest86, a memory testing tool.  This a task will not exit with out user intervention at the client side.  The task must also be manually stopped via the management front end.

.. =====Wake Up=====

.. Wakes up host or group of hosts using Wake-on-Lan.  

.. =====Fast Wipe=====

.. This task does a quick and dirty wipe of the drive.  This task writes zeros to the first ~40MB of the disk.  This task should NOT be used if you don't want your data to be recoverable.  

.. =====Normal Wipe=====

.. This tasks writes random data to the entire surface area of the disk.  

.. =====Full Wipe=====

.. This tasks writes random data, multiple times to the entire surface of the disk. 

.. =====Disk Surface Test=====

.. This task will look for bad blocks on the hard disk and report them back to the client console.  

.. =====File Recovery=====

.. This task will load an application that can be used to recover lost files from the hard disk.  

.. =====Virus Scan=====

.. This task will update and load ClamAV and scan the partition for viruses.  It will either scan and report or scan and quarantine files, it will also report back to the management portal with the results of the scan.

.. =====Hardware Inventory=====

.. [http://freeghost.sourceforge.net/videotutorials/InventoryUpdate.swf.html Video Tutorial]

.. The hardware inventory task will execute the same task as the fog.reginput client side task.  Since the host is already registered, all it will do is update the computers inventory and restart.  It is visioned that this task could be run on a regular interval on a group of all computers in your network, or some sub group of computers in your network.  Then on the next reboot of those computers an inventory would be performed.

.. ==== Scheduling ==== 

.. As of version 0.27 of FOG, select tasks can be scheduled using a static date/time combination or using a cron style repetitive task scheduling.  Task scheduling can be performed on either single hosts, or on groups of computers.  One thing to note about task scheduling that isn't intuitive is that it '''requires an image to be associated with the host, even for non-image based tasks!'''  The reason for this is because tasks are only run on the master storage node associated with that host, and the only way to tie a storage node to a host is via an image.  We did this to prevent multiple storage nodes to try running the same task for a specific host.  

.. ===== Single Execution Scheduling =====

.. Single task execution will run a task at a single date and time, then the task will be discarded.  To scheduled a single execution task, you would go to the tasks section of fog, then select the host or group you would like to schedule the task, then select the task you would like to schedule.  You will then be presented with the screen show below.

.. [[Image:Sched.png]]

.. To schedule a single execution task, click on white text box below "Schedule Single Task Execution?" and a pop up calendar will load and allow you to select your date and time for the task.  Click on the date to close the calendar, then start you task.  

.. ===== Cron Style Task Scheduling =====

.. Cron style task execution allows you to do complex repetitive task scheduling.  After a cron task executes, it is not removed, as single executions tasks are.  Cron style tasks, as the name suggests are similar to the Linux cron task scheduler format.  Cron style tasks are created as single execution tasks are, except when presented with scheduling options, select the option "Schedule Cron Style Task Execution".  Below that check box are a series of text boxes including:

..  min    -> Minute [00-59]
..  hour   -> Hour [00-23]
..  dom    -> Day of Month [01-31]
..  month  -> Month [01-12]
..  dow    -> Day of Week [01-07] (Sunday ==> 0, Saturday ==> 6)

.. To give an example of how this works, if you wanted a capture task to run at '''10:00pm everyday''' you would enter the following:

..  0 22 * * *

.. This basically says run the task a '''0''' minutes into the hour, on the '''22nd hour (10:00pm)''', on '''every day of the month''', on '''every month of the year''', on '''every day of the week'''.

.. To take this example further, lets say you only wanted to capture the image '''every other day''', we could do this by adding:

..  0 22 */2 * *

.. The '''*/2''' now tells the scheduler to only run on '''even days of the month'''.  

.. We could even ask the scheduler to only do a backup on '''even weekdays''' by adding:

..  0 22 */2 * 1-5

.. The 1-5 we just added says only run on days 1 through 5, which relate to Monday - Friday.

.. Now we will ask the scheduler to only backup in the month of February.

..  0 22 */2 2 1-5

.. Another basic example could be if you wanted to run an inventory update on the first of every month you could use:

..  30 1 1 * *

.. This task would then run at '''1:30''' on the '''1st of every month'''.


.. The FOG scheduler doesn't support 100% of the operations that cron supports, below are the operations that are supported:

..  4       -       Listing a static number
..  4,5,6,7 -       Listing a group of numbers
..  4-7     -       ranges of numbers 
..  4-7,10  -       ranges and lists
..  */5     -       * divided by a number
..  *       -       Wildcard

.. For more information on cron please see http://en.wikipedia.org/wiki/Cron