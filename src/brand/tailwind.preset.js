/**
 * Tailwind CSS v3 preset.  tailwind.config.js:  presets: [require('./src/brand/tailwind.preset.js')]
 * Requires src/brand/tokens.css to be imported (semantic colours read its --ax-* variables).
 * Classes: bg-brand-purple, bg-brand-purple-100, text-brand-muted, border-brand-line, bg-primary, text-on-primary, bg-surface-alt ...
 * Dark mode: data-theme="dark" on <html> (or OS preference via tokens.css).
 */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        "brand": {
          "purple": {
            "50": "#F4F1F8",
            "100": "#E7DEF2",
            "200": "#D1C2E5",
            "300": "#B49CD3",
            "400": "#9474BE",
            "500": "#744CA9",
            "600": "#573384",
            "700": "#3A1F5D",
            "800": "#2D174A",
            "900": "#211037",
            "950": "#150A24",
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
          "ink": "#1E1030",
          "muted": "#6E6880",
          "line": "#E4E0EC"
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
        "link": "var(--ax-link)",
        "focus-ring": "var(--ax-focus-ring)",
        "success": "var(--ax-success)",
        "warning": "var(--ax-warning)",
        "error": "var(--ax-error)",
        "info": "var(--ax-info)"
      },
      fontFamily: { sans: ['IBM Plex Sans Arabic', 'Tahoma', 'Arial', 'sans-serif'], naskh: ['Noto Naskh Arabic', 'Traditional Arabic', 'serif'] },
      borderRadius: {"sm": "6px", "md": "10px", "lg": "14px", "xl": "20px", "pill": "999px"},
      boxShadow: {"sm": "0 1px 2px rgba(30,16,48,.08)", "md": "0 6px 18px rgba(58,31,93,.10)", "lg": "0 18px 40px rgba(30,16,48,.18)"},
    },
  },
};
