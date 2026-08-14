---
title: Migrations de schéma des greffons
description: Décrit le nouveau mécanisme de migration de schéma des greffons dans FOG 1.6
context_id: plugin-schema-migrations
aliases:
    - Plugin Schema Migrations
    - Plugin Schema Changes
tags:
    - 1_6-changes
    - plugins
    - plugin-management
    - schema
    - database
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/development/plugin-schema-migrations).

# Migrations de schéma des greffons

Les greffons fournis apportent leurs propres tables de base de données.
Historiquement, le schéma d'un greffon n'était créé que lorsqu'un administrateur
cliquait sur **Install**, et une réinstallation **supprimait et recréait** les
tables (avec perte des données). Il n'existait aucun moyen de livrer une
modification de schéma — une nouvelle colonne, un nouvel index — à un greffon
déjà installé : une mise à niveau de FOG laissait intactes les anciennes tables
du greffon.

Ce document décrit le mécanisme qui remplace tout cela. Les greffons déclarent
désormais leur schéma sous forme de **liste ordonnée d'étapes de migration, en
ajout seul** (à l'image du fonctionnement du schéma du cœur de FOG dans
`commons/schema.php`). Les étapes sont appliquées **de façon incrémentale et non
destructive**, et chaque greffon garde trace du nombre d'étapes qu'il a
appliquées, de sorte qu'une mise à niveau n'exécute que ce qui est nouveau.

---

## Le contrat

Le **gestionnaire de premier niveau** d'un greffon possédant des tables
implémente une méthode :

```php
public function schema()
{
    return [
        // 0
        $this->createSql(),
        // 1  (added in a later release)
        "ALTER TABLE `mytable` ADD COLUMN `myCol` VARCHAR(40) NULL",
    ];
}
```

Règles :

1. **La liste est plate et en ajout seul.** Une seule liste couvre *toutes* les
   tables que possède le greffon. Les nouvelles modifications de schéma sont
   **toujours ajoutées à la FIN**. N'insérez, ne réordonnez et ne supprimez
   jamais d'entrées existantes — l'indice de chaque étape constitue son
   identité.
2. **Chaque étape est une chaîne SQL ou un appelable.** Un appelable exécute du
   PHP arbitraire et retourne `true` en cas de succès ou une **chaîne d'erreur**
   en cas d'échec (utilisé lorsqu'une valeur doit être résolue à l'exécution —
   voir *Données initiales* ci-dessous).
3. **Les étapes doivent être idempotentes ou additives.** Utilisez
   `CREATE TABLE IF NOT EXISTS` (via `Schema::createTable($name, true, ...)`) et
   `ALTER TABLE ... ADD ...`. Jamais de `DROP`. L'exécuteur tolère les erreurs
   « existe déjà / n'existe pas » (voir *Idempotence*) : réexécuter une étape est
   donc sans risque.

Le `CREATE TABLE` de chaque table réside dans une méthode `createSql()` du
gestionnaire propriétaire de cette table, et le `schema()` de premier niveau les
agrège. Le `schema()` d'un greffon à table unique se résume à
`[$this->createSql()]`.

`install()` devient une enveloppe légère et non destructive :

```php
public function install()
{
    $res = Schema::applyUpdates($this->schema(), 0);
    return $res['error'] === null;
}
```

`uninstall()` est inchangé — il reste le **seul** chemin qui supprime des
tables, et n'est déclenché que par le bouton explicite **Uninstall**.

---

## Comment les étapes sont appliquées

`Schema::applyUpdates(array $steps, int $applied): array`
(`lib/fog/schema.class.php`) est l'exécuteur commun. Il exécute les étapes à
partir de l'indice `$applied`, retourne
`['applied' => int, 'error' => string|null]`, et est utilisé aussi bien par le
chemin d'installation que par celui de mise à niveau, afin qu'il n'existe qu'un
seul chemin de code.

### Suivi des versions

Chaque ligne de greffon (table `plugins`) possède une colonne **`pSchema`** — un
entier comptant combien de ses étapes de `schema()` ont été appliquées.
`applyUpdates()` l'incrémente. Comparaison :

```
applied (plugins.pSchema)  <  count(manager->schema())   ⇒  upgrade pending
```

Cette vérification est **indépendante de `FOG_SCHEMA`** (la version du schéma du
cœur). Un greffon signale lui-même s'il est en retard, en comparant son propre
compteur enregistré au nombre d'étapes que définit son *code*.
`Plugin::needsSchemaUpdate()` est exactement cette comparaison.

### Idempotence

`applyUpdates()` tolère les mêmes codes d'erreur MySQL que le module de mise à
jour du schéma du cœur, de sorte que les étapes additives peuvent être
réexécutées sans risque :

| Code | Signification |
|------|---------|
| 1050 | La table existe déjà |
| 1054 | Colonne inconnue |
| 1060 | Nom de colonne en double |
| 1061 | Nom de clé en double |
| 1062 | Entrée en double |
| 1091 | Impossible de faire DROP ; n'existe pas |

Une étape appelable qui exécute ses propres requêtes doit suivre la même
philosophie (par exemple tolérer `1062` lors de l'insertion initiale d'une ligne
avec une clé primaire explicite).

---

## Le parcours côté utilisateur (notification + un clic)

Il n'y a **aucune application automatique silencieuse** — conformément à la
façon dont FOG conditionne déjà les modifications de schéma à une action
explicite et à un rappel de sauvegarde.

1. Lorsque le `schema()` d'un greffon installé définit plus d'étapes que son
   `pSchema`, celui-ci est « en retard ».
2. Le **tableau de bord** affiche une bannière d'avertissement : *« N greffon(s)
   nécessitent une mise à jour de la base de données. »* (calculé au chargement
   du tableau de bord via `PluginManager::getPluginsNeedingUpdate()`).
3. La liste **Plugin Management** affiche un bouton ambre **« Update available »**
   sur la ligne de ce greffon.
4. L'administrateur l'applique, **individuellement** (clic sur le bouton de la
   ligne) ou **en masse** (sélection de lignes → **Install/Update ▾ → Update
   selected**). Les deux passent par l'action `plugin/upgrade`, qui exécute
   `Plugin::installdb()` pour chaque greffon sélectionné *installé*. Le tableau
   se redessine et l'indicateur disparaît.

`Plugin::installdb()` applique les étapes en attente à partir de `pSchema` et
enregistre le nouveau compteur. L'opération est non destructive. (Les greffons
qui n'ont pas encore adopté `schema()` se rabattent sur leur `install()`
historique.)

---

## Ajouter une modification de schéma à un greffon existant

1. Ajoutez la nouvelle étape à la **fin** du `schema()` du gestionnaire de
   premier niveau :

   ```php
   public function schema()
   {
       return [
           $this->createSql(),                       // 0
           "ALTER TABLE `mytable` ADD COLUMN ...",   // 1  ← new
       ];
   }
   ```

2. C'est tout. Les exemplaires installés du greffon signaleront « update
   available » et l'administrateur appliquera la mise à jour. Aucune
   incrémentation de `FOG_SCHEMA` n'est nécessaire pour la détection.

   > **Note :** la migration fournie qui ajoute la colonne `pSchema`, elle,
   > *accompagne bien* une incrémentation de `FOG_SCHEMA` (il s'agit d'une
   > modification d'une table du cœur). Les modifications ultérieures de schéma
   > *des greffons* n'en ont pas besoin — la détection se fait greffon par
   > greffon.

---

## Cas particuliers

### Données initiales ou par défaut

Si une étape insère des lignes ou des réglages par défaut, elle doit pouvoir
s'exécuter sans risque sur un système qui les possède déjà (une installation
existante passant de `pSchema = 0`) :

- **Lignes avec clés primaires explicites** (par exemple les rôles et règles
  d'accesscontrol) : un simple `INSERT` convient — une réexécution déclenche
  `1062` et est ignorée. Les lignes existantes sont préservées.
- **Réglages sans clé unique** (par exemple capone, ldap —
  `globalSettings.settingKey` est seulement indexé, pas unique) : insérez
  **uniquement s'il est absent**, afin qu'une valeur personnalisée par
  l'administrateur ne soit jamais écrasée. Utilisez une étape appelable qui
  vérifie `SettingManager::exists($key, '', 'name')` avant d'insérer.
- **Valeurs déterminées à l'exécution** (par exemple la ligne
  Administrator→fog-user d'accesscontrol) : résolvez la valeur au sein d'une
  étape appelable et tolérez l'erreur d'entrée en double.

### Déclencheurs (persistentgroups)

Un déclencheur ne contient pas de données : le supprimer puis le recréer est donc
non destructif, mais ce cas n'est pas couvert par la liste d'erreurs ignorées de
l'idempotence. Modélisez-le sous forme d'étape appelable qui effectue
`DROP TRIGGER IF EXISTS` puis `CREATE TRIGGER`. Une modification ultérieure du
déclencheur est livrée sous forme de **nouvelle étape ajoutée** qui le supprime
et le recrée avec la nouvelle définition.

### Greffons ne possédant aucune table

`taskstateedit` / `tasktypeedit` modifient des tables existantes du cœur et ne
possèdent rien en propre. Ils n'ont pas de méthode `schema()` : ils ne signalent
donc jamais « update available » et `installdb()` se rabat sur leur `install()`
qui ne fait rien. Il n'y a rien à faire.

---

## Fichiers clés

| Fichier | Rôle |
|------|---------|
| `lib/fog/schema.class.php` | `Schema::applyUpdates()` — l'exécuteur idempotent commun |
| `lib/fog/plugin.class.php` | `Plugin::installdb()`, `Plugin::needsSchemaUpdate()` ; mappage du champ `pSchema` |
| `lib/fog/pluginmanager.class.php` | `PluginManager::getPluginsNeedingUpdate()` |
| `lib/pages/pluginmanagement.page.php` | action `upgrade`/`upgradePost` ; enrichissement du JSON de la liste |
| `lib/pages/dashboardpage.page.php` | bannière « mise à jour nécessaire » du tableau de bord |
| `management/js/fog/plugin/fog.plugin.list.js` | badge « Update available » + bouton de mise à jour en masse |
| `commons/schema.php` | migration du cœur qui ajoute la colonne `plugins.pSchema` |
| `lib/plugins/location/class/locationmanager.class.php` | implémentation de référence |
