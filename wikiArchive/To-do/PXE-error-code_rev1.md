     What Are The PXE Error Codes?

    Article: 138

    Applies to: All releases

    Init/Boot/Loader Codes
       PXE-E00 Could not find enough free base memory. PXE BaseCode and UNDI runtime modules are copied from FLASH or upper memory into the top of free base memory between 480K (78000h) and 640K (A0000h). This memory must be zero filled by the system BIOS. If this memory is not zero filled, the relocation code in the PXE ROMs will assume that this memory is being used by the system BIOS or other boot ROMs.
       PXE-E01: PCI Vendor and Device IDs do not match! This message should never be seen in a production BIOS. When the system BIOS initializes a PCI option ROM, it is supposed to pass the PCI bus/device/function numbers in the AX register. If the PCI device defined in the AX register does not match the UNDI device, this error is displayed.
       PXE-E04: Error reading PCI configuration space. This message is displayed if any of the PCI BIOS calls made to read the PCI configuration space return an error code. This should not happen with a production BIOS and properly operating hardware.
       PXE-E05: EEPROM checksum error. This message is displayed if the NIC EEPROM contents have been corrupted. This can happen if the system is reset or powered down when the NIC EEPROM is being reprogrammed. If this message is displayed the PXE ROM will not boot.
       PXE-E06: Option ROM requires DDIM support. This message should not be seen in a production BIOS. PCI option ROMs must always be installed as DDIM option ROMs (they must be installed into read/write upper memory).
       PXE-E07: PCI BIOS calls not supported. This message should not be seen in a production BIOS. PCI BIOS must have PCI BIOS services.
       PXE-E08: Unexpected API error. API: xxxxh Status: xxxxh. This message is displayed if a PXE API returns a status code that is not expected by the runtime loader.
       PXE-E09: Unexpected UNDI loader error. Status: xxxxh. This message is displayed if the UNDI runtime loader returns an unexpected status code.

    ARP Codes
       PXE-E11: ARP timeout. The PXE ROM will retry the ARP request four times, if it does not get any valid ARP replies, this message is displayed. There are several possible causes:
       Setting the DHCP Class Identifier (option 60) on the DHCP server and installing the proxyDHCP on a separate machine.
       Using routers that do not respond to ARP requests.
       A situation that may lead to this error is with ProLiant BL p-Class blade servers connected to a ProLiant BL p-Class GbE Interconnect Switch with Port Trunking (802.3ad) enabled uplinked to another switch where port trunking is not enabled, and perhaps instead, the customer inadvertently enabled VLAN trunking.

    The GbE switch options are based on IEEE terminology which is sometimes different than Cisco terminology. The Port Trunking option on the GbE switch is meant for the bonding together of multiple ports (802.3ad) for faster throughput and reliability. The Cisco term for this is etherchannel. The term "trunking" on a Cisco switch means vlan tagging and is often confused with IEEE port trunking. The two are not the same and cannot be used on one switch without the same option being enabled on both switches.

    To resolve this issue, correct the port trunk configuration on both switches.
       After certain deployment operations, the server's MAC address might be set to 0.

    To resolve this issue, apply the SoftPaq for Network Adapter Boot Code and PXE Firmware refered to in the Knowledge Base article Minimum Firmware Requirements For Target Servers (Article 200).

    BIOS and BIS Codes
       PXE-E20: BIOS extended memory copy error. AH == nn This message is displayed if the BIOS extended memory copy service returns an error. This should not happen on a production BIOS. nn is the BIOS error code returned by the BIOS extended memory copy service (Int 15h, AH = 87h).
       PXE-E21: BIS integrity check failed. This message is displayed if the BIS image in extended memory has been corrupted.
       PXE-E22: BIS image/credential validation failed. The downloaded image and credential do not match the client key.
       PXE-E23: BIS initialization failed. BIS could not be initialized. No more data is available.
       PXE-E24: BIS shutdown failed. BIS could not be shutdown. No more data is available.
       PXE-E25: BIS get boot object authorization check flag failed. Could not determine if BIS is enabled/disabled.
       PXE-E26: BIS free memory failed. Could not release BIS allocated memory.
       PXE-E27: BIS get signature information failed. Required BIS credential type information could not be determined.
       PXE-E28: BIS bad entry structure checksum. BIS entry structure in the SM BIOS table is invalid.

    TFTP/MTFTP Codes
       PXE-E32: TFTP open timeout. The PXE client was able to get a DHCP address and a boot file name, but timed out when attempting to download the boot file using TFTP or MTFTP. To resolve this issue, check each of the following network configuration items:
       This message is sometimes displayed, and the operation is retried, allowing for a successful download of the boot image. The message Transferring control to DOS boot diskette image... indicates that the boot file was successfully downloaded and the PXE boot has succeeded. In this case, no action is needed to correct the problem.
       By default, the Altiris PXE server is configured to use multicast TFTP. If multicast is disabled by the switches in the environment, either enable multicast (ports 1758 and 1759) or change the configuration of the PXE server to use regular TFTP (port 69).
       Verify that the Altiris MTFTP Service is running on the Deployment Server.
       PXE-E35: TFTP read timeout. Next TFTP data packet was not received.
       PXE-E36: Error received from TFTP server. A TFTP error packet was received from the TFTP server.
       PXE-E38: TFTP cannot open connection. A hardware error occurred when trying to send the TFTP open packet out.
       PXE-E39: TFTP cannot read from connection. A hardware error occurred when trying to send a TFTP acknowledge packet out.
       PXE-E3A: TFTP too many packages. This message can mean one of two things:
       You are trying to download a file using TFTP that is larger than the allocated buffer.
       You started downloading a file as a slave client using MTFTP and the file increased in size when you became the master client.
       PXE-E3B: TFTP error - File not found. The requested file was not found on the TFTP server.
       PXE-E3C: TFTP error - Access violation. The request file was found on the TFTP server. The TFTP service does not have enough access rights to open/read the file.
       PXE-E3F: TFTP packet size is invalid. The TFTP packet received is larger than 1456 bytes.

    BOOTP/DHCP Codes
       PXE-E51: No DHCP or proxyDHCP offers were received. The client did not receive any valid DHCP, BOOTP or proxyDHCP offers. To resolve this issue, check each of the following network configuration items:
       DHCP services are not available on the network to which the PXE-enabled NIC is connected.
       A DHCP proxy or IP helper address is not configured for the subnet on which the PXE client is connected.
       The switch port connected to the PXE NIC is running Spanning Tree Protocol, EtherChannel Protocol, or Port Aggregation Protocol and is thus not activated immediately when a link is detected. This forces the DHCP request from the PXE client to timeout.
       DHCP is available on the network, but PXE is not.
       The network cable is not attached to the PXE-enabled NIC on the target server.
       PXE-E52: proxyDHCP offers were received. No DHCP offers were received. The client did not receive any valid DHCP or BOOTP offers. The client did receive at least one valid proxyDHCP offer.
       PXE-E53: No boot filename received. The client received at least one valid DHCP/BOOTP offer, but does not have a boot filename to download. There are several possible causes:
       The DHCP Server and the PXE Server were located on the same server, but one of them was moved to a different server. This would result in an incorrect PXE Server configuration.

    To resolve this issue, reinstall the PXE Server component of the Altiris Deployment Solution.
       The DHCP relay agent, either a Proxy DHCP Server or a switch configured with helper addresses, is not configured correctly. For example, if DHCP and PXE are on separate servers, the DHCP relay agent needs to have both addresses in its configuration.

    To resolve this issue, correct the DHCP relay agent configuration.
       If the Microsoft DHCP service is installed on the PXE server, but is disabled or unconfigured, Altiris PXE Setup configures PXE to work with the local DHCP service (even if the DHCP service is disabled). This causes the PXE server to not respond to PXE clients that get a DHCP address from DHCP services running elsewhere on the network.

    To resolve this issue, remove Microsoft DHCP services from the PXE server and reinstall the PXE Server component of the Altiris Deployment Solution.
       PXE-E55: proxyDHCP service did not reply to request on port 4011. The client issued a proxyDHCP request to the DHCP server on port 4011 and did not receive a reply.

    UNDI Codes
       PXE-E60: Invalid UNDI API function number. An API being used by the BaseCode is not implemented in the UNDI ROM.
       PXE-E61: Media test failed, check cable. Most likely the cable is not plugged in or connected. Could be a bad cable, NIC or connection.
       PXE-E63: Error while initializing the NIC. An error occurred while trying to initialize the NIC hardware. Try another NIC.
       PXE-E64: Error while initializing the PHY. An error occurred while trying to initialize the PHY hardware. Try another NIC.
       PXE-E65: Error while reading the configuration data. An error occurred while reading the NIC configuration data. Try another NIC.
       PXE-E66: Error while reading the initialization data. An error occurred while reading the NIC initialization data. Try another NIC.
       PXE-E67: Invalid MAC address. The MAC address stored in this NIC is invalid. Try another NIC.
       PXE-E68: Invalid EEPROM checksum. The EEPROM checksum is invalid. The contents of the EEPROM have been corrupted. Try another NIC.
       PXE-E69: Error while setting interrupt. The interrupt hardware could not be configured. Try another NIC.

    Bootstrap and Discovery Codes
       PXE-E74: Bad or missing PXE menu and/or prompt information. PXE tags were detected but the boot menu and/or boot prompt tags were not found/valid.
       PXE-E76: Bad or missing multicast discovery address. Multicast discovery is enabled but the multicast discovery address tag is missing.
       PXE-E77: Bad or missing discovery server list. Multicast and broadcast discovery are both disabled, or use server list is enabled, and the server list tag was not found/valid.
       PXE-E78: Could not locate boot server. A valid boot server reply was not received by the client. Several possible causes are
       The PXE image is not correct for the target because a job that contains a task that is to run in a specific automation environment cannot be run on the target.
       The Virtualization Technology BIOS option may not be set on an Intel-based server running VMware ESX and a Windows 64-bit guest is being deploying to one of its virtual machines.
       PXE-E79: NBP is too big to fit in free base memory. The NBP is larger than the amount of free base memory.
       PXE-E7A: Client could not locate a secure server. This message is displayed when the client did not receive any security information from the boot server and BIS is enabled on the client.
       PXE-E7B: Missing MTFTP server IP address. This message is displayed when the ROM did not receive any PXE discovery tags or proxyDHCP offers and the DHCP SIADDR field is set to 0.0.0.0.

    Miscellaneous Codes
       PXE-EA0: Network boot canceled by keystroke. User pressed Esc or Ctrl-C during DHCP/Discovery/TFTP.

    BaseCode/UNDI Loader Codes
       PXE-EC1: BaseCode ROM ID structure was not found. UNDI boot module could not find the BaseCode ROM ID structure. If there is a BaseCode ROM image in the system, it has probably been corrupted.
       PXE-EC3: BaseCode ROM ID structure is invalid. The BaseCode ROM ID structure is invalid. The BaseCode ROM image has probably been corrupted.
       PXE-EC4: UNDI ROM ID structure was not found. The BaseCode loader module could not locate the UNDI ROM ID structure.
       PXE-EC5: UNDI ROM ID structure is invalid. The UNDI ROM image has probably been corrupted.
       PXE-EC6: UNDI driver image is invalid. The UNDI ROM image has probably been corrupted.
       PXE-EC8: !PXE structure was not found in UNDI driver code segment. The UNDI ROM image has probably been corrupted, or has not been initialized by the BIOS. This error is most often caused by one of three things:
       A .NIC image was programmed into a BIOS when a .LOM image should have been used.
       The memory allocated by the POST Memory Manager ($PMM) during PXE option ROM initialization has been corrupted or erased before PXE option ROM boot.
       The UNDI_Loader structure was not properly initialized during option ROM initialization.
       PXE-EC9: PXENV+ structure was not found in UNDI driver code segment. The UNDI ROM image has probably been corrupted, or has not been initialized by the BIOS. This error is most often caused by one of three things:
       A .NIC image was programmed into a BIOS when a .LOM image should have been used.
       The memory allocated by the POST Memory Manager ($PMM) during PXE option ROM initialization has been corrupted or erased before PXE option ROM boot.
       The UNDI_Loader structure was not properly initialized during option ROM initialization. 







    page source: http://h18013.www1.hp.com/products/servers/management/rdp/knowledgebase/00000138.html
