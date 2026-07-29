#!/usr/bin/env node
// Read the Docs' custom build.commands hosting serves files by exact path —
// unlike GitHub Pages/Cloudflare Pages, it does no clean-URL rewriting from
// "/foo" to "foo.html". Quartz's link-resolution core (simplifySlug in
// @quartz-community/crawl-links) unconditionally strips ".html" when
// building hrefs, with no config toggle, so every internal link to a flat
// leaf page 404s once deployed on RTD.
//
// Appending ".html" to hrefs (an earlier version of this script) "fixes"
// navigation but breaks Quartz's client-side graph view and backlinks:
// those derive "what page is this" from the URL itself, which they expect
// to be extensionless — landing on foo.html disagrees with what Quartz's
// own JS thinks it's rendering.
//
// The actual answer is the same trick MkDocs already uses successfully on
// this exact host: real directories with index.html inside (RTD serves
// those via completely standard directory-index resolution — confirmed
// working today for Quartz's own tag pages, e.g. /tags/). So this promotes
// every flat leaf page ("foo.html") to "foo/index.html", and recomputes
// every internal href/src/meta-refresh target to the correct new relative
// path — not just appending a suffix, since moving a page one directory
// level deeper changes the correct "../" chain to everything it links to.
import { readdirSync, statSync, readFileSync, writeFileSync, renameSync, mkdirSync, rmSync } from "node:fs"
import path from "node:path"

const outDir = process.argv[2]
if (!outDir) {
  console.error("Usage: rtd-fix-links.mjs <output-dir>")
  process.exit(1)
}
const outDirAbs = path.resolve(outDir)

// Conventional flat files that must NOT become a directory.
const KEEP_FLAT_AT_ROOT = new Set(["404.html"])

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walkHtml(full, files)
    else if (entry.endsWith(".html")) files.push(full)
  }
  return files
}

function isLeaf(absPath) {
  const base = path.basename(absPath)
  if (base === "index.html") return false
  if (KEEP_FLAT_AT_ROOT.has(base) && path.dirname(absPath) === outDirAbs) return false
  return true
}

const allFiles = walkHtml(outDirAbs)
const knownFiles = new Set(allFiles)

// Where a file will live after restructuring.
function newPathFor(absPath) {
  return isLeaf(absPath)
    ? path.join(path.dirname(absPath), path.basename(absPath, ".html"), "index.html")
    : absPath
}

function isExternal(url) {
  return (
    /^([a-z][a-z0-9+.-]*:)?\/\//i.test(url) ||
    /^(mailto|tel|data|javascript):/i.test(url) ||
    url.startsWith("#")
  )
}

function splitUrl(url) {
  const m = url.match(/^([^?#]*)([?#].*)?$/)
  return [m[1], m[2] || ""]
}

function toPosix(p) {
  return p.split(path.sep).join("/")
}

// Resolve `rawPath` (as originally written, against the file's pre-move
// directory) to the absolute on-disk file it refers to in the ORIGINAL
// (pre-restructure) build output.
function resolveOriginalTarget(oldDir, rawPath) {
  // "." / ".." (e.g. the site-title link, href=".") are directory references,
  // not a file literally named "." — never append .html to those.
  if (rawPath.endsWith("/") || /(^|\/)\.\.?$/.test(rawPath)) {
    return path.resolve(oldDir, rawPath, "index.html")
  }
  const resolved = path.resolve(oldDir, rawPath)
  if (path.extname(resolved)) return resolved // already has an extension (asset, or already .html)
  return resolved + ".html" // Quartz's extensionless page reference
}

function rewriteFile(absPath) {
  const oldDir = path.dirname(absPath)
  const newDir = path.dirname(newPathFor(absPath))

  function fixUrl(url) {
    if (!url || isExternal(url)) return url
    const [rawPath, suffix] = splitUrl(url)
    if (rawPath === "") return url
    const originalTarget = resolveOriginalTarget(oldDir, rawPath)
    if (!originalTarget.startsWith(outDirAbs)) return url // shouldn't happen, leave untouched
    const targetIsKnownPage = knownFiles.has(originalTarget)
    const newTarget = targetIsKnownPage ? newPathFor(originalTarget) : originalTarget
    let rel = toPosix(path.relative(newDir, newTarget))
    if (targetIsKnownPage && path.basename(newTarget) === "index.html") {
      rel = rel.replace(/index\.html$/, "") // clean directory URL, drop the literal filename
    }
    if (!rel.startsWith(".") && !rel.startsWith("/")) rel = "./" + rel
    if (rel === "") rel = "./"
    return rel + suffix
  }

  let html = readFileSync(absPath, "utf8")
  const original = html
  html = html.replace(/(href=")([^"]*)(")/g, (m, a, url, b) => `${a}${fixUrl(url)}${b}`)
  html = html.replace(/(src=")([^"]*)(")/g, (m, a, url, b) => `${a}${fixUrl(url)}${b}`)
  html = html.replace(
    /(content="0;\s*url=)([^"]*)(")/g,
    (m, a, url, b) => `${a}${fixUrl(url)}${b}`,
  )
  if (html !== original) writeFileSync(absPath, html)
}

for (const file of allFiles) rewriteFile(file)

let moved = 0
for (const file of allFiles) {
  if (!isLeaf(file)) continue
  const dest = newPathFor(file)
  mkdirSync(path.dirname(dest), { recursive: true })
  renameSync(file, dest)
  moved++
}

console.log(`rtd-fix-links: relinked ${allFiles.length} HTML files, promoted ${moved} leaf pages to directories`)
