#!/usr/bin/env node
// Usage: node tools/bump-version.js 1.3.0 "Short release note"
// Updates version.json, sw.js, index.html and README.md in one go.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const [v, ...noteParts] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(v || '')) { console.error('Usage: node tools/bump-version.js X.Y.Z "release note"'); process.exit(1); }
const note = noteParts.join(' ').trim();
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(root, f), s);
const sub = (f, re, to) => { const s = rd(f); if (!re.test(s)) throw new Error('Pattern not found in ' + f); wr(f, s.replace(re, to)); };
const today = new Date().toISOString().slice(0, 10);

const j = JSON.parse(rd('version.json'));
j.version = v; j.released = today;
if (note) j.notes = [note];
wr('version.json', JSON.stringify(j, null, 2) + '\n');
sub('sw.js', /const VERSION = '[^']+';/, `const VERSION = '${v}';`);
sub('app.js', /const APP_VERSION = '[^']+';/, `const APP_VERSION = '${v}';`);
if (fs.existsSync(path.join(root,'package.json'))) sub('package.json', /"version": "[^"]+"/, `"version": "${v}"`);
sub('README.md', /\*\*Current version: [^*]+\*\*/, `**Current version: ${v}**`);
console.log(`Bumped to ${v} (${today}). Zip the folder as prospect-ledger-repo-v${v}.zip and deploy.`);
