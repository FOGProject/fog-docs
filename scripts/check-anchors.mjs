#!/usr/bin/env node
// Finds -- and where it is safe to, fixes -- internal links whose #fragment
// does not resolve on the page the link actually lands on.
//
// Why this exists: nothing else catches it. The Quartz build does not warn, and
// a broken anchor is not a broken link -- it renders, it is clickable, and it
// silently drops the reader at the top of the right page instead of at the
// section the sentence promised. The site has needed a hand sweep for this twice
// (29 broken links in one, all of them invisible to the build).
//
// Two causes account for nearly all of them, and both are mechanical:
//
//   1. A bare [[page#anchor]] can resolve to the root /{context_id} permalink
//      stub rather than to the page itself. That stub is a meta refresh to a URL
//      with NO fragment, so the anchor is dropped in transit -- the reader lands
//      on the right page, at the top, every time. Path-qualifying the target
//      ([[kb/reference/pki-zones#leaf-renewal|...]]) always resolves to the real
//      page. This was 22 of the 29.
//
//   2. A markdown link carrying a .md suffix -- [text](roles.md#anchor) --
//      resolves against a slug ending in .md, which does not exist, so it lands
//      on nothing at all. This was 5 of the 29.
//
// Both depend only on the link's TARGET PATH, so both can be rewritten without
// interpreting the fragment. That matters, and is the whole reason the fixer is
// scoped the way it is -- see "What --fix will not touch" below.
//
// Usage:
//   node scripts/check-anchors.mjs              # report, exit 1 if any broken
//   node scripts/check-anchors.mjs --fix        # rewrite what is safe, report the rest
//   node scripts/check-anchors.mjs --build-dir quartz/public --docs docs
//
// Needs a build to read: run `npm run docs:build` in quartz/ first. It reads the
// built HTML because that is the only place the truth lives -- the ids Quartz
// actually emitted, and where each link actually points after redirects.
//
// After --fix, REBUILD and run again. The fixer edits source markdown; only a
// rebuild proves the result resolves.

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs"
import { join, relative, dirname, posix } from "node:path"

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i === -1 ? fallback : args[i + 1]
}
const FIX = args.includes("--fix")
const BUILD = flag("--build-dir", "quartz/public")
const DOCS = flag("--docs", "docs")

if (!existsSync(BUILD)) {
  console.error(`No build at ${BUILD}. Run "npm run docs:build" in quartz/ first.`)
  process.exit(2)
}

// ---------------------------------------------------------------- build side

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

const htmlFiles = walk(BUILD).filter((p) => p.endsWith(".html"))
const bodyCache = new Map()
const read = (p) => {
  if (!bodyCache.has(p)) bodyCache.set(p, readFileSync(p, "utf8"))
  return bodyCache.get(p)
}

const unescapeHtml = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

const REFRESH = /<meta[^>]+http-equiv="refresh"[^>]*content="[^"]*?url=([^";'>]+)/i

// A URL path -> the file a host would serve for it, or null.
const toFile = (urlPath) => {
  const rel = decodeURIComponent(urlPath.replace(/^\//, ""))
  const base = join(BUILD, rel)
  for (const c of [base, base + ".html", join(base, "index.html")]) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

// Follow meta-refresh stubs. Returns {file, redirected}.
const resolvePage = (urlPath, hops = 0) => {
  const file = toFile(urlPath)
  if (!file || hops > 5) return { file, redirected: hops > 0 }
  const m = REFRESH.exec(read(file))
  if (!m) return { file, redirected: hops > 0 }
  const target = unescapeHtml(m[1]).trim()
  const next = posix.resolve(posix.dirname("/" + urlPath.replace(/^\//, "")), target)
  return resolvePage(next.split("#")[0].split("?")[0], hops + 1)
}

const idsOf = (file) => {
  const out = new Set()
  for (const m of read(file).matchAll(/\sid="([^"]+)"/g)) out.add(unescapeHtml(m[1]))
  return out
}

// Built page -> its source markdown, by mirroring the output tree.
const sourceFor = (file) => {
  let rel = relative(BUILD, file).split("\\").join("/")
  rel = rel.replace(/\.html$/, "")
  for (const cand of [`${rel}.md`, `${rel}/index.md`]) {
    const p = join(DOCS, cand)
    if (existsSync(p)) return p
  }
  return null
}

// --------------------------------------------------------------- classify

const findings = []

for (const file of htmlFiles) {
  const body = read(file)
  // A permalink stub has no prose of its own; its links are furniture.
  if (REFRESH.test(body)) continue
  const selfUrl = "/" + relative(BUILD, file).split("\\").join("/")

  for (const m of body.matchAll(/href="([^"]+)"/g)) {
    const href = unescapeHtml(m[1])
    if (!href.includes("#")) continue
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) continue
    const [pathPart, ...rest] = href.split("#")
    const frag = decodeURIComponent(rest.join("#"))
    if (!frag) continue

    const targetUrl =
      pathPart === ""
        ? selfUrl
        : posix.resolve(posix.dirname(selfUrl), pathPart).split("?")[0]

    // The page the href lands on FIRST, before any redirect. This is the one
    // that decides whether the fragment survives at all, and getting this wrong
    // is easy: resolve the redirect first and a stub-dropped anchor looks fine,
    // because the id really is present on the page the stub forwards to. The
    // browser never gets there with the fragment still attached.
    const immediate = toFile(targetUrl)
    if (!immediate) {
      findings.push({ sourcePage: selfUrl, source: sourceFor(file), href, pathPart, frag, kind: "missing-target", dest: null })
      continue
    }

    const isStub = REFRESH.test(read(immediate))
    const { file: dest } = resolvePage(targetUrl)
    const landsOnId = dest ? idsOf(dest).has(frag) : false

    if (isStub) {
      // Broken regardless of whether the id exists further down: the stub's
      // refresh URL carries no fragment, so the reader arrives at the top.
      findings.push({
        sourcePage: selfUrl,
        source: sourceFor(file),
        href,
        pathPart,
        frag,
        // Qualifying the path is enough only if the fragment is otherwise good.
        kind: landsOnId ? "stub-drops-fragment" : "stub-and-bad-fragment",
        dest,
      })
      continue
    }

    if (landsOnId) continue

    findings.push({ sourcePage: selfUrl, source: sourceFor(file), href, pathPart, frag, kind: "no-such-id", dest })
  }
}

// --------------------------------------------------------------- the fixer
//
// What --fix will not touch, on purpose.
//
// It only ever rewrites a link's TARGET PATH, never its fragment. Rewriting a
// fragment would mean deciding which heading the author meant, and the cases
// that need it are exactly the ones where that is a judgement call: a heading
// that was renamed ("Client Side Tasks" -> "Perform Full Registration and
// Inventory") has no mechanical successor, and guessing by similarity would
// silently repoint the link at the wrong section. That is WORSE than leaving it
// broken -- a broken anchor lands the reader at the top of the right page and
// they scroll; a confidently wrong one sends them somewhere else entirely.
//
// There is a second, harder reason not to try. Mapping an emitted #fragment back
// to the source text that produced it needs Quartz's own slugifier, because a
// source link may carry raw heading text ([[page#How UEFI clients boot]]) that
// only becomes a slug at build time. Reimplementing that rule reproduces 1064 of
// this site's 1085 heading ids -- close, and not close enough: the 21 misses are
// underscores in identifiers, HTML entities and punctuation inside code spans.
// A fixer that is 98% right about which text to edit is a fixer that eventually
// edits the wrong link. So the fragment classes are reported, with the candidate
// headings listed, and a human picks.

const fixable = new Set(["stub-drops-fragment", "missing-target"])
const edits = new Map() // source path -> [{from, to}]
let fixedCount = 0

const targetSlugFor = (dest) =>
  dest ? relative(BUILD, dest).split("\\").join("/").replace(/(\/index)?\.html$/, "") : null

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Fresh regex per use. A global regex carries lastIndex between calls, so
// testing one and then reusing it to replace can silently skip the first match.
const has = (body, pattern) => new RegExp(pattern).test(body)
const swap = (body, pattern, to) => body.replace(new RegExp(pattern, "g"), to)

for (const f of findings) {
  if (!FIX || !f.source || !fixable.has(f.kind)) continue

  const src = readFileSync(f.source, "utf8")
  let pattern = null
  let to = null

  if (f.kind === "stub-drops-fragment") {
    // The bare target hits a stub. Qualify it with the real page's slug path.
    // Matched on the target text as it appears in source -- a wikilink target is
    // a filename or slug and is NOT slugified further, so unlike the fragment
    // this needs no guessing.
    const bare = decodeURIComponent(f.pathPart.replace(/^.*\//, ""))
    const full = targetSlugFor(f.dest)
    if (!full || !bare || bare === full) continue

    // Two source forms reach this state.
    //
    // A wikilink, [[api#authentication]] -- anchored on "[[bare#" so it only
    // ever touches a link that carries a fragment. A fragmentless link to the
    // same stub redirects fine and is left alone on purpose: the permalink is a
    // documented feature, not a defect.
    const wiki = `\\[\\[${escapeRe(bare)}(#)`
    if (has(src, wiki)) {
      pattern = wiki
      to = `[[${full}$1`
    } else {
      // Or a markdown link, [Authentication](api.md#authentication). Quartz
      // strips the .md and resolves it to the same stub, so it presents here
      // identically -- and the fix is the same qualification, expressed as the
      // wikilink the rest of the repo uses. The fragment is copied across
      // verbatim from the built href, which is the slugified form and therefore
      // exactly what resolves.
      const md = `\\[([^\\]]*)\\]\\(${escapeRe(bare)}(?:\\.md)?#${escapeRe(f.frag)}\\)`
      if (!has(src, md)) continue
      pattern = md
      to = `[[${full}#${f.frag}|$1]]`
    }
  } else if (f.kind === "missing-target" && /\.md$/i.test(f.pathPart)) {
    // [text](path.md#anchor) -> [[page#anchor|text]]. The .md suffix is the
    // whole defect; wikilinks are what the rest of the repo uses.
    const page = f.pathPart.replace(/\.md$/i, "").replace(/^.*\//, "")
    pattern = `\\[([^\\]]*)\\]\\(${escapeRe(f.pathPart)}#${escapeRe(f.frag)}\\)`
    to = `[[${page}#${f.frag}|$1]]`
  }

  if (!pattern || !has(src, pattern)) continue
  if (!edits.has(f.source)) edits.set(f.source, [])
  edits.get(f.source).push({ pattern, to })
  f.fixed = true
  fixedCount++
}

for (const [file, list] of edits) {
  let body = readFileSync(file, "utf8")
  // Deduped: several broken links on one page can share a target, and each
  // finding would otherwise queue the same global replace again.
  const seen = new Set()
  for (const { pattern, to } of list) {
    const key = pattern + " " + to
    if (seen.has(key)) continue
    seen.add(key)
    body = swap(body, pattern, to)
  }
  writeFileSync(file, body)
}

// --------------------------------------------------------------- report

const LABEL = {
  "stub-drops-fragment": "fragment dropped by a permalink stub (fixable: qualify the path)",
  "stub-and-bad-fragment":
    "goes through a permalink stub AND names no real heading (needs a human)",
  "missing-target": "target page does not exist",
  "no-such-id": "no such id on the target page (needs a human: which heading?)",
}

const groups = new Map()
for (const f of findings) {
  if (!groups.has(f.kind)) groups.set(f.kind, [])
  groups.get(f.kind).push(f)
}

for (const kind of ["stub-drops-fragment", "stub-and-bad-fragment", "missing-target", "no-such-id"]) {
  const rows = groups.get(kind) ?? []
  if (!rows.length) continue
  console.log(`\n${LABEL[kind]} (${rows.length})`)
  for (const f of rows.sort((a, b) => a.sourcePage.localeCompare(b.sourcePage))) {
    console.log(`  ${f.fixed ? "FIXED " : "      "}${f.sourcePage}`)
    console.log(`          -> ${f.href}`)
    if ((kind === "no-such-id" || kind === "stub-and-bad-fragment") && f.dest) {
      // Give the human the shortlist rather than making them go and look.
      const want = f.frag.replace(/[^a-z0-9]/gi, "").toLowerCase()
      const near = [...idsOf(f.dest)].filter(
        (id) => id.replace(/[^a-z0-9]/gi, "").toLowerCase() === want,
      )
      if (near.length === 1) {
        console.log(`          candidate: #${near[0]}  (exact match once punctuation is ignored)`)
      } else if (near.length > 1) {
        console.log(`          candidates: ${near.map((n) => "#" + n).join(", ")}`)
      }
    }
  }
}

const remaining = findings.filter((f) => !f.fixed)
console.log(
  `\n${findings.length} broken anchor link(s)` +
    (FIX ? `, ${fixedCount} fixed, ${remaining.length} left for a human` : ""),
)
if (FIX && fixedCount) {
  console.log("Rebuild and re-run: the fixer edits source, only a build proves the result.")
}
if (!findings.length) console.log("Every internal #fragment resolves.")
process.exit(remaining.length ? 1 : 0)
