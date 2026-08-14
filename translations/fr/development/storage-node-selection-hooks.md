---
title: Hooks de sélection du nœud de stockage
description: Décrit les nouveaux hooks de sélection du nœud de stockage de FOG 1.6
context_id: storage-node-selection-hooks
aliases:
    - Storage Node Selection Hooks
    - Storage Node Selection
tags:
    - 1_6-changes
    - storage
    - storage-management
    - hooks
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/development/storage-node-selection-hooks).

# Hooks de sélection du nœud de stockage

`StorageGroup` détermine à quel nœud de stockage une machine s'adresse pour une
opération donnée. Deux méthodes effectuent ce choix :

- **`getOptimalStorageNode()`** — choisit le meilleur nœud de *déploiement* du
  groupe (le nœud en ligne, activé, dont la charge client est la plus faible).
- **`getMasterStorageNode()`** — choisit le nœud *maître* du groupe (utilisé
  pour les captures, le multicast et comme source de réplication).

Toutes deux déclenchent un événement `HookManager` juste avant de retourner, de
sorte qu'un greffon ou un hook peut **inspecter ou remplacer le nœud choisi** —
y compris fournir un nœud lorsque la logique propre à FOG n'en a trouvé aucun.

| Méthode | Nom de l'événement |
|--------|------------|
| `getOptimalStorageNode()` | `OPTIMAL_STORAGE_NODE` |
| `getMasterStorageNode()` | `MASTER_STORAGE_NODE` |

---

## Ce que transmet l'événement

Chaque événement reçoit les trois mêmes arguments, tous **par référence** :

| Clé | Type | Signification |
|-----|------|---------|
| `StorageGroup` | `StorageGroup` | Le groupe sur lequel porte la sélection (`$this`). |
| `StorageNodes` | `stdClass` | La liste décodée des nœuds candidats examinés par FOG. |
| `StorageNode` | `StorageNode` \| `null` | Le nœud choisi par FOG, ou `null` si aucun ne convenait. |

Un hook remplace le résultat en **réaffectant `$arguments['StorageNode']`**.
Comme le `processEvent` de FOG transmet le tableau d'arguments avec des éléments
par référence, cette réaffectation se répercute dans la méthode. C'est le même
mécanisme que celui déjà employé par le greffon **Location** fourni pour
orienter la sélection de nœud depuis les événements `HOST_NEW_SETTINGS` /
`BOOT_TASK_NEW_SETTINGS`.

Après l'événement, la méthode valide le nœud (éventuellement remplacé) :

```php
if (empty($StorageNode) || !$StorageNode->isValid()) {
    throw new Exception(_('No nodes available'));        // optimal
    // or _('No master nodes available') for the master node
}
return $StorageNode;
```

Un hook peut donc aussi **rattraper** une sélection en échec en définissant un
`StorageNode` valide là où FOG aurait autrement levé une exception.

---

## Comportement lorsqu'aucun hook n'est enregistré

Inchangé. En l'absence d'écouteur, le nœud choisi passe tel quel et les méthodes
se comportent exactement comme avant — le même nœud est retourné, et la même
exception est levée lorsque rien ne convient. (`isValid()` sur le nœud choisi
équivaut à l'ancienne vérification `empty($winner)` / `empty($masternode)`.)

Le simple fait de mentionner l'un ou l'autre nom d'événement l'enregistre aussi
automatiquement sous **Configuration FOG → Hook & Event listing**, comme tout
autre événement de FOG.

---

## Exemple : remplacer le nœud optimal depuis un greffon

```php
class MyStorageHook extends Hook
{
    public $name = 'MyStorageHook';
    public $description = 'Pick a storage node my own way';
    public $active = true;
    public $node = 'mystorageplugin';

    public function __construct()
    {
        parent::__construct();
        self::$HookManager->register(
            'OPTIMAL_STORAGE_NODE',
            [$this, 'pickNode']
        );
    }

    public function pickNode($arguments)
    {
        /** @var StorageGroup $StorageGroup */
        $StorageGroup = $arguments['StorageGroup'];

        // ...your selection logic, e.g. by subnet, weighting, etc...
        $chosen = self::getClass('StorageNode', $someNodeId);

        if ($chosen->isValid()) {
            $arguments['StorageNode'] = $chosen;   // override FOG's choice
        }
    }
}
```

Enregistrez le hook de la façon habituelle (un fichier `*.hook.php` dont le nom
de classe correspond au nom de fichier, dans `lib/hooks/` ou dans le répertoire
`hooks/` d'un greffon).

L'événement `MASTER_STORAGE_NODE` fonctionne à l'identique — il suffit de
s'enregistrer sur ce nom-là.

---

## Points d'appel concernés

Comme les hooks résident dans `StorageGroup` lui-même, *tous* les appelants de
ces deux méthodes sont couverts, y compris les chemins qui ne déclenchent pas
les événements `*_NEW_SETTINGS` environnants — par exemple le lancement de
tâches sur une machine, le menu de démarrage, la file d'attente des tâches et
les greffons Capone/Location.

Voir [`packages/web/lib/fog/storagegroup.class.php`](https://github.com/FOGProject/fogproject/blob/working-1.6/packages/web/lib/fog/storagegroup.class.php).
