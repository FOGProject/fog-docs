## Introduction

FOG utilizes the UDP echo port (7) to check if a client is currently up.
The proper response to a UDP echo request is generally an ICMP
destination port unreachable response from the host if no service is
listening, and in general, this is the case. The Windows Firewall by
default disallows several of these mechanisms, all of which must be
turned on to receive the \'host up\' designation in FOG. The following
must be working correctly before a green dot will be shown:

-   The FOG server must be able to correctly resolve the target PC\'s
    hostname
-   The PC must allow incoming UDP packets on port 7 from the FOG
    server(s)
-   The PC must be permitted to send outgoing ICMP destination
    unreachable packets (XP/Vista/7)
-   The PC must have \'stealth mode\' disabled in the Windows Firewall
    with Advanced Security (Vista/7)
-   For testing purposes, enable ICMP echo request packets at the PC as
    well (XP/Vista/7)

## Verify DNS resolution on the FOG server and connectivity to the PC {#verify_dns_resolution_on_the_fog_server_and_connectivity_to_the_pc}

Log into the FOG server via SSH, and assuming you enabled ICMP echo
requests on the PC\'s firewall, try to ping the hostname listed in the
FOG server. For the PC called \'Accounting1\' enter:

    ping -c 3 Accounting1

If you receive responses, your PC and FOG server are at least able to
communicate, and your FOG server is able to determine the proper IP
addresses for hostnames. If no response was received, determine if an IP
address was correctly resolved. If yes, the issue lies either with the
communication between the FOG server and PC (either unroutable on the
network or ICMP is blocked at the PC), or the IP address is incorrect in
DNS for that hostname. If no resolution occured, verify that the FOG
server\'s /etc/resolv.conf file is configured with the correct name
servers and, if necessary, search list. For the domain \'local.domain\'
with name servers at 192.168.0.100 and 192.168.0.101, the
/etc/resolv.conf will contain:

    search local.domain
    nameserver 192.168.0.100
    nameserver 192.168.0.101

:   ***NOTE:** Typically the search option will not be needed if the FOG
    server\'s hostname is correctly set, because the system\'s FQDN is
    used to determine the search list domain automatically. Manually
    specifying the search list overrides this behavior. As an example,
    for the FOG server with the FQDN \'imaging.local.domain\' the
    automatic search domain will be \'local.domain\' (anything following
    the first . in the server\'s FQDN).*

Once any DNS issues are corrected, test again to verify that the PC is
able to respond to pings from the FOG server. On the FOG Host Management
page, solid red dots are for clients whose name was successfully
resolved to an IP address, but are not responding to UDP pings, while
red dots with an exclamation point are clients whose name was not able
to be resolved. Communication between the FOG server and the PC must be
established before the remaining troubleshooting steps will be of any
use!

## Background on how UDP echo requests work {#background_on_how_udp_echo_requests_work}

If you\'re in a hurry to get things up and running, feel free to skip
this section. Often the first advice given when hosts are not responding
to UDP pings is to open port 7. Some will find that doing so does not
resolve their problem, and this is due to the replys from the PC being
blocked by the firewall policy. UDP pings are often sent to the echo
port, port 7, which typically does not have a service listening. The
response the originating server is looking for is not a UDP response,
but the standard ICMP destination (port) unreachable response sent by
the target PC. Because of this behavior, both incoming UDP requests on
port 7 and outgoing ICMP destination unreachable responses must be
permitted at the PC.

## Configure PC Firewall {#configure_pc_firewall}

### Windows XP {#windows_xp}

Windows XP contains the original Windows Firewall, which is much simpler
in its configuration and administration. Assuming you configure the
firewall from Group Policy, configure your firewall policy to contain
the following:

-   Allow UDP packets from the FOG server going to the PC\'s port 7 (the
    UDP echo port)
-   In the ICMP configuration, ensure that the PC is permitted to send
    outbound ICMP destination unreachable packets (required even if ICMP
    echo request/reply packets are later disabled, see note above for
    more information)

With those configuration options in place, your XP PCs should be able to
reply to the FOG server\'s UDP pings, and show up as green dots in the
FOG Host Management page.

### Windows Vista/7 (Windows Firewall with Advanced Security) {#windows_vista7_windows_firewall_with_advanced_security}

The firewall integrated into Windows Vitsa and 7 allows more options to
be configured, but with options comes additional complexity. The
firewall also features a stealth mode which prevents responses on ports
where no service is actively listening. In short, this means ICMP
destination port unreachable responses will be suppressed by the
operating system regardless of the firewall exemption. Windows Vista and
7 must be configured exactly as Windows XP, with one addition: you must
disable the stealth mode feature of the Windows Firewall as well.
Microsoft does not provide a built-in way to do so, either at the PC or
via Group Policy, however it can be disabled via a registry entry (which
can be distributed via Group Policy). You will want to create the
following registry entry in your firewall policy\'s registry settings
(Computer Settings, Preferences, Windows Settings, Registry):

-   Action: Update
-   Hive: HKEY_LOCAL_MACHINE
-   Key Path:
    Software\\Policies\\Microsoft\\WindowsFirewall\\DomainProfile (you
    can use similar key paths for other profiles)
-   Value Name: DisableStealthMode
-   Value Type: REG_DWORD
-   Value Data: 1
-   Base: Hexadecimal

You may need to restart affected machines after applying the policy to
ensure stealth mode is disabled. With it disabled and the UDP/ICMP
packet allowances configured, Windows Vista and 7 should respond to the
FOG server\'s UDP pings and show as green dots as well.

:   ***NOTE:** At the time of writing, I cannot confirm whether this
    works or not with Windows Vista. Originally Microsoft did not intend
    to allow a way to disable the stealth feature, so it may have been
    added with Windows 7. It was tested and works on Windows 7 SP1. More
    info here: <http://msdn.microsoft.com/en-us/library/ff720058.aspx>*
