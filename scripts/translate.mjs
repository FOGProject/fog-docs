#!/usr/bin/env node
// Regenerates translations/<lang>/ from docs/.
//
// docs/ is the only source of truth. Everything under translations/ is derived
// and safe to delete -- rerunning this rebuilds it. The English tree is never
// read for anything but input and never written to.
//
// Design notes worth knowing before changing this:
//
//   * Filenames stay English. The Explorer sortFn in quartz.config.yaml,
//     section-shortcuts, prev-next-nav and every wikilink target all key off
//     slugs, which come from filenames. Translating a filename would silently
//     break navigation across the whole site. Only front-matter `title` and
//     `description` and the prose are translated; the visible nav localizes
//     through `title` alone.
//
//   * context_id, tags and aliases are copied verbatim. context_id has to
//     match English for the /{context_id} permalink to resolve, aliases hold
//     redirect slugs from retired URLs, and translating tags would fragment
//     the tag tree. This is enforced structurally rather than by asking the
//     model nicely: the front matter is rebuilt here from the English original
//     with only two values substituted, so the model never emits YAML at all.
//
//   * Terminology is pinned to the FOG web UI's own translations. fogproject
//     carries human-translated gettext catalogs of every UI string; the
//     matching entries for each page are fed to the model as a mandatory
//     glossary. Without this the docs end up telling a French reader to click
//     a button whose label does not exist on their screen.
//
//   * Output is verified structurally before it is written. A model that drops
//     a wikilink, rewrites a code block or wraps a link across a newline
//     produces a page that still builds clean and is still wrong -- Quartz does
//     not warn about a wikilink it failed to parse, it just renders the literal
//     text. checkStructure below is the backstop; a file that fails it is
//     skipped and reported, never committed.
//
// Usage:
//   node scripts/translate.mjs fr                 # translate what changed
//   node scripts/translate.mjs all --limit 20     # every language, 20 requests total
//   node scripts/translate.mjs fr --dry-run       # show the work, call nothing
//   node scripts/translate.mjs fr --verify        # re-check what is on disk, call nothing
//   node scripts/translate.mjs fr --relink        # re-resolve heading anchors, call nothing
//   node scripts/translate.mjs fr --reindex       # accept the tree on disk as current
//   node scripts/translate.mjs fr --file installation/server/requirements.md
//
// Environment:
//   GITHUB_TOKEN        token with `models: read` (set automatically in Actions)
//   TRANSLATE_MODEL     default openai/gpt-4o-mini
//   TRANSLATE_ENDPOINT  default https://models.github.ai/inference/chat/completions
//   TRANSLATE_LIMIT     default 40 model requests per run
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const docsDir = path.join(repoRoot, "docs")
const translationsDir = path.join(repoRoot, "translations")

const languages = JSON.parse(readFileSync(path.join(translationsDir, "languages.json"), "utf8"))

const MODEL = process.env.TRANSLATE_MODEL ?? "openai/gpt-4o-mini"
const ENDPOINT = process.env.TRANSLATE_ENDPOINT ?? "https://models.github.ai/inference/chat/completions"
const DEFAULT_LIMIT = Number(process.env.TRANSLATE_LIMIT ?? 40)

// The free tier caps a request at 8K tokens in and 4K out. The prompt and
// glossary occupy some of the input budget and the translation is roughly as
// long as its source, so chunks are kept well under what the output cap allows.
const MAX_CHUNK_CHARS = Number(process.env.TRANSLATE_CHUNK_CHARS ?? 5000)

// Mirrors ignorePatterns in quartz/quartz.config.yaml. Files Quartz never
// builds are not worth translating.
const IGNORED_SEGMENTS = new Set(["private", "templates", ".obsidian"])

const STATE_FILE = ".translation-state.json"
const GLOSSARY_MAX_TERMS = 40

class RateLimited extends Error {}

// --------------------------------------------------------------------- files

// `unlisted` pages are kept out of the nav and the search index -- in this repo
// they are contributor notes about how the assets directories work, not
// documentation anyone reads. `draft` pages are not built at all. Neither is
// worth a request against a rate-limited budget.
function isTranslatable(absPath) {
  const head = readFileSync(absPath, "utf8").slice(0, 600)
  return !/^unlisted:\s*true\s*$/m.test(head) && !/^draft:\s*true\s*$/m.test(head)
}

function listSourceDocs() {
  const found = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (!IGNORED_SEGMENTS.has(entry)) walk(full)
      } else if (entry.endsWith(".md") && isTranslatable(full)) {
        found.push(path.relative(docsDir, full).split(path.sep).join("/"))
      }
    }
  }
  walk(docsDir)
  return found.sort()
}

function listTranslatedDocs(lang) {
  const root = path.join(translationsDir, lang)
  if (!existsSync(root)) return []
  const found = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (entry.endsWith(".md")) found.push(path.relative(root, full).split(path.sep).join("/"))
    }
  }
  walk(root)
  return found.sort()
}

const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex")

function readState(lang) {
  const file = path.join(translationsDir, lang, STATE_FILE)
  if (!existsSync(file)) return { entries: {} }
  return JSON.parse(readFileSync(file, "utf8"))
}

function writeState(lang, state) {
  const dir = path.join(translationsDir, lang)
  mkdirSync(dir, { recursive: true })
  const ordered = Object.fromEntries(Object.entries(state.entries).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(
    path.join(dir, STATE_FILE),
    JSON.stringify(
      {
        $comment:
          "Written by scripts/translate.mjs. Maps each docs/ page to the sha256 of the English " +
          "source it was last translated from; a page is retranslated when its source hash moves. " +
          "Delete an entry to force that page to be retranslated.",
        entries: ordered,
      },
      null,
      2,
    ) + "\n",
  )
}

// --------------------------------------------------------------- front matter

// The front matter is treated as text rather than parsed, so that everything
// this script does not deliberately change comes out byte-identical -- key
// order, comments, list style, quoting, all of it.
function splitFrontmatter(text) {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) return { frontmatter: "", body: text }
  const end = text.indexOf("\n---", 3)
  if (end === -1) return { frontmatter: "", body: text }
  const closeEnd = text.indexOf("\n", end + 1)
  const cut = closeEnd === -1 ? text.length : closeEnd + 1
  return { frontmatter: text.slice(0, cut), body: text.slice(cut) }
}

function getScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"))
  if (!match) return undefined
  return match[1].trim().replace(/^["'](.*)["']$/, "$1")
}

function setScalar(frontmatter, key, value) {
  const needsQuoting = /^[\s>|&*!%@`{[]|: |:$|#/.test(value)
  const emitted = needsQuoting ? `"${value.replace(/"/g, '\\"')}"` : value
  return frontmatter.replace(new RegExp(`^(${key}:)[ \\t]*.*$`, "m"), `$1 ${emitted}`)
}

// -------------------------------------------------------------------- chunking

// Splits on the coarsest heading level that gets every piece under the limit,
// falling back to paragraph boundaries. Splitting only at boundaries the model
// can see means each chunk is self-contained prose rather than a sentence
// severed mid-clause.
function chunkBody(body) {
  if (body.length <= MAX_CHUNK_CHARS) return [body]

  for (const level of [2, 3, 4]) {
    const parts = sliceAt(body, new RegExp(`^#{${level}} `, "gm"))
    if (parts.length > 1 && parts.every((p) => p.length <= MAX_CHUNK_CHARS)) return parts
  }

  // No heading structure fine enough to help. Fall back to paragraph breaks,
  // packing as many as fit rather than one per chunk.
  const paragraphs = sliceAt(body, /\n{2,}(?=\S)/g)
  const chunks = []
  let current = ""
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length > MAX_CHUNK_CHARS) {
      chunks.push(current)
      current = paragraph
    } else {
      current += paragraph
    }
  }
  if (current) chunks.push(current)
  return chunks
}

// Cuts `text` immediately before each match, by index rather than by
// split/join, so the pieces concatenate back into exactly the original -- no
// separator to guess at and nothing silently dropped between them.
function sliceAt(text, pattern) {
  const cuts = [...text.matchAll(pattern)].map((m) => m.index).filter((i) => i > 0)
  if (!cuts.length) return [text]

  const parts = []
  let start = 0
  for (const cut of cuts) {
    parts.push(text.slice(start, cut))
    start = cut
  }
  parts.push(text.slice(start))
  return parts
}

// -------------------------------------------------------------------- glossary

// The catalogs are emitted with msgcat --no-wrap (see
// fogproject/.githooks/lib/update-language.sh), so entries are one line each --
// but continuation lines are handled anyway, since that is a formatting choice
// in another repo and not a promise to this one.
function parsePo(text) {
  const entries = new Map()
  let msgid = null
  let msgstr = null
  let target = null
  // `#, fuzzy` precedes the msgid it applies to, and entries are separated by
  // blank lines, so the flag has to survive the flush of the *previous* entry
  // to reach its own. Collapsing these two into one variable silently lets
  // every fuzzy entry through -- which for es_ES and de_DE is most of the file.
  let pendingFuzzy = false
  let currentFuzzy = false

  const flush = () => {
    if (msgid && msgstr && !currentFuzzy) entries.set(msgid, msgstr)
    msgid = msgstr = target = null
    currentFuzzy = false
  }

  const unquote = (line) => {
    const match = line.match(/"((?:[^"\\]|\\.)*)"/)
    return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\") : ""
  }

  for (const line of text.split("\n")) {
    if (line.startsWith("#, ") && line.includes("fuzzy")) pendingFuzzy = true
    else if (line.startsWith("msgid ")) {
      flush()
      currentFuzzy = pendingFuzzy
      pendingFuzzy = false
      msgid = unquote(line)
      target = "msgid"
    } else if (line.startsWith("msgstr ")) {
      msgstr = unquote(line)
      target = "msgstr"
    } else if (line.startsWith('"') && target) {
      if (target === "msgid") msgid += unquote(line)
      else msgstr += unquote(line)
    } else if (line.trim() === "") {
      flush()
    }
  }
  flush()

  entries.delete("")
  return entries
}

const glossaryCache = new Map()

async function loadGlossary(lang) {
  if (glossaryCache.has(lang)) return glossaryCache.get(lang)

  const locale = languages.languages[lang].gettextLocale
  if (!locale) {
    glossaryCache.set(lang, new Map())
    return glossaryCache.get(lang)
  }

  const url =
    "https://raw.githubusercontent.com/FOGProject/fogproject/dev-branch/packages/web/management/languages/" +
    `${locale}/LC_MESSAGES/messages.po`

  let entries = new Map()
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    entries = parsePo(await response.text())
    console.log(`  glossary: ${entries.size} usable terms from ${locale}`)
  } catch (error) {
    // Deliberately non-fatal. A fog-docs translation run should not fail
    // because another repo is briefly unreachable; the cost of losing the
    // glossary is less consistent terminology, not a broken page.
    console.warn(`  glossary: could not load ${locale} (${error.message}) -- continuing without it`)
  }

  glossaryCache.set(lang, entries)
  return entries
}

// Only terms that actually occur in the page, longest first so that "Storage
// Node" wins over "Node" when both match, and capped so the glossary cannot
// crowd the page itself out of the input budget.
function selectGlossary(entries, text) {
  const matched = []
  for (const [msgid, msgstr] of entries) {
    if (msgid.length < 4) continue
    if (!/[a-zA-Z]/.test(msgid)) continue
    if (msgid.includes("%")) continue
    if (text.includes(msgid)) matched.push([msgid, msgstr])
  }
  matched.sort((a, b) => b[0].length - a[0].length)
  return matched.slice(0, GLOSSARY_MAX_TERMS)
}

// ------------------------------------------------------------------- the model

const SYSTEM_PROMPT = `You translate technical documentation for FOG Project, an open-source network imaging and endpoint management system. You translate English Markdown into the requested language.

The text is Obsidian-flavored Markdown built by Quartz. Reproduce its structure exactly. Translate ONLY human-readable prose.

Never alter:
- Anything inside fenced code blocks or inline backticks, including comments in code.
- Wikilink targets. In [[target|Text]] translate only Text and leave target untouched. In [[target]] leave the whole link untouched rather than adding a display text.
- Image and file embeds: ![[name.png]] is copied verbatim.
- URLs, file paths, command names, option flags, environment variables.
- Callout markers. >[!note] stays >[!note]; translate only a callout's title and body text.
- HTML tags and attributes.

Formatting rules:
- Keep every wikilink on a single line. A wikilink broken across a newline does not parse and renders as literal text.
- Preserve heading levels, list markers, indentation, table pipes and blank lines.
- Output only the translated Markdown. No fences around it, no preamble, no commentary.`

async function callModel({ token, targetLanguage, glossary, text, isFirstChunk }) {
  const glossaryBlock = glossary.length
    ? "\n\nUse these official FOG interface translations exactly when the corresponding English term appears:\n" +
      glossary.map(([msgid, msgstr]) => `- ${msgid} => ${msgstr}`).join("\n")
    : ""

  const continuation = isFirstChunk
    ? ""
    : "\n\nThis is a continuing section of a longer page. Do not add a title or any introduction."

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Translate the following Markdown into ${targetLanguage}.${glossaryBlock}${continuation}\n\n${text}`,
        },
      ],
    }),
  })

  if (response.status === 429) throw new RateLimited("model request rate limited")
  if (!response.ok) throw new Error(`model request failed: HTTP ${response.status} ${await response.text()}`)

  const payload = await response.json()
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error("model returned no content")

  // Models reach for a fence around Markdown output about one time in twenty,
  // whatever the instructions say.
  return content.replace(/^\s*```(?:markdown|md)?\n/, "").replace(/\n```\s*$/, "").trim()
}

// Small enough that batching it with the body is not worth the risk of the
// model reformatting YAML, and short enough that it costs almost nothing.
async function translateFrontmatterValues({ token, targetLanguage, glossary, values }) {
  const keys = Object.keys(values)
  if (!keys.length) return {}

  const numbered = keys.map((key, i) => `${i + 1}. ${values[key]}`).join("\n")
  const glossaryBlock = glossary.length
    ? "\n\nUse these official FOG interface translations exactly:\n" +
      glossary.map(([msgid, msgstr]) => `- ${msgid} => ${msgstr}`).join("\n")
    : ""

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You translate short documentation page titles and descriptions. Reply with the same numbered list, " +
            "same count, same order, translated. One line per item, no extra text, no quotes added.",
        },
        { role: "user", content: `Translate into ${targetLanguage}:${glossaryBlock}\n\n${numbered}` },
      ],
    }),
  })

  if (response.status === 429) throw new RateLimited("model request rate limited")
  if (!response.ok) throw new Error(`front matter request failed: HTTP ${response.status}`)

  const payload = await response.json()
  const lines = (payload.choices?.[0]?.message?.content ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean)

  if (lines.length !== keys.length) throw new Error(`front matter: expected ${keys.length} lines, got ${lines.length}`)
  return Object.fromEntries(keys.map((key, i) => [key, lines[i]]))
}

// --------------------------------------------------------------------- anchors

// Translating a heading changes the id Quartz generates for it, which breaks
// every link pointing at that heading -- 75 same-page `](#anchor)` links and 40
// `[[page#Heading]]` wikilinks across this repo. Nothing warns about it: the
// link still renders, it just lands at the top of the page instead of at the
// section, so the failure is invisible unless someone clicks it.
//
// The remapping relies on an invariant checkStructure already enforces: a
// translation has the same number of headings as its source, in the same order.
// So the Nth heading of a translation is the translation of the Nth heading of
// its source, and an anchor can be remapped by position without either side
// having to understand the other's language.

// Approximates github-slugger, which is what Quartz builds heading ids with.
function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{Pc}\p{Pd}\s]/gu, "")
    // One hyphen per whitespace character, not per run. github-slugger does not
    // collapse runs, so "Client & Server" -- whose "&" is dropped above, leaving
    // two spaces -- becomes "client--server". Collapsing here would generate an
    // anchor Quartz never emits, which is worse than not rewriting at all.
    .replace(/\s/g, "-")
}

// Ordered, with github-slugger's -1/-2 suffixes for repeated headings.
function headingSlugs(markdown) {
  const seen = new Map()
  return [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => {
    const base = slugifyHeading(match[1])
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count ? `${base}-${count}` : base
  })
}

function headingTexts(markdown) {
  return [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1].trim())
}

function translatedBodyOf(lang, docPath) {
  const filePath = path.join(translationsDir, lang, docPath)
  if (!existsSync(filePath)) return undefined
  return stripBanner(splitFrontmatter(readFileSync(filePath, "utf8")).body.trimStart(), lang)
}

function buildHeadingIndex(lang) {
  const index = new Map()
  for (const docPath of listSourceDocs()) {
    const english = readFileSync(path.join(docsDir, docPath), "utf8")
    const translated = translatedBodyOf(lang, docPath)
    index.set(docPath, {
      english: headingSlugs(english),
      translated: translated ? headingSlugs(translated) : null,
      translatedText: translated ? headingTexts(translated) : null,
    })
  }
  return index
}

// Resolves a page reference the way Quartz's crawl-links does with
// markdownLinkResolution: shortest -- "hosts" means whichever page is hosts.md.
function resolveDocPath(reference, fromDocPath, index) {
  if (!reference) return fromDocPath

  const normalized = reference.replace(/^\.?\//, "").replace(/\.md$/, "")
  const candidates = [...index.keys()]

  const exact = candidates.find((p) => p.replace(/\.md$/, "") === normalized)
  if (exact) return exact

  const byBasename = candidates.filter((p) => path.basename(p, ".md") === path.basename(normalized))
  return byBasename.length === 1 ? byBasename[0] : undefined
}

// Returns the translated heading an English-written anchor should point at, or
// undefined to leave the anchor alone. Leaving it alone is correct in two
// cases: the anchor is already translated (so this is idempotent and safe to
// re-run), and the target page has no translation yet (so the composed tree
// serves it in English and the English anchor is the live one).
function remapAnchor(fragment, targetDoc, index) {
  const entry = index.get(targetDoc)
  if (!entry?.translated) return undefined

  const wanted = slugifyHeading(fragment)
  if (entry.translated.includes(wanted)) return undefined

  const position = entry.english.indexOf(wanted)
  if (position === -1 || position >= entry.translatedText.length) return undefined

  return { slug: entry.translated[position], text: entry.translatedText[position] }
}

function relinkFile(lang, docPath, index) {
  const filePath = path.join(translationsDir, lang, docPath)
  const original = readFileSync(filePath, "utf8")
  let text = original

  // [[page#Heading|Text]] and [[#Heading]] -- Obsidian writes the fragment as
  // heading text, so it is replaced with the translated heading text.
  text = text.replace(
    /(!?\[\[)([^\]\n#|]*)#([^\]\n|]+)(\|[^\]\n]*)?\]\]/g,
    (whole, open, page, fragment, label) => {
      const targetDoc = resolveDocPath(page, docPath, index)
      if (!targetDoc) return whole
      const mapped = remapAnchor(fragment, targetDoc, index)
      return mapped ? `${open}${page}#${mapped.text}${label ?? ""}]]` : whole
    },
  )

  // [text](#anchor) -- same page, and already a slug, so a slug goes back.
  text = text.replace(/\]\(#([^)\s]+)\)/g, (whole, fragment) => {
    const mapped = remapAnchor(fragment, docPath, index)
    return mapped ? `](#${mapped.slug})` : whole
  })

  if (text !== original) writeFileSync(filePath, text)
  return text !== original
}

// Runs over the whole tree rather than per page inside translateDoc, because
// whether an anchor needs rewriting depends on if its *target* page is
// translated yet -- which changes as other pages land.
function relinkLanguage(lang) {
  const index = buildHeadingIndex(lang)
  let changed = 0
  for (const docPath of listTranslatedDocs(lang)) {
    if (index.has(docPath) && relinkFile(lang, docPath, index)) changed++
  }
  console.log(`  relinked heading anchors in ${changed} file(s)`)
}

// Anchors that translation broke.
//
// Only regressions are reported. An anchor that resolves to no heading in the
// English page either is not a heading reference at all (docs/tags.md's
// [[tags#1_6-changes]] points into the generated tag listing, not a heading) or
// is already broken upstream -- neither is this pipeline's business, and
// reporting them would bury the ones it did cause.
function danglingAnchors(lang, docPath, index) {
  const text = readFileSync(path.join(translationsDir, lang, docPath), "utf8")
  const problems = []

  const broken = (targetDoc, fragment) => {
    const entry = index.get(targetDoc)
    // No translation of the target means it is served in English, anchors and
    // all, so an anchor written in English is the correct one.
    if (!entry?.translated) return false

    const slug = slugifyHeading(fragment)
    if (entry.translated.includes(slug)) return false
    return entry.english.includes(slug)
  }

  for (const [, page, fragment] of text.matchAll(/!?\[\[([^\]\n#|]*)#([^\]\n|]+)(?:\|[^\]\n]*)?\]\]/g)) {
    const targetDoc = resolveDocPath(page, docPath, index)
    if (targetDoc && broken(targetDoc, fragment)) {
      problems.push(`wikilink anchor "${page}#${fragment}" still points at the English heading`)
    }
  }

  for (const [, fragment] of text.matchAll(/\]\(#([^)\s]+)\)/g)) {
    if (broken(docPath, fragment)) {
      problems.push(`anchor "#${fragment}" still points at the English heading`)
    }
  }

  return problems
}

// ------------------------------------------------------------------- verifying

// [^\]\n] rather than [^\]] on purpose: a wikilink broken across a newline is
// not a wikilink as far as Quartz is concerned -- it renders as literal
// [[page|Text]] on the page with no build warning -- so this must not match one
// either, or the wrapped-link failure sails through the comparison below.
//
// The #fragment is dropped because it is a heading reference, and headings do
// get translated -- relinkLanguage rewrites those deliberately. What must never
// change is the page part, which is a slug. Fragments are checked separately by
// danglingAnchors, which can see the whole tree and knows what a valid heading
// reference looks like after translation.
function wikilinkTargets(text) {
  return [...text.matchAll(/!?\[\[([^\]\n]+)\]\]/g)]
    .map((m) => m[1].split("|")[0].split("#")[0].trim())
    .sort()
}

function codeBlocks(text) {
  return [...text.matchAll(/```[\s\S]*?```/g)].map((m) => m[0])
}

// Same-page anchors are excluded for the same reason wikilink fragments are:
// they point at headings, which get translated, so relinkLanguage rewrites them
// on purpose. danglingAnchors checks them instead.
function markdownLinkTargets(text) {
  return [...text.matchAll(/\]\(([^)\s]+)/g)].map((m) => m[1]).filter((t) => !t.startsWith("#")).sort()
}

const sameList = (a, b) => a.length === b.length && a.every((value, i) => value === b[i])

// Everything checked here is something Quartz will happily build and serve
// wrong. A dropped wikilink target renders as literal [[text]] with no warning;
// an "improved" code block ships a command that does not work.
function checkStructure(source, translated) {
  const problems = []

  const sourceLinks = wikilinkTargets(source)
  const translatedLinks = wikilinkTargets(translated)
  if (!sameList(sourceLinks, translatedLinks)) {
    problems.push(`wikilink targets differ (source ${sourceLinks.length}, translation ${translatedLinks.length})`)
  }

  const sourceCode = codeBlocks(source)
  const translatedCode = codeBlocks(translated)
  if (!sameList(sourceCode, translatedCode)) {
    problems.push(`fenced code blocks differ (source ${sourceCode.length}, translation ${translatedCode.length})`)
  }

  const sourceUrls = markdownLinkTargets(source)
  const translatedUrls = markdownLinkTargets(translated)
  if (!sameList(sourceUrls, translatedUrls)) {
    problems.push(`markdown link targets differ (source ${sourceUrls.length}, translation ${translatedUrls.length})`)
  }

  const headingCount = (text) => (text.match(/^#{1,6} /gm) ?? []).length
  if (headingCount(source) !== headingCount(translated)) {
    problems.push(`heading count differs (source ${headingCount(source)}, translation ${headingCount(translated)})`)
  }

  // A wikilink the model wrapped to respect a line width is the failure this
  // whole check exists for, and it survives the target comparison above only
  // because the regex would not have matched it at all -- so look for the
  // opener directly.
  const unclosed = (translated.match(/\[\[/g) ?? []).length !== translatedLinks.length
  if (unclosed) problems.push("a wikilink appears to be unclosed or broken across lines")

  return problems
}

// --------------------------------------------------------------------- banner

function englishUrlFor(docPath) {
  let slug = docPath.replace(/\.md$/, "")
  if (slug === "index") slug = ""
  else slug = slug.replace(/\/index$/, "")
  return slug ? `${languages.englishBaseUrl}/${slug}` : languages.englishBaseUrl
}

function banner(lang, docPath) {
  const { title, body } = languages.languages[lang].banner
  return `>[!warning] ${title}\n>${body.replace("{url}", englishUrlFor(docPath))}\n\n`
}

// The inverse, for reading a translated page back. Needed because the banner
// contributes a Markdown link that the English source does not have, which
// would otherwise register as a structural difference.
function stripBanner(body, lang) {
  const { title } = languages.languages[lang].banner
  if (!body.startsWith(`>[!warning] ${title}`)) return body
  const blank = body.indexOf("\n\n")
  return blank === -1 ? "" : body.slice(blank + 2)
}

// ----------------------------------------------------------------- translating

async function translateDoc({ lang, docPath, token, glossaryEntries }) {
  const source = readFileSync(path.join(docsDir, docPath), "utf8")
  const { frontmatter, body } = splitFrontmatter(source)
  const targetLanguage = languages.languages[lang].name
  const glossary = selectGlossary(glossaryEntries, source)

  const chunks = chunkBody(body)
  const translatedChunks = []
  for (const [i, chunk] of chunks.entries()) {
    translatedChunks.push(
      await callModel({ token, targetLanguage, glossary, text: chunk, isFirstChunk: i === 0 }),
    )
  }
  // The source chunks concatenate exactly, but the model returns each one
  // trimmed, so the blank line between sections has to be put back here.
  const translatedBody = translatedChunks.join("\n\n")

  const problems = checkStructure(body, translatedBody)
  if (problems.length) return { requests: chunks.length, problems }

  // Rebuilt from the English front matter with two values swapped, so
  // context_id, tags, aliases, key order and formatting are unchanged by
  // construction rather than by trusting the model.
  let newFrontmatter = frontmatter
  let requests = chunks.length
  if (frontmatter) {
    const values = {}
    for (const key of ["title", "description"]) {
      const value = getScalar(frontmatter, key)
      if (value) values[key] = value
    }
    if (Object.keys(values).length) {
      const translatedValues = await translateFrontmatterValues({ token, targetLanguage, glossary, values })
      requests += 1
      for (const [key, value] of Object.entries(translatedValues)) {
        newFrontmatter = setScalar(newFrontmatter, key, value)
      }
    }
  }

  const content = `${newFrontmatter}${banner(lang, docPath)}${translatedBody.trimStart()}\n`
  const outPath = path.join(translationsDir, lang, docPath)
  mkdirSync(path.dirname(outPath), { recursive: true })
  writeFileSync(outPath, content)

  return { requests, problems: [] }
}

// ------------------------------------------------------------------------ main

function pruneOrphans(lang, sourceDocs, state) {
  const sourceSet = new Set(sourceDocs)
  let removed = 0
  for (const docPath of listTranslatedDocs(lang)) {
    if (sourceSet.has(docPath)) continue
    rmSync(path.join(translationsDir, lang, docPath))
    delete state.entries[docPath]
    console.log(`  removed ${docPath} (no longer in docs/)`)
    removed++
  }
  for (const docPath of Object.keys(state.entries)) {
    if (!sourceSet.has(docPath)) delete state.entries[docPath]
  }
  return removed
}

// Re-checks every translated page on disk against its English source. Run it
// after seeding a language by hand and after any human edit to a translation --
// both bypass the check that translateDoc does inline, and the failure mode
// (a wikilink that renders as literal text) is invisible in the build.
function verifyLanguage(lang) {
  const sourceDocs = new Set(listSourceDocs())
  const headingIndex = buildHeadingIndex(lang)
  let checked = 0
  let bad = 0

  for (const docPath of listTranslatedDocs(lang)) {
    if (!sourceDocs.has(docPath)) {
      console.warn(`  ORPHAN  ${docPath} (no such page in docs/)`)
      bad++
      continue
    }

    const source = splitFrontmatter(readFileSync(path.join(docsDir, docPath), "utf8"))
    const translated = splitFrontmatter(readFileSync(path.join(translationsDir, lang, docPath), "utf8"))

    const problems = checkStructure(source.body, stripBanner(translated.body.trimStart(), lang))
    problems.push(...danglingAnchors(lang, docPath, headingIndex))

    // The banner is the reader's only signal that a page is machine output; a
    // page missing it looks like a reviewed human translation.
    if (!translated.body.trimStart().startsWith(`>[!warning] ${languages.languages[lang].banner.title}`)) {
      problems.push("missing the machine-translation banner")
    }
    // Front matter is rebuilt from the English original rather than translated,
    // so a mismatch here means someone edited it by hand.
    for (const key of ["context_id"]) {
      if (getScalar(source.frontmatter, key) !== getScalar(translated.frontmatter, key)) {
        problems.push(`${key} does not match the English page`)
      }
    }

    checked++
    if (problems.length) {
      console.warn(`  FAIL    ${docPath}: ${problems.join("; ")}`)
      bad++
    }
  }

  console.log(`  checked ${checked} page(s); ${bad ? `${bad} with problems` : "all consistent with docs/"}`)
  if (bad) process.exitCode = 1
}

async function runLanguage({ lang, budget, options }) {
  console.log(`\n${lang} (${languages.languages[lang].name})`)

  if (options.verify) {
    verifyLanguage(lang)
    return 0
  }

  if (options.relink) {
    relinkLanguage(lang)
    return 0
  }

  const sourceDocs = listSourceDocs()
  const state = readState(lang)

  if (options.reindex) {
    const translated = new Set(listTranslatedDocs(lang))
    let indexed = 0
    for (const docPath of sourceDocs) {
      if (!translated.has(docPath)) continue
      state.entries[docPath] = {
        sourceHash: sha256(readFileSync(path.join(docsDir, docPath), "utf8")),
        translatedAt: new Date().toISOString(),
      }
      indexed++
    }
    pruneOrphans(lang, sourceDocs, state)
    writeState(lang, state)
    console.log(`  reindexed ${indexed} file(s); ${sourceDocs.length - indexed} still untranslated`)
    return 0
  }

  pruneOrphans(lang, sourceDocs, state)

  const translatedOnDisk = new Set(listTranslatedDocs(lang))
  let stale = sourceDocs.filter((docPath) => {
    const entry = state.entries[docPath]
    if (!entry || !translatedOnDisk.has(docPath)) return true
    return entry.sourceHash !== sha256(readFileSync(path.join(docsDir, docPath), "utf8"))
  })

  // An explicit --file is a request, not a filter: retranslate it whether or
  // not its hash moved. This is how you check a prompt or glossary change
  // against a page you already have output for.
  if (options.file) {
    if (!sourceDocs.includes(options.file)) {
      console.error(`  no such page: docs/${options.file}`)
      process.exitCode = 1
      return 0
    }
    stale = [options.file]
  }

  // Never-translated pages first, then the ones stale longest. A run that hits
  // the rate limit therefore always makes progress on the worst-off pages, and
  // nothing can starve behind a page that keeps being edited.
  stale.sort((a, b) => {
    const aTime = state.entries[a]?.translatedAt ?? ""
    const bTime = state.entries[b]?.translatedAt ?? ""
    return aTime.localeCompare(bTime)
  })

  if (!stale.length) {
    console.log("  up to date")
    return 0
  }
  console.log(`  ${stale.length} page(s) need translating`)

  if (options.dryRun) {
    for (const docPath of stale) console.log(`    would translate ${docPath}`)
    return 0
  }

  const token = process.env.GITHUB_TOKEN ?? process.env.MODELS_TOKEN
  if (!token) {
    console.error("  GITHUB_TOKEN (or MODELS_TOKEN) is not set -- cannot reach GitHub Models")
    process.exitCode = 1
    return 0
  }

  const glossaryEntries = await loadGlossary(lang)

  let spent = 0
  let failures = 0
  let processed = 0
  for (const docPath of stale) {
    if (budget.remaining - spent <= 0) {
      console.log(`  request budget exhausted; ${stale.length - processed} page(s) left for the next run`)
      break
    }
    processed++
    try {
      const { requests, problems } = await translateDoc({ lang, docPath, token, glossaryEntries })
      spent += requests
      if (problems.length) {
        failures++
        console.warn(`  SKIPPED ${docPath}: ${problems.join("; ")}`)
        continue
      }
      state.entries[docPath] = {
        sourceHash: sha256(readFileSync(path.join(docsDir, docPath), "utf8")),
        translatedAt: new Date().toISOString(),
      }
      writeState(lang, state)
      console.log(`  translated ${docPath} (${requests} request(s))`)
    } catch (error) {
      if (error instanceof RateLimited) {
        console.log("  rate limited; stopping here and leaving the rest for the nightly run")
        break
      }
      failures++
      console.warn(`  FAILED ${docPath}: ${error.message}`)
    }
  }

  writeState(lang, state)

  // Anchors have to be resolved against the finished tree: a page that landed
  // in this run can be the target of an anchor in a page translated weeks ago.
  relinkLanguage(lang)

  if (failures) {
    // Loud but not fatal: one bad page should not stop the other languages, and
    // the page stays stale so the next run retries it.
    console.warn(`  ${failures} page(s) skipped or failed`)
  }
  return spent
}

async function main() {
  const args = process.argv.slice(2)
  const positional = args.filter((a) => !a.startsWith("-"))
  const flag = (name) => args.includes(name)
  const value = (name) => {
    const i = args.indexOf(name)
    return i === -1 ? undefined : args[i + 1]
  }

  const target = positional[0]
  if (!target) {
    console.error(
      "usage: translate.mjs <language|all> [--limit N] [--dry-run] [--verify] [--relink] [--reindex] [--file path]",
    )
    process.exit(1)
  }

  const targets = target === "all" ? Object.keys(languages.languages) : [target]
  for (const lang of targets) {
    if (!languages.languages[lang]) {
      console.error(`unknown language "${lang}". Known: ${Object.keys(languages.languages).join(", ")}`)
      process.exit(1)
    }
  }

  const options = {
    dryRun: flag("--dry-run"),
    reindex: flag("--reindex"),
    verify: flag("--verify"),
    relink: flag("--relink"),
    file: value("--file"),
  }
  // Shared across languages on purpose: the rate limit is per account, not per
  // language, so five languages each taking the full budget would blow it.
  const budget = { remaining: Number(value("--limit") ?? DEFAULT_LIMIT) }

  for (const lang of targets) {
    budget.remaining -= await runLanguage({ lang, budget, options })
  }
}

// Guarded so the pure helpers above (parsePo, chunkBody, checkStructure,
// splitFrontmatter) can be imported and exercised without running a translation.
if (import.meta.url === pathToFileURL(process.argv[1]).href) await main()

export {
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
}
