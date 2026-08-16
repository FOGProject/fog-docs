import { h } from "preact"

// Visible "Permalink" link reading the `context_id` front-matter field,
// mirroring overrides/partials/tags.html's rendering under mkdocs-material.
//
// The href is the SHORT form on purpose: "/{context_id}" on the English site,
// "/{lang}/{context_id}" on a translated one. These paths do not exist in the
// build output — they resolve through two hops that both live elsewhere:
//
//   1. Read the Docs Exact Redirects, configured in the RTD dashboard (not in
//      this repo): "/*" → "/en/latest/:splat" on the parent project, and
//      "/<lang>/*" → "/<lang>/latest/:splat" per translation project. They
//      fire on 404 only, so no live URL is affected.
//   2. The /{lang}/{version}/{context_id} alias-redirect stub that
//      context-id-aliases + @quartz-community/alias-redirects emit into every
//      build, which forwards to the real page.
//
// Old copied links to /en/latest/{context_id} (or any lang/version form) keep
// working forever because step 2's stubs are still emitted — the short form
// only changes what NEW readers copy. If the RTD redirect rules are ever
// deleted, every visible permalink 404s; that dependency is the price of the
// short URL and is documented in .claude/i18n-context.md's dashboard
// checklist.
//
// The language comes from cfg.baseUrl's first path segment ("docs.fogproject.org/fr/latest"
// → "fr"), which rtd-build.mjs patches per project from
// $READTHEDOCS_CANONICAL_URL — so this needs no extra config and stays correct
// for every language and for the local dev server (whose at-rest baseUrl is
// the English one; the root-relative "/{context_id}" resolves against the
// prefix-less dev server, where the stub sits at the site root).
//
// rtd-fix-links.mjs leaves this href alone by construction: its fixUrl pass
// resolves root-absolute paths outside the output directory and returns them
// untouched.
export const ContextIdPermalink = (_opts) => {
  function ContextIdPermalink({ cfg, fileData, displayClass }) {
    const contextId = fileData && fileData.frontmatter && fileData.frontmatter.context_id
    if (!contextId) return null

    const lang = String((cfg && cfg.baseUrl) || "")
      .split("/")
      .filter(Boolean)[1]
    const prefix = !lang || lang === "en" ? "" : `/${lang}`

    const classes = (displayClass ? displayClass + " " : "") + "context-id-permalink"
    const href = `${prefix}/${String(contextId)}`
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
