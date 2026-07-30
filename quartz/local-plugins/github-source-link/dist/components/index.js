import { h } from "preact"

// "Edit this page" / "View source" links to GitHub, mirroring mkdocs-material's
// content.action.edit / content.action.view features (theme.features in mkdocs.yml).
export const GithubSourceLink = (opts) => {
  function GithubSourceLink({ fileData, displayClass }) {
    const relativePath = fileData && fileData.relativePath
    if (!relativePath || !opts || !opts.repoUrl) return null

    const branch = opts.branch || "master"
    const contentDir = opts.contentDir || "docs"
    const path = `${contentDir}/${relativePath}`
    const classes = (displayClass ? displayClass + " " : "") + "github-source-link"
    return h("p", { class: classes }, [
      h("a", { href: `${opts.repoUrl}/edit/${branch}/${path}` }, "Edit this page"),
      " · ",
      h("a", { href: `${opts.repoUrl}/blob/${branch}/${path}` }, "View source"),
    ])
  }

  GithubSourceLink.css = `
.github-source-link {
  margin: 0;
  font-size: 0.75rem;
}
.github-source-link a {
  color: var(--gray);
}
.github-source-link a:hover {
  color: var(--tertiary);
}
`

  return GithubSourceLink
}
