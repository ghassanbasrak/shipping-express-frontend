/* Rebuilds the generated brand files in src/brand from src/brand/tokens.json (the master).
   Usage: npm run brand:generate   (then npm run test:brand-tokens) */
const fs = require('node:fs');
const path = require('node:path');

const dir = path.join(__dirname, '../src/brand');
const tokens = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'));
const { '$schema-note': _note, ...master } = tokens;
const c = tokens.color;
const kebab = (s) => s.replace(/[A-Z]/g, (l) => '-' + l.toLowerCase());
const write = (name, body) => fs.writeFileSync(path.join(dir, name), body);
const semanticVars = (set, indent = '  ') =>
  Object.entries(set).map(([k, v]) => `${indent}--ax-${kebab(k)}: ${v};`).join('\n');
const scale = (prefix, obj) => Object.entries(obj).map(([k, v]) => `  --${prefix}-${k}: ${v};`).join('\n');

/* ---------- tokens.ts ---------- */
write(
  'tokens.ts',
  `/* Generated from src/brand/tokens.json - do not edit by hand (npm run brand:generate) */\nexport const tokens = ${JSON.stringify(master, null, 2)} as const;\nexport type Tokens = typeof tokens;\n`
);

/* ---------- tokens.css ---------- */
const type = Object.entries(tokens.type)
  .map(([k, v]) => `  --text-${k}: ${v.size}px;\n  --leading-${k}: ${v.lineHeight}px;\n  --weight-${k}: ${v.weight};`)
  .join('\n');
const tones = Object.entries(c.tone)
  .map(([k, v]) => `  --ax-tone-${k}-bg: ${v.bg};\n  --ax-tone-${k}-fg: ${v.fg};`)
  .join('\n');
const darkBlock = semanticVars(c.semantic.dark, '    ');
write(
  'tokens.css',
  `/* Ashamco Express design tokens v${tokens.meta.version} (${tokens.meta.date}). Generated from src/brand/tokens.json - do not edit by hand (npm run brand:generate).
   Fonts are loaded by the <link> in index.html (not imported here). */

:root {
  color-scheme: light;
  /* brand */
  --brand-purple: ${c.brand.purple};
  --brand-mint: ${c.brand.mint};
  --brand-white: ${c.brand.white};
  /* scales */
${scale('purple', c.purple)}
${scale('mint', c.mint)}
  --ink: ${c.neutral.ink};
  --gray: ${c.neutral.gray};
  --border: ${c.neutral.border};
  /* semantic (light) */
${semanticVars(c.semantic.light)}
  /* status tones: soft pills (tinted background, dark text) */
${tones}
  /* type */
  --font-sans: ${tokens.font.stack.sans};
  --font-long: ${tokens.font.stack.long};
${type}
  /* space, radius, shadow, motion */
${Object.entries(tokens.space).map(([k, v]) => `  --space-${k}: ${v}px;`).join('\n')}
${Object.entries(tokens.radius).map(([k, v]) => `  --radius-${k}: ${v}px;`).join('\n')}
${Object.entries(tokens.shadow).map(([k, v]) => `  --shadow-${k}: ${v};`).join('\n')}
  --touch-target: ${tokens.size.touchTarget}px;
  --motion-fast: ${tokens.motion.fast};
  --motion-base: ${tokens.motion.base};
  --motion-slow: ${tokens.motion.slow};
  --easing: ${tokens.motion.easing};
}

/* dark mode: add data-theme="dark" on <html> */
[data-theme="dark"] {
  color-scheme: dark;
${semanticVars(c.semantic.dark)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${darkBlock}
  }
}

/* base */
html { font-family: var(--font-sans); color: var(--ax-text); background: var(--ax-background); }
body { font-size: var(--text-body); line-height: var(--leading-body); }
.font-long, .long-text, .letter { font-family: var(--font-long); line-height: 1.9; }
.num, input[type=number], .tabular, .amount { font-variant-numeric: tabular-nums lining-nums; }
:focus-visible { outline: 3px solid var(--ax-focus-ring); outline-offset: 2px; }
::selection { background: var(--purple-100); color: var(--purple-900); }
`
);

/* ---------- tailwind presets ---------- */
const semanticKeys = Object.keys(c.semantic.light);
const semanticColors = {};
for (const k of semanticKeys) semanticColors[kebab(k)] = `var(--ax-${kebab(k)})`;
semanticColors['focus-ring'] = 'var(--ax-focus-ring)';
const statusTone = {};
for (const [k, v] of Object.entries(c.tone)) statusTone[k] = { DEFAULT: v.fg, bg: v.bg, fg: v.fg };
const presetBody = (darkMode) => `/**
 * Tailwind CSS v3 preset (generated from src/brand/tokens.json - npm run brand:generate).
 * Requires src/brand/tokens.css (semantic colours read its --ax-* variables).
 * Classes: bg-brand-purple-700, text-brand-muted, border-brand-line, bg-surface-alt, bg-status-success-bg text-status-success-fg ...
 */
module.exports = {
  darkMode: ${darkMode},
  theme: {
    extend: {
      colors: ${JSON.stringify(
        {
          brand: {
            purple: { ...c.purple, DEFAULT: c.brand.purple },
            mint: { ...c.mint, DEFAULT: c.brand.mint },
            ink: c.neutral.ink,
            muted: c.neutral.gray,
            line: c.neutral.border,
          },
          'status': statusTone,
          ...semanticColors,
        },
        null,
        8
      ).replace(/\n/g, '\n      ')},
      fontFamily: { sans: ${JSON.stringify(tokens.font.stack.sans.replace(/'/g, '').split(/,\s*/))}, long: ${JSON.stringify(tokens.font.stack.long.replace(/'/g, '').split(/,\s*/))} },
      borderRadius: ${JSON.stringify(Object.fromEntries(Object.entries(tokens.radius).map(([k, v]) => [k, v + 'px'])))},
      boxShadow: ${JSON.stringify(tokens.shadow)},
    },
  },
};
`;
write('tailwind.preset.cjs', presetBody(`['class', '[data-theme="dark"]']`));
write('tailwind.preset.js', presetBody(`['selector', '[data-theme="dark"]']`));

/* ---------- tailwind.v4.css ---------- */
write(
  'tailwind.v4.css',
  `/* Tailwind CSS v4 (generated from src/brand/tokens.json - npm run brand:generate).
   In your main CSS:
     @import 'tailwindcss';
     @import './brand/tokens.css';
     @import './brand/tailwind.v4.css'; */

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme {
  --color-brand-purple: ${c.brand.purple};
  --color-brand-mint: ${c.brand.mint};
${Object.entries(c.purple).map(([k, v]) => `  --color-brand-purple-${k}: ${v};`).join('\n')}
${Object.entries(c.mint).map(([k, v]) => `  --color-brand-mint-${k}: ${v};`).join('\n')}
  --color-brand-ink: ${c.neutral.ink};
  --color-brand-muted: ${c.neutral.gray};
  --color-brand-line: ${c.neutral.border};
${Object.entries(c.tone).map(([k, v]) => `  --color-status-${k}-bg: ${v.bg};\n  --color-status-${k}-fg: ${v.fg};`).join('\n')}
  --font-sans: ${tokens.font.stack.sans};
  --font-long: ${tokens.font.stack.long};
${Object.entries(tokens.radius).map(([k, v]) => `  --radius-brand-${k}: ${v}px;`).join('\n')}
}

/* semantic colours follow light/dark through tokens.css */
@theme inline {
${semanticKeys.map((k) => `  --color-${kebab(k)}: var(--ax-${kebab(k)});`).join('\n')}
}
`
);
console.log('Brand files generated from src/brand/tokens.json');
