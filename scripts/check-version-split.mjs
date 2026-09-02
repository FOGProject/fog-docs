#!/usr/bin/env node
// Checks the invariants of the FOG 1.5 / 1.6 documentation split. See
// VERSIONING.md for what the split is and why it is shaped this way.
//
// Why this exists: every failure below is silent. The Quartz build does not
// warn about any of them, and each one produces a page that renders fine and
// sends the reader somewhere wrong.
//
//   1. An unversioned link to a forked page from INSIDE a version tree. There
//      is a chooser page at that path, so the link resolves -- to the chooser,
//      dropping any #anchor. A 1.6 page linking its own "#Security" heading
//      lands the reader on the chooser instead. The original split left 209 of
//      these, all of them invisible to the build.
//   2. The two nav-order tables drifting apart. Reading order is encoded in
//      both quartz.config.yaml (Explorer sortFn) and prev-next-nav. The sortFn
//      is a string inside YAML, so they cannot share a module -- the
//      duplication is structural. When they disagree the sidebar and the
//      Previous/Next links tell the reader two different stories.
//   3. A forked topic with no chooser page, which is invisible in the topic
//      nav -- the bug the choosers exist to fix.
//   4. A chooser claiming the unsuffixed context_id or an alias. The latest
//      version's page must own those so /{context_id} always resolves to the
//      newest docs.
//
// Usage:
//   node scripts/check-version-split.mjs           # report, exit 1 on any failure
//   node scripts/check-version-split.mjs --docs docs --quartz quartz
//
// Reads source markdown only -- no build required.

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const DOCS = flag("--docs", "docs")
const QUARTZ = flag("--quartz", "quartz")

if (!existsSync(DOCS)) {
  console.error(`No docs directory at ${DOCS}.`)
  process.exit(2)
}

const VERSIONS = ["1.5", "1.6"]
const LATEST = "1.6"

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith(".md")) out.push(p)
  }
  return out
}

const slugOf = (file) => relative(DOCS, file).split("\\").join("/").replace(/\.md$/, "")
const read = (p) => readFileSync(p, "utf8")

// Minimal front-matter reader: scalars and "- " lists, quotes stripped. Enough
// for the keys this script checks, and avoids a yaml dependency.
const frontmatter = (src) => {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  const out = {}
  let key = null
  for (const raw of m[1].split(/\r?\n/)) {
    const kv = raw.match(/^([A-Za-z_]+):\s*(.*)$/)
    if (kv) {
      key = kv[1]
      const v = kv[2].trim().replace(/^"(.*)"$/, "$1")
      out[key] = v === "" ? [] : v
    } else if (key && /^\s*-\s+/.test(raw)) {
      if (!Array.isArray(out[key])) out[key] = []
      out[key].push(
        raw
          .replace(/^\s*-\s+/, "")
          .trim()
          .replace(/^"(.*)"$/, "$1"),
      )
    }
  }
  return out
}

const asList = (v) => (Array.isArray(v) ? v : v ? [v] : [])

// --------------------------------------------------------- the forked topics

const inVersion = {}
for (const v of VERSIONS) {
  inVersion[v] = new Set(
    walk(join(DOCS, v))
      .map(slugOf)
      .filter((s) => !s.endsWith("/index") && s !== `${v}/index`)
      .map((s) => s.slice(v.length + 1)),
  )
}
// A topic is forked when a page for it exists under every version tree.
const forked = [...inVersion[VERSIONS[0]]]
  .filter((p) => VERSIONS.every((v) => inVersion[v].has(p)))
  .sort()
const versionOnly = {}
for (const v of VERSIONS) {
  versionOnly[v] = [...inVersion[v]].filter((p) => !forked.includes(p)).sort()
}
const byBasename = new Map() // basename -> full topic path
for (const p of forked) byBasename.set(p.split("/").pop(), p)

const failures = []
const note = (kind, msg) => failures.push({ kind, msg })

// ---- 1. unversioned links to forked pages inside the version trees --------

const LINK = /\[\[([^\]]*?)\]\]/g
for (const v of VERSIONS) {
  for (const file of walk(join(DOCS, v))) {
    read(file)
      .split(/\r?\n/)
      .forEach((line, i) => {
        for (const m of line.matchAll(LINK)) {
          const target = m[1].split("|")[0].replace(/\\$/, "").split("#")[0].trim()
          if (!target) continue
          if (VERSIONS.some((x) => target.startsWith(x + "/"))) continue
          const topic = byBasename.get(target.split("/").pop())
          if (!topic) continue
          note(
            "unversioned-link",
            `${slugOf(file)}:${i + 1}  [[${m[1]}]]  ->  should point at ${v}/${topic}`,
          )
        }
      })
  }
}

// ---- 2. the two nav-order tables agree -----------------------------------

const cfgPath = join(QUARTZ, "quartz.config.yaml")
const pnnPath = join(QUARTZ, "local-plugins/prev-next-nav/dist/components/index.js")

if (!existsSync(cfgPath) || !existsSync(pnnPath)) {
  note("nav-tables", "could not find quartz.config.yaml and/or prev-next-nav")
} else {
  const cfg = read(cfgPath)
  const pnn = read(pnnPath)

  // Pull the JS literal that follows a marker, matching brackets so the end of
  // the literal is found rather than guessed from surrounding text. String
  // contents are skipped so a bracket inside a slug could never end it early.
  const literalAfter = (src, marker) => {
    const at = src.indexOf(marker)
    if (at < 0) return null
    const open = src.slice(at).search(/[[{]/)
    if (open < 0) return null
    const start = at + open
    const pairs = { "[": "]", "{": "}" }
    const stack = []
    let quote = null
    for (let i = start; i < src.length; i++) {
      const c = src[i]
      if (quote) {
        if (c === "\\") i++
        else if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c
        continue
      }
      if (pairs[c]) stack.push(pairs[c])
      else if (c === "]" || c === "}") {
        if (stack.pop() !== c) return null
        if (!stack.length) {
          try {
            return Function(`"use strict";return (${src.slice(start, i + 1)})`)()
          } catch {
            return null
          }
        }
      }
    }
    return null
  }

  const cfgTop = literalAfter(cfg, "const topOrder = ")
  const pnnTop = literalAfter(pnn, "const TOP_ORDER = ")
  const cfgOrder = literalAfter(cfg, "const explicitOrder = ")
  const pnnOrder = literalAfter(pnn, "const EXPLICIT_ORDER = ")

  // The version trees are hidden from the sidebar by the Explorer's filterFn.
  // prev-next-nav must hide them too, or "Next" walks into a tree the reader
  // cannot see in the nav.
  const blockScalar = (key) => {
    const at = cfg.indexOf(`${key}: |`)
    if (at === -1) return null
    const out = []
    for (const line of cfg.slice(at + `${key}: |`.length).split("\n")) {
      if (line.trim() === "") {
        out.push("")
        continue
      }
      if (line.match(/^ */)[0].length < 8) break
      out.push(line.slice(8))
    }
    try {
      return Function(`"use strict";return (${out.join("\n")})`)()
    } catch {
      return null
    }
  }
  const explorerFilter = blockScalar("filterFn")
  const pnnTrees = literalAfter(pnn, "const VERSION_TREES = ")

  if (explorerFilter) {
    const hiddenByExplorer = VERSIONS.filter(
      (v) => !explorerFilter({ slugSegment: v, slugSegments: [v], isFolder: true, data: null, children: [] }),
    )
    const hiddenByPrevNext = Array.isArray(pnnTrees) ? pnnTrees : []
    for (const v of hiddenByExplorer) {
      if (!hiddenByPrevNext.includes(v)) {
        note(
          "nav-tables",
          `the Explorer hides the ${v} tree from the sidebar, but prev-next-nav does not exclude it (VERSION_TREES)`,
        )
      }
    }
    for (const v of hiddenByPrevNext) {
      if (!hiddenByExplorer.includes(v)) {
        note(
          "nav-tables",
          `prev-next-nav excludes the ${v} tree, but the Explorer still shows it in the sidebar (filterFn)`,
        )
      }
    }
    if (explorerFilter({ slugSegment: "tags", slugSegments: ["tags"], isFolder: true, data: null, children: [] })) {
      note(
        "nav-tables",
        'the Explorer filterFn no longer excludes "tags" -- supplying a filterFn replaces the plugin default, so that exclusion has to be repeated',
      )
    }
  }

  if (!cfgTop || !pnnTop || !cfgOrder || !pnnOrder) {
    note(
      "nav-tables",
      "could not parse both nav-order tables -- the marker strings in this script may be stale",
    )
  } else {
    if (JSON.stringify(cfgTop) !== JSON.stringify(pnnTop)) {
      note(
        "nav-tables",
        `topOrder differs:\n    explorer:  ${JSON.stringify(cfgTop)}\n    prev-next: ${JSON.stringify(pnnTop)}`,
      )
    }
    const keys = [...new Set([...Object.keys(cfgOrder), ...Object.keys(pnnOrder)])].sort()
    for (const k of keys) {
      const a = cfgOrder[k]
      const b = pnnOrder[k]
      if (!a) note("nav-tables", `"${k}" is only in prev-next-nav`)
      else if (!b) note("nav-tables", `"${k}" is only in the Explorer sortFn`)
      else if (JSON.stringify(a) !== JSON.stringify(b))
        note("nav-tables", `"${k}" is ordered differently in the two tables`)
    }
  }
}

// ---- 3 & 4. a chooser exists, and defers to the latest version -----------

for (const topic of forked) {
  const chooserPath = join(DOCS, topic + ".md")
  if (!existsSync(chooserPath)) {
    note("missing-chooser", `${topic} is forked but has no chooser at docs/${topic}.md`)
    continue
  }
  const body = read(chooserPath)
  const fm = frontmatter(body)
  const latest = frontmatter(read(join(DOCS, LATEST, topic + ".md")))

  if (!asList(fm.tags).includes("version-chooser")) {
    note("chooser-frontmatter", `docs/${topic}.md is missing the "version-chooser" tag`)
  }
  if (fm.context_id && latest.context_id && fm.context_id === latest.context_id) {
    note(
      "chooser-frontmatter",
      `docs/${topic}.md claims context_id "${fm.context_id}", which the ${LATEST} page must own`,
    )
  }
  const aliases = asList(fm.aliases)
  if (aliases.length) {
    note(
      "chooser-frontmatter",
      `docs/${topic}.md declares aliases (${aliases.join(", ")}); a chooser must declare none`,
    )
  }
  for (const v of VERSIONS) {
    if (!body.includes(`[[${v}/${topic}`)) {
      note("chooser-frontmatter", `docs/${topic}.md does not link to ${v}/${topic}`)
    }
  }
}

// ---- report --------------------------------------------------------------

const LABEL = {
  "unversioned-link": "Unversioned links to a forked page from inside a version tree",
  "nav-tables": "Nav-order tables disagree (Explorer sortFn vs prev-next-nav)",
  "missing-chooser": "Forked topics with no chooser page",
  "chooser-frontmatter": "Chooser front-matter problems",
}

console.log(`${forked.length} forked topic(s) across ${VERSIONS.join(" / ")}`)
for (const v of VERSIONS) {
  if (versionOnly[v].length) {
    console.log(`  ${v}-only (not forked, no chooser expected): ${versionOnly[v].join(", ")}`)
  }
}

for (const kind of Object.keys(LABEL)) {
  const rows = failures.filter((f) => f.kind === kind)
  if (!rows.length) continue
  console.log(`\n${LABEL[kind]} (${rows.length})`)
  for (const r of rows) console.log(`  ${r.msg}`)
}

if (!failures.length) {
  console.log("\nVersion split is consistent.")
} else {
  console.log(`\n${failures.length} problem(s). See VERSIONING.md.`)
}
process.exit(failures.length ? 1 : 0)
