import { h } from "preact"
import { pathToRoot, joinSegments } from "@quartz-community/utils"

// FOG icon next to the site title, mirroring mkdocs-material's `theme.logo` feature
// (the small brand icon it shows beside the site name in the header).
export const SiteLogo = () => {
  function SiteLogo({ fileData, displayClass }) {
    const baseDir = pathToRoot(fileData.slug)
    const iconPath = joinSegments(baseDir, "static/icon.png")
    const classes = (displayClass ? displayClass + " " : "") + "site-logo"
    return h("a", { href: baseDir, class: classes, "aria-label": "FOG Project home" }, [
      h("img", { src: iconPath, alt: "" }),
    ])
  }

  SiteLogo.css = `
.site-logo {
  display: inline-flex;
  flex-shrink: 0;
}
.site-logo img {
  display: block;
  height: 1.75rem;
  width: 1.75rem;
  border-radius: 0.2rem;
}
`

  return SiteLogo
}
