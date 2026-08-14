---
title: Configuration FOG
aliases:
    - Fog Configuration
    - Fog Config
description: Documentation sur les paramètres de configuration de l'interface web
context_id: config
tags:
    - in-progress
    - management
    - web-management
    - web-ui
    - config
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/config).

# Configuration FOG

il faudrait beaucoup plus de contenu ici

## Multicast Settings

Les réglages situés sous **Paramètres de FOG → Multicast Settings**
déterminent combien de sessions multicast peuvent s'exécuter en même temps, quels
ports et quelles adresses elles utilisent, et combien de temps une session attend
ses clients avant de commencer à transmettre.

`FOG_MULTICAST_PORT_OVERRIDE` en particulier a changé dans FOG 1.6 : il s'agit
désormais d'un pool de ports de base séparés par des virgules, et **chaque port de
la liste correspond à une session pouvant s'exécuter simultanément**. Un port
unique fonctionne toujours et se comporte comme un pool d'un seul élément.

Tout cela est documenté en détail, avec les conséquences en cas de mise à niveau,
sur la page [Sessions multicast](multicast.md).

## Autres réglages

## Mode d'affichage des tableaux (défilement infini ou pagination)

Les tableaux de gestion et d'exportation (Machines, Images, Snapins, etc.)
peuvent parcourir les enregistrements de deux façons, déterminées par un unique
réglage valable pour toute l'installation :

> Other Settings → Paramètres de FOG → FOG View Settings → FOG_TABLE_SCROLL_MODE

- **infinite** *(par défaut)* — défilement virtuel : les lignes se chargent par
  blocs au fil du défilement et il n'y a pas de barre de numéros de page. Idéal
  pour parcourir rapidement de longues listes.
- **paged** — la pagination classique par numéros de page, avec un sélecteur du
  nombre d'éléments par page.

Le réglage s'applique à tous les tableaux de gestion au chargement de page
suivant. Choisissez **paged** si vous préférez les numéros de page, ou si le
défilement infini ne convient pas à votre navigateur ou à votre façon de
travailler.

>[!note]
>Quelques tableaux — comme celui des paramètres de FOG lui-même — utilisent
>toujours la pagination indépendamment de ce réglage, car ils sont regroupés et
>pilotés par la recherche.

## Disposition clavier de l'image de démarrage

Il est possible de changer la disposition clavier (keymap) de l'image de
démarrage Linux. Pour cela, rendez-vous dans :

> Other Settings → Paramètres de FOG → General Settings → FOG_KEYMAP

Vous pouvez dérouler ci-dessous les valeurs possibles ; si le champ est laissé
vide, la valeur par défaut sera **us**.

```
azerty
be-latin1
fr-latin0
fr-latin1
fr-latin9
fr
fr-old
fr-pc
wangbe2
wangbe
ANSI-dvorak
dvorak-l
dvorak
dvorak-r
tr_f-latin5
trf
bg_bds-cp1251
bg_bds-utf8
bg-cp1251
bg-cp855
bg_pho-cp1251
bg_pho-utf8
br-abnt2
br-abnt
br-latin1-abnt2
br-latin1-us
by
cf
cz-cp1250
cz-lat2
cz-lat2-prog
cz
defkeymap
defkeymap_V1.0
dk-latin1
dk
emacs2
emacs
es-cp850
es
et
et-nodeadkeys
fi-latin1
fi-latin9
fi
fi-old
gr
gr-pc
hu101
hypermap.m4
il-heb
il
il-phonetic
is-latin1
is-latin1-us
it2
it-ibm
it
jp106
ko
la-latin1
lt.baltic
lt.l4
lt
mk0
mk-cp1251
mk
mk-utf
nl2
nl
no-latin1.doc
no-latin1
no
pc110
pl2
pl
pt-latin1
pt-latin9
pt
ro
ro_win
ru1
ru2
ru3
ru4
ru-cp1251
ru
ru-ms
ru_win
ru-yawerty
se-fi-ir209
se-fi-lat6
se-ir209
se-lat6
se-latin1
sk-prog-qwerty
sk-qwerty
sr-cy
sr-latin
sv-latin1
tralt
tr_q-latin5
trq
ua
ua-utf
ua-utf-ws
ua-ws
uk
us-acentos
us
croat
cz-us-qwertz
de_CH-latin1
de-latin1
de-latin1-nodeadkeys
de
fr_CH-latin1
fr_CH
hu
sg-latin1-lk450
sg-latin1
sg
sk-prog-qwertz
sk-qwertz
slovene
```

## Cache des paramètres

FOG lit ses paramètres globaux en permanence — à chaque chargement de page et au
sein des services d'arrière-plan. Pour éviter de demander sans cesse les mêmes
valeurs à la base de données, FOG conserve un **cache** de courte durée de ces
paramètres. Vous n'avez normalement jamais à vous en préoccuper : les paramètres
que vous modifiez dans l'interface web prennent effet comme d'habitude, et les
valeurs mises en cache sont automatiquement relues une fois le **TTL** du cache
expiré (5 minutes par défaut).

Vous pouvez inspecter et contrôler le cache en bas de :

> Configuration FOG → Paramètres de FOG

### Consulter le cache

En bas de la page **Paramètres de FOG** figure un relevé du cache en lecture
seule :

| Champ | Signification |
| --- | --- |
| **Keys cached** | Le nombre de paramètres distincts actuellement conservés dans le cache. |
| **Hits / Misses / Queries** | Pour la page que vous consultez : combien de lectures de paramètres ont été servies par le cache (hits) plutôt que par la base de données (misses), et combien de requêtes en base cela a coûté. Un taux de succès élevé signifie que le cache fait son travail. |
| **TTL** | La durée, en secondes, pendant laquelle une valeur mise en cache est considérée comme fiable avant d'être relue depuis la base de données. |
| **Persistent file** | Indique si le fichier de cache partagé entre requêtes existe et quel est son âge. Tant qu'il est présent et récent, un chargement de page est entièrement servi depuis ce fichier, **sans aucune requête en base**. Affiché comme *disabled* uniquement si le cache fichier persistant a été désactivé. |
| **Last flush** | Depuis combien de temps le cache a été vidé pour la dernière fois, tous processus FOG confondus. |
| **Cached keys** | Les noms des paramètres actuellement en cache. |

!!! note
    Les chiffres Hits / Misses / Queries reflètent la **page que vous consultez
    actuellement** — rechargez la page pour prendre un nouvel échantillon. Grâce
    au fichier persistant, un rechargement normal est généralement servi
    entièrement depuis le cache : vous verrez donc le plus souvent **0 requête**,
    alors même que les compteurs sont remis à zéro à chaque chargement de page.
    Seuls les **noms** des paramètres sont affichés ici ; leurs **valeurs** (qui
    peuvent contenir des mots de passe et des jetons d'API) ne sont jamais
    exposées.

!!! warning "Paramètres sensibles"
    Les mots de passe, jetons et autres secrets ne sont **jamais écrits dans le
    fichier de cache persistant** — ils sont toujours lus directement depuis la
    base de données. Ces paramètres-là apparaîtront donc toujours comme une
    requête plutôt que comme un succès de cache, et c'est voulu.

### Vider et rafraîchir

Deux boutons de la page des paramètres de FOG vous permettent de contrôler le
cache à la main :

- **Flush Settings Cache** — écarte les valeurs mises en cache, de sorte que
  chaque paramètre est relu depuis la base de données à la prochaine utilisation.
- **Refresh Settings Cache** — recharge immédiatement tous les paramètres depuis
  la base de données et indique combien ont été chargés.

Ces deux actions émettent un signal inter-processus : **tous** les processus FOG
— l'interface web *et* les services d'arrière-plan — prennent donc en compte le
changement à leur prochaine lecture, et pas seulement le processus qui a traité
votre clic.

!!! tip
    Vous en avez rarement besoin. La principale raison de les utiliser est
    d'avoir modifié un paramètre **en dehors** de l'interface web — par exemple
    directement dans la base de données — et de vouloir que FOG le prenne en
    compte immédiatement plutôt que d'attendre jusqu'à l'expiration du TTL
    (5 minutes). Les modifications faites via l'interface web ne nécessitent
    aucun vidage manuel.

### Automatiser avec l'API

Les mêmes actions sont disponibles via l'API de FOG pour vos scripts. Comme tout
appel à l'API de FOG, elles exigent un `fog-api-token` valide et un
`fog-user-token` autorisé pour l'API :

| Méthode | Point d'accès | Utilité |
| --- | --- | --- |
| `GET` | `/fog/settings/cache` | Renvoie en JSON les statistiques de cache décrites ci-dessus (noms et compteurs uniquement — jamais les valeurs). |
| `POST` | `/fog/settings/cache/flush` | Vide le cache. Renvoie `{"status":"flushed"}`. |
| `POST` | `/fog/settings/cache/refresh` | Recharge tous les paramètres. Renvoie `{"status":"refreshed","count":N}`. |

## Noyau du client FOG

### Vue d'ensemble

Avec FOG, il n'y a pas vraiment de pilotes à trouver et à télécharger pour que
vos clients fonctionnent, car nous livrons un noyau Linux intégrant la majorité
des périphériques matériels. Cela signifie que si vous avez un périphérique qui
ne fonctionne pas avec FOG, vous devez soit compiler vous-même un nouveau noyau,
soit essayer un noyau plus récent publié via notre outil de mise à jour de
noyau.

### Types de noyaux

Nous compilons actuellement deux « lignées » de noyaux. La première s'appelle KS,
pour KitchenSink : ce noyau cherche à inclure les pilotes du plus grand nombre
possible de périphériques, parfois au détriment des performances, et c'est celui
que nous livrons avec FOG par défaut. L'autre « lignée » est le noyau PS, ou
noyau Peter Sykes, fondé sur une configuration proposée par un utilisateur. Cette
lignée cherche à être plus rapide, mais peut inclure moins de pilotes que le
noyau KS.

### Mettre à jour le noyau

Il est possible de mettre à jour le noyau de votre client depuis l'interface de
FOG. Pour cela, procédez comme suit :

-   Connectez-vous à l'interface de gestion FOG.
-   Rendez-vous dans **Other Information**
-   Sélectionnez **Kernel Updates**
-   Sélectionnez le noyau que vous souhaitez télécharger ; les noyaux les plus
    récents se trouvent généralement en haut de la liste.
-   Cliquez sur l'icône de téléchargement
-   Choisissez un nom de fichier pour votre noyau ; pour en faire le noyau par défaut, laissez le nom **bzImage**
       * *!!! tip
	    Si vous lui donnez un autre nom, vous pouvez configurer une machine pour qu'elle l'utilise dans [[hosts#Noyau]]
-   Cliquez sur le bouton **Next**
