---
title: Secure Boot - enrôlement MOK (voies A et B)
aliases:
    - Secure Boot - MOK enrollment
description: Enrôler le certificat Secure Boot de FOG sur un client via MokManager, depuis une clé USB live ou directement depuis le menu de démarrage FOG
context_id: secure-boot-mok-enrollment
tags:
    - how-to
    - secure-boot
    - uefi
    - advanced
    - pki
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/secure-boot-mok-enrollment).

# Secure Boot : enrôlement MOK

Cette page couvre les deux voies d'enrôlement MOK (Machine Owner Key) — toutes
deux se terminent par un humain qui confirme le certificat devant la console, ce
qui constitue la propriété de sécurité recherchée et non une limitation. Si votre
micrologiciel peut être placé en **Setup Mode**, il existe une troisième voie qui
évite complètement la console — voir
[[secure-boot-setup-mode-enrollment|l'enrôlement en Setup Mode]] (FOG 1.6). Pour
les concepts qui sous-tendent tout cela (pourquoi la signature est nécessaire, la
séparation autorité/feuille, ce que « MOK » désigne réellement), commencez par
[[secure-boot-signing|Signature Secure Boot]].

À répéter machine par machine. **Vous n'avez pas besoin de désactiver le Secure
Boot pour cela**, et vous ne devriez pas : les deux voies ci-dessous fonctionnent
en le laissant activé.

L'interface web de FOG comporte une page **Configuration FOG → Secure Boot**.
Elle affiche l'empreinte de votre certificat (SHA-256, ainsi que SHA-1 pour
l'écran « view key » de MokManager — voir
[[pki-glossary#Empreinte (aussi appelée thumbprint)|empreinte]]), propose un petit **kit
d'enrôlement**, et renvoie à ce guide pour les étapes détaillées par client
ci-dessous :

| Fichier | De quoi il s'agit |
| --- | --- |
| `MOK.der` | votre certificat public — c'est lui qui est enrôlé |
| `fog-enroll-mok.sh` | effectue l'enrôlement, vérifie d'abord l'empreinte |
| `fog-enroll-mok.desktop` | lanceur en double-clic pour le script ci-dessus |

Laissez cette page ouverte sur un autre écran — vous allez y comparer
l'empreinte.

## Voie A — une clé USB live Ubuntu ou Debian standard

C'est la voie fiable. Une image live standard démarre déjà avec le Secure Boot
**activé**, en utilisant le shim, GRUB et noyau signés de la distribution : il n'y
a donc rien à signer ni aucun réglage de micrologiciel à modifier.

1. Écrivez une image live Ubuntu ou Debian classique sur une clé USB, par la
   méthode qui vous est habituelle. **Ne la remasterisez pas** — tout l'intérêt
   est qu'un support standard résout déjà le problème du Secure Boot.
2. Copiez les trois fichiers du kit sur la clé, les uns à côté des autres.
3. Démarrez le client dessus, en laissant le Secure Boot activé.
4. Ouvrez la clé dans le gestionnaire de fichiers et lancez
   `fog-enroll-mok.desktop`.

Le script affiche l'empreinte du certificat et vous demande de confirmer qu'elle
correspond à celle de la page web avant de faire quoi que ce soit. Il demande
ensuite un mot de passe à usage unique, deux fois — ce mot de passe n'existe que
pour prouver, après le redémarrage, que la personne au clavier est bien celle qui
a lancé le script. Il n'est pas stocké et n'a pas besoin d'être robuste. Utilisez
le même pour toute une série de machines et vous vous simplifierez la vie.

Redémarrez. La machine s'arrête sur un écran bleu **MOK Manager** au lieu de
démarrer :

1. `Enroll MOK`
2. `View key 0` — vérifiez que le CN est bien le vôtre avant de continuer
3. `Continue`
4. `Yes`
5. Saisissez le mot de passe que vous venez de choisir
6. `Reboot`

Vérifiez ensuite :

```bash
mokutil --list-enrolled | grep -A2 "FOG"
```

## Voie B — depuis le menu de démarrage FOG, sans système d'exploitation ni clé USB

MokManager sait lire un certificat directement depuis un système de fichiers FAT :
une session Linux n'est donc pas nécessaire du tout. Le menu de démarrage comporte
une entrée **Enroll Secure Boot Key** qui vous y conduit directement — et le menu
de démarrage récupère `MOK.der` dans la mémoire d'iPXE avant d'enchaîner vers
MokManager, exactement comme un démarrage réseau ordinaire y place déjà le noyau
FOS et l'initrd. L'explorateur de fichiers de MokManager parcourt cette même
liste d'images en mémoire : le certificat apparaît donc dans `Enroll key from
disk` sans que vous ayez rien à transporter jusqu'à la machine. **Confirmé sur
matériel physique.**

>[!info] L'entrée apparaît d'elle-même
>Elle ne nécessite aucune configuration et s'affiche aussi bien pour les machines
>enregistrées que non enregistrées, car une machine ayant besoin d'un enrôlement
>MOK n'a généralement jamais été enregistrée. Comme toute entrée de menu, elle
>peut être modifiée ou supprimée dans **Configuration FOG → PXE Boot Menu**.

>[!warning] Pourquoi cette entrée de menu existe, plutôt que « démarrer le shim en PXE »
>**Un démarrage PXE ordinaire à travers le shim n'affiche jamais MokManager.** Le
>shim ne passe la main à MokManager que lorsqu'une demande d'enrôlement MOK *en
>attente* existe déjà — normalement préparée par `mokutil --import`, ce que fait
>la voie A. Sans rien de préparé, le shim démarre directement jusqu'à
>`snponly.efi` et l'écran bleu de MokManager n'apparaît jamais, quelle que soit
>votre patience.
>
>L'entrée de menu enchaîne directement vers `secureboot/mmx64.efi`, contournant
>délibérément ce verrou, ce qui rend `Enroll key from disk` accessible sans rien
>avoir préparé.
>
>Vous ne pouvez pas non plus pointer le DHCP directement sur `mmx64.efi` pour
>obtenir le même effet. Il est signé par iPXE, non par Microsoft : le
>micrologiciel — qui contrôle le premier binaire au regard de `db` seul (voir
>[[secure-boot-signing#La chaîne que vous construisez|la chaîne]]) — refusera de le
>lancer. Il ne démarre ici que parce qu'iPXE le charge *via le protocole de
>vérification du shim*, et que le shim fait confiance au certificat d'iPXE.

Vous n'avez pas non plus besoin que le Secure Boot soit **actuellement activé**
pour cela — testé sur matériel physique avec le Secure Boot désactivé, puis
enrôlé, puis réactivé ensuite, sans aucune différence de comportement dans un
sens ou dans l'autre. L'enrôlement par MokManager ne dépend pas de ce que le
micrologiciel applique à cet instant, mais seulement du fait que le shim l'ait
chargé. Vous pouvez donc préparer l'enrôlement sur tout un parc avant même
d'activer le Secure Boot : lancez cette procédure tant qu'il est encore
désactivé, et chaque machine fera déjà confiance à votre clé au moment où
l'application débutera. Vous pouvez aussi laisser le Secure Boot activé sur une
machine neuve, l'enrôler puis l'enregistrer, et vous voilà parti sans avoir eu à
toucher aux réglages de Secure Boot.

1. Démarrez le client en PXE normalement — Secure Boot activé ou non, cela ne
   change rien à cette étape.
2. Choisissez **Enroll Secure Boot Key** — depuis le menu de démarrage, ou depuis
   une tâche planifiée sur la machine ou sur un groupe via **Task Scheduling**,
   ce qui enchaîne exactement le même déroulé sans que vous ayez à retrouver
   l'entrée de menu sur chaque machine (voir l'astuce ci-dessous). FOG récupère
   `MOK.der` en mémoire, puis passe la main à MokManager.
3. `Enroll key from disk`.
4. Choisissez `MOK.der` dans la liste — il y figure déjà.
   >[!warning] S'il n'est pas listé
   >Il n'est pas confirmé que toutes les combinaisons micrologiciel/MokManager
   >exposent un fichier simplement récupéré par `imgfetch` de la même façon
   >qu'elles exposent un noyau ou un initrd. Repliez-vous sur une clé USB
   >formatée en FAT contenant `MOK.der` (issu du kit d'enrôlement) — il
   >apparaîtra dans le même explorateur, comme le fait la clé de la voie A.
5. `Continue` → `Yes`. Vérifiez que le CN est bien le vôtre, **et comparez
   l'empreinte affichée par MokManager à celle de la page Secure Boot de FOG
   avant de confirmer** — la distribution automatique supprime l'assurance du
   « c'est moi qui ai transporté ce fichier » que la clé USB de la voie A vous
   donne encore, cette comparaison compte donc davantage ici, et non moins.
6. `Reboot`. Aucune clé à retirer.

>[!warning] MokManager expire de lui-même — deux fois
>Aucun de ces deux délais n'est contrôlé ou modifiable par FOG :
>
>- Si vous n'appuyez sur aucune touche dans les **10 secondes** environ suivant
>  l'apparition de l'écran, MokManager cesse d'attendre et poursuit le démarrage
>  normalement — en sautant silencieusement l'enrôlement. Soyez devant la console
>  *avant* de sélectionner l'entrée de menu ou de planifier la tâche, et non
>  après.
>- Une fois dans l'outil, un **délai d'inactivité de quelques minutes** redémarre
>  la machine si vous cessez de répondre en cours de route. Terminez la procédure
>  une fois commencée ; ne vous éloignez pas au milieu d'un enrôlement.

>[!note] Pourquoi l'empreinte n'est pas vérifiée automatiquement
>iPXE pourrait en principe calculer l'empreinte du fichier qu'il vient de
>récupérer et la comparer à une valeur servie par ce même serveur — mais cette
>valeur emprunterait exactement le même chemin réseau non authentifié que le
>fichier lui-même, de sorte que quiconque peut substituer l'un peut tout aussi
>facilement substituer l'autre. L'empreinte figurant sur la page Secure Boot de
>FOG est le véritable contrôle : vous la lisez sur un écran distinct et déjà
>digne de confiance avant de confirmer dans MokManager. Cette comparaison
>manuelle est ici la frontière de sécurité, et ce n'est pas quelque chose
>qu'iPXE puisse faire à votre place.

Le client fait désormais confiance à votre clé et démarrera le noyau FOS signé
lors de son prochain démarrage PXE. Contrairement à la voie A, il n'y a pas
d'étape de mot de passe à usage unique, puisque vous êtes déjà devant la machine
au moment de l'enrôlement.

>[!tip] Poussez-le comme une tâche plutôt que de chercher l'entrée de menu
>« Enroll Secure Boot Key » est aussi un type de tâche, planifiable depuis
>**Task Scheduling** sur une machine isolée ou sur tout un groupe, exactement
>comme vous planifieriez un déploiement ou une capture. Une machine ayant cette
>tâche en attente saute complètement le menu de démarrage interactif et enchaîne
>directement le déroulé ci-dessus à son prochain démarrage PXE — utile pour
>pousser l'enrôlement sur de nombreuses machines sans expliquer à un technicien
>quelle entrée de menu choisir sur chacune. L'étape finale `Enroll key from
>disk` → `Yes` doit toujours avoir lieu devant la console ; rien ne supprime
>cela.

>[!tip] Quelle voie choisir
>Si le micrologiciel peut être placé en Setup Mode,
>**[[secure-boot-setup-mode-enrollment|l'enrôlement en Setup Mode]] est celui qui
>passe à l'échelle** — c'est la seule voie qui ne se termine pas par un humain
>appuyant sur des touches devant chaque machine. Là où il n'est pas disponible,
>la voie B comporte bien moins de pièces mobiles et, depuis la distribution par
>le réseau décrite plus haut, n'exige ni image live ni clé USB — essayez-la en
>premier si vous êtes de toute façon devant la machine. La voie A est le repli :
>`Enroll key from disk` se bloque, d'après certains retours, sur certains
>micrologiciels, et une clé USB live standard contourne entièrement ce problème
>en utilisant le shim de la distribution. Si vous devez enrôler avant même
>qu'une machine puisse joindre le serveur FOG, la voie A fonctionne également
>avec une simple clé USB.

>[!note] Clients arm64
>L'entrée de menu sert automatiquement le MokManager correspondant —
>`mmx64.efi` pour x86-64 et `arm64-efi/mmaa64.efi` pour arm64 — d'après
>l'architecture annoncée par le client au démarrage. Il n'y a rien à
>sélectionner.

>[!danger] Si MokManager n'apparaît pas
>Vérifiez que vous avez bien choisi **`Enroll Secure Boot Key`** et non une
>entrée de démarrage ordinaire. Démarrer normalement à travers le shim
>n'affichera pas MokManager : cela exige qu'une demande MOK *en attente* ait été
>préparée au préalable, ce que cette voie ne fait pas. Que le Secure Boot soit
>activé ou non n'est pas non plus en cause — cette voie enchaîne directement vers
>MokManager et a été confirmée fonctionnelle dans les deux états. Si l'écran est
>apparu puis avait disparu lorsque vous avez regardé, vous avez probablement
>manqué le délai de démarrage d'environ 10 secondes propre à MokManager — voir
>l'avertissement ci-dessus — plutôt qu'un problème de configuration.

## Retirer une clé d'une machine

Pour retirer la confiance accordée à un certificat sur une seule machine, sans
toucher au serveur :

```bash
mokutil --delete MOK.der
```

puis redémarrez et confirmez dans MokManager, exactement comme pour
l'enrôlement.

## Vérifié

Ces étapes ont été exécutées de bout en bout avec le Secure Boot actif, jusqu'à
un déploiement mené à son terme — **confirmé sur matériel physique** :

```
firmware (Secure Boot on, Microsoft certificates in db)
  └─ secureboot/snponly-shimx64.efi
      └─ secureboot/snponly.efi        ← shim rewrote its own filename to find it
          └─ secureboot/autoexec.ipxe → default.ipxe → boot.php
              └─ bzImage (leaf-signed)  ← LoadImage() consulted MokList, chained to the CA, accepted it
                  └─ FOS → partclone → 42 GB deployed, Task Complete
```

Cela vaut la peine d'être dit, car un lecteur pourrait raisonnablement craindre
le contraire : **aucune commande `shim` dans le script de démarrage ni aucune
gestion de `ShimRetainProtocol` n'ont été nécessaires.** Le shim s'installe
lui-même comme l'autorité que consultent les appels ultérieurs à `LoadImage()`,
et cela subsiste jusque dans iPXE tout seul — de sorte que lorsqu'iPXE charge le
noyau, le contrôle se fait au regard de MokList plutôt qu'en se rabattant sur le
`db` du micrologiciel. C'est sur cette hypothèse que repose toute l'approche MOK,
et elle se vérifie.

Les binaires signés que FOG met en place sont, octet pour octet, ceux utilisés
lors de cette exécution.

**La voie B a également été exécutée de bout en bout depuis**, sur un client dont
le micrologiciel n'accordait sa confiance qu'aux certificats de Microsoft — aucun
MOK enrôlé, c'est-à-dire l'état d'une machine avant qu'elle n'ait jamais
rencontré votre serveur FOG. Cette exécution a également confirmé le mécanisme de
distribution réseau décrit plus haut, **sur matériel physique** :

```
PXE boot → FOG menu → Enroll Secure Boot Key
  └─ imgfetch MOK.der over the network into iPXE's memory
      └─ secureboot/mmx64.efi          ← chained through shim, not the firmware
          └─ Enroll key from disk → MOK.der already listed → reboot
              └─ PXE boot again → bzImage now accepted → FOS
```

Le détail à connaître est que MokManager est chargé *via le shim*, et non par le
micrologiciel. `mmx64.efi` porte la signature d'iPXE, pas celle de Microsoft : le
micrologiciel refuserait donc de le lancer directement — mais c'est le protocole
de vérification du shim qui prend réellement en charge le chargement, et le shim
lui fait confiance. C'est le même mécanisme qui permet à un noyau signé par MOK
de démarrer : si l'un fonctionne, l'autre aussi.

Ce même client a également confirmé que l'enrôlement n'exige pas que le Secure
Boot soit activé à ce moment-là : enrôler avec le Secure Boot désactivé puis le
réactiver ensuite n'a produit aucune différence de comportement par rapport à un
enrôlement effectué en le laissant activé du début à la fin.

## Voir aussi

- [[secure-boot-signing|Signature Secure Boot]] — commencez ici pour les concepts
- [[secure-boot-setup-mode-enrollment|Enrôlement en Setup Mode]] — l'alternative sans intervention, réservée à FOG 1.6
- [[secure-boot-technical-details|Secure Boot : détails techniques]]
- [[pki-zones|Les zones de certificats de FOG]]
- [[pki-glossary|Glossaire PKI et Secure Boot]]
