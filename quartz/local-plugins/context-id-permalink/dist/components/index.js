import { h } from "preact"
import { resolveRelative } from "@quartz-community/utils"

// Visible "Permalink" link reading the `context_id` front-matter field,
// mirroring overrides/partials/tags.html's rendering under mkdocs-material.
//
// The href MUST stay relative to the current page (resolveRelative), never a
// root-absolute "/{context_id}" or a baseUrl-derived absolute URL. Read the
// Docs serves this site under a language/version prefix (/en/latest/ today),
// so a root-absolute href drops that prefix and 404s — and rtd-fix-links.mjs
// can't repair it, since its fixUrl pass skips anything resolving outside the
// output dir. A relative href inherits whatever prefix the page is served
// under, so it stays correct for future translations/versions (/es/latest/,
// /en/1.6/) and under the prefix-less local dev server, with no config to
// keep in sync.
export const ContextIdPermalink = (_opts) => {
  function ContextIdPermalink({ fileData, displayClass }) {
    const contextId = fileData && fileData.frontmatter && fileData.frontmatter.context_id
    if (!contextId) return null

    const classes = (displayClass ? displayClass + " " : "") + "context-id-permalink"
    const href = resolveRelative(fileData.slug, String(contextId))
    return h("p", { class: classes }, [h("a", { href }, "Permalink")])
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
