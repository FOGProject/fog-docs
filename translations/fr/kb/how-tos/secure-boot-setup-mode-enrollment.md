---
title: Secure Boot - enrôlement en Setup Mode (voie C)
aliases:
    - Secure Boot - Setup Mode enrollment
    - Setup Mode enrollment
description: Enrôler le certificat Secure Boot de FOG sans intervention, en écrivant directement dans les bases db/KEK/PK de l'UEFI, sans personne devant la console
context_id: secure-boot-setup-mode-enrollment
tags:
    - how-to
    - secure-boot
    - uefi
    - advanced
    - pki
    - 1_6-changes
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/secure-boot-setup-mode-enrollment).

# Secure Boot : enrôlement en Setup Mode

>[!info] FOG 1.6
>Cette page est un ajout de FOG 1.6. Sur les versions antérieures, utilisez
>plutôt [[secure-boot-mok-enrollment|l'enrôlement MOK]] — il exige un humain
>devant la console, mais fonctionne partout.

De nombreux micrologiciels prennent en charge le **Setup Mode** — un état qui
permet d'écrire des certificats directement dans la base de confiance propre à
l'UEFI (`PK`, `KEK`, `db`), en contournant entièrement shim et MokManager.
C'est la voie C :
[[secure-boot-mok-enrollment|les voies A et B]] se terminent toutes deux par un
humain qui appuie sur des touches, car l'enrôlement MOK est *conçu* pour en
exiger un. La voie C contourne cela en n'utilisant pas du tout le MOK : si la
plateforme est en Setup Mode, le système d'exploitation en cours d'exécution
peut écrire directement les véritables bases Secure Boot, et FOS le fait sans
intervention.

Pour les concepts qui sous-tendent tout cela (pourquoi la signature est
nécessaire, la séparation autorité/feuille), commencez par
[[secure-boot-signing|Signature Secure Boot]].

## Mise en œuvre

Planifiez la tâche **Enroll Secure Boot Key** exactement comme dans
[[secure-boot-mok-enrollment#route-b-from-the-fog-boot-menu-no-operating-system-and-no-usb-stick|la voie B]].
FOS décide seul de la voie à emprunter — il lit l'état du micrologiciel au
démarrage et n'emprunte ce chemin que s'il trouve le Setup Mode. Tout autre cas
se rabat sur la préparation d'une demande MOK : planifier la tâche sur un parc
hétérogène est donc sans risque.

Ce qu'il écrit, dans cet ordre et pas un autre :

| Variable | Contenu |
| --- | --- |
| `db` | Les cinq autorités de certification publiées par Microsoft **plus** votre certificat `CN=FOG Project Secure Boot Signing` |
| `KEK` | Les deux autorités KEK de Microsoft plus la clé d'échange de clés (Key Exchange Key) de ce serveur |
| `PK` | La clé de plateforme (Platform Key) de ce serveur, seule |

L'ordre est déterminant. C'est l'écriture de `PK` qui fait *sortir* la
plateforme du Setup Mode, et toute écriture postérieure doit porter une
signature que le micrologiciel vérifie — `PK` passe donc en dernier. FOS
récupère également les trois blocs avant d'en écrire le moindre, de sorte qu'un
incident du serveur web ne puisse pas laisser une machine à moitié enrôlée, et
il s'interrompt à la première erreur plutôt que d'aller jusqu'à l'écriture qui
referme la porte. Une exécution qui échoue en cours de route laisse la
plateforme toujours en Setup Mode, démarrant toujours n'importe quoi,
exactement telle qu'elle a été trouvée.

`db.auth` embarque l'**autorité de certification Secure Boot** — l'intermédiaire,
pas la feuille de signature — aux côtés des certificats de Microsoft, ce qui
rend le renouvellement de la feuille tout aussi sûr pour les clients enrôlés en
Setup Mode que pour ceux enrôlés par MOK. Voir
[[pki-zones#secure-boot|Secure Boot]] pour comprendre l'importance de cette
séparation.

Le succès est confirmé par le passage de `SetupMode` de 1 à 0 — le
micrologiciel a accepté la `PK`. Notez que `SecureBoot` reste à 0 jusqu'au
démarrage suivant, quoi qu'il arrive, car le micrologiciel calcule cette valeur
pendant le POST.

>[!warning] Les certificats de Microsoft sont dans ce `db` à dessein
>Il est tentant de comprendre « votre propre `db` de confiance » comme
>« uniquement votre certificat ». Retirer les autorités de Microsoft casse
>Windows — et casse FOG, car le shim en tête de votre propre chaîne de démarrage
>est signé par Microsoft. Un `db` sans elles, c'est une machine qui ne démarre
>plus en PXE.

>[!note] Ce qui exige encore un humain
>*Entrer* en Setup Mode suppose d'effacer la `PK` depuis l'écran du
>micrologiciel, et réactiver ensuite le Secure Boot est également un réglage du
>micrologiciel. Ni l'un ni l'autre n'est accessible depuis un système
>d'exploitation en cours d'exécution, par conception. La voie C troque donc
>« une visite avec une clé USB amorçable, ou des appuis de touches dans
>MokManager » contre « une visite dans le micrologiciel » — l'avantage étant que
>la partie micrologiciel est scriptable via l'outillage des constructeurs (Dell
>`cctk`, Redfish), ce que les voies A et B n'ont jamais permis, et qu'une fois
>faite elle est permanente.

>[!danger] La tâche ne peut pas s'exécuter sur une machine qui applique déjà le Secure Boot
>iPXE 2.0.0 vérifie à la fois le noyau *et* l'initrd via shim. Sur une machine où
>le Secure Boot est actif et où votre certificat n'est pas encore approuvé, les
>deux sont refusés — `Verification failed: Security Policy Violation` — de sorte
>que FOS ne démarre jamais et qu'aucune tâche, quelle qu'elle soit, ne s'exécute.
>C'est une propriété de la chaîne de démarrage, pas de la tâche d'enrôlement. Le
>Secure Boot doit être désactivé, ou la plateforme en Setup Mode, pour que la
>machine aille assez loin pour s'enrôler.

## Prérequis

- **Version de FOS `20260804` ou plus récente.** Les inits antérieurs n'ont pas
  `fog.enrollsb`.
- **`efitools` sur le serveur.** L'installeur l'installe et construit
  automatiquement les mises à jour de variables signées (`PK.auth`, `KEK.auth`,
  `db.auth`, via `cert-to-efi-sig-list`, `sign-efi-sig-list`, `efi-updatevar`).
  S'il est absent, l'installeur le signale et saute leur construction —
  l'enrôlement se rabat alors sur les voies MOK plutôt que d'échouer en
  silence.
- **FOG 1.6.** Les blocs ne sont publiés dans
  `<web-root>/service/secureboot/{db,KEK,PK}.auth` que par l'installeur 1.6. FOS
  est commun aux versions 1.5 et 1.6 : un serveur 1.5 livre donc un init qui
  *possède* `fog.enrollsb` — le chemin de préparation MOK y fonctionne toujours,
  mais la voie C ne le peut pas, faute de blocs `.auth` à récupérer.

>[!warning] `efitools` n'est pas fiable sur EL9 — vérifiez avant d'y compter
>C'est une dépendance déclarée et elle s'installe normalement sur
>Debian/Ubuntu. Sur EL9 : sur une machine de test CentOS Stream 9, elle est
>indisponible même avec EPEL *et* CRB activés, et rien d'autre ne fournit
>`sign-efi-sig-list`/`cert-to-efi-sig-list` — le suivi des RPM en amont ne liste
>que des branches Fedora, sans aucune ligne EL9/EPEL. Elle est néanmoins
>présente et fonctionnelle sur au moins un serveur FOG Rocky 9, sans que son
>origine ait été établie. Seuls les trois outils en espace utilisateur sont
>nécessaires, et ils se compilent depuis les sources en une minute environ si
>votre distribution ne les empaquette pas :
>
>```bash
>dnf -y install gcc make openssl-devel git gnu-efi-devel
>git clone --depth 1 \
>    https://git.kernel.org/pub/scm/linux/kernel/git/jejb/efitools.git
>cd efitools
>make cert-to-efi-sig-list sign-efi-sig-list efi-updatevar
>install -m 0755 cert-to-efi-sig-list sign-efi-sig-list efi-updatevar /usr/bin/
>```
>
>`gnu-efi-devel` est requis même pour les outils en espace utilisateur — ils
>incluent `efi.h`. Les binaires EFI (`KeyTool.efi` et consorts) ne sont pas
>nécessaires.

Les clés `PK`, `KEK` et de signature du serveur sont générées une fois et **ne
sont jamais régénérées** lors des installations ultérieures. Les blocs `.auth`
sont reconstruits à chaque installation, mais à partir de ces mêmes clés :
relancer l'installeur n'invalide donc pas les machines déjà enrôlées.

L'enrôlement MOK via MokManager fonctionne exactement de la même façon, que le
Setup Mode soit utilisé ou non — ce sont deux voies d'enrôlement indépendantes
pour la même autorité de certification Secure Boot, et non des alternatives qui
s'opposent. Confirmé sur du matériel UEFI réel : les machines démarrent les
noyaux signés par la feuille de FOG tout en n'approuvant que l'intermédiaire,
que celui-ci ait été enrôlé sous forme de `MOK.der` via MokManager ou écrit dans
`db` par ce chemin. Cette vérification est antérieure à l'extension de
contraintes de nom que porte désormais l'autorité Secure Boot — reconfirmez sur
matériel avant de vous y fier, et utilisez `--no-sb-name-constraints` (voir
[[pki-zones#name-constraints|Contraintes de nom]]) si un parc rejette la chaîne.

>[!note] État de la validation
>La voie C a été validée de bout en bout sous VirtualBox : Setup Mode → la tâche
>se termine sans intervention → le micrologiciel détient exactement les
>certificats du tableau ci-dessus → Secure Boot réactivé → cette même machine
>démarre en PXE la chaîne signée de FOG et s'image normalement. La validation
>modèle par modèle sur du micrologiciel *physique* reste à faire, et une erreur
>à ce niveau n'est pas réversible depuis le système d'exploitation — elle exige
>un passage par le micrologiciel. Traitez la première machine de chaque modèle
>comme un test.
>
>Si vous avez validé cela sur du micrologiciel physique, merci de le confirmer —
>en bien ou en mal — par une pull request sur cette page (une modification en
>ligne depuis GitHub convient) ou par un message sur les
>[forums FOG](https://forums.fogproject.org/).

## Voir aussi

- [[secure-boot-signing|Signature Secure Boot]] — commencez ici pour les concepts
- [[secure-boot-mok-enrollment|Enrôlement MOK]] — l'alternative avec un humain devant la console, valable sur toutes les versions
- [[secure-boot-technical-details|Secure Boot : détails techniques]]
- [[pki-zones|Les zones de certificats de FOG]]
- [[pki-glossary|Glossaire PKI et Secure Boot]]
