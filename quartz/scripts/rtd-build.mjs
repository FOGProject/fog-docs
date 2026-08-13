#!/usr/bin/env node
// Language-aware entry point for the Read the Docs build.
//
// Read the Docs serves translations as one RTD project per language, all
// pointed at this same repo and branch, linked from the parent project's
// Translations page. Each project carries its own Language setting, and RTD
// passes that to the build as $READTHEDOCS_LANGUAGE. That is the only thing
// that differs between the English build and the French one, so a single
// .readthedocs.yml can serve every language -- this script reads the variable
// and builds the corresponding content tree. No per-language branches, no
// duplicated config, nothing to keep in sync.
//
// Quartz has no multi-language support of its own. Its `locale` setting only
// translates Quartz's own UI chrome; page content has to come from a separate
// content tree per language, which is exactly the shape RTD wants anyway.
//
// Three things have to be arranged before Quartz runs:
//
//   1. The content tree. translations/<lang>/ holds only the pages that have
//      actually been translated, so it is composed over a copy of docs/ rather
//      than used directly. An untranslated page then falls back to English
//      instead of 404ing, and docs/assets/img/ comes along without the
//      translation tree having to carry a copy of every image.
//
//   2. quartz.config.yaml. Quartz's CLI has no --config flag -- see
//      resolveConfigPath in quartz/cli/plugin-data.js, which reads
//      quartz.config.yaml from process.cwd() unconditionally -- so the file is
//      patched in place and restored afterwards.
//
//   3. baseUrl. It used to be hardcoded to docs.fogproject.org/en/latest,
//      which is wrong for every language but English (and wrong for any RTD
//      project that is not the production one, including the test projects
//      this was proven out on). It now comes from $READTHEDOCS_CANONICAL_URL,
//      which RTD sets correctly per project and per version.
//
// Usage:
//   node scripts/rtd-build.mjs                 # language from $READTHEDOCS_LANGUAGE, else en
//   node scripts/rtd-build.mjs --language fr   # explicit, for local checking
//   node scripts/rtd-build.mjs -o /tmp/out     # explicit output dir
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"

const quartzDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const repoRoot = path.resolve(quartzDir, "..")

const configPath = path.join(quartzDir, "quartz.config.yaml")
// The patched config is written over the real one, so the original is parked
// here for the duration. Checked on startup as well as restored on exit: if a
// previous run was killed between patch and restore, the .orig file is the
// only surviving copy of the unpatched config and must be put back before
// anything reads it, or the next build patches an already-patched file.
const configBackupPath = configPath + ".orig"

function fail(message) {
  console.error(`rtd-build: ${message}`)
  process.exit(1)
}

// ---------------------------------------------------------------- arguments

function argValue(...names) {
  for (const name of names) {
    const i = process.argv.indexOf(name)
    if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1]
  }
  return undefined
}

const languages = JSON.parse(readFileSync(path.join(repoRoot, "translations", "languages.json"), "utf8"))

// RTD's language code, the translations/ directory name and the URL prefix are
// deliberately the same string -- see the $comment in languages.json.
const lang = (argValue("--language", "-l") ?? process.env.READTHEDOCS_LANGUAGE ?? "en").toLowerCase()
const isEnglish = lang === "en"
const langConfig = languages.languages[lang]

if (!isEnglish && !langConfig) {
  fail(
    `unknown language "${lang}". Known: en, ${Object.keys(languages.languages).join(", ")}. ` +
      `If this is a new RTD project, add the language to translations/languages.json first.`,
  )
}

const outDir = path.resolve(
  argValue("--output", "-o") ??
    (process.env.READTHEDOCS_OUTPUT ? path.join(process.env.READTHEDOCS_OUTPUT, "html") : path.join(quartzDir, "public")),
)

// ------------------------------------------------------------- content tree

// Composed trees live outside the repo, and this is not a style preference.
// Quartz globs its content with `globby(..., { gitignore: true })` (see
// quartz/util/glob.ts), so any content root inside the working tree that is
// listed in .gitignore comes back empty -- "Found 0 input files", a build that
// exits 0, and a published site containing nothing but chrome. Keeping the
// tree outside the repo means there is nothing to gitignore and nothing to
// trip over. The path is logged below so a failed build can still be inspected.
const composedRoot = path.join(tmpdir(), "fog-docs-i18n")

function composeContentTree() {
  // English is the source of truth and needs no composition. Building it
  // straight out of docs/ also keeps the English site byte-identical to what
  // this repo produced before translations existed.
  if (isEnglish) return path.join(repoRoot, "docs")

  const translationDir = path.join(repoRoot, "translations", lang)
  if (!existsSync(translationDir)) {
    // Distinct from "some pages are untranslated", which is normal and falls
    // back per-page. A missing directory means the language was configured but
    // never seeded, and serving a wholly English site under /<lang>/ would look
    // like a working translation rather than an unfinished one.
    fail(
      `translations/${lang}/ does not exist. Seed the language before pointing an ` +
        `RTD project at it (see CLAUDE.md, "Translations").`,
    )
  }

  const composed = path.join(composedRoot, lang)
  rmSync(composed, { recursive: true, force: true })
  mkdirSync(composed, { recursive: true })

  // preserveTimestamps because the composed tree is outside the git repo, so
  // the created-modified-date plugin cannot read dates from git here and falls
  // back to the filesystem. Without this every translated page would claim it
  // was modified at build time. It is still only as good as the mtimes in the
  // checkout -- on RTD, a fresh clone stamps them all with the clone time --
  // so translated pages carry weaker date information than English ones.
  cpSync(path.join(repoRoot, "docs"), composed, { recursive: true, preserveTimestamps: true })
  cpSync(translationDir, composed, {
    recursive: true,
    preserveTimestamps: true,
    // Bookkeeping for scripts/translate.mjs, not content.
    filter: (src) => path.basename(src) !== ".translation-state.json",
  })

  return composed
}

// ------------------------------------------------------------------- config

function patchConfig() {
  if (existsSync(configBackupPath)) {
    console.warn("rtd-build: found a leftover quartz.config.yaml.orig; restoring it before patching")
    writeFileSync(configPath, readFileSync(configBackupPath))
    rmSync(configBackupPath)
  }

  const original = readFileSync(configPath, "utf8")
  writeFileSync(configBackupPath, original)

  const config = YAML.parse(original)

  if (!isEnglish) {
    config.configuration.locale = langConfig.quartzLocale
  }

  // RTD hands us e.g. "https://docs.fogproject.org/fr/latest/". Quartz wants it
  // without the scheme or a trailing slash. Locally there is no canonical URL,
  // so derive the equivalent from languages.json to keep local link resolution
  // representative of the deployed site.
  const canonical =
    process.env.READTHEDOCS_CANONICAL_URL ??
    (isEnglish ? languages.englishBaseUrl : languages.englishBaseUrl.replace("/en/", `/${lang}/`))
  config.configuration.baseUrl = canonical.replace(/^https?:\/\//, "").replace(/\/+$/, "")

  // "Edit this page" should land on the file that produced the page. For a
  // translated build that is the file under translations/<lang>/ -- a native
  // speaker fixing a bad translation edits the translation, and that edit
  // survives until the English source changes (translate.mjs only regenerates
  // pages whose English source hash moved).
  const sourceLink = config.plugins.find((p) => p.source === "./local-plugins/github-source-link")
  if (sourceLink) {
    sourceLink.options.contentDir = isEnglish ? "docs" : `translations/${lang}`
  }

  writeFileSync(configPath, YAML.stringify(config))
}

function restoreConfig() {
  if (!existsSync(configBackupPath)) return
  writeFileSync(configPath, readFileSync(configBackupPath))
  rmSync(configBackupPath)
}

// -------------------------------------------------------------------- build

function run(command, args) {
  const result = spawnSync(command, args, { cwd: quartzDir, stdio: "inherit", shell: false })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status ?? result.signal}`)
  }
}

const contentDir = composeContentTree()

console.log(
  `rtd-build: language=${lang}${isEnglish ? "" : ` (${langConfig.quartzLocale})`} ` +
    `content=${path.relative(repoRoot, contentDir)} output=${outDir}`,
)

patchConfig()
try {
  run(process.execPath, [path.join(quartzDir, "quartz", "bootstrap-cli.mjs"), "build", "--directory", contentDir, "-o", outDir])
} finally {
  // Restored even on failure: leaving a patched config behind would make the
  // next local build silently produce a site for the wrong language.
  restoreConfig()
}

// Quartz's link resolution strips ".html" from every internal href on the
// assumption that the host rewrites clean URLs; RTD serves by exact path. This
// promotes leaf pages to directories with an index.html so those links resolve.
// Language-agnostic -- see the script's own header for the full story.
run(process.execPath, [path.join(quartzDir, "scripts", "rtd-fix-links.mjs"), outDir])
