#!/usr/bin/env node
// Read the Docs' custom build.commands hosting serves files by exact path —
// unlike GitHub Pages/Cloudflare Pages, it does not rewrite an extensionless
// request ("/foo") to the matching "foo.html" file. Quartz's link-resolution
// core (simplifySlug in @quartz-community/crawl-links) unconditionally
// strips ".html" when building hrefs, with no config toggle to opt out, so
// every internal link to a flat leaf page 404s once deployed on RTD.
//
// This walks the build output after `quartz build` and appends ".html" to
// internal href/src/meta-refresh targets that are missing an extension and
// don't already end in "/" (folder-index pages like tags/ already resolve
// fine via RTD's directory-index support and are left untouched).
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs"
import { join, extname } from "node:path"

const outDir = process.argv[2]
if (!outDir) {
  console.error("Usage: rtd-fix-links.mjs <output-dir>")
  process.exit(1)
}

const KNOWN_EXTENSIONS = new Set([
  ".html", ".css", ".js", ".mjs", ".json", ".xml", ".txt",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
  ".woff", ".woff2", ".ttf", ".pdf", ".zip",
])

function shouldRewrite(url) {
  if (!url) return false
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(url)) return false // absolute/protocol-relative
  if (/^(mailto|tel|data|javascript):/i.test(url)) return false
  if (url.startsWith("#")) return false
  if (url.endsWith("/")) return false
  const [path] = url.split(/[?#]/)
  if (!path || path.endsWith("/")) return false
  if (KNOWN_EXTENSIONS.has(extname(path).toLowerCase())) return false
  return true
}

function rewrite(url) {
  const match = url.match(/^([^?#]*)([?#].*)?$/)
  const path = match[1]
  const suffix = match[2] || ""
  return `${path}.html${suffix}`
}

function fixAttr(html, attrName) {
  const re = new RegExp(`(${attrName}=")([^"]*)(")`, "g")
  return html.replace(re, (full, pre, url, post) => {
    if (!shouldRewrite(url)) return full
    return `${pre}${rewrite(url)}${post}`
  })
}

function fixMetaRefresh(html) {
  // <meta http-equiv="refresh" content="0; url=./foo">
  return html.replace(
    /(content="0;\s*url=)([^"]*)(")/g,
    (full, pre, url, post) => (shouldRewrite(url) ? `${pre}${rewrite(url)}${post}` : full),
  )
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, files)
    else if (entry.endsWith(".html")) files.push(full)
  }
  return files
}

const files = walk(outDir)
let changed = 0
for (const file of files) {
  const original = readFileSync(file, "utf8")
  let html = original
  html = fixAttr(html, "href")
  html = fixMetaRefresh(html)
  if (html !== original) {
    writeFileSync(file, html)
    changed++
  }
}
console.log(`rtd-fix-links: rewrote links in ${changed}/${files.length} HTML files`)
