---
title: Intégration Active Directory
description: Présentation de la gestion des paramètres Active Directory
context_id: ad-integration
aliases:
    - Active Directory Integration
    - kb/how-tos/active-directory-fog-setting
tags:
    - management
    - active-directory
    - ou
    - microsoft
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/management/web/ad-integration).

# Intégration Active Directory
FOG est capable d'enregistrer une machine dans Active Directory, dans une
certaine mesure.

## Prérequis

Pour que l'intégration Active Directory fonctionne, il vous faut ce qui
suit :

-   L'image devra contenir le service FOG installé.
-   Le module **HostNameChanger** du client FOG doit être activé — lors de
    l'installation ou de la reconfiguration du client FOG sur la machine,
    assurez-vous que ce module est actif, sans quoi la machine ne tentera
    jamais de rejoindre le domaine, quelle que soit la configuration
    décrite ci-dessous.
-   Avant de capturer votre image, l'ordinateur ne doit être membre
    d'AUCUN domaine
-   Pour ajouter un ordinateur à un domaine, FOG a besoin du nom
    d'utilisateur et du mot de passe d'un compte disposant des droits sur
    l'unité organisationnelle où sont stockés les objets ordinateur dans
    l'arborescence du domaine. Ce compte utilisateur doit avoir le droit
    de joindre des ordinateurs au domaine, ainsi que des droits suffisants
    pour créer et gérer les objets ordinateur.

>[!note]
>FOG s'efforce de protéger votre mot de passe en le chiffrant, mais comme
>FOG est un logiciel open source, il est possible que quelqu'un déchiffre
>votre mot de passe si vous ne changez pas la « Passkey » de FOG. Il est
>fortement recommandé de changer cette Passkey avant de mettre en œuvre
>l'intégration AD dans un environnement de production. Changer la Passkey
>impose de recompiler le module de changement de nom du service FOG, mais
>pas de panique : ce n'est pas difficile et cela ne doit être fait qu'une
>seule fois. Reportez-vous à la documentation ci-dessous.
   

## Configuration aux différents niveaux

Le même ensemble de champs (domaine, nom d'utilisateur, mot de passe,
unité organisationnelle) présenté ci-dessous peut être défini à trois
niveaux différents, appliqués du plus spécifique au moins spécifique :

-   **Valeurs par défaut globales** — Interface web : Configuration FOG →
    Renommage machine. Définit la valeur par défaut, valable pour tout le
    domaine, qui sert à préremplir les champs ci-dessous lorsqu'une
    machine ou un groupe ne la surcharge pas.
-   **Groupe** — Interface web : Gestion des groupes → sélectionnez un
    groupe → Active Directory. Applique les paramètres en lot à toutes les
    machines présentes dans le groupe au moment de l'enregistrement. Il
    s'agit d'une application ponctuelle en lot — elle n'est **pas**
    conservée durablement sur le groupe et n'est pas appliquée
    automatiquement aux machines ajoutées au groupe par la suite.
-   **Machine individuelle** — Interface web : Gestion des machines →
    sélectionnez une machine → Active Directory. Voir ci-dessous le détail
    champ par champ.

Pour configurer une seule machine afin qu'elle utilise AD :

-   Rendez-vous dans la section des machines du portail de gestion FOG et
    sélectionnez la machine que vous souhaitez joindre à AD
-   Dans le menu supérieur, sélectionnez la section « Active Directory ».

Vous disposez des options suivantes :

-   **Joindre le domaine après le déploiement**

    Lorsque cette case est cochée, FOG applique les valeurs par défaut
    globales d'Active Directory pour préremplir les champs de cette
    section.

-   **Nom de domaine**

    Le nom de domaine pleinement qualifié. Exemples :

    -   company
    -   company.ad
    -   company.com
    -   company.local

-   **Unité organisationnelle**

    L'unité organisationnelle, au format LDAP, dans laquelle l'objet
    ordinateur sera créé. Exemples :

    -   OU=PCs,DC=company,DC=com
    -   OU=Lab Computers,OU=PCs,DC=company,DC=com

    Si vous laissez ce champ vide, l'objet ordinateur sera créé dans l'OU
    par défaut des nouveaux PC, normalement « Computers ».

    > [!note]
    > Certains utilisateurs ont signalé qu'un champ OU vide produisait
    > `HostnameChanger The parameter is incorrect, code = 87` dans le
    > journal du client. Si cela vous arrive, essayez de définir une OU
    > explicite (par exemple `OU=Computers,DC=yourdomain,DC=com`) plutôt
    > que de laisser le champ vide.

-   **Nom d'utilisateur du domaine**

    Le nom d'utilisateur qui créera l'objet ordinateur. Cet utilisateur
    doit disposer de droits suffisants pour créer l'objet ordinateur dans
    l'OU. Il s'agit généralement d'un compte membre du groupe
    « Administrateurs du domaine ».

    Saisissez uniquement le nom d'utilisateur dans ce champ, par exemple :
    FOGServiceAccount. N'ajoutez pas le nom de domaine.

-   **Mot de passe du domaine**

    Le mot de passe de l'utilisateur ci-dessus. Le mot de passe doit être
    saisi en clair et sera chiffré automatiquement lors de
    l'enregistrement.

-   **Redémarrage forcé pour le changement de nom / la jonction AD ?**

    Cocher cette case configure le client pour qu'il applique le
    changement de nom de machine et les paramètres AD, qu'un utilisateur
    soit connecté ou non.

    Ainsi, si l'option est activée, le client redémarrera l'ordinateur
    pour mettre à jour le nom de machine même si un utilisateur est
    connecté. Si elle est décochée, le client attendra que plus personne
    n'utilise l'ordinateur avant de redémarrer pour appliquer le nom de
    machine et les paramètres AD.

-   **Mettre à jour**

    Après avoir modifié les champs de cette section, cliquez sur
    « Update ».

    Le « Renommage machine », un module du client FOG, vérifie à chaque
    interrogation si la machine cliente fait partie d'Active Directory
    telle qu'elle est configurée. Si ce n'est pas le cas, il effectuera
    l'une des tâches suivantes :

    -   Si des utilisateurs sont connectés et que la case « Name Change/AD
        Join Forced Reboot » est cochée, le client rejoindra le domaine et
        redémarrera immédiatement
    -   Si aucun utilisateur n'est connecté, le client rejoindra le
        domaine et redémarrera.

## Diagnostic avec netdom

Si une machine ne parvient pas à rejoindre le domaine, vous pouvez tester
la même jonction ou sortie de domaine directement depuis une ligne de
commande Windows, en contournant complètement FOG, afin de déterminer si
le problème vient de la configuration de FOG ou des identifiants et
permissions du domaine eux-mêmes. Le mot de passe n'est **pas** chiffré
pour ce test en ligne de commande — exécutez la commande, mais ne la
collez pas dans des scripts et ne partagez pas sa sortie.

Joindre un domaine :

```
netdom JOIN mypcHostname /Domain:yourdomain /OU:yourOU /UserD:FOGUser /PasswordD:FOGPassword /reboot:35
```

Retirer d'un domaine :

```
netdom REMOVE mypcHostname /domain:yourdomain /UserD:FOGUser /PasswordD:FOGPassword
```

Si ces commandes réussissent alors que la jonction AD propre à FOG échoue
toujours, le problème se situe plus probablement dans la configuration de
FOG (module HostNameChanger inactif, syntaxe d'OU incorrecte, mot de passe
chiffré obsolète) que dans les permissions du compte de domaine.
