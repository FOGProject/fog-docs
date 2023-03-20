To use your existing IPCop DHCP-server with FOG, disable the DHCP-server
while installing FOG or stop it. Then add the following parameters to
your IPCop DHCP-server configuration via the Web-GUI:

  Parameter     Value             Description
  ------------- ----------------- -----------------------------------
  filename      \"/pxelinux.0\"   
  next-server   192.168.5.2       The IP-address of your FOG-server

**Services -\> DHCP server**

<figure>
<img src="Fog_ipcop.jpg" title="Fog_ipcop.jpg" />
<figcaption>Fog_ipcop.jpg</figcaption>
</figure>

To use smoothwall the changes are similar:-

<figure>
<img src="smoothwall_fog_dhcp.PNG" title="smoothwall_fog_dhcp.PNG" />
<figcaption>smoothwall_fog_dhcp.PNG</figcaption>
</figure>
