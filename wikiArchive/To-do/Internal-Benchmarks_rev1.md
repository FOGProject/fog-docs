## Benchmarks

### About FOG Benchmarks {#about_fog_benchmarks}

We have done some internal testing of FOG using a flat (no vlans or
routing) switched network. For our tests here is the equipment we have
used:

-   Cisco 3750G Gigabit Series Switches
-   HP DL320S Server - Main FOG Server
    -   Fedora 9
    -   2 x Intel Xeon 2.66 GHz
    -   4 GB Memory
    -   12 x 750GB - Raid 5
    -   2 x 1GB NICs (Bonded as a single interface)

<figure>
<img src="Hp2.jpg" title="Hp2.jpg" />
<figcaption>Hp2.jpg</figcaption>
</figure>

-   \$2,000 Desktop PC With 3Ware Storage Array and Controller - FOG
    Storage Node
    -   Fedora 10
    -   Pentium D 2.8Ghz
    -   4 GB Memory
    -   1 GB NIC

<figure>
<img src="Sn.jpg" title="Sn.jpg" />
<figcaption>Sn.jpg</figcaption>
</figure>

-   30 Dell GX270 - Desktop Clients
-   30 HP DC7600 - Desktop Clients

<figure>
<img src="Lab.jpg" title="Lab.jpg" />
<figcaption>Lab.jpg</figcaption>
</figure>

### Tests Cases {#tests_cases}

#### Test 1 {#test_1}

Description:

30 Clients with 2 Servers (1 Master & 1 Storage) with a total queue size
of 20 (10/10).

  --------------------------- -----------------------
  Servers                     2
  Client Count                30
  Master Server Queue Size    10
  Storage Server Queue Size   10
  Image Size                  13.23GB
  First Client Completed      9 minutes 12 seconds
  Total Task Completion       27 minutes 32 seconds
  --------------------------- -----------------------

#### Test 2 {#test_2}

Description:

30 Clients with 2 Servers (1 Master & 1 Storage) with a total queue size
of 30 (20/10).

  --------------------------- -----------------------
  Servers                     2
  Client Count                30
  Master Server Queue Size    20
  Storage Server Queue Size   10
  Image Size                  13.23GB
  First Client Completed      12 minutes 42 seconds
  Total Task Completion       14 minutes 14 seconds
  --------------------------- -----------------------

#### Test 3 {#test_3}

Description:

60 Clients with 1 Server (1 Master) with a total queue size of 30.

  --------------------------- ----------------------
  Servers                     1
  Client Count                60
  Master Server Queue Size    30
  Storage Server Queue Size   N/A
  Image Size                  13.23GB
  First Client Completed      N/A
  Total Task Completion       40 Minutes 3 Seconds
  --------------------------- ----------------------

#### Test 4 {#test_4}

Description:

60 Clients with 2 Servers (1 Master & 1 Storage) with a total queue size
of 30 (20/10).

  --------------------------- -----------------------
  Servers                     2
  Client Count                60
  Master Server Queue Size    20
  Storage Server Queue Size   10
  Image Size                  13.23GB
  First Client Completed      N/A
  Total Task Completion       25 Minutes 57 Seconds
  --------------------------- -----------------------
