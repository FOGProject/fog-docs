---
title: Processus de publication stable
description: Comment les changements de dev-branch deviennent une version stable étiquetée
context_id: stable-release-workflow
aliases:
    - Stable Release Workflow
    - stable-releases.yml
tags:
    - development
    - release
    - automation
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/development/stable-release-workflow).

# Processus de publication stable

[`stable-releases.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/stable-releases.yml)
dans `FOGProject/fog-workflows` est le pipeline qui transforme l'état courant de
`dev-branch` en une version `stable` étiquetée et publiée. Il s'exécute tous les
mois (`11 11 11 * *` — le 11 à 11 h 11 UTC) ou à la demande via
`workflow_dispatch`. Voir
[Automatisation de la synchronisation de version](version-sync-automation.md)
pour savoir comment le *numéro* de version lui-même est calculé ; cette page
décrit ce qui se passe une fois qu'une version est effectivement publiée.

## Le déroulé

1. **`create-release-pull-request`** lit `FOG_VERSION` directement dans le
   `system.class.php` de `dev-branch` et le compare au nom de l'étiquette de la
   dernière version GitHub publiée. S'ils correspondent, il n'y a rien de
   nouveau à publier — l'exécution s'arrête là (**`no-release-needed`** publie
   sur Discord une note « rien à publier » et se termine). S'ils diffèrent, une
   PR `dev-branch → stable` est ouverte, intitulée
   `Stable Release PR For {version} - {date}`.
2. **`run-install-tests`** déclenche le `run_all_distros.yml` de
   `FOGProject/fogproject-install-validation` — la matrice complète des
   distributions prises en charge.
3. **`check-all-tests-completed-successfully`** interroge cette exécution
   jusqu'à ce qu'elle signale `success` ou `failure`, et fait échouer la tâche
   si les tests par distribution ont échoué.
4. En cas de succès, **`merge-after-all-tests-passed`** fusionne la PR
   (`dev-branch` dans `stable`). En cas d'échec,
   **`close-pr-if-tests-fail`** ferme la PR à la place et publie un avis d'échec
   sur Discord — rien n'est publié.
5. **`tag-and-release`** (uniquement après une fusion réussie) construit la
   version :
   - Génère les notes de base via l'API GitHub `releases/generate-notes`.
   - Ajoute une section `## Commits` construite à partir de `git log`, en
     filtrant les commits de fusion, les commits des précédentes PR « Stable
     Release » et les commits correctifs
     `chore: fix stale FOG_VERSION/FOG_CHANNEL` (voir
     [Automatisation de la synchronisation de version](version-sync-automation.md))
     — ceux-ci restent dans l'historique git, ils sont simplement exclus du
     journal des modifications affiché afin qu'une série de commits de bot
     quasi identiques n'inonde pas les notes.
   - Ajoute les tickets clos depuis la version précédente, ainsi que toute
     alerte de sécurité GitHub nouvelle ou mise à jour — pour ces dernières, il
     **modifie également l'alerte elle-même** (PATCH), en ajoutant l'étiquette
     de cette version à `patched_versions`.
   - Publie la version GitHub (`gh release create`), étiquetée et intitulée avec
     le numéro de version, marquée `--latest`.
6. **`sync-branches`** ouvre et fusionne une PR `stable → dev-branch`, afin que
   le commit de publication (et l'historique attenant à l'étiquette) revienne
   dans `dev-branch` plutôt que de laisser les deux branches diverger
   silencieusement.
7. **`discord-success`** publie l'annonce de la version avec un lien vers les
   notes de publication GitHub.

## Pourquoi cette structure

- **Lire la version plutôt que la calculer** : ce workflow ne fait jamais que
  *lire* `FOG_VERSION` pour décider s'il y a quelque chose de nouveau à publier
  — il ne la recalcule jamais. La version de `stable` est entièrement celle déjà
  calculée sur `dev-branch` par les mécanismes décrits dans
  [Automatisation de la synchronisation de version](version-sync-automation.md) ;
  ce workflow décide seulement du moment de la promotion. C'est aussi pourquoi
  le balayage quotidien de synchronisation de version s'exécute à 10 h 10 UTC,
  soit un peu plus d'une heure avant le créneau de 11 h 11 UTC de ce workflow —
  un jour de publication lit toujours une version à jour.
- **Les tests conditionnent la fusion, pas la version** : rien ici n'est une
  vérification d'intégration continue déclenchée par `pull_request`. La suite de
  validation d'installation s'exécute *après* l'ouverture de la PR de
  publication, et seule une exécution réussie provoque la fusion — une
  exécution en échec ferme la PR au lieu de la laisser ouverte indéfiniment.
- **La PR de resynchronisation** existe pour que `stable` et `dev-branch` ne
  s'écartent jamais après une publication — sans elle, le commit de publication
  ou d'étiquetage créé directement sur `stable` n'existerait que là.

## Voir aussi

- [Automatisation de la synchronisation de version](version-sync-automation.md)
  — comment `FOG_VERSION`/`FOG_CHANNEL` sont maintenus corrects sur chaque
  branche, y compris sur `dev-branch` avant même que ce workflow ne les lise.
- [Publication de FOG](fog-release.md) — le volet manuel d'une publication
  (mises à jour des binaires du noyau, de l'init et d'iPXE) qui a généralement
  lieu avant le déclenchement de ce workflow.
