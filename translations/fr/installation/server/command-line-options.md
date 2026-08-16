---
title: Options de ligne de commande de l'installeur FOG
aliases:
    - Fog installer command line options
description: Options de ligne de commande de l'installeur FOG
context_id: command-line-options
tags:
    - in-progress
    - updating-content
    - installation
    - fog-server
---

>[!warning] Traduction automatique
>Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/installation/server/command-line-options).


# Options de ligne de commande de l'installeur FOG

L'installeur de FOG dispose d'un bon nombre d'options de ligne de commande. Voir
la sortie ci-dessous. Vous voudrez peut-être forcer FOG à configurer l'interface
web en HTTPS, changer le répertoire racine web, ou installer à un emplacement
autre que celui par défaut.

    ./installfog.sh --help
    Usage: ./installfog.sh [-h?odEUHSCKYyXTFl] [-f <filename>] [-N <databasename>]
            [-D </directory/to/document/root/>] [-c <ssl-path>]
            [-W <webroot/to/fog/after/docroot/>] [-B </backup/path/>]
            [-s <192.168.1.10>] [-e <192.168.1.254>]
        -h -? --help            Display this info
        -o    --oldcopy         Copy back old data
        -d    --no-defaults     Don't guess defaults
        -U    --no-upgrade      Don't attempt to upgrade
        -H    --no-htmldoc      No htmldoc, means no PDFs
        -S    --force-https     Force HTTPS for all comunication
        -C    --recreate-CA     Recreate the CA Keys
        -K    --recreate-keys   Recreate the SSL Keys
              --external-ca     Sign FOG's server certificate with an
                                existing external/intermediate CA instead
                                of generating a self-signed CA
              --ca-cert         Path to the intermediate CA certificate (PEM)
              --ca-key          Path to the intermediate CA private key (PEM)
              --ca-root         Path to the root CA certificate (PEM)
              --web-ca-cert     Bring your own CA for the WEB zone: the
                                intermediate that signs this server's
                                vhost certificate
              --web-ca-key      Private key matching --web-ca-cert
              --web-ca-root     Root certificate --web-ca-cert chains to
                                (all three are required together)
        -Y -y --autoaccept      Auto accept defaults and install
        -f    --file            Use different update file
        -c    --ssl-path        Specify the ssl path
                                defaults to /opt/fog/snapins/ssl
        -D    --docroot         Specify the Apache Docroot for fog
                                defaults to OS DocumentRoot
        -W    --webroot         Specify the web root url want fog to use
                                (E.G. http://127.0.0.1/fog,
                                      http://127.0.0.1/)
                                Defaults to /fog/
              --fogprogramdir   Specify the FOG base directory
                                defaults to /opt/fog
                                remembered in /etc/fog/fog.conf, so it
                                only needs giving on a first install
        -N    --mysqldbname     Specify the FOG database name
                                defaults to fog
        -B    --backuppath      Specify the backup path
              --uninstall       Uninstall FOG. Removes FOG's own files,
                                services and config, and restores the
                                files FOG replaced. Your database,
                                images, snapins, SSL CA and the fog
                                account are KEPT unless purged below.
                                Packages are never removed.
              --dry-run         With --uninstall, list what would be
                                removed and exit without changing anything
              --force           With --uninstall, skip the typed
                                confirmation (-Y does NOT skip it)
              --purge-db        Also drop the FOG database
              --purge-images    Also delete the image storage
              --purge-snapins   Also delete the snapins
              --purge-ssl       Also delete the SSL CA. This permanently
                                breaks every deployed fog-client
              --purge-user      Also delete the fog Linux account
              --purge-all       All of the --purge-* options above
        -s    --startrange      DHCP Start range
        -e    --endrange        DHCP End range
        -E    --no-exportbuild  Skip building nfs file
        -X    --exitFail        Do not exit if item fails
        -T    --no-tftpbuild    Do not rebuild the tftpd config file
        -F    --no-vhost        Do not overwrite vhost file
        -l    --list-packages   List of the basic packages FOG needs for install or is currently installed for FOG
              --secure-boot-key   Private key used to re-sign the FOS
                                  kernels for UEFI Secure Boot
              --secure-boot-cert  Certificate matching --secure-boot-key
                                  (both are required together)
              --no-secure-boot    Do not generate a Secure Boot signing
                                  key, and leave the FOS kernels unsigned
              --no-ca-trust       Do not add this server's CA to this
                                  server's own system trust store

Les options `--uninstall`, `--dry-run`, `--force` et `--purge-*` sont traitées en
détail dans
[Désinstaller le serveur FOG](uninstall-fog-server.md).

## Options de certificats

FOG génère sa propre autorité de certification à l'installation et l'utilise
pour signer le certificat HTTPS du serveur. Ces options déterminent **quelle**
autorité effectue cette signature, et si le serveur fait localement confiance au
résultat.

| Option | À utiliser lorsque |
| --- | --- |
| *(aucune)* | Le comportement par défaut. FOG génère une autorité de certification et une autorité web en dessous, et signe le certificat du vhost à partir de celle-ci. |
| `--web-ca-cert` + `--web-ca-key` + `--web-ca-root` | Vous voulez que le certificat HTTPS de ce serveur soit signé par une autorité que **vous** fournissez — votre PKI d'entreprise, une autorité ACME interne, ou une autorité émise par un autre serveur FOG. Les trois sont obligatoires ensemble. |
| `--external-ca` avec `--ca-cert`/`--ca-key`/`--ca-root` | L'ancienne écriture de la même chose. Elle vise la même zone, ce qu'elle a toujours effectivement signifié. |
| `--no-ca-trust` | Vous ne voulez **pas** que l'installeur ajoute l'autorité de ce serveur au magasin de confiance système de ce même serveur. |

Passer l'une quelconque des options `--web-ca-*` implique `--external-ca` : vous
n'avez donc pas besoin des deux. Vous fournissez les fichiers **une seule fois**
— ils sont importés, et les mises à niveau ultérieures réutilisent cet import
sans que les options soient repassées.

Les trois sont validés avant toute modification : la clé doit correspondre au
certificat, le certificat doit être une autorité de certification
(`basicConstraints CA:TRUE`), et il doit se vérifier au regard de la racine que
vous fournissez. Le moindre échec interrompt l'installation plutôt que de
produire un serveur signé par ce qu'il ne faut pas.

>[!info] Cela n'affecte pas fog-client
>`--web-ca-*` remplace l'autorité qui signe le certificat **web**, et rien
>d'autre. La racine que fog-client a épinglée lors de son enregistrement reste
>intacte, ce qui rend l'opération sûre sur un parc en production, sans
>réenregistrer la moindre machine.

### `--no-ca-trust` et le magasin de confiance local

Par défaut, l'installeur ajoute l'autorité de certification du serveur au
magasin de confiance système de ce serveur, afin que `curl`, `wget` et
l'enveloppe de flux de PHP sur le serveur FOG puissent vérifier le serveur FOG
sans qu'on leur fournisse un fichier d'autorité à chaque fois. Le magasin est
détecté d'après l'hôte — `/etc/pki/ca-trust/source/anchors` sur la famille RHEL,
`/usr/local/share/ca-certificates` sur Debian/Ubuntu/Alpine,
`/etc/ca-certificates/trust-source/anchors` sur Arch.

`--no-ca-trust` saute cette étape, et ce choix est mémorisé dans `.fogsettings`
afin qu'une mise à niveau ne revienne pas discrètement sur la décision.

>[!warning] Cela ne fait pas taire l'avertissement de votre navigateur
>Firefox conserve son propre magasin de certificats et Chrome en lit un propre à
>chaque utilisateur : ni l'un ni l'autre ne consulte ce qui est écrit ici — et
>votre navigateur se trouve généralement sur une tout autre machine. Importez
>vous-même l'autorité de certification dans le navigateur ; elle est publiée sur
>`https://<your-fog-server>/fog/management/other/ca.cert.der`.

Pour le mécanisme complet zone par zone, voir
[[bringing-your-own-ca|Apporter votre propre autorité de certification]]. Pour
faire pointer **plusieurs** serveurs FOG vers une même autorité, de sorte qu'un
seul import les couvre tous, voir
[[unify-certificates-across-fog-servers|Unifier les certificats sur plusieurs serveurs FOG]].

## Options Secure Boot

Depuis FOG 1.6.0, l'installeur **génère par défaut une clé de signature Secure
Boot** et signe les noyaux FOS avec elle, de sorte qu'un serveur standard
dispose toujours d'une empreinte de certificat à vérifier et d'un kit
d'enrôlement à distribuer. Les trois options ci-dessus n'ont d'intérêt que si
vous souhaitez changer cela :

| Option | À utiliser lorsque |
| --- | --- |
| *(aucune)* | Le comportement par défaut. Une clé est générée dans `/opt/fog/secureboot/` à la première installation, puis **réutilisée, jamais régénérée**, à chaque mise à niveau ultérieure. |
| `--secure-boot-key` + `--secure-boot-cert` | Vous disposez déjà d'une clé de signature que vous voulez faire utiliser par FOG. Les deux sont obligatoires ensemble ; le certificat peut être au format PEM ou DER. Votre clé n'est jamais écrasée. |
| `--no-secure-boot` | Vous ne voulez ni clé de signature ni assistant de signature réservé à root sur ce serveur. Les noyaux FOS sont laissés non signés. |

`--no-secure-boot` est mémorisé dans `.fogsettings`, de sorte qu'une mise à
niveau ne vous redonnera pas une clé et une règle `sudoers` que vous aviez
délibérément refusées.

>[!warning] La clé générée n'est jamais régénérée, et c'est délibéré
>Une nouvelle clé de signature invalide silencieusement l'enrôlement sur
>**toutes les machines qui approuvaient déjà l'ancienne**, et rien ne le signale
>avant qu'un client ne refuse de démarrer — bien après l'installation qui en est
>la cause. `--recreate-keys` et `--recreate-CA` n'y touchent délibérément pas.
>Pour renouveler volontairement, supprimez `/opt/fog/secureboot/`, relancez
>l'installeur, puis réenrôlez chaque client.

La clé privée réside dans `/opt/fog/secureboot/MOK.key`, en `0600` à l'intérieur
d'un répertoire `0700` appartenant à root. Elle n'est jamais copiée dans la
racine web et le serveur web ne peut pas la lire — voir
[[secure-boot-signing|Secure Boot : signer FOS avec votre propre clé]] pour la
procédure complète et pour ce qu'il faut faire sur chaque client.
