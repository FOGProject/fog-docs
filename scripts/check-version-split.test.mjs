// Tests for scripts/check-version-split.mjs.
//
// Run with: node --test "scripts/*.test.mjs"
//
// Each case builds a miniature repo -- a few versioned pages plus stand-ins for
// quartz.config.yaml and prev-next-nav -- and runs the real script over it,
// following the same approach as check-anchors.test.mjs. What matters about
// this script is that it FAILS on each silent-breakage shape, so every case
// below pins one of those rather than testing the parsers directly.

import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "check-version-split.mjs")

const write = (root, rel, body) => {
  const p = join(root, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, body)
}

const NAV_ORDER = { "management/web": ["plugins"] }
const TOP_ORDER = ["installation", "management", "kb", "development", "1.5", "1.6"]

// A repo where everything is correct. Individual tests mutate one thing.
const makeRepo = (opts = {}) => {
  const root = mkdtempSync(join(tmpdir(), "vsplit-"))
  const {
    chooserContextId = "plugins-versions",
    chooserAliases = null,
    chooserTags = ["version-chooser", "management"],
    chooser = true,
    linkIn16 = "[[1.6/management/web/hosts|Host Management]]",
    navOrder = NAV_ORDER,
    topOrder = TOP_ORDER,
  } = opts

  const fm = (o) =>
    [
      "---",
      `title: ${o.title}`,
      `context_id: ${o.context_id}`,
      ...(o.aliases ? ["aliases:", ...o.aliases.map((a) => `    - ${a}`)] : []),
      "tags:",
      ...o.tags.map((t) => `    - ${t}`),
      "---",
      "",
    ].join("\n")

  // Two forked topics: management/web/plugins and management/web/hosts.
  for (const v of ["1.5", "1.6"]) {
    const sfx = v === "1.5" ? "-1.5" : ""
    const label = v === "1.5" ? " (1.5)" : ""
    write(
      root,
      `docs/${v}/management/web/plugins.md`,
      fm({ title: `Plugins${label}`, context_id: `plugins${sfx}`, tags: ["management"] }) +
        `# Plugins${label}\n\n${v === "1.6" ? linkIn16 : ""}\n`,
    )
    write(
      root,
      `docs/${v}/management/web/hosts.md`,
      fm({ title: `Host Management${label}`, context_id: `hosts${sfx}`, tags: ["management"] }) +
        `# Host Management${label}\n`,
    )
  }

  for (const topic of ["plugins", "hosts"]) {
    if (topic === "plugins" && !chooser) continue
    write(
      root,
      `docs/management/web/${topic}.md`,
      fm({
        title: topic === "plugins" ? "Plugins" : "Host Management",
        context_id: topic === "plugins" ? chooserContextId : `${topic}-versions`,
        aliases: topic === "plugins" ? chooserAliases : null,
        tags: topic === "plugins" ? chooserTags : ["version-chooser", "management"],
      }) +
        `# ${topic}\n\n` +
        `- [[1.6/management/web/${topic}|A]]\n- [[1.5/management/web/${topic}|B]]\n`,
    )
  }

  write(
    root,
    "quartz/quartz.config.yaml",
    [
      "plugins:",
      "  - source: explorer",
      "    options:",
      "      sortFn: |",
      "        (a, b) => {",
      `          const topOrder = ${JSON.stringify(topOrder)}`,
      `          const explicitOrder = ${JSON.stringify(NAV_ORDER)}`,
      "        }",
      "",
    ].join("\n"),
  )
  write(
    root,
    "quartz/local-plugins/prev-next-nav/dist/components/index.js",
    [
      `const TOP_ORDER = ${JSON.stringify(topOrder)}`,
      `const EXPLICIT_ORDER = ${JSON.stringify(navOrder)}`,
      "",
      "class TrieNode {}",
      "",
    ].join("\n"),
  )
  return root
}

const run = (root) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [SCRIPT], { cwd: root, encoding: "utf8" }) }
  } catch (e) {
    return { code: e.status, out: e.stdout ?? "" }
  }
}

const cleanup = (root) => rmSync(root, { recursive: true, force: true })

test("passes on a correctly split repo", () => {
  const root = makeRepo()
  const { code, out } = run(root)
  assert.equal(code, 0, out)
  assert.match(out, /2 forked topic\(s\)/)
  assert.match(out, /Version split is consistent/)
  cleanup(root)
})

test("fails when a forked topic has no chooser", () => {
  const root = makeRepo({ chooser: false })
  const { code, out } = run(root)
  assert.equal(code, 1)
  assert.match(out, /management\/web\/plugins is forked but has no chooser/)
  cleanup(root)
})

test("fails on an unversioned link to a forked page inside a version tree", () => {
  const root = makeRepo({ linkIn16: "[[management/web/hosts|Host Management]]" })
  const { code, out } = run(root)
  assert.equal(code, 1)
  assert.match(out, /Unversioned links to a forked page/)
  assert.match(out, /should point at 1\.6\/management\/web\/hosts/)
  cleanup(root)
})

test("an unversioned link is fine when it names a page that is not forked", () => {
  const root = makeRepo({ linkIn16: "[[kb/reference/hardware|Supported Hardware]]" })
  const { code, out } = run(root)
  assert.equal(code, 0, out)
  cleanup(root)
})

test("fails when the chooser claims the newest version's context_id", () => {
  const root = makeRepo({ chooserContextId: "plugins" })
  const { code, out } = run(root)
  assert.equal(code, 1)
  assert.match(out, /claims context_id "plugins", which the 1\.6 page must own/)
  cleanup(root)
})

test("fails when the chooser declares aliases", () => {
  const root = makeRepo({ chooserAliases: ["Plugins"] })
  const { code, out } = run(root)
  assert.equal(code, 1)
  assert.match(out, /declares aliases \(Plugins\); a chooser must declare none/)
  cleanup(root)
})

test("fails when the chooser is missing the version-chooser tag", () => {
  const root = makeRepo({ chooserTags: ["management"] })
  const { code, out } = run(root)
  assert.equal(code, 1)
  assert.match(out, /is missing the "version-chooser" tag/)
  cleanup(root)
})

test("fails when the two nav-order tables disagree", () => {
  const root = makeRepo({ navOrder: { "management/web": ["plugins", "hosts"] } })
  const { code, out } = run(root)
  assert.equal(code, 1)
  assert.match(out, /Nav-order tables disagree/)
  assert.match(out, /"management\/web" is ordered differently/)
  cleanup(root)
})

test("fails when only one table lists a directory", () => {
  const root = makeRepo({ navOrder: { "management/web": ["plugins"], "kb/reference": ["hardware"] } })
  const { code, out } = run(root)
  assert.equal(code, 1)
  assert.match(out, /"kb\/reference" is only in prev-next-nav/)
  cleanup(root)
})

test("exits 2 when there is no docs directory", () => {
  const root = mkdtempSync(join(tmpdir(), "vsplit-empty-"))
  const { code } = run(root)
  assert.equal(code, 2)
  cleanup(root)
})
