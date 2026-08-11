import { h } from "preact"

// Visible "Permalink" link reading the `context_id` front-matter field,
// mirroring overrides/partials/tags.html's rendering under mkdocs-material.
export const ContextIdPermalink = (_opts) => {
  function ContextIdPermalink({ fileData, displayClass }) {
    const contextId = fileData && fileData.frontmatter && fileData.frontmatter.context_id
    if (!contextId) return null

    const classes = (displayClass ? displayClass + " " : "") + "context-id-permalink"
    return h("p", { class: classes }, [h("a", { href: "/" + contextId }, "Permalink")])
  }

  ContextIdPermalink.css = `
.context-id-permalink {
  margin: 0;
  font-size: 0.75rem;
}
.context-id-permalink a {
  color: var(--gray);
}
.context-id-permalink a:hover {
  color: var(--tertiary);
}
`

  return ContextIdPermalink
}
