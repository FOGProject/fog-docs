import { h } from "preact"
import { resolveRelative } from "@quartz-community/utils"

// Quartz's page shell has no full-width top-bar region (unlike mkdocs-material's
// navigation.tabs) -- the left sidebar is the closest persistent, always-visible
// surface. This renders the same top-level sections as a row of pill links
// pinned above the Explorer tree, so they don't require expanding the tree to
// reach, and highlights whichever section the current page belongs to.
export const SectionShortcuts = (opts) => {
  const links = (opts && opts.links) || []

  function SectionShortcuts({ fileData, displayClass }) {
    if (links.length === 0) return null

    const currentSlug = fileData && fileData.slug
    const items = links.map((link) => {
      const topSegment = link.target.split("/")[0]
      const isActive =
        !!currentSlug && (currentSlug === topSegment || currentSlug.startsWith(topSegment + "/"))
      const href = resolveRelative(currentSlug || "index", link.target)
      return h(
        "li",
        { class: "section-shortcuts-item" },
        h(
          "a",
          {
            href,
            class: "section-shortcuts-link" + (isActive ? " active" : ""),
          },
          link.text,
        ),
      )
    })

    const classes = (displayClass ? displayClass + " " : "") + "section-shortcuts"
    return h("nav", { class: classes, "aria-label": "Sections" }, h("ul", null, items))
  }

  SectionShortcuts.css = `
.section-shortcuts ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  list-style: none;
  margin: 0 0 0.75rem 0;
  padding: 0;
}
.section-shortcuts-link {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  background-color: var(--lightgray);
  color: var(--dark);
}
.section-shortcuts-link:hover {
  background-color: var(--gray);
}
.section-shortcuts-link.active {
  background-color: var(--secondary);
  color: var(--light);
}
`

  return SectionShortcuts
}
