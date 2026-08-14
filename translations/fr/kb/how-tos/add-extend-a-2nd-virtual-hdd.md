---
title: Ajouter et étendre un 2e disque dur virtuel
description: Décrit comment rattacher un second disque à un serveur FOG et le rendre utilisable par le serveur
context_id: add-extend-a-2nd-virtual-hdd
aliases:
    - Add & Extend a 2nd Virtual HDD
    - Add and Extend a 2nd Virtual HDD
tags:
  - in-progress
  - convert-Wiki2MD
  - linux
  - disks
  - how-to
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/add-extend-a-2nd-virtual-hdd).

# Ajouter et étendre un 2e disque dur virtuel

[](https://wiki.fogproject.org/wiki/index.php?title=Add_%26_Extend_a_2nd_Virtual_HDD#mw-head)[](https://wiki.fogproject.org/wiki/index.php?title=Add_%26_Extend_a_2nd_Virtual_HDD#p-search)

Tout d'abord, si votre serveur FOG fonctionne dans une machine virtuelle, ces étapes seront simples puisqu'il vous suffira de créer un nouveau disque virtuel (supplémentaire) et de le rattacher à votre machine virtuelle. Votre serveur FOG disposera ainsi de deux disques durs. Si votre serveur FOG est physique, vous devrez ajouter un second disque dur physique pour que cela fonctionne.

(la suite suppose que FOG fonctionne dans une machine virtuelle) Une fois ce second disque dur (vmdk) ajouté à votre serveur FOG, exécutez la commande suivante

	lsblk
	
	NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
	sda      8:0    0 298.1G  0 disk 
	├─sda1   8:1    0 294.3G  0 part /
	├─sda2   8:2    0     1K  0 part 
	└─sda5   8:5    0   3.8G  0 part [SWAP]
	sdb      9:0    0 100.0G  0 disk 

Comme vous pouvez le voir ci-dessus, deux disques durs sont désormais rattachés à ce serveur FOG. Il y a /dev/sda, d'environ 300 Go, et /dev/sdb, de 100 Go.

Nous allons prendre ce fichier vmdk (nouveau) de 100 Go, y créer une partition et un système de fichiers, puis enfin le monter à un emplacement temporaire afin d'y copier les fichiers de /images et de les sortir du système de fichiers racine (actuellement rempli à 100 %).

Nous savons que le nouveau disque est /dev/sdb : utilisez donc fdisk pour créer une nouvelle partition sur ce disque vierge. Si vous avez des questions sur fdisk, cherchez sur Internet.

	fdisk /dev/sdb
	Create a <n>ew
	<p>artition
	numbere <1>
	<default>
	<default>
	<w>rite the changes to disk
	<q>uit fdisk

Nous devons ensuite formater la nouvelle partition avec notre système de fichiers Linux.

	mkfs.ext4 /dev/sdb1

Une fois le nouveau disque formaté, nous devons le raccorder à notre serveur FOG bien plein. Si votre serveur FOG est rempli à 100 %, la commande suivante peut poser problème : il vous faudra peut-être trouver et supprimer quelque part un fichier journal inutile afin de libérer un peu de place pour créer un nouveau répertoire.

Pour cette étape, nous allons créer un point de montage auquel raccorder notre nouveau disque dur

	mkdir /mnt/test

Nous allons maintenant rattacher notre nouveau disque à ce point de montage

	mount -t ext4 /dev/sdb1 /mnt/test

Si vous relancez la commande lsblk, vous devriez maintenant voir que sdb possède une partition sdb1 (notez que cette instruction devrait sans doute figurer avant le formatage du système de fichiers, pour la fluidité du document).

La commande df -h affichera à la fois le système de fichiers racine et le nouveau disque dur monté sur le point de montage /mnt/test.

Nous devons maintenant déplacer les fichiers image des machines depuis le répertoire /images vers notre nouveau disque dur vide.

	mv /images/* /mnt/test

Après un peu de travail, vos fichiers image seront déplacés sur le nouveau disque.

Une fois tous vos fichiers image sains et saufs sur le nouveau disque, nous devons démonter le point de montage actuel et remonter le nouveau disque par-dessus le répertoire /images.

  
Nous devons démonter le nouveau disque dur du point de montage /mnt/test avec cette commande

	umount /mnt/test

Exécutez la commande df -h pour vérifier que sdb1 a bien été démonté.

Nettoyez ensuite le dossier de test (devenu inutile) avec

	rmdir /mnt/test

Nous devons maintenant monter notre nouveau disque dur par-dessus le dossier /images. Nous pouvons le faire avec la commande suivante

	mount -t ext4 /dev/sdb1 /images

Placez-vous dans le dossier /images et vous devriez y voir tous vos fichiers image.

À ce stade, nous avons presque terminé. Si nous redémarrions le serveur FOG, cette commande de montage manuelle ne serait plus active après le redémarrage. Rendons donc ce changement permanent.

Vous devrez modifier le fichier fstab dans /etc. Insérez la ligne suivante à la fin de fstab.

Modifiez /etc/fstab :

	vi /etc/fstab

Instructions sur l'utilisation de Vi : [Vi](https://wiki.fogproject.org/wiki/index.php?title=Vi "Vi")

	/dev/sdb1    /images    ext4    defaults    0    1

Démontons maintenant le dossier images contenant tous les fichiers image des machines.

	umount /images

Si vous affichez les fichiers du dossier /images, il devrait être vide.

	ls -la /images

Montons maintenant à nouveau le dossier /images avec la commande suivante

	mount -a

Utilisez la commande df -h pour vérifier que nous avons bien monté /dev/sdb1 sur /images.

Redémarrez votre serveur FOG et utilisez la commande df pour vous assurer que vos images sont bien remontées par-dessus le dossier /images.

Je recommande de créer ce nouveau disque sur son propre VMDK, sans partition supplémentaire. Il existe en effet quelques astuces Linux permettant d'agrandir ce nouveau disque si jamais nous manquions à nouveau de place dans notre dossier /images. Comprenez bien que, cette fois, nous ne mettrons pas le serveur FOG à genoux, puisque toutes nos images ne sont PAS sur la partition racine utilisée par le système d'exploitation.

**Les étapes suivantes ne devraient être entreprises que par un professionnel Linux aguerri**, car il y a un risque, en cas d'erreur, de **perdre toutes vos images**. Je ne vais pas détailler toutes les étapes, car si vous êtes un professionnel Linux, vous saurez quoi faire. Les étapes une et deux de cette partie consistent donc à faire une sauvegarde complète du système, puis une seconde sauvegarde complète du système.

L'étape suivante consiste à vous rendre dans votre hyperviseur et à agrandir le fichier VMDK créé précédemment. Je ne détaillerai pas la marche à suivre, car chaque hyperviseur est différent.

Vous devriez maintenant disposer d'un fichier vmdk plus grand, avec toutes vos images au début du disque et tout le nouvel espace à la fin (au-delà de l'étendue actuelle de la partition 1)

Utilisez fdisk sur le disque : fdisk /dev/sdb1

Appuyez sur p pour afficher le disque. Vous devriez voir quelque chose comme ceci :

Disk /dev/sdb: 320 GB (ou la taille à laquelle vous avez étendu votre fichier vmdk)

Lorsque vous êtes certain d'être sur le bon disque (la suite est un peu angoissante), nous allons utiliser fdisk pour supprimer la partition et la recréer avec l'espace supplémentaire. La clé de la réussite est de NE PAS changer le bloc de début de la partition et de TOUJOURS choisir un bloc de fin plus grand que l'actuel. Si vous n'y parvenez pas... eh bien, c'est pour cela que vous avez deux jeux de sauvegardes. Supprimez la partition 1, écrivez les modifications sur le disque et quittez fdisk.

Retournez immédiatement dans fdisk avec fdisk /dev/sdb

Créez une nouvelle partition 1 avec le même bloc de début que celle que nous venons de supprimer, et choisissez la valeur par défaut pour le bloc de fin. Celle-ci devrait correspondre à la fin du VMDK que nous avons agrandi précédemment. Écrivez les modifications sur le disque, puis quittez fdisk.

Il nous faut ensuite vérifier si nous avons abîmé le système de fichiers d'une manière ou d'une autre. Exécutez la commande suivante pour le contrôler.

	e2fsck -f /dev/sdb1

Si le système de fichiers est toujours en bon état, nous pouvons l'étendre à la taille de la partition avec resize2fs /dev/sdb1

Il ne nous reste plus qu'à remonter le disque agrandi sur le point de montage /images avec la commande mount -a.

---

La méthode ci-dessus traitait de l'ajout d'un nouveau disque avec des partitions classiques. La plupart des distributions Linux actuelles utilisent LVM pour gérer les disques. Avec LVM, on pourrait créer un nouveau vmdk, y créer une partition, l'ajouter au groupe de volumes, puis étendre le volume logique à la nouvelle taille, exécuter la commande resize2fs et en rester là.

Mais cela ne règle pas vraiment le problème, puisque /images et /opt/fog/snapins restent montés sur le système de fichiers racine. Tout ce que cela ferait, c'est retarder un peu plus le moment où le système d'exploitation se retrouve à l'étroit. La bonne réponse consiste à créer un nouveau disque ou une nouvelle partition, LVM ou physique, puis à utiliser la méthode du point de montage décrite ci-dessus pour monter le nouveau disque par-dessus le répertoire /images. Nous sommes ainsi certains que le système d'exploitation ne sera jamais saturé par les images capturées.
