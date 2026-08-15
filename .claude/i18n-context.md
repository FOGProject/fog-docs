# fog-docs translations — working context

Handoff notes for continuing the translation work in a fresh session. Lives in
`.claude/` rather than `docs/` because it's working state, not documentation —
delete it once French is live and the remaining languages are seeded.

The user-facing reference is the `## Translations` section of the repo's
`CLAUDE.md`. This file is the *operational* state: what's done, what's next, and
what already bit us.

---

## Where things stand

Branch **`i18n-translations`**, pushed to `origin`, and
**[PR #108](https://github.com/FOGProject/fog-docs/pull/108) is open against
`master`**. Nothing merged yet.

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

**French: 99 of 99 pages — seeding is COMPLETE.** Nothing remains untranslated;
`--dry-run` reports zero pages and `--verify` passes clean across the tree.

## The plan from here (decided by the user)

No more test projects — one test pair was enough to prove the mechanism.

1. ~~Seed the rest of French on this branch.~~ 77/99 done; the remaining 22 are
   the large contributor-facing and Secure Boot pages. They are **not blocking**
   — an untranslated page is served in English.
2. ~~PR `i18n-translations` → `master`~~ — PR #108 is open. Merging activates
   `.github/workflows/translate.yml` (the `schedule:` trigger only fires from
   the default branch, so it is inert until then).
3. Create the real **`FOGProject-fr`** RTD project against `master` and add it
   as a translation of **`FOGProject`** (the parent project's slug — *not*
   `fog-docs`, which is the repo name). **Go live with French.**
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

## Remaining French pages

None — all 99 pages are seeded (final batch of 12 landed 2026-08-15).
Regenerate the list any time with `node scripts/translate.mjs fr --dry-run`.

Also done that day: `translations/README.md` is the human how-to for creating
the Cloudflare account/token and wiring `TRANSLATE_API_KEY`/`TRANSLATE_ENDPOINT`/
`TRANSLATE_MODEL` into GitHub — the remaining human step before the workflow
can hold the line on drift.

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
- **Mermaid diagram labels stay English.** A ```mermaid block is a fenced code
  block, so `checkStructure` compares it byte-for-byte and `--verify` rejects a
  translated one ("fenced code blocks differ"). That is the correct call for
  every other fenced block, so the rule was left alone rather than special-cased
  — but it does mean mermaid flowcharts render in English on translated pages.
  Several exist now: `secure-boot-signing`, `install-script-architecture` (two),
  `pki-zones`. If English-labeled diagrams become a real complaint, the fix is
  a deliberate, tested change to `codeBlocks()` that exempts `mermaid`, not an
  ad-hoc edit that quietly weakens the check.
- **`[[` inside fenced code no longer trips the unclosed-wikilink check.**
  `plugin-development` (PHP `[[], []]`) and `migrating-fog-server` (bash
  `[[ -d … ]]`) were the first translated pages whose *code* contains `[[`,
  which the raw opener-count in `checkStructure` misread as a broken wikilink.
  The check now strips fenced blocks first (they're compared byte-for-byte
  separately); covered by a test in `translate.test.mjs`.
- **The slugifier emits one hyphen per whitespace character**, matching
  github-slugger — `"Client & Server"` → `client--server`. Collapsing runs
  produces anchors Quartz never generates.
- **`docs/tags.md` is excluded.** Its body is `[TAGS]`, an MkDocs macro;
  Quartz's `tag-page` plugin owns `/tags/` and that file reaches no reader.
- **Menu-path arrows are the literal `→`.** `:octicons-arrow-right-24:` has no
  Quartz equivalent and printed as raw text. All 76 were converted. Don't
  reintroduce the shortcode.
- **The RTD project slug does not reach the build.** `rtd-build.mjs` reads only
  `$READTHEDOCS_LANGUAGE` (which language to compose) and
  `$READTHEDOCS_CANONICAL_URL` (the baseUrl). Both come from the project's
  *settings*, not its name, so a project can be called anything —
  `FOGProject-fr` matching the parent's naming, or `fog-docs-fr` matching the
  repo — with no code change either way. The machine-translation banner links
  to the `docs.fogproject.org` custom domain, so it is unaffected too.
- **`stable` and `1.5.9` versions fail on any new RTD project.** No tags exist,
  so RTD reads the version-shaped *branch* `1.5.9` as a release and designates it
  `stable`; that branch is Sphinx-era and its config predates RTD requiring
  `build.os`/`build.tools`. **Deactivate both in Admin → Versions on every new
  project.** Inactive is the right state: RTD's docs say inactive versions "have
  their documentation content deleted and builds cannot be triggered", which is
  exactly what stops the failure.
- **An Automation Rule cannot do that job — don't reach for one.** This was
  written here as an alternative and it is wrong on two counts:
  1. **There is no "Deactivate version" action.** The actions are Activate,
     Hide, Make public, Make private, Set as default, Delete version, and
     Trigger build. **"Hide version" is the trap** — hidden versions are only
     dropped from the flyout and search; they still build, so the failing build
     still fails.
  2. **Rules only evaluate on newly created versions**, never retroactively. RTD
     creates `1.5.9` and `stable` during the project's first repo sync, before
     any rule can exist, so a rule would never fire for them.

  "Delete version" is the only action that would stop a build, but it is aimed
  at cleaning up versions whose branch is gone — pointing it at a branch that
  still exists is fighting the version sync rather than configuring it.

  The manual deactivation is two clicks per project, seven projects, once each.
  The only change that removes the chore for *all* projects at once is dealing
  with the `1.5.9` branch itself — see the next section, which is a separate
  decision because those URLs are live.

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
- Create **`FOGProject-fr`** after the merge; set Language: French; add it on
  **`FOGProject`** → *Translations*. The `-fr` suffix matches the parent's
  existing naming; the slug is a free choice as far as the build is concerned
  (see below).
- Deactivate `stable` and `1.5.9` on the new project (Admin → Versions). Not an
  Automation Rule — see the gotcha above for why that cannot work.
- Repeat per language.

---

## Prompt for a new session

> Continuing the fog-docs translation work on the `i18n-translations` branch.
> Read `.claude/i18n-context.md` first — it has the state, the commands, the
> per-page rules, and the gotchas. The `## Translations` section of `CLAUDE.md`
> has the design.
>
> French is at 77 of 99 pages and the pipeline is confirmed working live on the
> RTD test pair, including the language selector and the remapped heading
> anchors. The plan is to finish seeding French on this branch, merge to
> `master`, go live with a real `FOGProject-fr` RTD project, then add the other six
> languages on the live site — no more test projects.
>
> Keep seeding French, working through the remaining-pages table in the context
> file. Take the `management/web/*` cluster first unless you see a better order.
> Look terminology up in fogproject's `fr_FR.UTF-8` gettext catalog rather than
> guessing — the docs must name what the reader sees on screen (Host is
> "Machine", not "Hôte"). After each batch run `--verify`, `--relink`, `--verify`
> again, and commit. Tell me when you've used about 15% of my weekly limit and
> stop there.
