---
title: Sécurité de FOG
aliases:
    - FOG Security
    - Security
description: Comment FOG se protège, et comment durcir votre serveur FOG et votre réseau d'imagerie
context_id: fog-security
tags:
    - security
    - hardening
    - https
    - firewall
    - csrf
    - reference
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/fog-security).

# Sécurité de FOG

Cette page couvre deux choses : ce que FOG fait déjà pour se protéger, et les
mesures que vous pouvez prendre pour durcir votre serveur FOG et votre réseau
d'imagerie.

## Ce que FOG fait pour se protéger

Vous obtenez ce qui suit d'emblée, sans aucune configuration :

-   **Réponses web durcies.** Chaque page est servie avec une
    Content-Security-Policy stricte, ainsi que les en-têtes `X-Frame-Options`,
    `X-Content-Type-Options: nosniff` et `X-XSS-Protection`. Lorsque HTTPS est
    activé, FOG envoie également HSTS.
-   **Échappement en sortie et assainissement des entrées.** Les données
    fournies par les utilisateurs sont échappées en HTML à l'affichage, et les
    entrées sont filtrées et débarrassées des octets nuls avant utilisation,
    afin de se prémunir contre le XSS et les injections.
-   **Protection CSRF.** Les requêtes de l'interface web qui modifient l'état
    exigent un jeton CSRF propre à la session (comparé en temps constant) ainsi
    qu'une vérification de l'origine, de sorte qu'une page malveillante ne
    puisse pas agir sur votre session ouverte.
-   **Mots de passe hachés.** Les mots de passe des comptes de l'interface web
    sont stockés sous forme d'empreintes bcrypt, jamais en clair.
-   **Communication client chiffrée.** Le client et le serveur FOG échangent
    des données à l'aide d'une paire de clés RSA propre à chaque machine et
    d'un chiffrement AES : le trafic client/serveur ne circule donc pas en
    clair.
-   **Jetons d'API.** L'API REST est protégée par un jeton d'API valable pour
    tout le serveur, complété par des jetons par utilisateur — voir
    [[api|la page de l'API]].

## Utilisez HTTPS

La mesure la plus efficace que vous puissiez prendre est de faire fonctionner
FOG en HTTPS. Vous pouvez l'activer pendant l'installation ; une fois activé, le
serveur web redirige HTTP vers HTTPS et envoie HSTS. Le fait que le démarrage
réseau passe lui aussi par HTTPS dépend de l'autorité qui a émis votre
certificat web — voir
[[pki-zones#HTTPS et netboot|HTTPS et démarrage réseau]] pour le comportement
actuel et les compromis.

Les certificats de FOG sont répartis en zones indépendantes (web, Secure Boot
et communication client), de sorte qu'en remplacer un ne mette pas les autres en
danger — voir [[pki-zones|Les zones de certificats de FOG]] et
[[pki-glossary|le glossaire PKI]]. Pour mettre en place un certificat web
approuvé (y compris des certificats Let's Encrypt gratuits), voir
[[external-ca-lets-encrypt|Utiliser une autorité de certification externe / Let's Encrypt]].
Pour signer les noyaux FOS sous UEFI Secure Boot, voir
[[secure-boot-signing|Signature Secure Boot]].

## Recommandations de durcissement

Elles ne sont pas obligatoires, mais réduisent sensiblement votre exposition.

### Isolez le réseau d'imagerie

PXE et TFTP sont **non authentifiés par conception** — le micrologiciel d'un
client en cours de démarrage n'a aucun moyen de vérifier le serveur, et TFTP
n'offre aucune authentification. C'est inhérent au démarrage réseau, et non
propre à FOG. La parade concrète consiste à faire fonctionner l'imagerie sur un
**réseau de confiance et séparé** (un VLAN dédié, ou un réseau de laboratoire ou
de provisionnement isolé) plutôt que sur un réseau local non fiable ou public.
Considérez toute machine capable de démarrer en PXE depuis votre serveur FOG
comme une machine à laquelle ce réseau fait déjà confiance.

### Pare-feu

FOG utilise plusieurs services (HTTP/HTTPS, TFTP, NFS, FTP, MySQL, multicast).
Si vous faites tourner un pare-feu local, vous devez autoriser les ports
qu'utilisent ces services — voir
[[network-and-firewall-requirements|Prérequis réseau et pare-feu]] pour la
liste. L'installeur propose de désactiver le pare-feu local (et SELinux sur les
systèmes RedHat), car un jeu de règles mal configuré est une cause fréquente
d'échec d'imagerie ; si vous préférez les laisser activés, prévoyez de gérer
les règles vous-même.

### Utilisez des identifiants solides

Changez immédiatement après l'installation le mot de passe `fog` par défaut de
l'interface web, et utilisez un mot de passe fort et unique pour les comptes de
base de données et FTP que FOG crée.

### Sécurisez la base de données

N'exposez pas MySQL/MariaDB au réseau si elle n'a besoin de servir que le
serveur FOG local, et donnez un mot de passe fort à l'utilisateur de base de
données de FOG. Exécutez l'étape de durcissement MySQL de votre distribution
(par exemple `mysql_secure_installation`) sur un serveur neuf.

### Protégez vos images et votre base de données

Votre dépôt `/images` et la base de données FOG contiennent tout ce dont un
attaquant aurait besoin pour cloner vos déploiements ou les altérer.
Restreignez-en l'accès au niveau du système de fichiers et des partages, et
conservez des sauvegardes (l'installeur peut sauvegarder la base de données lors
des mises à niveau — voir [[install-fog-server|Installer le serveur FOG]]).

### Maintenez FOG à jour

Utilisez une version récente. Les correctifs de sécurité et de stabilité
arrivent au fil du temps dans les branches dev et stable, et rester
raisonnablement à jour est le moyen le plus simple d'en bénéficier.

## Références et lectures complémentaires

-   [[network-and-firewall-requirements|Prérequis réseau et pare-feu]]
-   [[pki-zones|Les zones de certificats de FOG]]
-   [[pki-glossary|Glossaire PKI et Secure Boot]]
-   [[external-ca-lets-encrypt|Utiliser une autorité de certification externe / Let's Encrypt]]
-   [[secure-boot-signing|Signature Secure Boot]]
-   [[api|API de FOG]]
-   [Firewall configuration (forums FOG)](https://forums.fogproject.org/topic/6162/firewall-configuration)
-   [SELinux policy discussion (forums FOG)](https://forums.fogproject.org/topic/6154/selinux-policy)
