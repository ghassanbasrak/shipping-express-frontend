const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const kit = path.join(__dirname, '../Ashamco-Express-Dev-Handoff-v1.0.0(1)/Ashamco-Express-Dev-Handoff');
const tokens = JSON.parse(fs.readFileSync(path.join(kit, 'shared/tokens.json'), 'utf8'));
const semantic = tokens.color.semantic;
const cssFiles = [path.join(kit, 'web/src/brand/tokens.css'), path.join(__dirname, '../src/brand/tokens.css')];
const typescriptFiles = [path.join(kit, 'web/src/brand/tokens.ts'), path.join(__dirname, '../src/brand/tokens.ts')];
for (const file of typescriptFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(source.split('export const tokens = ')[1].split(' as const;')[0]);
  const { '$schema-note': _, ...master } = tokens;
  assert.deepEqual(parsed, master, `${file} differs from shared/tokens.json`);
}
for (const file of cssFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const light = source.split('[data-theme="dark"]')[0];
  const dark = source.split('[data-theme="dark"]')[1].split('@media')[0];
  for (const [key, value] of Object.entries(semantic.light)) {
    const cssKey = '--ax-' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
    assert(light.includes(`${cssKey}: ${value};`), `${file}: light ${key} differs from master`);
  }
  for (const [key, value] of Object.entries(semantic.dark)) {
    const cssKey = '--ax-' + key.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase());
    assert(dark.includes(`${cssKey}: ${value};`), `${file}: dark ${key} differs from master`);
  }
}
console.log('Brand token copies match shared/tokens.json');
