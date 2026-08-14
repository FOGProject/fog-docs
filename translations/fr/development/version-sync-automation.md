---
title: Automatisation de la synchronisation de version
description: Comment FOG_VERSION/FOG_CHANNEL sont maintenus synchronisés entre les branches
context_id: version-sync-automation
aliases:
    - Version Sync Automation
    - FOG_VERSION automation
tags:
    - development
    - release
    - automation
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/development/version-sync-automation).

# Automatisation de la synchronisation de version

`FOG_VERSION` et `FOG_CHANNEL` (définis dans
`packages/web/lib/fog/system.class.php`) sont calculés à partir de l'état de git
— le nom de la branche courante, la distance depuis la dernière étiquette et le
nombre de commits — plutôt qu'incrémentés à la main. Voir le README du dépôt
principal (« Versioning and branches ») pour le format de version lui-même
(`{CodeBaseMajor}.{Major}.{Minor}.{Patch}`) et ce que représente chaque branche.
Cette page explique comment la *chaîne* de version reste correcte sur chaque
branche sans que personne ne l'incrémente à la main.

## La formule vit dans un seul script, séparé de l'écriture

`.githooks/lib/fog-version.sh` est la source unique de vérité pour la formule.
À partir d'un nom de branche, il calcule `FOG_VERSION`/`FOG_CHANNEL` et affiche
trois lignes : la version, le canal, et si cela diffère de ce qui est
actuellement enregistré (`true`/`false`). Il ne touche à aucun fichier — c'est
purement une fonction de l'état de git, que l'on peut exécuter à la volée
(localement ou en intégration continue) sans laisser derrière soi un arbre de
travail modifié.

`.githooks/lib/apply-fog-version.sh <version> <channel>` est la seule chose qui
écrive dans `system.class.php` — deux appels à `sed`, rien de plus. Les
appelants (le hook local, l'intégration continue) exécutent `fog-version.sh` et
n'appellent `apply-fog-version.sh` que lorsque la troisième ligne indique
`true`. Cette séparation existe pour que :

- la formule (la partie réellement propice aux erreurs — voir *Historique des
  incidents* ci-dessous) et l'écriture (mécanique, pratiquement infaillible)
  vivent chacune à un seul endroit, et
- rien ne soit écrit, indexé ni enregistré du tout lorsqu'il n'y a rien à
  corriger, plutôt que d'écrire systématiquement puis de vérifier ensuite
  `git diff` pour décider s'il faut valider.

La formule, par préfixe de branche :

| Préfixe de branche | Canal | Schéma de version |
|---|---|---|
| `dev` (`dev-branch`) | *(aucun)* | `{tag base}.{commits depuis master}` |
| `stable` | *(aucun)* | Identique à `dev`, mais compté depuis `dev-branch` plutôt que depuis `HEAD` |
| `working` (`working-1.6`) | Beta | `{suffixe de branche}.0-beta.{commits depuis master}` |
| `feature` (`feature-*`) | Feature | `{suffixe de branche}.0-feature.{commits depuis master}` |
| `rc` (`rc-*`) | Release Candidate | `{suffixe de branche}.0-RC-{n}`, où `n` s'incrémente de 1 par rapport à ce qui est actuellement enregistré |

`dev-branch` et `stable` ne portent délibérément **aucune ligne `FOG_CHANNEL`**
— une chaîne de version propre, sans texte de canal, à dessein. Ce n'est pas un
oubli ; n'en ajoutez pas. Les branches `working`/`feature`/`rc`, elles,
affichent bien une étiquette de canal. De ce fait, la détection de dérive ne
compare le canal que lorsqu'une ligne de canal existe réellement sur cette
branche — sinon, chaque vérification sur `dev-branch` détecterait une « dérive »
par rapport à une valeur toujours vide qui n'avait jamais lieu d'être.

Le cas `rc` est intentionnellement différent des autres : il s'agit d'un
compteur manuel par modification (chaque changement réel apporté à une version
candidate incrémente `-N` de un), et non d'un décompte de commits. C'est un
choix délibéré quant à la numérotation des versions candidates, et non quelque
chose à harmoniser avec les branches fondées sur un décompte. (Il partage le
même défaut d'« anticipation du commit » que les branches fondées sur un
décompte avaient auparavant — chaque vérification propose `courant + 1`, qu'un
changement réel ait eu lieu ou non ; dès qu'une branche `rc-*` existera, il
faudra donc lui appliquer le même genre de correctif que celui déjà apporté aux
branches fondées sur un décompte. Aucune branche `rc-*` n'a encore existé pour
forcer la question.)

## 1. Le hook pre-commit local

`.githooks/pre-commit` appelle `fog-version.sh` à chaque commit local sur les
branches `working-1.6`, `dev-branch`, `rc-*` et `feature-*`. Si la troisième
ligne signale une dérive, il appelle `apply-fog-version.sh` et indexe le
résultat dans ce même commit ; sinon il ne fait rien. C'est ce que la plupart
des contributeurs vivent au quotidien, et c'est pourquoi une mise à jour de
version accompagne généralement en silence un commit par ailleurs sans rapport,
plutôt que d'apparaître comme une modification à part entière.

## 2. Le balayage quotidien de fog-workflows

Le hook pre-commit s'exécute côté client — il ne se déclenche jamais pour une PR
fusionnée depuis l'interface web de GitHub (squash, commit de fusion ou rebase),
si bien qu'une version fusionnée de cette façon peut devenir obsolète en
silence. Un unique workflow planifié sert de filet de sécurité :
[le `check-fog-version.yml` de `FOGProject/fog-workflows`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/check-fog-version.yml)
s'exécute tous les jours à 10 h 10 UTC (plus `workflow_dispatch` pour une
exécution ponctuelle ou sur toutes les branches) — soit un peu plus d'une heure
avant l'exécution mensuelle de
[`stable-releases.yml`](stable-release-workflow.md) à 11 h 11 UTC, de sorte
qu'un jour de publication ne lise jamais une version obsolète. Chaque
exécution :

1. Liste les branches de `fogproject` via l'API GitHub et les filtre selon les
   motifs surveillés (`working-1.6`, `dev-branch`, `rc-*`, `feature-*` — le même
   ensemble que celui couvert par le hook local, et **pas** `stable`, voir
   ci-dessous).
2. Pour chaque correspondance, extrait cette branche et exécute son propre
   exemplaire de `fog-version.sh` — le même script que celui appelé par le hook
   local, et non une copie de la formule maintenue séparément.
3. Si la troisième ligne signale une dérive, exécute `apply-fog-version.sh` et
   pousse un commit correctif directement sur cette branche (sans PR — il s'agit
   du même genre de correction mécanique que le hook local effectue déjà sans
   relecture). Sinon, rien n'est écrit, indexé ni enregistré.

Il n'existe aucun fichier fantoche dans `fogproject` pour cela — le workflow
découvre les branches lui-même via l'API, de sorte qu'une nouvelle branche
`feature-*`/`rc-*` est couverte automatiquement au prochain déclenchement de la
planification, sans rien à propager ni à oublier d'ajouter.

Le rythme quotidien plutôt qu'horaire existe précisément pour borner la
fréquence à laquelle cela peut s'exécuter — voir *Historique des incidents*.

### Visibilité des exécutions

Chaque instance de la matrice écrit son propre résultat — corrigé (ancienne →
nouvelle version), ou déjà correct — dans `$GITHUB_STEP_SUMMARY`. GitHub affiche
ensemble les résumés de tous les travaux sur la page Summary de l'exécution :
l'état de chaque branche surveillée est donc visible d'un seul écran, sans avoir
à ouvrir les journaux de chaque travail. `discover-branches` liste également ce
qu'il a trouvé à surveiller, de sorte que la portée d'une exécution est visible
d'emblée elle aussi.

### Pourquoi un commit correctif anticipe son propre `+1`

Un commit correctif est lui-même un vrai commit sur la branche : s'il écrivait
simplement « la valeur correcte à l'instant présent », elle serait fausse dès
son arrivée — la vérification suivante verrait le commit correctif lui-même
comme un commit de plus que ce qui a été écrit, et le « corrigerait » à nouveau.
`fog-version.sh` évite cela par un calcul en deux passes : d'abord avec le
décompte brut de commits ; si celui-ci correspond déjà à ce qui est enregistré
(la troisième ligne vaut `false`), rien ne se produit. Sinon, il recalcule une
fois de plus avec le décompte incrémenté de un — la valeur qui sera
effectivement vraie une fois ce correctif en place — et c'est celle-là qui est
appliquée. Cela converge en exactement un commit, quelle que soit l'ampleur de
l'écart, et c'est dynamique (un véritable recomptage à chaque exécution), non un
décalage fixe appliqué pour toujours.

### Historique des incidents (28/07/2026)

Une version antérieure de ce workflow n'anticipait pas son propre commit. Il
existait sous forme de fichier fantoche déclenché par push dans `fogproject`,
appelant un workflow réutilisable dans `fog-workflows`, et sa formule de
décompte de commits comptait ses propres commits correctifs antérieurs comme une
véritable dérive. Un push écrit par le bot redéclenchait le fichier fantoche
déclenché par push, lequel recalculait une valeur supérieure d'un à celle qu'il
venait d'enregistrer, et poussait un nouveau correctif — 30 commits ont atterri
sur `dev-branch` en une vingtaine de minutes avant que cela ne soit repéré. Le
passage à un déclenchement planifié (au lieu d'un déclenchement par push) a
supprimé le redéclenchement immédiat, et l'anticipation en deux passes ci-dessus
a supprimé la non-convergence sous-jacente, qui se serait sinon simplement
répétée une fois par exécution planifiée au lieu d'une fois par push. Les
quelque 150 commits correctifs résiduels de cet incident ont été laissés dans
l'historique de `dev-branch`/`working-1.6` plutôt que réécrits ; la génération
du journal des modifications de `stable-releases.yml` les exclut d'après le
motif de leur message afin qu'ils n'inondent pas les notes de publication, mais
ils sont toujours présents dans `git log` pour qui a besoin de les consulter.

Deux autres améliorations ont été livrées le même jour, portant toutes deux sur
la *fréquence* et la *visibilité* de l'exécution plutôt que sur la formule
elle-même :

- **`fog-version.sh` écrivait auparavant lui-même dans `system.class.php`** :
  l'exécuter pour quelque raison que ce soit — y compris pour un futur usage
  « détecter seulement, sans corriger » — modifiait l'arbre de travail comme
  effet de bord. Le scinder en un calcul pur (`fog-version.sh`) et une écriture
  distincte (`apply-fog-version.sh`), conditionnée au signal de dérive émis par
  l'étape de calcul, fait que rien n'est écrit du tout lorsque rien n'a besoin
  de changer.
- **Le rythme horaire était excessif** au regard de la rareté réelle des
  dérives : chaque exécution ne trouvant rien à corriger consommait tout de même
  du temps d'intégration continue pour rien, et toute exécution détectant une
  dérive représentait un commit de bot de trop si elle se répétait avant qu'un
  humain ne s'en aperçoive. Le rythme quotidien (à 10 h 10 UTC, en amont de la
  vérification mensuelle de publication) plafonne tout correctif réel à au plus
  un commit par branche et par jour.

## 3. stable-releases.yml

La version de `stable` appartient entièrement au
[`stable-releases.yml`](https://github.com/FOGProject/fog-workflows/blob/main/.github/workflows/stable-releases.yml)
de fog-workflows (voir
[Processus de publication stable](stable-release-workflow.md) pour le
fonctionnement de bout en bout de ce pipeline), qui pilote tout le flux de
publication (validation, étiquetage, notes de publication, resynchronisation de
`stable` vers `dev-branch`). Le balayage quotidien ci-dessus exclut délibérément
`stable` afin que les deux mécanismes ne se disputent jamais la même branche, et
s'exécute suffisamment tôt dans la journée pour rester en amont.

Voir [Publication de FOG](fog-release.md) pour le volet manuel de la publication
d'une version (mises à jour du noyau, de l'init et d'iPXE) ; cette page ne
traite que de la façon dont la *chaîne* de version elle-même reste correcte.
