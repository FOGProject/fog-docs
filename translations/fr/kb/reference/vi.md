---
title: Aide-mémoire pour l'édition de base dans Vi
aliases:
    - Quick reference for basic editing in Vi 
description: page d'index de vi
context_id: vi
tags:
    - in-progress
    - linux
    - vi
    - kb
    - reference
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/reference/vi).

# Aide-mémoire pour l'édition de base dans Vi

Vi est un éditeur de texte très rudimentaire (mais incroyablement puissant)
fourni avec pratiquement toutes les distributions Linux. Utiliser Vi vous
évite d'installer d'autres éditeurs de texte.

**Instructions de base :**

Note : évitez d'utiliser le pavé numérique dans Vi.

Passez en mode insertion ; vous pouvez alors utiliser les flèches pour vous
déplacer dans le texte et le modifier normalement au clavier :

    i

Quittez le mode insertion :

    Esc (the escape key)

**LORSQUE VOUS N'ÊTES PAS** en mode insertion, vous pouvez utiliser :

Écrire les modifications :

    :w   (then enter)

Quitter vi :

    :q   (then enter)

Quitter vi sans enregistrer les modifications :

    :q!   (then enter)

Exemple d'utilisation\...

    [root@localhost ~]# vi /README.txt

    i
    This is my first readme file, wrote with vi!
    (Esc key)
    :w
    :q

    [root@localhost ~]# cat /README.txt
    This is my first readme file, wrote with vi!

Lien vidéo externe :

[Linux Vi - Basic Tutorial](https://www.youtube.com/watch?v=1konvzseurI)

Vidéo :

[Regarder sur YouTube](https://www.youtube.com/watch?v=1konvzseurI)
