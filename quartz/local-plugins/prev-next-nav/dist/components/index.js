import { h } from "preact"
import { resolveRelative } from "@quartz-community/utils"

// Renders Previous/Next links at the bottom of each page, following the site's
// nav order -- the mkdocs-material `navigation.footer` feature, which no
// @quartz-community plugin provides. This reconstructs the same reading order
// the Explorer sidebar shows (folders before files, the same per-directory
// explicit orders, alphabetical fallback) by rebuilding the same tree
// structure server-side and flattening it depth-first, then finds the current
// page's neighbors in that flattened list.
//
// TOP_ORDER / EXPLICIT_ORDER MUST stay in sync with the Explorer plugin's
// sortFn in quartz.config.yaml. The sortFn is a string inside YAML, so the two
// cannot share a module -- the duplication is structural. See VERSIONING.md
// for the check that compares them.
const TOP_ORDER = ["installation", "management", "kb", "development", "1.5", "1.6"]
const EXPLICIT_ORDER = {
  "installation/network-setup": ["dhcp-server-settings", "proxy-dhcp", "secure-boot-netboot"],
  "installation/server": [
    "requirements",
    "install-fog-server",
    "command-line-options",
    "migrating-fog-server",
    "virtualization",
    "uninstall-fog-server",
  ],
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
    "secure-boot-signing",
    "secure-boot-mok-enrollment",
    "secure-boot-setup-mode-enrollment",
  ],
  "kb/integrations": ["api", "api-expansion-and-pagination", "api-openapi-reference", "external-ca-lets-encrypt"],
  "kb/reference": [
    "pki-zones",
    "netboot-transport-and-pki",
    "pki-glossary",
    "bringing-your-own-ca",
    "secure-boot-trust-stores",
    "secure-boot-technical-details",
    "csv_import_export",
    "ping-hosts-service",
    "referential-integrity",
  ],
  "kb/troubleshooting": ["database-schema-update", "primary-mac-address-issues"],
  "management/fos": ["using-fog-boot-menu"],
  "management/server": ["install-fogsettings", "supported-customizations"],
  "management/web": [
    "users",
    "roles",
    "oidc",
    "local-login",
    "ad-integration",
    "ldap",
    "site-scoping",
    "groups",
    "hosts",
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
    "certificates",
    "plugins",
  ],
  "1.5/management/web": ["plugins", "ldap", "site-scoping", "hosts", "groups", "reports", "storage-node", "config", "images", "multicast"],
  "1.5/kb/reference": [
    "pki-zones",
    "netboot-transport-and-pki",
    "pki-glossary",
    "bringing-your-own-ca",
    "secure-boot-trust-stores",
    "secure-boot-technical-details",
    "csv_import_export",
    "ping-hosts-service",
    "referential-integrity",
  ],
  "1.6/management/web": ["plugins", "ldap", "site-scoping", "hosts", "groups", "reports", "storage-node", "config", "images", "multicast"],
  "1.6/kb/reference": [
    "pki-zones",
    "netboot-transport-and-pki",
    "pki-glossary",
    "bringing-your-own-ca",
    "secure-boot-trust-stores",
    "secure-boot-technical-details",
    "csv_import_export",
    "ping-hosts-service",
    "referential-integrity",
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

// Mirrors the Explorer's filterFn in quartz.config.yaml. The 1.5/1.6 trees are
// not in the sidebar, so Previous/Next must not walk into them either --
// otherwise "Next" from the last Development page steps into a tree the reader
// cannot see in the nav. Pages inside those trees get no Previous/Next of their
// own, which is right: they are reached deliberately from a chooser, not by
// reading the site in order.
const VERSION_TREES = ["1.5", "1.6"]
const inVersionTree = (slug) =>
  VERSION_TREES.some((v) => slug === v || slug.startsWith(v + "/"))

// allFiles carries Quartz's generated 404 page, which is not in the content
// index and must never be a Previous/Next target. It only surfaced once the
// version trees stopped being the last thing in reading order, at which point
// "Next" on the final Development page read "Not Found".
const NOT_A_DESTINATION = new Set(["404", "tags"])

function buildOrderedList(allFiles) {
  const visible = allFiles.filter(
    (f) =>
      f.slug &&
      !f.unlisted &&
      !NOT_A_DESTINATION.has(f.slug) &&
      !f.slug.startsWith("tags/") &&
      !inVersionTree(f.slug),
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
