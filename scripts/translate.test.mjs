// Unit checks for the pure helpers in translate.mjs. No network, no model.
//
//   node --test scripts/
//
// This repo otherwise has no test suite -- the only validation is that the
// Quartz build completes. These exist anyway because the helpers here fail
// quietly rather than loudly: a fuzzy gettext entry that slips through the PO
// parser produces confidently wrong terminology, and a wikilink the structure
// check fails to notice ships a page that builds clean and renders a literal
// [[page|Text]] to the reader. Neither shows up as an error anywhere.
import assert from "node:assert/strict"
import { test } from "node:test"
import {
  banner,
  checkStructure,
  chunkBody,
  getScalar,
  headingSlugs,
  parsePo,
  selectGlossary,
  setScalar,
  slugifyHeading,
  splitFrontmatter,
  stripBanner,
} from "./translate.mjs"

// A cut-down catalog in the exact shape fogproject emits: msgcat --no-wrap,
// --sort-output, entries separated by blank lines, `#, fuzzy` on the line
// before the msgid it applies to.
const PO_FIXTURE = `# French translations for PACKAGE package.
msgid ""
msgstr ""
"Language: fr_FR.UTF-8\\n"

msgid "Add Storage Node"
msgstr "Ajouter un nœud de stockage"

#, fuzzy
msgid "Deploy Image"
msgstr "Déployer une image"

msgid "Storage Node"
msgstr "Nœud de stockage"

msgid "Host"
msgstr "Hôte"

msgid "Snapin Pack"
msgstr "Pack de snapins"

msgid "Empty"
msgstr ""

msgid "%s hosts found"
msgstr "%s hôtes trouvés"
`

test("parsePo keeps usable entries", () => {
  const entries = parsePo(PO_FIXTURE)
  assert.equal(entries.get("Storage Node"), "Nœud de stockage")
  assert.equal(entries.get("Add Storage Node"), "Ajouter un nœud de stockage")
})

test("parsePo drops the header entry", () => {
  assert.equal(parsePo(PO_FIXTURE).has(""), false)
})

test("parsePo drops fuzzy entries", () => {
  // The flag precedes its own msgid but follows the previous entry's blank
  // line, so it has to survive the flush in between. Collapsing the pending
  // and current flags into one variable lets every fuzzy entry through --
  // which for the es_ES and de_DE catalogs is most of the file.
  assert.equal(parsePo(PO_FIXTURE).has("Deploy Image"), false)
})

test("parsePo drops entries with no translation", () => {
  assert.equal(parsePo(PO_FIXTURE).has("Empty"), false)
})

test("selectGlossary returns only terms present in the page, longest first", () => {
  const entries = parsePo(PO_FIXTURE)
  const page = "Open Storage Management and click Add Storage Node to register a Storage Node."
  const picked = selectGlossary(entries, page)

  assert.deepEqual(
    picked.map(([msgid]) => msgid),
    ["Add Storage Node", "Storage Node"],
  )
})

test("selectGlossary skips format strings", () => {
  const entries = parsePo(PO_FIXTURE)
  const picked = selectGlossary(entries, "Every Host has 3 hosts found in a Snapin Pack")

  // "%s hosts found" is a format string, not a term -- it can never match
  // prose, and offering it as a glossary entry only spends input budget.
  // "Host" does stay: it is a core FOG concept and pinning it is the point.
  assert.deepEqual(
    picked.map(([msgid]) => msgid),
    ["Snapin Pack", "Host"],
  )
})

const PAGE = `---
title: Requirements
context_id: requirements
aliases:
    - System Requirements
description: hardware and os requirements
tags:
    - dependencies
---

# System Requirements

See [[network-and-firewall-requirements|Network requirements]].
`

test("splitFrontmatter round-trips", () => {
  const { frontmatter, body } = splitFrontmatter(PAGE)
  assert.equal(frontmatter + body, PAGE)
  assert.ok(frontmatter.startsWith("---\n"))
})

test("splitFrontmatter tolerates a page without front matter", () => {
  assert.equal(splitFrontmatter("# Hi\n").frontmatter, "")
  assert.equal(splitFrontmatter("# Hi\n").body, "# Hi\n")
})

test("setScalar changes only the value it is given", () => {
  const { frontmatter } = splitFrontmatter(PAGE)
  const swapped = setScalar(frontmatter, "title", "Prérequis")

  assert.equal(getScalar(swapped, "title"), "Prérequis")
  // context_id has to match English for the /{context_id} permalink to
  // resolve; aliases hold redirect slugs; tags drive the tag tree.
  assert.equal(getScalar(swapped, "context_id"), "requirements")
  assert.ok(swapped.includes("    - System Requirements"))
  assert.ok(swapped.includes("    - dependencies"))
})

test("setScalar quotes a value that would otherwise break the YAML", () => {
  const { frontmatter } = splitFrontmatter(PAGE)
  const swapped = setScalar(frontmatter, "title", "Prérequis: matériel")
  assert.ok(swapped.includes('title: "Prérequis: matériel"'))
})

test("chunkBody leaves a short page whole", () => {
  assert.equal(chunkBody("tiny").length, 1)
})

test("chunkBody splits a long page at headings and loses nothing", () => {
  const body = ["intro\n\n", ...Array.from({ length: 6 }, (_, i) => `## Section ${i}\n\n${"word ".repeat(300)}\n\n`)].join("")
  const chunks = chunkBody(body)

  assert.ok(chunks.length > 1, `expected a split, got ${chunks.length}`)
  assert.equal(chunks.join(""), body)
})

test("chunkBody falls back to paragraph breaks when headings do not help", () => {
  const body = Array.from({ length: 8 }, () => "word ".repeat(300)).join("\n\n")
  const chunks = chunkBody(body)

  assert.ok(chunks.length > 1)
  assert.equal(chunks.join(""), body)
})

test("checkStructure passes a faithful translation", () => {
  assert.deepEqual(checkStructure("see [[a-page|A page]]", "voir [[a-page|Une page]]"), [])
})

test("checkStructure catches a translated wikilink target", () => {
  // The target is a slug, not prose. Translating it points the link at a page
  // that does not exist, and Quartz does not warn.
  assert.ok(checkStructure("see [[a-page|A]]", "voir [[une-page|A]]").length > 0)
})

test("checkStructure catches a dropped wikilink", () => {
  assert.ok(checkStructure("see [[a-page|A]] here", "voir ici").length > 0)
})

test("checkStructure catches a wikilink wrapped across a newline", () => {
  // This is the failure the whole check exists for: it renders as literal
  // [[page|Text]] on the published page and the build says nothing.
  assert.ok(checkStructure("see [[a-page|A page]] ok", "voir [[a-page|Une\npage]] ok").length > 0)
})

test("checkStructure catches a rewritten code block", () => {
  assert.ok(checkStructure("```\nfog install\n```", "```\nfog installer\n```").length > 0)
})

test("checkStructure catches a changed link target", () => {
  assert.ok(checkStructure("[x](https://a/b)", "[y](https://a/c)").length > 0)
})

test("checkStructure catches a lost heading", () => {
  assert.ok(checkStructure("# One\n## Two\n", "# Un\n").length > 0)
})

test("banner is a well-formed callout linking to the English original", () => {
  const text = banner("fr", "installation/server/requirements.md")

  assert.ok(text.startsWith(">[!warning] "))
  // Every line of a callout has to stay quoted or the body escapes it.
  assert.ok(text.trimEnd().split("\n").every((line) => line.startsWith(">")))
  assert.ok(text.includes("https://docs.fogproject.org/en/latest/installation/server/requirements"))
})

test("banner maps index pages to their folder URL", () => {
  assert.ok(banner("fr", "installation/index.md").includes("/en/latest/installation)"))
  assert.ok(banner("fr", "index.md").includes("/en/latest)"))
})

test("stripBanner removes the banner and nothing else", () => {
  const body = banner("fr", "index.md") + "# Titre\n\ncorps\n"
  assert.equal(stripBanner(body, "fr"), "# Titre\n\ncorps\n")
})

test("stripBanner leaves a page that has no banner alone", () => {
  assert.equal(stripBanner("# Titre\n", "fr"), "# Titre\n")
})

test("slugifyHeading matches how Quartz builds heading ids", () => {
  assert.equal(slugifyHeading("Updating an existing install"), "updating-an-existing-install")
  // Punctuation is dropped, accents are kept -- both matter, because the
  // translated slug is what the rewritten anchor has to equal.
  assert.equal(slugifyHeading("Mettre à jour une installation existante"), "mettre-à-jour-une-installation-existante")
  assert.equal(slugifyHeading("FOG Client & Server: notes!"), "fog-client--server-notes")
})

test("headingSlugs returns every heading in document order", () => {
  const slugs = headingSlugs("# One\n\ntext\n\n## Two Words\n\n### Three\n")
  assert.deepEqual(slugs, ["one", "two-words", "three"])
})

test("headingSlugs disambiguates repeated headings the way github-slugger does", () => {
  assert.deepEqual(headingSlugs("## Notes\n## Notes\n## Notes\n"), ["notes", "notes-1", "notes-2"])
})

test("headings line up by position between a page and its translation", () => {
  // This is the invariant the anchor remapping rests on: checkStructure
  // enforces equal heading counts, so the Nth heading of a translation is the
  // translation of the Nth heading of its source, and an anchor can be moved
  // across languages by index without parsing either one.
  const english = "# Install FOG server\n\n## Prerequisite\n\n### Updating an existing install\n"
  const french = "# Installer le serveur FOG\n\n## Prérequis\n\n### Mettre à jour une installation existante\n"

  const from = headingSlugs(english)
  const to = headingSlugs(french)

  assert.equal(from.length, to.length)
  assert.equal(to[from.indexOf("updating-an-existing-install")], "mettre-à-jour-une-installation-existante")
})

test("checkStructure ignores heading fragments on wikilinks", () => {
  // Fragments are heading references, and headings get translated on purpose --
  // relinkLanguage rewrites them, danglingAnchors checks them. What must never
  // change is the page part before the '#'.
  assert.deepEqual(checkStructure("see [[hosts#Kernel|K]]", "voir [[hosts#Noyau|N]]"), [])
})

test("checkStructure still catches a translated page target with a fragment", () => {
  assert.ok(checkStructure("see [[hosts#Kernel]]", "voir [[machines#Noyau]]").length > 0)
})

test("checkStructure ignores same-page anchors", () => {
  assert.deepEqual(checkStructure("[x](#a-heading)", "[y](#un-titre)"), [])
})
