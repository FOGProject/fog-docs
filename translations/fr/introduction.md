---
title: Qu'est-ce que FOG
context_id: intro
aliases:
    - What is FOG
description: Qu'est-ce que FOG
tags:
    - intro
    - introduction
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/introduction).

# Qu'est-ce que FOG

FOG est une solution de clonage d'ordinateurs libre et open source, basée
sur Linux, pour différentes versions de Windows (XP, Vista, 7, 8/8.1, 10),
Linux et Mac OS X. Elle réunit quelques outils open source derrière une
interface web écrite en PHP.

FOG n'utilise ni disquette ni CD de démarrage ; tout se fait via TFTP et
PXE. Vos PC démarrent en PXE et téléchargent automatiquement un petit
client Linux qui effectue tout le travail de clonage de la machine.

De plus, de nombreux pilotes réseau sont intégrés au noyau du client
(Linux vanilla), si bien que vous n'avez pas vraiment à vous soucier des
pilotes réseau (sauf si le noyau ne les prend pas encore en charge).

FOG permet également de déployer une image provenant d'un ordinateur doté
d'une partition de 80 Go sur une machine équipée d'un disque dur de 40 Go,
tant que les données occupent moins de 40 Go.

FOG prend en charge le multicast, ce qui signifie que vous pouvez cloner de
nombreux PC à partir du même flux. L'opération est donc à peu près aussi
rapide que vous cloniez 1 PC ou 20.

## Fonctionnalités

FOG est plus qu'une simple solution de clonage : FOG est devenu une
solution de clonage et de gestion de parc en réseau.

-   Environnement de démarrage PXE (DHCP, iPXE, TFTP, téléchargement HTTP
    rapide de gros fichiers de démarrage comme le noyau et l'initrd)
-   Clonage de Windows (XP, Vista, 7, 8/8.1, 10), Linux et Mac OS X
-   Partitions, disque entier, disques multiples, redimensionnable, brut
-   Snapins pour installer des logiciels et exécuter des travaux/scripts sur les clients
-   Gestion des imprimantes
-   Modification du nom d'hôte et intégration au domaine
-   Suivi des accès utilisateurs sur les ordinateurs, déconnexion et arrêt
    automatiques après un délai d'inactivité
-   Antivirus
-   Effacement de disque
-   Restauration de fichiers supprimés
-   Analyse des blocs défectueux

## Comment faire fonctionner FOG

FOG s'installe de préférence sur un serveur dédié, n'importe quelle machine
dont vous disposez. Nous recommandons de prévoir un espace disque
suffisant. L'utilisation d'une grappe RAID permet de cloner plusieurs
ordinateurs simultanément sans grande perte de performance.

Une carte réseau gigabit est recommandée. Pour accélérer la compression et
la décompression des images, prévoyez autant de processeur et de mémoire
vive que possible.

## Combien coûte FOG ?

FOG est un projet open source sous licence GPL, ce qui signifie que vous
êtes libre d'utiliser FOG gratuitement sur autant d'ordinateurs que vous le
souhaitez. Cela signifie également que si vous voulez modifier le code
source, vous êtes libre de le faire.

Les créateurs de FOG ne tirent aucun profit de ce projet, à l'exception des
dons. FOG est fourni absolument SANS AUCUNE GARANTIE et les créateurs de
FOG ne sont EN AUCUN CAS RESPONSABLES DE TOUT DOMMAGE OU PERTE CAUSÉ PAR
FOG ! Veuillez consulter le fichier de licence inclus dans la distribution
de FOG pour plus d'informations. Cela dit, nous nous efforçons d'offrir un
très bon support à nos utilisateurs ; c'est même l'un des objectifs de FOG
que d'offrir un meilleur support que la plupart des produits commerciaux.
Toute demande d'assistance doit être adressée via le forum de FOG, situé à
l'adresse :
<https://forums.fogproject.org/>

Merci de soutenir les logiciels open source, et bonne utilisation !

## Contexte

Travaillant dans le milieu éducatif, les techniciens de notre organisation
réinstallaient très souvent des ordinateurs dans leur activité quotidienne.
Pendant longtemps, nous avons utilisé un produit commercial qui, à bien des
égards, ne répondait pas à nos besoins. Il n'était pas basé sur le web et
il fallait créer des disques de pilotes, des disquettes ou des clés USB.
D'autres opérations étaient très difficiles, comme rechercher une machine
par son adresse MAC ; et le produit était coûteux, même avec une remise
éducation.

Nous avons donc commencé à chercher comment faire mieux et, tandis que
notre organisation s'efforçait de faire mieux fonctionner un produit
commercial en tentant de démarrer DOS en PXE et en le testant sous Windows
PE, nous, l'équipe FOG, avons commencé à construire une solution basée sur
Linux sur notre temps libre.

Nous avons fini par obtenir une version fonctionnelle et avons décidé de la
publier en open source, puisque nous utilisons beaucoup d'autres produits
open source et que nous estimions devoir rendre à la communauté ce qu'elle
nous avait apporté.
