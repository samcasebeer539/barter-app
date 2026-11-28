// Writes the Terms and Privacy Policy from config/legal.json (the text the
// app shows in Settings) to docs/terms.md and docs/privacy.md, for hosting
// at a public web address (Apple asks for the Privacy Policy's URL).
// Run: npm run legal:export   (tests check the docs are up to date with
// --check, which changes nothing and fails if a file is out of date)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const legal = JSON.parse(readFileSync(new URL('config/legal.json', root), 'utf8'));

export function toMarkdown(title, sections) {
  const contact = legal.supportEmail ? `\n\nContact: ${legal.supportEmail}` : '';
  return [
    `# Win-Win ${title}`,
    '',
    `Effective ${legal.effectiveDate}`,
    '',
    ...sections.flatMap(s => [`## ${s.heading}`, '', s.body, '']),
  ].join('\n').trimEnd() + contact + '\n';
}

export const outputs = {
  'docs/terms.md': toMarkdown('Terms and Conditions', legal.terms),
  'docs/privacy.md': toMarkdown('Privacy Policy', legal.privacy),
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let stale = false;
  for (const [path, text] of Object.entries(outputs)) {
    if (check) {
      let current = '';
      try { current = readFileSync(new URL(path, root), 'utf8'); } catch {}
      if (current !== text) { stale = true; console.error(`${path} is out of date: run npm run legal:export`); }
    } else {
      writeFileSync(new URL(path, root), text);
      console.log(`wrote ${path}`);
    }
  }
  if (stale) process.exit(1);
}
