import fs from 'fs';
import path from 'path';

const IN = path.resolve(process.cwd(), 'scripts', 'corpus_sanitized.jsonl');
const OUT = path.resolve(process.cwd(), 'scripts', 'tfidf_index.json');

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9ạáàảãâấầẩẫăắằẳẵèéẹẻẽêếềểễìíịỉĩòóọỏõôốồổỗơớờởỡùúụủũưứừửữỳýỵỷỹđ]+/i)
    .filter(Boolean);
}

function build() {
  if (!fs.existsSync(IN)) {
    console.error('Input corpus missing:', IN);
    process.exit(1);
  }

  const lines = fs.readFileSync(IN, 'utf8').split(/\r?\n/).filter(Boolean);
  const docs = [];
  const df = Object.create(null);

  for (let i = 0; i < lines.length; i++) {
    const obj = JSON.parse(lines[i]);
    const text = (obj.text || '').trim();
    const tokens = tokenize(text);
    const tf = Object.create(null);
    tokens.forEach(t => { tf[t] = (tf[t]||0)+1; });
    Object.keys(tf).forEach(t => { df[t] = (df[t]||0)+1; });
    docs.push({ id: i, path: obj.path, text, tf });
  }

  const N = docs.length;
  const idf = Object.create(null);
  Object.keys(df).forEach(t => { idf[t] = Math.log(1 + N / df[t]); });

  // compute tf-idf vectors (sparse)
  for (const d of docs) {
    const vec = Object.create(null);
    let norm = 0;
    for (const [t, cnt] of Object.entries(d.tf)) {
      const v = Number(cnt) * (idf[t] || 0);
      vec[t] = v;
      norm += v * v;
    }
    norm = Math.sqrt(norm) || 1;
    // normalize
    for (const t of Object.keys(vec)) vec[t] = vec[t] / norm;
    d.vec = vec;
    delete d.tf;
  }

  const out = { docs, idf };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`Built TF-IDF index with ${N} docs -> ${OUT}`);
}

build();
