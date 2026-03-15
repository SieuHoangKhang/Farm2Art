import fs from 'fs';
import path from 'path';

const IN = path.resolve(process.cwd(), 'scripts', 'corpus_sanitized.jsonl');
const OUT = path.resolve(process.cwd(), 'scripts', 'qa_finetune.jsonl');
const LIMIT = Number(process.argv[2] || 1000);

if (!fs.existsSync(IN)) {
  console.error('Missing', IN);
  process.exit(1);
}

const lines = fs.readFileSync(IN, 'utf8').split(/\r?\n/).filter(Boolean);
const fd = fs.openSync(OUT, 'w');
let n = 0;

for (const l of lines) {
  if (n >= LIMIT) break;
  try {
    const obj = JSON.parse(l);
    let text = (obj.text || '').trim();
    if (!text) continue;
    // build a short question from first 12 words
    const words = text.split(/\s+/).filter(Boolean);
    const qWords = words.slice(0, 12).join(' ');
    const question = qWords + (qWords.endsWith('?') ? '' : '?');
    const answer = text.length > 300 ? text.slice(0, 300).trim() + '...' : text;
    const record = { prompt: `User: ${question}\nAssistant:`, completion: ` ${answer}\n` };
    fs.writeSync(fd, JSON.stringify(record) + '\n');
    n += 1;
  } catch (err) {
    continue;
  }
}

fs.closeSync(fd);
console.log(`Wrote ${n} local QA examples to ${OUT}`);
