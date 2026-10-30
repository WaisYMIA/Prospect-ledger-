#!/usr/bin/env node
// Builds BOTH release packages for the current version:
//   dist/prospect-ledger-github-vX.Y.Z.zip   -> push to GitHub / GitHub Pages
//   dist/prospect-ledger-cpanel-vX.Y.Z.zip   -> upload to cPanel public_html (server edition)
// Usage:  node tools/build-release.js        (run after: node tools/bump-version.js X.Y.Z "note")
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const ver = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;
const dist = path.join(root, 'dist'); fs.mkdirSync(dist, { recursive: true });

const crcT = (()=>{ const t = []; for(let n=0;n<256;n++){ let c = n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320^(c>>>1) : c>>>1; t[n] = c>>>0; } return t; })();
const crc32 = (b)=>{ let c = -1; for(let i=0;i<b.length;i++) c = crcT[(c^b[i])&255]^(c>>>8); return (c^-1)>>>0; };
function zip(files, out){            // files: [{name, data:Buffer}]
  const parts = [], central = []; let off = 0;
  for(const f of files){
    const name = Buffer.from(f.name.replace(/\\/g,'/')), raw = f.data, def = zlib.deflateRawSync(raw), useDef = def.length < raw.length, data = useDef ? def : raw, crc = crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50,0); lh.writeUInt16LE(20,4); lh.writeUInt16LE(0x0800,6); lh.writeUInt16LE(useDef?8:0,8); lh.writeUInt16LE(0,10); lh.writeUInt16LE(0x21,12); lh.writeUInt32LE(crc,14); lh.writeUInt32LE(data.length,18); lh.writeUInt32LE(raw.length,22); lh.writeUInt16LE(name.length,26);
    parts.push(lh, name, data);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50,0); ch.writeUInt16LE(20,4); ch.writeUInt16LE(20,6); ch.writeUInt16LE(0x0800,8); ch.writeUInt16LE(useDef?8:0,10); ch.writeUInt16LE(0,12); ch.writeUInt16LE(0x21,14); ch.writeUInt32LE(crc,16); ch.writeUInt32LE(data.length,20); ch.writeUInt32LE(raw.length,24); ch.writeUInt16LE(name.length,28); ch.writeUInt32LE(off,42);
    central.push(ch, name); off += 30 + name.length + data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(files.length,8); end.writeUInt16LE(files.length,10); end.writeUInt32LE(cd.length,12); end.writeUInt32LE(off,16);
  fs.writeFileSync(out, Buffer.concat([...parts, cd, end]));
  return crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex');
}
function walk(dir, rel = ''){
  let out = [];
  for(const e of fs.readdirSync(path.join(dir, rel), { withFileTypes:true })){
    const r = rel ? rel+'/'+e.name : e.name;
    if(e.isDirectory()) out = out.concat(walk(dir, r)); else out.push(r);
  }
  return out;
}
const rd = (r)=>fs.readFileSync(path.join(root, r));
const skipRepo = (r)=>/^(dist|node_modules|\.git)\//.test(r) || /\.zip$/.test(r) || /\.(pem|key)$/.test(r) || /^SELLER-ONLY/.test(r) || r==='api/config.php' || (/^api\/data\//.test(r) && r!=='api/data/.htaccess') || r.endsWith('.DS_Store');

// ---------- GitHub package ----------
const gh = walk(root).filter(r=>!skipRepo(r)).map(r=>({ name:'prospect-ledger/'+r, data:rd(r) }));
const ghFile = path.join(dist, `prospect-ledger-github-v${ver}.zip`), ghHash = zip(gh, ghFile);

// ---------- cPanel package ----------
const appFiles = ['index.html','app.css','app.js','reportkit.js','theme.js','sw.js','manifest.json','version.json'];
let cp = [];
for(const f of appFiles){
  let data = rd(f);
  if(f==='app.js'){
    let t = data.toString('utf8'); const before = t;
    t = t.replace("licenseServer: '',","licenseServer: './api/license.php',").replace("teamServer: '',","teamServer: './api',").replace("billingServer: '',","billingServer: './api/billing.php',");
    if(t===before || !t.includes("teamServer: './api'") || !t.includes("billingServer: './api/billing.php'")) throw new Error('Could not enable server features in app.js — check the SAAS block');
    data = Buffer.from(t, 'utf8');
  }
  cp.push({ name:f, data });
}
walk(root,'icons').forEach(r=>cp.push({ name:r, data:rd(r) }));
walk(root,'team').forEach(r=>cp.push({ name:r, data:rd(r) }));
walk(root,'api').filter(r=>!skipRepo('api/'+r.replace(/^api\//,'')) && r!=='api/config.php').forEach(r=>cp.push({ name:r, data:rd(r) }));
cp.push({ name:'.htaccess', data:rd('deploy/cpanel/.htaccess') });
cp.push({ name:'INSTALL-CPANEL.txt', data:Buffer.from(rd('deploy/cpanel/INSTALL-CPANEL.txt').toString('utf8').replace(/\{\{VERSION\}\}/g, ver)) });
cp.push({ name:'SECURITY_GUIDE.md', data:rd('SECURITY_GUIDE.md') });
cp.push({ name:'TESTING.md', data:rd('TESTING.md') });
const cpFile = path.join(dist, `prospect-ledger-cpanel-v${ver}.zip`), cpHash = zip(cp, cpFile);

const note = `Prospect Ledger v${ver}\n\n${path.basename(ghFile)}\n  sha256 ${ghHash}\n  ${gh.length} files\n\n${path.basename(cpFile)}\n  sha256 ${cpHash}\n  ${cp.length} files\n`;
fs.writeFileSync(path.join(dist, `RELEASE-v${ver}.txt`), note);
console.log(note);
