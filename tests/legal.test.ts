// The Terms and Privacy Policy: the hosted copies (docs/) match what the app
// shows, and the text covers what Apple and the app need.
// (No Node type definitions in this project, so these are declared loosely.)
declare const require: (id: string) => any;
declare const __dirname: string;
const { execFileSync } = require('child_process');
const { join } = require('path');
import legal from '@/config/legal.json';

test('docs/terms.md and docs/privacy.md match config/legal.json (run npm run legal:export)', () => {
  expect(() =>
    execFileSync('node', [join(__dirname, '..', 'scripts', 'export-legal.mjs'), '--check'], { stdio: 'pipe' }),
  ).not.toThrow();
});

test('the privacy policy says how to delete your account', () => {
  expect(JSON.stringify(legal.privacy)).toMatch(/Delete Account/);
});

test('every section has a heading and some text', () => {
  for (const s of [...legal.terms, ...legal.privacy]) {
    expect(s.heading.trim().length).toBeGreaterThan(0);
    expect(s.body.trim().length).toBeGreaterThan(20);
  }
});
