import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const IN = path.join(ROOT, 'scripts', 'corpus.jsonl');
const OUT = path.join(ROOT, 'scripts', 'corpus_sanitized.jsonl');

function sanitize(text) {
  // remove emails
  let s = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  // remove phone numbers (simple)
  s = s.replace(/\+?\d[\d\s().-]{6,}\d/g, '[PHONE]');
  // remove long base64/private keys
  s = s.replace(/-----BEGIN[\s\S]*?-----END [\s\S]*?-----/g, '[REDACTED_KEY]');
  // collapse whitespace
  s = s.replace(/\s+/g,' ').trim();
  return s;
}

function main() {
  if (!fs.existsSync(IN)) {
    console.error('Input corpus not found:', IN);
    process.exit(1);
  }

  const lines = fs.readFileSync(IN, 'utf8').split(/\r?\n/).filter(Boolean);
  const fd = fs.openSync(OUT, 'w');
  let n = 0;
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const t = sanitize(obj.text || '');
      if (!t) continue;
      const out = { path: obj.path, text: t };
      fs.writeSync(fd, JSON.stringify(out) + '\n');
      n++;
    } catch (err) {
      continue;
    }
  }
  fs.closeSync(fd);
  console.log(`Wrote ${n} sanitized corpus entries to ${OUT}`);
}

main();
