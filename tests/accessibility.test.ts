// Every button that shows only an icon needs words for screen readers
// (VoiceOver / TalkBack). A button with visible <Text> is read out already.
declare const require: (id: string) => any;
declare const __dirname: string;
const { readFileSync, readdirSync, statSync } = require('fs');
const { join, relative } = require('path');

const root = join(__dirname, '..');

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return tsxFiles(p);
    return p.endsWith('.tsx') ? [p] : [];
  });
}

function unlabeledIconButtons(source: string): number[] {
  const lines: number[] = [];
  const open = '<TouchableOpacity';
  for (let i = source.indexOf(open); i !== -1; i = source.indexOf(open, i + 1)) {
    // Walk to the end of the opening tag, skipping anything inside { }.
    let j = i + open.length, depth = 0;
    for (; j < source.length; j++) {
      const c = source[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    const attrs = source.slice(i, j);
    const selfClosing = attrs.endsWith('/');
    const close = source.indexOf('</TouchableOpacity>', j);
    const body = selfClosing || close === -1 ? '' : source.slice(j + 1, close);
    if (/accessibilityLabel|accessible=\{false\}/.test(attrs)) continue;
    // Visible text is read out; a text field speaks for itself.
    if (/<(Text|TextInput)\b/.test(body)) continue;
    lines.push(source.slice(0, i).split('\n').length);
  }
  return lines;
}

test('icon-only buttons all have an accessibilityLabel', () => {
  const missing = [...tsxFiles(join(root, 'app')), ...tsxFiles(join(root, 'components'))]
    .flatMap(f => unlabeledIconButtons(readFileSync(f, 'utf8')).map(l => `${relative(root, f)}:${l}`));
  expect(missing).toEqual([]);
});

test('the check itself catches a bare icon button', () => {
  expect(unlabeledIconButtons('<TouchableOpacity onPress={go}>\n<Icon name="x" /></TouchableOpacity>')).toEqual([1]);
  expect(unlabeledIconButtons('<TouchableOpacity onPress={() => go()} />')).toEqual([1]);
  expect(unlabeledIconButtons('<TouchableOpacity accessibilityLabel="Close" onPress={go}><Icon /></TouchableOpacity>')).toEqual([]);
  expect(unlabeledIconButtons('<TouchableOpacity onPress={go}><Text>OK</Text></TouchableOpacity>')).toEqual([]);
  expect(unlabeledIconButtons('<TouchableOpacity activeOpacity={n > 1 ? 0.8 : 1} onPress={() => go()}><Icon /></TouchableOpacity>')).toEqual([1]);
});
