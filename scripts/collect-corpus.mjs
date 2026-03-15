import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const OUT = path.join(ROOT, 'scripts', 'corpus.jsonl');
const IGNORE = new Set(['.git', 'node_modules', '.next', 'build', 'dist', 'scripts']);

function isTextFile(file) {
  return /\.(md|markdown|txt|ts|tsx|js|jsx|json)$/i.test(file);
}

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

function extractStringsFromCode(src) {
  const results = [];
  const regex = /(?:'([^'\\]*(?:\\.[^'\\]*)*)'|\"([^\\\"]*(?:\\.[^\\\"]*)*)\"|`([^`]*)`)/g;
  let m;
  while ((m = regex.exec(src))) {
    const s = (m[1] || m[2] || m[3] || '').trim();
    if (s.length >= 20 && s.length <= 1000) results.push(s);
  }
  return results;
}

function chunkText(text, max=800) {
  const paragraphs = text.split(/\n\n+/).map(p=>p.trim()).filter(Boolean);
  const out = [];
  for (const p of paragraphs) {
    if (p.length <= max) out.push(p);
    else {
      for (let i=0;i<p.length;i+=max) out.push(p.slice(i,i+max));
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(path.join(ROOT, 'scripts'))) fs.mkdirSync(path.join(ROOT, 'scripts'));
  const fd = fs.openSync(OUT, 'w');
  let count = 0;

  walk(ROOT, (file) => {
    if (!isTextFile(file)) return;
    // skip env and lockfiles
    if (/\.env|package-lock.json|pnpm-lock.yaml|yarn.lock/i.test(file)) return;

    try {
      const src = fs.readFileSync(file, 'utf8');
      let chunks = [];
      if (/\.(md|markdown|txt)$/i.test(file)) {
        chunks = chunkText(src.replace(/\r/g,''));
      } else {
        // code file: extract string literals
        const strs = extractStringsFromCode(src);
        chunks = strs.map(s => s.replace(/\\n/g,' ').replace(/\s+/g,' ').trim());
      }

      for (const c of chunks) {
        const rec = { path: path.relative(ROOT, file), text: c };
        fs.writeSync(fd, JSON.stringify(rec) + '\n');
        count++;
      }
    } catch (err) {
      // ignore
    }
  });

  fs.closeSync(fd);
  console.log(`Wrote ${count} corpus entries to ${OUT}`);
}

main();
