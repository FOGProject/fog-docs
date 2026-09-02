# Versioned pages: the FOG 1.5 / 1.6 split

This repo documents two FOG lines at once. Most pages apply to both and are
written once. Where 1.5 and 1.6 genuinely diverge, the topic is **forked into
three files**. This is the runbook for creating one, and for undoing the whole
arrangement when 1.5 is deprecated.

`CLAUDE.md` carries the short version — the rules that must not be broken.
This file is the detail and the procedures.

## Why three files and not two

The Quartz Explorer builds the sidebar **purely from folder structure**
(`@quartz-community/explorer`, configured in `quartz/quartz.config.yaml`). When
a page moves out of its topic folder into `docs/1.6/…`, it disappears from the
topic nav entirely — it does not appear under Installation, Management or the
KB at all. Readers browsing a section never see it.

That is what happened when the split first landed: `Installation → Server`
listed only Requirements, Virtualization and Uninstall, and *Install FOG
Server* — the most important page on the site — was reachable only through the
version pills, which requires the reader to already know that version matters
for that topic.

So a forked topic keeps a page at the unversioned topic path. That page is a
**chooser**: it states what actually differs between the versions and links
both. The nav entry comes back, and the reader learns whether they even need
to care before clicking.

```
docs/installation/server/install-fog-server.md        <- chooser (the nav entry)
docs/1.6/installation/server/install-fog-server.md
docs/1.5/installation/server/install-fog-server.md
```

## Who owns which identifier

This is the load-bearing rule. Get it wrong and permalinks break.

| File | `context_id` | `title` | `aliases` |
|---|---|---|---|
| 1.6 page | `install-fog-server` (**unsuffixed**) | `Install FOG Server` | the human-readable ones |
| 1.5 page | `install-fog-server-1.5` | `Install FOG Server (1.5)` | `(1.5)`-suffixed variants |
| chooser | `install-fog-server-versions` | `Install FOG Server` | **none** |

**The newest version's page owns the unsuffixed `context_id`**, so the
`/{context_id}` permalink always resolves to the newest docs.
`quartz/local-plugins/context-id-aliases` turns that `context_id` into a Quartz
alias and `@quartz-community/alias-redirects` emits a redirect stub at the site
root.

A chooser must therefore **never** take the unsuffixed `context_id`, and must
declare **no `aliases`** — the 1.6 page already claims the human-readable ones,
and two pages claiming one alias is a collision.

`title` is *not* a uniqueness key, and it is what the Explorer renders as the
nav label (it reads `data.title`). So the chooser keeps the plain unsuffixed
title without competing for anything.

## Forking a page

1. Write `docs/1.5/<path>.md` and `docs/1.6/<path>.md`. Give each an `>[!info]`
   callout at the top naming what differs and linking the other version, with
   the link **path-qualified**.
2. Write the chooser at `docs/<path>.md`:

   ```yaml
   ---
   title: Install FOG Server
   description: The branch choice, installer prompts and update process all differ between FOG 1.5 and 1.6
   context_id: install-fog-server-versions
   tags:
       - version-chooser
       - install
       - fogserver
   ---
   ```

   ```markdown
   # Install FOG Server

   <one short paragraph naming what actually differs -- not a template>

   - [[1.6/installation/server/install-fog-server|Install FOG Server (1.6)]]
   - [[1.5/installation/server/install-fog-server|Install FOG Server (1.5)]]

   >[!info] Which version am I on?
   >Check **FOG Configuration → FOG Settings → General → FOG_VERSION** in the
   >web UI, or the version string printed at the top of `installfog.sh`.
   ```

   The "what differs" paragraph is the entire reason the chooser exists. A bare
   pair of links adds a click and tells the reader nothing they did not already
   know. The 1.6 page's own `>[!info]` callout and the 1.5 page's `description`
   front matter are usually the raw material.
3. Every chooser carries the **`version-chooser` tag**. That tag page is the
   inventory the teardown runbook works from, and
   `scripts/check-version-split.mjs` enforces it.
4. Add the chooser to its folder's `index.md` list, marked
   "— differs between FOG 1.5 and 1.6".
5. **Add the page to both nav-order tables** (see below).
6. Run the checks below.

## 1.6-only features are not forked

A feature that does not exist on 1.5 in any form has nothing to choose between.
It lives at the **unversioned** path with an "applies to FOG 1.6 and later"
callout and gets **no** chooser — a click-through page with exactly one link on
it cannot be justified to a reader. List it in `docs/1.5/index.md` under
"Features with no 1.5 equivalent at all".

`docs/management/web/certificates.md` and
`docs/management/server/supported-customizations.md` are the current examples.

## Linking rules

- **Inside a version tree, a link to a forked page must carry that same
  version.** A 1.6 page links `1.6/…`; a 1.5 page links `1.5/…`. This includes
  a page linking **its own** headings: write
  `[[1.6/management/server/install-fogsettings#Security|Security]]`, not
  `[[management/server/install-fogsettings#Security|Security]]`.
- **Never leave an unversioned link to a forked page inside a version tree.**
  It resolves to the chooser and silently drops any `#anchor`, landing the
  reader on the chooser instead of the section the sentence promised. Nothing
  warns. The original split left 209 of these.
- **From outside the trees an unversioned link is correct and preferred** — it
  resolves to the chooser, which is the version-agnostic answer. Qualify it
  only when you genuinely mean one specific version's page.
- Any wikilink carrying an `#anchor` must be path-qualified. See `CLAUDE.md`
  for why a bare one loses the fragment.

## The version trees are not in the sidebar

The Explorer's `filterFn` hides `docs/1.5/` and `docs/1.6/` from the tree. Their
pages are reached three ways: the chooser that sits at each forked topic's
normal place in the tree, the pinned **FOG 1.5** / **FOG 1.6** pills above the
tree, and search.

This is deliberate. When the trees were shown, the sidebar had six top-level
sections instead of four, and every forked page appeared in it three times —
once as its chooser and once inside each version tree. That is more navigation,
not less, and it buries the topic tree the choosers exist to restore. The
choosers put each forked topic in exactly one place; showing the trees as well
undoes that.

Two things follow, and both are enforced by `check-version-split.mjs`:

- **Supplying a `filterFn` replaces the plugin default**, which was
  `node.slugSegment !== "tags"`. That exclusion has to be repeated, or the tag
  tree reappears in the sidebar.
- **`prev-next-nav` applies the same exclusion** (`VERSION_TREES`). Without it,
  "Next" on the last Development page steps into a tree the reader cannot see.
  Pages inside a version tree therefore get no Previous/Next of their own, which
  is correct: they are reached deliberately from a chooser, not by reading the
  site in order.

The pills stay. The two landing pages list every difference in one place, which
is the right entry point for "what changed overall" as opposed to one topic.

## The two nav-order tables

Reading order is encoded **twice**, and the copies must agree:

- `quartz/quartz.config.yaml` — the Explorer `sortFn`'s `topOrder` and
  `explicitOrder`.
- `quartz/local-plugins/prev-next-nav/dist/components/index.js` — `TOP_ORDER`
  and `EXPLICIT_ORDER`.

They cannot share a module: the `sortFn` is a **string inside YAML**, shipped
to the browser in a `data-` attribute and rebuilt there with `new Function`.
The duplication is structural, not an oversight. Adding or removing any page in
a directory that has an explicit order means editing both, or the sidebar and
the Previous/Next links tell the reader two different stories.

## Checks

```bash
node scripts/check-version-split.mjs     # the invariants above; no build needed
cd quartz && npm run docs:build          # structural validation
node scripts/check-anchors.mjs           # broken #fragments (needs the build)
node scripts/show-nav.mjs installation/server management/web   # the sidebar order
```

`check-version-split.mjs` verifies: no unversioned links to forked pages inside
the version trees, the two nav-order tables agreeing, every forked topic having
a chooser, and no chooser claiming the latest version's `context_id` or any
alias. It exits non-zero on any failure.

The Quartz build is the only structural validator — broken wikilinks and
duplicate `context_id`s surface there. It does **not** warn about anything the
two scripts check, nor about these, so run them by hand after touching links:

**No literal wikilinks leaked** (line-wrapped links, unescaped table pipes):

```bash
grep -ro '\[\[' quartz/public --include=*.html | sort | uniq -c
```

Only hits inside code blocks are legitimate.

**Permalinks still resolve to the newest version** — the regression to guard:

```bash
grep -o 'url=[^">]*' quartz/public/install-fog-server/index.html
```

Must point at `./1.6/…`, never at a chooser.

**Nav is whole** — that every forked page appears under its topic folder, which
is the whole point of the choosers:

```bash
node scripts/show-nav.mjs installation/server management/web kb/reference
```

The Explorer tree is built **client-side** from `static/contentIndex.json`, so
the order is not in the emitted HTML and cannot be grepped. `show-nav.mjs`
rebuilds the same trie the browser builds and applies the real `sortFn`, which
is why a missing nav entry is catchable from a terminal rather than only by
eye in `npm run docs:serve`.

## Teardown: deprecating 1.5

The "1.6 owns the unsuffixed identifiers" rule is what makes this cheap. The
surviving pages need **no front-matter edits** — they already hold the final
`context_id`, `title` and `aliases`.

1. Get the inventory: `grep -rl 'version-chooser' docs/` lists exactly the
   forked topics. `node scripts/check-version-split.mjs` prints the count.
2. Delete `docs/1.5/` entirely, including `docs/1.5/index.md`.
3. For each forked topic: delete the chooser, then
   `git mv docs/1.6/<path>.md docs/<path>.md`. Add `1.6/<path>` to the moved
   page's `aliases` so the old versioned URL keeps resolving.
4. Delete `docs/1.6/`, including `docs/1.6/index.md`.
5. Drop the `>[!info]` version callouts from the moved pages, and the "applies
   to FOG 1.6 and later" callouts from the 1.6-only pages — they no longer say
   anything.
6. Remove the **FOG 1.5** and **FOG 1.6** pills from `section-shortcuts` in
   `quartz/quartz.config.yaml`.
7. Remove `1.5`/`1.6` from the `sortFn`'s `topOrder` and every `1.5/…` and
   `1.6/…` key from `explicitOrder`. Mirror it in `prev-next-nav`. The
   per-folder orders themselves stay as they are: the chooser slugs become the
   real page slugs, so those lists are already correct.
8. Site-wide, rewrite `[[1.6/<path>|Text]]` → `[[<basename>|Text]]`, keeping the
   path qualified wherever the link carries an `#anchor`.
9. Strip the now-meaningless `1_5-legacy`, `1_6-changes` and `version-chooser`
   tags, and the "— differs between FOG 1.5 and 1.6" notes from the folder
   `index.md` lists.
10. Delete `scripts/check-version-split.mjs` and this file, and drop their
    mentions from `CLAUDE.md`.
11. Rebuild, then run `node scripts/check-anchors.mjs` and the literal-wikilink
    grep above.
