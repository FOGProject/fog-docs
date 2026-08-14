---
title: Gestion des utilisateurs
aliases:
    - User Management
description: Explique comment gérer les utilisateurs dans l'interface
context_id: users
tags:
    - in-progress
    - management
    - users
    - web-ui
    - web-management
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/users).

# Gestion des utilisateurs

## Vue d'ensemble

Les utilisateurs de FOG peuvent se connecter à l'interface web et lancer depuis
le menu PXE des tâches protégées par mot de passe (déploiement, capture, etc.).

## Créer des comptes

Tous les comptes se créent dans la section **Utilisateurs** de l'interface web
de FOG.

-   

    Pour créer un nouveau compte, cliquez sur le bouton « New User » dans la partie gauche de la page.

    :   -   

            Tout compte doit avoir un nom d'utilisateur unique et un mot de passe.

            :   -   Vous pouvez également accorder l'accès à l'API ou
                    définir un nom d'affichage

-   Après avoir renseigné les informations requises, cliquez sur le bouton
    « Create User ».

## Modifier des utilisateurs

Les comptes FOG peuvent être modifiés depuis la section des utilisateurs.

-   Vous devez d'abord trouver le compte à modifier en cliquant sur le bouton
    « List all Users » dans la partie gauche de la page.

-   Une fois l'utilisateur trouvé, cliquez sur son nom d'utilisateur pour
    accéder à la page d'édition.

-   

    Modifiez les paramètres généraux (nom), le mot de passe ou les paramètres d'API.

    :   -   Cliquez sur **Mettre à jour** pour enregistrer les modifications
        -   Utilisez la navigation par onglets pour trouver les paramètres
            généraux, de mot de passe et d'API

## Restreindre ce qu'un utilisateur peut faire

Depuis FOG 1.6, chaque compte utilisateur dispose d'un onglet **Rôles** dans
lequel vous pouvez attribuer un ou plusieurs rôles afin de limiter ce que le
compte peut voir et faire. Un utilisateur sans rôle n'a aucun accès : chaque
compte doit donc en avoir au moins un. Voir [Rôles et permissions](roles.md)
pour plus de détails.
