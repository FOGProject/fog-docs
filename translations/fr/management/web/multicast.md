---
title: Sessions multicast
aliases:
    - Multicast
    - Multicast Sessions
    - Multicast Deploy
description: Fonctionnement des sessions multicast de FOG, façon dont les clients les rejoignent, configuration des sessions simultanées et mise en œuvre du multicast sur plusieurs sites
context_id: multicast
tags:
    - 1_6-changes
    - management
    - web-management
    - web-ui
    - tasks
    - multicast
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/multicast).

# Sessions multicast

## Vue d'ensemble

Une session multicast déploie une seule image sur de nombreuses machines en même
temps. Au lieu d'envoyer une copie distincte à chaque client, le serveur exécute
un unique processus `udp-sender` qui transmet l'image une seule fois, et chaque
client qui la reçoit écrit le même flux sur son disque.

Cette transmission unique est tout l'intérêt du procédé, et c'en est aussi la
contrainte : une machine qui arrive après le début de la transmission ne peut pas
recevoir la partie qu'elle a manquée. Tout ce qui suit en découle.

## Créer une session

Il existe trois façons d'en lancer une.

**Depuis la Gestion des images** — crée une session *nommée* que d'autres
machines peuvent rejoindre par son nom. Vous lui donnez un nom, le nombre de
clients attendus et la durée d'attente. C'est le choix habituel lorsque vous
imagez une salle et souhaitez que les machines rejoignent la session au fur et à
mesure de leur démarrage.

**Depuis une machine ou un groupe** — crée une session pour exactement ces
machines. Le lancement par groupe est le cas courant : toutes les machines du
groupe sont ajoutées d'emblée, il ne reste donc personne à attendre.

**Depuis une machine en cours de démarrage** — une machine dans le menu de
démarrage peut rejoindre une session par son nom et, si aucune session ne porte
ce nom, elle peut en créer une. FOG pose deux questions au préalable :

- *Clients attendus, celui-ci compris* — le nombre de machines qui recevront
  l'image.
- *Minutes d'attente avant le démarrage* — la durée pendant laquelle la session
  reste ouverte.

Les deux réponses sont obligatoires. Une session sans effectif attendu ne peut
être rejointe par son nom par personne d'autre : en créer une sans ces réponses
produirait donc une session qui n'image jamais que la machine qui l'a créée.

!!! note
    Créer une session depuis une machine en cours de démarrage exige un compte
    détenant la permission `task.task`, la même que celle nécessaire pour créer
    des tâches partout ailleurs. Voir [Rôles et permissions](roles.md).

## Rejoindre une session

Une machine rejoint une session en sélectionnant l'option de participation au
multicast dans le menu de démarrage, en s'identifiant, puis en saisissant le nom
de la session.

La session reste ouverte aux nouvelles machines jusqu'au démarrage effectif de la
transmission, qui a lieu dès que **l'une des deux conditions suivantes** est
remplie :

- tous les clients attendus ont rejoint la session, **ou**
- le délai d'attente a expiré.

Ensuite, la session est fermée et une machine qui tente de la rejoindre se voit
répondre que la session a déjà commencé. C'est délibéré. Auparavant, une machine
en retard était autorisée à rejoindre la session, ne recevait que la fin de
l'image, et son déploiement était malgré tout signalé comme réussi.

Si vous faites une faute de frappe dans le nom de la session, FOG propose de
créer une session portant ce nom plutôt que de vous faire quitter le menu.
Répondez `0` à la question sur le nombre de clients attendus pour revenir en
arrière et saisir de nouveau le nom.

## Surveiller une session

Les sessions actives apparaissent sous **Gestion des tâches → Tâches Multicast
actives**, et sous **Gestion des images →
Multicast** pour les sessions nommées.

La colonne des clients indique **rejoints / attendus** — par exemple `7 / 30`
signifie que sept machines se sont manifestées sur les trente que la session
attend. Un tiret à la place du nombre attendu signifie que la session a été créée
sans effectif attendu, ce qui est normal pour les sessions de machine et de
groupe.

Davantage de détails sont disponibles sur le client lui-même avec
[ctl]+[alt]+f2, et le serveur conserve un journal par session dans
`/opt/fog/log`.

## Multicast sur plusieurs sites

Une session est servie par exactement **un** `udp-sender`, et ce processus
s'exécute sur le nœud maître du groupe de stockage de la session. Par ailleurs,
le trafic multicast ne traverse ordinairement ni un routeur, ni une liaison WAN,
ni un VPN site à site.

Rapprochez ces deux faits et la règle en découle : **le flux n'atteint que les
machines qui partagent un réseau avec le nœud maître du groupe.** Les machines
situées sur tout autre site parviennent à l'écran gparted et y attendent une
transmission qui ne peut pas arriver, jusqu'à l'expiration du délai d'attente.

Disposer d'un nœud de stockage sur chaque site ne suffit pas en soi. Les nœuds
qui ne sont pas maîtres ne transmettent pas — ils détiennent une réplique de
l'image, ce qui fait fonctionner l'imagerie *unicast* en local, et c'est
pourquoi l'unicast peut sembler parfait pendant que le multicast reste bloqué.

### Ce qu'il faut configurer

Donnez à chaque site **son propre groupe de stockage** :

1. Créez un groupe de stockage par site.
2. Faites du nœud de ce site le **maître** de son propre groupe.
3. Associez l'image à **tous** les groupes. Le nœud de chaque site doit
   physiquement détenir le fichier image, sans quoi son émetteur n'a rien à
   transmettre.
4. Installez le greffon **Location**, créez un emplacement par site pointant vers
   le groupe de ce site, et affectez chaque machine à son emplacement.
5. Vérifiez que `FOGMulticastManager` s'exécute sur chaque nœud.

Les machines de chaque site obtiennent alors leur propre session — son propre
port, son propre émetteur local — et chaque site s'image à la vitesse de son
réseau local.

!!! note
    Lancez le multicast **site par site** plutôt que comme une tâche unique
    couvrant plusieurs sites. Une session patiente jusqu'à ce que son effectif de
    clients attendus soit atteint : une session unique couvrant tous les sites
    ferait donc attendre à l'émetteur de chaque site les machines des autres sites
    avant de démarrer.

!!! warning "Avant FOG 1.6"
    Le multicast inter-sites ne pouvait pas être obtenu par la seule
    configuration. Une session était toujours estampillée avec le groupe de
    stockage *primaire* de l'image, où que se trouve la machine : seul le maître
    de ce groupe transmettait donc, et le greffon Location n'était pas consulté au
    moment du lancement des tâches. Réorganiser les groupes de stockage sur une
    version antérieure n'y changera rien. Si vous êtes en 1.5 ou antérieur,
    cantonnez le multicast au site qui héberge le maître et utilisez l'unicast
    ailleurs.

## Réglages

Tous ces réglages se trouvent sous **Configuration FOG → Paramètres de
FOG → Multicast Settings**.

### FOG_MULTICAST_PORT_OVERRIDE

Les ports de base que FOG peut utiliser pour le multicast, sous forme de liste
séparée par des virgules :

```
63100,63200,63300
```

**Chaque port de la liste correspond à une session pouvant s'exécuter
simultanément.** L'exemple ci-dessus autorise trois sessions concurrentes. Une
session utilise le port que vous indiquez ainsi que celui immédiatement au-dessus
de lui : les ports doivent donc être pairs et compris entre 1024 et 65534 ; tout
le reste de la liste est ignoré.

Laissez la valeur à `0` (celle par défaut) pour laisser FOG choisir
automatiquement un port pour chaque session.

!!! warning
    Ce réglage était autrefois un port unique, auquel toutes les sessions étaient
    contraintes — le définir revenait donc à n'autoriser réellement qu'une seule
    session multicast, une seconde entrant silencieusement en conflit avec la
    première. Si vous avez aujourd'hui un port unique défini, cela continue de
    fonctionner : il s'agit simplement d'un pool d'un seul élément. Ajoutez
    d'autres ports pour autoriser davantage de sessions simultanées.

### FOG_MULTICAST_MAX_SESSIONS

Le nombre maximal de sessions multicast autorisées à s'exécuter simultanément.
Tenter d'en créer une au-delà de la limite échoue avec un message plutôt que de
démarrer une session qui ne peut pas fonctionner.

!!! note
    Cette limite n'était autrefois vérifiée que lors de la création d'une session
    depuis la Gestion des images — les sessions créées depuis une machine, un
    groupe ou une machine en cours de démarrage l'ignoraient. Elle s'applique
    désormais à tous les chemins : un serveur qui exécutait discrètement plus de
    sessions que ce nombre peut donc se mettre à les refuser. Augmentez la valeur
    si ce n'est pas ce que vous souhaitez.

### FOG_UDPCAST_MAXWAIT

Le nombre de **minutes** par défaut pendant lequel une session attend les clients
attendus avant de transmettre malgré tout. Les sessions créées depuis une machine
en cours de démarrage demandent cette valeur directement au lieu d'utiliser la
valeur par défaut.

### FOG_MULTICAST_ADDRESS

Une autre adresse de données multicast. Chaque session simultanée a besoin de sa
propre adresse ; lorsqu'un pool de ports est configuré, FOG en dérive une par
entrée du pool, ce qui empêche deux sessions d'entrer en conflit.

### FOG_UDPCAST_STARTINGPORT

Le port à partir duquel FOG commence lorsqu'aucun pool de ports n'est configuré.
FOG le fait avancer de lui-même à mesure que les sessions sont créées ; vous
n'avez normalement pas besoin d'y toucher.

## Dépannage

**Une session attend et ne démarre jamais.** Elle attend des clients qui ne sont
pas arrivés. Elle transmettra à l'expiration du délai d'attente. Vérifiez que le
nombre de clients attendus est correct — s'il est supérieur au nombre de machines
que vous imagez réellement, chaque session attend le délai complet.

**Une machine se voit répondre que la session a déjà commencé.** La transmission
est déjà en cours et la machine ne peut pas y être ajoutée. Lancez une nouvelle
session pour elle.

**Une machine ne parvient pas à rejoindre une session par son nom.** Seules les
sessions créées avec un effectif de clients attendus peuvent être rejointes par
leur nom. Les sessions créées directement depuis une machine ou un groupe n'ont
pas de nom à rejoindre.

**Les sessions échouent au démarrage lorsque plusieurs s'exécutent en même
temps.** Vérifiez `FOG_MULTICAST_PORT_OVERRIDE`. S'il ne contient qu'un seul
port, une seule session peut s'exécuter ; ajoutez des ports à la liste.

**Les machines d'un site s'imagent correctement, celles d'un autre restent
bloquées sur gparted.** L'émetteur ne s'exécute que sur le nœud maître du groupe
de stockage de la session, et son trafic ne traverse pas la liaison entre les
sites. Voir [Multicast sur plusieurs sites](#multicast-sur-plusieurs-sites). Le
fait que l'unicast fonctionne sur le site distant n'exclut pas cette cause — cela
montre seulement que l'image y est répliquée, pas que quoi que ce soit la
transmet.

**Le client affiche l'adresse IP du mauvais nœud.** La machine est dirigée vers
le maître du groupe de stockage de l'image plutôt que vers son nœud local.
Vérifiez que la machine est affectée à un emplacement, et que cet emplacement
pointe vers un groupe dont le maître est le nœud local.

**Le journal multicast indique qu'une session est déjà envoyée par un autre
nœud.** Deux nœuds peuvent atteindre la même session et un seul peut la
transmettre. Il s'agit du serveur qui refuse de démarrer un second émetteur, pas
d'une erreur. Si la session ne démarre nulle part, le nœud qui la détient est
soit hors ligne, soit dépourvu du fichier image.

## Voir aussi

- [Gestion des tâches](tasks.md)
- [Gestion des images](images.md)
- [Gestion des nœuds de stockage](storage-node.md)
- [Rôles et permissions](roles.md)
