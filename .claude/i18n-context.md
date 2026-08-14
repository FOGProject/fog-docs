# fog-docs translations — working context

Handoff notes for continuing the translation work in a fresh session. Lives in
`.claude/` rather than `docs/` because it's working state, not documentation —
delete it once French is live and the remaining languages are seeded.

The user-facing reference is the `## Translations` section of the repo's
`CLAUDE.md`. This file is the *operational* state: what's done, what's next, and
what already bit us.

---

## Where things stand

Branch **`i18n-translations`**. Twelve commits, nothing on `master`. The last
six are not yet pushed to `origin`.

**Confirmed working in production hosting.** Two throwaway RTD projects,
`fog-docs-lang-test` (English parent) and `fog-docs-lang-test-fr` (French
translation), build from this branch. Verified live on
`fog-docs-lang-test.readthedocs.io`:

- `/fr/latest/` serves French; the flyout **language selector appears**, so RTD
  Addons do inject into `build.commands` output and no custom switcher plugin is
  needed.
- The machine-translation banner renders as a real callout.
- Remapped heading anchors resolve — `href="#mettre-à-jour-une-installation-existante"`
  matches a real `id=` on the built page.
- Untranslated pages fall back to English content inside French UI chrome.

**French: 47 of 99 pages.** All section landing pages, the whole
getting-started path, and all of `management/web/` except `ldap.md`.

## The plan from here (decided by the user)

No more test projects — one test pair was enough to prove the mechanism.

1. Seed the rest of French on this branch.
2. PR `i18n-translations` → `master` and merge. That activates
   `.github/workflows/translate.yml` (the `schedule:` trigger only fires from
   the default branch, so it is inert until then).
3. Create the real `fog-docs-fr` RTD project against `master` and add it as a
   translation of `fog-docs`. **Go live with French.**
4. Add the remaining six languages **on the live site**, one project at a time,
   seeding each language's pages first.

Delete `fog-docs-lang-test` and `-fr` once French is live.

## Commands

```bash
node scripts/translate.mjs fr --dry-run     # what still needs translating
node scripts/translate.mjs fr --verify      # structural check, no network
node scripts/translate.mjs fr --relink      # re-resolve heading anchors
node scripts/translate.mjs fr --reindex     # accept the tree on disk as current
node --test "scripts/*.test.mjs"            # 33 tests, no network

cd quartz && node scripts/rtd-build.mjs --language fr -o /tmp/fr-site
cd quartz && node scripts/rtd-build.mjs -o /tmp/en-site      # English, unchanged
```

## Seeding a page by hand

Seeding is done in-session (free on the user's subscription) rather than through
GitHub Models, which is rate limited and reserved for ongoing per-push deltas.

For each page: read `docs/<path>`, write `translations/fr/<path>` with

1. **Front matter** — translate `title` and `description` only. Copy
   `context_id`, `tags` and `aliases` **verbatim**.
2. **Banner** immediately after the front matter, then a blank line:
   ```
   >[!warning] Traduction automatique
   >Cette page a été traduite automatiquement et peut contenir des erreurs. En cas de doute, reportez-vous à [la version anglaise](https://docs.fogproject.org/en/latest/<slug>).
   ```
   `<slug>` is the path without `.md`; `foo/index.md` → `foo`; `index.md` → the
   bare base URL.
3. **Body** — translate prose. Never touch: fenced/inline code (including
   comments inside it), wikilink *targets* (`[[target|Text]]` — only `Text`),
   `![[image.png]]` embeds, URLs, `!!! admonition` markers, callout type
   markers, escaped sequences like `\[\[...\]\]` and `\-`, and the odd
   RST-derived `:   -   ` definition-list indentation.
4. Run `--verify`, then `--relink`, then `--verify` again.
5. `--reindex` when a batch is done, so the state file records the source hashes.

**Terminology comes from the FOG web UI's own French catalog.** Look terms up
rather than guessing — the whole point is that the docs name what the reader
actually sees:

```bash
cd ../fogproject/packages/web/management/languages/fr_FR.UTF-8/LC_MESSAGES
grep -A1 -x 'msgid "Storage Node"' messages.po
```

Confirmed so far: Host → **Machine** (not "Hôte"), Hosts → **Machines**,
Storage Node → **Nœud de stockage**, Basic Tasks → **Tâches basiques**,
Host Image → **Image machine**, Update → **Mettre à jour**, Task → **Tâche**,
Primary User → **Utilisateur principal**, Host Name → **Nom de machine**,
Plugin → **Greffon** (not "Plugin"), Storage Group → **Groupe de stockage**,
Master Node → **Nœud maître**, Is Master Node → **Est nœud maître**,
Log Viewer → **Visionneuse de journaux**, Hostname Changer → **Renommage
machine**, Snapin Pack → **Paquet Snapin**, Location → **Emplacement**,
Role → **Rôle**, Printer → **Imprimante**, Site → **Site**,
Site Association → **Association de site**, FOG Settings → **Paramètres de
FOG**, FOG Configuration → **Configuration FOG**, Dashboard → **Tableau de
bord**, Active Multicast Tasks → **Tâches Multicast actives**.
Snapin and Multicast stay as-is.

**A term absent from the catalog is evidence, not a gap.** It means the UI
shows English there, so the docs should too. That is why every FOG task-type
name (Fast Wipe, Memory Test, Deploy - Multicast, …) and every 1.6-era button
(Activate selected, Forget selected, Plugin Management, Add New Host) is left
in English on the pages seeded so far, while the older strings the catalog
does cover are translated.

## Remaining French pages, largest first

The four at the top are the expensive ones and were deliberately deferred.
Regenerate this table any time with `node scripts/translate.mjs fr --dry-run`.

| Page | Size |
|---|---|
| installation/network-setup/proxy-dhcp.md | 30.0k |
| development/plugin-development.md | 29.1k |
| kb/how-tos/secure-boot-signing.md | 28.7k |
| installation/server/migrating-fog-server.md | 27.1k |
| development/install-script-architecture.md | 24.2k |
| kb/troubleshooting/troubleshoot-tftp.md | 23.3k |
| kb/integrations/external-ca-lets-encrypt.md | 19.1k |
| kb/reference/pki-zones.md | 18.2k |
| management/web/ldap.md | 17.6k |
| kb/reference/csv_import_export.md | 16.7k |
| kb/how-tos/bios-and-uefi-co-existence.md | 15.6k |
| kb/integrations/api-expansion-and-pagination.md | 14.7k |
| kb/how-tos/unify-certificates-across-fog-servers.md | 14.2k |
| kb/how-tos/secure-boot-mok-enrollment.md | 13.6k |
| installation/network-setup/dhcp-server-settings.md | 12.2k |
| kb/how-tos/firewall.md | 11.4k |
| kb/reference/fog-client-installation-options.md | 10.8k |
| kb/troubleshooting/troubleshoot-ftp.md | 10.4k |
| kb/reference/secure-boot-technical-details.md | 10.3k |
| installation/server/command-line-options.md | 10.0k |
| development/fos-release-workflows.md | 10.0k |
| development/version-sync-automation.md | 9.8k |
| management/server/install-fogsettings.md | 9.5k |
| kb/reference/bringing-your-own-ca.md | 9.5k |
| kb/reference/sector-size-imaging.md | 9.1k |
| kb/reference/lvm-imaging.md | 8.8k |
| kb/how-tos/secure-boot-setup-mode-enrollment.md | 8.3k |
| development/plugin-schema-migrations.md | 8.0k |
| kb/how-tos/add-extend-a-2nd-virtual-hdd.md | 8.0k |
| development/fog-release.md | 7.3k |
| kb/troubleshooting/database-schema-update.md | 6.9k |
| kb/integrations/api.md | 6.9k |
| kb/reference/compile_ipxe_binaries.md | 6.5k |
| kb/troubleshooting/primary-mac-address-issues.md | 6.5k |
| kb/reference/group-shared-state.md | 6.4k |
| management/fos/using-fog-boot-menu.md | 5.6k |
| kb/reference/fog-security.md | 5.1k |
| kb/reference/pki-glossary.md | 4.8k |
| kb/how-tos/post-download-scripts.md | 4.8k |
| development/stable-release-workflow.md | 4.5k |
| kb/reference/archive/Acer-Iconia-Tab-w500.md | 4.5k |
| kb/reference/network-and-firewall-requirements.md | 4.4k |
| kb/reference/compile-fos-kernel.md | 4.4k |
| development/storage-node-selection-hooks.md | 4.3k |
| kb/how-tos/uefi-boot-entries.md | 4.3k |
| kb/how-tos/fog-client-example-tasks.md | 4.0k |
| kb/troubleshooting/sector-size-mismatch.md | 3.7k |
| kb/reference/manual-kernel-upgrade.md | 3.4k |
| kb/reference/hardware.md | 3.1k |
| kb/reference/SFTP.md | 2.2k |
| kb/how-tos/change-fog-server-ip-address.md | 1.9k |
| kb/reference/vi.md | 1.2k |

Suggested order: `management/web/ldap.md` finishes the `management/web/*`
cluster (everything else in it is done), then `kb/how-tos`, then
`kb/reference`, then `development` (contributor-facing, lowest priority), and
the four big ones last.

## Gotchas already paid for — don't rediscover these

- **Never put a Quartz content root inside the repo and gitignore it.** Quartz
  globs with `globby(..., { gitignore: true })`, so it finds nothing, exits 0,
  and publishes a site with no pages. That's why `rtd-build.mjs` composes into
  the OS temp dir.
- **Consequence of the above:** the composed tree is outside the git repo, so
  `created-modified-date` can't read git dates for translated builds and falls
  back to mtimes. Translated pages carry weaker date info than English ones.
  Known, documented, not solved.
- **Line endings.** Nine files in `docs/` are CRLF in the working tree while git
  stores LF, and git calls the tree clean. All Markdown reads go through
  `readDoc()`, which normalizes. Don't bypass it.
- **Heading anchors.** Translating a heading changes its Quartz id, breaking
  every link into it (115 across the repo, no build warning). `--relink` remaps
  them by heading *position*, which is only sound because `checkStructure`
  guarantees equal heading counts in order. Don't weaken that check.
- **`--relink` covers three link forms**, and it grew the third one late:
  same-page `](#anchor)`, wikilink `[[page#Heading]]`, and cross-page
  `](page.md#anchor)`. That last form was unhandled until the roles/site-scoping
  batch, and it failed silently in exactly the way the whole mechanism exists to
  prevent. `markdownLinkTargets` therefore drops the fragment on a `.md` target
  (it keeps them on external URLs, which nothing rewrites).
- **A translated page's anchors move again when a page pointing *at* it gets
  translated later** — and vice versa. This is why `--relink` sweeps the whole
  tree instead of running per page: seeding `hosts.md` rewrote anchors in
  `config.md` and `groups.md`, which had been translated batches earlier. Always
  run it after a batch, never assume a finished page stays finished.
- **A `|` inside a wikilink inside a table cell breaks the link**, because the
  pipe ends the cell. `docs/` escapes it as `[[ldap\|LDAP Authentication]]` in
  some tables and forgets to in others; a translation must copy whichever form
  the source used. Grepping the built HTML for `[[` gives 52 hits, and **the
  English build gives the same 52** — they're all pre-existing English defects
  (unescaped pipes in tables, a few wikilinks wrapped across a newline). Compare
  the two counts rather than reading a nonzero count as a translation bug.
- **The slugifier emits one hyphen per whitespace character**, matching
  github-slugger — `"Client & Server"` → `client--server`. Collapsing runs
  produces anchors Quartz never generates.
- **`docs/tags.md` is excluded.** Its body is `[TAGS]`, an MkDocs macro;
  Quartz's `tag-page` plugin owns `/tags/` and that file reaches no reader.
- **Menu-path arrows are the literal `→`.** `:octicons-arrow-right-24:` has no
  Quartz equivalent and printed as raw text. All 76 were converted. Don't
  reintroduce the shortcode.
- **`stable` and `1.5.9` versions fail on any new RTD project.** No tags exist,
  so RTD reads the version-shaped *branch* `1.5.9` as a release and designates it
  `stable`; that branch is Sphinx-era and its config predates RTD requiring
  `build.os`/`build.tools`. Deactivate both versions on every new project, or add
  an Automation Rule matching `^(1\.5\.9|stable)$`.

## The 1.5.9 branch — analyzed, leave it alone for now

It carries **no unique content**: it's `master@150b7fa` plus one commit that adds
only `.lastprereqrun`, a gitignored build artifact. Of 56 technical identifiers
in its 49 RST files, exactly one is absent from current `docs/` — and that one is
`/images/post-install`, a wrong path the Markdown corrected.

**But `https://docs.fogproject.org/en/1.5.9/` is live**, built from that branch.
Deleting the branch makes RTD drop the version and 404 those links. If 1.5.9
docs should stop resolving, delete the branch *and* add an RTD redirect
`/en/1.5.9/*` → `/en/latest/`. Separate decision from anything above.

## Needs a human (RTD dashboard)

- Deactivate `stable` and `1.5.9` on `fog-docs-lang-test` and `-fr` (or just
  delete those projects once French is live).
- Create `fog-docs-fr` after the merge; set Language: French; add it on
  `fog-docs` → *Translations*.
- Repeat per language, adding an Automation Rule each time.

---

## Prompt for a new session

> Continuing the fog-docs translation work on the `i18n-translations` branch.
> Read `.claude/i18n-context.md` first — it has the state, the commands, the
> per-page rules, and the gotchas. The `## Translations` section of `CLAUDE.md`
> has the design.
>
> French is at 47 of 99 pages and the pipeline is confirmed working live on the
> RTD test pair, including the language selector and the remapped heading
> anchors. The plan is to finish seeding French on this branch, merge to
> `master`, go live with a real `fog-docs-fr` RTD project, then add the other six
> languages on the live site — no more test projects.
>
> Keep seeding French, working through the remaining-pages table in the context
> file. Take the `management/web/*` cluster first unless you see a better order.
> Look terminology up in fogproject's `fr_FR.UTF-8` gettext catalog rather than
> guessing — the docs must name what the reader sees on screen (Host is
> "Machine", not "Hôte"). After each batch run `--verify`, `--relink`, `--verify`
> again, and commit. Tell me when you've used about 15% of my weekly limit and
> stop there.
