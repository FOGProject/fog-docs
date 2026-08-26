// Tests for scripts/check-anchors.mjs.
//
// Run with: node --test "scripts/*.test.mjs"
//
// The script's whole value is that it distinguishes what can be rewritten
// mechanically from what needs a person, so that is what these pin. Each case
// builds a miniature site -- a few HTML pages and their source markdown -- and
// runs the real script over it, rather than importing internals: the classifier
// only makes sense against a directory that looks like a Quartz build, and the
// permalink stub in particular is a shape, not a value.

import { test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "check-anchors.mjs")

const write = (root, rel, body) => {
  const p = join(root, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, body)
  return p
}

// A page with real content and an id to aim at.
const page = (links = "", ids = ["real-section"]) =>
  `<html><body><article>
   ${ids.map((i) => `<h2 id="${i}">x</h2>`).join("\n")}
   ${links}
   </article></body></html>`

// What Quartz emits for a context_id permalink: a meta refresh, carrying no
// fragment. This is the shape the whole stub class hangs on.
const stub = (to) =>
  `<html><head><meta http-equiv="refresh" content="0; url=${to}"></head></html>`

const run = (root, ...args) => {
  try {
    const out = execFileSync(
      process.execPath,
      [SCRIPT, "--build-dir", join(root, "public"), "--docs", join(root, "docs"), ...args],
      { encoding: "utf8" },
    )
    return { out, code: 0 }
  } catch (e) {
    return { out: (e.stdout ?? "") + (e.stderr ?? ""), code: e.status }
  }
}

const sandbox = () => mkdtempSync(join(tmpdir(), "anchorcheck-"))

test("a link through a permalink stub is broken even though the id exists downstream", () => {
  const root = sandbox()
  try {
    // /target is the stub; the real page lives deeper and does have the id. A
    // checker that follows the redirect before looking would call this fine.
    write(root, "public/target/index.html", stub("../section/target"))
    write(root, "public/section/target.html", page())
    write(
      root,
      "public/section/from.html",
      page('<a href="../target#real-section">go</a>'),
    )
    write(root, "docs/section/from.md", "see [[target#real-section|go]]\n")
    write(root, "docs/section/target.md", "## real-section\n")

    const { out, code } = run(root)
    assert.equal(code, 1, "should fail while a broken anchor remains")
    assert.match(out, /fragment dropped by a permalink stub[^\n]*\(1\)/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("--fix qualifies the wikilink target and leaves the fragment alone", () => {
  const root = sandbox()
  try {
    write(root, "public/target/index.html", stub("../section/target"))
    write(root, "public/section/target.html", page())
    write(root, "public/section/from.html", page('<a href="../target#real-section">go</a>'))
    const src = write(root, "docs/section/from.md", "see [[target#real-section|go]]\n")
    write(root, "docs/section/target.md", "## real-section\n")

    const { out } = run(root, "--fix")
    assert.match(out, /1 fixed/)
    assert.equal(
      readFileSync(src, "utf8"),
      "see [[section/target#real-section|go]]\n",
      "target qualified, fragment untouched",
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("--fix converts a .md markdown link into a qualified wikilink", () => {
  const root = sandbox()
  try {
    write(root, "public/target/index.html", stub("../section/target"))
    write(root, "public/section/target.html", page())
    write(root, "public/section/from.html", page('<a href="../target#real-section">Bit</a>'))
    const src = write(root, "docs/section/from.md", "see [Bit](target.md#real-section).\n")
    write(root, "docs/section/target.md", "## real-section\n")

    const { out } = run(root, "--fix")
    assert.match(out, /1 fixed/)
    assert.equal(
      readFileSync(src, "utf8"),
      "see [[section/target#real-section|Bit]].\n",
      "link text preserved, .md dropped, path qualified",
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("a fragment naming no heading is reported, never guessed at", () => {
  const root = sandbox()
  try {
    // Direct link, no stub: the page is right, the fragment is not.
    write(root, "public/section/target.html", page("", ["something-else"]))
    write(
      root,
      "public/section/from.html",
      page('<a href="target#no-such-thing">go</a>'),
    )
    const src = write(root, "docs/section/from.md", "see [[target#no-such-thing|go]]\n")
    write(root, "docs/section/target.md", "## something-else\n")
    const before = readFileSync(src, "utf8")

    const { out, code } = run(root, "--fix")
    assert.equal(code, 1)
    assert.match(out, /needs a human/)
    assert.equal(readFileSync(src, "utf8"), before, "source must be left untouched")
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("a fragment that differs only in punctuation is offered as a candidate, not applied", () => {
  const root = sandbox()
  try {
    write(root, "public/section/target.html", page("", ["mac-address"]))
    write(root, "public/section/from.html", page('<a href="target#macaddress">go</a>'))
    const src = write(root, "docs/section/from.md", "see [[target#macaddress|go]]\n")
    write(root, "docs/section/target.md", "## mac-address\n")
    const before = readFileSync(src, "utf8")

    const { out, code } = run(root, "--fix")
    assert.equal(code, 1)
    assert.match(out, /candidate: #mac-address/)
    assert.equal(
      readFileSync(src, "utf8"),
      before,
      "a unique near-miss is still a heading choice, so it stays a suggestion",
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("a fragmentless link through a stub is left alone", () => {
  const root = sandbox()
  try {
    // The permalink redirect is a documented feature. Only a fragment makes it
    // a defect, and this pins that the checker does not chase the rest.
    write(root, "public/target/index.html", stub("../section/target"))
    write(root, "public/section/target.html", page())
    write(root, "public/section/from.html", page('<a href="../target">go</a>'))
    const src = write(root, "docs/section/from.md", "see [[target|go]]\n")
    write(root, "docs/section/target.md", "## real-section\n")
    const before = readFileSync(src, "utf8")

    const { out, code } = run(root, "--fix")
    assert.equal(code, 0)
    assert.match(out, /Every internal #fragment resolves/)
    assert.equal(readFileSync(src, "utf8"), before)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("a resolving anchor and an external link are both ignored", () => {
  const root = sandbox()
  try {
    write(
      root,
      "public/section/from.html",
      page(
        '<a href="target#real-section">ok</a>' +
          '<a href="https://example.com/x#frag">out</a>' +
          '<a href="#real-section">self</a>',
      ),
    )
    write(root, "public/section/target.html", page())
    write(root, "docs/section/from.md", "x\n")
    write(root, "docs/section/target.md", "## real-section\n")

    const { out, code } = run(root)
    assert.equal(code, 0, out)
    assert.match(out, /Every internal #fragment resolves/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("--fix is idempotent", () => {
  const root = sandbox()
  try {
    write(root, "public/target/index.html", stub("../section/target"))
    write(root, "public/section/target.html", page())
    write(root, "public/section/from.html", page('<a href="../target#real-section">go</a>'))
    const src = write(root, "docs/section/from.md", "see [[target#real-section|go]]\n")
    write(root, "docs/section/target.md", "## real-section\n")

    run(root, "--fix")
    const once = readFileSync(src, "utf8")
    // The build is stale now -- the same finding is reported again -- so a second
    // pass must not double-qualify the path it already rewrote.
    run(root, "--fix")
    assert.equal(readFileSync(src, "utf8"), once)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test("missing build directory exits 2 rather than reporting success", () => {
  const root = sandbox()
  try {
    const { code } = run(root)
    assert.equal(code, 2)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
