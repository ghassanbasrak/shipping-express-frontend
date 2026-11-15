/**
 * Tailwind CSS v3 preset (generated from src/brand/tokens.json - npm run brand:generate).
 * Requires src/brand/tokens.css (semantic colours read its --ax-* variables).
 * Classes: bg-brand-purple-700, text-brand-muted, border-brand-line, bg-surface-alt, bg-status-success-bg text-status-success-fg ...
 */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
              "brand": {
                      "purple": {
                              "25": "#FBFAFD",
                              "50": "#F4F1F8",
                              "100": "#EAE3F2",
                              "200": "#D7C8E9",
                              "300": "#BEA8DC",
                              "400": "#9D75D1",
                              "500": "#7D47C2",
                              "600": "#6436A1",
                              "700": "#3A1F5D",
                              "800": "#2E194A",
                              "900": "#211236",
                              "950": "#150B22",
                              "DEFAULT": "#3A1F5D"
                      },
                      "mint": {
                              "50": "#E8FBF4",
                              "100": "#DCF8EF",
                              "200": "#BBF2E0",
                              "300": "#8EE9CB",
                              "400": "#5EE0B5",
                              "500": "#4ABE98",
                              "600": "#3AA482",
                              "700": "#2A896B",
                              "800": "#1A6E54",
                              "900": "#0E5A43",
                              "DEFAULT": "#5EE0B5"
                      },
                      "ink": "#150B22",
                      "muted": "#6E5F81",
                      "line": "#EAE3F2"
              },
              "status": {
                      "success": {
                              "DEFAULT": "#14593F",
                              "bg": "#DFF5EC",
                              "fg": "#14593F"
                      },
                      "warning": {
                              "DEFAULT": "#6B430A",
                              "bg": "#FBEFD5",
                              "fg": "#6B430A"
                      },
                      "error": {
                              "DEFAULT": "#8E2A20",
                              "bg": "#FBE7E4",
                              "fg": "#8E2A20"
                      },
                      "info": {
                              "DEFAULT": "#1F4F9E",
                              "bg": "#E3ECFB",
                              "fg": "#1F4F9E"
                      },
                      "neutral": {
                              "DEFAULT": "#3A1F5D",
                              "bg": "#EAE3F2",
                              "fg": "#3A1F5D"
                      },
                      "muted": {
                              "DEFAULT": "#4A4057",
                              "bg": "#EFEBF3",
                              "fg": "#4A4057"
                      }
              },
              "primary": "var(--ax-primary)",
              "on-primary": "var(--ax-on-primary)",
              "accent": "var(--ax-accent)",
              "on-accent": "var(--ax-on-accent)",
              "background": "var(--ax-background)",
              "surface": "var(--ax-surface)",
              "surface-alt": "var(--ax-surface-alt)",
              "text": "var(--ax-text)",
              "text-muted": "var(--ax-text-muted)",
              "border": "var(--ax-border)",
              "border-strong": "var(--ax-border-strong)",
              "link": "var(--ax-link)",
              "focus-ring": "var(--ax-focus-ring)",
              "success": "var(--ax-success)",
              "warning": "var(--ax-warning)",
              "error": "var(--ax-error)",
              "info": "var(--ax-info)"
      },
      fontFamily: { sans: ["IBM Plex Sans","IBM Plex Sans Arabic","Tahoma","Arial","sans-serif"], long: ["Noto Sans","Noto Naskh Arabic","Traditional Arabic","Times New Roman","serif"] },
      borderRadius: {"sm":"6px","md":"10px","lg":"14px","card":"16px","xl":"20px","icon":"9px","pill":"999px"},
      boxShadow: {"sm":"0 1px 2px rgba(21,11,34,.08)","md":"0 6px 18px rgba(58,31,93,.10)","lg":"0 18px 40px rgba(21,11,34,.18)"},
    },
  },
};
