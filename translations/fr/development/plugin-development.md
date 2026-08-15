---
title: Construire un greffon FOG — du début à la fin
description: Décrit comment construire un greffon FOG du début à la fin
context_id: plugin-development
aliases:
    - Plugin Development
    - FOG Plugin Development Guide
    - Building a FOG Plugin — Start to Finish
tags:
    - 1_6-changes
    - plugins
    - plugin-development
    - customization
---
>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/development/plugin-development).

# Construire un greffon FOG — du début à la fin

Ce guide vous accompagne d'un répertoire vide jusqu'à un greffon FOG
fonctionnel et installable sur le framework **working-1.6**. Il s'appuie sur un
greffon d'exemple complet et exécutable — **`helloworld`** — qui vit dans
[`FOGProject/fog-plugins`](https://github.com/FOGProject/fog-plugins) et
atterrit dans `packages/web/lib/plugins/helloworld/` une fois les greffons
récupérés. Copiez ce répertoire, renommez-le, et vous avez une longueur
d'avance.

> Les greffons fournis ne sont plus commités dans le dépôt `fogproject`.
> Un clone frais n'a aucun `packages/web/lib/plugins/` tant que
> `bin/fetch-plugins.sh` ne l'a pas peuplé à partir des épinglages de version
> `FOG_PLUGINS_VERSION` de la release — ce que l'installateur fait pour vous.
> Lancez-le à la main si vous voulez simplement l'arborescence.

> **Portée :** ce guide cible le framework de greffons working-1.6 (les
> assistants de page `formFields` / `makeInput`, le motif JSON
> `addPost`/`editPost`, et le contrat de migration non destructif `schema()`).
> La branche 1.5.x rend les pages différemment (chaînes HTML brutes, noms de
> fichiers `*page.class.php`) et n'a pas le mécanisme de migration `schema()` ;
> ce guide ne la couvre pas.

---

## 1. Ce qu'est un greffon

Un greffon FOG est simplement un répertoire contenant des classes PHP que FOG
découvre automatiquement. Il n'y a aucune étape de compilation ni de liste
d'enregistrement à modifier — déposez le répertoire, activez le greffon dans
l'interface (**Plugin Management**), et il fonctionne.

Ce répertoire peut vivre à deux endroits, et le choix a de l'importance :

| Racine | Pour | Survit à une mise à niveau de FOG ? |
|---|---|---|
| `packages/web/lib/plugins/<name>/` | les greffons fournis avec FOG lui-même, issus de `FOGProject/fog-plugins` | Non — le tarball repose cette arborescence |
| `/opt/fog/plugins/<name>/` (`FOG_PLUGIN_DIR`) | **tout ce qui est tiers** | Oui |

Le `configureHttpd()` de l'installateur fait un `rm -rf` sur la racine web
avant de poser la nouvelle, donc un greffon installé dans `lib/plugins/` est
supprimé sans avertissement à la prochaine exécution d'`installfog.sh`.
`FOG_PLUGIN_DIR` se trouve hors de la racine web précisément pour que cela ne
puisse pas arriver. Voir
[ADR 0009](https://github.com/FOGProject/fogproject/blob/working-1.6/docs/adr/0009-plugins-become-installable-artifacts.md).

L'inclusion dans FOG n'est pas une voie qu'empruntent les tiers.
`lib/plugins/` est rempli à partir d'une release `fog-plugins` épinglée, donc y
placer un greffon signifie ouvrir une PR contre ce dépôt et attendre que FOG
épingle une release qui le contient. Distribuez plutôt votre propre archive —
voir §11a.

La découverte, l'autoloader de classes et le routage traitent les deux racines
à l'identique ; la seule différence que voit un greffon externe est que ses
répertoires `js/`, `css/` et `images/` sont atteints via un lien symbolique
que FOG maintient pour lui (voir §10).

Un greffon typique fournit :

- un **modèle** (une entité / ligne de table),
- un **manager** (la table + ses migrations),
- une **page** (l'interface et ses gestionnaires de POST de formulaire),
- des **hooks** (entrée de menu, injection JS, exposition API, …),
- des fichiers **JS** (un par sous-page).

L'exemple fil rouge, `helloworld`, gère de bout en bout une entité triviale
avec un `name` et une `description`.

---

## 2. Modèle mental (comment les pièces se connectent)

- **Chaîne de démarrage.** Chaque point d'entrée charge `commons/base.inc.php` →
  `commons/init.php` → `LoadGlobals`, qui établit les singletons partagés
  (`FOGBase::$DB`, `$HookManager`, `$EventManager`, `$currentUser`).
- **Autoloader.** `Initiator` parcourt `BASEPATH` récursivement, ajoute chaque
  répertoire contenant un fichier `*.{class,page,hook,event,report}.php` à
  l'`include_path` PHP, puis enregistre le `spl_autoload` **par défaut** de
  PHP. Cet autoloader par défaut **met le nom de classe en minuscules** pour
  trouver le fichier. Donc :

  > **Le nom de fichier doit être `strtolower(ClassName)` + le suffixe.**
  > `class HelloWorldManagement` ⇒ `helloworldmanagement.page.php`.
  > `class AddHelloWorldJS` ⇒ `addhelloworldjs.hook.php`.

  (Les noms de classes dans le code sont en PascalCase ; les fichiers sur le
  disque sont entièrement en minuscules.)
- **Routage.** Toute l'interface est pilotée par `?node=<x>&sub=<y>&id=<n>`.
  `node` correspond à une classe de page (`helloworld` →
  `HelloWorldManagement`, appariée par son `public $node = 'helloworld'`), et
  `sub` correspond à une méthode de celle-ci (`sub=add` → `add()`,
  `sub=addPost` → `addPost()`, `sub=list` → la liste DataTables héritée).
- **ORM.** Les modèles déclarent `$databaseTable` et `$databaseFields`
  (nom convivial → colonne). Vous utilisez ensuite
  `get()/set()/save()/load()/destroy()`, ou `new HelloWorld(42)` pour un
  chargement automatique par id.
- **Hooks/événements.** L'intégration transversale se fait en enregistrant des
  callbacks sur des événements nommés :
  `self::$HookManager->register('EVENT', [$this, 'fn'])` et en déclenchant avec
  `processEvent('EVENT', ['data' => &$data])`.

---

## 3. Structure des répertoires

```
<root>/helloworld/                  # <root> = lib/plugins (bundled) or /opt/fog/plugins
├── config/
│   └── plugin.config.php          # the manifest ($fog_plugin[...])
├── class/
│   ├── helloworld.class.php        # HelloWorld         (model, FOGController)
│   └── helloworldmanager.class.php # HelloWorldManager  (manager + schema())
├── pages/
│   └── helloworldmanagement.page.php  # HelloWorldManagement (FOGPage)
├── hooks/
│   ├── addhelloworldmenuitem.hook.php # menu entry + search/objects
│   ├── addhelloworldjs.hook.php       # JS injection
│   └── addhelloworldapi.hook.php      # REST API exposure
└── js/
    ├── fog.helloworld.list.js
    ├── fog.helloworld.add.js
    └── fog.helloworld.edit.js
```

Le nom du répertoire **est** le nom machine du greffon et son `node` de
routage. Gardez-le en minuscules et utilisez-le de manière cohérente
(`$fog_plugin['name']`, le `public $node` de chaque hook, le `public $node` de
la page).

---

## 4. Étape par étape

### 4.1 `config/plugin.config.php` — le manifeste

`Plugin::readManifest()` fait un `include` de ce fichier pendant la découverte
et lit le tableau `$fog_plugin`.

```php
$fog_plugin = [];
$fog_plugin['name']        = 'helloworld';           // == directory name
$fog_plugin['description'] = 'Skeleton example plugin …';
$fog_plugin['menuicon']    = 'fa fa-cube fa-fw';     // "fa …" => icon; else <img src>
$fog_plugin['version']     = '1.0.0';                // your plugin's own version
$fog_plugin['fog_min']     = '1.6.0';                // oldest FOG it runs on
$fog_plugin['fog_max']     = '1.7.0';                // newest FOG it runs on
$fog_plugin['requires']    = ['location'];           // other plugins, by directory name
$fog_plugin['author']      = 'Your Name';
$fog_plugin['homepage']    = 'https://example.org/my-plugin';
```

| Clé | Requise | Ce qu'elle fait |
|---|---|---|
| `name` | oui | Nom machine et `node` de routage. Doit être égal au nom du répertoire, en minuscules. |
| `description` | non | Affichée dans Plugin Management. |
| `menuicon` | non | Par défaut `fa fa-plug fa-fw`. |
| `version` | non | À vous de la numéroter. Affichée dans la grille, stockée dans `plugins.pVersion`. Rien ne la compare à quoi que ce soit. |
| `fog_min` / `fog_max` | non | La plage de FOG que vous supportez. Une borne absente signifie aucune borne. |
| `requires` | non | Greffons qui doivent être actifs au préalable. |
| `author`, `homepage` | non | Attribution. |

**Toutes les clés sauf `name` sont facultatives**, de sorte qu'un greffon écrit
avant l'existence du manifeste continue de fonctionner tel quel.

#### Comment la plage de compatibilité est appliquée

- Activer ou installer un greffon hors de sa plage est **refusé**, avec la
  raison dans le toast d'erreur. C'est tout le lot qui est refusé, pas
  seulement le greffon fautif — un succès partiel annoncé comme
  « Plugins activated! » est pire qu'un échec net.
- Si une mise à niveau de FOG fait sortir le serveur de la plage d'un greffon
  déjà actif, le démarrage suivant **le désactive** et journalise pourquoi.
  `installed` et `pSchema` sont laissés intacts, donc ses tables et les
  migrations appliquées survivent, et le réactiver une fois que vous livrez
  une version compatible tient en un clic.
- Seul le **cœur numérique** d'une version est comparé. `FOG_VERSION` vaut
  `1.6.0-beta.3318` sur une beta et `version_compare()` classe cela *en
  dessous* de `1.6.0`, donc une comparaison brute refuserait
  `fog_min = '1.6.0'` sur toute la branche beta.
- Les greffons activés dans le même lot satisfont mutuellement leurs
  `requires`, donc l'ordre dans lequel vous cochez les cases n'a pas
  d'importance.

> `menuicon_hover` et `entrypoint` figuraient ici auparavant. Rien n'a jamais
> lu ni l'un ni l'autre — aucun greffon n'a jamais livré le `html/run.php` que
> nommait `entrypoint`, et le routage passe par la correspondance `node` →
> classe de page. Les deux ont disparu ; si votre manifeste les définit
> encore, ils sont simplement ignorés.

### 4.2 Modèle — `class/helloworld.class.php`

```php
class HelloWorld extends FOGController
{
    protected $databaseTable = 'helloWorld';
    protected $databaseFields = [
        'id'          => 'hwID',
        'name'        => 'hwName',
        'description' => 'hwDesc',
    ];
    protected $databaseFieldsRequired = ['name'];
}
```

C'est là tout le contrat ORM. `$databaseFields` associe les noms conviviaux
(utilisés dans le code et dans l'API) aux vrais noms de colonnes.
`$databaseFieldsRequired` est appliqué lors du `save()`.

### 4.3 Manager + migrations — `class/helloworldmanager.class.php`

Le manager possède la création de la table et l'**évolution du schéma**. C'est
la partie la plus importante à réussir, elle a donc sa propre section (§5). La
forme :

```php
class HelloWorldManager extends FOGManagerController
{
    public $tablename = 'helloWorld';

    public function createSql() { return Schema::createTable(/* … */); }

    public function schema()
    {
        return [
            $this->createSql(),     // step 0 — create the table
            // append future steps here, never reorder/remove
        ];
    }

    public function install()
    {
        $res = Schema::applyUpdates($this->schema(), 0);
        return $res['error'] === null;
    }
}
```

### 4.4 Page — `pages/helloworldmanagement.page.php`

La page étend `FOGPage`, déclare `public $node = 'helloworld'`, et définit les
colonnes de la liste dans son constructeur :

```php
public function __construct($name = '')
{
    $this->name = 'Hello World Management';
    parent::__construct($this->name);
    $this->headerData = [_('Name'), _('Description')];
    $this->attributes = [[], []];
}
```

Vous n'écrivez **pas** de méthode de liste/`index()` — `FOGPage` la fournit. La
page de liste rend une DataTable dont le JSON provient de
`?node=helloworld&sub=list` ; les colonnes sont produites par le routeur à
partir des champs de votre modèle, donc les clés de colonnes disponibles pour
le JS sont `mainlink` (le nom sous forme de lien), `id`, et chaque champ par
son **nom convivial** (ici `description`).

Les formulaires se construisent avec des assistants et se rendent avec
`formFields()` :

| Assistant | Rôle |
|---|---|
| `self::makeFormTag(...)` | le `<form>` ouvrant |
| `self::makeLabel($class, $for, $text)` | un `<label>` |
| `self::makeInput($class, $name, $placeholder, $type, $id, $value, $required)` | un `<input>` |
| `self::makeTextarea(...)` | un `<textarea>` |
| `self::makeButton($id, $text, $class)` | un `<button>` |
| `self::selectForm($name, $items, $selected, ...)` | un `<select>` |
| `self::formFields($fields)` | rend un tableau `[label => field]` |
| `self::tabFields($tabData, $obj)` | la mise en page d'édition par onglets |
| `self::makeTabUpdateURL($tab, $id)` | l'URL de POST d'un onglet |

**Le motif POST.** `addPost()` et `editPost()` renvoient du JSON et suivent à
chaque fois le même squelette :

```php
public function addPost()
{
    self::checkAuthAndCSRF();                 // ALWAYS first
    header('Content-type: application/json');
    $name = trim(filter_input(INPUT_POST, 'name'));   // never raw $_POST

    $serverFault = false;
    try {
        // validate, then build + save the model …
        if (!$obj->save()) { $serverFault = true; throw new Exception(_('…')); }
        $code = HTTPResponseCodes::HTTP_CREATED;
        $msg  = json_encode(['msg' => _('…'), 'title' => _('…')]);
    } catch (Exception $e) {
        $code = $serverFault
            ? HTTPResponseCodes::HTTP_INTERNAL_SERVER_ERROR   // 500 = our fault
            : HTTPResponseCodes::HTTP_BAD_REQUEST;            // 400 = bad input
        $msg  = json_encode(['error' => $e->getMessage(), 'title' => _('…')]);
    }
    http_response_code($code);
    echo $msg;
    exit;
}
```

> Ne mettez `$serverFault = true` **que** lorsque l'échec est côté serveur (un
> `save()` en échec), afin que les vraies défaillances renvoient `500` et que
> les erreurs de validation renvoient `400`. L'inverser est un vrai bogue que
> nous avons déjà corrigé.

La page d'**édition** utilise des onglets. `edit()` construit `$tabData` et
appelle `tabFields()` ; chaque onglet a une closure `generator` qui rend son
corps (`helloworldGeneral()`), et `editPost()` aiguille selon le `$tab` global
vers le `*GeneralPost()` correspondant qui modifie `$this->obj` avant le
`save()` partagé.

### 4.5 Hooks — `hooks/*.hook.php`

Chaque hook est une petite classe étendant `Hook`, avec un `public $node`, qui
enregistre ses callbacks **dans son constructeur**. Utilisez
`registerInstalled()` — il applique pour vous la garde « seulement quand ce
greffon est installé » et prend une liste ordonnée de paires
`[event, method]` :

```php
public function __construct()
{
    parent::__construct();
    $this->registerInstalled([
        ['MAIN_MENU_DATA', 'menuData'],
        ['PERMISSION_REGISTRY_DATA', 'permData'],
    ]);
}
```

L'exemple livre trois hooks :

- **Menu** (`AddHelloWorldMenuItem`) — `MAIN_MENU_DATA` ajoute l'entrée dans la
  barre latérale ; `SEARCH_PAGES` la rend cherchable ; `PAGES_WITH_OBJECTS`
  active le flux d'objets édition/suppression. (`SUB_MENULINK_DATA` ajouterait
  des sous-liens supplémentaires comme Export/Import — omis ici.)
- **JS** (`AddHelloWorldJS`) — `PAGE_JS_FILES` injecte `fog.<node>.<sub>.js`
  pour la sous-page courante.
- **API** (`AddHelloWorldAPI`) — `API_VALID_CLASSES` expose le node en REST, de
  sorte que `/fog/helloworld` réutilise le même ORM que l'interface.

> **Nommez les classes API d'après votre node de permission.** L'accès à une
> classe REST est résolu en `<node>.<action>` en confrontant le nom de la
> classe aux nodes enregistrés via `PERMISSION_REGISTRY_DATA`. Une classe est
> revendiquée par un node quand elle *est* le node (`site`) ou qu'elle
> *commence par* le node et se termine par `association`
> (`sitehostassociation`) — la même forme que le cœur utilise pour
> `groupassociation` → `group`. La correspondance la plus longue gagne.
>
> Une classe qu'aucun node ne revendique est restreinte aux administrateurs et
> journalise une ligne qui la nomme. C'est délibéré : une classe non mappée
> était auparavant lisible et modifiable par **n'importe quel** utilisateur
> authentifié, quel que soit son rôle. Si votre endpoint est réservé aux
> administrateurs alors que ce n'était pas votre intention, consultez le
> journal et renommez la classe (ou enregistrez le node) plutôt que de
> contourner le problème.

> **Enregistrez votre node, sinon votre page est réservée aux
> administrateurs.** La même position s'applique à la page de gestion, pas
> seulement aux classes REST : un node absent du registre de permissions se
> résout en `unmapped.<node>`, qu'aucun rôle ne peut recevoir, donc seul un
> détenteur de `*` peut l'atteindre — et son entrée de barre latérale est
> masquée pour tous les autres. Une ligne est journalisée par node et par
> requête, nommant ce qu'il faut enregistrer. Déclencher
> `PERMISSION_REGISTRY_DATA` n'est donc pas facultatif ; un greffon qui s'en
> passe n'est pas « sans garde-fou », il est inaccessible.
>
> ```php
> public function permData($arguments)
> {
>     $arguments['registry'][$this->node] = ['view', 'create', 'edit', 'delete'];
> }
> ```

### 4.6 JavaScript — `js/fog.helloworld.*.js`

Un fichier par sous-page (`list`, `add`, `edit`), chacun une IIFE. Le fichier
**list** enregistre la DataTable côté serveur et la modale de création ; ses
clés `columns[].data` doivent correspondre au endpoint de liste (`mainlink`,
puis vos noms de champs) et leur ordre doit correspondre à `$headerData`. Les
fichiers **add**/**edit** relient les boutons du formulaire à `processForm()`
(qui fait le POST et affiche les notifications) et, en édition, la modale de
confirmation de suppression à `$.apiCall(... &sub=delete ...)`.

Les assistants partagés que vous utiliserez : `Common.node`, `Common.id`,
`Common.search`, `$.apiCall()`, `$.deleteSelected()`, `<form>.processForm()`,
`$('#dataTable').registerTable()`.

---

## 5. Base de données et migrations (la partie importante)

FOG n'a **aucune migration automatique par colonne**. `Schema::createTable()`
émet `CREATE TABLE IF NOT EXISTS`, qui ne fait rien sur une table qui existe
déjà — donc ajouter simplement une colonne à `createSql()` n'atteindra **pas**
les installations existantes. Utilisez plutôt le **contrat `schema()`** —
couvert en profondeur dans
[[plugin-schema-migrations|Migrations de schéma des greffons]].

**`schema()` renvoie une liste d'étapes ordonnée, en ajout seul.** Chaque étape
est une chaîne SQL (ou une closure renvoyant du SQL). À l'installation ou à la
mise à niveau, le framework (`Plugin::installdb()`) appelle :

```php
Schema::applyUpdates($manager->schema(), $applied);
```

où `$applied` est le compte stocké dans la colonne `pSchema` du greffon. Seules
les étapes à partir de l'index `$applied` s'exécutent, et le nouveau compte est
réenregistré. Donc :

> **Pour ajouter une colonne plus tard, ajoutez une nouvelle étape à la fin.
> Ne réordonnez ni ne supprimez jamais les étapes existantes** — le compte
> d'étapes appliquées est positionnel.

```php
public function schema()
{
    return [
        // 0 — create the table
        $this->createSql(),
        // 1 — added later; runs once on upgrade, skipped thereafter
        "ALTER TABLE `helloWorld` ADD COLUMN `hwColor` VARCHAR(255) NULL",
    ];
}
```

`applyUpdates()` est défensif : il ignore les erreurs « already exists /
duplicate column / duplicate key / unknown column / duplicate entry », donc le
réexécuter est sûr. Une étape en closure peut renvoyer une chaîne pour
signaler une erreur dure et s'arrêter.

Les données d'amorçage (par exemple des lignes `globalSettings` par défaut)
sont juste une étape de plus — renvoyez le SQL `INSERT`, ou une closure pour
tout ce qui nécessite des valeurs à l'exécution (voir le `schema()` de
`accesscontrolmanager` pour le motif en closure).

> **Note héritage.** Les greffons plus anciens implémentent un `install()`
> destructif qui appelle `uninstall()` (suppression) puis recrée. Les nouveaux
> greffons devraient implémenter `schema()` (le framework le préfère et ne se
> rabat sur `install()` que lorsque `schema()` est absent). L'exemple fournit
> les deux ; son `install()` applique simplement le schéma depuis `0`.

---

## 6. Cycle de vie

1. **Découverte.** `Plugin::getPlugins()` parcourt **les deux** racines de
   greffons, lit chaque manifeste, et insère ou met à jour une ligne dans la
   table `plugins`. Il maintient aussi le lien symbolique d'assets des
   greffons externes et désactive tout greffon actif que cette version de FOG
   a fait sortir de sa plage.
2. **Activation.** Un administrateur active le greffon dans
   **Plugin Management**. Son `node` est ajouté à
   `FOGBase::$pluginsinstalled`, qui est ce que chaque constructeur de hook
   vérifie avant de s'enregistrer. Refusée si `fog_min`/`fog_max`/`requires`
   disent qu'il ne peut pas tourner ici.
3. **Installation / mise à niveau.** `Plugin::installdb()` exécute `schema()`
   via `applyUpdates()` et suit `pSchema`. C'est idempotent et non
   destructif — sûr à exécuter à chaque mise à niveau.
4. **Désinstallation.** Le `uninstall()` hérité supprime la table ;
   surchargez-le si vous devez nettoyer des paramètres, des associations ou
   des utilisateurs que vous avez créés.
5. **Code supprimé.** Supprimer le répertoire du greffon ne supprime **pas** sa
   ligne. La découverte ne parcourt jamais que les répertoires qui existent,
   donc rien ne repasserait sur la ligne pour la nettoyer — et l'absence n'est
   pas nécessairement définitive (une racine externe non montée, ou
   l'arborescence web en pleine mise à niveau, fait disparaître tous les
   greffons d'un coup). La ligne conserve son état et son compte `pSchema`,
   donc remettre le code en place reprend exactement là où les choses en
   étaient.

   Plugin Management marque une telle ligne du badge **Missing**, refuse de
   l'activer ou de l'installer, et propose **Forget selected** pour supprimer
   la ligne délibérément. Forget laisse les tables du greffon derrière et le
   dit : ce qu'il faudrait supprimer est décrit par `schema()`, qui fait
   partie du code qui a disparu.

---

## 7. Paramètres

La configuration globale vit dans la table `globalSettings`.

- Lecture : `FOGBase::getSetting('FOG_PLUGIN_HELLOWORLD_FOO')`
- Écriture : `FOGBase::setSetting('FOG_PLUGIN_HELLOWORLD_FOO', $value)`
- Nommage : `ALL_CAPS_WITH_UNDERSCORES`, préfixé `FOG_PLUGIN_<NAME>_…`.
- Créez les valeurs par défaut comme étape d'amorçage de `schema()` (un
  `INSERT` dans `globalSettings`).

---

## 8. Conventions de sécurité et de sortie

- **Sortie :** enveloppez chaque valeur contrôlée par l'utilisateur avec
  `Initiator::e($value)` quand vous l'émettez dans du HTML. Toute la sortie
  passe aussi par le tampon global `sanitizeOutput`.
- **Entrée :** utilisez `filter_input(INPUT_POST, 'key')` (ou les
  superglobales déjà assainies) — jamais `$_POST`/`$_GET` bruts.
- **CSRF/authentification :** appelez `self::checkAuthAndCSRF()` au tout début
  de chaque gestionnaire POST qui modifie l'état.
- **Instanciation :** préférez `self::getClass('HelloWorld')` /
  `self::getClass('HelloWorldManager')` à `new`.
- **Traduction :** enveloppez les chaînes d'interface dans `_('…')`.
- **Secrets dans votre table :** si une colonne contient un identifiant
  sensible — un jeton d'API, une URL de webhook, un mot de passe de
  liaison — déclarez-la via `API_SENSITIVE_FIELDS`, sans quoi elle est émise
  dans les charges utiles REST et par l'endpoint de démarrage non
  authentifié. Deux niveaux :

  | Niveau | Retiré de | À utiliser quand |
  |---|---|---|
  | `fields` | les listes et les relations développées | un client la relit légitimement lors d'un GET unitaire direct (comme fog-client le fait avec `host.ADPass`) |
  | `always` | tout, GET unitaire compris | rien en dehors du niveau web n'en a jamais besoin |

  ```php
  public function declareSensitiveFields($arguments)
  {
      $arguments['always'][$this->node][] = 'bindPwd';
  }
  ```

  Préférez `always` sauf si vous pouvez nommer le consommateur qui relit le
  champ.

---

## 9. Événements de hook courants

| Événement | Rôle |
|---|---|
| `MAIN_MENU_DATA` | ajouter l'entrée de premier niveau dans la barre latérale (`hook_main[node] = [label, icon]`) |
| `SUB_MENULINK_DATA` | ajouter des sous-liens (Export/Import/…) sous le node |
| `SEARCH_PAGES` | rendre le node cherchable |
| `PAGES_WITH_OBJECTS` | activer le flux d'objets (édition/suppression) pour le node |
| `PAGE_JS_FILES` | injecter les fichiers JS de la page courante |
| `PERMISSION_REGISTRY_DATA` | enregistrer le node et ses actions — **requis**, voir §4.5 |
| `API_VALID_CLASSES` | exposer le node via l'API REST (nommez les classes d'après votre node de permission — voir §4.5) |
| `API_SENSITIVE_FIELDS` | garder les colonnes d'identifiants hors de la sortie de l'API et de l'endpoint de démarrage — voir §8 |
| `<NODE>_ADD_FIELDS` / `_GENERAL_FIELDS` | laisser d'autres étendre vos formulaires |
| `<NODE>_ADD_POST` / `_EDIT_POST` / `_ADD_SUCCESS` / `_ADD_FAIL` | points d'extension autour de vos sauvegardes |

Déclenchez vos propres événements avec des arguments passés par référence
(`&`) pour que les écouteurs puissent les modifier (voir les événements
`HELLOWORLD_*` de l'exemple).

---

## 10. Pièges (appris à la dure)

- **`CREATE TABLE IF NOT EXISTS` ne modifie jamais une table en service.**
  Ajoutez les colonnes via une nouvelle étape de `schema()`, pas en modifiant
  `createSql()`.
- **Nom de fichier = `strtolower(ClassName)` + suffixe.** Une discordance
  signifie que la classe ne se chargera pas automatiquement. Silencieusement,
  pour la plupart des classes — mais pas pour votre manager : l'installation
  refuse net si `class/<name>manager.class.php` existe et ne déclare pas
  `<Name>Manager`, parce que le repli faisait autrefois annoncer un succès à
  l'installation alors que rien n'avait été créé.
- **`menuicon`** commençant par `fa` est rendu comme une icône font-awesome ;
  tout le reste est traité comme un `src` d'`<img>`.
- **`$serverFault`** ne doit être `true` que pour les échecs côté serveur,
  afin que les codes d'état HTTP soient honnêtes (`500` contre `400`).
- **Les constructeurs de hooks doivent retourner immédiatement** quand le node
  n'est pas dans `$pluginsinstalled`, sinon vos hooks s'exécutent pour un
  greffon qui n'est pas activé.
- **Les colonnes de liste** dans le JS doivent respecter l'ordre de
  `$headerData` et les clés qu'émet le routeur (`mainlink`, `id`, noms de
  champs conviviaux).
- **Les assets d'un greffon externe sont servis via un lien symbolique que FOG
  maintient pour vous.** `/opt/fog/` est hors de la racine documentaire, donc
  le navigateur ne peut pas l'atteindre ; chaque passe de découverte (re)crée
  `lib/plugins/<name>` → `/opt/fog/plugins/<name>` afin que
  `../lib/plugins/<name>/js/…` se résolve aussi bien pour un greffon fourni
  que pour un greffon externe. Vous ne faites rien — référencez vos assets
  normalement et `Hook::injectPluginJS()` émet la bonne URL. Apache a besoin
  d'`Options +FollowSymLinks` (l'installateur le configure) ; nginx suit les
  liens dans tous les cas.

---

## 11. Installer et tester votre greffon

1. Copiez `helloworld/` vers `/opt/fog/plugins/<yourname>/` (ou, pour un
   greffon que vous comptez fournir avec FOG lui-même,
   `packages/web/lib/plugins/<yourname>/`) et renommez le répertoire, les
   classes, les fichiers (en minuscules), chaque `$node`, et le
   `$fog_plugin['name']`.
2. Placez-le dans la racine web — nécessaire seulement pour un greffon fourni,
   puisque `/opt/fog/plugins/` est déjà actif et volontairement hors de la
   racine documentaire. Ce que vous utilisez habituellement pour synchroniser
   une arborescence de travail sur le serveur fera l'affaire.
3. Dans l'interface : **Plugin System → Plugin Management →
   installez/activez** votre greffon.
4. Confirmez : l'entrée de barre latérale apparaît, **Create New** enregistre
   une ligne (vérifiez que la table existe et que `pSchema` a avancé),
   **list** l'affiche, **edit** la met à jour, **delete** la supprime.
5. Vérifications statiques rapides pendant le développement :
   `php -l <file>` sur chaque fichier PHP et `node --check <file>` sur chaque
   fichier JS.

---

## 11a. Distribuer votre greffon à d'autres personnes

Empaquetez-le en `.tar.gz` contenant **un seul répertoire, nommé d'après le
greffon** :

```
tar czf myplugin-1.0.0.tar.gz myplugin/
```

Publiez le `sha256sum` de l'archive à côté d'elle — Plugin Management affiche
la somme de contrôle de ce qui a été téléversé afin qu'un administrateur
puisse comparer les deux avant d'installer.

Les administrateurs ont deux voies :

- **`git clone` ou extraction dans `/opt/fog/plugins/`** en root. Toujours
  disponible, rien à activer.
- **Plugin Management → Upload plugin.** Désactivé par défaut ; voir
  ci-dessous.

### L'archive doit survivre à la validation

FOG extrait l'archive à un endroit où l'autoloader ne regarde pas, lit le
manifeste, et montre à l'administrateur ce qu'il a trouvé *avant* toute
installation. Elle est refusée d'emblée si :

| | |
|---|---|
| ce n'est pas un `.tar.gz` lisible | ouverte comme un tar quel que soit le nom du fichier |
| elle contient autre chose qu'exactement un répertoire de premier niveau | y compris un fichier isolé à la racine de l'archive |
| un chemin d'entrée est absolu ou contient `..` | un `..` intérieur passe au travers de PharData ; FOG vérifie quand même |
| il n'y a pas de `<name>/config/plugin.config.php` | |
| le `name` du manifeste n'est pas le nom du répertoire | |
| le greffon est hors de sa propre plage `fog_min`/`fog_max` | |
| un greffon **fourni** porte déjà ce nom | un greffon fourni gagne toujours la collision, donc le téléversement ne pourrait jamais se charger |
| elle dépasse 64 Mo | `post_max_size` mord généralement en premier |

Les liens symboliques n'ont besoin d'aucune règle : `PharData` les écrit comme
des fichiers réguliers vides, donc ils ne peuvent pas s'échapper — mais cela
signifie aussi qu'**un greffon qui repose sur un lien symbolique s'installera
subtilement cassé.** N'en livrez pas.

Téléverser un greffon qui est déjà dans `/opt/fog/plugins` est une mise à
niveau ; l'administrateur est averti que des fichiers seront remplacés, et
l'ancienne copie n'est supprimée qu'une fois la nouvelle en place. Installer
les fichiers n'installe ni n'active **pas** le greffon — l'administrateur le
fait toujours depuis la même page, de sorte que « les fichiers sont là » et
« ce code s'exécute » restent des décisions séparées.

### Activer les téléversements (administrateurs)

Le pas-à-pas côté administrateur se trouve sur la
[[plugins#Installer un greffon depuis une archive|page Greffons]] ; en version
courte, ce sont deux interrupteurs indépendants, tous deux requis :

1. `FOG_PLUGIN_UI_INSTALL_ENABLED` dans **Configuration FOG → Paramètres de
   FOG → Plugin System**.
2. `sudo bin/fog-plugin-uploads.sh enable`, qui rend `/opt/fog/plugins`
   accessible en écriture au serveur web (et le ré-étiquette pour SELinux).
   `disable` et `status` font ce qu'ils disent.

La voie du téléversement nécessite aussi la permission **`plugin.install`**,
qui ne fait délibérément *pas* partie de `plugin.edit` : activer un greffon
déjà présent sur le disque et ajouter du nouveau code exécutable au serveur
sont des autorités différentes.

> **Comprenez ce que vous activez.** Un greffon est du PHP que FOG charge
> automatiquement et exécute sous l'utilisateur web. Rendre son répertoire
> accessible en écriture au web signifie que n'importe quel bogue d'écriture
> de fichier n'importe où dans FOG peut déposer du code exécutable sur le
> serveur. C'est pourquoi l'étape 2 est une commande root plutôt que quelque
> chose que la page de paramètres pourrait faire elle-même — et pourquoi
> laisser les téléversements désactivés et utiliser `git clone` est une
> réponse parfaitement valable.

---

## 12. Greffons de référence

- **`helloworld`** — l'exemple CRUD minimal et complet de ce guide.
- **`subnetgroup`** — un vrai greffon CRUD propre (relation modèle→classe,
  Export/Import, `schema()`).
- **`site`** — un greffon à cinq tables, et la référence pour le scoping
  d'objets via `OBJECT_SCOPE_CHECK`. Son `schema()` montre comment retirer une
  table que vous avez livrée (les étapes sont immuables : l'étape 3 la crée,
  l'étape 4 la supprime).
- **`persistentgroups`** — un greffon qui n'est rien d'autre qu'une étape
  `schema()` en closure (il installe un trigger MySQL). Pas de page, pas de
  modèle, pas de hooks : la preuve que rien de tout cela n'est obligatoire.
- **`ldap`** — greffon d'authentification/intégration (hooks personnalisés
  au-delà du CRUD).

En cas de doute, copiez le greffon existant le plus proche et adaptez-le — les
conventions ci-dessus sont suivies de manière cohérente dans chacun d'eux.
