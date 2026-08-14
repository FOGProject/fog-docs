---
title: Matériel pris en charge
aliases:
    - Supported Hardware
    - Hardware Compatibility
description: Quel matériel fonctionne avec FOG, les points qui demandent souvent de l'attention, et où trouver la liste de compatibilité communautaire
context_id: hardware
tags:
    - hardware
    - compatibility
    - usb-nic
    - uefi
    - reference
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/hardware).

# Matériel pris en charge

FOG est largement compatible avec le matériel PC. Si une machine peut démarrer en
PXE et exécuter un noyau Linux moderne, elle peut presque à coup sûr être imagée
avec FOG. Il n'existe pas de liste officielle de « matériel certifié » — cette
page décrit plutôt la situation générale, les points qui demandent souvent de
l'attention, et où trouver la liste de compatibilité maintenue par la
communauté.

## Compatibilité générale

-   **Micrologiciel :** le BIOS hérité comme l'UEFI (32 et 64 bits) sont pris en
    charge, tout comme l'UEFI ARM64. Voir
    [[bios-and-uefi-co-existence|Coexistence du BIOS et de l'UEFI]] si vous avez
    un mélange de types de micrologiciel sur votre réseau.
-   **Disques et contrôleurs :** SATA, NVMe et la plupart des contrôleurs de
    stockage courants sont gérés par le noyau FOS.
-   **Réseau :** la plupart des cartes réseau filaires intégrées fonctionnent
    d'emblée. Le sans-fil n'est pas utilisé pour l'imagerie — FOG image toujours
    par une connexion filaire.

Le noyau FOS embarque des pilotes pour une très large gamme de matériels.
Lorsqu'une machine toute neuve n'est pas reconnue, la solution habituelle est un
noyau plus récent — voir
[[manual-kernel-upgrade|Mise à niveau manuelle du noyau]], ou
[[compile-fos-kernel|Compiler le noyau FOS]] pour construire le vôtre.

## Liste de compatibilité communautaire

La liste la plus à jour et la plus concrète de ce qui fonctionne est maintenue
par la communauté sur les forums :

-   [Hardware currently working with FOG (forums FOG)](https://forums.fogproject.org/topic/2987/hardware-currently-working-with-fog-v1-x-x)

## Points qui demandent souvent de l'attention

### Adaptateurs USB vers Ethernet

Les tablettes, ultraportables et hybrides 2-en-1 n'ont souvent aucune carte
réseau filaire intégrée et dépendent d'un adaptateur USB vers Ethernet. Deux
choses distinctes doivent fonctionner : l'adaptateur doit être capable de
**démarrer en PXE**, et le noyau FOS doit disposer d'un **pilote** pour lui
pendant l'imagerie.

-   Pour démarrer en PXE via une carte réseau USB, FOG fournit un binaire iPXE
    dédié, `ncm--ecm--axge.efi`, dans `/tftpboot`, pour les jeux de composants
    ASIX/CDC courants.
-   Le noyau FOS prend en charge de nombreux jeux de composants de cartes réseau
    USB (ASIX AX887xx / AX88179, Realtek RTL8152 / RTL8153, et d'autres).

Références sur le forum :

-   [PXE boot with a USB-to-Ethernet adapter](https://forums.fogproject.org/topic/2666/fog-pxe-boot-with-usb-to-ethernet-adapter)
-   [Realtek 8153 USB network adapter](https://forums.fogproject.org/topic/2620/realtek-8153-usb-network-adapter)

### Tablettes Surface et 2-en-1

Les Microsoft Surface et tablettes similaires sont une source récurrente de
bizarreries de PXE et de démarrage (réglages de démarrage du micrologiciel,
carte réseau USB, Secure Boot). Cherchez votre modèle exact sur les forums — par
exemple :

-   [Surface 3 imaging](https://forums.fogproject.org/topic/6227/surface-3-fails-to-image)

## Signaler du matériel

Si vous parvenez à faire fonctionner un appareil (ou si vous êtes bloqué),
publier les détails sur les [forums FOG](https://forums.fogproject.org/) aide à
maintenir l'utilité de la liste communautaire ci-dessus pour tout le monde.
