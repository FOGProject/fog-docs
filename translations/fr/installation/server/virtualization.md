---
title: Virtualisation
aliases:
    - Virtualization
    - Running Fog in a Virtual Environment
description: comment faire fonctionner FOG dans un environnement virtuel
context_id: virtualization
tags:
    - virtualization
    - hyperv
    - vmware
    - kvm
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/server/virtualization).

# Virtualisation

FOG peut être utilisé sur du matériel physique comme dans la plupart des
configurations de serveurs et de clients virtuels. Certaines techniques de
virtualisation sont vraiment appréciables avec FOG, comme les instantanés.
Certains utilisent la virtualisation pour préparer et capturer leurs « images
de référence » depuis un emplacement ou un serveur central. Comme pour le
système d'exploitation du serveur, nous ne privilégions aucune des solutions
ci-dessous ni aucune autre existante. Il ne s'agit que d'un recueil d'astuces
et de conseils, et éventuellement de problèmes connus.

## Hyper-V

**Avec l'assistant de création de machine virtuelle :**

Assurez-vous que le commutateur virtuel auquel votre VM est connectée dispose
d'une route vers FOG !

Assistant de création de VM :octicons-arrow-right-24: Options d'installation : sélectionnez « Installer un
système d'exploitation à partir d'un serveur d'installation réseau »

**VM existante :**

Assurez-vous que le commutateur virtuel auquel votre VM est connectée dispose
d'une route vers FOG !

Clic droit sur la VM :octicons-arrow-right-24: Paramètres :octicons-arrow-right-24: BIOS

Placez « Carte réseau » (parfois nommée « Carte réseau héritée ») en tête de
l'ordre de démarrage.

**UEFI :**

L'UEFI et le démarrage sécurisé sont proposés par Hyper-V sur Server 2012 pour
les VM de génération 2. Ils sont activés par défaut et peuvent être désactivés
dans Paramètres de la VM :octicons-arrow-right-24:
Microprogramme : décochez le démarrage sécurisé.

Merci à [moses](https://forums.fogproject.org/user/moses)

## KVM/QEMU

Peut servir d'environnement virtuel de bureau léger pour tester FOG et
préparer vos images. Je l'utilise sur un ordinateur portable comme
environnement de test local. Cherchez dans les forums et le wiki, mais il n'y a
pas d'information utile sur l'utilisation de FOG sur un serveur KVM. J'ai
interrogé l'utilisateur mxc, qui semble s'en servir. À défaut, voici une brève
description de la manière dont je procède.

| `# configurer un périphérique tap réseau, sorte de commutateur logiciel local pour tout relier`
| `sudo tunctl -t tap0 -u`
| `sudo ifconfig tap0 x.x.x.x netmask 255.255.255.0 up`
| `# générer le fichier image de disque`
| `qemu-img create -f qcow2 hd.qcow2 10G`
| `# démarrer la VM avec l'émulateur QEMU (mode BIOS)`
| `qemu -m 512 -boot n -net nic,vlan=1 -net tap,vlan=1,ifname=tap0,script=/bin/true -hda hd.qcow2`
| `# démarrer la VM avec la véritable virtualisation KVM (mode BIOS)`
| `kvm -m 512 -boot n -net nic,vlan=1,macaddr=00:00:00:00:00:05 -net tap,vlan=1,ifname=tap0,script=/bin/true -hda hd.qcow2`
| `# démarrer la VM en machine UEFI - en utilisant aussi le paramètre '-netdev' plus moderne`
| `kvm -m 512 -boot n -bios /usr/share/ovmf/OVMF.fd -device virtio-net-pci,netdev=hn0 -netdev tap,id=hn0,ifname=tap0,script=/bin/true -hda hd.qcow2`

## OpenVZ

OpenVZ (éventuellement dans Proxmox) sert surtout à faire fonctionner le
serveur FOG dans un environnement virtuel léger. OpenVZ étant par nature
proche d'un environnement chrooté, vous ne pouvez pas réellement démarrer un
tel conteneur en PXE. Pour installer FOG comme serveur dans OpenVZ, vous devez
d'abord disposer de la prise en charge NFS sur la machine hôte, puis l'ajouter
également au conteneur :

| `$ lsmod | grep nfsd`
| `nfsd                  312315  14`
| `$ grep nfsd /proc/filesystems`
| `nodev   nfsd`

Si vous ne voyez pas le module noyau *nfsd* chargé, vous devrez peut-être
installer le paquet nfs-kernel-server et charger le module (ce que fait
généralement le script d'init de nfs-kernel-server). Comme indiqué plus haut,
vous devez autoriser l'accès à *nfsd* depuis le conteneur dans lequel vous
souhaitez installer FOG :

| `$ vzctl stop $CONTAINER_ID`
| `$ vzctl set $CONTAINER_ID --feature  nfsd:on --save`
| `$ vzctl start $CONTAINER_ID`

Ensuite, l'installateur devrait se dérouler comme lors d'une installation sur
du matériel physique ou dans tout autre environnement virtuel !

**Wake on LAN :**

Pour pouvoir envoyer des paquets WOL et multicast, le conteneur a besoin d'une
adresse MAC correcte. Ce n'est le cas que si vous configurez le conteneur pour
utiliser un pont réseau (veth au lieu de venet !).

## LXC

L'un des principaux points est de faire fonctionner NFS dans les conteneurs
LXC. Autrefois simple dans Proxmox, cela s'est compliqué dans les versions plus
récentes.

Proxmox 6.x :
<https://forums.fogproject.org/topic/15176/fog-server-in-lxc-container-under-proxmox-6>

Proxmox 5.x : une mise à jour (vers le 23 octobre 2018) a cassé NFS dans les
conteneurs LXC. Vous trouverez un correctif ici :
<https://forum.proxmox.com/threads/mounting-nfs-in-lxc-not-working-since-latest-update.47815/>

Proxmox 4.x :
<https://forums.fogproject.org/topic/7978/fog-in-lxc-container-how-to-configure-nfs-server>

## VirtualBox

Réseau en pont ou réseau privé hôte.

La plupart des versions semblent souffrir d'un bug par lequel iPXE n'obtient
une adresse IP du DHCP qu'en cas de démarrage à froid (et non après un
redémarrage).

Cela peut être corrigé en remplaçant le binaire iPXE `undionly.kkpxe` par
`ipxe.pxe` dans la configuration du serveur DHCP.

## VMWare ESXi

Faire fonctionner un client FOG dans un serveur ESXi est très proche de ce que
vous feriez sur une machine physique :

-   Créez la VM normalement.
-   Choisissez une carte réseau autre que VMX3 (par ex. e1000), car nous avons
    constaté des [problèmes de
    chargement](https://forums.fogproject.org/topic/7108/fog-bzimage-failing-to-load-after-pxe-boot)
    avec ces cartes virtuelles.
-   Ouvrez la console de la VM et démarrez-la. Appuyez sur F2 au logo de
    démarrage pour entrer dans le BIOS.
-   Rendez-vous dans l'onglet de démarrage et utilisez la touche + pour placer
    le démarrage réseau en tête de l'ordre de démarrage.

Vous pouvez aussi effectuer un démarrage réseau ponctuel en appuyant sur F9 au
démarrage, si vous ne souhaitez pas modifier l'ordre de démarrage de façon
permanente.

**UEFI :**

L'UEFI est désactivé par défaut pour les VM sous ESXi 6.0+. Pour l'activer sur
une VM, allez dans Paramètres de la VM \> onglet Options \> Avancé : Options de
démarrage, et remplacez le microprogramme de démarrage BIOS par EFI.

Merci à [moses](https://forums.fogproject.org/user/moses)

## VMWare Player

Est-il encore utilisé ? Peu importe s'il n'y a rien à ce sujet dans le wiki ou
les forums !

## Xen/XenServer

## XCP-ng/Xen Orchestra

Aucun traitement particulier n'est nécessaire ; assurez-vous simplement que le
démarrage PXE est coché et que le bon réseau est sélectionné.

Voir les forums

-   [FOG 0.30 VM-Virtualbox](Running_pre-built_virtual_machines_in_Virtualbox)   
