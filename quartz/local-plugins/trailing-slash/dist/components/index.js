// Renders nothing; exists only to ship `afterDOMLoaded` to every page.
//
// Why: scripts/rtd-fix-links.mjs turns every page into <slug>/index.html and
// writes its static relative hrefs for a URL that ENDS IN A SLASH. RTD
// redirects a slashless URL to the slash form on a full page load, so a fresh
// load is fine. Quartz's SPA router does not: the Explorer builds slashless
// absolute hrefs client-side, the router fetches that URL and calls
// history.pushState with it, and no server round trip ever adds the slash.
// Two things then go wrong:
//   1. spa.inline.ts runs normalizeRelativeURLs(html, url) on the fetched page
//      BEFORE morphing it in. That rebases every "../x/" href against the
//      slashless URL, one directory too high, and bakes the result in as an
//      absolute path. Fixing location afterwards cannot repair those hrefs.
//   2. Any relative href still in the DOM resolves against the slashless
//      location, with the same one-directory error.
// So the slash has to be added BEFORE the router reads the link (1), and
// location has to be normalized for any slashless entry that gets through (2).
export const TrailingSlash = () => {
  function TrailingSlash() {
    return null
  }

  TrailingSlash.afterDOMLoaded = `
// Same-origin path that names a "directory" page: no trailing slash and no file
// extension in the last segment (so /static/x.png and /index.xml stay alone).
const needsSlash = (pathname) => !pathname.endsWith("/") && !/\\.[^/]+$/.test(pathname)

// (1) Capture phase on window runs before Quartz's own bubble-phase click
// listener, so by the time it reads a.href the link already ends in a slash.
window.addEventListener(
  "click",
  (event) => {
    const a = event.target instanceof Element ? event.target.closest("a") : null
    if (!a) return
    // Leave new-tab and download links alone; they never go through the router.
    if (a.hasAttribute("target") || a.hasAttribute("download")) return
    const href = a.getAttribute("href")
    if (href === null) return
    const url = new URL(href, location.href)
    if (url.origin !== location.origin || !needsSlash(url.pathname)) return
    a.setAttribute("href", url.pathname + "/" + url.search + url.hash)
  },
  true,
)

// (2) Initial load and after every SPA navigation. replaceState, not
// pushState, so no extra history entry is created and Back still works.
const normalizeLocation = () => {
  if (!needsSlash(location.pathname)) return
  history.replaceState(history.state, "", location.pathname + "/" + location.search + location.hash)
}
document.addEventListener("nav", normalizeLocation)
normalizeLocation()
`

  return TrailingSlash
}
