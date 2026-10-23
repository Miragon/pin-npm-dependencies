// The docs site, built with the Miragon docs kit (docs/.vitepress/miragon/, vendored from
// Miragon/corporate-identity, skill docs-site). The kit sets everything else: base from
// DOCS_BASE, theme, colours light and dark, GitHub anchors, Mermaid, search, the legal row.
import { miragonDocs } from "./miragon/config"

export default miragonDocs({
  repo: "Miragon/pin-npm-dependencies",
  title: "Miragon pin-npm-dependencies",
  description: "A GitHub Action that fails the build when a package.json dependency is not pinned to an exact version.",
  footerMessage: "Released under the MIT License.",
  nav: [
    { text: "Getting started", link: "/getting-started", activeMatch: "^/(why-pin|getting-started|guarantees)" },
    { text: "Guides", link: "/fixing", activeMatch: "^/(fixing|monorepos|rollout)" },
    { text: "Reference", link: "/reference/inputs", activeMatch: "^/reference/" },
  ],
  sidebar: [
    {
      text: "Start",
      items: [
        { text: "Why pin dependencies", link: "/why-pin" },
        { text: "Getting started", link: "/getting-started" },
        { text: "Guarantees and limits", link: "/guarantees" },
      ],
    },
    {
      text: "Guides",
      items: [
        { text: "Fix findings", link: "/fixing" },
        { text: "Monorepos", link: "/monorepos" },
        { text: "Roll out", link: "/rollout" },
      ],
    },
    {
      text: "Reference",
      items: [
        { text: "Inputs and output", link: "/reference/inputs" },
        { text: "Rules", link: "/reference/rules" },
      ],
    },
  ],
})
