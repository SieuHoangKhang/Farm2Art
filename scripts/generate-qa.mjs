import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq+1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1,-1);
    if (!process.env[key]) process.env[key] = val;
  }
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`;
  const body = { prompt: { text: prompt }, temperature: 0.2, maxOutputTokens: 512 };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const candidates = data?.candidates || data?.outputs || null;
  if (Array.isArray(candidates) && candidates.length) {
    const first = candidates[0];
    if (first?.content && Array.isArray(first.content)) {
      for (const c of first.content) {
        if (typeof c?.text === 'string') return c.text.trim();
        if (typeof c === 'string') return c.trim();
      }
    }
    if (typeof first?.outputText === 'string') return first.outputText.trim();
    if (typeof first?.text === 'string') return first.text.trim();
  }
  if (typeof data?.output === 'string') return data.output.trim();
  return null;
}

function sampleLines(lines, n) {
  const out = [];
  const total = lines.length;
  const step = Math.max(1, Math.floor(total / n));
  for (let i=0;i<total && out.length<n;i+=step) out.push(lines[i]);
  return out;
}

async function run() {
  loadEnvLocal();
  const inPath = path.resolve(process.cwd(), 'scripts', 'corpus_sanitized.jsonl');
  if (!fs.existsSync(inPath)) { console.error('Missing corpus_sanitized.jsonl'); process.exit(1); }
  const lines = fs.readFileSync(inPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const count = Number(process.argv[2] || 100);
  const sampled = sampleLines(lines, Math.min(count, lines.length));
  const outPath = path.resolve(process.cwd(), 'scripts', 'qa_finetune.jsonl');
  const fd = fs.openSync(outPath, 'w');
  let made = 0;

  for (const l of sampled) {
    const obj = JSON.parse(l);
    const text = obj.text || '';
    const prompt = `Từ đoạn nội dung sau bằng tiếng Việt, hãy tạo 1 câu hỏi ngắn (User) mà người dùng có thể hỏi và 1 câu trả lời ngắn gọn, lịch sự (Assistant). Trả về duy nhất định dạng JSON: {"question":"...","answer":"..."}.\n\nNguồn:\n"${text}"`;
    try {
      const resp = await callGemini(prompt);
      if (!resp) continue;
      // Try to parse JSON from resp
      let parsed = null;
      try { parsed = JSON.parse(resp); } catch (e) {
        // try to extract JSON substring
        const m = resp.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }
      if (!parsed || !parsed.question || !parsed.answer) continue;
      const record = { prompt: `User: ${parsed.question}\nAssistant:`, completion: ` ${parsed.answer}\n` };
      fs.writeSync(fd, JSON.stringify(record) + '\n');
      made += 1;
    } catch (err) {
      console.error('Gemini error, skipping:', err.message);
      continue;
    }
  }
  fs.closeSync(fd);
  console.log(`Wrote ${made} QA examples to ${outPath}`);
}

run().catch(err => { console.error(err); process.exit(1); });
