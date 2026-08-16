---
title: Workflows de publication de FOS
description: Comment les GitHub Actions du dépôt FOS compilent et publient les noyaux et les inits, et comment une version expérimentale devient la version officielle
context_id: fos-release-workflows
aliases:
    - FOS Release Workflows
    - Experimental Release
    - Promoting a FOS experimental release
tags:
    - development
    - release
    - automation
    - fos
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/development/fos-release-workflows).

# Workflows de publication de FOS

[`FOGProject/fos`](https://github.com/FOGProject/fos) — le dépôt de compilation
Buildroot/noyau décrit dans [Publication de FOG](fog-release.md) — publie ses
noyaux et ses inits via trois workflows GitHub Actions, plutôt que par le
pipeline de PR `dev-branch` → `stable` décrit dans
[Processus de publication stable](stable-release-workflow.md). FOS n'a pas de
`dev-branch` : chaque workflow présenté ici compile directement depuis la
référence extraite (normalement `master`) et publie directement une version
GitHub étiquetée.

- [`create_experimental_release.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/create_experimental_release.yml)
  — à la demande, compilation partielle, préversion. C'est le workflow qui est
  réellement utilisé, y compris comme base de la version « officielle » (voir
  plus bas).
- [`create_release.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/create_release.yml)
  — nommé « Create Latest/Official Release », conçu comme la voie de compilation
  complète et officielle, mais qui n'a **jamais été exécuté une seule fois**
  (vérifié via l'API Actions).
- [`make_usb.yml`](https://github.com/FOGProject/fos/blob/master/.github/workflows/make_usb.yml)
  — censé réagir à toute version publiée et y attacher une image USB amorçable,
  mais qui ne s'est déclenché qu'une seule fois dans l'histoire du dépôt, et
  cette exécution a échoué.

## Experimental Release

Déclenché à la main (`workflow_dispatch`) avec six entrées booléennes — init et
noyau, chacun pour `arm64`/`x64`/`x86` — afin qu'un mainteneur puisse ne
compiler que l'élément à tester (par exemple uniquement le noyau arm64 après une
modification de pilote) au lieu de tout reconstruire. `input_checks` fait échouer
l'exécution si aucune entrée n'est cochée.

Seuls les travaux `build_kernel_*`/`build_initrd_*` sélectionnés s'exécutent ;
les travaux d'init restaurent en outre un cache de téléchargement Buildroot et
un ccache propre à l'architecture (indexés sur l'empreinte de `build.sh` et
l'identifiant de l'exécution) afin d'accélérer les itérations. Le travail final
`release` s'exécute une fois que tous les travaux de compilation demandés sont
terminés, conditionné par
`!contains(needs.*.result, 'failure') && !contains(needs.*.result,
'cancelled')` — un travail jamais demandé n'est ni en échec ni annulé, de sorte
que sauter des composants ne bloque pas la publication.

La version publiée est délibérément marquée comme n'étant **pas** la « vraie » :

- Étiquette : `EXP_<horodatage UTC>` (par exemple `EXP_20260730-141502`).
- Nom : `Experimental release from <date/heure UTC>`.
- `prerelease: true`, et le corps est précédé d'un avertissement explicite
  invitant à sauvegarder.

C'est le mécanisme permettant de mettre une compilation entre les mains de la
communauté — les testeurs l'installent manuellement — sans qu'elle puisse jamais
être prise pour la version officielle, ni récupérée par un outil qui cherche la
dernière version non préliminaire.

## Create Latest/Official Release

Le workflow qui porte effectivement le nom **« Create Latest/Official Release »**
(`create_release.yml`) est conçu pour toujours compiler les six combinaisons
noyau/init — il n'y a pas de sélection par composant ici — et ne passer à
`release` que si chacun de ces six travaux réussit (un simple `needs:`, sans
surcharge `always()`, contrairement au workflow expérimental).

Deux entrées `workflow_dispatch` sont censées déterminer le type de version
produite :

| `is_official_release` | `official_fog_version` | Résultat |
|---|---|---|
| décoché | *(doit rester vide)* | Version continue, étiquette `<AAAAMMJJ>`, nom `Latest from <date>` |
| coché | *(obligatoire)* | Version officielle, étiquette et nom correspondant à la version donnée, nom `FOG {version} kernels and inits` |

`input_checks` impose cette correspondance (version renseignée si et seulement si
la case est cochée) avant toute compilation.

**En pratique, ce workflow n'a jamais été exécuté.** La consultation directe de
son historique GitHub Actions
(`gh api repos/FOGProject/fos/actions/workflows/49199525/runs`) affiche
`"total_count": 0` — zéro exécution, jamais, depuis son ajout en février 2023.
Toutes les versions publiées portant l'apparence d'une « Latest from … » ou
d'une version officielle (voir ci-dessous) ont été produites autrement.
Considérez ce workflow comme conçu mais inutilisé plutôt que comme la véritable
voie de publication, et lisez la note sur l'image de runner en fin de page avant
de le déclencher pour de bon.

## Comment une version devient réellement officielle

Le nom de version continue « Latest from … » est signalé comme déterminant dans
les commentaires mêmes de `create_release.yml` — **la page de mise à jour du
noyau de FOG analyse exactement ce format de nom de version** — mais la version
qui porte réellement cette signification (la plus récente version non
préliminaire du dépôt) est produite à la main, en modifiant sur place le
résultat d'une **Experimental Release** plutôt qu'en déclenchant le workflow
dédié :

1. Déclenchez **Experimental Release** comme d'habitude (les six composants, ou
   seulement ceux à tester). Elle compile et publie automatiquement sa
   préversion `EXP_<horodatage UTC>` habituelle, avec les six fichiers
   noyau/init et leurs fichiers `.sha256` attachés.
2. Une fois cette compilation validée, modifiez **cette même** version sur
   place : remplacez son étiquette par la forme de version continue (par exemple
   `EXP_20260726-203912` → `20260730`), renommez le titre (par exemple
   `Release 20260730`) et décochez la case « Set as a pre-release ». Aucun
   fichier n'est téléversé de nouveau — les six éléments que cette exécution
   expérimentale a déjà compilés et attachés deviennent tels quels les éléments
   de la version officielle.

Cela a été confirmé directement sur un exemple réel : la version `20260730`
(publiée le 26/07/2026) a pour `author: github-actions[bot]` et un `created_at`
qui correspond — à la seconde près — à la date du commit de la tête de `master`
à partir duquel une exécution d'`Experimental Release` (déclenchée par un
mainteneur, `run:30216684381`) a compilé ce même jour ; l'objet de publication
est la préversion créée par le bot lors de cette exécution, modifiée ensuite. Le
`created_at` d'une version GitHub reflète la date du commit étiqueté plutôt que
celle de l'appel d'API, ce qui rend la chose identifiable après coup.

Modifier ainsi la version ne fonctionne proprement que **le jour même** (ou peu
après) la fin de la compilation expérimentale : `buildFilesystem()` dans
`build.sh` inscrit `initversion` dans `funcs.sh` avec la date de la compilation
elle-même (`export initversion=$(date +%Y%m%d)`), de sorte que réétiqueter une
version expérimentale bien plus ancienne comme la « Latest » du jour livrerait
un init dont la chaîne de version embarquée ne correspondrait plus à la date de
publication.

Il n'y a rien à nettoyer séparément — la préversion expérimentale ne continue
pas d'exister sous son ancienne étiquette `EXP_*` une fois réétiquetée : elle
*devient* l'objet de la version officielle.

## Attachement de l'image USB (actuellement non fonctionnel)

`make_usb.yml` est écrit pour écouter `release: published`, avec l'intention de
compiler une image USB amorçable à partir des éléments de la version elle-même
(`create-usb-image.sh` sur
`https://github.com/<repo>/releases/download/<tag>`) et de rattacher
`fos-usb.img` à cette même version. En pratique, cela ne se produit pas :

- Il ne s'est déclenché qu'**une seule fois** dans toute l'histoire du dépôt
  (le 05/07/2026), et cette exécution a **échoué**.
- Il ne se déclenche **pas** pour une version promue en modifiant une préversion
  existante (la méthode ci-dessus) — GitHub n'envoie l'action `published` que
  lors de la première publication d'une version, et non lorsqu'une préversion
  est ensuite basculée en version complète : la méthode de réétiquetage sur
  place décrite plus haut ne le déclenche donc jamais.
- Confirmé sur la version `20260730` en ligne : ses seuls éléments sont les six
  fichiers noyau/init et leurs sommes de contrôle — pas de `fos-usb.img`.

Aucune version de FOS ne livre donc actuellement d'image USB attachée
automatiquement ; une image USB devrait aujourd'hui être compilée et attachée à
la main avec `create-usb-image.sh` si elle s'avérait nécessaire.

## Si vous voulez réellement déclencher Create Latest/Official Release

Comme il n'a jamais été exécuté, rien de ce qui suit n'est prouvé — il s'agit
d'une lecture statique du YAML, non d'un résultat constaté :

- Aucun obstacle structurel repéré : le `default_workflow_permissions` du dépôt
  est `write`, de sorte que le `GITHUB_TOKEN` implicite peut créer une version
  sans bloc `permissions:` explicite, comme le fait déjà le workflow
  Experimental Release (qui fonctionne). L'extraction des versions du noyau et
  de Buildroot ainsi que la validation de l'appariement des entrées sont
  identiques, octet pour octet, à une logique qu'Experimental Release exécute
  déjà avec succès.
- Il s'exécute sur `ubuntu-22.04`, que GitHub a commencé à déprécier le
  17/09/2026 (retrait complet le 17/04/2027) — les travaux commenceront à
  échouer par intermittence pendant cette période. Experimental Release a été
  basculé sur `ubuntu-24.04` dans le commit même qui l'a ajouté ; ce workflow-ci
  ne l'a pas été.
- Ses versions d'actions figées ont deux versions majeures de retard sur celles
  d'Experimental Release (`actions/checkout@v4` contre `@v6`,
  `upload`/`download-artifact@v4` contre `@v7`/`@v8`,
  `softprops/action-gh-release@v2` contre `@v3`) — rien de cassé actuellement,
  simplement le signe qu'il n'a pas été touché depuis le 03/04/2024.
- Contrairement à Experimental Release, ses travaux de compilation du système de
  fichiers n'ont aucun cache de téléchargement Buildroot ni ccache : une
  exécution réelle effectue donc une compilation entièrement à froid pour les
  trois architectures — attendez-vous à une durée nettement plus longue et à une
  plus grande exposition aux aléas du réseau que pour les compilations
  expérimentales que vous avez l'habitude de lancer.

## Voir aussi

- [Publication de FOG](fog-release.md) — le processus manuel de montée de
  version du noyau, de Buildroot et d'iPXE qui précède normalement une
  publication de FOS ; les sections « Noyau FOS » et « Init de FOS » de cette
  page décrivent la mise à jour de `configs/kernel*.config` et
  `configs/fs*.config`, ce que ces workflows compilent et publient ensuite.
- [Processus de publication stable](stable-release-workflow.md) — le pipeline de
  promotion équivalent pour `fogproject` lui-même. Contrairement à FOS, ce dépôt
  promeut via une PR `dev-branch → stable` conditionnée à des tests de
  validation d'installation ; FOS n'a ni modèle de branches équivalent ni
  barrière de tests automatisés — la promotion s'y fait par le déclenchement
  manuel décrit ci-dessus, les tests de la communauté sur la préversion
  expérimentale tenant lieu de validation automatisée.
