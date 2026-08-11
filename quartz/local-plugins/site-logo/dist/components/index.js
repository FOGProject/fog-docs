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
  height: auto;
  width: auto;
  border-radius: 0;
  margin: 1rem -5px;
}
`

  return SiteLogo
}
