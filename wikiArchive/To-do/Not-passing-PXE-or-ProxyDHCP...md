## Cisco WS-C2960S Not passing PXE, or ProxyDHCP {#cisco_ws_c2960s_not_passing_pxe_or_proxydhcp}

**[Original posting was done in the
forum:](http://fogproject.org/forum/threads/cisco-ws-c2960s-not-passing-pxe-or-proxydhcp.9916/)**
All information is credited to [Jaymes
Driver](http://fogproject.org/forum/members/jaymes-driver.3582/)

***NOTE: CHANGING SETTINGS ON YOUR `<U>`{=html}OWN`</U>`{=html}
EQUIPMENT IS NOT THE RESPONSIBILITY OF THE FOG DEVELOPMENT TEAM.***

------------------------------------------------------------------------

### Original Issue {#original_issue}

Hey all,

I\'m touching base here and hoping to find some information.

Normally I work HP Pro-Curve equipment, but one of my school buildings
had a new addition added to it and along with it, a whole new switch and
network was added to the building that was purchased by the installation
contract (So we got the equipment that the normally set up), installed
by the contractors, and managed by the contractors. Now that they are
gone, I have no one to help me to square away the new issues that are
arising.

I am looking for someone versed in these managed switches that can help
me to get the new addition talking to the rest of my network properly.
Currently DHCP, and Novell are working. Each machine is doled IP
addresses from my DHCP server as expected, the units can log in and talk
to my sever, tree, context all that good stuff. I can browse my NDS, but
my fog server is not passing the PXE boot information through the new
switches. I use the dchpmasq service to normally allow my units to boot
via pxe, and the rest of the building is still working as expected THANK
GOD, but the new addition is giving me fits!

I can unplug my new Cisco managed switch and replace it with a \"hub\"
of sorts and I can still see my pxe boot information as expected so I am
thinking that there is maybe an IP helper or something along the lines
that I need to update/add.

So anyone with expertise or suggestions, I am open :)

------------------------------------------------------------------------

### Solution

**I MANAGED TO ENABLE PXE BOOTING!!!**

Download Cisco Network Assistant -
<http://software.cisco.com/download/>\...twareid=280775097&release=5.8.9&rellifecycle=

**NOTE THE IGMP MAY NOT BE REQUIRED BUT I CHANGED BOTH OF THESE IN SYNC
WITH EACH OTHER, ENABLE AT YOUR OWN DIGRESSION!!!!**

Log into your managed switch with the administrative username and
password.

Click Configure on the left hand side. Choose Port Settings from the
list.

Select all ports to be used for PXE boot. Click Modify. Enable Port
Fast. Save. Close open windows.

With Configure still selected, choose IGMP Snooping. Click the
\"Multicast Router Ports\" tab.

Click Create, enter the number of the vlan you wish to apply changes to,
select all ports to enable multicast on (Select All click Add) click the
apply button, settings may take a few minutes to take affect.

**NOTE THE IGMP MAY NOT BE REQUIRED BUT I CHANGED BOTH OF THESE IN SYNC
WITH EACH OTHER, ENABLE AT YOUR OWN DIGRESSION!!!!**

## **GUIDE**

-   \'\'\'MOST IMPORTANTLY\... I AM NOT THE ORIGINAL AUTHOR OF THIS
    DOCUMENT, I HAVE ONLY ALTERED IT TO FIT MY NEEDS. UNFORTUNATELY I AM
    NOT SURE WHERE I ACQUIRED THIS DOCUMENT SO IF YOU FIND IT PLEASE LET
    ME KNOW SO I CAN GIVE PROPER CREDIT TO THIS GEM!

```{=html}
<!-- -->
```
-   I AM NOT A CISCO ENGINEER! I HAVE NO FORMAL CISCO TRAINING. I HAVE
    ONLY BEEN HANDED EQUIPMENT AND TOLD TO USE IT. THROUGH MY EXPLOITS I
    HAVE FOUND THIS METHOD WORKS FOR THE CISCO WS2960 SWITCHES IN MY
    ENVIRONMENT.

```{=html}
<!-- -->
```
-   SOME COMMANDS MAY NOT BE VALID, THIS IS AN OLD DOCUMENT. AFTER
    COMPLETION OF SET UP, I RECOMMEND USING THE CISCO CNA TO MANAGE AND
    BACK UP YOUR SWITCH SETTINGS.

GOOD LUCK\'\'\'

------------------------------------------------------------------------

Do not badger, or otherwise slander the information provided, I have
done so as a courtesy. **NO WHERE** have I claimed to be an expert on
these switches, and **NO WHERE** have I twisted your arm to use these
settings. I am not responsible for loss of motivation, equipment, job or
wife; The information may/will change over time, I understand this
document is not perfect. You are welcome to discuss settings or to let
others know how you completed your process, If you disagree with the
tutorial, DON\'T USE IT. If you think your notes are better, make your
own! These settings are known to work in **MY NOVELL ENVIRONMENT**,
changes may need to be performed to better fit your environment.

### \-\--Steps\-\-- {#steps___}

#### Step one: Connect the computer and switch using programming cable. {#step_one_connect_the_computer_and_switch_using_programming_cable.}

-   Insert the RJ-45 end of the console cable into the switch and the
    DB-9 side into your computers serial port (or adapter).

#### Step Two: Configure your terminal client {#step_two_configure_your_terminal_client}

-   Open your terminal program and, choose the COM port that the switch
    is plugged into and give it a name if you want to save these
    settings later on. Then configure it with the following settings (if
    using \*Hyper Terminal, just use default settings):

```{=html}
<!-- -->
```
    Bits Per second:9600
    Data Bits:8
    Parity:None
    Stop Bits:1
    Flow Control:None

-   Without these settings the switch will not recognize any keystrokes
    that you input.

#### Step three: Connect the switch to the terminal {#step_three_connect_the_switch_to_the_terminal}

-   Turn the switch on, depending on your switch you may need to enable
    it in an upload mode, please refer to documentation for the model of
    switch you are working with. At this point you will see a lot of
    text start scrolling through your terminal client, this is the
    switch booting up. If your switch does not have a configuration it
    will ask if you want to start the configuration wizard. Choose no.
    You will then be given a prompt like so:

```{=html}
<!-- -->
```
    Switch>
    You can now communicate with the switch!

#### Step four: Configuring the switch {#step_four_configuring_the_switch}

*Note: Cisco has shortcut commands. These are extremely common in Cisco
network peripherals and allow network operators to move around a
configuration quickly. The commands listed here are the full commands.
For this part of the instruction, bolded lines are commands I will input
to the switch and italicized comments with exclamation points are just
notes. In a real Cisco config file all comments are preceded by
exclamation points, so this is good practice.*

Enable the router:

-   **Switch\>enable**
    -   Alternatively you can type en. You will then be given a prompt
        that looks like this.

```{=html}
<!-- -->
```
-   **Switch#**
    -   We want to go one step further and get inside the configuration.
        To do this we type:

```{=html}
<!-- -->
```
-   **Switch#configure terminal**
    -   Or we could just type conf t for short. Our prompt is now:

```{=html}
<!-- -->
```
-   **Switch(config)#**
    -   The first thing we want to do is give our switch a meaningful
        name, or else wed call all of our switches Switch.
    -   To do so we type:

```{=html}
<!-- -->
```
-   **Switch(config)#hostname TestSwitch**
    -   This is a common name you can know the switch as.

```{=html}
<!-- -->
```
-   **TestSwitch(config)#**
    -   Next we want to password protect our switch with an encrypted
        key. Then were going to password protect the
    -   ports on our switch so we can telnet in over TCP/IP instead of
        consoling in. So first off, since once were done
    -   with our console session we wont be consoling in again, lets
        password protect the console.

```{=html}
<!-- -->
```
-   **TestSwitch(config)# line console 0**

```{=html}
<!-- -->
```
-   **TestSwitch(config-line)#password keepout**

```{=html}
<!-- -->
```
-   **TestSwitch(config-line)#login**
    -   Now if we consoled in again we would be met with a password
        prompt. Lets do the same with our ports. To go back to the
        global config, hit ctrl+Z. This brings us back to the enabled
        prompt, so first get back in config mode.

```{=html}
<!-- -->
```
-   **TestSwitch#conf t**

```{=html}
<!-- -->
```
-   **TestSwitch(config)#line vty 0 15**

```{=html}
<!-- -->
```
-   **TestSwitch(config-line)#password keepout**

```{=html}
<!-- -->
```
-   **TestSwitch(config-line)#login**
    -   Now when we set up our IP address on our switch well be able to
        get in via TCP/IP. Ctrl+Z.

```{=html}
<!-- -->
```
-   **TestSwitch#**
    -   Now the most important password we can set. The enable password,
        which we will encrypt. Lets get to the Global config then enter
        the command.

```{=html}
<!-- -->
```
-   **TestSwitch#conf t**
-   **TestSwitch(config)# enable secret keepout**
    -   That has set our password to keepout. When we type enable at
        Switch\> well be prompted for this. If someone were to somehow
        steal our config file they would see a big mess of characters in
        place of that password. The last thing we need to do in order to
        remote in instead of console in is to set up the IP of our vlan.
        We need to get into the vlan interface to do this.

```{=html}
<!-- -->
```
-   **TestSwitch(config)#interface vlan1**
    -   Our prompt changes to:

```{=html}
<!-- -->
```
-   **TestSwitch(config-if)#**
    -   We could rename our vlan, but we only have one so we wont
        bother. Its similar to renaming the switch. First things first,
        lets turn our vlan on. Its weird, but this is the command to
        make it so:

```{=html}
<!-- -->
```
-   **TestSwitch(config-if)#no shutdown**
    -   And that turns it on. Lets set the IP address.

**\*TestSwitch(config-if)#ip address 192.168.0.1 255.255.255.248**

-   -   Our vlan now has an IP address. Any port that is enabled for
        vlan access can be used to remote in to the switch. So the last
        thing to do is actually set up one of our ports so it can be
        used for just that purpose. Ctrl+Z, then type the following
        command to get to the interface for the first Ethernet port on
        our switch after getting back to the global config.

```{=html}
<!-- -->
```
-   **TestSwitch#conf t**

```{=html}
<!-- -->
```
-   **TestSwitch#interface FastEthernet0/1**
    -   Your prompt will now look like this:
    -   I didn\'t need to do this on my switch, please check the model.

```{=html}
<!-- -->
```
-   **TestSwitch(config-if)#**
    -   Just the same as it did in the vlan interface. To enable this
        port, its the same command

```{=html}
<!-- -->
```
-   **TestSwitch(config-if)#no shut**
    -   Then well enable it for vlan access with the following commands:

```{=html}
<!-- -->
```
-   **TestSwitch(config-if)#switchport mode access**
    -   I was also unable to use switchport commands.

```{=html}
<!-- -->
```
-   **TestSwitch(config-if)#switchport access vlan1**
    -   We should now be able to remote into our switch.
    -   Well set our computers IP, subnet, and gate manually to that
        they are 192.168.0.2, 255.255.255.248 and 192.168.0.1
        respectively. Once done we use hyperterminal only this time with
        the following settings.
    -   Choose TCP/IP in Connect using prompt this time.
    -   For Host address put in 192.168.0.1, or whatever you set your
        vlan IP to.
    -   And leave Port number as the default, 23.
    -   Hit OK.
    -   As soon as you connect you will be prompted for the password we
        set earlier, enter it. If correct, you should be met with the
        switchs main prompt. Type enable to enter. You will then be met
        with the prompt to get into the switch. Type in that password
        and you are now able to remotely access your switch on the
        network. Congratulations.
    -   From here we will save our configuration. And thats it. Youre
        finished.

```{=html}
<!-- -->
```
-   **TestSwitch\>en**
-   **TestSwitch#wr mem**
    -   Some handy commands to know (long command // short command):

```{=html}
<!-- -->
```
-   **Show running-config // show run  shows the running configuration
    (not saved)**
-   **Write memory // wr mem - Saves the current running configuration**
-   **Write erase // wr er  erase the non-volatile ram, not the running
    config. Reboot to lose running.**
-   **Reload  reboots the Cisco device**
-   **Need to run a command but not at the right prompt? Put the word do
    in front of the command.**
-   **Examples:**

```{=html}
<!-- -->
```
    Do sh run

    Do wr mem
