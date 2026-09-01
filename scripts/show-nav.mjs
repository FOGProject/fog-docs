#!/usr/bin/env node
// Prints the Explorer sidebar order for one or more folders, without a browser.
//
// Why this exists: the Explorer builds its tree CLIENT-SIDE from
// static/contentIndex.json, applying the sortFn that quartz.config.yaml ships to
// the browser as a string. None of that order is in the emitted HTML, so a
// missing or misplaced nav entry cannot be grepped for -- which is exactly how
// the 1.5/1.6 split silently removed "Install FOG Server" from
// Installation -> Server and nothing noticed.
//
// This rebuilds the same trie the browser builds (mirroring
// explorer.inline.ts: FileTrieNode plus the hardcoded filter -> map -> sort
// pipeline) and applies the real sortFn out of the config, so the sidebar can be
// checked in CI or from a terminal.
//
// Needs a build: run `npm run docs:build` in quartz/ first.
//
// Usage:
//   node scripts/show-nav.mjs installation/server management/web
//   node scripts/show-nav.mjs ""          # top level

import { existsSync } from "node:fs"
import { readFileSync } from "node:fs"

const INDEX = "quartz/public/static/contentIndex.json"
if (!existsSync(INDEX)) {
  console.error(`No content index at ${INDEX}. Run "npm run docs:build" in quartz/ first.`)
  process.exit(2)
}
const index = JSON.parse(readFileSync(INDEX, "utf8"))
const yaml = readFileSync("quartz/quartz.config.yaml", "utf8")

// pull the sortFn body out of the YAML block scalar
const at = yaml.indexOf("sortFn: |")
const rest = yaml.slice(at + "sortFn: |".length)
const lines = []
for (const line of rest.split("\n")) {
  if (line.trim() === "") { lines.push(""); continue }
  const indent = line.match(/^ */)[0].length
  if (indent < 8) break
  lines.push(line.slice(8))
}
const sortFn = Function(`"use strict";return (${lines.join("\n")})`)()

class FileTrieNode {
  constructor(slugSegments, data) {
    this.children = []
    this.slugSegments = slugSegments
    this.data = data || null
    this.isFolder = false
    this.fileSegmentHint = null
    this.displayNameOverride = undefined
  }
  get displayName() {
    if (this.displayNameOverride !== undefined) return this.displayNameOverride
    return (this.data?.title === "index" ? undefined : this.data?.title) || this.fileSegmentHint || this.slugSegment || ""
  }
  get slugSegment() { return this.slugSegments[this.slugSegments.length - 1] || "" }
  makeChild(parts, data) {
    const n = new FileTrieNode([...this.slugSegments, parts[0]], data)
    this.children.push(n)
    return n
  }
  insert(parts, data) {
    if (parts.length === 0) return
    this.isFolder = true
    const head = parts[0]
    if (parts.length === 1) {
      if (head === "index") { if (!this.data) this.data = data }
      else this.makeChild(parts, data)
    } else {
      let child = this.children.find((c) => c.slugSegment === head)
      if (!child) child = this.makeChild(parts, undefined)
      const fp = (data.filePath || data.slug || "").split("/")
      child.fileSegmentHint = fp[fp.length - parts.length]
      child.insert(parts.slice(1), data)
    }
  }
  add(data) { this.insert(data.slug.split("/"), data) }
  sort(fn) { this.children.sort(fn); this.children.forEach((c) => c.sort(fn)) }
  filter(fn) { this.children = this.children.filter(fn); this.children.forEach((c) => c.filter(fn)) }
}

const root = new FileTrieNode([], null)
for (const [slug, data] of Object.entries(index)) root.add({ ...data, slug })
root.filter((n) => n.slugSegment !== "tags")
root.sort(sortFn)

const find = (path) => {
  let node = root
  if (path === "") return node
  for (const seg of path.split("/")) {
    node = node.children.find((c) => c.slugSegment === seg)
    if (!node) return null
  }
  return node
}

const targets = process.argv.slice(2)
if (!targets.length) targets.push("")
for (const path of targets) {
  const node = find(path)
  console.log(`\n${path}/`)
  if (!node) { console.log("  !! NOT FOUND in the trie"); continue }
  for (const c of node.children) {
    console.log(`  ${c.isFolder ? "[dir] " : "      "}${c.displayName}`)
  }
}
