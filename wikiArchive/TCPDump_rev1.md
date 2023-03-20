**Looking at the packets.**

Using TCPDump to capture all traffic going into and out of an interface
on Linux:

    sudo tcpdump -w issue.pcap -i eth0

You might need to change the interface name in the above command if
you\'re interface is named differently. This command will list all
available interfaces; pick the right one (not the loop-back interface):

    ip link show

Run the above tcpdump command on the FOG machine, then start the remote
target host. Wait until the remote target host fails, then stop tcpdump
using **ctrl+c**. Then transfer the PCAP file to your PC and examine it
using [Wireshark](https://www.wireshark.org/).

You may get the issue.pcap file by a number of means. The most basic way
is by placing the pcap file inside of the /tftpboot directory (or saving
it there) and then using TFTP to transfer the file to a Windows machine.

This would save the file to your /tftpboot directory, but you still need
to specify the correct interface:

    sudo tcpdump -w /tftpboot/issue.pcap -i eth0

Then on a windows machine, you would issue this command to retrieve the
file via TFTP:

    tftp i x.x.x.x get issue.pcap

Obviously you need the TFTP windows component installed, and you should
turn off your windows firewall. Details about those things can be found
here:

[Troubleshoot_TFTP](Troubleshoot_TFTP "wikilink")

If your desktop computer that you want to get the file onto is Linux,
then getting the capture file is much easier. You can simply use SCP
like so from your desktop:

    scp username@x.x.x.x:/tftpboot/issue.pcap /home/YourUserName/Documents/issue.pcap

After the capture is completed and you\'ve opened the PCAP file with
wireshark, please use the MAC address of the target host as the filter
for sender & receiver. The below example filter basically does this: (
Show packet if Sending MAC equals xxxxxxx OR Receiving MAC equals xxxxxx
)

Example Filter (change the MAC addresses):

    eth.dst == 00:0C:CC:76:4E:07 || eth.src == 00:0C:CC:76:4E:07

Other usefull display filters are bootp (DHCP), tftp and http, for
example:

    bootp || tftp
