// Bridges fog-docs' `context_id` front-matter field into Quartz's native
// alias-redirect mechanism, replicating hook.py's dynamic redirect-map
// generation without editing any of the 94 content files.
//
// Must run after NoteProperties (order 5), which parses front matter into
// file.data.frontmatter and file.data.aliases.
const ContextIdAliases = () => ({
  name: "ContextIdAliases",
  markdownPlugins() {
    return [
      () => (_tree, file) => {
        const frontmatter = file.data.frontmatter
        const contextId = frontmatter && frontmatter.context_id
        if (!contextId) return

        const id = String(contextId)
        const existing = Array.isArray(file.data.aliases) ? file.data.aliases : []
        if (!existing.includes(id)) {
          file.data.aliases = [...existing, id]
        }
      },
    ]
  },
})

export default ContextIdAliases
