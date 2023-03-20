### Taming The Beast {#taming_the_beast}

As FOG is so quick this can also cause huge problems for networks that
aren\'t so fabulous. In some instances deploying an image to a single
machine can bring down a whole network. One of a handful of solutions is
to slow down the speed of the servers network card. Here is an example
of a command that might take a little speed off your imaging.

ethtool -s eth0 speed 100 duplex half autoneg off
