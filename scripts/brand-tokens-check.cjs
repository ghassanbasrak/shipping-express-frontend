const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const brand = path.join(__dirname, '../src/brand');
const read = (name) => fs.readFileSync(path.join(brand, name), 'utf8');
const tokens = JSON.parse(read('tokens.json'));
const { '$schema-note': _, ...master } = tokens;
const kebab = (s) => s.replace(/[A-Z]/g, (l) => '-' + l.toLowerCase());

// tokens.ts mirrors the master
const ts = read('tokens.ts');
const parsed = JSON.parse(ts.split('export const tokens = ')[1].split(' as const;')[0]);
assert.deepEqual(parsed, master, 'src/brand/tokens.ts differs from tokens.json (run npm run brand:generate)');

// tokens.css carries every semantic value, scale step and tone
const css = read('tokens.css');
const light = css.split('[data-theme="dark"]')[0];
const dark = css.split('[data-theme="dark"]')[1].split('@media')[0];
for (const [key, value] of Object.entries(tokens.color.semantic.light)) {
  assert(light.includes(`--ax-${kebab(key)}: ${value};`), `tokens.css: light ${key} differs from master`);
}
for (const [key, value] of Object.entries(tokens.color.semantic.dark)) {
  assert(dark.includes(`--ax-${kebab(key)}: ${value};`), `tokens.css: dark ${key} differs from master`);
}
for (const [step, value] of Object.entries(tokens.color.purple)) {
  assert(light.includes(`--purple-${step}: ${value};`), `tokens.css: purple-${step} differs from master`);
}
for (const [name, tone] of Object.entries(tokens.color.tone)) {
  assert(light.includes(`--ax-tone-${name}-bg: ${tone.bg};`) && light.includes(`--ax-tone-${name}-fg: ${tone.fg};`), `tokens.css: tone ${name} differs`);
}
assert(light.includes(`--font-sans: ${tokens.font.stack.sans};`), 'tokens.css: font stack differs from master');

// Tailwind outputs carry the same scale and tones
const cjs = read('tailwind.preset.cjs');
const v4 = read('tailwind.v4.css');
for (const [step, value] of Object.entries(tokens.color.purple)) {
  assert(cjs.includes(`"${step}": "${value}"`), `tailwind.preset.cjs: purple-${step} differs`);
  assert(v4.includes(`--color-brand-purple-${step}: ${value};`), `tailwind.v4.css: purple-${step} differs`);
}
for (const [name, tone] of Object.entries(tokens.color.tone)) {
  assert(cjs.includes(tone.bg) && cjs.includes(tone.fg), `tailwind.preset.cjs: tone ${name} differs`);
}

// Documented contrast pairs stay >= 4.5:1 (except the explicit "do not use for text" entry)
for (const [pair, ratio] of Object.entries(tokens.contrast)) {
  if (pair.includes('do not use for text')) continue;
  assert(ratio >= 4.5, `contrast "${pair}" is ${ratio}:1 (< 4.5:1)`);
}
console.log('Brand token copies match src/brand/tokens.json');
