This article serves as a list of things that need to be done in the
WiKi, or need improvement.

Please see this thread to make suggestions, or for info on how to help:
[wiki-to-do-list](https://forums.fogproject.org/topic/5253/wiki-to-do-list)

**General pointers for WiKi editing and technical writing**

-   Assume all articles are being read by absolute beginners to FOG and
    Linux.

```{=html}
<!-- -->
```
-   Use well-cropped pictures when possible. Highlight or mark important
    areas in the picture.

```{=html}
<!-- -->
```
-   Do not create a massive blob of text. Nobody will read it. Organize
    articles in single sentences or small paragraphs; utilize blank
    lines.

```{=html}
<!-- -->
```
-   Remain neutral about various Linux distributions and various
    methods.

```{=html}
<!-- -->
```
-   Utilize code boxes.

```{=html}
<!-- -->
```
-   When referring to a particular thing/feature/fix/issue in FOG Trunk,
    **use revision numbers** and give guidance if possible on the range
    of revisions it might apply to.

```{=html}
<!-- -->
```
-   Utilize the auto-indexing/organizing feature. the equals sign \"=\"
    is used, sub-sections have an extra pair of \"=\" around them (look
    at other articles for examples).

```{=html}
<!-- -->
```
-   Use spell check

```{=html}
<!-- -->
```
-   Be clear, and don\'t be afraid to make a pre-existing article *more*
    clear, but never alter an article in a way that takes away
    information.

```{=html}
<!-- -->
```
-   Look for existing articles on a topic before creating your own. Try
    to update existing ones, or integrate old articles into a new one.

```{=html}
<!-- -->
```
-   Try to merge similar articles together. Do not merge in a way that
    looses information.

```{=html}
<!-- -->
```
-   Create articles that have generalized titles.

```{=html}
<!-- -->
```
-   provide code examples for Debian and Red Hat.

```{=html}
<!-- -->
```
-   If you don\'t know the other\'s code, put a code bracket anyway and
    fill it with:

Debian:

    debian example here

Red Hat:

    red hat example here

This makes it easy for others to come after you and just fill in the
blanks. When applicable, include distribution versions.

.

# Convert awesome posts in these threads to WiKi Articles {#convert_awesome_posts_in_these_threads_to_wiki_articles}

<https://forums.fogproject.org/topic/5964/problems-loading-windows-iso-in-advanced-menu>

# Create a master listing of ALL troubleshooting related articles {#create_a_master_listing_of_all_troubleshooting_related_articles}

-   Please list the \"Troubleshooting `<problem>`{=html} articles at the
    top.

It doesn\'t matter how long this article gets.

[Troubleshooting FOG](Troubleshooting_FOG "wikilink")

# Translate ANY highly viewed article into alternative languages {#translate_any_highly_viewed_article_into_alternative_languages}

We need translators. Please spend your precious time on the most viewed
articles.

# Refine Troubleshoot NFS article {#refine_troubleshoot_nfs_article}

[Troubleshoot NFS](Troubleshoot_NFS "wikilink")

This needs more common problems / fixes added. There are a ton of
problems related to NFS in the forums, just need to search for those,
and find the basic problem and solution and add those.

# Better document the Location Plugin {#better_document_the_location_plugin}

[Location Plugin](Location_Plugin "wikilink")

The documentation on this is sketchy at best, and needs pictures and a
longer more detailed explanation of what it is, why it is, how it works,
and how to use it. Should include a troubleshooting section because
sometimes removing and re-adding sites suddenly makes imaging work,
snapins work, etc. The forum has examples.

# Merge this {#merge_this}

Merge [Tftp timeout](Tftp_timeout "wikilink") AND [Tftp
timeout\....](Tftp_timeout.... "wikilink") into the [Troubleshoot
TFTP](Troubleshoot_TFTP "wikilink") article. Add anything that isn\'t
already there - Do not loose any information. Ok to rephrase.

# Better document storage nodes {#better_document_storage_nodes}

Storage nodes play a really important role in fog. They need better
documentation and explanation.

# Create a Troubleshooting SMB article {#create_a_troubleshooting_smb_article}

In the future, FOG is going to use Samba. NFS is likely to still be
supported, but I expect it to be phased out of mainstream installations.
We need a solid article on troubleshooting Samba from a FOG perspective.

# Finish Troubleshoot Cron article. {#finish_troubleshoot_cron_article.}

[Troubleshoot Cron](Troubleshoot_Cron "wikilink")

This pertains to \"Cron Style\" deployments, and delayed deployments.

This article should include troubleshooting FOG time. Time on the server
and the FOG timezone, and any relevant Apache settings, too. Should
include examples for the latest stable FOG release, and current FOG
Trunk.

# Finish the Troubleshoot MySQL article {#finish_the_troubleshoot_mysql_article}

[Troubleshoot MySQL](Troubleshoot_MySQL "wikilink")

Approach everything in here (except installing/removal) from the MySQL
perspective since MariaDB is a drop-in replacement for MySQL. Should
include example commands for various things - like enabling remote
access, etc.

# Finish \"Troubleshoot Downloading - Unicast\" {#finish_troubleshoot_downloading___unicast}

[Troubleshoot Downloading -
Unicast](Troubleshoot_Downloading_-_Unicast "wikilink")

# Finish \"Troubleshoot Downloading - Multicast\" {#finish_troubleshoot_downloading___multicast}

[Troubleshoot Downloading -
Multicast](Troubleshoot_Downloading_-_Multicast "wikilink")

# Finish \"Troubleshoot Uploading\" {#finish_troubleshoot_uploading}

[Troubleshoot Uploading](Troubleshoot_Uploading "wikilink")

Should link [Troubleshoot FTP](Troubleshoot_FTP "wikilink") to this one,
it plays a big role right now.

# Update this {#update_this}

[Troubleshooting_an_image_push_to_a_client](Troubleshooting_an_image_push_to_a_client "wikilink")

Merge into the [Troubleshoot NFS](Troubleshoot_NFS "wikilink") and
[Troubleshoot Downloading -
Unicast](Troubleshoot_Downloading_-_Unicast "wikilink") articles where
possible.

# Merge \"adding storage\" articles {#merge_adding_storage_articles}

We need one article to cover it all. This article should be organized by
OS distribution and version, and then by method.

[Adding_Storage_to_a_FOG_Server](Adding_Storage_to_a_FOG_Server "wikilink")

[Moving_your_images_directory/Adding_Storage_to_the_Images_directory](Moving_your_images_directory/Adding_Storage_to_the_Images_directory "wikilink")

<https://wiki.fogproject.org/wiki/index.php/Fedora_21_Server>

# Create Troubleshoot ProxyDHCP / dnsmasq {#create_troubleshoot_proxydhcp_dnsmasq}

Merge existing unmodifiable DHCP  long long name article with the
troubleshooting article. We need the name simplified, and we need this
article simplified and explained better:

[Using_FOG_with_an_unmodifiable_DHCP_server/\_Using_FOG_with_no_DHCP_server](Using_FOG_with_an_unmodifiable_DHCP_server/_Using_FOG_with_no_DHCP_server "wikilink")

# Create Best Practices {#create_best_practices}

Naming images (naming conventions that make sense)

Image Descriptions (meaningful and detailed)

Group Names (Naming conventions)

Using Groups (all the cool stuff you can do using groups)

Image Backups (every practical method. NFS, Samba, Script, Cron-tab)

Database Backups (when and how)

Hosts Backups (when and how)

-Anything else that you can think of

# Create \"Security\" article {#create_security_article}

[FOG security](FOG_security "wikilink")

Create an article based on HAVING firewall enabled, and HAVING SELinux
turned on, and HAVING the most restrictive directory permissions
possible.

Limiting NFS / FTP to only what it absolutely needs.

Just locking everything down.

This would NOT BE any sort of troubleshooting article. Itd be for people
who actually have FOG working!

# Create Videos for FOG 1.3.0 release {#create_videos_for_fog_1.3.0_release}

Create detailed installation / setup videos for Red Hat and Debian.
Intended audience is complete Linux beginners that haven\'t ever used
CLI.

Create detailed Usage videos that focus just on **basic** host tasks and
the Web UI. These videos are a mix of SHOWCASING fog, and simple
tutorials. Intended audience is complete Linux beginners that haven\'t
ever used CLI. Should showcase / demonstrate uploading, downloading,
early rename, domain joining, speed, and compression.

# Update / Merge old info into new articles {#update_merge_old_info_into_new_articles}

[AncientPages](https://wiki.fogproject.org/wiki/index.php/Special:AncientPages)

# Reduce the amount of Orphaned pages {#reduce_the_amount_of_orphaned_pages}

Merge them or embed them, or link them when possible.

[LonelyPages](https://wiki.fogproject.org/wiki/index.php/Special:LonelyPages)
