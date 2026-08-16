# Seeding a language by hand

How to bulk-translate a language into `translations/<lang>/`, and everything
already learned doing French. This file exists so *anyone* (or any future
session) can continue the seeding work without rediscovering the rules — keep
it updated as languages land.

The design rationale lives in the `## Translations` section of the repo's
`CLAUDE.md`; the Cloudflare account setup for the *automated* pipeline is
`translations/README.md`. This file is the manual counterpart: the automated
workflow is budgeted for drift (a page or two per English edit), not for
seeding a language from nothing — bulk seeding is done by hand, in-session,
then the workflow holds the line.

## Status

| Language | Seeded | RTD project |
|---|---|---|
| fr | **99/99 — complete** (2026-08-15) | live, with `/fr/*` redirect |
| es, de, it, ja, pt-br, zh-cn | 0 pages | not created |

Regenerate any language's remaining-pages list with
`node scripts/translate.mjs <lang> --dry-run`.

## Commands

```bash
node scripts/translate.mjs <lang> --dry-run     # what still needs translating
node scripts/translate.mjs <lang> --verify      # structural check, no network
node scripts/translate.mjs <lang> --relink      # re-resolve heading anchors
node scripts/translate.mjs <lang> --reindex     # accept the tree on disk as current
node --test "scripts/*.test.mjs"                # helper tests, no network

cd quartz && node scripts/rtd-build.mjs --language <lang> -o /tmp/site   # local build
```

## Seeding a page

For each page: read `docs/<path>`, write `translations/<lang>/<path>` with

1. **Front matter** — translate `title` and `description` only. Copy
   `context_id`, `tags` and `aliases` **verbatim**.
2. **Banner** immediately after the front matter, then a blank line. The text
   is the language's `banner` entry in `translations/languages.json`, rendered
   as a `>[!warning]` callout with `{url}` replaced by
   `https://docs.fogproject.org/en/latest/<slug>` (`<slug>` is the path without
   `.md`; `foo/index.md` → `foo`; the root `index.md` → the bare base URL).
3. **Body** — translate prose and headings. Never touch: fenced/inline code
   (byte-for-byte, including comments and whitespace inside — watch for
   non-breaking spaces the source may contain), wikilink *targets*
   (`[[target|Text]]` — only `Text` is translated), `![[image.png]]` embeds,
   URLs, callout type markers, escaped sequences like `\[\[...\]\]` and `\-`,
   and the odd RST-derived `:   -   ` definition-list indentation. Keep every
   wikilink on one line. Keep the same headings in the same order.
4. Run `--verify`, then `--relink`, then `--verify` again.
5. `--reindex` when a batch is done, so the state file records source hashes.

**Terminology comes from the FOG web UI's own gettext catalog** for that
language (`gettextLocale` in `languages.json` names it in the fogproject repo
under `packages/web/management/languages/`). Look terms up rather than
guessing — the docs must name what the reader's screen shows:

```bash
cd ../fogproject/packages/web/management/languages/<gettextLocale>/LC_MESSAGES
grep -A1 -x 'msgid "Storage Node"' messages.po
```

French examples of how this plays out: Host → **Machine** (not "Hôte"),
Plugin → **Greffon**, Storage Node → **Nœud de stockage**. **A term absent
from the catalog is evidence, not a gap** — the UI shows English there, so the
docs should too. Every FOG task-type name (Fast Wipe, Deploy - Multicast, …)
and every 1.6-era button label (Activate selected, Add New Host, …) stays in
English; Snapin and Multicast stay as-is in every language.

## Gotchas already paid for — don't rediscover these

- **Never put a Quartz content root inside the repo and gitignore it.** Quartz
  globs with `globby(..., { gitignore: true })`, finds nothing, exits 0, and
  publishes an empty site. `rtd-build.mjs` composes into the OS temp dir for
  this reason.
- **Consequence:** the composed tree is outside git, so translated builds fall
  back to file mtimes for page dates. Known, documented, not solved.
- **Line endings.** Some files in `docs/` are CRLF in the working tree while
  git stores LF. All Markdown reads in `translate.mjs` go through `readDoc()`,
  which normalizes. Don't bypass it.
- **Heading anchors.** Translating a heading changes its Quartz id, breaking
  every link into it — with no build warning. `--relink` remaps by heading
  *position*, sound only because `checkStructure` guarantees equal heading
  counts in order. Don't weaken that check.
- **`--relink` covers three link forms:** same-page `](#anchor)`, wikilink
  `[[page#Heading]]`, and cross-page `](page.md#anchor)`. The third was added
  late after failing silently — `markdownLinkTargets` drops fragments on `.md`
  targets on purpose (keeps them on external URLs, which nothing rewrites).
- **A translated page's anchors move again when a page pointing *at* it is
  translated later** — and vice versa. `--relink` sweeps the whole tree for
  this reason. Always run it after a batch; never assume a finished page stays
  finished.
- **A `|` inside a wikilink inside a table cell breaks the link** — copy
  whichever escaping form (`\|` or `|`) the English source used, per link.
  Check by grepping the built HTML for `[[` and comparing the count against an
  English build's count (equal = all hits are pre-existing English defects).
- **`[[` inside fenced code** (PHP `[[], []]`, bash `[[ -d … ]]`) is fine —
  `checkStructure` strips fenced blocks before its unclosed-wikilink count.
- **Non-breaking spaces in code blocks.** At least one English page's
  PowerShell block contains U+00A0 characters. `--verify` catches a normalized
  copy as "fenced code blocks differ" — fix by copying the source block
  byte-for-byte.
- **Mermaid diagram labels stay English.** A ```mermaid block is a fenced code
  block, compared byte-for-byte. Several pages have them
  (`secure-boot-signing`, `install-script-architecture`, `pki-zones`). If
  English-labeled diagrams become a real complaint, the fix is a deliberate,
  tested change to `codeBlocks()`, not an ad-hoc exemption.
- **The slugifier emits one hyphen per whitespace character** (matching
  github-slugger): `"Client & Server"` → `client--server`.
- **`docs/tags.md` is excluded** — its body is an MkDocs macro; Quartz's
  tag-page plugin owns `/tags/`.
- **Menu-path arrows are the literal `→`.** Don't reintroduce
  `:octicons-arrow-right-24:`.
- **Human edits to a translation survive until the English page changes**,
  then the page is regenerated and the edit is lost. Fixes belong upstream in
  `docs/`. After hand-editing a translation, run `--verify`.
- **The visible "Permalink" link is the short form** (`/{context_id}`,
  `/{lang}/{context_id}`) and only resolves through the RTD Exact Redirects
  below. Old `/{lang}/latest/{context_id}` links keep working — the alias
  stubs are still emitted and redirects fire on 404 only.

## Bringing a new language live (RTD dashboard checklist)

Per language, after its pages are seeded:

1. Create the RTD project (naming: `FOGProject-<lang>`), pointed at this repo,
   Language set to the language. The slug itself never reaches the build —
   only `$READTHEDOCS_LANGUAGE` and `$READTHEDOCS_CANONICAL_URL` do.
2. Add it on the parent **`FOGProject`** project → *Translations*.
3. **Deactivate `stable` and `1.5.9`** in Admin → Versions. RTD misreads the
   Sphinx-era `1.5.9` *branch* as a release and its build always fails. An
   Automation Rule cannot do this: there is no "Deactivate" action ("Hide"
   still builds), and rules never fire retroactively on versions created
   during the first sync.
4. Add the language's **Exact Redirect** (Admin → Redirects, "Force" off):
   From `/<lang>/*` → To `/<lang>/latest/:splat`. The parent project carries
   the catch-all `/*` → `/en/latest/:splat`; if both rules ever live on the
   same project, the language rule must sit **above** the catch-all (first
   match wins). These rules are what the visible Permalink links depend on —
   confirmed working for en and fr.
5. Test: `docs.fogproject.org/<lang>/introduction` should land on the
   translated page.

## The 1.5.9 branch — analyzed, leave it alone

It carries no unique content (master@150b7fa plus one gitignored artifact),
but `https://docs.fogproject.org/en/1.5.9/` is live and built from it.
Deleting the branch 404s those links; if that's ever wanted, delete the branch
*and* add an RTD redirect `/en/1.5.9/*` → `/en/latest/`. Separate decision.
