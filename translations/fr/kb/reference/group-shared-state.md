---
title: État partagé d'un groupe
description: Décrit les nouveautés de FOG 1.6 concernant l'état des groupes
context_id: group-shared-state
aliases:
    - Group Shared State
    - Group State
tags:
    - 1_6-changes
    - groups
    - group-management
    - configuration
    - management
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/group-shared-state).

# État partagé d'un groupe

Un **groupe** ne possède aucun réglage en propre — il n'est qu'une grille de
lecture de ses **machines membres**. La page d'édition d'un groupe *déduit* donc
ce qu'elle affiche de l'union de ses membres, afin qu'un administrateur puisse
voir ce que les machines ont déjà en commun avant de modifier quoi que ce soit.

> **Deux sortes d'état partagé :**
> 1. **Associations** (snapins, imprimantes, modules) — une machine *possède* ou
>    non l'élément, ce qu'indique une case à cocher à trois états :
>    **Toutes / Certaines / Aucune** des machines membres le possèdent.
> 2. **Valeurs de configuration** (Active Directory, déconnexion automatique,
>    champs de noyau et généraux, imprimante par défaut) — une machine détient
>    une *valeur*, affichée sous forme d'indication atténuée **`Hosts: …`** : la
>    valeur commune lorsque tous les membres s'accordent, ou `(varies)`
>    lorsqu'ils diffèrent.
>
> Agir sur un groupe pousse toujours vers **toutes** les machines membres — mais
> les champs de configuration sont **sans écrasement** : un champ vide laisse la
> valeur de chaque machine intacte, de sorte que vous ne modifiez que ce que
> vous voulez.

---

## Table des matières

- [Associations (trois états)](#associations-trois-états)
  - [Ce que « le possède » signifie](#ce-que--le-possède--signifie)
  - [Le badge et le détail Possèdent/Ne possèdent pas](#le-badge-et-le-détail-possèdentne-possèdent-pas)
  - [Basculer](#basculer)
- [Valeurs de configuration (indications partagées)](#valeurs-de-configuration-indications-partagées)
  - [La convention sans écrasement](#la-convention-sans-écrasement)
  - [Active Directory](#active-directory)
  - [Déconnexion automatique](#déconnexion-automatique)
  - [Champs généraux](#champs-généraux)
  - [Imprimante par défaut](#imprimante-par-défaut)
- [Hors périmètre](#hors-périmètre)

---

## Associations (trois états)

Les onglets **Snapins**, **Imprimantes** et **Modules** affichent chacun tous les
éléments avec une case à cocher de couverture :

| État | Case à cocher | Signification |
|-------|----------|---------|
| **Toutes** | cochée | toutes les machines membres possèdent l'élément |
| **Certaines** | indéterminée | au moins une machine, mais pas toutes, le possèdent |
| **Aucune** | décochée | aucune machine ne le possède |

Un badge **`n / total`** est placé à côté de chaque case à cocher (par exemple
`5 / 15`).

### Ce que « le possède » signifie

- **Snapins, imprimantes** — une machine « le possède » lorsque la ligne
  d'association existe. L'indicateur **par défaut** de l'imprimante
  (`paIsDefault`) est ignoré ici ; il s'agit d'une *valeur* partagée distincte
  (voir [Imprimante par défaut](#imprimante-par-défaut)).
- **Modules** — une machine n'est comptée que lorsque le module est **activé**
  (`moduleStatusByHost.msState = 1`). Une désactivation locale fait passer
  l'élément de *Toutes* à *Certaines*. Cette asymétrie est délibérée (voir
  `docs/adr/0001`) : afficher un module comme « toutes les machines le
  possèdent » alors que certaines l'ont désactivé serait trompeur.

### Le badge et le détail Possèdent/Ne possèdent pas

Cliquer sur le badge déploie, à la demande, une ligne listant pour cet élément
précis :

- **Machines qui le possèdent (n)** — les machines membres qui le possèdent, et
- **Machines qui ne le possèdent pas (n)** — les machines membres qui ne le
  possèdent pas.

L'ensemble *qui ne le possèdent pas* correspond exactement à ce qu'une poussée
vers toutes les machines modifiera. Les listes sont récupérées élément par
élément, afin que les grands groupes restent réactifs.

### Basculer

Cliquer sur la case à cocher agit sur **toutes** les machines membres :

```
None  --click-->  All        (add to every host)
Some  --click-->  All        (add to the hosts that lack it; modules flip
                              a disabled override back to enabled)
All   --click-->  None       (remove from every host)
```

Un élément indéterminé se résout donc d'abord en *Toutes* ; le retrait
destructeur sur toutes les machines n'intervient qu'au second clic, en passant
par l'état coché.

---

## Valeurs de configuration (indications partagées)

Les champs de configuration propres à chaque machine affichent une indication
atténuée sous le contrôle :

| Indication | Signification |
|------|---------|
| `Hosts: bzImage (all)` | toutes les machines membres détiennent cette valeur |
| `Hosts: (varies)` | les machines membres diffèrent |
| `Hosts: (empty on all)` | aucune des machines n'a de valeur |

Cette indication est **purement informative** — elle ne préremplit jamais le
champ de saisie.

### La convention sans écrasement

Enregistrer un onglet de configuration de groupe pousse la valeur vers toutes
les machines membres, mais :

- **Champ vide** → laisse la valeur de chaque machine **inchangée** (pas
  d'écrasement).
- La valeur littérale **`NULL`** (insensible à la casse) → **efface** le champ
  sur toutes les machines.
- **Toute autre valeur** → pousse cette valeur vers toutes les machines.

C'est ce qui vous permet, par exemple, de définir un argument de noyau pour tout
un groupe sans effacer tous les autres champs propres à chaque machine.

### Active Directory

- **La jonction au domaine** est une liste à trois états : **No change**
  (laisser l'état de jonction de chaque machine intact), **Enable on all**, ou
  **Disable on all**.
- Le domaine, l'unité organisationnelle et le nom d'utilisateur suivent la
  convention sans écrasement ci-dessus. Le substitut de 32 astérisques du mot de
  passe signifie « inchangé ».
- Choisir **Enable on all** remplit les champs vides à partir des valeurs AD par
  défaut de FOG (comme sur la page d'une machine) — uniquement lorsque vous le
  choisissez, jamais simplement à partir de l'état existant.
- Un récapitulatif **Current member-host AD state** indique, au-dessus du
  formulaire, l'uniformité de la jonction, du domaine, de l'unité
  organisationnelle et du nom d'utilisateur.

### Déconnexion automatique

Vide par défaut (le minimum global n'est affiché qu'en texte indicatif). Un
enregistrement avec un champ vide laisse la déconnexion automatique de chaque
machine intacte ; un nombre est poussé vers toutes (en dessous de cinq minutes,
la fonction est désactivée). L'indication se lit `Hosts: N min (all)`,
`(varies)` ou `(default on all)`.

### Champs généraux

Le noyau, les arguments du noyau, l'init, le disque principal, la sortie
BIOS/EFI et la clé de produit portent chacun une indication `Hosts: …`. Les
champs noyau, arguments, init et disque sont préremplis à partir du **modèle
propre au groupe** (le groupe les stocke) ; l'indication rend compte de l'état
des *membres*, indépendamment. La poussée respecte toujours la convention sans
écrasement.

### Imprimante par défaut

Le sélecteur **Default** des imprimantes affiche une indication
`Hosts default: <printer> (all)`, `(varies)` ou `(none on all)`. Définir une
imprimante par défaut est une action explicite qui ne touche que les machines
membres auxquelles cette imprimante est associée.

### Forcer le redémarrage pour le nom de machine / la jonction AD

Une liste à trois états — **No change / Enable on all / Disable on all** — avec
une indication `Hosts: enabled (all) / disabled (all) / (varies)`. *No change*
laisse chaque machine intacte. (Stocké dans la colonne `hostEnforce`
`enum('0','1')`, écrit sous forme de chaîne — transmettre un entier indexerait
l'énumération au lieu de correspondre à sa valeur.)

---

## Hors périmètre

- **Le redémarrage forcé** est un réglage global (`FOG_TASK_FORCE_REBOOT`) et
  une option par tâche, non une configuration propre à chaque machine : il n'a
  donc pas de contrôle d'état partagé au niveau du groupe.
