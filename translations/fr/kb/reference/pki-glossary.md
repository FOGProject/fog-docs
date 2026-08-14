---
title: Glossaire PKI et Secure Boot
aliases:
    - PKI & Secure Boot Glossary
    - Certificate Glossary
description: Définitions en langage clair de la terminologie des certificats et du Secure Boot dans FOG
context_id: pki-glossary
tags:
    - reference
    - security
    - certificates
    - pki
    - secure-boot
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/pki-glossary).

# Glossaire PKI &amp; Secure Boot

Définitions courtes des termes employés dans
[[pki-zones|Les zones de certificats de FOG]],
[[secure-boot-signing|Signature Secure Boot]] et
[[external-ca-lets-encrypt|Autorité de certification externe et Let's Encrypt]].
Si un terme rencontré dans l'une de ces pages ne figure pas ici, considérez
que c'est une lacune de cette page, pas de votre compréhension.

### Zone

L'une des hiérarchies de certificats indépendantes de FOG — TLS web,
communication client, ou Secure Boot — chacune isolant le matériel
cryptographique selon le coût de son remplacement. Voir
[[pki-zones|Les zones de certificats de FOG]].

### Autorité de certification racine

`FOG Server CA`. Le certificat unique auquel toutes les zones se rattachent
en dernier ressort, et celui que fog-client épingle. Auto-signé, à longue
durée de vie, jamais réémis sur un serveur existant.

### Autorité de certification web

`FOG Web CA`. L'intermédiaire qui signe le certificat du serveur web.
Restreint à `serverAuth` et contraint par nom à votre propre réseau ou
domaine, de sorte qu'un certificat web compromis ne puisse pas servir à
usurper quoi que ce soit en dehors de celui-ci.

### Certificat feuille web

Le certificat que le serveur web (Apache/nginx) présente effectivement aux
navigateurs. Renouvelable seul — voir
[[pki-zones#leaf-renewal|Renouvellement de la feuille]] — sans toucher à
l'autorité de certification web.

### Autorité de certification Secure Boot

`FOG Secure Boot CA`. L'intermédiaire restreint à `codeSigning`. **C'est le
certificat enrôlé dans le micrologiciel** en tant que MOK — voir *certificat
MOK et certificat de signature* ci-dessous.

### Feuille de signature Secure Boot

La clé qui signe réellement les noyaux FOS (`sbsign`). Émise par l'autorité
de certification Secure Boot, elle est renouvelable sans aucun réenrôlement
dans le micrologiciel, puisque ce qui y est enrôlé est l'autorité située
au-dessus d'elle, et non cette feuille.

### MOK (Machine Owner Key)

Le mécanisme du micrologiciel et de shim qui vous permet d'enrôler des
certificats supplémentaires auxquels une machine fera confiance, sans avoir
besoin de l'aval de Microsoft. Dans la conversation, « le MOK » désigne
généralement le certificat actuellement enrôlé, quel qu'il soit.

### Certificat MOK et certificat de signature

La distinction porteuse de toute la refonte du Secure Boot. *Certificat MOK*
= l'autorité de certification Secure Boot, enrôlée une fois dans le
micrologiciel (publiée sous le nom `MOK.der`). *Certificat de signature* =
la feuille de signature Secure Boot, utilisée au quotidien, librement
renouvelable. Avant la refonte, il s'agissait du même certificat (voir *MOK
plat*) — renouveler le signataire imposait de réenrôler chaque machine du
parc.

### MOK plat

Le modèle dépassé, antérieur à l'intermédiaire : un unique certificat de
signature de code, auto-signé et `CA:FALSE`, qui était à la fois l'ancre
enrôlée et le signataire. Il n'a existé qu'à l'état de démonstration précoce
et n'a jamais été livré dans une version stable — voir la note dans
[[secure-boot-signing#L'ancien MOK plat|le guide Secure Boot]] si vous devez
vous en remettre.

### Paire de clés de communication client

`.srvprivate.key`/`.srvpublic.crt`. Une zone distincte, signée directement
par la racine, utilisée uniquement par `FOGBase::certDecrypt()` — le
chiffrement de la poignée de main d'enregistrement de fog-client — jamais
pour du TLS. Non remplaçable en apportant votre propre autorité de
certification ; voir
[[pki-zones#bringing-your-own-ca|Apporter votre propre autorité de certification]].

### Empreinte (aussi appelée thumbprint)

Un condensat (SHA-256, parfois SHA-1) des octets bruts d'un certificat,
affiché pour vous permettre de confirmer manuellement que vous enrôlez bien
le certificat que vous croyez. L'interface et le code de FOG parlent de
« fingerprint ». Vous verrez aussi « thumbprint » pour exactement la même
chose — c'est le terme employé par l'affichage des détails de certificat de
Windows, si bien que les deux apparaissent selon l'écran que vous consultez.

### Feuille ACME

La feuille web lorsqu'elle provient d'un client ACME externe (par exemple
`acme.sh`) au lieu de l'autorité de certification web de FOG, signalée par
`acmeLeaf=yes` dans `.fogsettings`. Voir
[[external-ca-lets-encrypt|Autorité de certification externe et Let's Encrypt]].

### Épinglage (fog-client)

fog-client n'ajoute *que* `ca.cert.der` à son magasin de confiance lors de
l'enregistrement et exige que ce certificat précis apparaisse par la suite
dans la chaîne du serveur. C'est pourquoi changer l'émetteur du certificat
web, sans réépingler chaque client, casse l'authentification des clients —
voir
[[external-ca-lets-encrypt|Autorité de certification externe et Let's Encrypt]].

### « Enrollment » (orthographe)

Écrit « enrollment » (orthographe américaine) dans toute la documentation
actuelle, conformément aux identifiants et noms de fichiers de FOG
eux-mêmes (`fog-enroll-mok.sh`, « Enroll Secure Boot Key »). Vous pourrez
encore rencontrer « enrolment » (orthographe britannique) dans des textes
plus anciens — il s'agit de la même notion, l'enrôlement.

### Setup Mode

Un état du micrologiciel qui permet d'écrire de nouveaux certificats
directement dans la base de confiance propre à l'UEFI (`PK`/`KEK`/`db`), en
contournant entièrement la chaîne shim de Microsoft. FOG 1.6 peut enrôler
une autorité de certification Secure Boot par ce biais, au lieu de (ou en
plus de) l'enrôlement MOK/MokManager — voir
[[secure-boot-setup-mode-enrollment|Enrôlement en Setup Mode]].
