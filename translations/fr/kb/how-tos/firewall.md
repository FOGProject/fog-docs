---
title: Configuration du pare-feu d'un serveur FOG
aliases:
    - Firewall configuration for a FOG server
description: Quels ports un serveur FOG doit avoir ouverts et pourquoi, comment l'installeur configure firewalld et ufw pour vous, et comment configurer firewalld, ufw ou iptables à la main
context_id: firewall
tags:
    - how-to
    - networking
    - firewall
    - security
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/kb/how-tos/firewall).

# Configuration du pare-feu d'un serveur FOG

FOG est un service réseau. Les clients PXE, les nœuds de stockage et le client
FOG doivent tous pouvoir l'atteindre : un pare-feu activé mais non configuré
fait donc paraître complètement hors service un serveur pourtant correctement
installé.

Les anciens installeurs de FOG proposaient de **désactiver le pare-feu** et ne
faisaient absolument rien sous `-y`. Les versions actuelles le configurent à la
place. Cette page décrit ce qui est ouvert et pourquoi, et donne la procédure
manuelle pour les trois implémentations — pour les sites qui préfèrent s'en
charger eux-mêmes, ceux qui doivent restreindre ce que l'installeur a ouvert, ou
ceux qui utilisent `iptables` brut, auquel FOG ne touche délibérément pas.

## Ce que FOG doit avoir ouvert

L'installeur n'ouvre que ce que votre installation utilise réellement : votre
liste peut donc être plus courte que celle-ci.

| Port | Protocole | Ce qui en a besoin | Uniquement si |
|---|---|---|---|
| 80 | tcp | Interface web, interrogation du client FOG, fichiers de démarrage iPXE | toujours |
| 443 | tcp | Les mêmes, en TLS | installation HTTPS |
| 69 | udp | TFTP — le chargeur d'amorçage PXE initial | TFTP installé |
| 21 | tcp | Contrôle FTP — réplication des images et snapins, opérations sur les nœuds | toujours |
| 65000–65100 | tcp | Données FTP en mode passif | toujours |
| 2049 | tcp | NFS — capture et déploiement d'images | toujours |
| 111 | tcp+udp | rpcbind, pour NFS | toujours |
| 20048 | tcp+udp | `mountd` de NFS | toujours |
| 67 | udp | DHCP | FOG est votre serveur DHCP |
| 63100–63228 | udp | udpcast, pour les tâches multicast | toujours |

Deux entrées suscitent généralement des questions.

### Pourquoi NFS est toujours ouvert, même sur un nœud de stockage

Un nœud de stockage existe pour servir des images en NFS : il en a donc tout
autant besoin que le serveur principal. Si vous avez indiqué à l'installeur de
ne pas gérer votre fichier d'exports, cela signifie seulement que FOG a laissé
`/etc/exports` tranquille — NFS fonctionne toujours et doit toujours être
joignable.

### Pourquoi le port 3306 n'est *pas* ouvert

FOG n'ouvre jamais le port de la base de données, et vous ne devriez pas
l'ouvrir globalement non plus. Seuls les **nœuds de stockage distants** ont
besoin d'atteindre la base de données du serveur maître. Si vous en exploitez,
ouvrez le 3306/tcp **spécifiquement vers ces nœuds** :

```bash
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" \
    source address="10.0.0.50/32" port port="3306" protocol="tcp" accept'
firewall-cmd --reload
```

Une installation FOG sur un seul serveur n'a besoin d'ouvrir le 3306 à
personne.

## Les deux ports qui ne se résument pas à « ouvrir un port »

Ils posent souvent problème : mieux vaut les comprendre avant d'écrire des
règles à la main.

### Données FTP en mode passif

Le FTP utilise une connexion pour les commandes et une **seconde** pour chaque
transfert. En mode passif, c'est le serveur qui choisit le port de cette seconde
connexion, et par défaut `vsftpd` le choisit dans la plage éphémère — des
dizaines de milliers de ports qu'il n'est pas raisonnable d'ouvrir.

FOG résout cela en *figeant* la plage. L'installeur écrit dans `vsftpd.conf` :

```
pasv_min_port=65000
pasv_max_port=65100
```

et ouvre exactement `65000-65100/tcp`. **Si vous changez l'un, vous devez
changer l'autre.** Une plage figée mais non ouverte, ou ouverte mais non figée,
échoue d'une façon qui ressemble à une panne réseau plutôt qu'à une erreur de
configuration : les listages de répertoires fonctionnent, les transferts restent
bloqués.

### TFTP

Le TFTP a la même structure à deux connexions, mais le port de données **ne
peut pas** être figé : le serveur répond depuis un nouveau port éphémère et le
client lui répond dessus. Un simple `--add-port=69/udp` ouvre donc la requête
initiale et rejette tous les paquets du transfert lui-même. Les clients PXE vont
jusqu'à demander un fichier, puis expirent.

La solution est un assistant de suivi de connexion, `nf_conntrack_tftp`, qui
apprend au pare-feu à reconnaître la connexion de données comme liée à la
requête qu'il a déjà autorisée.

!!! warning "Les assistants ne sont plus automatiques"
    Les noyaux modernes désactivent l'affectation automatique des assistants.
    Charger le module ne suffit pas toujours à lui seul — voir les sections par
    implémentation ci-dessous.

## firewalld

C'est ce que lance l'installeur. Des services nommés sont utilisés plutôt que
des ports bruts partout où il en existe un, car une définition de service
firewalld embarque son assistant de suivi de connexion — `tftp.xml` déclare
`<helper name="tftp"/>`, ce qui est précisément ce qui fait fonctionner les
transferts PXE.

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https      # HTTPS installs only
firewall-cmd --permanent --add-service=tftp
firewall-cmd --permanent --add-service=ftp
firewall-cmd --permanent --add-service=nfs
firewall-cmd --permanent --add-service=mountd
firewall-cmd --permanent --add-service=rpc-bind
firewall-cmd --permanent --add-service=dhcp       # only if FOG serves DHCP

# No named service exists for these two
firewall-cmd --permanent --add-port=65000-65100/tcp
firewall-cmd --permanent --add-port=63100-63228/udp

firewall-cmd --reload
```

Vérifiez le résultat :

```bash
firewall-cmd --list-all
```

### Restreindre à votre sous-réseau d'imagerie

L'installeur ouvre ces accès sur la **zone par défaut**, qui couvre toutes les
interfaces auxquelles cette zone s'applique. C'est la seule chose qui
fonctionne lorsque l'installeur ne peut pas savoir sur quels réseaux se trouvent
vos clients PXE et vos nœuds de stockage — mais c'est plus large que ce que
souhaitent beaucoup de sites.

Pour restreindre FOG à un seul sous-réseau, placez ce sous-réseau dans sa propre
zone et n'y ouvrez les services que là :

```bash
firewall-cmd --permanent --new-zone=fog
firewall-cmd --permanent --zone=fog --add-source=10.0.0.0/24
for s in http tftp ftp nfs mountd rpc-bind; do
    firewall-cmd --permanent --zone=fog --add-service=$s
done
firewall-cmd --permanent --zone=fog --add-port=65000-65100/tcp
firewall-cmd --permanent --zone=fog --add-port=63100-63228/udp

# then remove them from the default zone
for s in http tftp ftp nfs mountd rpc-bind; do
    firewall-cmd --permanent --remove-service=$s
done
firewall-cmd --permanent --remove-port=65000-65100/tcp
firewall-cmd --permanent --remove-port=63100-63228/udp
firewall-cmd --reload
```

!!! danger "Vérifiez d'abord votre routage"
    Cela casse l'imagerie pour tout client situé sur un sous-réseau que vous
    n'avez pas listé, y compris les clients PXE qui vous joignent via un relais
    DHCP et tout nœud de stockage distant. Ces échecs sont silencieux du point
    de vue de FOG — le client se contente d'expirer.

## ufw

ufw n'a ni définitions de services ni gestion des assistants : tout passe donc
par un port explicite, et l'assistant TFTP doit être chargé par vos soins.

```bash
# Load the TFTP conntrack helper, and make it survive a reboot.
echo nf_conntrack_tftp > /etc/modules-load.d/fog-conntrack.conf
modprobe nf_conntrack_tftp

ufw allow 80/tcp
ufw allow 443/tcp            # HTTPS installs only
ufw allow 69/udp
ufw allow 21/tcp
ufw allow 65000:65100/tcp
ufw allow 2049/tcp
ufw allow 111/tcp
ufw allow 111/udp
ufw allow 20048/tcp
ufw allow 20048/udp
ufw allow 67/udp             # only if FOG serves DHCP
ufw allow 63100:63228/udp
```

Notez qu'ufw écrit les plages avec un **deux-points**, et non un tiret.

Le `before.rules` livré avec ufw accepte déjà `RELATED,ESTABLISHED` : une fois
`nf_conntrack_tftp` chargé, le transfert de données TFTP est donc reconnu et
autorisé. Sans ce module, le PXE se bloque après le premier paquet — et rien
dans les journaux de FOG ne le signalera.

Vérifiez le résultat :

```bash
ufw status verbose
```

Pour restreindre à un sous-réseau, utilisez plutôt la syntaxe `from` d'ufw :

```bash
ufw allow from 10.0.0.0/24 to any port 80 proto tcp
```

## iptables

**FOG ne configure pas iptables brut à votre place.** C'est délibéré, non un
oubli. La persistance des règles dépend de la distribution, et insérer des
règles dans un jeu que FOG n'a pas créé risque soit d'atterrir *après* un
`REJECT` existant — sans rien faire, en silence — soit de casser des règles qui
fonctionnaient. L'installeur détecte iptables brut, affiche les commandes et
vous laisse la décision.

```bash
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT      # HTTPS installs only
iptables -I INPUT -p udp --dport 69 -j ACCEPT
iptables -I INPUT -p tcp --dport 21 -j ACCEPT
iptables -I INPUT -p tcp --dport 65000:65100 -j ACCEPT
iptables -I INPUT -p tcp --dport 2049 -j ACCEPT
iptables -I INPUT -p tcp --dport 111 -j ACCEPT
iptables -I INPUT -p udp --dport 111 -j ACCEPT
iptables -I INPUT -p tcp --dport 20048 -j ACCEPT
iptables -I INPUT -p udp --dport 20048 -j ACCEPT
iptables -I INPUT -p udp --dport 67 -j ACCEPT       # only if FOG serves DHCP
iptables -I INPUT -p udp --dport 63100:63228 -j ACCEPT
```

iptables écrit les plages avec un **deux-points**.

### L'ordre des règles compte

`-I` insère en **tête** de chaîne, ce qui est ce que vous voulez — `-A` ajoute
en fin de chaîne, et si votre chaîne se termine déjà par un `REJECT` ou un
`DROP`, une règle ajoutée à la fin n'est jamais atteinte. Vérifiez où la vôtre a
atterri :

```bash
iptables -L INPUT -n --line-numbers
```

### L'assistant TFTP

Même exigence qu'avec ufw, plus une règle explicite, car les noyaux modernes
n'affectent pas l'assistant d'eux-mêmes :

```bash
echo nf_conntrack_tftp > /etc/modules-load.d/fog-conntrack.conf
modprobe nf_conntrack_tftp

iptables -A PREROUTING -t raw -p udp --dport 69 -j CT --helper tftp
iptables -I INPUT -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
```

### Persistance

Les règles ajoutées avec `iptables` sont perdues au redémarrage. La façon de les
conserver dépend de votre distribution :

**RHEL / Rocky / Alma / Fedora**

```bash
dnf install iptables-services
systemctl enable iptables
service iptables save          # writes /etc/sysconfig/iptables
```

**Debian / Ubuntu**

```bash
apt install iptables-persistent
netfilter-persistent save      # writes /etc/iptables/rules.v4
```

**Arch**

```bash
iptables-save > /etc/iptables/iptables.rules
systemctl enable iptables
```

Vérifiez la persistance en redémarrant puis en relançant `iptables -L INPUT -n`.
Un jeu de règles qui fonctionne jusqu'au redémarrage suivant est la façon la
plus courante dont cela tourne mal.

## Dépannage

Un problème de pare-feu ne s'annonce presque jamais. FOG ne journalise rien, car
de son point de vue le client n'est tout simplement jamais arrivé.

| Symptôme | Cause probable |
|---|---|
| Interface web injoignable | 80/tcp ou 443/tcp |
| Le client PXE obtient une IP, puis « file not found » ou une expiration | 69/udp, ou l'assistant de suivi de connexion TFTP |
| Le menu PXE apparaît, l'imagerie échoue immédiatement | 2049/tcp, 111 ou 20048 (NFS) |
| La réplication ne se termine jamais ; le listage de répertoire fonctionne | Plage passive FTP non ouverte, ou ne correspondant pas à `vsftpd.conf` |
| La tâche multicast démarre mais aucun client ne reçoit de données | 63100–63228/udp |
| Le nœud de stockage apparaît hors ligne dans l'interface | 21/tcp, ou 3306/tcp depuis le nœud vers le maître |

Le moyen le plus rapide de confirmer que le pare-feu est en cause est de tester
depuis un client :

```bash
# from a machine on the client network
nc -vz  <fog-server> 80
nc -vzu <fog-server> 69
```

Si ces tests réussissent alors que l'imagerie échoue toujours, le pare-feu n'est
pas votre problème. L'autre mécanisme qui échoue tout aussi silencieusement est
SELinux — recherchez les refus avec :

```bash
ausearch -m avc -ts recent
```

Notez qu'un hôte en mode **permissif** journalise tout de même les refus : cela
vaut donc la peine d'exécuter cette commande même si vous pensez que SELinux
n'est pas en mode strict.

!!! tip "Confirmer qu'il s'agit bien du pare-feu"
    Arrêter brièvement le pare-feu (`systemctl stop firewalld`) est un
    *diagnostic* légitime. Si l'imagerie se met à fonctionner, vous savez quoi
    corriger. Le désactiver définitivement est précisément ce que cette page
    cherche à éviter.
