import fs from 'fs';
import path from 'path';

let INDEX = null;

function loadIndex() {
  if (INDEX) return INDEX;
  const p = path.resolve(process.cwd(), 'scripts', 'tfidf_index.json');
  if (!fs.existsSync(p)) throw new Error('TF-IDF index not found. Run npm run build:tfidf');
  INDEX = JSON.parse(fs.readFileSync(p, 'utf8'));
  return INDEX;
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9ạáàảãâấầẩẫăắằẳẵèéẹẻẽêếềểễìíịỉĩòóọỏõôốồổỗơớờởỡùúụủũưứừửữỳýỵỷỹđ]+/i)
    .filter(Boolean);
}

export function retrieve(query, topK = 3) {
  const idx = loadIndex();
  const qTokens = tokenize(query);
  const qtf = Object.create(null);
  qTokens.forEach(t => qtf[t] = (qtf[t]||0)+1);

  const vec = Object.create(null);
  let norm = 0;
  for (const [t, cnt] of Object.entries(qtf)) {
    const idf = idx.idf[t] || 0;
    const v = Number(cnt) * idf;
    vec[t] = v; norm += v*v;
  }
  norm = Math.sqrt(norm) || 1;
  for (const t of Object.keys(vec)) vec[t] = vec[t]/norm;

  const scores = [];
  for (const d of idx.docs) {
    // dot product sparse
    let s = 0;
    for (const [t, qv] of Object.entries(vec)) {
      const dv = d.vec[t];
      if (dv) s += qv * dv;
    }
    scores.push({ id: d.id, score: s, text: d.text, path: d.path });
  }

  scores.sort((a,b) => b.score - a.score);
  return scores.slice(0, topK).filter(s=>s.score>0);
}

export function indexExists() {
  const p = path.resolve(process.cwd(), 'scripts', 'tfidf_index.json');
  return fs.existsSync(p);
}
