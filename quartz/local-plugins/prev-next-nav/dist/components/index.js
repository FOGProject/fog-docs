import { h } from "preact"
import { resolveRelative } from "@quartz-community/utils"

// mkdocs-material's `navigation.footer` feature (enabled in mkdocs.yml) renders
// Previous/Next links at the bottom of the page, following the site's nav order.
// No @quartz-community plugin does this. This reconstructs the same reading
// order the Explorer sidebar already shows (folders before files, the same
// per-directory explicit orders, alphabetical fallback) by rebuilding the same
// tree structure server-side and flattening it depth-first, then finds the
// current page's neighbors in that flattened list.
//
// Keep TOP_ORDER / EXPLICIT_ORDER in sync with the Explorer plugin's sortFn in
// quartz.config.yaml -- same duplication tradeoff already accepted there
// between mkdocs.yml's nav and this file.
const TOP_ORDER = ["installation", "management", "kb", "development"]
const EXPLICIT_ORDER = {
  "installation/server": [
    "requirements",
    "install-fog-server",
    "command-line-options",
    "virtualization",
    "migrating-fog-server",
  ],
  "installation/network-setup": ["dhcp-server-settings", "proxy-dhcp"],
  "kb/how-tos": [
    "capture-an-image",
    "deploy-an-image",
    "fog-client-example-tasks",
    "change-fog-server-ip-address",
    "bios-and-uefi-co-existence",
    "uefi-boot-entries",
    "deploy-dual-boot-multi-disk-image",
    "add-extend-a-2nd-virtual-hdd",
    "post-download-scripts",
  ],
  "management/web": [
    "users",
    "roles",
    "site-scoping",
    "ldap",
    "ad-integration",
    "hosts",
    "groups",
    "images",
    "storage-node",
    "snapins",
    "printers",
    "tasks",
    "multicast",
    "reports",
    "dashboard",
    "service",
    "config",
    "plugins",
  ],
}

class TrieNode {
  constructor(segments) {
    this.segments = segments
    this.children = []
    this.file = null
  }
  get segment() {
    return this.segments[this.segments.length - 1] || ""
  }
  insert(remaining, file) {
    if (remaining.length === 0) return
    const seg = remaining[0]
    if (remaining.length === 1) {
      if (seg === "index") {
        if (!this.file) this.file = file
      } else {
        const child = new TrieNode([...this.segments, seg])
        child.file = file
        this.children.push(child)
      }
      return
    }
    let child = this.children.find((c) => c.segment === seg)
    if (!child) {
      child = new TrieNode([...this.segments, seg])
      this.children.push(child)
    }
    child.insert(remaining.slice(1), file)
  }
}

function compareNodes(a, b) {
  const parentPath = a.segments.slice(0, -1).join("/")
  const order = EXPLICIT_ORDER[parentPath]
  if (order && a.children.length === 0 && b.children.length === 0) {
    const ra = order.indexOf(a.segment)
    const rb = order.indexOf(b.segment)
    const rankA = ra === -1 ? order.length : ra
    const rankB = rb === -1 ? order.length : rb
    if (rankA !== rankB) return rankA - rankB
  }

  const aIsFolder = a.children.length > 0
  const bIsFolder = b.children.length > 0
  if (aIsFolder && bIsFolder) {
    const ra = TOP_ORDER.indexOf(a.segment)
    const rb = TOP_ORDER.indexOf(b.segment)
    const rankA = ra === -1 ? TOP_ORDER.length : ra
    const rankB = rb === -1 ? TOP_ORDER.length : rb
    if (rankA !== rankB) return rankA - rankB
  }
  if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1

  const titleA = (a.file && a.file.frontmatter && a.file.frontmatter.title) || a.segment
  const titleB = (b.file && b.file.frontmatter && b.file.frontmatter.title) || b.segment
  return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: "base" })
}

function flatten(node, out) {
  if (node.file) out.push(node.file)
  const children = [...node.children].sort(compareNodes)
  for (const child of children) flatten(child, out)
}

function buildOrderedList(allFiles) {
  const visible = allFiles.filter(
    (f) => f.slug && !f.unlisted && f.slug !== "tags" && !f.slug.startsWith("tags/"),
  )
  const root = new TrieNode([])
  for (const file of visible) root.insert(file.slug.split("/"), file)
  const ordered = []
  flatten(root, ordered)
  return ordered
}

function displayTitle(file) {
  return (file.frontmatter && file.frontmatter.title) || file.slug
}

export const PrevNextNav = (_opts) => {
  function PrevNextNav({ fileData, allFiles, displayClass }) {
    if (!fileData || !fileData.slug || !Array.isArray(allFiles)) return null

    const ordered = buildOrderedList(allFiles)
    const idx = ordered.findIndex((f) => f.slug === fileData.slug)
    if (idx === -1) return null

    const prev = idx > 0 ? ordered[idx - 1] : null
    const next = idx < ordered.length - 1 ? ordered[idx + 1] : null
    if (!prev && !next) return null

    const classes = (displayClass ? displayClass + " " : "") + "prev-next-nav"
    return h("div", { class: classes }, [
      prev
        ? h("a", { class: "prev-next-nav-link prev", href: resolveRelative(fileData.slug, prev.slug) }, [
            h("span", { class: "prev-next-nav-label" }, "← Previous"),
            h("span", { class: "prev-next-nav-title" }, displayTitle(prev)),
          ])
        : h("span", { class: "prev-next-nav-spacer" }),
      next
        ? h("a", { class: "prev-next-nav-link next", href: resolveRelative(fileData.slug, next.slug) }, [
            h("span", { class: "prev-next-nav-label" }, "Next →"),
            h("span", { class: "prev-next-nav-title" }, displayTitle(next)),
          ])
        : h("span", { class: "prev-next-nav-spacer" }),
    ])
  }

  PrevNextNav.css = `
.prev-next-nav {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin: 1rem 0;
}
.prev-next-nav-link {
  display: flex;
  flex-direction: column;
  max-width: 45%;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  background-color: var(--lightgray);
}
.prev-next-nav-link:hover {
  background-color: var(--gray);
}
.prev-next-nav-link.next {
  text-align: right;
  margin-left: auto;
}
.prev-next-nav-label {
  font-size: 0.7rem;
  color: var(--gray);
  text-transform: uppercase;
}
.prev-next-nav-link.next .prev-next-nav-label {
  color: var(--darkgray);
}
.prev-next-nav-title {
  font-size: 0.9rem;
  color: var(--dark);
}
.prev-next-nav-spacer {
  flex: 1;
}
`

  return PrevNextNav
}
