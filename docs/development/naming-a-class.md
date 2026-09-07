---
title: Naming a Class — new and getClass
aliases:
    - Naming a Class — new and getClass
    - getClass
    - getClass to new
    - Class Instantiation
description: Why FOG instantiated almost everything through getClass, why literal names moved to new, and which of the two is correct where
context_id: naming-a-class
tags:
    - 1_6-changes
    - development
    - plugins
    - architecture
---

# Naming a Class — new and getClass

>[!info] FOG 1.6 and later
>This describes the 1.6 source tree. FOG 1.5 has no namespaces and no
>`qualify()` map, so `getClass()` there is simply how classes are made.

For most of FOG's life, core built almost everything by handing a quoted
string to a factory: `FOGBase::getClass('Host')`. It no longer does. A class
named by a **literal** is now instantiated with `new`; `getClass()` stays for
the one shape `new` cannot express, a class named by a **variable**.

The decision and its evidence are fogproject's ADR 0043, *A class is named at
the call site, not fetched by string*. This page is the summary, and the
reasoning, for anyone writing against the tree.

## The short version

| You are naming the class... | Write | Because |
|---|---|---|
| With a literal, inside `packages/web/src` | `use FOG\Items\Host;` then `new Host()` | House style — most files there already carry an import block |
| With a literal, in a file that declares no namespace, or anywhere in `fog-plugins` | `new \FOG\Items\Host()`, fully qualified | A plugin tree is fetched on its own and cannot assume core's class list is nearby |
| With a **variable** — a name that arrived in a URL, over the API, or out of a config row | `self::getClass($name)` | `new` cannot express it. This is what `getClass()` is now for |
| And you want its default properties, not an instance | `self::getClass($name, '', true)` | Returns `ReflectionClass::getDefaultProperties()`; there is no `new` equivalent |

## Why `getClass()` existed

It was not an accident, and it was not a style choice. FOG's move into
namespaces renamed 226 files into `FOG\<Bucket>\<Class>`, and the tree had to
keep working after every commit along the way.

At the time there were **459 literal call sites across 120 files**, spelling
136 distinct class names. One function that turned a bare name into whatever
the namespace happened to be that week is exactly the right tool for that
job, and it did the job: the migration landed without editing any of those
sites. The project's own refactor brief called it "the whole reason the
migration is tractable".

## Why the literal form went

The migration finished. What the literal sites were left paying was a
standing cost with nothing on the other side of it.

**The type was erased.** `getClass()` is declared `@return object|mixed`, so
static analysis cannot check anything you do with the result and no editor
can follow one to a definition. That is not theoretical. Converting the tree
surfaced **90 PHPStan errors on a baseline that reported zero** — every one
pre-existing, every one previously unreachable. They included `@return void`
on a method whose body returns an array, `@return object` on methods that
return `false` (so every `if (!$x->destroy())` guard in the tree read as dead
code), and `@return object` on a method that returns trimmed strings.

None of those were new defects. They are what a decade of annotations
drifting behind their bodies looks like when something finally reads them.

**It was never a substitution seam.** That is the usual argument for keeping
a factory, and it does not hold here: `qualify()` consults core's map
*before* the plugin map, and that ordering is load-bearing — it is what stops
a plugin answering a core name. Nothing could ever answer `getClass('Host')`
with a different class, so there was no behaviour to preserve beyond
resolving the name, which `use FOG\Items\Host;` already does at compile time
and checkably.

>[!note] The exception that proves it
>The test harnesses *do* substitute through it — `tests/lib/bootmenu-harness.php`
>declares a stub `FOGBase` whose `getClass()` returns cut-down stand-ins. But
>that seam belongs to the harness replacing `FOGBase` wholesale, not to the
>factory, and `tests/lib/stub-buckets.php` re-exports flat stubs under their
>bucketed names precisely so a direct `new` finds them.

## Where `getClass()` is still correct

Roughly forty sites, and they are the ones that matter: `Route`,
`Authorization`, `OpenAPI`, `FOGPage::$childClass` and the page-post
machinery all hold a lowercase string that arrived over the API or in a URL
and turn it into a class through `qualify()`. Nothing else can do that, and
narrowing the function to that single job is what makes the job legible.

Two literal forms survive because they have no `new` equivalent at all:

- **`getClass('X', '', true)`** — returns the class's default properties
  rather than an instance. `getClass('OUI', '', true)` is the live example.
- **`getClass('ReflectionClass', ...)`**, which the factory special-cases.

## The one place a bare name still bites

Core resolves a bare name wherever *core* does the resolving: `getClass()`
with a variable, `getManager()`, discovery, `$childClass`,
`Route::_newEntity()`, `Authorization`. A class name **your own code** holds
in a plain string gets no such mapping — so `new $someString` or
`is_subclass_of($x, 'SomeClass')` naming a bare plugin class will not
resolve. Spell those fully qualified.

## How it is enforced

`tests/getclass-literals.test.php` in `fogproject` already checked that a
literal names a class spelled exactly as declared. It now also refuses a
literal `getClass()` that is neither of the two surviving forms. Its
scan-sanity anchor counts *declarations* rather than literals — counting
literals would have made the gate weaker every time it succeeded.

`fog-plugins` carries its own `tests/core-references-are-qualified.test.php`,
which refuses a bare core name outright.

## Doing the sweep on your own tree

`bin/getclass-to-new.php` in `fogproject` is the tool the conversion was done
with, and it is kept so it can be re-run against a plugin tree or a
long-lived branch. It resolves names through the same core-then-plugins order
`qualify()` uses, so it cannot silently repoint a call at a plugin class, and
it is token-based rather than regex-based — which is what keeps it off the
`getClass(` occurrences that live inside strings, docblocks and commented-out
code.

>[!warning] What this does not do
>It does not make the tree type-safe. It makes those call sites *visible* to
>a checker that was previously blind to them. The 90 errors were the first
>instalment of that, not the last.

## See also

- [[development/plugin-development#Name the class, do not fetch it by string|Building a FOG Plugin]] — the plugin author's version, with the fully-qualified spelling rule
- [[plugin-schema-migrations|Plugin Schema Migrations]]
